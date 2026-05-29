import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import api from '../../services/api';
import { useHotel } from '../../hooks/useHotel';
import socket from '../../services/socket';
import {
  Activity,
  Zap,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  Check,
  X,
  Phone,
  Mail,
  Grid
} from 'lucide-react';

export default function PendingPayments() {
  const { isAdmin, isAdminLoading } = useStore();
  const { name: HOTEL_NAME } = useHotel();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [monitorStatus, setMonitorStatus] = useState({ active: false, serverIp: '...' });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/api/admin/payments');
      setPayments(res.data?.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMonitorStatus = useCallback(async () => {
    try {
      const res = await api.get('/api/monitor-status');
      setMonitorStatus(res.data || { active: false, serverIp: '...' });
    } catch {
      setMonitorStatus(prev => ({ ...prev, active: false }));
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    Promise.resolve().then(() => {
      fetchPayments();
      fetchMonitorStatus();
    });

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    const handleBookingUpdate = () => {
      fetchPayments(true);
    };

    const handleMonitorUpdate = (data) => {
      if (data) setMonitorStatus(prev => ({ ...prev, ...data }));
    };

    socket.on('booking_update', handleBookingUpdate);
    socket.on('monitor_update', handleMonitorUpdate);

    return () => {
      clearInterval(interval);
      socket.off('booking_update', handleBookingUpdate);
      socket.off('monitor_update', handleMonitorUpdate);
    };
  }, [isAdmin, fetchPayments, fetchMonitorStatus]);

  const verifyPayment = async (bookingId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this payment request?`)) return;
    try {
      await api.post('/api/admin/verify-payment', { bookingId, status });
      fetchPayments(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Identity Verification Error');
    }
  };

  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin/login" />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const filteredPayments = pendingPayments.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      (p.user_name || '').toLowerCase().includes(term) ||
      (p.booking_ref || '').toLowerCase().includes(term) ||
      (p.transaction_id || '').toLowerCase().includes(term) ||
      (p.user_phone || '').includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pb-24 text-[var(--theme-text)] font-sans antialiased">
      {/* HEADER BAR */}
      <header className="border-b border-[var(--theme-border)] bg-[var(--theme-panel)]/50 backdrop-blur-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-3 bg-[var(--theme-accent)] hover:bg-[var(--theme-border)] rounded-2xl transition-all hover:scale-105 active:scale-95 text-slate-500 hover:text-[var(--theme-text)] border border-[var(--theme-border)]">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h1 className="text-xl font-black tracking-tight font-serif italic">Pending Payments Gateway</h1>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{HOTEL_NAME} Sovereign Panel</p>
            </div>
          </div>
          <button
            onClick={() => fetchPayments()}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-accent)] hover:bg-[var(--theme-border)] rounded-xl border border-[var(--theme-border)] text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-8">
        {/* CONNECTION STATUS & SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Status Alert */}
          <div className="md:col-span-8">
            {!monitorStatus.active ? (
              <div className="cloud-card p-6 border-rose-500/20 bg-rose-500/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-lg font-black text-rose-500 uppercase tracking-tight flex items-center gap-2">
                    <Zap size={18} /> Payment Monitor Disconnected
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 max-w-xl leading-relaxed">
                    Verify that the companion app is running with background execution permissions enabled.
                  </p>
                </div>
                <div className="bg-[var(--theme-accent)] px-4 py-2.5 rounded-xl border border-[var(--theme-border)]">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">App Configuration URL</p>
                  <p className="text-xs font-black text-blue-600 font-mono select-all tracking-wider">{monitorStatus.serverIp}</p>
                </div>
              </div>
            ) : (
              <div className="cloud-card p-6 border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                    <Zap size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--theme-text)] tracking-tight">Active Gateway Sync Online</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Real-time payment logs streaming successfully.</p>
                  </div>
                </div>
                <Sparkles size={16} className="text-emerald-500/30 animate-pulse" />
              </div>
            )}
          </div>

          {/* Metric Widget */}
          <div className="md:col-span-4 cloud-card p-6 flex flex-col justify-between">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Awaiting Verification</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black font-serif italic text-amber-500">{pendingPayments.length}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Requests</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS DOCK */}
        <div className="glass p-6 border-[var(--theme-border)]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Guest Name, Booking Ref, Phone or UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-500"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <Activity size={16} />
            </div>
          </div>
        </div>

        {/* LISTINGS */}
        {filteredPayments.length === 0 ? (
          <div className="cloud-card py-24 text-center border border-[var(--theme-border)]">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black font-serif italic tracking-tight mb-2">Queue Fully Cleared</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No pending payment authorizations found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPayments.map(p => {
              const waitTime = Math.round((currentTime.getTime() - new Date(p.created_at).getTime()) / 60000);
              return (
                <div key={p.id} className="glass p-6 border border-[var(--theme-border)] hover:border-amber-500/30 transition-all bg-[var(--theme-panel)] relative overflow-hidden flex flex-col justify-between group shadow-xl">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded uppercase tracking-tighter border border-amber-500/10">REF: {p.booking_ref}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> {waitTime > 0 ? `${waitTime}m ago` : 'just now'}
                          </span>
                        </div>
                        <h4 className="text-lg font-black tracking-tight font-serif italic text-[var(--theme-text)]">{p.user_name || 'Guest'}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-amber-500 font-serif tracking-tighter">₹{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{p.method}</div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    {p.transaction_id && (
                      <div className="mb-4 p-3 bg-[var(--theme-bg)] rounded-xl border border-[var(--theme-border)]">
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">UTR / Transaction ID</div>
                        <div className="text-[10px] font-bold text-blue-600 tracking-wider break-all font-mono">{p.transaction_id}</div>
                      </div>
                    )}

                    {/* Metadata Card */}
                    {(p.user_phone || p.user_email || p.table_number) && (
                      <div className="mb-6 p-4 bg-[var(--theme-accent)] rounded-xl border border-[var(--theme-border)] space-y-2.5 text-[9px] font-black tracking-wide text-slate-400">
                        {p.user_phone && (
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><Phone size={10} /> PHONE</span>
                            <span className="text-[var(--theme-text)] font-bold">{p.user_phone}</span>
                          </div>
                        )}
                        {p.user_email && (
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><Mail size={10} /> EMAIL</span>
                            <span className="text-[var(--theme-text)] font-bold truncate max-w-[160px]">{p.user_email}</span>
                          </div>
                        )}
                        {p.table_number && (
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><Grid size={10} /> PLACEMENT</span>
                            <span className="text-blue-600 font-bold">Table {p.table_number} ({p.guests} Guests)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-[var(--theme-border)] mt-auto">
                    <button
                      onClick={() => verifyPayment(p.booking_id, 'approve')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-500 transition-all shadow-md active:scale-95"
                    >
                      <Check size={12} /> APPROVE
                    </button>
                    <button
                      onClick={() => verifyPayment(p.booking_id, 'reject')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                    >
                      <X size={12} /> REJECT
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
