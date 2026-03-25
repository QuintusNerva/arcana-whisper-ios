import React from 'react';
import { Card } from '../models/card.model';

interface ShareCardButtonProps {
    card: Card;
}

export function ShareCardButton({ card }: ShareCardButtonProps) {
    const [status, setStatus] = React.useState<'idle' | 'sharing' | 'done' | 'error'>('idle');

    const generateShareText = () => {
        return `🔮 My Daily Tarot: ${card.name}\n\n"${card.description}"\n\n✨ ${card.meaning}\n\n— Arcana Whisper`;
    };

    const handleShare = async () => {
        setStatus('sharing');

        const shareText = generateShareText();

        // Try native Web Share API first
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `🔮 ${card.name} — Arcana Whisper`,
                    text: shareText,
                });
                setStatus('done');
                setTimeout(() => setStatus('idle'), 2000);
                return;
            } catch (err) {
                // User cancelled or API not available — fall through
                if ((err as Error).name === 'AbortError') {
                    setStatus('idle');
                    return;
                }
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            setStatus('done');
            setTimeout(() => setStatus('idle'), 2000);
        } catch {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const label = {
        idle: '📤 Share Card',
        sharing: '⏳ Sharing…',
        done: '✅ Shared!',
        error: '❌ Try Again',
    }[status];

    return (
        <button
            onClick={handleShare}
            disabled={status === 'sharing'}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${status === 'done'
                    ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                    : status === 'error'
                        ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                        : 'glass text-white/80 hover:text-white hover:scale-105 active:scale-95'
                }`}
        >
            {label}
        </button>
    );
}
