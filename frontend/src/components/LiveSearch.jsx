// frontend/src/components/LiveSearch.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Search, Plus, Heart, Loader2, Film, Gamepad2, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from '../i18n';

const UK_GAME_QUERY_MAP = {
  'хоррор': 'horror',
  'хорор': 'horror',
  'жахи': 'horror',
  'відьмак': 'the witcher',
  'сталкер': 's.t.a.l.k.e.r.',
  'кіберпанк': 'cyberpunk',
  'фар край': 'far cry',
  'метро': 'metro',
  'гта': 'grand theft auto',
  'скайрім': 'skyrim',
  'дум': 'doom',
  'дарк соулс': 'dark souls',
  'елден рінг': 'elden ring',
  'гонки': 'racing',
  'виживання': 'survival',
  'зомбі': 'zombies',
  'стратегії': 'strategy',
  'шутер': 'shooter'
};

function translateGameQueryIfNeeded(rawQuery) {
  const lower = rawQuery.toLowerCase().trim();
  if (!lower) return '';
  for (const [ukWord, enWord] of Object.entries(UK_GAME_QUERY_MAP)) {
    if (lower === ukWord || lower.startsWith(`${ukWord} `)) {
      return lower.replace(ukWord, enWord);
    }
  }
  return rawQuery;
}

