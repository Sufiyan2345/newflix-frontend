import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { API } from '../api';
import { usePlayerSource } from '../hooks/usePlayerSource';
import { useEmbedBridge } from '../hooks/useEmbedBridge';
import PlayerControls from '../components/PlayerControls';
import PlayerEpisodes from '../components/PlayerEpisodes';
import {
  IconClose, IconRefresh, IconChevronLeft, IconChevronDown, IconEpisodes, IconSettings,
  IconPlay, IconPause, IconBack10, IconFwd10,
} from '../components/Icons';

// Real playback speeds â€” wired straight to video.playbackRate
const SPEEDS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

const AUTO_QUALITY = { value: -1, label: 'Auto', key: 'auto' };

// Playback behaviour (SRS Â§10)
const AUTOPLAY_KEY = 'sf_autoplay_next';  // "Automatically continue series episodes when enabled"
const NEXT_UP_SECONDS = 10;               // countdown before the next episode starts
const PROGRESS_MS = 10000;                // "Record progress periodically"
const STALL_MS = 15000;                   // give up on a stalled stream after this long
const MAX_AUTO_RETRIES = 2;               // automatic transient-network recoveries
const EMBED_STALL_MS = 12000;             // how long a framed source page gets to render before the fallback shows

// Fallback skip windows used when an episode has no admin-set markers (SRS Â§10
// "Skip intro" / "Skip recap", Admin 12-13 "Intro markers / Recap markers").
// Real per-episode markers returned by the API always win.
const DEFAULT_RECAP = { start: 2, end: 20 };
const DEFAULT_INTRO = { start: 2, end: 45 };

const titleTypeSupportsEpisodes = (type) => type === 'series' || type === 'tv';

