import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useStore from '../store/useStore';
import Footer from '../components/Footer';
import { 
  Utensils, 
  Sparkles, 
  Search, 
  Filter, 
  Flame, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  ChefHat, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function Menu() {
  const { user } = useStore();
  const navigate = useNavigate();

  const [menuData, setMenuData] = useState({ Starter: [], 'Main Course': [], Dessert: [], Drinks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState('all'); // all | veg | nonveg
  const [aiCombo, setAiCombo] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Cart for ordering
  const [cart, setCart] = useState({});

  useEffect(() => {
    fetchMenu();
    fetchAiRecommendation();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');
      if (res.data.success) {
        setMenuData({
          Starter: res.data.Starter || [],
          'Main Course': res.data['Main Course'] || [],
          Dessert: res.data.Dessert || [],
          Drinks: res.data.Drinks || []
        });
      }
    } catch (err) {
      console.error('Menu load error:', err);
      setError('Failed to load gourmet menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiRecommendation = async () => {
    try {
      setLoadingAi(true);
      const userId = user?.id || 0;
      const res = await api.get(`/api/recommend/${userId}`);
      if (res.data && res.data.combo) {
        setAiCombo(res.data.combo);
      }
    } catch (err) {
      console.warn('AI Recommendation error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const allDishes = [
    ...(menuData.Starter || []),
    ...(menuData['Main Course'] || []),
    ...(menuData.Dessert || []),
    ...(menuData.Drinks || [])
  ];

  const filteredDishes = allDishes.filter(dish => {
    const matchesCategory = activeCategory === 'All' || dish.category === activeCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiet = dietFilter === 'all' || 
                        (dietFilter === 'veg' && dish.type === 'veg') || 
                        (dietFilter === 'nonveg' && dish.type === 'non-veg');
    return matchesCategory && matchesSearch && matchesDiet;
  });

  const updateCart = (dish, delta) => {
    setCart(prev => {
      const currentQty = prev[dish.id]?.qty || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[dish.id];
        return copy;
      }
      return {
        ...prev,
        [dish.id]: {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          qty: newQty,
          type: dish.type
        }
      };
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleProceedToBooking = () => {
    sessionStorage.setItem('selected_cart', JSON.stringify(cartItems));
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      
      {/* ── HEADER HERO ── */}
      <section className="pt-12 pb-12 bg-gradient-to-b from-emerald-900/10 via-emerald-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-bold uppercase tracking-widest">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>Botanical Gourmet Dining</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-slate-900">
            Our Exquisite <span className="accent-emerald-text">Culinary Menu</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Carefully curated dishes by world-class chefs utilizing farm-fresh organic ingredients, rich spices, and refined culinary art.
          </p>
        </div>
      </section>

      {/* ── AI SMART RECOMMENDATION COMBO BAR ── */}
      {aiCombo && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-12">
          <div className="luxury-card p-6 sm:p-8 bg-white border-2 border-emerald-300/80 shadow-xl rounded-3xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl accent-emerald-gradient text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900">
                    AI Curated Smart Combo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Personalized multi-course pairing powered by Python ML Engine
                  </p>
                </div>
              </div>
              <button
                onClick={fetchAiRecommendation}
                className="btn-light-secondary text-xs"
                disabled={loadingAi}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                <span>Refresh AI Pairing</span>
              </button>
            </div>

            {/* Recommended Combo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              
              {['starter', 'main course', 'dessert', 'drinks'].map((catKey) => {
                const item = aiCombo[catKey] || aiCombo[catKey.toLowerCase()];
                if (!item) return null;
                return (
                  <div key={catKey} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md inline-block">
                      {catKey}
                    </span>
                    <h4 className="font-serif font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 italic truncate">{item.reason || 'Chef recommended'}</p>
                  </div>
                );
              })}

            </div>
          </div>
        </section>
      )}

      {/* ── FILTER & CATEGORY TABS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 space-y-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
            {['All', 'Starter', 'Main Course', 'Dessert', 'Drinks'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Diet Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            
            {/* Search Box */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Diet Filter Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setDietFilter('all')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${dietFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                All
              </button>
              <button
                onClick={() => setDietFilter('veg')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${dietFilter === 'veg' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Veg
              </button>
              <button
                onClick={() => setDietFilter('nonveg')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${dietFilter === 'nonveg' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Non-Veg
              </button>
            </div>

          </div>

        </div>

      </section>

      {/* ── DISH CATALOG GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="luxury-card p-4 space-y-4 animate-pulse">
                <div className="h-48 bg-slate-200 rounded-2xl" />
                <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-slate-200 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-rose-50 rounded-3xl border border-rose-200 max-w-xl mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-rose-800 font-bold text-sm">{error}</p>
            <button onClick={fetchMenu} className="btn-emerald mt-4 text-xs">Try Reloading</button>
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 max-w-xl mx-auto">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-slate-800 text-lg">No dishes found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDishes.map((dish) => {
              const qty = cart[dish.id]?.qty || 0;
              const isVeg = dish.type === 'veg';

              return (
                <div key={dish.id} className="luxury-card overflow-hidden flex flex-col justify-between group">
                  <div>
                    {/* Image */}
                    <div className="h-52 overflow-hidden relative">
                      <img 
                        src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                        alt={dish.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; }}
                      />
                      
                      {/* Veg / Non-Veg badge */}
                      <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md ${
                        isVeg ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {isVeg ? 'Veg' : 'Non-Veg'}
                      </span>

                      {!dish.is_available && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="bg-rose-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                            Sold Out Today
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {dish.name}
                        </h3>
                        <span className="font-bold text-emerald-700 text-lg">₹{dish.price}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {dish.description || 'Artfully prepared with prime ingredients and aromatic spices.'}
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Cart Action */}
                  <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {dish.category}
                    </span>

                    {dish.is_available ? (
                      qty > 0 ? (
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <button 
                            onClick={() => updateCart(dish, -1)}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-emerald-900 w-4 text-center">{qty}</span>
                          <button 
                            onClick={() => updateCart(dish, 1)}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateCart(dish, 1)}
                          className="btn-emerald !py-2 !px-4 text-xs font-bold shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Order</span>
                        </button>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Unavailable</span>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* ── FLOATING CART SUMMARY BAR ── */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-slide-up">
          <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border-2 border-emerald-500/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {cartItems.length} {cartItems.length === 1 ? 'Dish' : 'Dishes'} Selected
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  Subtotal: ₹{cartTotal}
                </p>
              </div>
            </div>

            <button
              onClick={handleProceedToBooking}
              className="btn-emerald !py-2.5 !px-6 text-xs font-bold shadow-lg"
            >
              <span>Attach Order to Table Reservation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <Footer />

    </div>
  );
}
