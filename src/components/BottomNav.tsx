import React from 'react';
import { HomeIcon } from './HomeIcon';

// Sparkle icon for the ✨ Create tab — matches HomeIcon's clay gold palette
function SparkleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <radialGradient id="sparkleGold" cx="35%" cy="30%">
                    <stop offset="0%" style={{ stopColor: '#FFE55C', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                </radialGradient>
                <filter id="sparkleShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
                    <feOffset dx="0" dy="1.5" result="offsetblur" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <g filter="url(#sparkleShadow)" transform="translate(16,16)">
                {/* Large centre star */}
                <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="url(#sparkleGold)" />
                {/* Small top-right sparkle */}
                <path d="M7 -8 L8 -5.5 L10.5 -4.5 L8 -3.5 L7 -1 L6 -3.5 L3.5 -4.5 L6 -5.5 Z" fill="url(#sparkleGold)" opacity="0.85" />
                {/* Tiny bottom-left dot */}
                <circle cx="-7" cy="7" r="1.5" fill="url(#sparkleGold)" opacity="0.7" />
            </g>
        </svg>
    );
}

interface BottomNavProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
}

// Book icon for the School tab — matches clay gold palette
function BookIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <radialGradient id="bookGold" cx="35%" cy="30%">
                    <stop offset="0%" style={{ stopColor: '#FFE55C', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                </radialGradient>
                <filter id="bookShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
                    <feOffset dx="0" dy="1.5" result="offsetblur" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <g filter="url(#bookShadow)" transform="translate(16,16)">
                {/* Book cover */}
                <rect x="-9" y="-10" width="18" height="20" rx="2" fill="url(#bookGold)" />
                {/* Spine line */}
                <rect x="-9" y="-10" width="3" height="20" rx="1" fill="#D4AF37" opacity="0.6" />
                {/* Page lines */}
                <rect x="-3" y="-6" width="8" height="1.5" rx="0.75" fill="#4A2870" opacity="0.4" />
                <rect x="-3" y="-2.5" width="8" height="1.5" rx="0.75" fill="#4A2870" opacity="0.4" />
                <rect x="-3" y="1" width="5" height="1.5" rx="0.75" fill="#4A2870" opacity="0.4" />
                {/* Star badge */}
                <path d="M6 4 L6.6 5.8 L8.5 5.8 L7 6.9 L7.6 8.7 L6 7.6 L4.4 8.7 L5 6.9 L3.5 5.8 L5.4 5.8 Z" fill="#FFE55C" opacity="0.9" />
            </g>
        </svg>
    );
}

// Tarot crystal ball icon for the Tarot tab
function TarotIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <radialGradient id="tarotGold" cx="35%" cy="30%">
                    <stop offset="0%" style={{ stopColor: '#FFE55C', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                </radialGradient>
                <radialGradient id="crystalBlue" cx="35%" cy="30%">
                    <stop offset="0%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
                    <stop offset="60%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#6d28d9', stopOpacity: 1 }} />
                </radialGradient>
                <filter id="tarotShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
                    <feOffset dx="0" dy="1.5" result="offsetblur" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <g filter="url(#tarotShadow)" transform="translate(16,16)">
                {/* Orb body */}
                <circle cx="0" cy="0" r="9" fill="url(#crystalBlue)" />
                {/* Shine */}
                <ellipse cx="-2.5" cy="-3" rx="3" ry="2" fill="white" opacity="0.25" />
                {/* Stand */}
                <rect x="-5" y="9" width="10" height="2" rx="1" fill="url(#tarotGold)" />
                {/* Star in orb */}
                <path d="M0 -4.5 L0.9 -1.5 L4 -1.5 L1.5 0.3 L2.4 3.3 L0 1.5 L-2.4 3.3 L-1.5 0.3 L-4 -1.5 L-0.9 -1.5 Z" fill="white" opacity="0.6" />
            </g>
        </svg>
    );
}

const TABS = [
    { id: 'home', label: 'Witness', icon: HomeIcon },
    { id: 'create', label: 'Create', icon: SparkleIcon },
    { id: 'school', label: 'School', icon: BookIcon },
];

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
    return (
        <nav
            role="tablist"
            aria-label="Main navigation"
            style={{
                flexShrink: 0,
                width: '100%',
                background: 'linear-gradient(to right, rgb(26, 11, 46), rgb(13, 6, 24), rgb(26, 11, 46))',
                paddingBottom: 'env(safe-area-inset-bottom, 12px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 100,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '4px 12px 2px', maxWidth: '600px', margin: '0 auto' }}>
                {TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = currentTab === tab.id;
                    const size = 22;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            role="tab"
                            aria-label={`${tab.label} tab`}
                            aria-selected={isActive}
                            accessKey={tab.id === 'home' ? 'h' : 'p'}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                background: 'none',
                                border: 'none',
                                padding: '2px 10px',
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                opacity: isActive ? 1 : 0.5,
                                transition: 'opacity 0.2s ease',
                            }}
                        >
                            <div style={{ width: size, height: size }}>
                                <IconComponent className="w-full h-full" />
                            </div>
                            <span
                                style={{
                                    fontSize: '10px',
                                    fontFamily: 'var(--font-display, "Cinzel", serif)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    fontWeight: '600',
                                    color: isActive ? 'var(--color-altar-gold)' : 'rgba(255,255,255,0.7)',
                                }}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
