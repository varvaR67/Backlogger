import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Gamepad2, ArrowRight, Loader2, Eye, EyeOff, X } from 'lucide-react';

export default function Auth({ setAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Стан для швидкого вікна входу через Google
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, { username, password });
      
      const { token, username: user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('username', user);

      toast.dismiss();
      toast.success(isLogin ? 'З поверненням!' : 'Акаунт створено!', { icon: '👋' });
      
      setAuth(token, user);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Помилка авторизації');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/google', {
        email: googleEmail.trim(),
        name: googleName.trim() || googleEmail.split('@')[0]
      });

      const { token, username: user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);

      toast.dismiss();
      toast.success(`Увійшли через Google як ${user}!`, { icon: '🚀' });
      setIsGoogleModalOpen(false);
      setAuth(token, user);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Помилка входу через Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex bg-indigo-500/10 p-3 rounded-2xl mb-4 border border-indigo-500/20">
            <Gamepad2 className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Backlogger</h2>
          <p className="text-gray-400">Твій приватний ігровий простір</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Нікнейм"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all"
            />
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors outline-none"
              tabIndex="-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Увійти' : 'Створити акаунт'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Розділювач */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">або</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Кнопка входу через Google */}
        <button
          type="button"
          onClick={() => setIsGoogleModalOpen(true)}
          className="w-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
            <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z" />
          </svg>
          <span>Продовжити з Google</span>
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setUsername('');
              setPassword('');
            }}
            type="button"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? 'Ще немає акаунта? Створити' : 'Вже є акаунт? Увійти'}
          </button>
        </div>
      </div>

      {/* Вікно швидкої авторизації Google */}
      {isGoogleModalOpen && (
        <div 
          onClick={() => setIsGoogleModalOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#14141a] border border-white/15 rounded-3xl p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setIsGoogleModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                  <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Вхід з Google</h3>
                <p className="text-xs text-gray-400">Швидка авторизація у Backlogger</p>
              </div>
            </div>

            <form onSubmit={handleGoogleLogin} className="space-y-3">
              <input
                type="email"
                required
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="Твій Gmail (напр. alex@gmail.com)"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/60"
              />
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="Ім'я профілю (необов'язково)"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/60"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25"
              >
                {isLoading ? 'Входимо...' : 'Продовжити'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}