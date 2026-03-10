import React from 'react';
import {
    getBirthData, getNatalTriad, getFullChart, getLifePathNumber, getLifePathMeaning,
    getCurrentPersonalYear, ZODIAC_SIGNS, FullChartData,
} from '../services/astrology.service';
import { AIService, dailyCache } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';

interface CosmicBlueprintProps {
    onTabChange: (tab: string) => void;
}

// Clay shadow helpers
const clayCard = '0 8px 32px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.07), inset 0 -2px 6px rgba(0,0,0,0.35)';
const clayPill = (r: number, g: number, b: number) =>
    `inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.35), 0 4px 12px rgba(${r},${g},${b},0.35), 0 1px 3px rgba(0,0,0,0.4)`;

// Personal Year → Manifestation Season
const PY_MANIFESTATION: Record<number, string> = {
    1: 'Plant bold new seeds — new intentions only',
    2: 'Co-manifest with patience — don\'t force timing',
    3: 'Speak it into existence — creative expression manifests',
    4: 'Build the foundation — long-term ritual intentions',
    5: 'Release control of outcomes — manifest freedom',
    6: 'Heart-centered intentions — love, home, healing',
    7: 'Inner work first — manifest from deep stillness',
    8: 'Abundance window — your peak financial manifestation year ✨',
    9: 'Release the old — completion before new seeds',
    11: 'Inspire others — illuminate as you manifest',
    22: 'Master builder year — turn grand visions into reality',
    33: 'Selfless creation — your gifts are the manifestation',
};

// ── Element colors for Sun / Moon / Rising signs ──
type Element = 'Fire' | 'Earth' | 'Air' | 'Water';

const SIGN_ELEMENTS: Record<string, Element> = {
    aries: 'Fire', leo: 'Fire', sagittarius: 'Fire',
    taurus: 'Earth', virgo: 'Earth', capricorn: 'Earth',
    gemini: 'Air', libra: 'Air', aquarius: 'Air',
    cancer: 'Water', scorpio: 'Water', pisces: 'Water',
};

const ELEMENT_STYLE: Record<Element, {
    grad: string;
    border: string;
    labelColor: string;
    valueColor: string;
    shadow: string;
    r: number; g: number; b: number;
}> = {
    Fire: {
        grad: 'linear-gradient(145deg, #7c1d06 0%, #5a1504 60%, #2d0c02 100%)',
        border: 'rgba(251,146,60,0.22)',
        labelColor: 'rgba(253,186,116,0.85)',
        valueColor: 'rgb(253,186,116)',
        shadow: clayPill(239, 68, 68),
        r: 239, g: 68, b: 68,
    },
    Earth: {
        grad: 'linear-gradient(145deg, #1a3311 0%, #122509 60%, #090f05 100%)',
        border: 'rgba(134,239,172,0.2)',
        labelColor: 'rgba(134,239,172,0.8)',
        valueColor: 'rgb(134,239,172)',
        shadow: clayPill(22, 163, 74),
        r: 22, g: 163, b: 74,
    },
    Air: {
        grad: 'linear-gradient(145deg, #0c2a45 0%, #071d33 60%, #030e1a 100%)',
        border: 'rgba(147,197,253,0.2)',
        labelColor: 'rgba(147,197,253,0.8)',
        valueColor: 'rgb(147,197,253)',
        shadow: clayPill(59, 130, 246),
        r: 59, g: 130, b: 246,
    },
    Water: {
        grad: 'linear-gradient(145deg, #0d2a3a 0%, #081d28 60%, #030d14 100%)',
        border: 'rgba(94,234,212,0.2)',
        labelColor: 'rgba(94,234,212,0.8)',
        valueColor: 'rgb(94,234,212)',
        shadow: clayPill(20, 184, 166),
        r: 20, g: 184, b: 166,
    },
};

function getElementForSignId(signId: string): Element {
    return SIGN_ELEMENTS[signId.toLowerCase()] ?? 'Air';
}

