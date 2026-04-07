/**
 * MorningAttunement — 60-second cosmic check-in overlay.
 *
 * Shows on first app open of the day:
 * - Current moon phase + top transit one-liner
 * - Active intention
 * - Element-matched breathing circle (CSS animation based on Moon sign)
 * - "I'm attuned" dismiss button
 *
 * Sacred Fintech design system.
 */

import React from 'react';
import { safeStorage } from '../services/storage.service';
import { getBirthData, getNatalTriad, ZODIAC_SIGNS } from '../services/astrology.service';
import { getTransitFeed, formatTransitShort } from '../services/transit.service';
import { getActiveManifestations } from '../services/manifestation.service';

// ── Constants ──

const ATTUNEMENT_KEY = 'arcana_morning_attunement';
const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z');

type MoonElement = 'Fire' | 'Earth' | 'Air' | 'Water';

interface BreathConfig {
    label: string;
    description: string;
    inhale: number;    // seconds
    hold: number;      // seconds
    exhale: number;    // seconds
    emoji: string;
}

const BREATH_CONFIGS: Record<MoonElement, BreathConfig> = {
    Fire: {
        label: 'Energizing Breath',
        description: 'Sharp inhale, power exhale',
        inhale: 2, hold: 1, exhale: 3,
        emoji: '🔥',
    },
    Earth: {
        label: 'Grounding Breath',
        description: 'Slow 4-4-4 box breathing',
        inhale: 4, hold: 4, exhale: 4,
        emoji: '🌍',
    },
    Air: {
        label: 'Clearing Breath',
        description: 'Double inhale, long exhale',
        inhale: 3, hold: 1, exhale: 5,
        emoji: '💨',
    },
    Water: {
        label: 'Flow Breath',
        description: 'Ocean rhythm, in through nose',
        inhale: 4, hold: 2, exhale: 6,
        emoji: '🌊',
    },
};

// ── Moon Phase ──

function getCurrentMoonPhase(): { name: string; emoji: string } {
    const now = new Date();
    const daysSince = (now.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);
    const phase = ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
    const n = phase / SYNODIC_MONTH;

    if (n < 0.0625) return { name: 'New Moon', emoji: '🌑' };
    if (n < 0.1875) return { name: 'Waxing Crescent', emoji: '🌒' };
    if (n < 0.3125) return { name: 'First Quarter', emoji: '🌓' };
    if (n < 0.4375) return { name: 'Waxing Gibbous', emoji: '🌔' };
    if (n < 0.5625) return { name: 'Full Moon', emoji: '🌕' };
    if (n < 0.6875) return { name: 'Waning Gibbous', emoji: '🌖' };
    if (n < 0.8125) return { name: 'Last Quarter', emoji: '🌗' };
    if (n < 0.9375) return { name: 'Waning Crescent', emoji: '🌘' };
    return { name: 'New Moon', emoji: '🌑' };
}

// ── Daily Gate ──

function hasAttunedToday(): boolean {
    try {
        const last = safeStorage.getItem(ATTUNEMENT_KEY);
        const today = new Date().toISOString().slice(0, 10);
        return last === today;
    } catch { return false; }
}

function markAttuned(): void {
    const today = new Date().toISOString().slice(0, 10);
    safeStorage.setItem(ATTUNEMENT_KEY, today);
}

// ── Component ──

interface MorningAttunementProps {
    onDismiss: () => void;
}

