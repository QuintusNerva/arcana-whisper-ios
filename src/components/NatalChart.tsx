import React from 'react';
import { BottomNav } from './BottomNav';
import {
    getBirthData, saveBirthData, getNatalTriad, getPlacementMeaning, BirthData, ZODIAC_SIGNS,
} from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import { searchPlaces, resolvePlace, PlaceSuggestion } from '../services/geocoding.service';

interface NatalChartProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

export function NatalChart({ onClose, onTabChange }: NatalChartProps) {
    const [birthData, setBirthData] = React.useState<BirthData | null>(getBirthData);
    const [birthday, setBirthday] = React.useState(birthData?.birthday || '');
    const [birthTime, setBirthTime] = React.useState(birthData?.birthTime || '');
    const [location, setLocation] = React.useState(birthData?.location || '');
    const [utcOffset, setUtcOffset] = React.useState<number>(birthData?.utcOffset ?? 0);
    const [latitude, setLatitude] = React.useState<number | undefined>(birthData?.latitude);
    const [longitude, setLongitude] = React.useState<number | undefined>(birthData?.longitude);
    const [cityQuery, setCityQuery] = React.useState('');
    const [citySuggestions, setCitySuggestions] = React.useState<PlaceSuggestion[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = React.useState(false);
    const [resolving, setResolving] = React.useState(false);
    const [editing, setEditing] = React.useState(!birthData);
    const [saved, setSaved] = React.useState(false);
    const [selectedPlacement, setSelectedPlacement] = React.useState<{ position: 'sun' | 'moon' | 'rising'; sign: typeof ZODIAC_SIGNS[number]; icon: string } | null>(null);
    const [aiMeaning, setAiMeaning] = React.useState<{ title: string; overview: string; strengths: string; challenges: string; advice: string } | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [aiError, setAiError] = React.useState<string | null>(null);
    const aiCacheRef = React.useRef<Record<string, any>>({});
    const [showCosmicModal, setShowCosmicModal] = React.useState(false);
    const [cosmicSynthesis, setCosmicSynthesis] = React.useState<string | null>(null);
    const [cosmicLoading, setCosmicLoading] = React.useState(false);
    const cityDropdownRef = React.useRef<HTMLDivElement>(null);
    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close city dropdown on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
                setShowCitySuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCitySearch = (query: string) => {
        setCityQuery(query);
        setLocation(query);
        // Clear previous coordinates when typing a new query
        setLatitude(undefined);
        setLongitude(undefined);

        // Debounce the API call
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (query.length < 2) {
            setCitySuggestions([]);
            setShowCitySuggestions(false);
            return;
        }
        searchTimeoutRef.current = setTimeout(async () => {
            const results = await searchPlaces(query);
            setCitySuggestions(results);
            setShowCitySuggestions(results.length > 0);
        }, 300);
    };

    const handleCitySelect = async (place: PlaceSuggestion) => {
        setShowCitySuggestions(false);
        setCityQuery(place.description);
        setLocation(place.description);
        setResolving(true);

        const resolved = await resolvePlace(place, birthday, birthTime || undefined);
        setResolving(false);

        if (resolved) {
            setLatitude(resolved.latitude);
            setLongitude(resolved.longitude);
            setUtcOffset(resolved.utcOffset);
        }
    };

    const handleCardTap = async (position: 'sun' | 'moon' | 'rising', sign: typeof ZODIAC_SIGNS[number], icon: string) => {
        setSelectedPlacement({ position, sign, icon });
        setAiMeaning(null);
        setAiError(null);

        // Check cache first
        const cacheKey = `${position}_${sign.id}`;
        if (aiCacheRef.current[cacheKey]) {
            setAiMeaning(aiCacheRef.current[cacheKey]);
            return;
        }

        // Fetch AI interpretation
        const ai = new AIService();
        if (!ai.hasApiKey()) {
            // No API key — use static fallback silently
            return;
        }

        setAiLoading(true);
        try {
            const triadContext = triad ? {
                sun: triad.sun.name,
                moon: triad.moon.name,
                rising: triad.rising.name,
            } : undefined;

            const result = await ai.getPlacementInsight(position, sign, triadContext);
            aiCacheRef.current[cacheKey] = result;
            setAiMeaning(result);
        } catch (err: any) {
            setAiError(err.message || 'Could not generate insight');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = () => {
        if (!birthday) return;
        const data: BirthData = {
            birthday,
            birthTime: birthTime || undefined,
            location: location || undefined,
            utcOffset,
            latitude,
            longitude,
        };
        saveBirthData(data);
        setBirthData(data);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const triad = birthData ? getNatalTriad(birthData) : null;

    // Accuracy indicators
    const hasBirthTime = !!birthData?.birthTime;
    const hasCoordinates = birthData?.latitude !== undefined && birthData?.longitude !== undefined;
    const moonAccuracy = hasBirthTime ? 'precise' : 'approximate';
    const risingAccuracy = hasBirthTime && hasCoordinates ? 'precise' : hasCoordinates ? 'needs-time' : 'approximate';

    const ELEMENT_COLORS: Record<string, string> = {
        Fire: 'from-red-500/20 to-orange-500/20 border-red-500/30',
        Earth: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        Air: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
        Water: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
    };

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">← Altar</button>
                        <h1 className="font-display text-lg text-altar-gold tracking-[4px]">NATAL CHART</h1>
                        <div className="w-12" />
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Hero */}
                    <div className="text-center mt-6 mb-6 animate-fade-up">
                        <div className="text-4xl mb-2">🌙</div>
                        <h2 className="font-display text-xl text-altar-gold tracking-[3px]">YOUR COSMIC BLUEPRINT</h2>
                        <p className="text-sm text-altar-muted mt-2">Discover your celestial triad</p>
                    </div>

                    {/* Birth Data Form */}
                    {editing ? (
                        <div className="glass-strong rounded-2xl p-5 mb-5 animate-fade-up">
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-4">Birth Data</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] text-altar-muted font-display tracking-[2px] uppercase mb-1">Birthday *</label>
                                    <input
                                        type="date"
                                        value={birthday}
                                        onChange={e => setBirthday(e.target.value)}
                                        className="w-full bg-altar-deep/50 text-sm text-altar-text rounded-lg px-3 py-2.5 border border-white/10 focus:border-altar-gold/30 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-altar-muted font-display tracking-[2px] uppercase mb-1">Birth Time (optional)</label>
                                    <input
                                        type="time"
                                        value={birthTime}
                                        onChange={e => setBirthTime(e.target.value)}
                                        className="w-full bg-altar-deep/50 text-sm text-altar-text rounded-lg px-3 py-2.5 border border-white/10 focus:border-altar-gold/30 focus:outline-none transition-colors"
                                    />
                                    <p className="text-[10px] text-altar-muted/60 mt-1 italic">Needed for accurate Rising sign</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-altar-muted font-display tracking-[2px] uppercase mb-1">Birth Location</label>
                                    <div className="relative" ref={cityDropdownRef}>
                                        <input
                                            type="text"
                                            value={cityQuery || location}
                                            onChange={e => handleCitySearch(e.target.value)}
                                            onFocus={() => { if (citySuggestions.length > 0) setShowCitySuggestions(true); }}
                                            placeholder="Search any city worldwide..."
                                            className="w-full bg-altar-deep/50 text-sm text-altar-text placeholder-altar-muted/50 rounded-lg px-3 py-2.5 border border-white/10 focus:border-altar-gold/30 focus:outline-none transition-colors"
                                        />
                                        {/* Google Places dropdown */}
                                        {showCitySuggestions && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-altar-dark/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-30 max-h-48 overflow-y-auto shadow-2xl">
                                                {citySuggestions.map((place, i) => (
                                                    <button
                                                        key={place.placeId}
                                                        onClick={() => handleCitySelect(place)}
                                                        className="w-full text-left px-3 py-2.5 text-xs text-altar-text hover:bg-altar-gold/10 transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        <span className="font-medium">{place.mainText}</span>
                                                        {place.secondaryText && <span className="text-altar-muted ml-1">{place.secondaryText}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {resolving && (
                                        <p className="text-[10px] text-altar-gold/60 mt-1 animate-pulse">✦ Resolving coordinates & timezone...</p>
                                    )}
                                    {!resolving && latitude !== undefined && (
                                        <p className="text-[10px] text-green-400/60 mt-1">✓ {latitude.toFixed(2)}°{latitude >= 0 ? 'N' : 'S'} {Math.abs(longitude!).toFixed(2)}°{longitude! >= 0 ? 'E' : 'W'} · UTC{utcOffset >= 0 ? '+' : ''}{utcOffset}</p>
                                    )}
                                    <p className="text-[10px] text-altar-muted/60 mt-1 italic">Needed for accurate Moon & Rising signs</p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {birthData && (
                                        <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-lg glass text-xs text-altar-muted font-display border border-white/5 hover:border-white/15 transition-colors">Cancel</button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={!birthday}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-display transition-all ${birthday ? 'bg-altar-gold/15 text-altar-gold border border-altar-gold/20 hover:border-altar-gold/40' : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'}`}
                                    >
                                        ✦ Calculate Chart
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setEditing(true)} className="w-full mb-4 text-xs text-altar-gold/70 font-display hover:text-altar-gold transition-colors text-right">
                            Edit birth data →
                        </button>
                    )}
                    {saved && <p className="text-xs text-green-400 text-center mb-3 animate-fade-up">✓ Birth data saved</p>}

                    {/* Natal Triad Display */}
                    {triad && (
                        <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                            {/* Triad Orbs — tappable */}
                            <div className="grid grid-cols-3 gap-3">
                                {([
                                    { label: 'Sun', position: 'sun' as const, data: triad.sun, icon: '☀️', desc: 'Your core identity' },
                                    { label: 'Moon', position: 'moon' as const, data: triad.moon, icon: '🌙', desc: 'Your emotional self' },
                                    { label: 'Rising', position: 'rising' as const, data: triad.rising, icon: '⬆️', desc: 'How others see you' },
                                ]).map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => handleCardTap(item.position, item.data, item.icon)}
                                        className={`rounded-2xl p-4 text-center border bg-gradient-to-br ${ELEMENT_COLORS[item.data.element] || ''} transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer`}
                                    >
                                        <span className="text-2xl block mb-1">{item.icon}</span>
                                        <p className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase mb-1">{item.label}</p>
                                        <p className="text-3xl mb-1">{item.data.glyph}</p>
                                        <p className="font-display text-sm text-altar-gold font-semibold">{item.data.name}</p>
                                        <p className="text-[9px] text-altar-muted mt-1">{item.desc}</p>
                                        {/* Accuracy indicator */}
                                        {item.position === 'moon' && moonAccuracy === 'approximate' && (
                                            <p className="text-[7px] text-amber-400/50 mt-1 font-display">~approx</p>
                                        )}
                                        {item.position === 'rising' && risingAccuracy !== 'precise' && (
                                            <p className="text-[7px] text-amber-400/50 mt-1 font-display">
                                                {risingAccuracy === 'needs-time' ? 'needs birth time' : '~approx'}
                                            </p>
                                        )}
                                        <p className="text-[8px] text-altar-gold/40 mt-1 font-display">Tap to explore ✦</p>
                                    </button>
                                ))}
                            </div>

                            {/* Element & Ruling Planet — tappable */}
                            <button
                                onClick={async () => {
                                    setShowCosmicModal(true);
                                    if (cosmicSynthesis || cosmicLoading) return;
                                    const ai = new AIService();
                                    if (!ai.hasApiKey()) return;
                                    setCosmicLoading(true);
                                    try {
                                        const result = await ai.getCosmicSynthesis(triad);
                                        setCosmicSynthesis(result);
                                    } catch (err: any) {
                                        setCosmicSynthesis(null);
                                    } finally {
                                        setCosmicLoading(false);
                                    }
                                }}
                                className="w-full text-left glass rounded-2xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-white/5 hover:border-white/10"
                            >
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3">Cosmic Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between py-1.5 border-b border-white/5">
                                        <span className="text-xs text-altar-muted">Sun Element</span>
                                        <span className="text-xs text-altar-text">{triad.sun.element}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-white/5">
                                        <span className="text-xs text-altar-muted">Ruling Planet</span>
                                        <span className="text-xs text-altar-text">{triad.sun.ruling}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-white/5">
                                        <span className="text-xs text-altar-muted">Moon Element</span>
                                        <span className="text-xs text-altar-text">{triad.moon.element}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-xs text-altar-muted">Rising Element</span>
                                        <span className="text-xs text-altar-text">{triad.rising.element}</span>
                                    </div>
                                </div>
                                <p className="text-[8px] text-altar-gold/40 mt-3 font-display text-center">Tap for chart synthesis ✦</p>
                            </button>

                            {/* Suggested Spreads */}
                            <div className="glass rounded-2xl p-4">
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3">✦ Suggested Spreads</h3>
                                <p className="text-xs text-altar-text/70 mb-3">Based on your {triad.sun.element} Sun and {triad.moon.element} Moon</p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => onTabChange('new')}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-altar-mid/40 to-altar-bright/40 border border-altar-gold/15 text-sm text-altar-gold font-display tracking-wide hover:border-altar-gold/30 transition-all text-left px-4 flex items-center gap-3"
                                    >
                                        <span className="text-xl">🔮</span>
                                        <div>
                                            <p className="font-semibold">3-Card Elemental</p>
                                            <p className="text-[10px] text-altar-muted">Past · Present · Future through your {triad.sun.element} lens</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => onTabChange('new')}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-altar-mid/40 to-altar-bright/40 border border-altar-gold/15 text-sm text-altar-gold font-display tracking-wide hover:border-altar-gold/30 transition-all text-left px-4 flex items-center gap-3"
                                    >
                                        <span className="text-xl">💫</span>
                                        <div>
                                            <p className="font-semibold">Moon Guidance</p>
                                            <p className="text-[10px] text-altar-muted">Single card attuned to your {triad.moon.name} Moon</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab="home" onTabChange={onTabChange} />

            {/* ── Cosmic Synthesis Modal ── */}
            {
                showCosmicModal && triad && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowCosmicModal(false)}>
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <div
                            className="relative w-full max-w-[500px] max-h-[85vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-altar-dark to-altar-deep border border-white/10 p-6 pb-8 animate-fade-up"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

                            <div className="text-center mb-5">
                                <span className="text-3xl block mb-2">🌌</span>
                                <h3 className="font-display text-xl text-altar-gold tracking-[3px]">COSMIC BLUEPRINT</h3>
                                <p className="text-xs text-altar-muted mt-1">How your elements &amp; planets interact</p>
                            </div>

                            {/* Element Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[
                                    { label: 'Sun', sign: triad.sun },
                                    { label: 'Moon', sign: triad.moon },
                                    { label: 'Rising', sign: triad.rising },
                                ].map(item => (
                                    <div key={item.label} className="rounded-xl p-3 bg-white/5 border border-white/5 text-center">
                                        <p className="text-[8px] text-altar-muted font-display tracking-[2px] uppercase">{item.label}</p>
                                        <p className="text-sm text-altar-text font-display mt-1">{item.sign.element}</p>
                                        <p className="text-[10px] text-altar-muted mt-0.5">{item.sign.ruling}</p>
                                    </div>
                                ))}
                            </div>

                            {/* AI Synthesis */}
                            <div className={`glass rounded-2xl p-4 mb-4`}>
                                {cosmicLoading ? (
                                    <div className="space-y-2.5 py-1">
                                        <div className="h-3 shimmer-skeleton w-full" />
                                        <div className="h-3 shimmer-skeleton w-[90%]" />
                                        <div className="h-3 shimmer-skeleton w-[78%]" />
                                        <div className="h-3 shimmer-skeleton w-[60%]" />
                                    </div>
                                ) : cosmicSynthesis ? (
                                    <>
                                        <p className="text-[9px] font-display text-altar-gold/60 tracking-[2px] uppercase mb-2">✦ Cosmic Chart Synthesis</p>
                                        <AIResponseRenderer text={cosmicSynthesis} />
                                    </>
                                ) : (
                                    <p className="text-xs text-altar-muted text-center py-2">No API key configured — add one in Settings for cosmic synthesis</p>
                                )}
                            </div>

                            <button
                                onClick={() => setShowCosmicModal(false)}
                                className="w-full py-3 rounded-xl glass border border-white/10 text-sm text-altar-muted font-display tracking-wide hover:border-white/20 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

            {/* ── Placement Meaning Modal ── */}
            {
                selectedPlacement && (() => {
                    const staticMeaning = getPlacementMeaning(selectedPlacement.position, selectedPlacement.sign.id);
                    const meaning = aiMeaning || staticMeaning;
                    const positionLabel = selectedPlacement.position === 'sun' ? 'Sun' : selectedPlacement.position === 'moon' ? 'Moon' : 'Rising';
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => { setSelectedPlacement(null); setAiMeaning(null); setAiError(null); }}>
                            {/* Backdrop */}
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                            {/* Modal */}
                            <div
                                className="relative w-full max-w-[500px] max-h-[85vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-altar-dark to-altar-deep border border-white/10 p-6 pb-8 animate-fade-up"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Handle */}
                                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

                                {/* AI indicator */}
                                {(aiLoading || aiMeaning) && (
                                    <div className="flex items-center justify-center gap-1.5 mb-3">
                                        <span className="text-[9px] font-display tracking-[2px] uppercase text-altar-gold/50">
                                            {aiLoading ? '✦ Channeling the stars…' : '✦ Mystic Interpretation'}
                                        </span>
                                        {aiLoading && <span className="inline-block w-3 h-3 border-2 border-altar-gold/30 border-t-altar-gold rounded-full animate-spin" />}
                                    </div>
                                )}

                                {/* Sign Header */}
                                <div className="text-center mb-5">
                                    <span className="text-4xl block mb-2">{selectedPlacement.icon}</span>
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <span className="text-3xl">{selectedPlacement.sign.glyph}</span>
                                    </div>
                                    <h3 className="font-display text-xl text-altar-gold tracking-[3px]">
                                        {selectedPlacement.sign.name} {positionLabel}
                                    </h3>
                                    <p className="text-xs text-altar-muted mt-1">{selectedPlacement.sign.element} · {selectedPlacement.sign.ruling}</p>
                                </div>

                                {/* Title */}
                                <div className="text-center mb-5">
                                    {aiLoading ? (
                                        <span className="inline-block w-40 h-8 shimmer-skeleton" />
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-altar-gold/10 border border-altar-gold/20 text-sm text-altar-gold font-display tracking-wide animate-fade-up">
                                            ✦ {meaning.title} ✦
                                        </span>
                                    )}
                                </div>

                                {/* Overview */}
                                <div className="glass rounded-2xl p-4 mb-4">
                                    {aiLoading ? (
                                        <div className="space-y-2.5">
                                            <div className="h-3 shimmer-skeleton w-full" />
                                            <div className="h-3 shimmer-skeleton w-[90%]" />
                                            <div className="h-3 shimmer-skeleton w-[75%]" />
                                            <div className="h-3 shimmer-skeleton w-[60%]" />
                                        </div>
                                    ) : (
                                        <AIResponseRenderer text={meaning.overview} />
                                    )}
                                </div>

                                {/* Strengths & Challenges */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="rounded-xl p-3 bg-green-500/5 border border-green-500/15">
                                        <p className="text-[9px] font-display text-green-400/70 tracking-[2px] uppercase mb-1.5">Strengths</p>
                                        {aiLoading ? (
                                            <div className="space-y-2">
                                                <div className="h-2.5 shimmer-skeleton w-full" />
                                                <div className="h-2.5 shimmer-skeleton w-[70%]" />
                                            </div>
                                        ) : (
                                            <ul className="space-y-1 overflow-hidden animate-fade-up">
                                                {meaning.strengths.split(',').map((s: string, i: number) => (
                                                    <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                        <span className="text-green-400/50 shrink-0">·</span>
                                                        <span className="break-words">{s.trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="rounded-xl p-3 bg-red-500/5 border border-red-500/15">
                                        <p className="text-[9px] font-display text-red-400/70 tracking-[2px] uppercase mb-1.5">Challenges</p>
                                        {aiLoading ? (
                                            <div className="space-y-2">
                                                <div className="h-2.5 shimmer-skeleton w-full" />
                                                <div className="h-2.5 shimmer-skeleton w-[65%]" />
                                            </div>
                                        ) : (
                                            <ul className="space-y-1 overflow-hidden animate-fade-up">
                                                {meaning.challenges.split(',').map((s: string, i: number) => (
                                                    <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                        <span className="text-red-400/50 shrink-0">·</span>
                                                        <span className="break-words">{s.trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Advice */}
                                <div className="rounded-2xl p-4 bg-altar-gold/5 border border-altar-gold/15">
                                    <p className="text-[9px] font-display text-altar-gold/70 tracking-[2px] uppercase mb-1.5">✦ Cosmic Advice</p>
                                    {aiLoading ? (
                                        <div className="space-y-2">
                                            <div className="h-3 shimmer-skeleton w-[85%]" />
                                            <div className="h-3 shimmer-skeleton w-[50%]" />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-altar-text/85 leading-relaxed italic animate-fade-up">"{meaning.advice}"</p>
                                    )}
                                </div>

                                {/* AI Error */}
                                {aiError && (
                                    <p className="text-[10px] text-red-400/60 text-center mt-3">{aiError}</p>
                                )}

                                {/* Close */}
                                <button
                                    onClick={() => { setSelectedPlacement(null); setAiMeaning(null); setAiError(null); }}
                                    className="w-full mt-5 py-3 rounded-xl glass border border-white/10 text-sm text-altar-muted font-display tracking-wide hover:border-white/20 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    );
                })()
            }
        </div>
    );
}
