const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Item = require('../models/Item');
const User = require('../models/User');
const axios = require('axios');
const auth = require('../middlewares/auth');

const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  desc: { type: String, default: '', trim: true },
  theme: { type: String, default: 'indigo' },
  category: { type: String, enum: ['games', 'movies'], default: 'games' },
  games: [{ title: String, imageUrl: String, releaseYear: Number, metacritic: Number, genres: [String], mediaType: String, runtimeMinutes: Number }],
  likes: { type: [String], default: [] },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

playlistSchema.index({ createdAt: -1 });
const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  tag: { type: String, default: 'Обговорення' },
  category: { type: String, enum: ['movies', 'games'], default: 'movies' },
  likes: { type: [String], default: [] },
  replies: [{
    username: String,
    avatar: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

discussionSchema.index({ createdAt: -1 });
const Discussion = mongoose.models.Discussion || mongoose.model('Discussion', discussionSchema);

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;
const normalizeTitle = (str) => str ? str.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, '') : '';

const ALLOWED_ITEM_FIELDS = [
  'title', 'mediaType', 'imageUrl', 'releaseYear', 'metacritic', 'genres',
  'status', 'personalRating', 'playtime', 'runtimeMinutes',
  'currentSeason', 'currentEpisode', 'totalEpisodes', 'comment', 'steamAppId'
];

const sanitizeItemPayload = (body = {}) => {
  const clean = {};
  for (const key of ALLOWED_ITEM_FIELDS) {
    if (body[key] !== undefined) {
      clean[key] = body[key];
    }
  }
  return clean;
};

let cachedTop100Movies = null;
let cachedTop100Time = 0;

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(getUserId(req)).select('-password');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { avatar, customTitle, accentColor, favoriteGameId } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      getUserId(req),
      { avatar, customTitle, accentColor, favoriteGameId },
      { returnDocument: 'after' }
    ).select('-password');
    res.json(updatedUser);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const statsByUser = await Item.aggregate([
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

    const statsMap = new Map(statsByUser.map(s => [String(s._id), s]));
    const users = await User.find().select('username avatar customTitle accentColor steamSynced').lean();

    const leaderboard = users.map(u => {
      const s = statsMap.get(String(u._id)) || {
        totalGames: 0, completedGames: 0, ratedCount: 0, commentedCount: 0, totalLikesReceived: 0, totalHours: 0
      };
      const totalHours = Math.round((Number(s.totalHours) || 0) * 10) / 10;
      const xp = (s.totalGames * 40) + (s.completedGames * 120) + (s.ratedCount * 30) + (s.commentedCount * 25) + (s.totalLikesReceived * 15) + Math.round(totalHours * 5);

      return {
        _id: u._id,
        username: u.username,
        avatar: u.avatar || 'cyber',
        customTitle: u.customTitle || 'Дослідник всесвітів',
        accentColor: u.accentColor || 'indigo',
        steamSynced: Boolean(u.steamSynced),
        totalGames: s.totalGames,
        completedGames: s.completedGames,
        totalHours,
        xp,
        level: Math.floor(xp / 200) + 1
      };
    });

    leaderboard.sort((a, b) => b.xp - a.xp);
    res.json(leaderboard.slice(0, 50));
  } catch (err) {
    res.status(500).json({ message: 'Помилка таблиці лідерів' });
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const feed = await Item.find({
      $or: [{ comment: { $exists: true, $ne: '' } }, { personalRating: { $ne: null } }]
    }).sort({ updatedAt: -1 }).limit(40).populate('user', 'username avatar accentColor customTitle').lean();
    res.json(feed.filter(item => item.user != null));
  } catch (err) { res.status(500).json({ message: "Помилка стрічки" }); }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const exists = await Item.exists({ _id: req.params.id, likes: userId });
    const updateOp = exists ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };

    const populated = await Item.findByIdAndUpdate(req.params.id, updateOp, { returnDocument: 'after' })
      .populate('user', 'username avatar accentColor customTitle')
      .lean();

    if (!populated) return res.status(404).json({ message: 'Не знайдено' });
    res.json(populated);
  } catch (err) { res.status(500).json({ message: 'Помилка лайку' }); }
});

