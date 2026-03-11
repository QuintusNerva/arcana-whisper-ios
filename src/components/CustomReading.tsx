import React from 'react';
import { TarotService } from '../services/tarot.service';
import { PageHeader } from './PageHeader';
import { getActiveManifestations } from '../services/manifestation.service';
import { checkForRepeatedTopic, MindfulCheck } from '../services/mindful-reading.service';

interface CustomReadingProps {
    onClose: () => void;
    onComplete: (data: any) => void;
    subscription: string;
    onTabChange: (tab: string) => void;
    initialSpread?: string | null;
}

const SPREADS = [
    { id: 'single', name: 'Single Card', icon: '🃏', cards: 1, desc: 'Quick daily guidance', tier: 'free' },
    { id: 'three-card', name: '3-Card Spread', icon: '🔮', cards: 3, desc: 'Past · Present · Future', tier: 'free' },
    { id: 'yes-no', name: 'Yes / No', icon: '⚡', cards: 1, desc: 'Clear answer to your query', tier: 'free' },
    { id: 'career', name: 'Career Path', icon: '💼', cards: 4, desc: 'Your professional journey', tier: 'premium' },
    { id: 'relationship', name: 'Relationship', icon: '💕', cards: 5, desc: 'Heart connection reading', tier: 'premium' },
    { id: 'celtic-cross', name: 'Celtic Cross', icon: '⚜️', cards: 10, desc: 'Deep 10-card revelation', tier: 'premium' },
    { id: 'horseshoe', name: 'Horseshoe', icon: '🌙', cards: 7, desc: 'The path ahead unfolds', tier: 'premium' },
];

const THEMES = [
    { id: 'general', name: 'General', icon: '🔮', desc: 'Universal guidance for your path' },
    { id: 'love', name: 'Love', icon: '💕', desc: 'Matters of the heart & relationships' },
    { id: 'career', name: 'Career', icon: '💼', desc: 'Work, prosperity & purpose' },
    { id: 'growth', name: 'Spirit', icon: '🕊️', desc: 'Spiritual awakening & inner truth' },
];

/* ── Sacred Fintech Design System Styles ── */
const primaryCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
    borderRadius: '16px',
};

const goldCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
    border: '1px solid var(--color-gold-glow-med)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.08)',
    borderRadius: '16px',
};

const insetStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(13,11,34,0.6) 0%, rgba(19,15,46,0.4) 100%)',
    border: '1px solid rgba(255,255,255,0.04)',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
    borderRadius: '16px',
};

const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    color: 'var(--color-gold-200)',
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
};

const mutedTextStyle: React.CSSProperties = {
    color: 'var(--color-altar-muted)',
    fontFamily: 'var(--font-body)',
    fontWeight: 300,
};

