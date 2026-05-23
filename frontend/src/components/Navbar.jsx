import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Moon, Sun, LogOut, Globe } from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useHotel } from '../hooks/useHotel';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const { user, logout, isAdmin, isStaff, adminLogout, adminThreads } = useStore();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const { name: HOTEL_NAME } = useHotel();

  const totalUnread = (isAdmin || isStaff) && adminThreads 
    ? adminThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0) 
    : 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  let navLinks = [];

  if (isAdmin || isStaff) {
    // Professional Navigation Hub
    if (isAdmin) {
      navLinks.push({ name: 'Management', path: '/admin' });
      navLinks.push({ name: 'Inventory', path: '/admin/inventory' });
      navLinks.push({ name: 'Concierge Chat', path: '/admin/chat', showBadge: true });
    }
    navLinks.push({ name: 'Warehouse', path: '/admin/warehouse' });
    navLinks.push({ name: 'Kitchen', path: '/admin/chef' });
    navLinks.push({ name: 'Walk-in POS', path: '/admin/pos' });
  } else {
    // Guest Navigation
    navLinks = [
      { name: t('menu'), path: '/menu' },
      { name: t('booking'), path: '/booking' },
      { name: t('dashboard'), path: '/dashboard', auth: true },
    ];
  }

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'हिंदी', short: 'HI' },
    { code: 'mr', label: 'मराठी', short: 'MR' }
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-700 ${
      scrolled 
      ? 'py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-xl' 
      : 'py-8 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center transition-transform group-hover:rotate-12 duration-500 shadow-lg border border-[var(--theme-border)]">
            <img src="/logo192.png" className="w-full h-full object-cover" alt="Lelite Logo" />
          </div>
          <span className="font-serif italic text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">{HOTEL_NAME}</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map(link => (
            (!link.auth || user) && (
              <Link 
                key={link.path} 
                to={link.path}
                className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 hover:text-blue-600 flex items-center gap-2 ${
                  location.pathname === link.path ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                <span>{link.name}</span>
                {link.showBadge && totalUnread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black animate-pulse shadow-md shadow-emerald-500/20">
                    {totalUnread}
                  </span>
                )}
              </Link>
            )
          ))}
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowLang(!showLang)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 transition-all"
            >
              <Globe size={16} /> {languages.find(l => l.code === lang)?.short}
            </button>
            {showLang && (
              <div className="absolute top-full right-0 mt-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-w-[120px] animate-fade-in">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLang(false); }}
                    className={`w-full px-6 py-4 text-left text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      lang === l.code ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all active:scale-90"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Auth Section */}
          {(isAdmin || isStaff) ? (
            <button 
              onClick={() => { adminLogout(); setIsOpen(false); }}
              className="btn-secondary py-3 px-6 text-[9px] gap-2 border-slate-200 dark:border-slate-800"
            >
              <LogOut size={14} /> {isAdmin ? 'LOGOUT ADMIN' : 'LOGOUT STAFF'}
            </button>
          ) : user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={logout}
                className="btn-secondary py-3 px-6 text-[9px] gap-2 border-slate-200 dark:border-slate-800"
              >
                <LogOut size={14} /> {t('logout').toUpperCase()}
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary py-3 px-8 text-[9px]">
              {t('login').toUpperCase()} <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
           <button onClick={() => {
             const nextLang = lang === 'en' ? 'hi' : lang === 'hi' ? 'mr' : 'en';
             setLang(nextLang);
           }} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black">
             {languages.find(l => l.code === lang)?.short}
           </button>
           <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
             {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
           </button>
           <button onClick={() => setIsOpen(!isOpen)} className="text-slate-900 dark:text-white">
             {isOpen ? <X size={32} /> : <Menu size={32} />}
           </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[80] bg-white dark:bg-slate-900/95 backdrop-blur-3xl animate-fade-in flex flex-col pt-32 px-10 pb-20">
          <div className="flex flex-col gap-6 flex-1 overflow-y-auto custom-scroll">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Navigational Hub</p>
            {navLinks.map((link, idx) => (
              (!link.auth || user) && (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setIsOpen(false)}
                  className="text-5xl font-serif italic font-bold text-slate-900 dark:text-white flex items-center justify-between group py-2"
                  style={{ animationDelay: `${idx * 0.1}s`, animation: 'fade-in 0.8s forwards' }}
                >
                  <span className="flex items-center gap-4">
                    <span>{link.name}</span>
                    {link.showBadge && totalUnread > 0 && (
                      <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-md">
                        {totalUnread}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="text-blue-600 opacity-50" size={32} />
                </Link>
              )
            ))}
            
            <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-8" />
            
            <div className="space-y-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Identity Control</p>
              {user ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-6 bg-slate-100 dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/30">{user.name?.[0]}</div>
                    <div>
                      <div className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{user.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{user.email}</div>
                    </div>
                  </div>
                  <button onClick={logout} className="w-full btn-secondary py-6 rounded-3xl text-xs flex items-center justify-center gap-4">
                    <LogOut size={18} /> {t('logout').toUpperCase()}
                  </button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setIsOpen(false)} className="w-full btn-primary py-7 rounded-3xl text-sm flex items-center justify-center gap-4">
                  ACCESS PORTAL <ChevronRight size={20} />
                </Link>
              )}
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">© {new Date().getFullYear()} {HOTEL_NAME} · Sovereign Experience</p>
          </div>
        </div>
      )}

    </nav>
  );
}