export function MorningAttunement({ onDismiss }: MorningAttunementProps) {
    const [breathPhase, setBreathPhase] = React.useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [fadeIn, setFadeIn] = React.useState(false);

    // Gather data
    const moonPhase = React.useMemo(() => getCurrentMoonPhase(), []);

    const transitLine = React.useMemo(() => {
        try {
            const feed = getTransitFeed();
            if (feed.topAlert) {
                const desc = formatTransitShort(feed.topAlert);
                const nature = feed.topAlert.aspect.nature === 'harmonious' ? '✨' :
                    feed.topAlert.aspect.nature === 'challenging' ? '🔥' : '⚡';
                return `${nature} ${desc}`;
            }
        } catch { /* no transits */ }
        return null;
    }, []);

    const activeIntention = React.useMemo(() => {
        const m = getActiveManifestations();
        return m.length > 0 ? m[0].declaration : null;
    }, []);

    const moonElement = React.useMemo((): MoonElement => {
        try {
            const birth = getBirthData();
            if (birth) {
                const triad = getNatalTriad(birth);
                return triad.moon.element as MoonElement;
            }
        } catch { /* fallback */ }
        return 'Earth'; // safe default
    }, []);

    const breathConfig = BREATH_CONFIGS[moonElement];
    const cycleDuration = (breathConfig.inhale + breathConfig.hold + breathConfig.exhale) * 1000;

    // Breathing cycle
    React.useEffect(() => {
        setFadeIn(true);

        const runCycle = () => {
            setBreathPhase('inhale');
            setTimeout(() => {
                setBreathPhase('hold');
                setTimeout(() => {
                    setBreathPhase('exhale');
                }, breathConfig.hold * 1000);
            }, breathConfig.inhale * 1000);
        };

        runCycle();
        const interval = setInterval(runCycle, cycleDuration);
        return () => clearInterval(interval);
    }, [breathConfig, cycleDuration]);

    const handleDismiss = () => {
        markAttuned();
        onDismiss();
    };

    // Circle scale based on breath phase
    const circleScale = breathPhase === 'inhale' ? 1.3 : breathPhase === 'hold' ? 1.3 : 0.85;
    const circleOpacity = breathPhase === 'hold' ? 0.9 : 0.6;
    const phaseDuration = breathPhase === 'inhale' ? breathConfig.inhale
        : breathPhase === 'hold' ? breathConfig.hold
        : breathConfig.exhale;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #0d0b22 0%, #1a0f2e 30%, #1c1538 60%, #0d0b22 100%)',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 0.8s ease-in',
        }}>
            {/* Title */}
            <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                color: '#F9E491',
                letterSpacing: '5px',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: '24px',
                textShadow: '0 0 20px rgba(212,175,55,0.25)',
            }}>✦ Morning Attunement ✦</p>

            {/* Moon Phase */}
            <div style={{
                textAlign: 'center',
                marginBottom: '8px',
                animation: 'fadeInUp 1s ease-out',
            }}>
                <span style={{ fontSize: '40px' }}>{moonPhase.emoji}</span>
            </div>
            <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                color: 'var(--color-gold-200)',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                marginBottom: '6px',
            }}>{moonPhase.name}</p>

            {/* Transit One-Liner */}
            {transitLine && (
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'rgba(226,232,240,0.5)',
                    fontWeight: 300,
                    textAlign: 'center',
                    maxWidth: '280px',
                    marginBottom: '24px',
                    lineHeight: 1.5,
                }}>{transitLine}</p>
            )}
            {!transitLine && <div style={{ height: '24px' }} />}

            {/* Breathing Exercise Label */}
            <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '9px',
                color: 'var(--color-gold-200)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                opacity: 0.5,
                marginBottom: '4px',
            }}>Breathe with the circle</p>
            <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'rgba(226,232,240,0.45)',
                fontWeight: 300,
                marginBottom: '44px',
            }}>{breathConfig.emoji} {breathConfig.label}</p>

            {/* Breathing Circle */}
            <div style={{
                position: 'relative',
                width: '160px',
                height: '160px',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {/* Outer glow ring */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '1px solid rgba(212,175,55,0.15)',
                    transform: `scale(${circleScale * 1.1})`,
                    transition: `transform ${phaseDuration}s ease-in-out`,
                    opacity: 0.3,
                }} />
                {/* Main breath circle */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 40% 40%, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.05) 60%, transparent 80%)`,
                    border: '1px solid rgba(212,175,55,0.2)',
                    transform: `scale(${circleScale})`,
                    opacity: circleOpacity,
                    transition: `transform ${phaseDuration}s ease-in-out, opacity ${phaseDuration}s ease-in-out`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(212,175,55,0.1), inset 0 0 40px rgba(212,175,55,0.05)',
                }}>
                    <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        color: 'rgba(226,232,240,0.6)',
                        fontWeight: 300,
                        textTransform: 'capitalize',
                    }}>{breathPhase === 'hold' ? 'hold' : breathPhase}</span>
                </div>
            </div>

            {/* Breath Label */}
            <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                color: 'rgba(226,232,240,0.35)',
                fontWeight: 300,
                letterSpacing: '1px',
                marginBottom: '32px',
            }}>{breathConfig.emoji} {breathConfig.label} · {breathConfig.description}</p>

            {/* Active Intention */}
            {activeIntention && (
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px',
                    maxWidth: '300px',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'rgba(28,21,56,0.5)',
                    border: '1px solid rgba(212,175,55,0.1)',
                    animation: 'fadeInUp 1.5s ease-out',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '9px',
                        color: 'var(--color-gold-200)',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        opacity: 0.6,
                    }}>YOUR INTENTION</p>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px',
                        color: 'rgba(226,232,240,0.85)',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        fontStyle: 'italic',
                    }}>"{activeIntention}"</p>
                </div>
            )}

            {/* Dismiss Button */}
            <button
                onClick={handleDismiss}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                    border: '2px solid rgba(212,175,55,0.6)',
                    borderRadius: '14px',
                    color: '#1a0f2e',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '11px',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    padding: '14px 40px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
                    animation: 'fadeInUp 2s ease-out',
                }}
                className="active:scale-[0.96] transition-transform"
            >
                <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '12px' }}>
                    <span style={{
                        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                        animation: 'shimmer 3s ease-in-out infinite',
                    }} />
                </span>
                <span style={{ position: 'relative' }}>I'm Attuned ✦</span>
            </button>
        </div>
    );
}

// ── Public Gate ──

/**
 * Check if the morning attunement should be shown.
 * Returns true only on first app open of the day.
 */
export function shouldShowAttunement(): boolean {
    try {
        const last = safeStorage.getItem(ATTUNEMENT_KEY);
        const today = new Date().toISOString().slice(0, 10);
        if (last === today) return false;
        // Only show if user has birth data and at least one active intention
        const birth = getBirthData();
        const manifestations = getActiveManifestations();
        return !!birth && manifestations.length > 0;
    } catch { return false; }
}
