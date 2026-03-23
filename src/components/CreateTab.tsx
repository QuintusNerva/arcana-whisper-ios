/**
 * CreateTab — Phase 2 Manifestation Hub
 * "✨ Create" — the home base for the user's manifestation practice.
 *
 * Single-scroll layout: Active manifestations + Cosmic Timing + Moon context banner.
 * Moon phase ritual details now live in Cosmic Blueprint.
 */


import React from 'react';
import { safeStorage } from '../services/storage.service';
import { BottomNav } from './BottomNav';
import { VisionBoard, getVisionBoardItems, type VisionBoardItem } from './VisionBoard';
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
import {
    type SacredScript,
    type TimeOfDay,
    type ScriptProgress,
    RITUAL_CONFIGS,
    CYCLE_DAYS,
    createSacredScript,
    getActiveScript,
    getCompletedScripts,
    getPausedScripts,
    getScriptByManifestationId,
    abandonScript,
    pauseScript,
    resumeScript,
    saveRitualEntry,
    getTodayRitual,
    getScriptProgress,
    getTimeOfDay,
    getNextRitual,
    getMoonPrompt,
    hasSeenOnboarding,
    markOnboardingSeen,
} from '../services/sacred-script.service';

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
                    {expanded && <span style={{ color: 'rgba(178,190,205,0.75)', fontSize: '14px', flexShrink: 0, marginTop: '4px' }}>▾</span>}
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
                                    <p className={`text-xs leading-snug ${action.completedDate ? 'text-altar-muted line-through opacity-60' : 'text-altar-text/90'}`}>
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
                                    className="text-[10px] text-altar-muted italic hover:text-altar-gold/70 transition-colors">
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

// ══════════════════════════════════════════════════════════════════════════
// ── MANIFEST JOURNAL ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

interface JournalEntry {
    id: string;
    date: string;         // ISO date
    prompt: string;
    category: 'script' | 'gratitude' | 'release' | 'feel';
    body: string;
    mood: string;         // emoji
    moonPhase: string;
}

const JOURNAL_STORAGE_KEY = 'arcana_manifest_journal';

