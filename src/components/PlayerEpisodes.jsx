import { useEffect, useRef, useState } from 'react';
import { IconClose, IconChevronDown } from './Icons';

const episodeKey = (episode) => episode?._id || episode?.id
  || `s${episode?.seasonNumber || 0}-e${episode?.episodeNumber || 0}`;

const EpisodeImage = ({ src, fallback, label }) => {
  const [url, setUrl] = useState(src || fallback || '');
  useEffect(() => setUrl(src || fallback || ''), [src, fallback]);
  if (!url) return <span className="player-episode-art-fallback">{label}</span>;
  return <img src={url} alt="" onError={() => setUrl(fallback || '')} />;
};

// Netflix's episode drawer. It is a SIBLING of the video body (not an overlay on
// top of it), so the control bar, the episode info card and this list can never
// occupy the same pixels — the old overlay "rail" was the main cause of the
// overlapping UI.
//
// The season switcher lives in the drawer header, exactly like Netflix, so the
// season list and the episode list are always reachable from one place.
export default function PlayerEpisodes({
  open,
  seasons,
  seasonIdx,
  poster,
  currentEpId,
  currentProgress,
  onSelect,
  onSeasonChange,
  onClose,
}) {
  const listRef = useRef(null);
  const currentRef = useRef(null);
  const season = seasons?.[seasonIdx];
  const episodes = [...(season?.episodes || [])].sort(
    (a, b) => Number(a.episodeNumber) - Number(b.episodeNumber),
  );

  useEffect(() => {
    if (!open) return;
    const card = currentRef.current;
    const list = listRef.current;
    if (!card || !list) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      list.scrollTo({
        top: Math.max(0, card.offsetTop - list.clientHeight / 2 + card.clientHeight / 2),
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });
  }, [open, seasonIdx, currentEpId]);

  if (!open) return null;

  return (
    <aside className="player-episode-rail" aria-label="Choose an episode">
      <div className="player-episode-rail-head">
        <span className="player-episode-rail-title">Episodes</span>
        {seasons.length > 1 ? (
          <label className="player-episode-season">
            <span className="sr-only">Choose season</span>
            <select
              value={seasonIdx}
              onChange={(event) => onSeasonChange(Number(event.target.value))}
              aria-label="Choose season"
            >
              {seasons.map((item, index) => (
                <option key={item._id || item.seasonNumber} value={index}>
                  {item.name || `Season ${item.seasonNumber}`}
                </option>
              ))}
            </select>
            <IconChevronDown size={16} />
          </label>
        ) : (
          <span className="player-episode-season-name">
            {season?.name || `Season ${season?.seasonNumber || 1}`}
          </span>
        )}
        <button type="button" onClick={onClose} title="Close episode list" aria-label="Close episode list">
          <IconClose size={20} />
        </button>
      </div>

      <div className="player-episode-list" ref={listRef}>
        {episodes.length === 0 && (
          <div className="player-episodes-empty">No episodes published yet.</div>
        )}

        {episodes.map((episode) => {
          const key = episodeKey(episode);
          const isCurrent = key === String(currentEpId) || String(episode._id) === String(currentEpId);
          const livePct = isCurrent && currentProgress?.dur > 0
            ? Math.min(100, (currentProgress.cur / currentProgress.dur) * 100)
            : 0;

          return (
            <button
              key={key}
              ref={isCurrent ? currentRef : null}
              type="button"
              className={`player-episode-card ${isCurrent ? 'current' : ''}`}
              onClick={() => onSelect(episode)}
              aria-current={isCurrent ? 'true' : undefined}
              data-episode-id={key}
            >
              <span className="player-episode-image">
                <EpisodeImage
                  src={episode.thumbnailUrl}
                  fallback={season?.posterUrl || poster}
                  label={`Episode ${episode.episodeNumber}`}
                />
                <span className="player-episode-shade" />
                <span className="player-episode-copy">
                  <strong>{episode.episodeNumber}</strong>
                  <b>{episode.title || `Episode ${episode.episodeNumber}`}</b>
                </span>
                {episode.durationMinutes > 0 && (
                  <span className="player-episode-duration">{episode.durationMinutes}m</span>
                )}
                {livePct > 0 && (
                  <span className="player-episode-progress" aria-hidden="true">
                    <i style={{ width: `${livePct}%` }} />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
