/**
 * CreateTab — Phase 2 Manifestation Hub
 * "✨ Create" — the home base for the user's manifestation practice.
 *
 * Single-scroll layout: Active manifestations + Cosmic Timing + Moon context banner.
 * Moon phase ritual details now live in Cosmic Blueprint.
 */


import React from 'react';
import { BottomNav } from './BottomNav';
import { PageHeader } from './PageHeader';
import {
    getAllManifestations,
    getActiveManifestations,
    createManifestation,
    updateManifestationStatus,
    deleteManifestation,
    commitAction,
    completeAction,
    getManifestationProgress,
    ManifestationEntry,
} from '../services/manifestation.service';
import { getTransitFeed } from '../services/transit.service';
import { getBirthData } from '../services/astrology.service';

// ── Lunar calendar helpers ─────────────────────────────────────────────────

const KNOWN_NEW_MOON = new Date('2025-01-06T00:00:00Z').getTime();
const LUNAR_CYCLE = 29.530589;
const MS_PER_DAY = 86400000;

interface LunarPhase {
    name: string;
    emoji: string;
    startDay: number;
    length: number;
    guidance: string;
    ritual: string;
    intention: string;
}

const LUNAR_PHASES: LunarPhase[] = [
    {
        name: 'New Moon', emoji: '🌑', startDay: 0, length: 3.7,
        guidance: 'The slate is clear. Plant your seeds.',
        ritual: 'Write your "I am calling in..." declaration. Light a candle. Speak it aloud three times with conviction. Then release the outcome — the universe heard you.',
        intention: 'Begin with total clarity. No half-intentions tonight.',
    },
    {
        name: 'Waxing Crescent', emoji: '🌒', startDay: 3.7, length: 3.7,
        guidance: 'Take one small, concrete step forward.',
        ritual: 'Identify the single most aligned action you can take today toward your intention. Do it — no matter how small. Small moves in the right direction carry exponential energy now.',
        intention: 'What\'s the one step that\'s been waiting to be taken?',
    },
    {
        name: 'First Quarter', emoji: '🌓', startDay: 7.38, length: 1.85,
        guidance: 'Obstacles arise. Act with courage.',
        ritual: 'Name the thing you\'ve been avoiding. Do it today. The First Quarter tests your commitment — passing this test accelerates everything.',
        intention: 'What would I do if I weren\'t afraid?',
    },
    {
        name: 'Waxing Gibbous', emoji: '🌔', startDay: 9.22, length: 5.54,
        guidance: 'Amplify and affirm. Momentum is building.',
        ritual: 'Daily affirmation: "I am grateful that [your declaration] is already making its way to me." Feel this as fact, not hope. Gratitude is the most powerful amplifier.',
        intention: 'Feel it as if it\'s already done.',
    },
    {
        name: 'Full Moon', emoji: '🌕', startDay: 14.76, length: 1.85,
        guidance: 'Celebrate what\'s coming. Release what\'s blocking.',
        ritual: 'Write on paper what you are releasing — fear, doubt, old patterns. Burn or tear it with intention. Then stand in the moonlight (or near a window) and say: "I release this. I make space for what\'s mine."',
        intention: 'What am I releasing to make space for what I\'m calling in?',
    },
    {
        name: 'Waning Gibbous', emoji: '🌖', startDay: 16.61, length: 5.54,
        guidance: 'Integrate and look for signs.',
        ritual: 'Review your manifestation. Look for evidence — synchronicities, doors opening, conversations. Write 3 signs you\'ve seen. Gratitude for signs accelerates more signs.',
        intention: 'What evidence is already here that I haven\'t fully acknowledged?',
    },
    {
        name: 'Last Quarter', emoji: '🌗', startDay: 22.15, length: 1.85,
        guidance: 'Release deeply. Let go of control.',
        ritual: '7-breath practice: Breathe in your intention fully. Breathe out any attachment to HOW it arrives. Seven slow breaths. Surrender is not giving up — it\'s trusting.',
        intention: 'I hold the vision. I release the path.',
    },
    {
        name: 'Waning Crescent', emoji: '🌘', startDay: 24.0, length: 5.53,
        guidance: 'Rest. A new cycle is almost here.',
        ritual: '5 minutes of silence. No phone, no music. Ask inwardly: what does my soul most want to call in next? Let the answer come — don\'t force it. The next New Moon is approaching.',
        intention: 'What wants to be born in the next cycle?',
    },
];

