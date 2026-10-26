import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gamepad2, Film, Trophy, ArrowUp, RefreshCw, X, LogIn, UserPlus } from 'lucide-react';
import Home from './pages/Home';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const openAuth = (loginMode = false) => {
    setIsLogin(loginMode);
    setFormData({ username: '', password: '' });
    setShowAuthModal(true);
  };

  const switchAuthMode = (targetLoginMode) => {
    setIsLogin(targetLoginMode);
    setFormData({ username: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`http://localhost:5000${endpoint}`, formData);

      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username || formData.username);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUsername(res.data.username || formData.username);
        setToken(res.data.token);
        setFormData({ username: '', password: '' });
        setShowAuthModal(false);
        toast.success(`Вітаємо у всесвіті Backlogger, ${res.data.username || formData.username}!`, { icon: '🚀' });
      } else {
        // Після реєстрації очищаємо поля і переводимо на вікно входу
        setFormData({ username: '', password: '' });
        setIsLogin(true);
        toast.success('Акаунт зареєстровано! Тепер введи свій логін та пароль, щоб увійти.', { icon: '🎉' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка авторизації');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    delete axios.defaults.headers.common['Authorization'];
    setToken('');
    setUsername('');
    setFormData({ username: '', password: '' });
    setShowAuthModal(false);
  };

  if (token) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#121218', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <Home username={username} onLogout={handleLogout} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans relative overflow-x-hidden flex flex-col selection:bg-indigo-500/30">
      <Toaster position="top-right" toastOptions={{ style: { background: '#121218', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* Анімоване космічне сяйво */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[680px] h-[500px] rounded-full opacity-90" style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.28) 0%, rgba(79, 70, 229, 0.12) 45%, transparent 72%)', filter: 'blur(50px)' }} />
        <div className="absolute top-20 -right-24 w-[620px] h-[480px] rounded-full opacity-85" style={{ background: 'radial-gradient(circle, rgba(225, 29, 72, 0.20) 0%, rgba(16, 185, 129, 0.10) 45%, transparent 72%)', filter: 'blur(55px)' }} />
      </div>

      {/* Верхня шапка лендінгу: справа в кутку помітна кнопка "Увійти" */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">Backlogger</span>
        </div>

        <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-gray-300">
          <a href="#features" className="hover:text-white transition-colors">Можливості</a>
          <a href="#cinema" className="hover:text-white transition-colors">Кіновсесвіт</a>
          <a href="#community" className="hover:text-white transition-colors">Спільнота</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuth(true)}
            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold bg-[#12121c] hover:bg-indigo-500/25 text-white border-2 border-indigo-400/50 hover:border-indigo-400 shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <LogIn className="w-4 h-4 text-indigo-400" />
            <span>Увійти</span>
          </button>
        </div>
      </header>

      {/* Головний вступний екран — усі кнопки ведуть на Реєстрацію */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-12 pb-20 relative z-10 flex-1">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Універсальний трекер Ігор, Кіно, Серіалів та Аніме</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60 mb-4">
            BACKLOGGER
          </h1>
          <h2 className="text-xl sm:text-3xl font-bold text-indigo-200/90 mb-4">
            Твій персональний всесвіт розваг
          </h2>
          <p className="text-gray-400 text-sm sm:text-lg mb-8 leading-relaxed">
            Забудь про паперові списки та таблиці. Відстежуй кожну годину у відеоіграх зі Steam, веди облік переглянутих фільмів і серій, відкривай ачівки та ділися враженнями зі спільнотою
          </p>

          <div className="inline-grid grid-cols-3 gap-6 sm:gap-12 bg-[#111118]/90 backdrop-blur-md border border-white/10 rounded-3xl px-7 sm:px-12 py-5 mb-9 shadow-2xl">
            <div>
              <div className="text-[11px] text-gray-400 mb-1">Ігор в каталозі</div>
              <div className="text-xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-400" /> 500k+
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 mb-1">Фільмів та серіалів</div>
              <div className="text-xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                <Film className="w-5 h-5 text-rose-400" /> 850k+
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 mb-1">Топ-каталог кіно</div>
              <div className="text-xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Топ-100
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => openAuth(false)}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-indigo-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              <span>Спробувати зараз — Зареєструватися</span>
            </button>
          </div>
        </motion.div>

        <section id="features" className="space-y-16 pt-10 border-t border-white/[0.07]">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">Що таке Backlogger?</h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Backlogger — це єдина екосистема для геймерів та кіноманів. Ми об'єднали трекер відеоігор із живою синхронізацією Steam та повноцінний кінотрекер з базою TMDB, системою досягнень і активною спільнотою.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-gradient-to-br from-indigo-950/50 via-[#101018] to-[#0a0a0f] border border-indigo-500/25 rounded-3xl p-6 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Жива синхронізація Steam</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">● Online</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-400">Автоімпорт</div>
                  <div className="text-lg font-black text-white mt-0.5">Всі ігри за 3 сек</div>
                </div>
                <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-400">Оцінювання</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">Слайдер 1–10 ★</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-3">Збери свою колекцію ігор</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-5 leading-relaxed">
                Прив'яжи свій профіль Steam в один клік — і сайт автоматично перенесе всю твою бібліотеку та награні години. Фільтруй ігри за жанрами й роками, крути рулетку беклогу та відкривай ігрові ачівки.
              </p>
              <button onClick={() => openAuth(false)} className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold transition-all hover:scale-105">
                Спробувати зараз
              </button>
            </div>
          </div>

          <div id="cinema" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-3">Кіновсесвіт та Каталог Топ-100 фільмів</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-5 leading-relaxed">
                Не знаєш, з чого почати? Відкрий готовий плейлист «Топ-100 найпопулярніших фільмів світу» і додавай улюблене кіно в один клік. Години фільмів рахуються автоматично, для серіалів працює швидка кнопка «+1 серія», а за перегляди відкриваються ексклюзивні кіноачівки.
              </p>
              <button onClick={() => openAuth(false)} className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all hover:scale-105">
                Зареєструватися у Кіновсесвіті
              </button>
            </div>
            <div className="order-1 md:order-2 bg-gradient-to-br from-rose-950/50 via-[#140d10] to-[#0a0a0f] border border-rose-500/25 rounded-3xl p-6 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5"><Film className="w-4 h-4" /> Backlogger Cinema & TMDB</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">+1 серія</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-400">Готовий старт</div>
                  <div className="text-lg font-black text-rose-300 mt-0.5">Топ-100 Кіно</div>
                </div>
                <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-400">Нагороди</div>
                  <div className="text-lg font-black text-amber-300 mt-0.5">16 Кіноачівок</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="community" className="max-w-7xl w-full mx-auto px-4 sm:px-6 pb-10 relative z-10">
        <div className="bg-[#0e0e14] border border-white/10 rounded-3xl p-6 sm:p-10 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => openAuth(false)} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-extrabold shadow-lg transition-all hover:scale-105">
                Зареєструватися зараз
              </button>
            </div>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-2.5 rounded-full border border-indigo-400/40 text-indigo-300 hover:bg-indigo-500/20 transition-all">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
            <p>© {new Date().getFullYear()}, Backlogger, All rights reserved.</p>
            <p>
              На сайті Backlogger ви можете знайти величезний каталог відеоігор, фільмів, серіалів та аніме. Тайтли можна зібрати у власну колекцію пройдених, переглянутих або запланованих. Також можна фіксувати час проходження, поставити оцінку за допомогою живого слайдера, створювати власні плейлисти, тір-лісти та спілкуватися у спільнотах ігор і кіно!
            </p>
          </div>
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex gap-4 font-semibold text-indigo-300">
              <span>Угода користувача</span>
              <span>Політика конфіденційності</span>
            </div>
            <div className="font-semibold text-gray-300">З гордістю створено в Україні 🇺🇦</div>
          </div>
        </div>
      </footer>

      {/* Модальне вікно Реєстрації та Входу з гарантованим очищенням полів */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAuthModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0e0e14] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">{isLogin ? 'Вхід в акаунт' : 'Створити акаунт'}</h3>
                  <p className="text-xs text-gray-400">{isLogin ? 'Введи свій логін та пароль' : 'Зареєструйся, щоб вести свою колекцію'}</p>
                </div>
              </div>

              <form key={isLogin ? 'login-mode' : 'register-mode'} onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Твій нікнейм</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Пароль</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all">
                  {loading ? 'Завантаження...' : isLogin ? 'Увійти' : 'Зареєструватися'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button type="button" onClick={() => switchAuthMode(!isLogin)} className="text-xs text-indigo-300 hover:text-white transition-colors">
                  {isLogin ? 'Ще немає акаунта? Зареєструватися →' : 'Вже є акаунт? Перейти до входу →'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}