import React from 'react';
import { getWelcomeLine, getNudgePrompt, saveJournalEntry, updateJournalEntry, JournalEntry as JE } from '../services/journal.service';

interface JournalEntryProps {
    onClose: () => void;
    editEntry?: JE | null;
}

const MOOD_OPTIONS = [
    { emoji: '😌', label: 'Calm' },
    { emoji: '😤', label: 'Fired Up' },
    { emoji: '🔥', label: 'Energized' },
    { emoji: '💭', label: 'Reflective' },
    { emoji: '✨', label: 'Inspired' },
    { emoji: '😢', label: 'Heavy' },
    { emoji: '🌊', label: 'Flowing' },
    { emoji: '⚡', label: 'Restless' },
];

export function JournalEntryView({ onClose, editEntry }: JournalEntryProps) {
    const [text, setText] = React.useState(editEntry?.text || '');
    const [mood, setMood] = React.useState<string | undefined>(editEntry?.mood);
    const [showNudge, setShowNudge] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const welcomeLine = React.useMemo(() => getWelcomeLine(), []);
    const nudgePrompt = React.useMemo(() => getNudgePrompt(), []);

    const today = new Date();
    const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Auto-focus textarea
    React.useEffect(() => {
        setTimeout(() => textareaRef.current?.focus(), 300);
    }, []);

    // Show nudge after 10 seconds of blank page
    React.useEffect(() => {
        if (text.length > 0 || editEntry) return;
        const timer = setTimeout(() => setShowNudge(true), 10000);
        return () => clearTimeout(timer);
    }, [text, editEntry]);

    // Hide nudge when they start typing
    React.useEffect(() => {
        if (text.length > 0) setShowNudge(false);
    }, [text]);

    const handleSave = () => {
        if (text.trim().length === 0) return;

        if (editEntry) {
            updateJournalEntry(editEntry.id, text, mood);
        } else {
            saveJournalEntry(text, mood);
        }

        setSaved(true);
        setTimeout(onClose, 600);
    };

    return (
        <div className="fixed inset-0 z-50 bg-altar-deep flex flex-col">
            {/* Header */}
            <div className="safe-top">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <button
                        onClick={onClose}
                        className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide"
                    >
                        Cancel
                    </button>
                    <span className="text-[10px] text-altar-muted/60 font-display">{dateLabel}</span>
                    <button
                        onClick={handleSave}
                        disabled={text.trim().length === 0}
                        className={`text-sm font-display tracking-wide transition-all ${text.trim().length > 0
                                ? 'text-altar-gold hover:text-altar-gold-light'
                                : 'text-altar-muted/30'
                            }`}
                    >
                        {saved ? '✓ Saved' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Writing Area */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
                {/* Welcome line */}
                <p className="text-xs text-altar-muted/50 italic mb-4 animate-fade-up">
                    {welcomeLine}
                </p>

                {/* Text area — full screen, minimal chrome */}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Start writing..."
                    className="w-full min-h-[300px] bg-transparent text-altar-text text-sm leading-relaxed resize-none outline-none placeholder:text-altar-muted/20 font-body"
                    style={{ caretColor: 'var(--color-altar-gold)' }}
                />

                {/* Nudge — appears after 10 seconds of blank page */}
                {showNudge && (
                    <div className="mt-4 p-4 rounded-xl bg-altar-mid/15 border border-altar-gold/10 animate-fade-up">
                        <p className="text-[11px] text-altar-gold/60 italic leading-relaxed">
                            💡 {nudgePrompt}
                        </p>
                    </div>
                )}
            </div>

            {/* Mood selector — bottom bar */}
            <div className="border-t border-white/5 px-4 py-3 safe-bottom">
                <p className="text-[9px] text-altar-muted/40 font-display tracking-[2px] uppercase mb-2">
                    How does today feel? (optional)
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {MOOD_OPTIONS.map(m => (
                        <button
                            key={m.emoji}
                            onClick={() => setMood(mood === m.emoji ? undefined : m.emoji)}
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all ${mood === m.emoji
                                    ? 'bg-altar-gold/15 border border-altar-gold/30 text-altar-gold'
                                    : 'bg-white/[0.03] border border-white/5 text-altar-muted hover:text-white'
                                }`}
                        >
                            <span>{m.emoji}</span>
                            <span className="text-[9px] font-display">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
