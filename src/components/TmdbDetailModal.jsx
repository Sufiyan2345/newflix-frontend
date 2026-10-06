import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../api';
import { isTmdbInList, isTmdbLiked, toggleTmdbLike, toggleTmdbList } from '../utils/tmdbList';
import { useAuth } from '../context/AuthContext';
import { IconClose, IconPlay, IconPlus, IconCheck, IconThumbUp, IconChevronDown } from './Icons';
import { CardArt, TmdbArtworkLogo } from './Row';
import { hiRes } from '../utils/imageUrl';

const fmtDur = (min) => {
  if (!min) return '';
  const h = Math.floor(min / 60);
  return h > 0 ? `${h}h ${min % 60}m` : `${min}m`;
};

// Parse "tmdb-movie-123" / "tmdb-tv-456" card ids back into TMDB coordinates.
const parseTmdbId = (id = '') => {
  const m = /^tmdb-(movie|tv)-(\d+)$/.exec(id);
  return m ? { type: m[1], tmdbId: m[2] } : null;
};

const resumeRoute = (item) => item?.watchRoute || null;

const fmtSeconds = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const resumeEpisodeLabel = (item) => {
  const episode = item?._episode;
  if (!episode) return item?._resume ? 'Movie' : '';
  const season = episode.season?.seasonNumber ?? episode.seasonNumber;
  const code = season && episode.episodeNumber ? `S${season}:E${episode.episodeNumber}` : '';
  return episode.title ? `${code} · ${episode.title}` : code;
};

const EpisodeImage = ({ episode, fallback, title }) => {
  const [src, setSrc] = useState(episode?.thumbnailUrl || fallback || '');
  useEffect(() => setSrc(episode?.thumbnailUrl || fallback || ''), [episode?.thumbnailUrl, fallback]);
  if (!src) return <span className="tmdb-ep-art-fallback">{title || 'Episode'}</span>;
  return <img src={src} alt={title || ''} loading="lazy" onError={() => setSrc(fallback || '')} />;
};

const RecommendationCard = ({ item, profileId, onOpen }) => {
  const [inList, setInList] = useState(() => isTmdbInList(profileId, item._id));
  const typeLabel = item.type === 'tv' ? 'Series' : (item.durationMinutes ? fmtDur(item.durationMinutes) : 'Movie');

  return (
    <div className="tmdb-mlt-card" onClick={() => onOpen(item)}>
      <div className="tmdb-mlt-art">
        <CardArt src={item.bannerUrl || item.posterUrl} alt={item.title} title={item.title} />
        <TmdbArtworkLogo item={item} />
        <span className="tmdb-mlt-chip">{typeLabel}</span>
      </div>
      <div className="tmdb-mlt-body">
        <div className="tmdb-mlt-title">{item.title}</div>
        <div className="tmdb-mlt-meta">
          <span className="match">{Math.round(item.matchPercentage || 0)}% match</span>
          <span className="age">{item.ageRating || '13+'}</span>
          {item.releaseYear ? <span>{item.releaseYear}</span> : null}
          <button
            className={`tmdb-mlt-add ${inList ? 'on' : ''}`}
            title={inList ? 'Remove from My List' : 'Add to My List'}
            onClick={(event) => {
              event.stopPropagation();
              setInList(toggleTmdbList(profileId, item));
            }}
          >
            {inList ? <IconCheck size={18} /> : <IconPlus size={18} />}
          </button>
        </div>
        <p className="tmdb-mlt-desc">{item.description}</p>
      </div>
    </div>
  );
};

