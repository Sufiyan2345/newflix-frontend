// Client-side My List for TMDB titles. The server watchlist only accepts catalog
// titles (Mongo ObjectId refs), so TMDB items are stored per-profile here and
// merged into the My List page on top of the server list.

const KEY = (profileId) => `sf_tmdb_list_${profileId || 'anon'}`;
const LIKE_KEY = (profileId) => `sf_tmdb_likes_${profileId || 'anon'}`;
const DISLIKE_KEY = (profileId) => `sf_tmdb_dislikes_${profileId || 'anon'}`;

export const getTmdbList = (profileId) => {
  try { return JSON.parse(localStorage.getItem(KEY(profileId))) || []; }
  catch { return []; }
};

export const isTmdbInList = (profileId, itemId) =>
  getTmdbList(profileId).some((i) => i._id === itemId);

export const toggleTmdbList = (profileId, item) => {
  const list = getTmdbList(profileId);
  const exists = list.some((i) => i._id === item._id);
  const next = exists ? list.filter((i) => i._id !== item._id) : [{ ...item, _addedAt: Date.now() }, ...list];
  localStorage.setItem(KEY(profileId), JSON.stringify(next));
  // Let every open card / page re-render its + / ✓ state
  window.dispatchEvent(new CustomEvent('tmdb-list-changed', { detail: { itemId: item._id, inList: !exists } }));
  return !exists;
};

export const isTmdbLiked = (profileId, itemId) => {
  try { return (JSON.parse(localStorage.getItem(LIKE_KEY(profileId))) || []).includes(itemId); }
  catch { return false; }
};

export const isTmdbDisliked = (profileId, itemId) => {
  try { return (JSON.parse(localStorage.getItem(DISLIKE_KEY(profileId))) || []).includes(itemId); }
  catch { return false; }
};

const dispatchReactionChange = (profileId, itemId, liked, disliked) => {
  const detail = { itemId, profileId, liked, disliked };
  window.dispatchEvent(new CustomEvent('tmdb-like-changed', { detail }));
  window.dispatchEvent(new CustomEvent('tmdb-reaction-changed', { detail }));
};

export const toggleTmdbLike = (profileId, itemId) => {
  let likedIds = [];
  try { likedIds = JSON.parse(localStorage.getItem(LIKE_KEY(profileId))) || []; }
  catch { /* use an empty list if stored data is invalid */ }
  const liked = !likedIds.includes(itemId);
  const nextIds = liked ? [...likedIds, itemId] : likedIds.filter((id) => id !== itemId);
  localStorage.setItem(LIKE_KEY(profileId), JSON.stringify(nextIds));
  let dislikedIds = [];
  try { dislikedIds = JSON.parse(localStorage.getItem(DISLIKE_KEY(profileId))) || []; }
  catch { /* use an empty list if stored data is invalid */ }
  if (liked && dislikedIds.includes(itemId)) {
    dislikedIds = dislikedIds.filter((id) => id !== itemId);
    localStorage.setItem(DISLIKE_KEY(profileId), JSON.stringify(dislikedIds));
  }
  dispatchReactionChange(profileId, itemId, liked, false);
  return liked;
};

export const toggleTmdbDislike = (profileId, itemId) => {
  let dislikedIds = [];
  try { dislikedIds = JSON.parse(localStorage.getItem(DISLIKE_KEY(profileId))) || []; }
  catch { /* use an empty list if stored data is invalid */ }
  const disliked = !dislikedIds.includes(itemId);
  const nextIds = disliked ? [...dislikedIds, itemId] : dislikedIds.filter((id) => id !== itemId);
  localStorage.setItem(DISLIKE_KEY(profileId), JSON.stringify(nextIds));

  let likedIds = [];
  try { likedIds = JSON.parse(localStorage.getItem(LIKE_KEY(profileId))) || []; }
  catch { /* use an empty list if stored data is invalid */ }
  if (disliked && likedIds.includes(itemId)) {
    likedIds = likedIds.filter((id) => id !== itemId);
    localStorage.setItem(LIKE_KEY(profileId), JSON.stringify(likedIds));
  }
  dispatchReactionChange(profileId, itemId, false, disliked);
  return disliked;
};
