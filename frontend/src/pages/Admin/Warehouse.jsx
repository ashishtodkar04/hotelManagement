import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import {
  Plus, Edit2, Trash2, X, ShoppingCart,
  Zap, Flame, ChevronLeft, Package,
  Calendar, User, CheckCircle, AlertTriangle, XCircle, Shield
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import useStore from '../../store/useStore';

// ── Stock Status Config ─────────────────────────────────────────────────────
const STOCK_CONFIG = {
  in_stock:    { label: 'IN STOCK',   icon: CheckCircle,    ring: 'ring-emerald-500',  bg: 'bg-emerald-500',  text: 'text-emerald-500',   badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
  low_stock:   { label: 'LOW STOCK',  icon: AlertTriangle,  ring: 'ring-amber-500',    bg: 'bg-amber-500',    text: 'text-amber-500',     badge: 'bg-amber-500/10 border-amber-500/30 text-amber-500' },
  out_of_stock:{ label: 'OUT OF STOCK', icon: XCircle,      ring: 'ring-rose-600',     bg: 'bg-rose-600',     text: 'text-rose-600',      badge: 'bg-rose-500/10 border-rose-500/30 text-rose-500' },
};

const CYCLE = { in_stock: 'low_stock', low_stock: 'out_of_stock', out_of_stock: 'in_stock' };

const TYPE_CONFIG = {
  grocery:   { icon: ShoppingCart, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  commodity: { icon: Flame,        color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  utility:   { icon: Zap,          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
};

export default function Warehouse() {
  const { isAdmin, isAdminLoading } = useStore();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving]   = useState(null); // id of item whose stock status is being updated
  const [confirmAction, setConfirmAction] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: 'grocery', quantity: '', unit: '',
    cost: '', date: new Date().toISOString().split('T')[0],
  });

  // Filter/group state
  const [filterType, setFilterType]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate]     = useState('');

  const fetchData = useCallback(async () => {
    if (isAdminLoading || !isAdmin) return;
    try {
      const res = await api.get('/api/admin/warehouse');
      setItems(res.data.items || []);
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
    socket.connect();
    socket.on('warehouse_update', () => fetchData());
    return () => {
      socket.off('warehouse_update');
      socket.disconnect();
    };
  }, [fetchData, isAdmin, isAdminLoading]);

  if (isAdminLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return <Navigate to="/admin/login" />;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    if (!isAdmin) return;
    setEditing(item.id);
    const formattedDate = item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setFormData({
      name: item.name || '', type: item.type || 'grocery',
      quantity: item.quantity || '', unit: item.unit || '',
      cost: item.cost || '', date: formattedDate,
    });
    setShowAdd(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (id) => {
    if (!formData.name || !formData.cost || !formData.date) {
      alert('Please fill in Name, Cost, and Date.');
      return;
    }
    const payload = {
      name: formData.name, type: formData.type,
      quantity: Number(formData.quantity) || 0, unit: formData.unit || '',
      cost: Number(formData.cost), date: formData.date,
    };
    try {
      if (id) {
        await api.put(`/api/admin/warehouse/${id}`, payload);
      } else {
        await api.post('/api/admin/warehouse', payload);
      }
      setEditing(null); setShowAdd(false);
      setFormData({ name: '', type: 'grocery', quantity: '', unit: '', cost: '', date: new Date().toISOString().split('T')[0] });
      setFilterDate(''); // Clear filter to see new entry
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = (id) => {
    if (!isAdmin) return;
    setConfirmAction({
      title: 'Erase Stock Record?',
      message: 'Are you sure you want to permanently delete this warehouse inventory record? This action will immediately update your stock sheets and cost logs.',
      onConfirm: async () => {
        try { 
          await api.delete(`/api/admin/warehouse/${id}`); 
          fetchData(); 
        } catch { 
          alert('Failed to delete'); 
        }
      }
    });
  };

  // Cycle stock status: in_stock → low_stock → out_of_stock → in_stock
  const cycleStockStatus = async (item) => {
    if (!isAdmin) return;
    const nextStatus = CYCLE[item.stock_status || 'in_stock'];
    setSaving(item.id);
    try {
      await api.patch(`/api/admin/warehouse/${item.id}/stock-status`, { stock_status: nextStatus });
      // Optimistic local update
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock_status: nextStatus } : i));
    } catch {
      alert('Failed to update stock status');
    } finally {
      setSaving(null);
    }
  };

  // ── Filtered items ────────────────────────────────────────────────────────
  const filtered = items.filter(i => {
    const typeMatch   = filterType   === 'all' || i.type === filterType;
    const statusMatch = filterStatus === 'all' || (i.stock_status || 'in_stock') === filterStatus;
    const dateMatch   = !filterDate || (i.date && i.date.startsWith(filterDate));
    return typeMatch && statusMatch && dateMatch;
  });

  // Summary counts
  const outCount  = items.filter(i => (i.stock_status || 'in_stock') === 'out_of_stock').length;
  const lowCount  = items.filter(i => (i.stock_status || 'in_stock') === 'low_stock').length;
  const totalCost = items.reduce((s, i) => s + Number(i.cost || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-24 md:pt-32 pb-20 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 md:gap-10 mb-12 md:mb-16">
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/admin" className="w-12 h-12 md:w-14 md:h-14 bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-text)] hover:border-blue-600 transition-all">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-blue-600 mb-2">Backoffice Architecture</p>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-[var(--theme-text)]">
                Warehouse <span className="text-blue-600">Assets</span>
              </h1>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowAdd(true); setEditing(null); setFormData({ name: '', type: 'grocery', quantity: '', unit: '', cost: '', date: new Date().toISOString().split('T')[0] }); }}
              className="btn-primary py-4 px-8"
            >
              <Plus size={18} /> LOG EXPENSE
            </button>
          )}
        </header>

        {/* ── KPI Strip ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {[
            { label: 'Total Items',   value: items.length,         color: 'text-[var(--theme-text)]' },
            { label: 'Out of Stock',  value: outCount,             color: 'text-rose-500' },
            { label: 'Low Stock',     value: lowCount,             color: 'text-amber-500' },
            { label: 'Total Cost',    value: `₹${totalCost.toLocaleString()}`, color: 'text-blue-600' },
          ].map(k => (
            <div key={k.label} className="glass p-4 md:p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-all">
              <div className={`text-2xl md:text-4xl font-black font-serif tracking-tighter mb-2 ${k.color}`}>{k.value}</div>
              <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em]">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Alert banners ───────────────────────────────────── */}
        {outCount > 0 && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] px-6 md:px-10 py-5 md:py-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6 animate-fade-in">
            <XCircle size={28} className="text-rose-500 flex-shrink-0" />
            <div className="text-center sm:text-left">
              <p className="font-black text-rose-500 text-xs md:text-sm uppercase tracking-widest">{outCount} Item{outCount > 1 ? 's' : ''} Out of Stock</p>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5">Immediate restocking required. Filter below to review.</p>
            </div>
            <button onClick={() => setFilterStatus('out_of_stock')} className="sm:ml-auto text-[9px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest hover:tracking-[0.3em] transition-all">VIEW →</button>
          </div>
        )}
        {lowCount > 0 && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl px-6 py-4 md:px-10 md:py-6 flex items-center gap-6 animate-fade-in">
            <AlertTriangle size={28} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-black text-amber-500 text-sm uppercase tracking-widest">{lowCount} Item{lowCount > 1 ? 's' : ''} Running Low</p>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Consider restocking soon to avoid service disruption.</p>
            </div>
            <button onClick={() => setFilterStatus('low_stock')} className="ml-auto text-[10px] font-black text-amber-500 uppercase tracking-widest hover:tracking-[0.3em] transition-all">VIEW →</button>
          </div>
        )}

        {/* ── Add / Edit Form ─────────────────────────────────── */}
        {(showAdd || editing) && isAdmin && (
          <div className="glass p-6 md:p-12 mb-16 animate-fade-in relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Package size={120} />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-[var(--theme-text)] tracking-tight">{editing ? 'Refine Asset Record' : 'New Asset Log'}</h2>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Cost Management</p>
              </div>
              <button onClick={() => { setShowAdd(false); setEditing(null); }} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--theme-border)] flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                <X size={20} md:size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Asset Name / Description</label>
                <input type="text" placeholder="e.g. Fresh Tomatoes, Gas Cylinder, Electricity Bill"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Classification</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full appearance-none">
                  <option value="grocery">Grocery</option>
                  <option value="commodity">Commodity</option>
                  <option value="utility">Utility / Bills</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Cost Valuation (₹)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 font-black">₹</span>
                  <input type="number" placeholder="0" value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })} className="w-full pl-12 font-black text-blue-600" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Quantity (Optional)</label>
                <input type="number" placeholder="0" value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Unit (e.g. KG, Ltr)</label>
                <select 
                  value={formData.unit} 
                  onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                  className="w-full appearance-none"
                >
                  <option value="">Select Unit</option>
                  {['KG', 'Gram', 'Ltr', 'Ml', 'Unit', 'Pack', 'Bottle', 'Box', 'Dozen', 'Cylinder', 'Plate'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Acquisition / Payment Date</label>
                <input type="date" value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full" />
              </div>
              <div className="lg:col-span-4 flex justify-end gap-6 pt-12 border-t border-[var(--theme-border)] mt-4">
                <button onClick={() => { setShowAdd(false); setEditing(null); }} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-rose-500 transition-colors">Discard Draft</button>
                <button onClick={() => handleSave(editing)} className="btn-primary">AUTHORIZE LOG</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 mb-10">
          {['all', 'grocery', 'commodity', 'utility'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterType === t ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-[var(--theme-panel)] border-[var(--theme-border)] text-slate-400 hover:border-blue-600 hover:text-blue-600'}`}>
              {t === 'all' ? 'ALL TYPES' : t.toUpperCase()}
            </button>
          ))}
          <div className="w-full lg:w-auto lg:ml-auto flex flex-wrap gap-3 mt-4 lg:mt-0">
            <div className="relative">
              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)}
                className="bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text)] outline-none focus:border-blue-600 transition-all"
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                  <X size={14} />
                </button>
              )}
            </div>
            {['all', 'in_stock', 'low_stock', 'out_of_stock'].map(s => {
              const cfg = STOCK_CONFIG[s] || null;
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === s ? (cfg ? `${cfg.bg} border-transparent text-white shadow-xl` : 'bg-[var(--theme-text)] border-transparent text-[var(--theme-bg)]') : 'bg-[var(--theme-panel)] border-[var(--theme-border)] text-slate-400 hover:border-[var(--theme-border-focus)]'}`}>
                  {s === 'all' ? 'ALL STATUS' : cfg?.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Stock Legend ─────────────────────────────────────── */}
        {isAdmin && (
          <div className="flex flex-wrap gap-6 mb-10 bg-[var(--theme-panel)] rounded-3xl px-10 py-6 border border-[var(--theme-border)]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center mr-4">STOCK STATUS GUIDE →</p>
            {Object.entries(STOCK_CONFIG).map(([key, cfg]) => (
              <div key={key} className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border ${cfg.badge}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 font-bold self-center ml-auto italic">Admin: Click the coloured dot on any item to cycle its status.</p>
          </div>
        )}

        {/* ── Items Grid ──────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="glass h-48 animate-pulse rounded-3xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-40 glass text-center border-dashed border-2 rounded-3xl">
            <Package size={80} className="mx-auto mb-8 text-slate-200" />
            <h3 className="text-3xl font-black text-slate-300 tracking-tight">No items match the current filters.</h3>
            <button onClick={() => { setFilterType('all'); setFilterStatus('all'); }} className="btn-secondary mt-10">CLEAR FILTERS</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(item => {
              const stockStatus = item.stock_status || 'in_stock';
              const cfg  = STOCK_CONFIG[stockStatus];
              const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.grocery;
              const TypeIcon = typeCfg.icon;
              return (
                <div key={item.id} className={`glass group relative overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-500 border-l-4 ${stockStatus === 'in_stock' ? 'border-l-emerald-500' : stockStatus === 'low_stock' ? 'border-l-amber-500' : 'border-l-rose-600'}`}>
                  {/* Stock indicator — clickable for admin */}
                  <div className="p-8 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${typeCfg.color}`}>
                        <TypeIcon size={16} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.type}</span>
                      </div>

                      {/* Stock Status Badge — admin can click to cycle */}
                      <button
                        onClick={() => isAdmin && cycleStockStatus(item)}
                        disabled={saving === item.id}
                        title={isAdmin ? `Click to cycle status (current: ${cfg.label})` : cfg.label}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${cfg.badge} ${isAdmin ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'} ${saving === item.id ? 'opacity-50 animate-pulse' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${cfg.bg} ${stockStatus === 'in_stock' ? '' : 'animate-pulse'}`} />
                        {cfg.label}
                      </button>
                    </div>

                    <h3 className="text-xl font-black text-[var(--theme-text)] font-serif italic tracking-tight mb-1 line-clamp-2">{item.name}</h3>

                    {item.quantity > 0 && (
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {item.quantity} {item.unit}
                      </p>
                    )}
                  </div>

                  <div className="px-8 pb-8">
                    <div className="flex items-center justify-between pt-6 border-t border-[var(--theme-border)]">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost</p>
                        <p className="text-2xl font-black text-blue-600 font-serif tracking-tighter">₹{Number(item.cost).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-slate-400 justify-end">
                          <Calendar size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 justify-end mt-1">
                          <User size={10} />
                          <span className="text-[8px] font-black uppercase tracking-widest">{item.added_by || 'ADMIN'}</span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-3 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="flex-1 bg-[var(--theme-panel)] border border-[var(--theme-border)] text-blue-600 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-blue-600 transition-all">
                          <Edit2 size={14} /> EDIT
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="w-12 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
