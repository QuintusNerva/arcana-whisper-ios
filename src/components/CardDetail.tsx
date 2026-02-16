import React from 'react';
import { Card } from '../models/card.model';
import { BottomNav } from './BottomNav';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';

interface CardDetailProps {
    card: Card;
    onClose: () => void;
    currentTab: string;
    onTabChange: (tab: string) => void;
    subscription: string;
}

const ELEMENT_ICONS: Record<string, string> = {
    Fire: '🔥', Water: '💧', Air: '💨', Earth: '🌿',
};

export function CardDetail({ card, onClose, currentTab, onTabChange, subscription }: CardDetailProps) {
    const [showReversed, setShowReversed] = React.useState(false);
    const [aiInsight, setAiInsight] = React.useState<string | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [aiError, setAiError] = React.useState<string | null>(null);
    const isPremium = subscription === 'premium';

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">
                            ← Back
                        </button>
                        <h2 className="font-display text-sm text-altar-gold tracking-[3px]">CARD DETAIL</h2>
                        <div className="w-12" />
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Hero card image */}
                    <div className="flex justify-center mt-6 mb-6">
                        <div className="relative animate-card-entrance">
                            {/* Glow behind */}
                            <div className="absolute inset-0 rounded-2xl bg-altar-gold/10 blur-[40px] animate-pulse-glow" />
                            <img
                                src={card.image}
                                alt={card.name}
                                className="relative w-[180px] h-[270px] rounded-2xl object-cover shadow-xl animate-pulse-glow"
                                onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjI3MCIgdmlld0JveD0iMCAwIDE4MCAyNzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMjcwIiByeD0iMTYiIGZpbGw9IiM0YTJjNmQiLz4KPHRleHQgeD0iOTAiIHk9IjEzNSIgZmlsbD0iI2ZmZDcwMCIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7inKg8L3RleHQ+Cjwvc3ZnPgo=';
                                }}
                            />
                        </div>
                    </div>

                    {/* Card name + meta */}
                    <div className="text-center mb-6 animate-fade-up">
                        <h1 className="font-display text-2xl text-altar-gold tracking-[3px] mb-2">{card.name}</h1>
                        <p className="text-sm text-altar-muted italic">{card.description}</p>

                        {/* Meta badges */}
                        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                            {card.suit && (
                                <span className="glass px-3 py-1 rounded-full text-[10px] font-display text-altar-text tracking-wide">
                                    {card.suit}
                                </span>
                            )}
                            {card.number !== undefined && (
                                <span className="glass px-3 py-1 rounded-full text-[10px] font-display text-altar-gold tracking-wide">
                                    #{card.number}
                                </span>
                            )}
                            {card.element && (
                                <span className="glass px-3 py-1 rounded-full text-[10px] font-display text-altar-text tracking-wide">
                                    {ELEMENT_ICONS[card.element]} {card.element}
                                </span>
                            )}
                            {card.planet && (
                                <span className="glass px-3 py-1 rounded-full text-[10px] font-display text-altar-text tracking-wide">
                                    ☿ {card.planet}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Upright / Reversed toggle */}
                    <div className="flex glass rounded-xl p-1 mb-4 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                        <button
                            onClick={() => setShowReversed(false)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-display tracking-wide transition-all ${!showReversed
                                ? 'bg-altar-mid/60 text-altar-gold shadow-md'
                                : 'text-altar-muted hover:text-white'
                                }`}
                        >
                            ☀️ Upright
                        </button>
                        <button
                            onClick={() => setShowReversed(true)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-display tracking-wide transition-all ${showReversed
                                ? 'bg-altar-mid/60 text-altar-gold shadow-md'
                                : 'text-altar-muted hover:text-white'
                                }`}
                        >
                            🔄 Reversed
                        </button>
                    </div>

                    {/* Meaning content */}
                    <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3">
                            {showReversed ? '🔄 Reversed Meaning' : '☀️ Upright Meaning'}
                        </h3>
                        <p className="text-sm text-altar-text/90 leading-relaxed">
                            {showReversed ? card.reversed : card.meaning}
                        </p>
                    </div>

                    {/* Keywords */}
                    <div className="glass rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3">
                            ✦ Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {card.description.split(', ').map((keyword, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-full bg-altar-gold/5 border border-altar-gold/10 text-xs text-altar-text/80 font-display"
                                >
                                    {keyword.trim()}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Correspondences */}
                    {(card.element || card.planet) && (
                        <div className="glass rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3">
                                ◈ Correspondences
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {card.element && (
                                    <div className="bg-altar-deep/50 rounded-xl p-3 text-center">
                                        <span className="text-xl block mb-1">{ELEMENT_ICONS[card.element]}</span>
                                        <p className="text-[10px] text-altar-muted font-display tracking-[2px] uppercase">Element</p>
                                        <p className="text-sm text-altar-text font-display mt-0.5">{card.element}</p>
                                    </div>
                                )}
                                {card.planet && (
                                    <div className="bg-altar-deep/50 rounded-xl p-3 text-center">
                                        <span className="text-xl block mb-1">☿</span>
                                        <p className="text-[10px] text-altar-muted font-display tracking-[2px] uppercase">Ruling</p>
                                        <p className="text-sm text-altar-text font-display mt-0.5">{card.planet}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Deep Reading / Premium upsell */}
                    {isPremium ? (
                        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-altar-gold/30 via-altar-bright/20 to-altar-gold/30 mb-4 animate-fade-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
                            <div className="rounded-2xl bg-altar-dark/95 p-4">
                                {aiInsight ? (
                                    <>
                                        <p className="text-[10px] font-display text-altar-gold tracking-[2px] uppercase mb-2 flex items-center gap-1">
                                            <span className="text-lg">🔮</span> AI Deep Reading
                                        </p>
                                        <AIResponseRenderer text={aiInsight} />
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <span className="text-lg block mb-1">🔮</span>
                                        <p className="shimmer-text font-display text-sm font-semibold mb-1">AI Deep Reading</p>
                                        <p className="text-xs text-altar-muted mb-3">Get personalized AI insights for {card.name}</p>
                                        <button
                                            onClick={async () => {
                                                setAiLoading(true);
                                                setAiError(null);
                                                try {
                                                    const ai = new AIService();
                                                    const insight = await ai.getCardInsight(card.name, card.meaning, card.reversed);
                                                    setAiInsight(insight);
                                                } catch (e: any) {
                                                    setAiError(e.message);
                                                } finally {
                                                    setAiLoading(false);
                                                }
                                            }}
                                            disabled={aiLoading}
                                            className="px-5 py-2 rounded-full bg-altar-gold/10 border border-altar-gold/20 text-xs text-altar-gold font-display tracking-wide hover:border-altar-gold/40 transition-all flex items-center justify-center gap-2 mx-auto"
                                        >
                                            {aiLoading ? (
                                                <div className="space-y-2 w-full">
                                                    <div className="h-2.5 shimmer-skeleton w-full" />
                                                    <div className="h-2.5 shimmer-skeleton w-[80%]" />
                                                    <div className="h-2.5 shimmer-skeleton w-[60%]" />
                                                </div>
                                            ) : (
                                                <>✨ Get AI Insight</>
                                            )}
                                        </button>
                                        {aiError && <p className="text-xs text-red-400 mt-2">{aiError}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-altar-gold/30 via-altar-bright/20 to-altar-gold/30 mb-4 animate-fade-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
                            <div className="rounded-2xl bg-altar-dark/95 p-4 text-center">
                                <span className="text-lg block mb-1">👑</span>
                                <p className="shimmer-text font-display text-sm font-semibold mb-1">AI Deep Reading</p>
                                <p className="text-xs text-altar-muted mb-3">Get personalized AI insights for {card.name}</p>
                                <button className="px-5 py-2 rounded-full bg-altar-gold/10 border border-altar-gold/20 text-xs text-altar-gold font-display tracking-wide hover:border-altar-gold/40 transition-colors">
                                    Unlock Premium →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab={currentTab} onTabChange={onTabChange} />
        </div>
    );
}
