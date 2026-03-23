import React from 'react';
import { BottomNav } from './BottomNav';
import {
    getBirthData, getNatalTriad, getFullChart, getPlacementMeaning, BirthData, ZODIAC_SIGNS,
    FullChartData,
} from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import { PageHeader } from './PageHeader';

interface NatalChartProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
    initialFocus?: 'moon' | 'rising' | 'blueprint';
}

export function NatalChart({ onClose, onTabChange, subscription, onShowPremium, initialFocus }: NatalChartProps) {
    const [birthData] = React.useState<BirthData | null>(getBirthData);
    const [selectedPlacement, setSelectedPlacement] = React.useState<{ position: 'sun' | 'moon' | 'rising'; sign: typeof ZODIAC_SIGNS[number]; icon: string } | null>(null);
    const [aiMeaning, setAiMeaning] = React.useState<{ title: string; overview: string; strengths: string; challenges: string; advice: string } | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [aiError, setAiError] = React.useState<string | null>(null);
    const aiCacheRef = React.useRef<Record<string, any>>({});
    const [showCosmicModal, setShowCosmicModal] = React.useState(false);
    const [cosmicSynthesis, setCosmicSynthesis] = React.useState<string | null>(null);
    const [cosmicLoading, setCosmicLoading] = React.useState(false);
    const [chartSummary, setChartSummary] = React.useState<string | null>(null);
    const [chartSummaryLoading, setChartSummaryLoading] = React.useState(false);
    const autoFocusedRef = React.useRef(false);
    const [expandedAspect, setExpandedAspect] = React.useState<number | null>(null);

    const handleCardTap = async (position: 'sun' | 'moon' | 'rising', sign: typeof ZODIAC_SIGNS[number], icon: string) => {
        if (subscription !== 'premium') {
            onShowPremium();
            return;
        }
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




    const triad = birthData ? getNatalTriad(birthData) : null;
    const fullChart: FullChartData | null = React.useMemo(() => birthData ? getFullChart(birthData) : null, [birthData]);

    // Auto-open placement modal when arriving from Blueprint card Moon/Rising tile
    React.useEffect(() => {
        if (autoFocusedRef.current || !initialFocus || !triad) return;
        autoFocusedRef.current = true;
        const t = setTimeout(() => {
            if (initialFocus === 'blueprint') {
                setShowCosmicModal(true);
            } else if (initialFocus === 'moon') {
                handleCardTap('moon', triad.moon, '🌙');
            } else if (initialFocus === 'rising') {
                handleCardTap('rising', triad.rising, '⬆️');
            }
        }, 100);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triad, initialFocus]);

    // Accuracy indicators
    const hasBirthTime = !!birthData?.birthTime;
    const hasCoordinates = birthData?.latitude !== undefined && birthData?.longitude !== undefined;
    const moonAccuracy = hasBirthTime ? 'precise' : 'approximate';
    const risingAccuracy = hasBirthTime && hasCoordinates ? 'precise' : hasCoordinates ? 'needs-time' : 'approximate';

    /* ── Sacred Fintech style helpers ── */
    const primaryCardStyle = {
        background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)',
    } as React.CSSProperties;

    const goldCardStyle = {
        background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
        border: '1px solid var(--color-gold-glow-med)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 0 30px var(--color-gold-glow-soft), inset 0 1px 1px rgba(255,255,255,0.08)',
    } as React.CSSProperties;

    const insetStyle = {
        background: 'rgba(18,2,36,0.6)',
        border: '1px solid rgba(255,255,255,0.05)',
    } as React.CSSProperties;

    /* Aspect explanations — personal, planet-pair aware */
    function getAspectExplanation(type: string, planet1: string, planet2: string, nature: string): string {
        const planetMeaning: Record<string, string> = {
            'Sun': 'your core identity and life purpose',
            'Moon': 'your emotions and inner world',
            'Mercury': 'how you think and communicate',
            'Venus': 'how you love and what you value',
            'Mars': 'your drive, ambition, and how you take action',
            'Jupiter': 'your luck, growth, and where you expand',
            'Saturn': 'your discipline, responsibilities, and life lessons',
            'Uranus': 'your need for freedom and where you break the mold',
            'Neptune': 'your intuition, dreams, and spiritual gifts',
            'Pluto': 'your deepest transformations and hidden power',
        };
        const p1 = planetMeaning[planet1] || 'a key part of who you are';
        const p2 = planetMeaning[planet2] || 'another aspect of your nature';

        const templates: Record<string, string> = {
            'Conjunction': `Your ${planet1} (${p1}) is fused with your ${planet2} (${p2}). For you, this means these parts of your life are inseparable — they amplify each other constantly. This is one of your most defining traits, shaping how others experience you.`,
            'Sextile': `Your ${planet1} (${p1}) works in easy harmony with your ${planet2} (${p2}). This gives you a natural talent you can tap into whenever you need it — opportunities in these areas come to you more easily than most people. Lean into it.`,
            'Square': `Your ${planet1} (${p1}) clashes with your ${planet2} (${p2}), creating inner tension you've likely felt your whole life. This friction is actually your superpower — it forces you to grow, adapt, and become stronger in both areas. The key is not to suppress either side.`,
            'Trine': `Your ${planet1} (${p1}) flows effortlessly with your ${planet2} (${p2}). This is a gift — things related to these energies come naturally to you and others notice. The only risk is taking this ease for granted. Use it consciously and it becomes one of your greatest strengths.`,
            'Opposition': `Your ${planet1} (${p1}) pulls against your ${planet2} (${p2}), creating a seesaw in your life. You may swing between these two energies. The lesson is balance — when you integrate both sides, you gain a perspective most people never achieve.`,
        };
        return templates[type] || `Your ${planet1} and ${planet2} form a ${type.toLowerCase()} aspect, creating a unique dynamic between ${p1} and ${p2} that shapes your experience in meaningful ways.`;
    }

    /* Aspect nature → border-only accent with subtle glow */
    const NATURE_BORDER: Record<string, { border: string; color: string; glow: string }> = {
        harmonious: { border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', glow: '0 0 12px rgba(74,222,128,0.15), 0 0 4px rgba(74,222,128,0.1)' },
        challenging: { border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', glow: '0 0 12px rgba(248,113,113,0.15), 0 0 4px rgba(248,113,113,0.1)' },
        neutral: { border: '1px solid rgba(96,165,250,0.35)', color: '#60a5fa', glow: '0 0 12px rgba(96,165,250,0.15), 0 0 4px rgba(96,165,250,0.1)' },
    };

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <PageHeader title="NATAL CHART" onClose={onClose} titleSize="lg" />

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Hero */}
                    <div className="text-center mt-6 mb-6 animate-fade-up">
                        <div className="text-4xl mb-2">🌙</div>
                        <h2 className="font-display text-xl tracking-[3px]" style={{ color: 'var(--color-gold-100)' }}>YOUR COSMIC BLUEPRINT</h2>
                        <p className="text-sm mt-2" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>Discover your celestial triad</p>
                    </div>

                    {/* Birth Data — read only, edit in Profile */}
                    {birthData ? (
                        <div className="rounded-[22px] p-5 mb-5 animate-fade-up" style={primaryCardStyle}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-display text-[9px] tracking-[3px] uppercase" style={{ color: 'var(--color-gold-200)' }}>Birth Data</h3>
                                <button onClick={() => onTabChange('profile')} className="text-[11px] font-display hover:underline" style={{ color: 'var(--color-gold-100)' }}>
                                    Edit in Profile →
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span className="text-[11px]" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>Birthday</span>
                                    <span className="text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                        {new Date(birthData.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                {birthData.birthTime && (
                                    <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <span className="text-[11px]" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>Birth Time</span>
                                        <span className="text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>{birthData.birthTime}</span>
                                    </div>
                                )}
                                {birthData.location && (
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-[11px]" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>Location</span>
                                        <span className="text-[11px] truncate max-w-[180px]" style={{ fontFamily: 'var(--font-body)' }}>{birthData.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-[22px] p-6 mb-5 text-center animate-fade-up" style={primaryCardStyle}>
                            <p className="text-sm mb-4" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>Set your birth data to reveal your natal chart</p>
                            <button
                                onClick={() => onTabChange('profile')}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-display transition-all active:scale-[0.97] gold-shimmer"
                                style={{
                                    background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                    color: '#1a0f2e',
                                    fontWeight: 800,
                                    letterSpacing: '2px',
                                    border: '2px solid rgba(212,175,55,0.6)',
                                    boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
                                }}
                            >
                                SET UP IN PROFILE →
                            </button>
                        </div>
                    )}

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
                                        className="rounded-[22px] p-4 text-center transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                                        style={{
                                            ...goldCardStyle,
                                        }}
                                    >
                                        <span className="text-2xl block mb-1">{item.icon}</span>
                                        <p className="text-[9px] font-display tracking-[2px] uppercase mb-1" style={{ color: 'var(--color-altar-muted)' }}>{item.label}</p>
                                        <p className="text-3xl mb-1">{item.data.glyph}</p>
                                        <p className="font-display text-sm font-semibold" style={{ color: 'var(--color-gold-100)' }}>{item.data.name}</p>
                                        <p className="text-[9px] mt-1" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>{item.desc}</p>
                                        {/* Accuracy indicator */}
                                        {item.position === 'moon' && moonAccuracy === 'approximate' && (
                                            <p className="text-[7px] mt-1 font-display" style={{ color: 'rgba(212,175,55,0.5)' }}>~approx</p>
                                        )}
                                        {item.position === 'rising' && risingAccuracy !== 'precise' && (
                                            <p className="text-[7px] mt-1 font-display" style={{ color: 'rgba(212,175,55,0.5)' }}>
                                                {risingAccuracy === 'needs-time' ? 'needs birth time' : '~approx'}
                                            </p>
                                        )}
                                        <p className="text-[8px] mt-1 font-display" style={{ color: 'var(--color-gold-200)' }}>Tap to explore ✦</p>
                                    </button>
                                ))}
                            </div>

                            {/* Element & Ruling Planet — tappable */}
                            <button
                                onClick={async () => {
                                    if (subscription !== 'premium') {
                                        onShowPremium();
                                        return;
                                    }
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
                                className="w-full text-left rounded-[22px] p-5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                style={primaryCardStyle}
                            >
                                <h3 className="font-display text-[9px] tracking-[3px] uppercase mb-3" style={{ color: 'var(--color-gold-200)' }}>Cosmic Details</h3>
                                <div className="space-y-0">
                                    {[
                                        { label: 'Sun Element', value: triad.sun.element },
                                        { label: 'Ruling Planet', value: triad.sun.ruling },
                                        { label: 'Moon Element', value: triad.moon.element },
                                        { label: 'Rising Element', value: triad.rising.element },
                                    ].map((row, i, arr) => (
                                        <div key={row.label} className="flex justify-between py-2" style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                            <span className="text-xs" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>{row.label}</span>
                                            <span className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[8px] mt-3 font-display text-center" style={{ color: 'var(--color-gold-200)' }}>Tap for chart synthesis ✦</p>
                            </button>

                            {/* 🪐 Planetary Placements */}
                            {fullChart && fullChart.planets.length > 0 && subscription === 'premium' && (
                                <div className="rounded-[22px] p-5" style={primaryCardStyle}>
                                    <h3 className="font-display text-[9px] tracking-[3px] uppercase mb-3" style={{ color: 'var(--color-gold-200)' }}>🪐 Planetary Placements</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {fullChart.planets.map(planet => {
                                            const zodiac = ZODIAC_SIGNS.find(z => z.id === planet.signId);
                                            return (
                                                <div key={planet.id} className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl" style={insetStyle}>
                                                    <span className="text-lg w-6 text-center" title={planet.name}>{planet.glyph}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-display tracking-wider uppercase" style={{ color: 'var(--color-altar-muted)' }}>{planet.name}</p>
                                                        <p className="text-xs font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                                                            {zodiac?.glyph} {zodiac?.name} <span style={{ color: 'var(--color-altar-muted)' }}>{planet.degreeInSign}°</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ✦ Notable Aspects — color from borders only */}
                            {fullChart && fullChart.aspects.length > 0 && subscription === 'premium' && (
                                <div className="rounded-[22px] p-5" style={primaryCardStyle}>
                                    <h3 className="font-display text-[9px] tracking-[3px] uppercase mb-3" style={{ color: 'var(--color-gold-200)' }}>✦ Notable Aspects</h3>
                                    <div className="space-y-2">
                                        {fullChart.aspects.slice(0, 10).map((aspect, i) => {
                                            const accent = NATURE_BORDER[aspect.nature] || NATURE_BORDER.neutral;
                                            const isExpanded = expandedAspect === i;
                                            const explanation = getAspectExplanation(aspect.type, aspect.planet1Name, aspect.planet2Name, aspect.nature);
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setExpandedAspect(isExpanded ? null : i)}
                                                    className="w-full text-left rounded-xl transition-all active:scale-[0.98]"
                                                    style={{
                                                        background: 'rgba(18,2,36,0.5)',
                                                        border: accent.border,
                                                        boxShadow: accent.glow,
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between py-2.5 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-mono" style={{ color: accent.color }}>{aspect.planet1Glyph}</span>
                                                            <span className="text-base font-bold" style={{ color: accent.color }}>{aspect.symbol}</span>
                                                            <span className="text-sm font-mono" style={{ color: accent.color }}>{aspect.planet2Glyph}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-right">
                                                                <p className="text-[11px] font-display tracking-wide" style={{ color: 'var(--color-altar-text)' }}>
                                                                    {aspect.planet1Name} {aspect.type} {aspect.planet2Name}
                                                                </p>
                                                                <p className="text-[9px]" style={{ color: 'var(--color-altar-muted)' }}>orb: {aspect.orb}°</p>
                                                            </div>
                                                            <span className="text-[10px] transition-transform" style={{ color: accent.color, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                                                        </div>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="px-3 pb-3 pt-1 animate-fade-up" style={{ borderTop: `1px solid ${accent.color}15` }}>
                                                            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(226,232,240,0.8)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                                                                {explanation}
                                                            </p>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ✨ Full Chart Summary */}
                            {fullChart && subscription === 'premium' && (
                                <div className="rounded-[22px] p-5" style={primaryCardStyle}>
                                    <h3 className="font-display text-[9px] tracking-[3px] uppercase mb-3" style={{ color: 'var(--color-gold-200)' }}>✨ Chart Summary</h3>
                                    {chartSummary ? (
                                        <AIResponseRenderer text={chartSummary} />
                                    ) : chartSummaryLoading ? (
                                        <div className="space-y-2.5 py-1">
                                            <div className="h-3 shimmer-skeleton w-full" />
                                            <div className="h-3 shimmer-skeleton w-[90%]" />
                                            <div className="h-3 shimmer-skeleton w-[75%]" />
                                            <div className="h-3 shimmer-skeleton w-[60%]" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                const ai = new AIService();
                                                if (!ai.hasApiKey()) return;
                                                setChartSummaryLoading(true);
                                                try {
                                                    const result = await ai.getFullChartSummary(
                                                        fullChart.planets,
                                                        fullChart.aspects,
                                                        {
                                                            sun: fullChart.triad.sun.name,
                                                            moon: fullChart.triad.moon.name,
                                                            rising: fullChart.triad.rising.name,
                                                        }
                                                    );
                                                    setChartSummary(result);
                                                } catch (err: any) {
                                                    setChartSummary(null);
                                                } finally {
                                                    setChartSummaryLoading(false);
                                                }
                                            }}
                                            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-display text-sm tracking-[2px] transition-all active:scale-[0.97] gold-shimmer"
                                            style={{
                                                background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                                color: '#1a0f2e',
                                                fontWeight: 800,
                                                border: '2px solid rgba(212,175,55,0.6)',
                                                boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
                                            }}
                                        >
                                            <span>✨</span> REVEAL CHART READING
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Suggested Spreads */}
                            <div className="rounded-[22px] p-5" style={primaryCardStyle}>
                                <h3 className="font-display text-[9px] tracking-[3px] uppercase mb-3" style={{ color: 'var(--color-gold-200)' }}>✦ Suggested Spreads</h3>
                                <p className="text-xs mb-3" style={{ color: 'rgba(226,232,240,0.7)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>Based on your {triad.sun.element} Sun and {triad.moon.element} Moon</p>
                                <div className="space-y-2">
                                    {[
                                        { emoji: '🔮', title: '3-Card Elemental', desc: `Past · Present · Future through your ${triad.sun.element} lens` },
                                        { emoji: '💫', title: 'Moon Guidance', desc: `Single card attuned to your ${triad.moon.name} Moon` },
                                    ].map(spread => (
                                        <button
                                            key={spread.title}
                                            onClick={() => onTabChange('new')}
                                            className="w-full py-3 rounded-xl text-left px-4 flex items-center gap-3 transition-all active:scale-[0.97]"
                                            style={{
                                                background: 'rgba(18,2,36,0.5)',
                                                border: '1px solid var(--color-gold-glow-med)',
                                            }}
                                        >
                                            <span className="text-xl">{spread.emoji}</span>
                                            <div>
                                                <p className="font-display text-[13px]" style={{ color: 'var(--color-gold-100)' }}>{spread.title}</p>
                                                <p className="text-[10px]" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>{spread.desc}</p>
                                            </div>
                                        </button>
                                    ))}
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
                            className="relative w-full max-w-[500px] max-h-[85vh] overflow-y-auto rounded-[2rem] p-6 pb-8 animate-fade-up"
                            onClick={e => e.stopPropagation()}
                            style={{
                                ...goldCardStyle,
                            }}
                        >
                            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--color-gold-glow-med)' }} />

                            <div className="text-center mb-5">
                                <span className="text-3xl block mb-2">🌌</span>
                                <h3 className="font-display text-xl tracking-[3px]" style={{ color: 'var(--color-gold-100)' }}>COSMIC BLUEPRINT</h3>
                                <p className="text-xs mt-1" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>How your elements &amp; planets interact</p>
                            </div>

                            {/* Element Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[
                                    { label: 'Sun', sign: triad.sun },
                                    { label: 'Moon', sign: triad.moon },
                                    { label: 'Rising', sign: triad.rising },
                                ].map(item => (
                                    <div key={item.label} className="rounded-xl p-3 text-center" style={insetStyle}>
                                        <p className="text-[8px] font-display tracking-[2px] uppercase" style={{ color: 'var(--color-altar-muted)' }}>{item.label}</p>
                                        <p className="text-sm font-display mt-1">{item.sign.element}</p>
                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>{item.sign.ruling}</p>
                                    </div>
                                ))}
                            </div>

                            {/* AI Synthesis */}
                            <div className="rounded-2xl p-4 mb-4" style={insetStyle}>
                                {cosmicLoading ? (
                                    <div className="space-y-2.5 py-1">
                                        <div className="h-3 shimmer-skeleton w-full" />
                                        <div className="h-3 shimmer-skeleton w-[90%]" />
                                        <div className="h-3 shimmer-skeleton w-[78%]" />
                                        <div className="h-3 shimmer-skeleton w-[60%]" />
                                    </div>
                                ) : cosmicSynthesis ? (
                                    <>
                                        <p className="text-[9px] font-display tracking-[2px] uppercase mb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>✦ Cosmic Chart Synthesis</p>
                                        <AIResponseRenderer text={cosmicSynthesis} />
                                    </>
                                ) : (
                                    <p className="text-xs text-center py-2" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>No API key configured — add one in Settings for cosmic synthesis</p>
                                )}
                            </div>

                            <button
                                onClick={() => setShowCosmicModal(false)}
                                className="w-full py-3 rounded-xl font-display text-sm tracking-[2px] transition-all active:scale-[0.97]"
                                style={{
                                    background: 'rgba(18,2,36,0.5)',
                                    border: '1px solid var(--color-gold-glow-med)',
                                    color: 'var(--color-gold-200)',
                                }}
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
                                className="relative w-full max-w-[500px] max-h-[85vh] overflow-y-auto rounded-[2rem] p-6 pb-8 animate-fade-up"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    ...goldCardStyle,
                                }}
                            >
                                {/* Handle */}
                                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--color-gold-glow-med)' }} />

                                {/* AI indicator */}
                                {(aiLoading || aiMeaning) && (
                                    <div className="flex items-center justify-center gap-1.5 mb-3">
                                        <span className="text-[9px] font-display tracking-[2px] uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>
                                            {aiLoading ? '✦ Channeling the stars…' : '✦ Mystic Interpretation'}
                                        </span>
                                        {aiLoading && <span className="inline-block w-3 h-3 rounded-full animate-spin" style={{ border: '2px solid rgba(212,175,55,0.3)', borderTopColor: 'var(--color-gold-200)' }} />}
                                    </div>
                                )}

                                {/* Sign Header */}
                                <div className="text-center mb-5">
                                    <span className="text-4xl block mb-2">{selectedPlacement.icon}</span>
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <span className="text-3xl">{selectedPlacement.sign.glyph}</span>
                                    </div>
                                    <h3 className="font-display text-xl tracking-[3px]" style={{ color: 'var(--color-gold-100)' }}>
                                        {selectedPlacement.sign.name} {positionLabel}
                                    </h3>
                                    <p className="text-xs mt-1" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)' }}>{selectedPlacement.sign.element} · {selectedPlacement.sign.ruling}</p>
                                </div>

                                {/* Title */}
                                <div className="text-center mb-5">
                                    {aiLoading ? (
                                        <span className="inline-block w-40 h-8 shimmer-skeleton" />
                                    ) : (
                                        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-display tracking-wide animate-fade-up" style={{
                                            background: 'rgba(212,175,55,0.1)',
                                            border: '1px solid rgba(212,175,55,0.2)',
                                            color: 'var(--color-gold-100)',
                                        }}>
                                            ✦ {meaning.title} ✦
                                        </span>
                                    )}
                                </div>

                                {/* Overview */}
                                <div className="rounded-2xl p-4 mb-4" style={insetStyle}>
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

                                {/* Strengths & Challenges — border-only accents */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="rounded-xl p-3" style={{ ...insetStyle, border: '1px solid rgba(74,222,128,0.25)' }}>
                                        <p className="text-[9px] font-display tracking-[2px] uppercase mb-1.5" style={{ color: 'rgba(74,222,128,0.7)' }}>Strengths</p>
                                        {aiLoading ? (
                                            <div className="space-y-2">
                                                <div className="h-2.5 shimmer-skeleton w-full" />
                                                <div className="h-2.5 shimmer-skeleton w-[70%]" />
                                            </div>
                                        ) : (
                                            <ul className="space-y-1 overflow-hidden animate-fade-up">
                                                {meaning.strengths.split(',').map((s: string, i: number) => (
                                                    <li key={i} className="text-[11px] leading-snug flex gap-1" style={{ color: 'rgba(226,232,240,0.8)' }}>
                                                        <span className="shrink-0" style={{ color: 'rgba(74,222,128,0.5)' }}>·</span>
                                                        <span className="break-words">{s.trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="rounded-xl p-3" style={{ ...insetStyle, border: '1px solid rgba(248,113,113,0.25)' }}>
                                        <p className="text-[9px] font-display tracking-[2px] uppercase mb-1.5" style={{ color: 'rgba(248,113,113,0.7)' }}>Challenges</p>
                                        {aiLoading ? (
                                            <div className="space-y-2">
                                                <div className="h-2.5 shimmer-skeleton w-full" />
                                                <div className="h-2.5 shimmer-skeleton w-[65%]" />
                                            </div>
                                        ) : (
                                            <ul className="space-y-1 overflow-hidden animate-fade-up">
                                                {meaning.challenges.split(',').map((s: string, i: number) => (
                                                    <li key={i} className="text-[11px] leading-snug flex gap-1" style={{ color: 'rgba(226,232,240,0.8)' }}>
                                                        <span className="shrink-0" style={{ color: 'rgba(248,113,113,0.5)' }}>·</span>
                                                        <span className="break-words">{s.trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Advice */}
                                <div className="rounded-2xl p-4" style={{ ...primaryCardStyle, border: '1px solid var(--color-gold-glow-med)' }}>
                                    <p className="text-[9px] font-display tracking-[2px] uppercase mb-1.5" style={{ color: 'rgba(212,175,55,0.7)' }}>✦ Cosmic Advice</p>
                                    {aiLoading ? (
                                        <div className="space-y-2">
                                            <div className="h-3 shimmer-skeleton w-[85%]" />
                                            <div className="h-3 shimmer-skeleton w-[50%]" />
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed italic animate-fade-up" style={{ color: 'rgba(226,232,240,0.85)', fontFamily: 'var(--font-body)' }}>"{meaning.advice}"</p>
                                    )}
                                </div>

                                {/* AI Error */}
                                {aiError && (
                                    <p className="text-[10px] text-center mt-3" style={{ color: 'rgba(248,113,113,0.6)' }}>{aiError}</p>
                                )}

                                {/* Close */}
                                <button
                                    onClick={() => { setSelectedPlacement(null); setAiMeaning(null); setAiError(null); }}
                                    className="w-full mt-5 py-3 rounded-xl font-display text-sm tracking-[2px] transition-all active:scale-[0.97]"
                                    style={{
                                        background: 'rgba(18,2,36,0.5)',
                                        border: '1px solid var(--color-gold-glow-med)',
                                        color: 'var(--color-gold-200)',
                                    }}
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
