import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Plus, Loader2, Heart, Film, Tv, Sparkles, Clock } from 'lucide-react';

export default function LiveSearch({ onAddGame, t, mode = 'games' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);
  const isMoviesMode = mode === 'movies';

  useEffect(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, [mode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const endpoint = isMoviesMode
          ? `http://localhost:5000/api/items/search-media?q=${encodeURIComponent(query)}`
          : `http://localhost:5000/api/items/search?q=${encodeURIComponent(query)}`;
        const res = await axios.get(endpoint);
        setResults(res.data || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Помилка пошуку:", error);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, isMoviesMode]);

  const handleSelect = (itemData, targetStatus) => {
    onAddGame(itemData, targetStatus);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const getMediaBadge = (mediaType) => {
    if (mediaType === 'movie') {
      return { label: t ? t('type_movie') : 'ФІЛЬМ', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/35', icon: Film };
    }
    if (mediaType === 'anime') {
      return { label: t ? t('type_anime') : 'АНІМЕ', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/35', icon: Sparkles };
    }
    return { label: t ? t('type_series') : 'СЕРІАЛ', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/35', icon: Tv };
  };

  return (
    <div ref={searchRef} className="relative max-w-2xl mx-auto mb-10 z-30">
      <div className="relative flex items-center group">
        <Search className={`w-5 h-5 text-gray-400 transition-colors absolute left-4 pointer-events-none ${isMoviesMode ? 'group-focus-within:text-rose-400' : 'group-focus-within:text-indigo-400'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={isMoviesMode ? (t ? t('search_movies_placeholder') : 'Знайти фільм, серіал або аніме...') : (t ? t('search_placeholder') : 'Знайти гру...')}
          className={`w-full bg-[#0b0b10]/90 border border-white/[0.08] hover:border-white/15 rounded-2xl pl-12 pr-12 py-3.5 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none transition-all shadow-lg ${
            isMoviesMode ? 'focus:border-rose-500/60' : 'focus:border-indigo-500/60'
          }`}
        />
        {isLoading && (
          <Loader2 className={`w-5 h-5 animate-spin absolute right-4 ${isMoviesMode ? 'text-rose-400' : 'text-indigo-400'}`} />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-[#111116] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/[0.06] max-h-[420px] overflow-y-auto">
          {results.map((item) => {
            const badge = isMoviesMode ? getMediaBadge(item.mediaType) : null;
            return (
              <div
                key={item.rawgId}
                className="flex items-center justify-between gap-3 p-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/60x80/1a1a1a/ffffff?text=Poster'}
                    alt={item.title}
                    className="w-11 h-16 object-cover rounded-xl border border-white/10 shrink-0 bg-black"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {badge && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                      {item.releaseYear && <span>{item.releaseYear}</span>}
                      {item.metacritic && (
                        <span className="text-emerald-400 font-semibold border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 rounded text-[10px]">
                          ★ {item.metacritic}
                        </span>
                      )}
                      {isMoviesMode && item.mediaType === 'movie' && item.runtimeMinutes && (
                        <span className="flex items-center gap-1 text-gray-300">
                          <Clock className="w-3 h-3 text-rose-400" />
                          {item.runtimeMinutes} {t ? t('min_short') : 'хв'}
                        </span>
                      )}
                      {isMoviesMode && item.mediaType !== 'movie' && item.totalEpisodes && (
                        <span className="text-amber-300/90 font-medium">
                          • {item.totalEpisodes} серій
                        </span>
                      )}
                      {item.genres?.length > 0 && (
                        <span className="truncate hidden sm:inline">• {item.genres.slice(0, 2).join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelect(item, 'wishlist')}
                    className="px-3 py-2 rounded-full bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    title="Додати у Вішліст"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">{t ? t('to_wishlist') : 'У вішліст'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelect(item, 'backlog')}
                    className={`p-2 rounded-xl border transition-all active:scale-95 ${
                      isMoviesMode
                        ? 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border-rose-500/30'
                        : 'bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border-indigo-500/30'
                    }`}
                    title={isMoviesMode ? "Додати у Заплановане" : "Додати у Беклог"}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}