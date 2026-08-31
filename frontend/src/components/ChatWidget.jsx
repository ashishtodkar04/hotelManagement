import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import socket from '../services/socket';
import { useHotel } from '../hooks/useHotel';
import { MessageSquare, X, Send, Bot, User, Sparkles, CheckCheck } from 'lucide-react';

export default function ChatWidget() {
  const { user, chatMessages, addChatMessage, setChatHistory, markUserMessagesReadInStore } = useStore();
  const { name: HOTEL_NAME } = useHotel();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Generate or read persistent guest ID
  const guestId = user?.id ? String(user.id) : (localStorage.getItem('guest_chat_id') || `guest_${Math.random().toString(36).substring(2, 9)}`);
  const guestName = user?.name || `Guest (${guestId.slice(-4)})`;

  useEffect(() => {
    if (!user?.id && !localStorage.getItem('guest_chat_id')) {
      localStorage.setItem('guest_chat_id', guestId);
    }
  }, [user, guestId]);

  useEffect(() => {
    socket.connect();
    socket.emit('join_user', { userId: guestId, userName: guestName });

    const handleReceiveMessage = (msg) => {
      if (String(msg.userId) === String(guestId)) {
        addChatMessage(msg);
        if (!isOpen && msg.sender === 'admin') {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    const handleChatHistory = (history) => {
      setChatHistory(history);
    };

    const handleTyping = (data) => {
      if (String(data.userId) === String(guestId) && data.sender === 'admin') {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_chat_history', handleChatHistory);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_chat_history', handleChatHistory);
      socket.off('typing', handleTyping);
    };
  }, [guestId, guestName, isOpen, addChatMessage, setChatHistory]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      markUserMessagesReadInStore();
      socket.emit('mark_read', { userId: guestId, sender: 'user' });
    }
  }, [isOpen, guestId, markUserMessagesReadInStore]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      userId: guestId,
      userName: guestName,
      message: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('user_message', payload);
    setInputText('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-full shadow-2xl shadow-amber-600/40 transition-all duration-300 transform hover:scale-110 flex items-center justify-center border-2 border-white"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Box Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Bot className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm tracking-wide">{HOTEL_NAME} Concierge</h3>
                <p className="text-[10px] text-amber-100/90 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Support Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-amber-100 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 custom-scroll">
            
            {/* Greeting */}
            <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-2xl text-xs text-amber-900 shadow-sm flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Welcome to {HOTEL_NAME}!</p>
                <p className="text-amber-800/90 text-[11px]">
                  How may our executive team assist your dining or reservation experience today?
                </p>
              </div>
            </div>

            {chatMessages.map((msg, idx) => {
              const isMe = msg.sender === 'user';
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs shadow-sm ${
                      isMe
                        ? 'bg-amber-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.message}</p>
                    <div
                      className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                        isMe ? 'text-amber-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.time}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-amber-200" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic bg-white p-2.5 rounded-2xl w-fit border border-slate-200">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span>Concierge is typing…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about table, menu, or payments…"
              className="flex-1 text-xs py-2.5 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-all shadow-md shadow-amber-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
