import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get('/api/items')
      .then(res => setItems(res.data))
      .catch(err => console.error("Помилка завантаження:", err));
  }, []);

  const addItem = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    axios.post('/api/items', { title, type: 'game', status: 'backlog' })
      .then(res => {
        setItems([res.data, ...items]);
        setTitle('');
      })
      .catch(err => console.error("Помилка збереження:", err));
  };

  const updateStatus = (id, newStatus) => {
    axios.put(`/api/items/${id}`, { status: newStatus })
      .then(res => {
        setItems(items.map(item => item._id === id ? res.data : item));
      })
      .catch(err => console.error("Помилка оновлення:", err));
  };

  const deleteItem = (id) => {
    axios.delete(`/api/items/${id}`)
      .then(() => {
        setItems(items.filter(item => item._id !== id));
      })
      .catch(err => console.error("Помилка видалення:", err));
  };

  const filteredItems = items.filter(item => filter === 'all' ? true : item.status === filter);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans pb-12">
      <header className="bg-[#1e293b] border-b border-slate-700/50 pt-8 pb-6 px-4 shadow-sm mb-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-indigo-500">❖</span> Backlogger
          </h1>
          
          <form onSubmit={addItem} className="flex w-full md:w-auto relative group">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Додати нову гру..." 
              className="w-full md:w-80 pl-5 pr-32 py-3 rounded-full bg-slate-800/50 border border-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-400 transition-all"
            />
            <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold transition-colors">
              Додати
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {['all', 'backlog', 'playing', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === f 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Всі ігри' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item._id} className="group relative bg-slate-800 rounded-2xl border border-slate-700/50 p-5 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between h-48">
              
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 pr-6">
                    {item.title}
                  </h3>
                  <button 
                    onClick={() => deleteItem(item._id)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Видалити"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Статус</span>
                  <div className="flex gap-2">
                    {['backlog', 'playing', 'completed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(item._id, s)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          item.status === s
                            ? (s === 'backlog' ? 'bg-slate-600 text-white' : s === 'playing' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50' : 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50')
                            : 'bg-slate-700/50 text-slate-500 hover:bg-slate-600 hover:text-slate-300'
                        }`}
                      >
                        {s === 'backlog' ? 'БЕКЛОГ' : s === 'playing' ? 'ГРАЮ' : 'ГОТОВО'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-white mb-2">Тут поки порожньо</h2>
            <p className="text-slate-400">Додай нові ігри або зміни фільтр.</p>
          </div>
        )}
      </main>
    </div>
  );
}