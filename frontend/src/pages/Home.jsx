import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import LiveSearch from '../components/LiveSearch';
import { 
  Trash2, LogOut, User, Sparkles, Trophy, Flame, 
  Clock, Star, Dices, X, Check, Play, Square, Layers, 
  MessageSquare, RefreshCw, Plus, SlidersHorizontal, Menu, 
  Globe, AlertCircle, Award, Shield, Zap, Crown, Ghost, 
  Rocket, Gamepad2, Sword 
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

const TITLE_PRESETS = [
  'Дослідник всесвітів',
  'Мисливець за платиною',
  'Повелитель беклогу',
  'Кібер-легенда',
  'Нічний геймер',
  'Критик індустрії'
];

export default function Home({ username, onLogout }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState({
    avatar: 'cyber',
    customTitle: 'Дослідник всесвітів',
    accentColor: 'indigo',
    favoriteGameId: '',
    steamSynced: false
  });
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

  useEffect(() => {
    fetchItems();
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items');
      setItems(res.data);
    } catch (error) {
      toast.error("Помилка завантаження бібліотеки");
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
          steamSynced: Boolean(res.data.steamSynced)
        });
        if (res.data.avatar?.startsWith('http')) {
          setCustomAvatarUrl(res.data.avatar);
        }
      }
    } catch (error) {
      // Стандартні налаштування
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const backlog = items.filter(i => i.status === 'backlog').length;
    const playing = items.filter(i => i.status === 'playing').length;
    const completed = items.filter(i => i.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const totalHours = Math.round(items.reduce((acc, item) => acc + (Number(item.playtime) || 0), 0) * 10) / 10;
    const maxGameHours = items.reduce((max, item) => Math.max(max, Number(item.playtime) || 0), 0);
    
    const ratedItems = items.filter(i => i.personalRating);
    const commentedItems = items.filter(i => i.comment && i.comment.trim().length > 0);
    const avgRating = ratedItems.length > 0
      ? (ratedItems.reduce((acc, i) => acc + Number(i.personalRating), 0) / ratedItems.length).toFixed(1)
      : '—';

    const xp = (total * 40) + (completed * 120) + (ratedItems.length * 30) + (commentedItems.length * 25) + Math.round(totalHours * 5);
    const level = Math.floor(xp / 200) + 1;
    const currentLevelXp = xp % 200;
    const xpProgress = Math.round((currentLevelXp / 200) * 100);

    return { 
      total, backlog, playing, completed, completionRate, 
      totalHours, maxGameHours, ratedCount: ratedItems.length, 
      commentedCount: commentedItems.length, avgRating,
      xp, level, currentLevelXp, xpProgress
    };
  }, [items]);

  const achievements = useMemo(() => [
    {
      id: 'first_game',
      title: 'Перший крок',
      desc: 'Додати першу гру до своєї колекції',
      unlocked: stats.total >= 1,
      progress: `${Math.min(stats.total, 1)}/1`,
      icon: Gamepad2
    },
    {
      id: 'collector',
      title: 'Колекціонер',
      desc: 'Зібрати 5 або більше ігор у бібліотеці',
      unlocked: stats.total >= 5,
      progress: `${Math.min(stats.total, 5)}/5`,
      icon: Layers
    },
    {
      id: 'finisher',
      title: 'До фінальних титрів',
      desc: 'Пройти свою першу гру до кінця',
      unlocked: stats.completed >= 1,
      progress: `${Math.min(stats.completed, 1)}/1`,
      icon: Trophy
    },
    {
      id: 'critic',
      title: 'Суворий критик',
      desc: 'Виставити особисту оцінку 5 іграм',
      unlocked: stats.ratedCount >= 5,
      progress: `${Math.min(stats.ratedCount, 5)}/5`,
      icon: Star
    },
    {
      id: 'time_lord',
      title: 'Володар часу',
      desc: 'Награти сумарно понад 50 годин у іграх',
      unlocked: stats.totalHours >= 50,
      progress: `${Math.min(Math.round(stats.totalHours), 50)}/50 год`,
      icon: Clock
    },
    {
      id: 'cybersport',
      title: 'Кіберспортсмен',
      desc: 'Награти 100+ годин в одній грі',
      unlocked: stats.maxGameHours >= 100,
      progress: `${Math.min(Math.round(stats.maxGameHours), 100)}/100 год`,
      icon: Flame
    },
    {
      id: 'writer',
      title: 'Літописець',
      desc: 'Залишити особисті нотатки до 3 ігор',
      unlocked: stats.commentedCount >= 3,
      progress: `${Math.min(stats.commentedCount, 3)}/3`,
      icon: MessageSquare
    },
    {
      id: 'steam_link',
      title: 'Синхронізований',
      desc: 'Підключити та синхронізувати бібліотеку Steam',
      unlocked: profile.steamSynced,
      progress: profile.steamSynced ? 'Виконано' : '0/1',
      icon: RefreshCw
    }
  ], [stats, profile.steamSynced]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const activeAccent = ACCENT_THEMES.find(t => t.id === profile.accentColor) || ACCENT_THEMES[0];
  const favoriteGame = items.find(i => i._id === profile.favoriteGameId);

  const renderAvatar = (sizeClass = "w-7 h-7", iconClass = "w-3.5 h-3.5") => {
    if (profile.avatar?.startsWith('http')) {
      return (
        <img 
          src={profile.avatar} 
          alt={username} 
          className={`${sizeClass} rounded-full object-cover border border-white/20 shrink-0`}
        />
      );
    }
    const preset = AVATAR_PRESETS.find(p => p.id === profile.avatar) || AVATAR_PRESETS[0];
    const IconComp = preset.icon;
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr ${preset.gradient} flex items-center justify-center border border-white/25 shadow-sm shrink-0`}>
        <IconComp className={`${iconClass} text-white`} />
      </div>
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const finalAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : profile.avatar;

    try {
      const res = await axios.put('http://localhost:5000/api/items/profile', {
        ...profile,
        avatar: finalAvatar
      });
      setProfile({
        avatar: res.data.avatar,
        customTitle: res.data.customTitle,
        accentColor: res.data.accentColor,
        favoriteGameId: res.data.favoriteGameId || '',
        steamSynced: Boolean(res.data.steamSynced)
      });
      toast.success('Профіль оновлено!', { icon: '✨' });
      setIsProfileOpen(false);
    } catch (error) {
      toast.error('Не вдалося зберегти профіль');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddGame = async (gameData) => {
    const isDuplicate = items.some(
      item => item.title.toLowerCase() === gameData.title.toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`"${gameData.title}" вже є у твоїй бібліотеці!`, { icon: '⚠️' });
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/items', {
        title: gameData.title,
        imageUrl: gameData.imageUrl,
        releaseYear: gameData.releaseYear,
        metacritic: gameData.metacritic,
        genres: gameData.genres,
        status: 'backlog'
      });
      setItems([res.data, ...items]);
      toast.success(`"${gameData.title}" додано до колекції!`);
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
        'backlog': 'Беклог',
        'playing': 'Граю зараз',
        'completed': 'Пройдено'
      };
      
      toast.success(`"${gameTitle}" → ${statusNames[newStatus]}`, { icon: '✨' });
    } catch (error) {
      toast.error("Помилка оновлення статусу");
    }
  };

  const handleDeleteGame = async (e, id, gameTitle) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`);
      setItems(items.filter(item => item._id !== id));
      if (selectedGame?._id === id) setSelectedGame(null);
      if (activeSession?.gameId === id) setActiveSession(null);
      toast.success(`"${gameTitle}" видалено`, { icon: '🗑️' });
    } catch (error) {
      toast.error("Помилка видалення гри");
    }
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

    const extraHours = Number(sessionAddInput) > 0 ? Number(sessionAddInput) : 0;
    const finalPlaytime = Math.round(((Number(playtimeInput) || 0) + extraHours) * 10) / 10;

    try {
      const res = await axios.put(`http://localhost:5000/api/items/${selectedGame._id}`, {
        personalRating: ratingInput,
        playtime: finalPlaytime,
        comment: commentInput
      });
      setItems(items.map(item => item._id === selectedGame._id ? res.data : item));
      setSelectedGame(res.data);
      toast.success('Оцінку та час збережено!');
      setSelectedGame(null);
    } catch (error) {
      toast.error('Не вдалося зберегти зміни');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const startLiveSession = (e, game) => {
    if (e) e.stopPropagation();
    if (activeSession?.gameId === game._id) return;
    setActiveSession({
      gameId: game._id,
      title: game.title,
      startTime: Date.now()
    });
    toast.success(`Таймер для "${game.title}" запущено! Приємної гри.`, { icon: '▶️' });
  };

  const stopLiveSession = async () => {
    if (!activeSession) return;
    const targetGame = items.find(i => i._id === activeSession.gameId);
    if (!targetGame) {
      setActiveSession(null);
      return;
    }

    const rawHours = elapsedSeconds / 3600;
    const addedHours = elapsedSeconds >= 10 ? Math.max(0.1, Math.round(rawHours * 10) / 10) : 0;
    const newTotal = Math.round(((Number(targetGame.playtime) || 0) + addedHours) * 10) / 10;

    try {
      const res = await axios.put(`http://localhost:5000/api/items/${targetGame._id}`, {
        playtime: newTotal,
        status: targetGame.status === 'backlog' ? 'playing' : targetGame.status
      });
      setItems(items.map(item => item._id === targetGame._id ? res.data : item));
      toast.success(
        addedHours > 0 
          ? `Сесію завершено! +${addedHours} год до "${targetGame.title}"` 
          : `Сесію зупинено (менше 10 секунд)`,
        { icon: '⏹️' }
      );
    } catch (err) {
      toast.error('Помилка збереження сесії');
    } finally {
      setActiveSession(null);
    }
  };

  const formatTimer = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  const handleSteamSync = async (e) => {
    e.preventDefault();
    if (!steamInput.trim()) return;
    setIsSyncingSteam(true);
    localStorage.setItem('steamProfile', steamInput.trim());

    try {
      const res = await axios.post('http://localhost:5000/api/items/steam-sync', {
        steamInput: steamInput.trim()
      });
      setItems(res.data.items);
      if (res.data.userProfile) {
        setProfile(prev => ({
          ...prev,
          avatar: res.data.userProfile.avatar || prev.avatar,
          steamSynced: true
        }));
        if (res.data.userProfile.avatar?.startsWith('http')) {
          setCustomAvatarUrl(res.data.userProfile.avatar);
        }
      }
      const added = res.data.importedCount || 0;
      const updated = res.data.syncedCount || 0;
      toast.success(`Steam синхронізовано! Додано ігор: ${added}, оновлено: ${updated}`, { icon: '🎮' });
      setIsSteamModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Не вдалося синхронізувати зі Steam');
    } finally {
      setIsSyncingSteam(false);
    }
  };

  const startRoulette = () => {
    const backlogGames = items.filter(i => i.status === 'backlog');
    if (backlogGames.length === 0) {
      toast.error('Твій беклог порожній! Додай ігри або переведи щось у категорію Беклог.', { icon: '🎲' });
      return;
    }

    setIsMobileMenuOpen(false);
    setIsRouletteOpen(true);
    setIsSpinning(true);

    let counter = 0;
    const totalSpins = 16;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * backlogGames.length);
      setRouletteGame(backlogGames[randomIndex]);
      counter++;

      if (counter >= totalSpins) {
        clearInterval(interval);
        const finalWinner = backlogGames[Math.floor(Math.random() * backlogGames.length)];
        setRouletteGame(finalWinner);
        setIsSpinning(false);
      }
    }, 85);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const filterTabs = [
    { id: 'all', label: 'Всі ігри', count: stats.total },
    { id: 'backlog', label: 'Беклог', count: stats.backlog },
    { id: 'playing', label: 'Граю', count: stats.playing },
    { id: 'completed', label: 'Пройдено', count: stats.completed },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-indigo-500/30 relative overflow-x-hidden font-sans">
      
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 60, -40, 0], 
            y: [0, -40, 30, 0],
            scale: [1, 1.15, 0.95, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 left-1/4 w-[400px] sm:w-[650px] h-[400px] sm:h-[500px] bg-indigo-600/20 blur-[140px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            x: [0, -70, 50, 0], 
            y: [0, 50, -30, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-purple-600/15 blur-[150px] rounded-full" 
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[300px] bg-blue-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
        
        <nav className="flex items-center justify-between mb-8 sm:mb-12 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Backlogger
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsSteamModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-2xl transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Синхронізація Steam</span>
            </button>

            <div className={`flex items-center gap-3 bg-white/[0.04] p-1.5 pl-2 pr-4 rounded-full backdrop-blur-2xl border ${activeAccent.ring} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`}>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left group"
                title="Відкрити профіль та досягнення"
              >
                {renderAvatar("w-7 h-7", "w-3.5 h-3.5")}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {username || 'Геймер'}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${activeAccent.badge}`}>
                      LVL {stats.level}
                    </span>
                  </div>
                </div>
              </button>

              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={onLogout}
                className="text-xs font-medium text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
                title="Вийти з акаунта"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Вийти</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 pl-2 pr-3 py-1.5 rounded-2xl backdrop-blur-2xl text-gray-200 active:scale-95 transition-all"
            aria-label="Меню"
          >
            {renderAvatar("w-6 h-6", "w-3 h-3")}
            <span className="text-xs font-bold text-white max-w-[80px] truncate">
              {username || 'Меню'}
            </span>
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -16, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -16, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="md:hidden overflow-hidden mb-6"
            >
              <div className="bg-[#121218]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="flex items-center gap-2.5 text-left"
                  >
                    {renderAvatar("w-10 h-10", "w-5 h-5")}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">{username || 'Геймер'}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${activeAccent.badge}`}>
                          LVL {stats.level}
                        </span>
                      </div>
                      <div className="text-[11px] text-indigo-300">{profile.customTitle} • Налаштувати →</div>
                    </div>
                  </button>
                  <button
                    onClick={onLogout}
                    className="bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/25 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Вийти
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/30 py-2.5 px-2 rounded-2xl text-[11px] font-semibold transition-all"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Ачівки ({unlockedCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSteamModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 py-2.5 px-2 rounded-2xl text-[11px] font-semibold transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Steam</span>
                  </button>

                  <button
                    onClick={startRoulette}
                    className="flex items-center justify-center gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/30 py-2.5 px-2 rounded-2xl text-[11px] font-semibold transition-all"
                  >
                    <Dices className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Рулетка</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-6 sm:mb-8 bg-gradient-to-r from-indigo-600/25 via-purple-600/20 to-indigo-600/25 border border-indigo-400/40 rounded-2xl p-3.5 sm:p-4 backdrop-blur-2xl flex items-center justify-between flex-wrap gap-3 shadow-lg shadow-indigo-500/10"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-indigo-300 font-bold">Зараз у грі (Живий відлік)</div>
                  <div className="text-base sm:text-lg font-extrabold text-white line-clamp-1">{activeSession.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="font-mono text-lg sm:text-2xl font-bold text-emerald-300 bg-black/40 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-white/10">
                  {formatTimer(elapsedSeconds)}
                </div>
                <button
                  onClick={stopLiveSession}
                  className="bg-red-500 hover:bg-red-600 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Стоп і зберегти</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="mb-7 sm:mb-10 text-center max-w-2xl mx-auto px-2">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/50 mb-2 sm:mb-3"
          >
            Твій ігровий всесвіт.
          </motion.h1>
          <p className="text-gray-400 text-xs sm:text-lg">
            Колекціонуй, оцінюй та відстежуй кожну годину своїх пригод.
          </p>
        </header>

        <LiveSearch onAddGame={handleAddGame} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">Прогрес</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
                <span className="text-xl sm:text-3xl font-bold text-white">{stats.completionRate}%</span>
                <span className="text-[10px] sm:text-xs text-gray-400">({stats.completed}/{stats.total})</span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">Активність</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-1">
              <div>
                <div className="text-xl sm:text-3xl font-bold text-white">{stats.playing}</div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">у процесі</div>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-lg font-semibold text-indigo-300 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>{stats.totalHours} год</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-500">награно</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            onClick={() => setIsProfileOpen(true)}
            className="cursor-pointer bg-white/[0.03] hover:bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between transition-colors"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">Твій ранг і смак</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-1">
              <div>
                <div className="text-xl sm:text-3xl font-bold text-white flex items-baseline gap-0.5">
                  {stats.avgRating}
                  <span className="text-[10px] sm:text-xs font-normal text-gray-500">/10</span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">середня оцінка</div>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-lg font-semibold text-amber-300 flex items-center justify-end gap-1">
                  <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  {unlockedCount}/{achievements.length}
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-500">ачівок відкрито</div>
              </div>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={startRoulette}
            className="group relative bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent backdrop-blur-2xl border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between text-left overflow-hidden transition-all hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/30 blur-2xl rounded-full group-hover:bg-indigo-400/40 transition-all" />
            <div className="flex items-center justify-between w-full mb-2 sm:mb-3 gap-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-300 truncate">Що обрати?</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/30 border border-indigo-300/30 text-white group-hover:rotate-12 transition-transform shrink-0">
                <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <div className="text-sm sm:text-xl font-bold text-white mb-0.5 leading-tight">
                Рулетка беклогу
              </div>
              <p className="text-[10px] sm:text-xs text-indigo-200/70 line-clamp-1">
                Обрати гру на вечір →
              </p>
            </div>
          </motion.button>
        </div>

        <div className="flex justify-center mb-7 sm:mb-10">
          <div className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex bg-white/[0.04] p-1 sm:p-1.5 rounded-2xl backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`relative px-1.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1 sm:gap-2 ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterBubble"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                      className="absolute inset-0 bg-gradient-to-b from-white/[0.15] to-white/[0.08] border border-white/15 rounded-xl shadow-md"
                    />
                  )}
                  <span className="relative z-10 truncate">{tab.label}</span>
                  <span className={`relative z-10 text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-indigo-500/40 text-indigo-200' : 'bg-white/5 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  key={item._id}
                  onClick={() => openGameDetails(item)}
                  className="group cursor-pointer bg-[#0b0b0f] border border-white/[0.08] hover:border-white/20 rounded-2xl sm:rounded-3xl overflow-hidden sm:hover:-translate-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/15 flex flex-col relative"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#0b0b0f]">
                    <img 
                      src={item.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Немає+обкладинки'} 
                      alt={item.title}
                      onError={(e) => {
                        if (e.target.src.includes('library_600x900.jpg')) {
                          e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg');
                        }
                      }}
                      className="w-full h-full object-cover scale-[1.01] transition-transform duration-700 ease-out group-hover:scale-110"
                    />

                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-col gap-1 sm:gap-1.5 items-end z-20">
                      {item.metacritic && (
                        <div className="bg-black/70 backdrop-blur-xl border border-white/15 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-lg">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                          <span className="text-[10px] sm:text-xs font-bold text-white">{item.metacritic}</span>
                        </div>
                      )}
                      {item.personalRating && (
                        <div className="bg-indigo-600/90 backdrop-blur-xl border border-indigo-300/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl flex items-center gap-1 shadow-lg">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 fill-amber-300" />
                          <span className="text-[10px] sm:text-xs font-bold text-white">{item.personalRating}/10</span>
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 z-20">
                      <button
                        onClick={(e) => handleDeleteGame(e, item._id, item.title)}
                        className="opacity-90 sm:opacity-0 group-hover:opacity-100 bg-black/70 hover:bg-red-500/90 text-gray-200 hover:text-white backdrop-blur-xl border border-white/15 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg transition-all duration-200"
                        title="Видалити гру"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <button
                        onClick={(e) => startLiveSession(e, item)}
                        className={`opacity-90 sm:opacity-0 group-hover:opacity-100 backdrop-blur-xl border p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg transition-all duration-200 ${
                          activeSession?.gameId === item._id
                            ? 'opacity-100 bg-emerald-500 text-white border-emerald-300'
                            : 'bg-black/70 hover:bg-indigo-500 text-gray-200 hover:text-white border-white/15'
                        }`}
                        title="Запустити живий відлік часу гри"
                      >
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-2.5 right-2.5 sm:left-3 sm:right-3 flex items-center justify-between text-[10px] sm:text-[11px] text-gray-200 z-20">
                      <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-white/10">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400" />
                        {item.playtime > 0 ? `${item.playtime} год` : '0 год'}
                      </span>
                      {item.comment && (
                        <span className="bg-black/70 backdrop-blur-md p-1 sm:p-1.5 rounded-lg border border-white/10" title="Є особиста нотатка">
                          <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-300" />
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 pt-3 -mt-3 flex flex-col flex-1 bg-[#0b0b0f] relative z-20 before:content-[''] before:absolute before:-top-10 before:inset-x-0 before:h-10 before:bg-gradient-to-t before:from-[#0b0b0f] before:via-[#0b0b0f]/80 before:to-transparent before:pointer-events-none">
                    <h3 className="font-bold text-sm sm:text-base text-white mb-0.5 sm:mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-400 mb-2.5 sm:mb-3 line-clamp-1">
                      {item.releaseYear ? `${item.releaseYear} • ` : ''} 
                      {item.genres?.length ? item.genres.join(', ') : 'Гра'}
                    </p>

                    <button
                      type="button"
                      onClick={() => openGameDetails(item)}
                      className="w-full mb-2 sm:mb-2.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-white/[0.04] hover:bg-indigo-500/20 border border-white/[0.07] hover:border-indigo-500/30 text-[10px] sm:text-[11px] font-medium text-gray-300 hover:text-indigo-200 flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <SlidersHorizontal className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">Оцінити та час</span>
                      </span>
                      <span className="text-indigo-400 font-bold ml-1">+</span>
                    </button>
                    
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="mt-auto flex bg-black/60 rounded-xl p-0.5 sm:p-1 border border-white/[0.07]"
                    >
                      {['backlog', 'playing', 'completed'].map(status => (
                        <button
                          key={status}
                          onClick={(e) => handleUpdateStatus(e, item._id, status, item.title)}
                          className={`flex-1 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold tracking-wider rounded-lg transition-all ${
                            item.status === status 
                              ? 'bg-gradient-to-b from-indigo-500/40 to-indigo-600/20 text-indigo-200 border border-indigo-400/30 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {status === 'backlog' ? 'БЕКЛОГ' : status === 'playing' ? 'ГРАЮ' : 'ГОТОВО'}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center py-16 sm:py-20 px-4 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-xl"
          >
            <p className="text-gray-400 text-base sm:text-lg font-medium mb-1">У цій категорії поки порожньо</p>
            <p className="text-gray-600 text-xs sm:text-sm">Скористайся пошуком вище, щоб поповнити свою колекцію</p>
          </motion.div>
        )}
      </div>

      {/* МОДАЛЬНЕ ВІКНО ПРОФІЛЮ, КАСТОМІЗАЦІЇ ТА ДОСЯГНЕНЬ */}
      <AnimatePresence>
        {isProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsProfileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 25 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#111116] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl relative"
            >
              <div className={`relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br ${activeAccent.glow}`}>
                {favoriteGame?.imageUrl && (
                  <img 
                    src={favoriteGame.imageUrl} 
                    alt={favoriteGame.title} 
                    className="w-full h-full object-cover opacity-35 blur-[2px] scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-[#111116]/60 to-transparent" />

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md border border-white/10 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {renderAvatar("w-16 h-16 sm:w-20 sm:h-20", "w-8 h-8 sm:w-10 sm:h-10")}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{username || 'Геймер'}</h2>
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${activeAccent.ring} ${activeAccent.badge}`}>
                          РІВЕНЬ {stats.level}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-indigo-300 font-medium mt-0.5">{profile.customTitle}</p>
                      {favoriteGame && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          Улюблена гра: <span className="text-white font-semibold">{favoriteGame.title}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-full sm:w-48 bg-black/50 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-400 font-semibold">Досвід (XP)</span>
                      <span className="text-white font-bold">{stats.currentLevelXp} / 200 XP</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${stats.xpProgress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      Твої досягнення ({unlockedCount} з {achievements.length})
                    </span>
                    <span className="text-[11px] text-gray-500">Загальний досвід: {stats.xp} XP</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {achievements.map((ach) => {
                      const AchIcon = ach.icon;
                      return (
                        <div
                          key={ach.id}
                          className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                            ach.unlocked
                              ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 border-indigo-400/35 shadow-sm'
                              : 'bg-white/[0.02] border-white/[0.06] opacity-55'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            ach.unlocked 
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                              : 'bg-white/5 text-gray-500'
                          }`}>
                            <AchIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white truncate">{ach.title}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                ach.unlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-500'
                              }`}>
                                {ach.unlocked ? 'Відкрито' : ach.progress}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{ach.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-white/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Кастомізація акаунта
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-2">Обери пресет аватарки або встав посилання на своє фото/GIF</label>
                    <div className="grid grid-cols-6 gap-2 mb-2.5">
                      {AVATAR_PRESETS.map((preset) => {
                        const IconComp = preset.icon;
                        const isSelected = profile.avatar === preset.id && !customAvatarUrl;
                        return (
                          <button
                            type="button"
                            key={preset.id}
                            onClick={() => {
                              setCustomAvatarUrl('');
                              setProfile({ ...profile, avatar: preset.id });
                            }}
                            className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-white/15 border-white/40 scale-105 shadow-lg'
                                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                            }`}
                            title={preset.label}
                          >
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${preset.gradient} flex items-center justify-center`}>
                              <IconComp className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[9px] text-gray-300 truncate w-full text-center">{preset.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="Або встав URL картинки / Steam-аватарки (https://...)"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1.5">Твій ігровий титул</label>
                      <input
                        type="text"
                        maxLength={32}
                        value={profile.customTitle}
                        onChange={(e) => setProfile({ ...profile, customTitle: e.target.value })}
                        placeholder="Наприклад: Мисливець за платиною"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 mb-1.5"
                      />
                      <div className="flex flex-wrap gap-1">
                        {TITLE_PRESETS.map(t => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setProfile({ ...profile, customTitle: t })}
                            className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-0.5 rounded-lg border border-white/5"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1.5">Улюблена гра на банері профілю</label>
                      <select
                        value={profile.favoriteGameId}
                        onChange={(e) => setProfile({ ...profile, favoriteGameId: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                      >
                        <option value="">Без банера гри</option>
                        {items.map(g => (
                          <option key={g._id} value={g._id}>{g.title}</option>
                        ))}
                      </select>

                      <label className="block text-[11px] text-gray-400 mt-3 mb-1.5">Колір акценту профілю</label>
                      <div className="flex gap-2">
                        {ACCENT_THEMES.map(theme => (
                          <button
                            type="button"
                            key={theme.id}
                            onClick={() => setProfile({ ...profile, accentColor: theme.id })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                              profile.accentColor === theme.id
                                ? `${theme.badge} ${theme.ring} scale-105`
                                : 'bg-white/5 text-gray-400 border-white/10'
                            }`}
                          >
                            {theme.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Закрити
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Зберегти профіль
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* МОДАЛЬНЕ ВІКНО ДЕТАЛЕЙ ГРИ ТА КАЛЬКУЛЯТОРА СЕСІЇ */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGame(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#121217]/95 border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl relative"
            >
              <div className="relative h-36 sm:h-44 overflow-hidden">
                <img 
                  src={selectedGame.imageUrl} 
                  alt={selectedGame.title} 
                  className="w-full h-full object-cover blur-sm scale-105 opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-[#121217]/60 to-transparent" />
                
                <button
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md border border-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6 flex items-end justify-between gap-3">
                  <div className="flex items-end gap-3 sm:gap-4">
                    <img 
                      src={selectedGame.imageUrl} 
                      alt={selectedGame.title} 
                      className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-2xl border border-white/20 shadow-xl hidden xs:block"
                    />
                    <div>
                      <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-tight line-clamp-1">{selectedGame.title}</h2>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {selectedGame.releaseYear ? `${selectedGame.releaseYear} • ` : ''}
                        {selectedGame.genres?.join(', ')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      startLiveSession(null, selectedGame);
                      setSelectedGame(null);
                    }}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Таймер</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveDetails} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Твоя особиста оцінка {ratingInput ? `(${ratingInput}/10)` : '(не виставлено)'}
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setRatingInput(ratingInput === num ? null : num)}
                        className={`py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                          ratingInput >= num
                            ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/25'
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Калькулятор годин
                    </span>
                    <span className="text-xs font-bold text-white bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                      Всього: {playtimeInput} год
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {[0.5, 1, 2, 3, 5].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleAddSessionHours(h)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-500/30 border border-white/10 hover:border-indigo-400/40 text-xs font-semibold text-gray-200 transition-all"
                      >
                        +{h} год
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={sessionAddInput}
                        onChange={(e) => setSessionAddInput(e.target.value)}
                        placeholder="Години за сьогодні..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSessionHours(sessionAddInput)}
                        className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Додати
                      </button>
                    </div>

                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10000"
                        value={playtimeInput}
                        onChange={(e) => setPlaytimeInput(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/60"
                        title="Загальна кількість годин"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Твої враження або нотатки
                  </label>
                  <textarea
                    rows="2"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Напиши, що сподобалось, на якому босі зупинився або чому гра шедевр..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 resize-none text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedGame(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDetails}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    Зберегти
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* МОДАЛЬНЕ ВІКНО СИНХРОНІЗАЦІЇ ЗІ STEAM */}
      <AnimatePresence>
        {isSteamModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSteamModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#121217] border border-white/15 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-400" />
                  Синхронізація зі Steam
                </h3>
                <button
                  onClick={() => setIsSteamModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-xs text-amber-100/90 leading-relaxed">
                  <span className="font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Важливо: Профіль має бути відкритим!
                  </span>
                  У налаштуваннях приватності Steam пункти <b>«Мій профіль»</b> та <b>«Подробиці про ігри»</b> мають стояти у статусі <b>Публічний</b>, інакше Steam не віддасть твої награні години.
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Встав посилання на свій профіль Steam або свій SteamID64. Сервер знайде спільні ігри у твоєму беклозі, перенесе награний час і підтягне твою аватарку.
              </p>

              <form onSubmit={handleSteamSync} className="space-y-4">
                <input
                  type="text"
                  required
                  value={steamInput}
                  onChange={(e) => setSteamInput(e.target.value)}
                  placeholder="https://steamcommunity.com/id/твій_нік"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/60"
                />

                <button
                  type="submit"
                  disabled={isSyncingSteam}
                  className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingSteam ? 'animate-spin' : ''}`} />
                  {isSyncingSteam ? 'Звіряємо бібліотеку...' : 'Синхронізувати години'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* МОДАЛЬНЕ ВІКНО РУЛЕТКИ */}
      <AnimatePresence>
        {isRouletteOpen && rouletteGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSpinning && setIsRouletteOpen(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gradient-to-b from-[#181820] to-[#0e0e13] border border-white/15 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center justify-center gap-2">
                <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? 'Обираємо гру з беклогу...' : 'Твій вибір на сьогодні!'}
              </div>

              <div className="relative w-44 sm:w-48 aspect-[3/4] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/15 mb-5 bg-black">
                <img 
                  src={rouletteGame.imageUrl} 
                  alt={rouletteGame.title} 
                  className={`w-full h-full object-cover transition-all duration-150 ${isSpinning ? 'scale-110 blur-[2px]' : 'scale-100'}`}
                />
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">{rouletteGame.title}</h3>
              <p className="text-xs text-gray-400 mb-6">
                {rouletteGame.releaseYear ? `${rouletteGame.releaseYear} • ` : ''}
                {rouletteGame.genres?.join(', ')}
              </p>

              {!isSpinning && (
                <div className="flex gap-3">
                  <button
                    onClick={startRoulette}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-gray-300 transition-all"
                  >
                    Крутити ще раз
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(null, rouletteGame._id, 'playing', rouletteGame.title);
                      setIsRouletteOpen(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Почати грати
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}