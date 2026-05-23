import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function Inventory() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Item Form
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', unit: 'kg', current_stock: 0, low_stock_threshold: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, dishRes] = await Promise.all([
        api.get('/api/admin/inventory'),
        api.get('/api/dishes')
      ]);
      setItems(invRes.data.items || []);
      setDishes(dishRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/inventory', newItem);
      setShowAdd(false);
      setNewItem({ name: '', unit: 'kg', current_stock: 0, low_stock_threshold: 0 });
      fetchData();
    } catch (err) {
      alert('Failed to add item');
    }
  };

  const updateItem = async (id, stock, threshold) => {
    try {
      await api.put(`/api/admin/inventory/${id}`, { current_stock: stock, low_stock_threshold: threshold });
      fetchData();
    } catch (err) {
      alert('Failed to update item');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      await api.delete(`/api/admin/inventory/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading Inventory...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[var(--theme-text)] flex items-center gap-3 tracking-tighter">
            <Package size={28} className="text-blue-500" /> Inventory Engine
          </h1>
          <p className="text-slate-400 mt-2 font-bold tracking-wide">Manage raw materials and track stock levels</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary py-3 px-6 text-xs flex items-center gap-2">
          <Plus size={16} /> ADD ITEM
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addItem} className="glass p-6 rounded-2xl flex gap-4 items-end animate-slide-up">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Item Name</label>
            <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-white px-4 py-3 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Tomato, Flour" />
          </div>
          <div className="w-32">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Unit</label>
            <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-white px-4 py-3 rounded-xl focus:border-blue-500 outline-none">
              <option value="kg">KG</option>
              <option value="grams">Grams</option>
              <option value="liters">Liters</option>
              <option value="ml">ML</option>
              <option value="pieces">Pieces</option>
            </select>
          </div>
          <div className="w-32">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Current Stock</label>
            <input type="number" step="0.01" required value={newItem.current_stock} onChange={e => setNewItem({...newItem, current_stock: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-white px-4 py-3 rounded-xl focus:border-blue-500 outline-none" />
          </div>
          <div className="w-32">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Low Alert</label>
            <input type="number" step="0.01" required value={newItem.low_stock_threshold} onChange={e => setNewItem({...newItem, low_stock_threshold: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-white px-4 py-3 rounded-xl focus:border-blue-500 outline-none" />
          </div>
          <button type="submit" className="bg-blue-600 text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors">SAVE</button>
        </form>
      )}

      <div className="glass rounded-3xl overflow-hidden border border-blue-500/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-panel)]/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Item Name</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Unit</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Current Stock</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Low Alert</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-border)]">
              {items.map(item => {
                const isLow = Number(item.current_stock) <= Number(item.low_stock_threshold);
                return (
                  <tr key={item.id} className="hover:bg-[var(--theme-panel)]/40 transition-colors group">
                    <td className="p-6 text-sm font-bold text-white flex items-center gap-3">
                      {isLow && <AlertCircle size={16} className="text-rose-500 animate-pulse" />}
                      {item.name}
                    </td>
                    <td className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{item.unit}</td>
                    <td className="p-6">
                      <input 
                        type="number" 
                        step="0.01" 
                        className={`w-24 bg-[var(--theme-input)] border ${isLow ? 'border-rose-500/50 text-rose-400' : 'border-[var(--theme-border)] text-white'} px-3 py-2 rounded-lg outline-none text-center font-bold`}
                        defaultValue={item.current_stock}
                        onBlur={(e) => updateItem(item.id, e.target.value, item.low_stock_threshold)}
                      />
                    </td>
                    <td className="p-6">
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-24 bg-[var(--theme-input)] border border-[var(--theme-border)] text-slate-400 px-3 py-2 rounded-lg outline-none text-center"
                        defaultValue={item.low_stock_threshold}
                        onBlur={(e) => updateItem(item.id, item.current_stock, e.target.value)}
                      />
                    </td>
                    <td className="p-6 flex gap-3">
                      <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
