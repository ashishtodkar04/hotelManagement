import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import { useHotel } from '../hooks/useHotel';
import Footer from '../components/Footer';
import { 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertCircle, 
  Printer, 
  FileText, 
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { name: HOTEL_NAME, phone } = useHotel();

  const [booking, setBooking] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [qrCodeData, setQrCodeData] = useState('');
  const [expectedAmount, setExpectedAmount] = useState(0);
  const [loadingQr, setLoadingQr] = useState(false);

  const [utrInput, setUtrInput] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrSuccessMsg, setUtrSuccessMsg] = useState('');
  const [utrErrorMsg, setUtrErrorMsg] = useState('');

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    fetchBookingDetails();
    fetchHotelConfig();

    // Socket real-time listener for payment verification updates
    socket.connect();
    const handleBookingUpdate = (data) => {
      if (String(data.bookingId) === String(bookingId)) {
        fetchBookingDetails();
      }
    };
    socket.on('booking_update', handleBookingUpdate);
    socket.on('payment_verified', handleBookingUpdate);

    // Polling interval every 4s to check auto-email verification status
    const interval = setInterval(() => {
      fetchBookingDetails(true);
    }, 4000);

    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.off('payment_verified', handleBookingUpdate);
      clearInterval(interval);
    };
  }, [bookingId]);

  const fetchHotelConfig = async () => {
    try {
      const res = await api.get('/api/hotel-config');
      if (res.data.upiId) {
        setUpiId(res.data.upiId);
      }
    } catch (e) {
      console.warn('Config error:', e);
    }
  };

  const fetchBookingDetails = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get(`/api/booking/${bookingId}`);
      if (res.data.success && res.data.booking) {
        setBooking(res.data.booking);
        setOrders(res.data.orders || []);
        
        // Generate QR code if expected amount not set
        if (!qrCodeData && res.data.booking.status === 'pending') {
          generateQr(res.data.booking.adv_paid || 500);
        }
      }
    } catch (err) {
      console.error('Fetch booking error:', err);
      if (!isBackground) setError('Failed to load booking payment record.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const generateQr = async (amount) => {
    try {
      setLoadingQr(true);
      const res = await api.post('/create-qr', { amount, bookingId, type: 'advance' });
      if (res.data.success) {
        setQrCodeData(res.data.qrData);
        setExpectedAmount(res.data.amount || amount);
      }
    } catch (err) {
      console.warn('QR generation error:', err);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    setUtrErrorMsg('');
    setUtrSuccessMsg('');

    if (!utrInput.trim() || utrInput.trim().length < 8) {
      setUtrErrorMsg('Please enter a valid 12-digit UTR or Transaction Ref Number.');
      return;
    }

    try {
      setSubmittingUtr(true);
      const payload = {
        bookingId: Number(bookingId),
        amount: expectedAmount || booking?.adv_paid || 500,
        utrNumber: utrInput.trim(),
        method: 'UPI'
      };

      const res = await api.post('/api/submit-payment', payload);
      if (res.data.success) {
        setUtrSuccessMsg('UTR submitted successfully! Auto-verification in progress...');
        fetchBookingDetails();
      } else {
        setUtrErrorMsg(res.data.error || 'Failed to record UTR payment reference.');
      }
    } catch (err) {
      console.error('UTR Submit Error:', err);
      setUtrErrorMsg(err.response?.data?.error || 'Server connection error.');
    } finally {
      setSubmittingUtr(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading Payment Gateway...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
        <div className="luxury-card p-8 text-center max-w-md w-full bg-white space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="font-serif font-bold text-xl text-slate-900">Reservation Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'The requested booking ID is invalid.'}</p>
          <Link to="/booking" className="btn-sapphire text-xs">Return to Booking</Link>
        </div>
      </div>
    );
  }

  const isVerified = booking.payment_verified === 1 || booking.status === 'confirmed' || booking.status === 'seated' || booking.status === 'completed';

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      
      {/* ── HEADER HERO ── */}
      <section className="pt-12 pb-12 bg-gradient-to-b from-purple-900/10 via-purple-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-800 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Encrypted Financial Gateway</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-slate-900">
            Payment & <span className="accent-amethyst-gradient bg-clip-text text-transparent">Verification</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Booking Reference: <span className="font-bold text-slate-900 bg-purple-100 px-2.5 py-1 rounded-lg">{booking.booking_ref}</span>
          </p>
        </div>
      </section>

      {/* ── MAIN PAYMENT CONTENT ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {/* Verification Success Banner */}
        {isVerified ? (
          <div className="luxury-card p-8 bg-white border-2 border-emerald-400 shadow-2xl text-center space-y-6 animate-fade-in mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif font-bold text-3xl text-slate-900">
                Payment Verified & Table Confirmed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Your advance payment of <span className="font-bold text-emerald-700">₹{booking.adv_paid}</span> has been confirmed. Your table <span className="font-bold text-slate-900">{booking.table_number}</span> is locked for {booking.booking_date} at {booking.time_slot}.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to={`/admin/print/${booking.id}`} target="_blank" className="btn-emerald text-xs font-bold shadow-md">
                <Printer className="w-4 h-4" />
                <span>View & Print Official PDF Bill</span>
              </Link>
              <Link to="/history" className="btn-light-secondary text-xs font-bold">
                <span>View My Reservations</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: QR Code & UPI Details */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="luxury-card p-6 sm:p-8 bg-white space-y-6 border-2 border-purple-200/80 shadow-xl text-center">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                    UPI QR Code Checkout
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Live Syncing
                  </span>
                </div>

                {/* QR Box */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 inline-block mx-auto relative shadow-inner">
                  {loadingQr ? (
                    <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                      Generating Payment QR...
                    </div>
                  ) : (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCodeData || `upi://pay?pa=hotel@upi&am=${expectedAmount || 500}`)}`} 
                      alt="Payment UPI QR" 
                      className="w-52 h-52 object-contain mx-auto rounded-xl border border-white shadow-md"
                    />
                  )}
                  <p className="text-[11px] font-bold text-slate-700 mt-3">
                    Scan with GPay, PhonePe, Paytm, or BHIM UPI
                  </p>
                </div>

                {/* Payable Amount */}
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-1">
                  <span className="text-xs text-purple-700 font-semibold">Exact Amount To Transfer:</span>
                  <p className="font-serif text-3xl font-bold text-purple-900">
                    ₹{expectedAmount || booking.adv_paid || 500}
                  </p>
                </div>

                {/* Copy UPI ID */}
                {upiId && (
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl text-xs border border-slate-200">
                    <span className="font-mono text-slate-700 truncate">{upiId}</span>
                    <button
                      onClick={handleCopyUpi}
                      className="flex items-center gap-1 text-purple-700 font-bold hover:underline shrink-0 ml-2"
                    >
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* Right Column: UTR Input & Booking Details */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* UTR Form */}
              <div className="luxury-card p-6 sm:p-8 bg-white space-y-6 shadow-xl border-2 border-slate-200">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="font-serif font-bold text-xl text-slate-900">Submit Payment UTR Reference</h3>
                  <p className="text-xs text-slate-500">Enter the 12-digit transaction ID from your bank SMS/App</p>
                </div>

                {utrSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{utrSuccessMsg}</span>
                  </div>
                )}

                {utrErrorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{utrErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitUtr} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">12-Digit UTR / Ref Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 423987123456"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      maxLength={20}
                      className="w-full text-xs font-mono py-3.5 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingUtr || !utrInput.trim()}
                    className="w-full btn-gold !bg-purple-700 hover:!bg-purple-800 !py-3.5 text-xs font-bold disabled:opacity-50 shadow-md shadow-purple-700/20"
                  >
                    {submittingUtr ? 'Verifying UTR Reference...' : 'Submit UTR For Auto-Verification'}
                  </button>
                </form>

                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-2 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Automated Email & SMS Verifier</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Our backend continuously scans Gmail bank alerts every 2 minutes. Once matched, your reservation converts to <span className="font-bold text-emerald-600">CONFIRMED</span> instantly.
                  </p>
                </div>
              </div>

              {/* Reservation Breakdown Card */}
              <div className="luxury-card p-6 bg-white space-y-3 text-xs text-slate-600">
                <h4 className="font-serif font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  Reservation Summary
                </h4>
                <div className="flex justify-between">
                  <span>Guest Name:</span>
                  <span className="font-bold text-slate-900">{booking.staff_name || 'Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Table Number:</span>
                  <span className="font-bold text-purple-700">{booking.table_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Slot:</span>
                  <span className="font-bold text-slate-900">{booking.booking_date} ({booking.time_slot})</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span className="font-bold text-slate-900">{booking.guests} Guests</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </section>

      {/* ── FOOTER ── */}
      <Footer />

    </div>
  );
}
