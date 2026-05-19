import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import useStore from '../../store/useStore';
import { Shield, User, Lock, ArrowRight, Eye, EyeOff, Terminal } from 'lucide-react';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { isAdmin, isStaff, checkAdminAuth } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) navigate('/admin');
    else if (isStaff) navigate('/admin/chef');
  }, [isAdmin, isStaff, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/api/admin/login', form);
      if (res.data.success) { await checkAdminAuth(); navigate('/admin'); }
    } catch (err) {
      setError(err.response?.data?.error || 'Access Denied: Invalid Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--theme-bg)] relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[150px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="glass p-8 md:p-16 lg:p-20 shadow-2xl relative overflow-hidden group">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

          {/* Security Branding */}
          <div className="flex justify-center mb-16 relative">
            <div className="relative">
               <div className="w-20 h-20 md:w-28 md:h-28 bg-blue-600 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-600/20 group-hover:scale-105 group-hover:rotate-6 transition-all duration-700">
                  <Shield size={36} className="text-white md:hidden" />
                  <Shield size={48} className="text-white hidden md:block" />
               </div>
               <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[var(--theme-panel)] flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
               </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-1.5 bg-blue-600/10 rounded-full border border-blue-600/20">
               <Terminal size={14} className="text-blue-600" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Secure Protocol v2.4</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--theme-text)] mb-4 md:mb-6">Sovereign <span className="text-blue-600">Access</span></h1>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] leading-loose max-w-[280px] md:max-w-[320px] mx-auto opacity-80">Encryption active. Authenticated session required to bridge to management deck.</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl p-6 mb-12 text-[10px] font-black text-center animate-shake uppercase tracking-[0.2em]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Terminal Identity</label>
              <div className="relative group">
                <User size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Master Username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  className="w-full py-6 pl-16 pr-8"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Access Code</label>
              <div className="relative group">
                <Lock size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full py-6 pl-16 pr-20 font-mono tracking-[0.3em]"
                  required
                />
                <button type="button" onClick={() => setShowPass(o => !o)} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-all p-2">
                  {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full btn-primary py-7 rounded-3xl mt-12 disabled:opacity-50 group/btn"
            >
              {loading ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>AUTHORIZE SESSION <ArrowRight size={22} className="group-hover/btn:translate-x-2 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer Support */}
        <div className="text-center mt-16 flex flex-col items-center gap-6">
          <Link to="/" className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-blue-600 transition-all flex items-center gap-8 group">
            <div className="w-16 h-px bg-[var(--theme-border)] group-hover:w-24 group-hover:bg-blue-600 transition-all duration-700" />
            FRONT DESK
            <div className="w-16 h-px bg-[var(--theme-border)] group-hover:w-24 group-hover:bg-blue-600 transition-all duration-700" />
          </Link>
          <Link to="/admin/staff-login" className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600/50 hover:text-blue-600 transition-all">
            STAFF IDENTITY ACCESS »
          </Link>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest hover:text-rose-500 transition-colors"
          >
            System Override / Reset
          </button>
        </div>
      </div>
    </div>
  );
}
