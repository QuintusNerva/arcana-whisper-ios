/**
 * DreamJournal — main dream journal view.
 * Shown when "Dreams" sub-tab is active inside JournalTab.
 */

import React from 'react';
import { AIResponseRenderer } from './AIResponseRenderer';
import { AIService } from '../services/ai.service';
import { getBirthData, getNatalTriad, getLifePathNumber } from '../services/astrology.service';
import {
    getDreamEntries,
    getDreamSymbolStats,
    updateDreamInterpretation,
    deleteDreamEntry,
    formatTransitsForAI,
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

// ── DreamCard ─────────────────────────────────────────────

function DreamCard({
    dream,
    onDelete,
    onInterpreted,
}: {
    dream: DreamEntry;
    onDelete: (id: string) => void;
    onInterpreted: (id: string, text: string) => void;
}) {
    const [expanded, setExpanded] = React.useState(false);
    const [interpreting, setInterpreting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [showDelete, setShowDelete] = React.useState(false);

    const hasInterpretation = !!dream.interpretation;

    async function handleInterpret() {
        setInterpreting(true);
        setError(null);
        try {
            const ai = new AIService();
            const birthData = getBirthData();
            const triad = birthData ? getNatalTriad(birthData) : undefined;
            const lifePath = birthData ? getLifePathNumber(birthData.birthday) : undefined;

            const triadCtx = triad ? {
                sun: triad.sun.name,
                moon: triad.moon.name,
                rising: triad.rising.name,
            } : undefined;

            const activeTransits = formatTransitsForAI(dream.transitSnapshot);

            const result = await ai.getDreamInterpretation({
                dreamText: dream.text,
                symbolTags: dream.symbolTags,
                wakingMood: dream.wakingMood,
                activeTransits,
                triad: triadCtx,
                lifePath: lifePath ?? undefined,
            });

            updateDreamInterpretation(dream.id, result);
            onInterpreted(dream.id, result);
        } catch (err: any) {
            setError(err?.message || 'Interpretation failed. Check your API key in Settings.');
        } finally {
            setInterpreting(false);
        }
    }

    const time = new Date(dream.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
    });

    return (
        <div
            className="rounded-2xl border overflow-hidden transition-all"
            style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: expanded ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.07)',
            }}
        >
            {/* Dream header — tappable to expand */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full text-left px-4 pt-4 pb-3"
            >
                <div className="flex items-start gap-3">
                    {/* Mood bubble */}
                    {dream.wakingMood && (
                        <div
                            className="w-9 h-9 rounded-full border flex items-center justify-center text-lg shrink-0 mt-0.5"
                            style={{
                                background: 'rgba(139,92,246,0.1)',
                                borderColor: 'rgba(139,92,246,0.2)',
                            }}
                        >
                            {dream.wakingMood}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] text-indigo-300/50 font-display tracking-wide">{time}</span>
                            {hasInterpretation && (
                                <span className="text-[9px] text-violet-400/60 font-display tracking-wide">✦ Interpreted</span>
                            )}
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
                            {dream.text}
                        </p>
                    </div>
                </div>

                {/* Symbol tag pills */}
                {dream.symbolTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {dream.symbolTags.map(tag => (
                            <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-full border"
                                style={{
                                    background: 'rgba(139,92,246,0.1)',
                                    borderColor: 'rgba(139,92,246,0.2)',
                                    color: 'rgba(196,181,253,0.8)',
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </button>

            {/* Expanded section */}
            {expanded && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="pt-3 space-y-3">
                        {/* Full dream text if line-clamped above */}
                        {dream.text.length > 200 && (
                            <p className="text-sm text-white/70 leading-relaxed">
                                {dream.text}
                            </p>
                        )}

                        {/* AI Interpretation */}
                        {hasInterpretation ? (
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    background: 'rgba(109,40,217,0.08)',
                                    border: '1px solid rgba(139,92,246,0.15)',
                                }}
                            >
                                <p className="text-[9px] font-display text-violet-400/60 tracking-[2px] uppercase mb-3">
                                    ✦ Dream Interpretation
                                </p>
                                <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                                    <AIResponseRenderer
                                        text={dream.interpretation!}
                                        compact
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                {error && (
                                    <p className="text-[11px] text-red-400/70 mb-2 text-center">{error}</p>
                                )}
                                <button
                                    onClick={handleInterpret}
                                    disabled={interpreting}
                                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                                    style={{
                                        background: 'rgba(109,40,217,0.2)',
                                        border: '1px solid rgba(139,92,246,0.3)',
                                        color: '#c4b5fd',
                                    }}
                                >
                                    {interpreting ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin" />
                                            <span className="text-xs font-display tracking-wide">Reading the symbols…</span>
                                        </>
                                    ) : (
                                        <span className="text-xs font-display tracking-wide">✦ Interpret This Dream</span>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Delete */}
                        <div className="flex justify-end">
                            {showDelete ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowDelete(false)}
                                        className="text-[10px] text-white/30 hover:text-white/60 transition-colors px-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onDelete(dream.id)}
                                        className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors px-2"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDelete(true)}
                                    className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
                                >
                                    Delete dream
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
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
