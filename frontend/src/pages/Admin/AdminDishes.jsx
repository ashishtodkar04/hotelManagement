import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { 
  Utensils, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowLeft,
  Image as ImageIcon,
  Flame,
  AlertCircle
} from 'lucide-react';

export default function AdminDishes() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [actionMsg, setActionMsg] = useState('');

  // Modal / Form state for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Starter',
    image: '',
    description: '',
    type: 'veg'
  });

  useEffect(() => {
    fetchDishes();

    socket.connect();
    socket.on('dish_update', fetchDishes);
    return () => socket.off('dish_update', fetchDishes);
  }, []);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/dishes');
      if (res.data.success) {
        setDishes(res.data.dishes || []);
      }
    } catch (err) {
      console.error('Fetch dishes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingDish(null);
    setFormData({
      name: '',
      price: '',
      category: 'Starter',
      image: '',
      description: '',
      type: 'veg'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      price: dish.price,
      category: dish.category,
      image: dish.image || '',
      description: dish.description || '',
      type: dish.type || 'veg'
    });
    setShowModal(true);
  };

  const handleToggleAvailability = async (id) => {
    try {
      const res = await api.patch(`/api/admin/dishes/${id}/availability`);
      if (res.data.success) {
        fetchDishes();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle availability');
    }
  };

  const handleDeleteDish = async (id) => {
    if (!window.confirm('Delete this dish from gourmet menu catalog?')) return;
    try {
      const res = await api.delete(`/api/admin/dishes/${id}`);
      if (res.data.success) {
        setActionMsg('Dish removed from catalog.');
        fetchDishes();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete dish');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        category: formData.category,
        image: formData.image,
        description: formData.description,
        type: formData.type
      };

      if (editingDish) {
        await api.put(`/api/admin/dishes/${editingDish.id}`, payload);
        setActionMsg('Dish details updated successfully.');
      } else {
        await api.post('/api/admin/dishes', payload);
        setActionMsg('New dish added to menu catalog.');
      }

      setShowModal(false);
      fetchDishes();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to save dish');
    }
  };

  const filteredDishes = dishes.filter(d => {
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">Gourmet Dish Menu Catalog</h1>
            <p className="text-xs text-slate-500">Configure menu prices, images, veg/non-veg tags, and kitchen availability</p>
          </div>
        </div>

        <button onClick={handleOpenAddModal} className="btn-gold text-xs font-bold">
          <Plus className="w-4 h-4" /> Add New Dish
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['All', 'Starter', 'Main Course', 'Dessert', 'Drinks'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Grid Catalog */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading dish catalog...</div>
      ) : filteredDishes.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          No dishes found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDishes.map((dish) => (
            <div key={dish.id} className="luxury-card p-5 bg-white border border-slate-200 space-y-4 flex flex-col justify-between">
              
              <div>
                <div className="h-44 rounded-2xl overflow-hidden relative mb-3 bg-slate-100">
                  <img
                    src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    dish.type === 'veg' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    {dish.type === 'veg' ? 'Veg' : 'Non-Veg'}
                  </span>

                  <button
                    onClick={() => handleToggleAvailability(dish.id)}
                    className={`absolute top-3 right-3 text-[10px] font-bold px-3 py-1 rounded-full shadow-md transition-all ${
                      dish.is_available ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {dish.is_available ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>

                <div className="flex justify-between items-start">
                  <h3 className="font-serif font-bold text-slate-900 text-lg">{dish.name}</h3>
                  <span className="font-bold text-emerald-700 text-lg">₹{dish.price}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dish.description || 'No description provided.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{dish.category}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(dish)}
                    className="p-2 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-serif font-bold text-xl text-slate-900">
                {editingDish ? 'Edit Dish Details' : 'Add New Gourmet Dish'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diet Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-light-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-emerald text-xs font-bold">
                  Save Dish Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
