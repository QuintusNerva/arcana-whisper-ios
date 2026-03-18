import React from 'react';

/* Gold color used across all icons */
const GOLD = '#D4AF37';
const GOLD_GLOW = 'drop-shadow(0 0 6px rgba(212,175,55,0.4))';

interface IconProps {
    size?: number;
}

const svgBase = (size: number): React.SVGAttributes<SVGSVGElement> => ({
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    style: { filter: GOLD_GLOW },
});

/* ── Tarot: Card with 8-pointed star ── */
export function IconTarot({ size = 48 }: IconProps) {
    return (
        <svg {...svgBase(size)}>
            {/* Card outline with notched corners */}
            <rect x="14" y="6" width="36" height="52" rx="4" stroke={GOLD} strokeWidth="1.5" />
            <rect x="16" y="8" width="32" height="48" rx="3" stroke={GOLD} strokeWidth="0.75" opacity="0.5" />
            {/* 8-pointed star */}
            <g transform="translate(32,32)">
                {[0, 45, 90, 135].map(angle => (
                    <line key={angle} x1="0" y1="-16" x2="0" y2="16"
                        stroke={GOLD} strokeWidth="1.2"
                        transform={`rotate(${angle})`} />
                ))}
                {/* Inner diamond */}
                <polygon points="0,-8 6,0 0,8 -6,0" stroke={GOLD} strokeWidth="1" fill="none" />
                {/* Center dot */}
                <circle r="2" fill={GOLD} opacity="0.8" />
            </g>
            {/* Radiating lines from star */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
                <line key={`ray-${angle}`}
                    x1="32" y1="32" x2={32 + 20 * Math.cos(angle * Math.PI / 180)} y2={32 + 20 * Math.sin(angle * Math.PI / 180)}
                    stroke={GOLD} strokeWidth="0.5" opacity="0.4" />
            ))}
        </svg>
    );
}

/* ── Relationships: Two overlapping hearts with sparkle ── */
export function IconRelationships({ size = 48 }: IconProps) {
    return (
        <svg {...svgBase(size)}>
            {/* Left heart */}
            <path d="M18 26 C18 20 24 16 28 22 L28 22" stroke={GOLD} strokeWidth="1.5" fill="none" />
            <path d="M38 26 C38 20 32 16 28 22" stroke={GOLD} strokeWidth="1.5" fill="none" />
            <path d="M18 26 C18 34 28 42 28 42 C28 42 38 34 38 26" stroke={GOLD} strokeWidth="1.5" fill="none" />
            {/* Right heart (offset) */}
            <path d="M26 24 C26 18 32 14 36 20 L36 20" stroke={GOLD} strokeWidth="1.5" fill="none" />
            <path d="M46 24 C46 18 40 14 36 20" stroke={GOLD} strokeWidth="1.5" fill="none" />
            <path d="M26 24 C26 32 36 40 36 40 C36 40 46 32 46 24" stroke={GOLD} strokeWidth="1.5" fill="none" />
            {/* Center sparkle */}
            <g transform="translate(32,30)">
                <line x1="0" y1="-4" x2="0" y2="4" stroke={GOLD} strokeWidth="1.2" />
                <line x1="-4" y1="0" x2="4" y2="0" stroke={GOLD} strokeWidth="1.2" />
                <line x1="-2.8" y1="-2.8" x2="2.8" y2="2.8" stroke={GOLD} strokeWidth="0.8" />
                <line x1="2.8" y1="-2.8" x2="-2.8" y2="2.8" stroke={GOLD} strokeWidth="0.8" />
            </g>
        </svg>
    );
}

/* ── Angel Numbers: "1111" with small wings ── */
export function IconAngelNumbers({ size = 48 }: IconProps) {
    return (
        <svg {...svgBase(size)}>
            {/* Wings left */}
            <path d="M8 28 C10 22 14 20 16 22 C14 24 12 26 12 28" stroke={GOLD} strokeWidth="1.2" fill="none" />
            <path d="M10 30 C12 24 15 22 17 24 C15 26 13 28 13 30" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.7" />
            {/* Wings right */}
            <path d="M56 28 C54 22 50 20 48 22 C50 24 52 26 52 28" stroke={GOLD} strokeWidth="1.2" fill="none" />
            <path d="M54 30 C52 24 49 22 47 24 C49 26 51 28 51 30" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.7" />
            {/* 1111 text */}
            <text x="32" y="36" textAnchor="middle" fontFamily="serif"
                fontSize="18" fontWeight="300" letterSpacing="2"
                fill="none" stroke={GOLD} strokeWidth="0.8">
                1111
            </text>
        </svg>
    );
}

/* ── Natal: Zodiac wheel ── */
export function IconNatal({ size = 48 }: IconProps) {
    return (
        <svg {...svgBase(size)}>
            {/* Outer circle */}
            <circle cx="32" cy="32" r="26" stroke={GOLD} strokeWidth="1.2" />
            {/* Inner circles */}
            <circle cx="32" cy="32" r="18" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
            <circle cx="32" cy="32" r="8" stroke={GOLD} strokeWidth="0.6" opacity="0.4" />
            <circle cx="32" cy="32" r="2" fill={GOLD} opacity="0.6" />
            {/* 12 dividing lines */}
            {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30) * Math.PI / 180;
                return (
                    <line key={i}
                        x1={32 + 18 * Math.cos(angle)} y1={32 + 18 * Math.sin(angle)}
                        x2={32 + 26 * Math.cos(angle)} y2={32 + 26 * Math.sin(angle)}
                        stroke={GOLD} strokeWidth="0.8" opacity="0.7" />
                );
            })}
            {/* Cross lines */}
            <line x1="32" y1="6" x2="32" y2="58" stroke={GOLD} strokeWidth="0.5" opacity="0.3" />
            <line x1="6" y1="32" x2="58" y2="32" stroke={GOLD} strokeWidth="0.5" opacity="0.3" />
        </svg>
    );
}

