import React from 'react';
import { TarotService } from '../services/tarot.service';

interface CustomReadingProps {
    onClose: () => void;
    onComplete: (data: any) => void;
    subscription: string;
    onTabChange: (tab: string) => void;
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
    { id: 'general', name: 'General', icon: '🔮', color: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/40' },
    { id: 'love', name: 'Love', icon: '💕', color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/40' },
    { id: 'career', name: 'Career', icon: '💼', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/40' },
    { id: 'growth', name: 'Spirit', icon: '🕊️', color: 'from-cyan-500/20 to-teal-500/20', border: 'border-cyan-500/40' },
];

export function CustomReading({ onClose, onComplete, subscription, onTabChange }: CustomReadingProps) {
    const [step, setStep] = React.useState(1);
    const [selectedSpread, setSelectedSpread] = React.useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = React.useState<string | null>(null);
    const [question, setQuestion] = React.useState('');
    const [lockedShake, setLockedShake] = React.useState<string | null>(null);

    const selectSpread = (id: string) => {
        const spread = SPREADS.find(s => s.id === id);
        if (spread?.tier === 'premium' && subscription !== 'premium') {
            // Shake animation for locked spread
            setLockedShake(id);
            setTimeout(() => setLockedShake(null), 600);
            return;
        }
        setSelectedSpread(id);
        setTimeout(() => setStep(2), 350);
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
        if (step > 1) setStep(step - 1);
        else onClose();
    };

    const startDrawRitual = async () => {
        setIsShuffling(true);
        setShuffleProgress(0);

        // Simulate shuffle
        for (let i = 0; i <= 100; i += 2) {
            await new Promise(r => setTimeout(r, 30));
            setShuffleProgress(i);
        }

        await new Promise(r => setTimeout(r, 500));

        onComplete({
            spread: selectedSpread,
            theme: selectedTheme,
            question: question || undefined,
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
                            className="absolute text-altar-gold/30 animate-particle"
                            style={{
                                left: `${(i * 31 + 7) % 100}%`,
                                top: `${(i * 43 + 11) % 100}%`,
                                animationDelay: `${(i * 0.5) % 6}s`,
                                animationDuration: `${4 + (i % 3) * 2}s`,
                                fontSize: `${8 + (i % 3) * 4}px`,
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
                                className="absolute inset-0 rounded-xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/30 shadow-lg"
                                style={{
                                    transform: `rotate(${(i - 2) * (8 + Math.sin(shuffleProgress / 10 + i) * 5)}deg) translateY(${Math.sin(shuffleProgress / 8 + i * 2) * 8}px)`,
                                    transition: 'transform 0.1s ease-out',
                                    zIndex: i,
                                }}
                            >
                                <div className="w-full h-full rounded-xl flex items-center justify-center">
                                    <span className="text-3xl text-altar-gold/60">✦</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 className="font-display text-xl text-altar-gold tracking-[4px] mb-3">
                        SHUFFLING THE DECK
                    </h2>
                    <p className="text-sm text-altar-muted mb-6">
                        The cards are aligning with your energy…
                    </p>

                    {/* Progress bar */}
                    <div className="w-48 h-1 mx-auto bg-altar-purple/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-altar-gold to-altar-bright rounded-full transition-all duration-100"
                            style={{ width: `${shuffleProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-altar-deep/80 backdrop-blur-xl border-b border-white/5 safe-top">
                <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                    <button
                        onClick={handleBack}
                        className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide"
                    >
                        {step > 1 ? '← Back' : '✕ Close'}
                    </button>

                    {/* Step indicators */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display transition-all duration-500 ${s === step
                                    ? 'bg-altar-gold text-altar-deep scale-110 shadow-[0_0_12px_rgba(255,215,0,0.4)]'
                                    : s < step
                                        ? 'bg-altar-bright/50 text-white'
                                        : 'bg-white/10 text-white/40'
                                    }`}>
                                    {s < step ? '✓' : s}
                                </div>
                                {s < 3 && <div className={`w-6 h-[1px] transition-colors ${s < step ? 'bg-altar-gold/50' : 'bg-white/10'}`} />}
                            </div>
                        ))}
                    </div>

                    <div className="w-12" /> {/* Spacer */}
                </div>
            </header>

            <div className="max-w-[500px] mx-auto px-4 pb-32">
                {/* ── STEP 1: Choose Spread ── */}
                {step === 1 && (
                    <div className="animate-fade-up">
                        <div className="text-center mt-6 mb-6">
                            <span className="text-3xl mb-2 block">🃏</span>
                            <h2 className="font-display text-xl text-altar-gold tracking-[3px]">CHOOSE YOUR SPREAD</h2>
                            <p className="text-sm text-altar-muted mt-2">Select the ritual that calls to you</p>
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
                                        className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border ${isSelected
                                            ? 'bg-altar-mid/60 border-altar-gold/50 scale-105 shadow-[0_0_25px_rgba(255,215,0,0.15)]'
                                            : isLocked
                                                ? 'glass border-white/5 opacity-60 hover:opacity-80'
                                                : 'glass border-white/5 hover:border-white/15 hover:scale-[1.02]'
                                            } ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                                    >
                                        <div className="text-center">
                                            <span className="text-3xl block mb-2">{s.icon}</span>
                                            <h3 className={`font-display text-sm font-semibold mb-1 ${isSelected ? 'text-altar-gold' : 'text-altar-text'}`}>
                                                {s.name}
                                            </h3>
                                            <p className="text-xs text-altar-muted mb-2">{s.desc}</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-[10px] text-altar-muted">{s.cards} card{s.cards > 1 ? 's' : ''}</span>
                                                {isLocked && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-altar-gold/10 text-altar-gold border border-altar-gold/20">
                                                        🔒 PRO
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Choose Theme ── */}
                {step === 2 && (
                    <div className="animate-fade-up">
                        <div className="text-center mt-6 mb-6">
                            <span className="text-3xl mb-2 block">✨</span>
                            <h2 className="font-display text-xl text-altar-gold tracking-[3px]">SET YOUR INTENTION</h2>
                            <p className="text-sm text-altar-muted mt-2">What realm seeks your attention?</p>
                        </div>

                        <div className="space-y-3">
                            {THEMES.map(theme => {
                                const isSelected = selectedTheme === theme.id;
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => selectTheme(theme.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border ${isSelected
                                            ? `bg-gradient-to-r ${theme.color} ${theme.border} scale-[1.02] shadow-lg`
                                            : 'glass border-white/5 hover:border-white/15 hover:scale-[1.01]'
                                            }`}
                                    >
                                        <span className="text-3xl">{theme.icon}</span>
                                        <div className="text-left">
                                            <h3 className={`font-display text-base font-semibold tracking-wide ${isSelected ? 'text-white' : 'text-altar-text'
                                                }`}>
                                                {theme.name}
                                            </h3>
                                            <p className="text-xs text-altar-muted mt-0.5">
                                                {theme.id === 'general' && 'Universal guidance for your path'}
                                                {theme.id === 'love' && 'Matters of the heart & relationships'}
                                                {theme.id === 'career' && 'Work, prosperity & purpose'}
                                                {theme.id === 'growth' && 'Spiritual awakening & inner truth'}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <span className="ml-auto text-altar-gold text-lg">✦</span>
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
                            <h2 className="font-display text-xl text-altar-gold tracking-[3px]">ASK THE CARDS</h2>
                            <p className="text-sm text-altar-muted mt-2">Focus your energy (optional)</p>
                        </div>

                        {/* Summary of selections */}
                        <div className="glass rounded-2xl p-4 mb-5 flex items-center gap-3">
                            <span className="text-2xl">{spread?.icon}</span>
                            <div>
                                <p className="text-sm font-display text-altar-gold">{spread?.name}</p>
                                <p className="text-xs text-altar-muted">
                                    {THEMES.find(t => t.id === selectedTheme)?.name} · {spread?.cards} card{(spread?.cards || 0) > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Question input */}
                        <div className="glass-strong rounded-2xl p-5">
                            <label className="block font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">
                                YOUR QUESTION
                            </label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="What guidance do you seek…"
                                rows={4}
                                className="w-full bg-transparent text-altar-text placeholder-altar-muted/50 text-sm leading-relaxed resize-none focus:outline-none border-b border-altar-gold/20 focus:border-altar-gold/50 transition-colors pb-3"
                            />
                            <p className="text-xs text-altar-muted/60 mt-2 italic">
                                Leave empty for an open reading
                            </p>
                        </div>
                        {/* Begin Ritual button */}
                        <button
                            onClick={startDrawRitual}
                            className="w-full mt-6 py-4 rounded-2xl font-display font-semibold text-base tracking-wide transition-all duration-300 bg-gradient-to-r from-altar-gold via-altar-gold-dim to-altar-gold text-altar-deep hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:scale-[1.01] active:scale-[0.99]"
                        >
                            ✦ Begin the Ritual ✦
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
