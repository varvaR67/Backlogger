import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');

  // Завантажуємо список при відкритті сторінки
  useEffect(() => {
    axios.get('/api/items')
      .then(res => setItems(res.data))
      .catch(err => console.error("Помилка завантаження:", err));
  }, []);

  // Відправляємо нову гру на бекенд
  const addItem = (e) => {
    e.preventDefault(); // Зупиняємо перезавантаження сторінки
    if (!title.trim()) return;
    
    axios.post('/api/items', { title, type: 'game', status: 'backlog' })
      .then(res => {
        setItems([...items, res.data]); // Додаємо нову гру в список на екрані
        setTitle(''); // Очищаємо поле вводу
      })
      .catch(err => console.error("Помилка збереження:", err));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-green-400 mb-8 text-center">Мій Backlogger</h1>
        
        <form onSubmit={addItem} className="flex gap-4 mb-8">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назва гри (напр., God of War)" 
            className="flex-1 px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-green-400 text-white placeholder-gray-400"
          />
          <button type="submit" className="px-6 py-2 bg-green-500 hover:bg-green-600 text-gray-900 rounded font-bold transition">
            Додати
          </button>
        </form>

        <ul className="space-y-4">
          {items.map(item => (
            <li key={item._id} className="p-4 bg-gray-800 rounded flex justify-between items-center border border-gray-700 shadow-lg">
              <span className="text-xl font-medium">{item.title}</span>
              <span className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300 uppercase tracking-wider">
                {item.status}
              </span>
            </li>
          ))}
        </ul>
        
        {items.length === 0 && (
          <p className="text-center text-gray-500 mt-8">Твій беклог порожній. Додай першу гру!</p>
        )}
      </div>
    </div>
  );
}