export default function LiveSearch({ onAddGame, mode = 'games' }) {
  const { t } = useTranslation();
  const isMovies = mode === 'movies';

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearchedWithFilter, setHasSearchedWithFilter] = useState(false);
  const wrapperRef = useRef(null);

  const gameGenres = useMemo(() => [
    { id: '', label: t('genre_all') },
    { id: 'action', label: t('genre_action') },
    { id: 'role-playing-games-rpg', label: t('genre_rpg') },
    { id: 'shooter', label: t('genre_shooter') },
    { id: 'adventure', label: t('genre_adventure') },
    { id: 'tag:horror', label: t('genre_horror') },
    { id: 'strategy', label: t('genre_strategy') },
    { id: 'indie', label: t('genre_indie') },
    { id: 'puzzle', label: t('genre_puzzle') },
    { id: 'racing', label: t('genre_racing') },
    { id: 'sports', label: t('genre_sports') },
    { id: 'simulation', label: t('genre_sim') },
    { id: 'fighting', label: t('genre_fighting') }
  ], [t]);

  const movieGenres = useMemo(() => [
    { id: '', label: t('genre_all') },
    { id: '28', label: t('genre_action') },
    { id: '18', label: t('genre_drama') },
    { id: '878', label: t('genre_scifi') },
    { id: '53', label: t('genre_thriller') },
    { id: '27', label: t('genre_horror') },
    { id: '35', label: t('genre_comedy') },
    { id: '12', label: t('genre_adventure') },
    { id: '80', label: t('genre_crime') },
    { id: '9648', label: t('genre_mystery') },
    { id: '16', label: t('genre_animation') },
    { id: '14', label: t('genre_fantasy') }
  ], [t]);

  const gameCategories = useMemo(() => [
    { id: '', label: t('cat_all') },
    { id: 'survival', label: t('cat_survival') },
    { id: 'open-world', label: t('cat_open_world') },
    { id: 'co-op', label: t('cat_coop') },
    { id: 'story-rich', label: t('cat_story') },
    { id: 'cyberpunk', label: t('cat_cyberpunk') },
    { id: 'dark-fantasy', label: t('cat_dark_fantasy') },
    { id: 'post-apocalyptic', label: t('cat_post_apoc') },
    { id: 'zombies', label: t('cat_zombies') }
  ], [t]);

  const movieCategories = useMemo(() => [
    { id: '', label: t('cat_all') },
    { id: 'movie', label: t('cat_movies_only') },
    { id: 'series', label: t('cat_series_only') },
    { id: 'anime', label: t('cat_anime_only') }
  ], [t]);

  const yearOptions = useMemo(() => [
    { id: '', label: t('year_all') },
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
    { id: 'classic', label: t('year_classic') }
  ], [t]);

  const sortOptions = useMemo(() => [
    { id: 'popular', label: t('sort_popular') },
    { id: 'rating', label: t('sort_rating') },
    { id: 'newest', label: t('sort_newest') }
  ], [t]);

  const genreList = isMovies ? movieGenres : gameGenres;
  const categoryList = isMovies ? movieCategories : gameCategories;
  const activeFiltersCount =
    (selectedGenre ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedYear ? 1 : 0) +
    (selectedSort !== 'popular' ? 1 : 0);

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

  useEffect(() => {
    setQuery('');
    setSelectedGenre('');
    setSelectedCategory('');
    setSelectedYear('');
    setSelectedSort('popular');
    setResults([]);
    setIsOpen(false);
    setIsFilterOpen(false);
    setHasSearchedWithFilter(false);
  }, [mode]);

  const executeSearch = async (overrideOpenResults = false) => {
    const trimmed = query.trim();
    const hasFilters = Boolean(selectedGenre || selectedCategory || selectedYear);

    if (trimmed.length < 2 && !hasFilters) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const endpoint = isMovies ? '/api/items/search-media' : '/api/items/search';
      const params = new URLSearchParams();
      if (trimmed.length >= 2) {
        const finalQuery = isMovies ? trimmed : translateGameQueryIfNeeded(trimmed);
        params.set('q', finalQuery);
      }
      if (selectedGenre) params.set('genre', selectedGenre);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedYear) params.set('year', selectedYear);
      if (selectedSort) params.set('sort', selectedSort);

      const res = await axios.get(`${endpoint}?${params.toString()}`);
      setResults(Array.isArray(res.data) ? res.data : []);
      setHasSearchedWithFilter(true);
      if (overrideOpenResults || !isFilterOpen) {
        setIsOpen(true);
      }
    } catch (err) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      if (!selectedGenre && !selectedCategory && !selectedYear) {
        setResults([]);
        setIsOpen(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleApplyFilterButton = () => {
    setIsFilterOpen(false);
    executeSearch(true);
  };

  const handleSelect = (item, targetStatus) => {
    onAddGame(item, targetStatus);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const resetSearchFilters = () => {
    setSelectedGenre('');
    setSelectedCategory('');
    setSelectedYear('');
    setSelectedSort('popular');
    setHasSearchedWithFilter(false);
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative max-w-2xl mx-auto mb-8 z-30">
      <div className="relative flex items-center">
        <Search className={`w-5 h-5 absolute left-4 pointer-events-none ${isMovies ? 'text-rose-400' : 'text-indigo-400'}`} />
        <input
          type="text"
          value={query}
          onFocus={() => {
            if (results.length > 0 && !isFilterOpen) setIsOpen(true);
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isMovies ? t('search_movies_placeholder') : t('search_placeholder')}
          className={`w-full bg-[#0b0b10]/95 backdrop-blur-md border rounded-2xl pl-12 pr-36 py-3.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all shadow-xl ${
            isMovies
              ? 'border-rose-500/25 focus:border-rose-400/60'
              : 'border-white/10 focus:border-indigo-400/60'
          }`}
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {isSearching && (
            <Loader2 className={`w-4 h-4 animate-spin ${isMovies ? 'text-rose-400' : 'text-indigo-400'}`} />
          )}

          {(query || activeFiltersCount > 0) && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                resetSearchFilters();
                setResults([]);
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg"
              title={t('filter_reset')}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const nextState = !isFilterOpen;
              setIsFilterOpen(nextState);
              if (nextState) setIsOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              activeFiltersCount > 0 || isFilterOpen
                ? isMovies
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white border-white/10'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('filter_btn')}</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] font-extrabold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="absolute right-0 mt-2 w-full sm:w-80 bg-[#111118]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl z-40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              {isMovies ? t('filter_search_title_movies') : t('filter_search_title_games')}
            </span>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetSearchFilters}
                className="text-[11px] text-gray-400 hover:text-white font-semibold"
              >
                {t('filter_reset')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t('filter_genre')}</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-black/70 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {genreList.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t('filter_category')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-black/70 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {categoryList.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t('filter_year')}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-black/70 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {yearOptions.map(y => (
                  <option key={y.id} value={y.id}>{y.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t('filter_sort')}</label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full bg-black/70 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {sortOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyFilterButton}
            className={`w-full py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition-colors flex items-center justify-center gap-2 ${
              isMovies ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isMovies ? t('filter_find_movies') : t('filter_find_games')}</span>
          </button>
        </div>
      )}

      {isOpen && !isFilterOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-[#0e0e14]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/[0.06] max-h-96 overflow-y-auto z-30">
          {results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.rawgId || item.title}
                className="p-3 hover:bg-white/[0.04] flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-10 h-14 object-cover rounded-lg bg-black shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-10 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {isMovies ? <Film className="w-4 h-4 text-rose-400" /> : <Gamepad2 className="w-4 h-4 text-indigo-400" />}
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
          ) : hasSearchedWithFilter && !isSearching ? (
            <div className="p-5 text-center text-xs text-gray-400">
              {t('filter_empty_results')}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}