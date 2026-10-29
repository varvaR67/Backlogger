// backend/src/repositories/userRepository.js
const User = require('../models/User');

const USERNAME_COLLATION = { locale: 'en', strength: 2 };

const userRepository = {
  /**
   * Find a user by ID.
   * @param {string} id
   * @param {string|Object} [select='-password']
   * @param {boolean} [lean=true]
   */
  async findById(id, select = '-password', lean = true) {
    let query = User.findById(id);
    if (select) query = query.select(select);
    return lean ? query.lean() : query;
  },

  /**
   * Find a user by case-insensitive username.
   * @param {string} username
   * @param {string|Object} [select]
   */
  async findByUsername(username, select) {
    let query = User.findOne({ username }).collation(USERNAME_COLLATION);
    if (select) query = query.select(select);
    return query;
  },

  /**
   * Find a user by case-insensitive username including password field.
   * @param {string} username
   */
  async findByUsernameWithPassword(username) {
    return User.findOne({ username })
      .collation(USERNAME_COLLATION)
      .select('+password');
  },

  /**
   * Create and save a new user.
   * @param {Object} userData
   */
  async create(userData) {
    const user = new User(userData);
    return user.save();
  },

  /**
   * Update user by ID.
   * @param {string} id
   * @param {Object} updateData
   * @param {Object} [options]
   */
  async updateById(id, updateData, options = {}) {
    const defaultOptions = { returnDocument: 'after', runValidators: true };
    const query = User.findByIdAndUpdate(id, updateData, { ...defaultOptions, ...options });
    if (options.select) {
      query.select(options.select);
    } else {
      query.select('-password');
    }
    return options.lean !== false ? query.lean() : query;
  },

  /**
   * Update Steam sync info for a user.
   * @param {string} id
   * @param {boolean} steamSynced
   * @param {string} steamId
   */
  async updateSteamSync(id, steamSynced, steamId = '') {
    return User.findByIdAndUpdate(
      id,
      { steamSynced, steamId },
      { returnDocument: 'after' }
    ).select('-password');
  },

  /**
   * Find all users matching a filter.
   * @param {Object} [filter={}]
   * @param {string|Object} [select='username avatar customTitle accentColor steamSynced']
   */
  async findAll(filter = {}, select = 'username avatar customTitle accentColor steamSynced') {
    return User.find(filter).select(select).lean();
  },

  /**
   * Sync user indexes.
   */
  async syncIndexes() {
    return User.syncIndexes();
  }
};

module.exports = userRepository;

