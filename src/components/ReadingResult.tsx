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
import CourageCard from './CourageCard';
import { detectCrisisCards } from '../services/empowerment.service';

interface ReadingResultProps {
    reading: Reading;
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
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

const goldBtnStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(184,134,11,0.08) 100%)',
    border: '1px solid var(--color-gold-glow-med)',
    borderRadius: '12px',
    color: 'var(--color-gold-100)',
    fontFamily: 'var(--font-display)',
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

export function ReadingResult({ reading, onClose, onTabChange, subscription, onShowPremium }: ReadingResultProps) {
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
    const [courageCardDismissed, setCourageCardDismissed] = React.useState(false);
    const isPremium = subscription === 'premium';

    // Detect crisis/challenge cards in this reading
    const crisisResult = React.useMemo(
        () => detectCrisisCards(reading.cards.map(c => c.name)),
        [reading.cards]
    );

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
            <header className="sticky top-0 z-30 backdrop-blur-xl safe-top" style={{
                background: 'rgba(13,6,24,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
                <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                    <button onClick={onClose} style={{ ...mutedTextStyle, fontSize: '14px', fontFamily: 'var(--font-display)', letterSpacing: '1px' }} className="hover:text-white transition-colors">
                        ✕ Close
                    </button>
                    <h2 style={{ ...headerStyle, fontSize: '14px' }}>YOUR READING</h2>
                    <div className="w-12" />
                </div>
            </header>

            <div className="relative z-10 max-w-[500px] mx-auto px-4 pb-32">
                {/* Courage Card — shown when challenge cards present */}
                {crisisResult.hasCrisis && !courageCardDismissed && (
                    <div className="mt-4">
                        <CourageCard
                            crisisCardNames={crisisResult.crisisCards}
                            onDismiss={() => setCourageCardDismissed(true)}
                        />
                    </div>
                )}

                {/* Reading info */}
                {reading.question && (
                    <div className="mt-4 mb-2 p-4" style={goldCardStyle}>
                        <p style={{ ...headerStyle, fontSize: '10px', marginBottom: '4px' }}>Your Question</p>
                        <p style={{ ...mutedTextStyle, fontSize: '14px', fontStyle: 'italic', color: 'rgba(226,232,240,0.9)' }}>"{reading.question}"</p>
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
                                    <span className={`transition-opacity duration-500 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}
                                        style={{ ...headerStyle, fontSize: '10px', marginBottom: '8px' }}>
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
                                                className="absolute inset-0 rounded-xl flex items-center justify-center"
                                                style={{
                                                    backfaceVisibility: 'hidden',
                                                    background: 'linear-gradient(135deg, #1c1538 0%, #130f2e 100%)',
                                                    border: '1px solid var(--color-gold-glow-med)',
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                                }}
                                            >
                                                <div className="text-center">
                                                    <span style={{ fontSize: '24px', color: 'var(--color-gold-100)', opacity: 0.5 }}>✦</span>
                                                    <div style={{ width: '32px', height: '1px', background: 'rgba(212,175,55,0.2)', margin: '8px auto' }} />
                                                    <span style={{ ...headerStyle, fontSize: '10px', opacity: 0.3 }}>ARCANA</span>
                                                </div>
                                            </div>

                                            {/* Card front */}
                                            <div
                                                className={`absolute inset-0 rounded-xl overflow-hidden transition-shadow duration-500`}
                                                style={{
                                                    backfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)',
                                                    border: '1px solid var(--color-gold-glow-med)',
                                                    boxShadow: isRevealed
                                                        ? '0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(212,175,55,0.15)'
                                                        : '0 4px 20px rgba(0,0,0,0.4)',
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
                                                    <p style={{ ...headerStyle, fontSize: '10px', color: 'white' }} className="truncate">{card.name}</p>
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
                    const accentColor = isYes ? 'rgba(74,222,128,0.25)' : isMaybe ? 'rgba(251,191,36,0.25)' : 'rgba(248,113,113,0.25)';
                    const textColor = isYes ? '#4ade80' : isMaybe ? '#fbbf24' : '#f87171';
                    return (
                        <div className="mt-6 animate-fade-up">
                            <div className="text-center py-6 px-4" style={{
                                ...primaryCardStyle,
                                border: `1px solid ${accentColor}`,
                                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${accentColor}`,
                            }}>
                                <span className="text-4xl block mb-2">
                                    {isYes ? '✅' : isMaybe ? '🔮' : '❌'}
                                </span>
                                <h3 className="font-display text-3xl tracking-[5px] font-bold mb-2" style={{ color: textColor }}>
                                    {isYes ? 'YES' : isMaybe ? 'MAYBE' : 'NO'}
                                </h3>
                                <p style={{ ...mutedTextStyle, fontSize: '12px' }}>
                                    The <span style={{ color: 'var(--color-gold-100)' }}>{reading.cards[0].name}</span> {isYes ? 'affirms your question' : isMaybe ? 'suggests uncertainty — more clarity is needed' : 'advises caution or reconsideration'}
                                </p>
                            </div>
                        </div>
                    );
                })()}

                {/* Expanded card detail */}
                {selectedCardIdx !== null && (
                    <div className="mt-6 p-5 animate-fade-up" style={goldCardStyle}>
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <p style={{ ...headerStyle, fontSize: '10px', marginBottom: '4px' }}>
                                    {positions[selectedCardIdx]}
                                </p>
                                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold-100)', fontSize: '18px', marginBottom: '8px' }}>
                                    {reading.cards[selectedCardIdx].name}
                                </h3>
                                <p style={{ ...mutedTextStyle, fontSize: '14px', lineHeight: '1.6', marginBottom: '12px', color: 'rgba(226,232,240,0.8)' }}>
                                    {reading.cards[selectedCardIdx].meaning}
                                </p>

                                {/* AI Insight / Free tease */}
                                {isPremium ? (
                                    <div className="mt-3">
                                        <p style={{ ...mutedTextStyle, fontSize: '12px', marginBottom: '4px' }}>
                                            <span style={{ color: 'var(--color-gold-100)' }}>✦</span> Reversed: <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>{reading.cards[selectedCardIdx].reversed}</span>
                                        </p>
                                        {cardInsight ? (
                                            <div className="mt-2 p-3" style={insetStyle}>
                                                <p style={{ ...headerStyle, fontSize: '10px', marginBottom: '4px' }}>✨ Mystic Insight</p>
                                                <AIResponseRenderer text={cardInsight} compact />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    const capturedIdx = selectedCardIdx;
                                                    if (capturedIdx === null) return;
                                                    setCardInsightLoading(true);
                                                    setAiError(null);
                                                    try {
                                                        const ai = new AIService();
                                                        const card = reading.cards[capturedIdx];
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
                                                className="mt-2 w-full py-2.5 text-xs tracking-wide transition-all flex items-center justify-center gap-2"
                                                style={goldBtnStyle}
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
                                        {aiError && <p className="text-xs mt-2" style={{ color: '#f87171' }}>{aiError}</p>}
                                    </div>
                                ) : (
                                    <div className="mt-3 p-3" style={insetStyle}>
                                        <p style={{ ...mutedTextStyle, fontSize: '12px', marginBottom: '8px' }}>
                                            <span style={{ color: 'var(--color-gold-100)' }}>✦</span> Reversed meaning: <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>{reading.cards[selectedCardIdx].reversed?.slice(0, 30)}…</span>
                                        </p>
                                        <button onClick={onShowPremium} style={{ fontSize: '12px', color: 'var(--color-gold-100)', fontFamily: 'var(--font-display)', letterSpacing: '1px' }} className="hover:underline">
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
                            <div className="relative overflow-hidden p-5" style={goldCardStyle}>
                                {/* Subtle glow */}
                                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl" style={{ background: 'rgba(212,175,55,0.05)' }} />
                                <div className="relative">
                                    <p className="flex items-center gap-1.5 mb-2" style={{ ...headerStyle, fontSize: '10px', opacity: 0.7 }}>
                                        <span className="animate-pulse">✦</span> The Cards Remember
                                    </p>
                                    <p style={{ ...mutedTextStyle, fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', color: 'rgba(226,232,240,0.85)' }}>
                                        {prefix}
                                    </p>
                                    {profile.topKeywords.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {profile.topKeywords.slice(0, 3).map(kw => (
                                                <span key={kw} style={{
                                                    fontSize: '9px',
                                                    padding: '2px 8px',
                                                    borderRadius: '9999px',
                                                    background: 'rgba(212,175,55,0.08)',
                                                    border: '1px solid rgba(212,175,55,0.1)',
                                                    color: 'rgba(212,175,55,0.6)',
                                                    fontFamily: 'var(--font-display)',
                                                    letterSpacing: '1px',
                                                }}>
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
                        <h3 className="text-center mb-4" style={{ ...headerStyle, fontSize: '14px' }}>
                            ✧ Your ritual is complete ✧
                        </h3>

                        <div className="flex gap-3">
                            {/* Save to Past */}
                            <button
                                onClick={handleSave}
                                disabled={saved}
                                className="flex-1 py-3 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.97]"
                                style={{
                                    ...primaryCardStyle,
                                    border: saved ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--color-gold-glow-med)',
                                    color: saved ? '#4ade80' : 'var(--color-gold-100)',
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                {saved ? '✅ Saved' : '📜 Save to Past'}
                            </button>

                            {/* Share */}
                            <button
                                onClick={handleShare}
                                disabled={shared}
                                className="flex-1 py-3 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.97]"
                                style={{
                                    ...primaryCardStyle,
                                    border: shared ? '1px solid rgba(96,165,250,0.3)' : '1px solid var(--color-gold-glow-med)',
                                    color: shared ? '#60a5fa' : 'var(--color-gold-100)',
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                {shared ? '✅ Shared' : '📤 Share'}
                            </button>
                        </div>

                        {/* Spread Reading — manual trigger */}
                        {spreadInsightLoading ? (
                            <div className="p-5" style={goldCardStyle}>
                                <h4 className="flex items-center gap-2 mb-3" style={{ ...headerStyle, fontSize: '14px' }}>
                                    <span>🔮</span> Reading Your Spread…
                                </h4>
                                <div className="space-y-2.5 py-1">
                                    <div className="h-3 shimmer-skeleton w-full" />
                                    <div className="h-3 shimmer-skeleton w-[90%]" />
                                    <div className="h-3 shimmer-skeleton w-[78%]" />
                                    <div className="h-3 shimmer-skeleton w-[85%]" />
                                    <div className="h-3 shimmer-skeleton w-[60%]" />
                                </div>
                            </div>
                        ) : spreadInsight ? (
                            <div className="p-5" style={goldCardStyle}>
                                <h4 className="flex items-center gap-2 mb-3" style={{ ...headerStyle, fontSize: '14px' }}>
                                    <span>🔮</span> Your Spread Reading
                                </h4>
                                <AIResponseRenderer text={spreadInsight} />
                            </div>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (!isPremium) {
                                        onShowPremium();
                                        return;
                                    }
                                    const ai = new AIService();
                                    if (!ai.hasApiKey()) {
                                        setAiError('Please enter your OpenAI API key in the settings to generate AI readings.');
                                        return;
                                    }
                                    setSpreadInsightLoading(true);
                                    setAiError(null);
                                    try {
                                        const cardsContext = reading.cards.map((c, i) => ({
                                            name: c.name,
                                            meaning: c.meaning,
                                            position: positions[i] || `Card ${i + 1}`,
                                        }));
                                        const insight = await ai.getSpreadInsight(
                                            cardsContext, reading.spread, reading.theme, reading.question
                                        );
                                        setSpreadInsight(insight);
                                    } catch (e: any) {
                                        setAiError(e.message);
                                    } finally {
                                        setSpreadInsightLoading(false);
                                    }
                                }}
                                className="w-full py-4 text-center transition-all hover:scale-[1.01] active:scale-[0.99]"
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-gold-100), var(--color-gold-200))',
                                    borderRadius: '16px',
                                    border: '1px solid var(--color-gold-glow-med)',
                                    color: '#0d0b22',
                                    fontFamily: 'var(--font-display)',
                                    boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                                }}
                            >
                                <span className="font-display text-sm font-semibold tracking-wide flex items-center justify-center gap-2" style={{ color: '#0d0b22' }}>
                                    {isPremium ? '✨' : '👑'} {isPremium ? 'Get Deep Dive Reading' : 'Unlock Deep Dive Reading'}
                                </span>
                                <p style={{ fontSize: '10px', marginTop: '2px', color: 'rgba(13,11,34,0.6)' }}>
                                    {isPremium ? 'Unlock the mystic synthesis of your spread' : 'Premium mystic synthesis of your spread'}
                                </p>
                            </button>
                        )}
                        {aiError && <p className="text-xs text-center mt-2" style={{ color: '#f87171' }}>{aiError}</p>}

                        {/* Draw again */}
                        <button
                            onClick={() => { onClose(); onTabChange('new'); }}
                            className="w-full py-3.5 text-sm font-semibold tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99]"
                            style={{
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(184,134,11,0.1) 100%)',
                                border: '1px solid var(--color-gold-glow-med)',
                                borderRadius: '12px',
                                color: 'var(--color-gold-100)',
                                fontFamily: 'var(--font-display)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(212,175,55,0.08)',
                            }}
                        >
                            ✦ Draw Again ✦
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
