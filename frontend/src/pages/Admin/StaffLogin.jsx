import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useHotel } from '../../hooks/useHotel';
import useStore from '../../store/useStore';
import { User, Shield, ArrowRight } from 'lucide-react';

export default function StaffLogin() {
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAdmin, isStaff, checkAdminAuth } = useStore();
  const { name: HOTEL_NAME } = useHotel();

  useEffect(() => {
    if (isAdmin) navigate('/admin');
    else if (isStaff) navigate('/admin/chef');
  }, [isAdmin, isStaff, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await api.post('/api/admin/staff-login', { staffId });
      if (r.data.success) {
        await checkAdminAuth();
        navigate('/admin/chef'); // Default to kitchen
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid Staff ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center p-6 sm:p-12">
      <div className="max-w-xl w-full">
        <div className="text-center mb-16 animate-fade-in">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-600/20 rotate-12 group hover:rotate-0 transition-all duration-700">
            <User size={40} className="text-white" />
          </div>
          <h1 className="text-6xl font-serif italic font-bold text-[var(--theme-text)] tracking-tighter mb-4">Staff <span className="text-blue-600">Portal</span></h1>
          <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase">{HOTEL_NAME} SMS Verifier • Operations Hub</p>
        </div>

        <div className="glass p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          
          <form onSubmit={handleLogin} className="space-y-10 relative z-10">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 block ml-2">Staff Identity ID</label>
              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors">
                  <Shield size={20} />
                </div>
                <input
                  type="text"
                  placeholder="STXXXXX"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                  className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] rounded-3xl py-6 pl-16 pr-8 outline-none focus:ring-8 focus:ring-blue-600/5 transition-all text-lg font-black tracking-widest uppercase"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-3xl text-xs font-black uppercase tracking-widest text-center animate-shake">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="btn-primary w-full py-8 text-sm font-black tracking-[0.3em] shadow-2xl group/btn"
            >
              {loading ? 'AUTHORIZING...' : 'INITIALIZE SESSION'}
              {!loading && <ArrowRight size={20} className="ml-4 group-hover/btn:translate-x-2 transition-transform" />}
            </button>
          </form>
        </div>

        <p className="text-center mt-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Staff only • <span className="text-blue-600">{HOTEL_NAME} Staff Login</span>
        </p>
      </div>
    </div>
  );
}
