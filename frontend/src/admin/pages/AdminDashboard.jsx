import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText,
    CheckCircle,
    Clock,
    AlertTriangle,
    TrendingUp,
    MapPin,
    Users,
    Search,
    MoreHorizontal,
    RefreshCw,
    Loader2,
    Eye
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import SpotlightCard from '../components/SpotlightCard';
import { useThemeStore } from '../../store/themeStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://let-go-3-0.onrender.com';

const StatCard = ({ title, value, change, icon: Icon, spotlightColor, loading }) => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <SpotlightCard className={`p-6 h-full transition-all duration-300 ${isDark ? 'shadow-2xl' : 'shadow-lg bg-white border-slate-200'}`} spotlightColor={spotlightColor}>
            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-10 w-10 bg-slate-700/20 rounded-xl"></div>
                    <div className="space-y-2">
                        <div className="h-8 w-24 bg-slate-700/20 rounded"></div>
                        <div className="h-4 w-32 bg-slate-700/20 rounded"></div>
                    </div>
                </div>
            ) : (
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl backdrop-blur-sm
                            ${isDark ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        {change !== undefined && (
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center
                                ${change >= 0
                                    ? (isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50')
                                    : 'text-red-400 bg-red-500/10'}`}>
                                <TrendingUp className="w-3 h-3 mr-1" /> {Math.abs(change)}%
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {value}
                        </h3>
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {title}
                        </p>
                    </div>
                </div>
            )}
        </SpotlightCard>
    );
}

import { useNavigate } from 'react-router-dom';

const RecentClaimRow = ({ claim }) => {
    const { theme } = useThemeStore();
    const navigate = useNavigate();
    const isDark = theme === 'dark';
    const { farmer, type, amount, status, date } = claim;

    return (
        <tr className={`transition-colors border-b last:border-0
            ${isDark
                ? 'hover:bg-slate-800/50 border-slate-800'
                : 'hover:bg-slate-50 border-slate-100'}`}>
            <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        {farmer.charAt(0)}
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{farmer}</span>
                </div>
            </td>
            <td className={`py-4 px-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{type}</td>
            <td className={`py-4 px-4 text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{amount}</td>
            <td className={`py-4 px-4 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{date}</td>
            <td className="py-4 px-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize
                    ${status === 'Approved' || status === 'approved'
                        ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                        : status === 'submitted' || status === 'Pending'
                            ? (isDark ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border-yellow-200')
                            : (isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200')
                    }`}>
                    {status}
                </span>
            </td>
            <td className="py-4 px-4 text-right">
                <button
                    onClick={() => navigate('/admin/claims')}
                    className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-medium
                    ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </button>
            </td>
        </tr>
    )
}

const AdminDashboard = () => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    // State
    const [stats, setStats] = useState({
        total_claims: 0,
        pending_approvals: 0,
        active_alerts: 0,
        disbursed_amount: "₹0"
    });
    const [chartData, setChartData] = useState([]);
    const [recentClaims, setRecentClaims] = useState([]);
    const [riskAlerts, setRiskAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsRes, chartRes, claimsRes, risksRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/dashboard-stats`),
                    axios.get(`${API_URL}/admin/dashboard-chart`),
                    axios.get(`${API_URL}/admin/recent-claims`),
                    axios.get(`${API_URL}/admin/risk-heatmap`)
                ]);

                setStats(statsRes.data);
                setChartData(chartRes.data);
                setRecentClaims(claimsRes.data);
                setRiskAlerts(risksRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Real-time polling every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 pb-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    loading={loading}
                    title="Total Claims"
                    value={stats.total_claims}
                    change={12.5}
                    icon={FileText}
                    spotlightColor={isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.2)"}
                />
                <StatCard
                    loading={loading}
                    title="Pending Approval"
                    value={stats.pending_approvals}
                    change={-5}
                    icon={Clock}
                    spotlightColor={isDark ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 0.2)"}
                />
                <StatCard
                    loading={loading}
                    title="Active Alerts"
                    value={stats.active_alerts}
                    change={2.1}
                    icon={AlertTriangle}
                    spotlightColor={isDark ? "rgba(168, 85, 247, 0.4)" : "rgba(168, 85, 247, 0.2)"}
                />
                <StatCard
                    loading={loading}
                    title="Disbursed Amount"
                    value={stats.disbursed_amount}
                    change={8.2}
                    icon={CheckCircle}
                    spotlightColor={isDark ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section */}
                <SpotlightCard
                    spotlightColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(100, 116, 139, 0.1)"}
                    className={`lg:col-span-2 rounded-2xl p-6 shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                >
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Claims Velocity</h3>
                            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Weekly submission trends vs processed</p>
                        </div>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : (
                            <select className={`text-sm rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 border
                        ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'}`}>
                                <option>This Week</option>
                                <option>Last Month</option>
                            </select>
                        )}
                    </div>

                    <div className="h-80 w-full relative z-10">
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.length > 0 ? chartData : []}>
                                    <defs>
                                        <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name"
                                        stroke={isDark ? "#64748b" : "#94a3b8"}
                                        tick={{ fill: isDark ? '#64748b' : '#64748b' }}
                                        axisLine={false} tickLine={false} />
                                    <YAxis
                                        stroke={isDark ? "#64748b" : "#94a3b8"}
                                        tick={{ fill: isDark ? '#64748b' : '#64748b' }}
                                        axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                            borderColor: isDark ? '#334155' : '#e2e8f0',
                                            color: isDark ? '#fff' : '#1e293b',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: isDark ? '#fff' : '#334155' }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                                    <Area type="monotone" dataKey="claims" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorClaims)" />
                                    <Area type="monotone" dataKey="processed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProcessed)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </SpotlightCard>

                {/* Live Alerts / Heatmap Placeholder */}
                <div className="space-y-6">
                    <div className={`border rounded-2xl p-6 shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Risk Heatmap</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-12 rounded-lg transition-all hover:scale-105 cursor-pointer
                                ${i === 5 || i === 10 ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/30' :
                                            i % 3 === 0 ? 'bg-yellow-500/40' :
                                                'bg-emerald-500/20'}`}
                                    title={i === 5 ? "Critical Flood Risk" : "Normal"}
                                ></div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center"><div className="w-2 h-2 rounded bg-emerald-500/20 mr-1"></div>Safe</span>
                            <span className="flex items-center"><div className="w-2 h-2 rounded bg-yellow-500/40 mr-1"></div>Warning</span>
                            <span className="flex items-center"><div className="w-2 h-2 rounded bg-red-500 mr-1"></div>Critical</span>
                        </div>
                    </div>

                    <div className={`border rounded-2xl p-6 shadow-xl ${isDark
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
                        : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'
                        }`}>
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Active Alerts</h3>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-4 text-slate-500 text-sm">Loading alerts...</div>
                            ) : riskAlerts.length > 0 ? (
                                riskAlerts.map(alert => (
                                    <div key={alert.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <p className="text-xs text-red-500 font-bold mb-1 uppercase">{alert.type} • {alert.location}</p>
                                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{alert.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <p className="text-sm text-emerald-500 text-center">No active alerts at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Claims Table */}
            <SpotlightCard
                spotlightColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(100, 116, 139, 0.1)"}
                className={`rounded-2xl p-6 shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Claims</h3>
                    <div className="relative">
                        <Search className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            placeholder="Search claims..."
                            className={`pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
                        ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'}`}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto relative z-10">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-transparent">
                                <th className="pb-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Farmer</th>
                                <th className="pb-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Crop/Scheme</th>
                                <th className="pb-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="pb-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="pb-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="pb-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-slate-500">Loading records...</td></tr>
                            ) : recentClaims.length > 0 ? (
                                recentClaims.map((claim) => (
                                    <RecentClaimRow key={claim.id} claim={claim} />
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center py-10 text-slate-500">No recent claims found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SpotlightCard>
        </div>
    );
};

export default AdminDashboard;