// Netflix-style in-page detail modal for TMDB titles. Opens on top of the browse
// page (page scroll locks, rows stay put behind it — exactly like Netflix).
// For series it fetches real episode lists per season from TMDB.
export default function TmdbDetailModal({ item, onClose }) {
  const nav = useNavigate();
  const { activeProfile } = useAuth();
  // `active` follows clicks on "More Like This" tiles without leaving the modal
  const [active, setActive] = useState(item);
  const coords = parseTmdbId(active?._id);
  const [data, setData] = useState(null);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [visibleRecommendations, setVisibleRecommendations] = useState(9);
  const [episodes, setEpisodes] = useState([]);
  const [epLoading, setEpLoading] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [liked, setLiked] = useState(() => isTmdbLiked(activeProfile?._id, item?._id));
  const [language, setLanguage] = useState('');
  const [toast, setToast] = useState('');
  const [actionPulse, setActionPulse] = useState('');
  const [inList, setInList] = useState(() => isTmdbInList(activeProfile?._id, item?._id));
  const [error, setError] = useState('');

  useEffect(() => {
    setActive(item);
    setInList(isTmdbInList(activeProfile?._id, item?._id));
    setLanguage('');
    setToast('');
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLiked(isTmdbLiked(activeProfile?._id, active?._id));
  }, [active?._id, activeProfile?._id]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  const pulse = (action) => {
    setActionPulse('');
    requestAnimationFrame(() => setActionPulse(action));
    setTimeout(() => setActionPulse(''), 300);
  };

  // Keep the modal's +/✓ in sync when the list changes elsewhere
  useEffect(() => {
    const onListChange = (e) => { if (e.detail?.itemId === active?._id) setInList(e.detail.inList); };
    window.addEventListener('tmdb-list-changed', onListChange);
    return () => window.removeEventListener('tmdb-list-changed', onListChange);
  }, [active?._id]);

  useEffect(() => {
    const onLikeChange = (event) => {
      const change = event.detail;
      if (change?.itemId !== active?._id) return;
      if (change.profileId && change.profileId !== activeProfile?._id) return;
      setLiked(Boolean(change.liked));
    };
    window.addEventListener('tmdb-like-changed', onLikeChange);
    return () => window.removeEventListener('tmdb-like-changed', onLikeChange);
  }, [active?._id, activeProfile?._id]);

  // Lock page scroll while open + close on Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Load the full detail for the active title
  useEffect(() => {
    if (!coords) { setError('This title is not available.'); return; }
    setData(null); setError(''); setSeasonIdx(0); setEpisodes([]); setTrailerOpen(false); setEpisodesOpen(false);
    setVisibleRecommendations(9);
    API.get(`/tmdb/detail/${coords.type}/${coords.tmdbId}`)
      .then(({ data: d }) => setData(d.item))
      .catch(() => setError('Could not load details. Is the backend running?'));
  }, [active?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load episodes whenever a series season is selected
  useEffect(() => {
    if (!data || data.type !== 'tv' || !data.seasons?.length || !coords) return;
    const season = data.seasons[seasonIdx];
    if (!season) return;
    setEpLoading(true);
    API.get(`/tmdb/season/${coords.tmdbId}/${season.seasonNumber}`)
      .then(({ data: d }) => setEpisodes(d.episodes || []))
      .catch(() => setEpisodes([]))
      .finally(() => setEpLoading(false));
  }, [data, seasonIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTo = useCallback((rec) => {
    setActive(rec);
    setVisibleRecommendations(9);
    window.scrollTo({ top: 0 }); // modal body scrolls, not the page
  }, []);

  const playEpisode = useCallback((episode) => {
    const season = data?.seasons?.[seasonIdx];
    if (!coords || !season || !episode) return;
    onClose();
    nav(`/watch/tmdb/${coords.tmdbId}?season=${season.seasonNumber}&episode=${episode.episodeNumber}`);
  }, [coords, data, nav, onClose, seasonIdx]);

  if (!item && !active) return null;

  const hero = data || active;
  const isSeries = (data?.type || active.type) === 'tv';
  const storedResumeRoute = resumeRoute(active);
  const resume = active?._resume;
  const resumeDuration = Number(resume?.durationSeconds) || 0;
  const resumeProgress = Number(resume?.progressSeconds) || 0;
  const resumePct = resumeDuration > 0
    ? Math.min(100, Math.max(0, (resumeProgress / resumeDuration) * 100))
    : 0;
  const resumeContext = resumeEpisodeLabel(active);
  const meta = [
    data ? `${Math.round(data.matchPercentage || 0)}% Match` : '',
    hero.releaseYear || '',
    isSeries
      ? (data?.seasonsCount ? `${data.seasonsCount} Season${data.seasonsCount > 1 ? 's' : ''}` : '')
      : (data?.durationMinutes ? fmtDur(data.durationMinutes) : ''),
  ].filter(Boolean);
  const keywords = (data?.keywords || [])
    .map((keyword) => typeof keyword === 'string' ? keyword : keyword?.name)
    .filter(Boolean);
  const descriptors = keywords.length ? keywords : (data?.genres || []).filter(Boolean);
  const bottomDetailRows = data ? [
    data.cast?.length ? { label: 'Cast:', value: data.cast.join(', ') } : null,
    data.genres?.length ? { label: 'Genres:', value: data.genres.join(', ') } : null,
    descriptors.length
      ? { label: `This ${isSeries ? 'show' : 'movie'} is:`, value: descriptors.join(', ') }
      : null,
    (data.ageRating || hero.ageRating)
      ? { label: 'Maturity rating:', value: data.ageRating || hero.ageRating }
      : null,
  ].filter(Boolean) : [];

  return (
    <div className="tmdb-modal-overlay" onClick={onClose}>
      <div className="tmdb-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tmdb-close" onClick={onClose} aria-label="Close"><IconClose size={22} /></button>

        {error && <div className="center-msg" style={{ padding: '80px 20px' }}>{error}</div>}

        {!data && !error && (
          <div className="tmdb-hero" style={{ backgroundImage: `url(${hiRes(active.bannerUrl || active.posterUrl)})` }}>
            <div className="tmdb-hero-shade" />
            <div className="tmdb-hero-body">
              <TmdbArtworkLogo item={active} variant="modal" />
            </div>
            <div className="sf-spinner" style={{ position: 'absolute', left: '50%', top: '50%' }} />
          </div>
        )}

        {data && (
          <div className="tmdb-scroll">
            <div className="tmdb-hero" style={{ backgroundImage: `url(${hiRes(data.bannerUrl || data.posterUrl)})` }}>
              <div className="tmdb-hero-shade" />
              <div className="tmdb-hero-body">
                <TmdbArtworkLogo item={hero} variant="modal" />
                {resumeContext && <div className="tmdb-resume-context">{resumeContext}</div>}
                {data.tagline && <p className="tmdb-tagline">{data.tagline}</p>}
                {resumeDuration > 0 && (
                  <div className="tmdb-resume-progress" aria-label={`${fmtSeconds(resumeProgress)} watched, ${fmtSeconds(resumeDuration - resumeProgress)} left`}>
                    <div className="tmdb-resume-track"><span style={{ width: `${resumePct}%` }} /></div>
                    <span>{fmtSeconds(resumeProgress)} watched · {fmtSeconds(resumeDuration - resumeProgress)} left</span>
                  </div>
                )}
                <div className="tmdb-controls">
                <div className="tmdb-actions">
                  <button
                    className="btn-white play-action"
                    data-delayed-click={isSeries ? 'true' : undefined}
                    onClick={() => {
                      if (storedResumeRoute) {
                        onClose();
                        nav(storedResumeRoute);
                        return;
                      }
                      if (isSeries) {
                        if (episodes[0]) playEpisode(episodes[0]);
                        else setToast(epLoading ? 'Loading episodes…' : 'No playable episode is listed yet.');
                        return;
                      }
                      // Movies play in OUR player, not as a trailer overlay. The
                      // movie watch endpoint resolves a real source (mapped local
                      // title first, then the configured provider template).
                      onClose();
                      nav(`/watch/tmdb/${coords.tmdbId}?type=movie`);
                    }}
                  >
                    <IconPlay size={22} /> {storedResumeRoute ? 'Resume' : 'Play'}
                  </button>
                  {/* The trailer stays available, just no longer hijacks Play. */}
                  {!isSeries && data.trailerUrl && (
                    <button
                      className="tmdb-list-btn"
                      title="Watch trailer"
                      aria-label={`Play the trailer for ${data.title}`}
                      onClick={() => setTrailerOpen(true)}
                    >
                      <IconPlay size={20} />
                    </button>
                  )}
                  <button
                    className={`tmdb-list-btn ${inList ? 'on' : ''} ${actionPulse === 'list' ? 'pulse' : ''}`}
                    title={inList ? 'Remove from My List' : 'Add to My List'}
                    onClick={() => {
                      const next = toggleTmdbList(activeProfile?._id, data || active);
                      setInList(next);
                      pulse('list');
                      setToast(next ? 'Added to My List' : 'Removed from My List');
                    }}
                  >
                    {inList ? <IconCheck size={22} /> : <IconPlus size={22} />}
                  </button>
                  <button
                    className={`tmdb-list-btn tmdb-like-btn like-action ${liked ? 'on' : ''}`}
                    title={liked ? 'Remove Like' : 'Like'}
                    aria-label={liked ? 'Remove Like' : 'Like'}
                    onClick={() => {
                      setLiked(toggleTmdbLike(activeProfile?._id, active?._id));
                    }}
                  >
                    <IconThumbUp size={21} />
                  </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="tmdb-info">
              <div className="tmdb-col-main">
                <div className="tmdb-info-meta">
                  <div className="tmdb-meta-row">
                    {meta.map((m, i) => (
                      <span key={i} className={i === 0 ? 'match' : ''}>{m}</span>
                    ))}
                    <span className="hd">HD</span>
                  </div>
                  <div className="tmdb-content-tags">
                    {(data.ageRating || hero.ageRating) && (
                      <span className="age">{data.ageRating || hero.ageRating}</span>
                    )}
                    {descriptors.slice(0, 2).map((keyword) => <span key={keyword}>{keyword}</span>)}
                  </div>
                </div>
                <p className="tmdb-desc">{data.description}</p>
              </div>
              <div className="tmdb-col-side">
                {data.cast?.length > 0 && <p><span className="lbl">Cast: </span>{data.cast.join(', ')}</p>}
                {data.genres?.length > 0 && <p><span className="lbl">Genres: </span>{data.genres.join(', ')}</p>}
                {descriptors.length > 0 && (
                  <p><span className="lbl">This {isSeries ? 'show' : 'movie'} is: </span>{descriptors.join(', ')}</p>
                )}
              </div>
            </div>

            {(data.audioLanguages?.length > 0) && (
              <div className="tmdb-languages" aria-label="Audio languages">
                {data.audioLanguages.map((name) => (
                  <button
                    key={name}
                    className={language === name || (!language && name === data.audioLanguages[0]) ? 'active' : ''}
                    onClick={() => setLanguage(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {isSeries && data.seasons?.length > 0 && (
              <div className="tmdb-episodes">
                <div className="tmdb-ep-head">
                  <button
                    className="tmdb-episodes-toggle"
                    onClick={() => setEpisodesOpen((value) => !value)}
                    aria-expanded={episodesOpen}
                    aria-label={episodesOpen ? 'Hide episodes' : 'Show episodes'}
                  >
                    <h3>Episodes</h3>
                    <IconChevronDown className={episodesOpen ? 'open' : ''} size={22} />
                  </button>
                  <div className="tmdb-season-select">
                    <select value={seasonIdx} onChange={(e) => setSeasonIdx(Number(e.target.value))}>
                      {data.seasons.map((s, i) => (
                        <option key={s.seasonNumber} value={i}>
                          {s.name || `Season ${s.seasonNumber + 1}`} ({s.episodeCount} EP)
                        </option>
                      ))}
                    </select>
                    <IconChevronDown size={16} />
                  </div>
                </div>

                {epLoading && <div className="sf-spinner" style={{ margin: '30px auto' }} />}
                {!epLoading && episodes.length === 0 && (
                  <div className="center-msg" style={{ padding: '30px 0' }}>No episode info for this season yet.</div>
                )}
                {!epLoading && episodes.slice(0, episodesOpen ? episodes.length : Math.max(1, Math.ceil(episodes.length / 2))).map((ep) => (
                  <button
                    key={ep._id}
                    type="button"
                    className="tmdb-ep"
                    data-delayed-click="true"
                    onClick={() => playEpisode(ep)}
                    aria-label={`Play season ${data.seasons[seasonIdx]?.seasonNumber}, episode ${ep.episodeNumber}: ${ep.title}`}
                  >
                    <span className="tmdb-ep-num">{ep.episodeNumber}</span>
                    <span className="tmdb-ep-thumb">
                      <EpisodeImage episode={ep} fallback={data.bannerUrl || data.posterUrl} title={ep.title} />
                      <span className="tmdb-ep-play" aria-hidden="true"><IconPlay size={18} /></span>
                    </span>
                    <span className="tmdb-ep-info">
                      <span className="tmdb-ep-title">{ep.title}</span>
                      {ep.description
                        ? <span className="tmdb-ep-desc">{ep.description}</span>
                        : <span className="tmdb-ep-desc tmdb-ep-nosyn">No synopsis yet for this episode on TMDB.</span>}
                      {ep.airDate && <span className="tmdb-ep-date">Aired {ep.airDate}</span>}
                    </span>
                    <span className="tmdb-ep-dur">{ep.durationMinutes ? `${ep.durationMinutes}m` : ''}</span>
                  </button>
                ))}
                <button
                  className="tmdb-episodes-bottom-toggle"
                  onClick={() => setEpisodesOpen((value) => !value)}
                  aria-expanded={episodesOpen}
                  aria-label={episodesOpen ? 'Show fewer episodes' : 'Show all episodes'}
                >
                  <IconChevronDown className={episodesOpen ? 'open' : ''} size={24} />
                </button>
              </div>
            )}

            {data.recommendations?.length > 0 && (
              <div className="tmdb-mlt">
                <h3>More Like This</h3>
                <div className="tmdb-mlt-grid">
                  {data.recommendations.slice(0, visibleRecommendations).map((rec) => (
                    <RecommendationCard key={rec._id} item={rec} profileId={activeProfile?._id} onOpen={switchTo} />
                  ))}
                </div>
                {data.recommendations.length > visibleRecommendations && (
                  <button
                    className="tmdb-bottom-details-toggle"
                    type="button"
                    onClick={() => setVisibleRecommendations((count) => count + 3)}
                    aria-label="Show three more titles"
                  >
                    <IconChevronDown size={22} />
                  </button>
                )}
              </div>
            )}

            <section className="tmdb-bottom-details" aria-label="Title details">
              <div className="tmdb-bottom-details-content">
                <h2>{data.title}</h2>
                <dl>
                  {bottomDetailRows.map(({ label, value }) => (
                    <div className="tmdb-bottom-detail-row" key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          </div>
        )}
      </div>

      {toast && <div className="tmdb-toast" role="status">{toast}</div>}

      {trailerOpen && data?.trailerUrl && (
        <div className="trailer-ov" onClick={() => setTrailerOpen(false)}>
          <div className="trailer-box" onClick={(e) => e.stopPropagation()}>
            <button className="trailer-close" onClick={() => setTrailerOpen(false)} title="Close">✕</button>
            <iframe
              src={data.trailerUrl}
              title={`${data.title} trailer`}
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
