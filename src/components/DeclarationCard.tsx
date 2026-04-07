import React from 'react';
import { AIService } from '../services/ai.service';
import { createManifestation } from '../services/manifestation.service';
import { buildEmpowermentContext } from '../services/empowerment.service';
import type { Reading } from '../models/card.model';

interface DeclarationCardProps {
    /** The completed reading */
    reading: Reading;
    /** The AI spread reading text */
    spreadInsight: string | null;
    /** Position labels for the cards */
    positions: string[];
    /** Whether user is premium */
    isPremium: boolean;
}

/* ── Sacred Fintech Design System Styles ── */
const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    color: 'var(--color-gold-200)',
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
};

const mutedTextStyle: React.CSSProperties = {
    color: 'var(--color-altar-muted)',
    fontFamily: 'var(--font-body)',
    fontWeight: 300,
};

export function DeclarationCard({ reading, spreadInsight, positions, isPremium }: DeclarationCardProps) {
    const [declaration, setDeclaration] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [dismissed, setDismissed] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Don't show in compassion mode
    const empCtx = React.useMemo(
        () => buildEmpowermentContext(reading.question, reading.cards.map(c => c.name)),
        [reading]
    );

    // Auto-generate declaration when spread insight arrives
    React.useEffect(() => {
        if (!spreadInsight || declaration || loading || dismissed) return;
        if (empCtx.compassionMode) return; // Skip in compassion mode
        if (!isPremium) return; // Premium only

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setLoading(true);
        setError(null);

        const cardsContext = reading.cards.map((c, i) => ({
            name: c.name,
            position: positions[i] || `Card ${i + 1}`,
            isReversed: c.isReversed ?? false,
            meaning: c.meaning,
            reversed: c.reversed,
        }));

        ai.getDeclaration({
            cards: cardsContext,
            spread: reading.spread,
            theme: reading.theme,
            question: reading.question,
            readingText: spreadInsight,
        })
            .then(text => {
                // Clean up — remove any quotes the AI might wrap it in
                const clean = text.replace(/^["']|["']$/g, '').trim();
                setDeclaration(clean);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [spreadInsight, declaration, loading, dismissed, empCtx.compassionMode, isPremium]);

    // Don't render in compassion mode or if dismissed
    if (empCtx.compassionMode || dismissed) return null;
    if (!isPremium) return null;
    if (!spreadInsight) return null; // Only show after reading loads
    if (!declaration && !loading && !error) return null;

    const handleSave = () => {
        if (!declaration) return;
        createManifestation(declaration, 'manifestation');
        setSaved(true);
    };

    return (
        <div className="mt-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {/* Declaration container */}
            <div className="relative overflow-hidden p-[1px] rounded-2xl" style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.4) 0%, rgba(168,85,247,0.3) 50%, rgba(212,175,55,0.4) 100%)',
            }}>
                <div className="rounded-2xl p-5" style={{
                    background: 'linear-gradient(135deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
                }}>
                    {/* Ambient glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(212,175,55,0.06)' }} />
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(168,85,247,0.06)' }} />

                    {/* Header */}
                    <div className="relative flex items-center gap-2 mb-4">
                        <span className="text-lg">⚡</span>
                        <p style={{ ...headerStyle, fontSize: '11px' }}>Declaration of Ambition</p>
                    </div>

                    {/* Content */}
                    <div className="relative">
                        {loading ? (
                            <div className="space-y-2 py-2">
                                <div className="h-3 shimmer-skeleton w-full" />
                                <div className="h-3 shimmer-skeleton w-[85%]" />
                                <div className="h-3 shimmer-skeleton w-[70%]" />
                            </div>
                        ) : error ? (
                            <p style={{ ...mutedTextStyle, fontSize: '13px', color: '#f87171' }}>{error}</p>
                        ) : declaration ? (
                            <>
                                {/* The declaration itself */}
                                <p style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '16px',
                                    lineHeight: '1.7',
                                    color: 'rgba(226,232,240,0.95)',
                                    fontStyle: 'italic',
                                    fontWeight: 400,
                                }}>
                                    "{declaration}"
                                </p>

                                {/* Divider */}
                                <div style={{
                                    width: '40px',
                                    height: '1px',
                                    background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)',
                                    margin: '16px 0',
                                }} />

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saved}
                                        className="flex-1 py-2.5 text-xs tracking-wide transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                                        style={{
                                            position: 'relative' as const,
                                            overflow: 'hidden',
                                            background: saved
                                                ? 'rgba(74,222,128,0.1)'
                                                : 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                            border: saved
                                                ? '1px solid rgba(74,222,128,0.3)'
                                                : '2px solid rgba(212,175,55,0.6)',
                                            borderRadius: '12px',
                                            color: saved ? '#4ade80' : '#1a0f2e',
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: 800,
                                            letterSpacing: '3px',
                                            textTransform: 'uppercase' as const,
                                            boxShadow: saved
                                                ? 'none'
                                                : '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                                        }}
                                    >
                                        {!saved && (
                                            <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '12px' }}>
                                                <span style={{
                                                    position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                                                    animation: 'shimmer 3s ease-in-out infinite',
                                                }} />
                                            </span>
                                        )}
                                        <span style={{ position: 'relative' }}>
                                            {saved ? '✅ Saved to Manifestations' : '✨ Save to Manifestations'}
                                        </span>
                                    </button>

                                    {!saved && (
                                        <button
                                            onClick={() => setDismissed(true)}
                                            className="py-2.5 px-4 text-xs tracking-wide transition-all"
                                            style={{
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                color: 'rgba(255,255,255,0.4)',
                                                fontFamily: 'var(--font-display)',
                                            }}
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
