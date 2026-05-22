import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useStore from '../store/useStore';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, Clock, Users, ArrowRight, LayoutGrid, Info, Sparkles } from 'lucide-react';

export default function Booking() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    time: '19:00', 
    guests: 2, 
    table: '', 
    duration: 2 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Fetch tables initially and when date/time changes
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const r = await api.get(`/booking?date=${form.date}&time=${form.time}`);
        if (r.data.success) {
          setTables(r.data.tables || []);
          // Clear selected table if it's no longer available
          const isStillAvail = r.data.tables.find(t => t.table_name === form.table && t.status !== 'occupied');
          if (!isStillAvail) set('table', '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchAvailability, 300);
    return () => clearTimeout(debounce);
  }, [form.date, form.time, form.table]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    if (!form.table) { 
      setError(t('select_table') || 'Please select your preferred placement from the floor plan.'); 
      return; 
    }
    setError(''); setSubmitting(true);
    try {
      const res = await api.post('/booking', form);
      if (res.data.success) {
        navigate(`/payment/${res.data.id}`);
      } else {
        setError(res.data.error || 'The requested transmission failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'A critical error occurred. Please refresh and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const available = tables.filter(t => t.status !== 'occupied');
  const occupied  = tables.filter(t => t.status === 'occupied');

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-40 pb-32 px-6 sm:px-12 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        <header className="text-center mb-32 relative">
          <div className="inline-flex items-center gap-3 bg-blue-600/10 text-blue-600 mb-8 py-3 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-blue-600/20 shadow-xl animate-fade-in">
             <LayoutGrid size={14} className="animate-pulse" /> {t('monitor_sync')}
          </div>
          <h1 className="font-serif italic text-7xl md:text-[10rem] font-bold mb-10 text-[var(--theme-text)] leading-[0.8] tracking-tighter animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t('booking_page_title').split(' ')[0]} <span className="text-blue-600">{t('booking_page_title').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-xl md:text-2xl max-w-3xl mx-auto font-bold tracking-tight leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {t('booking_subtitle')}
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-20">
          {/* Floor Plan (Left) */}
          <div className="lg:col-span-5 space-y-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-6">
                {t('floor_architecture')}
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-400 tracking-widest"><div className="w-2 h-2 rounded-full bg-[var(--theme-panel)] border border-[var(--theme-border)]" /> {t('vacant')}</div>
                 <div className="flex items-center gap-2 text-[8px] font-black uppercase text-blue-600 tracking-widest"><div className="w-2 h-2 rounded-full bg-blue-600" /> {t('selected')}</div>
                 <div className="flex items-center gap-2 text-[8px] font-black uppercase text-rose-500 tracking-widest"><div className="w-2 h-2 rounded-full bg-rose-500/10 border border-rose-500/20" /> {t('occupied')}</div>
              </div>
            </div>

            <div className="glass p-10 min-h-[500px]">
              {loading ? (
                <div className="grid grid-cols-3 gap-6">
                  {[...Array(12)].map((_, i) => <div key={i} className="bg-[var(--theme-accent)] rounded-[1.5rem] h-28 animate-pulse border border-[var(--theme-border)]" />)}
                </div>
              ) : tables.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                  <LayoutGrid size={64} className="mb-6" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Architectural state unavailable</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {available.map(t_item => (
                    <button
                      key={t_item.id}
                      type="button"
                      onClick={() => set('table', t_item.table_name)}
                      className={`rounded-[2rem] p-8 text-center transition-all border-2 flex flex-col items-center justify-center gap-2 group ${
                        form.table === t_item.table_name
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-105 z-10'
                          : 'bg-[var(--theme-panel)] border-[var(--theme-border)] text-slate-400 hover:border-blue-600 hover:text-blue-600'
                      }`}
                    >
                      <div className="text-3xl font-black font-serif tracking-tighter">{t_item.table_name}</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">Cap: {t_item.capacity}</div>
                    </button>
                  ))}
                  {occupied.map(t_item => (
                    <div
                      key={t_item.id}
                      className="bg-rose-500/5 border-2 border-rose-500/10 text-rose-500/40 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <div className="text-3xl font-black font-serif tracking-tighter">{t_item.table_name}</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em]">{t('occupied')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-blue-600/5 rounded-[2.5rem] p-6 md:p-10 border border-blue-600/10 flex items-start gap-6">
               <Info size={24} className="text-blue-600 shrink-0" />
               <p className="text-xs font-bold text-blue-600/80 leading-relaxed tracking-tight">
                 Namaste! An advance deposit of ₹500 is required to secure your placement. This will be adjusted in your final bill.
               </p>
            </div>
          </div>

          {/* Form Selection (Right) */}
          <div className="lg:col-span-7 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="glass p-6 sm:p-12 md:p-20 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Calendar size={120} />
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl p-8 mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-center animate-shake">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">{t('date_label')}</label>
                    <div className="relative group/field">
                      <Calendar size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 transition-colors" />
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => set('date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full py-6 pl-18 pr-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">{t('time_label')}</label>
                    <div className="relative group/field">
                      <Clock size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 transition-colors" />
                      <input
                        type="time"
                        value={form.time}
                        onChange={e => set('time', e.target.value)}
                        required
                        className="w-full py-6 pl-18 pr-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">{t('guest_label')}</label>
                    <div className="relative group/field">
                      <Users size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 transition-colors" />
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={form.guests}
                        onChange={e => set('guests', e.target.value)}
                        required
                        className="w-full py-6 pl-18 pr-8 font-black"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">{t('duration_label')}</label>
                    <div className="relative group/field">
                       <Clock size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 pointer-events-none transition-colors" />
                       <select 
                        value={form.duration} 
                        onChange={e => set('duration', e.target.value)}
                        className="w-full py-6 pl-18 pr-8 appearance-none"
                      >
                        {[1, 2, 3, 4].map(h => (
                          <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''} Experience</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">{t('table_placement')}</label>
                  <div className="relative group/field">
                    <LayoutGrid size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-blue-600 pointer-events-none transition-colors" />
                    <select
                      value={form.table}
                      onChange={e => set('table', e.target.value)}
                      required
                      className="w-full py-6 pl-18 pr-8 appearance-none"
                    >
                      <option value="">{t('select_table') || 'Select placement…'}</option>
                      {tables.map(t_opt => (
                        <option key={t_opt.id} value={t_opt.table_name} disabled={t_opt.status === 'occupied'}>
                          Table {t_opt.table_name} · Capacity: {t_opt.capacity} Max
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary py-8 rounded-[2.5rem] shadow-2xl group/btn"
                  >
                    {submitting ? (
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {user ? t('authorize_booking') : t('login').toUpperCase()}
                        <ArrowRight size={24} className="group-hover/btn:translate-x-3 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60 flex items-center justify-center gap-3">
                    <Sparkles size={12} className="text-blue-600" />
                    Safe & Secure Authorization
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
