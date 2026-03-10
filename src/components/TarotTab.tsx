import React from 'react';
import { Card } from '../models/card.model';
import { AIService, dailyCache } from '../services/ai.service';

// ── Energy Interpretation (same logic as before, self-contained here now) ──
function EnergyInterpretation({ cards }: { cards: Card[] }) {
    const [interpretation, setInterpretation] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const CACHE_KEY = 'energy_interpretation';

    React.useEffect(() => {
        if (cards.length < 3) return;
        const cached = dailyCache.get(CACHE_KEY);
        if (cached) { setInterpretation(cached); return; }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setLoading(true);
        const cardData = cards.map((c, i) => ({
            name: c.name,
            meaning: c.meaning || c.description,
            position: ['Mind', 'Body', 'Spirit'][i],
        }));

        ai.getSpreadInsight(cardData, 'three-card', 'daily energy', 'What energy does today hold?')
            .then((result: string) => {
                const brief = result
                    .replace(/##.*?\n/g, '')
                    .replace(/- .*/g, '')
                    .replace(/\*\*/g, '')
                    .trim()
                    .split(/[.!?]\s+/)
                    .filter((s: string) => s.trim().length > 10)
                    .slice(0, 3)
                    .join('. ') + '.';
                dailyCache.set(CACHE_KEY, brief);
                setInterpretation(brief);
            })
            .catch(() => {
                const fallback = `${cards[0].name} guides your thoughts, ${cards[1].name} moves your body, and ${cards[2].name} lifts your spirit. Let today's energy flow through you.`;
                setInterpretation(fallback);
            })
            .finally(() => setLoading(false));
    }, [cards]);

    if (!interpretation && !loading) return null;

    return (
        <div className="mt-1 px-1">
            {loading ? (
                <div className="flex items-center justify-center gap-2 py-2">
                    <div className="w-1 h-1 bg-altar-gold/50 rounded-full animate-pulse" />
                    <span className="text-[10px] text-altar-muted/60 italic">Reading the energy...</span>
                    <div className="w-1 h-1 bg-altar-gold/50 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
            ) : (
                <p className="text-[11px] text-altar-text/60 leading-relaxed text-center italic">
                    "{interpretation}"
                </p>
            )}
        </div>
    );
}

interface TarotTabProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    energyCards: Card[];
    onViewCard: (card: Card) => void;
    subscription: string;
    onShowPremium: () => void;
}

const SPREADS = [
    {
        id: 'three-card',
        icon: '🃏',
        name: 'Three Card',
        tagline: 'Past · Present · Future',
        grad: 'linear-gradient(145deg, #3b0764 0%, #1e0a3c 60%, #0c0118 100%)',
        border: 'rgba(139,92,246,0.25)',
    },
    {
        id: 'celtic-cross',
        icon: '✝',
        name: 'Celtic Cross',
        tagline: '10-card deep dive',
        grad: 'linear-gradient(145deg, #1e293b 0%, #0f172a 60%, #030612 100%)',
        border: 'rgba(99,102,241,0.25)',
    },
    {
        id: 'mind-body-spirit',
        icon: '🕊️',
        name: 'Mind Body Spirit',
        tagline: 'Holistic alignment',
        grad: 'linear-gradient(145deg, #0f766e 0%, #042f2e 60%, #010d0c 100%)',
        border: 'rgba(20,184,166,0.25)',
    },
    {
        id: 'horseshoe',
        icon: '🌙',
        name: 'Horseshoe',
        tagline: '7-card life arc',
        grad: 'linear-gradient(145deg, #78350f 0%, #451a03 60%, #0d0601 100%)',
        border: 'rgba(217,119,6,0.25)',
    },
    {
        id: 'relationship',
        icon: '💞',
        name: 'Relationship',
        tagline: 'You · The Bond · Them',
        grad: 'linear-gradient(145deg, #9f1239 0%, #4c0519 60%, #0d0108 100%)',
        border: 'rgba(244,63,94,0.25)',
    },
    {
        id: 'custom',
        icon: '✨',
        name: 'Custom Reading',
        tagline: 'Ask your own question',
        grad: 'linear-gradient(145deg, #854d0e 0%, #3a1900 60%, #0d0700 100%)',
        border: 'rgba(251,191,36,0.25)',
    },
];

export function TarotTab({ onClose, onTabChange, energyCards, onViewCard }: TarotTabProps) {
    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">

                {/* Header */}
                <header className="relative text-center pt-5 pb-3 z-10 safe-top flex items-center px-4">
                    <button
                        onClick={onClose}
                        className="absolute left-4 text-altar-muted/50 text-sm font-display hover:text-altar-muted transition-colors"
                        aria-label="Back"
                    >
                        ← Back
                    </button>
                    <div className="flex-1">
                        <h1 className="font-display text-base tracking-[4px] shimmer-text uppercase">
                            Tarot
                        </h1>
                    </div>
                </header>

                <main className="relative z-10 max-w-[500px] mx-auto pb-8">

                    {/* ── Today's Energy Hero ── */}
                    <section className="mx-5 mb-6 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                        <h2 className="font-display text-center text-sm tracking-[4px] text-altar-muted uppercase mb-4">
                            <span className="text-altar-gold">✧</span> Today's Energy <span className="text-altar-gold">✧</span>
                        </h2>

                        {energyCards.length >= 3 ? (
                            <>
                                <div className="flex justify-center gap-3 mb-4">
                                    {energyCards.slice(0, 3).map((card, idx) => (
                                        <div
                                            key={card.id}
                                            className="flex flex-col items-center cursor-pointer group"
                                            onClick={() => onViewCard(card)}
                                        >
                                            <div className="relative w-[105px] h-[155px] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(139,95,191,0.3)]">
                                                <img
                                                    src={card.image}
                                                    alt={card.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40" />
                                            </div>
                                            <div className="mt-2 flex flex-col items-center">
                                                <span className="text-base">{['🧠', '💫', '🕊️'][idx]}</span>
                                                <span className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase mt-0.5">
                                                    {['Mind', 'Body', 'Spirit'][idx]}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <EnergyInterpretation cards={energyCards.slice(0, 3)} />
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="animate-pulse text-altar-gold text-2xl mb-2">✦</div>
                                <p className="text-xs text-altar-muted">Drawing your energy cards...</p>
                            </div>
                        )}
                    </section>

                    {/* ── Divider ── */}
                    <div className="flex items-center gap-3 mx-5 mb-5 animate-fade-up" style={{ animationDelay: '0.22s', opacity: 0 }}>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-altar-gold/20 to-transparent" />
                        <span className="font-display text-[9px] tracking-[3px] text-altar-muted/50 uppercase">Begin a Reading</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-altar-gold/20 to-transparent" />
                    </div>

                    {/* ── Spread Options ── */}
                    <section className="mx-4 grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                        {SPREADS.map((spread) => (
                            <button
                                key={spread.id}
                                onClick={() => onTabChange('new')}
                                className="relative flex flex-col items-start gap-1 rounded-2xl p-4 text-left transition-all hover:scale-[1.03] active:scale-[0.97]"
                                style={{
                                    background: spread.grad,
                                    border: `1px solid ${spread.border}`,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                                }}
                            >
                                <span className="text-xl mb-1">{spread.icon}</span>
                                <span className="font-display text-[11px] text-white/90 font-semibold tracking-wide leading-tight">
                                    {spread.name}
                                </span>
                                <span className="text-[9px] text-white/40 font-display">
                                    {spread.tagline}
                                </span>
                            </button>
                        ))}
                    </section>

                </main>
            </div>
        </div>
    );
}
