import React from 'react';
import { Card } from '../models/card.model';

interface CelticCrossLayoutProps {
    cards: Card[];
    positions: string[];
    revealedCards: Set<number>;
    selectedCardIdx: number | null;
    onSelectCard: (idx: number | null) => void;
}

/*
 * Authentic Celtic Cross geometry:
 *
 *  Grid: 7 columns × 5 rows
 *
 *              [5 Above]
 *   [3 Past]  [1+2 Cross]  [4 Future]        [10 Outcome]
 *              [6 Below]                      [ 9 Hopes  ]
 *                                             [ 8 Extern ]
 *                                             [ 7 Advice ]
 *
 *  Card 2 is rotated 90° and overlaps card 1 (the classic cross).
 */

const GRID_POSITIONS: { col: string; row: string; rotate?: number; z?: number }[] = [
    /* 0 – Situation  */ { col: '3 / 4', row: '3 / 4', z: 1 },
    /* 1 – Challenge   */ { col: '3 / 4', row: '3 / 4', rotate: 90, z: 2 },
    /* 2 – Past        */ { col: '2 / 3', row: '3 / 4' },
    /* 3 – Future      */ { col: '4 / 5', row: '3 / 4' },
    /* 4 – Above       */ { col: '3 / 4', row: '2 / 3' },
    /* 5 – Below       */ { col: '3 / 4', row: '4 / 5' },
    /* 6 – Advice      */ { col: '6 / 7', row: '5 / 6' },
    /* 7 – External    */ { col: '6 / 7', row: '4 / 5' },
    /* 8 – Hopes/Fears */ { col: '6 / 7', row: '3 / 4' },
    /* 9 – Outcome     */ { col: '6 / 7', row: '2 / 3' },
];

const CARD_W = 70;
const CARD_H = 108;

export function CelticCrossLayout({
    cards,
    positions,
    revealedCards,
    selectedCardIdx,
    onSelectCard,
}: CelticCrossLayoutProps) {
    const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
    const [animPhase, setAnimPhase] = React.useState<'stack' | 'fly' | 'done'>('stack');

    // Start fly-out after mount
    React.useEffect(() => {
        const t1 = setTimeout(() => setAnimPhase('fly'), 300);
        const t2 = setTimeout(() => setAnimPhase('done'), 300 + cards.length * 250 + 600);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [cards.length]);

    return (
        <div className="mt-4 mb-2 flex justify-center">
            <div
                className="relative"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(7, ${CARD_W}px)`,
                    gridTemplateRows: `repeat(5, ${CARD_H + 8}px)`,
                    gap: '6px',
                    width: `${CARD_W * 7 + 6 * 6}px`,
                }}
            >
                {cards.map((card, i) => {
                    const pos = GRID_POSITIONS[i];
                    if (!pos) return null;
                    const isRevealed = revealedCards.has(i);
                    const isSelected = selectedCardIdx === i;
                    const isHovered = hoveredIdx === i;
                    const isChallenge = i === 1;

                    // Animation: start centered, fly to position
                    const isFlyingOrDone = animPhase === 'fly' || animPhase === 'done';
                    const cardDelay = i * 0.22;

                    return (
                        <div
                            key={`celtic-${i}`}
                            className="relative"
                            style={{
                                gridColumn: isFlyingOrDone ? pos.col : '3 / 4',
                                gridRow: isFlyingOrDone ? pos.row : '3 / 4',
                                zIndex: pos.z || 0,
                                width: `${CARD_W}px`,
                                height: `${CARD_H}px`,
                                transition: isFlyingOrDone
                                    ? `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${cardDelay}s`
                                    : 'none',
                                opacity: animPhase === 'stack' ? (i === 0 ? 1 : 0.7) : 1,
                                transform: isChallenge && isFlyingOrDone
                                    ? `rotate(${pos.rotate}deg) ${isHovered ? 'scale(1.08)' : ''}`
                                    : isHovered ? 'scale(1.08)' : '',
                            }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            onClick={() => isRevealed && onSelectCard(isSelected ? null : i)}
                        >
                            {/* Position label */}
                            <span
                                className={`absolute -top-4 left-0 right-0 text-center text-[8px] font-display text-altar-muted tracking-[1.5px] uppercase transition-opacity duration-500 ${isRevealed && animPhase === 'done' ? 'opacity-100' : 'opacity-0'
                                    } ${isChallenge ? 'rotate-[-90deg] -top-2 -left-3 w-[60px]' : ''}`}
                            >
                                {positions[i]}
                            </span>

                            {/* Card body */}
                            <div
                                className="w-full h-full cursor-pointer"
                                style={{ perspective: '600px' }}
                            >
                                <div
                                    className="w-full h-full transition-all duration-700"
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0)',
                                    }}
                                >
                                    {/* Back (face-down) */}
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

                                    {/* Front (face-up) */}
                                    <div
                                        className={`absolute inset-0 rounded-lg overflow-hidden shadow-lg transition-shadow duration-500 ${isRevealed
                                                ? isSelected
                                                    ? 'shadow-[0_0_24px_rgba(255,215,0,0.4)] ring-2 ring-altar-gold/50'
                                                    : 'shadow-[0_0_16px_rgba(139,95,191,0.35)]'
                                                : ''
                                            } ${isHovered && isRevealed ? 'shadow-[0_0_20px_rgba(255,215,0,0.3)]' : ''}`}
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
                                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                                        <div className="absolute bottom-1 left-1 right-1">
                                            <p className="text-[8px] text-white font-display truncate text-center">{card.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mystic glow pulse after reveal */}
                            {isRevealed && animPhase === 'done' && (
                                <div
                                    className="absolute inset-0 rounded-lg pointer-events-none animate-pulse-glow"
                                    style={{
                                        boxShadow: '0 0 12px 2px rgba(139, 95, 191, 0.2)',
                                        animationDelay: `${i * 0.3}s`,
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
