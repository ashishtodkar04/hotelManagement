import React from 'react';
import { Link } from 'react-router-dom';
import { useHotel } from '../hooks/useHotel';
import { ChefHat, Phone, Mail, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const { name: HOTEL_NAME, tagline, phone, year } = useHotel();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 mt-24 border-t border-slate-800 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <ChefHat className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold text-white tracking-wide">
                {HOTEL_NAME}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {tagline || 'Experience refined dining, luxury accommodations, and world-class hospitality.'}
            </p>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certified Hospitality Excellence Established {year}</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg font-bold text-white tracking-wide">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">Home & Suites</Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-amber-400 transition-colors">Gourmet Culinary Menu</Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-amber-400 transition-colors">Table Reservation</Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-amber-400 transition-colors">Guest Member Login</Link>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg font-bold text-white tracking-wide">Dining & Kitchen Hours</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Lunch Service:</span>
                <span className="text-amber-400 font-semibold">12:00 PM - 03:30 PM</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Dinner Service:</span>
                <span className="text-amber-400 font-semibold">06:30 PM - 11:00 PM</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Bar & Lounge:</span>
                <span className="text-slate-300 font-semibold">Open Till Midnight</span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg font-bold text-white tracking-wide">Concierge & Address</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>Grand Royale Palace Highway, Sector 4, Luxury Zone</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-amber-400 transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>concierge@{HOTEL_NAME.toLowerCase().replace(/\s+/g, '')}.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} {HOTEL_NAME} Hotel & Dining Management. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="hover:text-amber-400 transition-colors">Admin Login</Link>
            <span>•</span>
            <span className="flex items-center gap-1">
              Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for fine dining
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
