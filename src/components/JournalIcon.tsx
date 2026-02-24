import React from 'react';

export function JournalIcon({ className }: { className?: string }) {
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
            {/* Book spine */}
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
            {/* Writing lines */}
            <line x1="8" y1="7" x2="16" y2="7" opacity="0.5" />
            <line x1="8" y1="10.5" x2="14" y2="10.5" opacity="0.5" />
            <line x1="8" y1="14" x2="12" y2="14" opacity="0.5" />
        </svg>
    );
}
