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
}));

export default useStore;
