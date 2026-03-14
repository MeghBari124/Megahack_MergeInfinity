import { AVAILABLE_ROUTES } from './routeConfig';
import i18n from '../i18n';

// Common field synonyms to map speech (En, Hi, Mr) to input attributes
const FIELD_SYNONYMS = {
    'name': ['name', 'full name', 'identity', 'naam', 'नाम', 'नाव'],
    'full_name': ['full name', 'my name', 'pura naam', 'mera naam', 'मेरा नाम', 'माझे नाव'],
    'email': ['email', 'mail', 'id', 'ईमेल', 'mail id'],
    'password': ['password', 'passcode', 'code', 'पासवर्ड'],
    'mobile': ['mobile', 'phone', 'contact', 'number', 'phone number', 'मोबाइल', 'फोन', 'mobile number'],
    'aadhaar': ['aadhaar', 'aadhar', 'id card', 'uid', 'आधार', 'aadhaar number'],
    'weight': ['weight', 'vajan', 'kg', 'वजन', 'vazaan'],
    'height': ['height', 'un chi', 'tall', 'cm', 'centimeters', 'ऊंचाई', 'उंची', 'unchi'],
    'address': ['address', 'place', 'location', 'village', 'पता', 'पत्ता', 'gaon'],
    'crop': ['crop', 'plant', 'sowing', 'seed', 'फसल', 'पीक', 'fasal', 'peak'],
    'bank': ['bank', 'account', 'branch', 'बैंक'],
    'soil_n': ['nitrogen', 'soil n', 'n value', 'नत्र'],
    'soil_p': ['phosphorus', 'soil p', 'p value', 'स्फुरद'],
    'soil_k': ['potassium', 'soil k', 'k value', 'पालाश'],
    'ph': ['ph', 'acidity', 'alkalinity', 'पीएच'],
    'avg_temperature': ['temperature', 'temp', 'garmi', 'तापमान', 'tapman'],
    'humidity': ['humidity', 'hawa mein nami', 'आर्द्रता', 'nami'],
    'seasonal_rainfall': ['rainfall', 'rain', 'baarnish', 'बारिश', 'पाऊस', 'baaris'],
    'soil_moisture': ['moisture', 'soil water', 'nami', 'ओलावा', 'olava'],
    'crop_duration_days': ['duration', 'days', 'time', 'period', 'समय', 'कालावधी'],
};

// Action keywords for button clicks
const CLICK_KEYWORDS = [
    'submit', 'save', 'calculate', 'send', 'reset', 'clear', 'open', 'analyze', 'search', 'find', 'buy', 'order', 'start', 'stop', 'login', 'signup', 'sign in', 'register', 'apply',
    'जमा करें', 'बचाएं', 'खोलें', 'खरीदें', 'सर्च', 'आवेदन'
];

