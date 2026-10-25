const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const axios = require('axios');
const auth = require('../middlewares/auth');

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
      const uItems = allItems.filter(i => String(i.user) === String(u._id));
      const total = uItems.length;
      const completed = uItems.filter(i => i.status === 'completed').length;
      const ratedCount = uItems.filter(i => i.personalRating).length;
      const commentedCount = uItems.filter(i => i.comment && i.comment.trim().length > 0).length;
      const totalHours = Math.round(uItems.reduce((acc, i) => acc + (Number(i.playtime) || 0), 0) * 10) / 10;

      const xp = (total * 40) + (completed * 120) + (ratedCount * 30) + (commentedCount * 25) + Math.round(totalHours * 5);
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

// НОВИЙ МАРШРУТ: Глобальна стрічка відгуків спільноти
router.get('/feed', auth, async (req, res) => {
  try {
    const feed = await Item.find({
      $or: [
        { comment: { $exists: true, $ne: '' } },
        { personalRating: { $ne: null } }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(12)
    .populate('user', 'username avatar accentColor customTitle')
    .lean();

    const validFeed = feed.filter(item => item.user != null);
    res.json(validFeed);
  } catch (err) {
    res.status(500).json({ message: "Помилка завантаження стрічки спільноти" });
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

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.json({
        reply: "Додай ключ GEMINI_API_KEY у файл backend/.env і перезапусти сервер!"
      });
    }

    const allGamesList = items.map(i => {
      const parts = [i.title];
      if (i.playtime > 0) parts.push(`${i.playtime} год`);
      if (i.personalRating) parts.push(`оцінка ${i.personalRating}/10`);
      parts.push(`статус: ${i.status}`);
      return parts.join(' (') + (parts.length > 1 ? ')' : '');
    }).join(', ');

    const systemPrompt = `Ти розумний, живий та ерудований ігровий ШІ-асистент у веб-додатку Backlogger. 
Спілкуйся українською мовою, природно, дружньо, по суті й без зайвої води.
Ти знаєш усе про відеоігри: сюжети, геймплей, лор, розробників, а також орієнтовні ціни ігор у магазинах Steam/PS Store.
Ось повна бібліотека цього гравця (${items.length} ігор): ${allGamesList || 'бібліотека поки порожня'}.
Якщо гравець питає щось загальне про гру — детально і цікаво розкажи про неї.
Якщо гравець питає про свою бібліотеку — використовуй список його ігор вище та свої знання про ці ігри (включно з їхньою ринковою вартістю), щоб дати точну, конкретну відповідь із назвами його ігор.`;

    const callGemini = async (modelName) => {
      const cleanModel = modelName.replace(/^models\//, '');
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`,
        {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        },
        { timeout: 15000 }
      );
      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    };

    try {
      const replyText = await callGemini('gemini-3.8-flash');
      if (replyText) return res.json({ reply: replyText.trim() });
    } catch (primaryErr) {
      try {
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const models = (listRes.data?.models || []).filter(m => m.supportedGenerationMethods?.includes('generateContent'));
        const target = models.find(m => m.name.includes('3.8')) || models.find(m => m.name.includes('flash')) || models[0];
        if (target) {
          const fallbackText = await callGemini(target.name);
          if (fallbackText) return res.json({ reply: fallbackText.trim() });
        }
      } catch (fallbackErr) {}
      const errMsg = primaryErr.response?.data?.error?.message || primaryErr.message;
      return res.json({ reply: `Помилка від сервера Gemini: ${errMsg}` });
    }
    res.json({ reply: "Не вдалося отримати відповідь від моделі." });
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