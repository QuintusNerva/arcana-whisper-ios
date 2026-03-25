import React from 'react';
import {
    getBirthData, getNatalTriad, getFullChart, getLifePathNumber, getLifePathMeaning,
    getCurrentPersonalYear, ZODIAC_SIGNS, FullChartData,
} from '../services/astrology.service';
import { AIService, permanentCache } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';

interface CosmicBlueprintProps {
    onTabChange: (tab: string) => void;
}

// Clay shadow helpers
const clayCard = '0 8px 32px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.07), inset 0 -2px 6px rgba(0,0,0,0.35)';
const clayPill = (r: number, g: number, b: number) =>
    `inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.35), 0 4px 12px rgba(${r},${g},${b},0.35), 0 1px 3px rgba(0,0,0,0.4)`;
const glowPill = (r: number, g: number, b: number) =>
    `0 0 18px rgba(${r},${g},${b},0.35), 0 0 40px rgba(${r},${g},${b},0.12), inset 0 1px 1px rgba(255,255,255,0.06), inset 0 -1px 3px rgba(0,0,0,0.3)`;

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

// Personal Year → Theme detail (desc + focus + watchFor) to balance against Life Path card
const PY_THEME: Record<number, { desc: string; focus: string; watchFor: string }> = {
    1: { desc: 'A year of fresh starts and bold independence. You are planting the seeds of a new nine-year chapter.', focus: 'Initiative, new ventures, self-trust', watchFor: 'Impatience, rushing outcomes' },
    2: { desc: 'A year of partnerships, patience, and quiet growth. Trust the process — real progress happens behind the scenes.', focus: 'Cooperation, diplomacy, inner knowing', watchFor: 'Over-giving, self-doubt' },
    3: { desc: 'A year of creative expansion and social magnetism. Your voice carries extra power to inspire and attract.', focus: 'Self-expression, joy, visibility', watchFor: 'Scattered energy, surface-level connections' },
    4: { desc: 'A year of building solid foundations. Discipline and structure now create lasting results for years to come.', focus: 'Planning, commitment, steady effort', watchFor: 'Rigidity, burnout from overwork' },
    5: { desc: 'A year of change, travel, and liberation. Expect the unexpected — freedom is your theme and your reward.', focus: 'Adaptability, risk-taking, exploration', watchFor: 'Restlessness, impulsive decisions' },
    6: { desc: 'A year centered on love, family, and responsibility. Your heart is the compass — follow it home.', focus: 'Nurturing, beauty, service to others', watchFor: 'Self-sacrifice, perfectionism' },
    7: { desc: 'A year of deep inner work and spiritual discovery. Solitude and reflection reveal wisdom you cannot rush.', focus: 'Introspection, study, spiritual growth', watchFor: 'Isolation, overthinking' },
    8: { desc: 'A year of power, abundance, and karmic reward. Your efforts are ripe for harvest — step into your authority.', focus: 'Financial growth, leadership, manifesting', watchFor: 'Materialism, control issues' },
    9: { desc: 'A year of completion, release, and compassionate closure. Let go of what no longer serves your highest path.', focus: 'Forgiveness, generosity, transformation', watchFor: 'Clinging to the past, emotional heaviness' },
    11: { desc: 'A master year of heightened intuition and spiritual awakening. You are a channel for inspiration and light.', focus: 'Vision, illumination, inspired action', watchFor: 'Nervous tension, spiritual bypassing' },
    22: { desc: 'A master builder year of extraordinary potential. Grand visions can become reality if you match ambition with discipline.', focus: 'Legacy projects, practical mastery, big goals', watchFor: 'Overwhelm, unrealistic expectations' },
    33: { desc: 'A master teacher year of selfless service and creative healing. Your gifts uplift everyone around you.', focus: 'Compassion, mentorship, spiritual mastery', watchFor: 'Martyrdom, emotional exhaustion' },
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
        grad: 'rgba(15,10,30, 0.85)',
        border: 'rgba(251,146,60,0.15)',
        labelColor: 'rgba(253,186,116,0.85)',
        valueColor: 'rgb(253,186,116)',
        shadow: glowPill(239, 68, 68),
        r: 239, g: 68, b: 68,
    },
    Earth: {
        grad: 'rgba(15,10,30, 0.85)',
        border: 'rgba(134,239,172,0.12)',
        labelColor: 'rgba(134,239,172,0.8)',
        valueColor: 'rgb(134,239,172)',
        shadow: glowPill(22, 163, 74),
        r: 22, g: 163, b: 74,
    },
    Air: {
        grad: 'rgba(15,10,30, 0.85)',
        border: 'rgba(147,197,253,0.12)',
        labelColor: 'rgba(147,197,253,0.8)',
        valueColor: 'rgb(147,197,253)',
        shadow: glowPill(59, 130, 246),
        r: 59, g: 130, b: 246,
    },
    Water: {
        grad: 'rgba(15,10,30, 0.85)',
        border: 'rgba(94,234,212,0.12)',
        labelColor: 'rgba(94,234,212,0.8)',
        valueColor: 'rgb(94,234,212)',
        shadow: glowPill(20, 184, 166),
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
        const cached = permanentCache.get('blueprint');
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
            permanentCache.set('blueprint', result);
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
                    position: 'relative',
                    background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
                    boxShadow: clayCard,
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                {/* Header */}
                <div className="p-5 pb-3">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="font-display text-[14px] text-altar-gold tracking-[3px] uppercase flex items-center gap-2">
                            <span className="inline-flex" style={{ width: 18, height: 18 }}>
                                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ stroke: 'var(--color-altar-gold)', strokeWidth: 1.2, fill: 'none' }}>
                                    <circle cx="10" cy="10" r="8" opacity={0.3} />
                                    <circle cx="10" cy="10" r="3" opacity={0.5} />
                                    <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
                                    <line x1="10" y1="16" x2="10" y2="19" strokeLinecap="round" />
                                    <line x1="1" y1="10" x2="4" y2="10" strokeLinecap="round" />
                                    <line x1="16" y1="10" x2="19" y2="10" strokeLinecap="round" />
                                </svg>
                            </span> Cosmic Blueprint
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
                            <span className="inline-flex items-center" style={{ width: 14, height: 14 }}>
                                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ fill: 'var(--color-altar-gold)', filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.4))' }}>
                                    <path d="M15 3c-4.5 1-7.5 5-7.5 9.5s3 7.5 7.5 8.5c-6 0-11-4.5-11-10S6 1 12 1c1 0 2.1.3 3 .7V3z" />
                                </svg>
                            </span>
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
                                {...(item.label === 'Sun' ? { 'data-coach': 'sun-sign' } : {})}
                                className="rounded-xl p-2.5 text-center transition-all duration-200 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] flex flex-col items-center justify-center"
                                style={{
                                    background: item.style.grad,
                                    boxShadow: item.style.shadow,
                                    border: `1px solid ${item.style.border}`,
                                    minHeight: '58px',
                                }}
                            >
                                <p className="text-[10px] font-display tracking-[2px] uppercase mb-0.5"
                                    style={{ color: item.style.labelColor, opacity: 1 }}>
                                    {item.label}
                                </p>
                                <p className="text-[13px] font-bold leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: item.style.valueColor }}>
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
                                background: 'linear-gradient(145deg, #22164d 0%, #170f38 100%)',
                                boxShadow: `${clayPill(109, 40, 217)}, 0 0 25px rgba(212,175,55,0.15), 0 0 50px rgba(212,175,55,0.08)`,
                                border: '1px solid rgba(167,139,250,0.25)',
                            }}
                        >
                            <p className="text-[10px] text-altar-gold font-display tracking-[2px] uppercase mb-1 flex items-center justify-between">
                                Life Path <span className="text-[10px] opacity-80">→</span>
                            </p>
                            <p className="text-sm text-violet-100 font-bold text-left">
                                #{lifePath} <span className="text-[10px] font-normal text-altar-gold">— {lifePathMeaning.title}</span>
                            </p>
                            <p className="text-[11px] text-violet-100/70 mt-1.5 leading-snug">
                                {lifePathMeaning.desc}
                            </p>
                            <div className="mt-2 flex flex-col gap-1">
                                <p className="text-[10px] text-violet-200/75 leading-snug">
                                    <span className="text-altar-gold">✦</span> {lifePathMeaning.strengths}
                                </p>
                                <p className="text-[10px] text-violet-200/75 leading-snug">
                                    <span className="text-altar-gold">⚡</span> {lifePathMeaning.challenges}
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
                                border: '1px solid rgba(167,139,250,0.25)',
                            }}
                        >
                            <p className="text-[10px] text-altar-gold font-display tracking-[2px] uppercase mb-1 flex items-center justify-between">
                                Personal Year <span className="text-[10px] opacity-80">→</span>
                            </p>
                            <p className="text-sm text-violet-100 font-bold">
                                #{personalYear} <span className="text-[10px] font-normal text-altar-gold">— {new Date().getFullYear()} Cycle</span>
                            </p>
                            {PY_THEME[personalYear] && (
                                <p className="text-[11px] text-violet-100/70 mt-1.5 leading-snug">
                                    {PY_THEME[personalYear].desc}
                                </p>
                            )}
                            {PY_THEME[personalYear] && (
                                <div className="mt-2 flex flex-col gap-1">
                                    <p className="text-[10px] text-violet-200/75 leading-snug">
                                        <span className="text-violet-200">✦</span> {PY_THEME[personalYear].focus}
                                    </p>
                                    <p className="text-[10px] text-violet-200/75 leading-snug">
                                        <span className="text-violet-200">⚡</span> {PY_THEME[personalYear].watchFor}
                                    </p>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Moon phase details moved to dedicated MoonScreen */}

                    {/* Sacred geometry divider */}
                    <div style={{ margin: '8px 20px 0', height: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent)' }} />
                        <svg width={14} height={14} viewBox="0 0 14 14" style={{ position: 'relative', zIndex: 1 }}>
                            <rect x={3.5} y={3.5} width={7} height={7} transform="rotate(45 7 7)" stroke="rgba(212,175,55,0.4)" strokeWidth={0.8} fill="rgba(212,175,55,0.06)" />
                            <circle cx={7} cy={7} r={1.5} fill="rgba(212,175,55,0.3)" />
                        </svg>
                    </div>

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
                                className="w-full relative overflow-hidden rounded-[20px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                    border: '2px solid rgba(212,175,55,0.6)',
                                    padding: '18px 24px',
                                    boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.35)',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    letterSpacing: '3.5px',
                                    textTransform: 'uppercase' as const,
                                    color: '#1a0f2e',
                                }}
                            >
                                {/* Shimmer sweep */}
                                <div className="absolute top-0 left-0 right-0 bottom-0" style={{
                                    width: '200%',
                                    background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                                    animation: 'shimmer-sweep 3.5s ease-in-out infinite',
                                }} />
                                <span className="inline-flex relative z-10" style={{ width: 18, height: 18 }}>
                                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ stroke: '#1a0f2e', strokeWidth: 1.2, fill: 'none' }}>
                                        <circle cx={10} cy={10} r={7} opacity={0.4} />
                                        <circle cx={10} cy={10} r={2.5} opacity={0.6} />
                                        <line x1={10} y1={2} x2={10} y2={5} strokeLinecap="round" />
                                        <line x1={10} y1={15} x2={10} y2={18} strokeLinecap="round" />
                                        <line x1={2} y1={10} x2={5} y2={10} strokeLinecap="round" />
                                        <line x1={15} y1={10} x2={18} y2={10} strokeLinecap="round" />
                                    </svg>
                                </span>
                                <span className="relative z-10">Reveal Your Blueprint</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Dream Journal Shortcut (outside card, tightened gap) ── */}
            <div style={{ margin: '4px 0 0' }}>
                <button
                    data-coach="dream-journal"
                    onClick={() => onTabChange('journal')}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all hover:bg-white/[0.04] active:scale-[0.98] group"
                    style={{ background: 'rgba(35,20,60,0.5)', border: '1px solid rgba(212,175,55,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                >
                    <span className="flex items-center gap-2.5 text-[14px] font-display italic" style={{ color: 'rgba(212,175,55,0.75)' }}>
                        <span className="inline-flex items-center" style={{ width: 18, height: 18 }}>
                            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ stroke: 'var(--color-altar-gold)', strokeWidth: 1.3, fill: 'none', filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}>
                                <path d="M15 3c-4 1-6.5 4.5-6.5 8.5s2.5 6.5 6.5 7.5c-5 0-9.5-4-9.5-8.5S6.5 2 11.5 1c1 0 2.3.4 3.5 1V3z" strokeLinejoin="round" />
                                <circle cx="14" cy="6" r="0.8" fill="var(--color-altar-gold)" stroke="none" opacity="0.5" />
                                <circle cx="16" cy="9" r="0.5" fill="var(--color-altar-gold)" stroke="none" opacity="0.3" />
                            </svg>
                        </span>
                        Dream Journal
                    </span>
                    <span className="text-[11px] text-altar-gold/40 group-hover:text-altar-gold/60 transition-colors font-display">Write →</span>
                </button>
            </div>
        </div>
    );
}