// Netflix prints a feature's runtime as "1h 51m" / "51m" / "1h" (never "1h 0m").
const fmtRuntime = (min) => {
  const m = Number(min) || 0;
  if (m <= 0) return '';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}m`;
  return rest ? `${h}h ${rest}m` : `${h}h`;
};

// YouTube only accepts postMessage commands when the embed opts into the JS API.
// Other providers keep their original URL untouched.
const embedSourceUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i.test(parsed.hostname)) {
      parsed.searchParams.set('enablejsapi', '1');
      parsed.searchParams.set('origin', window.location.origin);
      // The site owns the transport chrome, so YouTube's own control bar is hidden.
      parsed.searchParams.set('controls', '0');
      return parsed.toString();
    }
  } catch { /* invalid provider URL â€” render it as received */ }
  return url;
};

export default function Watch({ tmdbId: tmdbRouteId = null }) {
  const { id: localTitleId } = useParams();
  const [params] = useSearchParams();
  const isTmdb = Boolean(tmdbRouteId);
  const id = tmdbRouteId || localTitleId;
  const seasonNumber = Number(params.get('season') || 1) || 1;
  const episodeId = params.get('episode');
  // TMDB movies are a single feature with no season/episode, so they hit their own
  // watch endpoint. `type` defaults to 'tv' so existing series links keep working.
  const tmdbType = params.get('type') === 'movie' ? 'movie' : 'tv';
  const isTmdbMovie = isTmdb && tmdbType === 'movie';
  const nav = useNavigate();

  const [meta, setMeta] = useState(null);
  const [episodes, setEpisodes] = useState([]); // flattened, ordered playback queue
  const [seasons, setSeasons] = useState([]); // real season groups for the selector
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [currentEp, setCurrentEp] = useState(null);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [switchingEpisode, setSwitchingEpisode] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const hideTimer = useRef(null);
  const loadedTitleRef = useRef(null);

  const [controlsVisible, setControlsVisible] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState({ cur: 0, dur: 0, buffered: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  // Player settings state (all of it real, applied to the <video>/hls.js instance)
  const [settingsTab, setSettingsTab] = useState(null); // 'quality' | 'subs' | 'speed' | 'audio'
  const [hls, setHls] = useState(null);
  const [quality, setQuality] = useState(AUTO_QUALITY.value);
  const [speed, setSpeed] = useState(1);
  const [subtitleIdx, setSubtitleIdx] = useState(-1);
  const [audioIdx, setAudioIdx] = useState(0);
  const [audioOverride, setAudioOverride] = useState(null); // separate audio file (mp4/webm)
  const [startAt, setStartAt] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  // Embedded sources (embed/stremio): 'loading' until the framed page fires onLoad,
  // then 'ready' â€” or 'stuck' when the page never renders (blocked / broken link),
  // which swaps in the "Open source page / Try again" fallback instead of a black screen.
  const [embedState, setEmbedState] = useState('loading');
  const [embedNonce, setEmbedNonce] = useState(0); // "Try again" â€” re-mounts the iframe
  const [playerLogoUrl, setPlayerLogoUrl] = useState(''); // "Try again" â€” re-mounts the iframe
  const [playerLogoFailed, setPlayerLogoFailed] = useState(false); // "Try again" â€” re-mounts the iframe

  useEffect(() => {
    let active = true;
    setPlayerLogoUrl('');
    setPlayerLogoFailed(false);
    if (!isTmdb) return () => { active = false; };

    API.get(`/tmdb/title-media/${tmdbType}/${tmdbRouteId}`, { softFail: true })
      .then(({ data }) => {
        if (active) setPlayerLogoUrl(data?.logoUrl || '');
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isTmdb, tmdbRouteId, tmdbType]); // "Try again" â€” re-mounts the iframe

  // Buffering / error / recovery states (SRS Â§10)
  const [buffering, setBuffering] = useState(true);
  const [netState, setNetState] = useState('ok'); // 'ok' | 'recovering' | 'error'
  const [playbackError, setPlaybackError] = useState('');
  const autoRetries = useRef(0);
  // True once playback has actually started â€” the stall watchdog only applies after
  // that, so a slow first load is never mistaken for a broken stream.
  const startedRef = useRef(false);

  // Autoplay-next + "up next" countdown
  const [autoPlayNext, setAutoPlayNext] = useState(() => {
    try { return localStorage.getItem(AUTOPLAY_KEY) !== '0'; } catch { return true; }
  });
  const [nextUp, setNextUp] = useState({ active: false, seconds: NEXT_UP_SECONDS });
  const [toast, setToast] = useState('');
  const iframeProgressRef = useRef({ startedAt: null, elapsed: 0 });

  // ---------- load the stream + its episode list (resume from last position) ----------
  useEffect(() => {
    let alive = true;
    const routeKey = isTmdb ? `tmdb:${tmdbType}:${tmdbRouteId}:${seasonNumber}:${episodeId || ''}` : `${id}:${episodeId || ''}`;
    const sameTitle = loadedTitleRef.current === routeKey;
    loadedTitleRef.current = routeKey;
    setError(''); setAudioOverride(null); setHls(null);
    setQuality(AUTO_QUALITY.value); setPlaybackError(''); setBuffering(true);
    setNetState('ok'); setNextUp({ active: false, seconds: NEXT_UP_SECONDS });
    if (!sameTitle) {
      // First load (or a different title) starts from a clean slate. An episode
      // switch deliberately keeps the old frame and rail visible under the veil.
      setMeta(null);
      setEpisodes([]); setSeasons([]); setSeasonIdx(0); setCurrentEp(null);
      setEpisodesOpen(false); setSwitchingEpisode(false);
    } else {
      setSwitchingEpisode(true);
    }
    setSettingsTab(null); setToast('');
    autoRetries.current = 0;
    startedRef.current = false;

    const watchRequest = isTmdbMovie
      ? `/tmdb/movie/${tmdbRouteId}/watch`
      : isTmdb
        ? `/tmdb/tv/${tmdbRouteId}/watch?season=${seasonNumber}${episodeId ? `&episode=${episodeId}` : ''}`
        : `/titles/${id}/watch${episodeId ? `?episode=${episodeId}` : ''}`;
    API.get(watchRequest)
      .then(async ({ data }) => {
        if (!alive) return;
        // Series have no main video: the API auto-selects the first episode so the
        // Play buttons never dead-end. Put that episode in the URL so the player,
        // resume position, "next episode" and the episode list all line up.
        if (!isTmdb && data.video?.episodeId && !episodeId) {
          nav(`/watch/${id}?episode=${data.video.episodeId}`, { replace: true });
          return;
        }
        // A TMDB movie is already a single playable item - nothing to redirect to.
        if (isTmdb && !isTmdbMovie && !episodeId && data.episode?.episodeNumber) {
          nav(`/watch/tmdb/${tmdbRouteId}?season=${data.episode.seasonNumber || seasonNumber}&episode=${data.episode.episodeNumber}`, { replace: true });
          return;
        }
        setMeta(data);
        setStartAt(data.resumeSeconds || 0);
        setSubtitleIdx(-1);
        if (data.video?.type === 'external') setSwitchingEpisode(false);

        const applySeasonList = (seasonList) => {
          const normalizedSeasons = seasonList.map((season) => ({
            ...season,
            episodes: [...(season.episodes || [])].sort(
              (a, b) => Number(a.episodeNumber) - Number(b.episodeNumber),
            ),
          }));
          const all = normalizedSeasons.flatMap((season) => season.episodes
            .map((episode) => ({ ...episode, seasonNumber: season.seasonNumber })))
            .sort((a, b) => (
              Number(a.seasonNumber) - Number(b.seasonNumber)
              || Number(a.episodeNumber) - Number(b.episodeNumber)
            ));
          setSeasons(normalizedSeasons);
          setEpisodes(all);
          const selected = all.find((item) => String(item._id) === String(episodeId))
            || all.find((item) => String(item._id) === String(data.episode?.id))
            || all.find((item) => Number(item.seasonNumber) === Number(data.episode?.seasonNumber || seasonNumber)
              && Number(item.episodeNumber) === Number(data.episode?.episodeNumber || episodeId))
            || all[0] || null;
          setCurrentEp(selected);
          if (selected) {
            const selectedSeason = normalizedSeasons.findIndex(
              (season) => Number(season.seasonNumber) === Number(selected.seasonNumber),
            );
            setSeasonIdx(selectedSeason >= 0 ? selectedSeason : 0);
          }
          return { normalizedSeasons, all };
        };

        if (isTmdb) {
          applySeasonList(data.seasons || []);
        } else if (episodeId || data.title?.type === 'series') {
          // Local series keep using the published catalogue list for the rail.
          try {
            const detail = await API.get(`/titles/${data.title.slug}`);
            if (!alive) return;
            applySeasonList(detail.data.seasons || []);
          } catch { /* playback still works; only the optional rail is unavailable */ }
        }
        // honour the language chosen in the title modal (real subtitle track preselect)
        const pref = localStorage.getItem('sf_pref_lang');
        if (pref) {
          const idx = (data.subtitles || []).findIndex((t) => (t.language || t.label) === pref);
          if (idx >= 0) setSubtitleIdx(idx);
        }
      })
      .catch((err) => {
        if (alive) setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load stream');
      });

    return () => { alive = false; };
  }, [id, episodeId, isTmdb, tmdbRouteId, seasonNumber, tmdbType]); // eslint-disable-line react-hooks/exhaustive-deps

  // The <video>/<audio> source actually attached. Swapping the audio track swaps the
  // URL and resumes from the current position, so the switch is seamless.
  // Memoised so re-renders (timeupdate) never re-attach the media element.
  const videoObj = useMemo(
    () => (meta?.video ? (audioOverride ? { ...meta.video, url: audioOverride.url } : meta.video) : null),
    [meta, audioOverride]
  );

  // Transient network / decode failures are reported here: 'recovering' keeps the
  // spinner up while hls.js retries, 'error' becomes the error state overlay.
  const onSourceStatus = useCallback((s) => {
    if (s.state === 'recovering') {
      setNetState('recovering');
      setBuffering(true);
    } else if (s.state === 'error') {
      setNetState('error');
      setBuffering(false);
      setPlaybackError('Playback was interrupted. Check your connection and try again.');
    }
  }, []);

  // Source kind, derived ONCE here â€” several hooks below reference these values in
  // their dependency arrays, and deps arrays are evaluated during render. Declaring
  // them any later throws "Cannot access 'iframeSource' before initialization"
  // (a full-page crash â€” the blank player screen).
  const externalOnly = videoObj?.type === 'external'; // provider forbids framing (X-Frame-Options)
  const iframeSource = Boolean(videoObj) && (videoObj.type === 'embed' || videoObj.type === 'stremio' || externalOnly);

  usePlayerSource(videoRef, videoObj, startAt, setHls, retryKey, onSourceStatus);

  // Framed providers are driven through this bridge so the SAME Netflix control bar
  // works for them. `controllable` is false for providers without a documented
  // command API â€” the bar then renders identically but marks those buttons honestly.
  const embedBridge = useEmbedBridge(iframeRef, iframeSource ? embedSourceUrl(videoObj?.url) : null);

  // True when the framed provider renders its OWN complete transport (vidsrc.su
  // and mirrors). For those we must not draw a second control bar â€” that stacked
  // duplicate was the main visual defect. Episode info is suppressed for the same
  // reason: the provider already prints the title/description over its own video.
  const providerOwnsTransport = iframeSource && !embedBridge.controllable;

  // ---------- Continue Watching: periodic progress + completed state ----------
  const saveProgress = useCallback((cur, dur) => {
    if (!dur || !isFinite(dur)) return;
    const history = meta?.history;
    if (history?.kind === 'tmdb') {
      API.post('/user/tmdb-watch-history', {
        ...history,
        progressSeconds: Math.floor(Math.min(cur, dur)),
        durationSeconds: Math.floor(dur),
      }).catch(() => {});
      return;
    }
    API.post('/user/watch-history', {
      titleId: history?.titleId || id,
      episodeId: history?.episodeId || episodeId || null,
      progressSeconds: Math.floor(Math.min(cur, dur)),
      durationSeconds: Math.floor(dur),
    }).catch(() => {});
  }, [id, episodeId, meta?.history]);

  // A framed provider that reports telemetry (vidsrc.su and mirrors) gives a REAL
  // position and runtime, so Continue Watching is exact instead of an estimate.
  const embedTelemetry = iframeSource && embedBridge.telemetry && embedBridge.duration > 0;
  useEffect(() => {
    if (!embedTelemetry) return undefined;
    const save = () => saveProgress(embedBridge.current, embedBridge.duration);
    const iv = setInterval(save, PROGRESS_MS);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      clearInterval(iv);
      save();
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', save);
    };
  }, [embedTelemetry, embedBridge.current, embedBridge.duration, saveProgress]);

  useEffect(() => {
    const iv = setInterval(() => {
      const el = videoRef.current;
      if (el && !el.paused && el.duration > 0) saveProgress(el.currentTime, el.duration);
    }, PROGRESS_MS);
    return () => {
      clearInterval(iv);
      const el = videoRef.current;
      if (el && el.duration > 0 && el.currentTime > 0) saveProgress(el.currentTime, el.duration);
    };
  }, [saveProgress]);

  const fallbackDurationSeconds = useMemo(() => {
    const epDur = Number(meta?.episode?.durationMinutes || 0) * 60;
    const titleDur = Number(meta?.title?.durationMinutes || 0) * 60;
    return Math.max(epDur || titleDur || 1800, 1800);
  }, [meta]);

  useEffect(() => {
    if (!meta || !iframeSource) return undefined;

    iframeProgressRef.current = { startedAt: Date.now(), elapsed: 0 };
    const flushProgress = () => {
      const elapsed = Math.max(1, Math.floor((Date.now() - iframeProgressRef.current.startedAt) / 1000));
      iframeProgressRef.current.elapsed = elapsed;
      if (elapsed > 0) saveProgress(Math.min(elapsed, fallbackDurationSeconds), fallbackDurationSeconds);
    };

    const tick = () => {
      flushProgress();
    };

    const iv = setInterval(tick, 15000);
    window.addEventListener('beforeunload', flushProgress);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushProgress();
    });

    return () => {
      clearInterval(iv);
      flushProgress();
      window.removeEventListener('beforeunload', flushProgress);
      document.removeEventListener('visibilitychange', flushProgress);
    };
  }, [meta, iframeSource, saveProgress, fallbackDurationSeconds]);
// ---------- lists the settings panel offers (all derived from real state) ----------
  const qualities = hls?.levels?.length
    ? [AUTO_QUALITY, ...hls.levels.map((l, i) => ({
        value: i,
        label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)} kbps`,
        key: `lvl-${i}`,
      }))]
    : [];

  const subtitles = hls?.subtitleTracks?.length
    ? hls.subtitleTracks.map((t, i) => ({ label: t.name || t.lang || `Subtitle ${i + 1}`, hlsIndex: i }))
    : (meta?.subtitles || []).filter((t) => t.url).map((t, i) => ({ label: t.label || t.language || `Subtitle ${i + 1}`, url: t.url, key: `sub-${i}` }));

  const audios = hls?.audioTracks?.length > 1
    ? hls.audioTracks.map((t, i) => ({ label: t.name || t.lang || `Audio ${i + 1}`, hlsIndex: i }))
    : (meta?.audio || []).filter((t) => t.url).map((t, i) => ({ label: t.label || t.language || `Audio ${i + 1}`, url: t.url, key: `aud-${i}` }));

  // ---------- episodes: current index + next episode ----------
  const currentIdx = currentEp
    ? episodes.findIndex((item) => String(item._id) === String(currentEp._id))
    : -1;
  const nextEp = currentIdx >= 0 && currentIdx < episodes.length - 1
    ? episodes[currentIdx + 1]
    : null;
  const hasEpisodeRail = titleTypeSupportsEpisodes(meta?.title?.type) && episodes.length > 0;
  const posterFallback = meta?.video?.thumbnail || '';
  const activeEpisode = currentEp || meta?.episode || null;

  // `title` and `video` are read by the "what is playing" values derived just below,
  // which run BEFORE the `if (!meta)` early return. The destructure therefore has to
  // live up here: leaving it further down put `title` in its temporal dead zone and
  // threw "Cannot access 'title' before initialization" on EVERY render — with no
  // ErrorBoundary that unmounts the app, which is exactly the blank player page.
  // `meta` is still null on the first render, hence the fallbacks; `title` also
  // defaults to {} so the derived block below can never dereference undefined.
  // Everything here is read-only, and the `if (!meta)` guard further down still
  // bails out before anything is painted.
  const { video, title = {} } = meta || {};
  const playerTitleLogo = playerLogoFailed ? '' : (title.logoUrl || playerLogoUrl);

  // One descriptor drives every piece of "what is playing" chrome, so a movie and
  // an episode get the SAME Netflix layout instead of the movie rendering blank.
  // Series show "S1:E4" plus the episode heading; a movie has no season/episode,
  // so it shows the film title as the heading and year as the context line.
  // Fall back to "no episode means movie" only when the type is unknown, so a
  // series that happens to be missing a type is never mislabelled as a movie.
  const isMovieTitle = title.type
    ? !titleTypeSupportsEpisodes(title.type)
    : !activeEpisode;
  const episodeCode = !isMovieTitle && activeEpisode
    ? `S${activeEpisode.seasonNumber}:E${activeEpisode.episodeNumber}`
    : '';
  const playbackHeading = isMovieTitle
    ? title.title
    : (activeEpisode?.title && activeEpisode.title !== `Episode ${activeEpisode.episodeNumber}`
      ? activeEpisode.title
      : (activeEpisode ? `Episode ${activeEpisode.episodeNumber}` : title.title));
  const playbackRuntime = isMovieTitle
    ? fmtRuntime(title.durationMinutes)
    : (activeEpisode?.durationMinutes > 0 ? `${activeEpisode.durationMinutes}m` : '');
  const playbackDescription = isMovieTitle
    ? (title.description || title.tagline)
    : (activeEpisode?.description || title.tagline);
  const hasPlaybackInfo = Boolean(isMovieTitle || activeEpisode);
  // Netflix's second title line: "S1:E4 · Episode Name" for an episode, and
  // just the release year for a movie (which has no season/episode to show).
  // Built with an escape so the separator never depends on file encoding.
  const playbackSubLine = [
    isMovieTitle ? title.releaseYear : episodeCode,
    isMovieTitle ? '' : (playbackHeading !== title.title ? playbackHeading : ''),
  ].filter(Boolean).join(' \u00b7 ');

  // ---------- skip markers (real admin markers win over the fallback windows) ----------
  const markers = meta?.markers || null;
  const recap = markers?.recapEnd > 0 ? { start: markers.recapStart || 0, end: markers.recapEnd } : DEFAULT_RECAP;
  const intro = markers?.introEnd > 0 ? { start: markers.introStart || 0, end: markers.introEnd } : DEFAULT_INTRO;

  // ---------- handlers ----------
  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {}); else el.pause();
  };

  const seekToRatio = (ratio) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    el.currentTime = Math.min(el.duration - 0.2, Math.max(0, ratio * el.duration));
    setProgress((p) => ({ ...p, cur: el.currentTime }));
  };

  const skipBy = (secs) => {
    const el = videoRef.current;
    if (!el || !isFinite(el.duration)) return;
    el.currentTime = Math.min(el.duration - 0.2, Math.max(0, el.currentTime + secs));
    setProgress((p) => ({ ...p, cur: el.currentTime }));
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  const changeVolume = (e) => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = Number(e.target.value);
    el.muted = el.volume === 0;
    setVolume(el.volume);
    setMuted(el.muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  const changeAutoPlayNext = (value) => {
    setAutoPlayNext(value);
    try { localStorage.setItem(AUTOPLAY_KEY, value ? '1' : '0'); } catch { /* private mode */ }
  };

  // Try again after a fatal playback error â€” re-attach from the position we were on.
  const retryPlayback = () => {
    const el = videoRef.current;
    const at = el && isFinite(el.currentTime) ? el.currentTime : startAt;
    setNetState('ok');
    setPlaybackError('');
    setBuffering(true);
    setStartAt(at);
    setRetryKey((k) => k + 1);
  };
const chooseQuality = (q) => {
    setQuality(q.value);
    if (hls) hls.currentLevel = q.value; // -1 = auto
    setSettingsTab(null);
  };

  const chooseSubtitle = (idx) => {
    setSubtitleIdx(idx);
    if (hls?.subtitleTracks?.length) {
      hls.subtitleTrack = idx;
      hls.subtitleDisplay = idx >= 0;
    }
    setSettingsTab(null);
  };

  const chooseAudio = (idx) => {
    setAudioIdx(idx);
    const track = audios[idx];
    if (!track) return;
    if (typeof track.hlsIndex === 'number') {
      hls.audioTrack = track.hlsIndex;
    } else if (track.url) {
      // separate audio file â†’ swap the source, keep the position
      setStartAt(videoRef.current?.currentTime || 0);
      setAudioOverride(track);
    }
    setSettingsTab(null);
  };

  const chooseSpeed = (value) => {
    setSpeed(value);
    setSettingsTab(null);
  };

  // ---------- episodes ----------
  const goToEpisode = (episodeOrId) => {
    const target = typeof episodeOrId === 'object' ? episodeOrId : episodes.find(
      (item) => String(item._id) === String(episodeOrId),
    );
    const eid = typeof episodeOrId === 'object' ? episodeOrId._id : episodeOrId;
    if (isTmdb) {
      const targetSeason = Number(target?.seasonNumber || seasonNumber);
      const targetEpisode = Number(target?.episodeNumber || episodeId);
      if (!targetEpisode) { setEpisodesOpen(true); return; }
      if (targetSeason === seasonNumber && targetEpisode === Number(episodeId)) {
        setEpisodesOpen(true);
        return;
      }
      const el = videoRef.current;
      if (!iframeSource && el?.duration > 0) saveProgress(el.currentTime, el.duration);
      el?.pause();
      setSettingsTab(null);
      setNextUp({ active: false, seconds: NEXT_UP_SECONDS });
      setSwitchingEpisode(true);
      setBuffering(true);
      setPlaying(false);
      setProgress({ cur: 0, dur: 0, buffered: 0 });
      setEpisodesOpen(true);
      if (target) {
        setCurrentEp(target);
        const nextSeason = seasons.findIndex(
          (season) => Number(season.seasonNumber) === targetSeason,
        );
        if (nextSeason >= 0) setSeasonIdx(nextSeason);
      }
      nav(`/watch/tmdb/${tmdbRouteId}?season=${targetSeason}&episode=${targetEpisode}`);
      return;
    }
    if (!eid || String(eid) === String(episodeId)) {
      setEpisodesOpen(true);
      return;
    }

    // Flush the current native position before swapping. The selected episode's own
    // saved position is then returned by /watch and applied by usePlayerSource.
    const el = videoRef.current;
    if (!iframeSource && el?.duration > 0) saveProgress(el.currentTime, el.duration);
    el?.pause();

    setSettingsTab(null);
    setNextUp({ active: false, seconds: NEXT_UP_SECONDS });
    setSwitchingEpisode(true);
    setBuffering(true);
    setPlaying(false);
    setProgress({ cur: 0, dur: 0, buffered: 0 });
    setEpisodesOpen(true);
    if (target) {
      setCurrentEp(target);
      const nextSeason = seasons.findIndex(
        (season) => Number(season.seasonNumber) === Number(target.seasonNumber),
      );
      if (nextSeason >= 0) setSeasonIdx(nextSeason);
    }
    nav(`/watch/${id}?episode=${eid}`);
  };

  const chooseSeason = (nextIndex) => {
    const season = seasons[nextIndex];
    if (!season) return;
    setSeasonIdx(nextIndex);
    setEpisodesOpen(true);
    setControlsVisible(true);
    if (!isTmdb) return;
    // TMDB seasons are loaded on demand, exactly like the detail modal does it.
    API.get(`/tmdb/season/${tmdbRouteId}/${season.seasonNumber}`)
      .then(({ data }) => {
        const first = [...(data.episodes || [])]
          .sort((a, b) => Number(a.episodeNumber) - Number(b.episodeNumber))[0];
        if (first) goToEpisode({ ...first, seasonNumber: season.seasonNumber });
        else setToast(`Season ${season.seasonNumber} has no episodes on TMDB yet.`);
      })
      .catch(() => setToast(`Could not load season ${season.seasonNumber}.`));
  };

  const nextEpisode = () => {
    if (nextEp) goToEpisode(nextEp._id);
  };

  // ---------- buffering / error states ----------
  const markBuffering = () => setBuffering(true);
  const clearBuffering = () => {
    setBuffering(false);
    setSwitchingEpisode(false);
    autoRetries.current = 0;
    startedRef.current = true;
  };

  // Fatal media-element error â†’ real error state (SRS Â§10 "Show error states")
  const onMediaError = () => {
    const code = videoRef.current?.error?.code;
    setBuffering(false);
    setSwitchingEpisode(false);
    setNetState('error');
    setPlaybackError(
      code === 1 ? 'Playback was interrupted.'
        : code === 2 ? 'A network error stopped the video.'
          : code === 3 ? 'This video could not be decoded.'
            : 'This video is not available right now.'
    );
  };

  const onEnded = () => {
    const el = videoRef.current;
    if (el?.duration) saveProgress(el.duration, el.duration); // record completed state
    setPlaying(false);
    clearBuffering();
    if (nextEp) {
      // "Automatically continue series episodes when enabled" â€” otherwise just offer it.
      setNextUp({ active: true, seconds: autoPlayNext ? NEXT_UP_SECONDS : 0 });
    } else {
      setToast('Youâ€™ve finished this one.');
    }
  };

  // ---------- controls auto-hide ----------
  const panelOpen = Boolean(settingsTab) || episodesOpen;
  const nudgeControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused && !panelOpen) setControlsVisible(false);
    }, 3000);
  };
