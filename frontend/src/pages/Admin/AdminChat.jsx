import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import socket from '../../services/socket';
import { useHotel } from '../../hooks/useHotel';
import { 
  MessageSquare, 
  Send, 
  User, 
  ArrowLeft, 
  ShieldCheck, 
  ChefHat, 
  Circle
} from 'lucide-react';

export default function AdminChat() {
  const { name: HOTEL_NAME } = useHotel();

  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    socket.connect();

    // Identify as staff
    socket.emit('admin_join', { role: 'staff' });

    socket.on('user_list_update', (users) => {
      setActiveUsers(users || []);
      if (!selectedUser && users && users.length > 0) {
        setSelectedUser(users[0]);
      }
    });

    socket.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    socket.on('chat_history', (history) => {
      setMessages(history || []);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      socket.off('user_list_update');
      socket.off('chat_message');
      socket.off('chat_history');
    };
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMessages([]);
    socket.emit('fetch_chat_history', { userId: user.userId || user.id });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    const payload = {
      targetUserId: selectedUser.userId || selectedUser.id,
      text: inputText.trim(),
      sender: 'Staff Concierge'
    };

    socket.emit('admin_send_message', payload);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-10 space-y-6 flex flex-col h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">Guest Concierge Live Support Chat</h1>
            <p className="text-xs text-slate-500">Real-time messaging platform connecting staff with website guests</p>
          </div>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden min-h-0">
        
        {/* Left: Active Guest Conversations */}
        <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 flex flex-col overflow-y-auto">
          <h3 className="font-serif font-bold text-slate-900 text-sm px-2">Active Guest Threads</h3>

          {activeUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No active guest chat sessions right now.
            </div>
          ) : (
            <div className="space-y-2">
              {activeUsers.map((u, idx) => {
                const isSelected = selectedUser?.userId === u.userId || selectedUser?.id === u.id;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full p-3.5 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-amber-300 shadow-sm'
                        : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{u.name || `Guest #${u.userId || idx + 1}`}</p>
                        <p className="text-[10px] text-slate-400">Active Session</p>
                      </div>
                    </div>
                    <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Message Window */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
          
          {/* Top User Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  {selectedUser?.name || 'Select a guest thread to chat'}
                </h4>
                <p className="text-[10px] text-slate-400">Concierge Desk Channel</p>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-[#faf8f5]">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Start typing to send a concierge response to this guest.
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isStaff = msg.sender === 'Staff Concierge' || msg.isAdmin;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                      isStaff
                        ? 'bg-slate-900 text-amber-100 rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}>
                      <p className="text-[10px] font-bold opacity-70">{msg.sender || 'Guest'}</p>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
            <input
              type="text"
              placeholder="Type staff message response..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
              disabled={!selectedUser}
            />
            <button
              type="submit"
              disabled={!selectedUser || !inputText.trim()}
              className="btn-gold !py-3 !px-5 text-xs font-bold disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
