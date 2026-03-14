import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, CreditCard, Upload, Save, Check, AlertCircle, Leaf, FileText, Camera } from 'lucide-react';
import { getApiUrl } from '../config/api';

const FarmerProfile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        // Personal Details
        full_name: '',
        father_husband_name: '',
        date_of_birth: '',
        gender: 'Male',

        // Contact Details
        mobile_number: '',
        alternate_mobile: '',
        email: '',

        // Address
        address_line1: '',
        address_line2: '',
        village: '',
        district: '',
        state: '',
        pincode: '',

        // Identity
        aadhaar_number: '',
        pan_number: '',
        voter_id: '',

        // Farm Details
        land_size: '',
        land_unit: 'acres',
        survey_number: '',
        land_ownership: 'Owned',
        crops: '',
        category: 'General',

        // Bank Details
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch_name: '',

        // NDVI (Auto-calculated)
        last_ndvi_value: null,
        crop_loss_percentage: null
    });

    const [documents, setDocuments] = useState({
        aadhaar_doc: null,
        land_doc: null,
        bank_passbook: null,
        photo: null
    });

    const [profileStatus, setProfileStatus] = useState({
        completed: false,
        verified: false,
        completion_percentage: 0
    });

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        calculateCompletionPercentage();
    }, [profileData]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.user_id || user.id || 'default';
            console.log("👤 [FarmerProfile] Loading profile for User ID:", userId);

            const response = await fetch(getApiUrl(`api/feature4/profile?user_id=${userId}`));
            const data = await response.json();

            if (data.profile) {
                // Pre-calculate percentage for immediate display
                const requiredFields = [
                    'full_name', 'father_husband_name', 'mobile_number', 'aadhaar_number',
                    'state', 'district', 'land_size', 'bank_name', 'account_number', 'ifsc_code'
                ];

                const filledFields = requiredFields.filter(field => {
                    const val = data.profile[field];
                    return val !== undefined && val !== null && val.toString().trim() !== '';
                });

                const percentage = Math.round((filledFields.length / requiredFields.length) * 100);

                setProfileData(prev => ({
                    ...prev,
                    ...data.profile
                }));

                setProfileStatus({
                    completed: data.profile.profile_completed || false,
                    verified: data.profile.verified || false,
                    completion_percentage: percentage
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCompletionPercentage = () => {
        const requiredFields = [
            'full_name', 'father_husband_name', 'mobile_number', 'aadhaar_number',
            'state', 'district', 'land_size', 'bank_name', 'account_number', 'ifsc_code'
        ];

        const filledFields = requiredFields.filter(field => {
            const val = profileData[field];
            // Treat 0 as filled for numeric fields like land_size
            if (typeof val === 'number') return true;
            return val !== undefined && val !== null && val.toString().trim() !== '';
        });

        const percentage = Math.round((filledFields.length / requiredFields.length) * 100);
        setProfileStatus(prev => ({ ...prev, completion_percentage: percentage }));
    };

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (docType, event) => {
        const file = event.target.files[0];
        if (file) {
            setDocuments(prev => ({ ...prev, [docType]: file }));
            // In production, upload to storage and save URL
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.user_id || user.id || 'default';

            const profileToSave = {
                ...profileData,
                user_id: userId,
                profile_completed: profileStatus.completion_percentage >= 80
            };

            const response = await fetch(getApiUrl('api/feature4/profile'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: profileToSave })
            });

            if (response.ok) {
                alert('Profile saved successfully!');
                setProfileStatus(prev => ({
                    ...prev,
                    completed: profileStatus.completion_percentage >= 80
                }));
            } else {
                alert('Failed to save profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal', icon: User },
        { id: 'contact', label: 'Contact & Address', icon: MapPin },
        { id: 'farm', label: 'Farm Details', icon: Leaf },
        { id: 'identity', label: 'Identity & Bank', icon: CreditCard },
        { id: 'documents', label: 'Documents', icon: FileText }
    ];

    const indianStates = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-slate-900 dark:text-white text-xl">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 mb-6 text-white shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Complete Your Farmer Profile</h1>
                            <p className="text-emerald-100">Fill your details once, use everywhere (Claims, Schemes, Marketplace)</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2">{profileStatus.completion_percentage}%</div>
                            <div className="text-sm text-emerald-100">Complete</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-white h-full transition-all duration-500"
                            style={{ width: `${profileStatus.completion_percentage}%` }}
                        />
                    </div>

                    {profileStatus.completed && (
                        <div className="mt-3 flex items-center gap-2 text-sm bg-white/20 rounded-lg px-4 py-2 w-fit">
                            <Check size={16} />
                            <span>Profile Complete - Ready for Claims!</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-lg'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-700'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Form Content */}
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl p-6">
                    {/* Personal Details */}
                    {activeTab === 'personal' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Personal Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Full Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.full_name}
                                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="As per Aadhaar"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Father/Husband Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.father_husband_name}
                                        onChange={(e) => handleInputChange('father_husband_name', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="S/o or D/o"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={profileData.date_of_birth}
                                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                                    <select
                                        value={profileData.gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                    <select
                                        value={profileData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="General">General</option>
                                        <option value="OBC">OBC</option>
                                        <option value="SC">SC</option>
                                        <option value="ST">ST</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact & Address */}
                    {activeTab === 'contact' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact & Address Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Mobile Number <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.mobile_number}
                                        onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="10-digit number"
                                        maxLength="10"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alternate Mobile</label>
                                    <input
                                        type="tel"
                                        value={profileData.alternate_mobile}
                                        onChange={(e) => handleInputChange('alternate_mobile', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Optional"
                                        maxLength="10"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address Line 1</label>
                                    <input
                                        type="text"
                                        value={profileData.address_line1}
                                        onChange={(e) => handleInputChange('address_line1', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="House No., Street"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address Line 2</label>
                                    <input
                                        type="text"
                                        value={profileData.address_line2}
                                        onChange={(e) => handleInputChange('address_line2', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Landmark"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Village/Town</label>
                                    <input
                                        type="text"
                                        value={profileData.village}
                                        onChange={(e) => handleInputChange('village', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        District <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.district}
                                        onChange={(e) => handleInputChange('district', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        State <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={profileData.state}
                                        onChange={(e) => handleInputChange('state', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Select State</option>
                                        {indianStates.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pincode</label>
                                    <input
                                        type="text"
                                        value={profileData.pincode}
                                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        maxLength="6"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Farm Details */}
                    {activeTab === 'farm' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Farm Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Land Size <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={profileData.land_size}
                                            onChange={(e) => handleInputChange('land_size', e.target.value)}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <select
                                            value={profileData.land_unit}
                                            onChange={(e) => handleInputChange('land_unit', e.target.value)}
                                            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="acres">Acres</option>
                                            <option value="hectares">Hectares</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Survey Number</label>
                                    <input
                                        type="text"
                                        value={profileData.survey_number}
                                        onChange={(e) => handleInputChange('survey_number', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Land Ownership</label>
                                    <select
                                        value={profileData.land_ownership}
                                        onChange={(e) => handleInputChange('land_ownership', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="Owned">Owned</option>
                                        <option value="Leased">Leased</option>
                                        <option value="Shared">Shared</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Crops Grown</label>
                                    <input
                                        type="text"
                                        value={profileData.crops}
                                        onChange={(e) => handleInputChange('crops', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Wheat, Rice, Cotton"
                                    />
                                </div>

                                {/* NDVI Display */}
                                {profileData.crop_loss_percentage && (
                                    <div className="md:col-span-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-orange-300 mb-1">Latest NDVI Analysis</div>
                                                <div className="text-2xl font-bold text-orange-400">
                                                    {profileData.crop_loss_percentage}% Crop Loss Detected
                                                </div>
                                                <div className="text-xs text-orange-300 mt-1">
                                                    NDVI Value: {profileData.last_ndvi_value}
                                                </div>
                                            </div>
                                            <Leaf size={48} className="text-orange-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Identity & Bank */}
                    {activeTab === 'identity' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Identity Documents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Aadhaar Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.aadhaar_number}
                                            onChange={(e) => handleInputChange('aadhaar_number', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="12-digit Aadhaar"
                                            maxLength="12"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PAN Number</label>
                                        <input
                                            type="text"
                                            value={profileData.pan_number}
                                            onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="ABCDE1234F"
                                            maxLength="10"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Voter ID</label>
                                        <input
                                            type="text"
                                            value={profileData.voter_id}
                                            onChange={(e) => handleInputChange('voter_id', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Bank Details (For Direct Benefit Transfer)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Bank Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.bank_name}
                                            onChange={(e) => handleInputChange('bank_name', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="e.g., State Bank of India"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Branch Name</label>
                                        <input
                                            type="text"
                                            value={profileData.branch_name}
                                            onChange={(e) => handleInputChange('branch_name', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Account Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.account_number}
                                            onChange={(e) => handleInputChange('account_number', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            IFSC Code <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.ifsc_code}
                                            onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="SBIN0001234"
                                            maxLength="11"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {activeTab === 'documents' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Upload Documents</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-800 rounded-lg p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500 transition-colors">
                                    <label className="cursor-pointer block">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Camera className="text-emerald-400" size={24} />
                                            <span className="text-slate-900 dark:text-white font-medium">Aadhaar Card</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileUpload('aadhaar_doc', e)}
                                            className="hidden"
                                        />
                                        <div className="text-xs text-slate-600 dark:text-slate-400">Click to upload (JPG, PNG, PDF)</div>
                                        {documents.aadhaar_doc && (
                                            <div className="mt-2 text-xs text-emerald-400">✓ {documents.aadhaar_doc.name}</div>
                                        )}
                                    </label>
                                </div>

                                <div className="bg-slate-800 rounded-lg p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500 transition-colors">
                                    <label className="cursor-pointer block">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FileText className="text-blue-400" size={24} />
                                            <span className="text-slate-900 dark:text-white font-medium">Land Document</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileUpload('land_doc', e)}
                                            className="hidden"
                                        />
                                        <div className="text-xs text-slate-600 dark:text-slate-400">Click to upload (JPG, PNG, PDF)</div>
                                        {documents.land_doc && (
                                            <div className="mt-2 text-xs text-blue-400">✓ {documents.land_doc.name}</div>
                                        )}
                                    </label>
                                </div>

                                <div className="bg-slate-800 rounded-lg p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500 transition-colors">
                                    <label className="cursor-pointer block">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CreditCard className="text-purple-400" size={24} />
                                            <span className="text-slate-900 dark:text-white font-medium">Bank Passbook</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileUpload('bank_passbook', e)}
                                            className="hidden"
                                        />
                                        <div className="text-xs text-slate-600 dark:text-slate-400">Click to upload (JPG, PNG, PDF)</div>
                                        {documents.bank_passbook && (
                                            <div className="mt-2 text-xs text-purple-400">✓ {documents.bank_passbook.name}</div>
                                        )}
                                    </label>
                                </div>

                                <div className="bg-slate-800 rounded-lg p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500 transition-colors">
                                    <label className="cursor-pointer block">
                                        <div className="flex items-center gap-3 mb-2">
                                            <User className="text-orange-400" size={24} />
                                            <span className="text-slate-900 dark:text-white font-medium">Passport Photo</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload('photo', e)}
                                            className="hidden"
                                        />
                                        <div className="text-xs text-slate-600 dark:text-slate-400">Click to upload (JPG, PNG)</div>
                                        {documents.photo && (
                                            <div className="mt-2 text-xs text-orange-400">✓ {documents.photo.name}</div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-blue-400 mt-0.5" size={20} />
                                    <div className="text-sm text-blue-300">
                                        <p className="font-medium mb-1">Document Guidelines:</p>
                                        <ul className="list-disc list-inside space-y-1 text-blue-200 text-xs">
                                            <li>Upload clear, readable copies of documents</li>
                                            <li>Supported formats: JPG, PNG, PDF (max 5MB each)</li>
                                            <li>Ensure all text is visible and not blurred</li>
                                            <li>These documents will be used for claim verification</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Save Profile</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FarmerProfile;
