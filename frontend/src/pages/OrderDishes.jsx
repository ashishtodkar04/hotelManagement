import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, Leaf, Flame, ChevronLeft, Utensils, Activity, Sparkles, Sparkle, X } from 'lucide-react';
import api, { getApiUrl } from '../services/api';
import useStore from '../store/useStore';
import { useLanguage } from '../context/LanguageContext';

export default function OrderDishes() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const { t } = useLanguage();

  const [menu, setMenu] = useState({ Starter: [], 'Main Course': [], Dessert: [], Drinks: [] });
  const [booking, setBooking] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('Starter');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [showCartMobile, setShowCartMobile] = useState(false);

  const TABS = [
    { id: 'Starter', label: t('starters'), emoji: '🥗' },
    { id: 'Main Course', label: t('mains'), emoji: '🍽️' },
    { id: 'Dessert', label: t('desserts'), emoji: '🍮' },
    { id: 'Drinks', label: t('drinks'), emoji: '🥂' },
  ];

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    const init = async () => {
      try {
        const [menuRes, bookingRes] = await Promise.all([
          api.get('/menu'),
          api.get(`/api/booking/${bookingId}`),
        ]);
        if (menuRes.data.success) {
          const allDishes = { 
            Starter: menuRes.data.Starter || [], 
            'Main Course': menuRes.data['Main Course'] || [], 
            Dessert: menuRes.data.Dessert || [],
            Drinks: menuRes.data.Drinks || []
          };
          setMenu(allDishes);

          // Fetch recommendations
          api.get(`/api/recommend/${user.id}`).then(res => {
            if (res.data?.combo) {
              const combo = res.data.combo;
              const mapped = {};
              const flatMenu = [...allDishes.Starter, ...allDishes['Main Course'], ...allDishes.Dessert, ...allDishes.Drinks];
              Object.keys(combo).forEach(cat => {
                const dishObj = flatMenu.find(d => d.name.toLowerCase() === combo[cat].name.toLowerCase());
                if (dishObj) mapped[cat] = { ...dishObj, reason: combo[cat].reason };
              });
              setRecommendations(mapped);
            }
          }).catch(() => {});
        }
        if (bookingRes.data.success) {
          const b = bookingRes.data.booking;
          setBooking(b);
          
          // If not seated, allow sync-editing existing orders
          if (['pending', 'confirmed'].includes(b.status) && bookingRes.data.orders?.length > 0) {
            const existingItems = bookingRes.data.orders.map(o => ({
              id: o.dish_id,
              name: o.name,
              price: Number(o.price),
              qty: Number(o.quantity),
              image: o.image
            }));
            setCart(existingItems);
          }
        }
      } catch {
        setError('System synchronization failed.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [bookingId, user, navigate]);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      return ex ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...item, qty: 1 }];
    });
  };
  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const filtered = (menu[activeTab] || []).filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setError(''); setPlacing(true);
    try {
      const isSync = ['pending', 'confirmed'].includes(booking?.status);
      const endpoint = isSync ? '/api/sync-order' : '/api/add-order';
      
      const res = await api.post(endpoint, {
        bookingId: Number(bookingId),
        items: cart.map(i => ({ id: i.id, qty: i.qty, price: i.price })),
      });
      if (res.data.success) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authorization failed. Please retry.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--theme-bg)] transition-colors duration-500">
      <div className="glass max-w-2xl w-full p-16 md:p-24 text-center shadow-2xl animate-fade-in relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <CheckCircle size={150} />
        </div>
        <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/20">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h2 className="font-serif italic text-6xl font-bold mb-8 text-[var(--theme-text)] leading-tight">{t('order_authorized').split(' ')[0]} <span className="text-emerald-600">{t('order_authorized').split(' ').slice(1).join(' ')}</span></h2>
        <p className="text-slate-400 dark:text-slate-500 text-xl mb-12 font-bold tracking-tight leading-relaxed">{t('transmission_authorized')}</p>
        
        <div className="bg-[var(--theme-accent)] rounded-[2.5rem] p-10 mb-12 space-y-6 border border-[var(--theme-border)] shadow-inner">
          {cart.map(i => (
            <div key={i.id} className="flex justify-between items-center text-sm font-bold">
              <span className="text-[var(--theme-text)]">{i.qty}× <span className="font-black font-serif text-lg">{i.name}</span></span>
              <span className="font-black text-slate-400">₹{i.price * i.qty}</span>
            </div>
          ))}
          <div className="pt-8 border-t border-[var(--theme-border)] flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{t('bill_amount')}</span>
            <span className="text-4xl font-black text-blue-600 font-serif">₹{cartTotal}</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <button onClick={() => { setCart([]); setSuccess(false); }} className="btn-primary w-full py-6 rounded-2xl shadow-2xl">
            {t('add_more').toUpperCase()}
          </button>
          <Link to="/dashboard" className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center gap-4 group">
             <div className="w-12 h-px bg-[var(--theme-border)] group-hover:w-20 group-hover:bg-blue-600 transition-all" />
             {t('dashboard').toUpperCase()}
             <div className="w-12 h-px bg-[var(--theme-border)] group-hover:w-20 group-hover:bg-blue-600 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-24 md:pt-32 pb-24 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1800px] mx-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 md:gap-10 mb-12 md:mb-16 animate-fade-in px-2">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            <Link to="/dashboard" className="w-14 h-14 md:w-16 md:h-16 bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-text)] hover:border-blue-600 transition-all shadow-xl">
               <ChevronLeft size={24} md:size={28} />
            </Link>
            <div>
               <div className="inline-flex items-center gap-3 bg-blue-600/10 text-blue-600 mb-2 py-1.5 px-4 md:px-6 rounded-full text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] border border-blue-600/20 shadow-sm">
                  <Activity size={12} className="animate-pulse" /> {t('monitor_sync')}
               </div>
               <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[var(--theme-text)] leading-tight">
                 {['pending', 'confirmed'].includes(booking?.status) ? 'Synchronizing' : 'Ordering'} for <span className="text-blue-600">{booking ? `${t('table')} ${booking.table_number}` : `Session`}</span>
               </h1>
            </div>
          </div>
          {cartCount > 0 && (
            <button 
              onClick={() => setShowCartMobile(true)}
              className="lg:hidden flex items-center gap-4 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce-subtle"
            >
               <ShoppingCart size={20} />
               <span className="font-black text-xs uppercase tracking-widest">{cartCount} {t('items')}</span>
            </button>
          )}
        </header>

        <div className="grid lg:grid-cols-12 gap-8 md:gap-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Menu Interface (Left) */}
          <div className="lg:col-span-8 space-y-12">
            {/* RECOMMENDATIONS */}
            {recommendations && (
              <section className="bg-blue-600/5 border border-blue-600/10 rounded-[2.5rem] p-6 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkle size={20} /></div>
                   <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Curated Pairings For You</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(recommendations).map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => addToCart(recommendations[cat])}
                      className="glass p-6 text-left group hover:border-blue-600 transition-all"
                    >
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{cat}</div>
                      <div className="font-serif italic font-bold text-lg text-[var(--theme-text)] group-hover:text-blue-600 transition-colors mb-1 truncate">{recommendations[cat].name}</div>
                      <div className="text-xs text-blue-600/60 font-bold leading-tight">{recommendations[cat].reason.split('+')[0]}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-start xl:items-center justify-between">
              <div className="flex flex-wrap gap-3 md:gap-4">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                    className={`px-6 md:px-10 py-3.5 md:py-5 rounded-[1.5rem] md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-700 border-2 ${
                      activeTab === tab.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-105' 
                      : 'bg-[var(--theme-panel)] border-[var(--theme-border)] text-slate-400 hover:text-blue-600 hover:border-blue-600'
                    }`}
                  >
                    {tab.emoji} {tab.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full xl:w-96 group">
                <Search size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('identify_dish')}
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="w-full bg-[var(--theme-panel)] border border-[var(--theme-border)] focus:ring-8 focus:ring-blue-600/5 py-5 md:py-6 pl-18 pr-8 text-sm font-bold shadow-sm rounded-[2rem] outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map(dish => {
                const inCart = cart.find(i => i.id === dish.id);
                return (
                  <div key={dish.id} className="glass p-8 flex items-center gap-6 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-700">
                    <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-[var(--theme-accent)] flex items-center justify-center shrink-0 relative border border-[var(--theme-border)]">
                      {dish.image
                        ? <img src={dish.image.startsWith('http') ? dish.image : `${getApiUrl()}${dish.image}`} alt={dish.name} className="w-full h-full object-cover transition-transform group-hover:scale-125 duration-[2s] ease-out" />
                        : <span className="text-4xl opacity-20">{TABS.find(t_item => t_item.id === activeTab)?.emoji}</span>
                      }
                      {dish.type && (
                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-xl ${dish.type === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {dish.type === 'veg' ? <Leaf size={12} className="text-white" /> : <Flame size={12} className="text-white" />}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-black text-xl text-[var(--theme-text)] group-hover:text-blue-600 transition-colors truncate font-serif tracking-tight">{dish.name}</div>
                      <div className="text-2xl font-black text-slate-400 dark:text-slate-600 font-serif tracking-tight">₹{dish.price}</div>
                    </div>

                    {inCart ? (
                      <div className="flex flex-col items-center gap-2 bg-[var(--theme-accent)] rounded-2xl p-1.5 border border-[var(--theme-border)] shadow-inner">
                        <button onClick={() => addToCart(dish)} className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                          <Plus size={16} />
                        </button>
                        <span className="w-6 text-center text-sm font-black text-blue-600">{inCart.qty}</span>
                        <button onClick={() => updateQty(dish.id, -1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                          <Minus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(dish)} className="w-14 h-14 rounded-2xl bg-blue-600/5 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-700 flex items-center justify-center shadow-sm border border-blue-600/10">
                        <Plus size={28} />
                      </button>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full py-40 glass text-center border-dashed border-2">
                  <Utensils size={80} className="mx-auto mb-8 text-slate-200" />
                  <p className="text-3xl text-slate-300 font-black tracking-tighter uppercase">No culinary matches found</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar (Right) - Desktop */}
          <div className="hidden lg:block lg:col-span-4 sticky top-40 h-fit">
             <CartContent />
          </div>

          {/* Cart Drawer - Mobile */}
          {showCartMobile && (
            <div className="fixed inset-0 z-[100] lg:hidden animate-fade-in">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCartMobile(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--theme-bg)] shadow-2xl flex flex-col border-l border-[var(--theme-border)]">
                <div className="p-6 border-b border-[var(--theme-border)] flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight text-[var(--theme-text)]">Your Selection</h3>
                  <button onClick={() => setShowCartMobile(false)} className="w-10 h-10 rounded-full bg-[var(--theme-panel)] flex items-center justify-center text-slate-400 hover:text-blue-600"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <CartContent />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function CartContent() {
    return (
      <div className="glass flex flex-col overflow-hidden shadow-2xl border-2 border-blue-600/5 h-fit">
        <div className="px-8 md:px-12 py-8 md:py-10 border-b border-[var(--theme-border)] bg-[var(--theme-accent)] flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShoppingCart size={24} md:size={28} />
            </div>
            <div>
              <h3 className="font-black text-xl md:text-2xl text-[var(--theme-text)] tracking-tighter">{t('cart_summary')}</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Namaste! {t('pending')}</p>
            </div>
          </div>
          {cart.length > 0 && <button onClick={() => setCart([])} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors p-2">Clear</button>}
        </div>

        <div className="p-8 md:p-12 space-y-10 md:space-y-12">
          {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl p-6 md:p-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-center animate-shake">{error}</div>}

          <div className="space-y-6 max-h-[45vh] overflow-y-auto pr-2 md:pr-4 custom-scroll">
            {cart.length === 0 ? (
              <div className="py-16 md:py-24 text-center opacity-30">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--theme-accent)] rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
                  <ShoppingCart size={32} md:size={40} className="text-slate-400" />
                </div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Awaiting Selection</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 md:gap-8 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-[var(--theme-accent)] border border-[var(--theme-border)] group hover:bg-[var(--theme-panel)] transition-all duration-500 hover:shadow-xl">
                <div className="flex-1 min-w-0">
                  <div className="text-lg md:text-xl font-black text-[var(--theme-text)] group-hover:text-blue-600 transition-colors truncate font-serif tracking-tight">{item.name}</div>
                  <div className="text-[9px] md:text-[10px] text-slate-400 font-black tracking-widest mt-2 uppercase">₹{item.price} UNIT</div>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2 md:gap-4 bg-[var(--theme-input)] rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-[var(--theme-border)]">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                      <Minus size={14} md:size={18} />
                    </button>
                    <span className="w-6 md:w-8 text-center text-base md:text-lg font-black">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-600/10 transition-all">
                      <Plus size={14} md:size={18} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 md:p-2">
                    <Trash2 size={20} md:size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="pt-8 md:pt-10 border-t border-[var(--theme-border)] space-y-8 md:space-y-10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{t('bill_amount')}</p>
                  <p className="text-[11px] md:text-sm font-black text-[var(--theme-text)] uppercase tracking-widest">Culinary Check</p>
                </div>
                <p className="text-4xl md:text-5xl font-black text-blue-600 font-serif tracking-tighter">₹{cartTotal}</p>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full btn-primary py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl group/btn"
              >
                {placing ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  <>{(['pending', 'confirmed'].includes(booking?.status) ? 'SYNC SELECTION' : t('authorize_session')).toUpperCase()} <CheckCircle size={24} className="group-hover/btn:scale-110 transition-transform" /></>
                )}
              </button>
              <p className="text-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-40 flex items-center justify-center gap-3">
                 <Sparkles size={10} className="text-blue-600" /> Authorized Transmission
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
}
