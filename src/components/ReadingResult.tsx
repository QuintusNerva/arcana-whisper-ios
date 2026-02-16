import React from 'react';
import { Reading } from '../models/card.model';
import { TarotService } from '../services/tarot.service';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import { isPersonalized, getPersonalizedPrefix, getMemoryProfile } from '../services/memory.service';
import { CelticCrossLayout } from './CelticCrossLayout';
import { HorseshoeLayout } from './HorseshoeLayout';
import { RelationshipLayout } from './RelationshipLayout';
import { CareerLayout } from './CareerLayout';

interface ReadingResultProps {
    reading: Reading;
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
}

const POSITION_LABELS: Record<string, string[]> = {
    'single': ['Your Guidance'],
    'three-card': ['Past', 'Present', 'Future'],
    'yes-no': ['Your Answer'],
    'career': ['Current Role', 'Challenge', 'Action', 'Outcome'],
    'relationship': ['You', 'Partner', 'Connection', 'Challenge', 'Potential'],
    'celtic-cross': ['Situation', 'Challenge', 'Past', 'Future', 'Above', 'Below', 'Advice', 'External', 'Hopes/Fears', 'Outcome'],
    'horseshoe': ['Past', 'Present', 'Hidden', 'Obstacle', 'Surrounding', 'Advice', 'Outcome'],
};

// Traditional tarot Yes/No associations
const YES_CARDS = new Set([
    'fool', 'magician', 'empress', 'emperor', 'lovers', 'chariot', 'strength',
    'wheel_of_fortune', 'temperance', 'star', 'sun', 'judgement', 'world',
    'ace_wands', 'two_wands', 'three_wands', 'four_wands', 'six_wands', 'eight_wands',
    'page_wands', 'knight_wands', 'queen_wands', 'king_wands',
    'ace_cups', 'two_cups', 'three_cups', 'six_cups', 'nine_cups', 'ten_cups',
    'page_cups', 'knight_cups', 'queen_cups', 'king_cups',
    'ace_swords', 'six_swords', 'page_swords', 'knight_swords',
    'ace_pentacles', 'three_pentacles', 'six_pentacles', 'nine_pentacles', 'ten_pentacles',
    'page_pentacles', 'knight_pentacles', 'queen_pentacles', 'king_pentacles',
]);
const NO_CARDS = new Set([
    'high_priestess', 'hierophant', 'hermit', 'hanged_man', 'death', 'devil', 'tower', 'moon',
    'five_wands', 'seven_wands', 'nine_wands', 'ten_wands',
    'five_cups', 'seven_cups', 'eight_cups',
    'two_swords', 'three_swords', 'five_swords', 'seven_swords', 'eight_swords',
    'nine_swords', 'ten_swords', 'queen_swords', 'king_swords',
    'four_pentacles', 'five_pentacles', 'seven_pentacles', 'eight_pentacles',
]);

function getYesNoVerdict(cardId: string): 'yes' | 'no' | 'maybe' {
    if (YES_CARDS.has(cardId)) return 'yes';
    if (NO_CARDS.has(cardId)) return 'no';
    return 'maybe';
}

