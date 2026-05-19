import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import { Plus, Edit2, Trash2, X, Utensils, Leaf, Flame, ChevronLeft, Layout, Users, Eye, EyeOff, Save, Shield } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import useStore from '../../store/useStore';

export default function ManageMenu() {
  const { isAdmin, isAdminLoading } = useStore();
  const [dishes, setDishes]       = useState([]);
  const [tables, setTables]       = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);
  const [formData, setFormData]   = useState({ name: '', price: '', category: '', image: '', description: '', type: 'veg' });
  const [showAdd, setShowAdd]     = useState(false);

  // Table editing state
  const [editingTable, setEditingTable] = useState(null); // id of table being edited
  const [tableForm, setTableForm]       = useState({ table_name: '', capacity: 4 });
  const [showAddTable, setShowAddTable] = useState(false);
  const [tableData, setTableData]       = useState({ table_name: '', capacity: 4 });

  const fetchData = useCallback(async () => {
    if (isAdminLoading || !isAdmin) return;
    try {
      const [dishRes, tableRes] = await Promise.all([
        api.get('/api/admin/dishes'),
        api.get('/api/admin/tables'),
      ]);
      setDishes(dishRes.data.dishes || []);
      setTables(tableRes.data.tables || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isAdminLoading]);

  useEffect(() => {
    if (isAdminLoading || !isAdmin) return;
    setTimeout(() => {
      fetchData();
    }, 0);
    // Real-time: listen for dish and table changes
    socket.connect();
    socket.on('dish_update', () => fetchData());
    socket.on('table_update', () => fetchData());
    return () => {
      socket.off('dish_update');
      socket.off('table_update');
      socket.disconnect();
    };
  }, [fetchData, isAdmin, isAdminLoading]);

  if (isAdminLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return <Navigate to="/admin/login" />;

  // ── Dish CRUD ────────────────────────────────────────────────────────────────
  const handleEdit = (dish) => {
    setEditing(dish.id);
    setFormData({
      name: dish.name || '', price: dish.price || '',
      category: dish.category || '', image: dish.image || '',
      description: dish.description || '', type: dish.type || 'veg',
    });
    setShowAdd(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (id) => {
    if (!formData.name || !formData.price || !formData.category) {
      alert('Please fill in Name, Category, and Price.');
      return;
    }
    const payload = {
      name: formData.name, price: Number(formData.price),
      category: formData.category, image: formData.image || '',
      description: formData.description || '', type: formData.type || 'veg',
    };
    try {
      if (id) {
        await api.put(`/api/admin/dishes/${id}`, payload);
      } else {
        await api.post('/api/admin/dishes', payload);
      }
      setEditing(null); setShowAdd(false);
      setFormData({ name: '', price: '', category: '', image: '', description: '', type: 'veg' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = (id) => {
    setConfirmAction({
      title: 'Erase Culinary Creation?',
      message: 'Are you sure you want to permanently delete this signature masterpiece from the digital catalog? This operation is irreversible.',
      onConfirm: async () => {
        try { 
          await api.delete(`/api/admin/dishes/${id}`); 
          fetchData(); 
        } catch { 
          alert('Failed to delete'); 
        }
      }
    });
  };

  const toggleAvailability = async (dish) => {
    try {
      const res = await api.patch(`/api/admin/dishes/${dish.id}/availability`);
      // Optimistically update local state for instant feedback
      setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, is_available: res.data.is_available } : d));
    } catch {
      alert('Failed to update availability');
    }
  };

  // ── Table CRUD ────────────────────────────────────────────────────────────────
  const handleAddTable = async () => {
    if (!tableData.table_name) { alert('Enter a table name.'); return; }
    try {
      await api.post('/api/admin/add-table', tableData);
      setShowAddTable(false);
      setTableData({ table_name: '', capacity: 4 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add table');
    }
  };

  const startEditTable = (t) => {
    setEditingTable(t.id);
    setTableForm({ table_name: t.table_name, capacity: t.capacity });
    setShowAddTable(false);
  };

  const handleSaveTable = async (id) => {
    if (!tableForm.table_name) { alert('Enter a table name.'); return; }
    try {
      await api.put(`/api/admin/tables/${id}`, tableForm);
      setEditingTable(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update table');
    }
  };

  const handleDeleteTable = (id) => {
    setConfirmAction({
      title: 'Erase Floor Table?',
      message: 'Are you sure you want to permanently remove this physical dining placement from the digital floor plan? Active reservations linked to this table may be affected.',
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/tables/${id}`);
          fetchData();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to delete table');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-24 md:pt-32 pb-20 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 md:gap-10 mb-12 md:mb-20 px-2">
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/admin" className="w-12 h-12 md:w-14 md:h-14 bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-text)] hover:border-blue-600 transition-all shadow-lg">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-blue-600 mb-2">Backoffice Architecture</p>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-[var(--theme-text)]">
                Menu <span className="text-blue-600">Architect</span>
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <button
              onClick={() => { setShowAddTable(v => !v); setShowAdd(false); setEditing(null); setEditingTable(null); }}
              className="flex-1 lg:flex-none btn-secondary py-4 px-6 md:px-8 text-[9px] md:text-[10px]"
            >
              <Layout size={18} /> {showAddTable ? 'CANCEL' : 'ADD TABLE'}
            </button>
            <button
              onClick={() => { setShowAdd(true); setShowAddTable(false); setEditing(null); setEditingTable(null); setFormData({ name: '', price: '', category: '', image: '', description: '', type: 'veg' }); }}
              className="flex-1 lg:flex-none btn-primary py-4 px-6 md:px-8 text-[9px] md:text-[10px]"
            >
              <Plus size={18} /> DESIGN DISH
            </button>
          </div>
        </header>

        {/* ── Add Table Panel ────────────────────────────────── */}
        {showAddTable && (
          <div className="glass p-6 md:p-12 mb-20 animate-fade-in bg-blue-600/5 border-blue-600/20">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-[var(--theme-text)] tracking-tight">Expand Floor Plan</h2>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Spatial Asset Initialization</p>
              </div>
              <button onClick={() => setShowAddTable(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--theme-border)] flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                <X size={20} md:size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Table Designation</label>
                <input type="text" placeholder="e.g. Table 12, Rooftop A" value={tableData.table_name}
                  onChange={e => setTableData({ ...tableData, table_name: e.target.value })} className="w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Capacity (Guests)</label>
                <input type="number" value={tableData.capacity}
                  onChange={e => setTableData({ ...tableData, capacity: e.target.value })} className="w-full" />
              </div>
              <button onClick={handleAddTable} className="btn-primary w-full py-5">AUTHORIZE PLACEMENT</button>
            </div>
          </div>
        )}

        {/* ── Dish Edit / Add Panel ──────────────────────────── */}
        {(showAdd || editing) && (
          <div className="glass p-12 mb-20 animate-fade-in relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Utensils size={120} />
            </div>
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-[var(--theme-text)] tracking-tight">
                  {editing ? 'Refine Selection' : 'New Dish Specification'}
                </h2>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Culinary Asset Development</p>
              </div>
              <button onClick={() => { setShowAdd(false); setEditing(null); }} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--theme-border)] flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                <X size={20} md:size={24} />
              </button>
            </div>
            <DishForm formData={formData} setFormData={setFormData}
              onSave={() => handleSave(editing)}
              onCancel={() => { setShowAdd(false); setEditing(null); }} />
          </div>
        )}

        {/* ── Floor Plan ─────────────────────────────────────── */}
        <div className="mb-20">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-8 ml-4 flex items-center gap-3">
            <Layout size={14} /> Active Floor Plan
          </h2>
          <div className="flex flex-wrap gap-4">
            {tables.map(t => (
              <div key={t.id} className="glass px-6 py-4 border border-[var(--theme-border)] group relative min-w-[160px]">
                {editingTable === t.id ? (
                  /* ── Inline edit form ── */
                  <div className="flex flex-col gap-3">
                    <input
                      type="text" value={tableForm.table_name}
                      onChange={e => setTableForm({ ...tableForm, table_name: e.target.value })}
                      className="text-sm font-black bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-xl px-3 py-2 w-full text-[var(--theme-text)] outline-none focus:ring-2 focus:ring-blue-600/20"
                      placeholder="Table name"
                    />
                    <input
                      type="number" value={tableForm.capacity}
                      onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })}
                      className="text-sm font-black bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-xl px-3 py-2 w-full text-[var(--theme-text)] outline-none focus:ring-2 focus:ring-blue-600/20"
                      placeholder="Capacity"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveTable(t.id)}
                        className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-blue-700 transition-all">
                        <Save size={12} /> SAVE
                      </button>
                      <button onClick={() => setEditingTable(null)}
                        className="w-10 bg-[var(--theme-border)] rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display mode ── */
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-lg font-black text-[var(--theme-text)] font-serif">{t.table_name}</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Users size={10} /> {t.capacity} SEATS
                      </div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {/* Hover controls */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditTable(t)}
                        className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg"
                        title="Edit table">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDeleteTable(t.id)}
                        className="w-7 h-7 bg-rose-500 text-white rounded-lg flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg"
                        title="Delete table">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {tables.length === 0 && !loading && (
              <p className="text-slate-400 text-sm font-bold">No tables configured. Click ADD TABLE to create the floor plan.</p>
            )}
          </div>
        </div>

        {/* ── Culinary Catalog ────────────────────────────────── */}
        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-8 ml-4 flex items-center gap-3">
          <Utensils size={14} /> Culinary Catalog
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
          {loading ? (
            [...Array(10)].map((_, i) => <div key={i} className="glass h-[450px] animate-pulse" />)
          ) : dishes.length === 0 ? (
            <div className="col-span-full py-40 glass text-center border-dashed border-2">
              <Utensils size={80} className="mx-auto mb-8 text-slate-200" />
              <h3 className="text-3xl font-black text-slate-300 tracking-tight">Your menu is an open canvas.</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Start defining your culinary offerings</p>
              <button onClick={() => setShowAdd(true)} className="btn-secondary mt-10">INITIALIZE ARCHITECT</button>
            </div>
          ) : (
            dishes.map(dish => (
              <div key={dish.id} className={`glass p-8 group relative hover:-translate-y-2 hover:shadow-2xl transition-all duration-700 ${!dish.is_available ? 'opacity-50 grayscale' : ''}`}>
                {/* Availability badge */}
                {!dish.is_available && (
                  <div className="absolute top-4 left-4 z-30 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-slate-600">
                    UNAVAILABLE
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                  <button
                    onClick={() => toggleAvailability(dish)}
                    title={dish.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border ${dish.is_available ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-slate-500/10 border-slate-400 text-slate-400 hover:bg-slate-500 hover:text-white'}`}
                  >
                    {dish.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => handleEdit(dish)} className="w-10 h-10 bg-white dark:bg-slate-800 text-blue-600 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border border-slate-100 dark:border-slate-700">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(dish.id)} className="w-10 h-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90">
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Media */}
                <div className="h-56 rounded-[2.5rem] bg-[var(--theme-accent)] mb-8 overflow-hidden relative border border-[var(--theme-border)]">
                  {dish.image ? (
                    <img src={dish.image && dish.image.startsWith('http') ? dish.image : `http://localhost:3000${dish.image}`}
                      alt={dish.name} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[2s] ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Utensils size={48} className="text-slate-300" /></div>
                  )}
                  <div className={`absolute top-6 left-6 w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-xl ${dish.type === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {dish.type === 'veg' ? <Leaf size={18} className="text-white" /> : <Flame size={18} className="text-white" />}
                  </div>
                  <div className="absolute bottom-6 right-6 bg-[var(--theme-panel)] backdrop-blur-2xl px-6 py-2.5 rounded-2xl text-[var(--theme-text)] font-black shadow-2xl border border-[var(--theme-border)] text-sm">₹{dish.price}</div>
                </div>

                {/* Info */}
                <div>
                  <span className="text-[9px] uppercase tracking-[0.4em] text-blue-600 font-black block mb-3">{dish.category}</span>
                  <h3 className="text-2xl font-black text-[var(--theme-text)] mb-3 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">{dish.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-3 leading-relaxed font-bold tracking-tight">{dish.description || 'A masterful selection crafted with professional precision.'}</p>
                </div>
              </div>
            ))
          )}
        </div>
        {confirmAction && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
            <div className="glass w-full max-w-md p-8 relative overflow-hidden border border-rose-500/10 shadow-2xl rounded-[2rem] text-center">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Shield size={100} className="text-rose-500" />
              </div>
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <Trash2 size={28} />
              </div>
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-2">Destructive Action Alert</h3>
              <p className="text-xl font-black text-[var(--theme-text)] tracking-tight mb-4">{confirmAction.title || 'Are you absolutely sure?'}</p>
              <p className="text-xs text-slate-400 font-bold mb-8 leading-relaxed px-2">{confirmAction.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 btn-secondary py-4 rounded-xl text-[10px] font-black tracking-widest uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmAction.onConfirm();
                    setConfirmAction(null);
                  }}
                  className="flex-1 btn-primary py-4 rounded-xl bg-rose-600 border-rose-600 hover:bg-rose-700 hover:border-rose-700 text-[10px] font-black tracking-widest uppercase shadow-2xl shadow-rose-500/20"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DishForm({ formData, setFormData, onSave, onCancel }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
      <div className="lg:col-span-2">
        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Creation Name</label>
        <input type="text" placeholder="Signature Culinary Name" value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full" />
      </div>

      <div className="lg:col-span-1">
        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Classification</label>
        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full appearance-none">
          <option value="">Select Category…</option>
          <option value="Starter">Starter</option>
          <option value="Main Course">Main Course</option>
          <option value="Dessert">Dessert</option>
          <option value="Drinks">Drinks</option>
        </select>
      </div>

      <div className="lg:col-span-1">
        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Valuation (₹)</label>
        <input type="number" placeholder="0" value={formData.price}
          onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full font-black text-blue-600" />
      </div>

      <div className="lg:col-span-2">
        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Flavour Profile / Description</label>
        <textarea placeholder="Elaborate on the sensory experience…" value={formData.description} rows={5}
          onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full resize-none" />
      </div>

      <div className="lg:col-span-2 space-y-10">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Visual Asset URL</label>
          <input type="text" placeholder="Direct Image URL (https://...)" value={formData.image}
            onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Culinary Orientation</label>
          <div className="flex gap-6">
            <button type="button" onClick={() => setFormData({ ...formData, type: 'veg' })}
              className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest ${formData.type === 'veg' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-[var(--theme-input)] border-transparent text-slate-400 hover:border-[var(--theme-border)]'}`}>
              <Leaf size={16} /> VEGETARIAN
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, type: 'non-veg' })}
              className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest ${formData.type === 'non-veg' ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-xl shadow-rose-500/20' : 'bg-[var(--theme-input)] border-transparent text-slate-400 hover:border-[var(--theme-border)]'}`}>
              <Flame size={16} /> NON-VEGETARIAN
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex justify-end gap-6 pt-12 border-t border-[var(--theme-border)] mt-4">
        <button type="button" onClick={onCancel} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-rose-500 transition-colors">Discard Draft</button>
        <button type="button" onClick={onSave} className="btn-primary">AUTHORIZE CREATION</button>
      </div>
    </div>
  );
}
