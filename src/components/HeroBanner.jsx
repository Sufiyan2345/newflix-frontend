import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlay, IconInfo, IconMuted, IconVolume, IconThumbDown, IconThumbUp } from './Icons';
import { HERO_INTERVAL_MS, HERO_SLIDE_EVENT, MAX_HERO_SLIDES } from '../hooks/useHeroSlides';
import { hiRes, isTmdbImage } from '../utils/imageUrl';
import { matchPercent } from '../utils/matchPercent';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { isTmdbDisliked, isTmdbLiked, toggleTmdbDislike, toggleTmdbLike } from '../utils/tmdbList';
import { loadYouTubePlayerApi } from '../utils/youtubePlayer';

const HERO_RATING_MAP = {
  'TV-Y': 'ALL',
  'TV-Y7': '7+',
  'TV-PG': '7+',
  'TVPG': '7+',
  PG: '7+',
  'TV-14': '13+',
  TV14: '13+',
  'PG-13': '13+',
  PG13: '13+',
  'TV-MA': '18+',
  TVMA: '18+',
  R: '18+',
  'NC-17': '18+',
};
const normalizeHeroRating = (value) => {
  const rating = String(value || '').trim().toUpperCase();
  if (['ALL', '7+', '13+', '16+', '18+'].includes(rating)) return rating;
  return HERO_RATING_MAP[rating] || '13+';
};

