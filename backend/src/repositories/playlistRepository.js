// backend/src/repositories/playlistRepository.js
const Playlist = require('../models/Playlist');

const playlistRepository = {
  /**
   * Find all playlists.
   * @param {Object} [filter={}]
   * @param {Object} [sort={ createdAt: -1 }]
   * @param {string} [populateUser='username avatar accentColor']
   */
  async findAll(filter = {}, sort = { createdAt: -1 }, populateUser = 'username avatar accentColor') {
    return Playlist.find(filter)
      .sort(sort)
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Find playlist by ID.
   * @param {string} id
   * @param {string} [populateUser='username avatar accentColor']
   */
  async findById(id, populateUser = 'username avatar accentColor') {
    return Playlist.findById(id)
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Create and populate a new playlist.
   * @param {Object} playlistData
   * @param {string} [populateUser='username avatar accentColor']
   */
  async create(playlistData, populateUser = 'username avatar accentColor') {
    const playlist = new Playlist(playlistData);
    await playlist.save();
    return Playlist.findById(playlist._id)
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Toggle user's like on a playlist.
   * @param {string} playlistId
   * @param {string} userId
   * @param {string} [populateUser='username avatar accentColor']
   */
  async toggleLike(playlistId, userId, populateUser = 'username avatar accentColor') {
    const hasLiked = await Playlist.exists({ _id: playlistId, likes: userId });
    const updateOp = hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };

    return Playlist.findByIdAndUpdate(playlistId, updateOp, { returnDocument: 'after' })
      .populate('user', populateUser)
      .lean();
  },

  /**
   * Delete a playlist owned by user.
   * @param {string} playlistId
   * @param {string} userId
   */
  async deleteUserPlaylist(playlistId, userId) {
    return Playlist.findOneAndDelete({ _id: playlistId, user: userId });
  },

  /**
   * Sync playlist indexes.
   */
  async syncIndexes() {
    return Playlist.syncIndexes();
  }
};

module.exports = playlistRepository;

