import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { List, Bot, User, FileText, X, CheckCircle, Clock, AlertCircle, ClipboardList } from 'lucide-react';
import BrowseSchemes from '../components/Feature4/BrowseSchemes';
import AskAI from '../components/Feature4/AskAI';
import FarmerProfile from '../components/Feature4/FarmerProfile';
import MyApplications from '../components/Feature4/MyApplications';
import { getApiUrl } from '../config/api';

const SchemesPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('browse');
    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [applicationStatus, setApplicationStatus] = useState(null);

    // Load profile from API and applications from localStorage on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await fetch(getApiUrl('api/feature4/profile?user_id=default'));
                const data = await response.json();
                if (data.profile) {
                    setProfile(data.profile);
                    // Also save to localStorage as backup
                    localStorage.setItem('farmerProfile', JSON.stringify(data.profile));
                } else {
                    // Fallback to localStorage
                    const savedProfile = localStorage.getItem('farmerProfile');
                    if (savedProfile) {
                        setProfile(JSON.parse(savedProfile));
                    }
                }
            } catch (error) {
                console.error('Error loading profile from API:', error);
                // Fallback to localStorage
                const savedProfile = localStorage.getItem('farmerProfile');
                if (savedProfile) {
                    setProfile(JSON.parse(savedProfile));
                }
            }
        };

        loadProfile();

        // Load applications from localStorage
        const savedApps = localStorage.getItem('farmerApplications');
        if (savedApps) {
            setApplications(JSON.parse(savedApps));
        }
    }, []);

    // Save applications to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('farmerApplications', JSON.stringify(applications));
    }, [applications]);

    const tabs = [
        { id: 'browse', label: t('browse_schemes'), icon: List },
        { id: 'ai', label: t('ask_ai'), icon: Bot },
        { id: 'applications', label: t('my_applications'), icon: ClipboardList, badge: applications.length },
        { id: 'profile', label: t('my_profile'), icon: User }
    ];

    const handleApply = (scheme) => {
        setSelectedScheme(scheme);
        setShowApplicationModal(true);
        setApplicationStatus(null);
    };

    const handleProfileSave = (newProfile) => {
        setProfile(newProfile);
    };

    // Handle applications submitted via AI chat
    const handleAIApplicationSubmit = (applicationDetails) => {
        if (!applicationDetails) return;

        const newApplication = {
            schemeName: applicationDetails.scheme_name || 'Government Scheme',
            schemeId: (applicationDetails.scheme_name || 'scheme').replace(/\s+/g, '-').toLowerCase(),
            applicantName: applicationDetails.applicant_name || profile?.name || 'Farmer',
            state: applicationDetails.applicant_state || profile?.state || 'Not specified',
            category: applicationDetails.applicant_category || profile?.category || 'General',
            subsidyAmount: applicationDetails.max_subsidy_amount || 'TBD',
            subsidyPercentage: applicationDetails.subsidy_percentage,
            appliedDate: new Date().toLocaleDateString('en-IN'),
            status: 'pending',
            referenceNo: applicationDetails.reference_no || generateReferenceNo(),
            submittedVia: 'AI Assistant',
            portalUrl: applicationDetails.portal_url
        };

        // Check if this application already exists (by reference number)
        setApplications(prev => {
            const exists = prev.some(app => app.referenceNo === newApplication.referenceNo);
            if (exists) return prev;
            return [newApplication, ...prev];
        });
    };

    const generateReferenceNo = () => {
        const prefix = "AGR";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    };

    const submitApplication = async () => {
        setApplicationStatus('pending');

        try {
            // Get user info from localStorage or auth context
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.user_id || user.id || 'guest-' + Date.now();

            // Prepare application data
            const applicationData = {
                user_id: userId,
                farmer_name: profile?.name || user.name || 'Unknown',
                farmer_phone: profile?.phone || user.phone || '',
                scheme_name: selectedScheme.scheme_name,
                application_details: {
                    scheme_details: {
                        description: selectedScheme.description,
                        category: selectedScheme.category,
                        state: selectedScheme.state,
                        subsidy_percentage: selectedScheme.subsidy_percentage,
                        max_amount: selectedScheme.formatted_max_amount,
                        application_url: selectedScheme.application_url
                    },
                    applicant_details: {
                        name: profile?.name || 'Unknown',
                        email: user.email || profile?.email || '',
                        phone: profile?.phone || '',
                        state: profile?.state || '',
                        category: profile?.category || '',
                        land_size: profile?.land_size || ''
                    },
                    submitted_at: new Date().toISOString(),
                    submitted_from: 'Schemes Page'
                }
            };

            // Call API to save application
            console.log('📤 Submitting application:', applicationData);
            const response = await fetch(getApiUrl('api/feature2/scheme-applications'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(applicationData)
            });

            const result = await response.json();
            console.log('📥 API Response:', result);

            if (result.status === 'success' && result.reference_no) {
                // Create local application entry for immediate UI update
                const newApplication = {
                    schemeName: selectedScheme.scheme_name,
                    schemeId: selectedScheme.scheme_name.replace(/\s+/g, '-').toLowerCase(),
                    applicantName: profile?.name || 'Farmer',
                    state: profile?.state || 'Not specified',
                    category: profile?.category || 'General',
                    subsidyAmount: selectedScheme.formatted_max_amount || 'TBD',
                    subsidyPercentage: selectedScheme.subsidy_percentage,
                    appliedDate: new Date().toLocaleDateString('en-IN'),
                    status: 'submitted',
                    referenceNo: result.reference_no
                };

                setApplications(prev => [newApplication, ...prev]);
                setApplicationStatus('submitted');
            } else {
                throw new Error(result.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('❌ Application submission error:', error);
            setApplicationStatus(null);
            alert('Failed to submit application. Please try again. Error: ' + error.message);
        }
    };

    const clearApplications = () => {
        if (window.confirm('Are you sure you want to clear all applications?')) {
            setApplications([]);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 pb-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('schemes_title')}
                </h1>
                <p className="text-slate-600 dark:text-gray-400">
                    {t('schemes_subtitle')}
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-organic-green/20 text-organic-green border-b-2 border-organic-green'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {tab.badge > 0 && (
                                    <span className="bg-organic-green text-white text-xs px-2 py-0.5 rounded-full">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'browse' && (
                        <BrowseSchemes profile={profile} onApply={handleApply} />
                    )}
                    {activeTab === 'ai' && (
                        <div className="h-[60vh]">
                            <AskAI profile={profile} onApplicationSubmit={handleAIApplicationSubmit} />
                        </div>
                    )}
                    {activeTab === 'applications' && (
                        <MyApplications applications={applications} onClear={clearApplications} />
                    )}
                    {activeTab === 'profile' && (
                        <FarmerProfile profile={profile} onSave={handleProfileSave} />
                    )}
                </div>
            </div>

            {/* Application Modal */}
            {showApplicationModal && selectedScheme && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 shadow-md dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-organic-green/20 rounded-full flex items-center justify-center">
                                    <FileText className="text-organic-green" size={20} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('apply_scheme_title')}</h3>
                            </div>
                            <button
                                onClick={() => setShowApplicationModal(false)}
                                className="text-slate-600 dark:text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {applicationStatus === 'submitted' ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="mx-auto text-green-400 mb-4" size={60} />
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('application_submitted')}</h4>
                                    <p className="text-slate-600 dark:text-gray-400 mb-4">
                                        <Trans i18nKey="application_submitted_desc" values={{ scheme_name: selectedScheme.scheme_name }}>
                                            Your application for "{{ scheme_name: selectedScheme.scheme_name }}" has been submitted.
                                        </Trans>
                                    </p>
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-left">
                                        <div className="flex items-center gap-2 text-yellow-400 mb-2">
                                            <Clock size={16} />
                                            <span className="font-medium">{t('status_pending')}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-gray-400">
                                            {t('track_application')}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 mt-6 justify-center">
                                        <button
                                            onClick={() => {
                                                setShowApplicationModal(false);
                                                setActiveTab('applications');
                                            }}
                                            className="px-6 py-2 bg-organic-green rounded-lg text-white"
                                        >
                                            {t('view_applications')}
                                        </button>
                                        <button
                                            onClick={() => setShowApplicationModal(false)}
                                            className="px-6 py-2 bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none rounded-lg text-slate-900 dark:text-white"
                                        >
                                            {t('close')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg p-4">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{selectedScheme.scheme_name}</h4>
                                        <p className="text-sm text-slate-600 dark:text-gray-400">{selectedScheme.description}</p>
                                        <div className="mt-3 flex gap-4 text-sm">
                                            <span className="text-organic-green font-semibold">
                                                {selectedScheme.subsidy_percentage}% {t('subsidy')}
                                            </span>
                                            <span className="text-slate-900 dark:text-white">
                                                {t('subsidy_up_to')} {selectedScheme.formatted_max_amount}
                                            </span>
                                        </div>
                                    </div>

                                    {!profile ? (
                                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-orange-400 mb-2">
                                                <AlertCircle size={16} />
                                                <span className="font-medium">{t('profile_required')}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
                                                {t('profile_required_desc')}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setShowApplicationModal(false);
                                                    setActiveTab('profile');
                                                }}
                                                className="text-sm text-organic-green hover:underline"
                                            >
                                                {t('go_to_profile')}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                <h5 className="text-sm text-slate-600 dark:text-gray-400">{t('application_details')}</h5>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg p-3">
                                                        <span className="text-slate-500 dark:text-gray-500">{t('name')}</span>
                                                        <p className="text-slate-900 dark:text-white">{profile.name}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg p-3">
                                                        <span className="text-slate-500 dark:text-gray-500">{t('state')}</span>
                                                        <p className="text-slate-900 dark:text-white">{profile.state}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg p-3">
                                                        <span className="text-slate-500 dark:text-gray-500">{t('category')}</span>
                                                        <p className="text-slate-900 dark:text-white">{profile.category}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg p-3">
                                                        <span className="text-slate-500 dark:text-gray-500">{t('land_size')}</span>
                                                        <p className="text-slate-900 dark:text-white">{profile.land_size || 'N/A'} acres</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={submitApplication}
                                                disabled={applicationStatus === 'pending'}
                                                className="w-full py-3 bg-organic-green hover:bg-green-600 disabled:opacity-50 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                {applicationStatus === 'pending' ? (
                                                    <>
                                                        <Clock className="animate-spin" size={18} />
                                                        {t('submitting')}
                                                    </>
                                                ) : (
                                                    t('submit_application')
                                                )}
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemesPage;
