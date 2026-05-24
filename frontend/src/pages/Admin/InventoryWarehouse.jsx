import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Plus, Trash2, Edit2, AlertCircle, ChevronLeft, 
  ShoppingCart, Zap, Flame, Calendar, User, Shield, BookOpen, Layers
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import useStore from '../../store/useStore';

export default function InventoryWarehouse() {
  const { isAdmin, isAdminLoading } = useStore();
  const [activeTab, setActiveTab] = useState('raw_materials'); // 'raw_materials', 'recipes', 'warehouse_logs'
  const [loading, setLoading] = useState(true);

  // Raw Materials Data
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showAddInv, setShowAddInv] = useState(false);
  const [newInvItem, setNewInvItem] = useState({ name: '', unit: 'kg', current_stock: 0, low_stock_threshold: 0 });

  // Recipe Builder Data
  const [dishes, setDishes] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]); // { inventory_item_id, quantity_deducted, name, unit }
  
  // Warehouse Logs Data
  const [warehouseLogs, setWarehouseLogs] = useState([]);
  const [showAddLog, setShowAddLog] = useState(false);
  const [newLog, setNewLog] = useState({ name: '', type: 'grocery', quantity: '', unit: '', cost: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = useCallback(async () => {
    if (isAdminLoading || !isAdmin) return;
    setLoading(true);
    try {
      const [invRes, dishRes, wareRes] = await Promise.all([
        api.get('/api/admin/inventory'),
        api.get('/api/admin/dishes'),
        api.get('/api/admin/warehouse')
      ]);
      setInventoryItems(invRes.data.items || []);
      setDishes(dishRes.data.dishes || []);
      setWarehouseLogs(wareRes.data.items || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isAdminLoading]);

  useEffect(() => {
    fetchData();
    socket.connect();
    socket.on('warehouse_update', fetchData);
    return () => {
      socket.off('warehouse_update');
      socket.disconnect();
    };
  }, [fetchData]);

  // --- RAW MATERIALS HANDLERS ---
  const addInventoryItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/inventory', newInvItem);
      setShowAddInv(false);
      setNewInvItem({ name: '', unit: 'kg', current_stock: 0, low_stock_threshold: 0 });
      fetchData();
    } catch (err) { alert('Failed to add item'); }
  };
  const updateInventoryItem = async (id, stock, threshold) => {
    try {
      await api.put(`/api/admin/inventory/${id}`, { current_stock: stock, low_stock_threshold: threshold });
      fetchData();
    } catch (err) { alert('Failed to update item'); }
  };
  const deleteInventoryItem = async (id) => {
    if (!window.confirm('Delete this raw material?')) return;
    try {
      await api.delete(`/api/admin/inventory/${id}`);
      fetchData();
    } catch (err) { alert('Failed to delete item'); }
  };

  // --- RECIPE BUILDER HANDLERS ---
  const loadRecipe = async (dishId) => {
    setSelectedDish(dishId);
    try {
      const res = await api.get(`/api/admin/inventory/recipe/${dishId}`);
      setRecipeItems(res.data.recipe || []);
    } catch (err) { alert('Failed to load recipe'); }
  };
  const addRecipeItem = () => {
    setRecipeItems([...recipeItems, { inventory_item_id: '', quantity_deducted: 0 }]);
  };
  const saveRecipe = async () => {
    if (!selectedDish) return;
    try {
      // Clean empty rows
      const ingredients = recipeItems.filter(r => r.inventory_item_id && Number(r.quantity_deducted) > 0);
      await api.post(`/api/admin/inventory/recipe/${selectedDish}`, { ingredients });
      alert('Recipe Saved! Raw materials will deduct automatically upon ordering.');
    } catch (err) { alert('Failed to save recipe'); }
  };

  // --- WAREHOUSE LOGS HANDLERS ---
  const addWarehouseLog = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/warehouse', newLog);
      setShowAddLog(false);
      setNewLog({ name: '', type: 'grocery', quantity: '', unit: '', cost: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) { alert('Failed to log expense'); }
  };
  const deleteWarehouseLog = async (id) => {
    if (!window.confirm('Delete this warehouse log?')) return;
    try {
      await api.delete(`/api/admin/warehouse/${id}`);
      fetchData();
    } catch (err) { alert('Failed to delete log'); }
  };

  if (isAdminLoading) return <div className="p-8 text-white">Loading...</div>;
  if (!isAdmin) return <Navigate to="/admin/login" />;

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto animate-fade-in">
        
        <header className="flex items-center gap-6 mb-12">
          <Link to="/admin" className="w-12 h-12 bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-text)] hover:border-blue-600 transition-all">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-[var(--theme-text)] tracking-tighter flex items-center gap-4">
              <Package className="text-blue-600" size={36} /> Inventory & Logistics
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Central Resource Management</p>
          </div>
        </header>

        <div className="flex gap-4 mb-10 overflow-x-auto pb-4">
          <button onClick={() => setActiveTab('raw_materials')} className={`px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all flex items-center gap-2 ${activeTab === 'raw_materials' ? 'bg-blue-600 text-white' : 'glass text-slate-400 hover:text-blue-500'}`}>
            <Layers size={16} /> Raw Materials
          </button>
          <button onClick={() => setActiveTab('recipes')} className={`px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all flex items-center gap-2 ${activeTab === 'recipes' ? 'bg-purple-600 text-white' : 'glass text-slate-400 hover:text-purple-500'}`}>
            <BookOpen size={16} /> Recipe Builder
          </button>
          <button onClick={() => setActiveTab('warehouse_logs')} className={`px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all flex items-center gap-2 ${activeTab === 'warehouse_logs' ? 'bg-orange-600 text-white' : 'glass text-slate-400 hover:text-orange-500'}`}>
            <Flame size={16} /> Expense Logs
          </button>
        </div>

        {/* --- RAW MATERIALS TAB --- */}
        {activeTab === 'raw_materials' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-[var(--theme-text)] tracking-tight">Stock Monitoring</h2>
              <button onClick={() => setShowAddInv(!showAddInv)} className="btn-primary py-3 px-6 text-[10px]"><Plus size={14} className="inline mr-2" /> ADD MATERIAL</button>
            </div>

            {showAddInv && (
              <form onSubmit={addInventoryItem} className="glass p-6 rounded-2xl flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Material Name</label>
                  <input type="text" required value={newInvItem.name} onChange={e => setNewInvItem({...newInvItem, name: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-3 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Tomato" />
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unit</label>
                  <select value={newInvItem.unit} onChange={e => setNewInvItem({...newInvItem, unit: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-3 rounded-xl">
                    <option value="kg">KG</option><option value="grams">Grams</option><option value="liters">Liters</option><option value="ml">ML</option><option value="pieces">Pieces</option>
                  </select>
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Stock</label>
                  <input type="number" step="0.01" required value={newInvItem.current_stock} onChange={e => setNewInvItem({...newInvItem, current_stock: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-3 rounded-xl" />
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Alert At</label>
                  <input type="number" step="0.01" required value={newInvItem.low_stock_threshold} onChange={e => setNewInvItem({...newInvItem, low_stock_threshold: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-3 rounded-xl" />
                </div>
                <button type="submit" className="bg-blue-600 text-white font-black py-3 px-6 rounded-xl text-[10px] uppercase tracking-widest">SAVE</button>
              </form>
            )}

            <div className="glass rounded-3xl overflow-hidden border border-blue-500/10">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-panel)]/50">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Material</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Unit</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Stock Level</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Low Alert</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-border)]">
                  {inventoryItems.map(item => {
                    const isLow = Number(item.current_stock) <= Number(item.low_stock_threshold);
                    return (
                      <tr key={item.id} className="hover:bg-[var(--theme-panel)]/40">
                        <td className="p-6 text-sm font-bold text-[var(--theme-text)] flex items-center gap-3">
                          {isLow && <AlertCircle size={16} className="text-rose-500 animate-pulse" />} {item.name}
                        </td>
                        <td className="p-6 text-[10px] font-bold text-slate-400 uppercase">{item.unit}</td>
                        <td className="p-6">
                          <input type="number" step="0.01" className={`w-24 bg-[var(--theme-input)] border ${isLow ? 'border-rose-500/50 text-rose-400' : 'border-[var(--theme-border)] text-[var(--theme-text)]'} px-3 py-2 rounded-lg font-bold`} defaultValue={item.current_stock} onBlur={(e) => updateInventoryItem(item.id, e.target.value, item.low_stock_threshold)} />
                        </td>
                        <td className="p-6">
                          <input type="number" step="0.01" className="w-24 bg-[var(--theme-input)] border border-[var(--theme-border)] text-slate-400 px-3 py-2 rounded-lg" defaultValue={item.low_stock_threshold} onBlur={(e) => updateInventoryItem(item.id, item.current_stock, e.target.value)} />
                        </td>
                        <td className="p-6">
                          <button onClick={() => deleteInventoryItem(item.id)} className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- RECIPES TAB --- */}
        {activeTab === 'recipes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="glass p-6 rounded-3xl h-[600px] flex flex-col">
              <h2 className="text-xl font-black text-[var(--theme-text)] tracking-tight mb-6 flex items-center gap-3"><Flame className="text-purple-500"/> Menu Items</h2>
              <div className="overflow-y-auto pr-2 space-y-2 flex-1">
                {dishes.map(dish => (
                  <button key={dish.id} onClick={() => loadRecipe(dish.id)} className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedDish === dish.id ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-[var(--theme-input)] border-[var(--theme-border)] hover:border-purple-500/20 text-[var(--theme-text)]'}`}>
                    <div className="font-bold">{dish.name}</div>
                    <div className="text-[10px] uppercase text-slate-500 mt-1">{dish.category}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 glass p-6 md:p-10 rounded-3xl h-[600px] flex flex-col">
              {!selectedDish ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <BookOpen size={48} className="mb-4 opacity-20" />
                  <p className="font-bold tracking-widest text-[10px] uppercase">Select a dish to build its recipe</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-[var(--theme-border)]">
                    <div>
                      <h2 className="text-2xl font-black text-[var(--theme-text)]">{dishes.find(d => d.id === selectedDish)?.name}</h2>
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest mt-1">Resource Blueprint</p>
                    </div>
                    <button onClick={saveRecipe} className="bg-purple-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all">Save Blueprint</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {recipeItems.map((ri, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-[var(--theme-panel)] p-4 rounded-2xl border border-[var(--theme-border)]">
                        <select 
                          className="flex-1 bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] p-3 rounded-xl outline-none"
                          value={ri.inventory_item_id}
                          onChange={(e) => {
                            const newItems = [...recipeItems];
                            newItems[idx].inventory_item_id = e.target.value;
                            setRecipeItems(newItems);
                          }}
                        >
                          <option value="">Select Material...</option>
                          {inventoryItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>)}
                        </select>
                        <input 
                          type="number" step="0.01" placeholder="Qty" className="w-24 bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] p-3 rounded-xl outline-none"
                          value={ri.quantity_deducted}
                          onChange={(e) => {
                            const newItems = [...recipeItems];
                            newItems[idx].quantity_deducted = e.target.value;
                            setRecipeItems(newItems);
                          }}
                        />
                        <button onClick={() => setRecipeItems(recipeItems.filter((_, i) => i !== idx))} className="p-3 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={addRecipeItem} className="w-full py-4 rounded-2xl border-2 border-dashed border-[var(--theme-border)] text-slate-400 hover:text-purple-400 hover:border-purple-500/30 transition-all font-bold text-[10px] uppercase tracking-widest">
                      + Add Ingredient
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- WAREHOUSE LOGS TAB --- */}
        {activeTab === 'warehouse_logs' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-[var(--theme-text)] tracking-tight">Expense Audit</h2>
              <button onClick={() => setShowAddLog(!showAddLog)} className="btn-primary py-3 px-6 text-[10px] bg-orange-600 hover:bg-orange-700 shadow-orange-500/20"><Plus size={14} className="inline mr-2" /> LOG EXPENSE</button>
            </div>

            {showAddLog && (
              <form onSubmit={addWarehouseLog} className="glass p-6 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                  <input type="text" required value={newLog.name} onChange={e => setNewLog({...newLog, name: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-3 rounded-xl" placeholder="e.g. Electric Bill, Vendor X" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                  <select value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-3 rounded-xl">
                    <option value="grocery">Grocery (Misc)</option><option value="commodity">Commodity</option><option value="utility">Utility</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cost (₹)</label>
                  <input type="number" required value={newLog.cost} onChange={e => setNewLog({...newLog, cost: e.target.value})} className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] text-[var(--theme-text)] px-4 py-3 rounded-xl" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-3 px-6 rounded-xl text-[10px] uppercase tracking-widest">LOG IT</button>
                </div>
              </form>
            )}

            <div className="glass rounded-3xl overflow-hidden border border-orange-500/10">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-panel)]/50">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Date</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Description</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Category</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cost</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-border)]">
                  {warehouseLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[var(--theme-panel)]/40">
                      <td className="p-6 text-sm font-bold text-slate-400">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="p-6 text-sm font-bold text-[var(--theme-text)]">{log.name}</td>
                      <td className="p-6">
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-orange-500/20 text-orange-400 bg-orange-500/10">{log.type}</span>
                      </td>
                      <td className="p-6 text-sm font-black text-rose-400">-₹{log.cost}</td>
                      <td className="p-6">
                        <button onClick={() => deleteWarehouseLog(log.id)} className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