router.get('/top-100-movies', auth, async (req, res) => {
  try {
    if (cachedTop100Movies && (Date.now() - cachedTop100Time < 3600000)) {
      return res.json(cachedTop100Movies);
    }
    const genreDict = { 28: 'Екшн', 12: 'Пригоди', 16: 'Анімація', 35: 'Комедія', 80: 'Кримінал', 18: 'Драма', 14: 'Фентезі', 27: 'Жахи', 9648: 'Детектив', 10749: 'Мелодрама', 878: 'Фантастика', 53: 'Трилер', 10752: 'Військовий' };
    if (process.env.TMDB_API_KEY) {
      const apiKey = process.env.TMDB_API_KEY.trim();
      const pages = [1, 2, 3, 4, 5];
      const responses = await Promise.allSettled(
        pages.map(p => axios.get(`https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=uk-UA&page=${p}`, { timeout: 6000 }))
      );
      const list = [];
      const seen = new Set();
      for (const r of responses) {
        if (r.status === 'fulfilled' && Array.isArray(r.value.data?.results)) {
          for (const m of r.value.data.results) {
            if (!m.poster_path || seen.has(m.id)) continue;
            seen.add(m.id);
            list.push({
              rawgId: `tmdb_movie_${m.id}`,
              title: m.title || m.original_title,
              mediaType: 'movie',
              imageUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
              releaseYear: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 2020,
              metacritic: m.vote_average ? Math.round(m.vote_average * 10) : 85,
              genres: (m.genre_ids || []).slice(0, 2).map(id => genreDict[id] || 'Кіно'),
              runtimeMinutes: 130
            });
          }
        }
      }
      if (list.length > 0) {
        cachedTop100Movies = list.slice(0, 100);
        cachedTop100Time = Date.now();
        return res.json(cachedTop100Movies);
      }
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: 'Помилка завантаження Топ-100 фільмів' });
  }
});

router.get('/discussions', auth, async (req, res) => {
  try {
    const list = await Discussion.find().sort({ createdAt: -1 }).limit(30).populate('user', 'username avatar accentColor').lean();
    res.json(list);
  } catch (err) { res.status(500).json({ message: 'Помилка завантаження обговорень' }); }
});

router.post('/discussions', auth, async (req, res) => {
  try {
    const { title, body, tag, category } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Заповни тему та текст' });
    const disc = new Discussion({ title: title.trim(), body: body.trim(), tag: tag || 'Обговорення', category: category || 'movies', user: getUserId(req) });
    await disc.save();
    const populated = await Discussion.findById(disc._id).populate('user', 'username avatar accentColor').lean();
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: 'Не вдалося створити обговорення' }); }
});

router.post('/discussions/:id/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Введи відповідь' });
    const user = await User.findById(getUserId(req)).lean();
    const populated = await Discussion.findByIdAndUpdate(
      req.params.id,
      { $push: { replies: { username: user?.username || 'Геймер', avatar: user?.avatar || 'cyber', text: text.trim() } } },
      { returnDocument: 'after' }
    ).populate('user', 'username avatar accentColor').lean();
    if (!populated) return res.status(404).json({ message: 'Тему не знайдено' });
    res.json(populated);
  } catch (err) { res.status(400).json({ message: 'Помилка відповіді' }); }
});

router.post('/discussions/:id/like', auth, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const exists = await Discussion.exists({ _id: req.params.id, likes: userId });
    const updateOp = exists ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
    const populated = await Discussion.findByIdAndUpdate(req.params.id, updateOp, { returnDocument: 'after' })
      .populate('user', 'username avatar accentColor').lean();
    if (!populated) return res.status(404).json({ message: 'Не знайдено' });
    res.json(populated);
  } catch (err) { res.status(500).json({ message: 'Помилка лайку' }); }
});

