import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Browse from './Browse';
import { MoreLikeThisCard } from '../components/Row';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  IconPlay, IconPlus, IconCheck, IconThumbUp, IconClose, IconChevronDown, IconStar,
} from '../components/Icons';
import { matchPercent } from '../utils/matchPercent';

const fmtDur = (min) => {
  if (!min) return '';
  const h = Math.floor(min / 60);
  return h > 0 ? `${h}h ${min % 60}m` : `${min}m`;
};

// "8 of 51m" progress label above the Resume button (design reference screenshot 2)
const progressLabel = (cur, dur) => `${Math.round(cur / 60)} of ${Math.round(dur / 60)}m`;

const uniqueGenres = (genres = []) => {
  const seen = new Set();
  const out = [];
  for (const g of Array.isArray(genres) ? genres : []) {
    const name = typeof g === 'string' ? g : g?.name;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
};

const EPISODES_PREVIEW = 10; // Netflix lists 10 episodes, then a "show more" chevron

export default function TitleDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { activeProfile } = useAuth();
  const [data, setData] = useState(null);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [inList, setInList] = useState(false);
  const [savingList, setSavingList] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [savingRating, setSavingRating] = useState(false);
  const [prefLang, setPrefLang] = useState(() => localStorage.getItem('sf_pref_lang') || '');
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setData(null);
    setSeasonIdx(0);
    API.get(`/titles/${slug}`)
      .then(({ data: d }) => { setData(d); setMyRating(d.yourRating); })
      .catch(() => nav('/browse'));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data || !activeProfile) return;
    API.get(`/user/watchlist/status/${data.title._id}`)
      .then(({ data: d }) => setInList(d.inList)).catch(() => {});
  }, [data, activeProfile]);

  // The modal owns the viewport while it is open — the browse page behind it stays
  // put (exactly like Netflix, and what makes the design reference look right).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const close = () => {
    if (window.history.state && window.history.state.idx > 0) nav(-1);
    else nav('/browse');
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleList = async () => {
    if (!data || !activeProfile || savingList) return;
    const nextInList = !inList;
    setInList(nextInList);
    setSavingList(true);
    try {
      if (!nextInList) await API.delete(`/user/watchlist/${data.title._id}`);
      else await API.post('/user/watchlist', { titleId: data.title._id });
    } catch { setInList(!nextInList); }
    finally { setSavingList(false); }
  };

  // Thumbs-up is the real rating API: 10/10 = "I like this". Pressing it again
  // removes the rating through the DELETE endpoint, so the toggle is honest.
  const toggleLike = async () => {
    if (!data || savingRating || !activeProfile) return;
    setSavingRating(true);
    try {
      const { data: d } = myRating === 10
        ? await API.delete(`/titles/${data.title._id}/rate`)
        : await API.post(`/titles/${data.title._id}/rate`, { rating: 10 });
      setMyRating(d.yourRating);
      setData((p) => ({ ...p, title: { ...p.title, avgRating: d.avgRating }, ratingCount: d.ratingCount }));
    } catch { /* ignore */ }
    finally { setSavingRating(false); }
  };

  const setRating = async (rating) => {
    if (!data || savingRating) return;
    setSavingRating(true);
    try {
      const { data: d } = await API.post(`/titles/${data.title._id}/rate`, { rating });
      setMyRating(d.yourRating);
      setData((p) => ({ ...p, title: { ...p.title, avgRating: d.avgRating }, ratingCount: d.ratingCount }));
    } catch { /* ignore */ }
    finally { setSavingRating(false); }
  };

  // Language tabs choose the audio/subtitle language the player defaults to.
  // Persisted per browser so Watch.jsx can preselect the matching real track.
  const chooseLang = (lang) => {
    setPrefLang(lang);
    try { localStorage.setItem('sf_pref_lang', lang); } catch { /* private mode */ }
  };

  if (!data) return <Browse />;

  const { title, seasons, moreLikeThis, resume, trailer } = data;
  const season = seasons[seasonIdx];
  const episodes = season?.episodes || [];
  const shownEpisodes = episodes;
  const genres = uniqueGenres(title.genres);
  const resumeTarget = resume?.episodeId ? `/watch/${title._id}?episode=${resume.episodeId}` : `/watch/${title._id}`;
  const subtitleLangs = [...new Set((title.subtitleTracks || []).map((t) => t.language).filter(Boolean))];
  const langs = (title.audioLanguages || []).length
    ? title.audioLanguages
    : (subtitleLangs.length ? subtitleLangs : (title.language ? [title.language] : []));
  const canPlay = Boolean(title.videoUrl) || episodes.length > 0;
  const activeEp = resume?.episodeId ? episodes.find((e) => e._id === resume.episodeId) : null;

  return (
    <Browse>
      <div className="tm-scrim" onClick={close} />
      <div className="tm-modal" role="dialog" aria-modal="true" aria-label={title.title}>
        <button className="tm-close" onClick={close} aria-label="Close"><IconClose size={24} /></button>

        <div className="tm-hero">
          <div className="tm-hero-bg" style={{ backgroundImage: `url(${title.bannerUrl || title.posterUrl})` }} />
          <div className="tm-hero-fade" />
          <div className="tm-hero-content">
            {title.logoUrl
              ? <img className="tm-logo" src={title.logoUrl} alt={title.title} />
              : <h2 className="tm-title">{title.title}</h2>}
          </div>
        </div>

        {resume?.durationSeconds > 0 && (
          <div className="tm-progress">
            <span className="tm-progress-fill"
              style={{ width: `${Math.min(100, (resume.progressSeconds / resume.durationSeconds) * 100)}%` }} />
            <span className="tm-progress-label">{progressLabel(resume.progressSeconds, resume.durationSeconds)}</span>
          </div>
        )}

        <div className="tm-actions">
          {canPlay ? (
            <button className="btn-white tm-play play-action" onClick={() => nav(resume ? resumeTarget : `/watch/${title._id}`)}>
              <IconPlay size={24} /> {resume ? 'Resume' : 'Play'}
            </button>
          ) : (
            <span className="tm-novideo">Video coming soon</span>
          )}
          <button className={`tm-circle ${inList ? 'on' : ''}`} onClick={toggleList} disabled={savingList}
            title={inList ? 'Remove from My List' : 'Add to My List'}>
            {inList ? <IconCheck size={22} /> : <IconPlus size={22} />}
          </button>
          <button className={`tm-circle like-action ${myRating === 10 ? 'on' : ''}`} onClick={toggleLike}
            disabled={savingRating} title="I like this">
            <IconThumbUp size={21} />
          </button>
          {trailer?.url && (
            <button className="btn-gray tm-trailer" onClick={() => setTrailerOpen(true)}>
              Trailer
            </button>
          )}
        </div>

        <div className="tm-body">
          <div className="tm-meta">
            {matchPercent(title) > 0 && <span className="match">{matchPercent(title)}% match</span>}
            {title.releaseYear ? <span>{title.releaseYear}</span> : null}
            {title.type === 'series'
              ? <span>{seasons.length || 1} Season{seasons.length === 1 ? '' : 's'}</span>
              : (title.durationMinutes > 0 ? <span>{fmtDur(title.durationMinutes)}</span> : null)}
            <span className="hd">HD</span>
            <span className="age">{title.ageRating || 'ALL'}</span>
            <span className="tm-tags">{(title.tags || []).join(', ')}</span>
          </div>

          <div className="tm-cols">
            <div className="tm-col-left">
              {activeEp && <h3 className="tm-ep-title">"{activeEp.title}"</h3>}
              <p className="tm-synopsis">{title.description}</p>

              {langs.length > 0 && (
                <div className="tm-langs">
                  {langs.map((l) => (
                    <button key={l} className={`tm-lang ${prefLang === l ? 'active' : ''}`}
                      onClick={() => chooseLang(l)} title={`Default to ${l}`}>{l}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="tm-col-right">
              <div className="tm-field"><span>Cast: </span>{(title.cast || []).map((c) => c.name).filter(Boolean).join(', ') || '—'}</div>
              {title.director && <div className="tm-field"><span>Director: </span>{title.director}</div>}
              <div className="tm-field"><span>Genres: </span>{genres.join(', ') || '—'}</div>
              <div className="tm-field">
                <span>{title.type === 'series' ? 'This show is: ' : 'This movie is: '}</span>
                {(title.tags || []).join(', ') || 'Entertaining'}
              </div>
              <div className="tm-rate">
                <span>Rate: </span>
                <span className="tm-stars">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button key={n} disabled={savingRating} onClick={() => setRating(n)}
                      className={((myRating || 0) >= n) ? 'on' : ''} title={`${n}/10`}>
                      <IconStar size={15} />
                    </button>
                  ))}
                </span>
                {title.ratingCount > 0 && (
                  <em>{title.avgRating || 0}/10 · {title.ratingCount} rating{title.ratingCount > 1 ? 's' : ''}</em>
                )}
              </div>
            </div>
          </div>

          {title.type === 'series' && seasons.length > 0 && (
            <div className="tm-episodes">
              <div className="tm-ep-head">
                <h3>Episodes</h3>
                <div className="tm-season-select">
                  <select value={seasonIdx} onChange={(e) => { setSeasonIdx(Number(e.target.value)); }}>
                    {seasons.map((s, i) => (
                      <option key={s._id} value={i}>
                        {s.name || `Season ${s.seasonNumber}`} ({s.episodes?.length || 0} EP)
                      </option>
                    ))}
                  </select>
                  <IconChevronDown size={18} />
                </div>
              </div>

              {shownEpisodes.map((ep) => {
                const epProgress = resume?.episodeId === ep._id && resume.durationSeconds > 0 ? resume : null;
                return (
                  <div key={ep._id} className="tm-ep" onClick={() => nav(`/watch/${title._id}?episode=${ep._id}`)}>
                    <div className="tm-ep-num">{ep.episodeNumber}</div>
                    <div className="tm-ep-thumb">
                      <img src={ep.thumbnailUrl || title.posterUrl} alt={ep.title} loading="lazy" />
                      {epProgress && (
                        <div className="tm-ep-progress">
                          <span style={{
                            width: `${Math.min(100, (epProgress.progressSeconds / epProgress.durationSeconds) * 100)}%`,
                          }} />
                        </div>
                      )}
                    </div>
                    <div className="tm-ep-info">
                      <h4>{ep.title}</h4>
                      <p>{ep.description}</p>
                    </div>
                    <div className="tm-ep-dur">{ep.durationMinutes ? `${ep.durationMinutes}m` : ''}</div>
                  </div>
                );
              })}
              {episodes.length === 0 && <div className="center-msg">No episodes published yet.</div>}

            </div>
          )}

          {moreLikeThis.length > 0 && (
            <div className="tm-mlt">
              <h3>More Like This</h3>
              <div className="mlt-grid">
                {moreLikeThis.map((m) => <MoreLikeThisCard key={m._id} item={m} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {trailerOpen && trailer?.url && (
        <div className="trailer-ov" onClick={() => setTrailerOpen(false)}>
          <div className="trailer-box" onClick={(e) => e.stopPropagation()}>
            <button className="trailer-close" onClick={() => setTrailerOpen(false)} title="Close">✕</button>
            {['mp4', 'hls', 'cloudinary'].includes(trailer.type) ? (
              <video src={trailer.url} controls autoPlay playsInline />
            ) : (
              <iframe
                src={trailer.url}
                title={`${title.title} trailer`}
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
        </div>
      )}
    </Browse>
  );
}
