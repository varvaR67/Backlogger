import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [message, setMessage] = useState('Завантаження...');

  useEffect(() => {
    axios.get('/api')
      .then(response => setMessage(response.data.message))
      .catch(error => setMessage('Помилка з\'єднання з сервером'));
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold text-blue-400">{message}</h1>
    </div>
  );
}