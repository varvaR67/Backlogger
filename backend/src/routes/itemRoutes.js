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

router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    if (!process.env.RAWG_API_KEY) {
      return res.status(500).json({ message: "Ключ RAWG не знайдено" });
    }
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

// Повний імпорт і синхронізація бібліотеки зі Steam
router.post('/steam-sync', auth, async (req, res) => {
  const { steamInput } = req.body;
  if (!steamInput) {
    return res.status(400).json({ message: "Введи Steam ID або посилання на профіль" });
  }

  if (!process.env.STEAM_API_KEY) {
    return res.status(400).json({ 
      message: "Додай STEAM_API_KEY у файл backend/.env (отримати можна на steamcommunity.com/dev/apikey)" 
    });
  }

  try {
    let steamId = steamInput.trim().replace(/\/$/, '');

    if (steamId.includes('steamcommunity.com/profiles/')) {
      steamId = steamId.split('steamcommunity.com/profiles/')[1].split('/')[0];
    } else if (steamId.includes('steamcommunity.com/id/')) {
      const vanity = steamId.split('steamcommunity.com/id/')[1].split('/')[0];
      const resolveRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${vanity}`
      );
      if (resolveRes.data?.response?.success === 1) {
        steamId = resolveRes.data.response.steamid;
      } else {
        return res.status(400).json({ message: "Не вдалося знайти профіль Steam за цим посиланням" });
      }
    } else if (!/^\d{17}$/.test(steamId)) {
      const resolveRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`
      );
      if (resolveRes.data?.response?.success === 1) {
        steamId = resolveRes.data.response.steamid;
      } else {
        return res.status(400).json({ message: "Неправильний Steam ID або профіль не знайдено" });
      }
    }

    const ownedRes = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`
    );

    const steamGames = ownedRes.data?.response?.games;
    if (!steamGames) {
      return res.status(400).json({ 
        message: "Профіль Steam прихований. Відкрий доступ до 'Подробиць про ігри' в налаштуваннях приватності Steam." 
      });
    }

    const userId = getUserId(req);
    const userItems = await Item.find({ user: userId });
    let syncedCount = 0;
    let importedCount = 0;

    // Сортуємо ігри зі Steam за кількістю награного часу
    const sortedSteamGames = [...steamGames].sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0));

    for (const sg of sortedSteamGames) {
      if (!sg.name) continue;
      const normSteamTitle = normalizeTitle(sg.name);
      const hours = Math.round(((sg.playtime_forever || 0) / 60) * 10) / 10;

      // Перевіряємо, чи є вже ця гра у бібліотеці користувача
      const existingItem = userItems.find(item => {
        const normItemTitle = normalizeTitle(item.title);
        const isCsMatch = (normItemTitle === 'counterstrike' || normItemTitle === 'counterstrike2' || normItemTitle === 'counterstrikeglobaloffensive') && 
                          (normSteamTitle === 'counterstrike2' || normSteamTitle === 'counterstrike');
        return normSteamTitle === normItemTitle || isCsMatch;
      });

      if (existingItem) {
        if (hours > 0) {
          existingItem.playtime = hours;
          if (existingItem.status === 'backlog') {
            existingItem.status = 'playing';
          }
          await existingItem.save();
          syncedCount++;
        }
      } else {
        // Додаємо нову гру зі Steam до бібліотеки сайту разом із вертикальною обкладинкою Steam
        const steamCoverUrl = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${sg.appid}/library_600x900.jpg`;
        const newItem = new Item({
          title: sg.name,
          imageUrl: steamCoverUrl,
          playtime: hours,
          genres: ['Steam'],
          status: hours > 0 ? 'playing' : 'backlog',
          user: userId
        });
        const savedItem = await newItem.save();
        userItems.push(savedItem);
        importedCount++;
      }
    }

    let steamAvatarUrl = null;
    try {
      const summaryRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
      );
      const player = summaryRes.data?.response?.players?.[0];
      if (player?.avatarfull) {
        steamAvatarUrl = player.avatarfull;
      }
    } catch (e) {
      // Ігноруємо помилку аватарки
    }

    const currentUser = await User.findById(userId);
    let updatedUser = null;
    if (currentUser) {
      currentUser.steamSynced = true;
      if (steamAvatarUrl && (!currentUser.avatar || currentUser.avatar === 'cyber')) {
        currentUser.avatar = steamAvatarUrl;
      }
      await currentUser.save();
      updatedUser = await User.findById(userId).select('-password');
    }

    // Повертаємо всі ігри (відсортовані за кількістю награних годин та датою додавання)
    const updatedItems = await Item.find({ user: userId }).sort({ playtime: -1, createdAt: -1 });
    res.json({ items: updatedItems, syncedCount, importedCount, userProfile: updatedUser, steamAvatarUrl });
  } catch (err) {
    console.error("Помилка синхронізації Steam:", err.message);
    res.status(500).json({ message: "Помилка з'єднання зі Steam API" });
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
    const item = new Item({
      ...req.body,
      user: userId
    });
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const updatedItem = await Item.findOneAndUpdate(
      { _id: req.params.id, user: userId },
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
    const userId = getUserId(req);
    await Item.findOneAndDelete({ _id: req.params.id, user: userId });
    res.json({ message: 'Видалено' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;