router.get('/trending', auth, async (req, res) => {
  try {
    const aggregateByMedia = async (isCinema) => {
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
        { $limit: 6 }
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
    };

    const [communityHits, cinemaHits] = await Promise.all([
      aggregateByMedia(false),
      aggregateByMedia(true)
    ]);

    const newReleases = [
      { rawgId: 101, title: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1643320/library_600x900.jpg', releaseYear: 2024, metacritic: 84, genres: ['Shooter', 'Survival'] },
      { rawgId: 102, title: 'Black Myth: Wukong', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2358720/library_600x900.jpg', releaseYear: 2024, metacritic: 82, genres: ['Action', 'RPG'] },
      { rawgId: 103, title: 'Elden Ring', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900.jpg', releaseYear: 2022, metacritic: 96, genres: ['RPG', 'Souls-like'] },
      { rawgId: 104, title: 'Cyberpunk 2077', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg', releaseYear: 2020, metacritic: 86, genres: ['RPG', 'Sci-Fi'] },
      { rawgId: 105, title: 'Baldur\'s Gate 3', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900.jpg', releaseYear: 2023, metacritic: 96, genres: ['RPG', 'Adventure'] },
      { rawgId: 106, title: 'Ghost of Tsushima DIRECTOR\'S CUT', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2215430/library_600x900.jpg', releaseYear: 2024, metacritic: 87, genres: ['Action', 'Adventure'] }
    ];

    res.json({ communityHits, cinemaHits, newReleases });
  } catch (err) { res.status(500).json({ message: 'Помилка трендів' }); }
});

router.get('/playlists', auth, async (req, res) => {
  try {
    const customPlaylists = await Playlist.find().sort({ createdAt: -1 }).populate('user', 'username avatar accentColor').lean();
    res.json(customPlaylists);
  } catch (err) { res.status(500).json({ message: 'Помилка плейлистів' }); }
});

router.post('/playlists', auth, async (req, res) => {
  try {
    const { title, desc, theme, category, games } = req.body;
    if (!title || !Array.isArray(games) || games.length === 0) return res.status(400).json({ message: 'Додай назву та тайтли' });
    const newPlaylist = new Playlist({ title: title.trim(), desc: (desc || '').trim(), theme: theme || 'indigo', category: category || 'games', games: games.slice(0, 12), user: getUserId(req) });
    await newPlaylist.save();
    const populated = await Playlist.findById(newPlaylist._id).populate('user', 'username avatar accentColor').lean();
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: 'Помилка створення плейлиста' }); }
});

router.post('/playlists/:id/like', auth, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const exists = await Playlist.exists({ _id: req.params.id, likes: userId });
    const updateOp = exists ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
    const populated = await Playlist.findByIdAndUpdate(req.params.id, updateOp, { returnDocument: 'after' })
      .populate('user', 'username avatar accentColor').lean();
    if (!populated) return res.status(404).json({ message: 'Не знайдено' });
    res.json(populated);
  } catch (err) { res.status(500).json({ message: 'Помилка лайку' }); }
});

router.delete('/playlists/:id', auth, async (req, res) => {
  try {
    await Playlist.findOneAndDelete({ _id: req.params.id, user: getUserId(req) });
    res.json({ message: 'Видалено' });
  } catch (err) { res.status(500).json({ message: 'Помилка видалення' }); }
});

router.get('/search', auth, async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  try {
    if (!process.env.RAWG_API_KEY) return res.status(500).json({ message: "Ключ RAWG не знайдено" });
    const response = await axios.get(`https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`);
    const results = response.data.results.map(game => ({
      rawgId: game.id, title: game.name, mediaType: 'game', imageUrl: game.background_image || '',
      releaseYear: game.released ? parseInt(game.released.substring(0, 4)) : null,
      metacritic: game.metacritic || null, genres: game.genres ? game.genres.map(g => g.name) : []
    }));
    res.json(results);
  } catch (err) { res.status(500).json({ message: "Помилка пошуку" }); }
});

router.get('/search-media', auth, async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) return res.json([]);
  try {
    if (process.env.TMDB_API_KEY) {
      const apiKey = process.env.TMDB_API_KEY.trim();
      const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=uk-UA&page=1`, { timeout: 6000 });
      const rawItems = (tmdbRes.data?.results || []).filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path)).slice(0, 6);
      const detailedItems = await Promise.all(rawItems.map(async (item) => {
        const isTv = item.media_type === 'tv';
        const dateStr = item.release_date || item.first_air_date || '';
        const isAnime = (item.genre_ids || []).includes(16) && (item.original_language === 'ja' || (item.origin_country || []).includes('JP'));
        let runtimeMinutes = isTv ? (isAnime ? 24 : 45) : 125;
        let totalEpisodes = null;
        let genres = [isAnime ? 'Аніме' : isTv ? 'Серіал' : 'Фільм'];
        try {
          const detailRes = await axios.get(`https://api.themoviedb.org/3/${isTv ? 'tv' : 'movie'}/${item.id}?api_key=${apiKey}&language=uk-UA`, { timeout: 3500 });
          const d = detailRes.data;
          if (d) {
            if (!isTv && d.runtime > 0) runtimeMinutes = d.runtime;
            if (isTv && Array.isArray(d.episode_run_time) && d.episode_run_time[0] > 0) runtimeMinutes = d.episode_run_time[0];
            if (isTv && d.number_of_episodes > 0) totalEpisodes = d.number_of_episodes;
            if (Array.isArray(d.genres) && d.genres.length > 0) genres = d.genres.slice(0, 2).map(g => g.name);
          }
        } catch (e) {}
        return {
          rawgId: `tmdb_${item.media_type}_${item.id}`, title: item.title || item.name,
          mediaType: isAnime ? 'anime' : isTv ? 'series' : 'movie',
          imageUrl: `https://image.tmdb.org/t/p/w500${item.poster_path || item.backdrop_path}`,
          releaseYear: dateStr ? parseInt(dateStr.substring(0, 4)) : null,
          metacritic: item.vote_average ? Math.round(item.vote_average * 10) : null,
          genres, runtimeMinutes, totalEpisodes
        };
      }));
      if (detailedItems.length > 0) return res.json(detailedItems);
    }
    res.json([]);
  } catch (err) { res.status(500).json({ message: "Помилка пошуку кіно" }); }
});

