import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Navbar from './components/Navbar';
import { useHotel } from './hooks/useHotel';

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
import Warehouse from './pages/Admin/Warehouse';
import BookingHistory from './pages/Admin/BookingHistory';
import ChatWidget from './components/ChatWidget';
import AdminChat from './pages/Admin/AdminChat';
import AdminChatNotificationManager from './components/AdminChatNotificationManager';
import PrintBill from './pages/Admin/PrintBill';

function AppContent() {
  const { fetchConfig, checkAuth, checkAdminAuth, isAuthLoading, isAdminLoading } = useStore();
  const { name: HOTEL_NAME } = useHotel();

  useEffect(() => {
    fetchConfig();
    checkAuth();
    checkAdminAuth();
  }, [fetchConfig, checkAuth, checkAdminAuth]);

  // Show global spinner inside the Router so hooks order is stable
  if (isAuthLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading {HOTEL_NAME}\u2026</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      
      {/* Global Animated Background Objects */}
      <div className="ambient-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="pt-20 min-h-screen relative z-10">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/payment/:bookingId" element={<Payment />} />
          <Route path="/order/:bookingId" element={<OrderDishes />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/staff-login" element={<StaffLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/chef" element={<ChefDashboard />} />
          <Route path="/admin/pos" element={<WalkInPOS />} />
          <Route path="/admin/menu" element={<ManageMenu />} />
          <Route path="/admin/warehouse" element={<Warehouse />} />
          <Route path="/admin/history" element={<BookingHistory />} />
          <Route path="/admin/chat" element={<AdminChat />} />
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
