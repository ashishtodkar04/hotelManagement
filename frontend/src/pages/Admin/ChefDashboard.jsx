import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import useStore from '../../store/useStore';
import { ChefHat, Clock, CheckCircle2, Flame, ChevronLeft, Activity, Sparkles } from 'lucide-react';

export default function ChefDashboard() {
  const { isAdmin, isStaff, isAdminLoading } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/admin/chef/data');
      setOrders(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchOrders();
    }, 0);
    socket.connect();
    socket.emit('join_admin');
    const handleOrderUpdate = () => fetchOrders();
    socket.on('order_update', handleOrderUpdate);
    socket.on('booking_update', handleOrderUpdate);
    return () => {
      socket.off('order_update', handleOrderUpdate);
      socket.off('booking_update', handleOrderUpdate);
      socket.disconnect();
    };
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.post('/api/admin/update-order-status', { orderId, status });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Transmission Error: Authorization Interrupted');
    }
  };

  if (isAdminLoading) return (
    <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!isAdmin && !isStaff) return <Navigate to="/admin/staff-login" />;
  
  if (loading) return (
    <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-32 pb-20 px-6 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-20 animate-fade-in">
          <div className="flex items-center gap-6">
            <Link to={isAdmin ? "/admin" : "/"} className="w-14 h-14 bg-[var(--theme-panel)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-text)] hover:border-blue-600 transition-all shadow-xl">
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
          
          <div className="glass px-6 sm:px-10 py-4 sm:py-6 flex flex-row items-center justify-around gap-6 sm:gap-12 w-full lg:w-auto shadow-2xl border-2 border-blue-600/5">
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Transmission Queue</p>
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-500/50" />
                 <p className="text-4xl font-black text-blue-600 font-serif tracking-tighter">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
            </div>
            <div className="w-px h-12 bg-[var(--theme-border)]"></div>
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Heat</p>
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50" />
                 <p className="text-4xl font-black text-amber-500 font-serif tracking-tighter">{orders.filter(o => o.status === 'preparing').length}</p>
              </div>
            </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="glass py-48 text-center border-dashed border-2 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-28 h-28 bg-blue-600/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-blue-600/10">
               <Activity size={50} className="text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-4xl font-black text-[var(--theme-text)] tracking-tighter uppercase mb-6">Culinary Logs Crystal Clear</h3>
            <p className="text-slate-400 text-lg font-bold tracking-tight max-w-sm mx-auto leading-relaxed">Namaste Chef! All stations are currently synchronized and awaiting new transmissions.</p>
            <div className="mt-12 flex items-center justify-center gap-4 text-blue-600/30">
               <Sparkles size={20} /> <div className="h-px w-24 bg-current" /> <Sparkles size={20} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {orders.map(order => (
              <div key={order.id} className={`glass group relative hover:-translate-y-2 hover:shadow-2xl transition-all duration-700 overflow-hidden border-2 ${
                order.status === 'preparing' ? 'border-amber-500/30' : 'border-[var(--theme-border)] shadow-xl'
              }`}>
                <div className={`px-10 py-8 flex items-center justify-between border-b border-[var(--theme-border)] ${
                  order.status === 'preparing' ? 'bg-amber-500/5' : 'bg-[var(--theme-accent)]'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] font-mono">Floor: T{order.table_number}</span>
                    </div>
                    <h3 className="text-2xl font-black text-[var(--theme-text)] tracking-tight font-serif italic">{order.user_name}</h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-700 ${
                    order.status === 'preparing' ? 'bg-amber-500 text-white animate-pulse' : 'bg-blue-600 text-white'
                  }`}>
                    {order.status === 'preparing' ? <Flame size={24} /> : <Clock size={24} />}
                  </div>
                </div>

                <div className="p-10 space-y-6">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-6 pb-6 border-b border-[var(--theme-border)] last:border-0 last:pb-0">
                      <div>
                        <p className="text-xl font-black text-[var(--theme-text)] leading-tight mb-2 tracking-tight font-serif">{item.name}</p>
                        <div className="flex items-center gap-3">
                           <span className="px-4 py-1.5 bg-[var(--theme-panel)] rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-600/10 shadow-sm">QTY: {item.quantity}</span>
                        </div>
                      </div>
                      {item.type === 'veg' ? <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 mt-2" /> : <Flame size={20} className="text-rose-500 mt-2 shadow-xl" />}
                    </div>
                  ))}
                </div>

                <div className="px-10 py-8 bg-[var(--theme-accent)] flex gap-4">
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="w-full bg-amber-500 text-white font-black py-5 rounded-[1.5rem] hover:bg-amber-600 hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em] group/btn"
                    >
                      <Flame size={18} className="group-hover:rotate-12 transition-transform" /> IGNITE STATION
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="w-full bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] hover:bg-emerald-700 hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em] group/btn"
                    >
                      <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /> SIGNAL TRANSMISSION READY
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
