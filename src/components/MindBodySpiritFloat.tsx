import React from 'react';
import { Card } from '../models/card.model';

interface MindBodySpiritFloatProps {
    cards: Card[];
    onCardClick: (card: Card, index: number) => void;
}

const LABELS = ['Mind', 'Body', 'Spirit'];
const LABEL_ICONS = ['🧠', '💫', '🕊️'];
const FLOAT_CLASSES = [
    'animate-float',
    'animate-float-delayed',
    'animate-float-slow',
];

// Generate deterministic particle positions
function generateParticles(count: number) {
    const particles: Array<{ left: string; top: string; delay: string; char: string; size: string }> = [];
    const chars = ['✦', '✧', '·', '⊹', '✶'];
    for (let i = 0; i < count; i++) {
        particles.push({
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 23 + 7) % 100}%`,
            delay: `${(i * 1.3) % 8}s`,
            char: chars[i % chars.length],
            size: i % 3 === 0 ? 'text-base' : 'text-xs',
        });
    }
    return particles;
}

const particles = generateParticles(18);

export function MindBodySpiritFloat({ cards, onCardClick }: MindBodySpiritFloatProps) {
    const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null);

    if (cards.length < 3) return null;

    const handleCardClick = (card: Card, index: number) => {
        if (expandedIdx === index) {
            setExpandedIdx(null);
        } else {
            setExpandedIdx(index);
            onCardClick(card, index);
        }
    };

    return (
        <section className="relative py-8 px-4">
            {/* Section header */}
            <h3 className="font-display text-center text-lg tracking-[4px] text-altar-muted uppercase mb-8">
                <span className="text-altar-gold">✧</span> Today's Energy <span className="text-altar-gold">✧</span>
            </h3>

            {/* Particle field */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((p, i) => (
                    <span
                        key={i}
                        className={`absolute ${p.size} text-altar-gold/40 animate-particle`}
                        style={{
                            left: p.left,
                            top: p.top,
                            animationDelay: p.delay,
                            animationDuration: `${6 + (i % 4) * 2}s`,
                        }}
                    >
                        {p.char}
                    </span>
                ))}
            </div>

            {/* Three floating cards */}
            <div className="flex justify-center gap-5 relative z-10">
                {cards.slice(0, 3).map((card, index) => (
                    <div
                        key={card.id}
                        className={`flex flex-col items-center cursor-pointer transition-all duration-500 ${FLOAT_CLASSES[index]}`}
                        style={{ animationDelay: `${index * 0.4}s` }}
                        onClick={() => handleCardClick(card, index)}
                    >
                        {/* Card */}
                        <div className={`relative w-[100px] h-[150px] rounded-xl overflow-hidden shadow-lg transition-all duration-500 ${expandedIdx === index
                                ? 'scale-110 shadow-[0_0_30px_rgba(255,215,0,0.3)]'
                                : 'hover:scale-105 hover:shadow-[0_0_20px_rgba(139,95,191,0.3)]'
                            }`}>
                            <img
                                src={card.image}
                                alt={card.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDEwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTUwIiByeD0iMTIiIGZpbGw9IiM0YTJjNmQiLz4KPHRleHQgeD0iNTAiIHk9Ijc1IiBmaWxsPSIjZmZkNzAwIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKcqDwvdGV4dD4KPC9zdmc+Cg==`;
                                }}
                            />
                            {/* Subtle gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-altar-deep/60 to-transparent opacity-60" />
                        </div>

                        {/* Label */}
                        <div className="mt-3 flex flex-col items-center">
                            <span className="text-lg">{LABEL_ICONS[index]}</span>
                            <span className="text-xs text-altar-muted font-medium tracking-[2px] uppercase mt-1">
                                {LABELS[index]}
                            </span>
                        </div>

                        {/* Expanded meaning */}
                        {expandedIdx === index && (
                            <div className="mt-3 w-[140px] text-center animate-fade-up">
                                <p className="text-xs font-display text-altar-gold">{card.name}</p>
                                <p className="text-xs text-altar-text/70 mt-1 leading-relaxed">{card.description}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
