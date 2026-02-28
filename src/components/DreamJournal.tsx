/**
 * DreamJournal — main dream journal view.
 * Shown when "Dreams" sub-tab is active inside JournalTab.
 */

import React from 'react';
import { DreamCard } from './DreamCard';
import {
    getDreamEntries,
    getDreamSymbolStats,
    updateDreamInterpretation,
    deleteDreamEntry,
    DreamEntry,
} from '../services/dream-journal.service';
import { DreamEntryView } from './DreamEntry';


interface DreamJournalProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

// ── Helpers ──────────────────────────────────────────────

function groupByDate(entries: DreamEntry[]) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const groups: { label: string; entries: DreamEntry[] }[] = [];
    const map = new Map<string, DreamEntry[]>();

    for (const e of entries) {
        const list = map.get(e.date) || [];
        list.push(e);
        map.set(e.date, list);
    }

    for (const [date, list] of map) {
        const label =
            date === today ? 'Today'
                : date === yesterday ? 'Yesterday'
                    : new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', month: 'short', day: 'numeric',
                    });
        groups.push({ label, entries: list });
    }

    return groups;
}


// ── Main Component ────────────────────────────────────────

export function DreamJournal({ onClose, onTabChange }: DreamJournalProps) {
    const [entries, setEntries] = React.useState<DreamEntry[]>([]);
    const [showNewEntry, setShowNewEntry] = React.useState(false);

    function loadEntries() {
        setEntries(getDreamEntries());
    }

    React.useEffect(() => {
        loadEntries();
    }, []);

    function handleDelete(id: string) {
        deleteDreamEntry(id);
        loadEntries();
    }

    function handleInterpreted(id: string, text: string) {
        setEntries(prev =>
            prev.map(e => e.id === id ? { ...e, interpretation: text } : e)
        );
    }

    const groups = groupByDate(entries);
    const symbolStats = getDreamSymbolStats();
    const showSymbolStats = symbolStats.length > 0 && entries.length >= 5;

    if (showNewEntry) {
        return (
            <DreamEntryView
                onClose={() => setShowNewEntry(false)}
                onSaved={() => {
                    loadEntries();
                    setShowNewEntry(false);
                }}
            />
        );
    }

    return (
        <div className="page-frame">
            <div
                className="page-scroll text-white"
                style={{
                    background: 'linear-gradient(160deg, #080818 0%, #0d0d28 50%, #070715 100%)',
                }}
            >
                {/* Quiet stars */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    {Array.from({ length: 50 }, (_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-white"
                            style={{
                                width: i % 7 === 0 ? '2px' : '1px',
                                height: i % 7 === 0 ? '2px' : '1px',
                                left: `${(i * 37 + 11) % 100}%`,
                                top: `${(i * 53 + 7) % 100}%`,
                                opacity: i % 3 === 0 ? 0.15 : 0.07,
                            }}
                        />
                    ))}
                </div>

                {/* Header */}
                <header className="sticky top-0 z-20 backdrop-blur-xl border-b safe-top"
                    style={{
                        background: 'rgba(8,8,24,0.85)',
                        borderColor: 'rgba(139,92,246,0.1)',
                    }}
                >
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button
                            onClick={onClose}
                            className="text-sm transition-colors"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                            ← Journal
                        </button>
                        <div className="text-center">
                            <h1 className="font-display text-sm tracking-[4px]"
                                style={{ color: 'rgba(196,181,253,0.9)' }}
                            >
                                🌙 DREAM JOURNAL
                            </h1>
                        </div>
                        <button
                            onClick={() => setShowNewEntry(true)}
                            className="text-sm font-semibold transition-colors"
                            style={{ color: '#a78bfa' }}
                        >
                            + New
                        </button>
                    </div>
                </header>

                <div className="relative z-10 max-w-[500px] mx-auto px-4 pb-28">

                    {/* Symbol frequency stats — after 5 dreams */}
                    {showSymbolStats && (
                        <div
                            className="mt-5 mb-4 rounded-2xl p-4 border"
                            style={{
                                background: 'rgba(109,40,217,0.06)',
                                borderColor: 'rgba(139,92,246,0.15)',
                            }}
                        >
                            <p className="text-[9px] font-display tracking-[2px] uppercase mb-3"
                                style={{ color: 'rgba(167,139,250,0.6)' }}
                            >
                                ✦ Your Dream Symbols
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {symbolStats.slice(0, 8).map(stat => (
                                    <div
                                        key={stat.emoji}
                                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border"
                                        style={{
                                            background: 'rgba(139,92,246,0.1)',
                                            borderColor: 'rgba(139,92,246,0.2)',
                                        }}
                                    >
                                        <span className="text-sm">{stat.emoji}</span>
                                        <span className="text-[10px]" style={{ color: 'rgba(196,181,253,0.7)' }}>
                                            {stat.label}
                                        </span>
                                        <span
                                            className="text-[9px] rounded-full px-1.5 py-0.5 font-semibold"
                                            style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}
                                        >
                                            ×{stat.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {entries.length === 0 && (
                        <div className="text-center mt-20 px-6">
                            <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.4))' }}>
                                🌙
                            </div>
                            <h2 className="font-display text-lg tracking-[3px] mb-2"
                                style={{ color: 'rgba(196,181,253,0.7)' }}
                            >
                                YOUR DREAM JOURNAL
                            </h2>
                            <p className="text-sm leading-relaxed mb-6"
                                style={{ color: 'rgba(255,255,255,0.35)' }}
                            >
                                Log your dreams here for cosmic interpretation. Each one is read through the lens of your natal chart and the stars above.
                            </p>
                            <button
                                onClick={() => setShowNewEntry(true)}
                                className="px-6 py-3 rounded-full font-display text-sm tracking-[2px] transition-all"
                                style={{
                                    background: 'rgba(109,40,217,0.3)',
                                    border: '1px solid rgba(139,92,246,0.4)',
                                    color: '#c4b5fd',
                                }}
                            >
                                ✦ Record Your First Dream
                            </button>
                            <p className="text-[10px] mt-3 italic"
                                style={{ color: 'rgba(255,255,255,0.2)' }}
                            >
                                Stored only on your device · Private & local
                            </p>
                        </div>
                    )}

                    {/* Dream groups */}
                    {groups.map(group => (
                        <div key={group.label} className="mt-5">
                            <p className="text-[9px] font-display tracking-[3px] uppercase mb-3"
                                style={{ color: 'rgba(167,139,250,0.45)' }}
                            >
                                {group.label}
                            </p>
                            <div className="space-y-3">
                                {group.entries.map(dream => (
                                    <DreamCard
                                        key={dream.id}
                                        dream={dream}
                                        onDelete={handleDelete}
                                        onInterpreted={handleInterpreted}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* New dream CTA if has entries */}
                    {entries.length > 0 && (
                        <button
                            onClick={() => setShowNewEntry(true)}
                            className="w-full mt-5 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                            style={{
                                background: 'rgba(109,40,217,0.1)',
                                border: '1px dashed rgba(139,92,246,0.25)',
                                color: 'rgba(167,139,250,0.6)',
                            }}
                        >
                            <span className="text-sm">🌙</span>
                            <span className="text-sm font-display tracking-wide">Record a New Dream</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
