import React from 'react';
import { useHotel } from '../hooks/useHotel';
import Footer from '../components/Footer';
import { ChefHat, Award, ShieldCheck, Heart, Sparkles, Star } from 'lucide-react';

export default function AboutUs() {
  const { name: HOTEL_NAME, tagline, year } = useHotel();

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      
      {/* HERO */}
      <section className="pt-16 pb-16 bg-gradient-to-b from-amber-900/10 via-amber-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-bold uppercase tracking-widest">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Legacy of Fine Dining</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-slate-900">
            About <span className="accent-gold-text">{HOTEL_NAME}</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {tagline || 'Excellence in culinary art, luxury ambiance, and hospitality established with sovereign dedication.'}
          </p>
        </div>
      </section>

      {/* STORY SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
              A Culinary Sanctuary Built On Passion
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Founded in {year}, {HOTEL_NAME} was envisioned as a sanctuary where world-class cuisine meets unforgettable hospitality. Our master chefs draw inspiration from timeless royal recipes and contemporary culinary innovations.
            </p>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Every dish served is prepared with handpicked organic produce, authentic herbs, and prime-grade ingredients to guarantee an immaculate dining journey for our esteemed guests.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-sm">
                <p className="font-serif text-2xl font-bold text-slate-900">100%</p>
                <p className="text-xs text-slate-500">Organic & Farm Fresh</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-sm">
                <p className="font-serif text-2xl font-bold text-slate-900">5-Star</p>
                <p className="text-xs text-slate-500">Hospitality Standard</p>
              </div>
            </div>
          </div>

          <div className="luxury-card p-3 bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-amber-200/80">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" 
              alt="Restaurant Dining Area" 
              className="w-full h-[400px] object-cover rounded-2xl"
            />
          </div>

        </div>
      </section>

      <Footer />

    </div>
  );
}
