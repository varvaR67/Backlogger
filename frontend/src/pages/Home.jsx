import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import LiveSearch from '../components/LiveSearch';
import { useTranslation } from '../i18n';
import { 
  Trash2, LogOut, Sparkles, Trophy, Flame, 
  Clock, Star, Dices, X, Check, Play, Square, Layers, 
  MessageSquare, RefreshCw, Plus, SlidersHorizontal, Menu, 
  Globe, AlertCircle, Award, Shield, Zap, Crown, Ghost, 
  Rocket, Gamepad2, Sword, Heart, Bot, Send, Unlink, Film, 
  LayoutGrid, MessageSquareQuote, Users, ExternalLink, Compass, Search 
} from 'lucide-react';
import toast from 'react-hot-toast';

const AVATAR_PRESETS = [
  { id: 'cyber', label: 'Кібер-самурай', icon: Zap, gradient: 'from-indigo-500 to-purple-600' },
  { id: 'ghost', label: 'Неоновий привид', icon: Ghost, gradient: 'from-fuchsia-500 to-pink-600' },
  { id: 'rocket', label: 'Зоряний пілот', icon: Rocket, gradient: 'from-cyan-500 to-blue-600' },
  { id: 'crown', label: 'Король платини', icon: Crown, gradient: 'from-amber-400 to-orange-600' },
  { id: 'sword', label: 'Мисливець на босів', icon: Sword, gradient: 'from-rose-500 to-red-700' },
  { id: 'shield', label: 'Страж колекції', icon: Shield, gradient: 'from-emerald-400 to-teal-600' },
];

const ACCENT_THEMES = [
  { id: 'indigo', label: 'Індиго', ring: 'border-indigo-400/40', badge: 'bg-indigo-500/20 text-indigo-300', glow: 'from-indigo-600/30 to-purple-600/20' },
  { id: 'emerald', label: 'Смарагд', ring: 'border-emerald-400/40', badge: 'bg-emerald-500/20 text-emerald-300', glow: 'from-emerald-600/30 to-teal-600/20' },
  { id: 'rose', label: 'Кібер-рожевий', ring: 'border-rose-400/40', badge: 'bg-rose-500/20 text-rose-300', glow: 'from-rose-600/30 to-pink-600/20' },
  { id: 'amber', label: 'Золотий неон', ring: 'border-amber-400/40', badge: 'bg-amber-500/20 text-amber-300', glow: 'from-amber-500/30 to-orange-600/20' },
  { id: 'cyan', label: 'Крижаний неон', ring: 'border-cyan-400/40', badge: 'bg-cyan-500/20 text-cyan-300', glow: 'from-cyan-500/30 to-blue-600/20' },
];

const PLAYLIST_THEMES = {
  indigo: {
    label: 'Індиго',
    gradient: 'from-indigo-950/65 via-[#111118] to-[#0b0b10]',
    border: 'border-indigo-500/30 hover:border-indigo-400/60'
  },
  rose: {
    label: 'Багряний',
    gradient: 'from-rose-950/65 via-[#141014] to-[#0b0b10]',
    border: 'border-rose-500/30 hover:border-rose-400/60'
  },
  emerald: {
    label: 'Смарагд',
    gradient: 'from-emerald-950/65 via-[#0f1614] to-[#0b0b10]',
    border: 'border-emerald-500/30 hover:border-emerald-400/60'
  },
  amber: {
    label: 'Золотий',
    gradient: 'from-amber-950/65 via-[#16130e] to-[#0b0b10]',
    border: 'border-amber-500/30 hover:border-amber-400/60'
  }
};

const TITLE_PRESETS = ['Дослідник всесвітів', 'Мисливець за платиною', 'Повелитель беклогу', 'Кібер-легенда', 'Нічний геймер', 'Критик індустрії'];

