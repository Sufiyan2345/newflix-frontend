import { useEffect, useRef, useState } from 'react';
import {
  IconPlay, IconPause, IconBack10, IconFwd10, IconVolume, IconVolumeLow, IconMuted,
  IconSubtitle, IconAudio, IconSettings, IconFullscreen, IconExitFullscreen, IconEpisodes,
} from './Icons';
import PlayerSettings from './PlayerSettings';

const fmtTime = (s) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};

const VolumeGlyph = ({ muted, volume }) => {
  if (muted || volume === 0) return <IconMuted size={24} />;
  if (volume < 0.5) return <IconVolumeLow size={24} />;
  return <IconVolume size={24} />;
};

// The single Netflix transport bar.
//
// It renders ONLY when this app actually drives the media element (a native
// <video>, or a provider such as YouTube that accepts postMessage commands).
// A provider that owns its own transport (vidsrc.su and mirrors) already draws a
// complete control surface inside the frame, so drawing a second bar underneath
// it produced the stacked, mismatched UI. In that case we render no bar at all —
// the top chrome still exposes the season picker, episode drawer and settings.
export default function PlayerControls({
  visible, playing, muted, volume, progress, title, episode,
  embed = null,
  fullscreen, settingsTab, onSettingsTab, onSettingsClose,
  qualities, quality, onQuality,
  subtitles, subtitleIdx, onSubtitle,
  speeds, speed, onSpeed,
  audios, audioIdx, onAudio,
  autoPlayNext, onAutoPlayNext,
  hasEpisodes, episodesOpen, onToggleEpisodes,
  onTogglePlay, onSeekRatio, onToggleMute, onVolume, onBack10, onFwd10,
  onFullscreen,
}) {
  const isEmbed = Boolean(embed);
  const controllable = isEmbed ? embed.controllable : true;

  const cur = isEmbed ? embed.current : progress.cur;
  const dur = isEmbed ? embed.duration : progress.dur;
  const buffered = isEmbed ? 0 : progress.buffered;
  const isPlaying = isEmbed ? embed.playing : playing;
  const isMuted = isEmbed ? embed.muted : muted;
  const vol = isEmbed ? embed.volume : volume;
  const seek = isEmbed ? embed.seekRatio : onSeekRatio;
  const togglePlay = isEmbed ? embed.togglePlay : onTogglePlay;
  const back10 = isEmbed ? () => embed.skip(-10) : onBack10;
  const fwd10 = isEmbed ? () => embed.skip(10) : onFwd10;
  const toggleMute = isEmbed ? embed.toggleMute : onToggleMute;
  const setVolume = isEmbed ? embed.setVolume : onVolume;

  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
  const bufPct = dur > 0 && buffered ? Math.min(100, (buffered / dur) * 100) : 0;

  // ---- seek: click anywhere, or press-and-drag to scrub (Netflix behaviour) ----
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(null); // 0..1 while the pointer is over the track
  // Keep the callback in a ref so dragging never re-subscribes mid-scrub
  const seekCb = useRef(seek);
  seekCb.current = seek;

  const ratioAt = (clientX) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (e) => seekCb.current(ratioAt(e.clientX));
    const up = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragging]);

  const onTrackDown = (e) => {
    setDragging(true);
    setHover(ratioAt(e.clientX));
    seek(ratioAt(e.clientX));
  };

  const onTrackKey = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); seek(Math.max(0, pct / 100 - 0.02)); }
    if (e.key === 'ArrowRight') { e.preventDefault(); seek(Math.min(1, pct / 100 + 0.02)); }
    if (e.key === 'Home') { e.preventDefault(); seek(0); }
    if (e.key === 'End') { e.preventDefault(); seek(1); }
  };

  const hoverTime = hover != null && dur > 0 ? hover * dur : null;

  // A provider that owns its own transport (vidsrc.su and mirrors) already draws
  // a full seek bar + play/volume inside the frame. Rendering a second bar here is
  // what produced the doubled, mismatched control surface, so we stay out of the
  // way entirely and let the provider be the only transport. The settings sheet
  // still renders, because the top chrome exposes it for those sources.
  if (!controllable) {
    return (
      <div className="player-controls pc-anchor">
        <PlayerSettings
          tab={settingsTab}
          onTab={onSettingsTab} onClose={onSettingsClose}
          qualities={qualities} quality={quality} onQuality={onQuality}
          subtitles={subtitles} subtitleIdx={subtitleIdx} onSubtitle={onSubtitle}
          speeds={speeds} speed={speed} onSpeed={onSpeed}
          audios={audios} audioIdx={audioIdx} onAudio={onAudio}
          autoPlayNext={autoPlayNext} onAutoPlayNext={onAutoPlayNext}
        />
      </div>
    );
  }

  return (
    <>
      <div className={`player-controls ${visible ? '' : 'hidden'}`}>
        <div className="pc-btns">
          {/* ---- left: transport ---- */}
          <div className="pc-group pc-left">
            <button type="button" className="pc-btn pc-btn-lg" onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <IconPause size={28} /> : <IconPlay size={28} />}
            </button>
            <button type="button" className="pc-btn" onClick={back10}
              title="Back 10 seconds" aria-label="Back 10 seconds">
              <IconBack10 size={26} />
            </button>
            <button type="button" className="pc-btn" onClick={fwd10}
              title="Forward 10 seconds" aria-label="Forward 10 seconds">
              <IconFwd10 size={26} />
            </button>

            <div className="pc-vol">
              <button type="button" className="pc-btn" onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}>
                <VolumeGlyph muted={isMuted} volume={vol} />
              </button>
              <input className="pc-vol-slider" type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : vol} onChange={setVolume}
                aria-label="Volume" />
            </div>

            <span className="pc-time">{fmtTime(cur)} / {fmtTime(dur)}</span>
          </div>

          {/* ---- right: episode list, audio/subtitles, settings, fullscreen ---- */}
          <div className="pc-group pc-right">
            {hasEpisodes && (
              <button className={`pc-btn ${episodesOpen ? 'on' : ''}`} type="button"
                title={episodesOpen ? 'Hide episodes' : 'Choose episode'}
                aria-label={episodesOpen ? 'Hide episodes' : 'Choose episode'}
                aria-pressed={episodesOpen} onClick={onToggleEpisodes}>
                <IconEpisodes size={24} />
              </button>
            )}
            <button className="pc-btn" type="button"
              title="Subtitles & audio" aria-label="Subtitles and audio"
              aria-pressed={settingsTab === 'subs'}
              onClick={() => onSettingsTab(settingsTab === 'subs' ? null : 'subs')}>
              <IconSubtitle size={24} />
            </button>
            <button className="pc-btn" type="button"
              title="Audio" aria-label="Audio track"
              aria-pressed={settingsTab === 'audio'}
              onClick={() => onSettingsTab(settingsTab === 'audio' ? null : 'audio')}>
              <IconAudio size={24} />
            </button>
            <button className="pc-btn" type="button" title="Settings" aria-label="Player settings"
              aria-pressed={Boolean(settingsTab) && settingsTab !== 'subs' && settingsTab !== 'audio'}
              onClick={() => onSettingsTab(settingsTab ? null : 'quality')}>
              <IconSettings size={24} />
            </button>
            <button className="pc-btn" type="button" title="Fullscreen" aria-label="Toggle fullscreen" onClick={onFullscreen}>
              {fullscreen ? <IconExitFullscreen size={24} /> : <IconFullscreen size={24} />}
            </button>
          </div>
        </div>

        <div
          className={`pc-seek ${dragging ? 'dragging' : ''}`}
          ref={trackRef}
          onPointerDown={onTrackDown}
          onPointerMove={(e) => setHover(ratioAt(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onTrackKey}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(dur)}
          aria-valuenow={Math.round(cur)}
          aria-valuetext={`${fmtTime(cur)} of ${fmtTime(dur)}`}
        >
          <div className="buf" style={{ width: `${bufPct}%` }} />
          <div className="fill" style={{ width: `${pct}%` }} />
          <div className="knob" style={{ left: `${pct}%` }} />
          {hoverTime != null && (
            <span className="pc-seek-tip" style={{ left: `${hover * 100}%` }}>{fmtTime(hoverTime)}</span>
          )}
        </div>
        <div className="pc-time-labels" aria-hidden="true">
          <span>{fmtTime(cur)}</span>
          <span>{fmtTime(dur)}</span>
        </div>

      </div>

      <PlayerSettings
        tab={settingsTab}
        onTab={onSettingsTab} onClose={onSettingsClose}
        qualities={qualities} quality={quality} onQuality={onQuality}
        subtitles={subtitles} subtitleIdx={subtitleIdx} onSubtitle={onSubtitle}
        speeds={speeds} speed={speed} onSpeed={onSpeed}
        audios={audios} audioIdx={audioIdx} onAudio={onAudio}
        autoPlayNext={autoPlayNext} onAutoPlayNext={onAutoPlayNext}
      />
    </>
  );
}