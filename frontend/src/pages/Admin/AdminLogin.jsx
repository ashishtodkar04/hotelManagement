import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { useHotel } from '../../hooks/useHotel';
import { ShieldCheck, Lock, User, ChefHat, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const { adminLogin } = useStore();
  const { name: HOTEL_NAME } = useHotel();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('Please enter admin credentials.');
      return;
    }

    try {
      setLoading(true);
      const res = await adminLogin(username, password);
      if (res.success) {
        navigate('/admin');
      } else {
        setErrorMsg(res.error || 'Invalid executive security credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(err.response?.data?.error || 'Authentication server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30">
            <ChefHat className="w-9 h-9" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            {HOTEL_NAME} Executive Portal
          </h1>
          <p className="text-xs text-amber-200/80 font-medium">
            Authorized Hospitality & Restaurant Administration
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Staff Username / Identity
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs py-3 pl-10 pr-4 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Executive Security Key
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs py-3 pl-10 pr-4 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating Staff...' : 'Access Executive Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sovereign Session Protection Active</span>
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
