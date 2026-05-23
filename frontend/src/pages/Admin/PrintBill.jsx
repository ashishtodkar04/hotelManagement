import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../../services/api';
import useStore from '../../store/useStore';
import { useHotel } from '../../hooks/useHotel';

export default function PrintBill() {
  const { bookingId } = useParams();
  const { isAdmin, isAdminLoading } = useStore();
  const { name: HOTEL_NAME, email, phone, address } = useHotel();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAdminLoading || !isAdmin) return;

    const fetchBillData = async () => {
      try {
        const res = await api.get(`/api/admin/print-bill/${bookingId}`);
        setData(res.data);
        // Add a slight delay to allow rendering before printing
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (err) {
        console.error(err);
        setError('Failed to load bill data.');
      } finally {
        setLoading(false);
      }
    };

    fetchBillData();
  }, [bookingId, isAdmin, isAdminLoading]);

  if (isAdminLoading || loading) return <div className="p-10 text-center">Loading Bill...</div>;
  if (!isAdmin) return <Navigate to="/admin/login" />;
  if (error || !data) return <div className="p-10 text-center text-red-500">{error || 'Bill not found'}</div>;

  const { booking, orders } = data;
  
  const subtotal = orders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const tax = subtotal * 0.18; // 18% GST
  const discount = Number(booking.discount || 0);
  const paperlessDiscount = (booking.user_id && booking.user_id !== 0) ? (subtotal * 0.001) : 0;
  
  // Calculate final totals (just to be sure, although booking.bill_amount has the total)
  const totalBill = Number(booking.bill_amount) || Math.max(0, subtotal + tax - discount - paperlessDiscount);
  const advPaid = Number(booking.adv_paid || 0);
  const paidAmount = Number(booking.paid_amount || 0);
  const dueAmount = Math.max(0, totalBill - advPaid - paidAmount);

  return (
    <div className="bg-white min-h-screen text-black p-8 font-sans print:p-0 print:m-0" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Bill Header */}
      <div className="text-center mb-8 border-b-2 border-dashed border-gray-300 pb-6">
        <h1 className="text-4xl font-black font-serif italic mb-2 uppercase">{HOTEL_NAME}</h1>
        <p className="text-sm text-gray-600">{address || 'Premium Dining Experience'}</p>
        <p className="text-sm text-gray-600">Phone: {phone || '+91 99999 99999'} | Email: {email || 'info@hotel.com'}</p>
        <p className="text-sm text-gray-600 mt-2 font-bold tracking-widest uppercase">GSTIN: 27AABCU9603R1ZX</p>
      </div>

      {/* Bill Info */}
      <div className="flex justify-between mb-8 text-sm">
        <div>
          <p><span className="font-bold">Bill No:</span> {booking.id}</p>
          <p><span className="font-bold">Ref No:</span> {booking.booking_ref}</p>
          <p><span className="font-bold">Date:</span> {new Date(booking.booking_date).toLocaleDateString()} {booking.time_slot}</p>
          <p><span className="font-bold">Staff:</span> {booking.staff_name || 'Admin'}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold">Customer:</span> {booking.user_name || 'Walk-in Guest'}</p>
          {booking.user_phone && <p><span className="font-bold">Phone:</span> {booking.user_phone}</p>}
          <p><span className="font-bold">Table:</span> {booking.table_number}</p>
          <p><span className="font-bold">Guests:</span> {booking.guests}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-black border-dashed">
            <th className="py-2">Item Description</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="border-b-2 border-black border-dashed">
          {orders.map((item, idx) => (
            <tr key={idx}>
              <td className="py-2">{item.name}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">₹{Number(item.price).toFixed(2)}</td>
              <td className="py-2 text-right">₹{Number(item.total_price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-1/2">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">GST (18%):</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Discount:</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          {paperlessDiscount > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Paperless Discount:</span>
              <span>-₹{paperlessDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-t-2 border-black border-dashed font-bold text-xl mt-2">
            <span>Grand Total:</span>
            <span>₹{totalBill.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between py-1 text-sm text-gray-600 mt-2">
            <span>Advance Paid:</span>
            <span>-₹{advPaid.toFixed(2)}</span>
          </div>
          {paidAmount > 0 && (
            <div className="flex justify-between py-1 text-sm text-gray-600">
              <span>Paid Later:</span>
              <span>-₹{paidAmount.toFixed(2)}</span>
            </div>
          )}
          {dueAmount > 0 ? (
            <div className="flex justify-between py-2 font-bold text-red-600">
              <span>Amount Due:</span>
              <span>₹{dueAmount.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between py-2 font-bold text-green-600">
              <span>Status:</span>
              <span>PAID IN FULL</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 mt-12 border-t-2 border-dashed border-gray-300 pt-6">
        <p className="font-bold mb-2 text-black text-lg">Thank You for Dining With Us!</p>
        <p>Please visit again.</p>
        <p className="text-xs mt-4">This is a computer generated invoice.</p>
      </div>

      {/* Hide print button when printing */}
      <div className="text-center mt-10 print:hidden">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">
          Print Bill Again
        </button>
        <button onClick={() => window.close()} className="ml-4 bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-bold hover:bg-gray-300">
          Close Window
        </button>
      </div>
    </div>
  );
}
