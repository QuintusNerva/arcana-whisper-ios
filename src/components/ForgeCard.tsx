/**
 * ForgeCard — Rich Coaching Strategy Card for a manifestation.
 *
 * Shows the Forge-generated daily strategy session with:
 * - Intention name + witness counter
 * - The practical action (verb-first)
 * - Strategy explanation (WHY this action)
 * - Cosmic context (which chart aspects are at play)
 * - Data source tags
 * - Timing note
 * - Next step teaser
 * - Accept/Skip/Complete actions
 *
 * Sacred Fintech design system throughout.
 */

import React from 'react';
import {
    commitAction,
    completeAction,
    getActionStreak,
    saveCoachingArc,
    getPendingCoachingArc,
    saveCoachingReport,
    clearCoachingArc,
    type CoachingArc,
} from '../services/manifestation.service';
import { getDailyForge, invalidateForgeCache, getForgeFollowUp, type ForgeResult } from '../services/forge.service';
import { getWitnessCountForManifestation, getLatestWitnessForManifestation } from '../services/witness.service';
import type { ForgeResponse } from '../prompts/manifest/forge-action';
import type { ForgeFollowUpResponse } from '../prompts/manifest/forge-followup';

// ── Styles ──

const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    color: 'var(--color-gold-200)',
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
};

const bodyText: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    color: 'rgba(226,232,240,0.7)',
    fontWeight: 300,
};

const goldBtnStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
    border: '2px solid rgba(212,175,55,0.6)',
    borderRadius: '12px',
    color: '#1a0f2e',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
};

const sectionHeaderStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '8px',
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
    color: 'rgba(212,175,55,0.5)',
    marginBottom: '6px',
};

const cardBackground: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
    border: '1px solid rgba(212,175,55,0.12)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.06)',
};

// ── Component ──

interface ForgeCardProps {
    manifestationId: string;
    declaration: string;
    onRefresh?: () => void;
}

type CardState = 'loading' | 'ready' | 'accepted' | 'reviewing' | 'awaiting_report' | 'reporting' | 'completed' | 'error' | 'offline';

