/**
 * ReadingRitual.tsx — "The Oracle Prepares to Receive You"
 *
 * A series of full-screen immersive moments, not a chatbot.
 * Each screen is one breath in a ceremony:
 *
 *   Screen 1 — THE INTENTION: "What question weighs on your mind?"
 *   Screen 2 — THE DEEPENING: AI follow-up fades in as floating text
 *   Screen 3 — THE ORACLE SUGGESTS: AI recommends a spread, user can trust or override
 *
 * No chat bubbles. No message history. No typing indicators.
 * Each screen is a MOMENT with a single elegant input.
 * Sentiment-reactive background shifts based on what user types.
 */

import React from 'react';
import { AIService } from '../services/ai.service';

export interface RitualData {
    intention?: string;
    contextTags: string[];
    extraContext?: string;
    followUpAnswers?: string[];
    recommendedSpread?: string;
    recommendedTheme?: string;
}

interface ReadingRitualProps {
    onComplete: (data: RitualData) => void;
    onSkip: () => void;
    onClose: () => void;
}

// ── Sentiment detection for background shifts ──
type Sentiment = 'neutral' | 'loss' | 'hope' | 'confusion' | 'fear' | 'love';

function detectSentiment(text: string): Sentiment {
    const lower = text.toLowerCase();
    if (/\b(loss|grief|death|died|mourn|funeral|gone|passed|miss them|missing)\b/.test(lower)) return 'loss';
    if (/\b(afraid|scared|fear|anxious|worry|dread|panic|terrif)\b/.test(lower)) return 'fear';
    if (/\b(love|heart|romance|partner|soulmate|marriage|wedding|together)\b/.test(lower)) return 'love';
    if (/\b(hope|excited|new|begin|start|grow|dream|wish|bright|optimis)\b/.test(lower)) return 'hope';
    if (/\b(confused|stuck|lost|unclear|overwhelm|don't know|uncertain|direction)\b/.test(lower)) return 'confusion';
    return 'neutral';
}

function getSentimentGradient(sentiment: Sentiment): string {
    switch (sentiment) {
        case 'loss':
            return 'linear-gradient(180deg, #080515 0%, #0d0a28 30%, #14082e 70%, #0a0618 100%)';
        case 'fear':
            return 'linear-gradient(180deg, #0a0618 0%, #100520 30%, #1a0830 70%, #0d0618 100%)';
        case 'love':
            return 'linear-gradient(180deg, #0a0618 0%, #150a24 30%, #1c0d30 60%, #120820 100%)';
        case 'hope':
            return 'linear-gradient(180deg, #0a0618 0%, #111024 30%, #18122e 60%, #0d0a20 100%)';
        case 'confusion':
            return 'linear-gradient(180deg, #0a0618 0%, #0e0a2a 30%, #120e32 70%, #0a0820 100%)';
        default:
            return 'linear-gradient(180deg, #0a0618 0%, #120224 30%, #1a0d35 70%, #0d0820 100%)';
    }
}

function getSentimentGlow(sentiment: Sentiment): React.CSSProperties {
    const base: React.CSSProperties = {
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '350px', height: '350px', borderRadius: '50%',
        animation: 'breathe 5s ease-in-out infinite',
        pointerEvents: 'none', transition: 'background 2s ease',
    };
    switch (sentiment) {
        case 'loss':
            return { ...base, background: 'radial-gradient(circle, rgba(100,70,180,0.06) 0%, transparent 70%)' };
        case 'hope':
            return { ...base, background: 'radial-gradient(circle, rgba(245,200,80,0.06) 0%, transparent 70%)' };
        case 'love':
            return { ...base, background: 'radial-gradient(circle, rgba(200,100,150,0.06) 0%, transparent 70%)' };
        case 'fear':
            return { ...base, background: 'radial-gradient(circle, rgba(80,60,160,0.06) 0%, transparent 70%)' };
        case 'confusion':
            return { ...base, background: 'radial-gradient(circle, rgba(100,120,200,0.05) 0%, transparent 70%)' };
        default:
            return { ...base, background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)' };
    }
}

// ── Typewriter for floating text ──
function useTypewriter(text: string, speed = 30, active = true) {
    const [displayed, setDisplayed] = React.useState('');
    const [done, setDone] = React.useState(false);

    React.useEffect(() => {
        if (!active || !text) { setDisplayed(''); setDone(false); return; }
        setDisplayed('');
        setDone(false);
        let i = 0;
        let timeout: ReturnType<typeof setTimeout>;
        const tick = () => {
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                i++;
                timeout = setTimeout(tick, speed);
            } else {
                setDone(true);
            }
        };
        tick();
        return () => clearTimeout(timeout);
    }, [text, speed, active]);

    return { displayed, done };
}

// ── Screen transition states ──
type Screen = 'intention' | 'deepening' | 'oracle-suggests';
type TransitionPhase = 'entering' | 'visible' | 'exiting';

// ── Spread info for the Oracle Suggests screen ──
const SPREAD_INFO: Record<string, { name: string; icon: string; cards: number }> = {
    'single': { name: 'Single Card', icon: '🃏', cards: 1 },
    'three-card': { name: '3-Card Spread', icon: '🔮', cards: 3 },
    'yes-no': { name: 'Yes / No', icon: '⚡', cards: 1 },
    'career': { name: 'Career Path', icon: '💼', cards: 4 },
    'relationship': { name: 'Relationship', icon: '💕', cards: 5 },
    'stay-or-go': { name: 'Stay or Go', icon: '🔥', cards: 6 },
    'celtic-cross': { name: 'Celtic Cross', icon: '⚜️', cards: 10 },
    'horseshoe': { name: 'Horseshoe', icon: '🌙', cards: 7 },
};

export function ReadingRitual({ onComplete, onSkip, onClose }: ReadingRitualProps) {
    const [screen, setScreen] = React.useState<Screen>('intention');
    const [phase, setPhase] = React.useState<TransitionPhase>('entering');
    const [sentiment, setSentiment] = React.useState<Sentiment>('neutral');

    // Screen 1 state
    const [question, setQuestion] = React.useState('');

    // Screen 2 state
    const [followUpQuestion, setFollowUpQuestion] = React.useState('');
    const [followUpAnswer, setFollowUpAnswer] = React.useState('');
    const [isLoadingFollowUp, setIsLoadingFollowUp] = React.useState(false);

    // Screen 3 state — Oracle Suggests
    const [recommendation, setRecommendation] = React.useState<{
        spreadId: string; theme: string; explanation: string;
    } | null>(null);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = React.useState(false);

    // Skip flow
    const [showSkipNote, setShowSkipNote] = React.useState(false);

    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const followUpRef = React.useRef<HTMLTextAreaElement>(null);

    // Fade in on mount
    React.useEffect(() => {
        const t = setTimeout(() => setPhase('visible'), 80);
        return () => clearTimeout(t);
    }, []);

    // Auto-focus on screen change
    React.useEffect(() => {
        if (phase === 'visible') {
            const ref = screen === 'intention' ? inputRef : screen === 'deepening' ? followUpRef : null;
            if (ref) setTimeout(() => ref.current?.focus(), 600);
        }
    }, [phase, screen]);

    // Detect sentiment as user types
    React.useEffect(() => {
        const combined = [question, followUpAnswer].filter(Boolean).join(' ');
        setSentiment(detectSentiment(combined));
    }, [question, followUpAnswer]);

    // Typewriter for AI follow-up text
    const followUpTypewriter = useTypewriter(followUpQuestion, 25, screen === 'deepening' && !!followUpQuestion);

    // Typewriter for Oracle recommendation
    const recommendationTypewriter = useTypewriter(
        recommendation?.explanation || '',
        25,
        screen === 'oracle-suggests' && !!recommendation,
    );

    // ── Transition helper ──
    const transitionTo = (next: Screen | 'done' | 'choose-own') => {
        setPhase('exiting');
        setTimeout(() => {
            if (next === 'done') {
                onComplete({
                    intention: question.trim() || undefined,
                    contextTags: [],
                    extraContext: undefined,
                    followUpAnswers: [followUpAnswer].filter(Boolean),
                    recommendedSpread: recommendation?.spreadId,
                    recommendedTheme: recommendation?.theme,
                });
            } else if (next === 'choose-own') {
                // User wants to choose their own spread — skip recommendation
                onComplete({
                    intention: question.trim() || undefined,
                    contextTags: [],
                    extraContext: undefined,
                    followUpAnswers: [followUpAnswer].filter(Boolean),
                    // No recommendedSpread → CustomReading shows grid
                });
            } else {
                setScreen(next);
                setPhase('entering');
                setTimeout(() => setPhase('visible'), 80);
            }
        }, 600);
    };

    // ── Generate AI follow-up ──
    const generateFollowUp = async () => {
        const ai = new AIService();
        if (!ai.hasApiKey()) {
            transitionTo('done');
            return;
        }

        setIsLoadingFollowUp(true);
        try {
            const follow = await ai.getRitualFollowUp(question.trim());
            if (follow && follow.trim()) {
                setFollowUpQuestion(follow.trim());
                transitionTo('deepening');
            } else {
                // No follow-up — go straight to spread recommendation
                generateSpreadRecommendation();
            }
        } catch {
            generateSpreadRecommendation();
        } finally {
            setIsLoadingFollowUp(false);
        }
    };

    // ── Generate spread recommendation ──
    const generateSpreadRecommendation = async () => {
        const ai = new AIService();
        if (!ai.hasApiKey()) {
            transitionTo('done');
            return;
        }

        setIsLoadingRecommendation(true);
        try {
            const rec = await ai.getRitualSpreadRecommendation(
                question.trim(),
                followUpAnswer.trim() || undefined,
            );
            setRecommendation(rec);
            transitionTo('oracle-suggests');
        } catch {
            transitionTo('done');
        } finally {
            setIsLoadingRecommendation(false);
        }
    };

    // ── Screen 1: Submit ──
    const handleIntentionSubmit = () => {
        if (question.trim()) {
            generateFollowUp();
        } else {
            transitionTo('done');
        }
    };

    // ── Screen 2: Submit ──
    const handleDeepeningSubmit = () => {
        generateSpreadRecommendation();
    };

    // ── Skip handling ──
    const handleSkipTap = () => {
        if (!showSkipNote) {
            setShowSkipNote(true);
            return;
        }
        setPhase('exiting');
        setTimeout(onSkip, 500);
    };

    // Screen transition styles
    const screenStyle: React.CSSProperties = {
        opacity: phase === 'visible' ? 1 : 0,
        transform: phase === 'entering'
            ? 'scale(0.98)'
            : phase === 'exiting'
                ? 'scale(1.01)'
                : 'scale(1)',
        transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: getSentimentGradient(sentiment),
            transition: 'background 2s ease',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Sentiment-reactive ambient glow */}
            <div style={getSentimentGlow(sentiment)} />

            {/* Secondary glow */}
            <div style={{
                position: 'absolute', bottom: '25%', right: '15%',
                width: '200px', height: '200px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168,85,247,0.03) 0%, transparent 70%)',
                animation: 'breathe 6s ease-in-out infinite 2s',
                pointerEvents: 'none',
            }} />

            {/* Twinkling gold starfield */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
                {Array.from({ length: 30 }).map((_, i) => (
                    <div key={`star-${i}`} style={{
                        position: 'absolute',
                        left: `${(i * 37 + 13) % 100}%`,
                        top: `${(i * 53 + 7) % 100}%`,
                        width: i % 5 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1.5px',
                        height: i % 5 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1.5px',
                        borderRadius: '50%',
                        background: i % 4 === 0
                            ? 'rgba(212,175,55,0.6)'
                            : i % 3 === 0
                                ? 'rgba(249,228,145,0.4)'
                                : 'rgba(255,255,255,0.25)',
                        boxShadow: i % 5 === 0
                            ? '0 0 6px rgba(212,175,55,0.4), 0 0 12px rgba(212,175,55,0.15)'
                            : i % 3 === 0
                                ? '0 0 4px rgba(249,228,145,0.3)'
                                : '0 0 3px rgba(255,255,255,0.15)',
                        animation: `starTwinkle ${2.5 + (i % 7) * 0.8}s ease-in-out ${(i * 0.3) % 4}s infinite`,
                    }} />
                ))}
            </div>

            {/* Tertiary atmosphere glow — low, warm */}
            <div style={{
                position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
                width: '500px', height: '300px', borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(212,175,55,0.02) 0%, transparent 70%)',
                animation: 'breathe 8s ease-in-out infinite 1s',
                pointerEvents: 'none',
            }} />

            {/* Top bar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 24px', paddingTop: 'max(16px, env(safe-area-inset-top))',
                position: 'relative', zIndex: 10,
            }}>
                <button
                    onClick={() => {
                        if (screen === 'oracle-suggests') {
                            setPhase('exiting');
                            setTimeout(() => { setScreen('deepening'); setPhase('entering'); setTimeout(() => setPhase('visible'), 80); }, 400);
                        } else if (screen === 'deepening') {
                            setPhase('exiting');
                            setTimeout(() => { setScreen('intention'); setPhase('entering'); setTimeout(() => setPhase('visible'), 80); }, 400);
                        } else {
                            onClose();
                        }
                    }}
                    style={{
                        color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-body)',
                        fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer',
                    }}
                >←</button>
                <div style={{ width: '20px' }} />
            </div>

            {/* Screen content — centered */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                padding: '0 32px 80px',
                position: 'relative', zIndex: 10,
                ...screenStyle,
            }}>
                {screen === 'intention' && (
                    <IntentionScreen
                        question={question}
                        setQuestion={setQuestion}
                        inputRef={inputRef}
                        onSubmit={handleIntentionSubmit}
                        isLoading={isLoadingFollowUp}
                    />
                )}
                {screen === 'deepening' && (
                    <DeepeningScreen
                        followUpText={followUpTypewriter.displayed}
                        isTyping={!followUpTypewriter.done}
                        answer={followUpAnswer}
                        setAnswer={setFollowUpAnswer}
                        inputRef={followUpRef}
                        showInput={followUpTypewriter.done}
                        onSubmit={handleDeepeningSubmit}
                        isLoading={isLoadingRecommendation}
                    />
                )}
                {screen === 'oracle-suggests' && recommendation && (
                    <OracleSuggestsScreen
                        explanation={recommendationTypewriter.displayed}
                        isTyping={!recommendationTypewriter.done}
                        showButtons={recommendationTypewriter.done}
                        spreadInfo={SPREAD_INFO[recommendation.spreadId]}
                        onTrustOracle={() => transitionTo('done')}
                        onChooseOwn={() => transitionTo('choose-own')}
                    />
                )}
            </div>

            {/* Skip — subtle, at the very bottom */}
            {screen !== 'oracle-suggests' && (
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '20px 32px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
                    textAlign: 'center', zIndex: 10,
                }}>
                    {showSkipNote ? (
                        <div style={{ animation: 'ritualFadeIn 0.5s ease both' }}>
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 300,
                                fontStyle: 'italic', color: 'rgba(148,163,184,0.45)',
                                lineHeight: '1.7', marginBottom: '8px', maxWidth: '320px', margin: '0 auto 8px',
                            }}>
                                The cards hear you. With more context, the reading becomes truly yours — but the choice is always yours.
                            </p>
                            <button
                                onClick={handleSkipTap}
                                style={{
                                    color: 'rgba(212,175,55,0.35)', fontFamily: 'var(--font-body)',
                                    fontSize: '12px', fontWeight: 300, fontStyle: 'italic',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                }}
                            >
                                Continue to the cards →
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleSkipTap}
                            style={{
                                color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-body)',
                                fontSize: '12px', fontWeight: 300, fontStyle: 'italic',
                                background: 'none', border: 'none', cursor: 'pointer',
                                letterSpacing: '0.3px',
                            }}
                        >
                            {"I'd prefer to let the cards speak freely"}
                        </button>
                    )}
                </div>
            )}

            <style>{`
                @keyframes ritualFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes ritualCursorBlink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                @keyframes ritualGoldPulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.08), 0 8px 40px rgba(0,0,0,0.4); }
                    50% { box-shadow: 0 0 35px rgba(212,175,55,0.15), 0 8px 40px rgba(0,0,0,0.4); }
                }
                @keyframes starTwinkle {
                    0%, 100% { opacity: 0.15; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                @keyframes breathe {
                    0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
                    50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
                }
                @keyframes symbolGlow {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.08); }
                }
            `}</style>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Screen 1 — THE INTENTION
   ═══════════════════════════════════════════════ */

