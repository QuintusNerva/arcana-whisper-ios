/**
 * CareerAlignment — Archetype-based career reading.
 * Sun + Moon + Rising + Life Path → structured JSON reading.
 */

import React from 'react';
import { AIService, permanentCache } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import {
    getBirthData,
    getNatalTriad,
    getLifePathNumber,
    getPersonalYearNumber,
} from '../services/astrology.service';
import { BottomNav } from './BottomNav';
import { PageHeader } from './PageHeader';

interface CareerAlignmentProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
}

interface CareerReading {
    archetypeName: string;
    archetypeTagline: string;
    workStyle: string;
    thrive: string[];
    struggle: string[];
    blindSpot: string;
    theQuestion: string;
}

// ── Static archetype preview — no API key required ──────────────

const SUN_ARCHETYPE_PREVIEW: Record<string, { name: string; tagline: string }> = {
    aries: { name: 'The Pioneer', tagline: 'You build what others are still imagining.' },
    taurus: { name: 'The Sovereign Builder', tagline: 'You outlast every trend because you build to last.' },
    gemini: { name: 'The Translator', tagline: 'You make complex things feel obvious.' },
    cancer: { name: 'The Anchor', tagline: 'People do their best work when you\'re in their orbit.' },
    leo: { name: 'The Catalyst', tagline: 'Rooms change when you walk into them.' },
    virgo: { name: 'The Architect', tagline: 'Nothing gets past you — and that\'s the point.' },
    libra: { name: 'The Strategist', tagline: 'You see the deal before anyone else knows there\'s a table.' },
    scorpio: { name: 'The Depth Operator', tagline: 'You do your best work in the spaces others are afraid of.' },
    sagittarius: { name: 'The Visionary', tagline: 'You see where things are going before the data does.' },
    capricorn: { name: 'The Mountain Climber', tagline: 'You earn everything — and keep everything you earn.' },
    aquarius: { name: 'The Systems Rebel', tagline: 'You break what needs breaking and build what comes next.' },
    pisces: { name: 'The Creative Oracle', tagline: 'Your instincts are always three moves ahead.' },
};

// ── Element glyph ────────────────────────────────────────────────

function elementGlyph(element: string) {
    switch (element.toLowerCase()) {
        case 'fire': return '🔥';
        case 'earth': return '🌿';
        case 'air': return '💨';
        case 'water': return '🌊';
        default: return '✦';
    }
}

// ── Component ─────────────────────────────────────────────────────

