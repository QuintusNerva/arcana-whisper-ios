import React from 'react';
import { BottomNav } from './BottomNav';
import {
    getBirthData, getLifePathNumber, getLifePathMeaning, getPersonalYearNumber,
    getCurrentPersonalYear, getNatalTriad,
} from '../services/astrology.service';
import { AIService, dailyCache } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import { PageHeader } from './PageHeader';

interface NumerologyProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
}

export function Numerology({ onClose, onTabChange, subscription, onShowPremium }: NumerologyProps) {
    const birthData = getBirthData();
    const [manualDate, setManualDate] = React.useState('');
    const dateToUse = birthData?.birthday || manualDate;
    const hasDate = !!dateToUse;

    const lifePathNum = hasDate ? getLifePathNumber(dateToUse) : null;
    const lifePathMeaning = lifePathNum !== null ? getLifePathMeaning(lifePathNum) : null;
    const personalYear = hasDate ? getCurrentPersonalYear(dateToUse) : null;
    const triad = birthData ? getNatalTriad(birthData) : null;

    // Solar year range label for the personal year (e.g. "Dec 2025 – Dec 2026")
    const solarYearLabel = React.useMemo(() => {
        if (!dateToUse) return String(new Date().getFullYear());
        const bday = new Date(dateToUse + 'T12:00:00');
        const today = new Date();
        const thisYearBirthday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const startYear = thisYearBirthday.getTime() - today.getTime() > threeDaysMs
            ? today.getFullYear() - 1 : today.getFullYear();
        return `${startYear}–${startYear + 1}`;
    }, [dateToUse]);
    const isMaster = lifePathNum === 11 || lifePathNum === 22 || lifePathNum === 33;

    const [showPathModal, setShowPathModal] = React.useState(false);
    const [aiPath, setAiPath] = React.useState<{ overview: string; strengths: string; challenges: string; advice: string } | null>(null);
    const [aiPathLoading, setAiPathLoading] = React.useState(false);
    const [showYearModal, setShowYearModal] = React.useState(false);
    const [aiYear, setAiYear] = React.useState<string | null>(null);
    const [aiYearLoading, setAiYearLoading] = React.useState(false);
    const [destinyName, setDestinyName] = React.useState('');
    const [showDestinyModal, setShowDestinyModal] = React.useState(false);
    const [aiDestiny, setAiDestiny] = React.useState<{ overview: string; expressionStyle: string; shadowSide: string; advice: string } | null>(null);
    const [aiDestinyLoading, setAiDestinyLoading] = React.useState(false);

    // Reset AI reading when name changes so it re-fetches with current prompts
    React.useEffect(() => {
        setAiDestiny(null);
    }, [destinyName]);

    // Pythagorean letter-to-number mapping
    const PYTH_MAP: Record<string, number> = {
        A: 1, J: 1, S: 1,
        B: 2, K: 2, T: 2,
        C: 3, L: 3, U: 3,
        D: 4, M: 4, V: 4,
        E: 5, N: 5, W: 5,
        F: 6, O: 6, X: 6,
        G: 7, P: 7, Y: 7,
        H: 8, Q: 8, Z: 8,
        I: 9, R: 9,
    };

    const DESTINY_MEANINGS: Record<number, { title: string; meaning: string }> = {
        1: { title: 'The Initiator', meaning: 'You express your purpose through leadership, independence, and bold originality. You are here to start things others are afraid to begin.' },
        2: { title: 'The Diplomat', meaning: 'You express your purpose through partnership, mediation, and emotional sensitivity. Your gift is bringing balance to every room you enter.' },
        3: { title: 'The Communicator', meaning: 'You express your purpose through creativity, self-expression, and joy. Words, art, and performance are your natural currencies.' },
        4: { title: 'The Builder', meaning: 'You express your purpose through structure, discipline, and steady construction. You turn vision into reality — brick by brick.' },
        5: { title: 'The Freedom Seeker', meaning: 'You express your purpose through adventure, adaptability, and embracing change. You show others what it looks like to live fully alive.' },
        6: { title: 'The Nurturer', meaning: 'You express your purpose through service, healing, and unconditional love. You create safe spaces where others can transform.' },
        7: { title: 'The Truth Seeker', meaning: 'You express your purpose through wisdom, introspection, and spiritual insight. You see what others miss and speak the deep truth.' },
        8: { title: 'The Powerhouse', meaning: 'You express your purpose through mastery, abundance, and wielding influence responsibly. You are here to build something that lasts.' },
        9: { title: 'The Humanitarian', meaning: 'You express your purpose through compassion, global awareness, and selfless service. You close chapters so new ones can open for many.' },
        11: { title: 'The Intuitive Visionary', meaning: 'Master Destiny: You express your purpose through heightened intuition, spiritual inspiration, and illuminating what others cannot see.' },
        22: { title: 'The Master Builder', meaning: 'Master Destiny: You express your purpose by turning visionary ideas into massive real-world impact. You build at a scale others dream about.' },
        33: { title: 'The Master Teacher', meaning: 'Master Destiny: You express your purpose through unconditional love, healing, and uplifting humanity. You teach by embodying the lesson.' },
    };

    const reduceToSingle = (num: number): number => {
        if (num === 11 || num === 22 || num === 33) return num;
        while (num > 9) {
            num = String(num).split('').reduce((a, d) => a + parseInt(d), 0);
            if (num === 11 || num === 22 || num === 33) return num;
        }
        return num;
    };

    const destinyResult = React.useMemo(() => {
        const cleaned = destinyName.trim();
        if (!cleaned) return null;
        const names = cleaned.split(/\s+/).filter(Boolean);
        if (names.length === 0) return null;

        const nameBreakdowns = names.map(name => {
            const letters = name.toUpperCase().split('').filter(c => PYTH_MAP[c]).map(c => ({ letter: c, value: PYTH_MAP[c] }));
            const sum = letters.reduce((a, l) => a + l.value, 0);
            const reduced = reduceToSingle(sum);
            return { name, letters, sum, reduced };
        });

        const total = nameBreakdowns.reduce((a, n) => a + n.reduced, 0);
        const finalNumber = reduceToSingle(total);
        const info = DESTINY_MEANINGS[finalNumber] || DESTINY_MEANINGS[finalNumber > 9 ? (finalNumber % 9 || 9) : finalNumber];

        return {
            number: finalNumber,
            title: info?.title || '',
            meaning: info?.meaning || '',
            names: nameBreakdowns,
        };
    }, [destinyName]);

    const handleDestinyTap = async () => {
        if (!destinyResult) return;
        if (subscription !== 'premium') {
            onShowPremium();
            return;
        }
        setShowDestinyModal(true);
        if (aiDestiny || aiDestinyLoading) return;

        const cacheKey = `destiny_${destinyResult.number}_${destinyName.trim().toLowerCase()}`;
        const cached = dailyCache.get(cacheKey);
        if (cached) {
            try { setAiDestiny(JSON.parse(cached)); return; } catch { }
        }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setAiDestinyLoading(true);
        try {
            const isMasterDestiny = destinyResult.number === 11 || destinyResult.number === 22 || destinyResult.number === 33;
            const hasLifePath = lifePathNum !== null;
            const hasChart = !!triad;

            const systemPrompt = `You are a master numerologist and astrologer giving a deeply personal, INTEGRATED reading that fuses numerology and astrology into one unified cosmic profile.

This is NOT separate sections — it is ONE cohesive narrative where the person's Destiny Number, Life Path Number, and natal chart (Sun, Moon, Rising) are treated as a single interconnected operating system.

You must respond ONLY with valid JSON in this exact format:
{
  "overview": "A structured, deeply personal interpretation (200-280 words) using ## headers. Start with ## Your Cosmic Operating System — explain how their Life Path (purpose) and Destiny Number (expression) interlock. Then ## The Astro-Numerology Fusion — show how their Sun sign amplifies or creates tension with their Destiny Number, how their Moon sign colors the emotional texture of their expression, and how their Rising sign shapes how others receive their Destiny energy. End with ## Living Your Full Blueprint with 2-3 specific, actionable bullet points starting with -. Use **bold** for key terms throughout.",
  "expressionStyle": "4-5 ways this specific Destiny + Life Path + Sun/Moon/Rising combination expresses itself — be very specific to THIS combination, not generic Destiny Number traits. Include how their astrology modifies the numerology. Comma-separated.",
  "shadowSide": "3-4 shadow expressions specific to this combination — where the Destiny Number clashes with their chart, creates blind spots, or amplifies difficult tendencies from their signs. Comma-separated.",
  "advice": "One powerful synthesizing sentence (2-3 lines) that ties Life Path + Destiny + their dominant astrological element into a single guiding principle for their life."
}
Do not include any text outside the JSON.`;

            let userPrompt = `Give an integrated numerology-astrology reading for ${destinyName.trim()}.

DESTINY NUMBER: ${destinyResult.number} ("${destinyResult.title}")${isMasterDestiny ? ' — MASTER DESTINY NUMBER, amplified expression energy' : ''}`;

            if (hasLifePath) {
                userPrompt += `
LIFE PATH: ${lifePathNum}${lifePathMeaning ? ` ("${lifePathMeaning.title}")` : ''}${isMaster ? ' — MASTER NUMBER' : ''}

KEY DYNAMIC: Life Path ${lifePathNum} is their PURPOSE (why they're here). Destiny ${destinyResult.number} is their METHOD (how they'll express it). Show the specific interplay — where do these numbers reinforce each other? Where do they create productive tension? What unique gifts emerge from THIS specific combination that neither number alone would produce?`;
            }

            if (hasChart) {
                userPrompt += `

NATAL CHART:
☀️ Sun: ${triad!.sun.name} (${triad!.sun.element})
🌙 Moon: ${triad!.moon.name} (${triad!.moon.element})
⬆️ Rising: ${triad!.rising.name} (${triad!.rising.element})

INTEGRATION INSTRUCTIONS:
- How does their ${triad!.sun.name} Sun's ${triad!.sun.element} energy channel through Destiny ${destinyResult.number}? Does it amplify or soften it?
- Their ${triad!.moon.name} Moon — how does it emotionally color their Destiny expression? Where does it create internal friction with their number?
- Their ${triad!.rising.name} Rising — how does the world RECEIVE their Destiny energy? Is the Rising aligned or does it mask their true expression?
- What element dominance emerges (fire/earth/air/water) and how does it interact with their numerological frequency?

This should read as ONE unified cosmic profile, not "here's your number" + "here's your chart" stitched together.`;
            } else if (!hasChart && !hasLifePath) {
                userPrompt += `\n\nNo birth chart or Life Path available — focus purely on the Destiny Number's expression through their name vibration.`;
            }

            const raw = await ai.chatPremium(systemPrompt, userPrompt);
            try {
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    setAiDestiny(parsed);
                    dailyCache.set(cacheKey, JSON.stringify(parsed));
                }
            } catch { }
        } catch { }
        finally {
            setAiDestinyLoading(false);
        }
    };

    const handlePathTap = async () => {
        if (subscription !== 'premium') {
            onShowPremium();
            return;
        }
        setShowPathModal(true);
        if (aiPath || aiPathLoading) return;

        // Check daily cache first
        const cached = dailyCache.get(`lifepath_${lifePathNum}`);
        if (cached) {
            try { setAiPath(JSON.parse(cached)); return; } catch { }
        }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setAiPathLoading(true);
        try {
            const systemPrompt = `You are a master numerologist and astrologer giving a deeply personal reading.
You must respond ONLY with valid JSON in this exact format:
{
  "overview": "A structured interpretation using ## headers (## The Theme, ## The Lesson), **bold key terms**, and ending with ## Your Action Steps with 2-3 bullet points starting with - (150-200 words)",
  "strengths": "3-4 key strengths specific to this person's life path + chart combination, comma-separated",
  "challenges": "3-4 key challenges specific to this person's life path + chart combination, comma-separated",
  "advice": "One powerful sentence of guidance that weaves their number and stars together"
}
Do not include any text outside the JSON.`;

            let userPrompt = `Give a personalized Life Path ${lifePathNum} reading.
Life Path title: ${lifePathMeaning?.title || ''}
${isMaster ? 'This is a MASTER NUMBER — emphasize its heightened significance.' : ''}`;

            if (triad) {
                userPrompt += `

This person's natal chart for deeper personalization:
Sun: ${triad.sun.name} (${triad.sun.element})
Moon: ${triad.moon.name} (${triad.moon.element})
Rising: ${triad.rising.name} (${triad.rising.element})

Weave their astrology into the numerology reading — how does their Life Path ${lifePathNum} interact with their ${triad.sun.name} Sun? What unique strengths and challenges emerge from this specific combination?`;
            }

            const raw = await ai.chatPremium(systemPrompt, userPrompt);
            try {
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    setAiPath(parsed);
                    dailyCache.set(`lifepath_${lifePathNum}`, JSON.stringify(parsed));
                }
            } catch { /* use static fallback */ }
        } catch { /* use static fallback */ }
        finally {
            setAiPathLoading(false);
        }
    };

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <PageHeader title="NUMEROLOGY" onClose={onClose} titleSize="lg" />

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Hero */}
                    <div className="text-center mt-6 mb-6 animate-fade-up">
                        <div className="text-4xl mb-2">🔢</div>
                        <h2 className="font-display text-xl text-altar-gold tracking-[3px]">SACRED NUMBERS</h2>
                        <p className="text-sm text-altar-muted mt-2">The universe speaks in mathematics</p>
                    </div>

                    {/* Manual date entry if no birth data */}
                    {!birthData && (
                        <div className="clay-card rounded-3xl p-5 mb-5 animate-fade-up">
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3">Enter Birthday</h3>
                            <input
                                type="date"
                                value={manualDate}
                                onChange={e => setManualDate(e.target.value)}
                                className="w-full clay-inset text-sm text-altar-text rounded-xl px-4 py-3 focus:outline-none transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                            />
                            <p className="text-[10px] text-altar-muted/60 mt-2 italic">
                                💡 Save birth data in your <button onClick={() => onTabChange('natal')} className="text-altar-gold underline">Natal Chart</button> for auto-fill
                            </p>
                        </div>
                    )}

                    {/* Life Path Number */}
                    {hasDate && lifePathNum !== null && lifePathMeaning && (
                        <div className="space-y-4 animate-fade-up">
                            {/* Big number display */}
                            <div className="relative clay-card rounded-3xl overflow-hidden p-8 text-center border border-altar-gold/20">
                                {/* Background glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-altar-gold/5 via-altar-mid/10 to-altar-bright/5 mix-blend-overlay" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-altar-gold/10 blur-[60px]" />

                                <div className="relative">
                                    <p className="text-[10px] font-display text-altar-muted tracking-[3px] uppercase mb-2">Your Life Path</p>
                                    <div className="shimmer-text font-display text-7xl font-bold mb-2">
                                        {lifePathNum}
                                    </div>
                                    {isMaster && (
                                        <span className="inline-block px-3 py-1 rounded-full bg-altar-gold/15 border border-altar-gold/30 text-[10px] text-altar-gold font-display tracking-wide mb-2">
                                            ✦ MASTER NUMBER ✦
                                        </span>
                                    )}
                                    <h3 className="font-display text-xl text-altar-gold tracking-[2px] mt-2">{lifePathMeaning.title}</h3>
                                </div>
                            </div>

                            {/* Meaning card — tappable */}
                            <button
                                onClick={handlePathTap}
                                className="w-full text-left clay-card rounded-3xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3">Your Path</h3>
                                <p className="text-sm text-altar-text/85 leading-relaxed mb-4">{lifePathMeaning.desc}</p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="clay-inset rounded-xl p-3 overflow-hidden">
                                        <p className="text-[9px] font-display text-green-400/70 tracking-[2px] uppercase mb-1.5">Strengths</p>
                                        <ul className="space-y-1">
                                            {lifePathMeaning.strengths.split(',').map((s, i) => (
                                                <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                    <span className="text-green-400/50 shrink-0">·</span>
                                                    <span className="break-words">{s.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="clay-inset rounded-xl p-3 overflow-hidden">
                                        <p className="text-[9px] font-display text-red-400/70 tracking-[2px] uppercase mb-1.5">Challenges</p>
                                        <ul className="space-y-1">
                                            {lifePathMeaning.challenges.split(',').map((s, i) => (
                                                <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                    <span className="text-red-400/50 shrink-0">·</span>
                                                    <span className="break-words">{s.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <p className="text-[8px] text-altar-gold/40 mt-3 font-display text-center">Tap for deep reading ✦</p>
                            </button>

                            {/* Destiny Number Calculator */}
                            <div className="clay-card rounded-3xl p-5 mt-4">
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-1">Destiny Number</h3>
                                <p className="text-[10px] text-altar-muted/50 mb-3">Enter your full birth name to decode your expression</p>
                                <input
                                    type="text"
                                    value={destinyName}
                                    onChange={e => setDestinyName(e.target.value)}
                                    placeholder="Full birth name (first middle last)"
                                    className="w-full clay-inset text-sm text-altar-text rounded-xl px-4 py-3 focus:outline-none mb-3 transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                                />
                                {destinyResult && (
                                    <div className="space-y-3 animate-fade-up" style={{ opacity: 0 }}>
                                        {/* Big number display */}
                                        <div className="relative clay-inset rounded-2xl overflow-hidden p-5 text-center">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-altar-gold/10 blur-[40px]" />
                                            <div className="relative">
                                                <p className="text-[9px] font-display text-altar-muted tracking-[3px] uppercase mb-1">Your Destiny</p>
                                                <div className="shimmer-text font-display text-5xl font-bold mb-1">{destinyResult.number}</div>
                                                {(destinyResult.number === 11 || destinyResult.number === 22 || destinyResult.number === 33) && (
                                                    <span className="inline-block px-2 py-0.5 rounded-full bg-altar-gold/15 border border-altar-gold/30 text-[8px] text-altar-gold font-display tracking-wide mb-1">
                                                        ✦ MASTER DESTINY ✦
                                                    </span>
                                                )}
                                                <p className="text-[11px] text-altar-gold/80 font-display">{destinyResult.title}</p>
                                            </div>
                                        </div>

                                        {/* Letter breakdown */}
                                        <div className="clay-inset rounded-xl p-3">
                                            <p className="text-[9px] font-display text-altar-muted/60 tracking-[2px] uppercase mb-2">Pythagorean Breakdown</p>
                                            <div className="space-y-1.5">
                                                {destinyResult.names.map((n, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <span className="text-[10px] text-altar-text/60 font-display min-w-[60px] uppercase">{n.name}</span>
                                                        <span className="text-[9px] text-altar-muted/40 flex-1 tracking-wide">
                                                            {n.letters.map(l => l.value).join('+')} = {n.sum}
                                                            {n.sum !== n.reduced ? ` → ${n.reduced}` : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Meaning */}
                                        <p className="text-[11px] text-altar-text/70 leading-relaxed">{destinyResult.meaning}</p>

                                        {/* Connection to Life Path */}
                                        {lifePathNum !== null && (
                                            <div className="clay-inset rounded-xl p-3 border border-altar-gold/10">
                                                <p className="text-[9px] font-display text-altar-gold/60 tracking-[2px] uppercase mb-1">Life Path × Destiny</p>
                                                <p className="text-[10px] text-altar-text/60 leading-relaxed">
                                                    Life Path <span className="text-altar-gold font-display">{lifePathNum}</span> reveals your purpose.
                                                    Destiny <span className="text-altar-gold font-display">{destinyResult.number}</span> reveals how you'll express it.
                                                </p>
                                            </div>
                                        )}

                                        {/* Deep Reading CTA */}
                                        <button
                                            onClick={handleDestinyTap}
                                            className="w-full py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
                                                border: '1px solid rgba(212,175,55,0.2)',
                                            }}
                                        >
                                            <span className="text-[11px] font-display text-altar-gold/70 tracking-wide">✦ Tap for AI Deep Reading ✦</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab="home" onTabChange={onTabChange} />



            {/* ── Life Path AI Modal ── */}
            {
                showPathModal && lifePathMeaning && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowPathModal(false)}>
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <div
                            className="relative w-full max-w-[500px] max-h-[85vh] overflow-y-auto clay-card rounded-[2rem] p-6 pb-8 animate-fade-up"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

                            {/* AI indicator */}
                            {(aiPathLoading || aiPath) && (
                                <div className="flex items-center justify-center gap-1.5 mb-3">
                                    <span className="text-[9px] font-display tracking-[2px] uppercase text-altar-gold/50">
                                        {aiPathLoading ? '✦ Consulting the numbers…' : '✦ Deep Interpretation'}
                                    </span>
                                    {aiPathLoading && <span className="inline-block w-3 h-3 border-2 border-altar-gold/30 border-t-altar-gold rounded-full animate-spin" />}
                                </div>
                            )}

                            {/* Header */}
                            <div className="text-center mb-5">
                                <div className="shimmer-text font-display text-5xl font-bold mb-2">{lifePathNum}</div>
                                <h3 className="font-display text-xl text-altar-gold tracking-[3px]">{lifePathMeaning.title}</h3>
                                {isMaster && (
                                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-altar-gold/15 border border-altar-gold/30 text-[10px] text-altar-gold font-display tracking-wide">
                                        ✦ MASTER NUMBER ✦
                                    </span>
                                )}
                                {triad && (
                                    <p className="text-[10px] text-altar-muted mt-2">
                                        ☀️ {triad.sun.name} · 🌙 {triad.moon.name} · ⬆️ {triad.rising.name}
                                    </p>
                                )}
                            </div>

                            {/* Overview */}
                            <div className={`clay-inset rounded-2xl p-4 mb-4 transition-all duration-500`}>
                                {aiPathLoading ? (
                                    <div className="space-y-2.5">
                                        <div className="h-3 shimmer-skeleton w-full" />
                                        <div className="h-3 shimmer-skeleton w-[90%]" />
                                        <div className="h-3 shimmer-skeleton w-[75%]" />
                                    </div>
                                ) : (
                                    <AIResponseRenderer text={aiPath?.overview || lifePathMeaning.desc} />
                                )}
                            </div>

                            {/* Strengths & Challenges */}
                            <div className={`grid grid-cols-2 gap-3 mb-4 transition-all duration-500`}>
                                <div className="clay-inset rounded-xl p-3">
                                    <p className="text-[9px] font-display text-green-400/70 tracking-[2px] uppercase mb-1.5">Strengths</p>
                                    {aiPathLoading ? (
                                        <div className="space-y-2"><div className="h-2.5 shimmer-skeleton w-full" /><div className="h-2.5 shimmer-skeleton w-[70%]" /></div>
                                    ) : (
                                        <ul className="space-y-1 overflow-hidden">
                                            {(aiPath?.strengths || lifePathMeaning.strengths).split(',').map((s: string, i: number) => (
                                                <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                    <span className="text-green-400/50 shrink-0">·</span>
                                                    <span className="break-words">{s.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="clay-inset rounded-xl p-3">
                                    <p className="text-[9px] font-display text-red-400/70 tracking-[2px] uppercase mb-1.5">Challenges</p>
                                    {aiPathLoading ? (
                                        <div className="space-y-2"><div className="h-2.5 shimmer-skeleton w-full" /><div className="h-2.5 shimmer-skeleton w-[65%]" /></div>
                                    ) : (
                                        <ul className="space-y-1 overflow-hidden">
                                            {(aiPath?.challenges || lifePathMeaning.challenges).split(',').map((s: string, i: number) => (
                                                <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                    <span className="text-red-400/50 shrink-0">·</span>
                                                    <span className="break-words">{s.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Advice */}
                            {(aiPath?.advice || aiPathLoading) && (
                                <div className={`clay-card rounded-2xl p-4 mb-4 transition-all duration-500 border border-altar-gold/15`}>
                                    <p className="text-[9px] font-display text-altar-gold/70 tracking-[2px] uppercase mb-1.5">✦ Cosmic Guidance</p>
                                    {aiPathLoading ? (
                                        <div className="space-y-2"><div className="h-3 shimmer-skeleton w-[85%]" /><div className="h-3 shimmer-skeleton w-[50%]" /></div>
                                    ) : (
                                        <AIResponseRenderer text={`"${aiPath?.advice}"`} />
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setShowPathModal(false)}
                                className="w-full py-3 rounded-xl clay-btn"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

            {/* ── Destiny Number AI Modal ── */}
            {showDestinyModal && destinyResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowDestinyModal(false)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-[500px] max-h-[85vh] overflow-y-auto clay-card rounded-[2rem] p-6 pb-8 animate-fade-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

                        {/* AI indicator */}
                        {(aiDestinyLoading || aiDestiny) && (
                            <div className="flex items-center justify-center gap-1.5 mb-3">
                                <span className="text-[9px] font-display tracking-[2px] uppercase text-altar-gold/50">
                                    {aiDestinyLoading ? '✦ Decoding your name…' : '✦ Destiny Interpretation'}
                                </span>
                                {aiDestinyLoading && <span className="inline-block w-3 h-3 border-2 border-altar-gold/30 border-t-altar-gold rounded-full animate-spin" />}
                            </div>
                        )}

                        {/* Header */}
                        <div className="text-center mb-5">
                            <p className="text-[9px] font-display text-altar-muted tracking-[3px] uppercase mb-1">Destiny Number</p>
                            <div className="shimmer-text font-display text-5xl font-bold mb-2">{destinyResult.number}</div>
                            <h3 className="font-display text-xl text-altar-gold tracking-[3px]">{destinyResult.title}</h3>
                            {(destinyResult.number === 11 || destinyResult.number === 22 || destinyResult.number === 33) && (
                                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-altar-gold/15 border border-altar-gold/30 text-[10px] text-altar-gold font-display tracking-wide">
                                    ✦ MASTER DESTINY ✦
                                </span>
                            )}
                            <p className="text-[10px] text-altar-muted/50 mt-2 uppercase tracking-wider">{destinyName.trim()}</p>
                            {triad && (
                                <p className="text-[10px] text-altar-muted mt-1">
                                    ☀️ {triad.sun.name} · 🌙 {triad.moon.name} · ⬆️ {triad.rising.name}
                                </p>
                            )}
                        </div>

                        {/* Overview */}
                        <div className="clay-inset rounded-2xl p-4 mb-4 transition-all duration-500">
                            {aiDestinyLoading ? (
                                <div className="space-y-2.5">
                                    <div className="h-3 shimmer-skeleton w-full" />
                                    <div className="h-3 shimmer-skeleton w-[90%]" />
                                    <div className="h-3 shimmer-skeleton w-[75%]" />
                                </div>
                            ) : (
                                <AIResponseRenderer text={aiDestiny?.overview || destinyResult.meaning} />
                            )}
                        </div>

                        {/* Expression Style & Shadow Side */}
                        <div className="grid grid-cols-2 gap-3 mb-4 transition-all duration-500">
                            <div className="clay-inset rounded-xl p-3">
                                <p className="text-[9px] font-display text-purple-400/70 tracking-[2px] uppercase mb-1.5">Expression Style</p>
                                {aiDestinyLoading ? (
                                    <div className="space-y-2"><div className="h-2.5 shimmer-skeleton w-full" /><div className="h-2.5 shimmer-skeleton w-[70%]" /></div>
                                ) : (
                                    <ul className="space-y-1 overflow-hidden">
                                        {(aiDestiny?.expressionStyle || 'Leadership, creativity, service').split(',').map((s: string, i: number) => (
                                            <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                <span className="text-purple-400/50 shrink-0">·</span>
                                                <span className="break-words">{s.trim()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="clay-inset rounded-xl p-3">
                                <p className="text-[9px] font-display text-amber-400/70 tracking-[2px] uppercase mb-1.5">Shadow Side</p>
                                {aiDestinyLoading ? (
                                    <div className="space-y-2"><div className="h-2.5 shimmer-skeleton w-full" /><div className="h-2.5 shimmer-skeleton w-[65%]" /></div>
                                ) : (
                                    <ul className="space-y-1 overflow-hidden">
                                        {(aiDestiny?.shadowSide || 'Overgiving, self-neglect').split(',').map((s: string, i: number) => (
                                            <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                <span className="text-amber-400/50 shrink-0">·</span>
                                                <span className="break-words">{s.trim()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Life Path × Destiny Advice */}
                        {(aiDestiny?.advice || aiDestinyLoading) && (
                            <div className="clay-card rounded-2xl p-4 mb-4 transition-all duration-500 border border-altar-gold/15">
                                <p className="text-[9px] font-display text-altar-gold/70 tracking-[2px] uppercase mb-1.5">✦ Life Path × Destiny</p>
                                {aiDestinyLoading ? (
                                    <div className="space-y-2"><div className="h-3 shimmer-skeleton w-[85%]" /><div className="h-3 shimmer-skeleton w-[50%]" /></div>
                                ) : (
                                    <AIResponseRenderer text={`"${aiDestiny?.advice}"`} />
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setShowDestinyModal(false)}
                            className="w-full py-3 rounded-xl clay-btn"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
