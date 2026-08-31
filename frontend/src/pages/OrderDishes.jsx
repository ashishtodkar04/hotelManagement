import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Footer from '../components/Footer';
import { Utensils, Plus, Minus, ShoppingCart, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrderDishes() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, mRes] = await Promise.all([
        api.get(`/api/booking/${bookingId}`),
        api.get('/menu')
      ]);

      if (bRes.data.success) {
        setBooking(bRes.data.booking);
      }
      if (mRes.data.success) {
        const all = [
          ...(mRes.data.Starter || []),
          ...(mRes.data['Main Course'] || []),
          ...(mRes.data.Dessert || []),
          ...(mRes.data.Drinks || [])
        ];
        setDishes(all);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setErrorMsg('Failed to load menu for dish ordering.');
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
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setSubmitting(true);
      const payload = {
        bookingId: Number(bookingId),
        cart: cartItems
      };
      const res = await api.post('/api/order-food', payload);
      if (res.data.success) {
        setSuccessMsg('Dishes ordered successfully! Sent directly to the kitchen display system.');
        setCart({});
      } else {
        setErrorMsg(res.data.error || 'Failed to submit food order.');
      }
    } catch (err) {
      console.error('Order submission error:', err);
      setErrorMsg(err.response?.data?.error || 'Server error while submitting food order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      
      <section className="pt-12 pb-12 bg-gradient-to-b from-rose-900/10 via-rose-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <button
            onClick={() => navigate('/history')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to History
          </button>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900">
            Order Dishes for <span className="accent-rose-gradient bg-clip-text text-transparent">Table {booking?.table_number || ''}</span>
          </h1>
          <p className="text-xs text-slate-500">Booking Reference: {booking?.booking_ref}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {successMsg && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dishes.map((dish) => {
            const qty = cart[dish.id]?.qty || 0;
            return (
              <div key={dish.id} className="luxury-card p-5 bg-white space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif font-bold text-slate-900 text-lg">{dish.name}</h3>
                    <span className="font-bold text-amber-700">₹{dish.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dish.description || 'Gourmet preparation.'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{dish.category}</span>
                  {qty > 0 ? (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                      <button onClick={() => updateCart(dish, -1)} className="p-1 text-amber-700 hover:bg-amber-100 rounded-lg">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs text-amber-900">{qty}</span>
                      <button onClick={() => updateCart(dish, 1)} className="p-1 text-amber-700 hover:bg-amber-100 rounded-lg">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => updateCart(dish, 1)} className="btn-gold !py-1.5 !px-3 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* Floating Summary */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-slide-up">
          <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border-2 border-rose-500/50">
            <div>
              <p className="text-xs font-bold text-white">{cartItems.length} Dishes Selected</p>
              <p className="text-[11px] text-rose-400 font-semibold">Total: ₹{cartTotal}</p>
            </div>
            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="btn-gold !bg-rose-600 hover:!bg-rose-700 !py-2.5 !px-6 text-xs font-bold shadow-lg"
            >
              {submitting ? 'Sending to Kitchen...' : 'Confirm Kitchen Order'}
            </button>
          </div>
        </div>
      )}

      <Footer />

    </div>
  );
}
