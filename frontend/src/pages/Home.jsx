import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import LiveSearch from '../components/LiveSearch';
import { 
  Trash2, LogOut, User, Sparkles, Trophy, Flame, 
  Clock, Star, Dices, X, Check, Play, Square, Layers, 
  MessageSquare, RefreshCw, Plus, SlidersHorizontal 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home({ username, onLogout }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  
  // Стан для модального вікна деталей, оцінки та калькулятора годин
  const [selectedGame, setSelectedGame] = useState(null);
  const [ratingInput, setRatingInput] = useState(null);
  const [playtimeInput, setPlaytimeInput] = useState(0);
  const [sessionAddInput, setSessionAddInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Стан для живого трекера часу (таймера сесії)
  const [activeSession, setActiveSession] = useState(null); // { gameId, title, startTime }
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Стан для синхронізації зі Steam
  const [isSteamModalOpen, setIsSteamModalOpen] = useState(false);
  const [steamInput, setSteamInput] = useState(localStorage.getItem('steamProfile') || '');
  const [isSyncingSteam, setIsSyncingSteam] = useState(false);

  // Стан для рулетки
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [rouletteGame, setRouletteGame] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  // Секундомір для активної ігрової сесії
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

  const stats = useMemo(() => {
    const total = items.length;
    const backlog = items.filter(i => i.status === 'backlog').length;
    const playing = items.filter(i => i.status === 'playing').length;
    const completed = items.filter(i => i.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const totalHours = Math.round(items.reduce((acc, item) => acc + (Number(item.playtime) || 0), 0) * 10) / 10;
    
    const ratedItems = items.filter(i => i.personalRating);
    const avgRating = ratedItems.length > 0
      ? (ratedItems.reduce((acc, i) => acc + Number(i.personalRating), 0) / ratedItems.length).toFixed(1)
      : '—';

    return { total, backlog, playing, completed, completionRate, totalHours, avgRating };
  }, [items]);

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

  // Додавання годин за сьогодні до загального часу
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

    // Якщо користувач вписав години у поле "Сьогодні награно", але не натиснув "+", додаємо їх автоматично
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

  // Запуск та зупинка живого трекера сесії
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

    // Переводимо секунди в години (мінімум 0.1 год, якщо тестував хоча б кілька секунд)
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

  // Синхронізація зі Steam
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
      toast.success(`Синхронізовано зі Steam! Оновлено ігор: ${res.data.syncedCount}`, { icon: '🎮' });
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
          className="absolute -top-32 left-1/4 w-[650px] h-[500px] bg-indigo-600/20 blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            x: [0, -70, 50, 0], 
            y: [0, 50, -30, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-[550px] h-[550px] bg-purple-600/15 blur-[160px] rounded-full" 
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-blue-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        
        <nav className="flex items-center justify-between mb-12 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Backlogger
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Кнопка синхронізації зі Steam */}
            <button
              onClick={() => setIsSteamModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-2xl transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Синхронізація Steam</span>
            </button>

            <div className="flex items-center gap-3 bg-white/[0.04] p-1.5 pl-3.5 pr-4 rounded-full backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 p-1.5 rounded-full border border-indigo-400/30">
                  <User className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <span className="text-sm font-medium text-gray-200">{username || 'Геймер'}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={onLogout}
                className="text-xs font-medium text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
                title="Вийти з акаунта"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Вийти</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Живий банер активної сесії, якщо запущено таймер гри */}
        <AnimatePresence>
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-8 bg-gradient-to-r from-indigo-600/25 via-purple-600/20 to-indigo-600/25 border border-indigo-400/40 rounded-2xl p-4 backdrop-blur-2xl flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-indigo-500/10"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-indigo-300 font-bold">Зараз у грі (Живий відлік часу)</div>
                  <div className="text-lg font-extrabold text-white">{activeSession.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-mono text-2xl font-bold text-emerald-300 bg-black/40 px-4 py-1.5 rounded-xl border border-white/10">
                  {formatTimer(elapsedSeconds)}
                </div>
                <button
                  onClick={stopLiveSession}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Завершити і зберегти час
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="mb-10 text-center max-w-2xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/50 mb-3"
          >
            Твій ігровий всесвіт.
          </motion.h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Колекціонуй, оцінюй та відстежуй кожну годину своїх пригод.
          </p>
        </header>

        <LiveSearch onAddGame={handleAddGame} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Прогрес колекції</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-white">{stats.completionRate}%</span>
                <span className="text-xs text-gray-400">пройдено ({stats.completed} з {stats.total})</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
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
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] rounded-3xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Активність</span>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{stats.playing}</div>
                <div className="text-xs text-gray-400 mt-0.5">ігор зараз у процесі</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-indigo-300 flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {stats.totalHours} год
                </div>
                <div className="text-[11px] text-gray-500">всього награно</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] rounded-3xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Твій смак</span>
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Star className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-white flex items-baseline gap-1">
                  {stats.avgRating}
                  <span className="text-xs font-normal text-gray-500">/ 10</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">середня оцінка</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-200 flex items-center justify-end gap-1">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  {stats.backlog}
                </div>
                <div className="text-[11px] text-gray-500">чекають у беклозі</div>
              </div>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={startRoulette}
            className="group relative bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent backdrop-blur-2xl border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-3xl p-5 flex flex-col justify-between text-left overflow-hidden transition-all hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-indigo-500/30 blur-2xl rounded-full group-hover:bg-indigo-400/40 transition-all" />
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Не знаєш що обрати?</span>
              <div className="p-2 rounded-xl bg-indigo-500/30 border border-indigo-300/30 text-white group-hover:rotate-12 transition-transform">
                <Dices className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-white mb-0.5 flex items-center gap-2">
                Рулетка беклогу
              </div>
              <p className="text-xs text-indigo-200/70">
                Натисни, щоб обрати гру на вечір →
              </p>
            </div>
          </motion.button>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white/[0.04] p-1.5 rounded-2xl backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterBubble"
                      transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
                      className="absolute inset-0 bg-gradient-to-b from-white/[0.15] to-white/[0.08] border border-white/15 rounded-xl shadow-md"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span className={`relative z-10 text-[11px] px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-indigo-500/40 text-indigo-200' : 'bg-white/5 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                key={item._id}
                onClick={() => openGameDetails(item)}
                className="group cursor-pointer bg-[#0b0b0f] border border-white/[0.08] hover:border-white/20 rounded-3xl overflow-hidden hover:-translate-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/15 flex flex-col relative transform-gpu"
              >
                {/* Обкладинка з виправленим перекриттям (-bottom-1), щоб не з'являлася смужка */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#0b0b0f] transform-gpu">
                  <img 
                    src={item.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Немає+обкладинки'} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 transform-gpu [backface-visibility:hidden]"
                  />
                  
                  {/* Розширений градієнт з нахлестом на 4px вниз (-bottom-1), який повністю ховає артефакт */}
                  <div className="absolute inset-x-0 -bottom-1 h-28 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/80 to-transparent pointer-events-none" />

                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    {item.metacritic && (
                      <div className="bg-black/65 backdrop-blur-xl border border-white/15 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                        <span className="text-xs font-bold text-white">{item.metacritic}</span>
                      </div>
                    )}
                    {item.personalRating && (
                      <div className="bg-indigo-600/85 backdrop-blur-xl border border-indigo-300/30 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span className="text-xs font-bold text-white">{item.personalRating}/10</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <button
                      onClick={(e) => handleDeleteGame(e, item._id, item.title)}
                      className="opacity-0 group-hover:opacity-100 bg-black/65 hover:bg-red-500/90 text-gray-300 hover:text-white backdrop-blur-xl border border-white/15 p-2 rounded-xl shadow-lg transition-all duration-200"
                      title="Видалити гру"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Кнопка запуску живого таймера прямо з картки */}
                    <button
                      onClick={(e) => startLiveSession(e, item)}
                      className={`opacity-0 group-hover:opacity-100 backdrop-blur-xl border p-2 rounded-xl shadow-lg transition-all duration-200 ${
                        activeSession?.gameId === item._id
                          ? 'opacity-100 bg-emerald-500 text-white border-emerald-300'
                          : 'bg-black/65 hover:bg-indigo-500 text-gray-200 hover:text-white border-white/15'
                      }`}
                      title="Запустити живий відлік часу гри"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-gray-300 z-10">
                    <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {item.playtime > 0 ? `${item.playtime} год` : '0 год'}
                    </span>
                    {item.comment && (
                      <span className="bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10" title="Є особиста нотатка">
                        <MessageSquare className="w-3 h-3 text-purple-300" />
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4 pt-2 flex flex-col flex-1 bg-[#0b0b0f] relative z-10">
                  <h3 className="font-bold text-base text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-1">
                    {item.releaseYear ? `${item.releaseYear} • ` : ''} 
                    {item.genres?.length ? item.genres.join(', ') : 'Гра'}
                  </p>

                  {/* Явна кнопка для відкриття оцінки та калькулятора годин */}
                  <button
                    type="button"
                    onClick={() => openGameDetails(item)}
                    className="w-full mb-2.5 py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-indigo-500/20 border border-white/[0.07] hover:border-indigo-500/30 text-[11px] font-medium text-gray-300 hover:text-indigo-200 flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                      Оцінити та додати час
                    </span>
                    <span className="text-indigo-400 font-bold">+</span>
                  </button>
                  
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mt-auto flex bg-black/60 rounded-xl p-1 border border-white/[0.07]"
                  >
                    {['backlog', 'playing', 'completed'].map(status => (
                      <button
                        key={status}
                        onClick={(e) => handleUpdateStatus(e, item._id, status, item.title)}
                        className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded-lg transition-all ${
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
        </motion.div>
        
        {filteredItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-xl"
          >
            <p className="text-gray-400 text-lg font-medium mb-1">У цій категорії поки порожньо</p>
            <p className="text-gray-600 text-sm">Скористайся пошуком вище, щоб поповнити свою колекцію</p>
          </motion.div>
        )}
      </div>

      {/* МОДАЛЬНЕ ВІКНО ДЕТАЛЕЙ ГРИ ТА КАЛЬКУЛЯТОРА СЕСІЇ */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGame(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-[#121217]/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="relative h-44 overflow-hidden">
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

                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <img 
                      src={selectedGame.imageUrl} 
                      alt={selectedGame.title} 
                      className="w-16 h-24 object-cover rounded-2xl border border-white/20 shadow-xl hidden sm:block"
                    />
                    <div>
                      <h2 className="text-2xl font-extrabold text-white leading-tight">{selectedGame.title}</h2>
                      <p className="text-xs text-gray-400 mt-1">
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
                    Живий таймер
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveDetails} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
                    Твоя особиста оцінка {ratingInput ? `(${ratingInput}/10)` : '(не виставлено)'}
                  </label>
                  <div className="grid grid-cols-10 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setRatingInput(ratingInput === num ? null : num)}
                        className={`py-2.5 rounded-xl font-bold text-sm transition-all border ${
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

                {/* Калькулятор годин за сьогодні */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Калькулятор годин (Додати за сьогодні)
                    </span>
                    <span className="text-xs font-bold text-white bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                      Всього: {playtimeInput} год
                    </span>
                  </div>

                  {/* Швидкі кнопки додавання часу */}
                  <div className="flex flex-wrap gap-2">
                    {[0.5, 1, 2, 3, 5].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleAddSessionHours(h)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-500/30 border border-white/10 hover:border-indigo-400/40 text-xs font-semibold text-gray-200 transition-all"
                      >
                        +{h} год
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={sessionAddInput}
                        onChange={(e) => setSessionAddInput(e.target.value)}
                        placeholder="Свої години за сьогодні..."
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
                        title="Загальна кількість годин (можна виправити вручну)"
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

              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Встав посилання на свій відкритий профіль Steam або свій SteamID64. Сервер знайде спільні ігри та автоматично перенесе твої награні години.
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

              <div className="relative w-48 aspect-[3/4] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/15 mb-5 bg-black">
                <img 
                  src={rouletteGame.imageUrl} 
                  alt={rouletteGame.title} 
                  className={`w-full h-full object-cover transition-all duration-150 ${isSpinning ? 'scale-110 blur-[2px]' : 'scale-100'}`}
                />
              </div>

              <h3 className="text-2xl font-extrabold text-white mb-1">{rouletteGame.title}</h3>
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