function getLunarData() {
    const daysSince = (Date.now() - KNOWN_NEW_MOON) / MS_PER_DAY;
    const currentPos = ((daysSince % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
    const currentPhase = LUNAR_PHASES.find(p => currentPos >= p.startDay && currentPos < p.startDay + p.length) ?? LUNAR_PHASES[7];
    const daysIntoPhase = currentPos - currentPhase.startDay;
    const daysRemainingInPhase = Math.max(1, Math.ceil(currentPhase.length - daysIntoPhase));

    // Compute next 4 key lunar phase dates (New Moon, Quarter, Full Moon, Last Quarter)
    const KEY_PHASES = [
        { name: 'New Moon', emoji: '🌑', dayOffset: 0 },
        { name: 'First Quarter', emoji: '🌓', dayOffset: 7.38 },
        { name: 'Full Moon', emoji: '🌕', dayOffset: 14.76 },
        { name: 'Last Quarter', emoji: '🌗', dayOffset: 22.15 },
    ];

    const upcoming = KEY_PHASES.map(kp => {
        let daysUntil = kp.dayOffset - currentPos;
        if (daysUntil <= 0.5) daysUntil += LUNAR_CYCLE;
        const date = new Date(Date.now() + daysUntil * MS_PER_DAY);
        return {
            name: kp.name,
            emoji: kp.emoji,
            date,
            daysUntil: Math.ceil(daysUntil),
            dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    return { currentPhase, daysRemainingInPhase, currentPos, upcoming };
}

// ── Manifestation Windows (transit-aware) ──────────────────────────────────

const WINDOW_PLANET_MSG: Record<string, { title: string; msg: string; color: string }> = {
    jupiter: { title: 'Expansion Window', msg: 'Jupiter opens doors. Ask for more than you think you deserve.', color: 'rgba(251,191,36,0.15)' },
    venus: { title: 'Abundance Window', msg: 'Venus aligns beauty, love, and material blessings. Call in abundance now.', color: 'rgba(236,72,153,0.12)' },
    saturn: { title: 'Structure Window', msg: 'Saturn harmonizes. Set long-term intentions — what you build now lasts years.', color: 'rgba(167,139,250,0.15)' },
};

// ── Props ──────────────────────────────────────────────────────────────────

interface CreateTabProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
}

// ── New Manifestation Modal ────────────────────────────────────────────────

function NewManifestationModal({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: (declaration: string) => void;
}) {
    const [text, setText] = React.useState('');
    const maxLen = 200;
    const placeholder = 'I am calling in…';

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px',
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%', maxWidth: '400px',
                    borderRadius: '22px',
                    padding: '32px 24px 24px',
                    background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 55%, #0d0b22 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -2px 5px rgba(0,0,0,0.35), 0 0 60px rgba(212,175,55,0.06)',
                    animation: 'fade-up 0.3s ease-out both',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px', filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.3))' }}>✨</div>
                    <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px', fontWeight: 700,
                        color: '#F9E491',
                        letterSpacing: '3px',
                        textShadow: '0 0 20px rgba(212,175,55,0.2)',
                        marginBottom: '6px',
                    }}>Call Something In</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 300, letterSpacing: '0.5px' }}>
                        Speak directly to the universe. Be specific.
                    </p>
                </div>

                {/* Starter prompt label */}
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '9px', letterSpacing: '3px',
                    textTransform: 'uppercase' as const,
                    color: 'rgba(212,175,55,0.5)',
                    marginBottom: '8px',
                }}>I am calling in…</p>

                {/* Textarea */}
                <textarea
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value.slice(0, maxLen))}
                    placeholder="...financial clarity and abundance that flows easily into my life."
                    rows={4}
                    style={{
                        width: '100%',
                        borderRadius: '16px',
                        padding: '16px',
                        fontSize: '14px',
                        color: '#e2e8f0',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 400,
                        lineHeight: 1.6,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(197,147,65,0.25)',
                        outline: 'none',
                        resize: 'none' as const,
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
                    }}
                />

                {/* Character count */}
                <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right', marginTop: '6px' }}>
                    {text.length}/{maxLen}
                </p>

                {/* Guidance text */}
                <p style={{
                    fontSize: '10px', color: 'rgba(148,163,184,0.5)',
                    textAlign: 'center', marginTop: '8px',
                    fontStyle: 'italic', fontWeight: 300,
                }}>
                    State it as already true. Feel it as you write it.
                </p>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '14px',
                            borderRadius: '16px',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px', letterSpacing: '1.5px',
                            textTransform: 'uppercase' as const,
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.03)',
                            color: '#9ca3af',
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { if (text.trim().length > 5) { onCreate(text.trim()); onClose(); } }}
                        disabled={text.trim().length <= 5}
                        style={{
                            flex: 1, padding: '14px',
                            borderRadius: '16px',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px', letterSpacing: '1.5px',
                            textTransform: 'uppercase' as const,
                            textAlign: 'center',
                            background: 'linear-gradient(180deg, #F9E491 0%, #D4A94E 30%, #C59341 60%, #A67B2E 100%)',
                            color: '#120224',
                            fontWeight: 800,
                            border: '1.5px solid rgba(212,175,55,0.6)',
                            boxShadow: '0 2px 0 #8a6914, 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                            textShadow: '0 1px 0 rgba(255,255,255,0.25)',
                            cursor: 'pointer',
                            opacity: text.trim().length <= 5 ? 0.3 : 1,
                            transition: 'opacity 0.2s ease',
                            position: 'relative' as const,
                            overflow: 'hidden',
                        }}
                    >
                        Plant This Seed 🌱
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Manifestation Card ─────────────────────────────────────────────────────

