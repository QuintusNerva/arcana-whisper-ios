/**
 * DreamCard — individual dream entry with expand/interpret/delete.
 * Extracted from DreamJournal.tsx to avoid potential TDZ issues in minified builds.
 */

import React from 'react';
import { AIResponseRenderer } from './AIResponseRenderer';
import { AIService } from '../services/ai.service';
import { getBirthData, getNatalTriad, getLifePathNumber } from '../services/astrology.service';
import {
    updateDreamInterpretation,
    formatTransitsForAI,
    DreamEntry,
} from '../services/dream-journal.service';

interface DreamCardProps {
    dream: DreamEntry;
    onDelete: (id: string) => void;
    onInterpreted: (id: string, text: string) => void;
}

export function DreamCard({ dream, onDelete, onInterpreted }: DreamCardProps) {
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
