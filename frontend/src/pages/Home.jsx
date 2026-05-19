import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, MapPin, Award, ChevronRight, Utensils } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useHotel } from '../hooks/useHotel';


export default function Home() {
  const [dishes, setDishes] = useState([]);
  const { t } = useLanguage();
  const { name: HOTEL_NAME, year: HOTEL_YEAR } = useHotel();

  const stats = [
    { label: 'Years of Excellence', value: `${new Date().getFullYear() - parseInt(HOTEL_YEAR)}+` },
    { label: 'Signature Dishes', value: '80+' },
    { label: 'Happy Guests', value: '50K+' },
    { label: 'Awards Won', value: '18' },
  ];

  useEffect(() => {
    api.get('/').then(r => { if (r.data.success) setDishes(r.data.dishes.slice(0, 6)); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] transition-colors duration-500">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
           <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full"></div>
        </div>

        <div className="relative z-10 text-center px-4 md:px-6 max-w-7xl mx-auto pt-24 md:pt-32">
          <div className="inline-flex items-center gap-3 bg-blue-600/10 text-blue-600 mb-8 md:mb-10 py-3 px-6 md:px-8 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] border border-blue-600/20 shadow-xl animate-fade-in">
            <Award size={14} /> Awarded Best Fine Dining 2024
          </div>
          <h1 className="font-serif italic text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-bold leading-[1] md:leading-[0.85] mb-12 md:mb-16 tracking-tighter animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t('home_title').split(' ').map((word, i) => i === 2 ? <span key={i} className="text-blue-600 block lg:inline">{word} </span> : word + ' ')}
          </h1>
          <p className="text-sm md:text-2xl lg:text-3xl text-slate-400 dark:text-slate-500 max-w-3xl mx-auto mb-16 md:mb-20 leading-relaxed font-bold uppercase tracking-[0.2em] animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
            {t('home_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link to="/booking" className="btn-primary py-7 px-16 text-lg">
              {t('book_now')} <ArrowRight size={24} />
            </Link>
            <Link to="/menu" className="btn-secondary py-7 px-16 text-lg">
              {t('view_menu')}
            </Link>
          </div>
          
          <div className="mt-24 md:mt-40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            {stats.map(s => (
              <div key={s.label} className="glass p-8 md:p-10 group hover:-translate-y-2 transition-all duration-700">
                <div className="text-4xl md:text-5xl font-black text-[var(--theme-text)] mb-2 md:mb-3 group-hover:scale-110 transition-transform group-hover:text-blue-600">{s.value}</div>
                <div className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em] font-black">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 md:py-48 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
          {[
            { icon: Clock, title: 'Open Daily', desc: 'Lunch 12–3 PM · Dinner 7–11 PM · Advanced reservations required.' },
            { icon: MapPin, title: 'Atmosphere', desc: 'Savor your meal amidst architectural elegance and panoramic city views.' },
            { icon: Star, title: 'Culinary Craft', desc: 'Immersive tasting experiences curated by our award-winning brigade.' },
          ].map(f => (
            <div key={f.title} className="group flex flex-col items-center text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--theme-accent)] border border-[var(--theme-border)] rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-8 md:mb-10 group-hover:border-blue-600 transition-all duration-700 group-hover:-translate-y-4 shadow-xl">
                <f.icon size={30} md:size={36} className="text-blue-600" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 text-[var(--theme-text)] tracking-tight">{f.title}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-base md:text-lg leading-relaxed font-bold tracking-tight px-4">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED DISHES ── */}
      <section className="py-48 px-6 bg-[var(--theme-accent)] relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-10">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-600 mb-6">Culinary Excellence</p>
              <h2 className="font-serif italic text-6xl md:text-8xl font-bold text-[var(--theme-text)] leading-tight">Signature Creations</h2>
            </div>
            <Link to="/menu" className="btn-secondary py-5 px-10 gap-4 group">
              VIEW THE FULL COLLECTION <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          {dishes.length === 0 ? (
            <div className="grid md:grid-cols-3 gap-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass h-[500px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {dishes.map((d) => (
                <div key={d.id} className="glass overflow-hidden group hover:-translate-y-3 hover:shadow-2xl transition-all duration-700">
                  <div className="h-80 bg-[var(--theme-bg)] flex items-center justify-center relative overflow-hidden">
                    {d.image
                      ? <img src={d.image.startsWith('http') ? d.image : `http://localhost:3000${d.image}`} alt={d.name} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[2s] ease-out" />
                      : <div className="p-10"><Utensils size={64} className="text-slate-200" /></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute bottom-8 right-8 glass px-8 py-3 text-[var(--theme-text)] font-black shadow-2xl border-white/20 text-lg">₹{d.price}</div>
                  </div>
                  <div className="p-10">
                    <h3 className="font-black text-3xl mb-4 text-[var(--theme-text)] group-hover:text-blue-600 transition-colors tracking-tight">{d.name}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-base leading-relaxed mb-8 line-clamp-2 font-bold tracking-tight">{d.description || 'A masterfully crafted signature selection using the finest seasonal ingredients.'}</p>
                    {d.category && (
                      <span className="badge-blue">{d.category}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 md:py-48 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 dark:bg-white rounded-[2rem] md:rounded-[4rem] p-12 md:p-32 relative overflow-hidden shadow-2xl group text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-transparent to-indigo-500/20 pointer-events-none group-hover:scale-110 transition-transform duration-[3s]" />
            <div className="relative z-10">
              <p className="text-[10px] md:text-[11px] font-black text-blue-400 dark:text-blue-600 uppercase tracking-[0.5em] md:tracking-[1em] mb-6 md:mb-10">Reservations</p>
              <h2 className="font-serif italic text-5xl md:text-9xl font-bold mb-8 md:mb-12 text-white dark:text-slate-900 leading-[1] md:leading-[0.9] tracking-tighter">Ready for an <br className="hidden md:block" />Evening of Perfection?</h2>
              <p className="text-slate-400 dark:text-slate-500 mb-12 md:mb-20 text-lg md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed">Secure your table today and let us orchestrate an exceptional culinary experience designed around you.</p>
              <Link to="/booking" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white text-lg md:text-2xl py-6 md:py-8 px-12 md:px-20 rounded-[1.5rem] md:rounded-[2.5rem] font-black shadow-2xl hover:scale-105 transition-transform inline-flex items-center gap-4 group/cta">
                {t('book_now').toUpperCase()} <ArrowRight size={24} md:size={28} className="group-hover/cta:translate-x-3 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[var(--theme-accent)] border-t border-[var(--theme-border)] py-32 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-5 mb-12 group">
            <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-700">
              <Utensils size={32} className="text-white" />
            </div>
            <span className="font-serif font-bold text-5xl text-[var(--theme-text)] tracking-tighter">{HOTEL_NAME}</span>
          </div>
          <p className="text-slate-400 dark:text-slate-600 text-base mb-12 font-bold tracking-tight uppercase">© {new Date().getFullYear()} {HOTEL_NAME} · Sovereign Excellence Since {HOTEL_YEAR}</p>
          <div className="flex flex-wrap justify-center gap-16 text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">
            <Link to="/menu" className="hover:text-blue-600 transition-colors">{t('menu')}</Link>
            <Link to="/booking" className="hover:text-blue-600 transition-colors">{t('booking')}</Link>
            <Link to="/auth" className="hover:text-blue-600 transition-colors">{t('login')}</Link>
            <Link to="/admin" className="hover:text-blue-600 transition-colors">{t('admin')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
