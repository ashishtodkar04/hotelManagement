/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import useStore from '../store/useStore';
import socket from '../services/socket';

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    // Tone 1: High crisp chime start (D5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    // Tone 2: Soft chime response (A5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.08); 
    gain2.gain.setValueAtTime(0.12, audioCtx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.2);
    
    osc2.start(audioCtx.currentTime + 0.08);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch (err) {
    console.warn('[AUDIO] Chime synthesis error:', err);
  }
}

export default function AdminChatNotificationManager() {
  const { 
    isAdmin, 
    isStaff, 
    adminActiveUserId, 
    setAdminThreads,
    setAdminOnlineUsers,
    updateAdminUserOnlineStatus,
    setAdminUserTyping,
    updateAdminThreadMessage,
    updateAdminMessagesRead,
    setAdminActiveUserId
  } = useStore();

  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const soundCooldown = useRef(false);

  useEffect(() => {
    // Only connect and listen if the user is an authorized admin/staff
    if (!isAdmin && !isStaff) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_admin');

    // Register push notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleChatHistory = (history) => {
      setAdminThreads(history || []);
    };

    const handleOnlineUsersList = (list) => {
      setAdminOnlineUsers(list || []);
    };

    const handleUserStatus = ({ userId, status }) => {
      updateAdminUserOnlineStatus(userId, status);
    };

    const handleTyping = ({ userId, sender, isTyping }) => {
      if (sender === 'user') {
        setAdminUserTyping(userId, isTyping);
      }
    };

    const handleMessagesRead = ({ userId, sender }) => {
      updateAdminMessagesRead({ userId, sender });
    };

    const handleReceiveMessage = (msg) => {
      // Append the message to Zustand store
      updateAdminThreadMessage(msg);

      // We only alert if message is from a guest ('user')
      if (msg.sender !== 'user') return;

      const isCurrentChatPage = location.pathname === '/admin/chat';
      const isViewingThisUser = adminActiveUserId === msg.userId;

      // Play alert chime and show toast if not actively looking at this user's thread
      if (!isCurrentChatPage || !isViewingThisUser) {
        // Trigger synthetic ringtone chime with slight throttling to prevent audio clutter
        if (!soundCooldown.current) {
          playNotificationSound();
          soundCooldown.current = true;
          setTimeout(() => { soundCooldown.current = false; }, 1500);
        }

        // Add to toast stack
        const newToast = {
          id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: msg.userId,
          userName: msg.userName || 'Guest',
          message: msg.message,
          time: msg.time
        };
        setToasts(prev => [newToast, ...prev].slice(0, 3)); // Keep maximum 3 active toasts

        // Send browser push notification if tab is blurred
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const systemNotif = new Notification(`Lelite Guest: ${msg.userName}`, {
              body: msg.message,
              icon: '/favicon.png',
              tag: `chat_${msg.userId}`
            });
            systemNotif.onclick = () => {
              window.focus();
              setAdminActiveUserId(msg.userId);
              navigate('/admin/chat');
              systemNotif.close();
            };
          } catch (err) {
            console.warn('[PUSH] Notification error:', err);
          }
        }
      } else {
        // Since we are viewing this user's thread right now, automatically mark it read
        socket.emit('mark_read', { userId: msg.userId, sender: 'admin' });
      }
    };

    socket.on('chat_history', handleChatHistory);
    socket.on('online_users_list', handleOnlineUsersList);
    socket.on('user_status', handleUserStatus);
    socket.on('typing', handleTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('chat_history', handleChatHistory);
      socket.off('online_users_list', handleOnlineUsersList);
      socket.off('user_status', handleUserStatus);
      socket.off('typing', handleTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [
    isAdmin, 
    isStaff, 
    adminActiveUserId, 
    location.pathname, 
    setAdminThreads, 
    setAdminOnlineUsers, 
    updateAdminUserOnlineStatus, 
    setAdminUserTyping, 
    updateAdminThreadMessage, 
    updateAdminMessagesRead,
    setAdminActiveUserId,
    navigate
  ]);

  // Clean up toasts automatically after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(0, prev.length - 1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (!isAdmin && !isStaff) return null;

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleReply = (userId) => {
    setAdminActiveUserId(userId);
    navigate('/admin/chat');
    setToasts([]);
  };

  return (
    <>
      {/* Dynamic Keyframes injected safely */}
      <style>{`
        @keyframes toast-slide-in {
          0% { transform: translateX(120%) scale(0.9); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        .toast-card {
          animation: toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Toast Notifications Stack */}
      <div className="fixed top-24 right-6 md:right-8 z-[99999] flex flex-col gap-4 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="toast-card pointer-events-auto w-full glass dark:bg-slate-900/90 bg-white/90 border border-slate-200/50 dark:border-white/10 p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-2xl flex gap-4 transition-all duration-300 relative overflow-hidden"
          >
            {/* Ambient indicator accent */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <span className="font-serif italic font-black text-sm text-[var(--theme-text)] truncate">{toast.userName}</span>
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{toast.time}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-4 line-clamp-2 tracking-tight pr-6">
                {toast.message}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleReply(toast.userId)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-all shadow-md active:scale-95 text-center"
                >
                  REPLY NOW
                </button>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-xl transition-all"
                >
                  DISMISS
                </button>
              </div>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
