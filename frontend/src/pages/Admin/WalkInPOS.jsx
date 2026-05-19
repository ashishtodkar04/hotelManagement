import { useEffect, useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import api from '../../services/api';
import useStore from '../../store/useStore';
import { useLanguage } from '../../context/LanguageContext';
import { Search, Plus, Minus, Trash2, ShoppingCart, ChefHat, ChevronLeft, Utensils, Sparkles } from 'lucide-react';

export default function WalkInPOS() {
  const { isAdmin, isStaff, staffName } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTable, setSelectedTable] = useState('');
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const TABS = [
    { id: 'all', label: 'All Items', emoji: '✨' },
    { id: 'Starter', label: 'Starter', emoji: '🥗' },
    { id: 'Main Course', label: 'Main Course', emoji: '🍽️' },
    { id: 'Dessert', label: 'Dessert', emoji: '🍮' },
    { id: 'Drinks', label: 'Drinks', emoji: '🥂' },
  ];

  useEffect(() => {
    if (!isAdmin && !isStaff) { navigate('/admin/staff-login'); return; }
    Promise.all([api.get('/api/admin/tables'), api.get('/api/admin/menu-items')])
      .then(([tr, mr]) => {
        setTables(tr.data.tables || []);
        setMenuItems(mr.data.dishes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin, isStaff, navigate]);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      return ex ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const filtered = menuItems.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) && 
    (activeCategory === 'all' || m.category === activeCategory)
  );

  const handleOrder = async () => {
    if (!selectedTable) { setError(t('select_table')); return; }
    if (cart.length === 0) { setError('Add items to continue'); return; }
    setError(''); setPlacing(true);
    try {
      const res = await api.post('/api/admin/walk-in', { 
        table: selectedTable, 
        guests, 
        cart,
        staff_name: isStaff ? staffName : 'ADMIN'
      });
      if (res.data.success) {
        if (isStaff) navigate('/admin/chef');
        else navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authorization sequence interrupted');
    } finally { setPlacing(false); }
  };

  if (!isAdmin && !isStaff) return <Navigate to="/admin/staff-login" />;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-32 pb-20 px-6 sm:px-12 transition-colors duration-500">
      <div className="max-w-[1800px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
          <div className="flex items-center gap-8">
            <Link to={isAdmin ? "/admin" : "/admin/chef"} className="w-16 h-16 bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-text)] hover:border-blue-600 transition-all shadow-xl">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 mb-2">{t('admin_terminal')}</p>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--theme-text)]">Walk-in <span className="text-blue-600">POS</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="glass px-10 py-6 flex flex-col items-center min-w-[200px]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('total_revenue')}</span>
              <span className="text-3xl font-black text-blue-600 font-serif">₹{total.toFixed(0)}</span>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Menu Selection (Left) */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
              <div className="flex flex-wrap gap-4">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-700 border-2 ${
                      activeCategory === tab.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-105' 
                      : 'bg-[var(--theme-panel)] border-[var(--theme-border)] text-slate-400 hover:text-blue-600 hover:border-blue-600'
                    }`}
                  >
                    {tab.emoji} {tab.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full xl:w-96 group">
                <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('identify_dish')}
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="w-full bg-[var(--theme-panel)] border border-[var(--theme-border)] focus:ring-8 focus:ring-blue-600/5 py-5 pl-16 pr-8 text-sm font-bold shadow-sm rounded-2xl outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="glass p-8 text-left group flex flex-col justify-between h-[280px] hover:-translate-y-2 hover:shadow-2xl transition-all duration-700"
                >
                  <div className="relative">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-black">{item.category}</span>
                      <div className="w-12 h-12 bg-[var(--theme-accent)] group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border border-[var(--theme-border)]">
                        <Plus size={24} />
                      </div>
                    </div>
                    <div className="font-black text-2xl text-[var(--theme-text)] group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight tracking-tight font-serif">{item.name}</div>
                  </div>
                  <div className="flex items-end justify-between">
                     <div className="text-3xl font-black text-slate-300 group-hover:text-[var(--theme-text)] transition-colors font-serif tracking-tight">₹{item.price}</div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-40 glass text-center border-dashed border-2">
                  <Utensils size={80} className="mx-auto mb-8 text-slate-200" />
                  <p className="text-3xl text-slate-300 font-black tracking-tighter uppercase">No matches found</p>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Ledger (Right) */}
          <div className="lg:col-span-4 h-fit sticky top-32">
            <div className="glass flex flex-col overflow-hidden shadow-2xl border-2 border-blue-600/5">
              <div className="px-12 py-10 border-b border-[var(--theme-border)] bg-[var(--theme-accent)] flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <ShoppingCart size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-[var(--theme-text)] tracking-tighter">{t('cart_summary')}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Namaste! Direct Entry</p>
                  </div>
                </div>
              </div>

              <div className="p-12 space-y-12">
                {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl p-6 text-[10px] font-black uppercase tracking-widest text-center animate-shake">{error}</div>}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-2">{t('placement')}</label>
                    <select 
                      value={selectedTable} 
                      onChange={e => setSelectedTable(e.target.value)} 
                      className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] focus:ring-4 focus:ring-blue-600/5 rounded-2xl py-5 px-6 text-sm font-bold outline-none appearance-none"
                    >
                      <option value="">{t('table')}…</option>
                      {tables.map(t_item => (
                        <option key={t_item.id} value={t_item.table_name} disabled={t_item.status === 'occupied'}>
                          {t_item.table_name}{t_item.status === 'occupied' ? ` (${t('occupied')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-2">{t('guests')}</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={guests} 
                      onChange={e => setGuests(e.target.value)} 
                      className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] focus:ring-4 focus:ring-blue-600/5 rounded-2xl py-5 px-6 text-sm font-black outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-4 custom-scroll">
                  {cart.length === 0 ? (
                    <div className="py-24 text-center opacity-30">
                      <div className="w-24 h-24 bg-[var(--theme-accent)] rounded-full flex items-center justify-center mx-auto mb-8">
                        <ShoppingCart size={40} className="text-slate-400" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Empty Ledger</p>
                    </div>
                  ) : cart.map(item => (
                    <div key={item.id} className="flex items-center gap-8 p-8 rounded-[2.5rem] bg-[var(--theme-accent)] border border-[var(--theme-border)] group hover:bg-[var(--theme-panel)] transition-all duration-500 hover:shadow-xl">
                      <div className="flex-1">
                        <div className="text-xl font-black text-[var(--theme-text)] group-hover:text-blue-600 transition-colors truncate font-serif tracking-tight">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-black tracking-widest mt-2 uppercase">₹{item.price} UNIT</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 bg-[var(--theme-input)] rounded-2xl p-2 border border-[var(--theme-border)]">
                          <button onClick={() => updateQty(item.id, -1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-600/10 transition-all">
                            <Minus size={18} />
                          </button>
                          <span className="w-8 text-center text-lg font-black">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-600/10 transition-all">
                            <Plus size={18} />
                          </button>
                        </div>
                        <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-rose-500 transition-colors p-2">
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {cart.length > 0 && (
                    <div className="pt-10 border-t border-[var(--theme-border)] space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Subtotal</span>
                        <span>₹{total.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Tax (10%)</span>
                        <span>₹{(total * 0.10).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-end pt-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{t('bill_amount')}</p>
                          <p className="text-sm font-black text-[var(--theme-text)] uppercase tracking-widest">Aggregate Liability</p>
                        </div>
                        <p className="text-5xl font-black text-blue-600 font-serif tracking-tight">₹{(total * 1.10).toFixed(0)}</p>
                      </div>
                      <button
                        onClick={handleOrder}
                        disabled={placing || cart.length === 0 || !selectedTable}
                        className="w-full btn-primary py-8 rounded-[2rem] disabled:opacity-30 group/btn mt-4"
                      >
                        {placing ? (
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><ChefHat size={24} className="group-hover/btn:scale-110 transition-transform" /> {t('authorize_session').toUpperCase()}</>
                        )}
                      </button>
                      <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-40 flex items-center justify-center gap-3">
                         <Sparkles size={10} className="text-blue-600" /> Namaste! Direct Entry Active
                      </p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
