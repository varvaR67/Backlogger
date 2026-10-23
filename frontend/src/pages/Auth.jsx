import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Gamepad2, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Auth({ setAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    </div>
  );
}