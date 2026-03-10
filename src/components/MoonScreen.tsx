/**
 * MoonScreen — Dedicated full-screen Moon page
 * Opened from the moon phase indicator pill on the Cosmic Blueprint card.
 *
 * Features a circular phase wheel showing all 8 moon phases,
 * with the current phase highlighted in the center, plus
 * ritual details, reflections, and upcoming dates.
 */

import React from 'react';
import { BottomNav } from './BottomNav';
import { PageHeader } from './PageHeader';

// ── Lunar calendar helpers ─────────────────────────────────────────────────

const KNOWN_NEW_MOON = new Date('2025-01-06T00:00:00Z').getTime();
const LUNAR_CYCLE = 29.530589;
const MS_PER_DAY = 86400000;

interface LunarPhase {
    name: string;
    emoji: string;
    startDay: number;
    length: number;
    guidance: string;
    ritual: string;
    intention: string;
}

const LUNAR_PHASES: LunarPhase[] = [
    {
        name: 'New Moon', emoji: '🌑', startDay: 0, length: 3.7,
        guidance: 'The slate is clear. Plant your seeds.',
        ritual: 'Write your "I am calling in..." declaration. Light a candle. Speak it aloud three times with conviction. Then release the outcome — the universe heard you.',
        intention: 'Begin with total clarity. No half-intentions tonight.',
    },
    {
        name: 'Waxing Crescent', emoji: '🌒', startDay: 3.7, length: 3.7,
        guidance: 'Take one small, concrete step forward.',
        ritual: 'Identify the single most aligned action you can take today toward your intention. Do it — no matter how small. Small moves in the right direction carry exponential energy now.',
        intention: 'What\'s the one step that\'s been waiting to be taken?',
    },
    {
        name: 'First Quarter', emoji: '🌓', startDay: 7.38, length: 1.85,
        guidance: 'Obstacles arise. Act with courage.',
        ritual: 'Name the thing you\'ve been avoiding. Do it today. The First Quarter tests your commitment — passing this test accelerates everything.',
        intention: 'What would I do if I wasn\'t afraid?',
    },
    {
        name: 'Waxing Gibbous', emoji: '🌔', startDay: 9.22, length: 5.54,
        guidance: 'Amplify and affirm. Momentum is building.',
        ritual: 'Daily affirmation: "I am grateful that [your declaration] is already making its way to me." Feel this as fact, not hope. Gratitude is the most powerful amplifier.',
        intention: 'Feel it as if it\'s already done.',
    },
    {
        name: 'Full Moon', emoji: '🌕', startDay: 14.76, length: 1.85,
        guidance: 'Celebrate what\'s coming. Release what\'s blocking.',
        ritual: 'Write on paper what you are releasing — fear, doubt, old patterns. Burn or tear it with intention. Then stand in the moonlight (or near a window) and say: "I release this. I make space for what\'s mine."',
        intention: 'What am I releasing to make space for what I\'m calling in?',
    },
    {
        name: 'Waning Gibbous', emoji: '🌖', startDay: 16.61, length: 5.54,
        guidance: 'Integrate and look for signs.',
        ritual: 'Review your manifestation. Look for evidence — synchronicities, doors opening, conversations. Write 3 signs you\'ve seen. Gratitude for signs accelerates more signs.',
        intention: 'What evidence is already here that I haven\'t fully acknowledged?',
    },
    {
        name: 'Last Quarter', emoji: '🌗', startDay: 22.15, length: 1.85,
        guidance: 'Release deeply. Let go of control.',
        ritual: '7-breath practice: Breathe in your intention fully. Breathe out any attachment to HOW it arrives. Seven slow breaths. Surrender is not giving up — it\'s trusting.',
        intention: 'I hold the vision. I release the path.',
    },
    {
        name: 'Waning Crescent', emoji: '🌘', startDay: 24.0, length: 5.53,
        guidance: 'Rest. A new cycle is almost here.',
        ritual: '5 minutes of silence. No phone, no music. Ask inwardly: what does my soul most want to call in next? Let the answer come — don\'t force it. The next New Moon is approaching.',
        intention: 'What wants to be born in the next cycle?',
    },
];

