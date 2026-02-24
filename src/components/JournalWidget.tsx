import React from 'react';
import {
    getJournalEntries, getPatternProgress, hasUnreadPatterns,
    getJournalEntryCount, JournalEntry,
} from '../services/journal.service';

interface JournalWidgetProps {
    onTap: () => void;
}

export function JournalWidget({ onTap }: JournalWidgetProps) {
    const entries = getJournalEntries();
    const progress = getPatternProgress();
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = entries.find(e => e.date === today);
    const latestEntry = entries[0];
    const unread = hasUnreadPatterns();

    return (
        <button
            onClick={onTap}
            className="w-full text-left glass rounded-2xl overflow-hidden border border-teal-500/15 bg-gradient-to-br from-teal-900/10 to-cyan-900/8 transition-all hover:border-teal-400/25 active:scale-[0.99]"
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-xs text-altar-gold tracking-[3px] uppercase flex items-center gap-1.5">
                        <span className="text-sm">📓</span> Your Journal
                    </h3>
                    {unread && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-altar-gold/20 text-altar-gold font-display animate-pulse">
                            ✨ New Pattern
                        </span>
                    )}
                </div>

                {/* Content — changes based on state */}
                {todayEntry ? (
                    /* Already journaled today */
                    <div>
                        <div className="flex items-start gap-2 mb-1.5">
                            {todayEntry.mood && <span className="text-sm mt-0.5">{todayEntry.mood}</span>}
                            <p className="text-[11px] text-altar-text/60 italic leading-relaxed line-clamp-2">
                                {todayEntry.text}
                            </p>
                        </div>
                        <p className="text-[9px] text-altar-muted/40">
                            {new Date(todayEntry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · Tap to write more
                        </p>
                    </div>
                ) : latestEntry ? (
                    /* Has entries but not today */
                    <div>
                        <p className="text-[11px] text-altar-text/70 italic mb-1.5">How are you today?</p>
                        <p className="text-[9px] text-altar-muted/40">
                            Last entry: {new Date(latestEntry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                ) : (
                    /* No entries yet */
                    <div>
                        <p className="text-[11px] text-altar-text/70 italic mb-0.5">No pressure. Just say what's real.</p>
                        <p className="text-[9px] text-altar-muted/40">Tap to start writing</p>
                    </div>
                )}

                {/* Progress bar */}
                {!progress.unlocked && (
                    <div className="mt-2.5">
                        <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal-500/50 to-cyan-400/60 rounded-full transition-all"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                            <span className="text-[8px] text-altar-muted/40 shrink-0">
                                {progress.current}/{progress.target} to patterns ✨
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </button>
    );
}
