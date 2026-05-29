import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../services/api';
import { Calendar, Clock, Users, ChevronLeft, ShoppingBag, CheckCircle, Activity } from 'lucide-react';
import { useHotel } from '../hooks/useHotel';

export default function History() {
  const { user } = useStore();
  const { name: HOTEL_NAME } = useHotel();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/dashboard').then(r => {
      if (r.data.success) {
        const past = r.data.bookings
          .filter(b => ['completed', 'cancelled'].includes(b.status))
          .map(b => ({
            ...b,
            orders: (r.data.ordersByBooking || {})[b.id] || []
          }));
        setBookings(past.sort((a, b) => b.id - a.id));
      }
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-24 md:pt-40 pb-32 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto">
        <Link to="/dashboard" className="btn-secondary py-3 px-8 text-[10px] gap-4 mb-16 inline-flex shadow-sm">
          <ChevronLeft size={16} /> BACK TO DASHBOARD
        </Link>

        <header className="mb-24 animate-fade-in">
           <div className="inline-flex items-center gap-3 bg-blue-600/10 text-blue-600 mb-8 py-3 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-blue-600/20 shadow-xl">
             <Activity size={14} className="animate-pulse" /> Archive Retrieval System
          </div>
          <h1 className="font-serif italic text-5xl md:text-8xl lg:text-9xl font-bold text-[var(--theme-text)] leading-[1] md:leading-[0.8] tracking-tighter">Past <span className="text-blue-600">Narratives</span></h1>
          <p className="text-lg md:text-2xl mt-8 md:mt-10 font-bold tracking-tight max-w-2xl leading-relaxed px-2">A complete record of your past bookings at {HOTEL_NAME}.</p>
        </header>

        {loading ? (
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => <div key={i} className="cloud-card h-80 animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="cloud-card py-48 text-center border-dashed border-2 max-w-4xl mx-auto animate-fade-in">
            <Calendar size={100} className="mx-auto mb-10 text-slate-200" />
            <h3 className="text-4xl font-black text-[var(--theme-text)] mb-6 tracking-tighter uppercase">No archived sessions</h3>
            <p className="text-slate-400 text-xl mb-16 font-bold tracking-tight max-w-md mx-auto">Make your first booking to start building your history.</p>
            <Link to="/booking" className="btn-primary py-8 px-20 text-lg w-fit mx-auto shadow-2xl">
               BEGIN THE COLLECTION
            </Link>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {bookings.map(b => (
              <div key={b.id} className="cloud-card p-8 md:p-12 hover:-translate-y-2 hover:shadow-2xl transition-all duration-700 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1.5 md:w-2 h-full transition-colors duration-500 ${b.status === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                
                <div className="flex flex-wrap items-center justify-between gap-6 md:gap-10 mb-10 md:mb-12">
                  <div className="flex items-center gap-4 md:gap-6">
                    <span className={`badge-${b.status === 'completed' ? 'emerald' : 'rose'} shadow-sm`}>
                      {b.status === 'completed' ? 'FULFILLED' : 'TERMINATED'}
                    </span>
                    <span className="text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] font-mono">Archive: {b.booking_ref}</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-[var(--theme-text)] font-serif tracking-tighter">
                    {new Date(b.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-12">
                  <div className="group/item">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 md:mb-3 group-hover/item:text-blue-600 transition-colors">TEMPORAL WINDOW</p>
                    <div className="text-lg md:text-xl font-bold flex items-center gap-3 md:gap-4 text-[var(--theme-text)] tracking-tight">
                       <Clock size={18} md:size={20} className="text-blue-600" /> {b.time_slot}
                    </div>
                  </div>
                  <div className="group/item">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 md:mb-3 group-hover/item:text-blue-600 transition-colors">PLACEMENT</p>
                    <div className="text-xl md:text-2xl font-black text-blue-600 tracking-tighter">Table {b.table_number}</div>
                  </div>
                  <div className="group/item">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 md:mb-3 group-hover/item:text-blue-600 transition-colors">ATTENDANCE</p>
                    <div className="text-lg md:text-xl font-bold flex items-center gap-3 md:gap-4 text-[var(--theme-text)] tracking-tight">
                      <Users size={18} md:size={20} className="text-blue-600" /> {b.guests} Guests
                    </div>
                  </div>
                  <div className="group/item">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 md:mb-3 group-hover/item:text-blue-600 transition-colors">TOTAL INVESTMENT</p>
                    <div className="text-3xl md:text-4xl font-black text-[var(--theme-text)] font-serif tracking-tighter">₹{Number(b.paid_amount || (Number(b.adv_paid) + Number(b.bill_amount))).toFixed(0)}</div>
                  </div>
                </div>

                {b.orders?.length > 0 && (
                  <div className="bg-[var(--theme-accent)] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-[var(--theme-border)] shadow-inner group/order">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-8 flex items-center gap-4">
                      <ShoppingBag size={18} className="group-hover/order:scale-110 transition-transform" /> Retrospective Selection
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 md:gap-x-20 gap-y-4 md:gap-y-6">
                      {b.orders.map((o, i) => (
                        <div key={i} className="flex justify-between items-center text-xs md:text-sm font-bold border-b border-[var(--theme-border)] pb-2">
                          <span className="text-[var(--theme-text)]">{o.quantity}× <span className="font-black text-base md:text-lg font-serif">{o.name}</span></span>
                          <span className="font-black text-slate-400 tracking-widest">₹{o.total_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {b.final_payment_verified === 1 && (
                  <div className="mt-10 flex items-center gap-4 text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em] opacity-60 group-hover:opacity-100 transition-opacity">
                    <CheckCircle size={20} /> COMPLETED & ARCHIVED
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
