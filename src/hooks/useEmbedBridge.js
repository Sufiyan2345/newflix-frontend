import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Which framed providers accept parent-side transport commands. Only providers
// that implement a documented command bridge (YouTube) can be driven from here.
const COMMAND_API_HOSTS = /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i;
// vidsrc.su and its mirrors DO broadcast real playback telemetry to the parent
// frame (type: "MEDIA_DATA" → { progress: { watched, duration } }). That is a
// one-way channel, so it gives us an accurate playhead for the bar and for
// Continue Watching, but it cannot be used to send a command back.
const TELEMETRY_HOSTS = /(^|\.)(vidsrc\.(su|to|xyz|me|pro|net|org|cc|io)|vidstreaming\.[a-z]+)$/i;

const hostOf = (url) => {
  try { return new URL(url).hostname; } catch { return ''; }
};

// Drives a framed provider player through the same interface the native <video>
// element exposes, so PlayerControls can render ONE Netflix bar for both source
// kinds instead of the two overlapping half-bars that broke the old layout.
export function useEmbedBridge(iframeRef, sourceUrl) {
  const host = hostOf(sourceUrl || '');
  const controllable = Boolean(host) && COMMAND_API_HOSTS.test(host);
  const telemetry = Boolean(host) && !controllable && TELEMETRY_HOSTS.test(host);

  const [state, setState] = useState({
    playing: true, muted: false, volume: 1, current: 0, duration: 0,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  // A new provider URL remounts the iframe — drop the previous episode's playhead
  // so the bar never shows stale time or mute state after an episode switch.
  useEffect(() => {
    setState({ playing: true, muted: false, volume: 1, current: 0, duration: 0 });
  }, [sourceUrl]);

  const post = useCallback((func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*',
    );
  }, [iframeRef]);

  useEffect(() => {
    if (!sourceUrl) return undefined;
    const onMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      // --- vidsrc-style one-way telemetry: real position + runtime ---
      const data = event.data;
      if (telemetry && data && typeof data === 'object' && data.type === 'MEDIA_DATA') {
        const progress = data.data?.progress;
        if (progress && typeof progress.duration === 'number' && progress.duration > 0) {
          setState((s) => ({
            ...s,
            duration: progress.duration,
            current: Math.min(progress.duration, Math.max(0, Number(progress.watched) || 0)),
          }));
        }
        return;
      }

      if (!controllable) return;
      let payload = data;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch { return; }
      }
      if (!payload || typeof payload !== 'object') return;
      if (payload.event === 'onReady') {
        setState((s) => (s.playing ? s : { ...s, playing: true }));
        return;
      }
      if (payload.event !== 'info' || !payload.info) return;
      const info = payload.info;
      setState((s) => ({
        ...s,
        current: typeof info.currentTime === 'number' ? info.currentTime : s.current,
        duration: typeof info.duration === 'number' ? info.duration : s.duration,
        // YouTube state codes: 0 = ended, 1 = playing, 2 = paused
        playing: info.event !== 2 && info.event !== 0,
      }));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [controllable, telemetry, iframeRef, sourceUrl]);

  const api = useMemo(() => ({
    controllable,
    telemetry,
    host,
    togglePlay: () => {
      const next = !stateRef.current.playing;
      post(next ? 'playVideo' : 'pauseVideo');
      setState((s) => ({ ...s, playing: next }));
    },
    skip: (delta) => {
      const next = Math.max(0, stateRef.current.current + delta);
      setState((s) => ({ ...s, current: next }));
      post('seekTo', [next, true]);
    },
    seekRatio: (ratio) => {
      const { duration } = stateRef.current;
      if (!duration) return;
      const next = Math.min(1, Math.max(0, ratio)) * duration;
      setState((s) => ({ ...s, current: next }));
      post('seekTo', [next, true]);
    },
    toggleMute: () => {
      const next = !stateRef.current.muted;
      post(next ? 'mute' : 'unMute');
      setState((s) => ({ ...s, muted: next, volume: next ? 0 : (s.volume || 1) }));
    },
    setVolume: (value) => {
      const next = Math.min(1, Math.max(0, Number(value)));
      setState((s) => ({ ...s, volume: next, muted: next === 0 }));
      post(next === 0 ? 'mute' : 'unMute');
      post('setVolume', [next]);
    },
  }), [controllable, telemetry, host, post]);

  return { ...state, ...api };
}

export default useEmbedBridge;