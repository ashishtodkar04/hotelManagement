import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useHotel } from '../hooks/useHotel';
import {
  Clock, CheckCircle, Receipt, Calendar,
  Users, Plus, CreditCard, ShoppingBag, AlertCircle, History, Activity,
  Shield, Key, Eye, EyeOff, Save, Lock, X, User, Phone
} from 'lucide-react';



const STATUS_CONFIG = {
  pending:   { key: 'pending', color: 'badge-amber',   icon: Clock },
  confirmed: { key: 'confirmed', color: 'badge-blue',    icon: CheckCircle },
  seated:    { key: 'seated', color: 'badge-blue', icon: Users },
  awaiting_final_payment: { key: 'awaiting_final_payment', label: 'Bill Ready', color: 'badge-amber', icon: Receipt },
  completed: { key: 'completed', color: 'badge-emerald', icon: CheckCircle },
  cancelled: { key: 'cancelled', color: 'badge-rose',    icon: AlertCircle },
};

function BookingCard({ booking, onRefresh, t }) {
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const canAddDishes = ['pending', 'confirmed', 'seated'].includes(booking.status);
  const canPay = booking.status === 'pending' && !booking.utr_number;
  const awaitingVerification = (booking.status === 'pending' || booking.status === 'awaiting_final_payment') && booking.utr_number;
  
  const needsFinalPayment = (booking.status === 'seated' || booking.status === 'awaiting_final_payment') && 
                            booking.final_payment_verified !== 1 &&
                            booking.payment_method !== 'Hard Cash' &&
                            Number(booking.remaining_due || 0) >= 1;

  const setPaymentMethod = async (method) => {
    try {
      await api.post('/api/booking/payment-method', { bookingId: booking.id, method });
      if (method === 'UPI') {
        window.location.href = `/payment/${booking.id}?final=1`;
      } else {
        alert("Namaste! Counter settlement request registered. Please visit the front desk.");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("System error. Please try again.");
    }
  };

  return (
    <div className="glass group hover:-translate-y-2 hover:shadow-2xl transition-all duration-700 overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-500 ${
        booking.status === 'completed' ? 'bg-emerald-500' :
        booking.status === 'seated'    ? 'bg-indigo-500' :
        booking.status === 'awaiting_final_payment' ? 'bg-amber-500' :
        booking.status === 'confirmed' ? 'bg-blue-500' :
        booking.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'
      }`} />

      <div className="p-8 md:p-12">
        <div className="flex flex-wrap items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`${statusCfg.color} shadow-sm`}>
              <StatusIcon size={12} className="mr-2" />
              {statusCfg.label || t(statusCfg.key)}
            </span>
            {booking.booking_ref && (
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-mono">Ref: {booking.booking_ref}</span>
            )}
            {awaitingVerification && (
              <span className="badge-blue animate-pulse">
                <Clock size={12} className="mr-2" /> {t('secure_connection')}
              </span>
            )}
          </div>

          <div className="flex gap-4">
            {canPay && (
              <Link to={`/payment/${booking.id}`} className="btn-primary py-3.5 px-8 text-[9px] shadow-2xl">
                <CreditCard size={14} /> {t('authorize_booking').toUpperCase()}
              </Link>
            )}
            {canAddDishes && (
              <Link to={`/order/${booking.id}`} className="btn-secondary py-3.5 px-8 text-[9px] shadow-sm">
                <ShoppingBag size={14} /> {t('menu').toUpperCase()}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mb-10 md:mb-12">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">{t('date_label')}</p>
            <div className="flex items-center gap-3 font-bold text-[var(--theme-text)]">
              <Calendar size={20} className="text-blue-600" />
              {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">{t('time_label')}</p>
            <div className="flex items-center gap-3 font-bold text-[var(--theme-text)]">
              <Clock size={20} className="text-blue-600" />
              {booking.time_slot || '—'}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">{t('placement')}</p>
            <div className="text-3xl font-black text-blue-600 font-serif tracking-tighter">{t('table')} {booking.table_number}</div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">{t('guest_label')}</p>
            <div className="flex items-center gap-3 font-black text-[var(--theme-text)] text-2xl tracking-tighter">
              <Users size={20} className="text-blue-600" />
              {booking.guests} {t('guests')}
            </div>
          </div>
        </div>

        {booking.orders?.length > 0 && (
          <div className="bg-[var(--theme-accent)] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-[var(--theme-border)] shadow-inner">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
              <Receipt size={16} /> Culinary Orders
            </h4>
            <div className="space-y-6">
              {booking.orders.map((o, i) => (
                <div key={i} className="flex justify-between items-center text-sm font-bold">
                  <span className="text-[var(--theme-text)]">{o.quantity}× <span className="font-black text-lg font-serif">{o.name}</span></span>
                  <span className="font-black text-slate-400 tracking-widest">₹{o.total_price}</span>
                </div>
              ))}
              <div className="pt-10 border-t border-[var(--theme-border)] space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Subtotal + Tax - Disc</span>
                  <span>₹{Number(booking.bill_amount || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{t('advance_paid')}</span>
                  <span>-₹{Number(booking.adv_paid || 0).toFixed(0)}</span>
                </div>
                {Number(booking.paid_amount || 0) > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    <span>Partially Paid</span>
                    <span>-₹{Number(booking.paid_amount || 0).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end border-t border-[var(--theme-border)] pt-4 mt-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">PAYING AMOUNT (DUE)</span>
                  <span className="text-5xl font-black text-blue-600 font-serif tracking-tighter">₹{Number(booking.remaining_due || 0).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {needsFinalPayment && (
          <div className="mt-12 pt-12 border-t border-[var(--theme-border)] animate-fade-in">
            <h4 className="text-xs font-black text-[var(--theme-text)] uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
              <CreditCard size={22} className="text-blue-600" /> {t('authorize_session').toUpperCase()}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button onClick={() => setPaymentMethod('UPI')} className="btn-primary py-5 px-10 text-[10px] gap-4">
                <ShoppingBag size={20} /> PAY VIA DIGITAL BRIDGE (UPI)
              </button>
              <button onClick={() => setPaymentMethod('Hard Cash')} className="btn-secondary py-5 px-10 text-[10px] gap-4">
                <span className="text-2xl">💵</span> SETTLE AT PHYSICAL COUNTER
              </button>
            </div>
          </div>
        )}

        {booking.payment_method === 'Hard Cash' && booking.final_payment_verified !== 1 && (
          <div className="mt-12 bg-blue-600/5 border border-blue-600/10 rounded-[2.5rem] p-10 flex items-center gap-10 group/cash animate-fade-in">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl group-hover/cash:rotate-12 transition-transform duration-700">💵</div>
            <div>
              <div className="text-2xl font-black text-blue-600 tracking-tighter mb-2">Counter Settlement Active</div>
              <p className="text-sm text-slate-400 font-bold leading-relaxed tracking-tight">Namaste! Please present <span className="text-[var(--theme-text)]">₹{Number(booking.remaining_due || 0).toFixed(0)}</span> to the front desk. Your session will be finalized after admin confirmation.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, setUser } = useStore();
  const { t } = useLanguage();
  const { name: HOTEL_NAME } = useHotel();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSecurity, setShowSecurity] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true); setPassError(''); setPassSuccess('');
    try {
      const res = await api.post('/api/user/update-profile', profileForm);
      if (res.data.success) {
        setPassSuccess(res.data.message);
        setUser(res.data.user);
      } else {
        setPassError(res.data.error);
      }
    } catch (err) {
      setPassError(err.response?.data?.error || "Profile synchronization failure.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassUpdate = async (e) => {

    e.preventDefault();
    if (passForm.new !== passForm.confirm) return setPassError("New security keys do not match.");
    if (passForm.new.length < 6) return setPassError("Security key must be at least 6 characters.");
    
    setPassLoading(true); setPassError(''); setPassSuccess('');
    try {
      const res = await api.post('/api/user/update-password', {
        currentPassword: passForm.current,
        newPassword: passForm.new
      });
      if (res.data.success) {
        setPassSuccess(res.data.message);
        setPassForm({ current: '', new: '', confirm: '' });
        setTimeout(() => setShowSecurity(false), 3000);
      } else {
        setPassError(res.data.error);
      }
    } catch (err) {
      setPassError(err.response?.data?.error || "Security update interrupted.");
    } finally {
      setPassLoading(false);
    }
  };

  useEffect(() => {

    if (!user) return;
    api.get('/dashboard').then(r => {
      if (r.data.success) {
        const bks = r.data.bookings.map(b => ({
          ...b,
          orders: (r.data.ordersByBooking || {})[b.id] || [],
        }));
        setBookings(bks.sort((a, b) => b.id - a.id));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <Navigate to="/auth" />;

  const active = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const past   = bookings.filter(b =>  ['completed', 'cancelled'].includes(b.status));

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-24 md:pt-40 pb-32 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 mb-24 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-3 bg-blue-600/10 text-blue-600 mb-6 py-2 px-6 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-blue-600/20 shadow-xl">
               <Activity size={14} className="animate-pulse" /> {t('active')}
            </div>
            <h1 className="font-serif italic text-5xl md:text-8xl font-bold text-[var(--theme-text)] leading-[1] md:leading-[0.85] tracking-tighter">
              {t('welcome_msg').split(' ')[0]} <span className="text-blue-600">{user.name?.split(' ')[0]}</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => { setShowSecurity(true); setProfileForm({ name: user.name, phone: user.phone }); }} className="btn-secondary py-4 md:py-5 px-8 md:px-10 text-[9px] md:text-[10px] gap-3 md:gap-4 border-blue-600/20 text-blue-600 w-full sm:w-auto flex justify-center text-center">
              <Shield size={18} md:size={20} /> IDENTITY & SECURITY
            </button>
            <Link to="/history" className="btn-secondary py-4 md:py-5 px-8 md:px-10 text-[9px] md:text-[10px] gap-3 md:gap-4 w-full sm:w-auto flex justify-center text-center">
              <History size={18} md:size={20} /> VISIT HISTORY
            </Link>
            <Link to="/booking" className="btn-primary py-4 md:py-5 px-8 md:px-10 text-[9px] md:text-[10px] gap-3 md:gap-4 shadow-2xl w-full sm:w-auto flex justify-center text-center">
              <Plus size={18} md:size={20} /> {t('book_now').toUpperCase()}
            </Link>
          </div>
        </header>

        {showSecurity && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/85 backdrop-blur-2xl animate-fade-in">
            <div className="glass w-full max-w-5xl p-8 md:p-12 relative overflow-y-auto max-h-[95vh] border-2 border-blue-600/10 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Shield size={140} className="text-blue-600" />
              </div>
              
              <div className="flex justify-between items-center mb-10 border-b border-[var(--theme-border)] pb-6">
                <div>
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] mb-1.5">Sovereign Security Shield</h3>
                  <p className="text-2xl md:text-3xl font-black tracking-tighter text-[var(--theme-text)]">Account Shield & Security Center</p>
                </div>
                <button onClick={() => setShowSecurity(false)} className="w-12 h-12 rounded-full bg-[var(--theme-accent)] flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-[var(--theme-border)]">
                  <X size={20} />
                </button>
              </div>

              {passError && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl p-5 mb-8 text-[10px] font-black uppercase tracking-widest text-center animate-shake">{passError}</div>}
              {passSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl p-5 mb-8 text-[10px] font-black uppercase tracking-widest text-center">{passSuccess}</div>}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Score & Overview */}
                <div className="lg:col-span-5 bg-[var(--theme-accent)] rounded-[2rem] p-8 border border-[var(--theme-border)] flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-md">
                        <Shield size={24} />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit">
                          🔒 PROTECTED
                        </div>
                        <h4 className="text-base font-black text-[var(--theme-text)] mt-1">Sovereign Protection Active</h4>
                      </div>
                    </div>

                    <div className="py-8 border-y border-[var(--theme-border)] flex flex-col items-center justify-center text-center">
                      <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin duration-3000">
                        <div className="absolute w-24 h-24 rounded-full bg-[var(--theme-panel)] flex flex-col items-center justify-center border border-[var(--theme-border)]">
                          <span className="text-3xl font-serif font-black text-emerald-500 tracking-tighter">100%</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">SECURE</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">Sovereign Security Score</p>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Identity & Diagnostics Log</h5>
                      <div className="space-y-2">
                        {[
                          { label: 'Registered Email', value: user?.email || 'N/A' },
                          { label: 'Role Authority', value: 'Guest Customer' },
                          { label: 'System TLS Bridge', value: 'Sovereign SSL/TLS 1.3' },
                          { label: 'Client Node IP', value: '127.0.0.1 (Localhost)' }
                        ].map((d, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 px-4 bg-[var(--theme-panel)] rounded-xl border border-[var(--theme-border)] text-[9px] font-black">
                            <span className="text-slate-400 uppercase tracking-widest">{d.label}</span>
                            <span className="text-[var(--theme-text)] truncate max-w-[180px]">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-40 text-center leading-relaxed">
                    Designed to comply with international Google/Microsoft identity security architecture standards.
                  </p>
                </div>

                {/* Right Side: Identity Sync & Password Rotation */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Identity Sync Card */}
                  <div className="glass p-8 rounded-[2rem] border-[var(--theme-border)] space-y-6">
                    <h4 className="text-[11px] font-black text-[var(--theme-text)] uppercase tracking-[0.3em] flex items-center gap-3">
                      <User size={18} className="text-blue-600" /> BIOLOGICAL DESIGNATION & PHONE
                    </h4>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">biological name</label>
                          <div className="relative group">
                            <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                              type="text" 
                              value={profileForm.name} 
                              onChange={e => setProfileForm(p => ({...p, name: e.target.value}))}
                              className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-xl py-4 pl-14 pr-4 font-black text-xs outline-none focus:border-blue-600 transition-colors"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">phone link</label>
                          <div className="relative group">
                            <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                              type="tel" 
                              value={profileForm.phone} 
                              onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))}
                              className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-xl py-4 pl-14 pr-4 font-black text-xs outline-none focus:border-blue-600 transition-colors"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <button type="submit" disabled={profileLoading} className="w-full btn-secondary py-4 rounded-xl shadow-md text-[9px] font-black tracking-widest uppercase flex items-center justify-center gap-3">
                        {profileLoading ? <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" /> : <><Save size={14} /> SYNC SECURE IDENTITY</>}
                      </button>
                    </form>
                  </div>

                  {/* Password Rotation Card */}
                  <div className="glass p-8 rounded-[2rem] border-[var(--theme-border)] space-y-6">
                    <h4 className="text-[11px] font-black text-[var(--theme-text)] uppercase tracking-[0.3em] flex items-center gap-3">
                      <Key size={18} className="text-blue-600" /> MASTER KEY ROTATION
                    </h4>
                    <form onSubmit={handlePassUpdate} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">current secure key</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                          <input 
                            type={showPass.current ? 'text' : 'password'} 
                            value={passForm.current} 
                            onChange={e => setPassForm(p => ({...p, current: e.target.value}))}
                            className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-xl py-4 pl-14 pr-14 font-black tracking-widest text-xs outline-none focus:border-blue-600 transition-colors"
                            required
                          />
                          <button type="button" onClick={() => setShowPass(s => ({...s, current: !s.current}))} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors">
                            {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">new secure key</label>
                          <div className="relative group">
                            <Key size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                              type={showPass.new ? 'text' : 'password'} 
                              value={passForm.new} 
                              onChange={e => setPassForm(p => ({...p, new: e.target.value}))}
                              className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-xl py-4 pl-14 pr-14 font-black tracking-widest text-xs outline-none focus:border-blue-600 transition-colors"
                              required
                            />
                            <button type="button" onClick={() => setShowPass(s => ({...s, new: !s.new}))} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors">
                              {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">confirm new key</label>
                          <div className="relative group">
                            <Key size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                              type={showPass.confirm ? 'text' : 'password'} 
                              value={passForm.confirm} 
                              onChange={e => setPassForm(p => ({...p, confirm: e.target.value}))}
                              className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-xl py-4 pl-14 pr-14 font-black tracking-widest text-xs outline-none focus:border-blue-600 transition-colors"
                              required
                            />
                            <button type="button" onClick={() => setShowPass(s => ({...s, confirm: !s.confirm}))} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors">
                              {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button type="submit" disabled={passLoading} className="w-full btn-primary py-4 rounded-xl shadow-2xl text-[9px] font-black tracking-widest uppercase flex items-center justify-center gap-3">
                        {passLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> ROTATE SOVEREIGN KEYS</>}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mb-20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {[
            { label: 'Total Narratives',  value: bookings.length, color: 'text-[var(--theme-text)]' },
            { label: 'Active Sessions',    value: active.length,   color: 'text-blue-600' },
            { label: 'Visits Fulfilled',   value: past.filter(b => b.status === 'completed').length, color: 'text-emerald-500' },
          ].map(s => (
            <div key={s.label} className="glass p-8 md:p-12 flex flex-col items-center hover:-translate-y-2 transition-all duration-700 group">
              <div className={`text-5xl md:text-6xl font-black mb-3 md:mb-4 tracking-tighter group-hover:scale-110 transition-transform ${s.color}`}>{s.value}</div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] md:tracking-[0.5em]">{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => <div key={i} className="glass h-[600px] animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass py-48 text-center border-dashed border-2 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Calendar size={100} className="mx-auto mb-10 text-slate-200" />
            <h3 className="text-4xl font-black text-[var(--theme-text)] mb-6 tracking-tighter uppercase">Your culinary log is clear</h3>
            <p className="text-slate-400 text-xl mb-16 font-bold tracking-tight max-w-lg mx-auto">Namaste! Initialize your first experience at {HOTEL_NAME} today.</p>
            <Link to="/booking" className="btn-primary py-8 px-20 text-lg w-fit mx-auto shadow-2xl">
              <Plus size={28} /> {t('book_now').toUpperCase()}
            </Link>
          </div>
        ) : (
          <div className="space-y-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {active.length > 0 && (
              <div className="space-y-12">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] ml-8">Live Reservations</h2>
                <div className="space-y-10">
                   {active.map(b => <BookingCard key={b.id} booking={b} onRefresh={() => window.location.reload()} t={t} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-12">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] ml-8 opacity-40">Culinary History</h2>
                <div className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000 space-y-10">
                  {past.map(b => <BookingCard key={b.id} booking={b} onRefresh={() => window.location.reload()} t={t} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
