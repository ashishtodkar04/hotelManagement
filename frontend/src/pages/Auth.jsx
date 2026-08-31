import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../services/api';
import { useHotel } from '../hooks/useHotel';
import Footer from '../components/Footer';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ChefHat, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Auth() {
  const { login } = useStore();
  const { name: HOTEL_NAME } = useHotel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    identifier: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.identifier || !formData.password) {
      setErrorMsg('Please enter your login username/email/phone and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(formData.identifier, formData.password);
      if (res.success) {
        navigate(redirectPath);
      } else {
        setErrorMsg(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.response?.data?.error || 'Authentication server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name || !formData.username || !formData.email || !formData.phone || !formData.password) {
      setErrorMsg('Please complete all registration fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/register', {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      if (res.data.success) {
        setSuccessMsg('Registration successful! Logging you in...');
        // Auto login
        const loginRes = await login(formData.email, formData.password);
        if (loginRes.success) {
          setTimeout(() => navigate(redirectPath), 1000);
        } else {
          setIsRegister(false);
        }
      } else {
        setErrorMsg(res.data.error || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg(err.response?.data?.error || 'Registration server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between">
      
      {/* AUTH CONTAINER */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 flex-1 flex items-center justify-center">
        
        <div className="w-full max-w-md space-y-8">
          
          {/* Header Branding */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl accent-gold-gradient text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
              <ChefHat className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
              {HOTEL_NAME} Guest Identity
            </h1>
            <p className="text-xs text-slate-500">
              {isRegister ? 'Create your sovereign member account' : 'Sign in to access reservations & dining rewards'}
            </p>
          </div>

          {/* Card */}
          <div className="luxury-card p-8 bg-white border-2 border-amber-200/80 shadow-2xl space-y-6">
            
            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  !isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error / Success Feedback Banners */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            {!isRegister ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Username, Email, or Phone
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="identifier"
                      placeholder="e.g. john_doe or email@domain.com"
                      value={formData.identifier}
                      onChange={handleChange}
                      className="w-full text-xs py-3 pl-10 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full text-xs py-3 pl-10 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold !py-3.5 text-xs font-bold shadow-lg shadow-amber-600/20"
                >
                  {loading ? 'Authenticating...' : 'Sign In To Member Dashboard'}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Lord Johnathan Vance"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="johnathanvance"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="johnathan@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Create Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold !py-3.5 text-xs font-bold shadow-lg shadow-amber-600/20"
                >
                  {loading ? 'Registering...' : 'Create Sovereign Account'}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-slate-100 text-center">
              <Link to="/admin/login" className="text-[11px] text-slate-500 hover:text-amber-700 font-medium">
                Are you an authorized staff member? <span className="font-bold text-slate-800 underline">Staff Portal Login →</span>
              </Link>
            </div>

          </div>

        </div>

      </div>

      <Footer />

    </div>
  );
}