function getJournalEntries(): JournalEntry[] {
    try {
        const raw = safeStorage.getItem(JOURNAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveJournalEntry(entry: JournalEntry) {
    const entries = getJournalEntries();
    entries.unshift(entry);
    safeStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
}

const JOURNAL_MOODS = [
    { emoji: '✨', label: 'Inspired' },
    { emoji: '🔥', label: 'Passionate' },
    { emoji: '🌿', label: 'Peaceful' },
    { emoji: '💎', label: 'Determined' },
    { emoji: '🌙', label: 'Reflective' },
];

const CATEGORY_META: Record<string, { emoji: string; label: string; color: string }> = {
    script:   { emoji: '✨', label: 'Script',   color: '#F9E491' },
    gratitude:{ emoji: '🙏', label: 'Gratitude', color: '#8BD5CA' },
    release:  { emoji: '🌊', label: 'Release',  color: '#C4B5FD' },
    feel:     { emoji: '💛', label: 'Feel',     color: '#FCD34D' },
};

/** Moon-phase-aware prompts — 5 per category */
const JOURNAL_PROMPTS: Record<string, string[]> = {
    script: [
        'Describe your life one year from now as if everything you desire is already yours. What does your morning look like?',
        'You just received the news you\'ve been waiting for. Write about this moment — what you see, hear, and feel.',
        'Imagine stepping into your dream home for the first time. Walk through each room and describe the details.',
        'Your ideal day unfolds effortlessly. From sunrise to sunset, describe every sensation as if you\'re living it now.',
        'You\'re being interviewed about your success story. What do you tell them about how it all came together?',
    ],
    gratitude: [
        'Name three things that happened this week that you\'re genuinely thankful for. Why do they matter to you?',
        'Think of someone who has positively shaped your journey. Write about the impact they\'ve had on your life.',
        'What part of your current reality would your past self be amazed by? Celebrate how far you\'ve come.',
        'What small, everyday moment recently filled you with unexpected joy? Describe it in full detail.',
        'Look around you right now. What do you see that you once wished for? Honor that manifestation.',
    ],
    release: [
        'What fear or limiting belief has been taking up space in your mind? Write it out fully, then let it go.',
        'If you could send a message to your inner critic, what would you say? Rewrite the narrative with compassion.',
        'What are you holding onto that no longer serves your highest good? Give yourself permission to release it.',
        'Describe a pattern you\'re ready to break. What will you replace it with?',
        'Write a farewell letter to a version of yourself you\'re outgrowing. Thank them and move forward.',
    ],
    feel: [
        'Close your eyes and imagine your ideal life. What emotions wash over you? Describe every feeling in detail.',
        'Think of a moment when you felt truly alive and free. Relive it through all five senses on paper.',
        'How does abundance feel in your body? Describe the physical sensation of having everything you need.',
        'Imagine the person you\'re becoming. How do they carry themselves? What do they feel when they wake up?',
        'Write about the deepest sense of peace you\'ve ever experienced. Let that feeling expand as you write.',
    ],
};

/** Get journal category based on current moon phase */
function getJournalCategory(moonPhaseName: string): 'script' | 'gratitude' | 'release' | 'feel' {
    const lp = moonPhaseName.toLowerCase();
    if (lp.includes('new'))                                       return 'script';
    if (lp.includes('waxing crescent') || lp.includes('first quarter')) return 'gratitude';
    if (lp.includes('waxing gibbous') || lp.includes('full'))     return 'feel';
    if (lp.includes('waning'))                                    return 'release';
    if (lp.includes('last quarter'))                              return 'release';
    return 'script';
}

/** Get today's prompt based on moon phase + day rotation */
function getTodayJournalPrompt(moonPhaseName: string): { prompt: string; category: string } {
    const category = getJournalCategory(moonPhaseName);
    const prompts = JOURNAL_PROMPTS[category];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const prompt = prompts[dayOfYear % prompts.length];
    return { prompt, category };
}

/** Full-page journal writing experience */
function ManifestJournalPage({
    moonPhaseName,
    onClose,
    onSave,
}: {
    moonPhaseName: string;
    onClose: () => void;
    onSave: () => void;
}) {
    const { prompt, category } = getTodayJournalPrompt(moonPhaseName);
    const catMeta = CATEGORY_META[category];
    const [body, setBody] = React.useState('');
    const [selectedMood, setSelectedMood] = React.useState('');
    const [saved, setSaved] = React.useState(false);

    const handleSave = () => {
        if (!body.trim()) return;
        const entry: JournalEntry = {
            id: `j_${Date.now()}`,
            date: new Date().toISOString(),
            prompt,
            category: category as JournalEntry['category'],
            body: body.trim(),
            mood: selectedMood || '✨',
            moonPhase: moonPhaseName,
        };
        saveJournalEntry(entry);
        setSaved(true);
        setTimeout(() => { onSave(); onClose(); }, 800);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(180deg, #0e0a1f 0%, #120224 50%, #0e0a1f 100%)',
            overflow: 'auto',
            paddingBottom: '100px',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
            }}>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', color: 'rgba(196,196,220,0.6)',
                    fontSize: '14px', cursor: 'pointer', padding: '4px',
                }}>← Back</button>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '11px', fontWeight: 700,
                    letterSpacing: '5px', textTransform: 'uppercase' as const,
                    color: '#F9E491',
                    textShadow: '0 0 20px rgba(212,175,55,0.2)',
                }}>Manifest Journal</p>
                <div style={{ width: '48px' }} />
            </div>

            <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>
                {/* Category pill */}
                <div style={{ textAlign: 'center' as const, marginBottom: '16px' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '5px 14px', borderRadius: '20px',
                        fontSize: '10px', fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '1.5px', textTransform: 'uppercase' as const,
                        background: `rgba(${catMeta.color === '#F9E491' ? '249,228,145' : catMeta.color === '#8BD5CA' ? '139,213,202' : catMeta.color === '#C4B5FD' ? '196,181,253' : '252,211,77'},0.12)`,
                        color: catMeta.color,
                        border: `1px solid rgba(${catMeta.color === '#F9E491' ? '249,228,145' : catMeta.color === '#8BD5CA' ? '139,213,202' : catMeta.color === '#C4B5FD' ? '196,181,253' : '252,211,77'},0.25)`,
                    }}>
                        {catMeta.emoji} {catMeta.label}
                    </span>
                    <p style={{
                        fontSize: '10px', color: 'rgba(210,210,230,0.8)',
                        fontStyle: 'italic', marginTop: '6px',
                    }}>{moonPhaseName} energy guides today's reflection</p>
                </div>

                {/* Prompt card */}
                <div style={{
                    padding: '24px 20px',
                    borderRadius: '18px',
                    background: 'linear-gradient(160deg, rgba(28,21,56,0.9) 0%, rgba(13,11,34,0.95) 100%)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)',
                    marginBottom: '20px',
                    position: 'relative' as const,
                    overflow: 'hidden',
                }}>
                    {/* Gold accent line */}
                    <div style={{
                        position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
                    }} />
                    <p style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '16px', fontWeight: 500,
                        fontStyle: 'italic',
                        color: '#d4af37',
                        lineHeight: 1.7,
                        textAlign: 'center' as const,
                    }}>"{prompt}"</p>
                </div>

                {/* Writing area */}
                <div style={{
                    borderRadius: '18px',
                    background: 'linear-gradient(160deg, rgba(28,21,56,0.7) 0%, rgba(13,11,34,0.8) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.03)',
                    padding: '20px',
                    marginBottom: '20px',
                }}>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Begin writing... let your thoughts flow freely."
                        style={{
                            width: '100%', minHeight: '200px', maxHeight: '400px',
                            background: 'transparent', border: 'none', outline: 'none',
                            color: '#e2e8f0', fontSize: '15px', lineHeight: 1.8,
                            fontFamily: 'var(--font-body)',
                            fontWeight: 300,
                            resize: 'vertical' as const,
                            letterSpacing: '0.3px',
                        }}
                    />
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginTop: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '12px',
                    }}>
                        <span style={{
                            fontSize: '11px', color: 'rgba(178,190,205,0.75)',
                            fontWeight: 300,
                        }}>{body.length} characters</span>
                    </div>
                </div>

                {/* Mood picker */}
                <div style={{
                    borderRadius: '18px',
                    background: 'linear-gradient(160deg, rgba(28,21,56,0.7) 0%, rgba(13,11,34,0.8) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '16px 20px',
                    marginBottom: '20px',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '10px', fontWeight: 600,
                        letterSpacing: '2px', textTransform: 'uppercase' as const,
                        color: 'rgba(226,232,240,0.85)', marginBottom: '12px',
                    }}>How do you feel?</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
                        {JOURNAL_MOODS.map(m => (
                            <button
                                key={m.emoji}
                                onClick={() => setSelectedMood(m.emoji)}
                                style={{
                                    display: 'flex', flexDirection: 'column' as const,
                                    alignItems: 'center', gap: '4px',
                                    padding: '10px 12px', borderRadius: '14px',
                                    background: selectedMood === m.emoji
                                        ? 'rgba(212,175,55,0.12)'
                                        : 'rgba(255,255,255,0.03)',
                                    border: selectedMood === m.emoji
                                        ? '1px solid rgba(212,175,55,0.3)'
                                        : '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '56px',
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{m.emoji}</span>
                                <span style={{
                                    fontSize: '8px', fontWeight: 500,
                                    letterSpacing: '0.5px',
                                    color: selectedMood === m.emoji ? '#D4A94E' : 'rgba(178,190,205,0.7)',
                                    textTransform: 'uppercase' as const,
                                    fontFamily: 'var(--font-display)',
                                }}>{m.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    disabled={!body.trim() || saved}
                    style={{
                        width: '100%', padding: '16px',
                        borderRadius: '16px',
                        border: 'none', cursor: body.trim() ? 'pointer' : 'default',
                        fontFamily: 'var(--font-display)',
                        fontSize: '12px', fontWeight: 700,
                        letterSpacing: '3px', textTransform: 'uppercase' as const,
                        color: saved ? '#1a1625' : body.trim() ? '#1a1625' : 'rgba(178,190,205,0.6)',
                        background: saved
                            ? 'linear-gradient(135deg, #8BD5CA, #6EE7B7)'
                            : body.trim()
                                ? 'linear-gradient(135deg, #F9E491, #D4A94E, #A67B2E)'
                                : 'rgba(255,255,255,0.05)',
                        boxShadow: body.trim() ? '0 4px 20px rgba(212,175,55,0.25)' : 'none',
                        transition: 'all 0.3s ease',
                    }}
                >
                    {saved ? '✦ Saved' : '✦ Save Entry'}
                </button>
            </div>
        </div>
    );
}

/** Journal history view */
function JournalHistoryView({ onClose }: { onClose: () => void }) {
    const entries = getJournalEntries();

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(180deg, #0e0a1f 0%, #120224 50%, #0e0a1f 100%)',
            overflow: 'auto',
            paddingBottom: '100px',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
            }}>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', color: 'rgba(196,196,220,0.6)',
                    fontSize: '14px', cursor: 'pointer', padding: '4px',
                }}>← Back</button>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '11px', fontWeight: 700,
                    letterSpacing: '5px', textTransform: 'uppercase' as const,
                    color: '#F9E491',
                }}>Past Entries</p>
                <div style={{ width: '48px' }} />
            </div>

            <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>
                {entries.length === 0 ? (
                    <div style={{ textAlign: 'center' as const, padding: '60px 20px' }}>
                        <p style={{ fontSize: '32px', marginBottom: '12px' }}>📖</p>
                        <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '12px', letterSpacing: '2px',
                            color: 'rgba(210,210,230,0.8)',
                            textTransform: 'uppercase' as const,
                        }}>No entries yet</p>
                        <p style={{
                            fontSize: '13px', color: 'rgba(178,190,205,0.75)',
                            fontStyle: 'italic', marginTop: '6px',
                        }}>Your reflections will appear here</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                        {entries.map(entry => {
                            const catMeta = CATEGORY_META[entry.category];
                            const d = new Date(entry.date);
                            return (
                                <div key={entry.id} style={{
                                    padding: '18px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(160deg, rgba(28,21,56,0.85) 0%, rgba(13,11,34,0.9) 100%)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                }}>
                                    {/* Header line */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', marginBottom: '10px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px' }}>{entry.mood}</span>
                                            <span style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '9px', fontWeight: 600,
                                                letterSpacing: '1.5px', textTransform: 'uppercase' as const,
                                                padding: '3px 8px', borderRadius: '12px',
                                                color: catMeta.color,
                                                background: `${catMeta.color}18`,
                                            }}>{catMeta.emoji} {catMeta.label}</span>
                                        </div>
                                        <span style={{
                                            fontSize: '10px', color: 'rgba(148,163,184,0.45)',
                                            fontWeight: 300,
                                        }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    {/* Prompt */}
                                    <p style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: '12px', fontStyle: 'italic',
                                        color: 'rgba(212,175,55,0.8)',
                                        marginBottom: '8px', lineHeight: 1.5,
                                    }}>"{entry.prompt.length > 80 ? entry.prompt.slice(0, 80) + '…' : entry.prompt}"</p>
                                    {/* Body preview */}
                                    <p style={{
                                        fontSize: '13px', color: 'rgba(226,232,240,0.9)',
                                        lineHeight: 1.7, fontWeight: 300,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 4,
                                        WebkitBoxOrient: 'vertical' as const,
                                        overflow: 'hidden',
                                    }}>{entry.body}</p>
                                    {/* Moon phase */}
                                    <p style={{
                                        fontSize: '9px', color: 'rgba(148,163,184,0.35)',
                                        marginTop: '8px', fontStyle: 'italic',
                                    }}>{entry.moonPhase}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main CreateTab ─────────────────────────────────────────────────────────

// ── Sacred Script Sub-Components ───────────────────────────────────────────

/** Collapsible onboarding card explaining the 369 method */
function SacredScriptOnboarding({ onDismiss }: { onDismiss: () => void }) {
    return (
        <div style={{
            borderRadius: '16px',
            padding: '20px',
            background: 'rgba(61,29,90,0.35)',
            border: '1px solid rgba(212,175,55,0.12)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            position: 'relative' as const,
        }}>
            {/* Close/dismiss button */}
            <button
                onClick={onDismiss}
                style={{
                    position: 'absolute', top: '12px', right: '14px',
                    fontSize: '14px', color: 'rgba(178,190,205,0.75)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px', lineHeight: 1,
                }}
            >✕</button>

            <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px', fontWeight: 600,
                letterSpacing: '2px', textTransform: 'uppercase' as const,
                color: '#F9E491', marginBottom: '10px',
            }}>✦ The Sacred Script</p>

            <p style={{
                fontSize: '12px', lineHeight: 1.65, color: 'rgba(226,232,240,0.9)',
                fontWeight: 300, marginBottom: '12px',
            }}>
                A 21-day manifestation practice rooted in Tesla's 3-6-9 numerology. Each day,
                you complete three rituals:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '12px' }}>
                {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(tod => {
                    const cfg = RITUAL_CONFIGS[tod];
                    return (
                        <div key={tod} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 12px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            <span style={{ fontSize: '16px', flexShrink: 0 }}>{cfg.emoji}</span>
                            <div>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '10px', fontWeight: 600,
                                    letterSpacing: '1.5px',
                                    color: 'rgba(226,232,240,0.85)',
                                }}>{cfg.title.toUpperCase()}</p>
                                <p style={{
                                    fontSize: '10px', color: 'rgba(148,163,184,0.6)',
                                    fontWeight: 300, marginTop: '1px',
                                }}>Write {cfg.lineCount}× — {cfg.description.split('.')[0]}.</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p style={{
                fontSize: '10px', color: 'rgba(148,163,184,0.45)',
                fontStyle: 'italic', fontWeight: 300, textAlign: 'center' as const,
            }}>
                Prompts adapt to the current moon phase. Consistency is the key.
            </p>
        </div>
    );
}

/** 21-day progress ring SVG */
function ProgressRing({ progress, size = 72 }: { progress: ScriptProgress; size?: number }) {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const fillLength = (progress.percentage / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke="rgba(197,147,65,0.1)"
                    strokeWidth={strokeWidth}
                />
                {/* Fill */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke="url(#sacredRingGrad)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${fillLength} ${circumference - fillLength}`}
                    style={{
                        transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)',
                        filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.3))',
                    }}
                />
                <defs>
                    <linearGradient id="sacredRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F9E491" />
                        <stop offset="50%" stopColor="#D4A94E" />
                        <stop offset="100%" stopColor="#C59341" />
                    </linearGradient>
                </defs>
            </svg>
            {/* Center text */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '16px', fontWeight: 700,
                    color: '#F9E491',
                    lineHeight: 1,
                }}>{progress.dayNumber}</span>
                <span style={{
                    fontSize: '7px', letterSpacing: '1px',
                    color: 'rgba(178,190,205,0.8)',
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase' as const,
                }}>of {progress.totalDays}</span>
            </div>
        </div>
    );
}