// ── Lunar phase helpers (shared with CreateTab) ──────────────────────────

const KNOWN_NEW_MOON = new Date('2025-01-06T00:00:00Z').getTime();
const LUNAR_CYCLE = 29.530589;
const MS_PER_DAY = 86400000;

interface LunarPhaseInfo {
    name: string;
    emoji: string;
    startDay: number;
    length: number;
    guidance: string;
    ritual: string;
    intention: string;
}

const LUNAR_PHASES: LunarPhaseInfo[] = [
    { name: 'New Moon', emoji: '🌑', startDay: 0, length: 3.7, guidance: 'The slate is clear. Plant your seeds.', ritual: 'Write your "I am calling in..." declaration. Light a candle. Speak it aloud three times with conviction. Then release the outcome — the universe heard you.', intention: 'Begin with total clarity. No half-intentions tonight.' },
    { name: 'Waxing Crescent', emoji: '🌒', startDay: 3.7, length: 3.7, guidance: 'Take one small, concrete step forward.', ritual: 'Identify the single most aligned action you can take today toward your intention. Do it — no matter how small.', intention: 'What\'s the one step that\'s been waiting to be taken?' },
    { name: 'First Quarter', emoji: '🌓', startDay: 7.38, length: 1.85, guidance: 'Obstacles arise. Act with courage.', ritual: 'Name the thing you\'ve been avoiding. Do it today. The First Quarter tests your commitment.', intention: 'What would I do if I weren\'t afraid?' },
    { name: 'Waxing Gibbous', emoji: '🌔', startDay: 9.22, length: 5.54, guidance: 'Amplify and affirm. Momentum is building.', ritual: 'Daily affirmation: "I am grateful that [your declaration] is already making its way to me." Feel this as fact.', intention: 'Feel it as if it\'s already done.' },
    { name: 'Full Moon', emoji: '🌕', startDay: 14.76, length: 1.85, guidance: 'Celebrate what\'s coming. Release what\'s blocking.', ritual: 'Write on paper what you are releasing — fear, doubt, old patterns. Burn or tear it with intention.', intention: 'What am I releasing to make space for what I\'m calling in?' },
    { name: 'Waning Gibbous', emoji: '🌖', startDay: 16.61, length: 5.54, guidance: 'Integrate and look for signs.', ritual: 'Review your manifestation. Look for evidence — synchronicities, doors opening. Write 3 signs you\'ve seen.', intention: 'What evidence is already here that I haven\'t fully acknowledged?' },
    { name: 'Last Quarter', emoji: '🌗', startDay: 22.15, length: 1.85, guidance: 'Release deeply. Let go of control.', ritual: '7-breath practice: Breathe in your intention fully. Breathe out any attachment to HOW it arrives.', intention: 'I hold the vision. I release the path.' },
    { name: 'Waning Crescent', emoji: '🌘', startDay: 24.0, length: 5.53, guidance: 'Rest. A new cycle is almost here.', ritual: '5 minutes of silence. No phone, no music. Ask inwardly: what does my soul most want to call in next?', intention: 'What wants to be born in the next cycle?' },
];

