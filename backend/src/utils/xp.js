// backend/src/utils/xp.js

const XP_CONFIG = {
  PER_GAME: 40,
  PER_COMPLETED: 120,
  PER_RATING: 30,
  PER_COMMENT: 25,
  PER_LIKE: 15,
  PER_HOUR: 5,
  XP_PER_LEVEL: 200
};

/**
 * Calculates XP, level, currentLevelXp, and xpProgress from aggregated user stats.
 *
 * @param {Object} stats
 * @param {number} [stats.totalGames=0]
 * @param {number} [stats.completedGames=0]
 * @param {number} [stats.ratedCount=0]
 * @param {number} [stats.commentedCount=0]
 * @param {number} [stats.totalLikesReceived=0]
 * @param {number} [stats.totalHours=0]
 * @returns {{ xp: number, level: number, currentLevelXp: number, xpProgress: number, totalHours: number }}
 */
function calculateXpFromStats({
  totalGames = 0,
  completedGames = 0,
  ratedCount = 0,
  commentedCount = 0,
  totalLikesReceived = 0,
  totalHours = 0
} = {}) {
  const safeGames = Math.max(0, Number(totalGames) || 0);
  const safeCompleted = Math.max(0, Number(completedGames) || 0);
  const safeRated = Math.max(0, Number(ratedCount) || 0);
  const safeCommented = Math.max(0, Number(commentedCount) || 0);
  const safeLikes = Math.max(0, Number(totalLikesReceived) || 0);
  const roundedHours = Math.round(Math.max(0, Number(totalHours) || 0) * 10) / 10;

  const xp =
    safeGames * XP_CONFIG.PER_GAME +
    safeCompleted * XP_CONFIG.PER_COMPLETED +
    safeRated * XP_CONFIG.PER_RATING +
    safeCommented * XP_CONFIG.PER_COMMENT +
    safeLikes * XP_CONFIG.PER_LIKE +
    Math.round(roundedHours * XP_CONFIG.PER_HOUR);

  const level = Math.floor(xp / XP_CONFIG.XP_PER_LEVEL) + 1;
  const currentLevelXp = xp % XP_CONFIG.XP_PER_LEVEL;
  const xpProgress = Math.round((currentLevelXp / XP_CONFIG.XP_PER_LEVEL) * 100);

  return {
    xp,
    level,
    currentLevelXp,
    xpProgress,
    totalHours: roundedHours
  };
}

/**
 * Computes raw stats and calculates XP from an array of item documents.
 * Automatically excludes items with status === 'wishlist'.
 *
 * @param {Array<Object>} items
 * @returns {{ xp: number, level: number, currentLevelXp: number, xpProgress: number, totalHours: number }}
 */
function calculateUserXpFromItems(items = []) {
  let totalGames = 0;
  let completedGames = 0;
  let ratedCount = 0;
  let commentedCount = 0;
  let totalLikesReceived = 0;
  let rawHours = 0;

  for (const item of items) {
    if (item.status === 'wishlist') continue;

    totalGames += 1;
    if (item.status === 'completed') completedGames += 1;
    if (item.personalRating != null && Number(item.personalRating) > 0) ratedCount += 1;
    if (typeof item.comment === 'string' && item.comment.trim().length > 0) commentedCount += 1;
    if (Array.isArray(item.likes)) totalLikesReceived += item.likes.length;
    rawHours += Number(item.playtime) || 0;
  }

  return calculateXpFromStats({
    totalGames,
    completedGames,
    ratedCount,
    commentedCount,
    totalLikesReceived,
    totalHours: rawHours
  });
}

module.exports = {
  XP_CONFIG,
  calculateXpFromStats,
  calculateUserXpFromItems
};

