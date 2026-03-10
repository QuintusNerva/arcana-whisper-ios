import React from 'react';
import { getCardPatternAnalysis } from '../services/memory.service';
import { TarotService } from '../services/tarot.service';
import { Card } from '../models/card.model';

/**
 * PatternAwakening — Phase 2 component
 *
 * Shown in the user profile. Analyzes all-time card draw frequency to
 * surface the cards that keep returning (light patterns) and narrates
 * what recurring cards might mean on the user's journey.
 *
 * Only populated after 5+ readings (enough data to be meaningful).
 */
export default function PatternAwakening() {
    const analysis = getCardPatternAnalysis();
    const deck = React.useMemo(() => new TarotService().getAllCards(), []);

    if (analysis.totalReadings < 5 || analysis.lightCards.length === 0) {
        return (
            <div
                className="rounded-2xl p-4 text-center"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <p className="text-2xl mb-2">🌑</p>
                <p className="text-white/50 text-[12px]">
                    Your pattern will emerge after a few more readings.
                </p>
                <p className="text-white/30 text-[11px] mt-1">
                    {5 - analysis.totalReadings} reading{5 - analysis.totalReadings !== 1 ? 's' : ''} to unlock
                </p>
            </div>
        );
    }

    // Lookup card names from the deck
    const topCards = analysis.lightCards.map(lc => {
        const card = deck.find((c: Card) => c.id === lc.id);
        return { name: card?.name ?? lc.id, count: lc.count };
    });

    const maxCount = topCards[0]?.count ?? 1;

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(109,40,217,0.12) 0%, rgba(30,10,50,0.6) 100%)',
                border: '1px solid rgba(139,92,246,0.2)',
            }}
        >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-base">🌟</span>
                    <div>
                        <p className="text-purple-300/90 text-xs font-semibold tracking-widest uppercase">
                            Pattern Awakening
                        </p>
                        <p className="text-white/40 text-[10px]">Cards that keep finding you</p>
                    </div>
                </div>
            </div>

            {/* Card frequency list */}
            <div className="px-4 py-3 space-y-2.5">
                {topCards.map((card, i) => {
                    const pct = Math.round((card.count / maxCount) * 100);
                    const isTop = i === 0;
                    return (
                        <div key={card.name}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[12px] ${isTop ? 'text-purple-200 font-medium' : 'text-white/60'}`}>
                                    {isTop ? '✦ ' : ''}{card.name}
                                </span>
                                <span className="text-[10px] text-white/30">
                                    {card.count}×
                                </span>
                            </div>
                            <div
                                className="h-1 rounded-full"
                                style={{ background: 'rgba(255,255,255,0.08)' }}
                            >
                                <div
                                    className="h-1 rounded-full transition-all duration-700"
                                    style={{
                                        width: `${pct}%`,
                                        background: isTop
                                            ? 'linear-gradient(90deg, #8b5cf6, #c4b5fd)'
                                            : 'rgba(139,92,246,0.4)',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Narrative */}
            <div
                className="mx-3 mb-3 p-3 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}
            >
                <p className="text-white/55 text-[11px] leading-relaxed italic">
                    {buildNarrativeMessage(topCards[0]?.name, analysis.totalUniqueCards, analysis.totalReadings)}
                </p>
            </div>
        </div>
    );
}

function buildNarrativeMessage(topCard: string | undefined, uniqueCards: number, totalReadings: number): string {
    if (!topCard) return 'The cards are beginning to learn your language.';

    const messages = [
        `${topCard} has appeared more than any other card in your readings. It carries a message your soul is not yet done receiving.`,
        `Across ${totalReadings} readings, the cards have drawn from ${uniqueCards} different energies — but ${topCard} returns most. Pay attention to what it mirrors in you.`,
        `The universe keeps sending you ${topCard}. This is not chance. There is wisdom here still waiting to be claimed.`,
    ];
    return messages[totalReadings % messages.length];
}
