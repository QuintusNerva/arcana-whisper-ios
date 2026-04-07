import React from 'react';
import { safeStorage } from '../services/storage.service';
import { AIService } from '../services/ai.service';
import { getBirthData, getNatalTriad, getLifePathNumber, getCurrentPersonalYear } from '../services/astrology.service';
import { createManifestation, getActiveManifestations, linkWitnessEvent } from '../services/manifestation.service';
import { saveWitnessEvent } from '../services/witness.service';
import { invalidateForgeCache } from '../services/forge.service';

const ANGEL_LOG_KEY = 'arcana_angel_log';
const ANGEL_MEANING_CACHE_KEY = 'arcana_angel_meanings';

// ── Quick-tap grid data ──
const ANGEL_GRID = [
    { num: '111', meaning: 'New Beginnings', hint: 'clocks · signs' },
    { num: '222', meaning: 'Balance', hint: 'receipts · plates' },
    { num: '333', meaning: 'Ascended Masters', hint: 'timestamps' },
    { num: '444', meaning: 'Protection', hint: 'addresses · time' },
    { num: '555', meaning: 'Change Coming', hint: 'totals · signs' },
    { num: '666', meaning: 'Realignment', hint: 'reflect · refocus' },
    { num: '777', meaning: 'Awakening', hint: 'luck · spirit' },
    { num: '888', meaning: 'Abundance', hint: 'flow · harvest' },
    { num: '999', meaning: 'Completion', hint: 'endings · cycles' },
];