router.post('/steam-unlink', auth, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(getUserId(req), { steamSynced: false, steamId: '' }, { returnDocument: 'after' }).select('-password');
    res.json({ message: "Steam від'єднано", userProfile: updatedUser });
  } catch (err) { res.status(500).json({ message: "Помилка від'єднання Steam" }); }
});

router.get('/steam-live', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await User.findById(userId).lean();
    if (!user || !user.steamSynced || !user.steamId || !process.env.STEAM_API_KEY) {
      return res.json({ synced: false, inGame: false });
    }

    const summaryRes = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${user.steamId}`);
    const player = summaryRes.data?.response?.players?.[0];
    let inGame = Boolean(player && player.gameextrainfo);
    let gameTitle = player?.gameextrainfo || null;
    let matchedItemId = null;

    const userItems = await Item.find({ user: userId }).lean();

    try {
      const recentRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${user.steamId}`);
      const recentGames = recentRes.data?.response?.games || [];
      const bulkOps = [];

      for (const rg of recentGames) {
        const normRg = normalizeTitle(rg.name);
        const match = userItems.find(item => normalizeTitle(item.title) === normRg || item.steamAppId === rg.appid);
        if (match) {
          const freshHours = Math.round(((rg.playtime_forever || 0) / 60) * 10) / 10;
          if (freshHours > (match.playtime || 0)) {
            const nextStatus = (match.status === 'backlog' || match.status === 'wishlist') ? 'playing' : match.status;
            bulkOps.push({
              updateOne: {
                filter: { _id: match._id, user: userId },
                update: { $set: { playtime: freshHours, status: nextStatus } }
              }
            });
          }
        }
      }

      if (bulkOps.length > 0) {
        await Item.bulkWrite(bulkOps);
      }
    } catch (e) {}

    const updatedItems = await Item.find({ user: userId }).sort({ playtime: -1, createdAt: -1 }).lean();
    if (inGame && gameTitle) {
      const matched = updatedItems.find(i => normalizeTitle(i.title).includes(normalizeTitle(gameTitle)));
      if (matched) matchedItemId = matched._id;
    }
    res.json({ synced: true, inGame, gameTitle, matchedItemId, items: updatedItems });
  } catch (err) { res.json({ synced: false, inGame: false }); }
});

