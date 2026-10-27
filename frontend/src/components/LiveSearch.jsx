import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Plus, Heart, Loader2, Film, Gamepad2, X } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function LiveSearch({ onAddGame, mode = 'games' }) {
  const { t } = useTranslation();
  const isMovies = mode === 'movies';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, [mode]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const endpoint = isMovies ? '/api/items/search-media' : '/api/items/search';
        const res = await axios.get(`${endpoint}?q=${encodeURIComponent(trimmed)}`);
        setResults(Array.isArray(res.data) ? res.data : []);
        setIsOpen(true);
      } catch (err) {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, isMovies]);

  const handleSelect = (item, targetStatus) => {
    onAddGame(item, targetStatus);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative max-w-2xl mx-auto mb-8 z-30">
      <div className="relative flex items-center">
        <Search className={`w-5 h-5 absolute left-4 pointer-events-none ${isMovies ? 'text-rose-400' : 'text-indigo-400'}`} />
        <input
          type="text"
          value={query}
          onfocus={() => results.length > 0 && setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isMovies ? t('search_movies_placeholder') : t('search_placeholder')}
          className={`w-full bg-[#0b0b10]/95 backdrop-blur-md border rounded-2xl pl-12 pr-10 py-3.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all shadow-xl ${
            isMovies
              ? 'border-rose-500/25 focus:border-rose-400/60'
              : 'border-white/10 focus:border-indigo-400/60'
          }`}
        />
        {isSearching ? (
          <Loader2 className={`w-4 h-4 absolute right-4 animate-spin ${isMovies ? 'text-rose-400' : 'text-indigo-400'}`} />
        ) : query ? (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
            className="absolute right-3.5 text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-[#0e0e14]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/[0.06] max-h-96 overflow-y-auto">
          {results.map((item) => (
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
                  className="p-2 rounded-xl bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-400/30 transition-all"
                  title={t('to_wishlist')}
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(item, 'backlog')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    isMovies
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isMovies ? t('st_m_backlog') : t('tab_backlog')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}