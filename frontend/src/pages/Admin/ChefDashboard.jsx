import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import useStore from '../../store/useStore';
import { ChefHat, Clock, CheckCircle2, Flame, ChevronLeft, Activity, Sparkles, RefreshCw } from 'lucide-react';

export default function ChefDashboard() {
  const { isAdmin, isStaff, isAdminLoading } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await api.get('/api/admin/chef/data');
      setOrders(res.data.tickets || []);
    } catch (err) {
      console.error('[ChefDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => fetchOrders(), 0);

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchOrders(true), 30000);

    socket.connect();
    socket.emit('join_admin');

    const handleUpdate = () => fetchOrders(true);
    socket.on('order_update', handleUpdate);
    socket.on('booking_update', handleUpdate);

    return () => {
      clearInterval(interval);
      socket.off('order_update', handleUpdate);
      socket.off('booking_update', handleUpdate);
      socket.disconnect();
    };
  }, [fetchOrders]);

  // Update individual order item status
  const updateItemStatus = async (orderId, status) => {
    try {
      await api.post('/api/admin/chef/update-order', { orderId, status });
      fetchOrders(true);
    } catch (err) {
      console.error('[ChefDashboard] Update error:', err);
      alert('Kitchen update failed. Please try again.');
    }
  };

  // Update ALL items in a ticket to the same status
  const updateTicketStatus = async (ticket, status) => {
    try {
      // Update all items in parallel
      await Promise.all(
        ticket.items.map(item => api.post('/api/admin/chef/update-order', { orderId: item.order_id, status }))
      );
      fetchOrders(true);
    } catch (err) {
      console.error('[ChefDashboard] Ticket update error:', err);
      alert('Kitchen update failed. Please try again.');
    }
  };

  if (isAdminLoading) return (
    <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin && !isStaff) return <Navigate to="/admin/staff-login" />;

  if (loading) return (
    <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pendingTickets   = orders.filter(o => o.status === 'pending');
  const preparingTickets = orders.filter(o => o.status === 'preparing');
  const readyTickets     = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-32 pb-20 px-6 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-20 animate-fade-in">
          <div className="flex items-center gap-6">
            <Link to={isAdmin ? '/admin' : '/'} className="w-14 h-14 bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-text)] hover:border-blue-600 transition-all shadow-xl">
               <ChevronLeft size={24} />
            </Link>
            <div>
              <div className="flex items-center gap-3 text-blue-600 mb-2">
                <ChefHat size={24} />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Executive Kitchen Terminal</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--theme-text)] uppercase font-serif italic">Culinary <span className="text-blue-600">Feed</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => fetchOrders()}
              className="w-14 h-14 bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center hover:border-blue-600 hover:text-blue-600 transition-all shadow-xl"
            >
              <RefreshCw size={22} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <div className="glass px-6 sm:px-10 py-4 sm:py-6 flex flex-row items-center justify-around gap-6 sm:gap-12 w-full lg:w-auto shadow-2xl border-2 border-blue-600/5">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">New Orders</p>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-500/50" />
                   <p className="text-4xl font-black text-blue-600 font-serif tracking-tighter">{pendingTickets.length}</p>
                </div>
              </div>
              <div className="w-px h-12 bg-[var(--theme-border)]" />
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Cooking</p>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50" />
                   <p className="text-4xl font-black text-amber-500 font-serif tracking-tighter">{preparingTickets.length}</p>
                </div>
              </div>
              <div className="w-px h-12 bg-[var(--theme-border)]" />
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ready</p>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                   <p className="text-4xl font-black text-emerald-500 font-serif tracking-tighter">{readyTickets.length}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="glass py-48 text-center border-dashed border-2 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-28 h-28 bg-blue-600/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-blue-600/10">
               <Activity size={50} className="text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-4xl font-black text-[var(--theme-text)] tracking-tighter uppercase mb-6">Kitchen All Clear</h3>
            <p className="text-slate-400 text-lg font-bold tracking-tight max-w-sm mx-auto leading-relaxed">All stations synchronized. Awaiting new orders.</p>
            <div className="mt-12 flex items-center justify-center gap-4 text-blue-600/30">
               <Sparkles size={20} /> <div className="h-px w-24 bg-current" /> <Sparkles size={20} />
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* PENDING ORDERS */}
            {pendingTickets.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8 px-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-600">New Orders — Start Cooking</h2>
                  <span className="bg-blue-600/10 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full border border-blue-600/20">{pendingTickets.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                  {pendingTickets.map(order => (
                    <TicketCard key={order.booking_id} order={order} onUpdateTicket={updateTicketStatus} onUpdateItem={updateItemStatus} />
                  ))}
                </div>
              </section>
            )}

            {/* PREPARING ORDERS */}
            {preparingTickets.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8 px-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-500">Cooking — Mark Ready</h2>
                  <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-3 py-1 rounded-full border border-amber-500/20">{preparingTickets.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                  {preparingTickets.map(order => (
                    <TicketCard key={order.booking_id} order={order} onUpdateTicket={updateTicketStatus} onUpdateItem={updateItemStatus} />
                  ))}
                </div>
              </section>
            )}

            {/* READY ORDERS */}
            {readyTickets.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8 px-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-500">Ready to Serve</h2>
                  <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full border border-emerald-500/20">{readyTickets.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                  {readyTickets.map(order => (
                    <TicketCard key={order.booking_id} order={order} onUpdateTicket={updateTicketStatus} onUpdateItem={updateItemStatus} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: single kitchen ticket card ──────────────────────────────
function TicketCard({ order, onUpdateTicket }) {
  const isPending   = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  const isReady     = order.status === 'ready';

  return (
    <div className={`glass group relative hover:-translate-y-2 hover:shadow-2xl transition-all duration-700 overflow-hidden border-2 ${
      isReady     ? 'border-emerald-500/40'
      : isPreparing ? 'border-amber-500/30'
      : 'border-[var(--theme-border)] shadow-xl'
    }`}>
      {/* Header */}
      <div className={`px-8 py-6 flex items-center justify-between border-b border-[var(--theme-border)] ${
        isReady ? 'bg-emerald-500/5' : isPreparing ? 'bg-amber-500/5' : 'bg-[var(--theme-accent)]'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] font-mono">
              Table {order.table_number}
            </span>
            {order.time_slot && (
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                · {order.time_slot}
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-[var(--theme-text)] tracking-tight font-serif italic">
            {order.user_name || 'Walk-in Guest'}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-700 ${
          isReady     ? 'bg-emerald-500 text-white'
          : isPreparing ? 'bg-amber-500 text-white animate-pulse'
          : 'bg-blue-600 text-white'
        }`}>
          {isReady ? <CheckCircle2 size={22} /> : isPreparing ? <Flame size={22} /> : <Clock size={22} />}
        </div>
      </div>

      {/* Items */}
      <div className="p-8 space-y-4">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center gap-4 pb-4 border-b border-[var(--theme-border)] last:border-0 last:pb-0">
            <div className="flex items-center gap-3 flex-1">
              {item.type === 'veg'
                ? <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 flex-shrink-0" />
                : <Flame size={14} className="text-rose-500 flex-shrink-0" />
              }
              <div>
                <p className="text-base font-black text-[var(--theme-text)] leading-tight tracking-tight">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 bg-[var(--theme-panel)] rounded-lg text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-600/10">
                    ×{item.quantity}
                  </span>
                  {item.status === 'preparing' && item.prep_start_time && (
                    <KDSTimer startTime={item.prep_start_time} />
                  )}
                  {item.status === 'ready' && item.prep_start_time && item.prep_end_time && (
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">
                      <Clock size={10} /> 
                      {Math.floor((new Date(item.prep_end_time) - new Date(item.prep_start_time)) / 60000)}m
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Per-item status dot */}
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              item.status === 'ready'     ? 'bg-emerald-500'
              : item.status === 'preparing' ? 'bg-amber-500 animate-pulse'
              : 'bg-slate-300'
            }`} />
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="px-8 py-6 bg-[var(--theme-accent)] border-t border-[var(--theme-border)]">
        {isPending && (
          <button
            onClick={() => onUpdateTicket(order, 'preparing')}
            className="w-full bg-amber-500 text-white font-black py-4 rounded-[1.5rem] hover:bg-amber-600 hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em]"
          >
            <Flame size={16} className="group-hover:rotate-12 transition-transform" /> Start Cooking
          </button>
        )}
        {isPreparing && (
          <button
            onClick={() => onUpdateTicket(order, 'ready')}
            className="w-full bg-emerald-600 text-white font-black py-4 rounded-[1.5rem] hover:bg-emerald-700 hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em]"
          >
            <CheckCircle2 size={16} /> Mark Ready to Serve
          </button>
        )}
        {isReady && (
          <div className="text-center text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <CheckCircle2 size={14} /> Awaiting Service
          </div>
        )}
      </div>
    </div>
  );
}

function KDSTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const update = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diffMs = Math.max(0, now - start);
      setElapsed(Math.floor(diffMs / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  
  // Flash red if it's been preparing for over 15 minutes
  const isOverdue = mins >= 15;

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
      isOverdue ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-amber-500/10 text-amber-500'
    }`}>
      <Clock size={10} />
      {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
}