/* ── Family: Three-star constellation ── */
export function IconFamily({ size = 48 }: IconProps) {
    const stars: [number, number][] = [[20, 34], [42, 22], [38, 44]];
    return (
        <svg {...svgBase(size)}>
            {/* Connecting lines */}
            <line x1="20" y1="34" x2="42" y2="22" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
            <line x1="42" y1="22" x2="38" y2="44" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
            <line x1="38" y1="44" x2="20" y2="34" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
            {/* Stars at each vertex */}
            {stars.map(([cx, cy], i) => (
                <g key={i} transform={`translate(${cx},${cy})`}>
                    <polygon
                        points="0,-6 1.5,-2 6,-2 2.5,1 4,5.5 0,3 -4,5.5 -2.5,1 -6,-2 -1.5,-2"
                        fill={GOLD} opacity="0.9"
                    />
                </g>
            ))}
        </svg>
    );
}

/* ── Career: Compass rose ── */
export function IconCareer({ size = 48 }: IconProps) {
    return (
        <svg {...svgBase(size)}>
            {/* Outer circle */}
            <circle cx="32" cy="32" r="24" stroke={GOLD} strokeWidth="1" />
            <circle cx="32" cy="32" r="20" stroke={GOLD} strokeWidth="0.6" opacity="0.5" />
            {/* Compass points */}
            <polygon points="32,8 34,28 32,30 30,28" fill={GOLD} opacity="0.8" />
            <polygon points="32,56 34,36 32,34 30,36" fill={GOLD} opacity="0.5" />
            <polygon points="8,32 28,30 30,32 28,34" fill={GOLD} opacity="0.5" />
            <polygon points="56,32 36,30 34,32 36,34" fill={GOLD} opacity="0.5" />
            {/* Diagonal points */}
            {[45, 135, 225, 315].map(angle => {
                const rad = angle * Math.PI / 180;
                const x = 32 + 22 * Math.cos(rad);
                const y = 32 + 22 * Math.sin(rad);
                return <circle key={angle} cx={x} cy={y} r="1" fill={GOLD} opacity="0.5" />;
            })}
            {/* Center */}
            <circle cx="32" cy="32" r="3" stroke={GOLD} strokeWidth="1" />
            <circle cx="32" cy="32" r="1" fill={GOLD} />
            {/* N star */}
            <polygon points="32,3 33,6 31,6" fill={GOLD} opacity="0.8" />
            {/* Cardinal letters */}
            <text x="32" y="6" textAnchor="middle" fontSize="5" fill={GOLD} fontFamily="serif" opacity="0.7">N</text>
            <text x="32" y="60" textAnchor="middle" fontSize="5" fill={GOLD} fontFamily="serif" opacity="0.7">S</text>
            <text x="7" y="34" textAnchor="middle" fontSize="5" fill={GOLD} fontFamily="serif" opacity="0.7">W</text>
            <text x="57" y="34" textAnchor="middle" fontSize="5" fill={GOLD} fontFamily="serif" opacity="0.7">E</text>
        </svg>
    );
}

/* ── Moon: Crescent moon with stars ── */
export function IconMoon({ size = 48 }: IconProps) {
    return (
        <svg {...svgBase(size)}>
            {/* Crescent moon - outer arc */}
            <path d="M38 12 C48 18 52 30 48 42 C44 52 32 58 22 54 C30 52 36 44 36 34 C36 24 30 16 22 12 C28 8 34 8 38 12 Z"
                stroke={GOLD} strokeWidth="1.5" fill="none" />
            {/* Inner crescent line */}
            <path d="M36 14 C44 20 48 30 44 40 C41 48 33 53 25 51 C31 48 35 42 35 34 C35 26 31 20 25 16 C29 13 33 12 36 14 Z"
                stroke={GOLD} strokeWidth="0.6" fill="none" opacity="0.4" />
            {/* Stars */}
            <g transform="translate(20,24) scale(0.6)">
                <polygon points="0,-6 1.5,-2 6,-2 2.5,1 4,5.5 0,3 -4,5.5 -2.5,1 -6,-2 -1.5,-2"
                    stroke={GOLD} strokeWidth="1" fill="none" />
            </g>
            <g transform="translate(16,36) scale(0.4)">
                <polygon points="0,-6 1.5,-2 6,-2 2.5,1 4,5.5 0,3 -4,5.5 -2.5,1 -6,-2 -1.5,-2"
                    stroke={GOLD} strokeWidth="1.5" fill="none" />
            </g>
            <g transform="translate(24,30) scale(0.5)">
                <polygon points="0,-6 1.5,-2 6,-2 2.5,1 4,5.5 0,3 -4,5.5 -2.5,1 -6,-2 -1.5,-2"
                    stroke={GOLD} strokeWidth="1.2" fill="none" />
            </g>
        </svg>
    );
}
