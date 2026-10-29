// backend/src/repositories/discussionRepository.js
const Discussion = require('../models/Discussion');

const discussionRepository = {
  /**
   * Find discussions with pagination/limit.
   * @param {Object} [filter={}]
   * @param {number} [limit=30]
   * @param {Object} [sort={ createdAt: -1 }]
   * @param {string} [populateUser='username avatar accentColor']
   */
  async findAll(filter = {}, limit = 30, sort = { createdAt: -1 }, populateUser = 'username avatar accentColor') {
    return Discussion.find(filter)
      .sort(sort)
      .limit(limit)
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Find discussion by ID.
   * @param {string} id
   * @param {string} [populateUser='username avatar accentColor']
   */
  async findById(id, populateUser = 'username avatar accentColor') {
    return Discussion.findById(id)
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Create and populate a new discussion.
   * @param {Object} discussionData
   * @param {string} [populateUser='username avatar accentColor']
   */
  async create(discussionData, populateUser = 'username avatar accentColor') {
    const disc = new Discussion(discussionData);
    await disc.save();
    return Discussion.findById(disc._id)
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Add a reply to a discussion.
   * @param {string} discussionId
   * @param {Object} reply
   * @param {string} [populateUser='username avatar accentColor']
   */
  async addReply(discussionId, reply, populateUser = 'username avatar accentColor') {
    return Discussion.findByIdAndUpdate(
      discussionId,
      { $push: { replies: reply } },
      { returnDocument: 'after' }
    )
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Toggle user's like on a discussion.
   * @param {string} discussionId
   * @param {string} userId
   * @param {string} [populateUser='username avatar accentColor']
   */
  async toggleLike(discussionId, userId, populateUser = 'username avatar accentColor') {
    const hasLiked = await Discussion.exists({ _id: discussionId, likes: userId });
    const updateOp = hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };

    return Discussion.findByIdAndUpdate(discussionId, updateOp, { returnDocument: 'after' })
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Sync discussion indexes.
   */
  async syncIndexes() {
    return Discussion.syncIndexes();
  }
};

module.exports = discussionRepository;

