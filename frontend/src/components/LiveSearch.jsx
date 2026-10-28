import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Plus, Heart, Loader2, Film, Gamepad2, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from '../i18n';

const GAME_GENRES = [
  { id: '', label: 'Усі жанри' },
  { id: 'tag:horror', label: '👻 Хоррор / Жахи' },
  { id: 'shooter', label: '🔫 Шутери' },
  { id: 'action', label: '⚔️ Екшн' },
  { id: 'role-playing-games-rpg', label: '🧙‍♂️ RPG (Рольові)' },
  { id: 'adventure', label: '🗺️ Пригоди' },
  { id: 'strategy', label: '♟️ Стратегії' },
  { id: 'tag:survival', label: '🏕️ Виживання (Survival)' },
  { id: 'puzzle', label: '🧩 Головоломки' },
  { id: 'racing', label: '🏎️ Гонки' },
  { id: 'fighting', label: '🥊 Файтинги' },
  { id: 'simulation', label: '🚜 Симулятори' },
  { id: 'indie', label: '💎 Інді-ігри' },
  { id: 'sports', label: '⚽ Спорт' },
];

const GAME_CATEGORIES = [
  { id: '', label: 'Усі категорії та сеттинги' },
  { id: 'singleplayer', label: '👤 Одиночні (Сюжетні)' },
  { id: 'co-op', label: '🤝 Кооператив (Co-op)' },
  { id: 'multiplayer', label: '🌐 Мультиплеєр' },
  { id: 'open-world', label: '🌍 Відкритий світ' },
  { id: 'zombies', label: '🧟 Зомбі та монстри' },
  { id: 'cyberpunk', label: '🤖 Кіберпанк' },
  { id: 'post-apocalyptic', label: '☢️ Постапокаліпсис' },
  { id: 'dark-fantasy', label: '🐉 Темне фентезі / Souls-like' },
  { id: 'sci-fi', label: '🚀 Космос та Sci-Fi' },
  { id: 'stealth', label: '🥷 Стелс' },
];

const MOVIE_GENRES = [
  { id: '', label: 'Усі жанри' },
  { id: '27', label: '👻 Хоррор / Жахи' },
  { id: '53', label: '🔪 Трилер' },
  { id: '878', label: '🚀 Фантастика (Sci-Fi)' },
  { id: '28', label: '💥 Екшн / Бойовик' },
  { id: '18', label: '🎭 Драма' },
  { id: '35', label: '😂 Комедія' },
  { id: '9648', label: '🕵️‍♂️ Детектив' },
  { id: '80', label: '🔫 Кримінал' },
  { id: '12', label: '🗺️ Пригоди' },
  { id: '14', label: '🐉 Фентезі' },
  { id: '36', label: '📜 Історичний' },
  { id: '10752', label: '🪖 Військовий' },
];

const MOVIE_CATEGORIES = [
  { id: 'all', label: 'Усі формати (Кіно + Серіали + Аніме)' },
  { id: 'movie', label: '🎬 Тільки Фільми' },
  { id: 'series', label: '📺 Тільки Серіали' },
  { id: 'anime', label: '⛩️ Тільки Аніме' },
];

