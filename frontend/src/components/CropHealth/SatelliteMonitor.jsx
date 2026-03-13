import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap, Circle, Polygon, Rectangle, Tooltip, useMapEvents, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { Phone, ExternalLink } from "lucide-react";
import DecisionIntelligencePanel from "./DecisionIntelligence";

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const STATIC_AGRONOMISTS = [
    { name: "Dr. Neelay", phone: "+919021935820" },
    { name: "Dr. Dhruv", phone: "+918408917498" }
];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapController = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 16, { duration: 2.5, easeLinearity: 0.25 });
        }
    }, [coords, map]);
    return null;
};

const DrawController = ({ isDrawing, onAddPoint }) => {
    useMapEvents({
        click(e) {
            if (isDrawing) {
                onAddPoint([e.latlng.lat, e.latlng.lng]);
            }
        }
    });
    return null;
};

const StatusBadge = ({ health }) => {
    let color = "bg-gray-500";
    let icon = "⚪";

    if (health.includes("Excellent") || health.includes("Good")) {
        color = "bg-green-500";
        icon = "🌿";
    } else if (health.includes("Stress") || health.includes("Moderate")) {
        color = "bg-yellow-500";
        icon = "⚠️";
    } else if (health.includes("Critical") || health.includes("Loss")) {
        color = "bg-red-500";
        icon = "🚨";
    }

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 shadow-lg backdrop-blur-md ${color}/20 text-white font-bold animate-in fade-in zoom-in duration-500`}>
            <span className="text-xl">{icon}</span>
            <span className={`tracking-wide text-sm uppercase ${health.includes("Critical") ? "animate-pulse" : ""}`}>{health}</span>
        </div>
    );
};

const SatelliteMonitor = () => {
    const navigate = useNavigate();
    const [center, setCenter] = useState(null);
    const [heatmapData, setHeatmapData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [locationStatus, setLocationStatus] = useState("initializing");
    const [address, setAddress] = useState("");

    // Dynamic Recovery Logic
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // UI Logic States
    const [drawingMode, setDrawingMode] = useState(false);
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [showAgent, setShowAgent] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [agentState, setAgentState] = useState({ step: "START", history: [] });
    const [highlightedZone, setHighlightedZone] = useState(null);
    const [showLocationPin, setShowLocationPin] = useState(false);

    // --- GEOLOCATION: 4-tier fallback (Saved Lands -> Network GPS -> IP -> Last Known -> Failure) ---
    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
            if (res.data?.address) {
                const addr = res.data.address;
                const city = addr.village || addr.town || addr.city || addr.suburb || "Your Farm";
                const state = addr.state || "";
                setAddress(`${city}${state ? ', ' + state : ''}`);
                return `${city}, ${state}`;
            }
        } catch (e) {
            console.warn("Reverse geocode failed:", e);
        }
        return "Detected Farm";
    };

    const detectLocation = async () => {
        // 1. CLEAR STORED LOCATION IMMEDIATELY (User requirement)
        localStorage.removeItem('last_known_location');

        setLocationStatus("detecting");
        console.log("⚙️ Fetching FRESH location (No cache/fallback)...");

        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 // Force fresh reading
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    console.log(`📍 Fresh GPS Success: ${latitude}, ${longitude}`);
                    setCenter([latitude, longitude]);
                    setLocationStatus("gps");
                    setShowLocationPin(true);
                    reverseGeocode(latitude, longitude);
                    navigator.geolocation.getCurrentPosition((pos) => {
                        console.log("Lat:", pos.coords.latitude);
                        console.log("Lng:", pos.coords.longitude);
                        console.log("Accuracy:", pos.coords.accuracy);
                    });
                },

                async (err) => {
                    console.warn(`⚠️ GPS Failed: ${err.message}. Trying immediate IP detection.`);
                    await tryImmediateIP();
                },
                geoOptions
            );
        } else {
            await tryImmediateIP();
        }
    };

    const tryImmediateIP = async () => {
        try {
            const res = await axios.get('https://ipapi.co/json/').catch(() => null);
            if (res?.data?.latitude && res?.data?.longitude) {
                const { latitude, longitude, city, region } = res.data;
                console.log(`🌐 Fresh IP Location: ${city}`);
                setCenter([latitude, longitude]);
                setLocationStatus("ip");
                setShowLocationPin(true);
                setAddress(`${city}, ${region}`);
            } else {
                throw new Error("IP detection failed");
            }
        } catch (ipErr) {
            console.error("❌ Location detection failed after all fresh attempts.");
            setLocationStatus("failed");
        }
    };

    // --- EFFECTS ---
    useEffect(() => {
        detectLocation();
    }, []);

    // Trigger Agent Start
    useEffect(() => {
        if (showAgent && chatHistory.length === 0) {
            handleSendChat("START_SESSION_TRIGGER");
        }
    }, [showAgent]);

    // --- HANDLERS ---

    const handleSendChat = async (overrideMsg) => {
        const msg = overrideMsg || chatInput;
        if (!msg) return;

        if (!overrideMsg) {
            setChatHistory(prev => [...prev, { role: "user", content: msg }]);
            setChatInput("");
        }

        try {
            const currentState = { ...agentState };
            if (msg === "START_SESSION_TRIGGER") currentState.step = "START";

            const context = heatmapData ? {
                disease: "Vegetation Stress (NDVI)",
                confidence: 1.0,
                analysis: heatmapData.analysis
            } : null;

            const res = await axios.post(`${API_URL}/api/feature2/agent/chat`, {
                message: msg === "START_SESSION_TRIGGER" ? "" : msg,
                state: currentState,
                context: context
            });

            const result = res.data;
            setAgentState({ step: result.step, history: result.history, ndvi: currentState.ndvi });
            if (result.response) setChatHistory(prev => [...prev, { role: "agent", content: result.response }]);
        } catch (e) {
            setChatHistory(prev => [...prev, { role: "agent", content: "⚠️ Connection error." }]);
        }
    };

    const fetchRecoveryPlan = async () => {
        setAnalysisLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/feature2/analyze`, {
                disease: "Severe Drought/Vegetation Stress",
                confidence: 0.95
            });
            const data = response.data;

            // Parse nested JSONs for UI
            let parsedPlan = {};
            let parsedSubsidy = { schemes: [] };

            try {
                let rawJson = data.treatment.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedPlan = JSON.parse(rawJson);
            } catch (e) { parsedPlan = { timeline: [] }; }

            try {
                if (data.subsidy && data.subsidy.trim().startsWith('{')) {
                    parsedSubsidy = JSON.parse(data.subsidy);
                }
            } catch (e) { }

            setAnalysisData({ ...data, parsedPlan, parsedSubsidy });

        } catch (e) {
            console.error("Analysis Failed", e);
        } finally {
            setAnalysisLoading(false);
        }
    };

    const fetchNDVI = async () => {
        if (polygonPoints.length < 3) {
            setError("Please complete the farm boundary first (Minimum 3 points).");
            return;
        }
        setLoading(true);
        setError(null);
        setIsRecoveryMode(false);
        setAnalysisData(null);

        try {
            // Ensure we use the freshly detected center if polygon is small
            const lats = polygonPoints.map(p => p[0]);
            const lngs = polygonPoints.map(p => p[1]);
            const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
            const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
            const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

            const payload = {
                lat: centerLat, lng: centerLng,
                bbox: [minLng, minLat, maxLng, maxLat]
            };

            const response = await axios.post(`${API_URL}/api/feature2/ndvi`, payload);
            const data = response.data;

            if (!data || !data.heatmap_points || data.heatmap_points.length === 0) {
                throw new Error("Satellite network returned no data for this boundary.");
            }

            setHeatmapData(data);
            setDrawingMode(false);

            // CHECK RECOVERY MODE TRIGGER
            if (data.average_ndvi < 0.25) {
                setIsRecoveryMode(true);
                fetchRecoveryPlan(); // Auto-fetch dynamic advice
            }

        } catch (error) {
            console.error("NDVI Error:", error);
            setError(error.response?.data?.detail || "Satellite Feed Offline. Check boundary size.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setPolygonPoints([]);
        setHeatmapData(null);
        setDrawingMode(false);
        setError(null);
        setIsRecoveryMode(false);
        setAnalysisData(null);
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-x-hidden">
            <header className={`relative h-16 flex items-center justify-between px-6 z-[10] bg-slate-950/80 backdrop-blur-sm border-b border-white/5`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-2xl">🛰️</span>
                    </div>
                    {address && (
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Monitoring</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                {address}
                            </span>
                        </div>
                    )}
                </div>
                <div>
                    {heatmapData && <StatusBadge health={heatmapData.overall_health} />}
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row relative">
                {/* LEFT PANEL: MAP (Shrinks in Recovery Mode) */}
                <div className={`relative min-h-[50vh] bg-slate-900 group transition-all duration-700 ${isRecoveryMode ? 'lg:w-1/3 border-r border-red-500/20' : 'flex-1'}`}>
                    {!center ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                            {locationStatus === 'failed' ? (
                                <>
                                    <span className="text-3xl">📍</span>
                                    <p className="text-sm text-red-400 font-bold">Location Detection Blocked</p>
                                    <p className="text-[10px] text-slate-500 max-w-xs text-center">Please enable location access in your browser settings to scan your specific farm area.</p>
                                    <button onClick={detectLocation} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95">🎯 Manual Retry</button>
                                </>
                            ) : (
                                <>
                                    <div className="relative w-12 h-12">
                                        <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
                                        <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <p className="text-xs text-blue-400 font-mono animate-pulse uppercase tracking-[0.2em]">{locationStatus === 'detecting' ? 'Scanning GPS Satellites...' : 'Initializing Map...'}</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <MapContainer
                            key={`${center[0]}-${center[1]}`} // Key forces re-mount on location change
                            center={center}
                            zoom={16}
                            zoomControl={false}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; Esri'
                            />
                            <MapController coords={center} />
                            <DrawController isDrawing={drawingMode} onAddPoint={(pt) => setPolygonPoints(prev => [...prev, pt])} />

                            {polygonPoints.length > 0 && <Polygon positions={polygonPoints} pathOptions={{ color: '#06b6d4', weight: 3 }} />}

                            {showLocationPin && (
                                <Marker position={center}>
                                    <Popup minWidth={90}>
                                        <div className="text-center font-bold">You are here 📍</div>
                                    </Popup>
                                </Marker>
                            )}

                            {heatmapData?.heatmap_points.map((pt, idx) => (
                                <Circle key={idx} center={[pt.lat, pt.lng]} radius={12} pathOptions={{ fillColor: pt.value < 0.25 ? "#ef4444" : pt.value < 0.50 ? "#eab308" : "#22c55e", color: "transparent", fillOpacity: 0.6 }} />
                            ))}
                            {/* Zone Grid Rectangles */}
                            {heatmapData?.zones?.map((zone) => (
                                zone.bounds && zone.ndvi_avg !== null && (
                                    <Rectangle
                                        key={zone.zone_id}
                                        bounds={zone.bounds}
                                        pathOptions={{
                                            color: highlightedZone?.zone_id === zone.zone_id ? '#ffffff' : zone.color,
                                            weight: highlightedZone?.zone_id === zone.zone_id ? 3 : 1,
                                            fillColor: zone.color,
                                            fillOpacity: highlightedZone?.zone_id === zone.zone_id ? 0.45 : 0.15,
                                            dashArray: highlightedZone?.zone_id === zone.zone_id ? null : '4 4',
                                        }}
                                    >
                                        <Tooltip permanent={highlightedZone?.zone_id === zone.zone_id} direction="center" className="zone-tooltip">
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: zone.color }}>
                                                {zone.label}: {zone.ndvi_avg?.toFixed(2)}
                                            </span>
                                        </Tooltip>
                                    </Rectangle>
                                )
                            ))}
                        </MapContainer>
                    )}

                    {/* Controls Overlay */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4 z-[900]">
                        {!drawingMode && polygonPoints.length === 0 && !heatmapData && (
                            <button onClick={() => setDrawingMode(true)} className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl font-bold text-lg">📍 Mark My Farm</button>
                        )}
                        {drawingMode && (
                            <div className="flex gap-3">
                                <button onClick={fetchNDVI} disabled={polygonPoints.length < 3} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold">📡 Scan Now</button>
                                <button onClick={() => { setDrawingMode(false); setPolygonPoints([]); }} className="px-6 py-3 bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-white/10">Cancel</button>
                            </div>
                        )}
                        {heatmapData && (
                            <button onClick={handleReset} className="px-6 py-3 bg-slate-800/80 backdrop-blur hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl border border-white/20 font-bold shadow-lg">🔄 New Scan</button>
                        )}
                    </div>

                    {/* Location Status Badge + Re-center */}
                    <div className="absolute top-4 left-4 z-[900] flex flex-col gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md text-[10px] font-bold uppercase tracking-wider shadow-lg border
                            ${locationStatus === 'gps' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                locationStatus === 'ip' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    locationStatus === 'detecting' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse' :
                                        'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${locationStatus === 'gps' ? 'bg-green-400' : locationStatus === 'ip' ? 'bg-blue-400' : locationStatus === 'detecting' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`} />
                            {locationStatus === 'gps' ? '📍 GPS' : locationStatus === 'ip' ? '🌐 IP Location' : locationStatus === 'detecting' ? '🔍 Detecting...' : locationStatus === 'failed' ? '❌ Failed' : '📍 Location'}
                        </div>

                        {(locationStatus === 'ip' || locationStatus === 'failed') && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    detectLocation();
                                }}
                                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-[10px] font-bold uppercase border border-slate-200 dark:border-white/10 flex items-center gap-1.5 transition-all shadow-lg"
                                title="Try Precise GPS"
                            >
                                🎯 Precise GPS
                            </button>
                        )}
                        {locationStatus !== 'detecting' && (
                            <button
                                onClick={detectLocation}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 backdrop-blur-md text-[10px] text-slate-700 dark:text-slate-300 hover:text-white border border-slate-200 dark:border-white/10 hover:border-white/20 transition-all shadow-lg font-bold"
                            >
                                🎯 Re-center
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: DYNAMIC DASHBOARD */}
                {(heatmapData || error) && (
                    <div className={`bg-slate-900 border-l border-white/10 p-6 overflow-y-auto z-40 shadow-2xl transition-all duration-700 ${isRecoveryMode ? 'lg:w-2/3 bg-gradient-to-br from-red-950/30 to-slate-950' : 'lg:w-[480px]'}`}>

                        {error && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm font-medium">❌ {error}</div>}

                        {/* RECOVERY MODE UI */}
                        {isRecoveryMode && analysisData ? (
                            <div className="animate-in slide-in-from-right duration-700">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1 flex items-center gap-3">
                                    <span className="text-red-500">Recovery</span> Protocol
                                </h2>
                                <p className="text-red-400/60 font-mono text-sm mb-6">CRITICAL CROP CONDITION DETECTED • IMMEDIATE ACTION REQUIRED</p>

                                {/* Decision Intelligence Engine in Recovery Mode */}
                                <div className="mb-6 bg-black/20 rounded-2xl p-4 border border-red-500/10">
                                    <DecisionIntelligencePanel
                                        ndviValue={heatmapData?.average_ndvi || 0}
                                        health={heatmapData?.overall_health || "Critical"}
                                        heatmapData={heatmapData}
                                        apiUrl={API_URL}
                                        onZoneHover={setHighlightedZone}
                                        center={{ lat: center[0], lng: center[1] }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* COL 1: WHAT HAPPENED */}
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                                            <h3 className="text-red-400 font-bold uppercase text-xs tracking-wider mb-2">Diagnosis</h3>
                                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{analysisData.analysis}</p>
                                        </div>

                                        {/* AI Chat Bot - Recovery Mode */}
                                        <button
                                            onClick={() => setShowAgent(true)}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
                                                <div className="text-left">
                                                    <div className="font-bold text-sm">Ask AI Agronomist</div>
                                                    <div className="text-xs text-blue-200">Chat about this diagnosis</div>
                                                </div>
                                            </div>
                                            <span className="text-blue-200 group-hover:translate-x-1 transition-transform">→</span>
                                        </button>
                                        {/* Dynamic Experts (Reusing Static List) */}
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-blue-500/20">
                                            <h3 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-3">Expert Consultation</h3>
                                            <div className="space-y-2">
                                                {STATIC_AGRONOMISTS.slice(0, 2).map((exp, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-white/5">
                                                        <span className="text-xs font-bold">{exp.name}</span>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                const btn = e.currentTarget;
                                                                const originalContent = btn.innerHTML;
                                                                btn.disabled = true;
                                                                btn.innerHTML = '⏳ calling...';

                                                                try {
                                                                    const res = await fetch(`${API_URL}/api/feature3/consultation-call?to_number=${encodeURIComponent(exp.phone)}`, { method: 'POST' });
                                                                    const data = await res.json();
                                                                    if (data.status === 'called') alert(`Twilio Call Initiated to ${exp.name}.`);
                                                                    else if (data.status === 'mock_called') alert(`[Demo Mode] Consultation request sent.`);
                                                                    else alert("Call failed: " + (data.error || "Unknown error"));
                                                                } catch (e) {
                                                                    alert("Failed to connect to Twilio service.");
                                                                } finally {
                                                                    btn.disabled = false;
                                                                    btn.innerHTML = originalContent;
                                                                }
                                                            }}
                                                            className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600 hover:text-white transition-all font-bold border border-blue-500/20 uppercase"
                                                        >
                                                            Twilio Call
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* COL 2: WHAT TO DO NEXT */}
                                    <div className="bg-slate-950/30 p-5 rounded-3xl border border-yellow-500/20 md:col-span-1">
                                        <h3 className="text-yellow-500 font-bold uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span> Recovery Steps
                                        </h3>
                                        {analysisData.parsedPlan?.timeline ? (
                                            <div className="space-y-4 relative pl-4 border-l border-yellow-500/20">
                                                {analysisData.parsedPlan.timeline.slice(0, 4).map((step, i) => (
                                                    <div key={i} className="relative group">
                                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-yellow-500 shadow-lg"></div>
                                                        <span className="text-[10px] text-yellow-500/70 font-mono uppercase block mb-1">{step.day}</span>
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">{step.title}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{step.task}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <div className="text-sm text-slate-500 italic">Generating plan...</div>}
                                    </div>

                                    {/* COL 3: FINANCIAL SUPPORT */}
                                    <div className="space-y-4">
                                        <h3 className="text-green-500 font-bold uppercase text-sm tracking-widest mb-1">Financial Aid</h3>
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                            {analysisData.parsedSubsidy?.schemes?.length > 0 ? (
                                                analysisData.parsedSubsidy.schemes.map((scheme, idx) => (
                                                    <div key={idx} className="bg-green-900/10 p-4 rounded-2xl border border-green-500/20 hover:border-green-500/40 transition-all group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h5 className="font-bold text-green-100 text-sm leading-tight">{scheme.name}</h5>
                                                            {scheme.priority && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">{scheme.priority}</span>}
                                                        </div>
                                                        <p className="text-[10px] text-green-100/60 mb-3 line-clamp-3">{scheme.details}</p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    // Calculate generic loss % based on NDVI for auto-fill
                                                                    // Assuming healthy threshold 0.6. 
                                                                    // If ndvi=0.3, loss = (0.6-0.3)/0.6 = 50%
                                                                    const ndvi = heatmapData?.average_ndvi || 0;
                                                                    const loss = ndvi < 0.6 ? Math.round(((0.6 - ndvi) / 0.6) * 100) : 0;

                                                                    navigate('/apply-claim', {
                                                                        state: {
                                                                            ndviData: {
                                                                                ndvi: ndvi,
                                                                                lossPercentage: loss,
                                                                                image: heatmapData?.image // Pass the satellite image URL/Base64
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2">
                                                                <span>📄</span> Apply for Claim
                                                            </button>
                                                            {scheme.website_url && (
                                                                <a href={scheme.website_url} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white rounded-lg border border-slate-200 dark:border-white/10">
                                                                    <ExternalLink size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center p-8 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                                                    <p className="text-xs text-slate-500 animate-pulse">Finding Schemes...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* STANDARD DASHBOARD (For Healthy/Good Stats) */
                            !isRecoveryMode && heatmapData && (
                                <div className="space-y-5 animate-in fade-in">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">Crop Health Report <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">Intelligence v2.0</span></h2>

                                    {/* Decision Intelligence Engine Panel */}
                                    <DecisionIntelligencePanel
                                        ndviValue={heatmapData.average_ndvi}
                                        health={heatmapData.overall_health}
                                        heatmapData={heatmapData}
                                        apiUrl={API_URL}
                                        onZoneHover={setHighlightedZone}
                                        center={{ lat: center[0], lng: center[1] }}
                                    />

                                    {/* Original Analysis Card (kept) */}
                                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-5">
                                        <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold uppercase text-xs tracking-wider">🤖 Satellite Analysis</div>
                                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{heatmapData.analysis}</p>
                                    </div>
                                    <button onClick={() => setShowAgent(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white p-4 rounded-2xl border border-slate-200 dark:border-white/5 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">💬</div>
                                            <div className="text-left"><div className="font-bold text-sm">Ask AI Agronomist</div></div>
                                        </div>
                                        <span className="text-slate-500 group-hover:translate-x-1">→</span>
                                    </button>
                                </div>
                            )
                        )}

                        {/* Loading State for Recovery Mode */}
                        {isRecoveryMode && analysisLoading && (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-red-400 font-mono text-sm animate-pulse">GENERATING RECOVERY PROTOCOL...</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* CHAT MODAL Component (Standard) */}
            {showAgent && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-[80vh] sm:h-[600px] sm:rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
                        {/* Header */}
                        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="bg-green-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">AI</span>
                                Agronomist Assistant
                            </h3>
                            <button onClick={() => setShowAgent(false)} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors">✕</button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/50">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                        }`}>
                                        <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>') }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-800 border-t border-slate-700">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    placeholder="Ask for advice..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                                />
                                <button
                                    onClick={() => handleSendChat()}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl font-bold transition-all active:scale-95"
                                >
                                    ➤
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SatelliteMonitor;
