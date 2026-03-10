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
    jupiter: { title: '🌟 Expansion Window', msg: 'Jupiter opens doors. Ask for more than you think you deserve.', color: 'rgba(251,191,36,0.15)' },
    venus: { title: '🌹 Abundance Window', msg: 'Venus aligns beauty, love, and material blessings. Call in abundance now.', color: 'rgba(236,72,153,0.12)' },
    saturn: { title: '⏳ Structure Window', msg: 'Saturn harmonizes. Set long-term intentions — what you build now lasts years.', color: 'rgba(167,139,250,0.15)' },
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
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-3xl p-6 animate-fade-up"
                style={{
                    background: 'linear-gradient(145deg, #150d2e 0%, #0c0818 100%)',
                    border: '1px solid rgba(212,175,55,0.25)',
                    boxShadow: '0 -20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.08)',
                    marginBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center mb-5">
                    <div className="text-3xl mb-2">✨</div>
                    <h3 className="font-display text-lg text-altar-gold tracking-[2px]">Call Something In</h3>
                    <p className="text-xs text-altar-muted mt-1">Speak directly to the universe. Be specific.</p>
                </div>

                {/* Starter prompt */}
                <p className="text-xs text-altar-gold/60 font-display tracking-wider mb-2 uppercase">I am calling in…</p>
                <textarea
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value.slice(0, maxLen))}
                    placeholder="...financial clarity and abundance that flows easily into my life."
                    className="w-full rounded-2xl p-4 text-sm text-altar-text bg-white/5 border border-white/10 focus:border-altar-gold/40 focus:outline-none resize-none leading-relaxed"
                    rows={4}
                />
                <p className="text-[10px] text-altar-muted text-right mt-1">{text.length}/{maxLen}</p>

                <p className="text-[10px] text-altar-muted/60 text-center mt-2 italic">
                    State it as already true. Feel it as you write it.
                </p>

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl text-sm text-altar-muted border border-white/10 font-display tracking-wide"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { if (text.trim().length > 5) { onCreate(text.trim()); onClose(); } }}
                        disabled={text.trim().length <= 5}
                        className="flex-1 py-3 rounded-2xl text-sm font-display tracking-wide transition-all disabled:opacity-30"
                        style={{
                            background: 'linear-gradient(135deg, rgba(212,175,55,0.9), rgba(251,191,36,0.8))',
                            color: '#0c0818',
                            fontWeight: 700,
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
            className="rounded-3xl overflow-hidden"
            style={{
                background: isActive
                    ? 'linear-gradient(145deg, rgba(212,175,55,0.08) 0%, rgba(13,6,24,0.95) 100%)'
                    : 'rgba(255,255,255,0.03)',
                border: isActive ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(255,255,255,0.06)',
                opacity: isActive ? 1 : 0.6,
            }}
        >
            {/* Card header — always visible */}
            <button
                className="w-full text-left p-4"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-display tracking-[3px] uppercase mb-1.5"
                            style={{ color: isActive ? '#d4af37' : '#9ca3af' }}>
                            {isActive ? '✨ Active' : entry.status === 'manifested' ? '🎉 Manifested' : '🌿 Released'}
                        </p>
                        <p className="text-sm text-altar-text leading-snug font-medium">
                            "{entry.declaration}"
                        </p>
                    </div>
                    <span className="text-altar-muted text-sm shrink-0 mt-0.5">{expanded ? '▾' : '▸'}</span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Day {daysActive}
                    </span>
                    {entry.linkedReadingIds.length > 0 && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                            🔮 {entry.linkedReadingIds.length} reading{entry.linkedReadingIds.length !== 1 ? 's' : ''}
                        </span>
                    )}
                    {actTotal > 0 && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(52,211,153,0.12)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.2)' }}>
                            ✓ {actDone}/{actTotal} actions
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                {actTotal > 0 && (
                    <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #d4af37, #fbbf24)' }} />
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
                                style={{ background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.2)' }}>
                                🎉 It manifested!
                            </button>
                            <button
                                onClick={() => { updateManifestationStatus(entry.id, 'released'); onRefresh(); }}
                                className="flex-1 py-2.5 rounded-2xl text-[10px] font-display tracking-wide"
                                style={{ background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
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
                <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                    <PageHeader title="CREATE" onClose={onClose} titleSize="lg" />

                    <div className="max-w-[500px] mx-auto px-4">
                        {/* Hero */}
                        <div className="text-center mt-4 mb-5 animate-fade-up">
                            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(99,40,217,0.15) 100%)',
                                    border: '1px solid rgba(212,175,55,0.2)',
                                    boxShadow: '0 0 30px rgba(212,175,55,0.1)',
                                }}>
                                ✨
                            </div>
                            <h2 className="font-display text-lg text-altar-gold tracking-[3px]">Manifestation Hub</h2>
                            <p className="text-[10px] text-altar-muted mt-1">
                                You speak to the universe here.
                            </p>
                        </div>

                        {/* Single scroll manifestation content */}
                        <div className="animate-fade-up space-y-4" style={{ animationDelay: '0.1s', opacity: 0 }}>
                            {/* New intention button */}
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="w-full py-4 rounded-3xl font-display tracking-[2px] text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.06) 100%)',
                                    border: '1px dashed rgba(212,175,55,0.3)',
                                    color: '#d4af37',
                                }}>
                                + Call Something In
                            </button>

                            {/* Active manifestations */}
                            {active.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase">Active</p>
                                    {active.map(m => (
                                        <ManifestCard key={`${m.id}-${tick}`} entry={m} onRefresh={refresh} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-3xl p-8 text-center"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p className="text-4xl mb-3">🌱</p>
                                    <p className="text-sm text-altar-text/60">Nothing planted yet.</p>
                                    <p className="text-[10px] text-altar-muted mt-1 italic">
                                        Your first intention is the most powerful one.
                                    </p>
                                </div>
                            )}

                            {/* History */}
                            {history.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    <p className="text-[9px] text-altar-muted/60 font-display tracking-[3px] uppercase">History</p>
                                    {history.map(m => (
                                        <ManifestCard key={`${m.id}-${tick}`} entry={m} onRefresh={refresh} />
                                    ))}
                                </div>
                            )}

                            {/* Cosmic timing windows (inline) */}
                            {transitWindows.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-[9px] text-altar-muted/60 font-display tracking-[3px] uppercase mb-2">⚡ Cosmic Timing</p>
                                    <div className="space-y-1.5">
                                        {transitWindows.map((hit, i) => {
                                            const wInfo = WINDOW_PLANET_MSG[hit.transitPlanet.id];
                                            if (!wInfo) return null;
                                            return (
                                                <div key={i} className="rounded-2xl p-3 flex items-center gap-3"
                                                    style={{ background: wInfo.color, border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <span className="text-lg shrink-0">{hit.transitPlanet.glyph}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-altar-text/80 font-display">{wInfo.title}</p>
                                                        <p className="text-[9px] text-altar-muted truncate">{wInfo.msg}</p>
                                                    </div>
                                                    <span className="text-[8px] text-altar-muted/60 shrink-0">
                                                        {hit.isApplying ? 'Coming' : 'Now'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Slim moon context banner */}
                            <div className="rounded-2xl p-3 flex items-center gap-3 mt-2"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="text-xl">{lunarData.currentPhase.emoji}</span>
                                <div>
                                    <p className="text-[9px] text-altar-gold/60 font-display tracking-wider uppercase">{lunarData.currentPhase.name} Energy</p>
                                    <p className="text-[10px] text-altar-muted italic">{lunarData.currentPhase.guidance}</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-8" />
                    </div>
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

