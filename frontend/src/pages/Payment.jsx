import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QrCode, CheckCircle, Clock, ArrowRight, CreditCard, ShieldCheck, Activity, Sparkles } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import useStore from '../store/useStore';
import { useLanguage } from '../context/LanguageContext';

const ADV_AMOUNT = 500; 

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const { t } = useLanguage();

  const [booking, setBooking] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [fuzzyAmount, setFuzzyAmount] = useState(null);
  const [utr, setUtr] = useState('');
  const [step, setStep] = useState('pay'); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState(ADV_AMOUNT);
  const [showManual, setShowManual] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); 
  const [timerActive, setTimerActive] = useState(true);
  const [monitorOnline, setMonitorOnline] = useState(true);

  useEffect(() => {
    const checkMonitor = async () => {
      try {
        const res = await api.get('/api/monitor-status');
        setMonitorOnline(res.data.active ?? res.data.online);
      } catch {
        setMonitorOnline(false);
      }
    };
    checkMonitor();
    const interval = setInterval(checkMonitor, 30000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (!bookingId || !user?.id) return;
    socket.connect();
    socket.emit('join_user', { userId: user.id });
    
    const handleUpdate = (data) => {
      if (Number(data.bookingId) === Number(bookingId)) {
        const isFinal = booking?.status === 'awaiting_final_payment' || booking?.status === 'completed' || booking?.status === 'seated';
        const targetStatus = isFinal ? 'completed' : 'confirmed';
        if (data.status === targetStatus) {
          setStep('verified');
          setTimerActive(false);
        }
      }
    };
    
    socket.on('booking_update', handleUpdate);
    return () => {
      socket.off('booking_update', handleUpdate);
      socket.disconnect();
    };
  }, [bookingId, user, booking]);

  useEffect(() => {
    if (!timerActive || step !== 'pay') return;
    const interval_timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval_timer);
          setTimerActive(false);
          setShowManual(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval_timer);
  }, [timerActive, step]);

  useEffect(() => {
    if (step !== 'pay' || !bookingId) return;
    const interval_status = setInterval(async () => {
      try {
        const res = await api.get(`/api/booking/${bookingId}`);
        if (res.data.success) {
          const b = res.data.booking;
          const isFinal = b.status === 'awaiting_final_payment' || b.status === 'completed' || b.status === 'seated';
          const isVerified = isFinal ? b.final_payment_verified === 1 : b.payment_verified === 1;
          if (isVerified) {
            setStep('verified');
            setTimerActive(false);
            clearInterval(interval_status);
          }
        }
      } catch (err) { 
        if (err.response?.status === 401) {
          clearInterval(interval_status);
          navigate('/auth');
        }
      }
    }, 30000);
    return () => clearInterval(interval_status);
  }, [step, bookingId, navigate]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
  }, [user, navigate]);

  useEffect(() => {
    if (!bookingId || !user) return;
    const init = async () => {
      try {
        const bRes = await api.get(`/api/booking/${bookingId}`);
        if (bRes.data.success) {
          const b = bRes.data.booking;
          setBooking(b);
          const isFinal = b.status === 'awaiting_final_payment' || b.status === 'completed' || b.status === 'seated';
          const payAmount = isFinal ? Math.max(0, Number(b.bill_amount || 0) - Number(b.adv_paid || 0)) : ADV_AMOUNT;
          const payType = isFinal ? 'final' : 'advance';
          const qrRes = await api.post('/create-qr', { amount: payAmount, bookingId, type: payType });
          if (qrRes.data.qrData) {
            setQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrRes.data.qrData)}`);
            const fa = qrRes.data.fuzzyAmount || qrRes.data.amount;
            setFuzzyAmount(fa);
            setAmount(fa); 
          }
        }
      } catch {
        setError('Gateway synchronization failed.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [bookingId, user]);

  const handleSubmitUTR = async (e) => {
    e.preventDefault();
    if (!utr.trim() || utr.trim().length < 6) {
      setError('Invalid booking ID.');
      return;
    }
    setError(''); setSubmitting(true);
    try {
      await api.post('/api/submit-payment', {
        bookingId: Number(bookingId),
        amount,
        utrNumber: utr.trim(),
        method: 'UPI',
      });
      setStep('submitted');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission sequence interrupted.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (step === 'submitted' || step === 'verified') return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--theme-bg)] transition-colors duration-500">
      <div className="cloud-card max-w-2xl w-full p-16 md:p-24 text-center shadow-2xl animate-fade-in relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           {step === 'verified' ? <CheckCircle size={150} /> : <Clock size={150} />}
        </div>
        <div className={`w-28 h-28 ${step === 'verified' ? 'bg-emerald-500' : 'bg-blue-600'} rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-blue-500/20`}>
          {step === 'verified' ? <CheckCircle size={56} className="text-white" /> : <Clock size={56} className="text-white animate-pulse" />}
        </div>
        <h2 className="font-serif italic text-6xl font-bold mb-8 text-[var(--theme-text)] leading-tight">
          {step === 'verified' ? t('verified_msg') : t('pending_msg')}
        </h2>
        <p className="text-slate-400 dark:text-slate-500 text-xl mb-16 font-bold tracking-tight leading-relaxed max-w-lg mx-auto">
          {step === 'verified' 
            ? t('verified_desc')
            : t('pending_desc').replace('{utr}', utr)}
        </p>
        <div className="space-y-6">
          <Link to="/dashboard" className="btn-primary w-full py-7 rounded-2xl shadow-2xl">
            {t('dashboard').toUpperCase()} <ArrowRight size={24} />
          </Link>
          <Link to="/" className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center gap-4 group">
             <div className="w-12 h-px bg-[var(--theme-border)] group-hover:w-20 group-hover:bg-blue-600 transition-all" />
             {t('home').toUpperCase()}
             <div className="w-12 h-px bg-[var(--theme-border)] group-hover:w-20 group-hover:bg-blue-600 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-40 pb-32 px-6 sm:px-12 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        <header className="text-center mb-24 relative">
          <div className="inline-flex items-center gap-3 bg-blue-600/10 text-blue-600 mb-8 py-3 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-blue-600/20 shadow-xl animate-fade-in">
             <ShieldCheck size={14} className="animate-pulse" /> {t('secure_connection')}
          </div>
          <h1 className="font-serif italic text-7xl md:text-[10rem] font-bold mb-10 text-[var(--theme-text)] leading-[0.8] tracking-tighter animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t('payment_header').split(' ')[0]} <span className="text-blue-600">{t('payment_header').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-xl md:text-2xl max-w-3xl mx-auto font-bold tracking-tight leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {t('payment_subtitle')}
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Reservation Details (Left) */}
          <div className="lg:col-span-4 space-y-10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="cloud-card p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <CreditCard size={120} />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12">Session Architecture</h3>
              {booking && (
                <div className="space-y-10">
                  <div className="group/item">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 group-hover/item:text-blue-600 transition-colors">{t('session_ref')}</p>
                    <p className="font-mono font-black text-xl text-[var(--theme-text)] tracking-tighter">{booking.booking_ref}</p>
                  </div>
                  <div className="group/item">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 group-hover/item:text-blue-600 transition-colors">{t('temporal_window')}</p>
                    <p className="font-black text-2xl text-[var(--theme-text)] tracking-tighter font-serif">
                       {new Date(booking.booking_date).toLocaleDateString('en-GB', {day:'numeric',month:'long'})} <span className="text-slate-400 dark:text-slate-600">@</span> {booking.time_slot}
                    </p>
                  </div>
                  <div className="flex justify-between items-end pt-10 border-t border-[var(--theme-border)]">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">{t('placement')}</p>
                       <p className="font-black text-4xl text-blue-600 font-serif tracking-tighter">{t('table')} {booking.table_number}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">{t('attendance')}</p>
                       <p className="font-black text-2xl text-[var(--theme-text)] tracking-tighter">{booking.guests} {t('guests')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!monitorOnline && (
              <div className="bg-blue-600/5 border border-blue-600/10 rounded-[2.5rem] p-10 flex items-start gap-8 group/alert">
                <Activity size={32} className="text-blue-600 shrink-0 group-hover/alert:scale-110 transition-transform" />
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-3">Live Monitor Latency</p>
                  <p className="text-sm text-slate-400 font-bold leading-relaxed tracking-tight">Auto-verification is currently delayed. You can enter your UTR number below for faster processing.</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Terminal (Right) */}
          <div className="lg:col-span-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="cloud-card p-12 md:p-20 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col xl:flex-row items-center gap-20">
                <div className="text-center space-y-10">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 inline-block shadow-2xl group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    {qrImage ? (
                      <img src={qrImage} alt="UPI QR" className="w-64 h-64 object-contain transition-transform group-hover:scale-110 duration-[2s] relative z-10" />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center opacity-10"><QrCode size={100} /></div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Authorization Total</p>
                    <p className="text-7xl font-black text-blue-600 font-serif tracking-tighter">₹{fuzzyAmount || amount}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-12 w-full">
                  {!showManual ? (
                    <div className="bg-[var(--theme-accent)] rounded-[3rem] p-12 border border-[var(--theme-border)] text-center space-y-10 group/timer">
                      <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 group-hover/timer:rotate-12 transition-transform duration-700">
                        <Clock size={40} className="text-white animate-pulse" />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-2xl font-black text-[var(--theme-text)] uppercase tracking-tighter">
                          {timeLeft > 0 ? `CHECKING PAYMENT... ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : t('manual_override')}
                        </h4>
                        <p className="text-sm text-slate-400 font-bold leading-relaxed tracking-tight px-10">We are checking for your payment. This is automatic.</p>
                      </div>
                      <button onClick={() => setShowManual(true)} className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] hover:tracking-[0.6em] transition-all">ENTER UTR MANUALLY</button>
                    </div>
                  ) : (
                    <div className="space-y-10 animate-fade-in">
                      <div className="space-y-4">
                        <h4 className="text-3xl font-black text-[var(--theme-text)] tracking-tighter uppercase">Manual Authorization</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Initialize manual link via 12-digit UPI Identifier (UTR)</p>
                      </div>

                      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl p-8 text-[10px] font-black uppercase tracking-[0.3em] text-center animate-shake">{error}</div>}

                      <form onSubmit={handleSubmitUTR} className="space-y-8">
                        <div className="group/input relative">
                           <input
                            type="text"
                            placeholder="TRANSACTION ID (UTR)"
                            value={utr}
                            onChange={e => { setUtr(e.target.value); setError(''); }}
                            className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] focus:ring-8 focus:ring-blue-600/5 py-8 px-12 font-mono text-2xl font-black tracking-[0.3em] rounded-[2.5rem] outline-none text-center"
                            required
                          />
                        </div>
                        <button type="submit" disabled={submitting || !utr.trim()} className="w-full btn-primary py-8 rounded-[2rem] shadow-2xl group/btn">
                          {submitting ? (
                             <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>{t('authorize_session').toUpperCase()} <ArrowRight size={24} className="group-hover/btn:translate-x-3 transition-transform" /></>
                          )}
                        </button>
                        <button type="button" onClick={() => setShowManual(false)} className="w-full text-[11px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em] hover:text-blue-600 transition-colors">SYNCHRONIZING WITH LIVE GATEWAY...</button>
                      </form>
                    </div>
                  )}
                  
                  <div className="pt-12 border-t border-[var(--theme-border)] flex flex-col items-center gap-8">
                    <button onClick={() => navigate('/dashboard')} className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] hover:text-blue-600 transition-all flex items-center gap-4 group/desk">
                       <div className="w-12 h-px bg-[var(--theme-border)] group-hover/desk:w-20 group-hover/desk:bg-blue-600 transition-all" />
                       SETTLE AT PHYSICAL DESK
                       <div className="w-12 h-px bg-[var(--theme-border)] group-hover/desk:w-20 group-hover/desk:bg-blue-600 transition-all" />
                    </button>
                    <p className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] opacity-40">
                      <Sparkles size={10} /> Secure Encryption Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
