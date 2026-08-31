import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import useStore from '../../store/useStore';
import { 
  CreditCard, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Armchair, 
  User, 
  CheckCircle2, 
  ArrowLeft,
  Printer,
  DollarSign
} from 'lucide-react';

export default function AdminBilling() {
  const { staffName } = useStore();

  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [selectedTable, setSelectedTable] = useState('');
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [lastBookingId, setLastBookingId] = useState(null);

  useEffect(() => {
    fetchPOSData();
  }, []);

  const fetchPOSData = async () => {
    try {
      setLoading(true);
      const [tRes, mRes] = await Promise.all([
        api.get('/api/admin/tables'),
        api.get('/api/admin/menu-items')
      ]);

      if (tRes.data.success) {
        setTables(tRes.data.tables || []);
        if (tRes.data.tables.length > 0) {
          setSelectedTable(tRes.data.tables[0].table_name);
        }
      }
      if (mRes.data.success) {
        setMenuItems(mRes.data.dishes || []);
      }
    } catch (err) {
      console.error('POS data error:', err);
    } fontLoading: {
      setLoading(false);
    }
  };

  const updateCart = (dish, delta) => {
    setCart(prev => {
      const currentQty = prev[dish.id]?.qty || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[dish.id];
        return copy;
      }
      return {
        ...prev,
        [dish.id]: {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          qty: newQty
        }
      };
    });
  };

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;

  const handleCreateWalkInOrder = async (e) => {
    e.preventDefault();
    if (!selectedTable || cartItems.length === 0) return;

    try {
      setSubmitting(true);
      const payload = {
        table: selectedTable,
        guests: Number(guests),
        cart: cartItems,
        staff_name: staffName || 'EXECUTIVE_ADMIN'
      };

      const res = await api.post('/api/admin/walk-in', payload);
      if (res.data.success) {
        setSuccessMsg(`Walk-in POS ticket #${res.data.bookingRef} created! Sent to kitchen.`);
        setLastBookingId(res.data.bookingId);
        setCart({});
      } else {
        alert(res.data.error || 'Failed to process POS order');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'POS submission error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">Walk-In POS & Counter Order Terminal</h1>
            <p className="text-xs text-slate-500">Instant walk-in table allocation, food billing, and immediate kitchen ordering</p>
          </div>
        </div>

        {lastBookingId && (
          <Link to={`/admin/print/${lastBookingId}`} target="_blank" className="btn-light-secondary text-xs font-bold">
            <Printer className="w-4 h-4 text-slate-600" /> Print Last Bill PDF
          </Link>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* POS Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Dish Menu Selector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="luxury-card p-6 bg-white space-y-4 shadow-sm border border-slate-200">
            <h3 className="font-serif font-bold text-lg text-slate-900">Select Dishes for Order</h3>
            
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading catalog...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {menuItems.map(item => {
                  const qty = cart[item.id]?.qty || 0;
                  return (
                    <div key={item.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                        <span className="text-[10px] text-amber-700 font-semibold">₹{item.price}</span>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200">
                          <button onClick={() => updateCart(item, -1)} className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-xs">{qty}</span>
                          <button onClick={() => updateCart(item, 1)} className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => updateCart(item, 1)} className="btn-gold !py-1 !px-2.5 text-[11px] font-bold">
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Checkout & Table Selection */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCreateWalkInOrder} className="luxury-card p-6 bg-white space-y-6 shadow-sm border border-slate-200">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Table Allocation & Summary</h3>

            {/* Table picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Floor Table</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full text-xs py-3 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 font-bold"
                required
              >
                {tables.map(t => (
                  <option key={t.id} value={t.table_name}>
                    {t.table_name} ({t.capacity} Seats) - {t.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Guest Count</label>
              <input
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="font-bold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (18%)</span>
                <span className="font-bold">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                <span>Grand Total</span>
                <span className="text-amber-700">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              className="w-full btn-gold !py-3 text-xs font-bold shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              {submitting ? 'Processing Order...' : 'Confirm Walk-In & Send to Kitchen'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
