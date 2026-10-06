import { useEffect, useRef } from 'react';
import Hls from 'hls.js/dist/hls.light.mjs';

// A dropped connection is recoverable — hls.js can restart the load, and a media
// decode error can be recovered by swapping the decoder. Only a failure that keeps
// coming back becomes a real error state in the UI (SRS §10 "Recover from transient
// network errors" / "Show error states").
const MAX_RECOVERIES = 3;

// Attaches a video source (HLS adaptive / MP4 / optional separate audio file) to a
// <video> element, resuming at `startAt` seconds, and hands the hls.js instance back
// through `onHls` so the player can offer REAL quality/audio/subtitle switching.
// `retryKey` re-attaches the same source from `startAt` (used by "Try again").
// `onStatus` reports { state: 'recovering' | 'error', attempt?, reason? }.
export function usePlayerSource(videoRef, video, startAt = 0, onHls, retryKey = 0, onStatus) {
  const hlsRef = useRef(null);
  // Callbacks live in refs so re-renders never tear down and rebuild the media pipeline.
  const hlsCb = useRef(onHls);
  const statusCb = useRef(onStatus);
  hlsCb.current = onHls;
  statusCb.current = onStatus;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video || video.type === 'embed' || video.type === 'stremio') return;
    const { url, type } = video;
    let disposed = false;
    let recoveries = 0;
    let retryTimer = null;

    if (type === 'hls' || url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(el);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (disposed) return;
          if (startAt > 0) el.currentTime = startAt;
          el.play().catch(() => {});
          hlsCb.current?.(hls);
        });
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (disposed || !data?.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoveries < MAX_RECOVERIES) {
            recoveries += 1;
            statusCb.current?.({ state: 'recovering', attempt: recoveries });
            retryTimer = setTimeout(() => { if (!disposed) hls.startLoad(); }, 500 * recoveries);
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoveries < MAX_RECOVERIES) {
            recoveries += 1;
            statusCb.current?.({ state: 'recovering', attempt: recoveries });
            hls.recoverMediaError();
            return;
          }
          statusCb.current?.({ state: 'error', reason: data.details || 'The stream stopped unexpectedly.' });
        });
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        hlsRef.current = null;
        el.src = url; // Safari native HLS
        if (startAt > 0) el.currentTime = startAt;
        el.play().catch(() => {});
        hlsCb.current?.(null);
      }
    } else {
      hlsRef.current = null;
      el.src = url;
      if (startAt > 0) el.currentTime = startAt;
      el.play().catch(() => {});
      hlsCb.current?.(null);
    }

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [video, startAt, videoRef, retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return hlsRef;
}