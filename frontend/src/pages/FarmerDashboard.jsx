import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Tilt } from 'react-tilt';
import TodaysActionCard from '../components/features/TodaysActionCard';
import ZoneMap from '../components/features/ZoneMap';
import AIExplanationCard from '../components/features/AIExplanationCard';
import SoilHealthCards from '../components/features/SoilHealthCards';
import CropHealth from '../components/features/CropHealth';
import MandiPrices from '../components/features/MandiPrices';
import WeatherForecast from '../components/features/WeatherForecast';
import SmartIrrigation from '../components/features/SmartIrrigation';
import GasMonitoringCard from '../components/features/GasMonitoringCard';
import FireDetectionCard from '../components/features/FireDetectionCard';
import { ArrowRight, Bell, Settings, Activity } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const DashboardSection = ({ title, children, className = "" }) => (
    <div className={`flex flex-col h-full ${className}`}>
        {title && <h3 className="gov-section-header">{title}</h3>}
        {children}
    </div>
);

const FarmerDashboard = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const [sensorData, setSensorData] = useState(null);

    useEffect(() => {
        // Get user data
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) { console.error(e); }
        }

        const fetchSensorData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = user.id || 'HARDWARE_DEFAULT';

                console.log(`Fetching sensor data for ${userId}...`);
                const response = await fetch(`${API_BASE_URL}/api/hardware/latest?user_id=HARDWARE_DEFAULT`);

                const result = await response.json();

                if (result.status === 'success' && result.data) {
                    setSensorData(result.data);
                }
            } catch (error) {
                console.error('Error fetching sensor data from backend:', error);
            }
        };

        fetchSensorData();
        const intervalId = setInterval(fetchSensorData, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? t('good_morning') || 'Good Morning' : currentHour < 17 ? t('good_afternoon') || 'Good Afternoon' : t('good_evening') || 'Good Evening';

    return (
        <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <span>{greeting}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                        {t('namaste') || 'Namaste'}, <span className="text-organic-green">{user?.full_name?.split(' ')[0] || t('farmer') || 'Farmer'}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="relative p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-organic-green transition-colors shadow-sm">
                        <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">3</span>
                    </button>
                    <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-organic-green transition-colors shadow-sm">
                        <Settings size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
                {/* ROW 1: PRIMARY ACTION & MAP */}
                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-5 min-h-[380px]">
                    <DashboardSection title={t('primary_decision') || 'Primary Decision'}>
                        <TodaysActionCard sensorData={sensorData} />
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-3 min-h-[250px]">
                    <DashboardSection title={t('irrigation_zones') || 'Irrigation Zones'}>
                        <div className="gov-card-elevated h-full overflow-hidden">
                            <ZoneMap />
                        </div>
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-12 lg:col-span-4 min-h-[250px]">
                    <DashboardSection title={t('ai_insights') || 'AI Insights'}>
                        <AIExplanationCard />
                    </DashboardSection>
                </motion.div>

                {/* ROW 2: SOIL HEALTH & WEATHER */}
                <motion.div variants={item} className="col-span-1 md:col-span-7 lg:col-span-5 min-h-[200px]">
                    <DashboardSection title={t('soil_health_title') || 'Soil Health'}>
                        <SoilHealthCards sensorData={sensorData} />
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-5 lg:col-span-3 min-h-[200px]">
                    <DashboardSection title={t('field_weather') || 'Weather'}>
                        <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
                            <WeatherForecast />
                        </Tilt>
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-12 lg:col-span-4 min-h-[200px]">
                    <DashboardSection title={t('smart_controls') || 'Smart Controls'}>
                        <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
                            <SmartIrrigation sensorData={sensorData} />
                        </Tilt>
                    </DashboardSection>
                </motion.div>

                {/* ROW 3: CROP HEALTH & MARKET */}
                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-6">
                    <DashboardSection title={t('crop_vision') || 'Crop Health'}>
                        <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
                            <CropHealth />
                        </Tilt>
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-6">
                    <DashboardSection title={t('market_intel') || 'Market Prices'}>
                        <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
                            <MandiPrices />
                        </Tilt>
                    </DashboardSection>
                </motion.div>

                {/* ROW 4: WAREHOUSE SAFETY MONITORING */}
                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-6 min-h-[350px]">
                    <DashboardSection title="Gas Monitoring">
                        <GasMonitoringCard />
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-6 min-h-[350px]">
                    <DashboardSection title="Fire Detection">
                        <FireDetectionCard />
                    </DashboardSection>
                </motion.div>
            </motion.div>

            {/* AI Learning Progress Footer */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-10 gov-card p-6"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-shrink-0">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                            <Activity size={18} className="text-organic-green" />
                            {t('ai_learning_progress') || 'AI Learning Progress'}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('ai_learning_desc') || 'Your personalized model is improving.'}</p>
                    </div>

                    <div className="flex-1 w-full md:max-w-md">
                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                            <span>{t('day_1') || 'Day 1'}</span>
                            <span className="text-organic-green font-bold">Day 19 (65%)</span>
                            <span>{t('day_30') || 'Day 30'}</span>
                        </div>
                        <div className="gov-progress">
                            <div className="gov-progress-bar bg-gradient-to-r from-organic-green-600 to-organic-green-400" style={{ width: '65%' }} />
                        </div>
                    </div>

                    <button className="gov-btn-outline flex-shrink-0">
                        {t('view_analysis') || 'View Analysis'} <ArrowRight size={16} />
                    </button>
                </div>
            </motion.div>

        </div>
    );
};

export default FarmerDashboard;