function ManifestCard({ entry, onRefresh }: {
    entry: ManifestationEntry;
    onRefresh: () => void;
}) {
    const [expanded, setExpanded] = React.useState(false);
    const [newAction, setNewAction] = React.useState('');
    const [showActionInput, setShowActionInput] = React.useState(false);

    const progress = getManifestationProgress(entry.id);
    const daysActive = progress?.daysActive ?? 0;
    const actDone = progress?.actionsCompleted ?? 0;
    const actTotal = progress?.actionsTotal ?? 0;
    const pct = actTotal > 0 ? Math.round((actDone / actTotal) * 100) : 0;

    const isActive = entry.status === 'active';

    return (
        <div
            className="overflow-hidden transition-all duration-300 relative"
            style={{
                borderRadius: '22px',
                background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 55%, #0d0b22 100%)',
                border: isActive ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.04)',
                borderLeft: isActive ? '1.5px solid rgba(197,147,65,0.4)' : undefined,
                boxShadow: isActive
                    ? '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -2px 5px rgba(0,0,0,0.35)'
                    : '0 4px 16px rgba(0,0,0,0.3)',
                opacity: isActive ? 1 : 0.5,
            }}
        >
            {/* Gold accent line at top of active cards */}
            {isActive && (
                <div style={{
                    position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px',
                    background: 'linear-gradient(90deg, transparent, #C59341, transparent)',
                    opacity: 0.5,
                }} />
            )}

            {/* Gold chevron — tap affordance */}
            {isActive && !expanded && (
                <span style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '16px', fontWeight: 300, color: '#D4A94E', opacity: 0.4,
                    fontFamily: 'var(--font-body)', lineHeight: 1,
                }}>›</span>
            )}

            {/* Card header — always visible */}
            <button
                className="w-full text-left"
                style={{ padding: '24px', paddingRight: isActive ? '44px' : '24px' }}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '16px',
                            fontWeight: 400,
                            color: '#e2e8f0',
                            lineHeight: 1.45,
                            marginBottom: '16px',
                        }}>
                            "{entry.declaration}"
                        </p>
                    </div>
                    {expanded && <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: '14px', flexShrink: 0, marginTop: '4px' }}>▾</span>}
                </div>

                {/* Progress bar row — exact prototype values */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '10px',
                        letterSpacing: '1px',
                        padding: '5px 12px',
                        borderRadius: '10px',
                        background: 'rgba(100,80,120,0.45)',
                        color: '#e0d0f0',
                        border: '1px solid rgba(255,255,255,0.08)',
                        whiteSpace: 'nowrap' as const,
                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05), 0 2px 6px rgba(0,0,0,0.3)',
                    }}>
                        Day {daysActive}
                    </span>
                    <div style={{
                        flex: 1, height: '8px', borderRadius: '8px',
                        background: 'rgba(197,147,65,0.1)', overflow: 'hidden', position: 'relative' as const,
                    }}>
                        <div style={{
                            height: '100%', borderRadius: '8px',
                            width: `${Math.max(pct, 8)}%`,
                            background: 'linear-gradient(90deg, #C59341, #D4A94E, #F9E491, #D4A94E)',
                            boxShadow: '0 0 14px rgba(212,175,55,0.18), 0 0 4px rgba(212,175,55,0.35)',
                            transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
                        }} />
                    </div>
                </div>

                {/* Stats badges — exact prototype */}
                {(entry.linkedReadingIds.length > 0 || actTotal > 0) && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' as const }}>
                        {entry.linkedReadingIds.length > 0 && (
                            <span style={{
                                fontSize: '10px', padding: '3px 10px', borderRadius: '20px',
                                fontWeight: 500, letterSpacing: '0.3px',
                                background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                                border: '1px solid rgba(99,102,241,0.15)',
                            }}>
                                🔮 {entry.linkedReadingIds.length} reading{entry.linkedReadingIds.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        {actTotal > 0 && (
                            <span style={{
                                fontSize: '10px', padding: '3px 10px', borderRadius: '20px',
                                fontWeight: 500, letterSpacing: '0.3px',
                                background: 'rgba(52,211,153,0.08)', color: '#6ee7b7',
                                border: '1px solid rgba(52,211,153,0.15)',
                            }}>
                                ✓ {actDone}/{actTotal} actions
                            </span>
                        )}
                    </div>
                )}
            </button>

            {/* Expanded content */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-white/5">
                    {/* Actions list */}
                    {entry.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                            <p className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase">Committed Actions</p>
                            {entry.actions.map(action => (
                                <div key={action.id} className="flex items-start gap-2">
                                    <button
                                        onClick={() => {
                                            if (!action.completedDate) {
                                                completeAction(entry.id, action.id);
                                                onRefresh();
                                            }
                                        }}
                                        className="shrink-0 mt-0.5 w-4 h-4 rounded-full border transition-all"
                                        style={{
                                            borderColor: action.completedDate ? '#34d399' : 'rgba(255,255,255,0.2)',
                                            background: action.completedDate ? 'rgba(52,211,153,0.2)' : 'transparent',
                                        }}
                                    >
                                        {action.completedDate && <span className="flex items-center justify-center text-[8px] text-emerald-400">✓</span>}
                                    </button>
                                    <p className={`text-xs leading-snug ${action.completedDate ? 'text-altar-muted line-through opacity-60' : 'text-altar-text/80'}`}>
                                        {action.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add action */}
                    {isActive && (
                        <div className="mt-3">
                            {showActionInput ? (
                                <div className="space-y-2">
                                    <input
                                        autoFocus
                                        value={newAction}
                                        onChange={e => setNewAction(e.target.value)}
                                        placeholder="I commit to..."
                                        className="w-full rounded-xl p-2.5 text-xs text-altar-text bg-white/5 border border-white/10 focus:border-altar-gold/30 focus:outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => { setShowActionInput(false); setNewAction(''); }}
                                            className="flex-1 py-2 rounded-xl text-[10px] text-altar-muted border border-white/10">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (newAction.trim()) {
                                                    commitAction(entry.id, newAction.trim());
                                                    setNewAction('');
                                                    setShowActionInput(false);
                                                    onRefresh();
                                                }
                                            }}
                                            className="flex-1 py-2 rounded-xl text-[10px] text-altar-gold border border-altar-gold/30">
                                            Commit ✓
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowActionInput(true)}
                                    className="text-[10px] text-altar-muted/70 italic hover:text-altar-gold/70 transition-colors">
                                    + Add a committed action
                                </button>
                            )}
                        </div>
                    )}

                    {/* Status actions */}
                    {isActive && (
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => { updateManifestationStatus(entry.id, 'manifested'); onRefresh(); }}
                                className="flex-1 py-2.5 rounded-2xl text-[10px] font-display tracking-wide"
                                style={{ background: 'rgba(197,147,65,0.10)', color: '#D4A94E', border: '1px solid rgba(197,147,65,0.2)' }}>
                                ✨ It manifested!
                            </button>
                            <button
                                onClick={() => { updateManifestationStatus(entry.id, 'released'); onRefresh(); }}
                                className="flex-1 py-2.5 rounded-2xl text-[10px] font-display tracking-wide"
                                style={{ background: 'rgba(255,255,255,0.03)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
                                🌿 Release
                            </button>
                        </div>
                    )}

                    {/* Delete for completed */}
                    {!isActive && (
                        <button
                            onClick={() => { deleteManifestation(entry.id); onRefresh(); }}
                            className="mt-3 text-[9px] text-red-400/50 hover:text-red-400/80 transition-colors">
                            Remove from history
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main CreateTab ─────────────────────────────────────────────────────────

export function CreateTab({ onClose, onTabChange, subscription, onShowPremium }: CreateTabProps) {
    const [manifestations, setManifestations] = React.useState<ManifestationEntry[]>([]);
    const [showNewModal, setShowNewModal] = React.useState(false);
    const [tick, setTick] = React.useState(0); // force refresh

    const lunarData = React.useMemo(() => getLunarData(), []);

    const refresh = () => {
        setManifestations(getAllManifestations());
        setTick(t => t + 1);
    };

    React.useEffect(() => { refresh(); }, []);

    const active = manifestations.filter(m => m.status === 'active');
    const history = manifestations.filter(m => m.status !== 'active');

    // Cosmic timing windows from transit feed
    const transitWindows = React.useMemo(() => {
        if (!getBirthData()) return [];
        try {
            const feed = getTransitFeed();
            return [...feed.active, ...feed.coming].filter(h =>
                WINDOW_PLANET_MSG[h.transitPlanet.id] &&
                (h.transitPlanet.id !== 'saturn' || h.aspect.nature === 'harmonious')
            ).slice(0, 4);
        } catch { return []; }
    }, []);

    return (
        <>
            <div className="page-frame">
                <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text" style={{ position: 'relative' }}>
                    {/* Sacred geometry background overlay — more visible like mockup */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.05,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='150' cy='150' r='140' stroke='%23d4af37' fill='none' stroke-width='0.4'/%3E%3Ccircle cx='150' cy='150' r='120' stroke='%23d4af37' fill='none' stroke-width='0.3'/%3E%3Ccircle cx='150' cy='150' r='100' stroke='%23d4af37' fill='none' stroke-width='0.3'/%3E%3Ccircle cx='150' cy='150' r='60' stroke='%23d4af37' fill='none' stroke-width='0.3'/%3E%3Cpolygon points='150,30 260,200 40,200' stroke='%23d4af37' fill='none' stroke-width='0.4'/%3E%3Cpolygon points='150,270 40,100 260,100' stroke='%23d4af37' fill='none' stroke-width='0.4'/%3E%3Cline x1='150' y1='10' x2='150' y2='290' stroke='%23d4af37' stroke-width='0.2'/%3E%3Cline x1='10' y1='150' x2='290' y2='150' stroke='%23d4af37' stroke-width='0.2'/%3E%3C/svg%3E")`,
                        backgroundSize: '300px 300px',
                        pointerEvents: 'none',
                    }} />

                    <PageHeader title="CREATE" onClose={onClose} titleSize="lg" />

                    <div className="max-w-[500px] mx-auto px-4" style={{ position: 'relative', zIndex: 1 }}>
                        {/* Hero — Sri Yantra Mandala (matching mockup) */}
                        <div className="text-center animate-fade-up" style={{ padding: '20px 24px 4px' }}>
                            <div className="relative mx-auto" style={{ width: '100px', height: '100px', marginBottom: '16px' }}>
                                {/* Ambient glow */}
                                <div className="absolute inset-0" style={{
                                    background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 40%, transparent 70%)',
                                    transform: 'scale(1.6)',
                                    animation: 'pulse 4s ease-in-out infinite',
                                }} />
                                {/* Sacred Flower-Atom Mandala Glyph */}
                                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 14px rgba(212,175,55,0.35))' }}>
                                    <defs>
                                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#F9E491" />
                                            <stop offset="50%" stopColor="#D4A94E" />
                                            <stop offset="100%" stopColor="#C59341" />
                                        </linearGradient>
                                    </defs>
                                    {/* Outer lotus flower petals (8 petals with cusp tips) */}
                                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                        <g key={`petal-${deg}`} transform={`rotate(${deg} 100 100)`}>
                                            {/* Each petal: two arcs creating a pointed leaf shape */}
                                            <path
                                                d="M100,12 Q125,40 100,55 Q75,40 100,12 Z"
                                                stroke="url(#goldGrad)" fill="none" strokeWidth="1.8" opacity="0.75"
                                            />
                                        </g>
                                    ))}
                                    {/* Inner flower petals (8 smaller, rotated 22.5°) */}
                                    {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(deg => (
                                        <g key={`inner-petal-${deg}`} transform={`rotate(${deg} 100 100)`}>
                                            <path
                                                d="M100,28 Q118,48 100,60 Q82,48 100,28 Z"
                                                stroke="url(#goldGrad)" fill="none" strokeWidth="1.2" opacity="0.5"
                                            />
                                        </g>
                                    ))}
                                    {/* Orbital ellipses (atom-like rings) */}
                                    <ellipse cx="100" cy="100" rx="58" ry="30"
                                        transform="rotate(0 100 100)"
                                        stroke="#d4af37" fill="none" strokeWidth="1.4" opacity="0.7" />
                                    <ellipse cx="100" cy="100" rx="58" ry="30"
                                        transform="rotate(60 100 100)"
                                        stroke="#d4af37" fill="none" strokeWidth="1.4" opacity="0.7" />
                                    <ellipse cx="100" cy="100" rx="58" ry="30"
                                        transform="rotate(120 100 100)"
                                        stroke="#d4af37" fill="none" strokeWidth="1.4" opacity="0.7" />
                                    {/* Additional inner orbital ring */}
                                    <ellipse cx="100" cy="100" rx="42" ry="22"
                                        transform="rotate(30 100 100)"
                                        stroke="#C59341" fill="none" strokeWidth="0.8" opacity="0.4" />
                                    <ellipse cx="100" cy="100" rx="42" ry="22"
                                        transform="rotate(90 100 100)"
                                        stroke="#C59341" fill="none" strokeWidth="0.8" opacity="0.4" />
                                    <ellipse cx="100" cy="100" rx="42" ry="22"
                                        transform="rotate(150 100 100)"
                                        stroke="#C59341" fill="none" strokeWidth="0.8" opacity="0.4" />
                                    {/* Center atom cluster (3 circles + central dot) */}
                                    <circle cx="100" cy="100" r="6" fill="#d4af37" opacity="0.85" />
                                    <circle cx="92" cy="108" r="3.5" fill="#C59341" opacity="0.7" />
                                    <circle cx="108" cy="108" r="3.5" fill="#C59341" opacity="0.7" />
                                    <circle cx="100" cy="92" r="3.5" fill="#C59341" opacity="0.7" />
                                    {/* Outer bounding circle */}
                                    <circle cx="100" cy="100" r="88" stroke="#d4af37" fill="none" strokeWidth="0.6" opacity="0.2" />
                                </svg>
                            </div>
                            <h2 className="font-display text-altar-gold"
                                style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '5px', textShadow: '0 0 30px rgba(212,175,55,0.2)', marginBottom: '6px' }}>
                                Manifestation Hub
                            </h2>
                            <p style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '0.5px', fontWeight: 300 }}>
                                You speak to the universe here.
                            </p>
                        </div>

                        {/* Single scroll manifestation content */}
                        <div className="animate-fade-up space-y-4" style={{ animationDelay: '0.1s', opacity: 0 }}>
                            {/* CTA — Embossed metallic gold button (matching mockup) */}
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="w-full font-display tracking-[3.5px] text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                                style={{
                                    borderRadius: '20px',
                                    padding: '18px 24px',
                                    background: 'linear-gradient(180deg, #F9E491 0%, #D4A94E 30%, #C59341 60%, #A67B2E 100%)',
                                    color: '#120224',
                                    fontWeight: 800,
                                    boxShadow: '0 2px 0 #8a6914, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
                                    border: '2px solid rgba(212,175,55,0.6)',
                                    textShadow: '0 1px 0 rgba(255,255,255,0.25)',
                                    marginBottom: '24px',
                                }}>
                                {/* Shimmer overlay */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 55%, transparent 65%)',
                                    animation: 'shimmer 3s ease-in-out infinite',
                                }} />
                                <span style={{ position: 'relative', zIndex: 1 }}>+ Call Something In</span>
                            </button>

                            {/* Active manifestations */}
                            {active.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                                    {active.map(m => (
                                        <ManifestCard key={`${m.id}-${tick}`} entry={m} onRefresh={refresh} />
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    borderRadius: '24px',
                                    padding: '48px 24px',
                                    textAlign: 'center' as const,
                                    background: 'linear-gradient(145deg, rgba(212,175,55,0.08) 0%, rgba(255,255,255,0.01) 100%)',
                                    border: '1px solid rgba(212,175,55,0.08)',
                                    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.25)',
                                    backdropFilter: 'blur(8px)',
                                }}>
                                    <p style={{ fontSize: '40px', marginBottom: '14px', filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.3))' }}>🌱</p>
                                    <p style={{ fontSize: '14px', color: 'rgba(226,232,240,0.6)', fontWeight: 500, marginBottom: '6px' }}>Nothing planted yet.</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', fontWeight: 300 }}>
                                        Your first intention is the most powerful one.
                                    </p>
                                </div>
                            )}

                            {/* History */}
                            {history.length > 0 && (
                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                                    {history.map(m => (
                                        <ManifestCard key={`${m.id}-${tick}`} entry={m} onRefresh={refresh} />
                                    ))}
                                </div>
                            )}

                            {/* Cosmic timing windows — premium intelligence feed */}
                            {transitWindows.length > 0 && (
                                <div style={{ marginTop: '24px' }}>
                                    <p style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '9px',
                                        letterSpacing: '5px',
                                        textTransform: 'uppercase' as const,
                                        color: '#D4A94E',
                                        opacity: 0.5,
                                        textShadow: '0 0 10px rgba(212,175,55,0.08)',
                                        marginBottom: '10px',
                                    }}>
                                        ⚡ Cosmic Timing
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                                        {transitWindows.map((hit, i) => {
                                            const wInfo = WINDOW_PLANET_MSG[hit.transitPlanet.id];
                                            if (!wInfo) return null;
                                            const isNow = !hit.isApplying;
                                            return (
                                                <div key={i} className="flex items-center gap-3"
                                                    style={{
                                                        padding: '14px 16px',
                                                        borderRadius: '16px',
                                                        background: isNow
                                                            ? 'linear-gradient(135deg, rgba(197,147,65,0.08) 0%, rgba(61,29,90,0.4) 100%)'
                                                            : 'rgba(61,29,90,0.35)',
                                                        border: isNow
                                                            ? '1px solid rgba(212,175,55,0.18)'
                                                            : '1px solid rgba(212,175,55,0.10)',
                                                        backdropFilter: 'blur(12px)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                    }}>
                                                    {/* Planet icon */}
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '18px',
                                                        border: `1.5px solid rgba(197,147,65,${isNow ? '0.5' : '0.35'})`,
                                                        background: `radial-gradient(circle, rgba(197,147,65,${isNow ? '0.12' : '0.06'}) 0%, transparent 70%)`,
                                                        boxShadow: isNow ? '0 0 14px rgba(212,175,55,0.08), 0 0 6px rgba(197,147,65,0.15)' : 'none',
                                                    }}>
                                                        <span style={{ color: '#C59341' }}>{hit.transitPlanet.glyph}</span>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{
                                                            fontFamily: 'var(--font-display)',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            letterSpacing: '2px',
                                                            textTransform: 'uppercase' as const,
                                                            color: 'rgba(226,232,240,0.85)',
                                                            marginBottom: '3px',
                                                        }}>
                                                            ✨ {wInfo.title}
                                                        </p>
                                                        <p style={{
                                                            fontSize: '11px',
                                                            color: 'rgba(148,163,184,0.65)',
                                                            fontWeight: 300,
                                                            lineHeight: 1.45,
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical' as const,
                                                            overflow: 'hidden',
                                                        }}>{wInfo.msg}</p>
                                                    </div>
                                                    {/* Status pill */}
                                                    <div style={{ flexShrink: 0 }}>
                                                        <span style={{
                                                            display: 'flex', alignItems: 'center', gap: '5px',
                                                            fontFamily: 'var(--font-display)',
                                                            fontSize: '9px',
                                                            letterSpacing: '1.5px',
                                                            textTransform: 'uppercase' as const,
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            ...(isNow ? {
                                                                background: 'rgba(197,147,65,0.12)',
                                                                color: '#D4A94E',
                                                                border: '1px solid rgba(197,147,65,0.25)',
                                                            } : {
                                                                background: 'rgba(148,163,184,0.06)',
                                                                color: 'rgba(180,170,200,0.5)',
                                                                border: '1px solid rgba(255,255,255,0.06)',
                                                            }),
                                                        }}>
                                                            {isNow && (
                                                                <span style={{
                                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                                    background: '#D4A94E',
                                                                    animation: 'livePulse 2s ease-in-out infinite',
                                                                    boxShadow: '0 0 4px rgba(212,175,55,0.18)',
                                                                }} />
                                                            )}
                                                            {isNow ? 'Now' : 'Coming'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Moon phase banner — exact prototype */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '14px 16px',
                            borderRadius: '16px',
                            margin: '4px 20px 0',
                            background: 'rgba(61,29,90,0.35)',
                            border: '1px solid rgba(212,175,55,0.10)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}>
                            <span style={{
                                fontSize: '30px', flexShrink: 0,
                                filter: 'drop-shadow(0 0 8px rgba(200,200,200,0.3)) drop-shadow(0 0 20px rgba(197,147,65,0.12))',
                            }}>{lunarData.currentPhase.emoji}</span>
                            <p style={{ fontSize: '12px', lineHeight: 1.5 }}>
                                <span style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                    color: '#F9E491', letterSpacing: '2px',
                                    textTransform: 'uppercase' as const, fontSize: '11px',
                                }}>{lunarData.currentPhase.name} Energy</span>
                                <span style={{ color: 'rgba(148,163,184,0.5)' }}> — </span>
                                <span style={{ fontStyle: 'italic', color: 'rgba(148,163,184,0.7)', fontWeight: 300 }}>{lunarData.currentPhase.guidance}</span>
                            </p>
                        </div>

                        <div className="h-10" />
                    </div>

                    {/* CSS Animations */}
                    <style>{`
                        @keyframes shimmer {
                            0%, 100% { transform: translateX(-100%); }
                            50% { transform: translateX(100%); }
                        }
                        @keyframes livePulse {
                            0%, 100% { opacity: 1; transform: scale(1); }
                            50% { opacity: 0.5; transform: scale(0.8); }
                        }
                    `}</style>
                </div>
                <BottomNav currentTab="create" onTabChange={onTabChange} />
            </div>

            {/* New manifestation modal */}
            {showNewModal && (
                <NewManifestationModal
                    onClose={() => setShowNewModal(false)}
                    onCreate={(decl) => {
                        createManifestation(decl, 'manifestation');
                        refresh();
                    }}
                />
            )}
        </>
    );
}

