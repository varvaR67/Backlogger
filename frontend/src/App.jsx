import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gamepad2, Film, Trophy, ArrowUp, RefreshCw, X, LogIn, UserPlus } from 'lucide-react';
import Home from './pages/Home';
import { useTranslation } from './i18n';

export default function App() {
  const { t, lang, changeLanguage } = useTranslation();
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

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[680px] h-[500px] rounded-full opacity-90" style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.28) 0%, rgba(79, 70, 229, 0.12) 45%, transparent 72%)', filter: 'blur(50px)' }} />
        <div className="absolute top-20 -right-24 w-[620px] h-[480px] rounded-full opacity-85" style={{ background: 'radial-gradient(circle, rgba(225, 29, 72, 0.20) 0%, rgba(16, 185, 129, 0.10) 45%, transparent 72%)', filter: 'blur(55px)' }} />
      </div>

      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">Backlogger</span>
        </div>

        <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-gray-300">
          <a href="#features" className="hover:text-white transition-colors">{t('landing_features')}</a>
          <a href="#cinema" className="hover:text-white transition-colors">{t('landing_cinema')}</a>
          <a href="#community" className="hover:text-white transition-colors">{t('landing_community')}</a>
        </div>

        <div className="flex items-center gap-3">
          {/* Вибір мови на вступній сторінці */}
          <div className="flex items-center bg-[#12121c] p-1 rounded-full border border-white/10 gap-1 mr-1">
            {[
              { code: 'uk', label: 'UA' },
              { code: 'en', label: 'EN' },
              { code: 'ru', label: 'RU' }
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all ${
                  lang === l.code ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => openAuth(true)}
            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold bg-[#12121c] hover:bg-indigo-500/25 text-white border-2 border-indigo-400/50 hover:border-indigo-400 shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <LogIn className="w-4 h-4 text-indigo-400" />
            <span>{t('landing_login')}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-12 pb-20 relative z-10 flex-1">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('landing_tagline')}</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60 mb-4">
            BACKLOGGER
          </h1>
          <h2 className="text-xl sm:text-3xl font-bold text-indigo-200/90 mb-4">
            {t('landing_subtitle')}
          </h2>
          <p className="text-gray-400 text-sm sm:text-lg mb-8 leading-relaxed">
            {t('landing_desc')}
          </p>

          <div className="inline-grid grid-cols-3 gap-6 sm:gap-12 bg-[#111118]/90 backdrop-blur-md border border-white/10 rounded-3xl px-7 sm:px-12 py-5 mb-9 shadow-2xl">
            <div>
              <div className="text-[11px] text-gray-400 mb-1">{t('landing_stat1')}</div>
              <div className="text-xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-400" /> 500k+
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 mb-1">{t('landing_stat2')}</div>
              <div className="text-xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                <Film className="w-5 h-5 text-rose-400" /> 850k+
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 mb-1">{t('landing_stat3')}</div>
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
              <span>{t('landing_btn_reg')}</span>
            </button>
          </div>
        </motion.div>

        <section id="features" className="space-y-16 pt-10 border-t border-white/[0.07]">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">{t('landing_about_title')}</h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              {t('landing_about_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-gradient-to-br from-indigo-950/50 via-[#101018] to-[#0a0a0f] border border-indigo-500/25 rounded-3xl p-6 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> {t('landing_f1_title')}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">● Online</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-400">{t('landing_f1_auto')}</div>
                  <div className="text-lg font-black text-white mt-0.5">{t('landing_f1_auto_sub')}</div>
                </div>
                <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-400">{t('landing_f1_rate')}</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">{t('landing_f1_rate_sub')}</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-3">{t('landing_f2_title')}</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-5 leading-relaxed">{t('landing_f2_desc')}</p>
              <button onClick={() => openAuth(false)} className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold transition-all hover:scale-105">
                {t('landing_btn_reg')}
              </button>
            </div>
          </div>

          <div id="cinema" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-3">{t('landing_f3_title')}</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-5 leading-relaxed">{t('landing_f3_desc')}</p>
              <button onClick={() => openAuth(false)} className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all hover:scale-105">
                {t('landing_f3_btn')}
              </button>
            </div>
            <div className="order-1 md:order-2 bg-gradient-to-br from-rose-950/50 via-[#140d10] to-[#0a0a0f] border border-rose-500/25 rounded-3xl p-6 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5"><Film className="w-4 h-4" /> {t('landing_f4_title')}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">+1 серія</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-400">{t('landing_f4_start')}</div>
                  <div className="text-lg font-black text-rose-300 mt-0.5">{t('landing_f4_start_sub')}</div>
                </div>
                <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-400">{t('landing_f4_ach')}</div>
                  <div className="text-lg font-black text-amber-300 mt-0.5">{t('landing_f4_ach_sub')}</div>
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
                {t('landing_btn_reg')}
              </button>
            </div>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-2.5 rounded-full border border-indigo-400/40 text-indigo-300 hover:bg-indigo-500/20 transition-all">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
            <p>© {new Date().getFullYear()}, Backlogger, All rights reserved.</p>
            <p>{t('landing_footer_text')}</p>
          </div>
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex gap-4 font-semibold text-indigo-300">
              <span>{t('landing_terms')}</span>
              <span>{t('landing_privacy')}</span>
            </div>
            <div className="font-semibold text-gray-300">{t('footer_created')} 🇺🇦</div>
          </div>
        </div>
      </footer>

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
                  <h3 className="text-xl font-extrabold text-white">{isLogin ? t('auth_login_title') : t('auth_reg_title')}</h3>
                  <p className="text-xs text-gray-400">{isLogin ? t('auth_login_sub') : t('auth_reg_sub')}</p>
                </div>
              </div>

              <form key={isLogin ? 'login-mode' : 'register-mode'} onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">{t('auth_name')}</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={t('auth_name_ph')}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">{t('auth_pass')}</label>
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
                  {loading ? t('auth_loading') : isLogin ? t('auth_btn_login') : t('auth_btn_reg')}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button type="button" onClick={() => switchAuthMode(!isLogin)} className="text-xs text-indigo-300 hover:text-white transition-colors">
                  {isLogin ? t('auth_switch_to_reg') : t('auth_switch_to_login')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}