export function ForgeCard({ manifestationId, declaration, onRefresh }: ForgeCardProps) {
    const [state, setState] = React.useState<CardState>('loading');
    const [forgeResult, setForgeResult] = React.useState<ForgeResult | null>(null);
    const [acceptedActionId, setAcceptedActionId] = React.useState<string | null>(null);
    const [reflection, setReflection] = React.useState('');
    const [followUp, setFollowUp] = React.useState<ForgeFollowUpResponse | null>(null);
    const [pendingArc, setPendingArc] = React.useState<CoachingArc | null>(null);
    const [reportText, setReportText] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    // Load forge on mount — check for pending coaching arc first
    React.useEffect(() => {
        if (!navigator.onLine) {
            setState('offline');
            return;
        }

        // Check if there's a pending real-world action awaiting report
        const arc = getPendingCoachingArc(manifestationId);
        if (arc) {
            setPendingArc(arc);
            setState('awaiting_report');
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const result = await getDailyForge(manifestationId);
                if (cancelled) return;
                if (result) {
                    setForgeResult(result);
                    setState('ready');
                } else {
                    setError('Could not generate your strategy. Check your API key in Settings.');
                    setState('error');
                }
            } catch (e: any) {
                if (cancelled) return;
                setError(e.message || 'Failed to connect to the Forge');
                setState('error');
            }
        })();

        return () => { cancelled = true; };
    }, [manifestationId]);

    // Accept action → commit to manifestation
    const handleAccept = () => {
        if (!forgeResult) return;
        const action = commitAction(manifestationId, forgeResult.response.action);
        if (action) {
            setAcceptedActionId(action.id);
            setState('accepted');
        }
    };

    // Complete action → save workspace text → request AI follow-up
    const handleComplete = async () => {
        if (!acceptedActionId || !forgeResult) return;
        const workspaceText = reflection.trim() || undefined;
        completeAction(manifestationId, acceptedActionId, workspaceText);
        invalidateForgeCache(manifestationId);

        // Transition to reviewing state and request AI follow-up
        setState('reviewing');

        try {
            const response = await getForgeFollowUp(
                manifestationId,
                forgeResult.response.action,
                workspaceText || '',
            );
            if (response) {
                setFollowUp(response);
            } else {
                // AI failed — skip to completed
                setState('completed');
                onRefresh?.();
            }
        } catch {
            // AI failed — skip to completed
            setState('completed');
            onRefresh?.();
        }
    };

    // "Got It" → save coaching arc and transition to awaiting report
    const handleGotIt = () => {
        if (!followUp || !forgeResult) return;
        // Persist the real-world action so it survives app close
        const arc: Omit<CoachingArc, 'createdDate'> = {
            manifestationId,
            acknowledgment: followUp.acknowledgment,
            realWorldAction: followUp.realWorldAction,
            workspaceActionDescription: forgeResult.response.action,
        };
        saveCoachingArc(arc);
        setPendingArc(arc as CoachingArc);
        setState('awaiting_report');
    };

    // Submit report → clear arc → completed
    const handleReport = () => {
        const text = reportText.trim();
        if (!text) return;
        saveCoachingReport(manifestationId, text);
        clearCoachingArc(manifestationId);
        invalidateForgeCache(manifestationId);
        setState('completed');
        onRefresh?.();
    };

    // Skip → just move on, no penalty
    const handleSkip = () => {
        setState('completed');
    };

    // Witness counter + streak data
    const witnessCount = getWitnessCountForManifestation(manifestationId);
    const latestWitness = getLatestWitnessForManifestation(manifestationId);
    const streak = getActionStreak(manifestationId);

    // ── Header (shared across all states) ──
    const renderHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: '14px' }}>⚒️</span>
                    <span style={{ ...headerStyle, fontSize: '10px' }}>The Forge</span>
                    {forgeResult?.tier === 'tier3' && (
                        <span style={{
                            fontSize: '7px',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: 'rgba(168,85,247,0.15)',
                            border: '1px solid rgba(168,85,247,0.25)',
                            color: '#c4b5fd',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '1px',
                        }}>FULL LOOP</span>
                    )}
                </div>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '14px',
                    color: 'var(--color-gold-100)',
                    fontWeight: 600,
                    fontStyle: 'italic',
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>"{declaration}"</p>
            </div>
            {(witnessCount > 0 || streak >= 2) && (
                <div style={{ textAlign: 'right' as const, flexShrink: 0, marginLeft: '12px' }}>
                    {streak >= 2 && (
                        <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px',
                            color: '#fb923c',
                            letterSpacing: '1px',
                            display: 'block',
                            marginBottom: '2px',
                        }}>
                            🔥 {streak}
                        </span>
                    )}
                    {witnessCount > 0 && (
                        <>
                            <span style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '10px',
                                color: 'var(--color-gold-100)',
                                letterSpacing: '1px',
                            }}>
                                ✦ {witnessCount}
                            </span>
                            <p style={{
                                ...bodyText,
                                fontSize: '8px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase' as const,
                                opacity: 0.4,
                                marginTop: '1px',
                            }}>Sign{witnessCount !== 1 ? 's' : ''}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    // ── Loading state ──
    if (state === 'loading') {
        return (
            <div className="p-5" style={cardBackground}>
                {renderHeader()}
                <div className="space-y-3">
                    <div className="h-3 shimmer-skeleton w-full" />
                    <div className="h-3 shimmer-skeleton w-[90%]" />
                    <div className="h-3 shimmer-skeleton w-[75%]" />
                    <div style={{ height: '12px' }} />
                    <div className="h-2.5 shimmer-skeleton w-[60%]" />
                    <div className="h-2.5 shimmer-skeleton w-[80%]" />
                    <div className="h-2.5 shimmer-skeleton w-[50%]" />
                </div>
                <p style={{ ...bodyText, fontSize: '10px', marginTop: '16px', opacity: 0.4, textAlign: 'center' }}>
                    Crafting your strategy session...
                </p>
            </div>
        );
    }

    // ── Offline state ──
    if (state === 'offline') {
        return (
            <div className="p-5 text-center" style={{
                ...cardBackground,
                border: '1px solid rgba(255,255,255,0.04)',
            }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>📡</span>
                <p style={{ ...bodyText, fontSize: '12px', opacity: 0.4 }}>
                    The Forge needs an internet connection to craft your strategy.
                </p>
            </div>
        );
    }

    // ── Error state ──
    if (state === 'error') {
        return (
            <div className="p-5" style={{
                ...cardBackground,
                border: '1px solid rgba(248,113,113,0.15)',
            }}>
                {renderHeader()}
                <p style={{ ...bodyText, fontSize: '12px', color: '#f87171' }}>
                    {error}
                </p>
            </div>
        );
    }

    // ── Reviewing state — AI follow-up loading/response ──
    if (state === 'reviewing') {
        return (
            <div className="p-5" style={{
                ...cardBackground,
                border: '1px solid rgba(168,85,247,0.20)',
            }}>
                <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: '16px' }}>✨</span>
                    <span style={{ ...headerStyle, fontSize: '11px', color: '#c4b5fd' }}>Coach Response</span>
                </div>

                {!followUp ? (
                    /* Loading state */
                    <div className="space-y-2 mb-4">
                        <div className="h-3 shimmer-skeleton w-full" />
                        <div className="h-3 shimmer-skeleton w-[85%]" />
                        <div className="h-3 shimmer-skeleton w-[60%]" />
                        <p style={{ ...bodyText, fontSize: '10px', marginTop: '12px', opacity: 0.4, textAlign: 'center' }}>
                            Reading your work...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Acknowledgment */}
                        <div style={{
                            padding: '14px 16px',
                            borderRadius: '14px',
                            background: 'rgba(168,85,247,0.06)',
                            border: '1px solid rgba(168,85,247,0.12)',
                            marginBottom: '12px',
                        }}>
                            <p style={{
                                ...bodyText,
                                fontSize: '13px',
                                lineHeight: '1.7',
                                color: 'rgba(226,232,240,0.85)',
                                fontStyle: 'italic',
                            }}>
                                {followUp.acknowledgment}
                            </p>
                        </div>

                        {/* Real-world action */}
                        <div style={{
                            padding: '14px 16px',
                            borderRadius: '14px',
                            background: 'rgba(212,175,55,0.06)',
                            border: '1px solid rgba(212,175,55,0.15)',
                            marginBottom: '16px',
                        }}>
                            <p style={{ ...sectionHeaderStyle, marginBottom: '8px', color: 'rgba(212,175,55,0.7)' }}>Your Next Move</p>
                            <p style={{
                                ...bodyText,
                                fontSize: '13px',
                                lineHeight: '1.6',
                                color: 'var(--color-gold-100)',
                                fontWeight: 400,
                            }}>
                                {followUp.realWorldAction}
                            </p>
                        </div>
                    </>
                )}

                {followUp && (
                    <button
                        onClick={handleGotIt}
                        className="w-full py-3.5 text-sm tracking-wider transition-all active:scale-[0.97]"
                        style={{
                            ...goldBtnStyle,
                            fontSize: '13px',
                        }}
                    >
                        <span className="gold-btn-shimmer" />
                        ✓ Got It
                    </button>
                )}
            </div>
        );
    }

    // ── Awaiting Report state — user went to do real-world action ──
    if (state === 'awaiting_report') {
        const arc = pendingArc;
        return (
            <div className="p-5" style={{
                ...cardBackground,
                border: '1px solid rgba(212,175,55,0.15)',
            }}>
                {renderHeader()}

                <div style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(212,175,55,0.04)',
                    border: '1px solid rgba(212,175,55,0.10)',
                    marginBottom: '14px',
                }}>
                    <p style={{ ...sectionHeaderStyle, marginBottom: '8px', color: 'rgba(212,175,55,0.5)' }}>Your Action</p>
                    <p style={{
                        ...bodyText,
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-gold-100)',
                        fontWeight: 400,
                    }}>
                        {arc?.realWorldAction || 'Complete your next step'}
                    </p>
                </div>

                <p style={{
                    ...bodyText,
                    fontSize: '12px',
                    marginBottom: '10px',
                    color: 'rgba(226,232,240,0.6)',
                }}>
                    How did it go? Report back when you’ve made your move.
                </p>

                <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="I reached out to...​ / I researched...​ / Here's what happened..."
                    maxLength={1000}
                    rows={4}
                    className="w-full rounded-xl p-4 mb-3 text-sm resize-none focus:outline-none focus:ring-1"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(212,175,55,0.12)',
                        color: 'rgba(226,232,240,0.85)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 300,
                        lineHeight: '1.6',
                    }}
                />

                <div className="flex gap-3">
                    <button
                        onClick={handleSkip}
                        className="flex-1 py-3 text-sm tracking-wider transition-all active:scale-[0.97]"
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            color: 'rgba(226,232,240,0.4)',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '1px',
                        }}
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleReport}
                        disabled={!reportText.trim()}
                        className="flex-[2] py-3 text-sm tracking-wider transition-all active:scale-[0.97]"
                        style={{
                            background: reportText.trim()
                                ? 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(34,197,94,0.08) 100%)'
                                : 'rgba(255,255,255,0.03)',
                            border: reportText.trim()
                                ? '1px solid rgba(74,222,128,0.25)'
                                : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            color: reportText.trim() ? '#4ade80' : 'rgba(226,232,240,0.3)',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '1px',
                        }}
                    >
                        ✓ Report Back
                    </button>
                </div>
            </div>
        );
    }

    // ── Completed state ──
    if (state === 'completed') {
        return (
            <div className="p-5" style={{
                ...cardBackground,
                border: '1px solid rgba(74,222,128,0.15)',
            }}>
                <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span style={{ ...headerStyle, fontSize: '11px', color: '#4ade80' }}>Step Complete</span>
                    {streak >= 2 && (
                        <span style={{
                            fontSize: '10px',
                            color: '#fb923c',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '1px',
                            marginLeft: '4px',
                        }}>
                            🔥 {streak}-day streak
                        </span>
                    )}
                </div>
                <p style={{ ...bodyText, fontSize: '12px' }}>
                    {acceptedActionId || reportText.trim()
                        ? 'Action recorded. Your momentum builds. The Forge will have your next step ready.'
                        : 'Skipped for today. The Forge will offer a new strategy tomorrow.'
                    }
                </p>
            </div>
        );
    }

    const response = forgeResult!.response;

    // ── Accepted state — workspace to complete the action ──
    if (state === 'accepted') {
        // Detect if the action is a list/brainstorm type
        const actionLower = response.action.toLowerCase();
        const isListAction = /\b(list|write down|brainstorm|name|identify|inventory|outline)\b.*\b\d+\b/.test(actionLower)
            || /\b\d+\b.*\b(things|items|ideas|ways|sources|steps|options|reasons)\b/.test(actionLower);

        return (
            <div className="p-5" style={{
                ...cardBackground,
                border: '1px solid rgba(212,175,55,0.20)',
            }}>
                <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: '16px' }}>🔥</span>
                    <span style={{ ...headerStyle, fontSize: '11px' }}>Today's Action</span>
                </div>

                {/* The action */}
                <p style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-gold-100)',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                }}>
                    {response.action}
                </p>

                {/* Workspace area */}
                <div className="mb-4">
                    <label style={{ ...sectionHeaderStyle, display: 'block', marginBottom: '6px' }}>
                        {isListAction ? 'Your workspace' : 'Your notes'}{' '}
                        <span style={{ opacity: 0.4 }}>(optional)</span>
                    </label>
                    <textarea
                        value={reflection}
                        onChange={e => setReflection(e.target.value)}
                        placeholder={isListAction
                            ? 'Use this space to complete the action above...\n\n1. \n2. \n3. '
                            : 'How did it go? Any thoughts, wins, or reflections...'
                        }
                        maxLength={1000}
                        rows={isListAction ? 6 : 3}
                        style={{
                            width: '100%',
                            background: 'rgba(13,11,34,0.6)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            color: 'rgba(226,232,240,0.9)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            fontWeight: 300,
                            outline: 'none',
                            resize: 'vertical' as const,
                            lineHeight: '1.6',
                            minHeight: isListAction ? '140px' : '80px',
                        }}
                    />
                    {reflection.length > 0 && (
                        <p style={{
                            ...bodyText,
                            fontSize: '9px',
                            opacity: 0.3,
                            marginTop: '4px',
                            textAlign: 'right' as const,
                        }}>
                            {reflection.length}/1000
                        </p>
                    )}
                </div>

                <button
                    onClick={handleComplete}
                    className="w-full py-3 text-sm tracking-wider transition-all active:scale-[0.97]"
                    style={{
                        background: 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(34,197,94,0.08) 100%)',
                        border: '1px solid rgba(74,222,128,0.25)',
                        borderRadius: '12px',
                        color: '#4ade80',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '1px',
                    }}
                >
                    ✓ Complete Action
                </button>
            </div>
        );
    }

    // ── Ready state — Rich Strategy Session ──
    return (
        <div className="p-5" style={cardBackground}>
            {/* Header with intention + witness counter */}
            {renderHeader()}

            {/* ── TODAY'S ACTION ── */}
            <div style={{ marginBottom: '16px' }}>
                <p style={sectionHeaderStyle}>Today's Action</p>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-gold-100)',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    fontWeight: 600,
                }}>
                    {response.action}
                </p>
            </div>

            {/* ── STRATEGY ── */}
            {response.strategy && (
                <div style={{ marginBottom: '16px' }}>
                    <p style={sectionHeaderStyle}>Strategy</p>
                    <p style={{
                        ...bodyText,
                        fontSize: '13px',
                        lineHeight: '1.7',
                        color: 'rgba(226,232,240,0.8)',
                    }}>
                        {response.strategy}
                    </p>
                </div>
            )}

            {/* ── COSMIC CONTEXT ── */}
            {response.cosmicContext && (
                <div style={{ marginBottom: '16px' }}>
                    <p style={sectionHeaderStyle}>Why Now</p>
                    <p style={{
                        ...bodyText,
                        fontSize: '12px',
                        lineHeight: '1.6',
                        color: 'rgba(168,85,247,0.7)',
                    }}>
                        {response.cosmicContext}
                    </p>
                </div>
            )}

            {/* ── DATA SOURCE TAGS ── */}
            {response.dataSources && response.dataSources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {response.dataSources.map((tag, i) => (
                        <span key={i} style={{
                            fontSize: '9px',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: 'rgba(212,175,55,0.06)',
                            border: '1px solid rgba(212,175,55,0.12)',
                            color: 'rgba(212,175,55,0.6)',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '0.5px',
                        }}>
                            📊 {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* ── TIMING ── */}
            {response.timing && (
                <p style={{
                    ...bodyText,
                    fontSize: '11px',
                    color: 'rgba(168,85,247,0.6)',
                    marginBottom: '8px',
                }}>
                    ⏱ {response.timing}
                </p>
            )}

            {/* ── NEXT STEP TEASER ── */}
            {response.nextStep && (
                <p style={{
                    ...bodyText,
                    fontSize: '11px',
                    fontStyle: 'italic',
                    opacity: 0.45,
                    marginBottom: '8px',
                    paddingLeft: '12px',
                    borderLeft: '2px solid rgba(212,175,55,0.15)',
                }}>
                    Next: {response.nextStep}
                </p>
            )}

            {/* ── ENCOURAGEMENT ── */}
            {response.encouragement && (
                <p style={{
                    ...bodyText,
                    fontSize: '11px',
                    fontStyle: 'italic',
                    marginBottom: '16px',
                    opacity: 0.5,
                }}>
                    {response.encouragement}
                </p>
            )}

            {/* ── LATEST WITNESS EVENT ── */}
            {latestWitness && (
                <div style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(212,175,55,0.03)',
                    border: '1px solid rgba(212,175,55,0.08)',
                    marginBottom: '16px',
                }}>
                    <p style={{
                        ...bodyText,
                        fontSize: '10px',
                        fontStyle: 'italic',
                        opacity: 0.5,
                    }}>
                        Latest sign: "{latestWitness.description.slice(0, 60)}{latestWitness.description.length > 60 ? '…' : ''}"
                    </p>
                </div>
            )}

            {/* ── ACTIONS ── */}
            <div className="flex gap-3">
                <button
                    onClick={handleSkip}
                    className="flex-1 py-2.5 text-xs tracking-wider transition-all active:scale-[0.97]"
                    style={{
                        background: 'rgba(13,11,34,0.5)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        color: 'rgba(226,232,240,0.4)',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '1px',
                    }}
                >
                    Not Today
                </button>
                <button
                    onClick={handleAccept}
                    className="flex-1 py-2.5 text-xs tracking-wider transition-all active:scale-[0.97]"
                    style={goldBtnStyle}
                >
                    <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '12px' }}>
                        <span style={{
                            position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                            animation: 'shimmer 3s ease-in-out infinite',
                        }} />
                    </span>
                    <span style={{ position: 'relative' }}>✦ Accept</span>
                </button>
            </div>
        </div>
    );
}
