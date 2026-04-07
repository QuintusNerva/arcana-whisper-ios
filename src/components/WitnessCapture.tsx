/**
 * WitnessCapture — Log real-world alignment events.
 *
 * Four witness types:
 * 1. Angel Numbers (111, 222, etc.)
 * 2. Coincidences (meaningful synchronicities)
 * 3. Dreams (subconscious symbols)
 * 4. Opportunities (the intention showing up)
 *
 * Optionally links to an active manifestation.
 * Sacred Fintech design system throughout.
 */

import React from 'react';
import {
    saveWitnessEvent,
    getRecentWitnessEvents,
    deleteWitnessEvent,
    type WitnessType,
    type WitnessEvent,
    type WitnessMood,
} from '../services/witness.service';
import {
    getActiveManifestations,
    linkWitnessEvent,
} from '../services/manifestation.service';
import { invalidateForgeCache } from '../services/forge.service';

// ── Types ──

const WITNESS_TYPES: { type: WitnessType; emoji: string; label: string; placeholder: string }[] = [
    { type: 'angel_number', emoji: '🔢', label: 'Angel Number', placeholder: 'Which number? (e.g., 111, 444, 1111)' },
    { type: 'coincidence', emoji: '✨', label: 'Coincidence', placeholder: 'What happened? Be specific...' },
    { type: 'dream', emoji: '🌙', label: 'Dream', placeholder: 'Describe what you saw or felt...' },
    { type: 'opportunity', emoji: '🚪', label: 'Opportunity', placeholder: 'What appeared? Be concrete...' },
];

// ── Styles ──

const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
    borderRadius: '16px',
};

const goldAccentCard: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(61,29,90,0.35) 0%, rgba(28,21,56,0.6) 100%)',
    border: '1px solid rgba(212,175,55,0.12)',
    borderRadius: '16px',
    backdropFilter: 'blur(12px)',
};

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

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(13,11,34,0.6)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '12px 14px',
    color: 'rgba(226,232,240,0.9)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 300,
    outline: 'none',
    transition: 'border-color 0.3s',
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

const ShimmerOverlay = () => (
    <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '12px' }}>
        <span style={{
            position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
            animation: 'shimmer 3s ease-in-out infinite',
        }} />
    </span>
);

// ── Component ──

interface WitnessCaptureProps {
    onClose?: () => void;
    defaultLinkedManifestationId?: string;
}

