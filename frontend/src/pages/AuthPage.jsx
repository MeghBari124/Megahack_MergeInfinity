import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../config/api';

const AuthPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    // Prefill with default test credentials (auto-login to farmer role)
    const [formData, setFormData] = useState({
        full_name: '',
        email: 'bingostingo1@gmail.com',
        password: 'bingostingo1',
        role: 'farmer' // Default
    });

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';

        try {
            const payload = mode === 'login'
                ? { email: formData.email, password: formData.password }
                : {
                    full_name: formData.full_name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                };

            console.log("Sending auth request to:", endpoint, payload);

            // Use apiClient instead of raw fetch for better consistency
            const { data } = await apiClient.post(endpoint, payload);

            console.log("Auth Success:", data);

            // Store Session
            if (data.session_id) {
                localStorage.setItem('token', data.session_id);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Set token in axios default headers for future requests
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.session_id}`;
            }

            // Redirect
            navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');

        } catch (err) {
            console.error("Auth Error:", err);
            const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Authentication failed';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit login on mount using the prefilled credentials
    React.useEffect(() => {
        // DISABLED: Auto-login to allow manual admin login
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black text-slate-900 dark:text-white relative overflow-hidden">

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-xl dark:shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mx-auto mb-6">
                        <ShieldCheck className="text-emerald-500" size={32} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {mode === 'login' ? t('welcome_back') : t('join_network')}
                    </p>
                </div>

                <div className="flex justify-center mb-6">
                    <button
                        onClick={() => navigate('/auth-face')}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-600 transition-all flex items-center gap-2"
                    >
                        <ShieldCheck size={14} className="text-emerald-500" /> {t('use_face_id')}
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'signup' && (
                        <div className="space-y-2">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                                <input
                                    type="text"
                                    placeholder={t('full_name')}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-12 py-3.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                            <input
                                type="email"
                                placeholder={t('email_address')}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-12 py-3.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                            <input
                                type="password"
                                placeholder={t('password')}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-12 py-3.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {mode === 'signup' && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block text-center mb-2">{t('i_am_a') || "Select Role"}</label>

                            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'farmer' })}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${formData.role === 'farmer' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
                                >
                                    {t('farmer') || "Farmer"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'user' })}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${formData.role === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
                                >
                                    User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${formData.role === 'admin' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                {mode === 'login' ? t('login').toUpperCase() : t('create_account')} <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {mode === 'login' ? t('dont_have_account') : t('already_have_account')}
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setError('');
                            }}
                            className="ml-2 text-blue-600 dark:text-blue-400 font-bold hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                        >
                            {mode === 'login' ? t('sign_up') : t('login')}
                        </button>
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600 text-xs">
                    <ShieldCheck size={12} />
                    <span>{t('secure_encryption')}</span>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;