export const processVoiceLocally = (transcript, currentPath) => {
    const text = transcript.toLowerCase().trim();

    // 0. Base System Actions
    if (text.includes('go back') || text.includes('piche') || text.includes('मागे')) {
        return { targetPath: -1, feedback: 'Going back. पीछे जा रहे हैं।' };
    }
    if (text.includes('refresh') || text.includes('reload') || text.includes('ताज़ा')) {
        return { action: { type: 'click', selector: 'refresh' }, feedback: 'Refreshing page. पेज रीफ्रेश हो रहा है।' };
    }

    // 1. Navigation Intent
    const voiceNavKeys = [
        { key: 'dashboard', path: '/dashboard' },
        { key: 'equipment', path: '/equipment' },
        { key: 'mark_land', path: '/mark-my-land' },
        { key: 'crop_health', path: '/crop-health' },
        { key: 'insurance', path: '/insurance-claim' },
        { key: 'auto_farm', path: '/autonomous-farm' },
        { key: 'crop_recommend', path: '/crop-recommendation' },
        { key: 'schemes', path: '/schemes-assistant' },
        { key: 'inventory', path: '/inventory' },
        { key: 'news', path: '/disaster-news' }
    ];

    for (const { key, path } of voiceNavKeys) {
        const supportedLangs = ['en', 'hi', 'mr'];
        for (const lng of supportedLangs) {
             // Access nested key using dot notation if supported, or manually
             // i18next V21+ might behave differently with getResource options
             // Safe fallback: access store directly if possible or use t with specific lng
             // valid: i18n.getResource(lng, 'translation', `voice_nav.${key}`)
             
             let keywordsStr = i18n.getResource(lng, 'translation', `voice_nav.${key}`);
             
             // If getResource returns undefined for nested keys (depends on version/config), try getting 'voice_nav' object
             if (!keywordsStr) {
                 const voiceNavObj = i18n.getResource(lng, 'translation', 'voice_nav');
                 if (voiceNavObj) keywordsStr = voiceNavObj[key];
             }

             if (typeof keywordsStr === 'string') {
                 const keywords = keywordsStr.split(',').map(k => k.trim().toLowerCase());
                 if (keywords.some(k => text.includes(k))) {
                      return {
                          targetPath: path,
                          feedback: `Opening ${key.replace('_', ' ')}. ${key} खोल रहे हैं।`
                      };
                 }
             }
        }
    }

    // 1.5 Special: Login with email and password
    const loginMatch = text.match(/login\s+with\s+(.+)\s+and\s+(.+)/i);
    if (loginMatch) {
        return {
            action: {
                type: 'multi',
                actions: [
                    { type: 'fill', selector: 'email', value: loginMatch[1].trim().replace(/\s/g, '') },
                    { type: 'fill', selector: 'password', value: loginMatch[2].trim() },
                    { type: 'click', selector: 'submit' }
                ]
            },
            feedback: 'Logging you in now. लॉगिन हो रहा है।'
        };
    }

    // 2. High-Accuracy Field Extractions
    const patterns = {
        phone: /(\d{10})/,
        aadhaar: /(\d{12})|(\d{4}\s\d{4}\s\d{4})/,
        number: /(\d+(\.\d+)?)/
    };

    // Check for standard Aadhaar/Phone first
    if ((text.includes('aadhaar') || text.includes('aadhar') || text.includes('आधार')) && text.match(patterns.aadhaar)) {
        const val = text.match(patterns.aadhaar)[0].replace(/\s/g, '');
        return { action: { type: 'fill', selector: 'aadhaar', value: val }, feedback: 'Setting Aadhaar number. आधार नंबर सेट कर दिया।' };
    }
    if ((text.includes('phone') || text.includes('mobile') || text.includes('नंबर')) && text.match(patterns.phone)) {
        const val = text.match(patterns.phone)[1];
        return { action: { type: 'fill', selector: 'mobile', value: val }, feedback: 'Setting phone number. फोन नंबर सेट कर दिया।' };
    }

    // Generic "Field is Value" matching (En/Hi/Mr patterns)
    // Matches "name is Ramesh", "naam hai Ramesh", "nav aahe Ramesh"
    const fillMatch = text.match(/(?:set|change|my|the|mera|mera naam|naam|nav|नाव|नाव आहे|नाम है)\s+(.+?)\s+(?:is|to|as|hai|aahe|है|आहे)\s+(.+)/i) ||
        text.match(/(.+?)\s+(?:is|to|hai|aahe|है|आहे)\s+(.+)/i);

    if (fillMatch) {
        const extractedField = fillMatch[1].trim();
        const extractedValue = fillMatch[2].trim();

        for (const [canonical, synonyms] of Object.entries(FIELD_SYNONYMS)) {
            if (synonyms.some(s => extractedField.includes(s)) || extractedField.includes(canonical)) {
                return {
                    action: {
                        type: 'fill',
                        selector: canonical,
                        value: extractedValue
                    },
                    feedback: `Setting ${canonical.replace('_', ' ')}. ${canonical} सेट कर दिया।`
                };
            }
        }
    }

    // 3. Click Actions (Button text matching)
    for (const keyword of CLICK_KEYWORDS) {
        if (text.includes(keyword)) {
            return {
                action: { type: 'click', selector: keyword },
                feedback: `Okay, doing ${keyword} now. ${keyword} किया जा रहा है।`
            };
        }
    }

    // 4. Scroll Actions
    if (text.includes('scroll down') || text.includes('niche') || text.includes('खाली')) {
        return { action: { type: 'scroll', value: 'down' }, feedback: 'Scrolling down. नीचे जा रहे हैं।' };
    }
    if (text.includes('scroll up') || text.includes('upar') || text.includes('वर')) {
        return { action: { type: 'scroll', value: 'up' }, feedback: 'Scrolling up. ऊपर जा रहे हैं।' };
    }

    // 5. Special: Schemes Assistant Page Queries (Ask AI)
    if (currentPath === '/schemes-assistant' && text.length > 5) {
        return {
            action: { type: 'chat', query: transcript },
            feedback: `Asking AI about: ${transcript}`
        };
    }

    // 6. Intelligent Fallback: Suggest navigation if fuzzy match is found
    for (const { key } of voiceNavKeys) {
        // Simple heuristic: if the key itself ('news', 'scheme') appears in the text
        // or any of its main keywords appear
        const englishKeywords = i18n.getResource('en', 'translation', `voice_nav.${key}`)?.split(',') || [];
        const isFuzzyMatch = text.includes(key.replace('_', ' ')) || englishKeywords.some(k => text.includes(k.split(' ')[0])); // Check first word of keyword phrase

        if (isFuzzyMatch) {
            const hiCmd = i18n.getResource('hi', 'translation', `voice_nav.${key}`)?.split(',')[0] || '';
            const mrCmd = i18n.getResource('mr', 'translation', `voice_nav.${key}`)?.split(',')[0] || '';
            
            return {
                targetPath: null,
                action: null,
                feedback: `Did you mean ${key.replace('_', ' ')}? Say '${hiCmd}' or '${mrCmd}'.`
            };
        }
    }

    // 7. Generic Fallback
    return {
        targetPath: null,
        action: null,
        feedback: "Try saying 'Go to dashboard' or 'My name is...'. कृपया कहें 'डैशबोर्ड पर जाएं'।"
    };
};
