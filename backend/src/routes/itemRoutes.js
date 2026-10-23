const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const axios = require('axios');
const auth = require('../middlewares/auth');

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;

// Допоміжна функція для порівняння назв ігор між RAWG та Steam
const normalizeTitle = (str) => str ? str.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, '') : '';

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

// Синхронізація годин зі Steam
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

    // Якщо користувач вставив повне посилання на профіль
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
      // Якщо введено просто кастомний нік з URL
      const resolveRes = await axios.get(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`
      );
      if (resolveRes.data?.response?.success === 1) {
        steamId = resolveRes.data.response.steamid;
      } else {
        return res.status(400).json({ message: "Неправильний Steam ID або профіль не знайдено" });
      }
    }

    // Отримуємо список ігор та годин зі Steam
    const ownedRes = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`
    );

    const steamGames = ownedRes.data?.response?.games;
    if (!steamGames) {
      return res.status(400).json({ 
        message: "Профіль Steam прихований. Відкрий доступ до 'Інформації про ігри' в налаштуваннях приватності Steam." 
      });
    }

    const userId = getUserId(req);
    const userItems = await Item.find({ user: userId });
    let syncedCount = 0;

    for (const item of userItems) {
      const normItemTitle = normalizeTitle(item.title);
      const match = steamGames.find(sg => {
        const normSteamTitle = normalizeTitle(sg.name);
        return normSteamTitle === normItemTitle || normSteamTitle.includes(normItemTitle) || normItemTitle.includes(normSteamTitle);
      });

      if (match && match.playtime_forever > 0) {
        const hours = Math.round((match.playtime_forever / 60) * 10) / 10;
        item.playtime = hours;
        if (item.status === 'backlog' && hours > 0) {
          item.status = 'playing';
        }
        await item.save();
        syncedCount++;
      }
    }

    const updatedItems = await Item.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ items: updatedItems, syncedCount });
  } catch (err) {
    console.error("Помилка синхронізації Steam:", err.message);
    res.status(500).json({ message: "Помилка з'єднання зі Steam API" });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const items = await Item.find({ user: userId }).sort({ createdAt: -1 });
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
      { new: true }
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