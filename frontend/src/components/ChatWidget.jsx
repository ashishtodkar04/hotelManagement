import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ShieldCheck, Sparkles, Minus, Check } from 'lucide-react';
import useStore from '../store/useStore';
import socket from '../services/socket';

export default function ChatWidget() {
  const { user, chatMessages, addChatMessage, setChatHistory, markUserMessagesReadInStore } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [unread, setUnread] = useState(0);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  useEffect(() => {
    if (!user) return;

    if (!socket.connected) socket.connect();

    const onConnect = () => {
      socket.emit('join_user', user.id);
      socket.emit('mark_read', { userId: user.id, sender: 'user' });
    };

    socket.on('connect', onConnect);
    if (socket.connected) {
      onConnect();
    }

    const handleMessage = (msg) => {
      if (String(msg.userId) === String(user.id)) {
        addChatMessage(msg);
        if (!isOpenRef.current) {
          setUnread(prev => prev + 1);
        } else {
          // If open, notify admin that we read it immediately
          socket.emit('mark_read', { userId: user.id, sender: 'user' });
        }
      }
    };

    const handleHistory = (history) => {
      setChatHistory(history);
    };

    const handleTyping = ({ userId, sender, isTyping }) => {
      if (sender === 'admin' && String(userId) === String(user.id)) {
        setIsAdminTyping(isTyping);
      }
    };

    const handleMessagesRead = ({ userId, sender }) => {
      // If admin read our messages, update the local read status (blue ticks)
      if (sender === 'admin' && String(userId) === String(user.id)) {
        markUserMessagesReadInStore();
      }
    };

    socket.on('receive_message', handleMessage);
    socket.on('user_chat_history', handleHistory);
    socket.on('typing', handleTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('connect', onConnect);
      socket.off('receive_message', handleMessage);
      socket.off('user_chat_history', handleHistory);
      socket.off('typing', handleTyping);
      socket.off('messages_read', handleMessagesRead);
      
      // Clean up typing indicators
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user, addChatMessage, setChatHistory, markUserMessagesReadInStore]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isOpen, isAdminTyping]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!user) return;

    socket.emit('typing', { userId: user.id, sender: 'user', isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { userId: user.id, sender: 'user', isTyping: false });
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { userId: user.id, sender: 'user', isTyping: false });

    const msgData = {
      userId: user.id,
      userName: user.name,
      message: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_read: 0
    };

    socket.emit('user_message', msgData);
    setMessage('');
  };

  const toggleChat = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      setUnread(0);
      socket.emit('mark_read', { userId: user.id, sender: 'user' });
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[1000] flex flex-col items-end gap-6">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] md:w-[450px] h-[500px] md:h-[600px] glass flex flex-col shadow-2xl border border-white/20 animate-slide-up overflow-hidden rounded-[2.5rem]">
          {/* Header */}
          <div className="p-8 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tighter uppercase">Guest Support</h3>
                <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isAdminTyping ? 'Concierge is typing...' : 'Staff Online'}
                </div>
              </div>
            </div>
            <button onClick={toggleChat} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 relative z-10">
              <Minus size={24} />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-6 custom-scroll bg-[var(--theme-bg)]/50 backdrop-blur-md"
          >
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                <MessageSquare size={48} className="mb-6 text-blue-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">
                  Namaste! Initialize your inquiry below. Our staff is ready to assist.
                </p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-5 rounded-[1.5rem] text-sm font-bold shadow-sm relative ${
                    msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-[var(--theme-panel)] text-[var(--theme-text)] border border-[var(--theme-border)] rounded-tl-none'
                  }`}>
                    {msg.message}

                    {/* Double Ticks for Guest messages */}
                    {msg.sender === 'user' && (
                      <div className="flex justify-end mt-1 px-1 -mr-2">
                        {msg.is_read ? (
                          <div className="flex -space-x-1 text-sky-300">
                            <Check size={12} strokeWidth={3} />
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="flex -space-x-1 text-white/55">
                            <Check size={12} strokeWidth={3} />
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 px-2">{msg.time}</span>
                </div>
              ))
            )}

            {/* Admin typing indicator bubble */}
            {isAdminTyping && (
              <div className="flex flex-col items-start animate-pulse">
                <div className="bg-[var(--theme-panel)] text-slate-400 border border-[var(--theme-border)] p-4 rounded-[1.5rem] rounded-tl-none text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-6 bg-[var(--theme-panel)] border-t border-[var(--theme-border)]">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Type your query..."
                value={message}
                onChange={handleInputChange}
                className="w-full bg-[var(--theme-input)] border border-[var(--theme-border)] rounded-2xl py-5 pl-8 pr-16 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
              />
              <button 
                type="submit"
                disabled={!message.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-110 shadow-lg shadow-blue-600/20"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest mt-4 opacity-30 flex items-center justify-center gap-2">
              <Sparkles size={8} className="text-blue-600" /> Encrypted Transmission
            </p>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={toggleChat}
        className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 group relative ${
          isOpen ? 'bg-slate-900 text-white rotate-90 scale-90' : 'bg-blue-600 text-white hover:scale-110'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={32} />}
        
        {unread > 0 && !isOpen && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-black border-4 border-[var(--theme-bg)] animate-bounce">
            {unread}
          </div>
        )}
      </button>
    </div>
  );
}
