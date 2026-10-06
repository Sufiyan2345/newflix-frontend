import { IconPlay, IconClose, IconSubtitle, IconSpeed, IconAudio, IconQuality } from './Icons';

const TABS = [
  { key: 'quality', Icon: IconQuality, label: 'Quality' },
  { key: 'subs', Icon: IconSubtitle, label: 'Subtitles' },
  { key: 'speed', Icon: IconSpeed, label: 'Playback speed' },
  { key: 'audio', Icon: IconAudio, label: 'Audio' },
];

// The settings panel above the control bar (design reference screenshots 6-10):
// four tabs — quality, subtitles, speed, audio. Options are the real ones the
// player can apply; empty lists say so instead of showing fake entries.
// The footer holds the player-wide switch: autoplay next episode.
export default function PlayerSettings({
  tab, onTab, onClose,
  qualities, quality, onQuality,
  subtitles, subtitleIdx, onSubtitle,
  speeds, speed, onSpeed,
  audios, audioIdx, onAudio,
  autoPlayNext, onAutoPlayNext,
}) {
  if (!tab) return null;

  const option = (active, label, onClick, key) => (
    <button key={key ?? label} className={`pc-opt ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="pc-opt-mark">{active && <IconPlay size={15} />}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="pc-settings" onMouseLeave={onClose}>
      <div className="pc-tabs">
        {TABS.map(({ key, Icon, label }) => (
          <button key={key} className={`pc-tab ${tab === key ? 'active' : ''}`}
            onClick={() => onTab(key)} title={label} aria-label={label}>
            <Icon size={20} />
          </button>
        ))}
        <button className="pc-tab pc-tab-close" onClick={onClose} title="Close" aria-label="Close settings">
          <IconClose size={18} />
        </button>
      </div>

      {tab === 'quality' && (
        <div className="pc-list">
          {qualities.length === 0 && <div className="pc-opt empty">Auto (single quality)</div>}
          {qualities.map((q) => option(quality === q.value, q.label, () => onQuality(q), q.key))}
        </div>
      )}

      {tab === 'subs' && (
        <div className="pc-list">
          <div className="pc-list-title">Subtitle Settings</div>
          {option(subtitleIdx === -1, 'Off', () => onSubtitle(-1), 'off')}
          {subtitles.length === 0 && <div className="pc-opt empty">No subtitle tracks on this title</div>}
          {subtitles.map((s, i) => option(subtitleIdx === i, s.label, () => onSubtitle(i), `${s.label}-${i}`))}
        </div>
      )}

      {tab === 'speed' && (
        <div className="pc-list">
          {speeds.map((s) => option(speed === s.value, s.label, () => onSpeed(s.value), String(s.value)))}
        </div>
      )}

      {tab === 'audio' && (
        <div className="pc-list">
          {audios.length === 0 && <div className="pc-opt empty">Original audio only</div>}
          {audios.map((a, i) => option(audioIdx === i, a.label, () => onAudio(i), `${a.label}-${i}`))}
        </div>
      )}

      <div className="pc-foot">
        <button className="pc-foot-row" onClick={() => onAutoPlayNext(!autoPlayNext)}
          aria-pressed={autoPlayNext} title="Automatically continue with the next episode">
          <span>Autoplay next episode</span>
          <span className={`pc-switch ${autoPlayNext ? 'on' : ''}`} aria-hidden="true"><i /></span>
        </button>
      </div>
    </div>
  );
}