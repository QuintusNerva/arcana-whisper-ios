/**
 * DreamEntry — dream logging form
 * Symbol tags + waking mood + free-form text.
 */

import React from 'react';
import {
    DREAM_SYMBOL_TAGS,
    WAKING_MOOD_OPTIONS,
    getDreamWelcomeLine,
    getDreamNudgePrompt,
    saveDreamEntry,
    DreamEntry,
} from '../services/dream-journal.service';

interface DreamEntryProps {
    onClose: () => void;
    onSaved: (entry: DreamEntry) => void;
}

export function DreamEntryView({ onClose, onSaved }: DreamEntryProps) {
    const [text, setText] = React.useState('');
    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
    const [wakingMood, setWakingMood] = React.useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = React.useState(false);
    const [showNudge, setShowNudge] = React.useState(false);

    const welcomeLine = React.useMemo(() => getDreamWelcomeLine(), []);
    const nudgePrompt = React.useMemo(() => getDreamNudgePrompt(), []);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        setTimeout(() => textareaRef.current?.focus(), 300);
    }, []);

    // Show nudge after 3 seconds if still empty
    React.useEffect(() => {
        if (text.length > 0) return;
        const timer = setTimeout(() => setShowNudge(true), 3000);
        return () => clearTimeout(timer);
    }, [text]);

    function toggleTag(emoji: string) {
        setSelectedTags(prev =>
            prev.includes(emoji) ? prev.filter(t => t !== emoji) : [...prev, emoji]
        );
    }

    async function handleSave() {
        if (!text.trim()) return;
        setIsSaving(true);
        try {
            const entry = saveDreamEntry(text.trim(), selectedTags, wakingMood);
            onSaved(entry);
        } finally {
            setIsSaving(false);
        }
    }

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    });

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{
            background: 'linear-gradient(160deg, #0a0a1a 0%, #0d0d2b 40%, #070718 100%)',
        }}>
            {/* Stars bg */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 40 }, (_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: i % 5 === 0 ? '2px' : '1px',
                            height: i % 5 === 0 ? '2px' : '1px',
                            left: `${(i * 37 + 13) % 100}%`,
                            top: `${(i * 53 + 7) % 100}%`,
                            opacity: i % 3 === 0 ? 0.2 : i % 2 === 0 ? 0.12 : 0.07,
                        }}
                    />
                ))}

            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 pt-12 pb-4 z-10">
                <button
                    onClick={onClose}
                    className="text-white/50 hover:text-white/80 transition-colors text-sm"
                >
                    ← Cancel
                </button>
                <div className="text-center">
                    <p className="text-[10px] text-indigo-300/60 tracking-[3px] uppercase font-display">Dream Journal</p>
                    <p className="text-[9px] text-white/30 mt-0.5">{today}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!text.trim() || isSaving}
                    className="text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: text.trim() ? '#a78bfa' : '#6d6d8a' }}
                >
                    {isSaving ? '…' : 'Save'}
                </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-10 relative z-10">
                {/* Moon + welcome */}
                <div className="text-center mb-5">
                    <div className="text-3xl mb-2" style={{ filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.5))' }}>
                        🌙
                    </div>
                    <p className="text-sm text-indigo-200/70 italic">{welcomeLine}</p>
                </div>

                {/* Text area */}
                <div className="relative mb-5">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Describe your dream…"
                        rows={7}
                        className="w-full rounded-2xl px-4 py-4 text-sm text-white/90 leading-relaxed resize-none outline-none border transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: text.length > 0 ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)',
                            caretColor: '#a78bfa',
                        }}
                    />
                    {/* Nudge prompt */}
                    {showNudge && text.length === 0 && (
                        <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                            <p className="text-[11px] text-indigo-300/40 italic animate-pulse">
                                {nudgePrompt}
                            </p>
                        </div>
                    )}
                </div>

                {/* Symbol Tags */}
                <div className="mb-5">
                    <p className="text-[10px] text-white/40 tracking-[2px] uppercase mb-3 font-display">
                        ✦ Dream Symbols
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {DREAM_SYMBOL_TAGS.map(tag => {
                            const selected = selectedTags.includes(tag.emoji);
                            return (
                                <button
                                    key={tag.emoji}
                                    onClick={() => toggleTag(tag.emoji)}
                                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-200 border"
                                    style={{
                                        background: selected
                                            ? 'rgba(139,92,246,0.25)'
                                            : 'rgba(255,255,255,0.05)',
                                        borderColor: selected
                                            ? 'rgba(139,92,246,0.5)'
                                            : 'rgba(255,255,255,0.1)',
                                        color: selected ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                                        transform: selected ? 'scale(1.05)' : 'scale(1)',
                                    }}
                                >
                                    <span>{tag.emoji}</span>
                                    <span className="font-display tracking-wide">{tag.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Waking Mood */}
                <div className="mb-6">
                    <p className="text-[10px] text-white/40 tracking-[2px] uppercase mb-3 font-display">
                        ✦ Waking Mood
                    </p>
                    <div className="flex gap-3 flex-wrap">
                        {WAKING_MOOD_OPTIONS.map(mood => {
                            const selected = wakingMood === mood.emoji;
                            return (
                                <button
                                    key={mood.emoji}
                                    onClick={() => setWakingMood(selected ? undefined : mood.emoji)}
                                    className="flex flex-col items-center gap-1 transition-all duration-200"
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all"
                                        style={{
                                            background: selected
                                                ? 'rgba(139,92,246,0.2)'
                                                : 'rgba(255,255,255,0.04)',
                                            borderColor: selected
                                                ? 'rgba(139,92,246,0.6)'
                                                : 'rgba(255,255,255,0.08)',
                                            transform: selected ? 'scale(1.1)' : 'scale(1)',
                                            boxShadow: selected ? '0 0 15px rgba(139,92,246,0.3)' : 'none',
                                        }}
                                    >
                                        {mood.emoji}
                                    </div>
                                    <span
                                        className="text-[9px] font-display tracking-wide"
                                        style={{ color: selected ? '#c4b5fd' : 'rgba(255,255,255,0.35)' }}
                                    >
                                        {mood.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    disabled={!text.trim() || isSaving}
                    className="w-full py-4 rounded-2xl font-display tracking-[2px] text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={text.trim() ? {
                        background: 'linear-gradient(135deg, rgba(109,40,217,0.8), rgba(139,92,246,0.6))',
                        border: '1px solid rgba(139,92,246,0.5)',
                        color: '#e9d5ff',
                        boxShadow: '0 0 30px rgba(139,92,246,0.2)',
                    } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.3)',
                    }}
                >
                    {isSaving ? 'Saving…' : '✦ Record This Dream'}
                </button>

                <p className="text-center text-[10px] text-white/20 mt-3 italic">
                    Stored only on your device · Private & local
                </p>
            </div>
        </div>
    );
}
