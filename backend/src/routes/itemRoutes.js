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

const Discussion = mongoose.models.Discussion || mongoose.model('Discussion', discussionSchema);

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;
const normalizeTitle = (str) => str ? str.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, '') : '';

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
    const users = await User.find().select('username avatar customTitle accentColor steamSynced').lean();
    const allItems = await Item.find().lean();
    const leaderboard = users.map(u => {
      const uItems = allItems.filter(i => String(i.user) === String(u._id) && i.status !== 'wishlist');
      const total = uItems.length;
      const completed = uItems.filter(i => i.status === 'completed').length;
      const ratedCount = uItems.filter(i => i.personalRating).length;
      const commentedCount = uItems.filter(i => i.comment && i.comment.trim().length > 0).length;
      const totalLikesReceived = uItems.reduce((acc, i) => acc + (i.likes ? i.likes.length : 0), 0);
      const totalHours = Math.round(uItems.reduce((acc, i) => acc + (Number(i.playtime) || 0), 0) * 10) / 10;
      const xp = (total * 40) + (completed * 120) + (ratedCount * 30) + (commentedCount * 25) + (totalLikesReceived * 15) + Math.round(totalHours * 5);
      return {
        _id: u._id, username: u.username, avatar: u.avatar || 'cyber',
        customTitle: u.customTitle || 'Дослідник всесвітів', accentColor: u.accentColor || 'indigo',
        steamSynced: Boolean(u.steamSynced), totalGames: total, completedGames: completed,
        totalHours, xp, level: Math.floor(xp / 200) + 1
      };
    });
    leaderboard.sort((a, b) => b.xp - a.xp);
    res.json(leaderboard.slice(0, 50));
  } catch (err) { res.status(500).json({ message: 'Помилка таблиці лідерів' }); }
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
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Не знайдено' });
    if (!Array.isArray(item.likes)) item.likes = [];
    const idx = item.likes.indexOf(userId);
    if (idx === -1) item.likes.push(userId); else item.likes.splice(idx, 1);
    await item.save();
    const populated = await Item.findById(item._id).populate('user', 'username avatar accentColor customTitle').lean();
    res.json(populated);
  } catch (err) { res.status(500).json({ message: 'Помилка лайку' }); }
});

// ТОП-100 НАЙПОПУЛЯРНІШИХ ФІЛЬМІВ З TMDB (КЕШОВАНО)
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

// ОБГОВОРЕННЯ ТА ПИТАННЯ У СПІЛЬНОТІ (КІНО ТА ІГРИ)
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
    const disc = await Discussion.findById(req.params.id);
    if (!disc) return res.status(404).json({ message: 'Тему не знайдено' });
    disc.replies.push({ username: user?.username || 'Геймер', avatar: user?.avatar || 'cyber', text: text.trim() });
    await disc.save();
    const populated = await Discussion.findById(disc._id).populate('user', 'username avatar accentColor').lean();
    res.json(populated);
  } catch (err) { res.status(400).json({ message: 'Помилка відповіді' }); }
});

router.post('/discussions/:id/like', auth, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const disc = await Discussion.findById(req.params.id);
    if (!disc) return res.status(404).json({ message: 'Не знайдено' });
    const idx = disc.likes.indexOf(userId);
    if (idx === -1) disc.likes.push(userId); else disc.likes.splice(idx, 1);
    await disc.save();
    const populated = await Discussion.findById(disc._id).populate('user', 'username avatar accentColor').lean();
    res.json(populated);
  } catch (err) { res.status(500).json({ message: 'Помилка лайку' }); }
});