const YEAR_OPTIONS = [
  { id: '', label: 'Усі роки' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
  { id: '2022', label: '2022' },
  { id: '2021', label: '2021' },
  { id: '2020', label: '2020' },
  { id: '2015-2019', label: '2015 – 2019' },
  { id: '2010-2014', label: '2010 – 2014' },
  { id: '2000s', label: '2000 – 2009' },
  { id: 'classic', label: 'До 2000 року' },
];

const SORT_OPTIONS = [
  { id: 'popular', label: '🔥 За популярністю' },
  { id: 'rating', label: '⭐ За найвищим рейтингом' },
  { id: 'newest', label: '🆕 Спочатку новіші' },
];

// Словник для автоматичного перекладу українських жанрових запитів у пошуковому рядку
const UA_SEARCH_MAP = {
  'хоррор': { genre: 'tag:horror', movieGenre: '27' },
  'хорор': { genre: 'tag:horror', movieGenre: '27' },
  'жахи': { genre: 'tag:horror', movieGenre: '27' },
  'шутер': { genre: 'shooter', movieGenre: '28' },
  'шутери': { genre: 'shooter', movieGenre: '28' },
  'стрілялки': { genre: 'shooter', movieGenre: '28' },
  'стратегії': { genre: 'strategy', movieGenre: '36' },
  'стратегія': { genre: 'strategy', movieGenre: '36' },
  'гонки': { genre: 'racing', movieGenre: '28' },
  'рпг': { genre: 'role-playing-games-rpg', movieGenre: '14' },
  'виживання': { genre: 'tag:survival', movieGenre: '53' },
  'зомбі': { category: 'zombies', movieGenre: '27' },
  'кіберпанк': { category: 'cyberpunk', movieGenre: '878' },
  'кооп': { category: 'co-op', movieGenre: '' },
  'кооператив': { category: 'co-op', movieGenre: '' },
  'трилер': { genre: 'tag:horror', movieGenre: '53' },
  'фантастика': { category: 'sci-fi', movieGenre: '878' },
  'комедія': { genre: 'indie', movieGenre: '35' },
};

export default function LiveSearch({ onAddGame, mode = 'games' }) {
  const { t } = useTranslation();
  const isMovies = mode === 'movies';

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(isMovies ? 'all' : '');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef(null);
  const requestIdRef = useRef(0); // щоб стара відповідь не перезаписала нову

  const genreList = isMovies ? MOVIE_GENRES : GAME_GENRES;
  const categoryList = isMovies ? MOVIE_CATEGORIES : GAME_CATEGORIES;

  const activeFiltersCount =
    (selectedGenre ? 1 : 0) +
    (selectedCategory && selectedCategory !== 'all' ? 1 : 0) +
    (selectedYear ? 1 : 0) +
    (selectedSort !== 'popular' ? 1 : 0);

  const accentText = isMovies ? 'text-rose-400' : 'text-indigo-400';

  // Закриття списків при кліку поза компонентом
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Скидання стану при перемиканні ігри <-> кіно
  useEffect(() => {
    setQuery('');
    setSelectedGenre('');
    setSelectedCategory(mode === 'movies' ? 'all' : '');
    setSelectedYear('');
    setSelectedSort('popular');
    setResults([]);
    setIsOpen(false);
    setIsFilterOpen(false);
  }, [mode]);

  const executeSearch = async (overrideParams = {}) => {
    const qVal = (overrideParams.query !== undefined ? overrideParams.query : query).trim();
    const gVal = overrideParams.genre !== undefined ? overrideParams.genre : selectedGenre;
    const cVal = overrideParams.category !== undefined ? overrideParams.category : selectedCategory;
    const yVal = overrideParams.year !== undefined ? overrideParams.year : selectedYear;
    const sVal = overrideParams.sort !== undefined ? overrideParams.sort : selectedSort;

    const hasFilters = Boolean(gVal || (cVal && cVal !== 'all') || yVal);
    if (qVal.length < 2 && !hasFilters) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsSearching(true);

    try {
      const endpoint = isMovies ? '/api/items/search-media' : '/api/items/search';
      const params = new URLSearchParams();

      const mappedKeyword = UA_SEARCH_MAP[qVal.toLowerCase()];
      let usedMapping = false;

      if (mappedKeyword) {
        if (isMovies) {
          if (mappedKeyword.movieGenre && !gVal) {
            params.set('genre', mappedKeyword.movieGenre);
            usedMapping = true;
          }
        } else {
          if (mappedKeyword.genre && !gVal) {
            params.set('genre', mappedKeyword.genre);
            usedMapping = true;
          }
          if (mappedKeyword.category && !cVal) {
            params.set('category', mappedKeyword.category);
            usedMapping = true;
          }
        }
      }

      // Якщо слово не вдалося перетворити на жанр — шукаємо як звичайний текст
      if (!usedMapping && qVal.length >= 2) {
        params.set('q', qVal);
      }

      if (gVal) params.set('genre', gVal);
      if (cVal && cVal !== 'all') params.set('category', cVal);
      if (yVal) params.set('year', yVal);
      if (sVal) params.set('sort', sVal);

      const res = await axios.get(`${endpoint}?${params.toString()}`);

      // Ігноруємо застарілу відповідь, якщо вже пішов новіший запит
      if (currentRequestId !== requestIdRef.current) return;

      setResults(Array.isArray(res.data) ? res.data : []);
      setIsOpen(true);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      setResults([]);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  // Живий пошук під час введення тексту (коли вікно фільтра закрите)
  useEffect(() => {
    if (isFilterOpen) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      if (!selectedGenre && (!selectedCategory || selectedCategory === 'all') && !selectedYear) {
        setResults([]);
      }
      return;
    }

    const timer = setTimeout(() => {
      executeSearch();
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleApplyFilterButton = () => {
    setIsFilterOpen(false);
    executeSearch();
  };

  const resetSearchFilters = () => {
    setSelectedGenre('');
    setSelectedCategory(isMovies ? 'all' : '');
    setSelectedYear('');
    setSelectedSort('popular');
  };

  const handleSelect = (item, targetStatus) => {
    onAddGame(item, targetStatus);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const selectClass =
    'w-full bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500';

  return (
    <div ref={wrapperRef} className="relative z-50 w-full">
      {/* Рядок пошуку */}
      <div className="relative flex items-center">
        <Search className={`w-5 h-5 absolute left-4 pointer-events-none ${accentText}`} />

        <input
          type="text"
          value={query}
          onFocus={() => {
            if (results.length > 0 && !isFilterOpen) setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (isFilterOpen) setIsFilterOpen(false);
          }}
          placeholder={isMovies ? t('search_movies_placeholder') : t('search_placeholder')}
          className={`w-full bg-[#0b0b10]/95 backdrop-blur-md border rounded-2xl pl-12 pr-36 py-3.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all shadow-xl ${
            isMovies
              ? 'border-rose-500/25 focus:border-rose-400/60'
              : 'border-white/10 focus:border-indigo-400/60'
          }`}
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {isSearching && <Loader2 className={`w-4 h-4 animate-spin ${accentText}`} />}

          {(query || activeFiltersCount > 0 || results.length > 0) && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                resetSearchFilters();
                setResults([]);
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg"
              title="Очистити все"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsFilterOpen((prev) => {
                const next = !prev;
                if (next) setIsOpen(false);
                return next;
              });
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              activeFiltersCount > 0 || isFilterOpen
                ? isMovies
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white border-white/10'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Фільтр</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] font-extrabold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Панель вибору жанру, категорії, року та кнопка "Знайти" */}
      {isFilterOpen && (
        <div className="absolute right-0 mt-2 w-full sm:w-96 bg-[#111118] border border-white/15 rounded-2xl p-4 shadow-2xl z-50 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-xs sm:text-sm font-extrabold text-white">
              {isMovies ? '🎬 Підбір кіно за параметрами' : '🎮 Підбір ігор за параметрами'}
            </span>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetSearchFilters}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold"
              >
                Скинути все
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Жанр</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={selectClass}
              >
                {genreList.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                {isMovies ? 'Формат кіно' : 'Категорія / Сеттинг'}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={selectClass}
              >
                {categoryList.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Рік випуску</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={selectClass}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y.id} value={y.id}>{y.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Сортування</label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className={selectClass}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyFilterButton}
            className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-colors ${
              isMovies ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{isMovies ? 'Знайти фільми та серіали' : 'Знайти ігри'}</span>
          </button>
        </div>
      )}

      {/* Випадаючий список знайдених результатів */}
      {isOpen && !isFilterOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-[#0e0e14] border border-white/15 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/[0.06] max-h-96 overflow-y-auto z-50">
          {results.length > 0 ? (
            results.map((item, index) => (
              <div
                key={item.rawgId || item.tmdbId || `${item.title}-${index}`}
                className="p-3 hover:bg-white/[0.04] flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-lg bg-black shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {isMovies ? (
                        <Film className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Gamepad2 className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {item.releaseYear || '—'}
                      {item.genres?.length > 0 ? ` • ${item.genres.slice(0, 2).join(', ')}` : ''}
                      {item.metacritic ? ` • ★ ${item.metacritic}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelect(item, 'wishlist')}
                    className="p-2 rounded-xl bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-400/30 transition-colors"
                    title={t('to_wishlist')}
                  >
                    <Heart className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelect(item, 'backlog')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors ${
                      isMovies
                        ? 'bg-rose-600/25 hover:bg-rose-600 text-rose-200 hover:text-white border-rose-500/40 hover:border-rose-400'
                        : 'bg-indigo-500/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border-indigo-400/35 hover:border-indigo-400'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isMovies ? t('st_m_backlog') : t('tab_backlog')}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-gray-400">
              За цими параметрами нічого не знайдено. Спробуй змінити рік або жанр!
            </div>
          )}
        </div>
      )}
    </div>
  );
}