export function ReadingResult({ reading, onClose, onTabChange, subscription }: ReadingResultProps) {
    const [revealedCards, setRevealedCards] = React.useState<Set<number>>(new Set());
    const [allRevealed, setAllRevealed] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [shared, setShared] = React.useState(false);
    const [selectedCardIdx, setSelectedCardIdx] = React.useState<number | null>(null);
    const [cardInsight, setCardInsight] = React.useState<string | null>(null);
    const [cardInsightLoading, setCardInsightLoading] = React.useState(false);
    const [spreadInsight, setSpreadInsight] = React.useState<string | null>(null);
    const [spreadInsightLoading, setSpreadInsightLoading] = React.useState(false);
    const [aiError, setAiError] = React.useState<string | null>(null);
    const isPremium = subscription === 'premium';

    const positions = POSITION_LABELS[reading.spread] || reading.cards.map((_, i) => `Card ${i + 1}`);

    // Auto-reveal cards one by one
    React.useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];
        reading.cards.forEach((_, i) => {
            timers.push(setTimeout(() => {
                setRevealedCards(prev => {
                    const next = new Set(prev);
                    next.add(i);
                    if (next.size === reading.cards.length) {
                        setTimeout(() => setAllRevealed(true), 600);
                    }
                    return next;
                });
            }, 800 + i * 600));
        });
        return () => timers.forEach(clearTimeout);
    }, [reading.cards]);

    const handleSave = () => {
        const tarotService = new TarotService();
        tarotService.saveReading(reading);
        setSaved(true);
    };

    const handleShare = async () => {
        const spreadNames: Record<string, string> = {
            'single': 'Single Card', 'three-card': '3-Card', 'yes-no': 'Yes/No',
            'career': 'Career Path', 'relationship': 'Relationship',
            'celtic-cross': 'Celtic Cross', 'horseshoe': 'Horseshoe',
        };
        const text = `🔮 My ${spreadNames[reading.spread] || reading.spread} Reading\n\n${reading.cards.map((c, i) => `${positions[i]}: ${c.name} — ${c.description}`).join('\n')
            }\n\n✨ — Arcana Whisper`;

        if (navigator.share) {
            try {
                await navigator.share({ title: '🔮 My Tarot Reading', text });
                setShared(true);
                return;
            } catch { /* cancelled */ }
        }
        try {
            await navigator.clipboard.writeText(text);
            setShared(true);
        } catch { /* fallback failed */ }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple overflow-y-auto">
            {/* Background vignette */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_30%,transparent_0%,rgba(13,6,24,0.7)_70%)]" />

            {/* Header */}
            <header className="sticky top-0 z-30 bg-altar-deep/95 backdrop-blur-xl border-b border-white/5 safe-top">
                <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                    <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">
                        ✕ Close
                    </button>
                    <h2 className="font-display text-sm text-altar-gold tracking-[3px]">YOUR READING</h2>
                    <div className="w-12" />
                </div>
            </header>

            <div className="relative z-10 max-w-[500px] mx-auto px-4 pb-32">
                {/* Reading info */}
                {reading.question && (
                    <div className="glass rounded-2xl p-4 mt-4 mb-2">
                        <p className="text-xs text-altar-muted font-display tracking-[2px] uppercase mb-1">Your Question</p>
                        <p className="text-sm text-altar-text/90 italic">"{reading.question}"</p>
                    </div>
                )}

                {/* Cards layout */}
                {reading.spread === 'celtic-cross' ? (
                    <CelticCrossLayout
                        cards={reading.cards}
                        positions={positions}
                        revealedCards={revealedCards}
                        selectedCardIdx={selectedCardIdx}
                        onSelectCard={setSelectedCardIdx}
                    />
                ) : reading.spread === 'horseshoe' ? (
                    <HorseshoeLayout
                        cards={reading.cards}
                        positions={positions}
                        revealedCards={revealedCards}
                        selectedCardIdx={selectedCardIdx}
                        onSelectCard={setSelectedCardIdx}
                    />
                ) : reading.spread === 'relationship' ? (
                    <RelationshipLayout
                        cards={reading.cards}
                        positions={positions}
                        revealedCards={revealedCards}
                        selectedCardIdx={selectedCardIdx}
                        onSelectCard={setSelectedCardIdx}
                    />
                ) : reading.spread === 'career' ? (
                    <CareerLayout
                        cards={reading.cards}
                        positions={positions}
                        revealedCards={revealedCards}
                        selectedCardIdx={selectedCardIdx}
                        onSelectCard={setSelectedCardIdx}
                    />
                ) : (
                    <div className={`mt-6 ${reading.cards.length === 1
                        ? 'flex justify-center'
                        : reading.cards.length <= 3
                            ? 'flex justify-center gap-4'
                            : 'grid grid-cols-3 gap-3'
                        }`}>
                        {reading.cards.map((card, i) => {
                            const isRevealed = revealedCards.has(i);
                            const isExpanded = selectedCardIdx === i;

                            return (
                                <div
                                    key={`${card.id}-${i}`}
                                    className={`flex flex-col items-center transition-all duration-500 ${reading.cards.length <= 3 ? 'w-[130px]' : ''
                                        }`}
                                    style={{
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                >
                                    {/* Position label */}
                                    <span className={`text-[10px] font-display text-altar-muted tracking-[2px] uppercase mb-2 transition-opacity duration-500 ${isRevealed ? 'opacity-100' : 'opacity-0'
                                        }`}>
                                        {positions[i]}
                                    </span>

                                    {/* Card with flip */}
                                    <div
                                        className="relative cursor-pointer"
                                        style={{
                                            perspective: '800px',
                                            width: reading.cards.length <= 3 ? '120px' : '100px',
                                            height: reading.cards.length <= 3 ? '180px' : '150px',
                                        }}
                                        onClick={() => isRevealed && setSelectedCardIdx(isExpanded ? null : i)}
                                    >
                                        <div
                                            className="w-full h-full transition-all duration-700"
                                            style={{
                                                transformStyle: 'preserve-3d',
                                                transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0)',
                                            }}
                                        >
                                            {/* Card back */}
                                            <div
                                                className="absolute inset-0 rounded-xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 flex items-center justify-center shadow-lg"
                                                style={{ backfaceVisibility: 'hidden' }}
                                            >
                                                <div className="text-center">
                                                    <span className="text-2xl text-altar-gold/50">✦</span>
                                                    <div className="w-8 h-[1px] bg-altar-gold/20 mx-auto my-2" />
                                                    <span className="text-xs text-altar-gold/30 font-display">ARCANA</span>
                                                </div>
                                            </div>

                                            {/* Card front */}
                                            <div
                                                className={`absolute inset-0 rounded-xl overflow-hidden shadow-lg transition-shadow duration-500 ${isRevealed ? 'shadow-[0_0_20px_rgba(139,95,191,0.3)]' : ''
                                                    }`}
                                                style={{
                                                    backfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)',
                                                }}
                                            >
                                                <img
                                                    src={card.image}
                                                    alt={card.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiByeD0iMTIiIGZpbGw9IiM0YTJjNmQiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmaWxsPSIjZmZkNzAwIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKcqDwvdGV4dD4KPC9zdmc+Cg==';
                                                    }}
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <p className="text-[10px] text-white font-display truncate">{card.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Yes/No verdict for yes-no spread */}
                {reading.spread === 'yes-no' && allRevealed && reading.cards[0] && (() => {
                    const verdict = getYesNoVerdict(reading.cards[0].id);
                    const isYes = verdict === 'yes';
                    const isMaybe = verdict === 'maybe';
                    return (
                        <div className="mt-6 animate-fade-up">
                            <div className={`text-center py-6 px-4 rounded-2xl border ${isYes
                                ? 'bg-green-500/10 border-green-500/30'
                                : isMaybe
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-red-500/10 border-red-500/30'
                                }`}>
                                <span className="text-4xl block mb-2">
                                    {isYes ? '✅' : isMaybe ? '🔮' : '❌'}
                                </span>
                                <h3 className={`font-display text-3xl tracking-[5px] font-bold mb-2 ${isYes ? 'text-green-400' : isMaybe ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {isYes ? 'YES' : isMaybe ? 'MAYBE' : 'NO'}
                                </h3>
                                <p className="text-xs text-altar-muted">
                                    The <span className="text-altar-gold">{reading.cards[0].name}</span> {isYes ? 'affirms your question' : isMaybe ? 'suggests uncertainty — more clarity is needed' : 'advises caution or reconsideration'}
                                </p>
                            </div>
                        </div>
                    );
                })()}

                {/* Expanded card detail */}
                {selectedCardIdx !== null && (
                    <div className="mt-6 glass-strong rounded-2xl p-5 animate-fade-up">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <p className="text-[10px] font-display text-altar-muted tracking-[2px] uppercase mb-1">
                                    {positions[selectedCardIdx]}
                                </p>
                                <h3 className="font-display text-lg text-altar-gold mb-2">
                                    {reading.cards[selectedCardIdx].name}
                                </h3>
                                <p className="text-sm text-altar-text/80 leading-relaxed mb-3">
                                    {reading.cards[selectedCardIdx].meaning}
                                </p>

                                {/* AI Insight / Free tease */}
                                {isPremium ? (
                                    <div className="mt-3">
                                        <p className="text-xs text-altar-muted mb-1">
                                            <span className="text-altar-gold">✦</span> Reversed: <span className="italic text-white/60">{reading.cards[selectedCardIdx].reversed}</span>
                                        </p>
                                        {cardInsight ? (
                                            <div className="bg-altar-gold/5 border border-altar-gold/15 rounded-xl p-3 mt-2">
                                                <p className="text-[10px] font-display text-altar-gold tracking-[2px] uppercase mb-1">✨ Mystic Insight</p>
                                                <AIResponseRenderer text={cardInsight} compact />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    setCardInsightLoading(true);
                                                    setAiError(null);
                                                    try {
                                                        const ai = new AIService();
                                                        const card = reading.cards[selectedCardIdx!];
                                                        const insight = await ai.getCardInsight(
                                                            card.name, card.meaning, card.reversed,
                                                            { theme: reading.theme, question: reading.question }
                                                        );
                                                        setCardInsight(insight);
                                                    } catch (e: any) {
                                                        setAiError(e.message);
                                                    } finally {
                                                        setCardInsightLoading(false);
                                                    }
                                                }}
                                                disabled={cardInsightLoading}
                                                className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-altar-gold/10 to-altar-bright/10 border border-altar-gold/20 text-xs text-altar-gold font-display tracking-wide hover:border-altar-gold/40 transition-all flex items-center justify-center gap-2"
                                            >
                                                {cardInsightLoading ? (
                                                    <div className="space-y-2 w-full">
                                                        <div className="h-2.5 shimmer-skeleton w-full" />
                                                        <div className="h-2.5 shimmer-skeleton w-[75%]" />
                                                    </div>
                                                ) : (
                                                    <>✨ Get Insight</>
                                                )}
                                            </button>
                                        )}
                                        {aiError && <p className="text-xs text-red-400 mt-2">{aiError}</p>}
                                    </div>
                                ) : (
                                    <div className="bg-altar-gold/5 border border-altar-gold/15 rounded-xl p-3 mt-3">
                                        <p className="text-xs text-altar-muted mb-2">
                                            <span className="text-altar-gold">✦</span> Reversed meaning: <span className="italic text-white/50">{reading.cards[selectedCardIdx].reversed?.slice(0, 30)}…</span>
                                        </p>
                                        <button className="text-xs text-altar-gold font-display tracking-wide hover:underline">
                                            Unlock Premium Insight →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Personalized memory banner */}
                {allRevealed && isPersonalized() && (() => {
                    const prefix = getPersonalizedPrefix();
                    const profile = getMemoryProfile();
                    if (!prefix) return null;
                    return (
                        <div className="mt-6 animate-fade-up">
                            <div className="relative overflow-hidden rounded-2xl border border-altar-gold/15 bg-gradient-to-br from-altar-gold/5 via-altar-mid/10 to-altar-bright/5 p-5">
                                {/* Subtle glow */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-altar-gold/5 rounded-full blur-3xl" />
                                <div className="relative">
                                    <p className="text-[10px] font-display text-altar-gold/70 tracking-[3px] uppercase mb-2 flex items-center gap-1.5">
                                        <span className="animate-pulse">✦</span> The Cards Remember
                                    </p>
                                    <p className="text-sm text-altar-text/85 leading-relaxed italic">
                                        {prefix}
                                    </p>
                                    {profile.topKeywords.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {profile.topKeywords.slice(0, 3).map(kw => (
                                                <span key={kw} className="text-[9px] px-2 py-0.5 rounded-full bg-altar-gold/8 border border-altar-gold/10 text-altar-gold/60 font-display tracking-wide">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Post-draw actions — show after all revealed */}
                {allRevealed && (
                    <div className="mt-8 space-y-3 animate-fade-up">
                        <h3 className="font-display text-center text-sm text-altar-muted tracking-[3px] uppercase mb-4">
                            ✧ Your ritual is complete ✧
                        </h3>

                        <div className="flex gap-3">
                            {/* Save to Past */}
                            <button
                                onClick={handleSave}
                                disabled={saved}
                                className={`flex-1 py-3 rounded-xl font-display text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${saved
                                    ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                                    : 'glass border border-white/10 text-altar-text hover:border-altar-gold/30 hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                {saved ? '✅ Saved' : '📜 Save to Past'}
                            </button>

                            {/* Share to Social */}
                            <button
                                onClick={handleShare}
                                disabled={shared}
                                className={`flex-1 py-3 rounded-xl font-display text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${shared
                                    ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
                                    : 'glass border border-white/10 text-altar-text hover:border-altar-gold/30 hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                {shared ? '✅ Shared' : '📤 Share'}
                            </button>
                        </div>

                        {/* AI Spread Reading / Premium upsell */}
                        {isPremium ? (
                            spreadInsight ? (
                                <div className="glass-strong rounded-2xl p-5">
                                    <h4 className="font-display text-sm text-altar-gold tracking-[2px] uppercase mb-3 flex items-center gap-2">
                                        <span>🔮</span> Deep Spread Reading
                                    </h4>
                                    <AIResponseRenderer text={spreadInsight} />
                                </div>
                            ) : (
                                <button
                                    onClick={async () => {
                                        setSpreadInsightLoading(true);
                                        setAiError(null);
                                        try {
                                            const ai = new AIService();
                                            const cards = reading.cards.map((c, i) => ({
                                                name: c.name,
                                                meaning: c.meaning,
                                                position: positions[i] || `Card ${i + 1}`,
                                            }));
                                            const insight = await ai.getSpreadInsight(
                                                cards, reading.spread, reading.theme, reading.question
                                            );
                                            setSpreadInsight(insight);
                                        } catch (e: any) {
                                            setAiError(e.message);
                                        } finally {
                                            setSpreadInsightLoading(false);
                                        }
                                    }}
                                    disabled={spreadInsightLoading}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-altar-gold/10 to-altar-bright/10 border border-altar-gold/20 text-center transition-all hover:border-altar-gold/40 hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    {spreadInsightLoading ? (
                                        <div className="space-y-2.5 w-full px-4 py-1">
                                            <div className="h-3 shimmer-skeleton w-full" />
                                            <div className="h-3 shimmer-skeleton w-[85%]" />
                                            <div className="h-3 shimmer-skeleton w-[65%]" />
                                        </div>
                                    ) : (
                                        <>
                                            <span className="shimmer-text font-display text-sm font-semibold tracking-wide">
                                                🔮 Get AI Spread Reading
                                            </span>
                                            <p className="text-[10px] text-altar-muted mt-0.5">Deep interpretation of your full reading</p>
                                        </>
                                    )}
                                </button>
                            )
                        ) : (
                            <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-altar-gold/10 to-altar-bright/10 border border-altar-gold/20 text-center transition-all hover:border-altar-gold/40 hover:scale-[1.01] active:scale-[0.99]">
                                <span className="shimmer-text font-display text-sm font-semibold tracking-wide">
                                    👑 Unlock Premium Insight
                                </span>
                                <p className="text-[10px] text-altar-muted mt-0.5">Deep personalized readings · $4.99/mo</p>
                            </button>
                        )}
                        {aiError && <p className="text-xs text-red-400 text-center mt-2">{aiError}</p>}

                        {/* Draw again */}
                        <button
                            onClick={() => { onClose(); onTabChange('new'); }}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-altar-mid to-altar-bright text-white font-display text-sm font-semibold tracking-wide border border-altar-gold/15 hover:border-altar-gold/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                            ✦ Draw Again ✦
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
