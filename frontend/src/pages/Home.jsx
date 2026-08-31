import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHotel } from '../hooks/useHotel';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';
import { 
  Utensils, 
  Calendar, 
  Sparkles, 
  Award, 
  Clock, 
  Users, 
  ChevronRight, 
  Star, 
  GlassWater, 
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { name: HOTEL_NAME, tagline } = useHotel();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [guests, setGuests] = useState(2);
  const [timeSlot, setTimeSlot] = useState('19:00');

  const handleQuickBooking = (e) => {
    e.preventDefault();
    navigate(`/booking?date=${date}&guests=${guests}&slot=${timeSlot}`);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      
      {/* ── HERO BANNER ── */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-100/50 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-bold uppercase tracking-widest shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>5-Star Fine Dining & Hospitality</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                An Extraordinary <span className="accent-gold-text">Culinary Journey</span> At {HOTEL_NAME}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Indulge in masterfully crafted gourmet cuisines, opulent table reservations, and an unforgettable ambiance tailored for connoisseurs of exquisite taste.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/booking" className="btn-gold text-sm font-bold shadow-lg shadow-amber-600/30">
                  <Calendar className="w-5 h-5" />
                  <span>Reserve A Table Now</span>
                </Link>
                <Link to="/menu" className="btn-outline-gold text-sm font-bold">
                  <Utensils className="w-5 h-5" />
                  <span>Explore Gourmet Menu</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200/80">
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">4.9 ★</p>
                  <p className="text-xs text-slate-500 font-medium">Guest Rating</p>
                </div>
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Fresh Ingredients</p>
                </div>
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">24/7</p>
                  <p className="text-xs text-slate-500 font-medium">Concierge Service</p>
                </div>
              </div>

            </div>

            {/* Right Visual Image Showcase */}
            <div className="lg:col-span-5">
              <div className="relative">
                {/* Main Card Image */}
                <div className="luxury-card p-3 overflow-hidden rounded-3xl shadow-2xl bg-white border-2 border-amber-200/60">
                  <img 
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80" 
                    alt="Luxury Dining Room" 
                    className="w-full h-[420px] object-cover rounded-2xl"
                  />
                </div>

                {/* Floating Badge Card 1 */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3 animate-fade-in">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Michelin-Inspired</p>
                    <p className="text-[10px] text-slate-500">Master Chef Crafting</p>
                  </div>
                </div>

                {/* Floating Badge Card 2 */}
                <div className="absolute -top-6 -right-6 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">AI Smart Combos</p>
                    <p className="text-[10px] text-slate-300">Customized Diners</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ── QUICK RESERVATION BAR WIDGET ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <form onSubmit={handleQuickBooking} className="luxury-card p-6 bg-white shadow-xl border border-amber-200/80 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Reservation Date</span>
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Preferred Time</span>
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full text-xs font-medium py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="12:00">12:00 PM (Lunch Slot)</option>
                <option value="13:30">01:30 PM (Lunch Slot)</option>
                <option value="19:00">07:00 PM (Dinner Slot)</option>
                <option value="20:30">08:30 PM (Dinner Slot)</option>
                <option value="22:00">10:00 PM (Late Night)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Total Guests</span>
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full text-xs font-medium py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value={1}>1 Guest (Single Table)</option>
                <option value={2}>2 Guests (Couple Table)</option>
                <option value={4}>4 Guests (Family Table)</option>
                <option value={6}>6 Guests (Royal Lounge)</option>
                <option value={8}>8+ Guests (VIP Suite)</option>
              </select>
            </div>

            <div>
              <button type="submit" className="w-full btn-gold !py-3 text-xs font-bold">
                <span>Check Available Tables</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </form>
      </section>

      {/* ── CULINARY HIGHLIGHTS SECTION ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-100 px-4 py-1.5 rounded-full inline-block">
            Chef's Signature Selections
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
            Handcrafted Gastronomic Excellence
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Every dish is an artful symphony of fresh organic spices, prime ingredients, and culinary mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="luxury-card overflow-hidden group">
            <div className="h-56 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80" 
                alt="Royal Saffron Biryani" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Chef's Favorite
              </span>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-serif text-xl font-bold text-slate-900">Royal Saffron Lamb Biryani</h3>
                <span className="font-bold text-amber-700 text-lg">₹750</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Slow-cooked tender lamb chunks layered with aged Basmati rice, Kashmir saffron, and aromatic spices.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">Non-Veg Specialty</span>
                <Link to="/menu" className="font-bold text-amber-700 flex items-center gap-1 hover:underline">
                  Order Now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="luxury-card overflow-hidden group">
            <div className="h-56 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80" 
                alt="Paneer Tikka Lababdar" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Veg Classic
              </span>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-serif text-xl font-bold text-slate-900">Paneer Tikka Lababdar</h3>
                <span className="font-bold text-amber-700 text-lg">₹480</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Charcoal-grilled cottage cheese cubes simmered in rich cashew, tomato, and butter gravy.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">100% Vegetarian</span>
                <Link to="/menu" className="font-bold text-amber-700 flex items-center gap-1 hover:underline">
                  Order Now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="luxury-card overflow-hidden group">
            <div className="h-56 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80" 
                alt="Signature Mocktails" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <span className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Refresher
              </span>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-serif text-xl font-bold text-slate-900">Golden Passionfruit Elixir</h3>
                <span className="font-bold text-amber-700 text-lg">₹320</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fresh passionfruit nectar infused with wild mint leaves, elderflower tonic, and edible gold flakes.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">Beverage Specialty</span>
                <Link to="/menu" className="font-bold text-amber-700 flex items-center gap-1 hover:underline">
                  Order Now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── AI COMBO RECOMMENDATION BANNER ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="luxury-card p-8 sm:p-12 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="bg-white/20 text-amber-100 text-xs font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-200" />
                Powered by Python Intelligence
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                Smart AI Dining Recommendations
              </h2>
              <p className="text-amber-100 text-sm leading-relaxed max-w-2xl">
                Our embedded Python ML engine analyzes your taste history, 24-hour dining trends, and current time of day to curate the perfect multi-course meal combo for you.
              </p>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <Link 
                to="/menu" 
                className="bg-white text-slate-900 hover:bg-amber-50 font-bold px-8 py-4 rounded-2xl shadow-xl flex items-center gap-2 text-sm transition-all transform hover:scale-105"
              >
                <span>View AI Combos</span>
                <ArrowRight className="w-4 h-4 text-amber-700" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer />

    </div>
  );
}
