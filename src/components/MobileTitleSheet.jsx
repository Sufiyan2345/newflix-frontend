import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { isTmdbInList, isTmdbLiked, toggleTmdbLike, toggleTmdbList } from '../utils/tmdbList';
import { hiRes } from '../utils/imageUrl';
import { MOBILE_TITLE_EVENT } from '../utils/mobileTitle';
import useIsMobile from '../hooks/useIsMobile';
import { matchPercent } from '../utils/matchPercent';
import { CardArt, TitleCard } from './Row';
import {
  IconPlay, IconPlus, IconCheck, IconThumbUp, IconClose, IconChevronDown,
} from './Icons';

// ---------------------------------------------------------------------------
// The Netflix phone title sheet.
//
// On a desktop the rails advertise a title through <HoverPreview>, which pops a
// card up next to the pointer. A finger has no hover, so that card is
// unreachable: tapping a tile used to throw the viewer onto a detail page,
// losing the row they were reading and burning a full navigation for what the
// real app answers with a sheet.
//
// This is that sheet. Any card opens it through the `streamflix-mobile-title-open`
// event (see utils/mobileTitle.js) and it renders what Netflix renders on a
// phone: the backdrop with the title art, the white Play button with the
// circular My List / Like row, the meta line (match · year · certificate ·
// runtime · HD), the genres, the clamped synopsis with a More/Less toggle, the
// episode list with a season picker, and a More Like This rail.
//
// It is mounted once for the whole app in App.jsx, so it sits above every page
// without each page owning it, and the rails behind it stay put — exactly like
// the desktop modal.
// ---------------------------------------------------------------------------

const parseTmdbId = (id = '') => {
  const m = /^tmdb-(movie|tv)-(\d+)$/.exec(String(id || ''));
  return m ? { type: m[1], tmdbId: m[2] } : null;
};

