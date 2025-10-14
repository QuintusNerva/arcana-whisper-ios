interface ProfileIconProps {
    className?: string;
}

export function ProfileIcon({ className }: ProfileIconProps) {
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
                <circle cx="0" cy="-4" r="5" fill="url(#clayPurple)" stroke="url(#clayGold)" strokeWidth="2"/>
                <ellipse cx="-2" cy="-6" rx="2.5" ry="3" fill="#7B4FB0" opacity="0.5"/>
                
                <path d="M -9 7 Q -9 0 -5 -1.5 Q 0 -3 5 -1.5 Q 9 0 9 7" fill="url(#clayPurple)" stroke="url(#clayGold)" strokeWidth="2"/>
                <ellipse cx="-3" cy="1" rx="4" ry="3" fill="#8B5FC5" opacity="0.4"/>
            </g>
        </svg>
    );
}