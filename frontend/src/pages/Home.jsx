import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import LiveSearch from '../components/LiveSearch';
import { useTranslation } from '../i18n';
import { 
  Trash2, LogOut, Sparkles, Trophy, Flame, Clock, Star, Dices, X, Check, Play, Square, Layers, 
  MessageSquare, RefreshCw, Plus, SlidersHorizontal, Menu, Globe, Award, Shield, Zap, 
  Crown, Ghost, Rocket, Gamepad2, Sword, Heart, Bot, Send, Film, LayoutGrid, MessageSquareQuote, 
  Users, ExternalLink, Search, Tv, MessageCircle 
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
  indigo: { label: 'Індиго', gradient: 'from-indigo-950/65 via-[#111118] to-[#0b0b10]', border: 'border-indigo-500/30 hover:border-indigo-400/60' },
  rose: { label: 'Багряний', gradient: 'from-rose-950/65 via-[#141014] to-[#0b0b10]', border: 'border-rose-500/30 hover:border-rose-400/60' },
  emerald: { label: 'Смарагд', gradient: 'from-emerald-950/65 via-[#0f1614] to-[#0b0b10]', border: 'border-emerald-500/30 hover:border-emerald-400/60' },
  amber: { label: 'Золотий', gradient: 'from-amber-950/65 via-[#16130e] to-[#0b0b10]', border: 'border-amber-500/30 hover:border-amber-400/60' }
};

const TITLE_PRESETS = ['Дослідник всесвітів', 'Мисливець за платиною', 'Повелитель беклогу', 'Кібер-легенда', 'Нічний геймер', 'Критик індустрії'];

