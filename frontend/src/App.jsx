import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Navbar from './components/Navbar';
import { useHotel } from './hooks/useHotel';
import { useTheme } from './context/ThemeContext';
import SpaceBackground from './components/SpaceBackground';

import { lazy, Suspense } from 'react';

// Pages - Lazy Loaded
const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const Booking = lazy(() => import('./pages/Booking'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Payment = lazy(() => import('./pages/Payment'));
const OrderDishes = lazy(() => import('./pages/OrderDishes'));
const History = lazy(() => import('./pages/History'));

// Admin Pages - Lazy Loaded
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const StaffLogin = lazy(() => import('./pages/Admin/StaffLogin'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const ChefDashboard = lazy(() => import('./pages/Admin/ChefDashboard'));
const WalkInPOS = lazy(() => import('./pages/Admin/WalkInPOS'));
const ManageMenu = lazy(() => import('./pages/Admin/ManageMenu'));
const InventoryWarehouse = lazy(() => import('./pages/Admin/InventoryWarehouse'));
const BookingHistory = lazy(() => import('./pages/Admin/BookingHistory'));
const AdminChat = lazy(() => import('./pages/Admin/AdminChat'));
const PrintBill = lazy(() => import('./pages/Admin/PrintBill'));

import ChatWidget from './components/ChatWidget';
import AdminChatNotificationManager from './components/AdminChatNotificationManager';

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

      {/* ── IMMERSIVE SPACE SCENE ── */}
      <SpaceBackground />

      {/* ── PAGE CONTENT — 3-D scene layer ── */}
      <div className="pt-20 min-h-screen relative" style={{ zIndex: 10 }}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center pt-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: isDark ? '#94a3b8' : '#3b82f6', borderTopColor: 'transparent' }} />
            </div>
          </div>
        }>
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
        </Suspense>
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
