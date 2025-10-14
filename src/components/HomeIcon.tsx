interface HomeIconProps {
    className?: string;
}

export function HomeIcon({ className }: HomeIconProps) {
    return (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
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
                <path d="M -8 3 L -8 12 L 8 12 L 8 3" fill="url(#clayGold)"/>
                <ellipse cx="-6" cy="5" rx="3" ry="4" fill="#FFF9E6" opacity="0.4"/>
                
                <path d="M -11 3 L 0 -8 L 11 3 Z" fill="url(#clayGold)"/>
                <ellipse cx="-2" cy="-1" rx="4" ry="3" fill="#FFFACD" opacity="0.5"/>
                
                <rect x="-3" y="5" width="6" height="7" rx="0.5" fill="#4A2870"/>
            </g>
        </svg>
    );
}