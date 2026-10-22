import { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function LiveSearch({ onAddGame }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/items/search?q=${query}`);
        setResults(res.data);
        setIsOpen(true);
      } catch (error) {
        console.error('Помилка пошуку:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400); 

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (game) => {
    onAddGame(game);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50 mb-12">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" />
          )}
        </div>
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all backdrop-blur-md shadow-lg text-lg"
          placeholder="Знайти гру (наприклад, Cyberpunk 2077)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute w-full mt-3 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {results.map((game) => (
              <div
                key={game.rawgId}
                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <img
                  src={game.imageUrl || 'https://via.placeholder.com/80x100?text=Немає+фото'}
                  alt={game.title}
                  className="w-12 h-16 object-cover rounded-md shadow-sm bg-black"
                />
                <div className="flex-1">
                  <h4 className="text-white font-medium text-lg">{game.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                    {game.releaseYear && <span>{game.releaseYear}</span>}
                    {game.metacritic && (
                      <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md">
                        <Star className="w-3 h-3 fill-current" />
                        {game.metacritic}
                      </span>
                    )}
                    <span className="truncate max-w-[200px]">{game.genres.join(', ')}</span>
                  </div>
                </div>
                {/* Кнопка додавання тепер має свій клік і анімацію */}
                <button 
                  onClick={() => handleSelect(game)}
                  className="text-indigo-400 hover:text-white hover:bg-indigo-500 p-2 rounded-full transition-all active:scale-90"
                  title="Додати до беклогу"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}