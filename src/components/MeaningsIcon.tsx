interface MeaningsIconProps {
    className?: string;
}

export function MeaningsIcon({ className }: MeaningsIconProps) {
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
                <rect x="-9" y="-7" width="18" height="12" rx="1.5" fill="url(#clayGold)"/>
                <ellipse cx="-5" cy="-4" rx="4" ry="5" fill="#FFFACD" opacity="0.5"/>
                
                <rect x="-0.5" y="-7" width="1" height="12" fill="#4A2870" opacity="0.6"/>
                
                <line x1="-6" y1="-4" x2="6" y2="-4" stroke="#4A2870" strokeWidth="1" opacity="0.4"/>
                <line x1="-6" y1="-1" x2="6" y2="-1" stroke="#4A2870" strokeWidth="1" opacity="0.4"/>
                <line x1="-6" y1="2" x2="6" y2="2" stroke="#4A2870" strokeWidth="1" opacity="0.4"/>
            </g>
        </svg>
    );
}