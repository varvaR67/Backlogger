import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import LiveSearch from '../components/LiveSearch';
import { 
  Trash2, LogOut, User, Sparkles, Trophy, Flame, 
  Clock, Star, Dices, X, Check, Play, Square, Layers, 
  MessageSquare, RefreshCw, Plus, SlidersHorizontal, Menu, 
  Globe, AlertCircle, Award, Shield, Zap, Crown, Ghost, 
  Rocket, Gamepad2, Sword, Heart, Bot, Send, Unlink, Film, LayoutGrid, MessageSquareQuote 
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

const TITLE_PRESETS = ['Дослідник всесвітів', 'Мисливець за платиною', 'Повелитель беклогу', 'Кібер-легенда', 'Нічний геймер', 'Критик індустрії'];

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
  const [items, setItems] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
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

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchProfile();
    fetchFeed();
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

  const openLeaderboard = async () => {
    setIsMobileMenuOpen(false);
    setIsLeaderboardOpen(true);
    setIsLoadingLeaderboard(true);
    try {
      const res = await axios.get('http://localhost:5000/api/items/leaderboard');
      setLeaderboard(res.data);
    } catch (error) {
      toast.error("Не вдалося завантажити топ гравців");
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const stats = useMemo(() => {
    const wishlist = items.filter(i => i.status === 'wishlist').length;
    const backlog = items.filter(i => i.status === 'backlog').length;
    const playing = items.filter(i => i.status === 'playing').length;
    const completed = items.filter(i => i.status === 'completed').length;
    const ownedTotal = backlog + playing + completed;
    const total = items.length;
    const completionRate = ownedTotal > 0 ? Math.round((completed / ownedTotal) * 100) : 0;
    const totalHours = Math.round(items.reduce((acc, item) => acc + (Number(item.playtime) || 0), 0) * 10) / 10;
    const maxGameHours = items.reduce((max, item) => Math.max(max, Number(item.playtime) || 0), 0);
    const ratedItems = items.filter(i => i.personalRating);
    const perfectTenCount = items.filter(i => Number(i.personalRating) === 10).length;
    const commentedItems = items.filter(i => i.comment && i.comment.trim().length > 0);
    const avgRating = ratedItems.length > 0 ? (ratedItems.reduce((acc, i) => acc + Number(i.personalRating), 0) / ratedItems.length).toFixed(1) : '—';
    const xp = (ownedTotal * 40) + (completed * 120) + (ratedItems.length * 30) + (commentedItems.length * 25) + Math.round(totalHours * 5);
    const level = Math.floor(xp / 200) + 1;
    return {
      total, ownedTotal, wishlist, backlog, playing, completed, completionRate,
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
    { id: 'masterpiece', title: 'Десять із десяти!', desc: 'Поставити максимальну оцінку 10/10 шедевру', unlocked: stats.perfectTenCount >= 1, progress: `${Math.min(stats.perfectTenCount, 1)}/1`, icon: Zap },
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
      { tier: 'A', label: 'Відмінні (8)', color: 'from-emerald-400 to-teal-500 text-black', games: rated.filter(i => i.personalRating === 8) },
      { tier: 'B', label: 'Хороші (7)', color: 'from-indigo-400 to-blue-500 text-white', games: rated.filter(i => i.personalRating === 7) },
      { tier: 'C', label: 'Середні (5–6)', color: 'from-purple-400 to-fuchsia-500 text-white', games: rated.filter(i => i.personalRating >= 5 && i.personalRating <= 6) },
      { tier: 'D', label: 'Слабкі (1–4)', color: 'from-rose-500 to-red-600 text-white', games: rated.filter(i => i.personalRating <= 4) },
    ];
  }, [items]);

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const finalAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : profile.avatar;
    try {
      const res = await axios.put('http://localhost:5000/api/items/profile', { ...profile, avatar: finalAvatar });
      setProfile(prev => ({ ...prev, avatar: res.data.avatar, customTitle: res.data.customTitle, accentColor: res.data.accentColor, favoriteGameId: res.data.favoriteGameId || '', steamSynced: Boolean(res.data.steamSynced) }));
      toast.success('Профіль оновлено!', { icon: '✨' });
      setIsProfileOpen(false);
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
      fetchFeed(); // Оновлюємо стрічку
    } catch (error) {
      toast.error(error.response?.data?.message || "Не вдалося додати гру");
    }
  };

  const handleUpdateStatus = async (e, id, newStatus, gameTitle) => {
    if (e) e.stopPropagation();
    try {
      const res = await axios.put(`http://localhost:5000/api/items/${id}`, { status: newStatus });
      setItems(items.map(item => item._id === id ? res.data : item));
      const statusNames = { 'wishlist': 'Вішліст', 'backlog': 'Беклог', 'playing': 'Граю зараз', 'completed': 'Пройдено' };
      toast.success(`"${gameTitle}" → ${statusNames[newStatus]}`, { icon: '✨' });
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
      const res = await axios.put(`http://localhost:5000/api/items/${selectedGame._id}`, { personalRating: ratingInput, playtime: finalPlaytime, comment: commentInput });
      setItems(items.map(item => item._id === selectedGame._id ? res.data : item));
      setSelectedGame(res.data);
      toast.success('Дані гри збережено!');
      setSelectedGame(null);
      fetchFeed(); // Оновлюємо стрічку після відгуку
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
    { id: 'all', label: 'Всі ігри', count: stats.ownedTotal },
    { id: 'backlog', label: 'Беклог', count: stats.backlog },
    { id: 'playing', label: 'Граю', count: stats.playing },
    { id: 'completed', label: 'Пройдено', count: stats.completed },
    { id: 'wishlist', label: 'Вішліст', count: stats.wishlist },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-indigo-500/30 relative overflow-x-hidden font-sans flex flex-col">
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050507] to-[#050507]" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10 flex-1">
        
        <nav className="flex items-center justify-between mb-8 sm:mb-12 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Backlogger
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => toast('Розділ «Кіно та Серіали» відкриємо наступним кроком!', { icon: '🎬' })} className="flex items-center gap-2 bg-[#0b0b0f] hover:bg-white/[0.06] text-gray-300 border border-white/10 px-3 py-2 rounded-full text-xs font-semibold transition-all">
              <Film className="w-3.5 h-3.5 text-pink-400" /> <span>Кіно</span> <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px]">Скоро</span>
            </button>
            <button onClick={openLeaderboard} className="flex items-center gap-2 bg-[#0b0b0f] hover:bg-white/[0.06] text-amber-300 border border-amber-500/25 px-3.5 py-2 rounded-full text-xs font-semibold transition-all">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> <span>Топ гравців</span>
            </button>
            <button onClick={() => setIsAiOpen(true)} className="flex items-center gap-2 bg-[#0b0b0f] hover:bg-white/[0.06] text-purple-300 border border-white/10 px-3.5 py-2 rounded-full text-xs font-semibold transition-all">
              <Bot className="w-3.5 h-3.5" /> <span>ШІ-Порадник</span>
            </button>
            <button onClick={() => setIsTierListOpen(true)} className="flex items-center gap-2 bg-[#0b0b0f] hover:bg-white/[0.06] text-indigo-200 border border-white/10 px-3 py-2 rounded-full text-xs font-semibold transition-all">
              <LayoutGrid className="w-3.5 h-3.5" /> <span>Тір-ліст</span>
            </button>
            <button onClick={() => setIsSteamModalOpen(true)} className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${profile.steamSynced ? 'bg-[#0b0b0f] hover:bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-[#0b0b0f] hover:bg-white/[0.06] text-indigo-300 border-white/10'}`}>
              <RefreshCw className="w-3.5 h-3.5" /> <span>{profile.steamSynced ? 'Steam' : 'Синхр. Steam'}</span>
            </button>

            <div className={`flex items-center gap-3 bg-[#0b0b0f] p-1.5 pl-2 pr-4 rounded-full border ${activeAccent.ring}`}>
              <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left">
                {renderAvatar("w-7 h-7", "w-3.5 h-3.5")}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white hover:text-indigo-300">{username || 'Геймер'}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${activeAccent.badge}`}>LVL {stats.level}</span>
                  </div>
                </div>
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button onClick={onLogout} className="text-xs font-medium text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /><span>Вийти</span></button>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden flex items-center gap-2 bg-[#0b0b0f] border border-white/10 pl-2 pr-3 py-1.5 rounded-2xl text-gray-200 active:scale-95 transition-all">
            {renderAvatar("w-6 h-6", "w-3 h-3")} <span className="text-xs font-bold text-white max-w-[80px] truncate">{username || 'Меню'}</span> {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -16, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -16, height: 0 }} className="md:hidden overflow-hidden mb-6">
              <div className="bg-[#0b0b0f] border border-white/15 rounded-3xl p-4 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsProfileOpen(true); }} className="flex items-center gap-2.5 text-left">
                    {renderAvatar("w-10 h-10", "w-5 h-5")}
                    <div>
                      <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-white">{username || 'Геймер'}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${activeAccent.badge}`}>LVL {stats.level}</span></div>
                      <div className="text-[11px] text-indigo-300">{profile.customTitle} • Ачівки ({unlockedCount}/{achievements.length}) →</div>
                    </div>
                  </button>
                  <button onClick={onLogout} className="bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Вийти</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={openLeaderboard} className="flex justify-center items-center gap-1.5 bg-white/[0.04] text-amber-300 border border-white/10 py-2.5 px-2 rounded-2xl text-[11px] font-semibold"><Crown className="w-3.5 h-3.5" /><span>Топ гравців</span></button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsAiOpen(true); }} className="flex justify-center items-center gap-1.5 bg-white/[0.04] text-purple-300 border border-white/10 py-2.5 px-2 rounded-2xl text-[11px] font-semibold"><Bot className="w-3.5 h-3.5" /><span>ШІ-Порадник</span></button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsTierListOpen(true); }} className="flex justify-center items-center gap-1.5 bg-white/[0.04] text-indigo-200 border border-white/10 py-2.5 px-2 rounded-2xl text-[11px] font-semibold"><LayoutGrid className="w-3.5 h-3.5" /><span>Тір-ліст</span></button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsSteamModalOpen(true); }} className="flex justify-center items-center gap-1.5 bg-white/[0.04] text-emerald-300 border border-white/10 py-2.5 px-2 rounded-2xl text-[11px] font-semibold"><RefreshCw className="w-3.5 h-3.5" /><span>{profile.steamSynced ? 'Steam (Активний)' : 'Steam'}</span></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSession && (
            <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="mb-6 sm:mb-8 bg-[#090b0a] border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg">
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

        <header className="mb-7 sm:mb-10 text-center max-w-2xl mx-auto px-2">
          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/50 mb-2 sm:mb-3">Твій ігровий всесвіт.</h1>
          <p className="text-gray-400 text-xs sm:text-lg">Колекціонуй, оцінюй та відстежуй кожну годину своїх пригод.</p>
        </header>

        <LiveSearch onAddGame={handleAddGame} />

        {/* Стрічка "Останні відгуки спільноти" */}
        {feedItems.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4 px-1">
              <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Активність спільноти</h2>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {feedItems.map(feedItem => {
                const isPositive = feedItem.personalRating >= 8;
                const isMixed = feedItem.personalRating >= 5 && feedItem.personalRating < 8;
                const badgeColor = isPositive ? 'bg-emerald-500 text-white' : isMixed ? 'bg-amber-500 text-white' : 'bg-red-500 text-white';

                return (
                  <div key={feedItem._id} className="snap-start shrink-0 w-[320px] sm:w-[380px] bg-[#0b0b0f] border border-white/[0.08] rounded-2xl p-3.5 flex gap-3.5">
                    <img src={feedItem.imageUrl} alt={feedItem.title} className="w-16 h-24 object-cover rounded-xl border border-white/10 shrink-0 bg-black/50" />
                    
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white line-clamp-1">{feedItem.title}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            {renderUserAvatar(feedItem.user?.avatar, feedItem.user?.username, "w-4 h-4", "w-2 h-2")}
                            <span className="text-[11px] font-medium text-indigo-300 truncate">{feedItem.user?.username || 'Геймер'}</span>
                          </div>
                        </div>
                        {feedItem.personalRating && (
                          <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${badgeColor}`}>
                            {feedItem.personalRating}
                          </div>
                        )}
                      </div>
                      
                      {feedItem.comment && (
                        <p className="text-[11px] sm:text-xs text-gray-300 line-clamp-2 mt-1 leading-relaxed">
                          {feedItem.comment}
                        </p>
                      )}
                      
                      <div className="mt-auto pt-2 flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                        <Check className="w-3 h-3 text-emerald-400" />
                        Зіграно {feedItem.playtime || 0} год
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="bg-[#090d0b] border border-emerald-900/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">Прогрес</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0"><Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
                <span className="text-xl sm:text-3xl font-bold text-white">{stats.completionRate}%</span>
                <span className="text-[10px] sm:text-xs text-gray-500">({stats.completed} пройдено)</span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-black/40 rounded-full overflow-hidden">
                <div style={{ width: `${stats.completionRate}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-700" />
              </div>
            </div>
          </div>

          <div className="bg-[#0d0b08] border border-amber-900/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">Активність</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0"><Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
            </div>
            <div className="flex items-end justify-between gap-1">
              <div><div className="text-xl sm:text-3xl font-bold text-white">{stats.playing}</div><div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">у процесі</div></div>
              <div className="text-right">
                <div className="text-xs sm:text-lg font-semibold text-amber-200 flex items-center justify-end gap-1"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /><span>{stats.totalHours} год</span></div>
                <div className="text-[10px] sm:text-[11px] text-gray-500">награно</div>
              </div>
            </div>
          </div>

          <div onClick={() => setIsProfileOpen(true)} className="cursor-pointer bg-[#0c0910] border border-purple-900/40 hover:border-purple-700/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">Твій ранг і смак</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0"><Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
            </div>
            <div className="flex items-end justify-between gap-1">
              <div><div className="text-xl sm:text-3xl font-bold text-white flex items-baseline gap-0.5">{stats.avgRating}<span className="text-[10px] sm:text-xs font-normal text-gray-500">/10</span></div><div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">середня оцінка</div></div>
              <div className="text-right">
                <div className="text-xs sm:text-lg font-semibold text-purple-300 flex items-center justify-end gap-1"><Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />{unlockedCount}/{achievements.length}</div>
                <div className="text-[10px] sm:text-[11px] text-gray-500">ачівок відкрито</div>
              </div>
            </div>
          </div>

          <button onClick={startRoulette} className="group bg-[#090a10] border border-indigo-900/40 hover:border-indigo-700/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between text-left transition-all active:scale-[0.99]">
            <div className="flex items-center justify-between w-full mb-2 sm:mb-3 gap-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">Що обрати?</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:rotate-12 transition-transform shrink-0"><Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
            </div>
            <div>
              <div className="text-sm sm:text-xl font-bold text-white mb-0.5 leading-tight group-hover:text-indigo-300 transition-colors">Рулетка беклогу</div>
              <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">Обрати гру на вечір →</p>
            </div>
          </button>
        </div>

        <div className="flex justify-center mb-7 sm:mb-10">
          <div className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex bg-[#0b0b0f] p-1 sm:p-1.5 rounded-2xl border border-white/[0.07]">
            {filterTabs.map((tab) => (
              <button key={tab.id} onClick={() => setFilter(tab.id)} className={`relative px-1 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1 sm:gap-1.5 ${filter === tab.id ? 'bg-white/[0.08] text-white border border-white/10' : 'text-gray-400 hover:text-gray-200'}`}>
                <span className="truncate">{tab.label}</span>
                <span className={`text-[9px] sm:text-[11px] px-1 sm:px-1.5 py-0.5 rounded-md ${filter === tab.id ? 'bg-indigo-500/30 text-indigo-200' : 'bg-white/5 text-gray-500'}`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
            {filteredItems.map(item => {
              const isOwnedSteamGame = Boolean(item.steamAppId) || Number(item.playtime) > 0;
              const isWishlistItem = item.status === 'wishlist' && !isOwnedSteamGame;

              return (
                <div key={item._id} onClick={() => openGameDetails(item)} className="group cursor-pointer bg-[#0b0b0f] border border-white/[0.07] hover:border-white/20 rounded-2xl sm:rounded-3xl overflow-hidden sm:hover:-translate-y-1.5 transition-transform duration-200 shadow-lg flex flex-col relative">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#0b0b0f]">
                    <img src={item.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Немає+обкладинки'} alt={item.title} loading="lazy" decoding="async" onError={(e) => { if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg'); }} className="w-full h-full object-cover scale-[1.01] transition-transform duration-500 ease-out group-hover:scale-105" />
                    
                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-col gap-1 sm:gap-1.5 items-end z-30">
                      {item.metacritic && <div className="bg-[#09090d]/95 border border-white/15 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-md"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400" /><span className="text-[10px] sm:text-xs font-bold text-white">{item.metacritic}</span></div>}
                      {item.personalRating && <div className="bg-indigo-600 border border-indigo-300/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl flex items-center gap-1 shadow-md"><Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 fill-amber-300" /><span className="text-[10px] sm:text-xs font-bold text-white">{item.personalRating}/10</span></div>}
                    </div>

                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 z-30">
                      <button onClick={(e) => handleDeleteGame(e, item._id, item.title)} className="opacity-90 sm:opacity-0 group-hover:opacity-100 bg-[#09090d]/95 hover:bg-red-500 text-gray-200 hover:text-white border border-white/15 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-opacity duration-150 shadow-md" title="Видалити гру"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                      {!isWishlistItem && (
                        <button onClick={(e) => startLiveSession(e, item)} className={`opacity-90 sm:opacity-0 group-hover:opacity-100 border p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-opacity duration-150 shadow-md ${activeSession?.gameId === item._id ? 'opacity-100 bg-emerald-500 text-white border-emerald-300' : 'bg-[#09090d]/95 hover:bg-indigo-500 text-gray-200 hover:text-white border-white/15'}`} title="Запустити живий відлік часу гри"><Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /></button>
                      )}
                    </div>

                    <div className="absolute bottom-5 left-2.5 right-2.5 sm:left-3 sm:right-3 flex items-center justify-between text-[10px] sm:text-xs z-30 pointer-events-none">
                      {!isWishlistItem ? (
                        <span className="flex items-center gap-1.5 bg-[#09090d]/95 text-white font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-lg">
                          <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                          {item.playtime > 0 ? `${item.playtime} год` : '0 год'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-pink-500/90 text-white font-bold px-2.5 py-1 rounded-full border border-pink-300/30 shadow-lg">
                          <Heart className="w-3 h-3 fill-current shrink-0" />
                          У вішлісті
                        </span>
                      )}
                      {item.comment && <span className="bg-[#09090d]/95 p-1.5 rounded-full border border-white/20 shadow-lg pointer-events-auto" title="Є особиста нотатка"><MessageSquare className="w-3 h-3 text-purple-300" /></span>}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 pt-3 -mt-3 flex flex-col flex-1 bg-[#0b0b0f] relative z-20 before:content-[''] before:absolute before:-top-8 before:inset-x-0 before:h-8 before:bg-gradient-to-t before:from-[#0b0b0f] before:to-transparent before:pointer-events-none">
                    <h3 className="font-bold text-sm sm:text-base text-white mb-0.5 sm:mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors" title={item.title}>{item.title}</h3>
                    <p className="text-[11px] sm:text-xs text-gray-400 mb-2.5 sm:mb-3 line-clamp-1">{item.releaseYear ? `${item.releaseYear} • ` : ''} {item.genres?.length ? item.genres.join(', ') : 'Гра'}</p>
                    
                    <button type="button" onClick={() => openGameDetails(item)} className="w-full mb-2 sm:mb-2.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-white/[0.03] hover:bg-indigo-500/20 border border-white/[0.07] hover:border-indigo-500/30 text-[10px] sm:text-[11px] font-medium text-gray-300 hover:text-indigo-200 flex items-center justify-between transition-colors">
                      <span className="flex items-center gap-1.5 truncate"><SlidersHorizontal className="w-3 h-3 text-indigo-400 shrink-0" /><span className="truncate">Оцінити та час</span></span>
                      <span className="text-indigo-400 font-bold ml-1">+</span>
                    </button>

                    {isWishlistItem ? (
                      <button
                        type="button"
                        onClick={(e) => handleUpdateStatus(e, item._id, 'backlog', item.title)}
                        className="mt-auto w-full py-2 rounded-xl bg-pink-500/15 hover:bg-indigo-500 text-pink-200 hover:text-white border border-pink-500/30 hover:border-indigo-400 text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ПРИДБАНО → У БЕКЛОГ</span>
                      </button>
                    ) : (
                      <div onClick={(e) => e.stopPropagation()} className="mt-auto grid grid-cols-3 bg-black/60 rounded-xl p-0.5 sm:p-1 border border-white/[0.07] gap-0.5">
                        {[
                          { id: 'backlog', label: 'БЕКЛОГ' },
                          { id: 'playing', label: 'ГРАЮ' },
                          { id: 'completed', label: 'ГОТОВО' }
                        ].map(st => {
                          const currentSt = item.status === 'wishlist' ? 'playing' : item.status;
                          return (
                            <button
                              key={st.id}
                              onClick={(e) => handleUpdateStatus(e, item._id, st.id, item.title)}
                              className={`py-1 sm:py-1.5 text-[8px] sm:text-[9px] font-bold tracking-wider rounded-lg transition-colors ${
                                currentSt === st.id
                                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
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
          <div className="text-center py-16 sm:py-20 px-4 bg-[#0b0b0f] border border-white/[0.06] rounded-3xl">
            <p className="text-gray-400 text-base sm:text-lg font-medium mb-1">У цій категорії поки порожньо</p>
            <p className="text-gray-600 text-xs sm:text-sm">Скористайся пошуком вище, щоб додати гру у колекцію або кнопкою «У вішліст»</p>
          </div>
        )}
      </div>

      <button onClick={() => setIsAiOpen(true)} className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#121218] hover:bg-indigo-600 text-white shadow-2xl border border-white/15 hover:scale-105 active:scale-95 transition-all flex items-center gap-2" title="Запитати ШІ-Помічника">
        <Bot className="w-5 h-5 text-indigo-400" /> <span className="hidden sm:inline text-xs font-bold pr-1">ШІ-Гід</span>
      </button>

      <footer className="mt-20 border-t border-white/[0.07] bg-[#07070a] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>© {new Date().getFullYear()} Backlogger • У колекції {stats.ownedTotal} ігор та {stats.totalHours} год пригод.</div>
            <div className="flex items-center gap-2 text-gray-400 font-medium"><span>З гордістю створено в Україні</span><span>🇺🇦</span></div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isAiOpen && <AiModal onClose={() => setIsAiOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isLeaderboardOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLeaderboardOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0e0e13] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Зал слави: Топ гравців
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Рейтинг користувачів за найбільшим рівнем та досвідом (XP)</p>
                </div>
                <button onClick={() => setIsLeaderboardOpen(false)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>

              {isLoadingLeaderboard ? (
                <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Завантаження рейтингу гравців...</div>
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
                            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-[#14141c] border-amber-400/50 shadow-lg'
                            : isCurrentUser
                            ? 'bg-indigo-500/15 border-indigo-400/40'
                            : 'bg-[#14141c] border-white/[0.08]'
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
                              {player.customTitle} • {player.totalGames} ігор ({player.completedGames} пройдено) • {player.totalHours} год
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
                      <div className="flex flex-wrap gap-1">{TITLE_PRESETS.map(t => <button type="button" key={t} onClick={() => setProfile({ ...profile, customTitle: t })} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-0.5 rounded-lg border border-white/5">{t}</button>)}</div>
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
              <div className="relative h-36 sm:h-44 overflow-hidden">
                <img src={selectedGame.imageUrl} alt={selectedGame.title} className="w-full h-full object-cover blur-sm scale-105 opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-[#0e0e13]/60 to-transparent" />
                <button onClick={() => setSelectedGame(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-white/20 text-white p-2 rounded-full border border-white/10 transition-colors"><X className="w-5 h-5" /></button>
                <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6 flex items-end justify-between gap-3">
                  <div className="flex items-end gap-3 sm:gap-4"><img src={selectedGame.imageUrl} alt={selectedGame.title} className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-2xl border border-white/20 shadow-xl hidden xs:block" /><div><h2 className="text-lg sm:text-2xl font-extrabold text-white leading-tight line-clamp-1">{selectedGame.title}</h2><p className="text-xs text-gray-400 mt-1 line-clamp-1">{selectedGame.releaseYear ? `${selectedGame.releaseYear} • ` : ''}{selectedGame.genres?.join(', ')}</p></div></div>
                  <button type="button" onClick={() => { startLiveSession(null, selectedGame); setSelectedGame(null); }} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all"><Play className="w-3.5 h-3.5 fill-current" /><span>Таймер</span></button>
                </div>
              </div>
              <form onSubmit={handleSaveDetails} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Твоя особиста оцінка {ratingInput ? `(${ratingInput}/10)` : '(не виставлено)'}</label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => <button type="button" key={num} onClick={() => setRatingInput(ratingInput === num ? null : num)} className={`py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border ${ratingInput >= num ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}>{num}</button>)}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2"><span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-300">Калькулятор годин</span><span className="text-xs font-bold text-white bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">Всього: {playtimeInput} год</span></div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">{[0.5, 1, 2, 3, 5].map((h) => <button key={h} type="button" onClick={() => handleAddSessionHours(h)} className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-500/30 border border-white/10 text-xs font-semibold text-gray-200 transition-all">+{h} год</button>)}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                    <div className="flex gap-2"><input type="number" step="0.1" min="0" value={sessionAddInput} onChange={(e) => setSessionAddInput(e.target.value)} placeholder="Години за сьогодні..." className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60" /><button type="button" onClick={() => handleAddSessionHours(sessionAddInput)} className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 text-xs font-bold transition-all shrink-0 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Додати</button></div>
                    <div className="relative"><Clock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="number" step="0.1" min="0" max="10000" value={playtimeInput} onChange={(e) => setPlaytimeInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/60" title="Загальна кількість годин" /></div>
                  </div>
                </div>
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Твої враження або нотатки</label><textarea rows="2" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Напиши, що сподобалось, на якому босі зупинився або чому гра шедевр..." className="w-full bg-black/50 border border-white/10 rounded-2xl p-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 resize-none text-sm" /></div>
                <div className="flex items-center justify-end gap-3 pt-1"><button type="button" onClick={() => setSelectedGame(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Скасувати</button><button type="submit" disabled={isSavingDetails} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2 transition-all active:scale-95"><Check className="w-4 h-4" /> Зберегти</button></div>
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