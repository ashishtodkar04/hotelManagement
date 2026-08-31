import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { 
  Armchair, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Users
} from 'lucide-react';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(4);

  useEffect(() => {
    fetchTables();

    socket.connect();
    socket.on('table_update', fetchTables);
    return () => socket.off('table_update', fetchTables);
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/tables');
      if (res.data.success) {
        setTables(res.data.tables || []);
      }
    } catch (err) {
      console.error('Fetch tables error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTableStatus = async (table) => {
    const nextStatus = table.status === 'occupied' ? 'available' : 'occupied';
    try {
      const res = await api.post('/api/admin/update-table', {
        id: table.id,
        table_name: table.table_name,
        status: nextStatus
      });
      if (res.data.success) {
        fetchTables();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update table status');
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Delete this dining table from floor plan?')) return;
    try {
      const res = await api.delete(`/api/admin/tables/${id}`);
      if (res.data.success) {
        setActionMsg('Table removed from floor layout.');
        fetchTables();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot delete occupied table');
    }
  };

  const handleOpenAddModal = () => {
    setEditingTable(null);
    setTableName('');
    setCapacity(4);
    setShowModal(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingTable(t);
    setTableName(t.table_name);
    setCapacity(t.capacity);
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await api.put(`/api/admin/tables/${editingTable.id}`, {
          table_name: tableName,
          capacity: Number(capacity)
        });
        setActionMsg('Table configuration updated.');
      } else {
        await api.post('/api/admin/tables', {
          table_name: tableName,
          capacity: Number(capacity)
        });
        setActionMsg('New table added to floor plan.');
      }

      setShowModal(false);
      fetchTables();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save table');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">Floor Table Configuration</h1>
            <p className="text-xs text-slate-500">Manage seating capacity, table status, and floor layout topology</p>
          </div>
        </div>

        <button onClick={handleOpenAddModal} className="btn-gold text-xs font-bold">
          <Plus className="w-4 h-4" /> Add New Table
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Grid Floor Layout */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading floor tables...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tables.map((table) => {
            const isOccupied = table.status === 'occupied';

            return (
              <div
                key={table.id}
                className={`luxury-card p-6 bg-white border-2 space-y-4 shadow-sm transition-all ${
                  isOccupied ? 'border-rose-300' : 'border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isOccupied ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <Armchair className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-slate-900 text-base">{table.table_name}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{table.capacity} Guest Capacity</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleTableStatus(table)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isOccupied ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {table.status}
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-medium">Click status to toggle</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(table)}
                      className="p-2 text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-xl"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isOccupied && (
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-serif font-bold text-xl text-slate-900">
                {editingTable ? 'Edit Table Settings' : 'Add Floor Table'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Table Label / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Table 01 or Royal VIP Box"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                  required
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
                <button type="submit" className="btn-gold text-xs font-bold">
                  Save Floor Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
