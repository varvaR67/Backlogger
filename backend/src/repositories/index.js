// backend/src/repositories/index.js
const userRepository = require('./userRepository');
const itemRepository = require('./itemRepository');
const playlistRepository = require('./playlistRepository');
const discussionRepository = require('./discussionRepository');

module.exports = {
  userRepository,
  itemRepository,
  playlistRepository,
  discussionRepository
};

