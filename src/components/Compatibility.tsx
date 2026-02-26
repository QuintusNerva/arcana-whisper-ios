import { safeStorage } from "../services/storage.service";
import React from 'react';
import { BottomNav } from './BottomNav';
import {
    getBirthData, getSunSign, getCoupleCompatibility, ZODIAC_SIGNS,
    CoupleReport, SignMatch, getSynastryChart, SynastryReport, SynastryAspect,
    BirthData,
} from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import { SynastryWheel } from './SynastryWheel';
import { AspectCard, AspectListItem } from './AspectCard';
import { searchPlaces, resolvePlace, PlaceSuggestion } from '../services/geocoding.service';

interface CompatibilityProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

const QUALITY_COLORS: Record<string, string> = {
    perfect: 'text-green-400',
    great: 'text-emerald-400',
    good: 'text-blue-400',
    neutral: 'text-altar-muted',
    challenging: 'text-amber-400',
};

const QUALITY_LABELS: Record<string, string> = {
    perfect: '✦ Perfect',
    great: '♡ Great',
    good: '◇ Good',
    neutral: '○ Neutral',
    challenging: '△ Growth',
};

const ELEMENT_ICONS: Record<string, { emoji: string; color: string }> = {
    fire: { emoji: '🔥', color: 'from-orange-500/20 to-red-500/20 border-orange-500/30' },
    earth: { emoji: '🌿', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
    air: { emoji: '💨', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30' },
    water: { emoji: '🌊', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
};

// ── Sub-tab IDs ──
type SubTab = 'overview' | 'synastry' | 'deepdive';

const SUB_TABS: { id: SubTab; label: string; emoji: string }[] = [
    { id: 'overview', label: 'Overview', emoji: '✦' },
    { id: 'synastry', label: 'Synastry', emoji: '◎' },
    { id: 'deepdive', label: 'Deep Dive', emoji: '🔮' },
];

// ── Reused sub-components ──

function ScoreRing({ score, tier }: { score: number; tier: string }) {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;
    const [animated, setAnimated] = React.useState(false);

    React.useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 300);
        return () => clearTimeout(t);
    }, []);

    const scoreColor = score >= 85 ? '#FFD700' : score >= 72 ? '#4ade80' : score >= 60 ? '#60a5fa' : score >= 45 ? '#c084fc' : '#f59e0b';

    return (
        <div className="relative inline-flex flex-col items-center">
            <svg width="140" height="140" className="transform -rotate-90">
                <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                    cx="70" cy="70" r="54" fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={animated ? offset : circumference}
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 8px ${scoreColor}60)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold" style={{ color: scoreColor }}>{animated ? score : 0}</span>
                <span className="text-[9px] text-altar-muted font-display tracking-[1px] uppercase">/ 100</span>
            </div>
            <p className="font-display text-sm tracking-[2px] uppercase mt-2" style={{ color: scoreColor }}>{tier}</p>
        </div>
    );
}

function MatchRow({ label, match }: { label: string; match: SignMatch }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-[10px] text-altar-muted font-display tracking-[2px] uppercase w-16">{label}</span>
            <div className="flex items-center gap-3 flex-1 justify-center">
                <div className="text-center">
                    <span className="text-xl block">{match.userSign.glyph}</span>
                    <span className="text-[9px] text-altar-text/70 font-display">{match.userSign.name}</span>
                </div>
                <span className="text-altar-muted/40 text-xs">×</span>
                <div className="text-center">
                    <span className="text-xl block">{match.partnerSign.glyph}</span>
                    <span className="text-[9px] text-altar-text/70 font-display">{match.partnerSign.name}</span>
                </div>
            </div>
            <span className={`text-[10px] font-display tracking-wide ${QUALITY_COLORS[match.quality]}`}>
                {QUALITY_LABELS[match.quality]}
            </span>
        </div>
    );
}