function getLunarData() {
    const daysSince = (Date.now() - KNOWN_NEW_MOON) / MS_PER_DAY;
    const currentPos = ((daysSince % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
    const currentPhase = LUNAR_PHASES.find(p => currentPos >= p.startDay && currentPos < p.startDay + p.length) ?? LUNAR_PHASES[7];
    const currentIndex = LUNAR_PHASES.indexOf(currentPhase);
    const daysIntoPhase = currentPos - currentPhase.startDay;
    const daysRemainingInPhase = Math.max(1, Math.ceil(currentPhase.length - daysIntoPhase));

    // Progress through current cycle (0-1)
    const cycleProgress = currentPos / LUNAR_CYCLE;

    // Compute next 4 key phase dates
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
        return {
            name: kp.name,
            emoji: kp.emoji,
            date,
            daysUntil: Math.ceil(daysUntil),
            dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    return { currentPhase, currentIndex, daysRemainingInPhase, currentPos, cycleProgress, upcoming };
}

// ── Props ──────────────────────────────────────────────────────────────────

interface MoonScreenProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

// ── Phase Wheel Component ──────────────────────────────────────────────────

function PhaseWheel({ currentIndex }: { currentIndex: number }) {
    // Positions for 8 phases around a circle (top = New Moon)
    // Arranged clockwise: New Moon (top), Waxing Crescent, First Quarter, Waxing Gibbous,
    // Full Moon (bottom), Waning Gibbous, Last Quarter, Waning Crescent
    const WHEEL_SIZE = 400;
    const RADIUS = 160;
    const CENTER = WHEEL_SIZE / 2;

    return (
        <div
            className="relative mx-auto"
            style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
        >
            {/* Orbit ring */}
            <div
                className="absolute rounded-full"
                style={{
                    top: CENTER - RADIUS,
                    left: CENTER - RADIUS,
                    width: RADIUS * 2,
                    height: RADIUS * 2,
                    border: '1px solid rgba(212,175,55,0.15)',
                    boxShadow: '0 0 20px rgba(212,175,55,0.05), inset 0 0 20px rgba(212,175,55,0.03)',
                }}
            />

            {/* Progress arc — shows how far through the cycle */}
            <svg
                className="absolute"
                style={{ top: CENTER - RADIUS, left: CENTER - RADIUS }}
                width={RADIUS * 2}
                height={RADIUS * 2}
                viewBox={`0 0 ${RADIUS * 2} ${RADIUS * 2}`}
            >
                <circle
                    cx={RADIUS}
                    cy={RADIUS}
                    r={RADIUS - 1}
                    fill="none"
                    stroke="rgba(212,175,55,0.25)"
                    strokeWidth="2"
                    strokeDasharray={`${(currentIndex / 8) * 2 * Math.PI * (RADIUS - 1)} ${2 * Math.PI * (RADIUS - 1)}`}
                    strokeDashoffset={-Math.PI / 2 * (RADIUS - 1)}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${RADIUS} ${RADIUS})`}
                />
            </svg>

            {/* Phase nodes around the circle */}
            {LUNAR_PHASES.map((phase, i) => {
                const angle = (i / 8) * 2 * Math.PI - Math.PI / 2; // start from top
                const x = CENTER + RADIUS * Math.cos(angle);
                const y = CENTER + RADIUS * Math.sin(angle);
                const isCurrent = i === currentIndex;

                // Label positions — push labels outward from circle
                const labelRadius = RADIUS + 52;
                const labelX = CENTER + labelRadius * Math.cos(angle);
                const labelY = CENTER + labelRadius * Math.sin(angle);

                return (
                    <React.Fragment key={i}>
                        {/* Phase emoji node */}
                        <div
                            className="absolute flex items-center justify-center transition-all duration-500"
                            style={{
                                left: x,
                                top: y,
                                width: isCurrent ? 44 : 32,
                                height: isCurrent ? 44 : 32,
                                transform: 'translate(-50%, -50%)',
                                borderRadius: '50%',
                                background: isCurrent
                                    ? 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)'
                                    : 'rgba(255,255,255,0.04)',
                                border: isCurrent
                                    ? '2px solid rgba(212,175,55,0.5)'
                                    : '1px solid rgba(255,255,255,0.08)',
                                boxShadow: isCurrent
                                    ? '0 0 20px rgba(212,175,55,0.3), 0 0 40px rgba(212,175,55,0.1)'
                                    : 'none',
                                zIndex: isCurrent ? 10 : 1,
                                fontSize: isCurrent ? '22px' : '16px',
                            }}
                        >
                            {phase.emoji}
                        </div>

                        {/* Phase label */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                left: labelX,
                                top: labelY,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 5,
                            }}
                        >
                            <p className={`text-center whitespace-nowrap font-display tracking-wider ${isCurrent ? 'text-[10px] text-altar-gold font-semibold' : 'text-[8px] text-violet-200/80'}`}>
                                {phase.name}
                            </p>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Center — current phase info */}
            <div
                className="absolute flex flex-col items-center justify-center"
                style={{
                    left: CENTER,
                    top: CENTER,
                    transform: 'translate(-50%, -50%)',
                    width: RADIUS * 1.2,
                    height: RADIUS * 1.2,
                }}
            >
                <span className="text-5xl mb-1 animate-float">{LUNAR_PHASES[currentIndex].emoji}</span>
                <p className="font-display text-sm text-altar-gold tracking-[2px] text-center">
                    {LUNAR_PHASES[currentIndex].name}
                </p>
                <p className="text-[10px] text-altar-muted/70 italic text-center mt-1 max-w-[140px] leading-snug">
                    {LUNAR_PHASES[currentIndex].guidance}
                </p>
            </div>
        </div>
    );
}

// ── Main MoonScreen ────────────────────────────────────────────────────────

export function MoonScreen({ onClose, onTabChange }: MoonScreenProps) {
    const lunarData = React.useMemo(() => getLunarData(), []);

    return (
        <>
            <div className="page-frame">
                <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                    <PageHeader title="MOON" onClose={onClose} titleSize="lg" />

                    <div className="max-w-[500px] mx-auto px-4">
                        {/* Hero */}
                        <div className="text-center mt-2 mb-3 animate-fade-up">
                            <p className="text-[10px] text-altar-muted/60 font-display tracking-[3px] uppercase">
                                Lunar Cycle
                            </p>
                        </div>

                        {/* Circular Phase Wheel */}
                        <div className="animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                            <PhaseWheel currentIndex={lunarData.currentIndex} />
                        </div>

                        {/* Days remaining pill */}
                        <div className="flex justify-center mt-8 mb-5 animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                            <div
                                className="px-4 py-1.5 rounded-full"
                                style={{
                                    background: 'rgba(212,175,55,0.08)',
                                    border: '1px solid rgba(212,175,55,0.18)',
                                    boxShadow: '0 0 15px rgba(212,175,55,0.05)',
                                }}
                            >
                                <p className="text-[10px] text-altar-gold/80 font-display tracking-wider">
                                    {lunarData.daysRemainingInPhase} day{lunarData.daysRemainingInPhase !== 1 ? 's' : ''} remaining in this phase
                                </p>
                            </div>
                        </div>

                        {/* Today's Ritual */}
                        <div className="animate-fade-up space-y-3" style={{ animationDelay: '0.2s', opacity: 0 }}>
                            <div
                                className="rounded-3xl p-5"
                                style={{
                                    background: 'linear-gradient(145deg, rgba(99,40,217,0.1) 0%, rgba(13,6,24,0.9) 100%)',
                                    border: '1px solid rgba(167,139,250,0.15)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)',
                                }}
                            >
                                <p className="text-[9px] text-violet-400/60 font-display tracking-[3px] uppercase mb-2">Today's Ritual</p>
                                <p className="text-sm text-altar-text/80 leading-relaxed">
                                    {lunarData.currentPhase.ritual}
                                </p>
                            </div>

                            {/* Sit With This */}
                            <div
                                className="rounded-3xl p-5"
                                style={{
                                    background: 'rgba(212,175,55,0.05)',
                                    border: '1px solid rgba(212,175,55,0.12)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.04)',
                                }}
                            >
                                <p className="text-[9px] text-altar-gold/50 font-display tracking-[3px] uppercase mb-2">Sit With This</p>
                                <p className="text-sm text-altar-gold/70 italic leading-relaxed">
                                    "{lunarData.currentPhase.intention}"
                                </p>
                            </div>

                            {/* Upcoming Key Dates */}
                            <div>
                                <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">
                                    Upcoming Phases
                                </p>
                                <div className="space-y-2">
                                    {lunarData.upcoming.map((phase, i) => (
                                        <div
                                            key={i}
                                            className="rounded-2xl p-3 flex items-center gap-3"
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                            }}
                                        >
                                            <span className="text-xl shrink-0">{phase.emoji}</span>
                                            <div className="flex-1">
                                                <p className="text-xs text-altar-text/80 font-display">{phase.name}</p>
                                                <p className="text-[9px] text-altar-muted">
                                                    {phase.dateLabel} · in {phase.daysUntil} day{phase.daysUntil !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            {phase.name === 'New Moon' && (
                                                <span
                                                    className="text-[8px] px-2 py-0.5 rounded-full"
                                                    style={{
                                                        background: 'rgba(212,175,55,0.12)',
                                                        color: '#d4af37',
                                                        border: '1px solid rgba(212,175,55,0.2)',
                                                    }}
                                                >
                                                    Plant seeds
                                                </span>
                                            )}
                                            {phase.name === 'Full Moon' && (
                                                <span
                                                    className="text-[8px] px-2 py-0.5 rounded-full"
                                                    style={{
                                                        background: 'rgba(99,102,241,0.12)',
                                                        color: '#a5b4fc',
                                                        border: '1px solid rgba(99,102,241,0.2)',
                                                    }}
                                                >
                                                    Release
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Moon wisdom tip */}
                            <div
                                className="rounded-2xl p-4 mt-2"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-2">Working With Moon Energy</p>
                                <p className="text-[10px] text-altar-text/55 leading-relaxed">
                                    The moon cycle mirrors your own creative cycle. New Moons are for planting intentions. 
                                    First Quarter is for taking action. Full Moons are for celebrating progress and releasing blocks. 
                                    Last Quarter is for surrender and trust. Each phase is an invitation — not a rule.
                                </p>
                            </div>
                        </div>

                        <div className="h-8" />
                    </div>
                </div>
                <BottomNav currentTab="home" onTabChange={onTabChange} />
            </div>
        </>
    );
}
