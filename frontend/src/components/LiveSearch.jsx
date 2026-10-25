import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Plus, Loader2, Heart } from 'lucide-react';

export default function LiveSearch({ onAddGame, t }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

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
        const res = await axios.get(`http://localhost:5000/api/items/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
        setIsOpen(true);
      } catch (error) {
        console.error("Помилка пошуку:", error);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (game, targetStatus) => {
    onAddGame(game, targetStatus);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative max-w-2xl mx-auto mb-10 z-30">
      <div className="relative flex items-center group">
        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={t ? t('search_placeholder') : 'Знайти гру...'}
          className="w-full bg-[#0b0b10]/90 border border-white/[0.08] hover:border-white/15 focus:border-indigo-500/60 rounded-2xl pl-12 pr-12 py-3.5 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none transition-all shadow-lg"
        />
        {isLoading && (
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin absolute right-4" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-[#111116] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/[0.06]">
          {results.map((game) => (
            <div
              key={game.rawgId}
              className="flex items-center justify-between gap-3 p-3 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={game.imageUrl || 'https://via.placeholder.com/60x80/1a1a1a/ffffff?text=Game'}
                  alt={game.title}
                  className="w-11 h-14 object-cover rounded-xl border border-white/10 shrink-0 bg-black"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{game.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    {game.releaseYear && <span>{game.releaseYear}</span>}
                    {game.metacritic && (
                      <span className="text-emerald-400 font-semibold border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 rounded text-[10px]">
                        {game.metacritic}
                      </span>
                    )}
                    {game.genres?.length > 0 && (
                      <span className="truncate hidden sm:inline">• {game.genres.slice(0, 2).join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelect(game, 'wishlist')}
                  className="px-3 py-2 rounded-full bg-pink-500/15 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  title="Додати у Вішліст"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>{t ? t('to_wishlist') : 'У вішліст'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect(game, 'backlog')}
                  className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all active:scale-95"
                  title="Додати у бібліотеку (Беклог)"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}