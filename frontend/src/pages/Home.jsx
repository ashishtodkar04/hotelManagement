import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, MapPin, Utensils, ChevronRight } from 'lucide-react';
import api, { getApiUrl } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useHotel } from '../hooks/useHotel';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const [dishes, setDishes] = useState([]);
  const { t } = useLanguage();
  const { name: HOTEL_NAME, year: HOTEL_YEAR } = useHotel();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    api.get('/').then(r => { if (r.data.success) setDishes(r.data.dishes.slice(0, 6)); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen text-[var(--theme-text)] transition-colors duration-700 overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>
        <div className="relative z-10 text-center px-4 md:px-6 max-w-7xl mx-auto pt-28 md:pt-36">

          <div className="inline-flex items-center gap-3 mb-10 py-3 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border animate-fade-in"
            style={{
              background: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.1)',
              borderColor: isDark ? 'rgba(139,92,246,0.4)' : 'rgba(59,130,246,0.3)',
              color: isDark ? '#c4b5fd' : '#1d4ed8',
              backdropFilter: 'blur(20px)',
            }}>
            <Star size={12} fill="currentColor" /> Awarded Best Fine Dining 2024
          </div>

          <h1 className="font-serif italic font-bold leading-[0.85] mb-14 tracking-tighter animate-fade-in"
            style={{
              fontSize: 'clamp(4rem, 12vw, 11rem)',
              animationDelay: '0.2s',
              textShadow: isDark ? '0 0 80px rgba(139,92,246,0.4)' : '0 4px 40px rgba(59,130,246,0.15)',
            }}>
            {t('home_title').split(' ').map((word, i) =>
              i === 2
                ? <span key={i} style={{ color: isDark ? '#a78bfa' : '#2563eb' }}>{word} </span>
                : word + ' '
            )}
          </h1>

          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-20 leading-relaxed font-bold uppercase tracking-[0.2em] animate-fade-in px-4"
            style={{ animationDelay: '0.4s', color: isDark ? '#94a3b8' : '#475569' }}>
            {t('home_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link to="/booking" className="btn-primary py-7 px-16 text-base">
              {t('book_now')} <ArrowRight size={22} />
            </Link>
            <Link to="/menu" className="btn-secondary py-7 px-16 text-base">
              {t('view_menu')}
            </Link>
          </div>

          {/* ── PLANET STATS ── */}
          <div className="mt-32 md:mt-48 grid grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            {[
              { label: 'Years of Service', value: `${new Date().getFullYear() - parseInt(HOTEL_YEAR)}+`, planet: 'planet-earth' },
              { label: 'Dishes We Make', value: '80+', planet: 'planet-mars' },
              { label: 'Happy Guests', value: '50K+', planet: 'planet-gas' },
              { label: 'Awards Won', value: '18', planet: '' },
            ].map((s, i) => (
              <div key={i} className={`planet-card ${s.planet} flex flex-col items-center justify-center group mx-auto`}
                style={{ width: '160px', height: '160px',
                  background: s.planet ? undefined :
                    'radial-gradient(circle at 35% 35%, #e879f9 0%, #8b5cf6 50%, #4c1d95 90%)',
                }}>
                <div className="text-3xl md:text-4xl font-black mb-1 group-hover:scale-110 transition-transform text-white drop-shadow-2xl">{s.value}</div>
                <div className="text-[8px] text-white/80 font-black uppercase tracking-[0.2em] text-center drop-shadow px-4">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (CLOUD CARDS) ── */}
      <section className="py-32 md:py-56 px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto text-center mb-24">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] mb-6" style={{ color: isDark ? '#a78bfa' : '#2563eb' }}>Why Choose Us</p>
          <h2 className="font-serif italic text-5xl md:text-8xl font-bold leading-tight">A Space Like No Other</h2>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {[
            { icon: Clock, title: 'Open Every Day', desc: 'Lunch 12–3 PM · Dinner 7–11 PM. Come anytime, we are ready for you.' },
            { icon: MapPin, title: 'Beautiful Place', desc: 'Eat your meal in a beautiful space with amazing views of the city.' },
            { icon: Star, title: 'Great Food', desc: 'Our chef makes special food that you will remember for a long time.' },
          ].map((f, i) => (
            <div key={i} className="cloud-card p-12 md:p-16 group flex flex-col items-center text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center mb-10 transition-all duration-700 group-hover:-translate-y-4 shadow-2xl"
                style={{
                  background: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.1)',
                  border: `1px solid ${isDark ? 'rgba(139,92,246,0.4)' : 'rgba(59,130,246,0.3)'}`,
                }}>
                <f.icon size={32} style={{ color: isDark ? '#a78bfa' : '#2563eb' }} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-6 tracking-tight">{f.title}</h3>
              <p className="text-base md:text-lg leading-relaxed font-medium" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED DISHES ── */}
      <section className="py-32 px-6 relative" style={{ zIndex: 1, background: isDark ? 'rgba(139,92,246,0.05)' : 'rgba(59,130,246,0.05)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] mb-6" style={{ color: isDark ? '#a78bfa' : '#2563eb' }}>Our Best Food</p>
              <h2 className="font-serif italic text-6xl md:text-8xl font-bold leading-tight">Top Dishes</h2>
            </div>
            <Link to="/menu" className="btn-secondary py-5 px-10 gap-4 group">
              SEE ALL DISHES <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {(dishes.length === 0 ? [...Array(6)] : dishes).map((d, i) => (
              d ? (
                <div key={d.id} className="cloud-card overflow-hidden group">
                  <div className="h-72 flex items-center justify-center relative overflow-hidden" style={{ background: isDark ? 'rgba(10,10,30,0.5)' : 'rgba(219,234,254,0.5)' }}>
                    {d.image
                      ? <img src={d.image.startsWith('http') ? d.image : `${getApiUrl()}${d.image}`} alt={d.name} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[2s] ease-out" />
                      : <Utensils size={64} style={{ color: isDark ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.2)' }} />
                    }
                    <div style={{ position:'absolute', bottom:24, right:24, backdropFilter:'blur(20px)', background: isDark ? 'rgba(10,10,30,0.7)' : 'rgba(255,255,255,0.7)', border:`1px solid ${isDark ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.2)'}`, padding:'8px 20px', borderRadius:'999px', fontWeight:900, fontSize:'1.1rem' }}>
                      ₹{d.price}
                    </div>
                  </div>
                  <div className="p-10">
                    <h3 className="font-black text-2xl mb-4 tracking-tight group-hover:text-blue-500 transition-colors">{d.name}</h3>
                    <p className="text-base leading-relaxed mb-6 line-clamp-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                      {d.description || 'A special dish made with love by our chef using the best ingredients.'}
                    </p>
                    {d.category && <span className="badge-blue">{d.category}</span>}
                  </div>
                </div>
              ) : (
                <div key={i} className="cloud-card h-[460px] animate-pulse" />
              )
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA PLANET ── */}
      <section className="py-32 md:py-56 px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="cloud-card p-16 md:p-32 relative overflow-hidden text-center"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(88,28,135,0.6) 0%, rgba(30,27,75,0.8) 50%, rgba(10,10,30,0.9) 100%)'
                : 'linear-gradient(135deg, rgba(30,58,138,0.9) 0%, rgba(37,99,235,0.8) 50%, rgba(79,70,229,0.7) 100%)',
              border: isDark ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(59,130,246,0.4)',
            }}>
            {/* Background planet orb */}
            <div style={{ position:'absolute', bottom:'-20%', right:'-15%', width:'50%', height:'50%', borderRadius:'50%', background:'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.05) 0%, rgba(139,92,246,0.2) 100%)', filter:'blur(40px)', pointerEvents:'none' }} />
            <div className="relative z-10">
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] mb-8 text-purple-300">Book Your Table</p>
              <h2 className="font-serif italic text-5xl md:text-8xl font-bold mb-10 leading-[0.9] tracking-tighter text-white">
                Ready for a Great<br className="hidden md:block" /> Dinner Tonight?
              </h2>
              <p className="mb-16 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed text-white/70">
                Pick your time and table. We will make sure you have the best time.
              </p>
              <Link to="/booking" className="inline-flex items-center gap-4 font-black text-lg md:text-xl py-6 md:py-8 px-12 md:px-20 rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: 'white', color: '#0f0a3c' }}>
                {t('book_now').toUpperCase()} <ArrowRight size={24} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CELESTIAL CONTACT & COORDINATES ── */}
      <section className="py-20 px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto text-center mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] mb-4" style={{ color: isDark ? '#a78bfa' : '#2563eb' }}>Contact Us</p>
          <h2 className="font-serif italic text-4xl md:text-6xl font-bold leading-tight">Reach Our Station</h2>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="planet-card planet-earth p-12 flex flex-col items-center justify-center text-center group mx-auto" style={{ width: '250px', height: '250px' }}>
            <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2 drop-shadow">Coordinates</h3>
            <p className="text-xs font-bold text-white/90 drop-shadow max-w-[180px]">Orbit Street 45, Nebula Sector, New Delhi</p>
          </div>
          <div className="planet-card planet-mars p-12 flex flex-col items-center justify-center text-center group mx-auto" style={{ width: '250px', height: '250px' }}>
            <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2 drop-shadow">Hotline</h3>
            <p className="text-xs font-bold text-white/90 drop-shadow">+91 98765 43210</p>
            <p className="text-[9px] text-white/60 uppercase tracking-widest mt-1">Live Wavecomms</p>
          </div>
          <div className="planet-card planet-gas p-12 flex flex-col items-center justify-center text-center group mx-auto" style={{ width: '250px', height: '250px' }}>
            <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2 drop-shadow">Comms Link</h3>
            <p className="text-xs font-bold text-white/90 drop-shadow">reservations@lelite.com</p>
            <p className="text-[9px] text-white/60 uppercase tracking-widest mt-1">Sub-space Response</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER (PLANET CONTACT) ── */}
      <footer className="border-t py-24 px-6 relative" style={{ zIndex: 1, borderColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', background: isDark ? 'rgba(3,0,20,0.8)' : 'rgba(219,234,254,0.8)' }}>
        <div className="max-w-7xl mx-auto">

          {/* Planet navigation links */}
          <div className="flex flex-wrap justify-center gap-10 mb-20">
            {[
              { to: '/menu', label: t('menu'), planet: 'planet-earth', desc: 'See our dishes' },
              { to: '/booking', label: t('booking'), planet: 'planet-mars', desc: 'Book a table' },
              { to: '/auth', label: t('login'), planet: 'planet-gas', desc: 'Your account' },
              { to: '/admin', label: t('admin'), planet: '', desc: 'Staff area', color: 'radial-gradient(circle at 35% 35%, #e879f9 0%, #8b5cf6 50%, #4c1d95 90%)' },
            ].map((link, i) => (
              <Link key={i} to={link.to}
                className={`planet-card ${link.planet} group flex flex-col items-center justify-center text-center`}
                style={{ width: '140px', height: '140px', textDecoration: 'none',
                  background: link.planet ? undefined : link.color,
                }}>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-white mb-1 group-hover:scale-110 transition-transform drop-shadow">{link.label}</div>
                <div className="text-[9px] text-white/70 font-bold">{link.desc}</div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-5 mb-8">
              <div className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-2xl"
                style={{ background: isDark ? '#8b5cf6' : '#2563eb' }}>
                <Utensils size={28} className="text-white" />
              </div>
              <span className="font-serif font-bold text-4xl tracking-tighter">{HOTEL_NAME}</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest mb-8" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              © {new Date().getFullYear()} {HOTEL_NAME} · Great Food Since {HOTEL_YEAR}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