export function CareerAlignment({ onClose, onTabChange, subscription, onShowPremium }: CareerAlignmentProps) {
    const birthData = getBirthData();
    const triad = birthData ? getNatalTriad(birthData) : null;
    const lifePath = birthData ? getLifePathNumber(birthData.birthday) : null;
    const personalYear = birthData ? getPersonalYearNumber(birthData.birthday) : null;

    const [reading, setReading] = React.useState<CareerReading | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [unlocked, setUnlocked] = React.useState(false);

    // Static preview always available
    const sunId = triad?.sun?.id || '';
    const preview = SUN_ARCHETYPE_PREVIEW[sunId];

    const CACHE_KEY = `career_alignment_${sunId}_${lifePath}`;

    React.useEffect(() => {
        const cached = permanentCache.get(CACHE_KEY);
        if (cached) {
            try {
                setReading(JSON.parse(cached));
                setUnlocked(true);
            } catch { /* proceed without cache */ }
        }
    }, []);

    async function handleGetReading() {
        if (subscription !== 'premium') {
            onShowPremium();
            return;
        }
        if (!triad || !lifePath) return;
        setLoading(true);
        setError(null);
        try {
            const ai = new AIService();
            if (!ai.hasApiKey()) {
                setError('Add your OpenRouter API key in Settings to unlock your full reading.');
                setLoading(false);
                return;
            }
            const raw = await ai.getCareerAlignment({
                sun: triad.sun.name,
                moon: triad.moon.name,
                rising: triad.rising.name,
                sunElement: triad.sun.element,
                lifePath,
                personalYear: personalYear ?? undefined,
            });

            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Invalid AI response format');

            const parsed: CareerReading = JSON.parse(jsonMatch[0]);
            permanentCache.set(CACHE_KEY, JSON.stringify(parsed));
            setReading(parsed);
            setUnlocked(true);
        } catch (e: any) {
            setError(e?.message?.includes('JSON') ? 'Unexpected response — try again.' : (e?.message || 'Something went wrong.'));
        } finally {
            setLoading(false);
        }
    }

    const glyph = triad ? elementGlyph(triad.sun.element) : '✦';

    /* ── Sacred Fintech design system styles ── */
    const primaryCardStyle: React.CSSProperties = {
        background: 'linear-gradient(135deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
    };

    const goldCardStyle: React.CSSProperties = {
        background: 'linear-gradient(135deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
        border: '1px solid var(--color-gold-glow-med)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.08)',
    };

    const insetStyle: React.CSSProperties = {
        background: 'rgba(18,2,36,0.6)',
        border: '1px solid rgba(255,255,255,0.05)',
    };

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">

                {/* Header */}
                <PageHeader title="CAREER ALIGNMENT" onClose={onClose} titleSize="sm" />

                <div className="max-w-[500px] mx-auto px-4 pb-28">

                    {/* No birth data */}
                    {!birthData && (
                        <div className="text-center mt-16 px-4">
                            <div className="text-4xl mb-4">💼</div>
                            <h2 className="font-display text-lg tracking-[3px] mb-3" style={{ color: 'var(--color-gold-100)' }}>ADD YOUR BIRTH DATA</h2>
                            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                                Your career alignment reading is calculated from your natal chart. Add your birth date in your profile to unlock it.
                            </p>
                            <button
                                onClick={() => onTabChange('natal')}
                                className="px-6 py-3 rounded-full font-display text-sm tracking-[2px] transition-all active:scale-[0.97]"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(180,140,20,0.15))',
                                    border: '1px solid var(--color-gold-glow-med)',
                                    color: 'var(--color-gold-100)',
                                    boxShadow: '0 0 20px rgba(212,175,55,0.1)',
                                }}
                            >
                                → Set Up Natal Chart
                            </button>
                        </div>
                    )}

                    {birthData && triad && lifePath && (
                        <div className="animate-fade-up space-y-4 mt-5">

                            {/* Hero Archetype Card */}
                            <div
                                className="relative rounded-[2rem] overflow-hidden p-6 text-center"
                                style={{
                                    ...goldCardStyle,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 30px rgba(212,175,55,0.1)',
                                }}
                            >
                                {/* Background glow */}
                                <div
                                    className="absolute inset-0 blur-[80px] pointer-events-none"
                                    style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.08), transparent 70%)' }}
                                />

                                {/* Glyph */}
                                <div className="relative text-4xl mb-3" style={{ filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.4))' }}>
                                    {glyph}
                                </div>

                                {/* Archetype name */}
                                <div className="relative">
                                    <p className="text-[9px] font-display tracking-[3px] uppercase mb-1" style={{ color: 'var(--color-gold-200)' }}>
                                        Your Career Archetype
                                    </p>
                                    <h2
                                        className="font-display text-2xl font-bold mb-2"
                                        style={{ color: 'var(--color-gold-100)', textShadow: '0 0 30px rgba(212,175,55,0.3)' }}
                                    >
                                        {reading?.archetypeName || preview?.name || '— Unknown —'}
                                    </h2>
                                    <p className="text-sm leading-relaxed italic" style={{ color: 'rgba(226,232,240,0.8)', fontFamily: 'var(--font-body)' }}>
                                        {reading?.archetypeTagline || preview?.tagline}
                                    </p>
                                </div>

                                {/* Triad pills */}
                                <div className="relative flex flex-wrap justify-center gap-2 mt-4">
                                    {[
                                        { label: 'Sun', value: triad.sun.name, glyph: '☀️' },
                                        { label: 'Moon', value: triad.moon.name, glyph: '🌙' },
                                        { label: 'Rising', value: triad.rising.name, glyph: '⬆' },
                                        { label: 'Life Path', value: String(lifePath), glyph: '🔢' },
                                    ].map(p => (
                                        <div
                                            key={p.label}
                                            className="px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-display tracking-wide rounded-full"
                                            style={{
                                                background: 'rgba(212,175,55,0.08)',
                                                border: '1px solid var(--color-gold-glow-med)',
                                                color: 'rgba(226,232,240,0.7)',
                                            }}
                                        >
                                            <span>{p.glyph}</span>
                                            <span style={{ color: 'var(--color-altar-muted)' }}>{p.label}</span>
                                            <span>{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Unlock CTA — if no reading yet */}
                            {!unlocked && !loading && (
                                <div className="rounded-3xl p-5 text-center" style={primaryCardStyle}>
                                    <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(226,232,240,0.6)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                                        Your static archetype is shown above. Get your full reading — work style, where you thrive, what drains you, and the question to unlock your next chapter.
                                    </p>
                                    {error && (
                                        <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'rgba(248,113,113,0.8)' }}>{error}</p>
                                    )}
                                    <button
                                        onClick={handleGetReading}
                                        className="w-full relative overflow-hidden py-4 rounded-xl font-display tracking-[2px] text-sm transition-all active:scale-[0.97] gold-shimmer"
                                        style={{
                                            background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                            border: '2px solid rgba(212,175,55,0.6)',
                                            color: '#1a0f2e',
                                            fontWeight: 800,
                                            boxShadow: '0 2px 0 #8a6914, 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                                        }}
                                    >
                                        ✦ Reveal Full Reading
                                    </button>
                                </div>
                            )}

                            {/* Loading skeleton */}
                            {loading && (
                                <div className="rounded-3xl p-5 space-y-3" style={primaryCardStyle}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-3 h-3 rounded-full animate-spin" style={{ border: '2px solid rgba(212,175,55,0.3)', borderTopColor: 'var(--color-gold-200)' }} />
                                        <span className="text-[10px] font-display tracking-[2px] uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Consulting the stars…</span>
                                    </div>
                                    {[100, 90, 75, 85, 60].map((w, i) => (
                                        <div key={i} className="h-3 shimmer-skeleton" style={{ width: `${w}%` }} />
                                    ))}
                                </div>
                            )}

                            {/* Full reading — shown once unlocked */}
                            {unlocked && reading && (
                                <>
                                    {/* Work Style */}
                                    <div className="rounded-3xl p-5" style={primaryCardStyle}>
                                        <h3 className="font-display text-[10px] tracking-[3px] uppercase mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-gold-200)' }}>
                                            <span>{glyph}</span> How You Work Best
                                        </h3>
                                        <AIResponseRenderer text={reading.workStyle} />
                                    </div>

                                    {/* Thrive + Struggle grid — border-only accents */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl p-4" style={{ ...insetStyle, border: '1px solid rgba(74,222,128,0.25)' }}>
                                            <p className="text-[9px] font-display tracking-[2px] uppercase mb-3" style={{ color: 'rgba(74,222,128,0.7)' }}>✦ You Thrive When</p>
                                            <ul className="space-y-1.5">
                                                {reading.thrive.map((item, i) => (
                                                    <li key={i} className="text-[11px] leading-snug flex gap-1.5" style={{ color: 'rgba(226,232,240,0.8)' }}>
                                                        <span className="shrink-0 mt-0.5" style={{ color: 'rgba(74,222,128,0.5)' }}>·</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="rounded-2xl p-4" style={{ ...insetStyle, border: '1px solid rgba(248,113,113,0.25)' }}>
                                            <p className="text-[9px] font-display tracking-[2px] uppercase mb-3" style={{ color: 'rgba(248,113,113,0.7)' }}>✦ You Struggle With</p>
                                            <ul className="space-y-1.5">
                                                {reading.struggle.map((item, i) => (
                                                    <li key={i} className="text-[11px] leading-snug flex gap-1.5" style={{ color: 'rgba(226,232,240,0.8)' }}>
                                                        <span className="shrink-0 mt-0.5" style={{ color: 'rgba(248,113,113,0.4)' }}>·</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Blind Spot */}
                                    <div className="rounded-3xl p-5" style={{ ...primaryCardStyle, border: '1px solid rgba(251,191,36,0.2)' }}>
                                        <p className="text-[9px] font-display tracking-[2px] uppercase mb-2" style={{ color: 'rgba(251,191,36,0.7)' }}>⚡ The Blind Spot</p>
                                        <AIResponseRenderer text={reading.blindSpot} compact />
                                    </div>

                                    {/* Closing Question */}
                                    <div
                                        className="rounded-3xl p-6 text-center"
                                        style={{
                                            ...goldCardStyle,
                                        }}
                                    >
                                        <p className="text-[9px] font-display tracking-[2px] uppercase mb-3" style={{ color: 'var(--color-gold-200)' }}>
                                            ✦ The Question to Sit With
                                        </p>
                                        <p
                                            className="text-sm leading-relaxed italic"
                                            style={{ color: 'var(--color-gold-100)', fontFamily: 'var(--font-body)' }}
                                        >
                                            {reading.theQuestion}
                                        </p>
                                    </div>

                                    {/* Refresh */}
                                    <button
                                        onClick={() => {
                                            setReading(null);
                                            setUnlocked(false);
                                        }}
                                        className="w-full text-center text-[10px] hover:text-altar-muted/70 transition-colors py-2 font-display tracking-wide"
                                        style={{ color: 'rgba(226,232,240,0.3)' }}
                                    >
                                        Regenerate reading
                                    </button>
                                </>
                            )}

                            {/* Coaching upsell */}
                            <div className="rounded-2xl p-5 text-center mt-2" style={insetStyle}>
                                <p className="text-[9px] font-display tracking-[2px] uppercase mb-2" style={{ color: 'var(--color-gold-200)' }}>✦ Go Deeper</p>
                                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                                    Share this reading with a career coach or mentor to turn cosmic insight into a concrete plan.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab="home" onTabChange={onTabChange} />
        </div>
    );
}
