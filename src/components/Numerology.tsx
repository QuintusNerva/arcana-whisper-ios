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
        </div>
    );
}