export function CustomReading({ onClose, onComplete, subscription, onTabChange, initialSpread }: CustomReadingProps) {
    const [step, setStep] = React.useState(1);
    const [selectedSpread, setSelectedSpread] = React.useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = React.useState<string | null>(null);
    const [question, setQuestion] = React.useState('');
    const [intention, setIntention] = React.useState('');
    const [lockedShake, setLockedShake] = React.useState<string | null>(null);
    const [mindfulWarning, setMindfulWarning] = React.useState<MindfulCheck | null>(null);

    // Check for active manifestations
    const activeManifestations = React.useMemo(() => getActiveManifestations(), []);
    const primaryManifestation = activeManifestations[0] ?? null;

    // Auto-select spread if coming from TarotTab with a preselected spread
    React.useEffect(() => {
        if (initialSpread) {
            const spread = SPREADS.find(s => s.id === initialSpread);
            if (spread) {
                setSelectedSpread(initialSpread);
                if (initialSpread === 'career') {
                    setSelectedTheme('career');
                    setStep(3);
                } else if (initialSpread === 'relationship') {
                    setSelectedTheme('love');
                    setStep(3);
                } else {
                    setStep(2);
                }
            }
        }
    }, [initialSpread]);

    const selectSpread = (id: string) => {
        const spread = SPREADS.find(s => s.id === id);
        if (spread?.tier === 'premium' && subscription !== 'premium') {
            setLockedShake(id);
            setTimeout(() => setLockedShake(null), 600);
            return;
        }
        setSelectedSpread(id);

        if (id === 'career') {
            setSelectedTheme('career');
            setTimeout(() => setStep(3), 350);
        } else if (id === 'relationship') {
            setSelectedTheme('love');
            setTimeout(() => setStep(3), 350);
        } else {
            setTimeout(() => setStep(2), 350);
        }
    };

    const selectTheme = (id: string) => {
        setSelectedTheme(id);
        setTimeout(() => setStep(3), 350);
    };
    const [isShuffling, setIsShuffling] = React.useState(false);
    const [shuffleProgress, setShuffleProgress] = React.useState(0);

    const canProceed = () => {
        if (step === 1) return !!selectedSpread;
        if (step === 2) return !!selectedTheme;
        return true; // step 3 question is optional
    };

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            startDrawRitual();
        }
    };

    const handleBack = () => {
        if (step === 3 && (selectedSpread === 'career' || selectedSpread === 'relationship')) {
            if (initialSpread) {
                onClose();
            } else {
                setStep(1);
            }
        } else if (step === 2 && initialSpread) {
            onClose();
        } else if (step > 1) {
            setStep(step - 1);
        } else {
            onClose();
        }
    };

    const startDrawRitual = async (skipMindfulCheck = false) => {
        if (!skipMindfulCheck) {
            const check = checkForRepeatedTopic(question.trim(), selectedTheme);
            if (check.shouldWarn) {
                setMindfulWarning(check);
                return;
            }
        }
        setMindfulWarning(null);
        setIsShuffling(true);
        setShuffleProgress(0);

        for (let i = 0; i <= 100; i += 2) {
            await new Promise(r => setTimeout(r, 30));
            setShuffleProgress(i);
        }

        await new Promise(r => setTimeout(r, 500));

        const finalIntention = intention.trim() || primaryManifestation?.declaration || undefined;
        const manifestationId = primaryManifestation?.id || undefined;

        onComplete({
            spread: selectedSpread,
            theme: selectedTheme,
            question: question || undefined,
            intention: finalIntention,
            manifestationId,
        });
    };

    const spread = SPREADS.find(s => s.id === selectedSpread);

    // ── Shuffle Animation Screen ──
    if (isShuffling) {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple flex items-center justify-center">
                {/* Background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 20 }, (_, i) => (
                        <span
                            key={i}
                            className="absolute animate-particle"
                            style={{
                                left: `${(i * 31 + 7) % 100}%`,
                                top: `${(i * 43 + 11) % 100}%`,
                                animationDelay: `${(i * 0.5) % 6}s`,
                                animationDuration: `${4 + (i % 3) * 2}s`,
                                fontSize: `${8 + (i % 3) * 4}px`,
                                color: 'rgba(212,175,55,0.3)',
                            }}
                        >
                            {['✦', '✧', '⊹', '✶', '·'][i % 5]}
                        </span>
                    ))}
                </div>

                <div className="text-center z-10">
                    {/* Shuffling deck animation */}
                    <div className="relative w-32 h-44 mx-auto mb-8">
                        {[0, 1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="absolute inset-0 rounded-xl"
                                style={{
                                    ...primaryCardStyle,
                                    border: '1px solid var(--color-gold-glow-med)',
                                    transform: `rotate(${(i - 2) * (8 + Math.sin(shuffleProgress / 10 + i) * 5)}deg) translateY(${Math.sin(shuffleProgress / 8 + i * 2) * 8}px)`,
                                    transition: 'transform 0.1s ease-out',
                                    zIndex: i,
                                }}
                            >
                                <div className="w-full h-full rounded-xl flex items-center justify-center">
                                    <span style={{ fontSize: '30px', color: 'rgba(212,175,55,0.6)' }}>✦</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 style={{ ...headerStyle, fontSize: '20px', letterSpacing: '4px', marginBottom: '12px' }}>
                        SHUFFLING THE DECK
                    </h2>
                    <p style={{ ...mutedTextStyle, fontSize: '14px', marginBottom: '24px' }}>
                        The cards are aligning with your energy…
                    </p>

                    {/* Progress bar */}
                    <div className="w-48 h-1 mx-auto rounded-full overflow-hidden" style={{ background: 'rgba(75,0,130,0.5)' }}>
                        <div
                            className="h-full rounded-full transition-all duration-100"
                            style={{
                                width: `${shuffleProgress}%`,
                                background: 'linear-gradient(to right, var(--color-gold-100), var(--color-gold-200))',
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple overflow-y-auto">
            {/* Header */}
            <PageHeader
                onClose={handleBack}
                centerContent={
                    /* Step indicators */
                    <div className="flex items-center justify-center gap-2 w-full">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-500"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        background: s === step
                                            ? 'var(--color-gold-100)'
                                            : s < step
                                                ? 'rgba(212,175,55,0.3)'
                                                : 'rgba(255,255,255,0.08)',
                                        color: s === step
                                            ? '#0d0b22'
                                            : s < step
                                                ? 'white'
                                                : 'rgba(255,255,255,0.4)',
                                        boxShadow: s === step
                                            ? '0 0 12px rgba(212,175,55,0.4)'
                                            : 'none',
                                        transform: s === step ? 'scale(1.1)' : 'scale(1)',
                                    }}>
                                    {s < step ? '✓' : s}
                                </div>
                                {s < 3 && <div className="w-6 h-[1px]" style={{ background: s < step ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)' }} />}
                            </div>
                        ))}
                    </div>
                }
            />

            <div className="max-w-[500px] mx-auto px-4 pb-32">
                {/* ── STEP 1: Choose Spread ── */}
                {step === 1 && (
                    <div className="animate-fade-up">
                        <div className="text-center mt-6 mb-6">
                            <span className="text-3xl mb-2 block">🃏</span>
                            <h2 style={{ ...headerStyle, fontSize: '20px' }}>CHOOSE YOUR SPREAD</h2>
                            <p style={{ ...mutedTextStyle, fontSize: '14px', marginTop: '8px' }}>Select the ritual that calls to you</p>
                        </div>

                        {/* 2×2 spread grid */}
                        <div className="grid grid-cols-2 gap-3 px-1">
                            {SPREADS.map((s) => {
                                const isSelected = selectedSpread === s.id;
                                const isPremium = s.tier === 'premium';
                                const isLocked = isPremium && subscription !== 'premium';
                                const isShaking = lockedShake === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => selectSpread(s.id)}
                                        className={`cursor-pointer p-4 transition-all duration-300 ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                                        style={{
                                            ...primaryCardStyle,
                                            border: isSelected
                                                ? '1px solid var(--color-gold-100)'
                                                : '1px solid var(--color-gold-glow-med)',
                                            boxShadow: isSelected
                                                ? '0 8px 32px rgba(0,0,0,0.5), 0 0 25px rgba(212,175,55,0.15)'
                                                : primaryCardStyle.boxShadow,
                                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                            opacity: isLocked ? 0.6 : 1,
                                        }}
                                    >
                                        <div className="text-center">
                                            <span className="text-3xl block mb-2">{s.icon}</span>
                                            <h3 style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                marginBottom: '4px',
                                                color: isSelected ? 'var(--color-gold-100)' : 'var(--color-gold-200)',
                                            }}>
                                                {s.name}
                                            </h3>
                                            <p style={{ ...mutedTextStyle, fontSize: '12px', marginBottom: '8px' }}>{s.desc}</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <span style={{ ...mutedTextStyle, fontSize: '10px' }}>{s.cards} card{s.cards > 1 ? 's' : ''}</span>
                                                {isLocked && (
                                                    <span style={{
                                                        fontSize: '9px',
                                                        padding: '2px 6px',
                                                        borderRadius: '9999px',
                                                        background: 'rgba(212,175,55,0.1)',
                                                        border: '1px solid rgba(212,175,55,0.2)',
                                                        color: 'var(--color-gold-100)',
                                                    }}>
                                                        🔒 PRO
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Card Codex link */}
                        <button
                            onClick={() => onTabChange('meanings')}
                            className="w-full mt-5 py-3 text-center transition-all flex items-center justify-center gap-2"
                            style={{
                                ...primaryCardStyle,
                                border: '1px solid var(--color-gold-glow-med)',
                            }}
                        >
                            <span className="text-lg">📖</span>
                            <span style={{ ...headerStyle, fontSize: '14px', letterSpacing: '1px' }}>Card Codex</span>
                            <span style={{ color: 'var(--color-altar-muted)' }}>→</span>
                        </button>
                    </div>
                )}

                {/* ── STEP 2: Choose Theme ── */}
                {step === 2 && (
                    <div className="animate-fade-up">
                        <div className="text-center mt-6 mb-6">
                            <span className="text-3xl mb-2 block">✨</span>
                            <h2 style={{ ...headerStyle, fontSize: '20px' }}>SET YOUR INTENTION</h2>
                            <p style={{ ...mutedTextStyle, fontSize: '14px', marginTop: '8px' }}>What realm seeks your attention?</p>
                        </div>

                        <div className="space-y-3">
                            {THEMES.map(theme => {
                                const isSelected = selectedTheme === theme.id;
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => selectTheme(theme.id)}
                                        className="w-full flex items-center gap-4 p-4 transition-all duration-300"
                                        style={{
                                            ...primaryCardStyle,
                                            border: isSelected
                                                ? '1px solid var(--color-gold-100)'
                                                : '1px solid var(--color-gold-glow-med)',
                                            boxShadow: isSelected
                                                ? '0 8px 32px rgba(0,0,0,0.5), 0 0 25px rgba(212,175,55,0.15)'
                                                : primaryCardStyle.boxShadow,
                                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                            textAlign: 'left' as const,
                                        }}
                                    >
                                        <span className="text-3xl">{theme.icon}</span>
                                        <div>
                                            <h3 style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '16px',
                                                fontWeight: 600,
                                                letterSpacing: '1px',
                                                color: isSelected ? 'var(--color-gold-100)' : 'var(--color-gold-200)',
                                            }}>
                                                {theme.name}
                                            </h3>
                                            <p style={{ ...mutedTextStyle, fontSize: '12px', marginTop: '2px' }}>
                                                {theme.desc}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <span className="ml-auto" style={{ color: 'var(--color-gold-100)', fontSize: '18px' }}>✦</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Ask Question ── */}
                {step === 3 && (
                    <div className="animate-fade-up">
                        <div className="text-center mt-6 mb-6">
                            <span className="text-3xl mb-2 block">🌙</span>
                            <h2 style={{ ...headerStyle, fontSize: '20px' }}>ASK THE CARDS</h2>
                            <p style={{ ...mutedTextStyle, fontSize: '14px', marginTop: '8px' }}>Focus your energy (optional)</p>
                        </div>

                        {/* Summary of selections */}
                        <div className="flex items-center gap-3 p-4 mb-5" style={goldCardStyle}>
                            <span className="text-2xl">{spread?.icon}</span>
                            <div>
                                <p style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold-100)', fontSize: '14px' }}>{spread?.name}</p>
                                <p style={{ ...mutedTextStyle, fontSize: '12px' }}>
                                    {THEMES.find(t => t.id === selectedTheme)?.name} · {spread?.cards} card{(spread?.cards || 0) > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Active manifestation badge */}
                        {primaryManifestation && (
                            <div className="p-4 mb-4" style={{
                                ...goldCardStyle,
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, #130f2e 50%, rgba(184,134,11,0.03) 100%)',
                            }}>
                                <p style={{ ...headerStyle, fontSize: '10px', marginBottom: '4px' }}>✨ Active Manifestation</p>
                                <p style={{ ...mutedTextStyle, fontSize: '14px', fontStyle: 'italic', color: 'rgba(226,232,240,0.9)' }}>"{primaryManifestation.declaration}"</p>
                                <p style={{ ...mutedTextStyle, fontSize: '10px', marginTop: '4px' }}>This reading will be woven through your active intention</p>
                            </div>
                        )}

                        {/* Question input */}
                        <div className="p-5" style={goldCardStyle}>
                            <label style={{ ...headerStyle, fontSize: '12px', display: 'block', marginBottom: '12px' }}>
                                YOUR QUESTION
                            </label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="What guidance do you seek…"
                                rows={3}
                                className="w-full bg-transparent resize-none focus:outline-none pb-3"
                                style={{
                                    ...mutedTextStyle,
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    color: 'rgba(226,232,240,0.9)',
                                    borderBottom: '1px solid rgba(212,175,55,0.2)',
                                }}
                            />
                            <p style={{ ...mutedTextStyle, fontSize: '12px', fontStyle: 'italic', marginTop: '8px', opacity: 0.6 }}>
                                Leave empty for an open reading
                            </p>
                        </div>

                        {/* Intention / Manifestation — only show if no active manifestation */}
                        {!primaryManifestation && (
                            <div className="p-5 mt-3" style={goldCardStyle}>
                                <label style={{ ...headerStyle, fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                    🌙 Set an Intention <span style={{ ...mutedTextStyle, fontSize: '11px', fontWeight: 400, textTransform: 'none' as const, letterSpacing: 'normal' }}>(optional)</span>
                                </label>
                                <p style={{ ...mutedTextStyle, fontSize: '11px', marginBottom: '12px', opacity: 0.6 }}>What are you calling in? The cards will speak to your intention.</p>
                                <input
                                    type="text"
                                    value={intention}
                                    onChange={(e) => setIntention(e.target.value)}
                                    placeholder="I am calling in…"
                                    className="w-full bg-transparent focus:outline-none pb-2"
                                    style={{
                                        ...mutedTextStyle,
                                        fontSize: '14px',
                                        color: 'rgba(226,232,240,0.9)',
                                        borderBottom: '1px solid rgba(212,175,55,0.2)',
                                    }}
                                />
                            </div>
                        )}
                        {/* Mindful anti-bias nudge */}
                        {mindfulWarning && (
                            <div className="mt-4 overflow-hidden animate-fade-up" style={{
                                ...primaryCardStyle,
                                border: '1px solid #f59e0b',
                                boxShadow: '0 8px 40px rgba(251,191,36,0.15), 0 0 30px rgba(251,191,36,0.08), 0 0 0 1px rgba(251,191,36,0.1)',
                            }}>
                                <div className="p-4">
                                    <p style={{ color: 'rgba(252,211,77,0.9)', fontSize: '10px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>🌑 A gentle reflection</p>
                                    <p style={{ ...mutedTextStyle, fontSize: '12px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
                                        {mindfulWarning.message}
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => startDrawRitual(true)}
                                            className="flex-1 py-2.5 transition-all active:scale-[0.97]"
                                            style={{
                                                background: 'linear-gradient(135deg, var(--color-gold-100), var(--color-gold-200))',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#0d0b22',
                                                fontFamily: 'var(--font-display)',
                                                border: '1px solid var(--color-gold-glow-med)',
                                                boxShadow: '0 2px 12px rgba(212,175,55,0.25)',
                                            }}
                                        >
                                            Continue anyway
                                        </button>
                                        <button
                                            onClick={() => setMindfulWarning(null)}
                                            className="flex-1 py-2.5 transition-colors"
                                            style={{
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                color: 'rgba(255,255,255,0.4)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                fontFamily: 'var(--font-display)',
                                            }}
                                        >
                                            I'll sit with this
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Begin Ritual button */}
                        <button
                            onClick={() => startDrawRitual()}
                            className="w-full mt-6 py-4 font-semibold text-base tracking-wide transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-gold-100), var(--color-gold-200))',
                                borderRadius: '16px',
                                border: '1px solid var(--color-gold-glow-med)',
                                color: '#0d0b22',
                                fontFamily: 'var(--font-display)',
                                boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                            }}
                        >
                            ✦ Begin the Ritual ✦
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
