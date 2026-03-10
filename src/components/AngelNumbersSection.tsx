import React from 'react';
import { safeStorage } from '../services/storage.service';
import { AIService } from '../services/ai.service';
import { getBirthData, getNatalTriad, getLifePathNumber, getCurrentPersonalYear } from '../services/astrology.service';

const ANGEL_LOG_KEY = 'arcana_angel_log';
const ANGEL_MEANING_CACHE_KEY = 'arcana_angel_meanings';

// Session cache for AI meanings (keyed by number string — meanings don't expire daily)
function getMeaningCache(): Record<string, string> {
    try { return JSON.parse(safeStorage.getItem(ANGEL_MEANING_CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveMeaningCache(c: Record<string, string>) {
    safeStorage.setItem(ANGEL_MEANING_CACHE_KEY, JSON.stringify(c));
}

interface AngelSighting { id: string; number: string; timestamp: string; note?: string; }
function getLog(): AngelSighting[] { try { return JSON.parse(safeStorage.getItem(ANGEL_LOG_KEY) || '[]'); } catch { return []; } }
function saveLog(l: AngelSighting[]) { safeStorage.setItem(ANGEL_LOG_KEY, JSON.stringify(l)); }



interface MeaningResult { title: string; body: string; }

function parseMeaning(raw: string): MeaningResult {
    // Try to extract a title from first line if AI returns "## Title" or "**Title**"
    const lines = raw.trim().split('\n').filter(l => l.trim());
    let title = 'Angel Number';
    let body = raw.trim();

    const firstLine = lines[0]?.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    if (firstLine && firstLine.length < 60 && !firstLine.endsWith('.')) {
        title = firstLine;
        body = lines.slice(1).join('\n').trim();
    }
    return { title, body };
}

export function AngelNumbersSection() {
    const [log, setLog] = React.useState<AngelSighting[]>(() => getLog());
    const [selected, setSelected] = React.useState<string | null>(null);
    const [customInput, setCustomInput] = React.useState('');
    const [meaning, setMeaning] = React.useState<MeaningResult | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [aiError, setAiError] = React.useState<string | null>(null);
    const [note, setNote] = React.useState('');
    const [expanded, setExpanded] = React.useState(false);
    const [showAll, setShowAll] = React.useState(false);

    const fetchMeaning = async (num: string) => {
        // Check local cache first
        const cache = getMeaningCache();
        if (cache[num]) {
            setMeaning(parseMeaning(cache[num]));
            return;
        }

        const ai = new AIService();
        if (!ai.hasApiKey()) {
            // Graceful no-key fallback
            setMeaning({
                title: `Angel Number ${num}`,
                body: `You noticed ${num}. In angel number traditions, each digit carries vibration — ${num.split('').join(' + ')} together form a message from the universe. Add your API key in Settings for a personalized AI reading.`,
            });
            return;
        }

        setAiLoading(true);
        setAiError(null);
        setMeaning(null);

        try {
            // Build optional chart context
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

            const raw = await ai.getAngelNumberMeaning(num, chartContext);

            // Cache it
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
        if (selected === num) {
            // Deselect
            setSelected(null);
            setMeaning(null);
            return;
        }
        setSelected(num);
        fetchMeaning(num);
    };

    const handleCustomSubmit = () => {
        const num = customInput.trim().replace(/\D/g, '');
        if (!num || num.length < 2) return;
        setSelected(num);
        setCustomInput('');
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
        setSelected(null);
        setMeaning(null);
        setNote('');

    };

    return (
        <div className="mx-5 mb-5 animate-fade-up" style={{ animationDelay: '0.38s', opacity: 0 }}>


            {/* Input panel — always visible */}
            <div className="rounded-3xl p-4 mb-3" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>

                <div className="flex gap-2">
                    <input
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                        inputMode="numeric"
                        placeholder="e.g. 1717, 2121, 515..."
                        className="flex-1 rounded-xl px-3 py-2.5 text-sm text-altar-text bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/40 font-display tracking-widest text-center"
                    />
                    <button
                        onClick={handleCustomSubmit}
                        disabled={!customInput.trim()}
                        className="px-4 py-2.5 rounded-xl text-xs font-display text-indigo-300 disabled:opacity-40 transition-all"
                        style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                        Reveal →
                    </button>
                </div>

                {/* AI loading skeleton */}
                {aiLoading && (
                    <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div className="text-center mb-3">
                            <p className="font-display text-2xl text-altar-gold">{selected}</p>
                            <div className="h-2 shimmer-skeleton w-28 mx-auto mt-2 rounded-full" />
                        </div>
                        <div className="space-y-2 mt-3">
                            <div className="h-3 shimmer-skeleton w-full rounded-full" />
                            <div className="h-3 shimmer-skeleton w-[90%] rounded-full" />
                            <div className="h-3 shimmer-skeleton w-[80%] rounded-full" />
                            <div className="h-3 shimmer-skeleton w-[70%] rounded-full" />
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <div className="w-1 h-1 bg-indigo-400/60 rounded-full animate-pulse" />
                            <span className="text-[9px] text-altar-muted/50 italic">Channeling the vibration...</span>
                            <div className="w-1 h-1 bg-indigo-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </div>
                    </div>
                )}

                {/* AI error */}
                {aiError && !aiLoading && (
                    <p className="text-xs text-red-400/70 text-center mt-3">{aiError}</p>
                )}

                {/* Meaning card */}
                {meaning && selected && !aiLoading && (
                    <div className="mt-4 rounded-2xl p-4" style={{ background: 'linear-gradient(145deg,rgba(99,102,241,0.1),rgba(13,6,24,0.97))', border: '1px solid rgba(99,102,241,0.22)' }}>
                        {/* Number + title */}
                        <div className="text-center mb-3">
                            <p className="font-display text-2xl text-altar-gold">{selected}</p>
                            <p className="text-[9px] text-indigo-400/60 font-display tracking-[3px] uppercase mt-0.5">{meaning.title}</p>
                        </div>

                        {/* Meaning body — render with italic detection for reflection question */}
                        <div className="text-xs text-altar-text/85 leading-relaxed mb-3 space-y-2">
                            {meaning.body.split('\n').filter(l => l.trim()).map((line, i) => {
                                const clean = line.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
                                const isItalic = clean.startsWith('*') && clean.endsWith('*');
                                const text = isItalic ? clean.slice(1, -1) : clean;
                                return isItalic
                                    ? <p key={i} className="italic text-indigo-300/70 text-[11px] mt-2">{text}</p>
                                    : <p key={i}>{text}</p>;
                            })}
                        </div>

                        {/* Log row */}
                        <div className="flex gap-2 mt-3">
                            <input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Add a note (optional)..."
                                className="flex-1 rounded-xl px-3 py-2 text-xs text-altar-text bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/40"
                            />
                            <button
                                onClick={logSighting}
                                className="px-4 py-2 rounded-xl text-xs font-display text-indigo-300"
                                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
                            >
                                Log ✓
                            </button>
                        </div>
                    </div>
                )}
            </div>




            {/* Recent sightings */}
            {log.length > 0 && (
                <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {(showAll ? log : log.slice(0, 3)).map((s, i) => (
                        <div key={s.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${i > 0 ? 'border-t border-white/5' : ''}`}
                            onClick={() => { setSelected(s.number); fetchMeaning(s.number); }}>
                            <span className="font-display text-indigo-300 text-sm w-10 text-center shrink-0">{s.number}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-altar-muted">Angel Number {s.number}</p>
                                {s.note && <p className="text-[9px] text-altar-text/40 italic truncate">"{s.note}"</p>}
                            </div>
                            <p className="text-[9px] text-altar-muted/40 shrink-0">
                                {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