/** Today's Sacred Script — single unified card with progress + 3 ritual sections + daily completion */
function TodayRitualCard({
    script,
    progress,
    moonPhaseName,
    onOpenRitual,
    onAbandon,
}: {
    script: SacredScript;
    progress: ScriptProgress;
    moonPhaseName: string;
    onOpenRitual: (timeOfDay: TimeOfDay) => void;
    onAbandon: () => void;
}) {
    const [showMenu, setShowMenu] = React.useState(false);
    const [showInstructions, setShowInstructions] = React.useState(false);
    const timeOfDay = getTimeOfDay();
    const todayData = getTodayRitual(script.id);

    const RITUAL_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

    return (
        <div style={{
            borderRadius: '22px',
            background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 55%, #0d0b22 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -2px 5px rgba(0,0,0,0.35)',
            padding: '24px 20px',
            position: 'relative' as const,
            overflow: 'hidden',
        }}>
            {/* Gold accent line */}
            <div style={{
                position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px',
                background: 'linear-gradient(90deg, transparent, #C59341, transparent)',
                opacity: 0.5,
            }} />

            {/* ─── Progress Header ─── */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                <ProgressRing progress={progress} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '10px', fontWeight: 500,
                        letterSpacing: '5px', textTransform: 'uppercase' as const,
                        color: '#D4A94E', opacity: 0.8,
                        textShadow: '0 0 10px rgba(212,175,55,0.15)',
                        marginBottom: '6px',
                    }}>Sacred Script</p>
                    <p style={{
                        fontSize: '13px', color: '#e2e8f0',
                        fontWeight: 400, lineHeight: 1.45,
                        fontStyle: 'italic',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                    }}>"{script.affirmation}"</p>
                </div>

                {/* Menu button */}
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                        position: 'absolute', top: '14px', right: '16px',
                        background: 'none', border: 'none',
                        color: 'rgba(148,163,184,0.7)', fontSize: '16px',
                        cursor: 'pointer', padding: '4px',
                    }}
                >⋯</button>
            </div>

            {/* Menu dropdown */}
            {showMenu && (
                <div style={{
                    position: 'absolute', top: '40px', right: '16px', zIndex: 10,
                    borderRadius: '12px', padding: '8px 0',
                    background: 'linear-gradient(160deg, #1c1538, #0d0b22)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    minWidth: '140px',
                }}>
                    <button
                        onClick={() => { onAbandon(); setShowMenu(false); }}
                        style={{
                            width: '100%', padding: '10px 16px',
                            background: 'none', border: 'none',
                            fontSize: '11px', color: '#ef4444',
                            textAlign: 'left' as const, cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                        }}
                    >End this journey</button>
                </div>
            )}

            {/* Moon phase note */}
            <p style={{
                fontSize: '10px', color: 'rgba(196,196,220,0.7)',
                textAlign: 'center' as const, marginBottom: '12px',
                fontStyle: 'italic', fontWeight: 300,
            }}>
                {moonPhaseName} energy guides today{"'"}s prompts
            </p>

            {/* ─── Collapsible 369 Instructions ─── */}
            <button
                onClick={() => setShowInstructions(!showInstructions)}
                style={{
                    width: '100%', padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(212,175,55,0.06)',
                    border: '1px solid rgba(212,175,55,0.12)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: showInstructions ? '0' : '16px',
                }}
            >
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '9px', fontWeight: 600,
                    letterSpacing: '1.5px', textTransform: 'uppercase' as const,
                    color: '#F9E491',
                }}>✦ How the 369 method works</span>
                <span style={{
                    fontSize: '10px', color: 'rgba(178,190,205,0.8)',
                    transform: showInstructions ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                }}>▼</span>
            </button>

            {showInstructions && (
                <div style={{
                    padding: '16px 14px 14px',
                    borderRadius: '0 0 10px 10px',
                    background: 'rgba(212,175,55,0.04)',
                    border: '1px solid rgba(212,175,55,0.08)',
                    borderTop: 'none',
                    marginBottom: '16px',
                }}>
                    <p style={{
                        fontSize: '13px', lineHeight: 1.7, color: 'rgba(226,232,240,0.85)',
                        fontWeight: 400, marginBottom: '14px',
                    }}>
                        A 21-day practice rooted in Tesla's 3-6-9 numerology. Each day, complete three rituals:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '12px' }}>
                        {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(tod => {
                            const cfg = RITUAL_CONFIGS[tod];
                            return (
                                <div key={tod} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 12px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{cfg.emoji}</span>
                                    <div>
                                        <p style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '12px', fontWeight: 600,
                                            letterSpacing: '1.5px',
                                            color: '#F9E491',
                                            marginBottom: '2px',
                                        }}>{cfg.title.toUpperCase()}</p>
                                        <p style={{
                                            fontSize: '12px', color: 'rgba(196,196,220,0.75)',
                                            fontWeight: 400, lineHeight: 1.5,
                                        }}>Write {cfg.lineCount}× — {cfg.description.split('.')[0]}.</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p style={{
                        fontSize: '11px', color: 'rgba(148,163,184,0.55)',
                        fontStyle: 'italic', fontWeight: 300, textAlign: 'center' as const,
                    }}>
                        Prompts adapt to the current moon phase. Consistency is the key.
                    </p>
                </div>
            )}

            {/* ─── Divider ─── */}
            <div style={{
                height: '1px', marginBottom: '16px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
            }} />

            {/* ─── 3 Ritual Sections (internal rows) ─── */}
            {RITUAL_ORDER.map((tod, idx) => {
                const cfg = RITUAL_CONFIGS[tod];
                const isDone = progress.ritualsToday[tod];
                const isCurrent = tod === timeOfDay;
                const completedEntry = todayData?.entry?.[tod];
                const moonPrompt = getMoonPrompt(moonPhaseName, tod);

                return (
                    <div key={tod}>
                        {/* Ritual row */}
                        <div style={{ marginBottom: isDone && completedEntry ? '8px' : '0' }}>
                            {/* Header row */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                marginBottom: isDone ? '0' : '10px',
                            }}>
                                <span style={{
                                    fontSize: '24px',
                                    filter: isDone ? 'none' : 'grayscale(0.3)',
                                    opacity: isDone ? 1 : isCurrent ? 0.9 : 0.5,
                                    transition: 'all 0.3s ease',
                                }}>{cfg.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '13px', fontWeight: 600,
                                        letterSpacing: '2px', textTransform: 'uppercase' as const,
                                        color: isDone ? '#D4A94E' : isCurrent ? 'rgba(226,232,240,0.95)' : 'rgba(226,232,240,0.65)',
                                        marginBottom: '3px',
                                    }}>{cfg.title}</p>
                                    <p style={{
                                        fontSize: '12px',
                                        color: isDone ? 'rgba(212,175,55,0.75)' : 'rgba(196,196,220,0.7)',
                                        fontWeight: 400, fontStyle: 'italic',
                                        lineHeight: 1.4,
                                    }}>
                                        {isDone
                                            ? `✓ ${cfg.lineCount} lines completed`
                                            : `${cfg.lineCount} lines · ${moonPrompt.length > 45 ? moonPrompt.slice(0, 45) + '…' : moonPrompt}`}
                                    </p>
                                </div>

                                {/* Status pill / Write button */}
                                {isDone ? (
                                    <div style={{
                                        padding: '5px 12px',
                                        borderRadius: '20px',
                                        fontSize: '10px', fontWeight: 600,
                                        fontFamily: 'var(--font-display)',
                                        letterSpacing: '1.5px',
                                        textTransform: 'uppercase' as const,
                                        background: 'rgba(197,147,65,0.12)',
                                        color: '#D4A94E',
                                        border: '1px solid rgba(197,147,65,0.2)',
                                        whiteSpace: 'nowrap' as const,
                                    }}>✦ Done</div>
                                ) : (
                                    <button
                                        onClick={() => onOpenRitual(tod)}
                                        style={{
                                            padding: '9px 20px',
                                            borderRadius: '22px',
                                            fontSize: '11px', fontWeight: 700,
                                            fontFamily: 'var(--font-display)',
                                            letterSpacing: '2px',
                                            textTransform: 'uppercase' as const,
                                            background: 'linear-gradient(180deg, #F9E491, #D4A94E 40%, #C59341)',
                                            color: '#1a0f2e',
                                            border: '1.5px solid rgba(249,228,145,0.6)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            whiteSpace: 'nowrap' as const,
                                            boxShadow: '0 2px 0 #8a6b25, 0 4px 14px rgba(0,0,0,0.45), 0 0 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                                            position: 'relative' as const,
                                            overflow: 'hidden' as const,
                                            minWidth: '80px',
                                            textAlign: 'center' as const,
                                        }}
                                    >
                                        {/* Shimmer sweep */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            width: '200%',
                                            background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                                            animation: 'shimmer-sweep 3.5s ease-in-out infinite',
                                            pointerEvents: 'none',
                                        }} />
                                        <span style={{ position: 'relative', zIndex: 1 }}>
                                            {isCurrent ? 'Write' : `Step ${idx + 1}`}
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* Completed: show entry preview */}
                            {isDone && completedEntry && (
                                <div style={{
                                    padding: '8px 12px',
                                    marginLeft: '32px',
                                    borderRadius: '10px',
                                    background: 'rgba(197,147,65,0.03)',
                                    border: '1px solid rgba(197,147,65,0.06)',
                                    marginTop: '6px',
                                }}>
                                    {completedEntry.lines.slice(0, 2).map((line, i) => (
                                        <p key={i} style={{
                                            fontSize: '11px', color: 'rgba(226,232,240,0.7)',
                                            fontWeight: 300, lineHeight: 1.5,
                                            fontStyle: 'italic',
                                            padding: '2px 0',
                                        }}>
                                            <span style={{ color: 'rgba(212,175,55,0.8)', fontSize: '9px', marginRight: '6px' }}>{i + 1}</span>
                                            {line}
                                        </p>
                                    ))}
                                    {completedEntry.lines.length > 2 && (
                                        <p style={{
                                            fontSize: '9px', color: 'rgba(210,210,230,0.8)',
                                            fontStyle: 'italic', marginTop: '2px',
                                        }}>+{completedEntry.lines.length - 2} more</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Divider between sections (not after last) */}
                        {idx < RITUAL_ORDER.length - 1 && (
                            <div style={{
                                height: '1px',
                                margin: '14px 0',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                            }} />
                        )}
                    </div>
                );
            })}

            {/* ─── Daily Completion Celebration ─── */}
            {progress.todayComplete && (
                <>
                    <div style={{
                        height: '1px', margin: '18px 0 16px',
                        background: 'linear-gradient(90deg, transparent, rgba(197,147,65,0.2), transparent)',
                    }} />
                    <div style={{
                        textAlign: 'center' as const,
                        padding: '16px 0 4px',
                        position: 'relative' as const,
                    }}>
                        {/* Ambient glow */}
                        <div style={{
                            position: 'absolute', inset: '-20px',
                            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.05) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        <div style={{
                            fontSize: '24px', marginBottom: '8px',
                            filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.4))',
                            position: 'relative',
                        }}>✨</div>

                        <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px', fontWeight: 700,
                            color: '#F9E491',
                            letterSpacing: '3px',
                            textShadow: '0 0 20px rgba(212,175,55,0.2)',
                            marginBottom: '4px',
                            position: 'relative',
                        }}>DAY {progress.dayNumber} COMPLETE</p>

                        <p style={{
                            fontSize: '11px', color: 'rgba(226,232,240,0.9)',
                            fontWeight: 300, fontStyle: 'italic',
                            lineHeight: 1.5,
                            position: 'relative',
                        }}>
                            {progress.dayNumber < progress.totalDays
                                ? `Return tomorrow for Day ${progress.dayNumber + 1}.`
                                : 'Your 21-day Sacred Script is complete.'}
                        </p>

                        {/* Mini progress bar */}
                        <div style={{
                            marginTop: '12px',
                            height: '3px', borderRadius: '2px',
                            background: 'rgba(197,147,65,0.1)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}>
                            <div style={{
                                width: `${progress.percentage}%`,
                                height: '100%',
                                borderRadius: '2px',
                                background: 'linear-gradient(90deg, #C59341, #F9E491)',
                                transition: 'width 1s ease',
                                boxShadow: '0 0 8px rgba(212,175,55,0.4)',
                            }} />
                        </div>
                        <p style={{
                            fontSize: '9px', color: 'rgba(196,196,220,0.55)',
                            marginTop: '5px', position: 'relative',
                        }}>
                            {progress.totalRitualsCompleted} of {progress.totalRitualsPossible} rituals completed
                        </p>

                        {/* Button to save & start a new intention */}
                        <button
                            onClick={onAbandon}
                            style={{
                                marginTop: '18px',
                                padding: '10px 24px',
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
                                border: '1px solid rgba(212,175,55,0.25)',
                                color: '#F9E491',
                                fontFamily: 'var(--font-display)',
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '2px',
                                textTransform: 'uppercase' as const,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative' as const,
                            }}
                        >
                            ✦ Start new intention
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

/** Ritual writing surface modal */
function RitualWritingSurface({
    script,
    timeOfDay,
    moonPhaseName,
    onClose,
    onSave,
}: {
    script: SacredScript;
    timeOfDay: TimeOfDay;
    moonPhaseName: string;
    onClose: () => void;
    onSave: () => void;
}) {
    const cfg = RITUAL_CONFIGS[timeOfDay];
    const moonPrompt = getMoonPrompt(moonPhaseName, timeOfDay);
    const [lines, setLines] = React.useState<string[]>(Array(cfg.lineCount).fill(''));

    const updateLine = (idx: number, value: string) => {
        const copy = [...lines];
        copy[idx] = value;
        setLines(copy);
    };

    const filledCount = lines.filter(l => l.trim().length > 0).length;
    const canSave = filledCount >= Math.ceil(cfg.lineCount / 2); // At least half filled

    const handleSave = () => {
        saveRitualEntry(script.id, timeOfDay, lines);
        onSave();
    };

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
                    width: '100%', maxWidth: '420px',
                    maxHeight: '85vh', overflowY: 'auto' as const,
                    borderRadius: '22px',
                    padding: '28px 20px 20px',
                    background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 55%, #0d0b22 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -2px 5px rgba(0,0,0,0.35), 0 0 60px rgba(212,175,55,0.06)',
                    animation: 'fade-up 0.3s ease-out both',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px', filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.3))' }}>
                        {cfg.emoji}
                    </div>
                    <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '16px', fontWeight: 700,
                        color: '#F9E491',
                        letterSpacing: '3px',
                        textShadow: '0 0 20px rgba(212,175,55,0.2)',
                        marginBottom: '4px',
                    }}>{cfg.title.toUpperCase()}</h3>
                    <p style={{
                        fontSize: '11px', color: 'rgba(148,163,184,0.6)',
                        fontWeight: 300, fontStyle: 'italic',
                        lineHeight: 1.5,
                    }}>{moonPrompt}</p>
                </div>

                {/* Affirmation reminder */}
                <div style={{
                    padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(197,147,65,0.06)',
                    border: '1px solid rgba(197,147,65,0.10)',
                    marginBottom: '16px',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '8px', letterSpacing: '2px',
                        textTransform: 'uppercase' as const,
                        color: 'rgba(197,147,65,0.5)',
                        marginBottom: '4px',
                    }}>Your affirmation</p>
                    <p style={{
                        fontSize: '12px', color: 'rgba(226,232,240,0.8)',
                        fontStyle: 'italic', fontWeight: 300, lineHeight: 1.45,
                    }}>"{script.affirmation}"</p>
                </div>

                {/* Writing lines */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '16px' }}>
                    {lines.map((line, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '10px', color: 'rgba(197,147,65,0.35)',
                                width: '18px', textAlign: 'right' as const,
                                flexShrink: 0,
                            }}>{i + 1}</span>
                            {timeOfDay === 'morning' ? (
                                /* Morning: individual text inputs for each affirmation repetition */
                                <input
                                    autoFocus={i === 0}
                                    value={line}
                                    onChange={e => updateLine(i, e.target.value)}
                                    placeholder={i === 0 ? cfg.placeholder : 'Repeat your affirmation...'}
                                    style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        color: '#e2e8f0',
                                        fontFamily: 'var(--font-body)',
                                        fontWeight: 300,
                                        lineHeight: 1.5,
                                        background: 'rgba(255,255,255,0.04)',
                                        border: line.trim() ? '1px solid rgba(197,147,65,0.25)' : '1px solid rgba(255,255,255,0.08)',
                                        outline: 'none',
                                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
                                        transition: 'border-color 0.2s ease',
                                    }}
                                />
                            ) : (
                                /* Afternoon/Evening: individual text inputs */
                                <input
                                    autoFocus={i === 0}
                                    value={line}
                                    onChange={e => updateLine(i, e.target.value)}
                                    placeholder={timeOfDay === 'afternoon'
                                        ? `Sentence ${i + 1} of your future reality...`
                                        : `Gratitude ${i + 1}...`}
                                    style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        color: '#e2e8f0',
                                        fontFamily: 'var(--font-body)',
                                        fontWeight: 300,
                                        lineHeight: 1.5,
                                        background: 'rgba(255,255,255,0.04)',
                                        border: line.trim() ? '1px solid rgba(197,147,65,0.25)' : '1px solid rgba(255,255,255,0.08)',
                                        outline: 'none',
                                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
                                        transition: 'border-color 0.2s ease',
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Progress indicator */}
                <p style={{
                    fontSize: '10px', color: 'rgba(178,190,205,0.75)',
                    textAlign: 'center' as const, marginBottom: '16px',
                }}>
                    {filledCount} of {cfg.lineCount} lines filled
                </p>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '14px',
                            borderRadius: '16px',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px', letterSpacing: '1.5px',
                            textTransform: 'uppercase' as const,
                            textAlign: 'center' as const,
                            background: 'rgba(255,255,255,0.03)',
                            color: '#9ca3af',
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                        }}
                    >Later</button>
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        style={{
                            flex: 1, padding: '14px',
                            borderRadius: '16px',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px', fontWeight: 600,
                            letterSpacing: '1.5px', textTransform: 'uppercase' as const,
                            textAlign: 'center' as const,
                            background: 'rgba(197,147,65,0.12)',
                            color: '#D4A94E',
                            border: '1px solid rgba(197,147,65,0.25)',
                            cursor: canSave ? 'pointer' : 'default',
                            opacity: canSave ? 1 : 0.3,
                            transition: 'opacity 0.2s ease',
                        }}
                    >Seal {cfg.emoji}</button>
                </div>
            </div>
        </div>
    );
}

