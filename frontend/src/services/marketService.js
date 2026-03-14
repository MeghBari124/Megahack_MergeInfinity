
const API_KEY = import.meta.env.VITE_MARKET_API_KEY;
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

/**
 * Fetch market prices for specific crops
 * @param {string} state - State name (optional)
 * @param {string} date - Date in DD/MM/YYYY format (optional)
 * @returns {Promise<Array>} List of market prices
 */
export const fetchMarketPrices = async (state = '', district = '') => {
    if (!API_KEY) {
        console.warn("Market API Key is missing");
        return [];
    }

    try {
        const params = new URLSearchParams({
            'api-key': API_KEY,
            'format': 'json',
            'limit': '1000'
        });

        if (state) params.append('filters[state]', state);
        if (district) params.append('filters[district]', district);

        const response = await fetch(`${BASE_URL}?${params.toString()}`);
        const data = await response.json();

        if (data.records) {
            return data.records;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch market prices:", error);
        return [];
    }
};

/**
 * Get the latest price for a specific crop
 * @param {Array} marketData - The data returned from fetchMarketPrices
 * @param {string} cropName - The name of the crop to find
 * @returns {Object|null} - The price record or null
 */
export const getCropPrice = (marketData, cropName) => {
    if (!marketData || !cropName) return null;
    
    // Fuzzy search or direct match
    const record = marketData.find(item => 
        item.commodity.toLowerCase().includes(cropName.toLowerCase()) ||
        cropName.toLowerCase().includes(item.commodity.toLowerCase())
    );

    return record ? {
        price: record.modal_price,
        market: record.market,
        date: record.arrival_date,
        state: record.state,
        district: record.district
    } : null;
};
