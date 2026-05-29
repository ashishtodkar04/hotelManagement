import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Search, Filter, Users, FileText, Activity, Printer } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import useStore from '../../store/useStore';

export default function BookingHistory() {
  const { isAdmin, isAdminLoading } = useStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isAdminLoading || !isAdmin) return;
    const fetchHistory = async () => {
      try {
        const res = await api.get('/api/admin/history');
        setHistory(res.data.bookings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [isAdmin, isAdminLoading]);

  if (isAdminLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return <Navigate to="/admin/login" />;

  const filteredHistory = history.filter(b => {
    const matchesSearch = 
      (b.booking_ref && b.booking_ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.user_name && b.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.table_number && b.table_number.toString().includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-32 pb-24 px-6 sm:px-12 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 mb-20 animate-fade-in">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
              <FileText size={40} />
            </div>
            <div>
               <div className="inline-flex items-center gap-3 bg-blue-600/10 text-blue-600 mb-2 py-1.5 px-6 rounded-full text-[9px] font-black uppercase tracking-[0.4em] border border-blue-600/20 shadow-sm">
                  <Activity size={12} className="animate-pulse" /> Booking History
               </div>
               <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--theme-text)]">Booking <span className="text-blue-600">History</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="glass px-10 py-6 flex flex-col items-center min-w-[200px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Archived Sessions</span>
                <span className="text-3xl font-black text-blue-600 font-serif tracking-tighter">{history.length}</span>
             </div>
             <Link to="/admin" className="btn-secondary py-5 px-10 text-[10px] shadow-sm">
              TERMINAL
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="lg:col-span-3 relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Search by Reference ID, Customer Name, or Table..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-8 py-7 bg-[var(--theme-panel)] border border-[var(--theme-border)] focus:ring-8 focus:ring-blue-600/5 rounded-3xl text-[var(--theme-text)] outline-none font-black shadow-sm"
            />
          </div>
          <div className="relative group">
            <Filter className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={24} />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full pl-20 pr-10 py-7 bg-[var(--theme-panel)] border border-[var(--theme-border)] focus:ring-8 focus:ring-blue-600/5 rounded-3xl text-[var(--theme-text)] outline-none appearance-none font-black text-xs uppercase tracking-[0.3em] shadow-sm"
            >
              <option value="all">ALL STATUSES</option>
              <option value="completed">FULFILLED</option>
              <option value="cancelled">TERMINATED</option>
              <option value="confirmed">CONFIRMED</option>
              <option value="seated">IN SESSION</option>
            </select>
          </div>
        </div>

        <div className="glass overflow-hidden animate-fade-in shadow-2xl" style={{ animationDelay: '0.4s' }}>
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--theme-accent)] border-b border-[var(--theme-border)]">
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Temporal / Ref</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Identity</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Placement</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Financials</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Details</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border)]">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}><td colSpan="6" className="px-12 py-12"><div className="bg-[var(--theme-accent)] h-16 w-full rounded-3xl animate-pulse" /></td></tr>
                  ))
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-12 py-48 text-center">
                      <FileText size={100} className="mx-auto mb-10 text-slate-200" />
                      <p className="text-3xl font-black text-slate-300 tracking-tighter uppercase">Archives Returned No Results</p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(b => (
                    <tr key={b.id} className="hover:bg-blue-600/5 transition-all group">
                      <td className="px-12 py-10">
                        <div className="text-lg font-black text-[var(--theme-text)] font-serif tracking-tight">{new Date(b.booking_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-blue-600 transition-colors uppercase mt-1 tracking-widest">Ref: {b.booking_ref}</div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="text-lg font-black text-[var(--theme-text)] tracking-tight">{b.user_name || 'Walk-in Guest'}</div>
                        <div className="text-[10px] text-slate-400 font-black tracking-[0.3em] mt-2 flex items-center gap-3">
                           <Users size={14} className="text-blue-600" /> {b.guests} GUESTS
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-600/10 text-blue-600 rounded-2xl font-serif font-black text-lg border border-blue-600/10 shadow-sm">
                           Table {b.table_number}
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="text-2xl font-black text-[var(--theme-text)] font-serif tracking-tighter">₹{Number(b.bill_amount || 0).toFixed(0)}</div>
                        {b.discount > 0 && <div className="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em] mt-1 italic">-₹{b.discount} REBATE</div>}
                      </td>
                      <td className="px-12 py-10">
                         <div className="flex flex-col gap-3">
                            <div className={`text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${b.payment_verified ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-600 opacity-30'}`}>
                               <div className={`w-2 h-2 rounded-full ${b.payment_verified ? 'bg-emerald-500' : 'bg-slate-300'}`} /> ADVANCE PAYMENT
                            </div>
                            <div className={`text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${b.final_payment_verified ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-600 opacity-30'}`}>
                               <div className={`w-2 h-2 rounded-full ${b.final_payment_verified ? 'bg-emerald-500' : 'bg-slate-300'}`} /> FINAL SETTLEMENT
                            </div>
                         </div>
                      </td>
                      <td className="px-12 py-10 text-right">
                        <span className={`badge-${
                          b.status === 'completed' ? 'emerald' :
                          b.status === 'cancelled' ? 'rose' :
                          b.status === 'confirmed' ? 'blue' : 'amber'
                        } py-2 px-6 shadow-sm mb-2 block w-max ml-auto`}>
                          {b.status.toUpperCase()}
                        </span>
                        <button onClick={() => window.open(`/admin/print/${b.id}`, '_blank')} className="btn-secondary py-2 px-4 text-[8px] flex items-center gap-2 w-max ml-auto shadow-sm">
                          <Printer size={10} /> PRINT BILL
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
