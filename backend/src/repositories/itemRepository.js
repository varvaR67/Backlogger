// backend/src/repositories/itemRepository.js
const Item = require('../models/Item');

const itemRepository = {
  /**
   * Find items belonging to a user.
   * @param {string} userId
   * @param {Object} [options]
   * @param {Object} [options.filter={}]
   * @param {Object} [options.sort]
   * @param {string|Object} [options.select]
   * @param {boolean} [options.lean=true]
   */
  async findByUser(userId, { filter = {}, sort, select, lean = true } = {}) {
    let query = Item.find({ user: userId, ...filter });
    if (sort) query = query.sort(sort);
    if (select) query = query.select(select);
    return lean ? query.lean() : query;
  },

  /**
   * Find items for XP calculation (excludes wishlist).
   * @param {string} userId
   */
  async findForXp(userId) {
    return Item.find({ user: userId, status: { $ne: 'wishlist' } })
      .select('status personalRating comment likes playtime')
      .lean();
  },

  /**
   * Count documents belonging to a user.
   * @param {string} userId
   * @param {Object} [filter={}]
   */
  async countByUser(userId, filter = {}) {
    return Item.countDocuments({ user: userId, ...filter });
  },

  /**
   * Find titles of a user's items for a specific mediaType (for duplicate checking).
   * @param {string} userId
   * @param {string} mediaType
   */
  async findTitlesByUserAndMediaType(userId, mediaType) {
    return Item.find({ user: userId, mediaType }).select('title').lean();
  },

  /**
   * Create and save a new item.
   * @param {Object} itemData
   */
  async create(itemData) {
    const item = new Item(itemData);
    return item.save();
  },

  /**
   * Update an item belonging to a specific user.
   * @param {string} itemId
   * @param {string} userId
   * @param {Object} updateData
   * @param {Object} [options]
   */
  async updateUserItem(itemId, userId, updateData, options = {}) {
    const defaultOptions = { returnDocument: 'after', runValidators: true };
    return Item.findOneAndUpdate(
      { _id: itemId, user: userId },
      { $set: updateData },
      { ...defaultOptions, ...options }
    );
  },

  /**
   * Delete an item belonging to a specific user.
   * @param {string} itemId
   * @param {string} userId
   */
  async deleteUserItem(itemId, userId) {
    return Item.findOneAndDelete({ _id: itemId, user: userId });
  },

  /**
   * Check if an item exists matching a filter.
   * @param {Object} filter
   */
  async exists(filter) {
    return Item.exists(filter);
  },

  /**
   * Find item by ID.
   * @param {string} id
   * @param {string|Object} [populate]
   * @param {boolean} [lean=true]
   */
  async findById(id, populate, lean = true) {
    let query = Item.findById(id);
    if (populate) query = query.populate(populate);
    return lean ? query.lean() : query;
  },

  /**
   * Toggle user's like on an item.
   * @param {string} itemId
   * @param {string} userId
   */
  async toggleLike(itemId, userId) {
    const hasLiked = await Item.exists({ _id: itemId, likes: userId });
    const updateOp = hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };

    return Item.findByIdAndUpdate(itemId, updateOp, { returnDocument: 'after' })
      .populate('user', 'username avatar accentColor customTitle')
      .lean();
  },

  /**
   * Aggregate statistics by user for leaderboard.
   */
  async getLeaderboardStats() {
    return Item.aggregate([
      { $match: { status: { $ne: 'wishlist' } } },
      {
        $project: {
          user: 1,
          isCompleted: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          isRated: { $cond: [{ $gt: ['$personalRating', null] }, 1, 0] },
          isCommented: {
            $cond: [
              { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: ['$comment', ''] } } } }, 0] },
              1,
              0
            ]
          },
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          playtime: { $ifNull: ['$playtime', 0] }
        }
      },
      {
        $group: {
          _id: '$user',
          totalGames: { $sum: 1 },
          completedGames: { $sum: '$isCompleted' },
          ratedCount: { $sum: '$isRated' },
          commentedCount: { $sum: '$isCommented' },
          totalLikesReceived: { $sum: '$likesCount' },
          totalHours: { $sum: '$playtime' }
        }
      }
    ]);
  },

  /**
   * Get public community activity feed.
   * @param {number} [limit=40]
   */
  async getFeed(limit = 40) {
    const feed = await Item.find({
      $or: [{ comment: { $exists: true, $ne: '' } }, { personalRating: { $ne: null } }]
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('user', 'username avatar accentColor customTitle')
      .lean();

    return feed.filter(item => item.user != null);
  },

  /**
   * Get trending items aggregated across the community.
   * @param {boolean} isCinema
   * @param {number} [limit=6]
   */
  async getTrending(isCinema, limit = 6) {
    const matchStage = isCinema
      ? { status: { $ne: 'wishlist' }, mediaType: { $in: ['movie', 'series', 'anime'] } }
      : { status: { $ne: 'wishlist' }, $or: [{ mediaType: 'game' }, { mediaType: { $exists: false } }] };

    const rows = await Item.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$title' } } },
          rawgId: { $first: '$_id' },
          title: { $first: '$title' },
          mediaType: { $first: { $ifNull: ['$mediaType', 'game'] } },
          imageUrl: { $first: '$imageUrl' },
          releaseYear: { $first: '$releaseYear' },
          metacritic: { $first: '$metacritic' },
          genres: { $first: '$genres' },
          playersCount: { $sum: 1 },
          playingNowCount: { $sum: { $cond: [{ $eq: ['$status', 'playing'] }, 1, 0] } },
          totalHours: { $sum: { $ifNull: ['$playtime', 0] } },
          avgRating: { $avg: '$personalRating' }
        }
      },
      { $sort: { playersCount: -1, totalHours: -1 } },
      { $limit: limit }
    ]);

    return rows.map(r => ({
      rawgId: r.rawgId,
      title: r.title,
      mediaType: r.mediaType,
      imageUrl: r.imageUrl,
      releaseYear: r.releaseYear,
      metacritic: r.metacritic,
      genres: r.genres || [],
      playersCount: r.playersCount,
      playingNowCount: r.playingNowCount,
      totalHours: Math.round((r.totalHours || 0) * 10) / 10,
      avgCommunityRating: r.avgRating ? Number(r.avgRating).toFixed(1) : null
    }));
  },

  /**
   * Execute bulk write operations.
   * @param {Array<Object>} ops
   */
  async bulkWrite(ops) {
    if (!ops || ops.length === 0) return null;
    return Item.bulkWrite(ops);
  },

  /**
   * Sync item indexes.
   */
  async syncIndexes() {
    return Item.syncIndexes();
  }
};

module.exports = itemRepository;

