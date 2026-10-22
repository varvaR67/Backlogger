import { useState, useEffect } from 'react';
import axios from 'axios';
import Home from './pages/Home';
import Auth from './pages/Auth';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    // 🚀 ПРОФЕСІЙНА ФІЧА: Глобальний перехоплювач помилок
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Якщо сервер каже, що токен прострочений, недійсний або його немає (Помилка 401)
        if (error.response?.status === 401) {
          handleLogout(); // Миттєво розлогінюємо юзера і викидаємо на екран авторизації
        }
        return Promise.reject(error);
      }
    );

    // Прибираємо перехоплювача, якщо компонент демонтується (правило хорошого коду)
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const handleSetAuth = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
  };

  return (
    <>
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
      
      {token ? (
        <Home username={username} onLogout={handleLogout} />
      ) : (
        <Auth setAuth={handleSetAuth} />
      )}
    </>
  );
}