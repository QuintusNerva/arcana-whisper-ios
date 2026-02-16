import React from 'react';
import { Card } from '../models/card.model';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';

interface HeroCardProps {
    card: Card;
    onShare: () => void;
    subscription: string;
}

export function HeroCard({ card, onShare, subscription }: HeroCardProps) {
    const [showInsight, setShowInsight] = React.useState(false);
    const [isFlipped, setIsFlipped] = React.useState(false);
    const [aiInsight, setAiInsight] = React.useState<string | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const isPremium = subscription === 'premium';

    const handleTapInsight = async () => {
        setIsFlipped(true);
        setTimeout(() => setShowInsight(true), 400);

        // Auto-fetch AI insight for premium users
        if (isPremium && !aiInsight && !aiLoading) {
            setAiLoading(true);
            try {
                const ai = new AIService();
                const insight = await ai.getCardInsight(card.name, card.meaning, card.reversed);
                setAiInsight(insight);
            } catch {
                // Silently fall back to static meaning
            } finally {
                setAiLoading(false);
            }
        }
    };

    const handleFlipBack = () => {
        setShowInsight(false);
        setIsFlipped(false);
    };

    return (
        <section className="relative flex flex-col items-center py-8 px-4">
            {/* Ambient glow behind card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[400px] rounded-full bg-altar-gold/10 blur-[80px] animate-pulse-glow pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[300px] rounded-full bg-altar-bright/15 blur-[60px] pointer-events-none" />

            {/* Card container with perspective */}
            <div
                className="relative w-[220px] h-[340px] cursor-pointer animate-card-entrance"
                style={{ perspective: '1000px' }}
                onClick={showInsight ? handleFlipBack : handleTapInsight}
            >
                <div
                    className="relative w-full h-full transition-transform duration-700"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                    }}
                >
                    {/* Front face */}
                    <div
                        className="absolute inset-0 rounded-2xl overflow-hidden animate-pulse-glow"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <img
                            src={card.image}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjM0MCIgdmlld0JveD0iMCAwIDIyMCAzNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMjAiIGhlaWdodD0iMzQwIiByeD0iMTYiIGZpbGw9IiM0YTJjNmQiLz4KPHRleHQgeD0iMTEwIiB5PSIxNzAiIGZpbGw9IiNmZmQ3MDAiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4pyoPC90ZXh0Pgo8L3N2Zz4K';
                            }}
                        />
                        {/* Gradient overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="font-display text-xl text-white font-semibold tracking-wide">{card.name}</h2>
                            <p className="text-sm text-white/70 mt-1 line-clamp-2">{card.description}</p>
                        </div>
                    </div>

                    {/* Back face — AI Insight */}
                    <div
                        className="absolute inset-0 rounded-2xl overflow-hidden glass-strong flex flex-col items-center p-5 text-center"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <span className="text-2xl mb-2 shrink-0">🔮</span>
                        <h3 className="font-display text-base text-altar-gold mb-2 shrink-0">
                            {isPremium ? '✨ Tap for Insight' : 'Tap for Insight'}
                        </h3>
                        <div className="flex-1 overflow-y-auto min-h-0 w-full mb-2">
                            {aiLoading ? (
                                <div className="space-y-2.5 w-full px-2">
                                    <div className="h-2.5 shimmer-skeleton w-full" />
                                    <div className="h-2.5 shimmer-skeleton w-[88%]" />
                                    <div className="h-2.5 shimmer-skeleton w-[75%]" />
                                    <div className="h-2.5 shimmer-skeleton w-[60%]" />
                                </div>
                            ) : (
                                <AIResponseRenderer text={isPremium && aiInsight ? aiInsight : card.meaning} compact />
                            )}
                        </div>
                        <div className="shrink-0">
                            {!isPremium && (
                                <div className="px-3 py-1.5 rounded-full bg-altar-gold/10 border border-altar-gold/30 text-[10px] text-altar-gold">
                                    Go deeper with Premium ✦
                                </div>
                            )}
                            <p className="text-[10px] text-altar-muted mt-2">Tap to flip back</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card name below */}
            <h2 className="font-display text-2xl text-altar-gold mt-6 tracking-[3px] text-center animate-fade-up">
                {card.name}
            </h2>
            <p className="text-sm text-altar-muted mt-2 max-w-[300px] text-center animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                {card.description}
            </p>

            {/* Action buttons */}
            <div className="flex gap-3 mt-5 animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                <button
                    onClick={(e) => { e.stopPropagation(); handleTapInsight(); }}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-altar-mid to-altar-bright text-white text-sm font-medium border border-altar-gold/30 hover:border-altar-gold/60 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <span>✨</span> Tap for Insight
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onShare(); }}
                    className="px-4 py-2.5 rounded-full glass text-white/80 text-sm font-medium hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <span>📤</span> Share
                </button>
            </div>
        </section>
    );
}