export function WitnessCapture({ onClose, defaultLinkedManifestationId }: WitnessCaptureProps) {
    const [step, setStep] = React.useState<'type' | 'detail' | 'link' | 'done'>('type');
    const [selectedType, setSelectedType] = React.useState<WitnessType | null>(null);
    const [description, setDescription] = React.useState('');
    const [angelNumber, setAngelNumber] = React.useState('');
    const [note, setNote] = React.useState('');
    const [linkedManifId, setLinkedManifId] = React.useState<string | null>(
        defaultLinkedManifestationId || null
    );
    const [savedEvent, setSavedEvent] = React.useState<WitnessEvent | null>(null);
    const [selectedMood, setSelectedMood] = React.useState<WitnessMood | null>(null);

    const activeManifestations = React.useMemo(() => getActiveManifestations(), []);

    const handleSave = () => {
        if (!selectedType || !description.trim()) return;

        const event = saveWitnessEvent({
            type: selectedType,
            description: description.trim(),
            note: note.trim() || undefined,
            linkedManifestationId: linkedManifId || undefined,
            angelNumber: selectedType === 'angel_number' ? angelNumber.trim() : undefined,
            mood: selectedMood || undefined,
        });

        // If linked to a manifestation, update signal strength and invalidate cache
        if (linkedManifId) {
            linkWitnessEvent(linkedManifId, event.id);
            invalidateForgeCache(linkedManifId);
        }

        setSavedEvent(event);
        setStep('done');
    };

    // Step 1: Choose type
    if (step === 'type') {
        return (
            <div className="animate-fade-up" style={{ padding: '0' }}>
                <div className="flex items-center justify-between mb-5">
                    <h3 style={{ ...headerStyle, fontSize: '12px' }}>✦ Log a Witness Event</h3>
                    {onClose && (
                        <button onClick={onClose} style={{ ...bodyText, fontSize: '12px', opacity: 0.4 }}>
                            Cancel
                        </button>
                    )}
                </div>
                <p style={{ ...bodyText, fontSize: '12px', marginBottom: '16px' }}>
                    What did you notice today?
                </p>

                {/* Mood Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '16px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(13,11,34,0.4)',
                    border: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <span style={{ ...bodyText, fontSize: '10px', opacity: 0.5, marginRight: '4px', whiteSpace: 'nowrap' }}>Today's energy:</span>
                    {(['🔥', '✨', '🌿', '💎', '🌙'] as WitnessMood[]).map(mood => (
                        <button
                            key={mood}
                            onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                            style={{
                                fontSize: '20px',
                                padding: '4px 6px',
                                borderRadius: '8px',
                                background: selectedMood === mood ? 'rgba(212,175,55,0.15)' : 'transparent',
                                border: selectedMood === mood ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                transform: selectedMood === mood ? 'scale(1.15)' : 'scale(1)',
                            }}
                        >{mood}</button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {WITNESS_TYPES.map(wt => (
                        <button
                            key={wt.type}
                            onClick={() => {
                                setSelectedType(wt.type);
                                setStep('detail');
                            }}
                            className="transition-all active:scale-[0.96] hover:border-[rgba(212,175,55,0.3)]"
                            style={{
                                ...goldAccentCard,
                                padding: '16px 12px',
                                textAlign: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>
                                {wt.emoji}
                            </span>
                            <span style={{
                                ...headerStyle,
                                fontSize: '9px',
                                display: 'block',
                            }}>
                                {wt.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Nothing Today Button */}
                <button
                    onClick={() => {
                        // Log a neutral "check-in" event
                        const event = saveWitnessEvent({
                            type: 'coincidence',
                            description: 'Quiet day — checked in with no specific sign.',
                            mood: selectedMood || undefined,
                        });
                        setSavedEvent(event);
                        setStep('done');
                    }}
                    style={{
                        width: '100%',
                        marginTop: '14px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    className="hover:bg-[rgba(255,255,255,0.03)]"
                >
                    <span style={{ ...bodyText, fontSize: '12px', opacity: 0.4 }}>
                        Nothing today — and that's okay ✦
                    </span>
                </button>
            </div>
        );
    }

    // Step 2: Describe the event
    if (step === 'detail') {
        const wt = WITNESS_TYPES.find(t => t.type === selectedType)!;
        return (
            <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => setStep('type')} style={{ ...bodyText, fontSize: '12px', opacity: 0.6 }}>
                        ← Back
                    </button>
                    <h3 style={{ ...headerStyle, fontSize: '12px' }}>
                        {wt.emoji} {wt.label}
                    </h3>
                    <div style={{ width: '40px' }} />
                </div>

                {/* Angel number input */}
                {selectedType === 'angel_number' && (
                    <div className="mb-4">
                        <label style={{ ...headerStyle, fontSize: '9px', display: 'block', marginBottom: '6px', opacity: 0.6 }}>
                            The Number
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={angelNumber}
                            onChange={e => setAngelNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="e.g., 111, 444, 1111"
                            style={inputStyle}
                            maxLength={8}
                        />
                    </div>
                )}

                {/* Description */}
                <div className="mb-4">
                    <label style={{ ...headerStyle, fontSize: '9px', display: 'block', marginBottom: '6px', opacity: 0.6 }}>
                        What Happened
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder={wt.placeholder}
                        rows={3}
                        style={{
                            ...inputStyle,
                            resize: 'none' as const,
                        }}
                        maxLength={500}
                    />
                </div>

                {/* Optional note */}
                <div className="mb-5">
                    <label style={{ ...headerStyle, fontSize: '9px', display: 'block', marginBottom: '6px', opacity: 0.6 }}>
                        Your Reflection <span style={{ opacity: 0.4 }}>(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="What does this mean to you?"
                        style={inputStyle}
                        maxLength={200}
                    />
                </div>

                {/* Next button */}
                <button
                    onClick={() => {
                        if (activeManifestations.length > 0 && !defaultLinkedManifestationId) {
                            setStep('link');
                        } else {
                            handleSave();
                        }
                    }}
                    disabled={!description.trim() || (selectedType === 'angel_number' && !angelNumber.trim())}
                    className="w-full py-3 text-sm tracking-wider transition-all active:scale-[0.97]"
                    style={{
                        ...goldBtnStyle,
                        opacity: (!description.trim() || (selectedType === 'angel_number' && !angelNumber.trim())) ? 0.3 : 1,
                    }}
                >
                    <ShimmerOverlay />
                    <span style={{ position: 'relative' }}>
                        {activeManifestations.length > 0 && !defaultLinkedManifestationId
                            ? 'Next: Link to Intention →'
                            : '✦ Save Witness Event'
                        }
                    </span>
                </button>
            </div>
        );
    }

    // Step 3: Link to manifestation (optional)
    if (step === 'link') {
        return (
            <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => setStep('detail')} style={{ ...bodyText, fontSize: '12px', opacity: 0.6 }}>
                        ← Back
                    </button>
                    <h3 style={{ ...headerStyle, fontSize: '12px' }}>✦ Link to Intention</h3>
                    <div style={{ width: '40px' }} />
                </div>
                <p style={{ ...bodyText, fontSize: '12px', marginBottom: '16px' }}>
                    Does this event relate to something you're manifesting?
                </p>

                <div className="space-y-2 mb-4">
                    {activeManifestations.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setLinkedManifId(
                                linkedManifId === m.id ? null : m.id
                            )}
                            className="w-full text-left transition-all active:scale-[0.98]"
                            style={{
                                ...goldAccentCard,
                                padding: '12px 14px',
                                borderColor: linkedManifId === m.id
                                    ? 'rgba(212,175,55,0.35)'
                                    : 'rgba(212,175,55,0.10)',
                                boxShadow: linkedManifId === m.id
                                    ? '0 0 12px rgba(212,175,55,0.08)'
                                    : 'none',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    border: linkedManifId === m.id
                                        ? '2px solid var(--color-gold-100)'
                                        : '2px solid rgba(255,255,255,0.15)',
                                    background: linkedManifId === m.id
                                        ? 'var(--color-gold-100)'
                                        : 'transparent',
                                    display: 'inline-block',
                                    flexShrink: 0,
                                    transition: 'all 0.3s',
                                }} />
                                <span style={{
                                    ...bodyText,
                                    fontSize: '13px',
                                    color: linkedManifId === m.id
                                        ? 'var(--color-gold-100)'
                                        : 'rgba(226,232,240,0.7)',
                                }}>
                                    {m.declaration.slice(0, 60)}{m.declaration.length > 60 ? '…' : ''}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setLinkedManifId(null);
                            handleSave();
                        }}
                        className="flex-1 py-3 text-sm tracking-wider transition-all active:scale-[0.97]"
                        style={{
                            ...cardStyle,
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(226,232,240,0.5)',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px',
                            letterSpacing: '1px',
                        }}
                    >
                        Skip Linking
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 text-sm tracking-wider transition-all active:scale-[0.97]"
                        style={goldBtnStyle}
                    >
                        <ShimmerOverlay />
                        <span style={{ position: 'relative' }}>✦ Save</span>
                    </button>
                </div>
            </div>
        );
    }

    // Step 4: Done confirmation
    return (
        <div className="animate-fade-up text-center py-4">
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>✨</span>
            <h3 style={{ ...headerStyle, fontSize: '14px', marginBottom: '8px' }}>Witnessed</h3>
            <p style={{ ...bodyText, fontSize: '12px', marginBottom: '20px' }}>
                {linkedManifId
                    ? 'Event recorded and linked to your intention. Your signal grows stronger.'
                    : 'Event recorded. You can link it to an intention later.'
                }
            </p>
            {onClose && (
                <button
                    onClick={onClose}
                    className="py-2.5 px-6 text-sm tracking-wider transition-all active:scale-[0.97]"
                    style={goldBtnStyle}
                >
                    <ShimmerOverlay />
                    <span style={{ position: 'relative' }}>Done</span>
                </button>
            )}
        </div>
    );
}

