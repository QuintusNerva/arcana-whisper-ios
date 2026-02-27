/**
 * CareerAlignment — Archetype-based career reading.
 * Sun + Moon + Rising + Life Path → structured JSON reading.
 */

import React from 'react';
import { AIService, dailyCache } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import {
    getBirthData,
    getNatalTriad,
    getLifePathNumber,
    getPersonalYearNumber,
} from '../services/astrology.service';
import { BottomNav } from './BottomNav';

interface CareerAlignmentProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
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

// ── Gradient per element ────────────────────────────────────────

function elementGradient(element: string) {
    switch (element.toLowerCase()) {
        case 'fire': return 'linear-gradient(135deg, rgba(180,50,0,0.15) 0%, rgba(240,100,20,0.08) 100%)';
        case 'earth': return 'linear-gradient(135deg, rgba(40,100,30,0.15) 0%, rgba(80,140,50,0.08) 100%)';
        case 'air': return 'linear-gradient(135deg, rgba(30,100,180,0.15) 0%, rgba(80,160,220,0.08) 100%)';
        case 'water': return 'linear-gradient(135deg, rgba(20,60,160,0.15) 0%, rgba(80,120,220,0.08) 100%)';
        default: return 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(160,120,20,0.06) 100%)';
    }
}

function elementAccent(element: string) {
    switch (element.toLowerCase()) {
        case 'fire': return '#f97316';
        case 'earth': return '#86efac';
        case 'air': return '#93c5fd';
        case 'water': return '#818cf8';
        default: return '#d4af37';
    }
}

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

