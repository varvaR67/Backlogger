// backend/src/routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');
const { createRateLimiter } = require('../middlewares/rateLimit');
const { calculateUserXpFromItems, calculateXpFromStats } = require('../utils/xp');
const {
  userRepository,
  itemRepository,
  playlistRepository,
  discussionRepository
} = require('../repositories');

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;
const normalizeTitle = (str) => (typeof str === 'string' ? str.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, '') : '');

const ALLOWED_YEARS = /^(\d{4}|2015-2019|2010-2014|2000s|classic)$/;
const ALLOWED_AVATAR_PRESETS = new Set(['cyber', 'ghost', 'rocket', 'crown', 'sword', 'shield']);
const ALLOWED_AVATAR_DOMAINS = [
  'steamstatic.com',
  'akamaihd.net',
  'gravatar.com',
  'githubusercontent.com',
  'imgur.com',
  'discordapp.com',
  'googleusercontent.com',
  'tmdb.org',
  'rawg.io'
];

function isValidAvatarValue(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (ALLOWED_AVATAR_PRESETS.has(trimmed)) return true;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_AVATAR_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

const ALLOWED_ITEM_FIELDS = [
  'title', 'mediaType', 'imageUrl', 'releaseYear', 'metacritic', 'genres',
  'status', 'personalRating', 'playtime', 'runtimeMinutes',
  'currentSeason', 'currentEpisode', 'totalEpisodes', 'comment', 'steamAppId', 'rawgId'
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

async function calculateUserXpStats(userId) {
  const items = await itemRepository.findForXp(userId);
  return calculateUserXpFromItems(items);
}

const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Забагато запитів до ШІ-помічника (максимум 10 на хвилину). Зачекай трохи!',
  getKey: (req) => String(getUserId(req) || req.ip)
});

let cachedTop100Movies = null;
let cachedTop100Time = 0;

router.get('/profile', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await userRepository.findById(userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const xpStats = await calculateUserXpStats(userId);
    res.json({ ...user, ...xpStats });
  } catch (err) {
    console.error('GET /profile error:', err);
    res.status(500).json({ message: 'Помилка завантаження профілю' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { avatar, customTitle, accentColor, favoriteGameId } = req.body || {};

    const updateData = {};
    if (avatar !== undefined) {
      const trimmedAvatar = String(avatar).trim();
      if (!isValidAvatarValue(trimmedAvatar)) {
        return res.status(400).json({
          message: 'Дозволені лише стандартні аватарки або безпечні HTTPS-посилання (Steam, Gravatar, Imgur, GitHub)'
        });
      }
      updateData.avatar = trimmedAvatar;
    }
    if (typeof customTitle === 'string') {
      updateData.customTitle = customTitle.trim().slice(0, 32);
    }
    if (typeof accentColor === 'string') {
      updateData.accentColor = accentColor.trim().slice(0, 20);
    }
    if (typeof favoriteGameId === 'string') {
      updateData.favoriteGameId = favoriteGameId.trim();
    }

    const updatedUser = await userRepository.updateById(userId, { $set: updateData });
    if (!updatedUser) return res.status(404).json({ message: 'Користувача не знайдено' });

    const xpStats = await calculateUserXpStats(userId);
    res.json({ ...updatedUser, ...xpStats });
  } catch (err) {
    console.error('PUT /profile error:', err);
    res.status(400).json({ message: 'Не вдалося оновити профіль' });
  }
});

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const statsByUser = await itemRepository.getLeaderboardStats();
    const statsMap = new Map(statsByUser.map(s => [String(s._id), s]));
    const users = await userRepository.findAll();

    const leaderboard = users.map(u => {
      const s = statsMap.get(String(u._id)) || {
        totalGames: 0, completedGames: 0, ratedCount: 0, commentedCount: 0, totalLikesReceived: 0, totalHours: 0
      };
      const xpData = calculateXpFromStats(s);

      return {
        _id: u._id,
        username: u.username,
        avatar: isValidAvatarValue(u.avatar) ? u.avatar : 'cyber',
        customTitle: u.customTitle || 'Дослідник всесвітів',
        accentColor: u.accentColor || 'indigo',
        steamSynced: Boolean(u.steamSynced),
        totalGames: xpData.totalGames,
        completedGames: xpData.completedGames,
        totalHours: xpData.totalHours,
        xp: xpData.xp,
        level: xpData.level
      };
    });

    leaderboard.sort((a, b) => b.xp - a.xp);
    res.json(leaderboard.slice(0, 50));
  } catch (err) {
    console.error('GET /leaderboard error:', err);
    res.status(500).json({ message: 'Помилка таблиці лідерів' });
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const feed = await itemRepository.getFeed(40);
    res.json(feed);
  } catch (err) {
    console.error('GET /feed error:', err);
    res.status(500).json({ message: 'Помилка стрічки' });
  }
});

