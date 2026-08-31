import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useStore from './store/useStore';
import Navbar from './components/Navbar';
import { useHotel } from './hooks/useHotel';

// Guest Pages
const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const Booking = lazy(() => import('./pages/Booking'));
const Payment = lazy(() => import('./pages/Payment'));
const OrderDishes = lazy(() => import('./pages/OrderDishes'));
const BookingHistory = lazy(() => import('./pages/BookingHistory'));
const Auth = lazy(() => import('./pages/Auth'));
const AboutUs = lazy(() => import('./pages/AboutUs'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminDishes = lazy(() => import('./pages/admin/AdminDishes'));
const AdminTables = lazy(() => import('./pages/admin/AdminTables'));
const AdminLiveOrders = lazy(() => import('./pages/admin/AdminLiveOrders'));
const AdminBilling = lazy(() => import('./pages/admin/AdminBilling'));
const AdminChat = lazy(() => import('./pages/admin/AdminChat'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const PrintBill = lazy(() => import('./pages/admin/PrintBill'));

import ChatWidget from './components/ChatWidget';
import AdminChatNotificationManager from './components/AdminChatNotificationManager';

function AppContent() {
  const { fetchConfig, checkAuth, checkAdminAuth, isAuthLoading, isAdminLoading } = useStore();
  const { name: HOTEL_NAME } = useHotel();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    fetchConfig();
    checkAuth();
    checkAdminAuth();
  }, [fetchConfig, checkAuth, checkAdminAuth]);

  if (isAuthLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">
            Initializing {HOTEL_NAME} Sovereign Portal…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAdminRoute && <Navbar />}

      <div className={isAdminRoute ? '' : 'pt-20'}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Routes>
            {/* Public / Guest Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/payment/:bookingId" element={<Payment />} />
            <Route path="/order-dishes/:bookingId" element={<OrderDishes />} />
            <Route path="/history text" element={<Navigate to="/history" replace />} />
            <Route path="/history" element={<BookingHistory />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/about" element={<AboutUs />} />

            {/* Executive / Staff Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/dishes" element={<AdminDishes />} />
            <Route path="/admin/tables" element={<AdminTables />} />
            <Route path="/admin/live-orders" element={<AdminLiveOrders />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/admin/chat" element={<AdminChat />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/print/:bookingId" element={<PrintBill />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {!isAdminRoute && <ChatWidget />}
        <AdminChatNotificationManager />
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