function getLunarData() {
    const daysSince = (Date.now() - KNOWN_NEW_MOON) / MS_PER_DAY;
    const currentPos = ((daysSince % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
    const currentPhase = LUNAR_PHASES.find(p => currentPos >= p.startDay && currentPos < p.startDay + p.length) ?? LUNAR_PHASES[7];
    const daysIntoPhase = currentPos - currentPhase.startDay;
    const daysRemainingInPhase = Math.max(1, Math.ceil(currentPhase.length - daysIntoPhase));

    const KEY_PHASES = [
        { name: 'New Moon', emoji: '🌑', dayOffset: 0 },
        { name: 'First Quarter', emoji: '🌓', dayOffset: 7.38 },
        { name: 'Full Moon', emoji: '🌕', dayOffset: 14.76 },
        { name: 'Last Quarter', emoji: '🌗', dayOffset: 22.15 },
    ];

    const upcoming = KEY_PHASES.map(kp => {
        let daysUntil = kp.dayOffset - currentPos;
        if (daysUntil <= 0.5) daysUntil += LUNAR_CYCLE;
        const date = new Date(Date.now() + daysUntil * MS_PER_DAY);
        return { name: kp.name, emoji: kp.emoji, date, daysUntil: Math.ceil(daysUntil), dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    return { currentPhase, daysRemainingInPhase, currentPos, upcoming };
}

export function CosmicBlueprint({ onTabChange }: CosmicBlueprintProps) {
    const [reading, setReading] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [collapsed, setCollapsed] = React.useState(true);
    const lunarData = React.useMemo(() => getLunarData(), []);

    React.useEffect(() => {
        const cached = dailyCache.get('blueprint');
        if (cached) setReading(cached);
    }, []);

    const birthData = getBirthData();
    if (!birthData) {
        return (
            <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                <div
                    className="rounded-2xl p-5 text-center"
                    style={{
                        background: 'linear-gradient(145deg, #1a1333 0%, #13102a 60%, #0e0c22 100%)',
                        boxShadow: clayCard,
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <span className="text-3xl block mb-2">🌌</span>
                    <h3 className="font-display text-sm text-altar-gold tracking-[3px] uppercase mb-2">Cosmic Blueprint</h3>
                    <p className="text-xs text-altar-muted mb-3">Enter your birth data to unlock your personalized cosmic blueprint</p>
                    <button
                        onClick={() => onTabChange('natal')}
                        className="px-5 py-2 rounded-xl text-xs text-altar-gold font-display tracking-wide transition-all"
                        style={{
                            background: 'linear-gradient(145deg, #2d1f6e 0%, #1e1454 100%)',
                            boxShadow: clayPill(109, 40, 217),
                            border: '1px solid rgba(212,175,55,0.2)',
                        }}
                    >
                        Add Birth Data →
                    </button>
                </div>
            </div>
        );
    }

    const triad = getNatalTriad(birthData);
    const fullChart = getFullChart(birthData) as FullChartData | null;
    const lifePath = getLifePathNumber(birthData.birthday);
    const lifePathMeaning = getLifePathMeaning(lifePath);
    const personalYear = getCurrentPersonalYear(birthData.birthday);

    const handleReveal = async () => {
        const ai = new AIService();
        if (!ai.hasApiKey()) {
            setError('Add your API key in Settings for personalized readings');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await ai.getCosmicBlueprint(
                { sun: triad.sun.name, moon: triad.moon.name, rising: triad.rising.name },
                fullChart?.planets || [],
                fullChart?.aspects || [],
                { number: lifePath, title: lifePathMeaning.title, desc: lifePathMeaning.desc },
                { number: personalYear },
            );
            setReading(result);
            dailyCache.set('blueprint', result);
        } catch {
            setError('Failed to generate blueprint. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const sunSign = ZODIAC_SIGNS.find(z => z.id === triad.sun.id);
    const moonSign = ZODIAC_SIGNS.find(z => z.id === triad.moon.id);
    const risingSign = ZODIAC_SIGNS.find(z => z.id === triad.rising.id);

    // Element styles per placement
    const sunStyle = ELEMENT_STYLE[getElementForSignId(triad.sun.id)];
    const moonStyle = ELEMENT_STYLE[getElementForSignId(triad.moon.id)];
    const risingStyle = ELEMENT_STYLE[getElementForSignId(triad.rising.id)];

    const triads = [
        { label: 'Sun', value: triad.sun.name, glyph: sunSign?.glyph, style: sunStyle, tab: 'horoscope', sublabel: 'horoscope' },
        { label: 'Moon', value: triad.moon.name, glyph: moonSign?.glyph, style: moonStyle, tab: 'moonreading', sublabel: 'interpretation' },
        { label: 'Rising', value: triad.rising.name, glyph: risingSign?.glyph, style: risingStyle, tab: 'risingreading', sublabel: 'interpretation' },
    ];

    return (
        <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            {/* Outer clay card */}
            <div
                className="rounded-3xl overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
                    boxShadow: clayCard,
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                {/* Header */}
                <div className="p-5 pb-3">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="font-display text-sm text-altar-gold tracking-[3px] uppercase flex items-center gap-2">
                            <span className="text-lg">🌌</span> Cosmic Blueprint
                        </h3>
                        {/* Moon phase indicator — top right */}
                        <button
                            onClick={() => onTabChange('moon')}
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all hover:brightness-125 active:scale-[0.95]"
                            style={{
                                background: 'linear-gradient(145deg, #1a1040 0%, #110b2a 100%)',
                                boxShadow: clayPill(109, 40, 217),
                                border: '1px solid rgba(167,139,250,0.15)',
                            }}
                        >
                            <span className="text-sm">{lunarData.currentPhase.emoji}</span>
                            <span className="text-[9px] text-violet-200/80 font-display tracking-wider">{lunarData.currentPhase.name}</span>
                            <span className="text-[8px] text-violet-300/60">→</span>
                        </button>
                    </div>


                    {/* Sun / Moon / Rising — element-colored tappable pills */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {triads.map(item => (
                            <button
                                key={item.label}
                                onClick={() => onTabChange(item.tab)}
                                className="rounded-xl p-2.5 text-center transition-all duration-200 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] flex flex-col items-center justify-center"
                                style={{
                                    background: item.style.grad,
                                    boxShadow: item.style.shadow,
                                    border: `1px solid ${item.style.border}`,
                                    minHeight: '58px',
                                }}
                            >
                                <p className="text-[9px] font-display tracking-[2px] uppercase mb-0.5"
                                    style={{ color: item.style.labelColor, opacity: 1 }}>
                                    {item.label}
                                </p>
                                <p className="text-[13px] font-bold leading-tight" style={{ color: item.style.valueColor }}>
                                    {item.glyph} {item.value}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Life Path + Personal Year — tappable into deeper screens */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Life Path → Numerology */}
                        <button
                            onClick={() => onTabChange('numerology')}
                            className="rounded-xl p-3 text-left transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.97]"
                            style={{
                                background: 'linear-gradient(145deg, #3d2007 0%, #2a1505 100%)',
                                boxShadow: clayPill(146, 64, 14),
                                border: '1px solid rgba(251,191,36,0.12)',
                            }}
                        >
                            <p className="text-[9px] text-amber-300/70 font-display tracking-[2px] uppercase mb-1 flex items-center justify-between">
                                Life Path <span className="text-[8px] opacity-50">→</span>
                            </p>
                            <p className="text-sm text-amber-200 font-bold text-left">
                                #{lifePath} <span className="text-[10px] font-normal text-amber-300/65">— {lifePathMeaning.title}</span>
                            </p>
                            <p className="text-[9px] text-amber-200/55 mt-1.5 leading-snug">
                                {lifePathMeaning.desc}
                            </p>
                            <div className="mt-2 flex flex-col gap-1">
                                <p className="text-[9px] text-amber-300/55 leading-snug">
                                    <span className="text-amber-300/80">✦</span> {lifePathMeaning.strengths}
                                </p>
                                <p className="text-[9px] text-amber-300/55 leading-snug">
                                    <span className="text-amber-300/80">⚡</span> {lifePathMeaning.challenges}
                                </p>
                            </div>
                        </button>

                        {/* Personal Year → Year Ahead */}
                        <button
                            onClick={() => onTabChange('yearahead')}
                            className="rounded-xl p-3 text-left transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.97]"
                            style={{
                                background: 'linear-gradient(145deg, #22164d 0%, #170f38 100%)',
                                boxShadow: clayPill(109, 40, 217),
                                border: '1px solid rgba(167,139,250,0.12)',
                            }}
                        >
                            <p className="text-[9px] text-violet-300/70 font-display tracking-[2px] uppercase mb-1 flex items-center justify-between">
                                Personal Year <span className="text-[8px] opacity-50">→</span>
                            </p>
                            <p className="text-sm text-violet-200 font-bold">
                                #{personalYear} <span className="text-[10px] font-normal text-violet-300/65">— {new Date().getFullYear()} Cycle</span>
                            </p>
                            {PY_MANIFESTATION[personalYear] && (
                                <p className="text-[9px] text-violet-200/65 mt-1 leading-snug italic">
                                    {PY_MANIFESTATION[personalYear]}
                                </p>
                            )}
                        </button>
                    </div>

                    {/* Moon phase details moved to dedicated MoonScreen */}

                </div>

                {/* Reading / CTA */}
                <div className="px-5 pb-4">
                    {reading ? (
                        <div
                            className="rounded-xl p-4"
                            style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06), inset 0 -1px 4px rgba(0,0,0,0.35)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <p className="text-[9px] font-display text-altar-gold/60 tracking-[2px] uppercase mb-2">✦ Your Cosmic Blueprint</p>
                            <div className={collapsed ? 'max-h-[100px] overflow-hidden relative' : ''}>
                                <AIResponseRenderer text={reading} />
                                {collapsed && (
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d0b22]/95 to-transparent" />
                                )}
                            </div>
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="mt-2 text-[10px] text-altar-gold/70 font-display hover:text-altar-gold transition-colors"
                            >
                                {collapsed ? '▾ Read more' : '▴ Collapse'}
                            </button>
                        </div>
                    ) : loading ? (
                        <div
                            className="rounded-xl p-4"
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <p className="text-[9px] font-display text-altar-gold/60 tracking-[2px] uppercase mb-3">✦ Channeling Your Blueprint...</p>
                            <div className="space-y-2.5">
                                <div className="h-3 shimmer-skeleton w-full" />
                                <div className="h-3 shimmer-skeleton w-[92%]" />
                                <div className="h-3 shimmer-skeleton w-[85%]" />
                                <div className="h-3 shimmer-skeleton w-[70%]" />
                                <div className="h-3 shimmer-skeleton w-[78%]" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <p className="text-xs text-red-400/70 text-center mb-2">{error}</p>
                            )}
                            <button
                                onClick={handleReveal}
                                className="w-full py-3.5 rounded-2xl text-sm text-altar-gold font-display tracking-wide transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                                style={{
                                    background: 'linear-gradient(145deg, #2d1f6e 0%, #1e1454 50%, #130d3a 100%)',
                                    boxShadow: '0 6px 20px rgba(109,40,217,0.45), 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -2px 5px rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(212,175,55,0.2)',
                                }}
                            >
                                <span>🌌</span> Reveal Your Blueprint
                            </button>
                        </>
                    )}
                </div>

                {/* ── View Full Blueprint Reading ── */}
                <button
                    onClick={() => onTabChange('blueprint')}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 transition-colors hover:bg-white/[0.04]"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <span className="text-[9px] text-altar-gold/50 font-display tracking-[2px] uppercase">🌌 View Full Blueprint Reading</span>
                    <span className="text-[9px] text-altar-gold/30 font-display">→</span>
                </button>

                {/* ── Manifestation Scripting Shortcut ── */}
                <button
                    onClick={() => onTabChange('journal')}
                    className="w-full flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.04] group"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <span className="flex items-center gap-2 text-[11px] font-display italic" style={{ color: 'rgba(212,175,55,0.75)' }}>
                        <span className="text-base" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}>✍</span>
                        What are you scripting today?
                    </span>
                    <span className="text-[9px] text-altar-gold/40 group-hover:text-altar-gold/60 transition-colors font-display">Create →</span>
                </button>
            </div>
        </div>
    );
}
