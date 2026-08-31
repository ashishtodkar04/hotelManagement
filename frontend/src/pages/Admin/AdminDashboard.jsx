import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import api from '../../services/api';
import socket from '../../services/socket';
import { useHotel } from '../../hooks/useHotel';
import { 
  LayoutDashboard, 
  Calendar, 
  Utensils, 
  Armchair, 
  ChefHat, 
  CreditCard, 
  MessageSquare, 
  TrendingUp, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Users, 
  Sparkles,
  AlertCircle,
  Plus
} from 'lucide-react';

export default function AdminDashboard() {
  const { adminLogout, staffName, role } = useStore();
  const { name: HOTEL_NAME } = useHotel();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    socket.connect();
    socket.on('booking_update', fetchDashboardData);
    socket.on('table_update', fetchDashboardData);
    socket.on('order_update', fetchDashboardData);

    return () => {
      socket.off('booking_update', fetchDashboardData);
      socket.off('table_update', fetchDashboardData);
      socket.off('order_update', fetchDashboardData);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, tablesRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/bookings'),
        api.get('/api/admin/tables')
      ]);

      if (statsRes.data.success) setStats(statsRes.data);
      if (bookingsRes.data.success) setBookings(bookingsRes.data.bookings || []);
      if (tablesRes.data.success) setTables(tablesRes.data.tables || []);
    } catch (err) {
      console.error('Dashboard data error:', err);
    } fontLoading: {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;
  const pendingPaymentsCount = bookings.filter(b => b.payment_verified === 0 || b.booking_status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      
      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-base leading-tight">{HOTEL_NAME}</h2>
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Executive Console</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1 text-xs font-semibold">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md">
              <LayoutDashboard className="w-4 h-4" /> Overview
            </Link>
            <Link to="/admin/bookings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Calendar className="w-4 h-4 text-blue-400" /> Table Reservations
            </Link>
            <Link to="/admin/dishes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Utensils className="w-4 h-4 text-emerald-400" /> Dish Menu Catalog
            </Link>
            <Link to="/admin/tables" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Armchair className="w-4 h-4 text-purple-400" /> Floor Tables
            </Link>
            <Link to="/admin/live-orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <ChefHat className="w-4 h-4 text-rose-400" /> Kitchen KDS
            </Link>
            <Link to="/admin/billing" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <CreditCard className="w-4 h-4 text-amber-400" /> Walk-In POS & Bill
            </Link>
            <Link to="/admin/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Guest Live Chat
            </Link>
            <Link to="/admin/analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue & Audits
            </Link>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-3 text-[11px] text-slate-400">
            <p className="font-bold text-white">{staffName || 'Administrator'}</p>
            <p className="text-[10px] text-amber-400 uppercase tracking-wider">{role || 'Master Control'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-300 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" /> End Staff Session
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">Hospitality Command Dashboard</h1>
            <p className="text-xs text-slate-500">Live operational overview for {HOTEL_NAME}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/billing" className="btn-gold text-xs font-bold">
              <Plus className="w-4 h-4" /> New Walk-In Order
            </Link>
            <Link to="/" target="_blank" className="btn-light-secondary text-xs font-bold">
              View Live Website →
            </Link>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="luxury-card p-6 bg-white border-l-4 border-l-amber-500 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Today's Online Revenue</p>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                ₹{stats?.todayStats?.onlineRevenue || 0}
              </h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                Cash: ₹{stats?.todayStats?.cashRevenue || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="luxury-card p-6 bg-white border-l-4 border-l-blue-500 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Today's Reservations</p>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                {bookings.length} Tables
              </h3>
              <p className="text-[10px] text-blue-600 font-semibold mt-1">
                Walk-ins: {stats?.todayStats?.walkInCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="luxury-card p-6 bg-white border-l-4 border-l-purple-500 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Table Occupancy</p>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                {occupiedTablesCount} / {tables.length} Occupied
              </h3>
              <p className="text-[10px] text-purple-600 font-semibold mt-1">
                {tables.length - occupiedTablesCount} Available
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Armchair className="w-6 h-6" />
            </div>
          </div>

          <div className="luxury-card p-6 bg-white border-l-4 border-l-rose-500 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Pending Verifications</p>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                {pendingPaymentsCount} Orders
              </h3>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">
                Needs Approval
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Live Reservation Feed & Floor Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Today's Reservations Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="luxury-card p-6 bg-white space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-serif font-bold text-lg text-slate-900">Today's Table Schedule</h3>
                <Link to="/admin/bookings" className="text-xs font-bold text-amber-600 hover:underline">
                  Manage All →
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No reservations logged for today yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                        <th className="pb-3">Ref / Guest</th>
                        <th className="pb-3">Table</th>
                        <th className="pb-3">Slot</th>
                        <th className="pb-3">Bill</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-semibold text-slate-900">
                            <span className="font-mono text-amber-700 block">{b.id} - {b.user_name}</span>
                            <span className="text-[10px] text-slate-400">{b.user_phone || 'Walk-in'}</span>
                          </td>
                          <td className="py-3 font-bold text-slate-800">{b.table_number}</td>
                          <td className="py-3 text-slate-600">{b.time_slot}</td>
                          <td className="py-3 font-bold text-slate-900">₹{b.total_payable || 0}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              b.booking_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                              b.booking_status === 'seated' ? 'bg-purple-100 text-purple-800' :
                              b.booking_status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Floor Plan Quick Overview */}
          <div className="lg:col-span-4 space-y-4">
            <div className="luxury-card p-6 bg-white space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-serif font-bold text-lg text-slate-900">Floor Layout Status</h3>
                <Link to="/admin/tables" className="text-xs font-bold text-amber-600 hover:underline">
                  Configure →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {tables.map(t => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-2xl border text-center space-y-1 ${
                      t.status === 'occupied'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <Armchair className="w-5 h-5 mx-auto" />
                    <p className="font-bold text-xs">{t.table_name}</p>
                    <p className="text-[10px] font-semibold uppercase">{t.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