router.post('/:id/like', auth, validateObjectId, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const populated = await itemRepository.toggleLike(req.params.id, userId);
    if (!populated) return res.status(404).json({ message: 'Не знайдено' });
    res.json(populated);
  } catch (err) {
    console.error('POST /:id/like error:', err);
    res.status(500).json({ message: 'Помилка лайку' });
  }
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
    console.error('GET /top-100-movies error:', err);
    res.status(500).json({ message: 'Помилка завантаження Топ-100 фільмів' });
  }
});

router.get('/discussions', auth, async (req, res) => {
  try {
    const list = await discussionRepository.findAll({}, 30);
    res.json(list);
  } catch (err) {
    console.error('GET /discussions error:', err);
    res.status(500).json({ message: 'Помилка завантаження обговорень' });
  }
});

router.post('/discussions', auth, async (req, res) => {
  try {
    const { title, body, tag, category } = req.body || {};
    if (typeof title !== 'string' || typeof body !== 'string' || !title.trim() || !body.trim()) {
      return res.status(400).json({ message: 'Заповни тему та текст' });
    }
    const populated = await discussionRepository.create({
      title: title.trim().slice(0, 150),
      body: body.trim().slice(0, 2000),
      tag: typeof tag === 'string' ? tag.trim().slice(0, 40) : 'Обговорення',
      category: category === 'games' ? 'games' : 'movies',
      user: getUserId(req)
    });
    res.status(201).json(populated);
  } catch (err) {
    console.error('POST /discussions error:', err);
    res.status(400).json({ message: 'Не вдалося створити обговорення' });
  }
});

router.post('/discussions/:id/reply', auth, validateObjectId, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ message: 'Введи відповідь' });
    const user = await userRepository.findById(getUserId(req));
    const populated = await discussionRepository.addReply(
      req.params.id,
      {
        username: user?.username || 'Геймер',
        avatar: user?.avatar || 'cyber',
        text: text.trim().slice(0, 1000)
      }
    );
    if (!populated) return res.status(404).json({ message: 'Тему не знайдено' });
    res.json(populated);
  } catch (err) {
    console.error('POST /discussions/:id/reply error:', err);
    res.status(400).json({ message: 'Помилка відповіді' });
  }
});

router.post('/discussions/:id/like', auth, validateObjectId, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const populated = await discussionRepository.toggleLike(req.params.id, userId);
    if (!populated) return res.status(404).json({ message: 'Не знайдено' });
    res.json(populated);
  } catch (err) {
    console.error('POST /discussions/:id/like error:', err);
    res.status(500).json({ message: 'Помилка лайку' });
  }
});

router.get('/trending', auth, async (req, res) => {
  try {
    const [communityHits, cinemaHits] = await Promise.all([
      itemRepository.getTrending(false),
      itemRepository.getTrending(true)
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
  } catch (err) {
    console.error('GET /trending error:', err);
    res.status(500).json({ message: 'Помилка трендів' });
  }
});

router.get('/playlists', auth, async (req, res) => {
  try {
    const customPlaylists = await playlistRepository.findAll();
    res.json(customPlaylists);
  } catch (err) {
    console.error('GET /playlists error:', err);
    res.status(500).json({ message: 'Помилка плейлистів' });
  }
});

router.post('/playlists', auth, async (req, res) => {
  try {
    const { title, desc, theme, category, games } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || !Array.isArray(games) || games.length === 0) {
      return res.status(400).json({ message: 'Додай назву та тайтли' });
    }
    const populated = await playlistRepository.create({
      title: title.trim().slice(0, 120),
      desc: typeof desc === 'string' ? desc.trim().slice(0, 500) : '',
      theme: typeof theme === 'string' ? theme : 'indigo',
      category: category === 'movies' ? 'movies' : 'games',
      games: games.slice(0, 12),
      user: getUserId(req)
    });
    res.status(201).json(populated);
  } catch (err) {
    console.error('POST /playlists error:', err);
    res.status(400).json({ message: 'Помилка створення плейлиста' });
  }
});

router.post('/playlists/:id/like', auth, validateObjectId, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const populated = await playlistRepository.toggleLike(req.params.id, userId);
    if (!populated) return res.status(404).json({ message: 'Не знайдено' });
    res.json(populated);
  } catch (err) {
    console.error('POST /playlists/:id/like error:', err);
    res.status(500).json({ message: 'Помилка лайку' });
  }
});