router.get('/trending', auth, async (req, res) => {
  try {
    const allItems = await Item.find({ status: { $ne: 'wishlist' } }).lean();
    const buildHits = (filterFn) => {
      const map = new Map();
      for (const item of allItems.filter(filterFn)) {
        const key = normalizeTitle(item.title);
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, {
            rawgId: item._id, title: item.title, mediaType: item.mediaType || 'game',
            imageUrl: item.imageUrl, releaseYear: item.releaseYear, metacritic: item.metacritic,
            genres: item.genres || [], playersCount: 0, playingNowCount: 0, totalHours: 0, ratings: []
          });
        }
        const entry = map.get(key);
        entry.playersCount += 1;
        if (item.status === 'playing') entry.playingNowCount += 1;
        entry.totalHours = Math.round((entry.totalHours + (Number(item.playtime) || 0)) * 10) / 10;
        if (item.personalRating) entry.ratings.push(Number(item.personalRating));
      }
      return Array.from(map.values()).map(g => ({
        ...g, avgCommunityRating: g.ratings.length > 0 ? (g.ratings.reduce((a, b) => a + b, 0) / g.ratings.length).toFixed(1) : null
      })).sort((a, b) => b.playersCount - a.playersCount || b.totalHours - a.totalHours).slice(0, 6);
    };

    const communityHits = buildHits(i => !i.mediaType || i.mediaType === 'game');
    const cinemaHits = buildHits(i => i.mediaType && i.mediaType !== 'game');

    let newReleases = [
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
    const pl = await Playlist.findById(req.params.id);
    if (!pl) return res.status(404).json({ message: 'Не знайдено' });
    const idx = pl.likes.indexOf(userId);
    if (idx === -1) pl.likes.push(userId); else pl.likes.splice(idx, 1);
    await pl.save();
    const populated = await Playlist.findById(pl._id).populate('user', 'username avatar accentColor').lean();
    res.json(populated);
  } catch (err) { res.status(500).json({ message: 'Помилка лайку' }); }
});

router.delete('/playlists/:id', auth, async (req, res) => {
  try {
    await Playlist.findOneAndDelete({ _id: req.params.id, user: getUserId(req) });
    res.json({ message: 'Видалено' });
  } catch (err) { res.status(500).json({ message: 'Помилка видалення' }); }
});

