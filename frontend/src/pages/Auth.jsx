import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Utensils, User, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import useStore from '../store/useStore';

import api from '../services/api';
import { useHotel } from '../hooks/useHotel';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ identifier: '', name: '', username: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, setUser } = useStore();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { name: HOTEL_NAME } = useHotel();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      if (isLogin) {
        const res = await login(form.identifier, form.password);
        if (res.success) navigate('/dashboard');
        else setError(res.error || 'Identity verification failed. Please audit your credentials.');
      } else {
        const res = await api.post('/register', form);
        if (res.data.success) {
          setIsLogin(true);
          setInfo('Namaste! Identity established! You may now bridge to your dashboard.');
          setForm(p => ({ ...p, identifier: form.email, password: '' }));
        } else {
          setError(res.data.error || 'Registration sequence interrupted.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'A critical transmission error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/google-login', { token: credentialResponse.credential });
      if (res.data.success) {
        setUser(res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.data.error || 'Google authentication failed.');
      }
    } catch (err) {
      console.error(err);
      setError('A transmission error occurred during Google sync.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--theme-bg)] relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-15%] left-[-15%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-[1400px] grid lg:grid-cols-2 bg-[var(--theme-panel)] rounded-[2rem] md:rounded-[4rem] border border-[var(--theme-border)] overflow-hidden shadow-2xl relative z-10 animate-fade-in backdrop-blur-3xl">
        <div className="hidden lg:flex flex-col justify-between p-16 xl:p-24 bg-slate-900 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-transparent to-indigo-600/10 pointer-events-none"></div>

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-5 mb-24 group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                <Utensils size={24} className="text-white" />
              </div>
              <span className="font-serif font-bold text-4xl md:text-5xl tracking-tighter text-white">{HOTEL_NAME}</span>
            </Link>

            <div className="space-y-10">
              <h2 className="font-serif italic text-5xl xl:text-7xl font-bold leading-[1.1] text-white tracking-tighter">
                {isLogin ? 'The return to excellence starts here.' : 'Secure your seat at the pinnacle of dining.'}
              </h2>
              <p className="text-slate-400 text-xl xl:text-2xl leading-relaxed font-bold tracking-tight max-w-lg">
                Namaste! Manage your sovereign presence, orchestrate reservations, and access the inner circle.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-6 pt-12">
            {[
              'Real-time Floor Map Interaction',
              'Sovereign Transaction Ledger',
              'Exclusive Culinary Preview Access'
            ].map((f, i) => (
              <div key={f} className="flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 animate-fade-in" style={{ animationDelay: `${0.8 + (i * 0.2)}s` }}>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,1)]" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-16 lg:p-24 xl:p-32 relative">
          <header className="mb-12 md:mb-16">
            <h3 className="font-black text-4xl md:text-5xl text-[var(--theme-text)] mb-4 tracking-tighter">{isLogin ? t('login') : 'Create Identity'}</h3>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em]">{isLogin ? 'Synchronize your credentials' : 'Join the sovereign culinary circle'}</p>
          </header>

          {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl p-8 mb-12 text-[10px] font-black uppercase tracking-[0.2em] text-center animate-shake">{error}</div>}
          {info && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-3xl p-8 mb-12 text-[10px] font-black uppercase tracking-[0.2em] text-center">{info}</div>}

          <form onSubmit={handleSubmit} className="space-y-12">
            {isLogin ? (
              <>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Account Identifier</label>
                  <div className="relative group/field">
                    <User size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 transition-colors" />
                    <input type="text" placeholder="Email, username or phone" value={form.identifier} onChange={e => set('identifier', e.target.value)} className="w-full py-6 pl-20 pr-8 bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl outline-none" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Security Key</label>
                  <div className="relative group/field">
                    <Lock size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 transition-colors" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} className="w-full py-6 pl-20 pr-20 font-black tracking-widest bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl outline-none" required />
                    <button type="button" onClick={() => setShowPass(o => !o)} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-all p-2">
                      {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Biological Designation (Name)</label>
                  <div className="relative group/field">
                    <User size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 transition-colors" />
                    <input type="text" placeholder="Full Legal Name" value={form.name} onChange={e => set('name', e.target.value)} className="w-full py-6 pl-20 pr-8 bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl outline-none" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Unique Handle</label>
                    <input type="text" placeholder="Username" value={form.username} onChange={e => set('username', e.target.value)} className="w-full py-5 md:py-6 px-10 bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl outline-none" required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Contact Link</label>
                    <input type="tel" placeholder="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full py-5 md:py-6 px-10 font-black bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl outline-none" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Electronic Post (Email)</label>
                  <div className="relative group/field">
                    <Mail size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 transition-colors" />
                    <input type="email" placeholder="Personal Address" value={form.email} onChange={e => set('email', e.target.value)} className="w-full py-6 pl-20 pr-8 bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl outline-none" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Master Security Key</label>
                  <div className="relative group/field">
                    <Lock size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 transition-colors" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} className="w-full py-6 pl-20 pr-8 font-black tracking-widest bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl outline-none" minLength="6" required />
                  </div>
                </div>
              </>
            )}

            {/* BUTTON MOVED OUTSIDE TERNARY TO FIX BUG */}
            <button type="submit" disabled={loading} className="w-full btn-primary py-8 rounded-[2.5rem] shadow-2xl mt-8 disabled:opacity-50 group/btn flex items-center justify-center gap-4">
              {loading ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="font-black uppercase tracking-[0.2em]">
                    {isLogin ? 'INITIALIZE CONNECTION' : 'FINALIZE IDENTITY PROTOCOL'}
                  </span>
                  <ArrowRight size={24} className="group-hover/btn:translate-x-3 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-16 pt-12 border-t border-[var(--theme-border)]">
            <div className="flex items-center gap-6 mb-10">
              <div className="h-px flex-1 bg-[var(--theme-border)]" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">Sovereign Social Link</span>
              <div className="h-px flex-1 bg-[var(--theme-border)]" />
            </div>

            <div className="flex flex-col items-center gap-8">
              <div className="w-full flex flex-col items-center justify-center min-h-[60px] relative">
                {import.meta.env.VITE_GOOGLE_CLIENT_ID && !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('v3p6b6b6') ? (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Authentication Failed')}
                    useOneTap
                    theme={theme === 'dark' ? 'filled_black' : 'outline'}
                    shape="pill"
                    size="large"
                    width="100%"
                    text={isLogin ? 'signin_with' : 'signup_with'}
                  />
                ) : (
                  <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest border border-rose-500/20 bg-rose-500/5 px-8 py-4 rounded-2xl animate-pulse">
                    Google Identity Protocol Offline: Missing Client ID
                  </div>
                )}

              </div>

              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center max-w-xs leading-relaxed opacity-60">
                Bridge your Google identity for a <span className="text-blue-600">frictionless transmission</span> into the inner circle.
              </p>
            </div>
          </div>

          <footer className="mt-16 pt-12 border-t border-[var(--theme-border)] text-center">
            <p className="text-base text-slate-400 dark:text-slate-600 font-bold tracking-tight">
              {isLogin ? "Not yet part of the collection? " : 'Already established? '}
              <button type="button" onClick={() => { setIsLogin(o => !o); setError(''); setInfo(''); }} className="text-blue-600 font-black hover:underline transition-all uppercase tracking-[0.3em] text-[11px] ml-2">
                {isLogin ? 'JOIN FREE' : 'SIGN IN'}
              </button>
            </p>

            <div className="mt-12 flex flex-col items-center gap-8 border-t border-[var(--theme-border)] pt-8 opacity-60 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-12">
                <Link to="/admin/staff-login" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-blue-600 transition-all group">
                  <User size={16} className="text-blue-600" /> STAFF PORTAL
                </Link>
                <div className="w-px h-4 bg-[var(--theme-border)]" />
                <Link to="/admin/login" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-blue-600 transition-all group">
                  <ShieldCheck size={16} /> ADMIN ACCESS
                </Link>
              </div>
            </div>

            <p className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-30 flex items-center justify-center gap-3">
              <span className="flex items-center gap-1"><Sparkles size={10} className="text-blue-600" /> Namaste! Secured by {HOTEL_NAME}</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}