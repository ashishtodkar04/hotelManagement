import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { useHotel } from '../../hooks/useHotel';
import { Printer, CheckCircle2, ShieldCheck, ChefHat } from 'lucide-react';

export default function PrintBill() {
  const { bookingId } = useParams();
  const { name: HOTEL_NAME, address, phone } = useHotel();

  const [booking, setBooking] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillData();
  }, [bookingId]);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/print-bill/${bookingId}`);
      if (res.data.success) {
        setBooking(res.data.booking);
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Fetch bill error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Generating Sovereign Tax Invoice PDF...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xs font-bold text-rose-600">Booking invoice record not found.</p>
      </div>
    );
  }

  const subtotal = orders.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  const gst = subtotal * 0.18; // 18% GST
  const discount = Number(booking.discount || 0);
  const grandTotal = Number(booking.bill_amount || (subtotal + gst - discount));
  const advPaid = Number(booking.adv_paid || 0);
  const balanceDue = Math.max(0, grandTotal - advPaid - Number(booking.paid_amount || 0));

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-10 flex flex-col items-center">
      
      {/* Print Trigger Button */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 print:hidden">
        <span className="text-xs text-slate-500 font-bold">Official Invoice Preview</span>
        <button
          onClick={handlePrint}
          className="btn-gold !py-2.5 !px-6 text-xs font-bold shadow-lg flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print PDF Invoice
        </button>
      </div>

      {/* PAPER INVOICE SHEET */}
      <div className="w-full max-w-2xl bg-white p-8 sm:p-12 shadow-2xl border border-slate-200 rounded-2xl print:shadow-none print:border-none print:p-0 font-sans text-slate-900 space-y-8">
        
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-amber-600" />
              <h1 className="font-serif text-2xl font-bold uppercase tracking-wider">{HOTEL_NAME}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">{address || 'Grand Luxury Boulevard'}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Phone: {phone || '+91 98765 43210'}</p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-amber-400 font-mono text-xs font-bold uppercase tracking-widest rounded mb-2">
              TAX INVOICE
            </span>
            <p className="text-xs font-mono font-bold text-slate-800">INV #: {booking.booking_ref}</p>
            <p className="text-xs text-slate-500">Date: {booking.booking_date || new Date().toLocaleDateString()}</p>
            <p className="text-xs text-slate-500">Slot: {booking.time_slot}</p>
          </div>
        </div>

        {/* Guest & Table Info */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Guest Information</span>
            <p className="font-bold text-slate-900 text-sm">{booking.user_name || 'Valued Dining Guest'}</p>
            <p className="text-slate-600">{booking.user_phone || 'Walk-In Guest'}</p>
            <p className="text-slate-600">{booking.user_email || ''}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Reservation Breakdown</span>
            <p className="font-bold text-slate-900 text-sm">Table: {booking.table_number}</p>
            <p className="text-slate-600">{booking.guests} Guests</p>
            <p className="text-slate-600 uppercase font-bold text-[10px] text-emerald-700 mt-1">
              Status: {booking.status}
            </p>
          </div>
        </div>

        {/* Dish Items Table */}
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">Table Reservation Fee / No extra food dishes attached.</td>
                </tr>
              ) : (
                orders.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-bold text-slate-800">{item.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">₹{item.price}</td>
                    <td className="py-3 text-right font-bold">₹{item.total_price}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="pt-4 border-t-2 border-slate-900 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18%)</span>
              <span className="font-mono font-bold">₹{gst.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Loyalty / Special Discount</span>
                <span className="font-mono">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Grand Total</span>
              <span className="font-mono text-amber-700">₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 text-slate-500 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Advance Paid</span>
                <span className="font-mono font-bold text-emerald-700">₹{advPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span>Net Balance Due</span>
                <span className="font-mono text-slate-900">₹{balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-8 border-t border-slate-200 text-center text-slate-500 space-y-1 text-[11px]">
          <p className="font-serif font-bold text-slate-800">Thank you for dining with {HOTEL_NAME}!</p>
          <p>This is a computer-generated tax invoice. No signature required.</p>
        </div>

      </div>

    </div>
  );
}
