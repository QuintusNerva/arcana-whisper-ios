import React, { useState } from 'react';

interface CourageCardProps {
    crisisCardNames: string[];
    onDismiss: () => void;
}

const COURAGE_MESSAGES: Record<string, string> = {
    'The Tower': 'Tower moments are terrifying — and they are almost always necessary. What crumbles was never truly yours to hold.',
    'The Devil': 'The Devil reveals what binds you — and in seeing the chain, you already hold the key to breaking it.',
    'Death': 'Death in tarot is not an ending — it is a sacred threshold. The universe is asking you to release, not to fear.',
    'The Moon': 'You are navigating uncertainty. The Moon asks you to trust your instincts even when you cannot see clearly.',
    'Three of Swords': 'Pain acknowledged is pain that can heal. This card says: you are allowed to grieve.',
    '3 of Swords': 'Pain acknowledged is pain that can heal. This card says: you are allowed to grieve.',
    'Ten of Swords': 'A cycle is ending with difficulty. But endings, even painful ones, create the space for what comes next.',
    '10 of Swords': 'A cycle is ending with difficulty. But endings, even painful ones, create the space for what comes next.',
    'Five of Cups': 'Grief is real. But the Five of Cups also shows two full cups still standing behind you.',
    '5 of Cups': 'Grief is real. But the Five of Cups also shows two full cups still standing behind you.',
    'Nine of Swords': 'The anxiety you feel at 3am often outpaces reality. You are stronger than the stories your mind tells.',
    '9 of Swords': 'The anxiety you feel at 3am often outpaces reality. You are stronger than the stories your mind tells.',
    'Eight of Swords': 'You are not as trapped as you feel. The Eight of Swords says: look again — the blindfold is yours to remove.',
    '8 of Swords': 'You are not as trapped as you feel. The Eight of Swords says: look again — the blindfold is yours to remove.',
};

const DEFAULT_COURAGE = 'Challenge cards carry gifts wrapped in difficulty. The universe doesn\'t send tests you can\'t survive — only ones that will make you wiser.';

/**
 * CourageCard — Phase 2 component
 *
 * Shown in ReadingResult when crisis/challenge tarot cards are drawn.
 * Provides a warm, grounding message before the user reads the full interpretation.
 * Dismissable — never blocks the reading.
 */
export default function CourageCard({ crisisCardNames, onDismiss }: CourageCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isExpanded) return null;

    const primaryCard = crisisCardNames[0] ?? '';
    const message = COURAGE_MESSAGES[primaryCard] ?? DEFAULT_COURAGE;
    const hasMultiple = crisisCardNames.length > 1;

    return (
        <div
            className="mx-4 mb-5 rounded-2xl overflow-hidden relative"
            style={{
                background: 'linear-gradient(135deg, rgba(120,53,15,0.25) 0%, rgba(180,83,9,0.15) 50%, rgba(30,20,5,0.8) 100%)',
                border: '1px solid #f59e0b',
                boxShadow: '0 0 40px rgba(245,158,11,0.2), 0 0 20px rgba(245,158,11,0.1), 0 4px 16px rgba(0,0,0,0.4)',
            }}
        >
            {/* Amber top highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

            <div className="p-4 pt-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🌑</span>
                    <div>
                        <p className="text-amber-300/90 text-xs font-semibold tracking-widest uppercase">
                            A word before you read
                        </p>
                        <p className="text-white/50 text-[10px] mt-0.5">
                            {hasMultiple
                                ? `${crisisCardNames.join(' · ')} appeared in your spread`
                                : `${primaryCard} appeared in your spread`}
                        </p>
                    </div>
                </div>

                {/* Message */}
                <p className="text-white/80 text-[13px] leading-relaxed font-light italic">
                    "{message}"
                </p>

                {/* Breathing prompt */}
                <div
                    className="mt-3 py-2.5 px-3 rounded-xl"
                    style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.1)' }}
                >
                    <p className="text-amber-200/60 text-[11px] text-center">
                        Take a slow breath in · Hold · Release
                    </p>
                </div>

                {/* Dismiss */}
                <button
                    onClick={() => { setIsExpanded(false); onDismiss(); }}
                    className="mt-3 w-full text-center text-[11px] text-white/35 hover:text-white/55 transition-colors"
                >
                    I'm ready to continue →
                </button>
            </div>
        </div>
    );
}
