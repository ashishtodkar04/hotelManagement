import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Flame, 
  Utensils, 
  Bell,
  Check
} from 'lucide-react';

export default function AdminLiveOrders() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKitchenTickets();

    socket.connect();
    socket.on('order_update', fetchKitchenTickets);
    socket.on('booking_update', fetchKitchenTickets);

    return () => {
      socket.off('order_update', fetchKitchenTickets);
      socket.off('booking_update', fetchKitchenTickets);
    };
  }, []);

  const fetchKitchenTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/chef/data');
      if (res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Fetch kitchen tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (orderId, status) => {
    try {
      const res = await api.post('/api/admin/chef/update-order', { orderId, status });
      if (res.data.success) {
        fetchKitchenTickets();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 space-y-6">
      
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-amber-500" />
              <h1 className="font-serif text-3xl font-bold text-white">Live Kitchen Display System (KDS)</h1>
            </div>
            <p className="text-xs text-slate-400">Real-time order tickets for head chef & kitchen staff</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-2">
            <Bell className="w-4 h-4 animate-bounce" /> {tickets.length} Active Tickets
          </span>
        </div>
      </div>

      {/* Ticket Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 animate-pulse">
          Connecting to Kitchen Relay...
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/60 rounded-3xl border border-slate-800 max-w-md mx-auto space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-white">All Kitchen Tickets Clear</h3>
          <p className="text-xs text-slate-400">No active food preparation tickets currently in queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`p-6 rounded-3xl border-2 space-y-4 shadow-2xl transition-all ${
                ticket.status === 'pending'
                  ? 'bg-rose-950/30 border-rose-600/60'
                  : ticket.status === 'preparing'
                  ? 'bg-amber-950/30 border-amber-500/60'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              {/* Ticket Top Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Table Ticket</span>
                  <h3 className="font-serif font-bold text-2xl text-white">{ticket.table_number}</h3>
                  <p className="text-[11px] text-slate-400">Guest: {ticket.user_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400">{ticket.time_slot}</span>
                  <span className={`block px-3 py-1 rounded-full text-[10px] font-bold uppercase mt-1 ${
                    ticket.status === 'pending' ? 'bg-rose-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {ticket.items.map((item) => (
                  <div
                    key={item.order_id}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.type === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-bold text-sm text-white">{item.quantity}x {item.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono mt-0.5">Status: {item.status}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === 'ordered' && (
                        <button
                          onClick={() => handleUpdateItemStatus(item.order_id, 'preparing')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all"
                        >
                          Start Cooking
                        </button>
                      )}

                      {item.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateItemStatus(item.order_id, 'ready')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all"
                        >
                          Mark Ready
                        </button>
                      )}

                      {item.status === 'ready' && (
                        <button
                          onClick={() => handleUpdateItemStatus(item.order_id, 'served')}
                          className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all"
                        >
                          Mark Served
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
