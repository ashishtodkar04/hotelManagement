import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useStore from '../store/useStore';
import Footer from '../components/Footer';
import { 
  Calendar, 
  Clock, 
  Users, 
  Utensils, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export default function BookingHistory() {
  const { user } = useStore();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/my-bookings');
      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setError('Failed to retrieve reservation history.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'seated':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmed</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-[10px] uppercase tracking-wider rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold text-[10px] uppercase tracking-wider rounded-full">Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> Payment Pending</span>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
        <div className="luxury-card p-8 text-center max-w-md w-full bg-white space-y-4">
          <Calendar className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="font-serif font-bold text-xl text-slate-900">Member Portal Login Required</h2>
          <p className="text-xs text-slate-500">Please sign in to view your executive table reservations and food order invoices.</p>
          <Link to="/auth?redirect=/history" className="btn-gold text-xs font-bold inline-block">Sign In Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      
      {/* HERO BANNER */}
      <section className="pt-12 pb-12 bg-gradient-to-b from-amber-900/10 via-amber-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-bold uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Member Hospitality Log</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-slate-900">
            My Table <span className="accent-gold-text">Reservations</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            View active table bookings, attached food orders, payment breakdown, and print official bills.
          </p>
        </div>
      </section>

      {/* BOOKINGS LIST */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="luxury-card p-6 bg-white space-y-3 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-rose-50 rounded-3xl border border-rose-200 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs text-rose-800 font-bold">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="luxury-card p-12 text-center bg-white space-y-4 max-w-lg mx-auto">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-serif font-bold text-xl text-slate-800">No Reservations Yet</h3>
            <p className="text-xs text-slate-500">You haven't placed any table reservations yet. Book your first table now!</p>
            <Link to="/booking" className="btn-gold text-xs font-bold inline-flex items-center gap-1.5">
              <span>Reserve A Table</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b) => (
              <div key={b.id} className="luxury-card p-6 sm:p-8 bg-white border-2 border-slate-200/80 shadow-md space-y-6">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                        {b.booking_ref}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>
                    <p className="text-xs text-slate-500">Booked on: {b.date || b.booking_date} at {b.time || b.time_slot}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {b.status === 'pending' && (
                      <Link to={`/payment/${b.id}`} className="btn-sapphire !py-2 !px-4 text-xs font-bold">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Advance (₹{b.adv_paid})</span>
                      </Link>
                    )}

                    <Link to={`/admin/print/${b.id}`} target="_blank" className="btn-light-secondary text-xs font-bold">
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print Bill PDF</span>
                    </Link>

                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <Link to={`/order-dishes/${b.id}`} className="btn-gold !py-2 !px-4 text-xs font-bold">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Food Order</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Table Allocated</span>
                    <span className="font-bold text-slate-900 text-sm">{b.table || b.table_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Guests</span>
                    <span className="font-bold text-slate-900 text-sm">{b.guests} Guests</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Advance Paid</span>
                    <span className="font-bold text-emerald-700 text-sm">₹{b.adv_paid || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Total Bill / Due</span>
                    <span className="font-bold text-amber-700 text-sm">
                      ₹{b.bill_amount || 0} {b.remaining_due > 0 && <span className="text-rose-600 text-xs font-normal">(Due: ₹{b.remaining_due})</span>}
                    </span>
                  </div>
                </div>

                {/* Attached Dishes */}
                {Array.isArray(b.dishes) && b.dishes.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-amber-600" />
                      Ordered Kitchen Dishes ({b.dishes.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      {b.dishes.map((item, idx) => (
                        <div key={idx} className="flex justify-between bg-white p-2 rounded-xl border border-slate-200">
                          <span>{item.qty}x {item.name}</span>
                          <span className="font-bold text-slate-800">₹{(item.price || 0) * (item.qty || 1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </section>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}
