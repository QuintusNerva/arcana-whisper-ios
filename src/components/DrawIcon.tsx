interface DrawIconProps {
    className?: string;
}

export function DrawIcon({ className }: DrawIconProps) {
    return (
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <radialGradient id="clayDrawButton" cx="30%" cy="25%">
                    <stop offset="0%" style={{stopColor:'#8B5FC5', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#5A3585', stopOpacity:1}} />
                </radialGradient>
                
                <radialGradient id="clayGold" cx="35%" cy="30%">
                    <stop offset="0%" style={{stopColor:'#FFE55C', stopOpacity:1}} />
                    <stop offset="50%" style={{stopColor:'#FFD700', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#D4AF37', stopOpacity:1}} />
                </radialGradient>
                
                <filter id="strongShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
                    <feOffset dx="0" dy="3" result="offsetblur"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.5"/>
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            <g filter="url(#strongShadow)" transform="translate(32, 32)">
                <circle cx="0" cy="0" r="28" fill="url(#clayDrawButton)"/>
                <ellipse cx="-7" cy="-7" rx="10" ry="13" fill="#9B6FC5" opacity="0.4"/>
                
                <circle cx="0" cy="0" r="24" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.6"/>
                
                <rect x="-2" y="-12" width="4" height="24" rx="1.5" fill="url(#clayGold)"/>
                <rect x="-12" y="-2" width="24" height="4" rx="1.5" fill="url(#clayGold)"/>
                
                <rect x="-1" y="-12" width="1.5" height="8" fill="#FFF9E6" opacity="0.4"/>
                <rect x="-12" y="-1" width="8" height="1.5" fill="#FFE870" opacity="0.4"/>
            </g>
        </svg>
    );
}