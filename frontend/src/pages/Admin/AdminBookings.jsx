import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { useHotel } from '../../hooks/useHotel';
import { 
  Calendar, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Printer, 
  Trash2, 
  DollarSign, 
  User, 
  Utensils, 
  ArrowLeft,
  CreditCard,
  AlertCircle,
  Plus
} from 'lucide-react';

export default function AdminBookings() {
  const { name: HOTEL_NAME } = useHotel();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchBookings();

    socket.connect();
    socket.on('booking_update', fetchBookings);
    socket.on('payment_verified', fetchBookings);

    return () => {
      socket.off('booking_update', fetchBookings);
      socket.off('payment_verified', fetchBookings);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/bookings');
      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (bookingId, status) => {
    try {
      const res = await api.post('/api/admin/verify-payment', { bookingId, status });
      if (res.data.success) {
        setActionMsg(`Payment ${status === 'approve' ? 'approved' : 'rejected'} successfully.`);
        fetchBookings();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      const res = await api.post('/api/admin/update-status', { bookingId, status });
      if (res.data.success) {
        setActionMsg(`Reservation status updated to ${status}.`);
        fetchBookings();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handlePayAtCounter = async (bookingId) => {
    if (!window.confirm('Confirm cash collection and complete final checkout for this table?')) return;
    try {
      const res = await api.post('/api/admin/pay-at-counter', { bookingId });
      if (res.data.success) {
        setActionMsg('Cash payment collected & reservation marked as completed!');
        fetchBookings();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process counter payment');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking record?')) return;
    try {
      const res = await api.delete(`/api/admin/delete/${bookingId}`);
      if (res.data.success) {
        setActionMsg('Booking record deleted.');
        fetchBookings();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filterStatus === 'all' || b.booking_status === filterStatus;
    const matchesSearch = String(b.id).includes(searchQuery) ||
                          (b.user_name && b.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (b.table_number && b.table_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (b.utr_number && b.utr_number.includes(searchQuery));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">Table Reservations & Approvals</h1>
            <p className="text-xs text-slate-500">Manage real-time guest bookings and approve UPI / Cash payments</p>
          </div>
        </div>

        <Link to="/admin/billing" className="btn-gold text-xs font-bold">
          <Plus className="w-4 h-4" /> Create Walk-In Booking
        </Link>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === st
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ref, guest name, UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

      </div>

      {/* Bookings Data Table */}
      <div className="luxury-card p-6 bg-white shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Fetching reservation records...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No table reservations matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                  <th className="pb-3">Ref & Guest</th>
                  <th className="pb-3">Table & Time</th>
                  <th className="pb-3">Guests</th>
                  <th className="pb-3">Advance / UTR</th>
                  <th className="pb-3">Total Payable</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const isPendingPay = b.payment_verified === 0 || b.booking_status === 'pending';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60">
                      
                      {/* Ref & Guest */}
                      <td className="py-4">
                        <span className="font-mono font-bold text-slate-900 text-sm block">#{b.id}</span>
                        <span className="font-semibold text-slate-800">{b.user_name}</span>
                        <span className="text-[10px] text-slate-400 block">{b.user_phone || 'No Phone'}</span>
                      </td>

                      {/* Table & Time */}
                      <td className="py-4">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-xs">
                          {b.table_number}
                        </span>
                        <span className="text-slate-500 block text-[11px] mt-1">{b.booking_date} ({b.time_slot})</span>
                      </td>

                      {/* Guests */}
                      <td className="py-4 font-bold text-slate-800">
                        {b.guests} Guests
                      </td>

                      {/* Advance / UTR */}
                      <td className="py-4">
                        <span className="font-bold text-emerald-700 text-xs">₹{b.adv_paid}</span>
                        {b.utr_number && (
                          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded block w-fit text-slate-700 mt-0.5">
                            UTR: {b.utr_number}
                          </span>
                        )}
                      </td>

                      {/* Total Bill */}
                      <td className="py-4">
                        <span className="font-bold text-slate-900 text-xs">₹{b.total_payable || 0}</span>
                        {b.remaining_due > 0 && (
                          <span className="text-rose-600 text-[10px] font-bold block">Due: ₹{b.remaining_due}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.booking_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          b.booking_status === 'seated' ? 'bg-purple-100 text-purple-800' :
                          b.booking_status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          b.booking_status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.booking_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right space-y-1">
                        
                        {/* Approval buttons */}
                        {isPendingPay && (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleVerifyPayment(b.id, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyPayment(b.id, 'reject')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* Status changers */}
                        <div className="flex justify-end items-center gap-1.5 pt-1">
                          {b.booking_status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'seated')}
                              className="px-2 py-1 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 text-[10px] font-bold"
                            >
                              Seat Guests
                            </button>
                          )}

                          {b.booking_status === 'seated' && (
                            <button
                              onClick={() => handlePayAtCounter(b.id)}
                              className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-bold"
                            >
                              Collect Cash & Complete
                            </button>
                          )}

                          <Link
                            to={`/admin/print/${b.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            title="Print PDF Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