function IntentionScreen({
    question, setQuestion, inputRef, onSubmit, isLoading,
}: {
    question: string;
    setQuestion: (v: string) => void;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    onSubmit: () => void;
    isLoading: boolean;
}) {
    return (
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            {/* Oracle crescent symbol */}
            <div style={{
                fontSize: '40px', marginBottom: '12px',
                filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.25))',
                animation: 'symbolGlow 4s ease-in-out infinite',
            }}>
                🌙
            </div>

            {/* Decorative divider */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '12px', marginBottom: '28px',
            }}>
                <div style={{
                    width: '40px', height: '1px',
                    background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.2))',
                }} />
                <span style={{ color: 'rgba(212,175,55,0.25)', fontSize: '8px', letterSpacing: '2px' }}>✦</span>
                <div style={{
                    width: '40px', height: '1px',
                    background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.2))',
                }} />
            </div>

            <p style={{
                fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 300,
                color: 'rgba(212,195,145,0.65)', letterSpacing: '0.5px',
                lineHeight: '1.8', marginBottom: '40px',
                textShadow: '0 0 20px rgba(212,175,55,0.08)',
            }}>
                What question weighs on your mind?
            </p>

            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(212,175,55,0.08)',
                borderRadius: '20px', padding: '24px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                marginBottom: '32px',
                transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
                ...(question.trim() ? {
                    borderColor: 'rgba(212,175,55,0.15)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 30px rgba(212,175,55,0.04)',
                } : {}),
            }}>
                <textarea
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && question.trim()) {
                            e.preventDefault();
                            onSubmit();
                        }
                    }}
                    placeholder=""
                    rows={3}
                    style={{
                        width: '100%', background: 'transparent', border: 'none',
                        outline: 'none', resize: 'none', textAlign: 'center',
                        fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 300,
                        color: 'rgba(226,232,240,0.85)', lineHeight: '1.8',
                        letterSpacing: '0.3px',
                    }}
                />
            </div>

            {question.trim() && (
                <button
                    onClick={onSubmit}
                    disabled={isLoading}
                    style={{
                        animation: 'ritualFadeIn 0.4s ease both',
                        background: isLoading
                            ? 'rgba(212,175,55,0.08)'
                            : 'linear-gradient(180deg, rgba(249,228,145,0.12), rgba(212,175,55,0.06))',
                        border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: '16px', padding: '14px 40px',
                        color: 'var(--color-gold-200)',
                        fontFamily: 'var(--font-display)', fontSize: '11px',
                        fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase',
                        cursor: isLoading ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isLoading ? 0.5 : 1,
                    }}
                >
                    {isLoading ? '✦ ✦ ✦' : 'Present to the Oracle'}
                </button>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Screen 2 — THE DEEPENING
   ═══════════════════════════════════════════════ */

function DeepeningScreen({
    followUpText, isTyping, answer, setAnswer, inputRef, showInput, onSubmit, isLoading,
}: {
    followUpText: string;
    isTyping: boolean;
    answer: string;
    setAnswer: (v: string) => void;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    showInput: boolean;
    onSubmit: () => void;
    isLoading: boolean;
}) {
    return (
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <p style={{
                fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 300,
                color: 'rgba(148,163,184,0.65)', letterSpacing: '0.3px',
                lineHeight: '1.9', marginBottom: '40px', minHeight: '60px',
            }}>
                {followUpText}
                {isTyping && (
                    <span style={{
                        color: 'var(--color-gold-100)',
                        animation: 'ritualCursorBlink 0.8s step-end infinite',
                        marginLeft: '2px', fontWeight: 200,
                    }}>|</span>
                )}
            </p>

            {showInput && (
                <div style={{ animation: 'ritualFadeIn 0.5s ease both' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(212,175,55,0.08)',
                        borderRadius: '20px', padding: '24px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                        marginBottom: '32px',
                        transition: 'border-color 0.5s ease',
                        ...(answer.trim() ? { borderColor: 'rgba(212,175,55,0.15)' } : {}),
                    }}>
                        <textarea
                            ref={inputRef}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSubmit();
                                }
                            }}
                            placeholder=""
                            rows={2}
                            style={{
                                width: '100%', background: 'transparent', border: 'none',
                                outline: 'none', resize: 'none', textAlign: 'center',
                                fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 300,
                                color: 'rgba(226,232,240,0.85)', lineHeight: '1.8',
                                letterSpacing: '0.3px',
                            }}
                        />
                    </div>

                    <button
                        onClick={onSubmit}
                        disabled={isLoading}
                        style={{
                            animation: 'ritualFadeIn 0.4s ease 0.3s both',
                            background: isLoading
                                ? 'rgba(212,175,55,0.08)'
                                : answer.trim()
                                    ? 'linear-gradient(180deg, rgba(249,228,145,0.12), rgba(212,175,55,0.06))'
                                    : 'transparent',
                            border: answer.trim() || isLoading
                                ? '1px solid rgba(212,175,55,0.2)'
                                : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '16px', padding: '14px 40px',
                            color: answer.trim() ? 'var(--color-gold-200)' : 'rgba(255,255,255,0.25)',
                            fontFamily: 'var(--font-display)', fontSize: '11px',
                            fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase',
                            cursor: isLoading ? 'wait' : 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: isLoading ? 0.5 : 1,
                        }}
                    >
                        {isLoading ? '✦ ✦ ✦' : answer.trim() ? 'Continue ✦' : 'Let the cards decide'}
                    </button>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Screen 3 — THE ORACLE SUGGESTS
   "For a question like this..."
   ═══════════════════════════════════════════════ */

function OracleSuggestsScreen({
    explanation, isTyping, showButtons, spreadInfo, onTrustOracle, onChooseOwn,
}: {
    explanation: string;
    isTyping: boolean;
    showButtons: boolean;
    spreadInfo?: { name: string; icon: string; cards: number };
    onTrustOracle: () => void;
    onChooseOwn: () => void;
}) {
    return (
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            {/* AI explanation — floating text */}
            <p style={{
                fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 300,
                color: 'rgba(148,163,184,0.65)', letterSpacing: '0.3px',
                lineHeight: '1.9', marginBottom: '40px', minHeight: '40px',
            }}>
                {explanation}
                {isTyping && (
                    <span style={{
                        color: 'var(--color-gold-100)',
                        animation: 'ritualCursorBlink 0.8s step-end infinite',
                        marginLeft: '2px', fontWeight: 200,
                    }}>|</span>
                )}
            </p>

            {/* Spread card — appears after typewriter */}
            {showButtons && spreadInfo && (
                <div style={{ animation: 'ritualFadeIn 0.6s ease both' }}>
                    {/* Elegant spread preview card */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(212,175,55,0.15)',
                        borderRadius: '20px', padding: '28px 24px',
                        marginBottom: '32px',
                        animation: 'ritualGoldPulse 3s ease-in-out infinite',
                    }}>
                        <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>
                            {spreadInfo.icon}
                        </span>
                        <p style={{
                            fontFamily: 'var(--font-display)', fontSize: '16px',
                            color: 'var(--color-gold-100)', letterSpacing: '2px',
                            textTransform: 'uppercase', marginBottom: '6px',
                        }}>
                            {spreadInfo.name}
                        </p>
                        <p style={{
                            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 300,
                            color: 'rgba(148,163,184,0.5)',
                        }}>
                            {spreadInfo.cards} card{spreadInfo.cards > 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Trust the Oracle — primary CTA */}
                    <button
                        onClick={onTrustOracle}
                        style={{
                            animation: 'ritualFadeIn 0.5s ease 0.2s both',
                            width: '100%',
                            background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                            border: '2px solid rgba(212,175,55,0.5)',
                            borderRadius: '18px', padding: '16px 32px',
                            color: '#0d0b22',
                            fontFamily: 'var(--font-display)', fontSize: '12px',
                            fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase',
                            cursor: 'pointer',
                            boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), 0 0 30px rgba(212,175,55,0.1), inset 0 1px 0 rgba(255,255,255,0.35)',
                            transition: 'all 0.2s ease',
                            marginBottom: '16px',
                        }}
                    >
                        ✦ Trust the Oracle ✦
                    </button>

                    {/* Choose own — subtle text link */}
                    <button
                        onClick={onChooseOwn}
                        style={{
                            animation: 'ritualFadeIn 0.5s ease 0.5s both',
                            color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-body)',
                            fontSize: '12px', fontWeight: 300, fontStyle: 'italic',
                            background: 'none', border: 'none', cursor: 'pointer',
                            letterSpacing: '0.3px',
                        }}
                    >
                        {"I'd like to choose my own spread"}
                    </button>
                </div>
            )}
        </div>
    );
}