const DEFAULT_PLAYLISTS = [
  {
    _id: 'default_souls',
    title: 'Хардкор та Темне Фентезі',
    curator: 'Спільнота Backlogger',
    desc: 'Безжальні боси, глибокий лор та випробування реакції для справжніх майстрів',
    theme: 'rose',
    likes: [],
    isDefault: true,
    games: [
      { title: 'Elden Ring', releaseYear: 2022, metacritic: 96, genres: ['RPG', 'Souls-like'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900.jpg' },
      { title: 'DARK SOULS™ III', releaseYear: 2016, metacritic: 89, genres: ['RPG', 'Action'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/374320/library_600x900.jpg' },
      { title: 'Sekiro™: Shadows Die Twice', releaseYear: 2019, metacritic: 90, genres: ['Action', 'Adventure'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/814380/library_600x900.jpg' },
      { title: 'Lies of P', releaseYear: 2023, metacritic: 80, genres: ['Action', 'RPG'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1627720/library_600x900.jpg' }
    ]
  },
  {
    _id: 'default_story',
    title: 'Епічні сюжети на 100+ годин',
    curator: 'Вибір редакції',
    desc: 'Масштабні відкриті світи та історії, в яких легко загубитися на цілий місяць',
    theme: 'indigo',
    likes: [],
    isDefault: true,
    games: [
      { title: 'The Witcher 3: Wild Hunt', releaseYear: 2015, metacritic: 93, genres: ['RPG', 'Adventure'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900.jpg' },
      { title: 'Red Dead Redemption 2', releaseYear: 2018, metacritic: 97, genres: ['Action', 'Adventure'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg' },
      { title: 'Baldur\'s Gate 3', releaseYear: 2023, metacritic: 96, genres: ['RPG', 'Strategy'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900.jpg' },
      { title: 'Cyberpunk 2077', releaseYear: 2020, metacritic: 86, genres: ['RPG', 'Sci-Fi'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg' }
    ]
  },
  {
    _id: 'default_ua',
    title: 'Атмосфера Зони та Постапокаліпсису',
    curator: 'Український вибір',
    desc: 'Виживання серед аномалій, зруйнованих міст і суворих випробувань',
    theme: 'emerald',
    likes: [],
    isDefault: true,
    games: [
      { title: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl', releaseYear: 2024, metacritic: 84, genres: ['Shooter', 'Survival'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1643320/library_600x900.jpg' },
      { title: 'Metro Exodus', releaseYear: 2019, metacritic: 82, genres: ['Shooter', 'Action'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/412020/library_600x900.jpg' },
      { title: 'Fallout 4', releaseYear: 2015, metacritic: 87, genres: ['RPG', 'Post-apocalyptic'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/377160/library_600x900.jpg' },
      { title: 'DayZ', releaseYear: 2018, metacritic: 68, genres: ['Survival', 'Shooter'], imageUrl: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/221100/library_600x900.jpg' }
    ]
  }
];

function getRatingColorStyles(ratingVal) {
  if (!ratingVal) {
    return {
      color: '#9ca3af',
      textShadow: 'none',
      accentHex: '#6366f1',
      percent: 0
    };
  }
  const num = Math.max(1, Math.min(10, Number(ratingVal)));
  const ratio = (num - 1) / 9;
  const hue = Math.round(ratio * 138);
  const color = `hsl(${hue}, 90%, 56%)`;
  const glow = `hsla(${hue}, 95%, 52%, 0.55)`;
  return {
    color,
    textShadow: `0 0 22px ${glow}, 0 0 8px ${glow}`,
    accentHex: color,
    percent: Math.round(ratio * 100)
  };
}

function AiModal({ onClose }) {
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', text: 'Привіт! Я твій швидкий ШІ-асистент. Можу підказати, що пограти сьогодні ввечері, порекомендувати гру з довгим захопливим сюжетом або проаналізувати твій ігровий смак!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAiThinking]);

  const handleAskAi = async (customPrompt) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : aiInput.trim();
    if (!textToSend) return;
    setAiMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    if (typeof customPrompt !== 'string') setAiInput('');
    setIsAiThinking(true);
    try {
      const res = await axios.post('http://localhost:5000/api/items/ai-assistant', { prompt: textToSend });
      setAiMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'ai', text: 'Помилка звʼязку з сервером.' }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0e0e13] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-4 sm:p-5 bg-[#14141c] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-300"><Bot className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold text-white">ШІ-Порадник Ігор</h3>
              <p className="text-[11px] text-gray-400">Персональний гід по твоїй колекції</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[260px]">
          {aiMessages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/[0.05] border border-white/10 text-gray-200'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isAiThinking && <div className="text-xs text-indigo-300 animate-pulse px-2">Аналізую...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {[
            'Що пограти сьогодні ввечері?',
            'Порекомендуй гру з довгим сюжетом',
            'Проаналізуй мій ігровий смак'
          ].map(q => (
            <button key={q} type="button" onClick={() => handleAskAi(q)} className="text-[11px] bg-white/[0.04] hover:bg-indigo-500/20 border border-white/10 text-gray-300 hover:text-white px-2.5 py-1 rounded-xl transition-all">
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleAskAi(); }} className="p-4 border-t border-white/10 flex gap-2">
          <input
            type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)}
            placeholder="Напиши запитання про гру чи бібліотеку..."
            className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500/60"
          />
          <button type="submit" disabled={isAiThinking} className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5"><Send className="w-4 h-4" /></button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Home({ username, onLogout }) {
  const { t, lang, changeLanguage } = useTranslation();

  const [activeView, setActiveView] = useState('library');

  const [items, setItems] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [communityHits, setCommunityHits] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);

  const [filter, setFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ avatar: 'cyber', customTitle: 'Дослідник всесвітів', accentColor: 'indigo', favoriteGameId: '', steamSynced: false, steamId: '' });
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [selectedGame, setSelectedGame] = useState(null);
  const [ratingInput, setRatingInput] = useState(null);
  const [playtimeInput, setPlaytimeInput] = useState(0);
  const [sessionAddInput, setSessionAddInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSteamModalOpen, setIsSteamModalOpen] = useState(false);
  const [steamInput, setSteamInput] = useState(localStorage.getItem('steamProfile') || '');
  const [isSyncingSteam, setIsSyncingSteam] = useState(false);

  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [rouletteGame, setRouletteGame] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const [isTierListOpen, setIsTierListOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Стан для створення користувацького плейлиста
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [plTitle, setPlTitle] = useState('');
  const [plDesc, setPlDesc] = useState('');
  const [plTheme, setPlTheme] = useState('indigo');
  const [plSelectedGames, setPlSelectedGames] = useState([]);
  const [plSearchQuery, setPlSearchQuery] = useState('');
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchProfile();
    fetchFeed();
    fetchTrending();
    fetchPlaylists();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (!activeSession) { setElapsedSeconds(0); return; }
    const interval = setInterval(() => { setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000)); }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (!profile.steamSynced) return;
    const checkSteamLive = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/items/steam-live');
        if (res.data?.items) setItems(res.data.items);
        if (res.data?.inGame && res.data?.gameTitle) {
          setActiveSession(prev => {
            if (prev && prev.title === res.data.gameTitle) return prev;
            toast.success(`Steam Live: Виявлено запуск "${res.data.gameTitle}"!`, { icon: '🟢' });
            return { gameId: res.data.matchedItemId || 'steam-live', title: res.data.gameTitle, startTime: Date.now(), isSteamAuto: true };
          });
        } else {
          setActiveSession(prev => {
            if (prev?.isSteamAuto) { toast.success(`Сесію у Steam завершено. Години синхронізовано!`, { icon: '🎮' }); return null; }
            return prev;
          });
        }
      } catch (e) {}
    };
    checkSteamLive();
    const poll = setInterval(checkSteamLive, 30000);
    return () => clearInterval(poll);
  }, [profile.steamSynced]);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items');
      setItems(res.data);
    } catch (error) {
      toast.error("Помилка завантаження бібліотеки");
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items/feed');
      setFeedItems(res.data);
    } catch (error) {}
  };

  const fetchTrending = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items/trending');
      if (Array.isArray(res.data)) {
        setNewReleases(res.data);
      } else {
        setCommunityHits(res.data?.communityHits || []);
        setNewReleases(res.data?.newReleases || []);
      }
    } catch (error) {}
  };

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items/playlists');
      setUserPlaylists(res.data || []);
    } catch (error) {}
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await axios.get('http://localhost:5000/api/items/leaderboard');
      setLeaderboard(res.data);
    } catch (error) {} finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items/profile');
      if (res.data) {
        setProfile({
          avatar: res.data.avatar || 'cyber',
          customTitle: res.data.customTitle || 'Дослідник всесвітів',
          accentColor: res.data.accentColor || 'indigo',
          favoriteGameId: res.data.favoriteGameId || '',
          steamSynced: Boolean(res.data.steamSynced),
          steamId: res.data.steamId || ''
        });
        if (res.data.avatar?.startsWith('http')) setCustomAvatarUrl(res.data.avatar);
      }
    } catch (error) {}
  };

  const handleToggleLike = async (reviewId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/items/${reviewId}/like`);
      setFeedItems(prev => prev.map(f => f._id === reviewId ? res.data : f));
    } catch (error) {
      toast.error("Не вдалося поставити лайк");
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!plTitle.trim() || plSelectedGames.length === 0) {
      return toast.error("Вкажи назву та обери хоча б одну гру!");
    }
    setIsSavingPlaylist(true);
    try {
      const res = await axios.post('http://localhost:5000/api/items/playlists', {
        title: plTitle.trim(),
        desc: plDesc.trim(),
        theme: plTheme,
        games: plSelectedGames
      });
      setUserPlaylists(prev => [res.data, ...prev]);
      toast.success("Плейлист опубліковано у Спільноті!", { icon: '🔥' });
      setIsPlaylistModalOpen(false);
      setPlTitle('');
      setPlDesc('');
      setPlSelectedGames([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Не вдалося створити плейлист");
    } finally {
      setIsSavingPlaylist(false);
    }
  };

  const handleLikePlaylist = async (playlistId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/items/playlists/${playlistId}/like`);
      setUserPlaylists(prev => prev.map(p => p._id === playlistId ? res.data : p));
    } catch (error) {}
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await axios.delete(`http://localhost:5000/api/items/playlists/${playlistId}`);
      setUserPlaylists(prev => prev.filter(p => p._id !== playlistId));
      toast.success("Плейлист видалено", { icon: '🗑️' });
    } catch (error) {
      toast.error("Не вдалося видалити плейлист");
    }
  };

  const toggleSelectGameForPlaylist = (game) => {
    const exists = plSelectedGames.some(g => g.title === game.title);
    if (exists) {
      setPlSelectedGames(prev => prev.filter(g => g.title !== game.title));
    } else {
      if (plSelectedGames.length >= 6) {
        return toast.error("Максимум 6 ігор в одному плейлисті");
      }
      setPlSelectedGames(prev => [
        ...prev,
        {
          title: game.title,
          imageUrl: game.imageUrl,
          releaseYear: game.releaseYear || 2024,
          metacritic: game.metacritic || 85,
          genres: game.genres || ['Steam']
        }
      ]);
    }
  };

  const stats = useMemo(() => {
    const wishlist = items.filter(i => i.status === 'wishlist').length;
    const backlog = items.filter(i => i.status === 'backlog').length;
    const playing = items.filter(i => i.status === 'playing').length;
    const paused = items.filter(i => i.status === 'paused').length;
    const completed = items.filter(i => i.status === 'completed').length;
    const ownedTotal = backlog + playing + paused + completed;
    const total = items.length;
    const activeOwned = backlog + playing + completed;
    const completionRate = activeOwned > 0 ? Math.round((completed / activeOwned) * 100) : 0;
    const totalHours = Math.round(items.reduce((acc, item) => acc + (Number(item.playtime) || 0), 0) * 10) / 10;
    const maxGameHours = items.reduce((max, item) => Math.max(max, Number(item.playtime) || 0), 0);
    const ratedItems = items.filter(i => i.personalRating);
    const perfectTenCount = items.filter(i => Number(i.personalRating) >= 9.5).length;
    const commentedItems = items.filter(i => i.comment && i.comment.trim().length > 0);
    const avgRating = ratedItems.length > 0 ? (ratedItems.reduce((acc, i) => acc + Number(i.personalRating), 0) / ratedItems.length).toFixed(1) : '—';
    const xp = (ownedTotal * 40) + (completed * 120) + (ratedItems.length * 30) + (commentedItems.length * 25) + Math.round(totalHours * 5);
    const level = Math.floor(xp / 200) + 1;
    return {
      total, ownedTotal, wishlist, backlog, playing, paused, completed, completionRate,
      totalHours, maxGameHours, ratedCount: ratedItems.length, perfectTenCount,
      commentedCount: commentedItems.length, avgRating, xp, level,
      currentLevelXp: xp % 200, xpProgress: Math.round(((xp % 200) / 200) * 100)
    };
  }, [items]);

  const achievements = useMemo(() => [
    { id: 'first_game', title: 'Перший крок', desc: 'Додати першу гру до своєї колекції', unlocked: stats.ownedTotal >= 1, progress: `${Math.min(stats.ownedTotal, 1)}/1`, icon: Gamepad2 },
    { id: 'collector', title: 'Колекціонер', desc: 'Зібрати 5 або більше ігор у бібліотеці', unlocked: stats.ownedTotal >= 5, progress: `${Math.min(stats.ownedTotal, 5)}/5`, icon: Layers },
    { id: 'librarian', title: 'Хранитель бібліотеки', desc: 'Розширити колекцію до 25 ігор', unlocked: stats.ownedTotal >= 25, progress: `${Math.min(stats.ownedTotal, 25)}/25`, icon: Shield },
    { id: 'tycoon', title: 'Ігровий магнат', desc: 'Зібрати масштабну колекцію зі 100+ ігор', unlocked: stats.ownedTotal >= 100, progress: `${Math.min(stats.ownedTotal, 100)}/100`, icon: Crown },
    { id: 'finisher', title: 'До фінальних титрів', desc: 'Пройти свою першу гру до кінця', unlocked: stats.completed >= 1, progress: `${Math.min(stats.completed, 1)}/1`, icon: Trophy },
    { id: 'platinum_hunter', title: 'Мисливець за платиною', desc: 'Повністю пройти 5 ігор', unlocked: stats.completed >= 5, progress: `${Math.min(stats.completed, 5)}/5`, icon: Award },
    { id: 'completion_legend', title: 'Легенда проходжень', desc: 'Довести до фіналу 15 ігор', unlocked: stats.completed >= 15, progress: `${Math.min(stats.completed, 15)}/15`, icon: Sword },
    { id: 'critic', title: 'Суворий критик', desc: 'Виставити особисту оцінку 5 іграм', unlocked: stats.ratedCount >= 5, progress: `${Math.min(stats.ratedCount, 5)}/5`, icon: Star },
    { id: 'expert', title: 'Експерт індустрії', desc: 'Оцінити 15 різних проєктів у колекції', unlocked: stats.ratedCount >= 15, progress: `${Math.min(stats.ratedCount, 15)}/15`, icon: Sparkles },
    { id: 'masterpiece', title: 'Десять із десяти!', desc: 'Поставити оцінку 9.5 або 10 шедевру', unlocked: stats.perfectTenCount >= 1, progress: `${Math.min(stats.perfectTenCount, 1)}/1`, icon: Zap },
    { id: 'time_lord', title: 'Володар часу', desc: 'Награти сумарно понад 50 годин у іграх', unlocked: stats.totalHours >= 50, progress: `${Math.min(Math.round(stats.totalHours), 50)}/50 год`, icon: Clock },
    { id: 'cybersport', title: 'Кіберспортсмен', desc: 'Награти 100+ годин в одній грі', unlocked: stats.maxGameHours >= 100, progress: `${Math.min(Math.round(stats.maxGameHours), 100)}/100 год`, icon: Flame },
    { id: 'veteran', title: 'Ветеран геймінгу', desc: 'Перетнути позначку у 500 годин загального нальоту', unlocked: stats.totalHours >= 500, progress: `${Math.min(Math.round(stats.totalHours), 500)}/500 год`, icon: Rocket },
    { id: 'time_titan', title: 'Титан часу', desc: 'Награти легендарні 1000+ годин у бібліотеці', unlocked: stats.totalHours >= 1000, progress: `${Math.min(Math.round(stats.totalHours), 1000)}/1000 год`, icon: Ghost },
    { id: 'writer', title: 'Літописець', desc: 'Залишити особисті нотатки до 3 ігор', unlocked: stats.commentedCount >= 3, progress: `${Math.min(stats.commentedCount, 3)}/3`, icon: MessageSquare },
    { id: 'steam_link', title: 'Синхронізований', desc: 'Підключити та синхронізувати бібліотеку Steam', unlocked: profile.steamSynced, progress: profile.steamSynced ? 'Виконано' : '0/1', icon: RefreshCw }
  ], [stats, profile.steamSynced]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const activeAccent = ACCENT_THEMES.find(t => t.id === profile.accentColor) || ACCENT_THEMES[0];
  const favoriteGame = items.find(i => i._id === profile.favoriteGameId);

  const tierGroups = useMemo(() => {
    const rated = items.filter(i => i.personalRating);
    return [
      { tier: 'S', label: 'Шедеври (9–10)', color: 'from-amber-400 to-orange-500 text-black', games: rated.filter(i => i.personalRating >= 9) },
      { tier: 'A', label: 'Відмінні (8–8.5)', color: 'from-emerald-400 to-teal-500 text-black', games: rated.filter(i => i.personalRating >= 8 && i.personalRating < 9) },
      { tier: 'B', label: 'Хороші (7–7.5)', color: 'from-indigo-400 to-blue-500 text-white', games: rated.filter(i => i.personalRating >= 7 && i.personalRating < 8) },
      { tier: 'C', label: 'Середні (5–6.5)', color: 'from-purple-400 to-fuchsia-500 text-white', games: rated.filter(i => i.personalRating >= 5 && i.personalRating < 7) },
      { tier: 'D', label: 'Слабкі (1–4.5)', color: 'from-rose-500 to-red-600 text-white', games: rated.filter(i => i.personalRating < 5) },
    ];
  }, [items]);

  const allPlaylists = useMemo(() => {
    return [...userPlaylists, ...DEFAULT_PLAYLISTS];
  }, [userPlaylists]);

  const renderUserAvatar = (avatarVal, nameVal, sizeClass = "w-7 h-7", iconClass = "w-3.5 h-3.5") => {
    if (avatarVal?.startsWith('http')) {
      return <img src={avatarVal} alt={nameVal} className={`${sizeClass} rounded-full object-cover border border-white/20 shrink-0`} />;
    }
    const preset = AVATAR_PRESETS.find(p => p.id === avatarVal) || AVATAR_PRESETS[0];
    const IconComp = preset.icon;
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr ${preset.gradient} flex items-center justify-center border border-white/25 shadow-sm shrink-0`}>
        <IconComp className={`${iconClass} text-white`} />
      </div>
    );
  };

  const renderAvatar = (sizeClass = "w-7 h-7", iconClass = "w-3.5 h-3.5") => renderUserAvatar(profile.avatar, username, sizeClass, iconClass);

  const getSteamLinks = (game) => {
    if (game?.steamAppId) {
      return {
        webUrl: `https://store.steampowered.com/app/${game.steamAppId}`,
        clientUrl: `steam://store/${game.steamAppId}`
      };
    }
    const encoded = encodeURIComponent(game?.title || '');
    return {
      webUrl: `https://store.steampowered.com/search/?term=${encoded}`,
      clientUrl: null
    };
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const finalAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : profile.avatar;
    try {
      const res = await axios.put('http://localhost:5000/api/items/profile', { ...profile, avatar: finalAvatar });
      setProfile(prev => ({ ...prev, avatar: res.data.avatar, customTitle: res.data.customTitle, accentColor: res.data.accentColor, favoriteGameId: res.data.favoriteGameId || '', steamSynced: Boolean(res.data.steamSynced) }));
      toast.success('Профіль оновлено!', { icon: '✨' });
      setIsProfileOpen(false);
      fetchLeaderboard();
    } catch (error) { toast.error('Не вдалося зберегти профіль'); } finally { setIsSavingProfile(false); }
  };

  const handleAddGame = async (gameData, requestedStatus) => {
    const existing = items.find(item => item.title.toLowerCase() === gameData.title.toLowerCase());
    if (existing) {
      if (existing.status === 'wishlist' && requestedStatus === 'backlog') {
        handleUpdateStatus(null, existing._id, 'backlog', existing.title);
        return;
      }
      return toast.error(`"${gameData.title}" вже є у твоєму списку!`, { icon: '⚠️' });
    }

    const targetStatus = requestedStatus || (filter === 'wishlist' ? 'wishlist' : 'backlog');

    try {
      const res = await axios.post('http://localhost:5000/api/items', {
        title: gameData.title,
        imageUrl: gameData.imageUrl,
        releaseYear: gameData.releaseYear,
        metacritic: gameData.metacritic,
        genres: gameData.genres,
        status: targetStatus
      });
      setItems([res.data, ...items]);
      if (targetStatus === 'wishlist') {
        toast.success(`"${gameData.title}" додано у Вішліст!`, { icon: '💖' });
      } else {
        toast.success(`"${gameData.title}" додано у Беклог!`);
      }
      fetchFeed();
      fetchTrending();
      fetchLeaderboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не вдалося додати гру");
    }
  };

  const handleUpdateStatus = async (e, id, newStatus, gameTitle) => {
    if (e) e.stopPropagation();
    try {
      const res = await axios.put(`http://localhost:5000/api/items/${id}`, { status: newStatus });
      setItems(items.map(item => item._id === id ? res.data : item));
      const statusNames = {
        'wishlist': 'Вішліст',
        'backlog': 'Беклог',
        'playing': 'Граю зараз',
        'paused': 'На паузі',
        'completed': 'Пройдено'
      };
      toast.success(`"${gameTitle}" → ${statusNames[newStatus]}`, { icon: '✨' });
      fetchTrending();
      fetchLeaderboard();
    } catch (error) { toast.error("Помилка оновлення статусу"); }
  };

  const handleDeleteGame = async (e, id, gameTitle) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`);
      setItems(items.filter(item => item._id !== id));
      if (selectedGame?._id === id) setSelectedGame(null);
      if (activeSession?.gameId === id) setActiveSession(null);
      toast.success(`"${gameTitle}" видалено`, { icon: '🗑️' });
      fetchFeed();
      fetchTrending();
    } catch (error) { toast.error("Помилка видалення гри"); }
  };

  const openGameDetails = (game) => {
    setSelectedGame(game);
    setRatingInput(game.personalRating || null);
    setPlaytimeInput(game.playtime || 0);
    setSessionAddInput('');
    setCommentInput(game.comment || '');
  };

  const handleAddSessionHours = (hoursToAdd) => {
    const val = Number(hoursToAdd);
    if (!val || val <= 0) return;
    const updated = Math.round(((Number(playtimeInput) || 0) + val) * 10) / 10;
    setPlaytimeInput(updated);
    setSessionAddInput('');
    toast.success(`Додано +${val} год (Разом: ${updated} год)`, { icon: '⏱️' });
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!selectedGame) return;
    setIsSavingDetails(true);
    const finalPlaytime = Math.round(((Number(playtimeInput) || 0) + (Number(sessionAddInput) > 0 ? Number(sessionAddInput) : 0)) * 10) / 10;
    try {
      const res = await axios.put(`http://localhost:5000/api/items/${selectedGame._id}`, {
        personalRating: ratingInput ? Number(ratingInput) : null,
        playtime: finalPlaytime,
        comment: commentInput
      });
      setItems(items.map(item => item._id === selectedGame._id ? res.data : item));
      setSelectedGame(res.data);
      toast.success('Дані гри збережено!');
      setSelectedGame(null);
      fetchFeed();
      fetchTrending();
      fetchLeaderboard();
    } catch (error) { toast.error('Не вдалося зберегти зміни'); } finally { setIsSavingDetails(false); }
  };

  const startLiveSession = (e, game) => {
    if (e) e.stopPropagation();
    if (activeSession?.gameId === game._id) return;
    setActiveSession({ gameId: game._id, title: game.title, startTime: Date.now(), isSteamAuto: false });
    toast.success(`Таймер для "${game.title}" запущено! Приємної гри.`, { icon: '▶️' });
  };

  const stopLiveSession = async () => {
    if (!activeSession) return;
    const targetGame = items.find(i => i._id === activeSession.gameId);
    if (!targetGame) { setActiveSession(null); return; }
    const addedHours = elapsedSeconds >= 10 ? Math.max(0.1, Math.round((elapsedSeconds / 3600) * 10) / 10) : 0;
    const newTotal = Math.round(((Number(targetGame.playtime) || 0) + addedHours) * 10) / 10;
    try {
      const res = await axios.put(`http://localhost:5000/api/items/${targetGame._id}`, { playtime: newTotal, status: (targetGame.status === 'backlog' || targetGame.status === 'wishlist') ? 'playing' : targetGame.status });
      setItems(items.map(item => item._id === targetGame._id ? res.data : item));
      toast.success(addedHours > 0 ? `Сесію завершено! +${addedHours} год до "${targetGame.title}"` : `Сесію зупинено (менше 10 секунд)`, { icon: '⏹️' });
    } catch (err) { toast.error('Помилка збереження сесії'); } finally { setActiveSession(null); }
  };

  const formatTimer = (sec) => [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map(v => String(v).padStart(2, '0')).join(':');

  const handleSteamSync = async (e) => {
    e.preventDefault();
    if (!steamInput.trim()) return;
    setIsSyncingSteam(true);
    localStorage.setItem('steamProfile', steamInput.trim());
    try {
      const res = await axios.post('http://localhost:5000/api/items/steam-sync', { steamInput: steamInput.trim() });
      setItems(res.data.items);
      if (res.data.userProfile) {
        setProfile(prev => ({ ...prev, avatar: res.data.userProfile.avatar || prev.avatar, steamSynced: true, steamId: res.data.userProfile.steamId || prev.steamId }));
        if (res.data.userProfile.avatar?.startsWith('http')) setCustomAvatarUrl(res.data.userProfile.avatar);
      }
      toast.success(`Steam синхронізовано! Додано ігор: ${res.data.importedCount || 0}, оновлено: ${res.data.syncedCount || 0}`, { icon: '🎮' });
      setIsSteamModalOpen(false);
      fetchTrending();
      fetchLeaderboard();
    } catch (error) { toast.error(error.response?.data?.message || 'Не вдалося синхронізувати зі Steam'); } finally { setIsSyncingSteam(false); }
  };

  const handleSteamUnlink = async () => {
    try {
      await axios.post('http://localhost:5000/api/items/steam-unlink');
      localStorage.removeItem('steamProfile');
      setSteamInput('');
      setProfile(prev => ({ ...prev, steamSynced: false, steamId: '' }));
      if (activeSession?.isSteamAuto) setActiveSession(null);
      toast.success("Акаунт Steam від'єднано!", { icon: '🔌' });
      setIsSteamModalOpen(false);
    } catch (error) { toast.error("Не вдалося від'єднати Steam"); }
  };

  const startRoulette = () => {
    const backlogGames = items.filter(i => i.status === 'backlog');
    if (backlogGames.length === 0) return toast.error('Твій беклог порожній! Додай ігри або переведи щось у категорію Беклог.', { icon: '🎲' });
    setIsMobileMenuOpen(false);
    setIsRouletteOpen(true);
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      setRouletteGame(backlogGames[Math.floor(Math.random() * backlogGames.length)]);
      counter++;
      if (counter >= 16) {
        clearInterval(interval);
        setRouletteGame(backlogGames[Math.floor(Math.random() * backlogGames.length)]);
        setIsSpinning(false);
      }
    }, 85);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const isOwnedSteamGame = Boolean(item.steamAppId) || Number(item.playtime) > 0;
      const effectiveStatus = (item.status === 'wishlist' && isOwnedSteamGame) ? 'playing' : item.status;
      if (filter === 'all') return effectiveStatus !== 'wishlist';
      return effectiveStatus === filter;
    });
  }, [items, filter]);

  const filterTabs = [
    { id: 'all', label: t('tab_all'), count: stats.ownedTotal },
    { id: 'backlog', label: t('tab_backlog'), count: stats.backlog },
    { id: 'playing', label: t('tab_playing'), count: stats.playing },
    { id: 'paused', label: t('tab_paused'), count: stats.paused },
    { id: 'completed', label: t('tab_completed'), count: stats.completed },
    { id: 'wishlist', label: t('tab_wishlist'), count: stats.wishlist },
  ];

  const sliderStyle = getRatingColorStyles(ratingInput);

  const libraryForPlaylistPicker = useMemo(() => {
    const q = plSearchQuery.trim().toLowerCase();
    return items.filter(i => !q || i.title.toLowerCase().includes(q)).slice(0, 30);
  }, [items, plSearchQuery]);

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-indigo-500/30 relative overflow-x-hidden font-sans flex flex-col">
      
      {/* ВИДИМЕ КОСМІЧНЕ СЯЙВО ТА ХМАРИ НА ФОНІ (Шар z-0 поверх чорної основи, контент на z-10) */}
      <style>{`
        @keyframes nebulaFloatLeft {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(60px, 35px, 0) scale(1.12); }
        }
        @keyframes nebulaFloatRight {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-65px, 45px, 0) scale(1.15); }
        }
        @keyframes nebulaPulseCenter {
          0%, 100% { opacity: 0.55; transform: translate3d(-50%, 0, 0) scale(1); }
          50% { opacity: 0.85; transform: translate3d(-50%, -20px, 0) scale(1.08); }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Фіолетово-індиго туманність зліва зверху */}
        <div 
          className="absolute -top-32 -left-20 w-[650px] h-[500px] rounded-full will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, rgba(139, 92, 246, 0.14) 45%, transparent 72%)',
            filter: 'blur(45px)',
            animation: 'nebulaFloatLeft 20s ease-in-out infinite'
          }}
        />
        {/* Смарагдово-бірюзова хмара справа зверху */}
        <div 
          className="absolute -top-24 -right-20 w-[620px] h-[480px] rounded-full will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.11) 45%, transparent 72%)',
            filter: 'blur(50px)',
            animation: 'nebulaFloatRight 24s ease-in-out infinite'
          }}
        />
        {/* Центральне космічне світіння за заголовком */}
        <div 
          className="absolute top-12 left-1/2 w-[900px] h-[380px] rounded-full will-change-transform"
          style={{
            background: 'radial-gradient(ellipse, rgba(124, 58, 237, 0.18) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 75%)',
            filter: 'blur(55px)',
            animation: 'nebulaPulseCenter 16s ease-in-out infinite'
          }}
        />
        {/* Легке зоряне напилення у верхній частині */}
        <div 
          className="absolute inset-x-0 top-0 h-[420px] opacity-25"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), radial-gradient(rgba(165,180,252,0.5) 1px, transparent 1px)',
            backgroundSize: '70px 70px, 120px 120px',
            backgroundPosition: '0 0, 35px 35px',
            maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)'
          }}
        />
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-9 relative z-10 flex-1">
        
{/* ВЕРХНІЙ ХЕДЕР */}
        <nav className="flex items-center justify-between mb-8 sm:mb-12 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('library')}
              className="group flex items-center gap-3 text-left focus:outline-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/75 group-hover:to-indigo-300 transition-all">
                Backlogger
              </span>
            </button>

            <div className="hidden lg:flex items-center bg-[#0b0b12]/90 backdrop-blur-md p-1 rounded-full border border-white/10 ml-2 gap-0.5">
              <button
                onClick={() => setActiveView('library')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ${
                  activeView === 'library'
                    ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>{t('nav_library')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('community');
                  fetchFeed();
                  fetchTrending();
                  fetchPlaylists();
                  fetchLeaderboard();
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ${
                  activeView === 'community'
                    ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t('nav_community')}</span>
              </button>
              <button
                onClick={() => setActiveView('movies')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ${
                  activeView === 'movies'
                    ? 'bg-rose-500/25 text-rose-200 border border-rose-400/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('nav_movies')}</span>
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveView(activeView === 'community' ? 'library' : 'community')}
              className={`lg:hidden group flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] ${
                activeView === 'community'
                  ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50'
                  : 'bg-[#0b0b12]/90 hover:bg-indigo-500/15 text-gray-300 hover:text-indigo-200 border-white/10 hover:border-indigo-400/40'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>{t('nav_community')}</span>
            </button>

            <button
              onClick={() => setActiveView('movies')}
              className={`lg:hidden group flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] ${
                activeView === 'movies'
                  ? 'bg-rose-500/20 text-rose-200 border-rose-400/50'
                  : 'bg-[#0b0b12]/90 hover:bg-rose-500/15 text-gray-300 hover:text-rose-200 border-white/10 hover:border-rose-400/40'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-12 transition-transform duration-300" />
              <span>{t('nav_movies')}</span>
            </button>

            <button
              onClick={() => setIsAiOpen(true)}
              className="group flex items-center gap-2 bg-[#0b0b12]/90 hover:bg-purple-500/15 text-purple-300 hover:text-purple-100 border border-white/10 hover:border-purple-400/45 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-500/15"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
              <span>{t('nav_ai')}</span>
            </button>

            <button
              onClick={() => setIsTierListOpen(true)}
              className="group flex items-center gap-2 bg-[#0b0b12]/90 hover:bg-amber-500/15 text-amber-200/90 hover:text-amber-100 border border-white/10 hover:border-amber-400/45 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-500/10"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300" />
              <span>{t('nav_tier')}</span>
            </button>

            <button
              onClick={() => setIsSteamModalOpen(true)}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] border ${
                profile.steamSynced
                  ? 'bg-[#0b0b12]/90 hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/10'
                  : 'bg-[#0b0b12]/90 hover:bg-indigo-500/15 text-indigo-300 border-white/10 hover:border-indigo-400/45'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>{profile.steamSynced ? t('nav_steam') : t('nav_steam_sync')}</span>
            </button>

            <div className="flex items-center bg-[#0b0b12]/90 p-1 rounded-full border border-white/10">
              {[
                { code: 'uk', label: 'UA' },
                { code: 'en', label: 'EN' },
                { code: 'ru', label: 'RU' }
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLanguage(l.code)}
                  className={`px-2 py-1 rounded-full text-[10px] font-extrabold transition-all ${
                    lang === l.code
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className={`flex items-center gap-3 bg-[#0b0b12]/90 p-1.5 pl-2 pr-3.5 rounded-full border ${activeAccent.ring} transition-all duration-300 hover:border-white/30`}>
              <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 hover:opacity-90 transition-opacity text-left">
                {renderAvatar("w-7 h-7", "w-3.5 h-3.5")}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white hover:text-indigo-300 transition-colors">{username || 'Геймер'}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${activeAccent.badge}`}>LVL {stats.level}</span>
                </div>
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button onClick={onLogout} className="text-xs font-medium text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1" title={t('nav_logout')}>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden flex items-center gap-2 bg-[#0b0b12] border border-white/10 pl-2 pr-3 py-1.5 rounded-2xl text-gray-200 active:scale-95 transition-all">
            {renderAvatar("w-6 h-6", "w-3 h-3")} <span className="text-xs font-bold text-white max-w-[80px] truncate">{username || 'Меню'}</span> {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -16, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -16, height: 0 }} className="md:hidden overflow-hidden mb-6">
              <div className="bg-[#0b0b12] border border-white/15 rounded-3xl p-4 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsProfileOpen(true); }} className="flex items-center gap-2.5 text-left">
                    {renderAvatar("w-10 h-10", "w-5 h-5")}
                    <div>
                      <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-white">{username || 'Геймер'}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${activeAccent.badge}`}>LVL {stats.level}</span></div>
                      <div className="text-[11px] text-indigo-300">{profile.customTitle} • Ачівки ({unlockedCount}/{achievements.length}) →</div>
                    </div>
                  </button>
                  <button onClick={onLogout} className="bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> {t('nav_logout')}</button>
                </div>

                <div className="flex items-center justify-between bg-white/[0.03] p-2 rounded-2xl border border-white/10">
                  <span className="text-xs text-gray-400 pl-2">Мова / Language:</span>
                  <div className="flex gap-1">
                    {[{ code: 'uk', label: 'UA' }, { code: 'en', label: 'EN' }, { code: 'ru', label: 'RU' }].map(l => (
                      <button key={l.code} onClick={() => changeLanguage(l.code)} className={`px-2.5 py-1 rounded-xl text-xs font-bold ${lang === l.code ? 'bg-indigo-500 text-white' : 'text-gray-400'}`}>{l.label}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setActiveView('library'); setIsMobileMenuOpen(false); }} className={`flex justify-center items-center gap-1.5 py-2.5 px-2 rounded-2xl text-[11px] font-semibold border ${activeView === 'library' ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40' : 'bg-white/[0.04] text-gray-300 border-white/10'}`}><Gamepad2 className="w-3.5 h-3.5" /><span>{t('nav_library')}</span></button>
                  <button onClick={() => { setActiveView('community'); setIsMobileMenuOpen(false); }} className={`flex justify-center items-center gap-1.5 py-2.5 px-2 rounded-2xl text-[11px] font-semibold border ${activeView === 'community' ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40' : 'bg-white/[0.04] text-gray-300 border-white/10'}`}><Users className="w-3.5 h-3.5" /><span>{t('nav_community')}</span></button>
                  <button onClick={() => { setActiveView('movies'); setIsMobileMenuOpen(false); }} className={`flex justify-center items-center gap-1.5 py-2.5 px-2 rounded-2xl text-[11px] font-semibold border ${activeView === 'movies' ? 'bg-rose-500/20 text-rose-200 border-rose-400/40' : 'bg-white/[0.04] text-rose-300 border-white/10'}`}><Film className="w-3.5 h-3.5" /><span>{t('nav_movies')}</span></button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsAiOpen(true); }} className="flex justify-center items-center gap-1.5 bg-white/[0.04] text-purple-300 border border-white/10 py-2.5 px-2 rounded-2xl text-[11px] font-semibold"><Bot className="w-3.5 h-3.5" /><span>{t('nav_ai')}</span></button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsTierListOpen(true); }} className="flex justify-center items-center gap-1.5 bg-white/[0.04] text-amber-200 border border-white/10 py-2.5 px-2 rounded-2xl text-[11px] font-semibold"><LayoutGrid className="w-3.5 h-3.5" /><span>{t('nav_tier')}</span></button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsSteamModalOpen(true); }} className="flex justify-center items-center gap-1.5 bg-white/[0.04] text-emerald-300 border border-white/10 py-2.5 px-2 rounded-2xl text-[11px] font-semibold"><RefreshCw className="w-3.5 h-3.5" /><span>{t('nav_steam')}</span></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSession && (
            <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="mb-6 sm:mb-8 bg-[#090d0b]/90 backdrop-blur-md border border-emerald-500/35 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-400 font-bold">{activeSession.isSteamAuto ? '🟢 Steam Live: Ви зараз граєте (Автопідрахунок)' : 'Зараз у грі (Живий відлік)'}</div>
                  <div className="text-base sm:text-lg font-extrabold text-white line-clamp-1">{activeSession.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="font-mono text-lg sm:text-2xl font-bold text-emerald-400 bg-black/60 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-white/10">{formatTimer(elapsedSeconds)}</div>
                <button onClick={stopLiveSession} className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"><Square className="w-3.5 h-3.5 fill-current" /><span>Стоп і зберегти</span></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeView === 'movies' ? (
          /* ОБКЛАДИНКА РОЗДІЛУ КІНО ТА СЕРІАЛІВ */
          <div className="relative py-12 sm:py-20 px-4 text-center max-w-4xl mx-auto">
            <div 
              className="absolute inset-0 -z-10 rounded-3xl opacity-80 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 30%, rgba(225, 29, 72, 0.22) 0%, rgba(245, 158, 11, 0.08) 45%, transparent 75%)',
                filter: 'blur(40px)'
              }}
            />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs font-bold mb-5 shadow-lg shadow-rose-500/10">
              <Film className="w-4 h-4 text-rose-400" />
              <span>Backlogger Cinema</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-rose-100 to-rose-300/60 mb-4">
              {t('movies_title')}
            </h1>
            <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto mb-10">
              {t('movies_sub')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
              <div className="bg-[#0e0a0c]/90 border border-rose-500/20 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-400 mb-3">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Автохронометраж</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Години фільмів рахуються автоматично за їхньою офіційною тривалістю</p>
              </div>

              <div className="bg-[#0e0c0a]/90 border border-amber-500/20 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-3">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Трекер серіалів</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Відмічай переглянуті сезони та додавай серії в один клік кнопкою +1 серія</p>
              </div>

              <div className="bg-[#0b0a0e]/90 border border-purple-500/20 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-400 mb-3">
                  <Dices className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Кіно-рулетка</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Випадковий вибір фільму на вечір із твого списку запланованих переглядів</p>
              </div>
            </div>
          </div>
        ) : activeView === 'library' ? (
          <>
            <header className="mb-7 sm:mb-10 text-center max-w-2xl mx-auto px-2">
              <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/55 mb-2 sm:mb-3">
                {t('hero_title')}
              </h1>
              <p className="text-gray-400 text-xs sm:text-lg">
                {t('hero_sub')}
              </p>
            </header>

            <LiveSearch onAddGame={handleAddGame} t={t} />

            {/* ЧОТИРИ АНІМОВАНІ КАРТКИ ДАШБОРДУ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
              
              <div className="group cursor-default bg-[#0a0c0b]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-emerald-950/85 hover:via-[#0d1914] hover:to-[#090d0b] border border-emerald-900/35 hover:border-emerald-400/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/10">
                <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-emerald-200 transition-colors truncate">
                    {t('card_progress')}
                  </span>
                  <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/25 border border-emerald-500/20 group-hover:border-emerald-400/50 text-emerald-400 group-hover:scale-110 transition-all shrink-0">
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
                    <span className="text-xl sm:text-3xl font-bold text-white group-hover:text-emerald-300 transition-colors">{stats.completionRate}%</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-emerald-200/70 transition-colors">({stats.completed} {t('card_completed_sub')})</span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-black/50 rounded-full overflow-hidden">
                    <div style={{ width: `${stats.completionRate}%` }} className="h-full bg-emerald-500 group-hover:bg-emerald-400 rounded-full transition-all duration-700" />
                  </div>
                </div>
              </div>

              <div className="group cursor-default bg-[#0c0b09]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-amber-950/85 hover:via-[#1a140b] hover:to-[#0d0b08] border border-amber-900/35 hover:border-amber-400/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/10">
                <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-amber-200 transition-colors truncate">
                    {t('card_activity')}
                  </span>
                  <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/25 border border-amber-500/20 group-hover:border-amber-400/50 text-amber-400 group-hover:scale-110 transition-all shrink-0">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-1">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-white group-hover:text-amber-300 transition-colors">{stats.playing}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 group-hover:text-amber-200/70 transition-colors mt-0.5">{t('card_playing_sub')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-lg font-semibold text-amber-200 group-hover:text-white flex items-center justify-end gap-1 transition-colors">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                      <span>{stats.totalHours} {t('hours_short')}</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 group-hover:text-amber-200/70 transition-colors">{t('card_hours_sub')}</div>
                  </div>
                </div>
              </div>

              <div onClick={() => setIsProfileOpen(true)} className="group cursor-pointer bg-[#0b090e]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-purple-950/85 hover:via-[#181022] hover:to-[#0c0910] border border-purple-900/35 hover:border-purple-400/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-500/15">
                <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-purple-200 transition-colors truncate">
                    {t('card_rank')}
                  </span>
                  <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/25 border border-purple-500/20 group-hover:border-purple-400/50 text-purple-400 group-hover:scale-110 transition-all shrink-0">
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-1">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-white group-hover:text-purple-300 transition-colors flex items-baseline gap-0.5">
                      {stats.avgRating}
                      <span className="text-[10px] sm:text-xs font-normal text-gray-500 group-hover:text-purple-200/70">/10</span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 group-hover:text-purple-200/70 transition-colors mt-0.5">{t('card_avg_sub')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-lg font-semibold text-purple-300 group-hover:text-white flex items-center justify-end gap-1 transition-colors">
                      <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 shrink-0" />
                      {unlockedCount}/{achievements.length}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 group-hover:text-purple-200/70 transition-colors">{t('card_ach_sub')}</div>
                  </div>
                </div>
              </div>

              <button onClick={startRoulette} className="group bg-[#090a10]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-indigo-950/90 hover:via-[#12142b] hover:to-[#090a10] border border-indigo-900/40 hover:border-indigo-400/65 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/15 active:scale-[0.99]">
                <div className="flex items-center justify-between w-full mb-2 sm:mb-3 gap-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-indigo-200 transition-colors truncate">
                    {t('card_roulette_top')}
                  </span>
                  <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/30 border border-indigo-500/20 group-hover:border-indigo-400/50 text-indigo-400 group-hover:text-white group-hover:rotate-12 group-hover:scale-110 transition-all shrink-0">
                    <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-sm sm:text-xl font-bold text-white mb-0.5 leading-tight group-hover:text-indigo-300 transition-colors">
                    {t('card_roulette_title')}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-indigo-200/80 transition-colors line-clamp-1">
                    {t('card_roulette_sub')}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-center mb-7 sm:mb-10">
              <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex bg-[#0b0b10]/90 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-white/[0.08] gap-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`relative px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 ${
                      filter === tab.id
                        ? 'bg-white/[0.09] text-white border border-white/15 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    <span className={`text-[9px] sm:text-[11px] px-1.5 py-0.5 rounded-md ${
                      filter === tab.id ? 'bg-indigo-500/35 text-indigo-200' : 'bg-white/5 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
                {filteredItems.map(item => {
                  const isOwnedSteamGame = Boolean(item.steamAppId) || Number(item.playtime) > 0;
                  const isWishlistItem = item.status === 'wishlist' && !isOwnedSteamGame;
                  const steamLinks = getSteamLinks(item);
                  const ratingStyle = getRatingColorStyles(item.personalRating);

                  return (
                    <div key={item._id} onClick={() => openGameDetails(item)} className="group cursor-pointer bg-[#0b0b10] border border-white/[0.07] hover:border-white/25 rounded-2xl sm:rounded-3xl overflow-hidden sm:hover:-translate-y-1.5 transition-all duration-200 shadow-lg flex flex-col relative">
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#0b0b10]">
                        <img
                          src={item.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Game'}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg');
                          }}
                          className="w-full h-full object-cover scale-[1.01] transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                        
                        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-col gap-1 sm:gap-1.5 items-end z-30">
                          {item.metacritic && (
                            <div className="bg-[#09090d]/95 border border-white/15 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-md">
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400" />
                              <span className="text-[10px] sm:text-xs font-bold text-white">{item.metacritic}</span>
                            </div>
                          )}
                          {item.personalRating && (
                            <div
                              style={{ borderColor: ratingStyle.color }}
                              className="bg-[#09090d]/95 border px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl flex items-center gap-1 shadow-md"
                            >
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" style={{ color: ratingStyle.color }} />
                              <span className="text-[10px] sm:text-xs font-extrabold" style={{ color: ratingStyle.color }}>
                                {item.personalRating}/10
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 z-30">
                          <button onClick={(e) => handleDeleteGame(e, item._id, item.title)} className="opacity-90 sm:opacity-0 group-hover:opacity-100 bg-[#09090d]/95 hover:bg-red-500 text-gray-200 hover:text-white border border-white/15 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-opacity duration-150 shadow-md" title="Видалити гру">
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          {!isWishlistItem && (
                            <button onClick={(e) => startLiveSession(e, item)} className={`opacity-90 sm:opacity-0 group-hover:opacity-100 border p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-opacity duration-150 shadow-md ${activeSession?.gameId === item._id ? 'opacity-100 bg-emerald-500 text-white border-emerald-300' : 'bg-[#09090d]/95 hover:bg-indigo-500 text-gray-200 hover:text-white border-white/15'}`} title="Запустити живий відлік часу гри">
                              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                            </button>
                          )}
                          <a
                            href={steamLinks.webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-90 sm:opacity-0 group-hover:opacity-100 bg-[#09090d]/95 hover:bg-blue-600 text-blue-300 hover:text-white border border-white/15 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-opacity duration-150 shadow-md"
                            title={t('open_steam_store')}
                          >
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </a>
                        </div>

                        <div className="absolute bottom-5 left-2.5 right-2.5 sm:left-3 sm:right-3 flex items-center justify-between text-[10px] sm:text-xs z-30 pointer-events-none">
                          {!isWishlistItem ? (
                            <span className="flex items-center gap-1.5 bg-[#09090d]/95 text-white font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-lg">
                              <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                              {item.playtime > 0 ? `${item.playtime} ${t('hours_short')}` : `0 ${t('hours_short')}`}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 bg-pink-500/90 text-white font-bold px-2.5 py-1 rounded-full border border-pink-300/30 shadow-lg">
                              <Heart className="w-3 h-3 fill-current shrink-0" />
                              {t('in_wishlist')}
                            </span>
                          )}
                          {item.comment && (
                            <span className="bg-[#09090d]/95 p-1.5 rounded-full border border-white/20 shadow-lg pointer-events-auto" title="Є особиста нотатка">
                              <MessageSquare className="w-3 h-3 text-purple-300" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 pt-3 -mt-3 flex flex-col flex-1 bg-[#0b0b10] relative z-20 before:content-[''] before:absolute before:-top-8 before:inset-x-0 before:h-8 before:bg-gradient-to-t before:from-[#0b0b10] before:to-transparent before:pointer-events-none">
                        <h3 className="font-bold text-sm sm:text-base text-white mb-0.5 sm:mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors" title={item.title}>
                          {item.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-gray-400 mb-2.5 sm:mb-3 line-clamp-1">
                          {item.releaseYear ? `${item.releaseYear} • ` : ''} {item.genres?.length ? item.genres.join(', ') : 'Гра'}
                        </p>
                        
                        <button type="button" onClick={() => openGameDetails(item)} className="w-full mb-2 sm:mb-2.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-white/[0.03] hover:bg-indigo-500/20 border border-white/[0.07] hover:border-indigo-500/30 text-[10px] sm:text-[11px] font-medium text-gray-300 hover:text-indigo-200 flex items-center justify-between transition-colors">
                          <span className="flex items-center gap-1.5 truncate"><SlidersHorizontal className="w-3 h-3 text-indigo-400 shrink-0" /><span className="truncate">{t('btn_rate_time')}</span></span>
                          <span className="text-indigo-400 font-bold ml-1">+</span>
                        </button>

                        {isWishlistItem ? (
                          <button
                            type="button"
                            onClick={(e) => handleUpdateStatus(e, item._id, 'backlog', item.title)}
                            className="mt-auto w-full py-2 rounded-xl bg-pink-500/15 hover:bg-indigo-500 text-pink-200 hover:text-white border border-pink-500/30 hover:border-indigo-400 text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('btn_bought_backlog')}</span>
                          </button>
                        ) : (
                          <div onClick={(e) => e.stopPropagation()} className="mt-auto grid grid-cols-4 bg-black/60 rounded-xl p-0.5 sm:p-1 border border-white/[0.07] gap-0.5">
                            {[
                              { id: 'backlog', label: t('st_backlog') },
                              { id: 'playing', label: t('st_playing') },
                              { id: 'paused', label: t('st_paused') },
                              { id: 'completed', label: t('st_completed') }
                            ].map(st => {
                              const currentSt = item.status === 'wishlist' ? 'playing' : item.status;
                              return (
                                <button
                                  key={st.id}
                                  onClick={(e) => handleUpdateStatus(e, item._id, st.id, item.title)}
                                  className={`py-1 sm:py-1.5 text-[8px] sm:text-[9px] font-bold tracking-wider rounded-lg transition-colors truncate px-0.5 ${
                                    currentSt === st.id
                                      ? st.id === 'paused'
                                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                                        : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                  }`}
                                >
                                  {st.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 px-4 bg-[#0b0b10] border border-white/[0.06] rounded-3xl">
                <p className="text-gray-400 text-base sm:text-lg font-medium mb-1">{t('empty_cat')}</p>
                <p className="text-gray-600 text-xs sm:text-sm">{t('empty_sub')}</p>
              </div>
            )}
          </>
        ) : (
          /* СТОРІНКА СПІЛЬНОТИ З ЖИВОЮ АНАЛІТИКОЮ, НОВИНКАМИ ТА СТВОРЕННЯМ ПЛЕЙЛИСТІВ */
          <div className="space-y-12">
            <header className="text-center max-w-2xl mx-auto px-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>Backlogger Community Hub</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2">
                {t('comm_title')}
              </h1>
              <p className="text-gray-400 text-xs sm:text-base">
                {t('comm_sub')}
              </p>
            </header>

            <LiveSearch onAddGame={handleAddGame} t={t} />

            {/* 1. ЖИВА АНАЛІТИКА СПІЛЬНОТИ (Ігри, в які реально грають користувачі платформи) */}
            {communityHits.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-emerald-400" />
                    <span>{t('comm_live_analytics')}</span>
                  </h2>
                  <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full font-semibold">
                    Автоматичний підрахунок активності гравців
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  {communityHits.map((hit, idx) => (
                    <div key={idx} className="group bg-[#0b0b10] border border-white/[0.08] hover:border-emerald-400/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-lg">
                      <div className="relative aspect-[3/4] bg-black overflow-hidden">
                        <img
                          src={hit.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Game'}
                          alt={hit.title}
                          onError={(e) => {
                            if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg');
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-black/85 border border-emerald-400/40 px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{hit.playersCount} {t('comm_players_count')}</span>
                        </div>
                        {hit.avgCommunityRating && (
                          <div className="absolute top-2 right-2 bg-indigo-600/95 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-white flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                            <span>{hit.avgCommunityRating}</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-lg flex items-center justify-between text-[10px] text-gray-200">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {hit.totalHours} {t('hours_short')}
                          </span>
                          {hit.playingNowCount > 0 && (
                            <span className="text-emerald-400 font-bold">● {hit.playingNowCount} актив.</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 flex flex-col flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 mb-2" title={hit.title}>{hit.title}</h4>
                        <div className="mt-auto flex gap-1.5">
                          <button
                            onClick={() => handleAddGame(hit, 'backlog')}
                            className="flex-1 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 text-indigo-200 hover:text-white border border-indigo-400/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <Plus className="w-3 h-3" /> Беклог
                          </button>
                          <button
                            onClick={() => handleAddGame(hit, 'wishlist')}
                            className="p-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-400/30 transition-all"
                            title={t('to_wishlist')}
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. АВТОМАТИЧНІ СВІЖІ РЕЛІЗИ ТА НОВИНКИ ІНДУСТРІЇ */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{t('comm_new_releases')}</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {newReleases.map(tg => (
                  <div key={tg.rawgId} className="group bg-[#0b0b10] border border-white/[0.08] hover:border-indigo-400/40 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1">
                    <div className="relative aspect-[3/4] bg-black overflow-hidden">
                      <img src={tg.imageUrl} alt={tg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {tg.metacritic && (
                        <div className="absolute top-2 right-2 bg-black/85 border border-white/15 px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-400">
                          {tg.metacritic}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 mb-0.5">{tg.title}</h4>
                      <p className="text-[10px] text-gray-400 mb-3 line-clamp-1">{tg.releaseYear} • {tg.genres?.join(', ')}</p>
                      <div className="mt-auto flex gap-1.5">
                        <button
                          onClick={() => handleAddGame(tg, 'backlog')}
                          className="flex-1 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 text-indigo-200 hover:text-white border border-indigo-400/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Беклог
                        </button>
                        <button
                          onClick={() => handleAddGame(tg, 'wishlist')}
                          className="p-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-400/30 transition-all"
                          title={t('to_wishlist')}
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. ПУБЛІЧНІ ТА КОРИСТУВАЦЬКІ ІГРОВІ ПЛЕЙЛИСТИ */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <span>{t('comm_playlists')} ({allPlaylists.length})</span>
                </h2>

                <button
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('comm_create_playlist')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {allPlaylists.map(pl => {
                  const themeCfg = PLAYLIST_THEMES[pl.theme] || PLAYLIST_THEMES.indigo;
                  const curatorName = pl.user?.username || pl.curator || 'Геймер';
                  const isOwner = !pl.isDefault && pl.user?.username?.toLowerCase() === username?.toLowerCase();
                  const likesCount = Array.isArray(pl.likes) ? pl.likes.length : 0;

                  return (
                    <div key={pl._id} className={`bg-gradient-to-b ${themeCfg.gradient} border ${themeCfg.border} rounded-3xl p-5 flex flex-col justify-between transition-all`}>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {pl.user ? (
                              renderUserAvatar(pl.user.avatar, curatorName, "w-5 h-5", "w-2.5 h-2.5")
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            )}
                            <span className="text-[11px] font-bold text-indigo-300 truncate">{curatorName}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!pl.isDefault && (
                              <button
                                onClick={() => handleLikePlaylist(pl._id)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 hover:bg-pink-500/20 text-[11px] text-gray-300 hover:text-pink-300 border border-white/10 transition-all"
                              >
                                <Heart className={`w-3 h-3 ${likesCount > 0 ? 'text-pink-400 fill-pink-400' : ''}`} />
                                <span>{likesCount}</span>
                              </button>
                            )}
                            {isOwner && (
                              <button
                                onClick={() => handleDeletePlaylist(pl._id)}
                                className="p-1 rounded-lg bg-black/40 hover:bg-red-500/25 text-gray-400 hover:text-red-300 border border-white/10 transition-colors"
                                title="Видалити свій плейлист"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="text-lg font-extrabold text-white mb-1">{pl.title}</h3>
                        {pl.desc && <p className="text-xs text-gray-400 mb-4 leading-relaxed">{pl.desc}</p>}
                      </div>

                      <div className="space-y-2 mt-2">
                        {(pl.games || []).map((g, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 bg-black/45 border border-white/[0.07] p-2 rounded-xl">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={g.imageUrl || 'https://via.placeholder.com/60x80/1a1a1a/ffffff?text=Game'}
                                alt={g.title}
                                onError={(e) => {
                                  if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg');
                                }}
                                className="w-9 h-12 object-cover rounded-lg shrink-0 bg-black"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">{g.title}</div>
                                <div className="text-[10px] text-gray-400">{g.releaseYear || 2024} {g.metacritic ? `• ★ ${g.metacritic}` : ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleAddGame(g, 'wishlist')}
                                className="p-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white transition-colors"
                                title={t('to_wishlist')}
                              >
                                <Heart className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleAddGame(g, 'backlog')}
                                className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white transition-colors"
                                title="Додати у Беклог"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. ОСТАННІ ВІДГУКИ СПІЛЬНОТИ */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
                  <span>{t('comm_reviews')}</span>
                </h2>
              </div>

              {feedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedItems.map(feedItem => {
                    const rStyle = getRatingColorStyles(feedItem.personalRating);
                    const likesCount = Array.isArray(feedItem.likes) ? feedItem.likes.length : 0;

                    return (
                      <div key={feedItem._id} className="bg-[#0b0b10] border border-white/[0.08] hover:border-white/15 rounded-2xl p-4 flex gap-4 transition-all">
                        <img
                          src={feedItem.imageUrl}
                          alt={feedItem.title}
                          onError={(e) => {
                            if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg');
                          }}
                          className="w-20 h-28 object-cover rounded-xl border border-white/10 shrink-0 bg-black"
                        />
                        <div className="flex-1 flex flex-col min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm sm:text-base text-white truncate">{feedItem.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {renderUserAvatar(feedItem.user?.avatar, feedItem.user?.username, "w-5 h-5", "w-2.5 h-2.5")}
                                <span className="text-xs font-semibold text-indigo-300 truncate">{feedItem.user?.username || 'Геймер'}</span>
                              </div>
                            </div>
                            {feedItem.personalRating && (
                              <div
                                style={{ backgroundColor: rStyle.color }}
                                className="px-2.5 py-1 rounded-xl text-xs font-black text-black shrink-0 shadow-md"
                              >
                                {feedItem.personalRating}
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-gray-300 line-clamp-3 mt-1.5 leading-relaxed">
                            {feedItem.comment || 'Гравець оцінив гру без текстового коментаря.'}
                          </p>

                          <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Зіграно {feedItem.playtime || 0} {t('hours_short')}
                            </span>

                            <button
                              onClick={() => handleToggleLike(feedItem._id)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-pink-500/20 text-gray-300 hover:text-pink-300 border border-white/10 hover:border-pink-400/40 transition-all"
                            >
                              <Heart className={`w-3.5 h-3.5 ${likesCount > 0 ? 'text-pink-400 fill-pink-400' : ''}`} />
                              <span className="font-bold">{likesCount}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#0b0b10] border border-white/[0.06] rounded-2xl p-8 text-center text-sm text-gray-400">
                  Поки що немає відгуків. Оціни будь-яку гру у своїй бібліотеці, щоб твій відгук з'явився першим!
                </div>
              )}
            </section>

            {/* 5. ЗАЛ СЛАВИ: ТОП ГРАВЦІВ */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>{t('comm_leaderboard')}</span>
                </h2>
              </div>

              {isLoadingLeaderboard ? (
                <div className="py-12 text-center text-sm text-gray-400">Завантаження рейтингу...</div>
              ) : (
                <div className="space-y-2.5">
                  {leaderboard.map((player, index) => {
                    const rank = index + 1;
                    const isCurrentUser = player.username?.toLowerCase() === username?.toLowerCase();
                    const isTop1 = rank === 1;
                    const isTop2 = rank === 2;
                    const isTop3 = rank === 3;

                    return (
                      <div
                        key={player._id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isTop1
                            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-[#0b0b10] border-amber-400/50 shadow-lg'
                            : isCurrentUser
                            ? 'bg-indigo-500/15 border-indigo-400/40'
                            : 'bg-[#0b0b10] border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isTop1 ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30' :
                            isTop2 ? 'bg-gray-300 text-black' :
                            isTop3 ? 'bg-amber-700 text-white' :
                            'bg-white/5 text-gray-400 border border-white/10'
                          }`}>
                            {isTop1 ? <Crown className="w-4 h-4 fill-current" /> : `#${rank}`}
                          </div>

                          {renderUserAvatar(player.avatar, player.username, "w-10 h-10", "w-5 h-5")}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm sm:text-base text-white truncate">{player.username}</span>
                              {isTop1 && <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">Топ-1 Легенда</span>}
                              {isCurrentUser && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200">Ти</span>}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate">
                              {player.customTitle} • {player.totalGames} ігор ({player.completedGames} пройдено) • {player.totalHours} {t('hours_short')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className={`inline-block text-xs sm:text-sm font-extrabold px-3 py-1 rounded-xl border ${
                            isTop1 ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}>
                            LVL {player.level}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 font-mono">{player.xp} XP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <button onClick={() => setIsAiOpen(true)} className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#121218] hover:bg-indigo-600 text-white shadow-2xl border border-white/15 hover:scale-105 active:scale-95 transition-all flex items-center gap-2" title={t('nav_ai')}>
        <Bot className="w-5 h-5 text-indigo-400" /> <span className="hidden sm:inline text-xs font-bold pr-1">ШІ-Гід</span>
      </button>

      <footer className="mt-20 border-t border-white/[0.07] bg-[#07070b] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>© {new Date().getFullYear()} Backlogger • {stats.ownedTotal} ігор • {stats.totalHours} {t('hours_short')}.</div>
            <div className="flex items-center gap-2 text-gray-400 font-medium"><span>{t('footer_created')}</span><span>🇺🇦</span></div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isAiOpen && <AiModal onClose={() => setIsAiOpen(false)} />}
      </AnimatePresence>

      {/* МОДАЛЬНЕ ВІКНО СТВОРЕННЯ КОРИСТУВАЦЬКОГО ПЛЕЙЛИСТА */}
      <AnimatePresence>
        {isPlaylistModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPlaylistModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0e0e14] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Створити публічний плейлист
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Поділися своєю добіркою найкращих ігор зі спільнотою</p>
                </div>
                <button onClick={() => setIsPlaylistModalOpen(false)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Назва плейлиста</label>
                  <input
                    type="text"
                    required
                    maxLength={48}
                    value={plTitle}
                    onChange={(e) => setPlTitle(e.target.value)}
                    placeholder="Наприклад: Ігри для вечірнього релаксу..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Короткий опис</label>
                  <input
                    type="text"
                    maxLength={120}
                    value={plDesc}
                    onChange={(e) => setPlDesc(e.target.value)}
                    placeholder="Чому варто зіграти у цю добірку..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Колір оформлення</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(PLAYLIST_THEMES).map(([key, cfg]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setPlTheme(key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          plTheme === key
                            ? 'bg-indigo-500/25 text-white border-indigo-400 scale-105'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-300">
                      Обери ігри зі своєї колекції ({plSelectedGames.length}/6)
                    </label>
                  </div>

                  <div className="relative mb-2.5">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={plSearchQuery}
                      onChange={(e) => setPlSearchQuery(e.target.value)}
                      placeholder="Швидкий пошук у твоїй бібліотеці..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-white/10 rounded-2xl p-2 bg-black/30">
                    {libraryForPlaylistPicker.length > 0 ? libraryForPlaylistPicker.map(game => {
                      const isSelected = plSelectedGames.some(g => g.title === game.title);
                      return (
                        <button
                          type="button"
                          key={game._id}
                          onClick={() => toggleSelectGameForPlaylist(game)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-500/25 border-indigo-400/50 text-white'
                              : 'bg-white/[0.02] border-white/[0.05] text-gray-300 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={game.imageUrl}
                              alt={game.title}
                              onError={(e) => {
                                if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg');
                              }}
                              className="w-8 h-10 object-cover rounded-lg shrink-0 bg-black"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">{game.title}</div>
                              <div className="text-[10px] text-gray-500">{game.playtime || 0} год</div>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-indigo-500 border-indigo-300 text-white' : 'border-white/20'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="text-center py-6 text-xs text-gray-500">Ігор не знайдено</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaylistModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPlaylist}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Опублікувати плейлист</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTierListOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTierListOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-[#0e0e13] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div><h3 className="text-xl font-extrabold text-white flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-amber-400" />Твій персональний Тір-ліст</h3><p className="text-xs text-gray-400 mt-0.5">Автоматичний рейтинг на основі виставлених тобою оцінок</p></div>
                <button onClick={() => setIsTierListOpen(false)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {tierGroups.map(group => (
                  <div key={group.tier} className="flex bg-[#14141c] border border-white/10 rounded-2xl overflow-hidden min-h-[76px]">
                    <div className={`w-16 sm:w-24 bg-gradient-to-br ${group.color} flex flex-col items-center justify-center shrink-0 p-2`}><span className="text-2xl sm:text-3xl font-black leading-none">{group.tier}</span><span className="text-[9px] font-bold opacity-80 text-center mt-1">{group.label}</span></div>
                    <div className="p-2.5 flex flex-wrap items-center gap-2 flex-1">
                      {group.games.length > 0 ? group.games.map(g => (
                        <div key={g._id} className="flex items-center gap-2 bg-black/60 border border-white/10 pr-2.5 rounded-xl overflow-hidden"><img src={g.imageUrl} alt={g.title} className="w-10 h-12 object-cover" /><div><div className="text-xs font-bold text-white line-clamp-1 max-w-[130px]">{g.title}</div><div className="text-[10px] text-amber-300 font-semibold">★ {g.personalRating}/10</div></div></div>
                      )) : <span className="text-xs text-gray-600 pl-2">Немає ігор у цьому ранзі</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfileOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0e0e13] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl relative">
              <div className={`relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br ${activeAccent.glow}`}>
                {favoriteGame?.imageUrl && <img src={favoriteGame.imageUrl} alt={favoriteGame.title} className="w-full h-full object-cover opacity-35 blur-[2px] scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-[#0e0e13]/60 to-transparent" />
                <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 bg-black/50 hover:bg-white/20 text-white p-2 rounded-full border border-white/10 transition-colors z-10"><X className="w-5 h-5" /></button>
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {renderAvatar("w-16 h-16 sm:w-20 sm:h-20", "w-8 h-8 sm:w-10 sm:h-10")}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap"><h2 className="text-2xl sm:text-3xl font-extrabold text-white">{username || 'Геймер'}</h2><span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${activeAccent.ring} ${activeAccent.badge}`}>РІВЕНЬ {stats.level}</span></div>
                      <p className="text-xs sm:text-sm text-indigo-300 font-medium mt-0.5">{profile.customTitle}</p>
                      {favoriteGame && <p className="text-[11px] text-gray-400 mt-1">Улюблена гра: <span className="text-white font-semibold">{favoriteGame.title}</span></p>}
                    </div>
                  </div>
                  <div className="w-full sm:w-48 bg-black/60 p-2.5 rounded-2xl border border-white/10">
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-400 font-semibold">Досвід (XP)</span><span className="text-white font-bold">{stats.currentLevelXp} / 200 XP</span></div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div style={{ width: `${stats.xpProgress}%` }} className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full" /></div>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3"><span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" />Твої досягнення ({unlockedCount} з {achievements.length})</span><span className="text-[11px] text-gray-500">Загальний досвід: {stats.xp} XP</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {achievements.map((ach) => (
                      <div key={ach.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${ach.unlocked ? 'bg-[#151520] border-indigo-400/35' : 'bg-white/[0.02] border-white/[0.06] opacity-55'}`}>
                        <div className={`p-2.5 rounded-xl shrink-0 ${ach.unlocked ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-gray-500'}`}><ach.icon className="w-4 h-4" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-white truncate">{ach.title}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${ach.unlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-500'}`}>{ach.unlocked ? 'Відкрито' : ach.progress}</span></div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{ach.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-white/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-300">Кастомізація акаунта</div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-2">Обери пресет аватарки або встав посилання на своє фото</label>
                    <div className="grid grid-cols-6 gap-2 mb-2.5">
                      {AVATAR_PRESETS.map((preset) => (
                        <button type="button" key={preset.id} onClick={() => { setCustomAvatarUrl(''); setProfile({ ...profile, avatar: preset.id }); }} className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all ${profile.avatar === preset.id && !customAvatarUrl ? 'bg-white/15 border-white/40 scale-105' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'}`} title={preset.label}>
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${preset.gradient} flex items-center justify-center`}><preset.icon className="w-4 h-4 text-white" /></div><span className="text-[9px] text-gray-300 truncate w-full text-center">{preset.label.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                    <input type="text" value={customAvatarUrl} onChange={(e) => setCustomAvatarUrl(e.target.value)} placeholder="Або встав URL картинки / Steam-аватарки (https://...)" className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1.5">Твій ігровий титул</label>
                      <input type="text" maxLength={32} value={profile.customTitle} onChange={(e) => setProfile({ ...profile, customTitle: e.target.value })} placeholder="Наприклад: Мисливець за платиною" className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 mb-1.5" />
                      <div className="flex flex-wrap gap-1">{TITLE_PRESETS.map(tItem => <button type="button" key={tItem} onClick={() => setProfile({ ...profile, customTitle: tItem })} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-0.5 rounded-lg border border-white/5">{tItem}</button>)}</div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1.5">Улюблена гра на банері профілю</label>
                      <select value={profile.favoriteGameId} onChange={(e) => setProfile({ ...profile, favoriteGameId: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60">
                        <option value="">Без банера гри</option>{items.map(g => <option key={g._id} value={g._id}>{g.title}</option>)}
                      </select>
                      <label className="block text-[11px] text-gray-400 mt-3 mb-1.5">Колір акценту профілю</label>
                      <div className="flex gap-2">{ACCENT_THEMES.map(theme => <button type="button" key={theme.id} onClick={() => setProfile({ ...profile, accentColor: theme.id })} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${profile.accentColor === theme.id ? `${theme.badge} ${theme.ring}` : 'bg-white/5 text-gray-400 border-white/10'}`}>{theme.label}</button>)}</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-2"><button type="button" onClick={() => setIsProfileOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Закрити</button><button type="submit" disabled={isSavingProfile} className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-1.5 transition-all"><Check className="w-3.5 h-3.5" /> Зберегти профіль</button></div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedGame && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGame(null)} className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#0e0e13] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl relative">
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img src={selectedGame.imageUrl} alt={selectedGame.title} className="w-full h-full object-cover blur-sm scale-105 opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-[#0e0e13]/60 to-transparent" />
                <button onClick={() => setSelectedGame(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-white/20 text-white p-2 rounded-full border border-white/10 transition-colors"><X className="w-5 h-5" /></button>
                
                <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6 flex items-end justify-between gap-3 flex-wrap">
                  <div className="flex items-end gap-3 sm:gap-4 min-w-0">
                    <img src={selectedGame.imageUrl} alt={selectedGame.title} className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-2xl border border-white/20 shadow-xl hidden xs:block shrink-0" />
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-tight line-clamp-1">{selectedGame.title}</h2>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{selectedGame.releaseYear ? `${selectedGame.releaseYear} • ` : ''}{selectedGame.genres?.join(', ')}</p>
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <a
                          href={getSteamLinks(selectedGame).webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white border border-blue-400/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{t('open_steam_store')}</span>
                        </a>
                        {getSteamLinks(selectedGame).clientUrl && (
                          <a
                            href={getSteamLinks(selectedGame).clientUrl}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/15 text-gray-200 border border-white/15 text-[10px] font-bold flex items-center gap-1 transition-all"
                          >
                            <Gamepad2 className="w-3 h-3 text-indigo-400" />
                            <span>{t('open_steam_client')}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <button type="button" onClick={() => { startLiveSession(null, selectedGame); setSelectedGame(null); }} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Таймер</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveDetails} className="p-4 sm:p-6 space-y-5">
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {t('modal_rating_label')}
                    </label>
                    {ratingInput && (
                      <button
                        type="button"
                        onClick={() => setRatingInput(null)}
                        className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
                      >
                        {t('modal_reset_rating')}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center my-2">
                    <div
                      style={{
                        color: sliderStyle.color,
                        textShadow: sliderStyle.textShadow
                      }}
                      className="text-4xl sm:text-5xl font-black tracking-tight transition-all duration-150 select-none"
                    >
                      {ratingInput ? ratingInput : '—'}
                      {ratingInput && <span className="text-base font-bold text-gray-500 ml-1">/ 10</span>}
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1">
                      {!ratingInput
                        ? t('modal_no_rating')
                        : ratingInput >= 9
                        ? 'Шедевр на всі часи!'
                        : ratingInput >= 7.5
                        ? 'Дуже крута гра'
                        : ratingInput >= 5
                        ? 'Непогано, але є нюанси'
                        : 'Слабко / Не зайшло'}
                    </span>
                  </div>

                  <div className="relative pt-2 pb-1">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={ratingInput || 5}
                      onChange={(e) => setRatingInput(parseFloat(e.target.value))}
                      style={{
                        accentColor: sliderStyle.accentHex,
                        background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                      }}
                      className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-2 px-0.5">
                      <span className="text-red-400">1</span>
                      <span>3</span>
                      <span className="text-amber-400">5</span>
                      <span>7</span>
                      <span>9</span>
                      <span className="text-emerald-400">10</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-300">{t('modal_calc_title')}</span>
                    <span className="text-xs font-bold text-white bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">{t('modal_total')}: {playtimeInput} {t('hours_short')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {[0.5, 1, 2, 3, 5].map((h) => (
                      <button key={h} type="button" onClick={() => handleAddSessionHours(h)} className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-500/30 border border-white/10 text-xs font-semibold text-gray-200 transition-all">+{h} {t('hours_short')}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                    <div className="flex gap-2">
                      <input type="number" step="0.1" min="0" value={sessionAddInput} onChange={(e) => setSessionAddInput(e.target.value)} placeholder={t('modal_today_ph')} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60" />
                      <button type="button" onClick={() => handleAddSessionHours(sessionAddInput)} className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 text-xs font-bold transition-all shrink-0 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('modal_add')}</button>
                    </div>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="number" step="0.1" min="0" max="10000" value={playtimeInput} onChange={(e) => setPlaytimeInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/60" title="Загальна кількість годин" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t('modal_notes')}</label>
                  <textarea rows="2" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder={t('modal_notes_ph')} className="w-full bg-black/50 border border-white/10 rounded-2xl p-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 resize-none text-sm" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button type="button" onClick={() => setSelectedGame(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">{t('modal_cancel')}</button>
                  <button type="submit" disabled={isSavingDetails} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2 transition-all active:scale-95"><Check className="w-4 h-4" /> {t('modal_save')}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSteamModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSteamModalOpen(false)} className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0e0e13] border border-white/15 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-white flex items-center gap-2"><RefreshCw className="w-5 h-5 text-indigo-400" />Синхронізація зі Steam</h3><button onClick={() => setIsSteamModalOpen(false)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button></div>
              {profile.steamSynced && (
                <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="text-xs text-emerald-200"><div className="font-bold text-emerald-300">🟢 Живий звʼязок зі Steam активний</div><div className="opacity-80 mt-0.5">Години рахуються наживо, коли ти запускаєш гру у Steam</div></div>
                  <button type="button" onClick={handleSteamUnlink} className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all"><Unlink className="w-3.5 h-3.5" /><span>Від'єднати</span></button>
                </div>
              )}
              <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5"><Globe className="w-4 h-4" /></div>
                <div className="text-xs text-amber-100/90 leading-relaxed"><span className="font-bold text-amber-300 flex items-center gap-1 mb-0.5"><AlertCircle className="w-3.5 h-3.5" />Важливо: Профіль має бути відкритим!</span>У налаштуваннях приватності Steam пункти <b>«Мій профіль»</b> та <b>«Подробиці про ігри»</b> мають стояти у статусі <b>Публічний</b>, щоб сайт бачив запущену гру та години.</div>
              </div>
              <form onSubmit={handleSteamSync} className="space-y-4">
                <input type="text" required value={steamInput} onChange={(e) => setSteamInput(e.target.value)} placeholder="https://steamcommunity.com/id/твій_нік" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/60" />
                <button type="submit" disabled={isSyncingSteam} className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"><RefreshCw className={`w-4 h-4 ${isSyncingSteam ? 'animate-spin' : ''}`} />{isSyncingSteam ? 'Звіряємо бібліотеку...' : 'Оновити та синхронізувати'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRouletteOpen && rouletteGame && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSpinning && setIsRouletteOpen(null)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0e0e13] border border-white/15 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center justify-center gap-2"><Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />{isSpinning ? 'Обираємо гру з беклогу...' : 'Твій вибір на сьогодні!'}</div>
              <div className="relative w-44 sm:w-48 aspect-[3/4] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/15 mb-5 bg-black"><img src={rouletteGame.imageUrl} alt={rouletteGame.title} className={`w-full h-full object-cover transition-all duration-150 ${isSpinning ? 'scale-110 blur-[2px]' : 'scale-100'}`} /></div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">{rouletteGame.title}</h3>
              <p className="text-xs text-gray-400 mb-6">{rouletteGame.releaseYear ? `${rouletteGame.releaseYear} • ` : ''}{rouletteGame.genres?.join(', ')}</p>
              {!isSpinning && (
                <div className="flex gap-3">
                  <button onClick={startRoulette} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-gray-300 transition-all">Крутити ще раз</button>
                  <button onClick={() => { handleUpdateStatus(null, rouletteGame._id, 'playing', rouletteGame.title); setIsRouletteOpen(false); }} className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"><Play className="w-4 h-4 fill-current" />Почати грати</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}