router.post('/steam-sync', auth, async (req, res) => {
  const { steamInput } = req.body;
  if (!steamInput || !process.env.STEAM_API_KEY) return res.status(400).json({ message: "Перевір Steam ID або STEAM_API_KEY" });
  try {
    let steamId = steamInput.trim().replace(/\/$/, '');
    if (steamId.includes('steamcommunity.com/profiles/')) steamId = steamId.split('steamcommunity.com/profiles/')[1].split('/')[0];
    else if (steamId.includes('steamcommunity.com/id/')) {
      const vanity = steamId.split('steamcommunity.com/id/')[1].split('/')[0];
      const resolveRes = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${vanity}`);
      if (resolveRes.data?.response?.success === 1) steamId = resolveRes.data.response.steamid;
      else return res.status(400).json({ message: "Не знайдено Steam профіль" });
    } else if (!/^\d{17}$/.test(steamId)) {
      const resolveRes = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`);
      if (resolveRes.data?.response?.success === 1) steamId = resolveRes.data.response.steamid;
      else return res.status(400).json({ message: "Неправильний Steam ID" });
    }

    const ownedRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`);
    const steamGames = ownedRes.data?.response?.games;
    if (!steamGames) return res.status(400).json({ message: "Профіль прихований" });

    const userId = getUserId(req);
    const userItems = await Item.find({ user: userId }).lean();
    let syncedCount = 0;
    let importedCount = 0;
    const bulkOps = [];

    for (const sg of [...steamGames].sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))) {
      if (!sg.name) continue;
      const hours = Math.round(((sg.playtime_forever || 0) / 60) * 10) / 10;
      const existingItem = userItems.find(item => normalizeTitle(item.title) === normalizeTitle(sg.name) || item.steamAppId === sg.appid);

      if (existingItem) {
        const updateFields = { steamAppId: sg.appid };
        if (hours > 0) {
          updateFields.playtime = hours;
          if (existingItem.status === 'backlog' || existingItem.status === 'wishlist') {
            updateFields.status = 'playing';
          }
          syncedCount++;
        }
        bulkOps.push({
          updateOne: {
            filter: { _id: existingItem._id, user: userId },
            update: { $set: updateFields }
          }
        });
      } else {
        importedCount++;
        bulkOps.push({
          insertOne: {
            document: {
              title: sg.name,
              mediaType: 'game',
              imageUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${sg.appid}/library_600x900.jpg`,
              playtime: hours,
              steamAppId: sg.appid,
              genres: ['Steam'],
              status: hours > 0 ? 'playing' : 'backlog',
              likes: [],
              user: userId
            }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await Item.bulkWrite(bulkOps);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { steamSynced: true, steamId }, { returnDocument: 'after' }).select('-password');
    const updatedItems = await Item.find({ user: userId }).sort({ playtime: -1, createdAt: -1 }).lean();
    res.json({ items: updatedItems, syncedCount, importedCount, userProfile: updatedUser });
  } catch (err) { res.status(500).json({ message: "Помилка Steam API" }); }
});