router.delete('/playlists/:id', auth, validateObjectId, async (req, res) => {
  try {
    await playlistRepository.deleteUserPlaylist(req.params.id, getUserId(req));
    res.json({ message: 'Видалено' });
  } catch (err) {
    console.error('DELETE /playlists/:id error:', err);
    res.status(500).json({ message: 'Помилка видалення' });
  }
});

router.get('/search', auth, async (req, res) => {
  const query = String(req.query.q || '').trim();
  const genre = String(req.query.genre || '').trim();
  const category = String(req.query.category || '').trim();
  const year = String(req.query.year || '').trim();
  const sort = String(req.query.sort || 'popular').trim();

  if (year && !ALLOWED_YEARS.test(year)) {
    return res.status(400).json({ message: 'Некоректний параметр року' });
  }

  if (!query && !genre && !category && !year) return res.json([]);

  try {
    if (!process.env.RAWG_API_KEY) return res.status(500).json({ message: 'Ключ RAWG не знайдено' });

    let url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&page_size=12`;
    if (query) url += `&search=${encodeURIComponent(query)}`;

    const tagsList = [];
    if (genre) {
      if (genre.startsWith('tag:')) {
        tagsList.push(genre.replace('tag:', ''));
      } else {
        url += `&genres=${encodeURIComponent(genre)}`;
      }
    }
    if (category) {
      tagsList.push(category);
    }
    if (tagsList.length > 0) {
      url += `&tags=${encodeURIComponent(tagsList.join(','))}`;
    }

    if (year) {
      if (year === '2015-2019') url += `&dates=2015-01-01,2019-12-31`;
      else if (year === '2010-2014') url += `&dates=2010-01-01,2014-12-31`;
      else if (year === '2000s') url += `&dates=2000-01-01,2009-12-31`;
      else if (year === 'classic') url += `&dates=1980-01-01,1999-12-31`;
      else url += `&dates=${encodeURIComponent(year)}-01-01,${encodeURIComponent(year)}-12-31`;
    }

    if (!query) {
      if (sort === 'rating') url += `&ordering=-metacritic`;
      else if (sort === 'newest') url += `&ordering=-released`;
      else url += `&ordering=-added`;
    }

    const response = await axios.get(url, { timeout: 7000 });
    let results = (response.data?.results || []).map(game => ({
      rawgId: game.id,
      title: game.name,
      mediaType: 'game',
      imageUrl: game.background_image || '',
      releaseYear: game.released ? parseInt(game.released.substring(0, 4)) : null,
      metacritic: game.metacritic || null,
      genres: game.genres ? game.genres.map(g => g.name) : []
    }));

    if (year) {
      results = results.filter(item => {
        const y = item.releaseYear;
        if (!y) return false;
        if (year === '2015-2019') return y >= 2015 && y <= 2019;
        if (year === '2010-2014') return y >= 2010 && y <= 2014;
        if (year === '2000s') return y >= 2000 && y <= 2009;
        if (year === 'classic') return y < 2000;
        return String(y) === String(year);
      });
    }

    res.json(results.slice(0, 10));
  } catch (err) {
    console.error('GET /search error:', err.message);
    res.status(500).json({ message: 'Помилка пошуку ігор' });
  }
});

router.get('/search-media', auth, async (req, res) => {
  const query = String(req.query.q || '').trim();
  const genre = String(req.query.genre || '').trim();
  const category = String(req.query.category || '').trim();
  const year = String(req.query.year || '').trim();
  const sort = String(req.query.sort || 'popular').trim();

  if (year && !ALLOWED_YEARS.test(year)) {
    return res.status(400).json({ message: 'Некоректний параметр року' });
  }

  if (!query && !genre && !category && !year) return res.json([]);

  try {
    if (!process.env.TMDB_API_KEY) return res.json([]);
    const apiKey = process.env.TMDB_API_KEY.trim();
    let rawItems = [];

    if (query) {
      const tmdbRes = await axios.get(
        `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=uk-UA&page=1`,
        { timeout: 6000 }
      );
      rawItems = (tmdbRes.data?.results || []).filter(
        item => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path)
      );

      if (genre) {
        const genreId = Number(genre);
        rawItems = rawItems.filter(item => Array.isArray(item.genre_ids) && item.genre_ids.includes(genreId));
      }
      if (year) {
        rawItems = rawItems.filter(item => {
          const itemYear = parseInt((item.release_date || item.first_air_date || '').substring(0, 4));
          if (!itemYear) return false;
          if (year === '2015-2019') return itemYear >= 2015 && itemYear <= 2019;
          if (year === '2010-2014') return itemYear >= 2010 && itemYear <= 2014;
          if (year === '2000s') return itemYear >= 2000 && itemYear <= 2009;
          if (year === 'classic') return itemYear < 2000;
          return String(itemYear) === String(year);
        });
      }
    } else {
      const isTvSearch = category === 'series' || category === 'anime';
      const typeEndpoint = isTvSearch ? 'tv' : 'movie';
      const sortParam = sort === 'rating' ? 'vote_average.desc&vote_count.gte=200' : sort === 'newest' ? (isTvSearch ? 'first_air_date.desc' : 'primary_release_date.desc') : 'popularity.desc';

      let discoverUrl = `https://api.themoviedb.org/3/discover/${typeEndpoint}?api_key=${apiKey}&language=uk-UA&sort_by=${sortParam}&page=1`;

      const genresToPass = [];
      if (genre) genresToPass.push(genre);
      if (category === 'anime' && !genresToPass.includes('16')) genresToPass.push('16');
      if (genresToPass.length > 0) discoverUrl += `&with_genres=${encodeURIComponent(genresToPass.join(','))}`;
      if (category === 'anime') discoverUrl += `&with_original_language=ja`;

      const dateField = isTvSearch ? 'first_air_date' : 'primary_release_date';
      if (year) {
        if (year === '2015-2019') discoverUrl += `&${dateField}.gte=2015-01-01&${dateField}.lte=2019-12-31`;
        else if (year === '2010-2014') discoverUrl += `&${dateField}.gte=2010-01-01&${dateField}.lte=2014-12-31`;
        else if (year === '2000s') discoverUrl += `&${dateField}.gte=2000-01-01&${dateField}.lte=2009-12-31`;
        else if (year === 'classic') discoverUrl += `&${dateField}.lte=1999-12-31`;
        else discoverUrl += `&${isTvSearch ? 'first_air_date_year' : 'primary_release_year'}=${encodeURIComponent(year)}`;
      }

      const discoverRes = await axios.get(discoverUrl, { timeout: 6000 });
      rawItems = (discoverRes.data?.results || [])
        .filter(item => item.poster_path || item.backdrop_path)
        .map(item => ({ ...item, media_type: typeEndpoint }));
    }

    const detailedItems = await Promise.all(rawItems.slice(0, 8).map(async (item) => {
      const isTv = item.media_type === 'tv';
      const dateStr = item.release_date || item.first_air_date || '';
      const isAnime = category === 'anime' || ((item.genre_ids || []).includes(16) && (item.original_language === 'ja' || (item.origin_country || []).includes('JP')));
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
        rawgId: `tmdb_${item.media_type}_${item.id}`,
        title: item.title || item.name,
        mediaType: isAnime ? 'anime' : isTv ? 'series' : 'movie',
        imageUrl: `https://image.tmdb.org/t/p/w500${item.poster_path || item.backdrop_path}`,
        releaseYear: dateStr ? parseInt(dateStr.substring(0, 4)) : null,
        metacritic: item.vote_average ? Math.round(item.vote_average * 10) : null,
        genres,
        runtimeMinutes,
        totalEpisodes
      };
    }));

    const finalFiltered = category && category !== 'all'
      ? detailedItems.filter(i => i.mediaType === category)
      : detailedItems;

    res.json(finalFiltered);
  } catch (err) {
    console.error('GET /search-media error:', err.message);
    res.status(500).json({ message: 'Помилка пошуку кіно' });
  }
});