const fmtDur = (min) => {
  if (!min || min < 1) return '';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

const isSeriesType = (t) => t === 'series' || t === 'tv';

const genreNames = (genres) => {
  const out = [];
  const seen = new Set();
  for (const g of Array.isArray(genres) ? genres : []) {
    const name = typeof g === 'string' ? g : (g && (g.name || g._id));
    if (!name || seen.has(String(name))) continue;
    seen.add(String(name));
    out.push(name);
  }
  return out.slice(0, 4);
};

export default function MobileTitleSheet() {
  const isMobile = useIsMobile();
  const nav = useNavigate();
  const { activeProfile } = useAuth();

  const [item, setItem] = useState(null);     // the card that was tapped
  const [active, setActive] = useState(null); // what the sheet currently shows
  const [detail, setDetail] = useState(null); // full detail for `active`
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [episodes, setEpisodes] = useState([]);
  const [epLoading, setEpLoading] = useState(false);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState('');
  const [inList, setInList] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [listBusy, setListBusy] = useState(false);
  const dragRef = useRef({ startY: 0, dy: 0, active: false });
  const bodyRef = useRef(null);
  const coords = parseTmdbId(active?._id);
  const isTmdb = Boolean(coords);

  useEffect(() => {
    if (!active || !activeProfile) {
      setLiked(false);
      setLikeLoading(false);
      return undefined;
    }
    if (isTmdb) {
      setLiked(isTmdbLiked(activeProfile._id, active._id));
      setLikeLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLiked(false);
    setLikeLoading(true);
    API.get(`/titles/${active._id}/rating`)
      .then(({ data }) => { if (!cancelled) setLiked(data.yourRating === 10); })
      .catch(() => { if (!cancelled) setLiked(false); })
      .finally(() => { if (!cancelled) setLikeLoading(false); });
    return () => { cancelled = true; };
  }, [active?._id, activeProfile?._id, isTmdb]);

  useEffect(() => {
    const onRatingChange = (event) => {
      if (event.detail?.itemId === active?._id && event.detail?.profileId === activeProfile?._id)
        setLiked(event.detail.liked);
    };
    const onTmdbLikeChange = (event) => {
      if (isTmdb && event.detail?.itemId === active?._id && event.detail?.profileId === activeProfile?._id)
        setLiked(event.detail.liked);
    };
    window.addEventListener('title-rating-changed', onRatingChange);
    window.addEventListener('tmdb-like-changed', onTmdbLikeChange);
    return () => {
      window.removeEventListener('title-rating-changed', onRatingChange);
      window.removeEventListener('tmdb-like-changed', onTmdbLikeChange);
    };
  }, [active?._id, activeProfile?._id, isTmdb]);

  // ---- open / close -------------------------------------------------------
  // The listener is always attached; the `isMobile` guard sits on the way in so
  // a stray event on a desktop can never summon the phone sheet.
  useEffect(() => {
    const onOpen = (e) => {
      if (!isMobile || !e.detail) return;
      setItem(e.detail);
      setActive(e.detail);
    };
    window.addEventListener(MOBILE_TITLE_EVENT, onOpen);
    return () => window.removeEventListener(MOBILE_TITLE_EVENT, onOpen);
  }, [isMobile]);

  const close = useCallback(() => {
    setItem(null);
    setActive(null);
    setDetail(null);
    setEpisodes([]);
    setSeasonIdx(0);
    setEpisodesOpen(false);
    setExpanded(false);
    setLiked(false);
    setError('');
    dragRef.current = { startY: 0, dy: 0, active: false };
  }, []);

  // Lock the page behind the sheet and flag the body so the tab bar steps aside
  // (Netflix covers the whole screen with the sheet, tab bar included).
  useEffect(() => {
    if (!item) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('mts-open');
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.body.classList.remove('mts-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [item, close]);

  // ---- load the full title -----------------------------------------------
  useEffect(() => {
    if (!active) return;
    setSeasonIdx(0);
    setEpisodes([]);
    setEpisodesOpen(false);
    setExpanded(false);
    setDetail(null);
    setError('');

    // A TMDB card carries its own coordinates; a catalogue card is resolved
    // through its slug. Either way the sheet shows the SERVER's view of the
    // title, not just the trimmed copy that travelled along on the card.
    const tmdb = parseTmdbId(String(active._id || ''));
    if (tmdb) {
      setLoading(true);
      API.get(`/tmdb/detail/${tmdb.type}/${tmdb.tmdbId}`)
        .then(({ data }) => setDetail(data.item))
        .catch(() => setError('Could not load this title right now.'))
        .finally(() => setLoading(false));
      return;
    }
    if (!active.slug) { setLoading(false); return; }
    setLoading(true);
    API.get(`/titles/${active.slug}`)
      .then(({ data }) => setDetail({
        title: data.title,
        seasons: data.seasons || [],
        moreLikeThis: data.moreLikeThis || [],
        trailer: data.trailer || null,
        resume: data.resume || null,
      }))
      .catch(() => setError('Could not load this title right now.'))
      .finally(() => setLoading(false));
  }, [active?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- episodes -----------------------------------------------------------
  useEffect(() => {
    if (!detail) return;
    if (!isSeriesType(detail.type || active?.type)) return;

    // Local titles ship their whole episode list inside /titles/:slug, so there
    // is nothing to fetch. TMDB only has season summaries there — the real
    // episode rows come from the season endpoint.
    if (!isTmdb) {
      setEpisodes(detail.seasons?.[seasonIdx]?.episodes || []);
      return;
    }
    const season = detail.seasons?.[seasonIdx];
    if (!season || !coords) return;
    setEpLoading(true);
    API.get(`/tmdb/season/${coords.tmdbId}/${season.seasonNumber}`)
      .then(({ data }) => setEpisodes(data.episodes || []))
      .catch(() => setEpisodes([]))
      .finally(() => setEpLoading(false));
  }, [detail, seasonIdx, isTmdb, coords?.tmdbId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- My List ------------------------------------------------------------
  useEffect(() => {
    if (!active) return;
    if (isTmdb) setInList(isTmdbInList(activeProfile?._id, active._id));
    else {
      API.get(`/user/watchlist/status/${active._id}`)
        .then(({ data }) => setInList(Boolean(data.inList)))
        .catch(() => setInList(false));
    }
  }, [active?._id, activeProfile?._id, isTmdb]); // eslint-disable-line react-hooks/exhaustive-deps

  // The +/✓ on the sheet and the +/✓ on every card behind it must agree.
  useEffect(() => {
    if (!isTmdb) return undefined;
    const onListChange = (e) => { if (e.detail?.itemId === active?._id) setInList(e.detail.inList); };
    window.addEventListener('tmdb-list-changed', onListChange);
    return () => window.removeEventListener('tmdb-list-changed', onListChange);
  }, [isTmdb, active?._id]);

  const toggleList = async () => {
    if (!active || listBusy) return;
    if (isTmdb) {
      setInList(toggleTmdbList(activeProfile?._id, active));
      setToast(inList ? 'Removed from My List' : 'Added to My List');
      return;
    }
    if (!activeProfile) return;
    const next = !inList;
    setInList(next);
    setListBusy(true);
    try {
      if (next) await API.post('/user/watchlist', { titleId: active._id });
      else await API.delete(`/user/watchlist/${active._id}`);
      setToast(next ? 'Added to My List' : 'Removed from My List');
    } catch { setInList(!next); }
    finally { setListBusy(false); }
  };

  const toggleLike = async () => {
    if (!active || !activeProfile || likeBusy) return;
    if (isTmdb) {
      setLiked(toggleTmdbLike(activeProfile._id, active._id));
      return;
    }

    const titleId = active._id;
    const profileId = activeProfile._id;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeBusy(true);
    try {
      const { data } = nextLiked
        ? await API.post(`/titles/${titleId}/rate`, { rating: 10 })
        : await API.delete(`/titles/${titleId}/rate`);
      const savedLiked = data.yourRating === 10;
      if (active?._id === titleId) setLiked(savedLiked);
      window.dispatchEvent(new CustomEvent('title-rating-changed', {
        detail: { itemId: titleId, profileId, yourRating: data.yourRating, liked: savedLiked },
      }));
    } catch {
      if (active?._id === titleId) setLiked(!nextLiked);
    } finally {
      setLikeBusy(false);
    }
  };

  // ---- where Play goes ----------------------------------------------------
  const play = useCallback((episode) => {
    if (!active) return;
    if (isTmdb && coords) {
      const q = isSeriesType(detail?.type || active.type)
        ? `?season=${episode?.seasonNumber ?? 1}&episode=${episode?.episodeNumber ?? 1}`
        : '?type=movie';
      close();
      nav(`/watch/tmdb/${coords.tmdbId}${q}`);
      return;
    }
    if (!active._id) return;
    close();
    nav(episode ? `/watch/${active._id}?episode=${episode._id}` : `/watch/${active._id}`);
  }, [active, coords, isTmdb, detail?.type, close, nav]);

  // ---- drag to dismiss ----------------------------------------------------
  const onGrabStart = (e) => {
    const touch = e.touches?.[0];
    dragRef.current = { startY: touch ? touch.clientY : 0, dy: 0, active: true };
  };
  const onGrabMove = (e) => {
    if (!dragRef.current.active) return;
    const touch = e.touches?.[0];
    if (!touch || !bodyRef.current) return;
    const dy = touch.clientY - dragRef.current.startY;
    // Only downward drags dismiss — pulling up must not close the sheet.
    dragRef.current.dy = dy > 0 ? dy : dy * 0.25;
    bodyRef.current.style.transform = `translateY(${dragRef.current.dy}px)`;
    bodyRef.current.style.transition = 'none';
  };
  const onGrabEnd = () => {
    if (!dragRef.current.active || !bodyRef.current) return;
    const { dy } = dragRef.current;
    dragRef.current.active = false;
    if (dy > 110) { close(); return; }
    bodyRef.current.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1)';
    bodyRef.current.style.transform = 'translateY(0)';
  };

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 1600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!item || !isMobile) return null;

  // One merged view of the title: the server's detail once it has landed, and
  // the card's own fields until then, so the sheet never flashes an empty shell.
  const hero = detail || active;
  const title = hero?.title || '';
  const isSeries = isSeriesType(hero?.type || active?.type);
  const year = hero?.releaseYear || String(hero?.releaseDate || '').slice(0, 4);
  const seasons = detail?.seasons || hero?.seasons || [];
  const moreLikeThis = detail?.moreLikeThis || hero?.recommendations || [];
  const backdrop = hiRes(hero?.bannerUrl || hero?.posterUrl || '');
  const logo = hero?.logoUrl || '';
  const runtime = isSeries
    ? (hero?.seasonsCount ? `${hero.seasonsCount} Season${hero.seasonsCount > 1 ? 's' : ''}` : '')
    : fmtDur(hero?.durationMinutes);
  const genres = genreNames(hero?.genres);
  const description = hero?.description || '';
  const longDescription = description.length > 170;
  const episodesToShow = episodesOpen ? episodes : episodes.slice(0, 5);

  return createPortal(
    <div
      className="mts-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={close}
    >
      <div className="mts" ref={bodyRef} onClick={(e) => e.stopPropagation()}>
        {/* Grab handle + the backdrop artwork */}
        <div
          className="mts-grab"
          onTouchStart={onGrabStart}
          onTouchMove={onGrabMove}
          onTouchEnd={onGrabEnd}
          onTouchCancel={onGrabEnd}
        >
          <span className="mts-grab-bar" aria-hidden="true" />
          {backdrop ? (
            <img className="mts-art" src={backdrop} alt="" draggable="false" />
          ) : (
            <div className="mts-art mts-art-empty">{title}</div>
          )}
          <div className="mts-shade" />
          <button type="button" className="mts-close" onClick={close} aria-label="Close">
            <IconClose size={20} />
          </button>

          {/* Title art when the title has a logo, otherwise the styled wordmark —
              never both, and never neither. Same rule the billboard uses. */}
          <div className="mts-heading">
            {logo
              ? <img className="mts-logo" src={hiRes(logo)} alt={title} draggable="false" />
              : <h2 className="mts-title">{title}</h2>}
          </div>
        </div>

        <div className="mts-body">
          {/* Play + the circular My List / Like row — Netflix's exact control
              cluster: one wide white action, then outlined circles. */}
          <div className="mts-actions">
            <button type="button" className="mts-play" onClick={() => play(null)}>
              <IconPlay size={20} /> {detail?.resume ? 'Resume' : 'Play'}
            </button>
            <button
              type="button"
              className={`mts-circle ${inList ? 'on' : ''}`}
              onClick={toggleList}
              disabled={listBusy}
              aria-label={inList ? 'Remove from My List' : 'Add to My List'}
            >
              {inList ? <IconCheck size={20} /> : <IconPlus size={20} />}
            </button>
            <button
              type="button"
              className={`mts-circle like-action ${liked ? 'on' : ''}`}
              onClick={toggleLike}
              disabled={likeBusy || likeLoading || !activeProfile}
              aria-pressed={liked}
              aria-label={liked ? 'Remove like' : 'Like'}
            >
              <IconThumbUp size={20} />
            </button>
          </div>

          {loading && <div className="mts-note">Loading…</div>}
          {error && <div className="mts-note mts-note-error">{error}</div>}



          {!loading && !error && (
            <>
              {/* Meta line: match · year · certificate · runtime · HD */}
              <div className="mts-meta">
                {matchPercent(hero) > 0 && (
                  <span className="match">{matchPercent(hero)}% Match</span>
                )}
                {year ? <span>{year}</span> : null}
                {hero?.ageRating ? <span className="age">{hero.ageRating}</span> : null}
                {runtime ? <span>{runtime}</span> : null}
                <span className="hd">HD</span>
              </div>

              {genres.length > 0 && (
                <div className="mts-genres">
                  {genres.map((g, i) => <span key={`${g}-${i}`}>{g}</span>)}
                </div>
              )}

              {description && (
                <>
                  <p className={`mts-desc${expanded ? ' open' : ''}`}>{description}</p>
                  {longDescription && (
                    <button
                      type="button"
                      className="mts-more"
                      onClick={() => setExpanded((v) => !v)}
                      aria-expanded={expanded}
                    >
                      {expanded ? 'Less' : 'More'}
                    </button>
                  )}
                </>
              )}

              {hero?.cast?.length > 0 && (
                <p className="mts-side">
                  <span>Cast: </span>{[].concat(hero.cast).join(', ')}
                </p>
              )}
              {hero?.director && (
                <p className="mts-side">
                  <span>{isSeries ? 'Creator: ' : 'Director: '}</span>{hero.director}
                </p>
              )}

              {/* Episodes — the season picker + the real episode rows. */}
              {isSeries && seasons.length > 0 && (
                <section className="mts-section">
                  <div className="mts-section-head">
                    <button
                      type="button"
                      className="mts-section-toggle"
                      onClick={() => setEpisodesOpen((v) => !v)}
                      aria-expanded={episodesOpen}
                    >
                      <h3>Episodes</h3>
                      <IconChevronDown className={episodesOpen ? 'open' : ''} size={20} />
                    </button>
                    {seasons.length > 1 && (
                      <div className="mts-season">
                        <select
                          value={seasonIdx}
                          onChange={(e) => setSeasonIdx(Number(e.target.value))}
                          aria-label="Select season"
                        >
                          {seasons.map((s, i) => (
                            <option key={s.seasonNumber ?? i} value={i}>
                              {s.name || `Season ${(s.seasonNumber ?? i) + 1}`}
                            </option>
                          ))}
                        </select>
                        <IconChevronDown size={14} />
                      </div>
                    )}
                  </div>

                  {episodesOpen && (
                    <>
                      {epLoading && <div className="sf-spinner mts-spinner" />}
                      {!epLoading && episodesToShow.length === 0 && (
                        <div className="mts-note">No episodes published yet.</div>
                      )}
                      {!epLoading && episodesToShow.map((ep) => (
                        <button
                          key={ep._id || ep.episodeNumber}
                          type="button"
                          className="mts-ep"
                          onClick={() => play(ep)}
                        >
                          <span className="mts-ep-num">{ep.episodeNumber}</span>
                          <span className="mts-ep-thumb">
                            {ep.thumbnailUrl
                              ? <img src={ep.thumbnailUrl} alt="" loading="lazy" />
                              : <CardArt src={backdrop} alt="" title={ep.title} />}
                            <span className="mts-ep-play" aria-hidden="true"><IconPlay size={16} /></span>
                          </span>
                          <span className="mts-ep-info">
                            <span className="mts-ep-title">{ep.title}</span>
                            {ep.description && <span className="mts-ep-desc">{ep.description}</span>}
                            {ep.airDate && <span className="mts-ep-date">{ep.airDate}</span>}
                          </span>
                          {ep.durationMinutes ? (
                            <span className="mts-ep-dur">{ep.durationMinutes}m</span>
                          ) : null}
                        </button>
                      ))}
                      {episodes.length > 5 && (
                        <button
                          type="button"
                          className="mts-episodes-more"
                          onClick={() => setEpisodesOpen((v) => !v)}
                        >
                          {episodesOpen ? 'Show less' : `Show all ${episodes.length} episodes`}
                        </button>
                      )}
                    </>
                  )}
                </section>
              )}

              {/* More Like This — a horizontal rail, the phone shape of the
                  desktop 3-up grid. */}
              {moreLikeThis.length > 0 && (
                <section className="mts-section">
                  <h3 className="mts-section-title">More Like This</h3>
                  <div className="mts-rail">
                    {moreLikeThis.slice(0, 12).map((rec) => (
                      <TitleCard key={rec._id} item={rec} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <div className="mts-toast" role="status">{toast}</div>}
    </div>,
    document.body
  );
}

