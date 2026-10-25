const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Item = require('../models/Item');
const User = require('../models/User');
const axios = require('axios');
const auth = require('../middlewares/auth');

// Модель користувацьких публічних плейлистів
const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  desc: { type: String, default: '', trim: true },
  theme: { type: String, default: 'indigo' },
  games: [{
    title: String,
    imageUrl: String,
    releaseYear: Number,
    metacritic: Number,
    genres: [String]
  }],
  likes: { type: [String], default: [] },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;
const normalizeTitle = (str) => str ? str.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, '') : '';

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(getUserId(req)).select('-password');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
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
      const level = Math.floor(xp / 200) + 1;

      return {
        _id: u._id,
        username: u.username,
        avatar: u.avatar || 'cyber',
        customTitle: u.customTitle || 'Дослідник всесвітів',
        accentColor: u.accentColor || 'indigo',
        steamSynced: Boolean(u.steamSynced),
        totalGames: total,
        completedGames: completed,
        totalHours,
        xp,
        level
      };
    });

    leaderboard.sort((a, b) => b.xp - a.xp);
    res.json(leaderboard.slice(0, 50));
  } catch (err) {
    res.status(500).json({ message: 'Помилка завантаження таблиці лідерів' });
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const feed = await Item.find({
      $or: [
        { comment: { $exists: true, $ne: '' } },
        { personalRating: { $ne: null } }
      ]
    })
      .sort({ updatedAt: -1 })
      .limit(24)
      .populate('user', 'username avatar accentColor customTitle')
      .lean();

    const validFeed = feed.filter(item => item.user != null);
    res.json(validFeed);
  } catch (err) {
    res.status(500).json({ message: "Помилка завантаження стрічки спільноти" });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Відгук не знайдено' });

    if (!Array.isArray(item.likes)) item.likes = [];
    const idx = item.likes.indexOf(userId);
    if (idx === -1) {
      item.likes.push(userId);
    } else {
      item.likes.splice(idx, 1);
    }
    await item.save();

    const populated = await Item.findById(item._id)
      .populate('user', 'username avatar accentColor customTitle')
      .lean();

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Помилка лайку' });
  }
});