// ── Witness Timeline (for viewing recent events) ──

interface WitnessTimelineProps {
    manifestationId?: string;
    maxItems?: number;
}

export function WitnessTimeline({ manifestationId, maxItems = 10 }: WitnessTimelineProps) {
    const [events, setEvents] = React.useState<WitnessEvent[]>([]);

    React.useEffect(() => {
        setEvents(getRecentWitnessEvents(30).slice(0, maxItems));
    }, [maxItems]);

    const filteredEvents = manifestationId
        ? events.filter(e => e.linkedManifestationId === manifestationId)
        : events;

    if (filteredEvents.length === 0) {
        return (
            <div className="text-center py-8">
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>👁️</span>
                <p style={{ ...bodyText, fontSize: '12px', opacity: 0.4 }}>
                    No witness events yet. Stay observant.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {filteredEvents.map(event => {
                const wt = WITNESS_TYPES.find(t => t.type === event.type);
                const timeAgo = getRelativeTime(event.timestamp);
                return (
                    <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 transition-all"
                        style={{
                            ...goldAccentCard,
                            padding: '12px 14px',
                        }}
                    >
                        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>
                            {wt?.emoji || '✦'}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span style={{ ...headerStyle, fontSize: '9px', opacity: 0.6 }}>
                                    {wt?.label || event.type}
                                </span>
                                {event.angelNumber && (
                                    <span style={{
                                        fontSize: '10px',
                                        padding: '1px 6px',
                                        borderRadius: '6px',
                                        background: 'rgba(212,175,55,0.1)',
                                        border: '1px solid rgba(212,175,55,0.15)',
                                        color: 'var(--color-gold-100)',
                                        fontFamily: 'var(--font-display)',
                                    }}>
                                        {event.angelNumber}
                                    </span>
                                )}
                                <span style={{ ...bodyText, fontSize: '10px', opacity: 0.3, marginLeft: 'auto' }}>
                                    {timeAgo}
                                </span>
                            </div>
                            <p style={{
                                ...bodyText,
                                fontSize: '12px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical' as const,
                            }}>
                                {event.description}
                            </p>
                            {event.note && (
                                <p style={{
                                    ...bodyText,
                                    fontSize: '11px',
                                    fontStyle: 'italic',
                                    marginTop: '4px',
                                    opacity: 0.5,
                                }}>
                                    "{event.note}"
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Helper ──

function getRelativeTime(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
