interface HistoryIconProps {
    className?: string;
}

export function HistoryIcon({ className }: HistoryIconProps) {
    return (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <radialGradient id="clayPurple" cx="35%" cy="30%">
                    <stop offset="0%" style={{stopColor:'#6B3FA0', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#4A2870', stopOpacity:1}} />
                </radialGradient>
                
                <radialGradient id="clayGold" cx="35%" cy="30%">
                    <stop offset="0%" style={{stopColor:'#FFE55C', stopOpacity:1}} />
                    <stop offset="50%" style={{stopColor:'#FFD700', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#D4AF37', stopOpacity:1}} />
                </radialGradient>
                
                <filter id="clayShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                    <feOffset dx="0" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.4"/>
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            <g filter="url(#clayShadow)" transform="translate(16, 16)">
                <circle cx="0" cy="0" r="10" fill="url(#clayPurple)" stroke="url(#clayGold)" strokeWidth="2"/>
                <ellipse cx="-4" cy="-4" rx="4" ry="5" fill="#8B5FC5" opacity="0.5"/>
                
                <line x1="0" y1="0" x2="0" y2="-6" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                <line x1="0" y1="0" x2="5" y2="0" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                
                <circle cx="0" cy="0" r="1.5" fill="#FFE55C"/>
                
                <path d="M 7 -7 L 10 -7 L 10 -4" stroke="url(#clayGold)" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </g>
        </svg>
    );
}