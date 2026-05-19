import { useState, useEffect } from 'react';
import { Leaf, Flame, Search, ChevronRight, Utensils, Star, Activity, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useStore from '../store/useStore';

const TABS = [
  { id: 'Starter', label: 'Starter', emoji: '🥗', desc: 'Fresh beginnings to awaken your palate.' },
  { id: 'Main Course', label: 'Main Course', emoji: '🍽️', desc: 'Hearty and masterfully prepared main selections.' },
  { id: 'Dessert', label: 'Dessert', emoji: '🍮', desc: 'A sweet and satisfying conclusion.' },
  { id: 'Drinks', label: 'Drinks', emoji: '🥂', desc: 'Refreshing beverages and fine drinks.' },
];

function DishCard({ dish, tabEmoji }) {
  return (
    <div className="glass p-6 md:p-8 flex flex-col h-full group hover:-translate-y-3 hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
         <Utensils size={100} />
      </div>
      
      <div className="h-56 md:h-64 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[var(--theme-accent)] mb-6 md:mb-8 flex items-center justify-center relative border border-[var(--theme-border)]">
        {dish.image ? (
          <img
            src={dish.image.startsWith('http') ? dish.image : `http://localhost:3000${dish.image}`}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[2s] ease-out"
          />
        ) : (
          <span className="text-5xl md:text-7xl group-hover:scale-110 transition-transform duration-700 opacity-20">{tabEmoji}</span>
        )}
        
        {dish.type && (
          <div className={`absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-xl ${dish.type === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {dish.type === 'veg' ? <Leaf size={18} className="text-white" /> : <Flame size={18} className="text-white" />}
          </div>
        )}
        
        <div className="absolute bottom-6 left-8 flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-blue-600 text-blue-600" />)}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-blue-600 font-black">{dish.category}</span>
          <span className="text-[var(--theme-text)] font-black text-2xl md:text-3xl font-serif tracking-tight group-hover:text-blue-600 transition-colors">₹{dish.price}</span>
        </div>
        <h3 className="font-black text-xl md:text-2xl mb-4 text-[var(--theme-text)] group-hover:text-blue-600 transition-colors leading-[1.1] tracking-tighter">{dish.name}</h3>
        <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-3 font-bold tracking-tight mb-8">
          {dish.description || 'Experience a masterfully orchestrated selection, featuring artisanal ingredients and avant-garde techniques.'}
        </p>
      </div>

      <div className="pt-6 md:pt-8 border-t border-[var(--theme-border)] mt-auto">
        <Link to="/booking" className="btn-primary w-full py-4 md:py-5 rounded-2xl shadow-xl text-[9px] md:text-[10px]">
          SECURE RESERVATION <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}


export default function Menu() {
  const [menu, setMenu] = useState({ Starter: [], 'Main Course': [], Dessert: [], Drinks: [] });
  const [activeTab, setActiveTab] = useState('Starter');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [showRecs, setShowRecs] = useState(false);
  const { user } = useStore();

  useEffect(() => {
    setTimeout(() => {
      setLoading(true);
    }, 0);
    api.get('/menu').then(r => {
      if (r.data.success) {
        const allDishes = { 
          Starter: r.data.Starter || [], 
          'Main Course': r.data['Main Course'] || [], 
          Dessert: r.data.Dessert || [],
          Drinks: r.data.Drinks || []
        };
        setMenu(allDishes);

        // Fetch recommendations (even for guests)
        api.get(`/api/recommend/${user?.id || 0}`).then(res => {
          if (res.data?.combo) {
            // Map names to full dish objects (Case-Insensitive)
            const combo = res.data.combo;
            const mapped = {};
            const flatMenu = [...allDishes.Starter, ...allDishes['Main Course'], ...allDishes.Dessert, ...allDishes.Drinks];
            
            Object.keys(combo).forEach(cat => {
              const dishObj = flatMenu.find(d => d.name.toLowerCase() === combo[cat].name.toLowerCase());
              if (dishObj) {
                mapped[cat] = { ...dishObj, reason: combo[cat].reason };
              }
            });
            setRecommendations(mapped);
          }
        }).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const currentTab = TABS.find(t => t.id === activeTab);
  const filtered = (menu[activeTab] || []).filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-24 md:pt-40 pb-32 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        <header className="text-center mb-20 md:mb-32 px-4">
          <div className="inline-flex items-center gap-3 bg-blue-600/10 text-blue-600 mb-8 py-3 px-6 md:px-8 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] border border-blue-600/20 shadow-xl animate-fade-in">
             <Activity size={14} className="animate-pulse" /> Live Culinary Transmission
          </div>
          <h1 className="font-serif italic text-5xl sm:text-6xl md:text-8xl lg:text-[10rem] font-bold mb-8 md:mb-10 text-[var(--theme-text)] leading-[0.9] md:leading-[0.8] tracking-tighter animate-fade-in" style={{ animationDelay: '0.2s' }}>The <span className="text-blue-600">Selection</span></h1>
          <p className="text-slate-400 dark:text-slate-500 text-lg md:text-2xl max-w-3xl mx-auto font-bold tracking-tight leading-relaxed animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>Seasonal heritage ingredients, avant-garde refinement, and an uncompromising dedication to sensory perfection.</p>
        </header>

        {/* ── RECOMMENDATIONS ── */}
        {recommendations && Object.keys(recommendations).length > 0 && showRecs && (
          <section className="mb-32 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-6 mb-12">
              <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[var(--theme-text)] tracking-tight">Curated For You</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Personalized Pairing Experience</p>
              </div>
              <button onClick={() => setShowRecs(false)} className="ml-auto text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.keys(recommendations).map(cat => (
                <div key={cat} className="relative group">
                  <div className="absolute -top-3 left-8 z-20 px-4 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    {cat}
                  </div>
                  <DishCard dish={recommendations[cat]} tabEmoji={TABS.find(t => t.id === cat || t.id.includes(cat.split(' ')[0]))?.emoji || '✨'} />
                  <div className="mt-4 px-6 py-3 bg-blue-600/5 border border-blue-600/10 rounded-2xl">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-relaxed">
                       {recommendations[cat].reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 md:gap-16 mb-24 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                className={`px-8 md:px-12 py-4 md:py-6 rounded-[2rem] md:rounded-[2.5rem] text-[10px] md:text-[11px] font-black tracking-[0.2em] md:tracking-[0.3em] transition-all duration-700 border-2 uppercase ${
                  activeTab === tab.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-105' 
                  : 'bg-[var(--theme-panel)] border-[var(--theme-border)] text-slate-400 hover:text-blue-600 hover:border-blue-600'
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
            {recommendations && Object.keys(recommendations).length > 0 && (
              <button
                onClick={() => setShowRecs(!showRecs)}
                className={`px-8 md:px-12 py-4 md:py-6 rounded-[2rem] md:rounded-[2.5rem] text-[10px] md:text-[11px] font-black tracking-[0.2em] md:tracking-[0.3em] transition-all duration-700 border-2 uppercase flex items-center gap-3 ${
                  showRecs 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-105' 
                  : 'bg-emerald-600/10 border-emerald-600/20 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                <Sparkles size={16} /> {showRecs ? 'Close Suggestions' : 'Personalised'}
              </button>
            )}
          </div>

          <div className="relative w-full max-w-xl group">
            <Search size={24} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search for a masterpiece…" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-20 pr-10 w-full text-xl py-6 bg-[var(--theme-panel)] border border-[var(--theme-border)] focus:ring-8 focus:ring-blue-600/5 transition-all rounded-[3rem] shadow-sm font-black outline-none tracking-tight" 
            />
          </div>
        </div>

        {!loading && (
          <div className="flex items-center gap-10 mb-20 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <div className="h-px flex-1 bg-[var(--theme-border)]" />
            <div className="text-center">
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em] mb-2">
                Archives: <span className="text-blue-600">{filtered.length}</span> {currentTab?.label}
              </p>
              <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 italic tracking-widest">{currentTab?.desc}</p>
            </div>
            <div className="h-px flex-1 bg-[var(--theme-border)]" />
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass h-[600px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass py-48 text-center border-dashed border-2 max-w-5xl mx-auto animate-fade-in">
            <div className="w-24 h-24 bg-[var(--theme-accent)] rounded-[2rem] flex items-center justify-center mx-auto mb-10">
               <Utensils size={48} className="text-slate-200" />
            </div>
            <h3 className="text-4xl font-black text-slate-300 tracking-tighter uppercase">
              {search ? `No culinary matches for "${search}"` : 'Curating the future of fine dining.'}
            </h3>
            {search && <button onClick={() => setSearch('')} className="btn-secondary mt-12">CLEAR FILTER</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 md:gap-10 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            {filtered.map(dish => (
              <DishCard key={dish.id} dish={dish} tabEmoji={currentTab?.emoji} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
