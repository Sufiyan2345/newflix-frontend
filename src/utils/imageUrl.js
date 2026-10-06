// ---------------------------------------------------------------------------
// Full-resolution artwork URLs.
//
// The catalogue serves EVERY image at a small bucket: TMDB at /t/p/w780 and the
// admin uploads at whatever Cloudinary handed back (often the raw original, but
// frequently a resized /image/upload/<transform>/ delivery URL). Those sizes are
// right for a 240px card and hopeless for the billboard — stretching a 780px
// file across a 1920px (or 3840px on a 4K monitor) full-bleed banner is exactly
// what read as a blurry header. hiRes() asks the CDN for the big file instead of
// scaling a small one up in CSS, so the pixels on screen are real pixels.
// ---------------------------------------------------------------------------

const TMDB_SIZE = /^https:\/\/image\.tmdb\.org\/t\/p\/[^/]+\//;

/** True for a TMDB CDN image (the only host whose size we rewrite). */
export const isTmdbImage = (url) => typeof url === 'string' && TMDB_SIZE.test(url);

/**
 * Upgrade one artwork URL to its highest useful resolution.
 *   • TMDB      → `original` (native size, up to 3840x2160 for 4K backdrops)
 *   • Cloudinary → append a size cap + best-quality/auto-format delivery chain
 *   • anything else (local uploads, static assets) → untouched
 */
export const hiRes = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (isTmdbImage(url)) return url.replace(TMDB_SIZE, 'https://image.tmdb.org/t/p/original/');

  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    const [head, ...rest] = url.split('/image/upload/');
    const path = rest.join('/image/upload/');
    if (!path) return url;
    // Cloudinary URL anatomy is
    //   /image/upload/<transform chain>/<version>/<public id>
    // and the transform chain is OPTIONAL. A delivery URL straight from the
    // upload response ("/image/upload/v1790379203/streamflix/banners/x.jpg")
    // has no chain at all, so its first segment is the version — not a
    // transform. Detecting the chain by "is there anything after it" therefore
    // bailed out on every un-transformed asset and returned the URL untouched.
    // A real transform component is always 1-2 letters + '_' (c_, w_, h_, ar_,
    // f_, q_, dpr_, e_, fl_); a version (v179...) and a public-id folder
    // (streamflix, banners) never are. So test the first segment itself.
    const [maybeChain, ...tail] = path.split('/');
    const hasTransform = /^[a-z]{1,2}_/i.test(maybeChain);
    const parts = hasTransform ? maybeChain.split(',') : [];
    // Drop any f_/q_ the URL already carries so the pair isn't duplicated.
    const base = parts.filter((p) => !/^(f_|q_)/.test(p));
    // A geometry transform already in the URL is the admin's choice (crop, size)
    // — never fight it, only ask for the best codec on top of it.
    const alreadySized = base.some((p) => /^(c_|w_|h_|ar_)/.test(p));
    const chain = alreadySized
      ? [...base, 'f_auto', 'q_auto:best'].join(',')
      : ['c_limit,w_3840', ...base, 'f_auto', 'q_auto:best'].join(',');
    const publicId = hasTransform ? tail.join('/') : path;
    return `${head}/image/upload/${chain}/${publicId}`;
  }
  return url;
};

export const cardImage = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (isTmdbImage(url)) return url.replace(TMDB_SIZE, 'https://image.tmdb.org/t/p/w500/');
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;
  return hiRes(url).replace(
    /(\/image\/upload\/)([^/]+)(\/)/,
    (match, prefix, transforms, suffix) => {
      const width = transforms.match(/(?:^|,)w_(\d+)(?=,|$)/);
      if (width && Number(width[1]) <= 900) return match;
      const resized = width
        ? transforms.replace(/(^|,)w_\d+(?=,|$)/, '$1w_900')
        : `${transforms},w_900`;
      return `${prefix}${resized}${suffix}`;
    },
  );
};

export default hiRes;
