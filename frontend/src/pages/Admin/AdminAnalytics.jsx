import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart as PieIcon, 
  BarChart, 
  ArrowLeft, 
  Calendar, 
  Utensils, 
  CheckCircle2 
} from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [monthlyAudit, setMonthlyAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, auditRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/stats/monthly-audit')
      ]);

      if (statsRes.data.success) setStats(statsRes.data);
      if (auditRes.data.success) setMonthlyAudit(auditRes.data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-10 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">Revenue Analytics & Financial Audit</h1>
            <p className="text-xs text-slate-500">Business metrics, daily revenue trends, dish popularity, and monthly balance audits</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">Calculating financial reports...</div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="luxury-card p-6 bg-white border-l-4 border-l-emerald-500 space-y-2 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Today's Online Payment Revenue</p>
              <h3 className="font-serif text-3xl font-bold text-slate-900">
                ₹{stats?.todayStats?.onlineRevenue || 0}
              </h3>
              <p className="text-[10px] text-emerald-600 font-semibold">Processed via UPI / Auto Verifier</p>
            </div>

            <div className="luxury-card p-6 bg-white border-l-4 border-l-amber-500 space-y-2 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Today's Hard Cash Collection</p>
              <h3 className="font-serif text-3xl font-bold text-slate-900">
                ₹{stats?.todayStats?.cashRevenue || 0}
              </h3>
              <p className="text-[10px] text-amber-600 font-semibold">Collected at Reception Counter</p>
            </div>

            <div className="luxury-card p-6 bg-white border-l-4 border-l-purple-500 space-y-2 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Daily Guest Breakdown</p>
              <h3 className="font-serif text-3xl font-bold text-slate-900">
                {(stats?.todayStats?.walkInCount || 0) + (stats?.todayStats?.onlineBookingCount || 0)} Guests
              </h3>
              <p className="text-[10px] text-purple-600 font-semibold">
                Online: {stats?.todayStats?.onlineBookingCount || 0} | Walk-Ins: {stats?.todayStats?.walkInCount || 0}
              </p>
            </div>
          </div>

          {/* Charts / Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Popular Dishes & Busiest Hours */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Popular Dishes */}
              <div className="luxury-card p-6 bg-white border border-slate-200 space-y-4 shadow-sm">
                <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-600" /> Top 5 Bestselling Dishes
                </h3>
                <div className="space-y-3">
                  {stats?.popularDishes?.map((dish, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-bold text-slate-900">#{idx + 1} {dish.name}</span>
                      <span className="font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">{dish.count} Orders</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hours */}
              <div className="luxury-card p-6 bg-white border border-slate-200 space-y-4 shadow-sm">
                <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Busiest Dining Hours
                </h3>
                <div className="space-y-3">
                  {stats?.busiestHours?.map((slot, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-bold text-slate-900">{slot.hour}:00 Hours</span>
                      <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{slot.count} Bookings</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: Monthly Audit Financial Table */}
            <div className="lg:col-span-6 space-y-6">
              <div className="luxury-card p-6 bg-white border border-slate-200 space-y-4 shadow-sm">
                <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Monthly Audit & Revenue Report
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                        <th className="pb-3">Month</th>
                        <th className="pb-3">Total Bookings</th>
                        <th className="pb-3">Walk-in</th>
                        <th className="pb-3">Online</th>
                        <th className="pb-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyAudit?.revenue?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">{row.month}</td>
                          <td className="py-3 font-semibold text-slate-700">{row.total_bookings}</td>
                          <td className="py-3 text-slate-600">₹{row.walkin_revenue || 0}</td>
                          <td className="py-3 text-slate-600">₹{row.online_revenue || 0}</td>
                          <td className="py-3 font-bold text-emerald-700">₹{row.total_revenue || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
