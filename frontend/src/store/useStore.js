import { create } from 'zustand';
import api from '../services/api';

const useStore = create((set) => ({
  user: null,
  isAdmin: false,
  isStaff: false,
  isAuthLoading: true,
  isAdminLoading: true,
  hotelConfig: { hotelName: "Lelite", tagline: "Exquisite Dining" },
  chatMessages: [],

  fetchConfig: async () => {
    try {
      const res = await api.get('/api/hotel-config');
      if (res.data.success) {
        set({ hotelConfig: res.data });
      }
    } catch (err) {
      console.warn('Config fetch failed:', err);
    }
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/api/check-auth');
      set({ user: res.data.loggedIn ? res.data.user : null, isAuthLoading: false });
    } catch {
      set({ user: null, isAuthLoading: false });
    }
  },

  checkAdminAuth: async () => {
    try {
      const res = await api.get('/api/admin/check-auth');
      set({ 
        isAdmin: !!res.data.loggedIn, 
        isStaff: !!res.data.isStaff,
        staffName: res.data.staffName || null,
        isAdminLoading: false 
      });
    } catch {
      set({ isAdmin: false, isStaff: false, staffName: null, isAdminLoading: false });
    }
  },

  checkStaffAuth: async () => {
    try {
      const res = await api.get('/api/admin/check-auth');
      set({ isStaff: !!res.data.isStaff, isAdmin: !!res.data.loggedIn, isAdminLoading: false });
    } catch {
      set({ isStaff: false, isAdminLoading: false });
    }
  },

  setUser: (user) => set({ user }),
  
  // Returns { success, user?, error? } — never throws
  login: async (identifier, password) => {

    try {
      const res = await api.post('/login', { identifier, password });
      if (res.data.success) {
        set({ user: res.data.user });
      }
      return res.data;
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  },

  logout: async () => {
    try { await api.get('/logout'); } catch { /* ignore */ }
    set({ user: null });
  },

  adminLogout: async () => {
    try { await api.get('/api/admin/logout'); } catch { /* ignore */ }
    set({ isAdmin: false, isStaff: false });
  },

  addChatMessage: (msg) => {
    set(state => ({
      chatMessages: [...state.chatMessages, msg].slice(-100)
    }));
  },

  setChatHistory: (messages) => {
    set({ chatMessages: messages });
  },

  // Admin Chat System Slices
  adminThreads: [],
  adminActiveUserId: null,
  adminOnlineUsers: [],
  adminTypingStates: {},

  setAdminActiveUserId: (userId) => set({ adminActiveUserId: userId }),
  setAdminThreads: (threads) => set({ adminThreads: threads }),
  setAdminOnlineUsers: (onlineUsers) => set({ adminOnlineUsers: onlineUsers }),
  updateAdminUserOnlineStatus: (userId, status) => set(state => {
    const list = new Set(state.adminOnlineUsers);
    if (status === 'online') {
      list.add(userId);
    } else {
      list.delete(userId);
    }
    return { adminOnlineUsers: Array.from(list) };
  }),
  setAdminUserTyping: (userId, isTyping) => set(state => ({
    adminTypingStates: {
      ...state.adminTypingStates,
      [userId]: isTyping
    }
  })),
  updateAdminThreadMessage: (msg) => set(state => {
    const threads = [...state.adminThreads];
    const threadIdx = threads.findIndex(t => t.userId === msg.userId);
    const isActive = state.adminActiveUserId === msg.userId;

    if (threadIdx > -1) {
      const existingThread = threads[threadIdx];
      const msgExists = existingThread.messages.some(m => m.id === msg.id || (m.time === msg.time && m.message === msg.message && m.sender === msg.sender));
      const newMessages = msgExists 
        ? existingThread.messages 
        : [...existingThread.messages, msg];

      threads[threadIdx] = {
        ...existingThread,
        unreadCount: (msg.sender === 'user' && !isActive) 
          ? (existingThread.unreadCount || 0) + 1 
          : existingThread.unreadCount,
        messages: newMessages
      };
    } else {
      threads.unshift({
        userId: msg.userId,
        userName: msg.userName,
        unreadCount: (msg.sender === 'user' && !isActive) ? 1 : 0,
        messages: [msg]
      });
    }

    // Sort threads so the one with the newest message is at the top
    threads.sort((a, b) => {
      const aTime = a.messages[a.messages.length - 1]?.created_at || a.messages[a.messages.length - 1]?.time || '';
      const bTime = b.messages[b.messages.length - 1]?.created_at || b.messages[b.messages.length - 1]?.time || '';
      return bTime.localeCompare(aTime);
    });

    return { adminThreads: threads };
  }),
  markAdminThreadAsReadInStore: (userId) => set(state => {
    const threads = state.adminThreads.map(t => {
      if (t.userId === userId) {
        return {
          ...t,
          unreadCount: 0,
          messages: t.messages.map(m => m.sender === 'user' ? { ...m, is_read: 1 } : m)
        };
      }
      return t;
    });
    return { adminThreads: threads };
  }),
  markUserMessagesReadInStore: () => set(state => ({
    chatMessages: state.chatMessages.map(m => m.sender === 'user' ? { ...m, is_read: 1 } : m)
  })),
  updateAdminMessagesRead: ({ userId, sender }) => set(state => {
    const threads = state.adminThreads.map(t => {
      if (t.userId === userId) {
        return {
          ...t,
          unreadCount: sender === 'admin' ? 0 : t.unreadCount,
          messages: t.messages.map(m => {
            if (sender === 'admin' && m.sender === 'user') {
              return { ...m, is_read: 1 };
            }
            if (sender === 'user' && m.sender === 'admin') {
              return { ...m, is_read: 1 };
            }
            return m;
          })
        };
      }
      return t;
    });
    return { adminThreads: threads };
  }),
}));

export default useStore;
