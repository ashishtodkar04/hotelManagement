import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import useStore from '../store/useStore';
import { useHotel } from '../hooks/useHotel';
import Footer from '../components/Footer';
import { 
  Calendar, 
  Clock, 
  Users, 
  Armchair, 
  CheckCircle2, 
  AlertCircle, 
  Utensils, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Info,
  CreditCard
} from 'lucide-react';

export default function Booking() {
  const { user } = useStore();
  const { name: HOTEL_NAME } = useHotel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialGuests = Number(searchParams.get('guests')) || 2;
  const initialSlot = searchParams.get('slot') || '19:00';

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialSlot);
  const [guests, setGuests] = useState(initialGuests);
  const [duration, setDuration] = useState(2);
  const [selectedTable, setSelectedTable] = useState(null);

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Attached cart dishes from sessionStorage
  const [attachedCart, setAttachedCart] = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('selected_cart');
    if (saved) {
      try {
        setAttachedCart(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse cart:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [date, time]);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const res = await api.get(`/booking?date=${date}&time=${time}`);
      if (res.data.success) {
        setTables(res.data.tables || []);
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoadingTables(false);
    }
  };

  // Advance Payment calculation: ₹200 per guest minimum
  const advanceAmount = guests * 200;
  const cartSubtotal = attachedCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      navigate('/auth?redirect=/booking');
      return;
    }

    if (!selectedTable) {
      setError('Please select a table from the floor layout below.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        date,
        time,
        guests: Number(guests),
        duration: Number(duration),
        table: selectedTable.table_name,
        adv_paid: advanceAmount,
        cart: attachedCart
      };

      const res = await api.post('/booking', payload);
      if (res.data.success && res.data.id) {
        sessionStorage.removeItem('selected_cart');
        navigate(`/payment/${res.data.id}`);
      } else {
        setError(res.data.error || 'Failed to complete table reservation.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Server error occurred during reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      
      {/* ── HERO BANNER ── */}
      <section className="pt-12 pb-12 bg-gradient-to-b from-blue-900/10 via-blue-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-800 text-xs font-bold uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Executive Table Reservations</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-slate-900">
            Reserve Your <span className="accent-sapphire-text">Table & Dining Suite</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Select your preferred dining date, guest count, and interactive table layout for a guaranteed luxury experience at {HOTEL_NAME}.
          </p>
        </div>
      </section>

      {/* ── MAIN RESERVATION FORM & FLOOR PLAN ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Date & Details Selector */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1 Card: Date, Time & Guests */}
            <div className="luxury-card p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl accent-sapphire-gradient text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900">Reservation Preferences</h3>
                  <p className="text-xs text-slate-500">Pick date, time slot, and attendance count</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Reservation Date</label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Time Slot</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="12:00">12:00 PM (Lunch)</option>
                    <option value="13:30">01:30 PM (Lunch)</option>
                    <option value="19:00">07:00 PM (Dinner)</option>
                    <option value="20:30">08:30 PM (Dinner)</option>
                    <option value="22:00">10:00 PM (Late Night)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Total Guests</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests (Couple)</option>
                    <option value={4}>4 Guests (Family Table)</option>
                    <option value={6}>6 Guests (Large Table)</option>
                    <option value={8}>8+ Guests (VIP Room)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Duration (Hours)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full text-xs py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours (Standard)</option>
                    <option value={3}>3 Hours (Relaxed Dining)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Step 2 Card: Interactive Floor Plan Layout */}
            <div className="luxury-card p-6 sm:p-8 bg-white space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl accent-sapphire-gradient text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-slate-900">Select Available Table</h3>
                    <p className="text-xs text-slate-500">Live floor status for selected slot</p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Occupied
                  </span>
                </div>
              </div>

              {loadingTables ? (
                <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                  Checking real-time table availability...
                </div>
              ) : tables.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No tables configured for this slot.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {tables.map((tbl) => {
                    const isOccupied = tbl.status === 'occupied';
                    const isTooSmall = Number(tbl.capacity) < guests;
                    const isDisabled = isOccupied || isTooSmall;
                    const isSelected = selectedTable?.id === tbl.id;

                    return (
                      <button
                        key={tbl.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedTable(tbl)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-2 ring-blue-500/20'
                            : isDisabled
                            ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                            : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 text-slate-800'
                        }`}
                      >
                        <Armchair className={`w-6 h-6 ${isSelected ? 'text-blue-600' : isDisabled ? 'text-slate-300' : 'text-emerald-600'}`} />
                        <span className="font-bold text-xs">{tbl.table_name}</span>
                        <span className="text-[10px] text-slate-500">Cap: {tbl.capacity} Guests</span>

                        {isOccupied && (
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">Booked</span>
                        )}
                        {isTooSmall && !isOccupied && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Small</span>
                        )}
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 absolute top-2 right-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Checkout Summary Box */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="luxury-card p-6 sm:p-8 bg-white sticky top-28 space-y-6 border-2 border-blue-200/80 shadow-xl">
              
              <div className="pb-4 border-b border-slate-100">
                <h3 className="font-serif font-bold text-xl text-slate-900">Reservation Summary</h3>
                <p className="text-xs text-slate-500">Review details before advance payment</p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Detail Items */}
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Date & Slot:</span>
                  <span className="font-bold text-slate-900">{date} ({time})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Guest Count:</span>
                  <span className="font-bold text-slate-900">{guests} Guests</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Selected Table:</span>
                  <span className="font-bold text-blue-700">
                    {selectedTable ? `${selectedTable.table_name} (Cap: ${selectedTable.capacity})` : 'None Selected'}
                  </span>
                </div>

                {attachedCart.length > 0 && (
                  <div className="pt-2">
                    <span className="font-bold text-slate-900 block mb-1">Attached Food Orders ({attachedCart.length}):</span>
                    <div className="space-y-1 pl-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {attachedCart.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.qty}x {item.name}</span>
                          <span className="font-semibold text-slate-800">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                        <span>Cart Total:</span>
                        <span>₹{cartSubtotal}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-900">
                    <span>Advance Payment Required:</span>
                    <span className="text-blue-700 text-base">₹{advanceAmount}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    *Advance amount will be fully credited against your final dining bill.
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              {!user ? (
                <button
                  type="button"
                  onClick={() => navigate('/auth?redirect=/booking')}
                  className="w-full btn-gold !py-3.5 text-xs font-bold"
                >
                  Log In To Complete Reservation
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !selectedTable}
                  className="w-full btn-sapphire !py-3.5 text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Processing Reservation...</span>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed To Pay Advance (₹{advanceAmount})</span>
                    </>
                  )}
                </button>
              )}

              <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Instant Auto-Verification via UPI Gateway</span>
              </div>

            </div>

          </div>

        </form>

      </section>

      {/* ── FOOTER ── */}
      <Footer />

    </div>
  );
}