// ЖИВА АНАЛІТИКА СПІЛЬНОТИ + АВТОМАТИЧНІ НОВИНКИ ІНДУСТРІЇ
router.get('/trending', auth, async (req, res) => {
  try {
    // 1. Рахуємо реальну аналітику по всіх гравцях платформи
    const allItems = await Item.find({ status: { $ne: 'wishlist' } }).lean();
    const gameMap = new Map();

    for (const item of allItems) {
      const key = normalizeTitle(item.title);
      if (!key) continue;

      if (!gameMap.has(key)) {
        gameMap.set(key, {
          rawgId: item._id,
          title: item.title,
          imageUrl: item.imageUrl,
          releaseYear: item.releaseYear,
          metacritic: item.metacritic,
          genres: item.genres || [],
          playersCount: 0,
          playingNowCount: 0,
          totalHours: 0,
          ratings: []
        });
      }

      const entry = gameMap.get(key);
      entry.playersCount += 1;
      if (item.status === 'playing') entry.playingNowCount += 1;
      entry.totalHours = Math.round((entry.totalHours + (Number(item.playtime) || 0)) * 10) / 10;
      if (item.personalRating) entry.ratings.push(Number(item.personalRating));
      if (!entry.imageUrl && item.imageUrl) entry.imageUrl = item.imageUrl;
    }

    const communityHits = Array.from(gameMap.values())
      .map(g => ({
        ...g,
        avgCommunityRating: g.ratings.length > 0
          ? (g.ratings.reduce((a, b) => a + b, 0) / g.ratings.length).toFixed(1)
          : null
      }))
      .sort((a, b) => {
        if (b.playersCount !== a.playersCount) return b.playersCount - a.playersCount;
        return b.totalHours - a.totalHours;
      })
      .slice(0, 6);

    // 2. Автоматично підтягуємо свіжі релізи та новинки з RAWG API
    let newReleases = [];
    if (process.env.RAWG_API_KEY) {
      try {
        const currentYear = new Date().getFullYear();
        const response = await axios.get(
          `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&dates=${currentYear - 1}-01-01,${currentYear}-12-31&ordering=-added&page_size=6`,
          { timeout: 6000 }
        );
        newReleases = (response.data?.results || []).map(game => ({
          rawgId: game.id,
          title: game.name,
          imageUrl: game.background_image || '',
          releaseYear: game.released ? parseInt(game.released.substring(0, 4)) : currentYear,
          metacritic: game.metacritic || null,
          genres: game.genres ? game.genres.map(g => g.name).slice(0, 2) : ['Action']
        }));
      } catch (e) {}
    }

    if (newReleases.length === 0) {
      newReleases = [
        { rawgId: 101, title: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1643320/library_600x900.jpg', releaseYear: 2024, metacritic: 84, genres: ['Shooter', 'Survival'] },
        { rawgId: 102, title: 'Black Myth: Wukong', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2358720/library_600x900.jpg', releaseYear: 2024, metacritic: 82, genres: ['Action', 'RPG'] },
        { rawgId: 103, title: 'Elden Ring', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900.jpg', releaseYear: 2022, metacritic: 96, genres: ['RPG', 'Souls-like'] },
        { rawgId: 104, title: 'Cyberpunk 2077', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg', releaseYear: 2020, metacritic: 86, genres: ['RPG', 'Sci-Fi'] },
        { rawgId: 105, title: 'Baldur\'s Gate 3', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900.jpg', releaseYear: 2023, metacritic: 96, genres: ['RPG', 'Adventure'] },
        { rawgId: 106, title: 'Ghost of Tsushima DIRECTOR\'S CUT', imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2215430/library_600x900.jpg', releaseYear: 2024, metacritic: 87, genres: ['Action', 'Adventure'] }
      ];
    }

    res.json({ communityHits, newReleases });
  } catch (err) {
    res.status(500).json({ message: 'Помилка завантаження трендів' });
  }
});

// ОТРИМАТИ ВСІ ПУБЛІЧНІ ПЛЕЙЛИСТИ СПІЛЬНОТИ
router.get('/playlists', auth, async (req, res) => {
  try {
    const customPlaylists = await Playlist.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar accentColor')
      .lean();

    res.json(customPlaylists);
  } catch (err) {
    res.status(500).json({ message: 'Помилка завантаження плейлистів' });
  }
});

// СТВОРИТИ НОВИЙ КОРИСТУВАЦЬКИЙ ПЛЕЙЛИСТ
router.post('/playlists', auth, async (req, res) => {
  try {
    const { title, desc, theme, games } = req.body;
    if (!title || !Array.isArray(games) || games.length === 0) {
      return res.status(400).json({ message: 'Вкажи назву та додай хоча б одну гру до плейлиста' });
    }

    const newPlaylist = new Playlist({
      title: title.trim(),
      desc: (desc || '').trim(),
      theme: theme || 'indigo',
      games: games.slice(0, 8),
      user: getUserId(req)
    });

    await newPlaylist.save();
    const populated = await Playlist.findById(newPlaylist._id)
      .populate('user', 'username avatar accentColor')
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: 'Не вдалося створити плейлист' });
  }
});

// ЛАЙКНУТИ ПЛЕЙЛИСТ
router.post('/playlists/:id/like', auth, async (req, res) => {
  try {
    const userId = String(getUserId(req));
    const pl = await Playlist.findById(req.params.id);
    if (!pl) return res.status(404).json({ message: 'Плейлист не знайдено' });

    const idx = pl.likes.indexOf(userId);
    if (idx === -1) pl.likes.push(userId);
    else pl.likes.splice(idx, 1);

    await pl.save();
    const populated = await Playlist.findById(pl._id)
      .populate('user', 'username avatar accentColor')
      .lean();

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Помилка лайку плейлиста' });
  }
});

// ВИДАЛИТИ СВІЙ ПЛЕЙЛИСТ
router.delete('/playlists/:id', auth, async (req, res) => {
  try {
    await Playlist.findOneAndDelete({ _id: req.params.id, user: getUserId(req) });
    res.json({ message: 'Плейлист видалено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка видалення плейлиста' });
  }
});

router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  try {
    if (!process.env.RAWG_API_KEY) return res.status(500).json({ message: "Ключ RAWG не знайдено" });
    const response = await axios.get(`https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`);
    const results = response.data.results.map(game => ({
      rawgId: game.id,
      title: game.name,
      imageUrl: game.background_image || '',
      releaseYear: game.released ? parseInt(game.released.substring(0, 4)) : null,
      metacritic: game.metacritic || null,
      genres: game.genres ? game.genres.map(g => g.name) : []
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Помилка пошуку" });
  }
});

router.post('/steam-unlink', auth, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      getUserId(req),
      { steamSynced: false, steamId: '' },
      { returnDocument: 'after' }
    ).select('-password');
    res.json({ message: "Steam успішно від'єднано", userProfile: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Помилка від'єднання Steam" });
  }
});

router.get('/steam-live', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await User.findById(userId);
    if (!user || !user.steamSynced || !user.steamId || !process.env.STEAM_API_KEY) {
      return res.json({ synced: false, inGame: false });
    }

    const summaryRes = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${user.steamId}`
    );
    const player = summaryRes.data?.response?.players?.[0];
    let inGame = false, gameTitle = null, matchedItemId = null;

    if (player && player.gameextrainfo) {
      inGame = true;
      gameTitle = player.gameextrainfo;
    }

    try {
      const recentRes = await axios.get(
        `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${user.steamId}`
      );
      const recentGames = recentRes.data?.response?.games || [];
      if (recentGames.length > 0) {
        const userItems = await Item.find({ user: userId });
        for (const rg of recentGames) {
          const normRg = normalizeTitle(rg.name);
          const match = userItems.find(item => normalizeTitle(item.title) === normRg || item.steamAppId === rg.appid);
          if (match) {
            const freshHours = Math.round(((rg.playtime_forever || 0) / 60) * 10) / 10;
            if (freshHours > (match.playtime || 0)) {
              match.playtime = freshHours;
              if (match.status === 'backlog' || match.status === 'wishlist') match.status = 'playing';
              await match.save();
            }
          }
        }
      }
    } catch (e) {}

    const updatedItems = await Item.find({ user: userId }).sort({ playtime: -1, createdAt: -1 });
    if (inGame && gameTitle) {
      const normLive = normalizeTitle(gameTitle);
      const matched = updatedItems.find(i => normalizeTitle(i.title).includes(normLive));
      if (matched) matchedItemId = matched._id;
    }
    res.json({ synced: true, inGame, gameTitle, matchedItemId, items: updatedItems });
  } catch (err) {
    res.json({ synced: false, inGame: false });
  }
});

router.post('/steam-sync', auth, async (req, res) => {
  const { steamInput } = req.body;
  if (!steamInput) return res.status(400).json({ message: "Введи Steam ID" });
  if (!process.env.STEAM_API_KEY) return res.status(400).json({ message: "Додай STEAM_API_KEY у .env" });

  try {
    let steamId = steamInput.trim().replace(/\/$/, '');
    if (steamId.includes('steamcommunity.com/profiles/')) {
      steamId = steamId.split('steamcommunity.com/profiles/')[1].split('/')[0];
    } else if (steamId.includes('steamcommunity.com/id/')) {
      const vanity = steamId.split('steamcommunity.com/id/')[1].split('/')[0];
      const resolveRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${vanity}`
      );
      if (resolveRes.data?.response?.success === 1) steamId = resolveRes.data.response.steamid;
      else return res.status(400).json({ message: "Не знайдено Steam профіль" });
    } else if (!/^\d{17}$/.test(steamId)) {
      const resolveRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`
      );
      if (resolveRes.data?.response?.success === 1) steamId = resolveRes.data.response.steamid;
      else return res.status(400).json({ message: "Неправильний Steam ID або профіль не знайдено" });
    }

    const ownedRes = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`
    );
    const steamGames = ownedRes.data?.response?.games;
    if (!steamGames) return res.status(400).json({ message: "Профіль прихований" });

    const userId = getUserId(req);
    const userItems = await Item.find({ user: userId });
    let syncedCount = 0, importedCount = 0;
    const sortedSteamGames = [...steamGames].sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0));

    for (const sg of sortedSteamGames) {
      if (!sg.name) continue;
      const normSteamTitle = normalizeTitle(sg.name);
      const hours = Math.round(((sg.playtime_forever || 0) / 60) * 10) / 10;
      const existingItem = userItems.find(item => {
        const normItemTitle = normalizeTitle(item.title);
        const isCsMatch = normItemTitle.includes('counterstrike') && normSteamTitle.includes('counterstrike');
        return normSteamTitle === normItemTitle || isCsMatch;
      });

      if (existingItem) {
        existingItem.steamAppId = sg.appid;
        if (hours > 0) {
          existingItem.playtime = hours;
          if (existingItem.status === 'backlog' || existingItem.status === 'wishlist') existingItem.status = 'playing';
          syncedCount++;
        }
        await existingItem.save();
      } else {
        const steamCoverUrl = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${sg.appid}/library_600x900.jpg`;
        const newItem = new Item({
          title: sg.name,
          imageUrl: steamCoverUrl,
          playtime: hours,
          steamAppId: sg.appid,
          genres: ['Steam'],
          status: hours > 0 ? 'playing' : 'backlog',
          user: userId
        });
        await newItem.save();
        importedCount++;
      }
    }

    let steamAvatarUrl = null;
    try {
      const summaryRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
      );
      if (summaryRes.data?.response?.players?.[0]?.avatarfull) {
        steamAvatarUrl = summaryRes.data.response.players[0].avatarfull;
      }
    } catch (e) {}

    let updatedUser = await User.findById(userId);
    if (updatedUser) {
      updatedUser.steamSynced = true;
      updatedUser.steamId = steamId;
      if (steamAvatarUrl && (!updatedUser.avatar || updatedUser.avatar === 'cyber')) {
        updatedUser.avatar = steamAvatarUrl;
      }
      await updatedUser.save();
    }
    const updatedItems = await Item.find({ user: userId }).sort({ playtime: -1, createdAt: -1 });
    res.json({ items: updatedItems, syncedCount, importedCount, userProfile: updatedUser, steamAvatarUrl });
  } catch (err) {
    res.status(500).json({ message: "Помилка Steam API" });
  }
});

router.post('/ai-assistant', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = getUserId(req);
    const items = await Item.find({ user: userId }).sort({ playtime: -1 });

    const topGames = items.slice(0, 25).map(i => `${i.title} (${i.playtime || 0} год)`).join(', ');
    const backlogGames = items.filter(i => i.status === 'backlog');
    const backlogSample = backlogGames.slice(0, 15).map(i => i.title).join(', ');

    const systemPrompt = `Ти розумний ігровий ШІ-асистент у додатку Backlogger. Відповідай українською мовою, цікаво, конкретно і без води (3-5 речень).
Ти знаєш сюжети всіх відеоігор, геймплей та орієнтовні ціни в Steam.
У гравця всього ${items.length} ігор. Топ за часом: ${topGames || 'немає'}. У беклозі (${backlogGames.length} шт): ${backlogSample || 'порожньо'}.`;

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (apiKey) {
      const tryModel = async (modelName) => {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nЗапитання гравця: ${prompt}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
          },
          { timeout: 7000 }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty');
        return text.trim();
      };

      try {
        const fastReply = await Promise.any([
          tryModel('gemini-3.8-flash'),
          tryModel('gemini-3.0-flash'),
          tryModel('gemini-2.0-flash')
        ]);
        if (fastReply) return res.json({ reply: fastReply });
      } catch (e) {}
    }

    const q = (prompt || '').toLowerCase();
    let reply = '';

    if (q.includes('довг') || q.includes('сюжет') || q.includes('рпг') || q.includes('rpg')) {
      reply = `Якщо шукаєш гру з масштабним і довгим сюжетом на 80–150+ годин, обов'язково зверни увагу на The Witcher 3: Wild Hunt, Baldur's Gate 3, Red Dead Redemption 2, Cyberpunk 2077: Phantom Liberty або Kingdom Come: Deliverance. У кожній із них продуманий світ, де можна пропасти на цілий місяць!`;
    } else if (q.includes('вечір') || q.includes('сьогодні') || q.includes('беклог')) {
      if (backlogGames.length > 0) {
        const pick1 = backlogGames[Math.floor(Math.random() * backlogGames.length)];
        const pick2 = backlogGames[Math.floor(Math.random() * backlogGames.length)];
        reply = `У твоєму беклозі зараз чекають ${backlogGames.length} ігор! На сьогоднішній вечір раджу запустити «${pick1.title}»${pick2._id !== pick1._id ? ` або «${pick2.title}»` : ''} — чудовий привід перевести гру в статус «Граю» та скласти власне враження.`;
      } else {
        reply = `Твій беклог порожній! Зазирни у вкладку «Спільнота» до блоку трендів або скористайся пошуком зверху, щоб додати свіжі хіти.`;
      }
    } else if (q.includes('смак') || q.includes('аналіз') || q.includes('статист')) {
      const totalH = Math.round(items.reduce((acc, i) => acc + (Number(i.playtime) || 0), 0) * 10) / 10;
      reply = `Твоя колекція налічує ${items.length} ігор та ${totalH} годин загального ігрового нальоту. Твій головний фаворит за часом — «${items[0]?.title || 'ще попереду'}» (${items[0]?.playtime || 0} год). Ти чудово поєднуєш сесійні мережеві ігри з глибокими сюжетними пригодами!`;
    } else {
      reply = `Я бачу всі ${items.length} ігор твоєї бібліотеки (лідер за часом — «${items[0]?.title || 'немає'}»). Запитай мене, що обрати на вечір із беклогу, попроси порадити гру з довгим сюжетом або проаналізувати твій ігровий смак!`;
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: "Помилка ШІ-помічника" });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const items = await Item.find({ user: userId }).sort({ playtime: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const item = new Item({ ...req.body, user: userId });
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updatedItem = await Item.findOneAndUpdate(
      { _id: req.params.id, user: getUserId(req) },
      req.body,
      { returnDocument: 'after' }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Item.findOneAndDelete({ _id: req.params.id, user: getUserId(req) });
    res.json({ message: 'Видалено' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;