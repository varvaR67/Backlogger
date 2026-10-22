import { useState, useEffect } from 'react';
import axios from 'axios';
import LiveSearch from '../components/LiveSearch';
import { Trash2, LogOut, User } from 'lucide-react'; // Додали іконки для юзера та виходу
import toast, { Toaster } from 'react-hot-toast';

// Додали отримання username та onLogout з App.jsx
export default function Home({ username, onLogout }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items');
      setItems(res.data);
    } catch (error) {
      toast.error("Помилка завантаження ігор");
    }
  };

  const handleAddGame = async (gameData) => {
    const isDuplicate = items.some(item => item.title === gameData.title);
    if (isDuplicate) {
      toast.error(`"${gameData.title}" вже є у вашій бібліотеці!`, { icon: '⚠️' });
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
      toast.success(`"${gameData.title}" додано!`);
    } catch (error) {
      toast.error("Не вдалося додати гру");
    }
  };

  const handleUpdateStatus = async (id, newStatus, gameTitle) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/items/${id}`, { status: newStatus });
      setItems(items.map(item => item._id === id ? res.data : item));
      
      const statusNames = {
        'backlog': 'Беклог',
        'playing': 'Граю',
        'completed': 'Готово'
      };
      
      toast.success(`"${gameTitle}" переміщено в: ${statusNames[newStatus]}`, {
        icon: '🔄',
      });
    } catch (error) {
      toast.error("Помилка оновлення статусу");
    }
  };

  const handleDeleteGame = async (id, gameTitle) => {
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`);
      setItems(items.filter(item => item._id !== id));
      toast.success(`"${gameTitle}" видалено`, { icon: '🗑️' });
    } catch (error) {
      toast.error("Помилка видалення гри");
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-indigo-500/30 relative overflow-hidden">
      
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: 'rgba(28, 28, 30, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
        }} 
      />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Оновлена шапка з панеллю користувача */}
        <header className="mb-12 relative flex flex-col items-center">
          
          {/* Скляна панель користувача (верхній правий кут) */}
          <div className="absolute top-0 right-0 flex items-center gap-4 bg-white/5 p-1.5 pr-4 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500/20 p-1.5 rounded-full">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-gray-200">{username || 'Користувач'}</span>
            </div>
            
            <div className="w-px h-4 bg-white/10"></div>
            
            {/* Кнопка виходу */}
            <button
              onClick={onLogout}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
              title="Вийти з акаунта"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Вийти</span>
            </button>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-4 mt-12 md:mt-0">
            Backlogger
          </h1>
          <p className="text-gray-400 text-lg">Твоя персональна бібліотека ігор</p>
        </header>

        <LiveSearch onAddGame={handleAddGame} />

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10">
            {['all', 'backlog', 'playing', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filter === f 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'Всі ігри' : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map(item => (
            <div 
              key={item._id} 
              className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 backdrop-blur-md flex flex-col"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-black/50">
                <img 
                  src={item.imageUrl || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Немає+фото'} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {item.metacritic && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                    <span className="text-sm font-bold text-white">{item.metacritic}</span>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteGame(item._id, item.title)}
                  className="absolute top-3 left-3 bg-black/60 hover:bg-red-500/80 text-gray-300 hover:text-white backdrop-blur-md border border-white/10 p-1.5 rounded-lg shadow-lg transition-colors z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-lg text-white mb-1 line-clamp-1" title={item.title}>
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 mb-4 line-clamp-1">
                  {item.releaseYear ? `${item.releaseYear} • ` : ''} 
                  {item.genres?.length ? item.genres.join(', ') : 'Гра'}
                </p>
                
                <div className="mt-auto flex bg-black/40 rounded-lg p-1 border border-white/5">
                  {['backlog', 'playing', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(item._id, status, item.title)}
                      className={`flex-1 py-1.5 text-[11px] font-bold tracking-wider rounded-md transition-all ${
                        item.status === status 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {status === 'backlog' ? 'БЕКЛОГ' : status === 'playing' ? 'ГРАЮ' : 'ГОТОВО'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">У цій категорії поки пусто.</p>
          </div>
        )}
      </div>
    </div>
  );
}