import React from 'react';
import { HomeIcon } from './HomeIcon';
import { DrawIcon } from './DrawIcon';
import { ProfileIcon } from './ProfileIcon';
import { CosmicWeatherIcon } from './CosmicWeatherIcon';

interface BottomNavProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
}

const TABS = [
    { id: 'home', label: 'Altar', icon: HomeIcon },
    { id: 'new', label: 'Draw', icon: DrawIcon, promoted: true },
    { id: 'cosmos', label: 'Cosmos', icon: CosmicWeatherIcon },
    { id: 'profile', label: 'Self', icon: ProfileIcon },
];

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
    return (
        <nav
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
                    const size = tab.promoted ? 28 : 22;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                background: 'none',
                                border: 'none',
                                padding: '2px 20px',
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
