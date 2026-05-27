import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useHotel } from '../../hooks/useHotel';

import {
  LayoutDashboard,
  ChefHat,
  RefreshCw,
  History,
  Utensils,
  TrendingUp,
  Activity,
  Wifi,
  WifiOff,
  Server,
  Zap,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Package,
  MessageSquare,
  UserPlus,
  Search,
  SearchX,
  X,
  Shield,
  Trash2,
  Printer,
  Clock,
  BrainCircuit,
  TerminalSquare,
  Flame
} from 'lucide-react';


import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

import socket from '../../services/socket';

const statusClass = (s) =>
({
  pending: 'badge-amber',
  confirmed: 'badge-blue',
  seated: 'badge-blue',
  awaiting_final_payment: 'badge-amber',
  completed: 'badge-emerald',
  cancelled: 'badge-rose',
  unmatched: 'badge-rose'
}[s] || 'badge-blue');

export default function AdminDashboard() {
  const { isAdmin, isAdminLoading } = useStore();
  const { theme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { name: HOTEL_NAME } = useHotel();

  const safeParse = (key, fallback = []) => {
    try {
      const data = localStorage.getItem(key);
      return data && data !== 'undefined' ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  };

  const [tables, setTables] = useState(() => safeParse('admin_tables'));
  const [bookings, setBookings] = useState(() => safeParse('admin_bookings'));
  const [payments, setPayments] = useState(() => safeParse('admin_payments'));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [monitorStatus, setMonitorStatus] = useState({ active: false, serverIp: '...' });
  const [staff, setStaff] = useState([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffSalary, setNewStaffSalary] = useState('');
  const [statsData, setStatsData] = useState({

    dailyRevenue: [],
    popularDishes: [],
    todayStats: {
      onlineRevenue: 0,
      cashRevenue: 0,
      walkInCount: 0,
      onlineBookingCount: 0
    },
    auditData: []
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [checkoutDiscount, setCheckoutDiscount] = useState('');
  
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsData, setSmsData] = useState({ phone: '', message: '' });
  const [analyticsTab, setAnalyticsTab] = useState('revenue');
  const [showAuditLedger, setShowAuditLedger] = useState(false);
  const [showSearchSuite, setShowSearchSuite] = useState(false);
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const fetchMonitorStatus = async () => {
    try {
      const res = await api.get('/api/monitor-status');
      setMonitorStatus(res.data || { active: false, serverIp: '...' });
    } catch {
      setMonitorStatus(prev => ({ ...prev, active: false }));
    }
  };

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const [tr, br, sr, pr, str] = await Promise.all([
          api.get('/api/admin/tables'),
          api.get('/api/admin/bookings'),
          api.get('/api/admin/stats'),
          api.get('/api/admin/payments'),
          api.get('/api/admin/staff')
        ]);

        setTables(tr.data?.tables || []);
        setBookings(br.data?.bookings || []);
        setPayments(pr.data?.payments || []);
        setStaff(str.data?.staff || []);
        setStatsData({
          dailyRevenue: sr.data?.dailyRevenue || [],
          popularDishes: sr.data?.popularDishes || [],
          busiestHours: sr.data?.busiestHours || [],
          todayStats: sr.data?.todayStats || {
            onlineRevenue: 0,
            cashRevenue: 0,
            walkInCount: 0,
            onlineBookingCount: 0
          },
          auditData: [] // To be fetched below
        });

        const aur = await api.get('/api/admin/stats/monthly-audit');
        if (aur.data.success) {
          // Merge revenue and costs by month
          const months = [...new Set([...aur.data.revenue.map(r => r.month), ...aur.data.costs.map(c => c.month)])].sort();
          const merged = months.map(m => {
            const rev = aur.data.revenue.find(r => r.month === m) || {};
            const cos = aur.data.costs.find(c => c.month === m) || {};
            const totalRev = Number(rev.total_revenue || 0);
            const totalCos = Number(cos.total_cost || 0);
            return {
              month: m,
              revenue: totalRev,
              walkin_revenue: Number(rev.walkin_revenue || 0),
              online_revenue: Number(rev.online_revenue || 0),
              bookings: Number(rev.total_bookings || 0),
              cost: totalCos,
              grocery_cost: Number(cos.grocery_cost || 0),
              commodity_cost: Number(cos.commodity_cost || 0),
              utility_cost: Number(cos.utility_cost || 0),
              staff_cost: Number(cos.staff_cost || 0),
              profit: totalRev - totalCos,

              margin: totalRev > 0 ? (((totalRev - totalCos) / totalRev) * 100).toFixed(1) : 0
            };
          });
          setStatsData(prev => ({ ...prev, auditData: merged }));
        }

        localStorage.setItem('admin_tables', JSON.stringify(tr.data?.tables || []));
        localStorage.setItem('admin_bookings', JSON.stringify(br.data?.bookings || []));
        localStorage.setItem('admin_payments', JSON.stringify(pr.data?.payments || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const initialFetchTimer = setTimeout(() => {
      fetchData();
      fetchMonitorStatus();
    }, 0);
    const monitorInterval = setInterval(fetchMonitorStatus, 30000);
    const dataInterval    = setInterval(() => fetchData(true), 60000);
    socket.connect();
    socket.emit('join_admin');
    const handleBookingUpdate   = () => fetchData(true);
    const handleDishUpdate      = () => fetchData(true);
    const handleWarehouseUpdate = () => fetchData(true);
    const handleTableUpdate     = () => fetchData(true);
    socket.on('booking_update',   handleBookingUpdate);
    socket.on('dish_update',      handleDishUpdate);
    socket.on('warehouse_update', handleWarehouseUpdate);
    socket.on('table_update',     handleTableUpdate);
    socket.on('monitor_update', (data) => data && setMonitorStatus(prev => ({ ...prev, ...data })));
    return () => {
      clearTimeout(initialFetchTimer);
      clearInterval(monitorInterval);
      clearInterval(dataInterval);
      socket.off('booking_update',   handleBookingUpdate);
      socket.off('dish_update',      handleDishUpdate);
      socket.off('warehouse_update', handleWarehouseUpdate);
      socket.off('table_update',     handleTableUpdate);
      socket.off('monitor_update');
      socket.disconnect();
    };
  }, [fetchData, isAdmin]);

  const updateTable = async (id, status) => {
    try {
      await api.post('/api/admin/update-table', { id, status });
      fetchData(true);
    } catch { alert('Authorization Sequence Interrupted'); }
  };

  const updateBooking = async (bookingId, status) => {
    try {
      await api.post('/api/admin/update-status', { bookingId, status });
      fetchData(true);
    } catch (err) { alert(err.response?.data?.error || 'Failed to authorize state change'); }
  };

  const verifyPayment = async (bookingId, status) => {
    try {
      await api.post('/api/admin/verify-payment', { bookingId, status });
      fetchData(true);
    } catch { alert('Identity Verification Error'); }
  };

  const openCheckout = async (booking) => {
    setCheckoutDiscount('');
    try {
      const res = await api.get(`/api/admin/checkout-preview/${booking.id}`);
      if (res.data.success) {
        setCheckoutModal({
          ...booking,
          subtotal: res.data.subtotal,
          gst: res.data.gst,
          paperlessDiscount: res.data.paperlessDiscount,
          loyaltyDiscount: res.data.loyaltyDiscount,
          loyaltyTier: res.data.loyaltyTier,
          adv_paid: res.data.advPaid
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load checkout preview');
    }
  };

  const executeCheckout = async () => {
    if (!checkoutModal) return;
    try {
      const res = await api.post('/api/admin/checkout', {
        bookingId: checkoutModal.id,
        discount: parseFloat(checkoutDiscount) || 0
      });
      if (res.data.breakdown) {
        const bd = res.data.breakdown;
        alert(`✅ Settlement Authorized\n\nSubtotal: ₹${bd.subtotal.toFixed(2)}\nGST (18%): ₹${bd.gst.toFixed(2)}\nLoyalty Discount (${bd.loyaltyTier}): -₹${bd.loyaltyDiscount.toFixed(2)}\nDiscount: -₹${bd.customDiscount.toFixed(2)}\nPaperless Discount: -₹${bd.paperlessDiscount.toFixed(2)}\n─────────────\nTotal: ₹${bd.totalPayable.toFixed(2)}\nAdvance Paid: -₹${bd.advPaid.toFixed(2)}\n─────────────\nFinal Due: ₹${bd.finalBillDue.toFixed(2)}`);
      }
      setCheckoutModal(null);
      fetchData(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Checkout Authorization Failed';
      alert(msg);
    }
  };

  const payAtCounter = async (bookingId) => {
    try {
      await api.post('/api/admin/pay-at-counter', { bookingId });
      fetchData(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Payment processing failed';
      alert(msg);
    }
  };

  const addTable = async () => {
    const name = prompt('Enter Table Name (e.g. 10):');
    const cap = prompt('Enter Capacity (e.g. 4):');
    if (!name || !cap) return;
    try {
      await api.post('/api/admin/tables', { table_name: name, capacity: cap, status: 'available' });
      fetchData(true);
    } catch { alert('Failed to manifest table'); }
  };

  const editTable = async (t) => {
    const name = prompt('New Table Name:', t.table_name);
    const cap = prompt('New Capacity:', t.capacity);
    if (!name || !cap) return;
    try {
      await api.put(`/api/admin/tables/${t.id}`, { table_name: name, capacity: cap });
      fetchData(true);
    } catch { alert('Failed to update table metadata'); }
  };

  const deleteTable = (id) => {
    setConfirmAction({
      title: 'Erase Floor Table?',
      message: 'Are you sure you want to permanently remove this physical table placement from the floor map? Reservation linkages may be affected.',
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/tables/${id}`);
          fetchData(true);
        } catch (err) { 
          alert(err.response?.data?.error || 'Failed to erase table'); 
        }
      }
    });
  };

  const addStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffSalary) return;
    try {
      await api.post('/api/admin/staff', { name: newStaffName, salary: newStaffSalary });
      setNewStaffName('');
      setNewStaffSalary('');
      fetchData(true);
    } catch { alert('Failed to generate staff identity'); }
  };


  const deleteStaff = (id) => {
    setConfirmAction({
      title: 'Revoke Staff Access?',
      message: 'Are you sure you want to permanently revoke this staff identity and active portal authentication credentials? This action is immediate.',
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/staff/${id}`);
          fetchData(true);
        } catch { 
          alert('Failed to revoke identity'); 
        }
      }
    });
  };

  const handleCustomerSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearchLoading(true);
    try {
      const res = await api.get(`/api/admin/search-customer?query=${searchQuery}`);
      if (res.data.success) {
        setSearchResults(res.data);
      }
    } catch {
      alert('Intelligence sequence interrupted.');
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleUserBan = async (userId, currentlyBanned) => {
    const actionWord = currentlyBanned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${actionWord} this guest? Banning will automatically cancel all of their active bookings.`)) return;
    try {
      const res = await api.post(`/api/admin/users/${userId}/toggle-ban`);
      if (res.data.success) {
        alert(`Guest successfully ${res.data.is_banned ? 'banned' : 'unbanned'}.`);
        const refreshRes = await api.get(`/api/admin/search-customer?query=${searchQuery}`);
        if (refreshRes.data.success) {
          setSearchResults(refreshRes.data);
        }
      }
    } catch {
      alert('Failed to update ban status.');
    }
  };

  const sendManualSms = async (e) => {
    e.preventDefault();
    if (!smsData.phone || !smsData.message) return;
    try {
      await api.post('/api/admin/send-sms', smsData);
      setShowSmsModal(false);
      setSmsData({ phone: '', message: '' });
      alert('SMS queued for delivery via Gateway');
    } catch (err) {
      console.error(err);
      alert('Failed to queue SMS');
    }
  };
  if (isAdminLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return <Navigate to="/admin/login" />;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { label: t('today_bookings'), value: bookings.length || 0, color: 'text-blue-500', icon: TrendingUp },
    { label: t('walkins_online'), value: `${statsData.todayStats.walkInCount} / ${statsData.todayStats.onlineBookingCount}`, color: 'text-indigo-500', icon: Activity },
    { label: t('total_revenue'), value: `₹${(Number(statsData.todayStats.onlineRevenue) + Number(statsData.todayStats.cashRevenue)).toFixed(2)}`, color: 'text-emerald-500', icon: LayoutDashboard },
    { label: t('monitor_sync'), value: monitorStatus.active ? t('active') : t('offline'), color: monitorStatus.active ? 'text-emerald-500' : 'text-rose-500', icon: RefreshCw }
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] transition-colors duration-500 pb-20">
      <header className="sticky top-0 z-[60] bg-[var(--theme-panel)] backdrop-blur-2xl border-b border-[var(--theme-border)] px-4 md:px-8 py-4 md:py-6 shadow-xl">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-100">
              <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black tracking-tighter">{HOTEL_NAME} <span className="text-blue-600">Executive</span></h1>
              <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em] mt-1">Namaste! {t('admin_terminal')}</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-4 bg-[var(--theme-accent)] px-6 py-2.5 rounded-2xl border border-[var(--theme-border)] shadow-sm">
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${monitorStatus.active ? 'text-emerald-500' : 'text-rose-500'}`}>
                {monitorStatus.active ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
                {monitorStatus.active ? 'Sovereign Online' : 'Network Interrupted'}
              </div>
              <div className="h-4 w-px bg-[var(--theme-border)]" />
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Server size={14} />
                Endpoint: <span className="text-[var(--theme-text)] font-mono">{monitorStatus.serverIp}</span>
              </div>
            </div>

            <div className="flex gap-2 bg-[var(--theme-border)] p-1.5 rounded-2xl">
              {['en', 'hi', 'mr'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${
                    lang === l ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="text-right hidden md:block">
              <p className="text-lg font-black tracking-tight font-serif">{currentTime.toLocaleTimeString()}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {currentTime.toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'hi' ? 'hi-IN' : 'mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {deferredPrompt && (
              <button
                onClick={installApp}
                className="hidden xl:flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all animate-bounce"
              >
                <Sparkles size={14} /> Install Web App
              </button>
            )}
            <button
              onClick={() => fetchData()}
              className="w-12 h-12 bg-[var(--theme-panel)] border border-[var(--theme-border)] hover:border-blue-600 hover:text-blue-600 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-xl"
            >
              <RefreshCw size={24} className={refreshing ? 'animate-spin' : ''} />      <main className="max-w-[1800px] mx-auto p-4 md:p-8 lg:p-12 space-y-12">
        {/* --- 1. CONCIERGE QUICK DOCK (TOOLBAR NAVIGATION) --- */}
        <div className="flex flex-wrap gap-4 justify-start items-center">
          {[
            { to: "/admin/history", icon: History, label: "Archives" },
            { to: "/admin/pos", icon: CreditCard, label: "Walk-in Terminal" },
            { to: "/admin/menu", icon: Utensils, label: "Culinary Architect" },
            { to: "/admin/warehouse", icon: Package, label: "Warehouse Assets" },
            { to: "/admin/chef", icon: ChefHat, label: "Kitchen Feed" },
            { to: "/admin/chat", icon: MessageSquare, label: "Concierge Chat" },
          ].map(link => (
            <Link key={link.to} to={link.to} className="bg-[var(--theme-panel)] border border-[var(--theme-border)] hover:border-blue-600 hover:text-blue-600 px-6 py-4 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg hover:-translate-y-1 hover:shadow-blue-500/10">
              <link.icon size={18} /> {link.label}
            </Link>
          ))}
        </div>

        {/* --- 2. CORE PERFORMANCE METRICS (STATS ROW) --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {stats.map((s, i) => (
            <div key={i} className="cloud-card p-6 md:p-8 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden border border-blue-600/5">
              <div className="absolute top-0 right-0 p-4 md:p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 group-hover:text-blue-600">
                <s.icon size={50} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.label}</p>
              <div className={`text-xl md:text-3xl font-black tracking-tighter font-serif ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* --- 3. ALERTS & LIVE TRANSMISSIONS --- */}
        {/* Network sync state */}
        {!monitorStatus.active && (
          <div className="cloud-card p-8 bg-rose-500/5 border-rose-500/20 shadow-2xl shadow-rose-500/5 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <WifiOff size={120} />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <WifiOff size={28} />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-black text-rose-500 uppercase tracking-tighter">Synchronization Protocol Offline</p>
                  <p className="text-xs font-bold text-slate-400 max-w-xl leading-relaxed">
                    Namaste! The payment monitor has lost its bridge. To restore live verification:
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="bg-[var(--theme-accent)] px-4 py-2 rounded-xl border border-[var(--theme-border)]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">App Connection URL</p>
                      <p className="text-sm font-black text-blue-600 font-mono tracking-widest select-all">{monitorStatus.serverIp}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <button onClick={() => fetchData()} className="btn-primary py-4 px-6 rounded-xl text-[9px]">RETRY SYNC</button>
                <Link to="/admin/pos" className="btn-secondary py-4 px-6 text-center rounded-xl border-rose-500/20 hover:border-rose-500 hover:text-rose-500 text-[9px]">MANUAL POS ENTRY</Link>
              </div>
            </div>
          </div>
        )}

        {monitorStatus.active && (
          <div className="cloud-card p-6 bg-blue-600/5 border-blue-600/10 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center">
                <Zap size={20} />
              </div>
              <p className="text-sm font-black text-[var(--theme-text)] tracking-tight">Sovereign Connection Established. <span className="text-blue-600">Monitoring Active.</span></p>
            </div>
            <Sparkles size={16} className="text-blue-600/30 animate-pulse" />
          </div>
        )}

        {/* Live Payment Tunnel */}
        {payments.filter(p => p.status === 'pending').length > 0 && (
          <div className="cloud-card p-8 border border-amber-500/20 bg-amber-500/[0.02] shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Activity size={14} className="animate-pulse" /> Live Payment Tunnel
                </h2>
                <div className="text-2xl font-black tracking-tighter text-[var(--theme-text)]">
                  Pending Authorization Queue
                </div>
              </div>
              <span className="bg-amber-500/10 border border-amber-500/20 py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-amber-500">
                {payments.filter(p => p.status === 'pending').length} ACTIVE REQUESTS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payments.filter(p => p.status === 'pending').map(p => {
                const waitTime = Math.round((currentTime.getTime() - new Date(p.created_at).getTime()) / 60000);
                return (
                  <div key={p.id} className="glass p-6 border-amber-500/10 hover:border-amber-500/40 transition-all bg-[var(--theme-panel)] relative overflow-hidden group shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[8px] font-black rounded uppercase tracking-tighter">REF: {p.booking_ref}</span>
                           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{waitTime > 0 ? `${waitTime}m ago` : 'just now'}</span>
                        </div>
                        <div className="text-lg font-black tracking-tight font-serif italic text-[var(--theme-text)]">{p.user_name || 'Guest'}</div>
                      </div>
                      <div className="text-right">
                         <div className="text-xl font-black text-amber-500 font-serif tracking-tighter">₹{Number(p.amount).toLocaleString()}</div>
                         <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.method}</div>
                      </div>
                    </div>
                    
                    {p.transaction_id && (
                      <div className="mb-4 p-3 bg-[var(--theme-bg)] rounded-xl border border-[var(--theme-border)]">
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">UTR / Txn ID</div>
                        <div className="text-[10px] font-black text-blue-600 tracking-widest break-all">{p.transaction_id}</div>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4 border-t border-[var(--theme-border)]">
                      <button 
                        onClick={() => verifyPayment(p.booking_id, 'approve')}
                        className="flex-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-500 transition-all shadow-md active:scale-95"
                      >
                        APPROVE
                      </button>
                      <button 
                        onClick={() => verifyPayment(p.booking_id, 'reject')}
                        className="flex-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                      >
                        REJECT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- 4. REAL-TIME FLOOR OPERATIONS SECTION --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Live Reservations Ledger (2/3 width) */}
          <div className="xl:col-span-8 glass border border-blue-600/5 relative overflow-hidden flex flex-col justify-between">
            <div className="px-8 py-6 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-accent)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[var(--theme-text)] tracking-tighter">{t('live_bookings')}</h2>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Customer Transmission Ledger</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto custom-scroll hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-slate-400 font-black border-b border-[var(--theme-border)] bg-slate-50/20 dark:bg-slate-900/20">
                    <th className="px-8 py-4">{t('customer')}</th>
                    <th className="px-8 py-4">{t('table')} / Breakdown</th>
                    <th className="px-8 py-4">Total Payable</th>
                    <th className="px-8 py-4 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-border)]">
                  {bookings.map((b) => {
                    const billAmount = Number(b.total_payable || 0);
                    const remainingDue = Number(b.remaining_due || 0);
                    return (
                      <tr key={b.id} className="hover:bg-blue-600/[0.01] transition-all group">
                        <td className="px-8 py-6">
                          <div className="font-black text-base mb-0.5 tracking-tight font-serif italic">{b.user_name}</div>
                          {b.staff_name && (
                            <div className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                               <Sparkles size={8} /> Staff: {b.staff_name}
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <span className={statusClass(b.booking_status)}>
                              {t(b.booking_status).toUpperCase()}
                            </span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-[var(--theme-accent)] px-2 py-0.5 rounded border border-[var(--theme-border)]">{b.guests} {t('guests').toUpperCase()}</span>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <div className="space-y-1 max-w-[200px]">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                              <span>Subtotal:</span>
                              <span>₹{Number(b.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-blue-600 pt-0.5 border-t border-[var(--theme-border)]">
                              <span>Total Due:</span>
                              <span>₹{billAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <div className="space-y-0.5">
                             <div className={`text-2xl font-black font-serif tracking-tighter ${remainingDue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                               ₹{remainingDue.toFixed(2)}
                             </div>
                             <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DUE AMOUNT</div>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-3 flex-wrap">
                             <select
                                value={b.booking_status}
                                onChange={(e) => updateBooking(b.id, e.target.value)}
                                className="bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] text-[9px] font-black uppercase rounded-lg px-2 py-1.5 outline-none"
                              >
                                <option value="pending">{t('pending')}</option>
                                <option value="confirmed">{t('confirmed')}</option>
                                <option value="seated">{t('seated')}</option>
                                <option value="completed">{t('completed')}</option>
                              </select>
                              
                              {b.booking_status === 'seated' && (
                                 <button onClick={() => openCheckout(b)} className="btn-primary py-2.5 px-4 text-[8px] rounded-lg">SETTLE BILL</button>
                              )}
                              {b.booking_status === 'awaiting_final_payment' && (
                                 <button onClick={() => payAtCounter(b.id)} className="bg-emerald-600 text-white font-black py-2.5 px-4 rounded-lg text-[8px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md">PAY CASH</button>
                              )}
                              {(b.booking_status === 'completed' || b.booking_status === 'awaiting_final_payment' || b.booking_status === 'seated') && (
                                 <div className="flex gap-2">
                                   <button onClick={() => window.open(`/admin/print/${b.id}`, '_blank')} className="btn-secondary py-2 px-3 text-[8px] rounded-lg flex items-center gap-1">
                                     <Printer size={10} /> PRINT
                                   </button>
                                   <button onClick={() => { setSmsData({ phone: b.phone || '', message: '' }); setShowSmsModal(true); }} className="btn-secondary py-2 px-3 text-[8px] rounded-lg flex items-center gap-1 border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/5">
                                     <MessageSquare size={10} /> SMS
                                   </button>
                                 </div>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center opacity-40 text-xs uppercase tracking-widest font-black">
                        No active bookings for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Booking Cards */}
            <div className="md:hidden divide-y divide-[var(--theme-border)]">
              {bookings.map((b) => {
                const remainingDue = Number(b.remaining_due || 0);
                return (
                  <div key={b.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-black text-lg tracking-tight font-serif italic">{b.user_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={statusClass(b.booking_status)}>{t(b.booking_status).toUpperCase()}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">T{b.table_number} / {b.guests} G</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-xl font-black font-serif tracking-tighter ${remainingDue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                           ₹{remainingDue.toFixed(2)}
                         </p>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DUE</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        value={b.booking_status}
                        onChange={(e) => updateBooking(b.id, e.target.value)}
                        className="flex-1 bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] text-[9px] font-black uppercase rounded-lg px-2 py-2"
                      >
                        <option value="pending">{t('pending')}</option>
                        <option value="confirmed">{t('confirmed')}</option>
                        <option value="seated">{t('seated')}</option>
                        <option value="completed">{t('completed')}</option>
                      </select>
                      {b.booking_status === 'seated' && (
                         <button onClick={() => openCheckout(b)} className="btn-primary py-2 px-3 text-[8px] rounded-lg">SETTLE</button>
                      )}
                      {b.booking_status === 'awaiting_final_payment' && (
                         <button onClick={() => payAtCounter(b.id)} className="bg-emerald-600 text-white font-black py-2 px-3 rounded-lg text-[8px] uppercase tracking-widest">PAY</button>
                      )}
                      {(b.booking_status === 'completed' || b.booking_status === 'awaiting_final_payment' || b.booking_status === 'seated') && (
                         <button onClick={() => window.open(`/admin/print/${b.id}`, '_blank')} className="btn-secondary py-2 px-3 text-[8px] rounded-lg flex items-center gap-1">
                           <Printer size={10} /> PRINT
                         </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Floor Matrix Table Map (1/3 width) */}
          <div className="xl:col-span-4 glass p-6 sm:p-8 border border-blue-600/5 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-4">
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Floor Plan Matrix</h2>
                  <button onClick={addTable} className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-0.5 hover:underline">+ Manifest Table</button>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] font-black text-blue-600 uppercase tracking-widest"><ShieldCheck size={10} /> Live Floor</div>
              </div>
              <div className="grid grid-cols-3 xl:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto custom-scroll pr-1">
                {tables.map((t_item) => (
                  <button
                    key={t_item.id}
                    onClick={() => updateTable(t_item.id, t_item.status === 'available' ? 'occupied' : 'available')}
                    className={`p-4 rounded-2xl border transition-all active:scale-95 text-center relative overflow-hidden group shadow-md ${t_item.status === 'occupied'
                        ? 'bg-rose-500/5 border-rose-500/40 text-rose-500'
                        : t_item.status === 'reserved'
                          ? 'bg-amber-500/5 border-amber-500/40 text-amber-500'
                          : 'bg-[var(--theme-panel)] border-[var(--theme-border)] text-slate-300 hover:border-blue-600 hover:text-blue-600'
                      }`}
                  >
                    <div className="text-xl font-black font-serif tracking-tighter mb-0.5">T{t_item.table_name}</div>
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">{t_item.status === 'available' ? 'VACANT' : t_item.status === 'occupied' ? 'ENGAGED' : 'HELD'}</div>
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span onClick={(e) => { e.stopPropagation(); editTable(t_item); }} className="text-[7px] font-black uppercase text-blue-600 hover:underline">Edit</span>
                      <span onClick={(e) => { e.stopPropagation(); deleteTable(t_item.id); }} className="text-[7px] font-black uppercase text-rose-500 hover:underline">Erase</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- 5. BUSINESS INTELLIGENCE & FINANCIAL PERFORMANCE (TABBED CONSOLE) --- */}
        <div className="glass border border-blue-600/5 overflow-hidden shadow-2xl">
          {/* Header & Tabs */}
          <div className="px-8 py-6 border-b border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--theme-accent)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--theme-text)] tracking-tighter">Business Intelligence</h2>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Financial Yield & Analytic Synthesis</p>
              </div>
            </div>
            {/* Tab Selectors */}
            <div className="flex bg-[var(--theme-border)] p-1 rounded-xl w-fit">
              <button 
                onClick={() => setAnalyticsTab('revenue')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  analyticsTab === 'revenue' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-600'
                }`}
              >
                Daily Revenue Stream
              </button>
              <button 
                onClick={() => setAnalyticsTab('expenditures')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  analyticsTab === 'expenditures' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-600'
                }`}
              >
                Revenue & Costs Flux
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Chart Area (2/3 width) */}
            <div className="lg:col-span-8 h-[350px] sm:h-[400px] border border-[var(--theme-border)] rounded-3xl p-6 bg-[var(--theme-panel)]/30 backdrop-blur-sm">
              {analyticsTab === 'revenue' ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Daily Revenue Trajectory</p>
                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-blue-600" /> Aggregate Revenue Flow
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={statsData.dailyRevenue}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="booking_date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }} dx={-10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          boxShadow: '0 20px 45px rgba(0,0,0,0.15)',
                          padding: '12px'
                        }}
                        itemStyle={{ color: '#2563eb', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Expenditures Flux by Month</p>
                    <div className="flex gap-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-600" /> Revenue Stream</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-rose-500" /> Operating Liability</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={statsData.auditData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }} dx={-10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          boxShadow: '0 20px 45px rgba(0,0,0,0.15)',
                          padding: '12px'
                        }}
                        cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                      />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="REVENUE" />
                      <Bar dataKey="cost" fill="#f43f5e" radius={[4, 4, 0, 0]} name="COSTS" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* AI Insights & Diagnostics (1/3 width) */}
            <div className="lg:col-span-4 bg-indigo-600/[0.02] border border-indigo-600/10 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-105 transition-all pointer-events-none">
                 <BrainCircuit size={100} className="text-indigo-600" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--theme-text)] font-serif italic">AI-Driven Insights</h3>
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Algorithmic Performance Analysis</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--theme-accent)] p-4 rounded-2xl border border-[var(--theme-border)]">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Flame size={10} className="text-rose-500" /> Top Dishes</p>
                    <div className="space-y-1.5">
                      {(statsData.popularDishes || []).slice(0, 2).map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-xs font-bold text-[var(--theme-text)]">
                          <span className="truncate max-w-[80px]">{d.name}</span>
                          <span className="text-blue-600 bg-blue-600/10 px-1.5 py-0.5 rounded text-[8px]">x{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--theme-accent)] p-4 rounded-2xl border border-[var(--theme-border)]">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Clock size={10} className="text-amber-500" /> Peak Hour</p>
                    <div className="space-y-1.5">
                      {(statsData.busiestHours || []).slice(0, 2).map((h, i) => (
                        <div key={i} className="flex justify-between items-center text-xs font-bold text-[var(--theme-text)]">
                          <span>{h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`}</span>
                          <span className="text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px]">{h.count} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-bold leading-relaxed border-t border-[var(--theme-border)] pt-4">
                  {statsData.popularDishes?.length > 0 && statsData.busiestHours?.length > 0 ? (
                    <>
                      Based on recent metrics, <span className="text-[var(--theme-text)] font-black">"{statsData.popularDishes[0].name}"</span> is driving significant volume. 
                      Coupled with peak activity around <span className="text-[var(--theme-text)] font-black">{statsData.busiestHours[0].hour}:00</span>, optimize prep times for this item.
                    </>
                  ) : (
                    "Awaiting sufficient data volume to generate algorithmic insights."
                  )}
                </div>
              </div>

              <button className="mt-6 w-full bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2">
                <RefreshCw size={12} /> Regenerate Insights
              </button>
            </div>
          </div>

          {/* Collapsible Ledger Audit Section */}
          <div className="border-t border-[var(--theme-border)]">
            <button 
              onClick={() => setShowAuditLedger(!showAuditLedger)}
              className="w-full px-8 py-5 flex items-center justify-between text-xs font-black uppercase tracking-widest hover:bg-[var(--theme-accent)] transition-all"
            >
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> Sovereign Audit Ledger (Detailed Profit & Loss Table)</span>
              <span>{showAuditLedger ? 'HIDE DETAILS ▲' : 'SHOW DETAILS ▼'}</span>
            </button>

            {showAuditLedger && (
              <div className="border-t border-[var(--theme-border)] animate-slide-up">
                <div className="overflow-x-auto custom-scroll hidden md:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-widest text-slate-400 font-black border-b border-[var(--theme-border)] bg-slate-50/20 dark:bg-slate-900/10">
                        <th className="px-8 py-4">Temporal Cycle</th>
                        <th className="px-8 py-4">Inflow Dynamics (Revenue)</th>
                        <th className="px-8 py-4">Outflow Dynamics (Costs)</th>
                        <th className="px-8 py-4 text-right">Net Yield (Profit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                      {statsData.auditData.map((a) => (
                        <tr key={a.month} className="hover:bg-blue-600/[0.01] transition-all group">
                          <td className="px-8 py-6">
                            <div className="text-lg font-black font-serif italic text-blue-600 tracking-tight">
                              {new Date(a.month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                            </div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{a.bookings} sessions archived</p>
                          </td>
                          <td className="px-8 py-6">
                             <div className="space-y-1.5 max-w-xs">
                                <div className="flex justify-between items-center text-sm font-bold text-[var(--theme-text)]">
                                   <span>Revenue:</span>
                                   <span>₹{a.revenue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                   <span>Walk-in: ₹{a.walkin_revenue.toFixed(0)}</span>
                                   <span>Online: ₹{a.online_revenue.toFixed(0)}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="space-y-1.5 max-w-xs">
                                <div className="flex justify-between items-center text-sm font-bold text-rose-500">
                                   <span>Operational Costs:</span>
                                   <span>₹{a.cost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 gap-2">
                                   <span>GRC: ₹{a.grocery_cost.toFixed(0)}</span>
                                   <span>CMD: ₹{a.commodity_cost.toFixed(0)}</span>
                                   <span>UTL: ₹{a.utility_cost.toFixed(0)}</span>
                                   <span>STF: ₹{a.staff_cost.toFixed(0)}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className={`text-xl font-black font-serif tracking-tighter ${a.profit >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                               {a.profit < 0 ? '-' : '+'}₹{Math.abs(a.profit).toLocaleString()}
                             </div>
                             <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mt-1.5 ${a.profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                               {a.margin}% yield
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Ledger Cards */}
                <div className="md:hidden divide-y divide-[var(--theme-border)]">
                  {statsData.auditData.map((a) => (
                    <div key={a.month} className="p-6 space-y-4 bg-white/5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-black font-serif italic text-blue-600 tracking-tight">
                            {new Date(a.month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                          </div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{a.bookings} sessions archived</p>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${a.profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          {a.margin}% yield
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Inflow</p>
                          <p className="text-[var(--theme-text)]">₹{a.revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Outflow</p>
                          <p className="text-rose-500">₹{a.cost.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[var(--theme-border)] flex justify-between items-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Net Yield</p>
                        <p className={`text-xl font-black font-serif tracking-tighter ${a.profit >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                          {a.profit < 0 ? '-' : '+'}₹{Math.abs(a.profit).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ledger summary footer */}
                <div className="p-8 border-t border-[var(--theme-border)] bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="grid grid-cols-2 gap-8 w-full md:w-auto">
                      <div className="pl-4 border-l-4 border-blue-600">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue</p>
                         <p className="text-xl font-black text-[var(--theme-text)] font-serif tracking-tighter">₹{(statsData.auditData || []).reduce((s, a) => s + a.revenue, 0).toLocaleString()}</p>
                      </div>
                      <div className="pl-4 border-l-4 border-rose-500">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Costs</p>
                         <p className="text-xl font-black text-rose-500 font-serif tracking-tighter">₹{(statsData.auditData || []).reduce((s, a) => s + a.cost, 0).toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="text-center md:text-right bg-emerald-500/5 px-6 py-4 rounded-2xl border border-emerald-500/10 w-full md:w-auto">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center justify-center md:justify-end gap-2">
                         <Sparkles size={12} /> ACCUMULATED PROFIT
                      </p>
                      <p className="text-3xl font-black text-emerald-500 font-serif tracking-tighter leading-none">
                        ₹{(statsData.auditData || []).reduce((s, a) => s + a.profit, 0).toLocaleString()}
                      </p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- 6. UTILITIES, AUDIT & TEAM MANAGEMENT SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Collapsible Identity search auditor (5/12 width) */}
          <div className="lg:col-span-5 glass p-6 border border-blue-600/5 flex flex-col gap-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-4">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Audit Panel</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Sovereign Identity Database</p>
              </div>
              <button 
                onClick={() => setShowSearchSuite(!showSearchSuite)}
                className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                {showSearchSuite ? 'COLLAPSE ▲' : 'EXPAND SEARCH ▼'}
              </button>
            </div>

            {showSearchSuite ? (
              <div className="space-y-6 animate-slide-up">
                <form onSubmit={handleCustomerSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Enter ID, Ref, Email, or Contact..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <button type="submit" disabled={searchLoading} className="btn-primary py-2.5 px-4 rounded-xl text-[8px]">
                    {searchLoading ? <RefreshCw className="animate-spin" size={10} /> : 'AUDIT'}
                  </button>
                  {searchResults && (
                    <button type="button" onClick={() => { setSearchResults(null); setSearchQuery(''); }} className="btn-secondary py-2 px-3 rounded-xl text-[8px] text-rose-500 border-rose-500/20">
                      <SearchX size={14} />
                    </button>
                  )}
                </form>

                {searchResults && (
                  <div className="space-y-6 max-h-[300px] overflow-y-auto custom-scroll pr-1 animate-fade-in">
                    {/* User results */}
                    <div className="space-y-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Guests ({searchResults.users.length})</p>
                      {searchResults.users.map(u => (
                        <div key={u.id} className={`p-4 rounded-xl border transition-all bg-[var(--theme-panel)] text-xs flex justify-between items-start gap-4 ${u.is_banned ? 'border-rose-500/20 bg-rose-500/[0.01]' : 'border-blue-600/10'}`}>
                          <div>
                            <div className="font-black text-sm text-[var(--theme-text)]">{u.name} <span className="text-slate-400 text-[10px]">#{u.id}</span></div>
                            <div className="text-[9px] text-slate-500 mt-1 lowercase font-bold">{u.email} · {u.phone}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleUserBan(u.id, u.is_banned)}
                            className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                              u.is_banned 
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            {u.is_banned ? 'UNBAN' : 'BAN'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Booking results */}
                    <div className="space-y-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Bookings ({searchResults.bookings.length})</p>
                      {searchResults.bookings.map(b => (
                        <div key={b.id} className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-accent)] text-[10px] font-black uppercase tracking-widest">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-blue-600">Ref: {b.booking_ref}</span>
                            <span className={statusClass(b.status)}>{b.status}</span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[8px]">
                            <span>{new Date(b.booking_date).toLocaleDateString()}</span>
                            <span>Table {b.table_number}</span>
                            <span className="text-emerald-600">₹{Number(b.bill_amount).toFixed(0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowSearchSuite(true)}
                className="w-full bg-[var(--theme-accent)] border border-[var(--theme-border)] hover:border-blue-600 py-6 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 text-center transition-all hover:text-blue-600"
              >
                🔍 Open Search / Identity Auditor
              </button>
            )}
          </div>

          {/* Right Column: Operations Team panel (7/12 width) */}
          <div className="lg:col-span-7 glass p-6 border border-blue-600/5 flex flex-col gap-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--theme-border)] pb-4 gap-4">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operations Team</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Manage staff panel credentials</p>
              </div>
              <form onSubmit={addStaff} className="flex items-center gap-2 bg-[var(--theme-input)] p-1 rounded-xl border border-[var(--theme-border)] max-w-sm">
                <input
                  type="text"
                  placeholder="NAME"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value.toUpperCase())}
                  className="bg-transparent border-none rounded-lg px-3 py-2 text-[9px] font-black w-24 tracking-widest outline-none focus:ring-0 focus:border-none"
                />
                <input
                  type="number"
                  placeholder="SALARY"
                  value={newStaffSalary}
                  onChange={(e) => setNewStaffSalary(e.target.value)}
                  className="bg-transparent border-none rounded-lg px-3 py-2 text-[9px] font-black w-20 tracking-widest outline-none focus:ring-0 focus:border-none"
                />
                <button type="submit" className="bg-blue-600 text-white text-[8px] px-4 py-2.5 rounded-lg font-black uppercase tracking-widest hover:bg-blue-700 transition-all whitespace-nowrap">
                  GEN ID
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto custom-scroll pr-1">
              {staff.map((s) => (
                <div key={s.id} className="p-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-panel)] relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.staff_id}</div>
                      <div className="text-sm font-bold text-[var(--theme-text)] tracking-tight">{s.name}</div>
                    </div>
                    <button onClick={() => deleteStaff(s.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-black text-blue-600 uppercase tracking-widest border-t border-[var(--theme-border)] pt-2 mt-2">
                    <span>₹{Number(s.salary).toLocaleString()} / month</span>
                    <span className="text-emerald-500">ACTIVE</span>
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="col-span-full py-8 text-center bg-[var(--theme-accent)] rounded-2xl border border-dashed border-[var(--theme-border)]">
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No staff identities registered in the system protocol.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- MODALS SECTION --- */}
        {/* Checkout Settlement Modal */}
        {checkoutModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
            <div className="glass w-full max-w-lg p-10 relative overflow-hidden border border-blue-600/10 shadow-2xl rounded-[2rem]">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <CreditCard size={120} className="text-blue-600" />
              </div>
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-2">Settlement Authorization</h3>
              <p className="text-2xl font-black text-[var(--theme-text)] tracking-tight mb-1 font-serif italic">{checkoutModal.user_name}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-8">Table {checkoutModal.table_number} · {checkoutModal.guests} Guests · Ref: {checkoutModal.booking_ref}</p>

              <div className="space-y-4 mb-8 bg-[var(--theme-accent)] p-6 rounded-2xl border border-[var(--theme-border)]">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold">Food Subtotal</span>
                  <span className="font-black text-[var(--theme-text)]">₹{Number(checkoutModal.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold">GST (18%)</span>
                  <span className="font-black text-[var(--theme-text)]">₹{(Number(checkoutModal.subtotal || 0) * 0.18).toFixed(2)}</span>
                </div>
                {checkoutModal.loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-sm text-indigo-500">
                    <span className="font-bold flex items-center gap-2"><Sparkles size={14} /> Loyalty ({checkoutModal.loyaltyTier})</span>
                    <span className="font-black">-₹{Number(checkoutModal.loyaltyDiscount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(checkoutDiscount) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-500">
                    <span className="font-bold">Manual Discount</span>
                    <span className="font-black">-₹{parseFloat(checkoutDiscount).toFixed(2)}</span>
                  </div>
                )}
                {Number(checkoutModal.paperlessDiscount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-500">
                    <span className="font-bold">Paperless Discount</span>
                    <span className="font-black">-₹{Number(checkoutModal.paperlessDiscount).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-[var(--theme-border)] pt-4 flex justify-between text-lg">
                  <span className="font-black text-[var(--theme-text)]">Estimated Total</span>
                  <span className="font-black text-blue-600">
                    ₹{Math.max(0, (Number(checkoutModal.subtotal || 0) * 1.18) - (parseFloat(checkoutDiscount) || 0) - (Number(checkoutModal.loyaltyDiscount) || 0) - (Number(checkoutModal.paperlessDiscount) || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="font-bold">Advance Paid</span>
                  <span className="font-black">-₹{Number(checkoutModal.adv_paid || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-[var(--theme-border)] pt-3 flex justify-between text-xl">
                  <span className="font-black text-[var(--theme-text)]">Final Due</span>
                  <span className={`font-black font-serif tracking-tighter ${
                    Math.max(0, (Number(checkoutModal.subtotal || 0) * 1.18) - (parseFloat(checkoutDiscount) || 0) - (Number(checkoutModal.loyaltyDiscount) || 0) - (Number(checkoutModal.paperlessDiscount) || 0) - Number(checkoutModal.adv_paid || 0)) > 0 ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    ₹{Math.max(0, (Number(checkoutModal.subtotal || 0) * 1.18) - (parseFloat(checkoutDiscount) || 0) - (Number(checkoutModal.loyaltyDiscount) || 0) - (Number(checkoutModal.paperlessDiscount) || 0) - Number(checkoutModal.adv_paid || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Apply Discount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={checkoutDiscount}
                  onChange={(e) => setCheckoutDiscount(e.target.value)}
                  className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-6 py-4 rounded-2xl text-lg font-black focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCheckoutModal(null)}
                  className="flex-1 btn-secondary py-4 rounded-xl text-[10px] font-black tracking-widest uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={executeCheckout}
                  className="flex-1 btn-primary py-4 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-2xl shadow-blue-600/20"
                >
                  Authorize Settlement
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmAction && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
            <div className="glass w-full max-w-md p-8 relative overflow-hidden border border-rose-500/10 shadow-2xl rounded-[2rem] text-center">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Shield size={100} className="text-rose-500" />
              </div>
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <Trash2 size={28} />
              </div>
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-2">Destructive Action Alert</h3>
              <p className="text-xl font-black text-[var(--theme-text)] tracking-tight mb-4">{confirmAction.title || 'Are you absolutely sure?'}</p>
              <p className="text-xs text-slate-400 font-bold mb-8 leading-relaxed px-2">{confirmAction.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 btn-secondary py-4 rounded-xl text-[10px] font-black tracking-widest uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmAction.onConfirm();
                    setConfirmAction(null);
                  }}
                  className="flex-1 btn-primary py-4 rounded-xl bg-rose-600 border-rose-600 hover:bg-rose-700 hover:border-rose-700 text-[10px] font-black tracking-widest uppercase shadow-2xl shadow-rose-500/20"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SMS Modal */}
        {showSmsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSmsModal(false)} />
            <div className="relative bg-[var(--theme-panel)] w-full max-w-md rounded-[2rem] border border-[var(--theme-border)] shadow-2xl p-8 animate-slide-up">
              <button 
                onClick={() => setShowSmsModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black font-serif italic tracking-tighter text-[var(--theme-text)]">Send SMS</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gateway Messenger</p>
                </div>
              </div>

              <form onSubmit={sendManualSms} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block">Phone Number</label>
                  <input 
                    type="tel"
                    required
                    value={smsData.phone}
                    onChange={e => setSmsData({...smsData, phone: e.target.value})}
                    placeholder="+91..."
                    className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-4 rounded-xl focus:border-indigo-500 outline-none text-sm font-black tracking-widest transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block">Message</label>
                  <textarea 
                    required
                    rows="4"
                    value={smsData.message}
                    onChange={e => setSmsData({...smsData, message: e.target.value})}
                    placeholder="Enter message..."
                    className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-4 rounded-xl focus:border-indigo-500 outline-none text-sm resize-none transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2">
                    <MessageSquare size={14} /> Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