/** Start flow — when no active Sacred Script exists */
function StartSacredScript({
    manifestations,
    moonPhaseName,
    onStart,
}: {
    manifestations: { id: string; declaration: string }[];
    moonPhaseName: string;
    onStart: () => void;
}) {
    const [show369, setShow369] = React.useState(false);
    const [affirmation, setAffirmation] = React.useState(manifestations[0]?.declaration ?? '');
    const [openRitual, setOpenRitual] = React.useState<TimeOfDay | null>(null);
    const [morningLines, setMorningLines] = React.useState<string[]>(Array(3).fill(''));
    const [afternoonLines, setAfternoonLines] = React.useState<string[]>(Array(6).fill(''));
    const [eveningLines, setEveningLines] = React.useState<string[]>(Array(9).fill(''));

    const linesMap: Record<TimeOfDay, { lines: string[]; setLines: (v: string[]) => void }> = {
        morning: { lines: morningLines, setLines: setMorningLines },
        afternoon: { lines: afternoonLines, setLines: setAfternoonLines },
        evening: { lines: eveningLines, setLines: setEveningLines },
    };

    const updateLine = (tod: TimeOfDay, idx: number, value: string) => {
        const { lines, setLines } = linesMap[tod];
        const copy = [...lines];
        copy[idx] = value;
        setLines(copy);
    };

    // Total filled across ALL rituals for the save button
    const totalFilled = morningLines.filter(l => l.trim()).length
        + afternoonLines.filter(l => l.trim()).length
        + eveningLines.filter(l => l.trim()).length;
    const canSave = affirmation.trim().length >= 3 && totalFilled >= 2;

    const handleSave = () => {
        if (!canSave) return;
        // Auto-create a manifestation if one doesn't already exist for this affirmation
        let linkedManifestId = manifestations.find(
            m => m.declaration.toLowerCase() === affirmation.trim().toLowerCase()
        )?.id;
        if (!linkedManifestId) {
            const newManifest = createManifestation(affirmation.trim(), 'intention');
            linkedManifestId = newManifest.id;
        }
        const script = createSacredScript(affirmation.trim(), moonPhaseName, linkedManifestId);
        // Save whichever rituals have content
        for (const tod of ['morning', 'afternoon', 'evening'] as TimeOfDay[]) {
            const { lines } = linesMap[tod];
            if (lines.some(l => l.trim().length > 0)) {
                saveRitualEntry(script.id, tod, lines);
            }
        }
        // Today's rituals are already filled from the creation form,
        // so pause this script (day is done) — the form resets for a new intention.
        // The completed script lives in ✦ Your Intentions and auto-resumes tomorrow.
        pauseScript(script.id);
        onStart();
    };

    const toggleRitual = (tod: TimeOfDay) => {
        setOpenRitual(openRitual === tod ? null : tod);
    };

    return (
        <div style={{
            borderRadius: '22px',
            background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 55%, #0d0b22 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -2px 5px rgba(0,0,0,0.35)',
            padding: '24px 20px',
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center' as const, marginBottom: '16px' }}>
                <div style={{
                    fontSize: '32px', marginBottom: '10px',
                    filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.3))',
                }}>📜</div>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '14px', fontWeight: 700,
                    color: '#F9E491', letterSpacing: '3px',
                    marginBottom: '6px',
                }}>SACRED SCRIPT</p>
                <p style={{
                    fontSize: '10px', color: 'rgba(148,163,184,0.6)',
                    fontWeight: 300, lineHeight: 1.5,
                }}>A 21-day manifestation practice rooted in Tesla's 3-6-9 numerology.</p>
            </div>

            {/* ─── Collapsible 369 Instructions ─── */}
            <button
                onClick={() => setShow369(!show369)}
                style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: show369 ? '10px 10px 0 0' : '10px',
                    background: 'rgba(212,175,55,0.06)',
                    border: '1px solid rgba(212,175,55,0.12)',
                    borderBottom: show369 ? 'none' : '1px solid rgba(212,175,55,0.12)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: show369 ? '0' : '16px',
                    transition: 'all 0.2s ease',
                }}
            >
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '9px', fontWeight: 600,
                    letterSpacing: '1.5px', textTransform: 'uppercase' as const,
                    color: '#F9E491',
                }}>✦ How the 369 method works</span>
                <span style={{
                    fontSize: '10px', color: 'rgba(178,190,205,0.8)',
                    transform: show369 ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                }}>▼</span>
            </button>
            {show369 && (
                <div style={{
                    padding: '14px',
                    borderRadius: '0 0 10px 10px',
                    background: 'rgba(212,175,55,0.04)',
                    border: '1px solid rgba(212,175,55,0.08)',
                    borderTop: 'none',
                    marginBottom: '16px',
                }}>
                    <p style={{
                        fontSize: '11px', lineHeight: 1.65, color: 'rgba(226,232,240,0.9)',
                        fontWeight: 300, marginBottom: '10px',
                    }}>
                        Each day for 21 days, complete three writing rituals:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                        {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(tod => {
                            const cfg = RITUAL_CONFIGS[tod];
                            return (
                                <div key={tod} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 10px',
                                }}>
                                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{cfg.emoji}</span>
                                    <p style={{ fontSize: '10px', color: 'rgba(226,232,240,0.7)', fontWeight: 300 }}>
                                        <strong style={{ color: 'rgba(226,232,240,0.85)', fontWeight: 600 }}>{cfg.lineCount}×</strong> — {cfg.description.split('.')[0]}.
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── Affirmation Input ─── */}
            <div style={{ marginBottom: '16px' }}>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '8px', fontWeight: 600,
                    letterSpacing: '2px', textTransform: 'uppercase' as const,
                    color: 'rgba(197,147,65,0.6)', marginBottom: '6px',
                }}>Your affirmation</p>
                <input
                    value={affirmation}
                    onChange={e => setAffirmation(e.target.value.slice(0, 200))}
                    placeholder="I am worthy of abundant love and prosperity..."
                    style={{
                        width: '100%', borderRadius: '14px',
                        padding: '12px 14px', fontSize: '13px',
                        color: '#e2e8f0', fontFamily: 'var(--font-body)',
                        fontWeight: 300, lineHeight: 1.5,
                        background: 'rgba(255,255,255,0.04)',
                        border: affirmation.trim() ? '1px solid rgba(197,147,65,0.25)' : '1px solid rgba(255,255,255,0.08)',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
                        transition: 'border-color 0.2s ease',
                    }}
                />
            </div>

            {/* ─── Collapsible Ritual Sections ─── */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '16px' }}>
                {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(tod => {
                    const cfg = RITUAL_CONFIGS[tod];
                    const isOpen = openRitual === tod;
                    const { lines } = linesMap[tod];
                    const filled = lines.filter(l => l.trim().length > 0).length;
                    const moonPrompt = getMoonPrompt(moonPhaseName, tod);

                    return (
                        <div key={tod} style={{
                            borderRadius: '14px',
                            border: isOpen ? '1px solid rgba(197,147,65,0.2)' : '1px solid rgba(255,255,255,0.06)',
                            background: isOpen ? 'rgba(197,147,65,0.04)' : 'rgba(255,255,255,0.02)',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                        }}>
                            {/* Collapsible header */}
                            <button
                                onClick={() => toggleRitual(tod)}
                                style={{
                                    width: '100%', padding: '14px 16px',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                }}
                            >
                                <span style={{ fontSize: '20px', flexShrink: 0 }}>{cfg.emoji}</span>
                                <div style={{ flex: 1, textAlign: 'left' as const }}>
                                    <p style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '11px', fontWeight: 700,
                                        letterSpacing: '2px',
                                        color: isOpen ? '#F9E491' : 'rgba(226,232,240,0.75)',
                                    }}>{cfg.title.toUpperCase()}</p>
                                    <p style={{
                                        fontSize: '9px', color: 'rgba(178,190,205,0.8)',
                                        fontWeight: 300, marginTop: '2px',
                                    }}>{cfg.lineCount} lines · {cfg.description.split('.')[0]}</p>
                                </div>
                                {filled > 0 && (
                                    <span style={{
                                        fontSize: '9px', fontFamily: 'var(--font-display)',
                                        color: filled === cfg.lineCount ? '#22c55e' : 'rgba(212,175,55,0.6)',
                                        fontWeight: 600, flexShrink: 0,
                                    }}>{filled}/{cfg.lineCount}</span>
                                )}
                                <span style={{
                                    fontSize: '10px', color: 'rgba(178,190,205,0.75)',
                                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                    flexShrink: 0,
                                }}>▼</span>
                            </button>

                            {/* Expanded content: text inputs */}
                            {isOpen && (
                                <div style={{ padding: '0 16px 16px' }}>
                                    <p style={{
                                        fontSize: '10px', color: 'rgba(148,163,184,0.55)',
                                        fontStyle: 'italic', fontWeight: 300,
                                        marginBottom: '10px', lineHeight: 1.4,
                                    }}>{moonPrompt}</p>

                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                                        {lines.map((line, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: '10px', color: 'rgba(197,147,65,0.35)',
                                                    width: '18px', textAlign: 'right' as const,
                                                    flexShrink: 0,
                                                }}>{i + 1}</span>
                                                <input
                                                    autoFocus={i === 0}
                                                    value={line}
                                                    onChange={e => updateLine(tod, i, e.target.value)}
                                                    placeholder={
                                                        tod === 'morning'
                                                            ? (i === 0 ? 'Write your affirmation...' : 'Repeat your affirmation...')
                                                            : tod === 'afternoon'
                                                                ? `Sentence ${i + 1} of your future reality...`
                                                                : `Gratitude ${i + 1}...`
                                                    }
                                                    style={{
                                                        width: '100%',
                                                        borderRadius: '12px',
                                                        padding: '10px 14px',
                                                        fontSize: '13px',
                                                        color: '#e2e8f0',
                                                        fontFamily: 'var(--font-body)',
                                                        fontWeight: 300,
                                                        lineHeight: 1.5,
                                                        background: 'rgba(255,255,255,0.04)',
                                                        border: line.trim() ? '1px solid rgba(197,147,65,0.25)' : '1px solid rgba(255,255,255,0.08)',
                                                        outline: 'none',
                                                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
                                                        transition: 'border-color 0.2s ease',
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Save / Begin button */}
            <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                    width: '100%', padding: '16px',
                    borderRadius: '18px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px', fontWeight: 600,
                    letterSpacing: '2px', textTransform: 'uppercase' as const,
                    background: canSave ? 'rgba(197,147,65,0.15)' : 'rgba(197,147,65,0.06)',
                    color: '#D4A94E',
                    border: '1.5px solid rgba(197,147,65,0.3)',
                    cursor: canSave ? 'pointer' : 'default',
                    opacity: canSave ? 1 : 0.3,
                    transition: 'all 0.2s ease',
                    boxShadow: canSave ? '0 2px 12px rgba(212,175,55,0.15)' : '0 2px 8px rgba(0,0,0,0.3)',
                }}
            >📜 Seal & Begin 21-Day Journey ✦</button>
        </div>
    );
}

/** Completed Sacred Texts section */
function PastSacredTexts({ scripts }: { scripts: SacredScript[] }) {
    const [expandedId, setExpandedId] = React.useState<string | null>(null);
    if (scripts.length === 0) return null;

    return (
        <div style={{ marginTop: '20px' }}>
            <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '9px', letterSpacing: '5px',
                textTransform: 'uppercase' as const,
                color: '#D4A94E', opacity: 0.5,
                textShadow: '0 0 10px rgba(212,175,55,0.08)',
                marginBottom: '10px',
            }}>📖 Sacred Texts</p>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                {scripts.map(s => (
                    <div key={s.id}>
                        <button
                            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                            style={{
                                width: '100%', textAlign: 'left' as const,
                                padding: '14px 16px',
                                borderRadius: expandedId === s.id ? '16px 16px 0 0' : '16px',
                                background: 'rgba(61,29,90,0.35)',
                                border: '1px solid rgba(212,175,55,0.10)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '12px',
                            }}
                        >
                            <span style={{ fontSize: '20px', flexShrink: 0 }}>📜</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontSize: '12px', color: 'rgba(226,232,240,0.7)',
                                    fontStyle: 'italic', fontWeight: 300,
                                    whiteSpace: 'nowrap' as const,
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>"{s.affirmation}"</p>
                                <p style={{
                                    fontSize: '10px', color: 'rgba(178,190,205,0.75)',
                                    marginTop: '2px',
                                }}>
                                    {s.entries.length} days · {s.status === 'completed' ? '✨ Completed' : 'Ended early'}
                                </p>
                            </div>
                            <span style={{
                                color: 'rgba(197,147,65,0.4)', fontSize: '14px',
                                transform: expandedId === s.id ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.2s ease',
                            }}>›</span>
                        </button>

                        {/* Expanded history */}
                        {expandedId === s.id && (
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '0 0 16px 16px',
                                background: 'rgba(61,29,90,0.25)',
                                borderLeft: '1px solid rgba(212,175,55,0.10)',
                                borderRight: '1px solid rgba(212,175,55,0.10)',
                                borderBottom: '1px solid rgba(212,175,55,0.10)',
                                maxHeight: '200px', overflowY: 'auto' as const,
                            }}>
                                {s.entries.slice(0, 5).map((entry, i) => (
                                    <div key={i} style={{
                                        padding: '8px 0',
                                        borderBottom: i < Math.min(s.entries.length, 5) - 1
                                            ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    }}>
                                        <p style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '9px', color: 'rgba(197,147,65,0.5)',
                                            letterSpacing: '1px', marginBottom: '4px',
                                        }}>DAY {entry.dayNumber}</p>
                                        {entry.morning && (
                                            <p style={{ fontSize: '10px', color: 'rgba(226,232,240,0.8)', fontWeight: 300 }}>
                                                ☀️ {entry.morning.lines[0]?.slice(0, 50)}{(entry.morning.lines[0]?.length ?? 0) > 50 ? '…' : ''}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {s.entries.length > 5 && (
                                    <p style={{
                                        fontSize: '9px', color: 'rgba(148,163,184,0.35)',
                                        fontStyle: 'italic', textAlign: 'center' as const,
                                        padding: '6px 0',
                                    }}>+{s.entries.length - 5} more days</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main CreateTab ─────────────────────────────────────────────────────────

export function CreateTab({ onClose, onTabChange, subscription, onShowPremium }: CreateTabProps) {
    const [manifestations, setManifestations] = React.useState<ManifestationEntry[]>([]);

    const [tick, setTick] = React.useState(0); // force refresh

    // Sacred Script state
    const [activeScript, setActiveScript] = React.useState<SacredScript | null>(null);
    const [scriptProgress, setScriptProgress] = React.useState<ScriptProgress | null>(null);
    const [completedScripts, setCompletedScripts] = React.useState<SacredScript[]>([]);
    const [pausedScriptsList, setPausedScriptsList] = React.useState<SacredScript[]>([]);
    const [showOnboarding, setShowOnboarding] = React.useState(false);
    const [ritualModal, setRitualModal] = React.useState<{ open: boolean; timeOfDay: TimeOfDay }>({ open: false, timeOfDay: 'morning' });
    const [stackExpanded, setStackExpanded] = React.useState(false);
    const [showVisionBoard, setShowVisionBoard] = React.useState(false);
    const [showIntentions, setShowIntentions] = React.useState(false);
    const [visionItems, setVisionItems] = React.useState<VisionBoardItem[]>(() => getVisionBoardItems());

    const lunarData = React.useMemo(() => getLunarData(), []);

    // Journal state
    const [showJournalPage, setShowJournalPage] = React.useState(false);
    const [showJournalHistory, setShowJournalHistory] = React.useState(false);
    const [journalEntryCount, setJournalEntryCount] = React.useState(() => getJournalEntries().length);
    const todayJournal = React.useMemo(() => getTodayJournalPrompt(lunarData.currentPhase.name), [lunarData]);


    const refresh = () => {
        setManifestations(getAllManifestations());
        // Refresh Sacred Script data
        const script = getActiveScript();
        setActiveScript(script);
        if (script) {
            setScriptProgress(getScriptProgress(script.id));
        } else {
            setScriptProgress(null);
        }
        setCompletedScripts(getCompletedScripts());
        setPausedScriptsList(getPausedScripts());
        setShowOnboarding(!hasSeenOnboarding());
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

                    <PageHeader title="MANIFEST" onClose={onClose} titleSize="lg" />

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
                                Manifestation
                            </h2>
                            <p style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '0.5px', fontWeight: 300 }}>
                                Your daily manifestation practice.
                            </p>
                        </div>

                        {/* Single scroll manifestation content */}
                        <div className="animate-fade-up space-y-4" style={{ animationDelay: '0.1s', opacity: 0 }}>


                            {/* ─── Sacred Script 369 Section ─── */}
                            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px', marginBottom: '24px' }}>

                                {/* Today's Ritual Card OR Start flow */}
                                {activeScript && scriptProgress ? (
                                    <TodayRitualCard
                                        script={activeScript}
                                        progress={scriptProgress}
                                        moonPhaseName={lunarData.currentPhase.name}
                                        onOpenRitual={(tod) => setRitualModal({ open: true, timeOfDay: tod })}
                                        onAbandon={() => {
                                            pauseScript(activeScript.id);
                                            refresh();
                                        }}
                                    />
                                ) : (
                                    <StartSacredScript
                                        manifestations={active.map(m => ({ id: m.id, declaration: m.declaration }))}
                                        moonPhaseName={lunarData.currentPhase.name}
                                        onStart={refresh}
                                    />
                                )}

                                {/* Completed Sacred Texts */}
                                <PastSacredTexts scripts={completedScripts} />
                            </div>

                            {/* ─── Intentions Preview Card (Vision Board pattern) ─── */}
                            {(active.length > 0 || pausedScriptsList.length > 0) && (
                                <div
                                    onClick={() => setShowIntentions(true)}
                                    style={{
                                        marginTop: '24px',
                                        padding: '18px',
                                        borderRadius: '18px',
                                        background: 'linear-gradient(145deg, rgba(28,21,56,0.9) 0%, rgba(13,11,34,0.95) 100%)',
                                        border: '1px solid rgba(212,175,55,0.15)',
                                        backdropFilter: 'blur(12px)',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.04)',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                    }}
                                >
                                    <p style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '10px',
                                        letterSpacing: '5px',
                                        textTransform: 'uppercase' as const,
                                        color: '#D4A94E',
                                        opacity: 0.7,
                                        textShadow: '0 0 10px rgba(212,175,55,0.12)',
                                        marginBottom: '14px',
                                    }}>✦ Your Intentions</p>

                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '12px' }}>
                                        {active.slice(0, 3).map(m => (
                                            <p key={m.id} style={{
                                                fontSize: '12px', color: 'rgba(226,232,240,0.65)',
                                                fontStyle: 'italic', fontWeight: 300,
                                                whiteSpace: 'nowrap' as const,
                                                overflow: 'hidden', textOverflow: 'ellipsis',
                                                paddingLeft: '8px',
                                                borderLeft: '2px solid rgba(212,175,55,0.25)',
                                            }}>"{m.declaration}"</p>
                                        ))}
                                        {active.length > 3 && (
                                            <p style={{ fontSize: '10px', color: 'rgba(196,196,220,0.35)', paddingLeft: '8px' }}>
                                                +{active.length - 3} more
                                            </p>
                                        )}
                                    </div>

                                    <p style={{
                                        fontSize: '10px', color: 'rgba(196,196,220,0.45)',
                                        fontStyle: 'italic', textAlign: 'center' as const,
                                    }}>
                                        {active.length} active{pausedScriptsList.length > 0 ? ` · ${pausedScriptsList.length} paused` : ''} · Tap to explore →
                                    </p>
                                </div>
                            )}
                            <div
                                onClick={() => setShowVisionBoard(true)}
                                style={{
                                    marginTop: '24px',
                                    padding: '18px',
                                    borderRadius: '18px',
                                    background: 'linear-gradient(145deg, rgba(28,21,56,0.9) 0%, rgba(13,11,34,0.95) 100%)',
                                    border: '1px solid rgba(212,175,55,0.15)',
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.04)',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '10px',
                                    letterSpacing: '5px',
                                    textTransform: 'uppercase' as const,
                                    color: '#D4A94E',
                                    opacity: 0.7,
                                    textShadow: '0 0 10px rgba(212,175,55,0.12)',
                                    marginBottom: '14px',
                                }}>
                                    ✧ Your Vision Board
                                </p>

                                {visionItems.length === 0 ? (
                                    /* Empty state */
                                    <div style={{ textAlign: 'center' as const, padding: '12px 0' }}>
                                        <div style={{
                                            width: '50px', height: '50px', borderRadius: '50%',
                                            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
                                            border: '1.5px solid rgba(212,175,55,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '20px', margin: '0 auto 10px',
                                        }}>✧</div>
                                        <p style={{
                                            fontSize: '12px', color: 'rgba(226,232,240,0.7)',
                                            marginBottom: '4px',
                                        }}>Start visualizing your future</p>
                                        <p style={{
                                            fontSize: '10px', color: 'rgba(210,210,230,0.75)',
                                            fontStyle: 'italic',
                                        }}>Tap to create your vision board →</p>
                                    </div>
                                ) : (
                                    /* Thumbnail mosaic */
                                    <>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gap: '6px',
                                            marginBottom: '12px',
                                        }}>
                                            {visionItems.slice(0, 6).map(item => (
                                                <div key={item.id} style={{
                                                    aspectRatio: '1',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    /* Illuminated border — bright gold at top-right corner */
                                                    background: item.type === 'image'
                                                        ? 'transparent'
                                                        : 'conic-gradient(from 225deg at 100% 0%, rgba(212,175,55,0.40) 0deg, rgba(212,175,55,0.15) 45deg, rgba(255,255,255,0.06) 120deg, rgba(255,255,255,0.03) 200deg, rgba(255,255,255,0.06) 300deg, rgba(212,175,55,0.25) 360deg)',
                                                    padding: item.type === 'image' ? '0' : '1px',
                                                }}>
                                                    {item.type === 'image' ? (
                                                        <img src={item.content} alt="" style={{
                                                            width: '100%', height: '100%',
                                                            objectFit: 'cover' as const,
                                                            borderRadius: '12px',
                                                        }} />
                                                    ) : (
                                                        <div style={{
                                                            width: '100%', height: '100%',
                                                            borderRadius: '11px',
                                                            /* Corner glow from vertex */
                                                            background: `
                                                                radial-gradient(circle at 100% 0%, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.04) 30%, transparent 55%),
                                                                linear-gradient(145deg, #1a1625 0%, #0a0a0c 100%)
                                                            `,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            padding: '6px',
                                                        }}>
                                                            <p style={{
                                                                fontFamily: "'Playfair Display', serif",
                                                                fontSize: '9px', color: '#d4af37',
                                                                fontStyle: 'italic', fontWeight: 500,
                                                                textAlign: 'center' as const,
                                                                overflow: 'hidden',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 3,
                                                                WebkitBoxOrient: 'vertical' as const,
                                                                lineHeight: 1.4,
                                                            }}>
                                                                {item.type === 'goal' ? '🎯 ' : '"'}{item.content.slice(0, 50)}{item.type === 'text' ? '"' : ''}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <p style={{
                                            fontSize: '10px', color: 'rgba(196,196,220,0.45)',
                                            fontStyle: 'italic', textAlign: 'center' as const,
                                        }}>
                                            {visionItems.length} vision{visionItems.length === 1 ? '' : 's'} · Tap to explore →
                                        </p>
                                    </>
                                )}
                            </div>


                            {/* ─── Manifest Journal Card ─── */}
                            <div
                                style={{
                                    marginTop: '24px',
                                    borderRadius: '22px',
                                    background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 55%, #0d0b22 100%)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)',
                                    padding: '24px 20px',
                                    position: 'relative' as const,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Gold accent line */}
                                <div style={{
                                    position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px',
                                    background: 'linear-gradient(90deg, transparent, #C59341, transparent)',
                                    opacity: 0.5,
                                }} />

                                {/* Header row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <p style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '10px', fontWeight: 500,
                                        letterSpacing: '5px', textTransform: 'uppercase' as const,
                                        color: '#D4A94E', opacity: 0.8,
                                        textShadow: '0 0 10px rgba(212,175,55,0.15)',
                                    }}>Manifest Journal</p>
                                    {journalEntryCount > 0 && (
                                        <button
                                            onClick={() => setShowJournalHistory(true)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: '10px', color: 'rgba(178,190,205,0.8)',
                                                padding: '2px 6px',
                                                fontFamily: 'var(--font-display)',
                                                letterSpacing: '1px',
                                            }}
                                        >{journalEntryCount} {journalEntryCount === 1 ? 'entry' : 'entries'} →</button>
                                    )}
                                </div>

                                {/* Category pill */}
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 10px', borderRadius: '16px',
                                        fontSize: '9px', fontWeight: 600,
                                        fontFamily: 'var(--font-display)',
                                        letterSpacing: '1.5px', textTransform: 'uppercase' as const,
                                        background: `${CATEGORY_META[todayJournal.category].color}18`,
                                        color: CATEGORY_META[todayJournal.category].color,
                                    }}>
                                        {CATEGORY_META[todayJournal.category].emoji} {CATEGORY_META[todayJournal.category].label}
                                    </span>
                                </div>

                                {/* Today's prompt */}
                                <p style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '14px', fontWeight: 500,
                                    fontStyle: 'italic',
                                    color: '#d4af37',
                                    lineHeight: 1.65,
                                    marginBottom: '16px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical' as const,
                                    overflow: 'hidden',
                                }}>"{todayJournal.prompt}"</p>

                                {/* Moon phase note */}
                                <p style={{
                                    fontSize: '10px', color: 'rgba(210,210,230,0.8)',
                                    fontStyle: 'italic', fontWeight: 300, marginBottom: '16px',
                                }}>{lunarData.currentPhase.emoji} {lunarData.currentPhase.name} energy guides today's reflection</p>

                                {/* Write CTA */}
                                <button
                                    className="gold-shimmer"
                                    onClick={() => setShowJournalPage(true)}
                                    style={{
                                        width: '100%', padding: '14px',
                                        borderRadius: '14px',
                                        border: '2px solid rgba(212,175,55,0.6)',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '11px', fontWeight: 800,
                                        letterSpacing: '3px', textTransform: 'uppercase' as const,
                                        color: '#1a0f2e',
                                        background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                        boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >✦ Write Today's Entry</button>
                            </div>


                            {/* Cosmic timing — Cosmic Shelf */}
                            {transitWindows.length > 0 && (() => {
                                const nowWindows = transitWindows.filter(h => !h.isApplying);
                                const comingWindows = transitWindows.filter(h => h.isApplying);

                                return (
                                    <div style={{ marginTop: '24px' }}>
                                        <p style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '10px',
                                            letterSpacing: '5px',
                                            textTransform: 'uppercase' as const,
                                            color: '#D4A94E',
                                            opacity: 0.7,
                                            textShadow: '0 0 10px rgba(212,175,55,0.12)',
                                            marginBottom: '12px',
                                        }}>
                                            ⚡ Cosmic Timing
                                        </p>

                                        {/* ─── NOW Hero Cards ─── */}
                                        {nowWindows.map((hit, i) => {
                                            const wInfo = WINDOW_PLANET_MSG[hit.transitPlanet.id];
                                            if (!wInfo) return null;
                                            return (
                                                <div key={`now-${i}`} style={{
                                                    position: 'relative' as const,
                                                    padding: '18px 18px',
                                                    borderRadius: '18px',
                                                    background: 'linear-gradient(135deg, rgba(197,147,65,0.10) 0%, rgba(28,21,56,0.95) 40%, rgba(13,11,34,0.98) 100%)',
                                                    border: '1px solid rgba(212,175,55,0.30)',
                                                    backdropFilter: 'blur(16px)',
                                                    boxShadow: '0 0 24px rgba(212,175,55,0.08), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.06)',
                                                    marginBottom: comingWindows.length > 0 ? '4px' : '0',
                                                    zIndex: 10,
                                                }}>
                                                    {/* Ambient glow */}
                                                    <div style={{
                                                        position: 'absolute', inset: '-8px',
                                                        background: 'radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.06) 0%, transparent 60%)',
                                                        pointerEvents: 'none', borderRadius: '26px',
                                                    }} />

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' as const }}>
                                                        {/* Planet glyph — enlarged */}
                                                        <div style={{
                                                            width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '22px',
                                                            border: '1.5px solid rgba(212,175,55,0.5)',
                                                            background: 'radial-gradient(circle, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.03) 70%)',
                                                            boxShadow: '0 0 16px rgba(212,175,55,0.12), 0 0 6px rgba(197,147,65,0.2)',
                                                        }}>
                                                            <span style={{ color: '#D4A94E' }}>{hit.transitPlanet.glyph}</span>
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{
                                                                fontFamily: 'var(--font-display)',
                                                                fontSize: '12px', fontWeight: 700,
                                                                letterSpacing: '2px',
                                                                textTransform: 'uppercase' as const,
                                                                color: '#F9E491',
                                                                marginBottom: '4px',
                                                                textShadow: '0 0 12px rgba(212,175,55,0.15)',
                                                            }}>
                                                                ✨ {wInfo.title}
                                                            </p>
                                                            <p style={{
                                                                fontSize: '11px',
                                                                color: 'rgba(226,232,240,0.9)',
                                                                fontWeight: 300, lineHeight: 1.5,
                                                            }}>{wInfo.msg}</p>
                                                        </div>
                                                        {/* NOW pill */}
                                                        <div style={{ flexShrink: 0 }}>
                                                            <span style={{
                                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                                fontFamily: 'var(--font-display)',
                                                                fontSize: '9px', letterSpacing: '1.5px',
                                                                textTransform: 'uppercase' as const,
                                                                padding: '5px 12px', borderRadius: '20px',
                                                                background: 'rgba(197,147,65,0.15)',
                                                                color: '#D4A94E',
                                                                border: '1px solid rgba(197,147,65,0.3)',
                                                            }}>
                                                                <span style={{
                                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                                    background: '#D4A94E',
                                                                    animation: 'livePulse 2s ease-in-out infinite',
                                                                    boxShadow: '0 0 6px rgba(212,175,55,0.3)',
                                                                }} />
                                                                Now
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* ─── Coming Stack ─── */}
                                        {comingWindows.length > 0 && (
                                            <div
                                                onClick={() => setStackExpanded(!stackExpanded)}
                                                style={{ cursor: 'pointer', position: 'relative' as const }}
                                            >
                                                {comingWindows.map((hit, i) => {
                                                    const wInfo = WINDOW_PLANET_MSG[hit.transitPlanet.id];
                                                    if (!wInfo) return null;
                                                    const opacityLevels = [0.8, 0.55, 0.35, 0.2];
                                                    const collapsedOffset = (i + 1) * -38; // negative margin to stack
                                                    const expandedOffset = 0;

                                                    return (
                                                        <div key={`coming-${i}`} style={{
                                                            padding: stackExpanded ? '14px 16px' : '14px 16px',
                                                            borderRadius: '16px',
                                                            background: 'rgba(28,21,56,0.85)',
                                                            border: '1px solid rgba(212,175,55,0.10)',
                                                            backdropFilter: 'blur(12px)',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                                            marginTop: stackExpanded ? '8px' : `${collapsedOffset}px`,
                                                            opacity: stackExpanded ? 1 : (opacityLevels[i] ?? 0.2),
                                                            position: 'relative' as const,
                                                            zIndex: stackExpanded ? 5 : (4 - i),
                                                            transition: 'all 0.3s ease-out',
                                                            transitionDelay: stackExpanded ? `${i * 50}ms` : '0ms',
                                                            overflow: 'hidden',
                                                            height: stackExpanded ? 'auto' : (i === 0 ? 'auto' : undefined),
                                                        }}>
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                                opacity: stackExpanded ? 1 : (i === 0 ? 1 : 0),
                                                                transition: 'opacity 0.2s ease',
                                                                transitionDelay: stackExpanded ? `${i * 80 + 100}ms` : '0ms',
                                                            }}>
                                                                {/* Planet glyph */}
                                                                <div style={{
                                                                    width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '17px',
                                                                    border: '1.5px solid rgba(197,147,65,0.3)',
                                                                    background: 'radial-gradient(circle, rgba(197,147,65,0.06) 0%, transparent 70%)',
                                                                }}>
                                                                    <span style={{ color: '#C59341' }}>{hit.transitPlanet.glyph}</span>
                                                                </div>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <p style={{
                                                                        fontFamily: 'var(--font-display)',
                                                                        fontSize: '11px', fontWeight: 600,
                                                                        letterSpacing: '2px',
                                                                        textTransform: 'uppercase' as const,
                                                                        color: 'rgba(226,232,240,0.85)',
                                                                        marginBottom: '3px',
                                                                    }}>
                                                                        ✨ {wInfo.title}
                                                                    </p>
                                                                    <p style={{
                                                                        fontSize: '11px',
                                                                        color: 'rgba(196,196,220,0.6)',
                                                                        fontWeight: 300, lineHeight: 1.45,
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical' as const,
                                                                        overflow: 'hidden',
                                                                    }}>{wInfo.msg}</p>
                                                                </div>
                                                                {/* Date pill */}
                                                                <div style={{ flexShrink: 0 }}>
                                                                    <span style={{
                                                                        fontFamily: 'var(--font-display)',
                                                                        fontSize: '9px', letterSpacing: '1px',
                                                                        textTransform: 'uppercase' as const,
                                                                        padding: '4px 10px', borderRadius: '20px',
                                                                        background: 'rgba(148,163,184,0.06)',
                                                                        color: 'rgba(196,196,220,0.55)',
                                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                                        whiteSpace: 'nowrap' as const,
                                                                    }}>{(() => {
                                                                        const d = new Date(hit.peakDate + 'T12:00:00');
                                                                        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                                                    })()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}



                                            </div>
                                        )}

                                        {/* No NOW cards — show first Coming as hero-style */}
                                        {nowWindows.length === 0 && comingWindows.length > 0 && (() => {
                                            const firstComing = comingWindows[0];
                                            const wInfo = WINDOW_PLANET_MSG[firstComing.transitPlanet.id];
                                            if (!wInfo) return null;
                                            return (
                                                <p style={{
                                                    fontSize: '10px', color: 'rgba(210,210,230,0.8)',
                                                    fontStyle: 'italic', textAlign: 'center' as const,
                                                    marginTop: '6px',
                                                }}>No active windows — {comingWindows.length} approaching</p>
                                            );
                                        })()}
                                    </div>
                                );
                            })()}

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



            {/* Sacred Script ritual writing modal */}
            {ritualModal.open && activeScript && (
                <RitualWritingSurface
                    script={activeScript}
                    timeOfDay={ritualModal.timeOfDay}
                    moonPhaseName={lunarData.currentPhase.name}
                    onClose={() => setRitualModal({ open: false, timeOfDay: 'morning' })}
                    onSave={() => {
                        setRitualModal({ open: false, timeOfDay: 'morning' });
                        refresh();
                    }}
                />
            )}

            {/* Vision Board full-page overlay */}
            {showVisionBoard && (
                <VisionBoard
                    onClose={() => {
                        setShowVisionBoard(false);
                        setVisionItems(getVisionBoardItems()); // refresh preview
                    }}
                />
            )}

            {/* Intentions full-page overlay */}
            {showIntentions && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'linear-gradient(180deg, #0e0a1f 0%, #120224 50%, #0e0a1f 100%)',
                    overflow: 'auto',
                    paddingBottom: '100px',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
                    }}>
                        <button onClick={() => { setShowIntentions(false); refresh(); }} style={{
                            background: 'none', border: 'none', color: 'rgba(196,196,220,0.6)',
                            fontSize: '14px', cursor: 'pointer', padding: '4px',
                        }}>← Back</button>
                        <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px', fontWeight: 700,
                            letterSpacing: '5px', textTransform: 'uppercase' as const,
                            color: '#F9E491',
                            textShadow: '0 0 20px rgba(212,175,55,0.2)',
                        }}>Your Intentions</p>
                        <div style={{ width: '48px' }} />
                    </div>

                    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>

                        {/* Active Manifestations */}
                        {active.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '9px', letterSpacing: '5px',
                                    textTransform: 'uppercase' as const,
                                    color: '#D4A94E', opacity: 0.5,
                                    marginBottom: '12px',
                                }}>✦ Active — tap to practice</p>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                                    {active.map(m => {
                                        const linkedScript = getScriptByManifestationId(m.id);
                                        const isCurrentlyActive = linkedScript?.status === 'active';
                                        const progress = linkedScript ? getScriptProgress(linkedScript.id) : null;
                                        const doneToday = progress?.todayComplete ?? false;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    if (linkedScript) {
                                                        if (linkedScript.status === 'paused') {
                                                            resumeScript(linkedScript.id);
                                                        }
                                                    } else {
                                                        // No Sacred Script yet — create one for this intention
                                                        createSacredScript(m.declaration, lunarData.currentPhase.name, m.id);
                                                    }
                                                    setShowIntentions(false);
                                                    refresh();
                                                }}
                                                style={{
                                                    width: '100%', textAlign: 'left' as const,
                                                    padding: '16px 18px',
                                                    borderRadius: '16px',
                                                    background: isCurrentlyActive
                                                        ? 'linear-gradient(145deg, rgba(212,175,55,0.08) 0%, rgba(28,21,56,0.95) 100%)'
                                                        : 'rgba(255,255,255,0.02)',
                                                    border: isCurrentlyActive
                                                        ? '1px solid rgba(212,175,55,0.25)'
                                                        : '1px solid rgba(255,255,255,0.06)',
                                                    cursor: linkedScript ? 'pointer' : 'default',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontSize: '14px' }}>{doneToday ? '✓' : '○'}</span>
                                                        <p style={{
                                                            fontFamily: 'var(--font-display)',
                                                            fontSize: '13px',
                                                            color: doneToday ? '#34d399' : isCurrentlyActive ? '#F9E491' : 'rgba(226,232,240,0.7)',
                                                            fontWeight: isCurrentlyActive || doneToday ? 600 : 400,
                                                            fontStyle: 'italic',
                                                        }}>"{m.declaration}"</p>
                                                    </div>
                                                    {doneToday && (
                                                        <span style={{
                                                            fontSize: '8px', letterSpacing: '2px',
                                                            textTransform: 'uppercase' as const,
                                                            color: '#34d399', opacity: 0.7,
                                                            fontFamily: 'var(--font-display)',
                                                        }}>Done today</span>
                                                    )}
                                                </div>
                                                {linkedScript && (
                                                    <p style={{
                                                        fontSize: '10px',
                                                        color: isCurrentlyActive ? 'rgba(212,175,55,0.5)' : 'rgba(148,163,184,0.4)',
                                                        paddingLeft: '24px', marginTop: '4px',
                                                    }}>
                                                        Day {progress ? progress.dayNumber : linkedScript.entries.length + 1} of {CYCLE_DAYS}
                                                        {!doneToday && (isCurrentlyActive ? ' · Currently scripting' : ' · Tap to practice')}
                                                    </p>
                                                )}
                                                {!linkedScript && (
                                                    <p style={{ fontSize: '10px', color: 'rgba(212,175,55,0.4)', paddingLeft: '24px', marginTop: '4px' }}>
                                                        Tap to begin your 369 practice
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Paused Sacred Scripts */}
                        {pausedScriptsList.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '9px', letterSpacing: '5px',
                                    textTransform: 'uppercase' as const,
                                    color: '#94a3b8', opacity: 0.5,
                                    marginBottom: '12px',
                                }}>⏸ Paused Journeys</p>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                                    {pausedScriptsList.map(s => (
                                        <div key={s.id} style={{
                                            padding: '14px 16px',
                                            borderRadius: '16px',
                                            background: 'rgba(99,102,241,0.06)',
                                            border: '1px solid rgba(99,102,241,0.12)',
                                            backdropFilter: 'blur(12px)',
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                        }}>
                                            <span style={{ fontSize: '20px', flexShrink: 0, opacity: 0.5 }}>⏸</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontSize: '12px', color: 'rgba(226,232,240,0.6)',
                                                    fontStyle: 'italic', fontWeight: 300,
                                                    whiteSpace: 'nowrap' as const,
                                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                                }}>"{s.affirmation}"</p>
                                                <p style={{
                                                    fontSize: '10px', color: 'rgba(148,163,184,0.5)',
                                                    marginTop: '2px',
                                                }}>
                                                    Day {s.entries.length} of {CYCLE_DAYS} · Paused
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                <button
                                                    onClick={() => { resumeScript(s.id); refresh(); }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '10px',
                                                        fontFamily: 'var(--font-display)',
                                                        fontSize: '9px', fontWeight: 600,
                                                        letterSpacing: '1px',
                                                        textTransform: 'uppercase' as const,
                                                        background: 'rgba(99,102,241,0.15)',
                                                        color: '#a5b4fc',
                                                        border: '1px solid rgba(99,102,241,0.25)',
                                                        cursor: 'pointer',
                                                    }}
                                                >▶ Resume</button>
                                                <button
                                                    onClick={() => { abandonScript(s.id); refresh(); }}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '10px',
                                                        fontFamily: 'var(--font-display)',
                                                        fontSize: '9px',
                                                        letterSpacing: '1px',
                                                        textTransform: 'uppercase' as const,
                                                        background: 'rgba(239,68,68,0.06)',
                                                        color: 'rgba(239,68,68,0.5)',
                                                        border: '1px solid rgba(239,68,68,0.12)',
                                                        cursor: 'pointer',
                                                    }}
                                                >✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed / Released */}
                        {manifestations.filter(m => m.status !== 'active').length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '9px', letterSpacing: '5px',
                                    textTransform: 'uppercase' as const,
                                    color: '#94a3b8', opacity: 0.35,
                                    marginBottom: '12px',
                                }}>✧ History</p>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                                    {manifestations.filter(m => m.status !== 'active').map(m => (
                                        <ManifestCard key={m.id} entry={m} onRefresh={refresh} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Manifest Journal full-page overlay */}
            {showJournalPage && (
                <ManifestJournalPage
                    moonPhaseName={lunarData.currentPhase.name}
                    onClose={() => setShowJournalPage(false)}
                    onSave={() => setJournalEntryCount(getJournalEntries().length)}
                />
            )}

            {/* Journal history overlay */}
            {showJournalHistory && (
                <JournalHistoryView onClose={() => setShowJournalHistory(false)} />
            )}
        </>
    );
}