// Session cache for AI meanings
function getMeaningCache(): Record<string, string> {
    try { return JSON.parse(safeStorage.getItem(ANGEL_MEANING_CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveMeaningCache(c: Record<string, string>) {
    safeStorage.setItem(ANGEL_MEANING_CACHE_KEY, JSON.stringify(c));
}

interface AngelSighting { id: string; number: string; timestamp: string; note?: string; }
function getLog(): AngelSighting[] { try { return JSON.parse(safeStorage.getItem(ANGEL_LOG_KEY) || '[]'); } catch { return []; } }
function saveLog(l: AngelSighting[]) { safeStorage.setItem(ANGEL_LOG_KEY, JSON.stringify(l)); }

interface MeaningResult { title: string; body: string; ritual?: string; }

function parseMeaning(raw: string): MeaningResult {
    const allLines = raw.trim().split('\n').filter(l => l.trim());
    let title = 'Angel Number';
    let ritual: string | undefined;
    let startIdx = 0;

    // Extract title (first short non-sentence line)
    const firstLine = allLines[0]?.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    if (firstLine && firstLine.length < 60 && !firstLine.endsWith('.')) {
        title = firstLine;
        startIdx = 1;
    }

    // Separate body from micro-ritual (line starting with ✦)
    const bodyLines: string[] = [];
    for (let i = startIdx; i < allLines.length; i++) {
        if (allLines[i].trim().startsWith('✦')) {
            ritual = allLines[i].trim().replace(/^✦\s*/, '');
        } else {
            bodyLines.push(allLines[i]);
        }
    }

    return { title, body: bodyLines.join('\n').trim(), ritual };
}

// ── Digit meaning breakdown ──
const DIGIT_MEANINGS: Record<string, string> = {
    '0': 'Infinite',
    '1': 'New Start',
    '2': 'Balance',
    '3': 'Creation',
    '4': 'Foundation',
    '5': 'Change',
    '6': 'Harmony',
    '7': 'Spirit',
    '8': 'Abundance',
    '9': 'Completion',
};

export function AngelNumbersSection() {
    const [log, setLog] = React.useState<AngelSighting[]>(() => getLog());
    const [selected, setSelected] = React.useState<string | null>(null);
    const [customInput, setCustomInput] = React.useState('');
    const [meaning, setMeaning] = React.useState<MeaningResult | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [aiError, setAiError] = React.useState<string | null>(null);
    const [note, setNote] = React.useState('');
    const [collapsed, setCollapsed] = React.useState(true);
    const [showAll, setShowAll] = React.useState(false);
    const [whereSpotted, setWhereSpotted] = React.useState('');
    const [ritualSaved, setRitualSaved] = React.useState(false);

    const fetchMeaning = async (num: string) => {
        const cache = getMeaningCache();
        if (cache[num]) {
            setMeaning(parseMeaning(cache[num]));
            return;
        }

        const ai = new AIService();
        if (!ai.hasApiKey()) {
            setMeaning({
                title: `Angel Number ${num}`,
                body: `You noticed ${num}. In angel number traditions, each digit carries vibration — ${num.split('').join(' + ')} together form a message from the universe. Add your API key in Settings for a personalized reading.`,
            });
            return;
        }

        setAiLoading(true);
        setAiError(null);
        setMeaning(null);

        try {
            const birthData = getBirthData();
            let chartContext: { sun?: string; moon?: string; rising?: string; lifePath?: number; personalYear?: number } | undefined;
            if (birthData) {
                const triad = getNatalTriad(birthData);
                const lifePath = getLifePathNumber(birthData.birthday);
                const personalYear = getCurrentPersonalYear(birthData.birthday);
                chartContext = {
                    sun: triad.sun.name,
                    moon: triad.moon.name,
                    rising: triad.rising.name,
                    lifePath,
                    personalYear,
                };
            }

            // Pass active intentions for soft cross-reference
            const activeIntentions = getActiveManifestations().map(m => m.declaration);
            const raw = await ai.getAngelNumberMeaning(num, chartContext, whereSpotted || undefined, activeIntentions.length > 0 ? activeIntentions : undefined);
            const updated = { ...getMeaningCache(), [num]: raw };
            saveMeaningCache(updated);
            setMeaning(parseMeaning(raw));
        } catch {
            setAiError('Could not load meaning. Try again.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSelect = (num: string) => {
        if (selected === num && meaning) {
            setSelected(null);
            setMeaning(null);
            setCollapsed(true);
            return;
        }
        setSelected(num);
        setCollapsed(true);
        setRitualSaved(false);
        fetchMeaning(num);
    };

    const handleCustomSubmit = () => {
        const num = customInput.trim().replace(/\D/g, '');
        if (!num || num.length < 2) return;
        setSelected(num);
        setCustomInput('');
        setCollapsed(true);
        fetchMeaning(num);
    };

    const logSighting = () => {
        if (!selected) return;
        const entry: AngelSighting = {
            id: `a${Date.now()}`,
            number: selected,
            timestamp: new Date().toISOString(),
            note: note || undefined,
        };
        const updated = [entry, ...getLog()].slice(0, 50);
        saveLog(updated);
        setLog(updated);

        // Bridge: also save as WitnessEvent
        saveWitnessEvent({
            type: 'angel_number',
            description: whereSpotted
                ? `Saw ${selected} on ${whereSpotted}`
                : `Spotted angel number ${selected}`,
            note: note || undefined,
            angelNumber: selected,
        });

        setSelected(null);
        setMeaning(null);
        setNote('');
        setCollapsed(true);
    };

    // Count sightings per number for frequency display
    const sightingCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        log.forEach(s => {
            if (new Date(s.timestamp).getTime() > weekAgo) {
                counts[s.number] = (counts[s.number] || 0) + 1;
            }
        });
        return counts;
    }, [log]);

    // Get unique digit meanings for breakdown
    const digitBreakdown = selected ? selected.split('').map(d => ({
        digit: d,
        meaning: DIGIT_MEANINGS[d] || '?',
    })) : [];

    // Check for repeated digits
    const hasRepeats = selected ? new Set(selected.split('')).size < selected.length : false;

    return (
        <div className="mx-5 mb-5 animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>

            {/* ── Hero Input — "What number is finding you?" ── */}
            <div
                className="rounded-[22px] p-5 mb-5"
                style={{
                    background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -2px 5px rgba(0,0,0,0.35), 0 0 40px rgba(212,175,55,0.05)',
                }}
            >
                <p className="font-display text-[9px] tracking-[5px] uppercase text-center mb-3" style={{
                    color: '#F9E491',
                    textShadow: '0 0 12px rgba(212,175,55,0.15)',
                }}>
                    ✦ What number is finding you? ✦
                </p>
                <div className="flex gap-2">
                    <input
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                        inputMode="numeric"
                        placeholder="Enter your number..."
                        className="flex-1 rounded-2xl px-5 py-4 text-lg text-center text-altar-text font-display tracking-[4px] focus:outline-none transition-all"
                        style={{
                            background: 'rgba(61,29,90,0.4)',
                            border: '1px solid rgba(212,175,55,0.2)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />
                </div>
                <input
                    value={whereSpotted}
                    onChange={e => setWhereSpotted(e.target.value)}
                    placeholder="Where did you spot it? (clock, receipt, dream...)"
                    className="w-full mt-2 rounded-xl px-4 py-2.5 text-[11px] text-altar-text/80 focus:outline-none transition-all"
                    style={{
                        background: 'rgba(61,29,90,0.25)',
                        border: '1px solid rgba(212,175,55,0.10)',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 300,
                        letterSpacing: '0.5px',
                    }}
                />
                <button
                    onClick={handleCustomSubmit}
                    disabled={!customInput.trim()}
                    className="w-full mt-3 rounded-2xl px-5 py-3.5 text-[11px] font-display tracking-[3px] uppercase disabled:opacity-30 transition-all active:scale-[0.98] gold-shimmer"
                    style={{
                        background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                        border: '2px solid rgba(212,175,55,0.6)',
                        color: '#1a0f2e',
                        fontWeight: 800,
                        boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
                    }}
                >
                    Reveal Its Message
                </button>
            </div>

            {/* ── Separator ── */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <p className="text-[8px] font-display tracking-[2px] uppercase text-altar-muted/70">or explore common numbers</p>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* ── Quick-Tap Angel Number Grid ── */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {ANGEL_GRID.map((item) => {
                    const isActive = selected === item.num;
                    const weekCount = sightingCounts[item.num] || 0;
                    return (
                        <button
                            key={item.num}
                            onClick={() => handleSelect(item.num)}
                            className="relative rounded-2xl p-3 text-center transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                            style={{
                                background: isActive
                                    ? 'linear-gradient(135deg, rgba(197,147,65,0.12), rgba(61,29,90,0.5))'
                                    : 'rgba(61,29,90,0.35)',
                                border: isActive
                                    ? '1px solid rgba(212,175,55,0.4)'
                                    : '1px solid rgba(212,175,55,0.10)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: isActive
                                    ? '0 0 20px rgba(212,175,55,0.12), 0 2px 8px rgba(0,0,0,0.2)'
                                    : '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                        >
                            {/* Frequency badge */}
                            {weekCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 text-[8px] font-display rounded-full px-1.5 py-0.5"
                                    style={{
                                        background: 'rgba(197,147,65,0.20)',
                                        color: '#D4A94E',
                                        border: '1px solid rgba(197,147,65,0.3)',
                                    }}
                                >
                                    ×{weekCount}
                                </span>
                            )}
                            {/* Number */}
                            <p className="font-display text-base" style={{
                                color: isActive ? '#F9E491' : '#f1f5f9',
                                fontWeight: 500,
                                textShadow: isActive ? '0 0 10px rgba(212,175,55,0.3)' : '0 0 4px rgba(255,255,255,0.1)',
                            }}>
                                {item.num}
                            </p>
                            {/* Meaning preview */}
                            <p className="font-display text-[8px] tracking-[1.5px] uppercase mt-0.5" style={{
                                color: isActive ? '#F9E491' : '#D4A94E',
                                opacity: isActive ? 1 : 0.85,
                            }}>
                                {item.meaning}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* ── Cinematic Number Reveal ── */}
            {(selected && (aiLoading || meaning)) && (
                <div
                    className="rounded-[22px] p-6 mb-4 animate-fade-up"
                    style={{
                        background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -2px 5px rgba(0,0,0,0.35)',
                    }}
                >
                    {/* Large number display with gold glow */}
                    <div className="text-center mb-4">
                        <p
                            className="font-display text-[48px] leading-none"
                            style={{
                                color: '#F9E491',
                                textShadow: '0 0 30px rgba(212,175,55,0.35), 0 0 60px rgba(212,175,55,0.15)',
                                animation: aiLoading ? 'breathe 4s ease-in-out infinite' : 'none',
                            }}
                        >
                            {selected}
                        </p>
                        {meaning && (
                            <p className="font-display text-[9px] tracking-[3px] uppercase mt-2" style={{
                                color: '#F9E491',
                                opacity: 0.9,
                                textShadow: '0 0 10px rgba(212,175,55,0.08)',
                            }}>
                                {meaning.title}
                            </p>
                        )}
                    </div>

                    {/* Digit-by-digit breakdown */}
                    {digitBreakdown.length > 1 && (
                        <div className="flex justify-center gap-1.5 mb-4">
                            {digitBreakdown.map((d, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl px-2.5 py-1.5 text-center"
                                    style={{
                                        background: 'rgba(197,147,65,0.08)',
                                        border: '1px solid rgba(197,147,65,0.15)',
                                    }}
                                >
                                    <p className="font-display text-xs" style={{ color: '#D4A94E' }}>{d.digit}</p>
                                    <p className="text-[7px] uppercase tracking-[1px]" style={{
                                        color: '#F9E491',
                                        opacity: 0.8,
                                        fontFamily: "'Cinzel', serif",
                                    }}>
                                        {d.meaning}
                                    </p>
                                </div>
                            ))}
                            {hasRepeats && (
                                <div
                                    className="rounded-xl px-2.5 py-1.5 text-center flex items-center"
                                    style={{
                                        background: 'rgba(197,147,65,0.12)',
                                        border: '1px solid rgba(197,147,55,0.2)',
                                    }}
                                >
                                    <p className="text-[7px] uppercase tracking-[1px]" style={{
                                        color: '#F9E491',
                                        fontFamily: "'Cinzel', serif",
                                    }}>
                                        ✦ Amplified
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Loading state */}
                    {aiLoading && (
                        <div className="mt-2">
                            <div className="space-y-2">
                                <div className="h-3 shimmer-skeleton w-full rounded-full" />
                                <div className="h-3 shimmer-skeleton w-[90%] rounded-full" />
                                <div className="h-3 shimmer-skeleton w-[75%] rounded-full" />
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <div className="w-1 h-1 bg-altar-gold/40 rounded-full animate-pulse" />
                                <span className="text-[9px] text-altar-muted/50 italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    Channeling the vibration...
                                </span>
                                <div className="w-1 h-1 bg-altar-gold/40 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                            </div>
                        </div>
                    )}

                    {/* AI Error */}
                    {aiError && !aiLoading && (
                        <p className="text-xs text-red-400/70 text-center mt-2">{aiError}</p>
                    )}

                    {/* Meaning body */}
                    {meaning && !aiLoading && (
                        <>
                            {/* Gold divider */}
                            <div style={{ margin: '0 20px 16px', height: 1, background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent)' }} />

                            <div className="text-xs text-altar-text leading-relaxed space-y-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
                                {meaning.body.split('\n').filter(l => l.trim()).map((line, i) => {
                                    const clean = line.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
                                    const isItalic = clean.startsWith('*') && clean.endsWith('*');
                                    const text = isItalic ? clean.slice(1, -1) : clean;
                                    return isItalic
                                        ? <p key={i} className="italic mt-2" style={{ color: '#F9E491', opacity: 0.9 }}>{text}</p>
                                        : <p key={i}>{text}</p>;
                                })}
                            </div>

                            {/* ── Manifestation Seed: the Create pillar ── */}
                            {meaning.ritual && (
                                <div
                                    className="mt-4 rounded-2xl px-4 py-3.5 text-center animate-fade-up"
                                    style={{
                                        background: 'rgba(197,147,65,0.06)',
                                        border: '1px solid rgba(212,175,55,0.25)',
                                        boxShadow: '0 0 24px rgba(212,175,55,0.06)',
                                    }}
                                >
                                    <p className="font-display text-[8px] tracking-[4px] uppercase mb-2" style={{
                                        color: '#F9E491',
                                        opacity: 0.7,
                                        textShadow: '0 0 10px rgba(212,175,55,0.1)',
                                    }}>
                                        ✦ Manifest ✦
                                    </p>
                                    <p className="text-xs text-altar-text leading-relaxed mb-3" style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontWeight: 300,
                                    }}>
                                        {meaning.ritual}
                                    </p>
                                    <button
                                        onClick={() => {
                                            if (!meaning.ritual || ritualSaved) return;
                                            const manif = createManifestation(meaning.ritual, 'intention', `Angel Number ${selected}`);
                                            // Bridge: save witness event linked to the new manifestation
                                            const witnessEvt = saveWitnessEvent({
                                                type: 'angel_number',
                                                description: `Angel Number ${selected} appeared — created intention`,
                                                linkedManifestationId: manif.id,
                                                angelNumber: selected || undefined,
                                            });
                                            linkWitnessEvent(manif.id, witnessEvt.id);
                                            setRitualSaved(true);
                                        }}
                                        disabled={ritualSaved}
                                        className="w-full py-2.5 rounded-xl text-[11px] font-display tracking-[2px] transition-all active:scale-[0.97]"
                                        style={{
                                            background: ritualSaved
                                                ? 'rgba(74,222,128,0.1)'
                                                : 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.08))',
                                            border: ritualSaved
                                                ? '1px solid rgba(74,222,128,0.3)'
                                                : '1px solid rgba(212,175,55,0.25)',
                                            color: ritualSaved ? '#4ade80' : '#D4A94E',
                                        }}
                                    >
                                        {ritualSaved ? '✓ Saved to Manifestations' : '✨ Save to Manifestations'}
                                    </button>
                                </div>
                            )}

                            {/* Log row */}
                            <div className="flex gap-2 mt-4">
                                <input
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Add a note (optional)..."
                                    className="flex-1 rounded-xl px-3 py-2 text-xs text-altar-text bg-white/5 border border-white/10 focus:outline-none focus:border-altar-gold/30 transition-colors"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                />
                                <button
                                    onClick={logSighting}
                                    className="px-4 py-2 rounded-xl text-xs font-display transition-all active:scale-[0.97]"
                                    style={{
                                        background: 'rgba(197,147,65,0.15)',
                                        color: '#D4A94E',
                                        border: '1px solid rgba(197,147,65,0.25)',
                                    }}
                                >
                                    Log ✓
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Sightings Log ── */}
            {log.length > 0 && (
                <div>
                    <p className="font-display text-[9px] tracking-[5px] uppercase mb-2 text-center" style={{
                        color: '#F9E491',
                        opacity: 0.85,
                        textShadow: '0 0 12px rgba(212,175,55,0.15)',
                    }}>
                        ✦ Your Sightings ✦
                    </p>
                    <div className="rounded-[22px] overflow-hidden" style={{
                        background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)',
                    }}>
                        {(showAll ? log : log.slice(0, 3)).map((s, i) => (
                            <div key={s.id}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${i > 0 ? 'border-t border-white/5' : ''}`}
                                onClick={() => handleSelect(s.number)}>
                                {/* Gold number badge */}
                                <span
                                    className="font-display text-sm shrink-0 rounded-lg px-2 py-1 text-center min-w-[44px]"
                                    style={{
                                        background: 'rgba(197,147,65,0.10)',
                                        color: '#D4A94E',
                                        border: '1px solid rgba(197,147,65,0.2)',
                                    }}
                                >
                                    {s.number}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-altar-text/80" style={{ fontFamily: "'Inter', sans-serif" }}>
                                        Angel Number {s.number}
                                        {sightingCounts[s.number] && sightingCounts[s.number] > 1 && (
                                            <span className="text-altar-gold/60 ml-1">×{sightingCounts[s.number]} this week</span>
                                        )}
                                    </p>
                                    {s.note && <p className="text-[9px] text-altar-text/65 italic truncate">"{s.note}"</p>}
                                </div>
                                <p className="text-[9px] text-altar-muted/70 shrink-0">
                                    {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        ))}
                    </div>
                    {log.length > 3 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="w-full mt-2 text-[10px] font-display text-center transition-colors"
                            style={{ color: '#F9E491', opacity: 0.8 }}
                        >
                            {showAll ? '▴ Show less' : `▾ View all ${log.length} sightings`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