router.get('/search', async (req, res) => {
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

router.get('/search-media', async (req, res) => {
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
    const user = await User.findById(userId);
    if (!user || !user.steamSynced || !user.steamId || !process.env.STEAM_API_KEY) return res.json({ synced: false, inGame: false });
    const summaryRes = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${user.steamId}`);
    const player = summaryRes.data?.response?.players?.[0];
    let inGame = Boolean(player && player.gameextrainfo), gameTitle = player?.gameextrainfo || null, matchedItemId = null;
    try {
      const recentRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${user.steamId}`);
      for (const rg of (recentRes.data?.response?.games || [])) {
        const userItems = await Item.find({ user: userId });
        const match = userItems.find(item => normalizeTitle(item.title) === normalizeTitle(rg.name) || item.steamAppId === rg.appid);
        if (match) {
          const freshHours = Math.round(((rg.playtime_forever || 0) / 60) * 10) / 10;
          if (freshHours > (match.playtime || 0)) {
            match.playtime = freshHours;
            if (match.status === 'backlog' || match.status === 'wishlist') match.status = 'playing';
            await match.save();
          }
        }
      }
    } catch (e) {}
    const updatedItems = await Item.find({ user: userId }).sort({ playtime: -1, createdAt: -1 });
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
    const userItems = await Item.find({ user: userId });
    let syncedCount = 0, importedCount = 0;
    for (const sg of [...steamGames].sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))) {
      if (!sg.name) continue;
      const hours = Math.round(((sg.playtime_forever || 0) / 60) * 10) / 10;
      const existingItem = userItems.find(item => normalizeTitle(item.title) === normalizeTitle(sg.name));
      if (existingItem) {
        existingItem.steamAppId = sg.appid;
        if (hours > 0) { existingItem.playtime = hours; if (existingItem.status === 'backlog' || existingItem.status === 'wishlist') existingItem.status = 'playing'; syncedCount++; }
        await existingItem.save();
      } else {
        await new Item({ title: sg.name, mediaType: 'game', imageUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${sg.appid}/library_600x900.jpg`, playtime: hours, steamAppId: sg.appid, genres: ['Steam'], status: hours > 0 ? 'playing' : 'backlog', user: userId }).save();
        importedCount++;
      }
    }
    let updatedUser = await User.findByIdAndUpdate(userId, { steamSynced: true, steamId }, { returnDocument: 'after' });
    const updatedItems = await Item.find({ user: userId }).sort({ playtime: -1, createdAt: -1 });
    res.json({ items: updatedItems, syncedCount, importedCount, userProfile: updatedUser });
  } catch (err) { res.status(500).json({ message: "Помилка Steam API" }); }
});

// РОЗУМНИЙ ШІ-ПОРАДНИК З ЖИВИМ ПОШУКОМ СЮЖЕТІВ У TMDB, WIKIPEDIA ТА RAWG + GEMINI API
router.post('/ai-assistant', auth, async (req, res) => {
  try {
    const { prompt, mode } = req.body;
    const isCinema = mode === 'movies';
    const userId = getUserId(req);
    const allUserItems = await Item.find({ user: userId }).sort({ playtime: -1 });
    const items = allUserItems.filter(i => {
      const isMedia = i.mediaType === 'movie' || i.mediaType === 'series' || i.mediaType === 'anime';
      return isCinema ? isMedia : !isMedia;
    });

    const topList = items.slice(0, 15).map(i => `${i.title} (${i.playtime || 0} год)`).join(', ');
    const backlogList = items.filter(i => i.status === 'backlog');
    const backlogSample = backlogList.slice(0, 12).map(i => i.title).join(', ');

    // Витягуємо назву фільму/гри із запиту користувача для живого пошуку фактів
    const cleanTarget = (prompt || '')
      .replace(/про що (фільм|серіал|аніме|гра|кіно)|розкажи про (фільм|серіал|аніме|гру)?|сюжет (фільму|серіалу|гри)?|хто створив|варто дивитись|варто грати|\?/gi, '')
      .trim();

    let externalKnowledge = '';

    if (cleanTarget.length >= 2) {
      // 1. Шукаємо сюжет у TMDB українською (якщо запит про кіно або в режимі кіно)
      if (process.env.TMDB_API_KEY && (isCinema || /фільм|серіал|аніме|кіно/i.test(prompt))) {
        try {
          const tmdbSearch = await axios.get(
            `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY.trim()}&query=${encodeURIComponent(cleanTarget)}&language=uk-UA&page=1`,
            { timeout: 4000 }
          );
          const hit = (tmdbSearch.data?.results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv');
          if (hit) {
            const title = hit.title || hit.name;
            const year = (hit.release_date || hit.first_air_date || '').substring(0, 4);
            const score = hit.vote_average ? hit.vote_average.toFixed(1) : '8.0';
            let overview = hit.overview;
            if (!overview) {
              const enRes = await axios.get(`https://api.themoviedb.org/3/${hit.media_type}/${hit.id}?api_key=${process.env.TMDB_API_KEY.trim()}&language=ru-RU`, { timeout: 3000 });
              overview = enRes.data?.overview || '';
            }
            if (overview) {
              externalKnowledge = `«${title}» (${year ? year + ' рік, ' : ''}рейтинг TMDB: ${score}/10) — ${overview}`;
            }
          }
        } catch (e) {}
      }

      // 2. Якщо не знайшли в TMDB або це гра — шукаємо в українській Вікіпедії та RAWG
      if (!externalKnowledge) {
        try {
          const wikiSearch = await axios.get(
            `https://uk.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTarget + (isCinema ? ' фільм' : ' відеогра'))}&utf8=&format=json`,
            { timeout: 3500 }
          );
          const pageTitle = wikiSearch.data?.query?.search?.[0]?.title;
          if (pageTitle) {
            const wikiExtract = await axios.get(
              `https://uk.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json`,
              { timeout: 3500 }
            );
            const pages = wikiExtract.data?.query?.pages || {};
            const firstPage = Object.values(pages)[0];
            if (firstPage?.extract && firstPage.extract.length > 40) {
              externalKnowledge = firstPage.extract.split('\n')[0];
            }
          }
        } catch (e) {}
      }

      if (!externalKnowledge && process.env.RAWG_API_KEY && !isCinema) {
        try {
          const rawgSearch = await axios.get(`https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(cleanTarget)}&page_size=1`, { timeout: 3500 });
          const g = rawgSearch.data?.results?.[0];
          if (g) {
            const genres = (g.genres || []).map(x => x.name).join(', ');
            const year = g.released ? g.released.substring(0, 4) : '';
            externalKnowledge = `«${g.name}» (${year ? year + ' рік, ' : ''}жанр: ${genres || 'Екшн'}, Metacritic: ${g.metacritic || '85'}/100) — популярна відеогра з захопливим геймплеєм, деталізованим світом та високими оцінками гравців.`;
          }
        } catch (e) {}
      }
    }

    // 3. Якщо є GEMINI_API_KEY — генеруємо відповідь через актуальні моделі Gemini 2.5 / 2.0 / 1.5
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (apiKey) {
      const systemPrompt = `Ти розумний ${isCinema ? 'ШІ-Кінопорадник' : 'ігровий ШІ-Порадник'} у додатку Backlogger. Відповідай українською мовою, живо, цікаво і конкретно (3-5 речень).
Колекція користувача (${items.length} шт): ${topList || 'порожньо'}. Заплановано: ${backlogSample || 'порожньо'}.
${externalKnowledge ? `Довідкова інформація про запитаний тайтл: ${externalKnowledge}` : ''}`;

      const tryModel = async (modelName) => {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nЗапитання користувача: ${prompt}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
          },
          { timeout: 6500 }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty');
        return text.trim();
      };

      try {
        const aiReply = await Promise.any([
          tryModel('gemini-2.5-flash'),
          tryModel('gemini-2.0-flash'),
          tryModel('gemini-1.5-flash')
        ]);
        if (aiReply) return res.json({ reply: aiReply });
      } catch (e) {}
    }

    // 4. Якщо знайшли реальний сюжет у TMDB / Вікіпедії / RAWG — повертаємо його!
    if (externalKnowledge) {
      return res.json({ reply: externalKnowledge });
    }

    // 5. Розумні відповіді для рекомендацій на вечір та аналізу смаку
    const q = (prompt || '').toLowerCase();
    if (q.includes('вечір') || q.includes('сьогодні') || q.includes('подивит') || q.includes('пограт')) {
      if (backlogList.length > 0) {
        const pick = backlogList[Math.floor(Math.random() * backlogList.length)];
        return res.json({ reply: `Із твого списку запланованого (${backlogList.length} шт.) на сьогоднішній вечір ідеально підійде «${pick.title}» (${pick.genres?.join(', ') || 'хіт'})! Сміливо запускай і переводь у статус активного.` });
      }
      return res.json({ reply: isCinema ? `На вечір раджу увімкнути «Інтерстеллар», «Острів проклятих», «Дюна: Частина друга» або серіал «Пуститися берега». Також зазирни у наш каталог Топ-100 фільмів!` : `На вечір раджу запустити «Cyberpunk 2077», «The Witcher 3: Wild Hunt» або «Dying Light».` });
    }

    if (q.includes('смак') || q.includes('аналіз')) {
      const totalH = Math.round(items.reduce((acc, i) => acc + (Number(i.playtime) || 0), 0) * 10) / 10;
      return res.json({ reply: `У твоїй колекції вже ${items.length} тайтлів та ${totalH} год загального часу (фаворит — «${items[0]?.title || 'попереду'}»). У тебе чудовий смак на атмосферні та глибокі проєкти!` });
    }

    res.json({ reply: `Запитай мене про сюжет будь-якого фільму, серіалу чи гри (наприклад: «про що фільм Інтерстеллар» або «про що гра Dying Light»), попроси пораду на вечір або аналіз твоєї колекції!` });
  } catch (err) {
    res.status(500).json({ message: "Помилка ШІ-помічника" });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find({ user: getUserId(req) }).sort({ playtime: -1, createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const item = new Item({ ...req.body, user: getUserId(req) });
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updatedItem = await Item.findOneAndUpdate({ _id: req.params.id, user: getUserId(req) }, req.body, { returnDocument: 'after' });
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