import React, { useState, useEffect } from 'react';
import { ShieldCheck, TrendingUp, MapPin, Calendar, ShoppingCart, Tag, Filter, Search, Award, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Marketplace = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMarketplace();
    }, []);

    const fetchMarketplace = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
            const res = await fetch(`${apiBase}/api/feature6/marketplace`);
            const data = await res.json();
            setListings(data);
        } catch (e) {
            console.error("Marketplace fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-lg dark:shadow-2xl">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Annadata Transparency Marketplace
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">Verified cultivation logs for 100% trust in every purchase.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search crops, location..."
                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:border-emerald-500/50 transition-all w-full md:w-64 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                        <button className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                            <Filter size={20} className="text-emerald-500 dark:text-emerald-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Listing Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-96 bg-slate-100 dark:bg-slate-900/50 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800" />
                    ))
                ) : (
                    listings.map((item) => (
                        <div
                            key={item.id}
                            className="group bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-emerald-500/30 transition-all duration-500 hover:shadow-xl dark:hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] flex flex-col"
                        >
                            {/* Product Image Area */}
                            <div className="relative h-56 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <img
                                    src={item.image_url || `https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    alt={item.crop_name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>

                                {/* Verified Badge Top Left */}
                                {item.verified_badge && (
                                    <div className="absolute top-4 left-4 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Verified Cultivator</span>
                                    </div>
                                )}

                                {/* Location Badge Bottom Left */}
                                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                    <MapPin size={12} className="text-emerald-400" />
                                    <span className="text-xs text-white/80 font-medium">{item.location || 'Maharashtra'}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-7 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                                            {item.crop_name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">{item.variety || 'A+ Hybrid'}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{item.price_per_quintal}</span>
                                            <div className="flex items-center gap-1 mt-1">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase">Mandi: ₹{item.mandi_price || Math.floor(item.price_per_quintal * 0.92)}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">/ Quintal</p>
                                    </div>
                                </div>

                                {/* Trust Section - The Core Feature */}
                                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800/50 mb-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={18} className="text-emerald-500" />
                                            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold tracking-wide uppercase">Integrity Score</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black text-slate-900 dark:text-white">{item.integrity_score || 87}<span className="text-slate-500 text-xs font-normal">/100</span></span>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                                            style={{ width: `${item.integrity_score || 87}%` }}
                                        ></div>
                                    </div>
                                    {/* Micro Indicators */}
                                    <div className="flex justify-between gap-2 pt-1">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Irrigation</span>
                                            <div className="w-4 h-1 bg-emerald-500 rounded-full mt-1"></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Fertilizer</span>
                                            <div className="w-4 h-1 bg-emerald-500 rounded-full mt-1"></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Disease-Free</span>
                                            <div className="w-4 h-1 bg-emerald-500 rounded-full mt-1"></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">NDVI Health</span>
                                            <div className="w-4 h-1 bg-emerald-500 rounded-full mt-1"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-100 dark:bg-slate-800/30 px-3 py-2 rounded-xl flex items-center gap-2 border border-slate-200 dark:border-white/[0.03]">
                                        <Tag size={12} className="text-slate-400 dark:text-slate-500" />
                                        <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">{item.quantity} Qtl Available</span>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800/30 px-3 py-2 rounded-xl flex items-center gap-2 border border-slate-200 dark:border-white/[0.03]">
                                        <Calendar size={12} className="text-slate-400 dark:text-slate-500" />
                                        <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Harvest Oct 2024</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-3">
                                    <button
                                        onClick={() => navigate(`/product-transparency/${item.batch_id}`)}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all border border-slate-200 dark:border-slate-700 active:scale-95 shadow-sm dark:shadow-xl dark:shadow-black/20"
                                    >
                                        Verify Proofs
                                    </button>
                                    <button className="flex-[1.5] py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-95">
                                        <ShoppingCart size={14} />
                                        Purchase Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Marketplace;