async function fetchExternalCatalogInfo(query, category = 'game') {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) return 'Назву для пошуку не вказано.';

  try {
    if (category === 'movie' && process.env.TMDB_API_KEY) {
      const tmdbKey = process.env.TMDB_API_KEY.trim();
      const searchRes = await axios.get(
        `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(cleanQuery)}&language=uk-UA&page=1`,
        { timeout: 5000 }
      );
      const top = (searchRes.data?.results || []).find(i => i.media_type === 'movie' || i.media_type === 'tv');
      if (top) {
        const title = top.title || top.name;
        const year = (top.release_date || top.first_air_date || '').substring(0, 4);
        const score = top.vote_average ? `${top.vote_average.toFixed(1)}/10` : 'немає';
        const overview = top.overview || 'Опис українською відсутній.';
        return `Знайдено в базі TMDB: «${title}» (${year || 'рік невідомий'}, тип: ${top.media_type === 'tv' ? 'серіал' : 'фільм'}, рейтинг TMDB: ${score}). Сюжет: ${overview}`;
      }
    }

    if (process.env.RAWG_API_KEY) {
      const rawgKey = process.env.RAWG_API_KEY.trim();
      const searchRes = await axios.get(
        `https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(cleanQuery)}&page_size=1`,
        { timeout: 5000 }
      );
      const topGame = searchRes.data?.results?.[0];
      if (topGame) {
        let description = '';
        try {
          const detailRes = await axios.get(`https://api.rawg.io/api/games/${topGame.id}?key=${rawgKey}`, { timeout: 4000 });
          description = (detailRes.data?.description_raw || '').slice(0, 600);
        } catch (e) {}
        const year = topGame.released ? topGame.released.substring(0, 4) : 'невідомий';
        const genres = (topGame.genres || []).map(g => g.name).join(', ');
        return `Знайдено в базі RAWG: гра «${topGame.name}» (${year} рік, жанри: ${genres}, Metacritic: ${topGame.metacritic || 'немає'}). Опис: ${description || 'детальний текстовий опис відсутній'}`;
      }
    }
  } catch (err) {
    return 'Не вдалося отримати дані із зовнішнього каталогу.';
  }
  return 'У каталозі нічого не знайдено за цим запитом.';
}

