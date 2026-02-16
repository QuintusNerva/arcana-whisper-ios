interface DrawIconProps {
    className?: string;
}

export function DrawIcon({ className }: DrawIconProps) {
    return (
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <radialGradient id="clayCard1" cx="30%" cy="25%">
                    <stop offset="0%" style={{ stopColor: '#8B5FC5', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#5A3585', stopOpacity: 1 }} />
                </radialGradient>
                <radialGradient id="clayCard2" cx="35%" cy="20%">
                    <stop offset="0%" style={{ stopColor: '#9B6FD5', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#6B45A5', stopOpacity: 1 }} />
                </radialGradient>
                <linearGradient id="cardGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#FFE55C', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                </linearGradient>
                <filter id="cardShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
                    <feOffset dx="0" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.4" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g filter="url(#cardShadow)">
                {/* Back card — tilted left */}
                <g transform="translate(32, 34) rotate(-12)">
                    <rect x="-11" y="-17" width="22" height="34" rx="3" fill="url(#clayCard1)" stroke="#FFD700" strokeWidth="0.8" opacity="0.7" />
                    <rect x="-7" y="-13" width="14" height="26" rx="1.5" fill="none" stroke="#FFD700" strokeWidth="0.5" opacity="0.3" />
                </g>

                {/* Middle card — tilted right slightly */}
                <g transform="translate(32, 33) rotate(5)">
                    <rect x="-11" y="-17" width="22" height="34" rx="3" fill="url(#clayCard2)" stroke="#FFD700" strokeWidth="0.8" opacity="0.85" />
                    <rect x="-7" y="-13" width="14" height="26" rx="1.5" fill="none" stroke="#FFD700" strokeWidth="0.5" opacity="0.3" />
                </g>

                {/* Front card — centered */}
                <g transform="translate(32, 32)">
                    <rect x="-12" y="-18" width="24" height="36" rx="3.5" fill="url(#clayCard1)" stroke="#FFD700" strokeWidth="1" />
                    {/* Inner border */}
                    <rect x="-8" y="-14" width="16" height="28" rx="2" fill="none" stroke="#FFD700" strokeWidth="0.6" opacity="0.5" />
                    {/* Star/sparkle in center */}
                    <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="url(#cardGold)" opacity="0.9" />
                    {/* Highlight */}
                    <rect x="-10" y="-16" width="6" height="10" rx="1.5" fill="#9B6FC5" opacity="0.3" />
                </g>
            </g>
        </svg>
    );
}