// Netflix billboard, matched to the design reference screenshot:
//   • the artwork runs full-bleed at its NATIVE resolution (see utils/imageUrl)
//     and only a soft left wedge is laid over it — the heavy bottom black band
//     that used to sit here is what greyed out the card row under the banner
//   • red "N" + SERIES/FILM lockup, TMDB title artwork and the Play + More Info pair
//   • the maturity chip sits on the right, on the button line
//   • one thin red progress line is pinned to the very bottom edge (the
//     reference has no dot row); every segment is still clickable
// All featured slides are mounted stacked and crossfaded with a slow drift on
// the active one — no re-mount flash, transitions stay smooth.
// `index` is owned by the page (see hooks/useHeroSlides). This component only
// renders what it is given and reports a segment click back through
// `onSlideSelect` (or the shared window event when a caller does not pass it).
export default function HeroBanner({
  item,
  featured = [],
  index = 0,
  ranks = {},
  rankScope = '',
  onHoverChange,
  onSlideSelect,
  paused = false,
  intervalMs = HERO_INTERVAL_MS,
}) {
  const nav = useNavigate();
  const { activeProfile } = useAuth();

  // Show at most MAX_HERO_SLIDES; when there is no featured array fall back to the single item.
  const candidates = featured.length ? featured : (item ? [item] : []);
  const slides = candidates
    .filter((candidate) => /^tmdb-(movie|tv)-\d+$/.test(String(candidate?._id || '')))
    .slice(0, MAX_HERO_SLIDES);
  const activeIndex = slides.length ? Math.min(index, slides.length - 1) : 0;
  const slide = slides[activeIndex] || item;

  // The artwork of the slide we are about to fade into must be decoded before the
  // crossfade starts — a banner that was just uploaded in the admin panel is not
  // in the browser cache yet, so without this warm-up the fade reveals a
  // half-painted image. The SAME hiRes URL the <img> uses is warmed, otherwise
  // the preloader and the billboard would pull two different files.
  const slidesRef = useRef(slides);
  slidesRef.current = slides;
  const touchStart = useRef(null);
  const signature = slides.map((s, i) => String(s?._id || s?.id || i)).join('|');
  const warmed = useRef(new Set());
  const requestedArtwork = useRef(new Set());
  const requestedDetails = useRef(new Set());
  const [tmdbArtwork, setTmdbArtwork] = useState({});
  const [tmdbDetails, setTmdbDetails] = useState({});
  const [failedTitleArtwork, setFailedTitleArtwork] = useState('');
  const [trailerIndex, setTrailerIndex] = useState(0);
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const playerHostRef = useRef(null);
  const playerInstance = useRef(null);
  const audioMutedRef = useRef(true);
  const [audioMuted, setAudioMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const getSlideArtwork = (candidate) => {
    const id = String(candidate?._id || '');
    const tmdbBackdrop = tmdbArtwork[id]?.backdropUrl;
    if (tmdbBackdrop) return hiRes(tmdbBackdrop);
    const tmdbImage = [candidate?.bannerUrl, candidate?.posterUrl].find(isTmdbImage);
    return hiRes(tmdbImage || '');
  };

  useEffect(() => {
    const pool = slidesRef.current;
    if (!pool.length) return;
    const queue = pool.length > 1 ? [activeIndex, (activeIndex + 1) % pool.length] : [activeIndex];
    queue.forEach((i) => {
      const url = getSlideArtwork(pool[i]);
      if (!url || warmed.current.has(url)) return;
      warmed.current.add(url);
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      if (typeof img.decode === 'function') img.decode().catch(() => {});
    });
  }, [activeIndex, signature, tmdbArtwork]);

  useEffect(() => {
    slides.forEach((featuredSlide) => {
      const parts = String(featuredSlide._id || '').split('-');
      const [prefix, type, id] = parts;
      const key = String(featuredSlide._id || '');
      if (prefix !== 'tmdb' || !['movie', 'tv'].includes(type) || !id || requestedArtwork.current.has(key)) return;

      requestedArtwork.current.add(key);
      API.get(`/tmdb/title-media/${type}/${id}`, { softFail: true })
        .then(({ data }) => {
          const trailerKeys = [...new Set((data?.videos || [])
            .filter((video) => video?.key)
            .sort((a, b) => {
              const rank = (video) => (
                video.type === 'Trailer' ? 0
                  : video.type === 'Teaser' ? 1
                    : video.type === 'Clip' ? 2
                      : 3
              );
              return rank(a) - rank(b) || Number(b.official) - Number(a.official);
            })
            .map((video) => video.key))];
          setTmdbArtwork((artwork) => ({
            ...artwork,
            [key]: {
              logoUrl: data?.logoUrl || '',
              backdropUrl: data?.backdropUrl || '',
              trailerKeys,
            },
          }));
        })
        .catch(() => {});
    });
  }, [signature]);

  useEffect(() => {
    const id = String(slide?._id || '');
    const [, type, tmdbId] = id.split('-');
    if (!tmdbId || !['movie', 'tv'].includes(type) || requestedDetails.current.has(id)) return undefined;

    requestedDetails.current.add(id);
    API.get(`/tmdb/detail/${type}/${tmdbId}`, { softFail: true })
      .then(({ data }) => {
        if (data?.item) {
          setTmdbDetails((details) => ({ ...details, [id]: data.item }));
        }
      })
      .catch(() => {});
    return undefined;
  }, [slide?._id]);

  useEffect(() => {
    setFailedTitleArtwork('');
    setTrailerIndex(0);
    setPlayingTrailer(false);
    audioMutedRef.current = true;
    setAudioMuted(true);
  }, [slide?._id]);

  const activeSlideId = String(slides[activeIndex]?._id || '');
  const trailerKeys = tmdbArtwork[activeSlideId]?.trailerKeys || [];
  const activeTrailerKey = trailerKeys[trailerIndex] || '';

  useEffect(() => {
    if (!activeTrailerKey || !playerHostRef.current) return undefined;
    let cancelled = false;
    setPlayingTrailer(false);

    loadYouTubePlayerApi()
      .then((youtube) => {
        if (cancelled || !playerHostRef.current) return;
        const playerMount = document.createElement('div');
        playerHostRef.current.replaceChildren(playerMount);
        playerInstance.current = new youtube.Player(playerMount, {
          videoId: activeTrailerKey,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            modestbranding: 1,
            origin: window.location.origin,
            playsinline: 1,
            playlist: activeTrailerKey,
            rel: 0,
            vq: 'hd1080',
          },
          events: {
            onReady: (event) => {
              if (audioMutedRef.current) event.target.mute();
              else event.target.unMute();
              event.target.setPlaybackQuality('hd1080');
              event.target.playVideo();
            },
            onStateChange: (event) => {
              setPlayingTrailer(event.data === youtube.PlayerState.PLAYING);
            },
            onError: () => {
              setPlayingTrailer(false);
              setTrailerIndex((current) => current + 1);
            },
          },
        });
      })
      .catch((error) => {
        if (!cancelled) console.error('Hero trailer player unavailable:', error);
      });

    return () => {
      cancelled = true;
      if (playerInstance.current) {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [activeSlideId, activeTrailerKey]);

  const toggleTrailerAudio = () => {
    const player = playerInstance.current;
    if (!player || !playingTrailer) return;
    const nextMuted = !audioMutedRef.current;
    audioMutedRef.current = nextMuted;
    setAudioMuted(nextMuted);
    if (nextMuted) player.mute();
    else player.unMute();
  };

  useEffect(() => {
    const itemId = String(slide?._id || '');
    const profileId = activeProfile?._id;
    setLiked(isTmdbLiked(profileId, itemId));
    setDisliked(isTmdbDisliked(profileId, itemId));
    const onReactionChange = (event) => {
      const change = event.detail;
      if (change?.itemId !== itemId || change.profileId !== profileId) return;
      setLiked(Boolean(change.liked));
      setDisliked(Boolean(change.disliked));
    };
    window.addEventListener('tmdb-reaction-changed', onReactionChange);
    return () => window.removeEventListener('tmdb-reaction-changed', onReactionChange);
  }, [slide?._id, activeProfile?._id]);

  if (!slide || !/^tmdb-(movie|tv)-\d+$/.test(String(slide._id || ''))) return null;

  const detail = tmdbDetails[String(slide._id || '')] || {};
  const recommendationScore = matchPercent({ ...slide, ...detail });
  const isSeries = (detail.type || slide.type) === 'series' || (detail.type || slide.type) === 'tv';
  const releaseYear = detail.releaseYear || slide.releaseYear || String(detail.releaseDate || slide.releaseDate || '').slice(0, 4);
  const genre = (detail.genres || slide.genres || []).find((value) => typeof value === 'string' && value.trim());
  const seasonCount = Number(detail.seasonsCount || slide.seasonsCount || 0);
  const runtime = Number(detail.durationMinutes || slide.durationMinutes || 0);
  const contentRating = normalizeHeroRating(detail.ageRating || slide.ageRating);
  const durationLabel = isSeries
    ? (seasonCount ? `${seasonCount} Season${seasonCount === 1 ? '' : 's'}` : '')
    : runtime
      ? `${Math.floor(runtime / 60) ? `${Math.floor(runtime / 60)}h ` : ''}${runtime % 60 ? `${runtime % 60}m` : ''}`.trim()
      : '';
  const metaItems = [
    genre,
    releaseYear ? String(releaseYear) : '',
    durationLabel,
  ].filter(Boolean);
  const rank = Number(ranks[String(slide._id || '')] || ranks[String(slide.id || '')] || 0);
  const rankType = isSeries ? 'TV Shows' : 'Movies';
  const rankHeading = rankScope ? `${rankScope} ${rankType}` : rankType;
  const tmdbTitleArtwork = tmdbArtwork[String(slide._id || '')]?.logoUrl || '';
  const titleArtwork = hiRes(tmdbTitleArtwork || slide.logoUrl || '');
  const showTitleArtwork = Boolean(titleArtwork) && failedTitleArtwork !== titleArtwork;
  const displayTitle = slide.title || slide.originalTitle || '';

  const isTmdb = String(slide._id || '').startsWith('tmdb-');
  // TMDB ids arrive as "tmdb-tv-1399" / "tmdb-movie-603"; the watch page owns the
  // rest (a series without coordinates redirects itself to its current episode).
  const tmdbId = isTmdb ? String(slide._id).split('-')[2] : '';
  const isTmdbMovie = String(slide._id || '').startsWith('tmdb-movie-');
  const playRoute = isTmdb
    ? (tmdbId ? `/watch/tmdb/${tmdbId}${isTmdbMovie ? '?type=movie' : ''}` : null)
    : `/watch/${slide._id}`;

  // The billboard's two buttons are always Play + More Info, exactly like the
  // reference. Play needs somewhere to land: a local title owns a player, a TMDB
  // title resolves through the configured provider. A slide with neither (no
  // source at all) keeps More Info as its primary action instead of a dead
  // Play button.
  const playable = Boolean(playRoute) && (isTmdb || Boolean(slide.videoUrl) || isSeries || slide.episodesCount > 0);
  const goPlay = () => { if (playRoute) nav(playRoute); else openDetails(); };

  // More Info: the in-page Netflix-style detail sheet for TMDB, the catalogue
  // title page for local titles.
  const openDetails = () => {
    if (isTmdb) window.dispatchEvent(new CustomEvent('tmdb-open-detail', { detail: slide }));
    else nav(`/title/${slide.slug}`);
  };

  const goToSlide = (slideIndex) => {
    if (onSlideSelect) onSlideSelect(slideIndex);
    else window.dispatchEvent(new CustomEvent(HERO_SLIDE_EVENT, { detail: slideIndex }));
  };

  const onTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event) => {
    if (!touchStart.current || slides.length < 2) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    const direction = deltaX < 0 ? 1 : -1;
    goToSlide((activeIndex + direction + slides.length) % slides.length);
  };

  return (
    <div className="hero-shell" style={{ '--hero-interval': `${intervalMs}ms` }}>
      <div
        className={`hero${paused ? ' paused' : ''}`}
        style={{ '--hero-interval': `${intervalMs}ms` }}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
      >
        <div className="hero-slides">
          {slides.map((s, slideIndex) => {
            const art = getSlideArtwork(s);
            if (!art) return null;
            return (
              <div key={s._id || slideIndex} className={`hero-slide ${slideIndex === activeIndex ? 'active' : ''}`}>
                {/* A real <img>, not a background-image: the 4K file then enters the
                    preload scanner on the first paint instead of being discovered
                    after the CSSOM, so it is decoded at the display's own resolution
                    — that upscale-to-blur is what read as a soft banner. */}
                <img
                  className="hero-img"
                  src={art}
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                  decoding="async"
                  loading={slideIndex === activeIndex ? 'eager' : 'lazy'}
                  fetchPriority={slideIndex === activeIndex ? 'high' : 'low'}
                />
                {slideIndex === activeIndex && activeTrailerKey && (
                  <div
                    ref={playerHostRef}
                    className={`hero-trailer${playingTrailer ? ' loaded' : ''}`}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="hero-shade" />

        {/* Keyed by slide so the content block slides up/fades on every rotation */}
        <div
          className={`hero-content${showTitleArtwork ? ' has-title-art' : ''}`}
          key={slide._id || activeIndex}
        >
          <div className="hero-brandtag">
            <img className="hero-brandtag-n" src="/Netflix.png" alt="" draggable="false" />
            <span>{isSeries ? 'SERIES' : 'FILM'}</span>
          </div>

          {showTitleArtwork ? (
            <>
              <h1 className="nx-visually-hidden">{displayTitle}</h1>
              <img
                className="hero-logo"
                src={titleArtwork}
                alt={displayTitle}
                draggable="false"
                onError={() => setFailedTitleArtwork(titleArtwork)}
              />
            </>
          ) : (
            <h1 className="hero-title-text">{displayTitle}</h1>
          )}

          {Number.isInteger(rank) && rank > 0 && rank <= 10 && (
            <div className="hero-top10" aria-label={`Number ${rank} in ${rankHeading} Today`}>
              <span className="hero-top10-badge" aria-hidden="true">
                <img src="/Netflix.png" alt="" draggable="false" />
              </span>
              <span className="hero-top10-text">#{rank} in {rankHeading} Today</span>
            </div>
          )}

          {metaItems.length > 0 && (
            <div className="hero-meta" aria-label={metaItems.join(', ')}>
              {metaItems.map((entry, metaIndex) => (
                <span key={`${entry}-${metaIndex}`}>{entry}</span>
              ))}
            </div>
          )}

          {slide.description && (
            <p className="hero-description">{slide.description}</p>
          )}

          <div className="hero-actions">
            {playable ? (
              <button className="btn-white play-action" onClick={goPlay}>
                <IconPlay size={20} /> Play
              </button>
            ) : (
              <button className="btn-white" onClick={openDetails}>
                <IconInfo size={20} /> Details
              </button>
            )}
            <button className="btn-gray" onClick={openDetails}>
              <IconInfo size={20} /> More Info
            </button>
            <div className="hero-reactions" aria-label="Rate this title">
              <button
                type="button"
                className={`hero-reaction-btn${liked ? ' active' : ''}`}
                aria-label={liked ? 'Remove like' : 'Like'}
                aria-pressed={liked}
                title={liked ? 'Remove like' : 'Like'}
                onClick={() => setLiked(toggleTmdbLike(activeProfile?._id, slide._id))}
              >
                <IconThumbUp size={20} />
              </button>
              <button
                type="button"
                className={`hero-reaction-btn${disliked ? ' active' : ''}`}
                aria-label={disliked ? 'Remove dislike' : 'Dislike'}
                aria-pressed={disliked}
                title={disliked ? 'Remove dislike' : 'Dislike'}
                onClick={() => setDisliked(toggleTmdbDislike(activeProfile?._id, slide._id))}
              >
                <IconThumbDown size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="hero-badges" aria-label="Title highlights">
          {recommendationScore > 0 && (
            <div className="hero-badge hero-recommendation">
              <img src="/send.png" alt="" aria-hidden="true" />
              <span>We think you’ll love this!</span>
            </div>
          )}
          <div className="hero-badge hero-award">
            <img src="/award.png" alt="" aria-hidden="true" />
            <span>Emmy Award Winning</span>
          </div>
        </div>
        <div className="hero-maturity" aria-label={`Maturity rating: ${contentRating}`}>
          <button
            type="button"
            className="hero-audio-toggle"
            aria-label={audioMuted ? 'Turn trailer sound on' : 'Turn trailer sound off'}
            aria-pressed={!audioMuted}
            title={audioMuted ? 'Turn sound on' : 'Turn sound off'}
            disabled={!playingTrailer}
            onClick={toggleTrailerAudio}
          >
            {audioMuted ? <IconMuted size={20} /> : <IconVolume size={20} />}
          </button>
          <span className="hero-rating">{contentRating}</span>
        </div>
      </div>

    </div>
  );
}