router.post('/ai-assistant', auth, async (req, res) => {
  try {
    const { prompt, mode, history = [] } = req.body;
    const isCinema = mode === 'movies';
    const userId = getUserId(req);

    const allUserItems = await Item.find({ user: userId }).sort({ playtime: -1 }).lean();
    
    const items = allUserItems.filter(i => {
      const type = i.mediaType || 'game';
      const isMedia = type === 'movie' || type === 'series' || type === 'anime';
      return isCinema ? isMedia : !isMedia;
    });

    const favorites = items
      .filter(i => Number(i.personalRating) >= 8)
      .sort((a, b) => Number(b.personalRating) - Number(a.personalRating))
      .slice(0, 12)
      .map(i => `«${i.title}» (оцінка: ${i.personalRating}/10, ${i.playtime || 0} год${i.comment ? `, відгук: "${i.comment}"` : ''})`);

    const disliked = items
      .filter(i => i.personalRating && Number(i.personalRating) <= 5)
      .slice(0, 6)
      .map(i => `«${i.title}» (${i.personalRating}/10${i.comment ? `, "${i.comment}"` : ''})`);

    const mostPlayed = items
      .filter(i => i.status !== 'wishlist')
      .slice(0, 15)
      .map(i => `«${i.title}» (${i.playtime || 0} год, статус: ${i.status})`);

    const backlogItems = items
      .filter(i => i.status === 'backlog')
      .slice(0, 20)
      .map(i => `«${i.title}» (${i.releaseYear || '—'})`);

    const genreCounts = {};
    items.forEach(i => {
      const weight = Number(i.personalRating) >= 8 ? 3 : Number(i.personalRating) && Number(i.personalRating) <= 5 ? 0 : 1;
      (i.genres || []).forEach(g => {
        if (g && g !== 'Steam') genreCounts[g] = (genreCounts[g] || 0) + weight;
      });
    });
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g]) => g);
    const totalHours = Math.round(items.reduce((acc, i) => acc + (Number(i.playtime) || 0), 0) * 10) / 10;

    const systemInstructionText = isCinema
      ? `Ти — харизматичний і дотепний кінокритик. Спілкуйся українською мовою живо, по-дружньому, з легким гумором. Завжди виділяй назви фільмів чи серіалів жирним шрифтом (**Назва**).
ВАЖЛИВЕ ПРАВИЛО: Ти консультуєш ТІЛЬКИ щодо кіно, серіалів та аніме. Якщо користувач питає про відеоігри, ти ПОВИНЕН відмовитися і сказати: "Я розбираюся тільки в кіно! Для ігор перейди у вкладку 'ШІ-Порадник Ігор'."
Ось дані про колекцію користувача:
- Улюблені жанри: ${topGenres.join(', ') || 'ще формуються'}.
- Шедеври: ${favorites.join('; ') || 'немає'}.
- Не сподобалося: ${disliked.join('; ') || 'немає'}.
- Найбільше годин: ${mostPlayed.join('; ') || 'порожньо'}.
- Беклог: ${backlogItems.join('; ') || 'порожньо'}.
Якщо користувач питає про конкретний фільм чи серіал, обов'язково виклич інструмент searchCatalogInfo.`
      : `Ти — досвідчений геймер та ігровий оглядач. Спілкуйся українською мовою як свій у дошку друг: конкретно і живо. Завжди виділяй назви ігор жирним шрифтом (**Назва**).
ВАЖЛИВЕ ПРАВИЛО: Ти консультуєш ТІЛЬКИ щодо відеоігор. Якщо користувач питає про фільми, серіали чи аніме, ти ПОВИНЕН відмовитися і сказати: "Я спеціалізуюся тільки на іграх! Щодо фільмів переходь у вкладку 'ШІ-Кінопорадник'."
Ось статистика гравця:
- Улюблені жанри: ${topGenres.join(', ') || 'ще формуються'}.
- Шедеври: ${favorites.join('; ') || 'немає'}.
- Розчарування: ${disliked.join('; ') || 'немає'}.
- Найбільше годин: ${mostPlayed.join('; ') || 'порожньо'}.
- Беклог: ${backlogItems.join('; ') || 'порожньо'}.
Якщо питають про сюжет гри — виклич інструмент searchCatalogInfo.`;

    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    let apiErrorMessage = '';
    let successReply = null;

    if (apiKey) {
      const messagesArray = [{ role: 'system', content: systemInstructionText }];
      
      const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
      for (const msg of recentHistory) {
        if (!msg || !msg.text) continue;
        messagesArray.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: String(msg.text)
        });
      }

      if (messagesArray.length === 1 || messagesArray[messagesArray.length - 1].role !== 'user') {
        messagesArray.push({ role: 'user', content: String(prompt) });
      }

      const toolsDeclaration = [{
        type: "function",
        function: {
          name: "searchCatalogInfo",
          description: "Шукає інформацію про сюжет та рейтинг гри, фільму, серіалу чи аніме в базах RAWG та TMDB.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Назва для пошуку" },
              category: { type: "string", enum: ["game", "movie"], description: "Категорія: game або movie" }
            },
            required: ["query", "category"]
          }
        }
      }];

      // КАСКАДНА СИСТЕМА: Першою йде знайдена тобою крута Qwen, резервом — стабільна Llama 3
      const modelsToTry = ['qwen/qwen3.8-27b', 'llama3-70b-8192'];

      for (const modelName of modelsToTry) {
        try {
          const firstResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: modelName,
              messages: messagesArray,
              tools: toolsDeclaration,
              temperature: 0.7,
              max_tokens: 1024
            },
            { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 15000 }
          );

          const msg = firstResponse.data.choices[0].message;

          if (msg.tool_calls && msg.tool_calls.length > 0) {
            const toolCall = msg.tool_calls[0];
            const args = JSON.parse(toolCall.function.arguments);
            const catalogData = await fetchExternalCatalogInfo(args.query || prompt, args.category || (isCinema ? 'movie' : 'game'));

            messagesArray.push(msg);
            messagesArray.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: catalogData
            });

            const secondResponse = await axios.post(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                model: modelName,
                messages: messagesArray,
                temperature: 0.7,
                max_tokens: 1024
              },
              { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 15000 }
            );

            successReply = secondResponse.data.choices[0].message.content.trim();
          } else {
            successReply = msg.content.trim();
          }
          
          if (successReply) break; 
          
        } catch (apiErr) {
          apiErrorMessage = apiErr.response?.data?.error?.message || apiErr.message;
          console.error(`Модель Groq ${modelName} впала:`, apiErrorMessage);
        }
      }

      if (successReply) {
        return res.json({ reply: successReply });
      }
    } else {
      apiErrorMessage = 'Ключ GROQ_API_KEY не знайдено у файлі .env';
    }

    const lowerPrompt = (prompt || '').toLowerCase();
    const asksAboutMovie = lowerPrompt.includes('фільм') || lowerPrompt.includes('серіал') || lowerPrompt.includes('аніме') || lowerPrompt.includes('кіно');
    const asksAboutGame = lowerPrompt.includes('гра') || lowerPrompt.includes('ігр') || lowerPrompt.includes('пограти');

    if (isCinema && asksAboutGame) {
      return res.json({ reply: "Я розбираюся тільки в кіно! Для ігор перейди у вкладку 'ШІ-Порадник Ігор'." });
    }
    if (!isCinema && asksAboutMovie) {
      return res.json({ reply: "Я спеціалізуюся тільки на іграх! Щодо фільмів переходь у вкладку 'ШІ-Кінопорадник'." });
    }

    const rawBacklog = items.filter(i => i.status === 'backlog');
    const rawFavorites = items.filter(i => Number(i.personalRating) >= 8).sort((a, b) => Number(b.personalRating) - Number(a.personalRating));
    let localReply = '';

    if (lowerPrompt.includes('про що') || lowerPrompt.includes('сюжет') || lowerPrompt.includes('розкажи про')) {
      const cleanedQuery = prompt.replace(/про що (гра|фільм|серіал|аніме)?|сюжет|розкажи про/gi, '').trim();
      const info = await fetchExternalCatalogInfo(cleanedQuery || prompt, isCinema ? 'movie' : 'game');
      localReply = `*(Увага: Швидке API тимчасово недоступне. Виводжу сирі дані з каталогу)*\n\n${info}`;
    } else if (lowerPrompt.includes('смак') || lowerPrompt.includes('аналіз') || lowerPrompt.includes('проаналізуй')) {
      const topThree = items.slice(0, 3).map(i => `**${i.title}** (${i.playtime || 0} год)`).join(', ');
      const favString = rawFavorites.length > 0
        ? `Твої найвище оцінені фаворити — ${rawFavorites.slice(0, 3).map(i => `**${i.title}** (${i.personalRating}/10)`).join(', ')}.`
        : 'Ти ще не встиг виставити багато високих оцінок!';
      localReply = `У твоєму ${isCinema ? 'кіновсесвіті' : 'ігровому профілі'} зараз **${items.length}** тайтлів та солідні **${totalHours} год**. Найбільше часу ти провів у ${topThree || 'своїх улюблених проєктах'}. ${favString}`;
    } else if (rawBacklog.length > 0 && (lowerPrompt.includes('пограти') || lowerPrompt.includes('подивитись') || lowerPrompt.includes('порадь'))) {
      const pick = rawBacklog[Math.floor(Math.random() * Math.min(rawBacklog.length, 8))];
      localReply = `Заглянув у твій беклог і раджу сьогодні ввечері увірватися в **${pick.title}**${pick.releaseYear ? ` (${pick.releaseYear})` : ''}! Це чудовий варіант для твоєї колекції.`;
    } else {
      localReply = `У твоїй колекції зараз **${items.length}** тайтлів. Запитай мене про твій смак, беклог або сюжет будь-якого тайтлу!`;
    }

    return res.json({
      reply: `${localReply}\n\n*(Технічна інформація: API Groq недоступне. Помилка: ${apiErrorMessage})*`
    });

  } catch (err) {
    res.status(500).json({ message: 'Помилка ШІ-помічника' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find({ user: getUserId(req) }).sort({ playtime: -1, createdAt: -1 }).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const cleanData = sanitizeItemPayload(req.body);
    const item = new Item({ ...cleanData, user: getUserId(req) });
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const cleanData = sanitizeItemPayload(req.body);
    const updatedItem = await Item.findOneAndUpdate(
      { _id: req.params.id, user: getUserId(req) },
      { $set: cleanData },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Тайтл не знайдено' });
    res.json(updatedItem);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Item.findOneAndDelete({ _id: req.params.id, user: getUserId(req) });
    res.json({ message: 'Видалено' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;