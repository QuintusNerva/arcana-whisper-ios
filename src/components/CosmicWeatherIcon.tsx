import React from 'react';

export function CosmicWeatherIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Orbiting planet path */}
            <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" opacity="0.4" />
            {/* Central star */}
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
            {/* Radiating points */}
            <line x1="12" y1="5" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="19" />
            <line x1="5.5" y1="8.5" x2="4" y2="7.5" />
            <line x1="18.5" y1="15.5" x2="20" y2="16.5" />
            {/* Transit planet (small dot on orbit) */}
            <circle cx="18" cy="8" r="1.2" fill="currentColor" stroke="none" opacity="0.7" />
        </svg>
    );
}