// ---------- real playback rate + real subtitle track selection ----------
  useEffect(() => {
    const el = videoRef.current;
    if (el) el.playbackRate = speed;
  }, [speed, meta, audioOverride]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const tracks = el.textTracks || [];
    for (let i = 0; i < tracks.length; i += 1) tracks[i].mode = i === subtitleIdx ? 'showing' : 'hidden';
  }, [subtitleIdx, meta, hls]);

  // ---------- "up next" countdown (auto-continue series episodes) ----------
  useEffect(() => {
    if (!nextUp.active || nextUp.seconds <= 0) return undefined;
    const t = setTimeout(() => setNextUp((s) => ({ active: true, seconds: Math.max(0, s.seconds - 1) })), 1000);
    return () => clearTimeout(t);
  }, [nextUp]);

  useEffect(() => {
    if (nextUp.active && nextUp.seconds === 0 && autoPlayNext && nextEp) nextEpisode();
    // nextEpisode() navigates away, so this cannot re-fire for the same episode
  }, [nextUp.active, nextUp.seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- recover from a stalled / dropped stream ----------
  useEffect(() => {
    if (!buffering || playbackError || !startedRef.current
      || meta?.video?.type === 'embed' || meta?.video?.type === 'stremio') return undefined;
    const t = setTimeout(() => {
      if (autoRetries.current < MAX_AUTO_RETRIES) {
        autoRetries.current += 1;
        setNetState('recovering');
        retryPlayback();
      } else {
        setNetState('error');
        setBuffering(false);
        setPlaybackError('Playback stalled. Check your connection and try again.');
      }
    }, STALL_MS);
    return () => clearTimeout(t);
  }, [buffering, playbackError, meta]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- embedded-page watchdog ----------
  // The framed source page (embed/stremio) gets EMBED_STALL_MS to fire onLoad.
  // If it never does â€” source blocks framing, died, or is stuck on a redirect â€”
  // the "Open source page / Try again" fallback appears instead of a silent
  // black screen. Re-runs on every source swap and on "Try again" (embedNonce).
  useEffect(() => {
    const type = videoObj?.type;
    if (!videoObj?.url || (type !== 'embed' && type !== 'stremio')) return undefined;
    setEmbedState('loading');
    const t = setTimeout(() => {
      setEmbedState((s) => {
        if (s !== 'ready') setSwitchingEpisode(false);
        return s === 'ready' ? s : 'stuck';
      });
    }, EMBED_STALL_MS);
    return () => clearTimeout(t);
  }, [videoObj, embedNonce]);

  // ---------- toast auto-dismiss ----------
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------- fullscreen state (Esc / OS exit keeps the icon in sync) ----------
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // ---------- keyboard shortcuts (Netflix parity) ----------
  useEffect(() => {
    const onKey = (e) => {
      const el = videoRef.current;
      if (e.key === 'Escape') { setSettingsTab(null); setEpisodesOpen(false); return; }
      if (!el) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowLeft') skipBy(-10);
      else if (e.key === 'ArrowRight') skipBy(10);
      else if (e.key === 'm') toggleMute();
      else if (e.key === 'f') toggleFullscreen();
      else if (e.key === 'n') nextEpisode();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save the last position when the tab is closed / reloaded
  useEffect(() => {
    const onLeave = () => {
      const el = videoRef.current;
      if (el && el.duration > 0 && el.currentTime > 0) saveProgress(el.currentTime, el.duration);
      else if (meta && iframeSource) {
        const elapsed = Math.max(1, Math.floor((Date.now() - (iframeProgressRef.current.startedAt || Date.now())) / 1000));
        if (elapsed > 0) saveProgress(Math.min(elapsed, fallbackDurationSeconds), fallbackDurationSeconds);
      }
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [saveProgress, meta, iframeSource, fallbackDurationSeconds]);
const back = () => (window.history.state && window.history.state.idx > 0 ? nav(-1) : nav('/browse'));

  if (error) {
    return (
      <div className="player-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <button className="player-close" onClick={back} title="Close"><IconClose size={26} /></button>
        <h3 style={{ marginBottom: 8 }}>Canâ€™t play this right now</h3>
        <p style={{ color: '#b3b3b3', fontSize: 16, maxWidth: 520, textAlign: 'center' }}>{error}</p>
        <div className="player-error-actions" style={{ marginTop: 22 }}>
          <button className="btn-white" onClick={back}>Back to browse</button>
        </div>
      </div>
    );
  }
  if (!meta) return <div className="player-page player-loading-screen"><span className="player-loading-mark" role="status" aria-label="Loading">N</span></div>;

  // NOTE: `video` / `title` are destructured near the top of the component, before the
  // derived "what is playing" values that read them. Do not re-declare them here.

  // Skip Intro / Skip Recap (SRS Â§10). Recap is an episode-only concept; both windows
  // need enough runtime left so the buttons never cover a short clip.
  const showRecap = !iframeSource && Boolean(activeEpisode) && progress.dur > recap.end + 60
    && progress.cur >= recap.start && progress.cur < recap.end;
  const showIntro = !iframeSource && progress.dur > intro.end + 60
    && progress.cur >= intro.start && progress.cur < intro.end;
  const showNextEp = !iframeSource && Boolean(nextEp) && !nextUp.active
    && progress.dur > 0 && progress.dur - progress.cur < 30 && progress.dur - progress.cur > 1;

  return (
    <div className={`player-page ${switchingEpisode ? 'is-switching' : ''}`}
      onMouseMove={nudgeControls} onClick={nudgeControls}>
      {/* Netflix splits the screen: the video body owns the left column (and its own
          control bar), the episode drawer owns the right column. Because they are
          flex siblings rather than stacked overlays they can never overlap. */}
      <div className="player-body">
      <div className="player-stage">
        {(title.bannerUrl || title.posterUrl) && (
          <div
            className="player-backdrop"
            style={{ backgroundImage: `url(${title.bannerUrl || title.posterUrl})` }}
            aria-hidden="true"
          />
        )}
        {iframeSource ? (
          <>
            {externalOnly ? (
              /* Providers with X-Frame-Options (e.g. zenox.lol) can never render
                 inside a frame â€” skip the black box entirely and show the honest
                 "watch on the source site" panel right away. */
              <div className="player-error">
                <h3>This provider only plays on its own site</h3>
                <p>
                  <b>{title.title}</b> is served by a site that forbids being embedded in other
                  websites (X-Frame-Options). Open it there in a new tab â€” or update this title
                  in Admin with a direct video link (.mp4 / .m3u8) to play it right here.
                </p>
                <div className="player-error-actions">
                  <a className="btn-white" href={video.url} target="_blank" rel="noopener noreferrer">Open source page â†—</a>
                  <button className="btn-gray" onClick={back}>Back</button>
                </div>
              </div>
            ) : (
              <>
                {/* Some providers (especially YouTube) refuse to render correctly inside
                    a restricted sandbox. Keeping the embedded player un-sandboxed avoids
                    the blank-screen issue while the player remains visually isolated in-app. */}
                <iframe
                  ref={iframeRef}
                  key={`${embedNonce}-${activeEpisode?._id || episodeId || title.id}`}
                  className="player-iframe"
                  src={embedSourceUrl(video.url)}
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => { setEmbedState('ready'); setSwitchingEpisode(false); }}
                  title={title.title}
                />
                {/* Loading veil until the source page reports ready; stuck â†’ fallback */}
                {embedState !== 'ready' && (
                  <div className={`player-embed-veil${embedState === 'loading' ? ' is-loading' : ''}`}>
                    {embedState === 'loading' ? (
                      <span className="player-loading-mark" role="status" aria-label="Loading">N</span>
                    ) : (
                      <div className="player-error">
                        <h3>This source isnâ€™t loading inside the player</h3>
                        <p>The site providing this video doesnâ€™t support in-site playback right now. Open it on the source page, or re-check the link saved in Admin.</p>
                        <div className="player-error-actions">
                          <a className="btn-white" href={video.url} target="_blank" rel="noopener noreferrer">Open source page</a>
                          <button className="btn-gray" onClick={() => setEmbedNonce((n) => n + 1)}><IconRefresh size={18} /> Try again</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

          </>
        ) : (
          <>
            <video
              ref={videoRef}
              poster={posterFallback || undefined}
              preload="metadata"
              playsInline
              autoPlay
              onPlay={() => setPlaying(true)}
              onPlaying={() => { setPlaying(true); clearBuffering(); }}
              onPause={() => {
                setPlaying(false); setBuffering(false);
                const el = videoRef.current;
                if (el?.duration) saveProgress(el.currentTime, el.duration);
              }}
              onWaiting={markBuffering}
              onStalled={markBuffering}
              onLoadStart={markBuffering}
              onCanPlay={clearBuffering}
              onSeeked={() => {
                clearBuffering();
                const el = videoRef.current;
                if (el?.duration) saveProgress(el.currentTime, el.duration);
              }}
              onVolumeChange={(e) => { setMuted(e.target.muted); setVolume(e.target.volume); }}
              onLoadedMetadata={(e) => setProgress((p) => ({ ...p, dur: e.target.duration || 0 }))}
              onTimeUpdate={(e) => {
                const el = e.target;
                const buffered = el.buffered?.length ? el.buffered.end(el.buffered.length - 1) : 0;
                setProgress({ cur: el.currentTime, dur: el.duration || 0, buffered });
              }}
              onError={onMediaError}
              onEnded={onEnded}
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
            >
              {/* Real subtitle tracks (WebVTT) added by the admin for this title/episode */}
              {(meta.subtitles || []).filter((t) => t.url).map((t, i) => (
                <track
                  key={`${t.url}-${i}`}
                  kind="subtitles"
                  src={t.url}
                  srcLang={String(t.language || 'en').slice(0, 3)}
                  label={t.label || t.language || `Subtitle ${i + 1}`}
                />
              ))}
            </video>

            {/* Buffering state (SRS Â§10) â€” the site's spinner over the video */}
            {buffering && !playbackError && (
              <div className="player-buffering" role="status" aria-live="polite">
                <span className="player-loading-mark" role="status" aria-label="Loading">N</span>
              </div>
            )}

            {/* Transient network failure being retried â€” no scary error yet */}
            {netState === 'recovering' && !playbackError && (
              <div className="player-net-chip">Reconnectingâ€¦</div>
            )}

            {/* Error state (SRS Â§10) with one-tap retry + report */}
            {playbackError && (
              <div className="player-error" role="alert">
                <h3>Something went wrong</h3>
                <p>{playbackError}</p>
                <div className="player-error-actions">
                  <button className="btn-white" onClick={retryPlayback}><IconRefresh size={18} /> Try again</button>
                </div>
              </div>
            )}

            <div className="skip-stack">
              {showRecap && (
                <button className="skip-btn" onClick={() => skipBy(recap.end - progress.cur + 0.5)}>Skip Recap</button>
              )}
              {showIntro && (
                <button className="skip-btn" onClick={() => skipBy(intro.end - progress.cur + 0.5)}>Skip Intro</button>
              )}
              {showNextEp && <button className="next-ep-btn" onClick={nextEpisode}>Next Episode â€º</button>}
            </div>

            {nextUp.active && nextEp && (
              <div className="nextup-card">
                <img src={nextEp.thumbnailUrl || posterFallback} alt="" />
                <div className="nextup-body">
                  <span className="nextup-label">Up next{nextUp.seconds > 0 ? ` in ${nextUp.seconds}s` : ''}</span>
                  <b>S{nextEp.seasonNumber}:E{nextEp.episodeNumber} Â· {nextEp.title}</b>
                  <div className="nextup-actions">
                    <button className="btn-white" onClick={nextEpisode}>Play Episode</button>
                    <button className="btn-gray" onClick={() => setNextUp({ active: false, seconds: NEXT_UP_SECONDS })}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {toast && <div className="player-toast">{toast}</div>}
          </>
        )}
      </div>

      {/* ONE control surface for both playback kinds. It is absolutely positioned
          over the video inside .player-body, so it never steals height from the
          picture and can never collide with the episode drawer column. When the
          framed provider owns its own transport, PlayerControls renders no bar at
          all, so the provider's transport stays the only one on screen. */}
      <PlayerControls
        visible={controlsVisible && (!iframeSource || embedState === 'ready' || embedState === 'stuck')}
        playing={playing}
        muted={muted}
        volume={volume}
        progress={progress}
        embed={iframeSource ? embedBridge : null}
        title={title.title}
        episode={activeEpisode}
        fullscreen={fullscreen}
        settingsTab={settingsTab}
        onSettingsTab={setSettingsTab}
        onSettingsClose={() => setSettingsTab(null)}
        qualities={qualities}
        quality={quality}
        onQuality={chooseQuality}
        subtitles={subtitles}
        subtitleIdx={subtitleIdx}
        onSubtitle={chooseSubtitle}
        speeds={SPEEDS}
        speed={speed}
        onSpeed={chooseSpeed}
        audios={audios}
        audioIdx={audioIdx}
        onAudio={chooseAudio}
        autoPlayNext={autoPlayNext}
        onAutoPlayNext={changeAutoPlayNext}
        hasEpisodes={hasEpisodeRail}
        episodesOpen={episodesOpen}
        onToggleEpisodes={() => setEpisodesOpen((open) => !open)}
        onTogglePlay={togglePlay}
        onSeekRatio={seekToRatio}
        onToggleMute={toggleMute}
        onVolume={changeVolume}
        onBack10={() => skipBy(-10)}
        onFwd10={() => skipBy(10)}
        onFullscreen={toggleFullscreen}
      />

      {/* Paused-state transport cluster, positioned like the supplied Netflix frame. */}
      {!iframeSource && controlsVisible && !playing && !switchingEpisode && !playbackError && (
        <div className="player-center-controls" aria-label="Playback controls">
          <button type="button" onClick={() => skipBy(-10)} title="Back 10 seconds" aria-label="Back 10 seconds">
            <IconBack10 size={31} />
          </button>
          <button type="button" className="player-center-play" onClick={togglePlay}
            title="Play" aria-label="Play">
            <IconPlay size={43} />
          </button>
          <button type="button" onClick={() => skipBy(10)} title="Forward 10 seconds" aria-label="Forward 10 seconds">
            <IconFwd10 size={31} />
          </button>
        </div>
      )}

      {/* Now-playing identity. Works for BOTH movies and episodes from one layout:
          a series shows "S1:E4" + the episode heading, a movie shows the film
          title as the heading. Hidden when the framed provider paints its own
          card over the video, so the same text never appears twice. */}
      {controlsVisible && hasPlaybackInfo && !switchingEpisode && !providerOwnsTransport && (
        <section className="player-episode-info" aria-label="Now playing">
          {/* A movie's heading IS its title, so the small show-name line above it
              would repeat the same text. Series show the show name above the
              episode heading, which is what Netflix does. */}
          <div className="player-series-kicker"><span aria-hidden="true">N</span> {isMovieTitle ? 'FILM' : 'SERIES'}</div>
          {playerTitleLogo
            ? <img className="player-title-artwork" src={playerTitleLogo} alt={title.title} onError={() => setPlayerLogoFailed(true)} />
            : <div className="player-show-name">{title.title}</div>}
          <div className="player-episode-meta">
            {title.releaseYear ? <span>{title.releaseYear}</span> : null}
            {episodeCode ? <span>{episodeCode}</span> : null}
            {playbackRuntime ? <span>{playbackRuntime}</span> : null}
            {title.ageRating ? <span className="player-age">{title.ageRating}</span> : null}
          </div>
          {(!isMovieTitle || !playerTitleLogo) && <h1>{playbackHeading}</h1>}
          {playbackDescription
            ? <p>{playbackDescription}</p>
            : <p>{isMovieTitle
              ? 'Continue watching this movie.'
              : 'Continue watching this episode.'}</p>}
        </section>
      )}

      {/* Top chrome: back + show/episode title on the left (Netflix style), season
          picker / episode drawer / settings on the right. The title lives here
          rather than in the control bar so the bar stays a clean two-column row. */}
      <div className={`player-top-chrome ${controlsVisible ? '' : 'hidden'}`}>
        <div className="player-top-left">
          <button type="button" className="player-top-button player-back" onClick={back}
            title="Back" aria-label="Back to title">
            <IconChevronLeft size={25} />
          </button>
          <div className="player-top-titles">
            <span className="player-top-title">{title.title}</span>
            {playbackSubLine && (
              <span className="player-top-sub">{playbackSubLine}</span>
            )}
          </div>
        </div>
        <div className="player-top-actions">
          {hasEpisodeRail && (
            <button type="button" className={`player-top-button ${episodesOpen ? 'on' : ''}`}
              onClick={() => setEpisodesOpen((open) => !open)}
              title={episodesOpen ? 'Hide episodes' : 'Choose episode'}
              aria-label={episodesOpen ? 'Hide episodes' : 'Choose episode'}
              aria-pressed={episodesOpen}>
              <IconEpisodes size={21} />
            </button>
          )}
          {hasEpisodeRail && seasons.length > 1 && (
            <label className="player-season-picker">
              <span className="sr-only">Choose season</span>
              <select value={seasonIdx} onChange={(event) => chooseSeason(Number(event.target.value))}>
                {seasons.map((season, index) => (
                  <option key={season._id || season.seasonNumber} value={index}>
                    {season.name || `Season ${season.seasonNumber}`}
                  </option>
                ))}
              </select>
              <IconChevronDown size={17} />
            </label>
          )}
          {/* A provider-owned source has no bar of ours, so the settings sheet needs
              its own trigger up here. */}
          {providerOwnsTransport && (
            <button type="button" className={`player-top-button ${settingsTab ? 'on' : ''}`}
              onClick={() => setSettingsTab(settingsTab ? null : 'quality')}
              title="Settings" aria-label="Player settings" aria-pressed={Boolean(settingsTab)}>
              <IconSettings size={21} />
            </button>
          )}
          <button type="button" className="player-top-button player-close" onClick={back}
            title="Close" aria-label="Close player">
            <IconClose size={25} />
          </button>
        </div>
      </div>
      </div>

      {/* The episode drawer is a SIBLING column of the video body, not an overlay,
          so it can never cover the control bar or the episode info card. */}
      {hasEpisodeRail && (
            <PlayerEpisodes
              open={episodesOpen}
              seasons={seasons}
              seasonIdx={seasonIdx}
              poster={posterFallback}
              currentEpId={activeEpisode?._id || activeEpisode?.id || episodeId}
              currentProgress={embedTelemetry
                ? { cur: embedBridge.current, dur: embedBridge.duration }
                : progress}
              onSelect={goToEpisode}
              onSeasonChange={chooseSeason}
              onClose={() => setEpisodesOpen(false)}
            />
      )}

      {switchingEpisode && (
        <div className="player-switching" role="status" aria-live="polite">
          <span className="player-loading-mark" role="status" aria-label="Loading">N</span>
          <span>Loading episodeâ€¦</span>
        </div>
      )}
    </div>
  );
}
