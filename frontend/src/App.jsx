import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Navbar from './components/Navbar';
import { useHotel } from './hooks/useHotel';
import { useTheme } from './context/ThemeContext';

// Pages
import Home from './pages/Home';
import Menu from './pages/Menu';
import Booking from './pages/Booking';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import OrderDishes from './pages/OrderDishes';
import History from './pages/History';

// Admin Pages
import AdminLogin from './pages/Admin/AdminLogin';
import StaffLogin from './pages/Admin/StaffLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ChefDashboard from './pages/Admin/ChefDashboard';
import WalkInPOS from './pages/Admin/WalkInPOS';
import ManageMenu from './pages/Admin/ManageMenu';
import InventoryWarehouse from './pages/Admin/InventoryWarehouse';
import BookingHistory from './pages/Admin/BookingHistory';
import ChatWidget from './components/ChatWidget';
import AdminChat from './pages/Admin/AdminChat';
import AdminChatNotificationManager from './components/AdminChatNotificationManager';
import PrintBill from './pages/Admin/PrintBill';

function AppContent() {
  const { fetchConfig, checkAuth, checkAdminAuth, isAuthLoading, isAdminLoading } = useStore();
  const { name: HOTEL_NAME } = useHotel();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchConfig();
    checkAuth();
    checkAdminAuth();
  }, [fetchConfig, checkAuth, checkAdminAuth]);

  if (isAuthLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#030014' : '#dbeafe' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: isDark ? '#94a3b8' : '#3b82f6', borderTopColor: 'transparent' }} />
          <p className="text-sm font-medium" style={{ color: isDark ? '#94a3b8' : '#475569' }}>
            Loading {HOTEL_NAME}…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      {/* ── GLOBAL SPACE BACKGROUND ── */}
      <div className="ambient-bg">
        {/* Nebula colour washes */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* Moon craters — only visible in dark mode via CSS opacity */}
        <div className="moon-crater" style={{ width:'12%', height:'12%', top:'calc(50% - 9vmin)', left:'calc(50% - 2vmin)' }} />
        <div className="moon-crater" style={{ width:'7%',  height:'7%',  top:'calc(50% + 4vmin)', left:'calc(50% + 6vmin)' }} />
        <div className="moon-crater" style={{ width:'5%',  height:'5%',  top:'calc(50% - 2vmin)', left:'calc(50% + 10vmin)' }} />
        <div className="moon-crater" style={{ width:'4%',  height:'4%',  top:'calc(50% + 10vmin)',left:'calc(50% - 8vmin)' }} />
      </div>

      {/* ── PAGE CONTENT — 3-D scene layer ── */}
      <div className="pt-20 min-h-screen relative" style={{ zIndex: 10 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/"                     element={<Home />} />
          <Route path="/menu"                 element={<Menu />} />
          <Route path="/booking"              element={<Booking />} />
          <Route path="/auth"                 element={<Auth />} />
          <Route path="/dashboard"            element={<Dashboard />} />
          <Route path="/history"              element={<History />} />
          <Route path="/payment/:bookingId"   element={<Payment />} />
          <Route path="/order/:bookingId"     element={<OrderDishes />} />

          {/* Admin Routes */}
          <Route path="/admin/login"          element={<AdminLogin />} />
          <Route path="/admin/staff-login"    element={<StaffLogin />} />
          <Route path="/admin"                element={<AdminDashboard />} />
          <Route path="/admin/chef"           element={<ChefDashboard />} />
          <Route path="/admin/pos"            element={<WalkInPOS />} />
          <Route path="/admin/menu"           element={<ManageMenu />} />
          <Route path="/admin/inventory"      element={<InventoryWarehouse />} />
          <Route path="/admin/history"        element={<BookingHistory />} />
          <Route path="/admin/chat"           element={<AdminChat />} />
          <Route path="/admin/print/:bookingId" element={<PrintBill />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ChatWidget />
        <AdminChatNotificationManager />
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
