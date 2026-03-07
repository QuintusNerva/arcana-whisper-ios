import React from 'react';

/**
 * OfflineNotice — Shows a subtle banner when the device loses network connectivity.
 * Critical for iOS apps that rely on API calls (OpenRouter AI).
 * Auto-hides when connection is restored.
 */
export function OfflineNotice() {
    const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
    const [wasOffline, setWasOffline] = React.useState(false);

    React.useEffect(() => {
        const goOffline = () => {
            setIsOffline(true);
            setWasOffline(true);
        };
        const goOnline = () => {
            setIsOffline(false);
            // Show "back online" for 3 seconds
            setTimeout(() => setWasOffline(false), 3000);
        };

        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);

        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
        };
    }, []);

    if (!isOffline && !wasOffline) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[500] text-center py-2 text-xs font-display tracking-wider transition-all duration-300 ${isOffline
                    ? 'bg-amber-500/90 text-amber-950'
                    : 'bg-green-500/90 text-green-950'
                }`}
            style={{ paddingTop: 'max(env(safe-area-inset-top, 8px), 8px)' }}
            role="alert"
            aria-live="polite"
        >
            {isOffline ? (
                <span>📡 No connection — AI insights unavailable</span>
            ) : (
                <span>✓ Back online</span>
            )}
        </div>
    );
}