router.post('/steam-unlink', auth, async (req, res) => {
  try {
    const updatedUser = await userRepository.updateSteamSync(getUserId(req), false, '');
    res.json({ message: "Steam від'єднано", userProfile: updatedUser });
  } catch (err) {
    console.error('POST /steam-unlink error:', err);
    res.status(500).json({ message: "Помилка від'єднання Steam" });
  }
});

router.get('/steam-live', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await userRepository.findById(userId);
    if (!user || !user.steamSynced || !user.steamId || !process.env.STEAM_API_KEY) {
      return res.json({ synced: false, inGame: false });
    }

    const summaryRes = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${encodeURIComponent(user.steamId)}`
    );
    const player = summaryRes.data?.response?.players?.[0];
    const inGame = Boolean(player && player.gameextrainfo);
    const gameTitle = player?.gameextrainfo || null;
    let matchedItemId = null;

    const userItems = await itemRepository.findByUser(userId);

    try {
      const recentRes = await axios.get(
        `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${encodeURIComponent(user.steamId)}`
      );
      const recentGames = recentRes.data?.response?.games || [];
      const bulkOps = [];

      for (const rg of recentGames) {
        const normRg = normalizeTitle(rg.name);
        const match = userItems.find(item => {
          if (item.steamAppId && String(item.steamAppId) === String(rg.appid)) return true;
          const normItem = normalizeTitle(item.title);
          return normRg.length > 0 && normItem.length > 0 && normItem === normRg;
        });

        if (match) {
          const freshHours = Math.round(((rg.playtime_forever || 0) / 60) * 10) / 10;
          if (freshHours > (Number(match.playtime) || 0)) {
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
        await itemRepository.bulkWrite(bulkOps);
      }
    } catch (e) {}

    const updatedItems = await itemRepository.findByUser(userId, { sort: { playtime: -1, createdAt: -1 } });
    if (inGame && gameTitle) {
      const normLive = normalizeTitle(gameTitle);
      if (normLive.length > 0) {
        const matched = updatedItems.find(i => {
          const normItem = normalizeTitle(i.title);
          return normItem.length > 0 && (normItem === normLive || normItem.includes(normLive));
        });
        if (matched) matchedItemId = matched._id;
      }
    }
    res.json({ synced: true, inGame, gameTitle, matchedItemId, items: updatedItems });
  } catch (err) {
    res.json({ synced: false, inGame: false });
  }
});

router.post('/steam-sync', auth, async (req, res) => {
  const steamInput = typeof req.body?.steamInput === 'string' ? req.body.steamInput.trim() : '';
  if (!steamInput || !process.env.STEAM_API_KEY) {
    return res.status(400).json({ message: 'Перевір Steam ID або STEAM_API_KEY' });
  }
  try {
    let steamId = steamInput.replace(/\/$/, '');
    if (steamId.includes('steamcommunity.com/profiles/')) {
      steamId = steamId.split('steamcommunity.com/profiles/')[1].split('/')[0];
    } else if (steamId.includes('steamcommunity.com/id/')) {
      const vanity = steamId.split('steamcommunity.com/id/')[1].split('/')[0];
      const resolveRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${encodeURIComponent(vanity)}`
      );
      if (resolveRes.data?.response?.success === 1) steamId = resolveRes.data.response.steamid;
      else return res.status(400).json({ message: 'Не знайдено Steam профіль' });
    } else if (!/^\d{17}$/.test(steamId)) {
      const resolveRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${encodeURIComponent(steamId)}`
      );
      if (resolveRes.data?.response?.success === 1) steamId = resolveRes.data.response.steamid;
      else return res.status(400).json({ message: 'Неправильний Steam ID' });
    }

    const ownedRes = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${encodeURIComponent(steamId)}&include_appinfo=1&include_played_free_games=1`
    );
    const steamGames = ownedRes.data?.response?.games;
    if (!steamGames) return res.status(400).json({ message: 'Профіль прихований' });

    const userId = getUserId(req);
    const userItems = await itemRepository.findByUser(userId);
    let syncedCount = 0;
    let importedCount = 0;
    const bulkOps = [];

    for (const sg of [...steamGames].sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))) {
      if (!sg.name) continue;
      const hours = Math.round(((sg.playtime_forever || 0) / 60) * 10) / 10;
      const normSg = normalizeTitle(sg.name);

      const existingItem = userItems.find(item => {
        if (item.steamAppId && String(item.steamAppId) === String(sg.appid)) return true;
        const normItem = normalizeTitle(item.title);
        return normSg.length > 0 && normItem.length > 0 && normItem === normSg;
      });

      if (existingItem) {
        const updateFields = { steamAppId: String(sg.appid) };
        if (hours > (Number(existingItem.playtime) || 0)) {
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
              title: String(sg.name).slice(0, 200),
              mediaType: 'game',
              imageUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${sg.appid}/library_600x900.jpg`,
              playtime: Math.min(100000, hours),
              steamAppId: String(sg.appid),
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
      await itemRepository.bulkWrite(bulkOps);
    }

    const updatedUser = await userRepository.updateSteamSync(userId, true, steamId);
    const updatedItems = await itemRepository.findByUser(userId, { sort: { playtime: -1, createdAt: -1 } });
    res.json({ items: updatedItems, syncedCount, importedCount, userProfile: updatedUser });
  } catch (err) {
    console.error('POST /steam-sync error:', err);
    res.status(500).json({ message: 'Помилка Steam API' });
  }
});

async function fetchExternalCatalogInfo(query, category = 'game') {
  const cleanQuery = String(query || '').trim();
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
        let avgPlaytime = 0;
        try {
          const detailRes = await axios.get(`https://api.rawg.io/api/games/${topGame.id}?key=${rawgKey}`, { timeout: 4000 });
          description = (detailRes.data?.description_raw || '').slice(0, 600);
          avgPlaytime = Number(detailRes.data?.playtime) || 0;
        } catch (e) {}
        const year = topGame.released ? topGame.released.substring(0, 4) : 'невідомий';
        const genres = (topGame.genres || []).map(g => g.name).join(', ');
        const playtimeStr = avgPlaytime > 0 ? `${avgPlaytime} год` : 'невідомо';
        return `Знайдено в базі RAWG: гра «${topGame.name}» (${year} рік, жанри: ${genres}, Metacritic: ${topGame.metacritic || 'немає'}, Середня тривалість за RAWG: ${playtimeStr}). Опис: ${description || 'детальний текстовий опис відсутній'}`;
      }
    }
  } catch (err) {
    return 'Не вдалося отримати дані із зовнішнього каталогу.';
  }
  return 'У каталозі нічого не знайдено за цим запитом.';
}