// ── Category header for aspect groups ──
const CATEGORY_META: Record<string, { emoji: string; label: string; color: string }> = {
    chemistry: { emoji: '🔥', label: 'Chemistry & Attraction', color: 'text-rose-400' },
    emotional: { emoji: '🧲', label: 'Emotional Bond', color: 'text-blue-400' },
    friction: { emoji: '⚡', label: 'Friction Points', color: 'text-amber-400' },
    growth: { emoji: '🌱', label: 'Growth Potential', color: 'text-green-400' },
    karmic: { emoji: '🔗', label: 'Karmic Ties', color: 'text-purple-400' },
    communication: { emoji: '💬', label: 'Communication', color: 'text-cyan-400' },
};

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════

export function Compatibility({ onClose, onTabChange }: CompatibilityProps) {
    const birthData = getBirthData();

    // Saved partner data
    const savedPartner = React.useMemo(() => {
        try {
            const raw = safeStorage.getItem('arcana_partner');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }, []);

    const [partnerName, setPartnerName] = React.useState(savedPartner?.name || '');
    const [partnerBirthday, setPartnerBirthday] = React.useState(savedPartner?.birthday || '');
    const [partnerBirthTime, setPartnerBirthTime] = React.useState(savedPartner?.birthTime || '');
    const [partnerBirthLocation, setPartnerBirthLocation] = React.useState(savedPartner?.location || '');
    const [partnerLatitude, setPartnerLatitude] = React.useState<number | undefined>(savedPartner?.latitude);
    const [partnerLongitude, setPartnerLongitude] = React.useState<number | undefined>(savedPartner?.longitude);
    const [partnerUtcOffset, setPartnerUtcOffset] = React.useState<number>(savedPartner?.utcOffset ?? 0);
    const [cityQuery, setCityQuery] = React.useState('');
    const [citySuggestions, setCitySuggestions] = React.useState<PlaceSuggestion[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = React.useState(false);
    const [resolving, setResolving] = React.useState(false);
    const cityDropdownRef = React.useRef<HTMLDivElement>(null);
    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [report, setReport] = React.useState<CoupleReport | null>(null);
    const [synastry, setSynastry] = React.useState<SynastryReport | null>(null);
    const [aiReading, setAiReading] = React.useState<string | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [deepDive, setDeepDive] = React.useState<string | null>(null);
    const [deepDiveLoading, setDeepDiveLoading] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<SubTab>('overview');
    const [selectedAspect, setSelectedAspect] = React.useState<SynastryAspect | null>(null);

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

    // Auto-show results if partner data was saved
    React.useEffect(() => {
        if (savedPartner?.birthday && birthData) {
            const r = getCoupleCompatibility(birthData, savedPartner.birthday);
            setReport(r);
            // Calculate synastry
            const partnerData: BirthData = {
                birthday: savedPartner.birthday,
                birthTime: savedPartner.birthTime,
                location: savedPartner.location,
                latitude: savedPartner.latitude,
                longitude: savedPartner.longitude,
                utcOffset: savedPartner.utcOffset,
            };
            const syn = getSynastryChart(birthData, partnerData, undefined, savedPartner.name || 'Partner');
            setSynastry(syn);
        }
    }, []);

    const handleReveal = () => {
        if (!birthData || !partnerBirthday) return;
        const r = getCoupleCompatibility(birthData, partnerBirthday);
        setReport(r);
        // Save partner data
        safeStorage.setItem('arcana_partner', JSON.stringify({
            name: partnerName.trim(),
            birthday: partnerBirthday,
            birthTime: partnerBirthTime || undefined,
            location: partnerBirthLocation.trim() || undefined,
            latitude: partnerLatitude,
            longitude: partnerLongitude,
            utcOffset: partnerUtcOffset,
        }));
        // Calculate synastry chart
        const partnerData: BirthData = {
            birthday: partnerBirthday,
            birthTime: partnerBirthTime || undefined,
            location: partnerBirthLocation.trim() || undefined,
            latitude: partnerLatitude,
            longitude: partnerLongitude,
            utcOffset: partnerUtcOffset,
        };
        const syn = getSynastryChart(birthData, partnerData, undefined, partnerName.trim() || 'Partner');
        setSynastry(syn);
    };

    // Fire AI reading when report is generated
    React.useEffect(() => {
        if (!report) return;
        const cacheKey = `ai_couple_${report.userTriad.sun.id}_${report.partnerTriad.sun.id}`;
        try {
            const cached = safeStorage.getItem(cacheKey);
            if (cached) { setAiReading(cached); return; }
        } catch { /* */ }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setAiLoading(true);
        let cancelled = false;

        (async () => {
            try {
                const result = await ai.getRelationshipSynthesis(
                    report.userTriad, report.partnerTriad,
                    report.overallScore, report.tier
                );
                if (!cancelled) {
                    const cleaned = result.replace(/^["']|["']$/g, '').trim();
                    setAiReading(cleaned);
                    try { safeStorage.setItem(cacheKey, cleaned); } catch { /* */ }
                }
            } catch { /* fallback to static */ }
            finally { if (!cancelled) setAiLoading(false); }
        })();

        return () => { cancelled = true; };
    }, [report]);

    // Fire deep dive when Deep Dive tab is activated
    React.useEffect(() => {
        if (activeTab !== 'deepdive' || !synastry || !report || deepDive) return;

        const cacheKey = `ai_deepdive_${report.userTriad.sun.id}_${report.partnerTriad.sun.id}`;
        try {
            const cached = safeStorage.getItem(cacheKey);
            if (cached) { setDeepDive(cached); return; }
        } catch { /* */ }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setDeepDiveLoading(true);
        let cancelled = false;

        const aspectData = synastry.aspects.slice(0, 15).map(a => ({
            planet1Name: a.planet1.name,
            planet1Sign: a.planet1.signId.charAt(0).toUpperCase() + a.planet1.signId.slice(1),
            planet2Name: a.planet2.name,
            planet2Sign: a.planet2.signId.charAt(0).toUpperCase() + a.planet2.signId.slice(1),
            type: a.type,
            nature: a.nature,
            category: a.category,
            person1Label: a.person1Label,
            person2Label: a.person2Label,
        }));

        ai.getSynastryDeepDive(
            aspectData,
            { sun: report.userTriad.sun.name, moon: report.userTriad.moon.name, rising: report.userTriad.rising.name },
            { sun: report.partnerTriad.sun.name, moon: report.partnerTriad.moon.name, rising: report.partnerTriad.rising.name },
            partnerName || 'your partner',
        ).then(result => {
            if (!cancelled) {
                const cleaned = result.replace(/^["']|["']$/g, '').trim();
                setDeepDive(cleaned);
                try { safeStorage.setItem(cacheKey, cleaned); } catch { /* */ }
            }
        }).catch(() => { /* */ })
            .finally(() => { if (!cancelled) setDeepDiveLoading(false); });

        return () => { cancelled = true; };
    }, [activeTab, synastry, report]);

    const partnerSign = partnerBirthday ? getSunSign(partnerBirthday) : null;
    const userSign = birthData ? getSunSign(birthData.birthday) : null;

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">← Altar</button>
                        <h1 className="font-display text-lg text-altar-gold tracking-[4px]">RELATIONSHIPS</h1>
                        <div className="w-12" />
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {!report ? (
                        /* ── STEP 1: Partner Input ── */
                        <div className="animate-fade-up">
                            <div className="text-center mt-8 mb-8">
                                <span className="text-5xl block mb-3">💞</span>
                                <h2 className="font-display text-xl text-altar-gold tracking-[3px]">SYNASTRY DEEP DIVE</h2>
                                <p className="text-sm text-altar-muted mt-2">Go beyond compatibility scores. See your real chart overlay.</p>
                            </div>

                            {/* Your sign */}
                            {userSign && (
                                <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-3 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                                    <span className="text-3xl">{userSign.glyph}</span>
                                    <div>
                                        <p className="text-xs text-altar-muted font-display tracking-[2px] uppercase">You</p>
                                        <p className="font-display text-altar-gold">{userSign.name}</p>
                                    </div>
                                </div>
                            )}

                            {/* Partner input */}
                            <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                                <label className="block font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">
                                    Partner's Name
                                </label>
                                <input
                                    type="text"
                                    value={partnerName}
                                    onChange={(e) => setPartnerName(e.target.value)}
                                    placeholder="Their name…"
                                    className="w-full bg-transparent text-altar-text placeholder-altar-muted/50 text-sm focus:outline-none border-b border-altar-gold/20 focus:border-altar-gold/50 transition-colors pb-3 mb-5"
                                />

                                <label className="block font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">
                                    Partner's Birthday
                                </label>
                                <input
                                    type="date"
                                    value={partnerBirthday}
                                    onChange={(e) => setPartnerBirthday(e.target.value)}
                                    className="w-full bg-transparent text-altar-text text-sm focus:outline-none border-b border-altar-gold/20 focus:border-altar-gold/50 transition-colors pb-3 mb-5 [color-scheme:dark]"
                                />

                                <label className="block font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">
                                    Birth Time <span className="text-altar-muted/40">(optional — improves accuracy)</span>
                                </label>
                                <input
                                    type="time"
                                    value={partnerBirthTime}
                                    onChange={(e) => setPartnerBirthTime(e.target.value)}
                                    className="w-full bg-transparent text-altar-text text-sm focus:outline-none border-b border-altar-gold/20 focus:border-altar-gold/50 transition-colors pb-3 mb-5 [color-scheme:dark]"
                                />

                                <label className="block font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">
                                    Place of Birth <span className="text-altar-muted/40">(optional — improves accuracy)</span>
                                </label>
                                <div className="relative" ref={cityDropdownRef}>
                                    <input
                                        type="text"
                                        value={cityQuery || partnerBirthLocation}
                                        onChange={(e) => {
                                            const q = e.target.value;
                                            setCityQuery(q);
                                            setPartnerBirthLocation(q);
                                            setPartnerLatitude(undefined);
                                            setPartnerLongitude(undefined);
                                            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                            if (q.length < 2) { setCitySuggestions([]); setShowCitySuggestions(false); return; }
                                            searchTimeoutRef.current = setTimeout(async () => {
                                                const results = await searchPlaces(q);
                                                setCitySuggestions(results);
                                                setShowCitySuggestions(results.length > 0);
                                            }, 300);
                                        }}
                                        onFocus={() => { if (citySuggestions.length > 0) setShowCitySuggestions(true); }}
                                        placeholder="Search any city worldwide…"
                                        className="w-full bg-transparent text-altar-text placeholder-altar-muted/50 text-sm focus:outline-none border-b border-altar-gold/20 focus:border-altar-gold/50 transition-colors pb-3 [color-scheme:dark]"
                                    />
                                    {showCitySuggestions && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-altar-dark/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-30 max-h-48 overflow-y-auto shadow-2xl">
                                            {citySuggestions.map((place) => (
                                                <button
                                                    key={place.placeId}
                                                    onClick={async () => {
                                                        setShowCitySuggestions(false);
                                                        setCityQuery(place.description);
                                                        setPartnerBirthLocation(place.description);
                                                        setResolving(true);
                                                        const resolved = await resolvePlace(place, partnerBirthday, partnerBirthTime || undefined);
                                                        setResolving(false);
                                                        if (resolved) {
                                                            setPartnerLatitude(resolved.latitude);
                                                            setPartnerLongitude(resolved.longitude);
                                                            setPartnerUtcOffset(resolved.utcOffset);
                                                        }
                                                    }}
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
                                {!resolving && partnerLatitude !== undefined && (
                                    <p className="text-[10px] text-green-400/60 mt-1">✓ {partnerLatitude.toFixed(2)}°{partnerLatitude >= 0 ? 'N' : 'S'} {Math.abs(partnerLongitude!).toFixed(2)}°{partnerLongitude! >= 0 ? 'E' : 'W'} · UTC{partnerUtcOffset >= 0 ? '+' : ''}{partnerUtcOffset}</p>
                                )}
                            </div>

                            {/* Partner sign preview */}
                            {partnerSign && partnerBirthday && (
                                <div className="glass rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-up">
                                    <span className="text-3xl">{partnerSign.glyph}</span>
                                    <div>
                                        <p className="text-xs text-altar-muted font-display tracking-[2px] uppercase">{partnerName || 'Partner'}</p>
                                        <p className="font-display text-altar-gold">{partnerSign.name}</p>
                                    </div>
                                </div>
                            )}

                            {/* Reveal button */}
                            <button
                                onClick={handleReveal}
                                disabled={!partnerBirthday || !birthData}
                                className={`w-full py-4 rounded-2xl font-display font-semibold text-base tracking-wide transition-all duration-300 animate-fade-up ${partnerBirthday && birthData
                                    ? 'bg-gradient-to-r from-pink-500/80 via-rose-500/80 to-pink-500/80 text-white hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:scale-[1.01] active:scale-[0.99]'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                                    }`}
                                style={{ animationDelay: '0.35s', opacity: 0 }}
                            >
                                ✦ Reveal Our Connection ✦
                            </button>
                        </div>
                    ) : (
                        /* ── STEP 2: Results with Tabs ── */
                        <div className="animate-fade-up">
                            {/* Header — Both signs */}
                            <div className="flex items-center justify-center gap-6 mt-6 mb-2 animate-fade-up">
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-altar-mid to-altar-bright flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(139,95,191,0.3)]">
                                        {report.userTriad.sun.glyph}
                                    </div>
                                    <p className="font-display text-xs text-altar-gold mt-2">{report.userTriad.sun.name}</p>
                                    <p className="text-[9px] text-altar-muted">You</p>
                                </div>
                                <span className="text-2xl text-pink-400/60">💞</span>
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                                        {report.partnerTriad.sun.glyph}
                                    </div>
                                    <p className="font-display text-xs text-altar-gold mt-2">{report.partnerTriad.sun.name}</p>
                                    <p className="text-[9px] text-altar-muted">{partnerName || 'Partner'}</p>
                                </div>
                            </div>

                            {/* ── Sub Tab Bar ── */}
                            <div className="flex justify-center gap-1 mt-4 mb-5 mx-2">
                                {SUB_TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 py-2.5 rounded-xl font-display text-xs tracking-wide transition-all ${activeTab === tab.id
                                            ? 'bg-altar-gold/15 text-altar-gold border border-altar-gold/25'
                                            : 'bg-white/[0.03] text-altar-muted/60 border border-white/5 hover:bg-white/[0.06]'
                                            }`}
                                    >
                                        <span className="mr-1">{tab.emoji}</span> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* ═══ OVERVIEW TAB ═══ */}
                            {activeTab === 'overview' && (
                                <div className="animate-fade-up">
                                    {/* Cosmic Score */}
                                    <div className="text-center my-4 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                                        <ScoreRing score={report.overallScore} tier={report.tier} />
                                    </div>

                                    {/* Triad Comparison */}
                                    <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                            <span className="text-altar-gold">✦</span> Triad Comparison
                                        </h3>
                                        <MatchRow label="Sun" match={report.sunMatch} />
                                        <MatchRow label="Moon" match={report.moonMatch} />
                                        <MatchRow label="Rising" match={report.risingMatch} />
                                    </div>

                                    {/* Element Wheel */}
                                    <div className="glass rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                            <span className="text-altar-gold">✦</span> Element Balance
                                        </h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Object.entries(report.elementBalance).map(([elem, count]) => {
                                                const info = ELEMENT_ICONS[elem];
                                                const maxCount = 6;
                                                const pct = (count / maxCount) * 100;
                                                return (
                                                    <div key={elem} className={`rounded-xl p-3 text-center bg-gradient-to-br ${info.color} border`}>
                                                        <span className="text-lg block">{info.emoji}</span>
                                                        <p className="font-display text-xs text-altar-gold mt-1">{count}/6</p>
                                                        <div className="w-full h-1 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-altar-gold/60 transition-all duration-1000"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase mt-1">{elem}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Relationship Reading */}
                                    <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                            <span className="text-altar-gold">✦</span> Your Connection
                                        </h3>
                                        {aiLoading ? (
                                            <div className="space-y-2.5 py-1">
                                                <div className="h-3 shimmer-skeleton w-full" />
                                                <div className="h-3 shimmer-skeleton w-[93%]" />
                                                <div className="h-3 shimmer-skeleton w-[82%]" />
                                                <div className="h-3 shimmer-skeleton w-[68%]" />
                                            </div>
                                        ) : (
                                            <AIResponseRenderer text={aiReading || `The ${report.userTriad.sun.name}–${report.partnerTriad.sun.name} bond is one of ${report.tier.toLowerCase()}. Your combined energies create a dynamic where ${report.strengths[0]?.toLowerCase() || 'understanding flows naturally'}. Together, you are stronger than apart.`} />
                                        )}
                                    </div>

                                    {/* Strengths & Growth */}
                                    <div className="grid grid-cols-2 gap-2.5 mb-4 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                                        <div className="rounded-2xl p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                            <h4 className="font-display text-[9px] text-green-400/80 tracking-[2px] uppercase mb-2">Strengths</h4>
                                            <ul className="space-y-2">
                                                {report.strengths.map((s, i) => (
                                                    <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1.5">
                                                        <span className="text-green-400/60 shrink-0">♡</span>
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                            <h4 className="font-display text-[9px] text-amber-400/80 tracking-[2px] uppercase mb-2">Growth Edges</h4>
                                            <ul className="space-y-2">
                                                {report.growthEdges.map((e, i) => (
                                                    <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1.5">
                                                        <span className="text-amber-400/60 shrink-0">△</span>
                                                        <span>{e}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ SYNASTRY TAB ═══ */}
                            {activeTab === 'synastry' && synastry && (
                                <div className="animate-fade-up">
                                    {/* Synastry Wheel */}
                                    <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                                        <SynastryWheel
                                            userPlanets={synastry.userPlanets}
                                            partnerPlanets={synastry.partnerPlanets}
                                            aspects={synastry.aspects}
                                            onAspectTap={setSelectedAspect}
                                            selectedAspect={selectedAspect}
                                        />
                                    </div>

                                    {/* Aspect count summary */}
                                    <div className="flex justify-center gap-3 mb-5 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                                        <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/15 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                            <span className="text-[10px] text-green-400/80 font-display">{synastry.aspects.filter(a => a.nature === 'harmonious').length} harmonious</span>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/15 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                            <span className="text-[10px] text-red-400/80 font-display">{synastry.aspects.filter(a => a.nature === 'challenging').length} challenging</span>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/15 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                            <span className="text-[10px] text-yellow-400/80 font-display">{synastry.aspects.filter(a => a.nature === 'neutral').length} neutral</span>
                                        </div>
                                    </div>

                                    {/* Grouped aspect list */}
                                    {(['chemistry', 'emotional', 'friction', 'growth', 'karmic', 'communication'] as const).map(category => {
                                        const items = synastry[category];
                                        if (!items || items.length === 0) return null;
                                        const meta = CATEGORY_META[category];
                                        return (
                                            <div key={category} className="mb-4 animate-fade-up">
                                                <h3 className="font-display text-[10px] tracking-[2px] uppercase mb-1 px-1 flex items-center gap-1.5">
                                                    <span>{meta.emoji}</span>
                                                    <span className={meta.color}>{meta.label}</span>
                                                    <span className="text-altar-muted/30 ml-1">({items.length})</span>
                                                </h3>
                                                <div className="glass rounded-2xl divide-y divide-white/[0.03] overflow-hidden">
                                                    {items.slice(0, 5).map((aspect, i) => (
                                                        <AspectListItem
                                                            key={`${aspect.planet1.id}-${aspect.planet2.id}-${i}`}
                                                            aspect={aspect}
                                                            onTap={() => setSelectedAspect(aspect)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ═══ DEEP DIVE TAB ═══ */}
                            {activeTab === 'deepdive' && (
                                <div className="animate-fade-up">
                                    <div className="text-center mb-5 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                                        <span className="text-3xl">🔮</span>
                                        <h3 className="font-display text-sm text-altar-gold tracking-[3px] mt-2">RELATIONSHIP DEEP DIVE</h3>
                                        <p className="text-[11px] text-altar-muted mt-1">AI-powered analysis of your synastry chart</p>
                                    </div>

                                    <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                                        {deepDiveLoading ? (
                                            <div className="space-y-3 py-2">
                                                {Array.from({ length: 8 }).map((_, i) => (
                                                    <div key={i} className="h-3 shimmer-skeleton" style={{ width: `${95 - (i % 3) * 12}%` }} />
                                                ))}
                                            </div>
                                        ) : deepDive ? (
                                            <AIResponseRenderer text={deepDive} />
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-xs text-altar-muted/60 italic">
                                                    {new AIService().hasApiKey()
                                                        ? 'Preparing your deep dive reading…'
                                                        : 'Add your API key in Settings to unlock AI readings.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* What to Watch For */}
                                    {synastry && synastry.friction.length > 0 && (
                                        <div className="rounded-2xl p-4 mb-4 bg-gradient-to-br from-amber-900/20 to-orange-900/10 border border-amber-500/15 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                                            <h4 className="font-display text-[10px] text-amber-400/80 tracking-[2px] uppercase mb-3 flex items-center gap-1.5">
                                                <span>⚠️</span> What to Watch For
                                            </h4>
                                            <ul className="space-y-2.5">
                                                {synastry.friction.slice(0, 3).map((a, i) => {
                                                    const s1 = a.planet1.signId.charAt(0).toUpperCase() + a.planet1.signId.slice(1);
                                                    const s2 = a.planet2.signId.charAt(0).toUpperCase() + a.planet2.signId.slice(1);
                                                    return (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-amber-400/60 text-[10px] mt-0.5 shrink-0">{a.symbol}</span>
                                                            <div>
                                                                <p className="text-[11px] text-altar-text/80 leading-snug">
                                                                    <span className="text-amber-300/80 font-semibold">{a.planet1.name}</span> ({s1}) {a.type} <span className="text-amber-300/80 font-semibold">{a.planet2.name}</span> ({s2})
                                                                </p>
                                                                <p className="text-[10px] text-altar-muted/50 mt-0.5">
                                                                    {a.orb}° orb • Tap in Synastry tab to learn more
                                                                </p>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Try another partner */}
                            <button
                                onClick={() => {
                                    setReport(null);
                                    setSynastry(null);
                                    setAiReading(null);
                                    setDeepDive(null);
                                    setPartnerName('');
                                    setPartnerBirthday('');
                                    setPartnerBirthTime('');
                                    setPartnerBirthLocation('');
                                    setPartnerLatitude(undefined);
                                    setPartnerLongitude(undefined);
                                    setPartnerUtcOffset(0);
                                    setCityQuery('');
                                    setCitySuggestions([]);
                                    setActiveTab('overview');
                                    safeStorage.removeItem('arcana_partner');
                                }}
                                className="w-full py-3 rounded-2xl glass border border-white/5 text-center hover:border-altar-gold/20 transition-all text-sm font-display text-altar-muted tracking-wide mb-5"
                            >
                                Try Another Match →
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab="home" onTabChange={onTabChange} />

            {/* Aspect Card Overlay */}
            {selectedAspect && (
                <AspectCard
                    aspect={selectedAspect}
                    onClose={() => setSelectedAspect(null)}
                />
            )}
        </div>
    );
}