const DEFAULT_PLAYLISTS = [
  {
    _id: 'default_souls',
    title: 'Хардкор та Темне Фентезі',
    curator: 'Спільнота Backlogger',
    category: 'games',
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
    category: 'games',
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
    category: 'games',
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
  },
  {
    _id: 'default_cinema_scifi',
    title: 'Наукова фантастика, що зриває дах',
    curator: 'Кіноклуб Backlogger',
    category: 'movies',
    desc: 'Космос, часові парадокси та філософські світи майбутнього',
    theme: 'rose',
    likes: [],
    isDefault: true,
    games: [
      { title: 'Інтерстеллар', mediaType: 'movie', releaseYear: 2014, metacritic: 87, genres: ['Фантастика', 'Драма'], runtimeMinutes: 169, imageUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
      { title: 'Початок', mediaType: 'movie', releaseYear: 2010, metacritic: 84, genres: ['Фантастика', 'Екшн'], runtimeMinutes: 148, imageUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
      { title: 'Дюна: Частина друга', mediaType: 'movie', releaseYear: 2024, metacritic: 83, genres: ['Фантастика', 'Пригоди'], runtimeMinutes: 166, imageUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
      { title: 'Той, хто біжить по лезу 2049', mediaType: 'movie', releaseYear: 2017, metacritic: 81, genres: ['Фантастика', 'Трилер'], runtimeMinutes: 164, imageUrl: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg' }
    ]
  },
  {
    _id: 'default_cinema_series',
    title: 'Легендарні серіали з оцінкою 9.5+',
    curator: 'Вибір Кіноманів',
    category: 'movies',
    desc: 'Серіали, від яких неможливо відірватися до фінального сезону',
    theme: 'amber',
    likes: [],
    isDefault: true,
    games: [
      { title: 'Пуститися берега', mediaType: 'series', releaseYear: 2008, metacritic: 95, genres: ['Драма', 'Кримінал'], runtimeMinutes: 47, totalEpisodes: 62, imageUrl: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg' },
      { title: 'Чорнобиль', mediaType: 'series', releaseYear: 2019, metacritic: 94, genres: ['Драма', 'Історія'], runtimeMinutes: 60, totalEpisodes: 5, imageUrl: 'https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg' },
      { title: 'Справжній детектив', mediaType: 'series', releaseYear: 2014, metacritic: 87, genres: ['Детектив', 'Кримінал'], runtimeMinutes: 55, totalEpisodes: 24, imageUrl: 'https://image.tmdb.org/t/p/w500/cuV2O5ZyDLHSOWzg3nLVljp1ubw.jpg' },
      { title: 'Атака титанів', mediaType: 'anime', releaseYear: 2013, metacritic: 91, genres: ['Аніме', 'Екшн'], runtimeMinutes: 24, totalEpisodes: 89, imageUrl: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg' }
    ]
  },
  {
    _id: 'default_cinema_thrillers',
    title: 'Психологічні трилери з несподіваним фіналом',
    curator: 'Спільнота Кіно',
    category: 'movies',
    desc: 'Фільми, які тримають у напрузі і змушують переосмислити все наприкінці',
    theme: 'indigo',
    likes: [],
    isDefault: true,
    games: [
      { title: 'Острів проклятих', mediaType: 'movie', releaseYear: 2010, metacritic: 82, genres: ['Трилер', 'Детектив'], runtimeMinutes: 138, imageUrl: 'https://image.tmdb.org/t/p/w500/4GDy0PHYX3VRXUtwK5ysFbg3kEx.jpg' },
      { title: 'Бійцівський клуб', mediaType: 'movie', releaseYear: 1999, metacritic: 84, genres: ['Драма', 'Трилер'], runtimeMinutes: 139, imageUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' },
      { title: 'Сім', mediaType: 'movie', releaseYear: 1995, metacritic: 83, genres: ['Кримінал', 'Детектив'], runtimeMinutes: 127, imageUrl: 'https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg' },
      { title: 'Престиж', mediaType: 'movie', releaseYear: 2006, metacritic: 82, genres: ['Драма', 'Трилер'], runtimeMinutes: 130, imageUrl: 'https://image.tmdb.org/t/p/w500/bdN3gXuIZYaJP7ftKK2sU0nPtEA.jpg' }
    ]
  }
];

const DEFAULT_CINEMA_TRENDS = [
  { rawgId: 'c_1', title: 'Інтерстеллар', mediaType: 'movie', releaseYear: 2014, metacritic: 87, genres: ['Фантастика', 'Драма'], runtimeMinutes: 169, imageUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { rawgId: 'c_2', title: 'Дюна: Частина друга', mediaType: 'movie', releaseYear: 2024, metacritic: 83, genres: ['Фантастика', 'Пригоди'], runtimeMinutes: 166, imageUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
  { rawgId: 'c_3', title: 'Пуститися берега', mediaType: 'series', releaseYear: 2008, metacritic: 95, genres: ['Драма', 'Кримінал'], runtimeMinutes: 47, totalEpisodes: 62, imageUrl: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg' },
  { rawgId: 'c_4', title: 'Атака титанів', mediaType: 'anime', releaseYear: 2013, metacritic: 91, genres: ['Аніме', 'Екшн'], runtimeMinutes: 24, totalEpisodes: 89, imageUrl: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg' },
  { rawgId: 'c_5', title: 'Острів проклятих', mediaType: 'movie', releaseYear: 2010, metacritic: 82, genres: ['Трилер', 'Детектив'], runtimeMinutes: 138, imageUrl: 'https://image.tmdb.org/t/p/w500/4GDy0PHYX3VRXUtwK5ysFbg3kEx.jpg' },
  { rawgId: 'c_6', title: 'Бійцівський клуб', mediaType: 'movie', releaseYear: 1999, metacritic: 84, genres: ['Драма', 'Трилер'], runtimeMinutes: 139, imageUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' }
];

function getRatingColorStyles(ratingVal) {
  if (!ratingVal) return { color: '#9ca3af', textShadow: 'none', accentHex: '#6366f1', percent: 0 };
  const num = Math.max(1, Math.min(10, Number(ratingVal)));
  const ratio = (num - 1) / 9;
  const hue = Math.round(ratio * 138);
  const color = `hsl(${hue}, 90%, 56%)`;
  const glow = `hsla(${hue}, 95%, 52%, 0.55)`;
  return { color, textShadow: `0 0 22px ${glow}, 0 0 8px ${glow}`, accentHex: color, percent: Math.round(ratio * 100) };
}

// Ізольований компонент живого таймера сесії (запобігає щосекундному ререндеру всього Home)
function LiveSessionTimer({ activeSession, onStop }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    activeSession ? Math.max(0, Math.floor((Date.now() - activeSession.startTime) / 1000)) : 0
  );

  useEffect(() => {
    if (!activeSession) return;
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSession.startTime) / 1000)));
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSession.startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  const formatTimer = (sec) =>
    [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60]
      .map(v => String(v).padStart(2, '0'))
      .join(':');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#11121c]/95 backdrop-blur-xl border border-indigo-400/50 rounded-full px-5 py-2.5 shadow-2xl shadow-indigo-500/25 flex items-center gap-4"
    >
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-xs font-bold text-white max-w-[160px] sm:max-w-[240px] truncate">
          {activeSession.title}
        </span>
      </div>
      <span className="font-mono text-sm font-black text-indigo-300 bg-black/50 px-3 py-1 rounded-full border border-white/10">
        {formatTimer(elapsedSeconds)}
      </span>
      <button
        type="button"
        onClick={() => onStop(elapsedSeconds)}
        className="px-3.5 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all"
      >
        <Square className="w-3 h-3 fill-current" />
        <span>Стоп</span>
      </button>
    </motion.div>
  );
}

function AiModal({ onClose, mode = 'games' }) {
  const isCinema = mode === 'movies';
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'ai',
      text: isCinema
        ? 'Привіт! Я твій ШІ-Кінопорадник. Запитай мене про фільми, серіали чи аніме!'
        : 'Привіт! Я твій ігровий ШІ-Порадник. Запитай мене про ігри або твою колекцію!'
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, isAiThinking]);

  const handleAskAi = async (customPrompt) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : aiInput.trim();
    if (!textToSend) return;
    setAiMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    if (typeof customPrompt !== 'string') setAiInput('');
    setIsAiThinking(true);
    try {
      const res = await axios.post('/api/items/ai-assistant', { prompt: textToSend, mode });
      setAiMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'ai', text: 'Помилка звʼязку з сервером.' }]);
    } finally { setIsAiThinking(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-[#0e0e13] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 sm:p-5 bg-[#14141c] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${isCinema ? 'bg-rose-500/15 border-rose-400/30 text-rose-300' : 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300'}`}><Bot className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold text-white">{isCinema ? 'ШІ-Кінопорадник' : 'ШІ-Порадник Ігор'}</h3>
              <p className="text-[11px] text-gray-400">Персональний гід по твоїй колекції</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[260px]">
          {aiMessages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${m.role === 'user' ? (isCinema ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white') : 'bg-white/[0.05] border border-white/10 text-gray-200'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {isAiThinking && <div className={`text-xs animate-pulse px-2 ${isCinema ? 'text-rose-300' : 'text-indigo-300'}`}>Аналізую...</div>}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleAskAi(); }} className="p-4 border-t border-white/10 flex gap-2">
          <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Напиши запитання..." className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500/60" />
          <button type="submit" disabled={isAiThinking} className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 ${isCinema ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-500 hover:bg-indigo-600'}`}><Send className="w-4 h-4" /></button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Home({ username, onLogout }) {
  const { t, lang, changeLanguage } = useTranslation();

  const [activeView, setActiveView] = useState('library');
  const [communityTab, setCommunityTab] = useState('games');
  const isCinemaView = activeView === 'movies' || (activeView === 'community' && communityTab === 'movies');

  const [items, setItems] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [communityHits, setCommunityHits] = useState([]);
  const [cinemaHits, setCinemaHits] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [top100Movies, setTop100Movies] = useState([]);
  const [isTop100Open, setIsTop100Open] = useState(false);
  const [top100Search, setTop100Search] = useState('');
  const [isLoadingTop100, setIsLoadingTop100] = useState(false);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [movieFilter, setMovieFilter] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYearRange, setSelectedYearRange] = useState('all');
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [localSearch, setLocalSearch] = useState('');

  const [showSteamPromo, setShowSteamPromo] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [achTab, setAchTab] = useState('games');
  const [profile, setProfile] = useState({ avatar: 'cyber', customTitle: 'Дослідник всесвітів', accentColor: 'indigo', favoriteGameId: '', steamSynced: false, steamId: '' });
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [selectedGame, setSelectedGame] = useState(null);
  const [ratingInput, setRatingInput] = useState(null);
  const [playtimeInput, setPlaytimeInput] = useState(0);
  const [sessionAddInput, setSessionAddInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [seasonInput, setSeasonInput] = useState(1);
  const [episodeInput, setEpisodeInput] = useState(0);
  const [totalEpisodesInput, setTotalEpisodesInput] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [activeSession, setActiveSession] = useState(null);
  const [isSteamModalOpen, setIsSteamModalOpen] = useState(false);
  const [steamInput, setSteamInput] = useState(localStorage.getItem('steamProfile') || '');
  const [isSyncingSteam, setIsSyncingSteam] = useState(false);

  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [rouletteGame, setRouletteGame] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const [isTierListOpen, setIsTierListOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [plTitle, setPlTitle] = useState('');
  const [plDesc, setPlDesc] = useState('');
  const [plTheme, setPlTheme] = useState('indigo');
  const [plCategory, setPlCategory] = useState('games');
  const [plSelectedGames, setPlSelectedGames] = useState([]);
  const [plSearchQuery, setPlSearchQuery] = useState('');
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicBody, setNewTopicBody] = useState('');
  const [newTopicTag, setNewTopicTag] = useState('Рекомендація');
  const [replyTexts, setReplyTexts] = useState({});

  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // На старті завантажуємо тільки особисту колекцію та профіль користувача
  useEffect(() => {
    fetchItems();
    fetchProfile();
  }, []);

  // Ліниве завантаження даних спільноти тільки при переході на вкладку "Спільнота"
  useEffect(() => {
    if (activeView === 'community') {
      fetchFeed();
      fetchTrending();
      fetchPlaylists();
      fetchDiscussions();
      fetchLeaderboard();
    }
  }, [activeView]);

  useEffect(() => {
    if (!profileLoaded || profile.steamSynced) return;
    if (sessionStorage.getItem('steam_promo_shown')) return;
    const timer = setTimeout(() => {
      setShowSteamPromo(true);
      sessionStorage.setItem('steam_promo_shown', '1');
    }, 12000);
    return () => clearTimeout(timer);
  }, [profileLoaded, profile.steamSynced]);

  useEffect(() => {
    setSelectedGenre('all');
    setSelectedYearRange('all');
    setSelectedMediaType('all');
    setSortBy('default');
    setLocalSearch('');
  }, [activeView]);

  const fetchItems = async () => {
    try { const res = await axios.get('/api/items'); setItems(res.data); } catch (error) {}
  };

  const fetchFeed = async () => {
    try { const res = await axios.get('/api/items/feed'); setFeedItems(res.data); } catch (e) {}
  };

  const fetchTrending = async () => {
    try {
      const res = await axios.get('/api/items/trending');
      setCommunityHits(res.data?.communityHits || []);
      setCinemaHits(res.data?.cinemaHits || []);
      setNewReleases(res.data?.newReleases || []);
    } catch (e) {}
  };

  const fetchPlaylists = async () => {
    try { const res = await axios.get('/api/items/playlists'); setUserPlaylists(res.data || []); } catch (e) {}
  };

  const fetchDiscussions = async () => {
    try { const res = await axios.get('/api/items/discussions'); setDiscussions(res.data || []); } catch (e) {}
  };

  const fetchTop100Movies = async () => {
    setIsTop100Open(true);
    if (top100Movies.length > 0) return;
    setIsLoadingTop100(true);
    try {
      const res = await axios.get('/api/items/top-100-movies');
      setTop100Movies(res.data || []);
    } catch (e) {
      toast.error('Не вдалося завантажити Топ-100 фільмів');
    } finally { setIsLoadingTop100(false); }
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try { const res = await axios.get('/api/items/leaderboard'); setLeaderboard(res.data); } catch (e) {} finally { setIsLoadingLeaderboard(false); }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/items/profile');
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
    } catch (e) {} finally {
      setProfileLoaded(true);
    }
  };

  const gameItems = useMemo(() => items.filter(i => !i.mediaType || i.mediaType === 'game'), [items]);
  const movieItems = useMemo(() => items.filter(i => i.mediaType === 'movie' || i.mediaType === 'series' || i.mediaType === 'anime'), [items]);

  const availableGenres = useMemo(() => {
    const source = isCinemaView ? movieItems : gameItems;
    const set = new Set();
    source.forEach(item => (item.genres || []).forEach(g => { if (g) set.add(g); }));
    return Array.from(set).sort();
  }, [gameItems, movieItems, isCinemaView]);

  const applyAdvancedFilters = (list, statusFilter, isGames) => {
    let result = list.filter(item => {
      const isOwnedSteam = isGames && (Boolean(item.steamAppId) || Number(item.playtime) > 0);
      const effStatus = (item.status === 'wishlist' && isOwnedSteam) ? 'playing' : item.status;
      if (statusFilter === 'all') return effStatus !== 'wishlist';
      return effStatus === statusFilter;
    });

    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q));
    }
    if (!isGames && selectedMediaType !== 'all') {
      result = result.filter(i => i.mediaType === selectedMediaType);
    }
    if (selectedGenre !== 'all') {
      result = result.filter(i => (i.genres || []).includes(selectedGenre));
    }
    if (selectedYearRange !== 'all') {
      result = result.filter(i => {
        const y = Number(i.releaseYear);
        if (!y) return false;
        if (selectedYearRange === '2020s') return y >= 2020;
        if (selectedYearRange === '2010s') return y >= 2010 && y <= 2019;
        if (selectedYearRange === '2000s') return y >= 2000 && y <= 2009;
        if (selectedYearRange === 'classic') return y < 2000;
        return true;
      });
    }
    if (sortBy === 'hours') result = [...result].sort((a, b) => (Number(b.playtime) || 0) - (Number(a.playtime) || 0));
    else if (sortBy === 'rating') result = [...result].sort((a, b) => (Number(b.personalRating) || 0) - (Number(a.personalRating) || 0));
    else if (sortBy === 'metacritic') result = [...result].sort((a, b) => (Number(b.metacritic) || 0) - (Number(a.metacritic) || 0));
    else if (sortBy === 'year_new') result = [...result].sort((a, b) => (Number(b.releaseYear) || 0) - (Number(a.releaseYear) || 0));
    else if (sortBy === 'year_old') result = [...result].sort((a, b) => (Number(a.releaseYear) || 9999) - (Number(b.releaseYear) || 9999));
    else if (sortBy === 'title') result = [...result].sort((a, b) => a.title.localeCompare(b.title));

    return result;
  };

  const filteredItems = useMemo(() => applyAdvancedFilters(gameItems, filter, true), [gameItems, filter, localSearch, selectedGenre, selectedYearRange, sortBy]);
  const filteredMovieItems = useMemo(() => applyAdvancedFilters(movieItems, movieFilter, false), [movieItems, movieFilter, localSearch, selectedMediaType, selectedGenre, selectedYearRange, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (selectedGenre !== 'all') c++;
    if (selectedYearRange !== 'all') c++;
    if (selectedMediaType !== 'all') c++;
    if (sortBy !== 'default') c++;
    if (localSearch.trim() !== '') c++;
    return c;
  }, [selectedGenre, selectedYearRange, selectedMediaType, sortBy, localSearch]);

  const stats = useMemo(() => {
    const wishlist = gameItems.filter(i => i.status === 'wishlist').length;
    const backlog = gameItems.filter(i => i.status === 'backlog').length;
    const playing = gameItems.filter(i => i.status === 'playing').length;
    const paused = gameItems.filter(i => i.status === 'paused').length;
    const completed = gameItems.filter(i => i.status === 'completed').length;
    const ownedTotal = backlog + playing + paused + completed;
    const activeOwned = backlog + playing + completed;
    const completionRate = activeOwned > 0 ? Math.round((completed / activeOwned) * 100) : 0;
    const totalHours = Math.round(gameItems.reduce((acc, item) => acc + (Number(item.playtime) || 0), 0) * 10) / 10;
    const maxGameHours = gameItems.reduce((max, item) => Math.max(max, Number(item.playtime) || 0), 0);
    const ratedItems = gameItems.filter(i => i.personalRating);
    const perfectTenCount = gameItems.filter(i => Number(i.personalRating) >= 9.5).length;
    const commentedItems = gameItems.filter(i => i.comment && i.comment.trim().length > 0);
    const avgRating = ratedItems.length > 0 ? (ratedItems.reduce((acc, i) => acc + Number(i.personalRating), 0) / ratedItems.length).toFixed(1) : '—';

    const allOwnedCount = items.filter(i => i.status !== 'wishlist').length;
    const allCompletedCount = items.filter(i => i.status === 'completed').length;
    const allRatedCount = items.filter(i => i.personalRating).length;
    const allCommentedCount = items.filter(i => i.comment && i.comment.trim().length > 0).length;
    const allHours = Math.round(items.reduce((acc, item) => acc + (Number(item.playtime) || 0), 0) * 10) / 10;
    const xp = (allOwnedCount * 40) + (allCompletedCount * 120) + (allRatedCount * 30) + (allCommentedCount * 25) + Math.round(allHours * 5);
    const level = Math.floor(xp / 200) + 1;
    return { ownedTotal, wishlist, backlog, playing, paused, completed, completionRate, totalHours, maxGameHours, ratedCount: ratedItems.length, perfectTenCount, commentedCount: commentedItems.length, avgRating, xp, level, currentLevelXp: xp % 200, xpProgress: Math.round(((xp % 200) / 200) * 100) };
  }, [gameItems, items]);

  const movieStats = useMemo(() => {
    const wishlist = movieItems.filter(i => i.status === 'wishlist').length;
    const backlog = movieItems.filter(i => i.status === 'backlog').length;
    const playing = movieItems.filter(i => i.status === 'playing').length;
    const paused = movieItems.filter(i => i.status === 'paused').length;
    const completed = movieItems.filter(i => i.status === 'completed').length;
    const ownedTotal = backlog + playing + paused + completed;
    const activeOwned = backlog + playing + completed;
    const completionRate = activeOwned > 0 ? Math.round((completed / activeOwned) * 100) : 0;
    const totalHours = Math.round(movieItems.reduce((acc, item) => acc + (Number(item.playtime) || 0), 0) * 10) / 10;
    const ratedItems = movieItems.filter(i => i.personalRating);
    const perfectTenCount = movieItems.filter(i => Number(i.personalRating) >= 9.5).length;
    const commentedCount = movieItems.filter(i => i.comment && i.comment.trim().length > 0).length;

    // Підрахунок серій з урахуванням попередніх сезонів та завершених серіалів
    const totalEpisodesWatched = movieItems.reduce((acc, item) => {
      if (item.mediaType !== 'series' && item.mediaType !== 'anime') return acc;
      const season = Math.max(1, Number(item.currentSeason) || 1);
      const ep = Math.max(0, Number(item.currentEpisode) || 0);
      const previousSeasonsEpisodes = (season - 1) * 10;
      const currentTotal = previousSeasonsEpisodes + ep;
      if (item.status === 'completed') {
        return acc + Math.max(Number(item.totalEpisodes) || 10, currentTotal);
      }
      return acc + currentTotal;
    }, 0);

    const animeCount = movieItems.filter(i => i.mediaType === 'anime' && i.status !== 'wishlist').length;
    const avgRating = ratedItems.length > 0 ? (ratedItems.reduce((acc, i) => acc + Number(i.personalRating), 0) / ratedItems.length).toFixed(1) : '—';
    return {
      ownedTotal, wishlist, backlog, playing, paused, completed, completionRate,
      totalHours, ratedCount: ratedItems.length, perfectTenCount, commentedCount,
      totalEpisodesWatched, animeCount, avgRating
    };
  }, [movieItems]);

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

  const movieAchievements = useMemo(() => [
    { id: 'm_first', title: 'Перший кіносеанс', desc: 'Додати перший фільм, серіал або аніме до колекції', unlocked: movieStats.ownedTotal >= 1, progress: `${Math.min(movieStats.ownedTotal, 1)}/1`, icon: Film },
    { id: 'm_collector', title: 'Кіноколекціонер', desc: 'Зібрати 5 або більше тайтлів у кіновсесвіті', unlocked: movieStats.ownedTotal >= 5, progress: `${Math.min(movieStats.ownedTotal, 5)}/5`, icon: Layers },
    { id: 'm_archivist', title: 'Хранитель кінотеки', desc: 'Розширити свою кіноколекцію до 25 тайтлів', unlocked: movieStats.ownedTotal >= 25, progress: `${Math.min(movieStats.ownedTotal, 25)}/25`, icon: Shield },
    { id: 'm_mogul', title: 'Магнат Голлівуду', desc: 'Зібрати масштабну колекцію зі 100+ фільмів та серіалів', unlocked: movieStats.ownedTotal >= 100, progress: `${Math.min(movieStats.ownedTotal, 100)}/100`, icon: Crown },
    { id: 'm_finisher', title: 'Після фінальних титрів', desc: 'Повністю переглянути перший фільм або серіал', unlocked: movieStats.completed >= 1, progress: `${Math.min(movieStats.completed, 1)}/1`, icon: Trophy },
    { id: 'm_buff', title: 'Справжній кіноман', desc: 'Переглянути до кінця 10 фільмів або серіалів', unlocked: movieStats.completed >= 10, progress: `${Math.min(movieStats.completed, 10)}/10`, icon: Award },
    { id: 'm_jury', title: 'Почесне журі фестивалю', desc: 'Довести до фіналу 30 кінострічок', unlocked: movieStats.completed >= 30, progress: `${Math.min(movieStats.completed, 30)}/30`, icon: Sword },
    { id: 'm_binge', title: 'Ще одну серію і спати', desc: 'Відмітити 10+ переглянутих серій у серіалах чи аніме', unlocked: movieStats.totalEpisodesWatched >= 10, progress: `${Math.min(movieStats.totalEpisodesWatched, 10)}/10 серій`, icon: Tv },
    { id: 'm_otaku', title: 'Майстер аніме', desc: 'Додати 3 або більше аніме-тайтлів до колекції', unlocked: movieStats.animeCount >= 3, progress: `${Math.min(movieStats.animeCount, 3)}/3`, icon: Sparkles },
    { id: 'm_critic', title: 'Кінокритик', desc: 'Виставити особисту оцінку 5 фільмам чи серіалам', unlocked: movieStats.ratedCount >= 5, progress: `${Math.min(movieStats.ratedCount, 5)}/5`, icon: Star },
    { id: 'm_oscar', title: 'Академік Оскара', desc: 'Оцінити 15 різних проєктів у кіновсесвіті', unlocked: movieStats.ratedCount >= 15, progress: `${Math.min(movieStats.ratedCount, 15)}/15`, icon: Award },
    { id: 'm_cinema', title: 'Absolute Cinema!', desc: 'Поставити оцінку 9.5 або 10 кіношедевру', unlocked: movieStats.perfectTenCount >= 1, progress: `${Math.min(movieStats.perfectTenCount, 1)}/1`, icon: Zap },
    { id: 'm_popcorn', title: 'Запас попкорну', desc: 'Провести сумарно 25+ годин за переглядом кіно', unlocked: movieStats.totalHours >= 25, progress: `${Math.min(Math.round(movieStats.totalHours), 25)}/25 год`, icon: Clock },
    { id: 'm_marathon', title: 'Кіномарафонець', desc: 'Перетнути позначку у 100 годин перегляду', unlocked: movieStats.totalHours >= 100, progress: `${Math.min(Math.round(movieStats.totalHours), 100)}/100 год`, icon: Flame },
    { id: 'm_legend', title: 'Легенда кінозалу', desc: 'Набрати епічні 300+ годин у кіновсесвіті', unlocked: movieStats.totalHours >= 300, progress: `${Math.min(Math.round(movieStats.totalHours), 300)}/300 год`, icon: Rocket },
    { id: 'm_reviewer', title: 'Рецензент', desc: 'Залишити текстові враження до 3 фільмів чи серіалів', unlocked: movieStats.commentedCount >= 3, progress: `${Math.min(movieStats.commentedCount, 3)}/3`, icon: MessageSquare }
  ], [movieStats]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const unlockedMovieCount = movieAchievements.filter(a => a.unlocked).length;
  const activeAccent = ACCENT_THEMES.find(t => t.id === profile.accentColor) || ACCENT_THEMES[0];
  const favoriteGame = items.find(i => i._id === profile.favoriteGameId);

  const openProfileWithTab = (preferredTab) => {
    setAchTab(preferredTab || (isCinemaView ? 'movies' : 'games'));
    setIsProfileOpen(true);
  };

  const tierGroups = useMemo(() => {
    const sourceList = isCinemaView ? movieItems : gameItems;
    const rated = sourceList.filter(i => i.personalRating);
    return [
      { tier: 'S', label: 'Шедеври (9–10)', color: 'from-amber-400 to-orange-500 text-black', games: rated.filter(i => i.personalRating >= 9) },
      { tier: 'A', label: 'Відмінні (8–8.5)', color: 'from-emerald-400 to-teal-500 text-black', games: rated.filter(i => i.personalRating >= 8 && i.personalRating < 9) },
      { tier: 'B', label: 'Хороші (7–7.5)', color: 'from-indigo-400 to-blue-500 text-white', games: rated.filter(i => i.personalRating >= 7 && i.personalRating < 8) },
      { tier: 'C', label: 'Середні (5–6.5)', color: 'from-purple-400 to-fuchsia-500 text-white', games: rated.filter(i => i.personalRating >= 5 && i.personalRating < 7) },
      { tier: 'D', label: 'Слабкі (1–4.5)', color: 'from-rose-500 to-red-600 text-white', games: rated.filter(i => i.personalRating < 5) },
    ];
  }, [gameItems, movieItems, isCinemaView]);

  const allPlaylists = useMemo(() => [...userPlaylists, ...DEFAULT_PLAYLISTS], [userPlaylists]);

  // Мемоїзовані списки для вкладки Спільноти
  const filteredPlaylists = useMemo(
    () => allPlaylists.filter(p => (p.category || 'games') === communityTab),
    [allPlaylists, communityTab]
  );

  const filteredDiscussions = useMemo(
    () => discussions.filter(d => (d.category || 'movies') === communityTab),
    [discussions, communityTab]
  );

  const filteredFeedItems = useMemo(
    () => feedItems.filter(f => communityTab === 'movies' ? (f.mediaType && f.mediaType !== 'game') : (!f.mediaType || f.mediaType === 'game')),
    [feedItems, communityTab]
  );

  const renderUserAvatar = (avatarVal, nameVal, sizeClass = 'w-7 h-7', iconClass = 'w-3.5 h-3.5') => {
    if (avatarVal?.startsWith('http')) return <img src={avatarVal} alt={nameVal} className={`${sizeClass} rounded-full object-cover border border-white/20 shrink-0`} />;
    const preset = AVATAR_PRESETS.find(p => p.id === avatarVal) || AVATAR_PRESETS[0];
    const IconComp = preset.icon;
    return <div className={`${sizeClass} rounded-full bg-gradient-to-tr ${preset.gradient} flex items-center justify-center border border-white/25 shadow-sm shrink-0`}><IconComp className={`${iconClass} text-white`} /></div>;
  };

  const renderAvatar = (sizeClass = 'w-7 h-7', iconClass = 'w-3.5 h-3.5') => renderUserAvatar(profile.avatar, username, sizeClass, iconClass);

  const getSteamLinks = (game) => {
    if (game?.steamAppId) return { webUrl: `https://store.steampowered.com/app/${game.steamAppId}`, clientUrl: `steam://store/${game.steamAppId}` };
    return { webUrl: `https://store.steampowered.com/search/?term=${encodeURIComponent(game?.title || '')}`, clientUrl: null };
  };

  const handleToggleLike = async (reviewId) => {
    try {
      const res = await axios.post(`/api/items/${reviewId}/like`);
      setFeedItems(prev => prev.map(f => f._id === reviewId ? res.data : f));
    } catch (e) {}
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!plTitle.trim() || plSelectedGames.length === 0) return toast.error('Вкажи назву та обери тайтли!');
    setIsSavingPlaylist(true);
    try {
      const res = await axios.post('/api/items/playlists', { title: plTitle.trim(), desc: plDesc.trim(), theme: plTheme, category: plCategory, games: plSelectedGames });
      setUserPlaylists(prev => [res.data, ...prev]);
      toast.success('Плейлист опубліковано у Спільноті!', { icon: '🔥' });
      setIsPlaylistModalOpen(false);
      setPlTitle(''); setPlDesc(''); setPlSelectedGames([]);
    } catch (e) { toast.error('Не вдалося створити плейлист'); } finally { setIsSavingPlaylist(false); }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicBody.trim()) return;
    try {
      const res = await axios.post('/api/items/discussions', {
        title: newTopicTitle, body: newTopicBody, tag: newTopicTag, category: communityTab
      });
      setDiscussions(prev => [res.data, ...prev]);
      setNewTopicTitle(''); setNewTopicBody('');
      toast.success('Тему опубліковано в обговореннях!', { icon: '💬' });
    } catch (e) { toast.error('Помилка публікації'); }
  };

  const handleReplyDiscussion = async (discId) => {
    const text = replyTexts[discId];
    if (!text || !text.trim()) return;
    try {
      const res = await axios.post(`/api/items/discussions/${discId}/reply`, { text });
      setDiscussions(prev => prev.map(d => d._id === discId ? res.data : d));
      setReplyTexts(prev => ({ ...prev, [discId]: '' }));
    } catch (e) {}
  };

  const handleLikeDiscussion = async (discId) => {
    try {
      const res = await axios.post(`/api/items/discussions/${discId}/like`);
      setDiscussions(prev => prev.map(d => d._id === discId ? res.data : d));
    } catch (e) {}
  };

  const handleLikePlaylist = async (playlistId) => {
    try {
      const res = await axios.post(`/api/items/playlists/${playlistId}/like`);
      setUserPlaylists(prev => prev.map(p => p._id === playlistId ? res.data : p));
    } catch (e) {}
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await axios.delete(`/api/items/playlists/${playlistId}`);
      setUserPlaylists(prev => prev.filter(p => p._id !== playlistId));
      toast.success('Плейлист видалено');
    } catch (e) {}
  };

  const toggleSelectGameForPlaylist = (game) => {
    const exists = plSelectedGames.some(g => g.title === game.title);
    if (exists) setPlSelectedGames(prev => prev.filter(g => g.title !== game.title));
    else {
      if (plSelectedGames.length >= 8) return toast.error('Максимум 8 тайтлів');
      setPlSelectedGames(prev => [...prev, { title: game.title, mediaType: game.mediaType || 'game', imageUrl: game.imageUrl, releaseYear: game.releaseYear || 2024, metacritic: game.metacritic || 85, genres: game.genres || [] }]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const finalAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : profile.avatar;
    try {
      const res = await axios.put('/api/items/profile', { ...profile, avatar: finalAvatar });
      setProfile(prev => ({ ...prev, avatar: res.data.avatar, customTitle: res.data.customTitle, accentColor: res.data.accentColor, favoriteGameId: res.data.favoriteGameId || '', steamSynced: Boolean(res.data.steamSynced) }));
      toast.success('Профіль оновлено!');
      setIsProfileOpen(false);
      if (activeView === 'community') fetchLeaderboard();
    } catch (e) {} finally { setIsSavingProfile(false); }
  };

  const handleAddGame = async (itemData, requestedStatus) => {
    const mediaType = itemData.mediaType || (isCinemaView ? 'movie' : 'game');
    const existing = items.find(item => item.title.toLowerCase() === itemData.title.toLowerCase() && (item.mediaType || 'game') === mediaType);
    if (existing) {
      if (existing.status === 'wishlist' && requestedStatus === 'backlog') {
        handleUpdateStatus(null, existing._id, 'backlog', existing.title);
        return;
      }
      return toast.error(`"${itemData.title}" вже є у твоєму списку!`, { icon: '⚠️' });
    }
    const activeFilter = isCinemaView ? movieFilter : filter;
    const targetStatus = requestedStatus || (activeFilter === 'wishlist' ? 'wishlist' : 'backlog');
    const autoPlaytime = (mediaType === 'movie' && targetStatus === 'completed') ? Math.round(((itemData.runtimeMinutes || 130) / 60) * 10) / 10 : 0;

    try {
      const res = await axios.post('/api/items', {
        title: itemData.title, mediaType, imageUrl: itemData.imageUrl, releaseYear: itemData.releaseYear,
        metacritic: itemData.metacritic, genres: itemData.genres,
        runtimeMinutes: itemData.runtimeMinutes || (mediaType === 'movie' ? 125 : 45),
        playtime: autoPlaytime, currentSeason: 1, currentEpisode: 0, totalEpisodes: itemData.totalEpisodes || null, status: targetStatus
      });
      setItems(prev => [res.data, ...prev]);
      toast.success(`"${itemData.title}" додано!`, { icon: mediaType === 'game' ? '🎮' : '🍿' });
      if (activeView === 'community') {
        fetchFeed(); fetchTrending(); fetchLeaderboard();
      }
    } catch (error) { toast.error('Не вдалося додати'); }
  };

  // Паралельний імпорт 10 фільмів через Promise.all без блокування інтерфейсу
  const handleBulkImportTopMovies = async () => {
    const toAdd = top100Movies.filter(m => !movieItems.some(existing => existing.title.toLowerCase() === m.title.toLowerCase())).slice(0, 10);
    if (toAdd.length === 0) return toast.error('Ці фільми вже у твоїй колекції!');
    toast.loading('Додаємо 10 культових фільмів...', { id: 'bulk' });
    try {
      const responses = await Promise.all(
        toAdd.map(m =>
          axios.post('/api/items', {
            title: m.title, mediaType: 'movie', imageUrl: m.imageUrl, releaseYear: m.releaseYear,
            metacritic: m.metacritic, genres: m.genres, runtimeMinutes: m.runtimeMinutes || 130, status: 'backlog'
          })
        )
      );
      const created = responses.map(r => r.data);
      setItems(prev => [...created, ...prev]);
      toast.success(`Додано ${created.length} хітів у Заплановане!`, { id: 'bulk', icon: '🎬' });
    } catch (e) { toast.error('Помилка імпорту', { id: 'bulk' }); }
  };

  const handleUpdateStatus = async (e, id, newStatus, itemTitle) => {
    if (e) e.stopPropagation();
    const targetItem = items.find(i => i._id === id);
    const payload = { status: newStatus };
    let autoHoursAdded = 0;
    if (targetItem && targetItem.mediaType === 'movie' && newStatus === 'completed' && (!targetItem.playtime || targetItem.playtime === 0)) {
      autoHoursAdded = Math.round(((targetItem.runtimeMinutes || 125) / 60) * 10) / 10;
      payload.playtime = autoHoursAdded;
    }
    try {
      const res = await axios.put(`/api/items/${id}`, payload);
      setItems(prev => prev.map(item => item._id === id ? res.data : item));
      if (autoHoursAdded > 0) toast.success(`"${itemTitle}" переглянуто! +${autoHoursAdded} год`, { icon: '🍿' });
      else toast.success(`Статус "${itemTitle}" оновлено`, { icon: '✨' });
      if (activeView === 'community') {
        fetchTrending(); fetchLeaderboard();
      }
    } catch (e) {}
  };

  const handleIncrementEpisode = async (e, item) => {
    if (e) e.stopPropagation();
    const nextEp = (item.currentEpisode || 0) + 1;
    const epMins = item.runtimeMinutes || (item.mediaType === 'anime' ? 24 : 45);
    const addedHours = Math.round((epMins / 60) * 10) / 10;
    const newPlaytime = Math.round(((Number(item.playtime) || 0) + addedHours) * 10) / 10;
    let newStatus = (item.status === 'backlog' || item.status === 'wishlist' || item.status === 'paused') ? 'playing' : item.status;
    if (item.totalEpisodes && nextEp >= item.totalEpisodes) newStatus = 'completed';
    try {
      const res = await axios.put(`/api/items/${item._id}`, { currentEpisode: nextEp, playtime: newPlaytime, status: newStatus });
      setItems(prev => prev.map(i => i._id === item._id ? res.data : i));
      toast.success(`"${item.title}": Серія ${nextEp} (+${addedHours} год)`, { icon: '📺' });
    } catch (e) {}
  };

  const handleDeleteGame = async (e, id, gameTitle) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/items/${id}`);
      setItems(prev => prev.filter(item => item._id !== id));
      if (selectedGame?._id === id) setSelectedGame(null);
      toast.success(`"${gameTitle}" видалено`, { icon: '🗑️' });
    } catch (e) {}
  };

  const openGameDetails = (item) => {
    setSelectedGame(item);
    setRatingInput(item.personalRating || null);
    setPlaytimeInput(item.playtime || 0);
    setSessionAddInput('');
    setCommentInput(item.comment || '');
    setSeasonInput(item.currentSeason || 1);
    setEpisodeInput(item.currentEpisode || 0);
    setTotalEpisodesInput(item.totalEpisodes || '');
  };

  const handleAddSessionHours = (hoursToAdd) => {
    const val = Number(hoursToAdd);
    if (!val || val <= 0) return;
    const updated = Math.round(((Number(playtimeInput) || 0) + val) * 10) / 10;
    setPlaytimeInput(updated);
    setSessionAddInput('');
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!selectedGame) return;
    setIsSavingDetails(true);
    const finalPlaytime = Math.round(((Number(playtimeInput) || 0) + (Number(sessionAddInput) > 0 ? Number(sessionAddInput) : 0)) * 10) / 10;
    try {
      const res = await axios.put(`/api/items/${selectedGame._id}`, {
        personalRating: ratingInput ? Number(ratingInput) : null, playtime: finalPlaytime, comment: commentInput,
        currentSeason: Number(seasonInput) || 1, currentEpisode: Number(episodeInput) || 0, totalEpisodes: totalEpisodesInput ? Number(totalEpisodesInput) : null
      });
      setItems(prev => prev.map(item => item._id === selectedGame._id ? res.data : item));
      toast.success('Зміни збережено!');
      setSelectedGame(null);
      if (activeView === 'community') {
        fetchFeed(); fetchTrending(); fetchLeaderboard();
      }
    } catch (e) {} finally { setIsSavingDetails(false); }
  };

  const startLiveSession = (e, game) => {
    if (e) e.stopPropagation();
    setActiveSession({ gameId: game._id, title: game.title, startTime: Date.now() });
    toast.success(`Таймер для "${game.title}" запущено!`, { icon: '▶️' });
  };

  const stopLiveSession = async (elapsedSec = 0) => {
    if (!activeSession) return;
    const targetGame = items.find(i => i._id === activeSession.gameId);
    if (!targetGame) { setActiveSession(null); return; }
    const addedHours = elapsedSec >= 10 ? Math.max(0.1, Math.round((elapsedSec / 3600) * 10) / 10) : 0;
    const newTotal = Math.round(((Number(targetGame.playtime) || 0) + addedHours) * 10) / 10;
    try {
      const res = await axios.put(`/api/items/${targetGame._id}`, { playtime: newTotal, status: 'playing' });
      setItems(prev => prev.map(item => item._id === targetGame._id ? res.data : item));
      if (addedHours > 0) toast.success(`Сесію завершено! +${addedHours} год`, { icon: '⏱️' });
      else toast.success('Сесію зупинено');
    } catch (e) {} finally { setActiveSession(null); }
  };

  const handleSteamSync = async (e) => {
    e.preventDefault();
    if (!steamInput.trim()) return;
    setIsSyncingSteam(true);
    localStorage.setItem('steamProfile', steamInput.trim());
    try {
      const res = await axios.post('/api/items/steam-sync', { steamInput: steamInput.trim() });
      setItems(res.data.items);
      setProfile(prev => ({ ...prev, steamSynced: true }));
      setShowSteamPromo(false);
      toast.success(`Steam синхронізовано! Додано: ${res.data.importedCount || 0}`, { icon: '🎮' });
      setIsSteamModalOpen(false);
      if (activeView === 'community') {
        fetchTrending(); fetchLeaderboard();
      }
    } catch (error) { toast.error(error.response?.data?.message || 'Помилка синхронізації зі Steam'); } finally { setIsSyncingSteam(false); }
  };

  const handleSteamUnlink = async () => {
    try {
      await axios.post('/api/items/steam-unlink');
      setProfile(prev => ({ ...prev, steamSynced: false, steamId: '' }));
      toast.success("Steam від'єднано!");
      setIsSteamModalOpen(false);
    } catch (e) {}
  };

  const startRoulette = () => {
    const pool = isCinemaView ? movieItems.filter(i => i.status === 'backlog') : gameItems.filter(i => i.status === 'backlog');
    if (pool.length === 0) return toast.error('Список запланованого порожній!', { icon: '🎲' });
    setIsRouletteOpen(true); setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      setRouletteGame(pool[Math.floor(Math.random() * pool.length)]);
      if (++counter >= 15) { clearInterval(interval); setIsSpinning(false); }
    }, 85);
  };

  const handleSupportProject = async () => {
    const jarUrl = import.meta.env.VITE_MONO_JAR_URL;
    if (jarUrl) {
      window.open(jarUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      await navigator.clipboard.writeText('4874070010763785');
      toast.success('Номер картки Монобанк скопійовано (4874070010763785)', { icon: '🐈‍⬛' });
    } catch (err) {
      toast('Картка Монобанк: 4874070010763785', { icon: '💳' });
    }
  };

  const resetAllFilters = () => {
    setSelectedGenre('all');
    setSelectedYearRange('all');
    setSelectedMediaType('all');
    setSortBy('default');
    setLocalSearch('');
  };

  const filterTabs = [
    { id: 'all', label: t('tab_all'), count: stats.ownedTotal },
    { id: 'backlog', label: t('tab_backlog'), count: stats.backlog },
    { id: 'playing', label: t('tab_playing'), count: stats.playing },
    { id: 'paused', label: t('tab_paused'), count: stats.paused },
    { id: 'completed', label: t('tab_completed'), count: stats.completed },
    { id: 'wishlist', label: t('tab_wishlist'), count: stats.wishlist },
  ];

  const movieFilterTabs = [
    { id: 'all', label: t('tab_m_all'), count: movieStats.ownedTotal },
    { id: 'backlog', label: t('tab_m_backlog'), count: movieStats.backlog },
    { id: 'playing', label: t('tab_m_playing'), count: movieStats.playing },
    { id: 'paused', label: t('tab_paused'), count: movieStats.paused },
    { id: 'completed', label: t('tab_m_completed'), count: movieStats.completed },
    { id: 'wishlist', label: t('tab_wishlist'), count: movieStats.wishlist },
  ];

  const sliderStyle = getRatingColorStyles(ratingInput);

  const libraryForPlaylistPicker = useMemo(() => {
    const source = plCategory === 'movies' ? movieItems : gameItems;
    const q = plSearchQuery.trim().toLowerCase();
    return source.filter(i => !q || i.title.toLowerCase().includes(q)).slice(0, 30);
  }, [gameItems, movieItems, plCategory, plSearchQuery]);

  const activeAchievementsList = achTab === 'movies' ? movieAchievements : achievements;

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-indigo-500/30 relative overflow-x-hidden font-sans flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-700">
        <div className="absolute -top-32 -left-20 w-[650px] h-[500px] rounded-full transition-all duration-700" style={{ background: isCinemaView ? 'radial-gradient(circle, rgba(225, 29, 72, 0.28) 0%, rgba(159, 18, 57, 0.14) 45%, transparent 72%)' : 'radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, rgba(139, 92, 246, 0.14) 45%, transparent 72%)', filter: 'blur(45px)' }} />
        <div className="absolute -top-24 -right-20 w-[620px] h-[480px] rounded-full transition-all duration-700" style={{ background: isCinemaView ? 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.11) 45%, transparent 72%)' : 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.11) 45%, transparent 72%)', filter: 'blur(50px)' }} />
      </div>

      <AnimatePresence>
        {activeSession && <LiveSessionTimer activeSession={activeSession} onStop={stopLiveSession} />}
      </AnimatePresence>

      {/* Сповіщення-рекомендація підключити Steam через 12 секунд */}
      <AnimatePresence>
        {showSteamPromo && !profile.steamSynced && (
          <motion.div
            initial={{ opacity: 0, x: -40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="fixed bottom-6 left-6 z-50 max-w-sm bg-[#11121c]/95 backdrop-blur-xl border border-indigo-400/50 rounded-3xl p-4 shadow-2xl shadow-indigo-500/20 flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shrink-0 mt-0.5">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">Рекомендація</span>
                <button onClick={() => setShowSteamPromo(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-gray-200 mt-1 leading-relaxed">
                Прив'яжи свій акаунт <b>Steam</b>, щоб за пару секунд імпортувати всі свої ігри та награні години автоматично!
              </p>
              <button
                onClick={() => { setShowSteamPromo(false); setIsSteamModalOpen(true); }}
                className="mt-2.5 px-4 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all"
              >
                Синхронізувати Steam →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-9 relative z-10 flex-1">
        
        {/* ВЕРХНІЙ ХЕДЕР */}
        <nav className="flex items-start sm:items-center justify-between mb-8 sm:mb-12 gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => setActiveView('library')} className="group flex items-center gap-3 text-left">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg border border-white/20 transition-all ${isCinemaView ? 'from-rose-500 to-amber-600' : 'from-indigo-500 to-purple-600'}`}>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white">Backlogger</span>
            </button>

            <div className="hidden lg:flex items-center bg-[#0b0b12]/90 backdrop-blur-md p-1.5 rounded-full border border-white/10 ml-2 gap-1">
              <button onClick={() => setActiveView('library')} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${activeView === 'library' ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                <Gamepad2 className="w-3.5 h-3.5" /><span>{t('nav_library')}</span>
              </button>
              <button onClick={() => { setCommunityTab(activeView === 'movies' ? 'movies' : 'games'); setActiveView('community'); }} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${activeView === 'community' ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                <Users className="w-3.5 h-3.5" /><span>{t('nav_community')}</span>
              </button>
              <button onClick={() => setActiveView('movies')} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${activeView === 'movies' ? 'bg-rose-500/25 text-rose-200 border border-rose-400/40 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                <Film className="w-3.5 h-3.5 text-rose-400" /><span>{t('nav_movies')}</span>
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-start justify-end gap-2.5 ml-auto shrink-0">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`group flex items-center gap-2 bg-[#0b0b12]/90 border px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] ${
                activeFiltersCount > 0
                  ? isCinemaView
                    ? 'border-rose-400/60 text-rose-200 bg-rose-500/15'
                    : 'border-indigo-400/60 text-indigo-200 bg-indigo-500/15'
                  : 'border-white/10 text-gray-200 hover:border-cyan-400/45 hover:text-cyan-200 hover:bg-cyan-500/10'
              }`}
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90 ${isCinemaView ? 'text-rose-400' : 'text-cyan-400'}`} />
              <span>Фільтри</span>
              {activeFiltersCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isCinemaView ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'}`}>
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsAiOpen(true)}
              className={`group flex items-center gap-2 bg-[#0b0b12]/90 border border-white/10 px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] ${
                isCinemaView
                  ? 'text-rose-300 hover:text-rose-100 hover:border-rose-400/45 hover:bg-rose-500/15'
                  : 'text-purple-300 hover:text-purple-100 hover:border-purple-400/45 hover:bg-purple-500/15'
              }`}
            >
              <Bot className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>{isCinemaView ? t('nav_ai_cinema') : t('nav_ai')}</span>
            </button>

            <button
              onClick={() => setIsTierListOpen(true)}
              className="group flex items-center gap-2 bg-[#0b0b12]/90 hover:bg-amber-500/15 text-amber-200 border border-white/10 hover:border-amber-400/45 px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03]"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-6 transition-transform" />
              <span>{t('nav_tier')}</span>
            </button>

            <button
              onClick={() => setIsSteamModalOpen(true)}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] border ${
                profile.steamSynced
                  ? 'bg-[#0b0b12]/90 hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-[#0b0b12]/90 hover:bg-indigo-500/15 text-indigo-300 border-white/10'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>{profile.steamSynced ? t('nav_steam') : t('nav_steam_sync')}</span>
            </button>

            {/* Плашка профілю + Перемикач мов прямо ПІД нею */}
            <div className="flex flex-col items-end gap-1.5">
              <div className={`flex items-center gap-3 bg-[#0b0b12]/90 p-1.5 pl-2.5 pr-4 rounded-full border ${activeAccent.ring} transition-all hover:border-white/30`}>
                <button onClick={() => openProfileWithTab()} className="flex items-center gap-2 text-left">
                  {renderAvatar('w-7 h-7', 'w-3.5 h-3.5')}
                  <span className="text-sm font-bold text-white">{username || 'Геймер'}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${activeAccent.badge}`}>LVL {stats.level}</span>
                </button>
                <div className="w-px h-4 bg-white/10" />
                <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-400" title={t('nav_logout')}><LogOut className="w-3.5 h-3.5" /></button>
              </div>

              <div className="flex items-center bg-[#0b0b12]/90 p-0.5 px-1 rounded-full border border-white/10 shadow-sm mr-1">
                {[
                  { code: 'uk', label: 'UA' },
                  { code: 'en', label: 'EN' },
                  { code: 'ru', label: 'RU' }
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => changeLanguage(l.code)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold transition-all ${
                      lang === l.code ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden flex items-center gap-2 bg-[#0b0b12] border border-white/10 pl-2 pr-3 py-1.5 rounded-2xl text-gray-200">
            {renderAvatar('w-6 h-6', 'w-3 h-3')} <span className="text-xs font-bold text-white">{username}</span> {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Мобільна шторка з усіма функціями включно з Тір-лістом */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -16, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -16, height: 0 }} className="md:hidden overflow-hidden mb-6">
              <div className="bg-[#0b0b12] border border-white/15 rounded-3xl p-4 space-y-3 shadow-2xl">
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setActiveView('library'); setIsMobileMenuOpen(false); }} className={`py-2.5 px-2 rounded-2xl text-[11px] font-semibold border ${activeView === 'library' ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40' : 'bg-white/5 text-white border-white/10'}`}>{t('nav_library')}</button>
                  <button onClick={() => { setActiveView('community'); setIsMobileMenuOpen(false); }} className={`py-2.5 px-2 rounded-2xl text-[11px] font-semibold border ${activeView === 'community' ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40' : 'bg-white/5 text-white border-white/10'}`}>{t('nav_community')}</button>
                  <button onClick={() => { setActiveView('movies'); setIsMobileMenuOpen(false); }} className={`py-2.5 px-2 rounded-2xl text-[11px] font-semibold border ${activeView === 'movies' ? 'bg-rose-500/25 text-rose-200 border-rose-400/40' : 'bg-white/5 text-rose-200 border-white/10'}`}>{t('nav_movies')}</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsFilterModalOpen(true); }} className="py-2.5 px-2 rounded-2xl text-[11px] font-semibold bg-white/5 text-cyan-300 border border-white/10 flex items-center justify-center gap-1"><SlidersHorizontal className="w-3.5 h-3.5" /><span>Фільтри</span></button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsTierListOpen(true); }} className="py-2.5 px-2 rounded-2xl text-[11px] font-semibold bg-white/5 text-amber-200 border border-white/10 flex items-center justify-center gap-1"><LayoutGrid className="w-3.5 h-3.5 text-amber-400" /><span>{t('nav_tier')}</span></button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsSteamModalOpen(true); }} className="py-2.5 px-2 rounded-2xl text-[11px] font-semibold bg-white/5 text-emerald-300 border border-white/10 flex items-center justify-center gap-1"><RefreshCw className="w-3.5 h-3.5" /><span>Steam</span></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setIsMobileMenuOpen(false); openProfileWithTab(); }} className="py-2.5 px-2 rounded-2xl text-[11px] font-semibold bg-white/5 text-indigo-300 border border-white/10">Профіль і Ачівки</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setIsAiOpen(true); }} className="py-2.5 px-2 rounded-2xl text-[11px] font-semibold bg-white/5 text-purple-300 border border-white/10">{isCinemaView ? t('nav_ai_cinema') : t('nav_ai')}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== ВКЛАДКА КІНО ТА СЕРІАЛИ ===================== */}
        {activeView === 'movies' ? (
          <>
            <header className="mb-7 sm:mb-9 text-center max-w-2xl mx-auto px-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs font-bold mb-3">
                <Film className="w-3.5 h-3.5 text-rose-400" /><span>Backlogger Cinema</span>
              </div>
              <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-rose-100 to-rose-300/65 mb-2">
                {t('movies_title')}
              </h1>
              <p className="text-gray-400 text-xs sm:text-lg mb-4">{t('movies_sub')}</p>
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                <button onClick={fetchTop100Movies} className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all hover:scale-105">
                  <Trophy className="w-3.5 h-3.5" /><span>Відкрити Плейлист Топ-100 популярних фільмів</span>
                </button>
                <button onClick={() => { setCommunityTab('movies'); setActiveView('community'); }} className="px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/15 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all">
                  <MessageCircle className="w-3.5 h-3.5 text-rose-400" /><span>Спільнота Кіно →</span>
                </button>
              </div>
            </header>

            <LiveSearch onAddGame={handleAddGame} mode="movies" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
              <div className="group cursor-default bg-[#0d090b]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-rose-950/80 hover:via-[#1a0d12] hover:to-[#0d090b] border border-rose-900/35 hover:border-rose-400/55 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase text-gray-400 group-hover:text-rose-200">{t('card_progress_cinema')}</span><Film className="w-4 h-4 text-rose-400" /></div>
                <div>
                  <div className="flex items-baseline gap-1.5 mb-2"><span className="text-2xl sm:text-3xl font-bold text-white group-hover:text-rose-300">{movieStats.completionRate}%</span><span className="text-xs text-gray-500">({movieStats.completed} {t('card_watched_sub')})</span></div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden"><div style={{ width: `${movieStats.completionRate}%` }} className="h-full bg-rose-500 rounded-full" /></div>
                </div>
              </div>
              <div className="group cursor-default bg-[#0c0b09]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-amber-950/80 hover:via-[#1a140b] hover:to-[#0d0b08] border border-amber-900/35 hover:border-amber-400/55 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase text-gray-400 group-hover:text-amber-200">{t('card_activity')}</span><Flame className="w-4 h-4 text-amber-400" /></div>
                <div className="flex items-end justify-between">
                  <div><div className="text-2xl sm:text-3xl font-bold text-white group-hover:text-amber-300">{movieStats.playing}</div><div className="text-xs text-gray-500">{t('card_playing_sub')}</div></div>
                  <div className="text-right"><div className="text-sm sm:text-lg font-semibold text-amber-200">{movieStats.totalHours} {t('hours_short')}</div><div className="text-[11px] text-gray-500">{t('card_watched_sub')}</div></div>
                </div>
              </div>

              <div onClick={() => openProfileWithTab('movies')} className="group cursor-pointer bg-[#0b090e]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-purple-950/80 hover:via-[#181022] hover:to-[#0c0910] border border-purple-900/35 hover:border-purple-400/55 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase text-gray-400 group-hover:text-purple-200">{t('card_taste_cinema')}</span><Award className="w-4 h-4 text-purple-400" /></div>
                <div className="flex items-end justify-between">
                  <div><div className="text-2xl sm:text-3xl font-bold text-white group-hover:text-purple-300">{movieStats.avgRating}<span className="text-xs text-gray-500">/10</span></div><div className="text-xs text-gray-500">{t('card_avg_sub')}</div></div>
                  <div className="text-right">
                    <div className="text-sm sm:text-lg font-semibold text-purple-300 flex items-center justify-end gap-1">
                      <Trophy className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {unlockedMovieCount}/{movieAchievements.length}
                    </div>
                    <div className="text-[11px] text-gray-500">{t('card_ach_sub')}</div>
                  </div>
                </div>
              </div>

              <button onClick={startRoulette} className="group bg-[#0d090c]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-rose-950/85 hover:via-[#1f1018] hover:to-[#0d090c] border border-rose-900/40 hover:border-rose-400/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between w-full mb-2"><span className="text-xs font-semibold uppercase text-gray-400 group-hover:text-rose-200">{t('card_roulette_cinema_top')}</span><Dices className="w-4 h-4 text-rose-400" /></div>
                <div><div className="text-base sm:text-xl font-bold text-white group-hover:text-rose-300">{t('card_roulette_cinema_title')}</div><p className="text-xs text-gray-500">{t('card_roulette_cinema_sub')}</p></div>
              </button>
            </div>

            <div className="flex justify-center mb-7 sm:mb-10">
              <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex bg-[#0b0b10]/90 p-1.5 rounded-2xl border border-white/[0.08] gap-1">
                {movieFilterTabs.map((tab) => (
                  <button key={tab.id} onClick={() => setMovieFilter(tab.id)} className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 ${movieFilter === tab.id ? 'bg-rose-500/20 text-white border border-rose-400/35' : 'text-gray-400 hover:text-white'}`}>
                    <span>{tab.label}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5">{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {filteredMovieItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
                {filteredMovieItems.map(item => {
                  const isWishlistItem = item.status === 'wishlist';
                  const isSeriesOrAnime = item.mediaType === 'series' || item.mediaType === 'anime';
                  const ratingStyle = getRatingColorStyles(item.personalRating);
                  const typeBadge = item.mediaType === 'anime' ? { label: t('type_anime'), cls: 'bg-purple-500/90 text-white' } : item.mediaType === 'series' ? { label: t('type_series'), cls: 'bg-amber-500/90 text-black font-black' } : { label: t('type_movie'), cls: 'bg-rose-500/90 text-white' };

                  return (
                    <div key={item._id} onClick={() => openGameDetails(item)} className="group cursor-pointer bg-[#0b0b10] border border-white/[0.07] hover:border-rose-400/35 rounded-2xl sm:rounded-3xl overflow-hidden sm:hover:-translate-y-1.5 transition-all shadow-lg flex flex-col relative">
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#0b0b10]">
                        <img src={item.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Poster'} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end z-30">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg shadow-md ${typeBadge.cls}`}>{typeBadge.label}</span>
                          {item.personalRating && (
                            <div style={{ borderColor: ratingStyle.color }} className="bg-[#09090d]/95 border px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
                              <Star className="w-2.5 h-2.5 fill-current" style={{ color: ratingStyle.color }} />
                              <span className="text-[10px] font-extrabold" style={{ color: ratingStyle.color }}>{item.personalRating}/10</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2.5 left-2.5 z-30">
                          <button onClick={(e) => handleDeleteGame(e, item._id, item.title)} className="opacity-90 sm:opacity-0 group-hover:opacity-100 bg-[#09090d]/95 hover:bg-red-500 text-gray-200 hover:text-white border border-white/15 p-1.5 rounded-xl transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="absolute bottom-5 left-2.5 right-2.5 flex items-center justify-between text-[10px] z-30 pointer-events-none">
                          <span className="flex items-center gap-1 bg-[#09090d]/95 text-white font-semibold px-2.5 py-1 rounded-full border border-white/20">
                            <Clock className="w-3 h-3 text-rose-400" />
                            {item.playtime > 0 ? `${item.playtime} ${t('hours_short')}` : `${item.runtimeMinutes || 125} ${t('min_short')}`}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 pt-3 -mt-3 flex flex-col flex-1 bg-[#0b0b10] relative z-20">
                        <h3 className="font-bold text-sm sm:text-base text-white mb-0.5 line-clamp-1 group-hover:text-rose-300">{item.title}</h3>
                        <p className="text-[11px] text-gray-400 mb-2.5 line-clamp-1">{item.releaseYear ? `${item.releaseYear} • ` : ''}{item.genres?.join(', ') || 'Кіно'}</p>
                        {isSeriesOrAnime && !isWishlistItem ? (
                          <div onClick={(e) => e.stopPropagation()} className="mb-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl p-2 flex items-center justify-between gap-1.5">
                            <span className="text-[10px] text-gray-300 font-medium truncate"><b className="text-amber-300">{item.currentSeason || 1} сез</b> • {item.currentEpisode || 0}{item.totalEpisodes ? `/${item.totalEpisodes}` : ''} сер</span>
                            <button type="button" onClick={(e) => handleIncrementEpisode(e, item)} className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white text-[10px] font-extrabold">+1 серія</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => openGameDetails(item)} className="w-full mb-2.5 py-1.5 px-2.5 rounded-xl bg-white/[0.03] hover:bg-rose-500/20 border border-white/[0.07] text-[10px] text-gray-300 flex items-center justify-between">
                            <span>{t('btn_rate_movie')}</span><span className="text-rose-400 font-bold">+</span>
                          </button>
                        )}
                        <div onClick={(e) => e.stopPropagation()} className="mt-auto grid grid-cols-4 bg-black/60 rounded-xl p-0.5 border border-white/[0.07] gap-0.5">
                          {[{ id: 'backlog', label: t('st_m_backlog') }, { id: 'playing', label: t('st_m_playing') }, { id: 'paused', label: t('st_paused') }, { id: 'completed', label: t('st_m_completed') }].map(st => (
                            <button key={st.id} onClick={(e) => handleUpdateStatus(e, item._id, st.id, item.title)} className={`py-1 text-[8px] sm:text-[9px] font-bold rounded-lg truncate ${item.status === st.id ? 'bg-rose-500/30 text-rose-200 border border-rose-400/30' : 'text-gray-500 hover:text-gray-300'}`}>{st.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-14 px-4 bg-[#0b0b10] border border-white/[0.06] rounded-3xl">
                <p className="text-gray-300 text-base font-bold mb-1">У цій категорії поки порожньо</p>
                <p className="text-gray-500 text-xs mb-5">Відкрий наш готовий каталог зі 100 найкращих фільмів світу!</p>
                <button onClick={fetchTop100Movies} className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold inline-flex items-center gap-2">
                  <Trophy className="w-4 h-4" /><span>Відкрити Топ-100 популярних фільмів</span>
                </button>
              </div>
            )}
          </>
        ) : activeView === 'library' ? (
          /* ===================== ВКЛАДКА ІГРОВА БІБЛІОТЕКА ===================== */
          <>
            <header className="mb-7 sm:mb-10 text-center max-w-2xl mx-auto px-2">
              <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/55 mb-2">{t('hero_title')}</h1>
              <p className="text-gray-400 text-xs sm:text-lg">{t('hero_sub')}</p>
            </header>

            <LiveSearch onAddGame={handleAddGame} mode="games" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
              <div className="group cursor-default bg-[#0a0c0b]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-emerald-950/85 hover:via-[#0d1914] hover:to-[#090d0b] border border-emerald-900/35 hover:border-emerald-400/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase text-gray-400 group-hover:text-emerald-200">{t('card_progress')}</span><Trophy className="w-4 h-4 text-emerald-400" /></div>
                <div>
                  <div className="flex items-baseline gap-1.5 mb-2"><span className="text-2xl sm:text-3xl font-bold text-white group-hover:text-emerald-300">{stats.completionRate}%</span><span className="text-xs text-gray-500">({stats.completed} {t('card_completed_sub')})</span></div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden"><div style={{ width: `${stats.completionRate}%` }} className="h-full bg-emerald-500 rounded-full" /></div>
                </div>
              </div>
              <div className="group cursor-default bg-[#0c0b09]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-amber-950/85 hover:via-[#1a140b] hover:to-[#0d0b08] border border-amber-900/35 hover:border-amber-400/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase text-gray-400 group-hover:text-amber-200">{t('card_activity')}</span><Flame className="w-4 h-4 text-amber-400" /></div>
                <div className="flex items-end justify-between">
                  <div><div className="text-2xl sm:text-3xl font-bold text-white group-hover:text-amber-300">{stats.playing}</div><div className="text-xs text-gray-500">{t('card_playing_sub')}</div></div>
                  <div className="text-right"><div className="text-sm sm:text-lg font-semibold text-amber-200">{stats.totalHours} {t('hours_short')}</div><div className="text-[11px] text-gray-500">{t('card_hours_sub')}</div></div>
                </div>
              </div>
              <div onClick={() => openProfileWithTab('games')} className="group cursor-pointer bg-[#0b090e]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-purple-950/85 hover:via-[#181022] hover:to-[#0c0910] border border-purple-900/35 hover:border-purple-400/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase text-gray-400 group-hover:text-purple-200">{t('card_rank')}</span><Award className="w-4 h-4 text-purple-400" /></div>
                <div className="flex items-end justify-between">
                  <div><div className="text-2xl sm:text-3xl font-bold text-white group-hover:text-purple-300">{stats.avgRating}<span className="text-xs text-gray-500">/10</span></div><div className="text-xs text-gray-500">{t('card_avg_sub')}</div></div>
                  <div className="text-right">
                    <div className="text-sm sm:text-lg font-semibold text-purple-300 flex items-center justify-end gap-1">
                      <Trophy className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {unlockedCount}/{achievements.length}
                    </div>
                    <div className="text-[11px] text-gray-500">{t('card_ach_sub')}</div>
                  </div>
                </div>
              </div>
              <button onClick={startRoulette} className="group bg-[#090a10]/90 backdrop-blur-sm hover:bg-gradient-to-br hover:from-indigo-950/90 hover:via-[#12142b] hover:to-[#090a10] border border-indigo-900/40 hover:border-indigo-400/65 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between w-full mb-2"><span className="text-xs font-semibold uppercase text-gray-400 group-hover:text-indigo-200">{t('card_roulette_top')}</span><Dices className="w-4 h-4 text-indigo-400" /></div>
                <div><div className="text-base sm:text-xl font-bold text-white group-hover:text-indigo-300">{t('card_roulette_title')}</div><p className="text-xs text-gray-500">{t('card_roulette_sub')}</p></div>
              </button>
            </div>

            <div className="flex justify-center mb-7 sm:mb-10">
              <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex bg-[#0b0b10]/90 p-1.5 rounded-2xl border border-white/[0.08] gap-1">
                {filterTabs.map((tab) => (
                  <button key={tab.id} onClick={() => setFilter(tab.id)} className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 ${filter === tab.id ? 'bg-white/[0.09] text-white border border-white/15' : 'text-gray-400 hover:text-white'}`}>
                    <span>{tab.label}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5">{tab.count}</span>
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
                    <div key={item._id} onClick={() => openGameDetails(item)} className="group cursor-pointer bg-[#0b0b10] border border-white/[0.07] hover:border-white/25 rounded-2xl sm:rounded-3xl overflow-hidden sm:hover:-translate-y-1.5 transition-all shadow-lg flex flex-col relative">
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#0b0b10]">
                        <img src={item.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Game'} alt={item.title} loading="lazy" onError={(e) => { if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg'); }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end z-30">
                          {item.metacritic && <div className="bg-[#09090d]/95 border border-white/15 px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-400">{item.metacritic}</div>}
                          {item.personalRating && (
                            <div style={{ borderColor: ratingStyle.color }} className="bg-[#09090d]/95 border px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" style={{ color: ratingStyle.color }} />
                              <span className="text-[10px] font-extrabold" style={{ color: ratingStyle.color }}>{item.personalRating}/10</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-30">
                          <button onClick={(e) => handleDeleteGame(e, item._id, item.title)} className="opacity-90 sm:opacity-0 group-hover:opacity-100 bg-[#09090d]/95 hover:bg-red-500 text-gray-200 hover:text-white border border-white/15 p-1.5 rounded-xl transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                          {!isWishlistItem && <button onClick={(e) => startLiveSession(e, item)} className="opacity-90 sm:opacity-0 group-hover:opacity-100 bg-[#09090d]/95 hover:bg-indigo-500 text-gray-200 hover:text-white border border-white/15 p-1.5 rounded-xl transition-opacity"><Play className="w-3.5 h-3.5 fill-current" /></button>}
                          <a href={steamLinks.webUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="opacity-90 sm:opacity-0 group-hover:opacity-100 bg-[#09090d]/95 hover:bg-blue-600 text-blue-300 hover:text-white border border-white/15 p-1.5 rounded-xl transition-opacity"><ExternalLink className="w-3.5 h-3.5" /></a>
                        </div>
                        <div className="absolute bottom-5 left-2.5 right-2.5 flex items-center justify-between text-[10px] z-30 pointer-events-none">
                          <span className="flex items-center gap-1.5 bg-[#09090d]/95 text-white font-semibold px-2.5 py-1 rounded-full border border-white/20">
                            <Clock className="w-3 h-3 text-indigo-400" />{item.playtime || 0} {t('hours_short')}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 pt-3 -mt-3 flex flex-col flex-1 bg-[#0b0b10] relative z-20">
                        <h3 className="font-bold text-sm sm:text-base text-white mb-0.5 line-clamp-1 group-hover:text-indigo-300">{item.title}</h3>
                        <p className="text-[11px] text-gray-400 mb-2.5 line-clamp-1">{item.releaseYear ? `${item.releaseYear} • ` : ''}{item.genres?.join(', ') || 'Гра'}</p>
                        <button type="button" onClick={() => openGameDetails(item)} className="w-full mb-2.5 py-1.5 px-2.5 rounded-xl bg-white/[0.03] hover:bg-indigo-500/20 border border-white/[0.07] text-[10px] text-gray-300 flex items-center justify-between">
                          <span>{t('btn_rate_time')}</span><span className="text-indigo-400 font-bold">+</span>
                        </button>
                        <div onClick={(e) => e.stopPropagation()} className="mt-auto grid grid-cols-4 bg-black/60 rounded-xl p-0.5 border border-white/[0.07] gap-0.5">
                          {[{ id: 'backlog', label: t('st_backlog') }, { id: 'playing', label: t('st_playing') }, { id: 'paused', label: t('st_paused') }, { id: 'completed', label: t('st_completed') }].map(st => {
                            const currentSt = item.status === 'wishlist' ? 'playing' : item.status;
                            return (
                              <button key={st.id} onClick={(e) => handleUpdateStatus(e, item._id, st.id, item.title)} className={`py-1 text-[8px] sm:text-[9px] font-bold rounded-lg truncate ${currentSt === st.id ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30' : 'text-gray-500 hover:text-gray-300'}`}>{st.label}</button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-[#0b0b10] border border-white/[0.06] rounded-3xl">
                <p className="text-gray-400 text-base font-medium">{t('empty_cat')}</p>
              </div>
            )}
          </>
        ) : (
          /* ===================== ВКЛАДКА СПІЛЬНОТА ===================== */
          <div className="space-y-12">
            <header className="text-center max-w-2xl mx-auto px-2">
              <div className="inline-flex items-center bg-[#0b0b12] p-1.5 rounded-full border border-white/10 mb-5 gap-1">
                <button
                  onClick={() => setCommunityTab('games')}
                  className={`px-5 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all ${communityTab === 'games' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  <Gamepad2 className="w-4 h-4" /><span>Спільнота Ігор</span>
                </button>
                <button
                  onClick={() => setCommunityTab('movies')}
                  className={`px-5 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all ${communityTab === 'movies' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  <Film className="w-4 h-4" /><span>Спільнота Кіно</span>
                </button>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2">
                {communityTab === 'movies' ? 'Спільнота Кіноманів' : t('comm_title')}
              </h1>
              <p className="text-gray-400 text-xs sm:text-base">
                {communityTab === 'movies'
                  ? 'Жива аналітика переглядів, світові кінохіти, авторські кіноплейлисти, обговорення та Зал слави'
                  : t('comm_sub')}
              </p>
            </header>

            <LiveSearch onAddGame={handleAddGame} mode={communityTab === 'movies' ? 'movies' : 'games'} />

            {(communityTab === 'games' ? communityHits : cinemaHits).length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Flame className={`w-5 h-5 ${communityTab === 'movies' ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span>{communityTab === 'movies' ? 'Вибір кіноспільноти' : 'Вибір спільноти'}</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  {(communityTab === 'games' ? communityHits : cinemaHits).map((hit, idx) => (
                    <div key={idx} className="group bg-[#0b0b10] border border-white/[0.08] hover:border-emerald-400/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-lg">
                      <div className="relative aspect-[3/4] bg-black overflow-hidden">
                        <img
                          src={hit.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Cover'}
                          alt={hit.title}
                          onError={(e) => { if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg'); }}
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
                          {hit.playingNowCount > 0 && <span className="text-emerald-400 font-bold">● {hit.playingNowCount} актив.</span>}
                        </div>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 mb-2" title={hit.title}>{hit.title}</h4>
                        <div className="mt-auto flex gap-1.5">
                          <button onClick={() => handleAddGame(hit, 'backlog')} className="flex-1 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 text-indigo-200 hover:text-white border border-indigo-400/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all">
                            <Plus className="w-3 h-3" /> {communityTab === 'movies' ? 'У План' : 'Беклог'}
                          </button>
                          <button onClick={() => handleAddGame(hit, 'wishlist')} className="p-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-400/30 transition-all" title={t('to_wishlist')}>
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{communityTab === 'movies' ? 'Культові кінохіти та Тренди світового кіно' : t('comm_new_releases')}</span>
                </h2>
                {communityTab === 'movies' && (
                  <button onClick={fetchTop100Movies} className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all">
                    <Trophy className="w-3.5 h-3.5 text-amber-300" /><span>Відкрити весь Топ-100 фільмів</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {(communityTab === 'movies' ? DEFAULT_CINEMA_TRENDS : newReleases).map(tg => (
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
                        <button onClick={() => handleAddGame(tg, 'backlog')} className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all border ${communityTab === 'movies' ? 'bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border-rose-400/30' : 'bg-indigo-500/20 hover:bg-indigo-500 text-indigo-200 hover:text-white border-indigo-400/30'}`}>
                          <Plus className="w-3 h-3" /> {communityTab === 'movies' ? 'У План' : 'Беклог'}
                        </button>
                        <button onClick={() => handleAddGame(tg, 'wishlist')} className="p-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-400/30 transition-all" title={t('to_wishlist')}>
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <span>{communityTab === 'movies' ? 'Публічні Кіноплейлисти' : t('comm_playlists')} ({filteredPlaylists.length})</span>
                </h2>
                <button onClick={() => { setPlCategory(communityTab); setIsPlaylistModalOpen(true); }} className={`px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all hover:-translate-y-0.5 ${communityTab === 'movies' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-500 hover:bg-indigo-600'}`}>
                  <Plus className="w-4 h-4" /><span>{t('comm_create_playlist')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {filteredPlaylists.map(pl => {
                  const themeCfg = PLAYLIST_THEMES[pl.theme] || PLAYLIST_THEMES.indigo;
                  const curatorName = pl.user?.username || pl.curator || 'Геймер';
                  const isOwner = !pl.isDefault && pl.user?.username?.toLowerCase() === username?.toLowerCase();
                  const likesCount = Array.isArray(pl.likes) ? pl.likes.length : 0;

                  return (
                    <div key={pl._id} className={`bg-gradient-to-b ${themeCfg.gradient} border ${themeCfg.border} rounded-3xl p-5 flex flex-col justify-between transition-all`}>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {pl.user ? renderUserAvatar(pl.user.avatar, curatorName, 'w-5 h-5', 'w-2.5 h-2.5') : <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                            <span className="text-[11px] font-bold text-indigo-300 truncate">{curatorName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!pl.isDefault && (
                              <button onClick={() => handleLikePlaylist(pl._id)} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 hover:bg-pink-500/20 text-[11px] text-gray-300 hover:text-pink-300 border border-white/10 transition-all">
                                <Heart className={`w-3 h-3 ${likesCount > 0 ? 'text-pink-400 fill-pink-400' : ''}`} />
                                <span>{likesCount}</span>
                              </button>
                            )}
                            {isOwner && (
                              <button onClick={() => handleDeletePlaylist(pl._id)} className="p-1 rounded-lg bg-black/40 hover:bg-red-500/25 text-gray-400 hover:text-red-300 border border-white/10 transition-colors" title="Видалити свій плейлист">
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
                              <img src={g.imageUrl || 'https://via.placeholder.com/60x80/1a1a1a/ffffff?text=Cover'} alt={g.title} onError={(e) => { if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg'); }} className="w-9 h-12 object-cover rounded-lg shrink-0 bg-black" />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">{g.title}</div>
                                <div className="text-[10px] text-gray-400">{g.releaseYear || 2024} {g.metacritic ? `• ★ ${g.metacritic}` : ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handleAddGame(g, 'wishlist')} className="p-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white transition-colors" title={t('to_wishlist')}><Heart className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleAddGame(g, 'backlog')} className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white transition-colors" title="Додати у колекцію"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-[#0b0b10]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 space-y-5">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className={`w-5 h-5 ${communityTab === 'movies' ? 'text-rose-400' : 'text-indigo-400'}`} />
                <span>{communityTab === 'movies' ? 'Обговорення фільмів, питання та рекомендації' : 'Обговорення ігор та поради спільноти'}</span>
              </h2>
              <form onSubmit={handleCreateDiscussion} className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {['Рекомендація', 'Питання по сюжету', 'Пошук на вечір', 'Враження'].map(tag => (
                    <button type="button" key={tag} onClick={() => setNewTopicTag(tag)} className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${newTopicTag === tag ? (communityTab === 'movies' ? 'bg-rose-500/25 text-rose-200 border-rose-400/50' : 'bg-indigo-500/25 text-indigo-200 border-indigo-400/50') : 'bg-white/5 text-gray-400 border-white/10'}`}>{tag}</button>
                  ))}
                </div>
                <input type="text" required value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)} placeholder={communityTab === 'movies' ? 'Тема (наприклад: Порадьте крутий трилер на вечір)...' : 'Тема обговорення...'} className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none" />
                <div className="flex gap-2">
                  <input type="text" required value={newTopicBody} onChange={(e) => setNewTopicBody(e.target.value)} placeholder="Напиши своє питання або рекомендацію..." className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none" />
                  <button type="submit" className={`px-5 py-2 rounded-xl text-white text-xs font-bold shrink-0 ${communityTab === 'movies' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-500 hover:bg-indigo-600'}`}>Опублікувати</button>
                </div>
              </form>

              {filteredDiscussions.length > 0 && (
                <div className="space-y-3">
                  {filteredDiscussions.map(disc => (
                    <div key={disc._id} className="bg-black/50 border border-white/[0.08] rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-amber-300 mr-2">{disc.tag}</span>
                          <span className="text-sm sm:text-base font-bold text-white">{disc.title}</span>
                          <p className="text-xs text-gray-300 mt-1">{disc.body}</p>
                          <div className="text-[11px] text-gray-500 mt-1.5">Автор: <b className="text-indigo-300">{disc.user?.username || 'Геймер'}</b></div>
                        </div>
                        <button onClick={() => handleLikeDiscussion(disc._id)} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-pink-500/20 text-xs text-gray-300 border border-white/10">
                          <Heart className={`w-3.5 h-3.5 ${disc.likes?.length > 0 ? 'text-pink-400 fill-pink-400' : ''}`} /><span>{disc.likes?.length || 0}</span>
                        </button>
                      </div>
                      {disc.replies?.length > 0 && (
                        <div className="pl-3 border-l-2 border-white/10 space-y-1.5">
                          {disc.replies.map((r, i) => (
                            <div key={i} className="text-xs text-gray-300"><b className="text-rose-300">{r.username}:</b> {r.text}</div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <input type="text" value={replyTexts[disc._id] || ''} onChange={(e) => setReplyTexts(prev => ({ ...prev, [disc._id]: e.target.value }))} placeholder="Написати відповідь..." className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
                        <button type="button" onClick={() => handleReplyDiscussion(disc._id)} className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white">Відповісти</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
                  <span>{communityTab === 'movies' ? 'Останні кіновідгуки спільноти' : t('comm_reviews')}</span>
                </h2>
              </div>

              {filteredFeedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFeedItems.map(feedItem => {
                    const rStyle = getRatingColorStyles(feedItem.personalRating);
                    const likesCount = Array.isArray(feedItem.likes) ? feedItem.likes.length : 0;

                    return (
                      <div key={feedItem._id} className="bg-[#0b0b10] border border-white/[0.08] hover:border-white/15 rounded-2xl p-4 flex gap-4 transition-all">
                        <img src={feedItem.imageUrl} alt={feedItem.title} onError={(e) => { if (e.target.src.includes('library_600x900.jpg')) e.target.src = e.target.src.replace('library_600x900.jpg', 'header.jpg'); }} className="w-20 h-28 object-cover rounded-xl border border-white/10 shrink-0 bg-black" />
                        <div className="flex-1 flex flex-col min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm sm:text-base text-white truncate">{feedItem.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {renderUserAvatar(feedItem.user?.avatar, feedItem.user?.username, 'w-5 h-5', 'w-2.5 h-2.5')}
                                <span className="text-xs font-semibold text-indigo-300 truncate">{feedItem.user?.username || 'Геймер'}</span>
                              </div>
                            </div>
                            {feedItem.personalRating && (
                              <div style={{ backgroundColor: rStyle.color }} className="px-2.5 py-1 rounded-xl text-xs font-black text-black shrink-0 shadow-md">
                                {feedItem.personalRating}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-300 line-clamp-3 mt-1.5 leading-relaxed">
                            {feedItem.comment || 'Оцінено без текстового коментаря.'}
                          </p>
                          <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              {communityTab === 'movies' ? 'Переглянуто' : 'Зіграно'} {feedItem.playtime || 0} {t('hours_short')}
                            </span>
                            <button onClick={() => handleToggleLike(feedItem._id)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-pink-500/20 text-gray-300 hover:text-pink-300 border border-white/10 transition-all">
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
                  Поки що немає відгуків у цій категорії. Оціни будь-який тайтл, щоб твій відгук з'явився першим!
                </div>
              )}
            </section>

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

                          {renderUserAvatar(player.avatar, player.username, 'w-10 h-10', 'w-5 h-5')}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm sm:text-base text-white truncate">{player.username}</span>
                              {isTop1 && <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">Топ-1 Легенда</span>}
                              {isCurrentUser && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200">Ти</span>}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate">
                              {player.customTitle} • {player.totalGames} тайтлів ({player.completedGames} завершено) • {player.totalHours} {t('hours_short')}
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

      {/* ФУТЕР */}
      <footer className="mt-20 border-t border-white/[0.07] bg-[#07070b] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="text-center md:text-left">
              © {new Date().getFullYear()} Backlogger • Ігор: {stats.ownedTotal} ({stats.totalHours} {t('hours_short')}) • Кіно: {movieStats.ownedTotal} ({movieStats.totalHours} {t('hours_short')})
            </div>
            
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleSupportProject}
                className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-pink-500/10 border border-white/10 hover:border-pink-500/30 text-gray-400 hover:text-pink-300 transition-all active:scale-95"
                title="Скопіювати номер картки Монобанк"
              >
                <Heart className="w-3.5 h-3.5 group-hover:fill-pink-400 transition-colors" />
                <span className="font-bold">Підтримати проєкт</span>
              </button>
              
              <div className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
              
              <div className="flex items-center gap-2 text-gray-400 font-medium">
                <span>{t('footer_created')}</span><span>🇺🇦</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <button onClick={() => setIsAiOpen(true)} className={`fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#121218] text-white shadow-2xl border border-white/15 hover:scale-105 transition-all flex items-center gap-2 ${isCinemaView ? 'hover:bg-rose-600' : 'hover:bg-indigo-600'}`}>
        <Bot className={`w-5 h-5 ${isCinemaView ? 'text-rose-400' : 'text-indigo-400'}`} />
        <span className="hidden sm:inline text-xs font-bold pr-1">{isCinemaView ? t('nav_ai_cinema_guide') : t('nav_ai_guide')}</span>
      </button>

      {/* ВЕЛИКЕ МОДАЛЬНЕ ВІКНО ФІЛЬТРІВ */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0e0e14] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl border ${isCinemaView ? 'bg-rose-500/15 border-rose-400/30 text-rose-400' : 'bg-cyan-500/15 border-cyan-400/30 text-cyan-400'}`}>
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{isCinemaView ? 'Фільтри та Сортування Кіно' : 'Фільтри та Сортування Ігор'}</h3>
                    <p className="text-xs text-gray-400">Налаштуй відображення своєї колекції за жанрами, роками та рейтингом</p>
                  </div>
                </div>
                <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-white p-1.5"><X className="w-5 h-5" /></button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Пошук за назвою у твоїй колекції</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Введи частину назви..."
                    className="w-full bg-black/60 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {isCinemaView && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Формат</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'Усі формати' },
                      { id: 'movie', label: '🎬 Фільми' },
                      { id: 'series', label: '📺 Серіали' },
                      { id: 'anime', label: '✨ Аніме' }
                    ].map(fItem => (
                      <button
                        key={fItem.id}
                        type="button"
                        onClick={() => setSelectedMediaType(fItem.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedMediaType === fItem.id
                            ? 'bg-rose-500/25 text-white border-rose-400 shadow-md'
                            : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {fItem.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Сортувати колекцію</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'default', label: 'За замовчуванням' },
                    { id: 'hours', label: 'За годинами ↓' },
                    { id: 'rating', label: 'За твоєю оцінкою ↓' },
                    { id: 'metacritic', label: 'За оцінкою критиків ↓' },
                    { id: 'year_new', label: 'Спочатку новіші' },
                    { id: 'year_old', label: 'Спочатку старіші' },
                    { id: 'title', label: 'За алфавітом (А–Я)' }
                  ].map(sItem => (
                    <button
                      key={sItem.id}
                      type="button"
                      onClick={() => setSortBy(sItem.id)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                        sortBy === sItem.id
                          ? isCinemaView
                            ? 'bg-rose-500/25 text-white border-rose-400'
                            : 'bg-indigo-500/25 text-white border-indigo-400'
                          : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {sItem.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Рік випуску</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'Усі роки' },
                    { id: '2020s', label: '2020 – 2026' },
                    { id: '2010s', label: '2010 – 2019' },
                    { id: '2000s', label: '2000 – 2009' },
                    { id: 'classic', label: 'До 2000 року' }
                  ].map(yItem => (
                    <button
                      key={yItem.id}
                      type="button"
                      onClick={() => setSelectedYearRange(yItem.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedYearRange === yItem.id
                          ? isCinemaView
                            ? 'bg-rose-500/25 text-white border-rose-400'
                            : 'bg-indigo-500/25 text-white border-indigo-400'
                          : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {yItem.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Жанр</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedGenre('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedGenre === 'all'
                        ? isCinemaView
                          ? 'bg-rose-500/25 text-white border-rose-400'
                          : 'bg-indigo-500/25 text-white border-indigo-400'
                        : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    Усі жанри
                  </button>
                  {availableGenres.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGenre(g)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedGenre === g
                          ? isCinemaView
                            ? 'bg-rose-500/25 text-white border-rose-400'
                            : 'bg-indigo-500/25 text-white border-indigo-400'
                          : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold transition-all"
                >
                  Скинути всі фільтри
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-extrabold shadow-lg transition-all ${
                    isCinemaView ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
                >
                  Показати результати ({isCinemaView ? filteredMovieItems.length : filteredItems.length})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* МОДАЛЬНЕ ВІКНО ПРОФІЛЮ З ПЕРЕМИКАЧЕМ АЧІВОК ІГОР ТА АЧІВОК КІНО */}
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
                    {renderAvatar('w-16 h-16 sm:w-20 sm:h-20', 'w-8 h-8 sm:w-10 sm:h-10')}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{username || 'Геймер'}</h2>
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${activeAccent.ring} ${activeAccent.badge}`}>РІВЕНЬ {stats.level}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-indigo-300 font-medium mt-0.5">{profile.customTitle}</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-48 bg-black/60 p-2.5 rounded-2xl border border-white/10">
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-400 font-semibold">Досвід (XP)</span><span className="text-white font-bold">{stats.currentLevelXp} / 200 XP</span></div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div style={{ width: `${stats.xpProgress}%` }} className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full" /></div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs sm:text-sm font-bold text-gray-200">Мова інтерфейсу / Language</span>
                  </div>
                  <div className="flex items-center bg-black/60 p-1 rounded-full border border-white/10 gap-1">
                    {[
                      { code: 'uk', label: 'UA Українська' },
                      { code: 'en', label: 'EN English' },
                      { code: 'ru', label: 'RU Русский' }
                    ].map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => changeLanguage(l.code)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                          lang === l.code ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3.5">
                    <div className="inline-flex bg-black/60 p-1 rounded-2xl border border-white/10 gap-1">
                      <button
                        type="button"
                        onClick={() => setAchTab('games')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                          achTab === 'games'
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Ачівки Ігор ({unlockedCount}/{achievements.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAchTab('movies')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                          achTab === 'movies'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Ачівки Кіно ({unlockedMovieCount}/{movieAchievements.length})</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-gray-500">Загальний досвід: {stats.xp} XP</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {activeAchievementsList.map((ach) => (
                      <div
                        key={ach.id}
                        className={`p-3 rounded-2xl border flex items-center gap-3 ${
                          ach.unlocked
                            ? achTab === 'movies'
                              ? 'bg-[#1a1115] border-rose-400/40'
                              : 'bg-[#151520] border-indigo-400/35'
                            : 'bg-white/[0.02] border-white/[0.06] opacity-55'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${ach.unlocked ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-gray-500'}`}>
                          <ach.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white truncate">{ach.title}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${ach.unlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-500'}`}>
                              {ach.unlocked ? 'Відкрито' : ach.progress}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{ach.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-white/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-300">Кастомізація акаунта</div>
                  <div>
                    <div className="grid grid-cols-6 gap-2 mb-2.5">
                      {AVATAR_PRESETS.map((preset) => (
                        <button type="button" key={preset.id} onClick={() => { setCustomAvatarUrl(''); setProfile({ ...profile, avatar: preset.id }); }} className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all ${profile.avatar === preset.id && !customAvatarUrl ? 'bg-white/15 border-white/40 scale-105' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'}`}>
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${preset.gradient} flex items-center justify-center`}><preset.icon className="w-4 h-4 text-white" /></div><span className="text-[9px] text-gray-300 truncate w-full text-center">{preset.label.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                    <input type="text" value={customAvatarUrl} onChange={(e) => setCustomAvatarUrl(e.target.value)} placeholder="Або встав URL картинки / Steam-аватарки (https://...)" className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1.5">Твій титул</label>
                      <input type="text" maxLength={32} value={profile.customTitle} onChange={(e) => setProfile({ ...profile, customTitle: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 mb-1.5" />
                      <div className="flex flex-wrap gap-1">{TITLE_PRESETS.map(tItem => <button type="button" key={tItem} onClick={() => setProfile({ ...profile, customTitle: tItem })} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-0.5 rounded-lg border border-white/5">{tItem}</button>)}</div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1.5">Улюблений тайтл на банері</label>
                      <select value={profile.favoriteGameId} onChange={(e) => setProfile({ ...profile, favoriteGameId: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60">
                        <option value="">Без банера</option>{items.map(g => <option key={g._id} value={g._id}>{g.title}</option>)}
                      </select>
                      <label className="block text-[11px] text-gray-400 mt-3 mb-1.5">Колір акценту</label>
                      <div className="flex gap-2">{ACCENT_THEMES.map(theme => <button type="button" key={theme.id} onClick={() => setProfile({ ...profile, accentColor: theme.id })} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${profile.accentColor === theme.id ? `${theme.badge} ${theme.ring}` : 'bg-white/5 text-gray-400 border-white/10'}`}>{theme.label}</button>)}</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button type="button" onClick={() => setIsProfileOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white">Закрити</button>
                    <button type="submit" disabled={isSavingProfile} className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Зберегти</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* МОДАЛЬНЕ ВІКНО КАТАЛОГУ "ТОП-100 НАЙПОПУЛЯРНІШИХ ФІЛЬМІВ" */}
      <AnimatePresence>
        {isTop100Open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTop100Open(false)} className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0e0e14] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" />Плейлист: Топ-100 найпопулярніших фільмів</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Додавай світові кінохіти до своєї колекції в один клік без ручного пошуку</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleBulkImportTopMovies} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg">
                    <Plus className="w-4 h-4" /><span>Додати одразу 10 хітів у План</span>
                  </button>
                  <button onClick={() => setIsTop100Open(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="my-3 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" value={top100Search} onChange={(e) => setTop100Search(e.target.value)} placeholder="Швидкий пошук серед 100 найкращих фільмів..." className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500" />
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {isLoadingTop100 ? (
                  <div className="py-20 text-center text-sm text-gray-400">Завантажуємо сотню найкращих фільмів з бази TMDB...</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {top100Movies.filter(m => !top100Search.trim() || m.title.toLowerCase().includes(top100Search.toLowerCase())).map((movie, idx) => {
                      const alreadyAdded = movieItems.some(i => i.title.toLowerCase() === movie.title.toLowerCase());
                      return (
                        <div key={movie.rawgId} className="bg-[#12121a] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                          <div className="relative aspect-[3/4] bg-black">
                            <img src={movie.imageUrl} alt={movie.title} loading="lazy" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-black/85 px-2 py-0.5 rounded-lg text-[10px] font-black text-amber-300">#{idx + 1}</div>
                            {movie.metacritic && <div className="absolute top-2 right-2 bg-black/85 px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-400">★ {movie.metacritic}</div>}
                          </div>
                          <div className="p-2.5 flex flex-col flex-1">
                            <h4 className="text-xs font-bold text-white line-clamp-1" title={movie.title}>{movie.title}</h4>
                            <p className="text-[10px] text-gray-400 mb-2">{movie.releaseYear} • {movie.genres?.join(', ')}</p>
                            {alreadyAdded ? (
                              <div className="mt-auto py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-[10px] font-bold text-center">✓ У колекції</div>
                            ) : (
                              <div className="mt-auto flex gap-1">
                                <button onClick={() => handleAddGame(movie, 'backlog')} className="flex-1 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white text-[10px] font-bold transition-all">+ У План</button>
                                <button onClick={() => handleAddGame(movie, 'completed')} className="px-2 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-[10px] font-bold transition-all" title="Вже бачив">✓</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{isAiOpen && <AiModal onClose={() => setIsAiOpen(false)} mode={isCinemaView ? 'movies' : 'games'} />}</AnimatePresence>

      {/* СТВОРЕННЯ ПЛЕЙЛИСТА */}
      <AnimatePresence>
        {isPlaylistModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPlaylistModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0e0e14] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-extrabold text-white">Створити публічний плейлист</h3>
                <button onClick={() => setIsPlaylistModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <input type="text" required value={plTitle} onChange={(e) => setPlTitle(e.target.value)} placeholder="Назва плейлиста..." className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white" />
                <input type="text" value={plDesc} onChange={(e) => setPlDesc(e.target.value)} placeholder="Короткий опис..." className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white" />
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(PLAYLIST_THEMES).map(([key, cfg]) => (
                    <button type="button" key={key} onClick={() => setPlTheme(key)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${plTheme === key ? 'bg-indigo-500/25 text-white border-indigo-400' : 'bg-white/5 text-gray-400 border-white/10'}`}>{cfg.label}</button>
                  ))}
                </div>
                <input type="text" value={plSearchQuery} onChange={(e) => setPlSearchQuery(e.target.value)} placeholder="Пошук у твоїй колекції..." className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white" />
                <div className="max-h-52 overflow-y-auto space-y-1.5 border border-white/10 rounded-2xl p-2 bg-black/30">
                  {libraryForPlaylistPicker.map(g => {
                    const isSelected = plSelectedGames.some(x => x.title === g.title);
                    return (
                      <button type="button" key={g._id} onClick={() => toggleSelectGameForPlaylist(g)} className={`w-full flex items-center justify-between p-2 rounded-xl border text-left ${isSelected ? 'bg-indigo-500/25 border-indigo-400/50 text-white' : 'border-white/5 text-gray-300'}`}>
                        <span className="text-xs font-bold truncate">{g.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2"><button type="submit" disabled={isSavingPlaylist} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 text-white">Опублікувати</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ТІР-ЛІСТ */}
      <AnimatePresence>
        {isTierListOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTierListOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-[#0e0e13] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-extrabold text-white">{isCinemaView ? 'Тір-ліст Кіновсесвіту' : 'Персональний Тір-ліст'}</h3>
                <button onClick={() => setIsTierListOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {tierGroups.map(group => (
                  <div key={group.tier} className="flex bg-[#14141c] border border-white/10 rounded-2xl overflow-hidden min-h-[76px]">
                    <div className={`w-16 sm:w-24 bg-gradient-to-br ${group.color} flex flex-col items-center justify-center shrink-0 p-2`}><span className="text-2xl font-black">{group.tier}</span><span className="text-[9px] font-bold text-center">{group.label}</span></div>
                    <div className="p-2.5 flex flex-wrap items-center gap-2 flex-1">
                      {group.games.map(g => (
                        <div key={g._id} className="flex items-center gap-2 bg-black/60 border border-white/10 pr-2.5 rounded-xl overflow-hidden"><img src={g.imageUrl} alt={g.title} className="w-10 h-12 object-cover" /><div className="text-xs font-bold text-white max-w-[120px] truncate">{g.title}</div></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ДЕТАЛІ ГРИ / ФІЛЬМУ */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGame(null)} className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#0e0e13] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-white truncate">{selectedGame.title}</h2>
                <button onClick={() => setSelectedGame(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 text-center">
                  <div style={{ color: sliderStyle.color, textShadow: sliderStyle.textShadow }} className="text-4xl font-black mb-2">{ratingInput ? `${ratingInput} / 10` : '—'}</div>
                  <input type="range" min="1" max="10" step="0.5" value={ratingInput || 5} onChange={(e) => setRatingInput(parseFloat(e.target.value))} style={{ accentColor: sliderStyle.accentHex, background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)' }} className="w-full h-2.5 rounded-full appearance-none cursor-pointer" />
                </div>
                {(selectedGame.mediaType === 'series' || selectedGame.mediaType === 'anime') && (
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-[10px] text-gray-400">Сезон</label><input type="number" min="1" value={seasonInput} onChange={(e) => setSeasonInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" /></div>
                    <div><label className="text-[10px] text-gray-400">Серія</label><input type="number" min="0" value={episodeInput} onChange={(e) => setEpisodeInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" /></div>
                    <div><label className="text-[10px] text-gray-400">Всього серій</label><input type="number" min="1" value={totalEpisodesInput} onChange={(e) => setTotalEpisodesInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" /></div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400">Години ({playtimeInput} год)</label>
                  <div className="flex flex-wrap gap-1.5 my-2">
                    {[0.5, 1, 2, 3, 5].map((h) => (
                      <button key={h} type="button" onClick={() => handleAddSessionHours(h)} className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-indigo-500/30 border border-white/10 text-xs font-semibold text-gray-200">+{h} год</button>
                    ))}
                  </div>
                  <input type="number" step="0.1" min="0" value={playtimeInput} onChange={(e) => setPlaytimeInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <textarea rows="2" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder={t('modal_notes_ph')} className="w-full bg-black/50 border border-white/10 rounded-2xl p-3 text-sm text-white" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setSelectedGame(null)} className="px-4 py-2 rounded-xl text-xs text-gray-400">{t('modal_cancel')}</button>
                  <button type="submit" disabled={isSavingDetails} className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white">{t('modal_save')}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEAM МОДАЛКА */}
      <AnimatePresence>
        {isSteamModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSteamModalOpen(false)} className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0e0e13] border border-white/15 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-white">Синхронізація зі Steam</h3><button onClick={() => setIsSteamModalOpen(false)} className="text-gray-400"><X className="w-5 h-5" /></button></div>
              {profile.steamSynced && (
                <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">🟢 Steam підключено</span>
                  <button type="button" onClick={handleSteamUnlink} className="bg-red-500/20 text-red-300 px-3 py-1.5 rounded-xl text-xs font-bold">Від'єднати</button>
                </div>
              )}
              <form onSubmit={handleSteamSync} className="space-y-4">
                <input type="text" required value={steamInput} onChange={(e) => setSteamInput(e.target.value)} placeholder="https://steamcommunity.com/id/твій_нік" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                <button type="submit" disabled={isSyncingSteam} className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm">{isSyncingSteam ? 'Синхронізуємо...' : 'Оновити та синхронізувати'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* РУЛЕТКА */}
      <AnimatePresence>
        {isRouletteOpen && rouletteGame && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSpinning && setIsRouletteOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0e0e13] border border-white/15 rounded-3xl p-6 text-center shadow-2xl">
              <div className="relative w-44 aspect-[3/4] mx-auto rounded-2xl overflow-hidden mb-4 bg-black"><img src={rouletteGame.imageUrl} alt={rouletteGame.title} className="w-full h-full object-cover" /></div>
              <h3 className="text-xl font-extrabold text-white mb-4">{rouletteGame.title}</h3>
              {!isSpinning && (
                <div className="flex gap-3">
                  <button onClick={startRoulette} className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm text-gray-300">Ще раз</button>
                  <button onClick={() => { handleUpdateStatus(null, rouletteGame._id, 'playing', rouletteGame.title); setIsRouletteOpen(false); }} className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-sm font-semibold text-white">Почати</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}