import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  MessageSquare, Send, User, ChevronLeft, Search, 
  ShieldCheck, Sparkles, Activity, Trash2, Check
} from 'lucide-react';
import useStore from '../../store/useStore';
import socket from '../../services/socket';

export default function AdminChat() {
  const { 
    isAdmin, 
    isAdminLoading,
    adminThreads,
    adminActiveUserId,
    adminOnlineUsers,
    adminTypingStates,
    setAdminActiveUserId,
    markAdminThreadAsReadInStore
  } = useStore();

  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Automatically mark active thread's messages as read
  useEffect(() => {
    if (adminActiveUserId) {
      socket.emit('mark_read', { userId: adminActiveUserId, sender: 'admin' });
      markAdminThreadAsReadInStore(adminActiveUserId);
    }
  }, [adminActiveUserId, adminThreads, markAdminThreadAsReadInStore]);

  // Clean up typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Ensure scroll keeps up
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [adminActiveUserId, adminThreads]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!adminActiveUserId) return;

    socket.emit('typing', { userId: adminActiveUserId, sender: 'admin', isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { userId: adminActiveUserId, sender: 'admin', isTyping: false });
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !adminActiveUserId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { userId: adminActiveUserId, sender: 'admin', isTyping: false });

    const msgData = {
      userId: adminActiveUserId,
      userName: activeThread?.userName || adminActiveUserId,
      message: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_read: 0
    };

    socket.emit('admin_message', msgData);
    setMessage('');
  };

  if (isAdminLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return <Navigate to="/admin/login" />;

  const activeThread = adminThreads.find(t => t.userId === adminActiveUserId);
  const filteredThreads = adminThreads.filter(t => 
    t.userName.toLowerCase().includes(search.toLowerCase()) || 
    t.userId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col transition-colors duration-500 overflow-hidden">
      {/* Header */}
      <header className="p-8 md:p-12 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-8 relative z-10">
          <Link to="/admin" className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
            <ChevronLeft size={28} />
          </Link>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
              <MessageSquare size={32} className="text-blue-500" /> Executive Concierge
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-1">Real-time Guest Engagement Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-full relative z-10">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Master Connection Active</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread List */}
        <div className="w-96 md:w-[450px] border-r border-[var(--theme-border)] flex flex-col bg-[var(--theme-panel)]/30 backdrop-blur-3xl">
          <div className="p-8 border-b border-[var(--theme-border)]">
            <div className="relative group">
              <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl py-4 pl-16 pr-6 text-sm font-bold outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scroll">
            {filteredThreads.length === 0 ? (
              <div className="p-20 text-center opacity-30">
                <Activity size={48} className="mx-auto mb-6 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">No active inquiries</p>
              </div>
            ) : (
              filteredThreads.map(thread => {
                const isOnline = adminOnlineUsers.includes(thread.userId);
                const isTyping = adminTypingStates[thread.userId];
                const lastMsg = thread.messages[thread.messages.length - 1];

                return (
                  <button
                    key={thread.userId}
                    onClick={() => setAdminActiveUserId(thread.userId)}
                    className={`w-full p-8 flex items-center gap-6 border-b border-[var(--theme-border)] transition-all hover:bg-blue-600/5 ${adminActiveUserId === thread.userId ? 'bg-blue-600/10 border-r-4 border-r-blue-600' : ''}`}
                  >
                    <div className="relative">
                      <div className="w-16 h-16 bg-[var(--theme-accent)] rounded-2xl flex items-center justify-center text-blue-600 shadow-inner border border-[var(--theme-border)]">
                        <User size={28} />
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[var(--theme-panel)] shadow-sm animate-pulse" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-black text-lg text-[var(--theme-text)] truncate">{thread.userName || 'Guest'}</h4>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{lastMsg?.time}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {isTyping ? (
                          <p className="text-xs text-emerald-500 font-extrabold italic animate-pulse">typing...</p>
                        ) : (
                          <p className="text-xs text-slate-500 font-bold truncate tracking-tight flex-1">{lastMsg?.message}</p>
                        )}
                        {thread.unreadCount > 0 && (
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-md shrink-0">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Pane */}
        <div className="flex-1 flex flex-col bg-[var(--theme-bg)] relative">
          <div className="absolute inset-0 bg-blue-600/[0.02] pointer-events-none" />
          
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="p-8 border-b border-[var(--theme-border)] bg-[var(--theme-panel)] flex items-center justify-between relative z-10 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 relative">
                    <User size={28} />
                    {adminOnlineUsers.includes(activeThread.userId) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[var(--theme-panel)]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--theme-text)] tracking-tighter">{activeThread.userName || 'Guest'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {adminTypingStates[activeThread.userId] ? (
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">typing...</p>
                      ) : (
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {adminOnlineUsers.includes(activeThread.userId) ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="btn-secondary p-4 rounded-xl opacity-30 cursor-not-allowed">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-12 space-y-8 custom-scroll relative z-10"
              >
                {activeThread.messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] p-6 rounded-[2rem] text-base font-bold shadow-sm relative ${
                      msg.sender === 'admin' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-[var(--theme-panel)] text-[var(--theme-text)] border border-[var(--theme-border)] rounded-tl-none'
                    }`}>
                      {msg.message}
                      
                      {/* WhatsApp Double Blue Ticks for Admin response messages */}
                      {msg.sender === 'admin' && (
                        <div className="flex justify-end mt-1 px-1 -mr-2">
                          {msg.is_read ? (
                            <div className="flex -space-x-1 text-sky-300">
                              <Check size={14} strokeWidth={3} />
                              <Check size={14} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="flex -space-x-1 text-white/55">
                              <Check size={14} strokeWidth={3} />
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3 px-4">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-10 bg-[var(--theme-panel)] border-t border-[var(--theme-border)] relative z-10">
                <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto flex gap-6">
                  <div className="relative flex-1 group">
                    <input 
                      type="text" 
                      placeholder="Orchestrate a response..."
                      value={message}
                      onChange={handleInputChange}
                      className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl py-6 px-10 text-base font-bold outline-none focus:ring-8 focus:ring-blue-600/5 transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!message.trim()}
                    className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-110 shadow-2xl shadow-blue-600/30 group/send"
                  >
                    <Send size={28} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                  </button>
                </form>
                <div className="text-center mt-6">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-30 flex items-center justify-center gap-3">
                    <ShieldCheck size={12} className="text-blue-600" /> Authorized Administrative Response <Sparkles size={12} className="text-blue-600" />
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-30">
              <div className="w-32 h-32 bg-[var(--theme-accent)] rounded-[3rem] flex items-center justify-center text-blue-600 mb-10 shadow-inner border border-[var(--theme-border)]">
                <MessageSquare size={64} />
              </div>
              <h2 className="text-4xl font-black text-[var(--theme-text)] mb-6 uppercase tracking-tighter">Selection Required</h2>
              <p className="text-xl font-bold text-slate-400 max-w-md tracking-tight leading-relaxed">
                Namaste! Please select a guest narrative from the left to initialize a secure communication bridge.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