export function CareerAlignment({ onClose, onTabChange }: CareerAlignmentProps) {
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
        const cached = dailyCache.get(CACHE_KEY);
        if (cached) {
            try {
                setReading(JSON.parse(cached));
                setUnlocked(true);
            } catch { /* proceed without cache */ }
        }
    }, []);

    async function handleGetReading() {
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
            dailyCache.set(CACHE_KEY, JSON.stringify(parsed));
            setReading(parsed);
            setUnlocked(true);
        } catch (e: any) {
            setError(e?.message?.includes('JSON') ? 'Unexpected response — try again.' : (e?.message || 'Something went wrong.'));
        } finally {
            setLoading(false);
        }
    }

    const accent = triad ? elementAccent(triad.sun.element) : '#d4af37';
    const gradBg = triad ? elementGradient(triad.sun.element) : elementGradient('');
    const glyph = triad ? elementGlyph(triad.sun.element) : '✦';

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">

                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">
                            ← Altar
                        </button>
                        <h1 className="font-display text-sm tracking-[4px] text-altar-gold">CAREER ALIGNMENT</h1>
                        <div className="w-14" />
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4 pb-28">

                    {/* No birth data */}
                    {!birthData && (
                        <div className="text-center mt-16 px-4">
                            <div className="text-4xl mb-4">💼</div>
                            <h2 className="font-display text-lg text-altar-gold tracking-[3px] mb-3">ADD YOUR BIRTH DATA</h2>
                            <p className="text-sm text-altar-muted leading-relaxed mb-5">
                                Your career alignment reading is calculated from your natal chart. Add your birth date in your profile to unlock it.
                            </p>
                            <button
                                onClick={() => onTabChange('natal')}
                                className="px-6 py-3 rounded-full font-display text-sm tracking-[2px] text-altar-gold border border-altar-gold/30 hover:bg-altar-gold/10 transition-all"
                            >
                                → Set Up Natal Chart
                            </button>
                        </div>
                    )}

                    {birthData && triad && lifePath && (
                        <div className="animate-fade-up space-y-4 mt-5">

                            {/* Hero Archetype Card */}
                            <div
                                className="relative rounded-3xl overflow-hidden border p-6 text-center"
                                style={{
                                    background: gradBg,
                                    borderColor: `${accent}30`,
                                    boxShadow: `0 0 60px ${accent}10`,
                                }}
                            >
                                {/* Background glow */}
                                <div
                                    className="absolute inset-0 blur-[80px] pointer-events-none"
                                    style={{ background: `radial-gradient(ellipse at 50% 50%, ${accent}15, transparent 70%)` }}
                                />

                                {/* Glyph */}
                                <div className="relative text-4xl mb-3" style={{ filter: `drop-shadow(0 0 20px ${accent}60)` }}>
                                    {glyph}
                                </div>

                                {/* Archetype name */}
                                <div className="relative">
                                    <p className="text-[9px] font-display tracking-[3px] uppercase mb-1" style={{ color: `${accent}80` }}>
                                        Your Career Archetype
                                    </p>
                                    <h2
                                        className="font-display text-2xl font-bold mb-2"
                                        style={{ color: accent, textShadow: `0 0 30px ${accent}50` }}
                                    >
                                        {reading?.archetypeName || preview?.name || '— Unknown —'}
                                    </h2>
                                    <p className="text-sm text-altar-text/80 leading-relaxed italic">
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
                                            className="rounded-full px-3 py-1.5 border flex items-center gap-1.5 text-[10px] font-display tracking-wide"
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                borderColor: `${accent}20`,
                                                color: 'rgba(255,255,255,0.65)',
                                            }}
                                        >
                                            <span>{p.glyph}</span>
                                            <span className="text-white/40">{p.label}</span>
                                            <span>{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Unlock CTA — if no reading yet */}
                            {!unlocked && !loading && (
                                <div className="glass-strong rounded-2xl p-5 text-center border border-white/5">
                                    <p className="text-xs text-altar-text/60 leading-relaxed mb-4">
                                        Your static archetype is shown above. Get your full reading — work style, where you thrive, what drains you, and the question to unlock your next chapter.
                                    </p>
                                    {error && (
                                        <p className="text-[11px] text-red-400/80 mb-3 leading-relaxed">{error}</p>
                                    )}
                                    <button
                                        onClick={handleGetReading}
                                        className="w-full py-3.5 rounded-xl font-display tracking-[2px] text-sm transition-all"
                                        style={{
                                            background: `linear-gradient(135deg, ${accent}30, ${accent}15)`,
                                            border: `1px solid ${accent}40`,
                                            color: accent,
                                        }}
                                    >
                                        ✦ Reveal Full Reading
                                    </button>
                                </div>
                            )}

                            {/* Loading skeleton */}
                            {loading && (
                                <div className="glass-strong rounded-2xl p-5 space-y-3 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-3 h-3 border-2 border-altar-gold/30 border-t-altar-gold rounded-full animate-spin" />
                                        <span className="text-[10px] font-display tracking-[2px] text-altar-gold/50 uppercase">Consulting the stars…</span>
                                    </div>
                                    {[100, 90, 75, 85, 60].map((w, i) => (
                                        <div key={i} className={`h-3 shimmer-skeleton`} style={{ width: `${w}%` }} />
                                    ))}
                                </div>
                            )}

                            {/* Full reading — shown once unlocked */}
                            {unlocked && reading && (
                                <>
                                    {/* Work Style */}
                                    <div
                                        className="rounded-2xl p-5 border"
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            borderColor: `${accent}18`,
                                        }}
                                    >
                                        <h3 className="font-display text-[10px] tracking-[3px] uppercase mb-3 flex items-center gap-1.5" style={{ color: `${accent}80` }}>
                                            <span>{glyph}</span> How You Work Best
                                        </h3>
                                        <AIResponseRenderer text={reading.workStyle} />
                                    </div>

                                    {/* Thrive + Struggle grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl p-4 border" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.15)' }}>
                                            <p className="text-[9px] font-display text-green-400/70 tracking-[2px] uppercase mb-3">✦ You Thrive When</p>
                                            <ul className="space-y-1.5">
                                                {reading.thrive.map((item, i) => (
                                                    <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1.5">
                                                        <span className="text-green-400/50 shrink-0 mt-0.5">·</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="rounded-2xl p-4 border" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.12)' }}>
                                            <p className="text-[9px] font-display text-red-400/70 tracking-[2px] uppercase mb-3">✦ You Struggle With</p>
                                            <ul className="space-y-1.5">
                                                {reading.struggle.map((item, i) => (
                                                    <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1.5">
                                                        <span className="text-red-400/40 shrink-0 mt-0.5">·</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Blind Spot */}
                                    <div
                                        className="rounded-2xl p-5 border"
                                        style={{
                                            background: 'rgba(251,191,36,0.04)',
                                            borderColor: 'rgba(251,191,36,0.15)',
                                        }}
                                    >
                                        <p className="text-[9px] font-display tracking-[2px] uppercase mb-2 text-amber-400/70">⚡ The Blind Spot</p>
                                        <AIResponseRenderer text={reading.blindSpot} compact />
                                    </div>

                                    {/* Closing Question */}
                                    <div
                                        className="rounded-2xl p-6 border text-center"
                                        style={{
                                            background: `linear-gradient(135deg, ${accent}08, transparent)`,
                                            borderColor: `${accent}20`,
                                        }}
                                    >
                                        <p className="text-[9px] font-display tracking-[2px] uppercase mb-3" style={{ color: `${accent}60` }}>
                                            ✦ The Question to Sit With
                                        </p>
                                        <p
                                            className="text-sm leading-relaxed italic"
                                            style={{ color: `${accent}90` }}
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
                                        className="w-full text-center text-[10px] text-altar-muted/40 hover:text-altar-muted/70 transition-colors py-2 font-display tracking-wide"
                                    >
                                        Regenerate reading
                                    </button>
                                </>
                            )}

                            {/* Coaching upsell */}
                            <div className="rounded-2xl p-5 border border-dashed border-white/10 text-center mt-2">
                                <p className="text-[9px] font-display text-altar-gold/40 tracking-[2px] uppercase mb-2">✦ Go Deeper</p>
                                <p className="text-[11px] text-altar-muted/60 leading-relaxed">
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
