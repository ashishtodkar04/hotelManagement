import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { useHotel } from '../hooks/useHotel';
import { 
  Utensils, 
  Calendar, 
  User, 
  LogOut, 
  ShieldCheck, 
  Menu as MenuIcon, 
  X, 
  Clock, 
  ChefHat, 
  ChevronDown,
  PhoneCall
} from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, isStaff, logout, adminLogout } = useStore();
  const { name: HOTEL_NAME, tagline, phone } = useHotel();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const handleAdminLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-header transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Hotel Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl accent-gold-gradient flex items-center justify-center text-white shadow-lg shadow-amber-600/20 group-hover:scale-105 transition-transform duration-300">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors">
                {HOTEL_NAME}
              </span>
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest -mt-1">
                {tagline || 'Luxury Hotel & Dining'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/80 backdrop-blur-md">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-white text-amber-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Home
            </Link>

            <Link
              to="/menu"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                isActive('/menu') 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Menu
            </Link>

            <Link
              to="/booking"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                isActive('/booking') 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Table Booking
            </Link>

            {user && (
              <Link
                to="/history"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/history') 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                History & Orders
              </Link>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Contact Quick Link */}
            <a 
              href={`tel:${phone}`} 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-amber-700 bg-amber-500/10 rounded-xl border border-amber-500/20 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
              <span>{phone}</span>
            </a>

            {/* Admin Desk / Admin Login Link */}
            {(isAdmin || isStaff) ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin"
                  className="btn-gold !py-2.5 !px-4 text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Desk</span>
                </Link>
                <button
                  onClick={handleAdminLogout}
                  title="Admin Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition-colors border border-amber-200 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Admin Login</span>
              </Link>
            )}

            {/* User Account / Auth Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[11px]">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name || 'Guest'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email || user.username}</p>
                    </div>
                    <Link
                      to="/history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-700"
                    >
                      <Clock className="w-4 h-4" />
                      Booking History
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="btn-gold !py-2.5 !px-5 text-xs font-bold"
              >
                <User className="w-4 h-4" />
                <span>Log In / Sign Up</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-xl">
          <nav className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold ${isActive('/') ? 'bg-amber-50 text-amber-700' : 'text-slate-700'}`}
            >
              Home
            </Link>
            <Link
              to="/menu"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold ${isActive('/menu') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
            >
              Menu
            </Link>
            <Link
              to="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold ${isActive('/booking') ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
            >
              Table Booking
            </Link>
            {user && (
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold ${isActive('/history') ? 'bg-slate-100 text-slate-900' : 'text-slate-700'}`}
              >
                History & Orders
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <div className="pt-2 flex flex-col gap-2">
                <div className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-semibold text-slate-800">
                  Signed in as: <span className="font-bold text-amber-700">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full btn-gold !py-3 text-center text-xs font-bold"
              >
                Log In / Sign Up
              </Link>
            )}

            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold text-center border border-amber-200 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