router.post('/ai-assistant', auth, aiRateLimiter, async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || '').slice(0, 500).trim();
    if (!prompt) {
      return res.status(400).json({ message: 'Запит не може бути порожнім' });
    }

    const mode = req.body?.mode === 'movies' ? 'movies' : 'games';
    const lang = ['uk', 'en', 'ru'].includes(req.body?.lang) ? req.body.lang : 'uk';
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const isCinema = mode === 'movies';
    const userId = getUserId(req);

    const allUserItems = await itemRepository.findByUser(userId, { sort: { playtime: -1 } });
    const items = allUserItems.filter(i => {
      const type = i.mediaType || 'game';
      const isMedia = type === 'movie' || type === 'series' || type === 'anime';
      return isCinema ? isMedia : !isMedia;
    });

    const lowerPrompt = prompt.toLowerCase();
    const asksAboutMovie = /(фільм|кіно|серіал|аніме|дивитис|подивитис|movie|series|anime|film)/i.test(lowerPrompt);
    const asksAboutGame = /(гра|гру|ігри|ігор|пограти|пройти|геймплей|game|play|gameplay)/i.test(lowerPrompt);

    if (isCinema && asksAboutGame && !asksAboutMovie) {
      const msgByLang = {
        uk: 'Я розбираюся тільки в кіно, серіалах та аніме! Щодо відеоігор переходь у вкладку **ШІ-Порадник Ігор**.',
        en: 'I specialize only in movies, series, and anime! For video games, please switch to the **AI Game Advisor** tab.',
        ru: 'Я разбираюсь только в кино, сериалах и аниме! По поводу видеоигр переходи во вкладку **ИИ-Советник Игр**.'
      };
      return res.json({ reply: msgByLang[lang] });
    }
    if (!isCinema && asksAboutMovie && !asksAboutGame) {
      const msgByLang = {
        uk: 'Я спеціалізуюся тільки на відеоіграх! Щодо фільмів та серіалів переходь у вкладку **ШІ-Кінопорадник**.',
        en: 'I specialize only in video games! For movies and series, please switch to the **AI Cinema Advisor** tab.',
        ru: 'Я специализируюсь только на видеоиграх! По поводу фильмов и сериалов переходи во вкладку **ИИ-Киносоветник**.'
      };
      return res.json({ reply: msgByLang[lang] });
    }

    const genreCounts = {};
    items.forEach(i => {
      const weight = Number(i.personalRating) >= 8 ? 3 : Number(i.personalRating) && Number(i.personalRating) <= 5 ? 0 : 1;
      (i.genres || []).forEach(g => {
        if (g && g !== 'Steam') genreCounts[g] = (genreCounts[g] || 0) + weight;
      });
    });
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g]) => g);
    const totalHours = Math.round(items.reduce((acc, i) => acc + (Number(i.playtime) || 0), 0) * 10) / 10;

    const langDirective =
      lang === 'en'
        ? 'Відповідай ТІЛЬКИ англійською мовою (English).'
        : lang === 'ru'
        ? 'Відповідай ТІЛЬКИ російською мовою (Русский).'
        : 'Відповідай ТІЛЬКИ українською мовою.';

    const systemInstructionText = isCinema
      ? `Ти — харизматичний, розумний кінокритик на платформі Backlogger. ${langDirective} Спілкуйся живо, дружньо і по суті. Назви завжди виділяй жирним (**Назва**).
Ти консультуєш виключно про кіно, серіали та аніме.
ВАЖЛИВО: Якщо питають про сюжет, акторів чи деталі конкретного фільму/серіалу, ОБОВ'ЯЗКОВО виклич інструмент searchCatalogInfo. АЛЕ ПЕРЕД ЦИМ переклади назву фільму англійською мовою (наприклад, "Початок" -> "Inception"). Якщо в отриманих даних немає потрібної інформації, так і скажи, нічого не вигадуй.
Дані про кіноколекцію користувача: ${items.length} тайтлів, ${totalHours} год. Улюблені жанри: ${topGenres.join(', ') || 'ще формуються'}.`
      : `Ти — досвідчений геймер та ігровий оглядач на платформі Backlogger. ${langDirective} Спілкуйся живо, конкретно і як свій друг. Назви ігор завжди виділяй жирним (**Назва**).
Ти консультуєш виключно про відеоігри.
ВАЖЛИВО: Якщо питають про сюжет гри, геймплей або скільки годин займає проходження (наприклад, Відьмак 3, Far Cry 5), ОБОВ'ЯЗКОВО виклич інструмент searchCatalogInfo. АЛЕ ПЕРЕД ЦИМ переклади назву гри англійською мовою (наприклад, "Відьмак 3" -> "The Witcher 3"). Якщо в отриманих даних немає потрібної інформації, так і скажи, нічого не вигадуй.
Статистика гравця: ${items.length} ігор, ${totalHours} год. Улюблені жанри: ${topGenres.join(', ') || 'ще формуються'}.`;

    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey) return res.json({ reply: 'API ключ не налаштовано.' });

    const messagesArray = [{ role: 'system', content: systemInstructionText }];
    const recentHistory = history.slice(-8);

    for (const msg of recentHistory) {
      if (!msg || typeof msg.text !== 'string') continue;
      const cleanText = msg.text.slice(0, 1000).trim();
      if (!cleanText) continue;
      messagesArray.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: cleanText
      });
    }

    if (messagesArray.length === 1 || messagesArray[messagesArray.length - 1].role !== 'user') {
      messagesArray.push({ role: 'user', content: prompt });
    }

    const toolsDeclaration = [{
      type: 'function',
      function: {
        name: 'searchCatalogInfo',
        description: 'Шукає сюжет, тривалість та рейтинг у базах RAWG та TMDB.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Назва АНГЛІЙСЬКОЮ мовою (English title)' },
            category: { type: 'string', enum: ['game', 'movie'] }
          },
          required: ['query', 'category']
        }
      }
    }];

    const modelsToTry = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'];
    let finalReply = '';

    for (const modelName of modelsToTry) {
      try {
        const currentMessages = [...messagesArray];

        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: modelName,
            messages: currentMessages,
            tools: toolsDeclaration,
            temperature: 0.7,
            max_tokens: 1200
          },
          { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
        );

        const msg = response.data?.choices?.[0]?.message;
        if (!msg) continue;

        if (msg.tool_calls && msg.tool_calls.length > 0) {
          const toolCall = msg.tool_calls[0];
          const args = JSON.parse(toolCall.function.arguments || '{}');

          const catalogData = await fetchExternalCatalogInfo(
            args.query || prompt,
            args.category || (isCinema ? 'movie' : 'game')
          );

          currentMessages.push({
            role: 'assistant',
            content: msg.content || '',
            tool_calls: msg.tool_calls
          });
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: catalogData || 'Інформацію не знайдено.'
          });

          const secondResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: modelName,
              messages: currentMessages,
              tools: toolsDeclaration,
              temperature: 0.7,
              max_tokens: 1200
            },
            { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
          );

          finalReply = (secondResponse.data?.choices?.[0]?.message?.content || '').trim();
        } else {
          finalReply = (msg.content || '').trim();
        }

        if (finalReply) {
          finalReply = finalReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          return res.json({ reply: finalReply });
        }
      } catch (apiErr) {
        console.error(`Модель ${modelName} повернула помилку:`, apiErr.response?.data?.error?.message || apiErr.message);
      }
    }

    return res.json({
      reply: 'Вибач, мої нейронні мережі зараз перевантажені або недоступні. Давай спробуємо ще раз через хвилинку!'
    });
  } catch (err) {
    console.error('POST /ai-assistant error:', err);
    res.status(500).json({ message: 'Помилка ШІ-помічника' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const items = await itemRepository.findByUser(getUserId(req), { sort: { playtime: -1, createdAt: -1 } });
    res.json(items);
  } catch (err) {
    console.error('GET /items error:', err);
    res.status(500).json({ message: 'Помилка завантаження колекції' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const currentCount = await itemRepository.countByUser(userId);
    if (currentCount >= 3000) {
      return res.status(400).json({ message: 'Досягнуто ліміт колекції (максимум 3000 тайтлів)' });
    }

    const cleanData = sanitizeItemPayload(req.body);
    const titleStr = typeof cleanData.title === 'string' ? cleanData.title.trim() : '';
    if (!titleStr) {
      return res.status(400).json({ message: 'Назва тайтла обовʼязкова' });
    }
    cleanData.title = titleStr;

    const mediaType = ['game', 'movie', 'series', 'anime'].includes(cleanData.mediaType)
      ? cleanData.mediaType
      : 'game';
    cleanData.mediaType = mediaType;

    const normNew = normalizeTitle(titleStr);
    const existingItems = await itemRepository.findTitlesByUserAndMediaType(userId, mediaType);
    const isDuplicate = existingItems.some(i => {
      const normExisting = normalizeTitle(i.title);
      if (normNew.length > 0 && normExisting.length > 0) {
        return normNew === normExisting;
      }
      return (i.title || '').trim().toLowerCase() === titleStr.toLowerCase();
    });

    if (isDuplicate) {
      return res.status(400).json({ message: 'Цей тайтл вже є у твоєму списку!' });
    }

    const newItem = await itemRepository.create({ ...cleanData, user: userId });
    res.status(201).json(newItem);
  } catch (err) {
    console.error('POST /items error:', err);
    res.status(400).json({ message: 'Не вдалося додати тайтл' });
  }
});

router.put('/:id', auth, validateObjectId, async (req, res) => {
  try {
    const cleanData = sanitizeItemPayload(req.body);
    const updatedItem = await itemRepository.updateUserItem(
      req.params.id,
      getUserId(req),
      cleanData
    );
    if (!updatedItem) return res.status(404).json({ message: 'Тайтл не знайдено' });
    res.json(updatedItem);
  } catch (err) {
    console.error('PUT /items/:id error:', err);
    res.status(400).json({ message: 'Не вдалося оновити тайтл' });
  }
});

router.delete('/:id', auth, validateObjectId, async (req, res) => {
  try {
    await itemRepository.deleteUserItem(req.params.id, getUserId(req));
    res.json({ message: 'Видалено' });
  } catch (err) {
    console.error('DELETE /items/:id error:', err);
    res.status(500).json({ message: 'Не вдалося видалити тайтл' });
  }
});

module.exports = router;
