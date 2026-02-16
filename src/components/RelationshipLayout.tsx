import React from 'react';
import { Card } from '../models/card.model';

interface RelationshipLayoutProps {
    cards: Card[];
    positions: string[];
    revealedCards: Set<number>;
    selectedCardIdx: number | null;
    onSelectCard: (idx: number | null) => void;
}

/*
 * Relationship spread — 5 cards in a heart/bridge arc:
 *
 *   [1 You]          [2 Partner]
 *       [4 Challenge]
 *         [3 Connection]
 *       [5 Potential]
 */

const ARC_POSITIONS: { x: number; y: number }[] = [
    /* 0 – You        */ { x: 10, y: 8 },
    /* 1 – Partner    */ { x: 62, y: 8 },
    /* 2 – Connection */ { x: 36, y: 42 },
    /* 3 – Challenge  */ { x: 18, y: 62 },
    /* 4 – Potential  */ { x: 54, y: 62 },
];

const CARD_W = 80;
const CARD_H = 122;

export function RelationshipLayout({
    cards,
    positions,
    revealedCards,
    selectedCardIdx,
    onSelectCard,
}: RelationshipLayoutProps) {
    const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
    const [animPhase, setAnimPhase] = React.useState<'stack' | 'sweep' | 'done'>('stack');

    React.useEffect(() => {
        const t1 = setTimeout(() => setAnimPhase('sweep'), 350);
        const t2 = setTimeout(() => setAnimPhase('done'), 350 + cards.length * 220 + 600);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [cards.length]);

    return (
        <div className="mt-4 mb-2 flex justify-center">
            <div
                className="relative"
                style={{ width: '100%', maxWidth: '400px', height: `${CARD_H * 2.1}px` }}
            >
                {/* Decorative heart/connection lines */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 400 260"
                    fill="none"
                    style={{ opacity: animPhase === 'done' ? 0.15 : 0, transition: 'opacity 1s ease' }}
                >
                    <path
                        d="M 50 50 L 185 135 L 320 50"
                        stroke="url(#relGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                    />
                    <path
                        d="M 100 200 L 185 135 L 275 200"
                        stroke="url(#relGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                    />
                    <circle cx="185" cy="135" r="6" fill="rgba(255,105,180,0.3)" />
                    <defs>
                        <linearGradient id="relGrad" x1="0" y1="0" x2="400" y2="0">
                            <stop offset="0%" stopColor="#ff69b4" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="#ffd700" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#ff69b4" stopOpacity="0.6" />
                        </linearGradient>
                    </defs>
                </svg>

                {cards.map((card, i) => {
                    const arc = ARC_POSITIONS[i];
                    if (!arc) return null;

                    const isRevealed = revealedCards.has(i);
                    const isSelected = selectedCardIdx === i;
                    const isHovered = hoveredIdx === i;
                    const isSweeping = animPhase === 'sweep' || animPhase === 'done';
                    const cardDelay = i * 0.2;

                    return (
                        <div
                            key={`rel-${i}`}
                            className="absolute"
                            style={{
                                width: `${CARD_W}px`,
                                height: `${CARD_H}px`,
                                left: isSweeping ? `${arc.x}%` : '40%',
                                top: isSweeping ? `${arc.y}%` : '30%',
                                transition: isSweeping
                                    ? `left 0.65s cubic-bezier(0.34,1.56,0.64,1) ${cardDelay}s, top 0.65s cubic-bezier(0.34,1.56,0.64,1) ${cardDelay}s, transform 0.3s ease, opacity 0.4s ease ${cardDelay}s`
                                    : 'none',
                                opacity: animPhase === 'stack' ? (i === 0 ? 1 : 0.6) : 1,
                                zIndex: isHovered ? 20 : isSelected ? 15 : i,
                                transform: isHovered ? 'scale(1.1)' : '',
                            }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            onClick={() => isRevealed && onSelectCard(isSelected ? null : i)}
                        >
                            <span
                                className={`absolute -top-4 left-0 right-0 text-center text-[8px] font-display text-altar-muted tracking-[1.5px] uppercase transition-opacity duration-500 whitespace-nowrap ${isRevealed && animPhase === 'done' ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                {positions[i]}
                            </span>

                            <div className="w-full h-full cursor-pointer" style={{ perspective: '600px' }}>
                                <div
                                    className="w-full h-full transition-all duration-700"
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0)',
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 rounded-lg bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 flex items-center justify-center shadow-lg"
                                        style={{ backfaceVisibility: 'hidden' }}
                                    >
                                        <div className="text-center">
                                            <span className="text-lg text-altar-gold/40">✦</span>
                                            <div className="w-5 h-[1px] bg-altar-gold/15 mx-auto my-1" />
                                            <span className="text-[7px] text-altar-gold/25 font-display">ARCANA</span>
                                        </div>
                                    </div>

                                    <div
                                        className={`absolute inset-0 rounded-lg overflow-hidden shadow-lg transition-shadow duration-500 ${isRevealed
                                                ? isSelected
                                                    ? 'shadow-[0_0_24px_rgba(255,105,180,0.5)] ring-2 ring-pink-400/50'
                                                    : 'shadow-[0_0_16px_rgba(255,105,180,0.3)]'
                                                : ''
                                            } ${isHovered && isRevealed ? 'shadow-[0_0_22px_rgba(255,105,180,0.4)]' : ''}`}
                                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                    >
                                        <img
                                            src={card.image}
                                            alt={card.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiByeD0iMTIiIGZpbGw9IiM0YTJjNmQiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmaWxsPSIjZmZkNzAwIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKcqDwvdGV4dD4KPC9zdmc+Cg==';
                                            }}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                                        <div className="absolute bottom-1 left-1 right-1">
                                            <p className="text-[8px] text-white font-display truncate text-center">{card.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isRevealed && animPhase === 'done' && (
                                <div
                                    className="absolute inset-0 rounded-lg pointer-events-none animate-pulse-glow"
                                    style={{ boxShadow: '0 0 14px 3px rgba(255, 105, 180, 0.2)', animationDelay: `${i * 0.4}s` }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
