import React from 'react';
import { Card } from '../models/card.model';

interface HorseshoeLayoutProps {
    cards: Card[];
    positions: string[];
    revealedCards: Set<number>;
    selectedCardIdx: number | null;
    onSelectCard: (idx: number | null) => void;
}

/*
 * Authentic Horseshoe (U-shape) geometry — 7 cards in a curved arc:
 *
 *   [1 Past]                       [7 Outcome]
 *      [2 Present]           [6 Advice]
 *         [3 Hidden]    [5 Surrounding]
 *              [4 Obstacle]
 *
 * Cards sweep from center outward into their arc positions.
 */

// Positions computed along a U/horseshoe arc — (x%, y%) of container
const ARC_POSITIONS: { x: number; y: number }[] = [
    /* 0 – Past         */ { x: 5, y: 5 },
    /* 1 – Present      */ { x: 12, y: 28 },
    /* 2 – Hidden       */ { x: 22, y: 52 },
    /* 3 – Obstacle     */ { x: 40, y: 68 },
    /* 4 – Surrounding  */ { x: 58, y: 52 },
    /* 5 – Advice       */ { x: 68, y: 28 },
    /* 6 – Outcome      */ { x: 75, y: 5 },
];

const CARD_W = 75;
const CARD_H = 115;

export function HorseshoeLayout({
    cards,
    positions,
    revealedCards,
    selectedCardIdx,
    onSelectCard,
}: HorseshoeLayoutProps) {
    const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
    const [animPhase, setAnimPhase] = React.useState<'stack' | 'sweep' | 'done'>('stack');

    React.useEffect(() => {
        const t1 = setTimeout(() => setAnimPhase('sweep'), 400);
        const t2 = setTimeout(() => setAnimPhase('done'), 400 + cards.length * 200 + 700);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [cards.length]);

    return (
        <div className="mt-4 mb-2 flex justify-center">
            <div
                className="relative"
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    height: `${CARD_H * 2.2}px`,
                }}
            >
                {/* Decorative arc guide line */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 440 260"
                    fill="none"
                    style={{ opacity: animPhase === 'done' ? 0.15 : 0, transition: 'opacity 1s ease' }}
                >
                    <path
                        d="M 30 30 C 30 200, 200 240, 220 240 C 240 240, 410 200, 410 30"
                        stroke="url(#horseshoeGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        fill="none"
                    />
                    <defs>
                        <linearGradient id="horseshoeGrad" x1="0" y1="0" x2="440" y2="0">
                            <stop offset="0%" stopColor="#8b5fbf" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="#ffd700" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#8b5fbf" stopOpacity="0.6" />
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
                    const cardDelay = i * 0.18;

                    return (
                        <div
                            key={`horseshoe-${i}`}
                            className="absolute"
                            style={{
                                width: `${CARD_W}px`,
                                height: `${CARD_H}px`,
                                left: isSweeping ? `${arc.x}%` : '42%',
                                top: isSweeping ? `${arc.y}%` : '35%',
                                transition: isSweeping
                                    ? `left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${cardDelay}s, top 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${cardDelay}s, transform 0.3s ease, opacity 0.4s ease ${cardDelay}s`
                                    : 'none',
                                opacity: animPhase === 'stack' ? (i === 0 ? 1 : 0.6) : 1,
                                zIndex: isHovered ? 20 : isSelected ? 15 : i,
                                transform: isHovered ? 'scale(1.1)' : '',
                            }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            onClick={() => isRevealed && onSelectCard(isSelected ? null : i)}
                        >
                            {/* Position label */}
                            <span
                                className={`absolute -top-4 left-0 right-0 text-center text-[8px] font-display text-altar-muted tracking-[1.5px] uppercase transition-opacity duration-500 whitespace-nowrap ${isRevealed && animPhase === 'done' ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                {positions[i]}
                            </span>

                            {/* Card body */}
                            <div className="w-full h-full cursor-pointer" style={{ perspective: '600px' }}>
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
                                                    ? 'shadow-[0_0_24px_rgba(139,95,191,0.5)] ring-2 ring-purple-400/50'
                                                    : 'shadow-[0_0_16px_rgba(139,95,191,0.35)]'
                                                : ''
                                            } ${isHovered && isRevealed ? 'shadow-[0_0_22px_rgba(139,95,191,0.45)]' : ''}`}
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

                            {/* Purple mystic glow after reveal */}
                            {isRevealed && animPhase === 'done' && (
                                <div
                                    className="absolute inset-0 rounded-lg pointer-events-none animate-pulse-glow"
                                    style={{
                                        boxShadow: '0 0 14px 3px rgba(139, 95, 191, 0.25)',
                                        animationDelay: `${i * 0.4}s`,
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
