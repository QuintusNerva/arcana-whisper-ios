import React from 'react';
import { Card } from '../models/card.model';
import { AIService, dailyCache } from '../services/ai.service';
import { BottomNav } from './BottomNav';
import { PageHeader } from './PageHeader';

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
                    <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'rgba(212,175,55,0.5)' }} />
                    <span className="text-[10px] italic" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>Reading the energy...</span>
                    <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'rgba(212,175,55,0.5)', animationDelay: '0.3s' }} />
                </div>
            ) : (
                <p className="text-[11px] leading-relaxed text-center italic" style={{ color: 'rgba(226,232,240,0.6)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
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
        id: 'single',
        icon: '🃏',
        name: 'Three Card',
        tagline: 'Past · Present · Future',
        readingId: 'three-card',
    },
    {
        id: 'celtic-cross',
        icon: '✝',
        name: 'Celtic Cross',
        tagline: '10-card deep dive',
        readingId: 'celtic-cross',
    },
    {
        id: 'mind-body-spirit',
        icon: '🕊️',
        name: 'Mind Body Spirit',
        tagline: 'Holistic alignment',
        readingId: 'three-card',
    },
    {
        id: 'horseshoe',
        icon: '🌙',
        name: 'Horseshoe',
        tagline: '7-card life arc',
        readingId: 'horseshoe',
    },
    {
        id: 'relationship',
        icon: '💞',
        name: 'Relationship',
        tagline: 'You · The Bond · Them',
        readingId: 'relationship',
    },
    {
        id: 'custom',
        icon: '✨',
        name: 'Custom Reading',
        tagline: 'Ask your own question',
        readingId: 'three-card',
    },
];

export function TarotTab({ onClose, onTabChange, energyCards, onViewCard }: TarotTabProps) {
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

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">

                {/* Header */}
                <PageHeader title="TAROT" onClose={onClose} titleSize="sm" />

                <main className="relative z-10 max-w-[500px] mx-auto pb-8">

                    {/* ── Today's Energy Hero ── */}
                    <section className="mx-5 mb-6 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                        <h2 className="font-display text-center text-sm tracking-[4px] uppercase mb-4" style={{ color: 'var(--color-gold-200)' }}>
                            <span style={{ color: 'var(--color-gold-100)' }}>✧</span> Today's Energy <span style={{ color: 'var(--color-gold-100)' }}>✧</span>
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
                                            <div
                                                className="relative w-[105px] h-[155px] rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-105"
                                                style={{
                                                    border: '1px solid var(--color-gold-glow-med)',
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(212,175,55,0.08)',
                                                }}
                                            >
                                                <img
                                                    src={card.image}
                                                    alt={card.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40" />
                                            </div>
                                            <div className="mt-2 flex flex-col items-center">
                                                <span className="text-base">{['🧠', '💫', '🕊️'][idx]}</span>
                                                <span className="text-[9px] font-display tracking-[2px] uppercase mt-0.5" style={{ color: 'var(--color-altar-muted)' }}>
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
                                <div className="animate-pulse text-2xl mb-2" style={{ color: 'var(--color-gold-100)' }}>✦</div>
                                <p className="text-xs" style={{ color: 'var(--color-altar-muted)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>Drawing your energy cards...</p>
                            </div>
                        )}
                    </section>

                    {/* ── Divider ── */}
                    <div className="flex items-center gap-3 mx-5 mb-5 animate-fade-up" style={{ animationDelay: '0.22s', opacity: 0 }}>
                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent)' }} />
                        <span className="font-display text-[9px] tracking-[3px] uppercase" style={{ color: 'var(--color-altar-muted)' }}>Begin a Reading</span>
                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent)' }} />
                    </div>

                    {/* ── Spread Options ── */}
                    <section className="mx-4 grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                        {SPREADS.map((spread) => (
                            <button
                                key={spread.id}
                                onClick={() => onTabChange(`new:${spread.readingId}`)}
                                className="relative flex flex-col items-start gap-1 rounded-2xl p-4 text-left transition-all hover:scale-[1.03] active:scale-[0.97]"
                                style={{
                                    ...primaryCardStyle,
                                    border: '1px solid var(--color-gold-glow-med)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(212,175,55,0.06)',
                                }}
                            >
                                <span className="text-xl mb-1" style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.3))' }}>{spread.icon}</span>
                                <span className="font-display text-[11px] font-semibold tracking-wide leading-tight" style={{ color: 'var(--color-gold-100)' }}>
                                    {spread.name}
                                </span>
                                <span className="text-[9px] font-display" style={{ color: 'var(--color-altar-muted)' }}>
                                    {spread.tagline}
                                </span>
                            </button>
                        ))}
                    </section>

                    {/* ── Card Codex ── */}
                    <section className="mx-4 mt-4 mb-4 animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                        <button
                            onClick={() => onTabChange('meanings')}
                            className="w-full py-3.5 rounded-2xl text-center transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
                            style={{
                                ...primaryCardStyle,
                                border: '1px solid var(--color-gold-glow-med)',
                            }}
                        >
                            <span className="text-lg">📖</span>
                            <span className="text-sm font-display tracking-wide" style={{ color: 'var(--color-gold-200)' }}>Card Codex</span>
                            <span style={{ color: 'var(--color-altar-muted)' }}>→</span>
                        </button>
                    </section>

                </main>
            </div>
            <BottomNav currentTab="home" onTabChange={onTabChange} />
        </div>
    );
}
