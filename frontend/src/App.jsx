import { useState, useEffect } from 'react';
import axios from 'axios';
import Home from './pages/Home';
import Auth from './pages/Auth';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { X } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUsername(null);
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleSetAuth = (newToken, newUsername) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUsername(newUsername);
  };

  return (
    <>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          duration: 5000,
          style: {
            background: 'rgba(22, 22, 26, 0.85)',
            color: '#fff',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            padding: '12px 16px',
          },
        }} 
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="group flex items-center gap-2 pr-1">
                {icon}
                <div className="text-sm font-medium">{message}</div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-2 p-1 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-all"
                  title="Закрити"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
      
      {token ? (
        <Home username={username} onLogout={handleLogout} />
      ) : (
        <Auth setAuth={handleSetAuth} />
      )}
    </>
  );
}