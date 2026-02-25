import { safeStorage } from "../services/storage.service";
import React from 'react';
import { BottomNav } from './BottomNav';
import {
    getBirthData, getSunSign, getCoupleCompatibility, ZODIAC_SIGNS,
    CoupleReport, SignMatch,
} from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';

interface CompatibilityProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

const QUALITY_COLORS: Record<string, string> = {
    perfect: 'text-green-400',
    great: 'text-emerald-400',
    good: 'text-blue-400',
    neutral: 'text-altar-muted',
    challenging: 'text-amber-400',
};

const QUALITY_LABELS: Record<string, string> = {
    perfect: '✦ Perfect',
    great: '♡ Great',
    good: '◇ Good',
    neutral: '○ Neutral',
    challenging: '△ Growth',
};

const ELEMENT_ICONS: Record<string, { emoji: string; color: string }> = {
    fire: { emoji: '🔥', color: 'from-orange-500/20 to-red-500/20 border-orange-500/30' },
    earth: { emoji: '🌿', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
    air: { emoji: '💨', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30' },
    water: { emoji: '🌊', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
};

function ScoreRing({ score, tier }: { score: number; tier: string }) {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;
    const [animated, setAnimated] = React.useState(false);

    React.useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 300);
        return () => clearTimeout(t);
    }, []);

    const scoreColor = score >= 85 ? '#FFD700' : score >= 72 ? '#4ade80' : score >= 60 ? '#60a5fa' : score >= 45 ? '#c084fc' : '#f59e0b';

    return (
        <div className="relative inline-flex flex-col items-center">
            <svg width="140" height="140" className="transform -rotate-90">
                <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                    cx="70" cy="70" r="54" fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={animated ? offset : circumference}
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 8px ${scoreColor}60)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold" style={{ color: scoreColor }}>{animated ? score : 0}</span>
                <span className="text-[9px] text-altar-muted font-display tracking-[1px] uppercase">/ 100</span>
            </div>
            <p className="font-display text-sm tracking-[2px] uppercase mt-2" style={{ color: scoreColor }}>{tier}</p>
        </div>
    );
}

function MatchRow({ label, match }: { label: string; match: SignMatch }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-[10px] text-altar-muted font-display tracking-[2px] uppercase w-16">{label}</span>
            <div className="flex items-center gap-3 flex-1 justify-center">
                <div className="text-center">
                    <span className="text-xl block">{match.userSign.glyph}</span>
                    <span className="text-[9px] text-altar-text/70 font-display">{match.userSign.name}</span>
                </div>
                <span className="text-altar-muted/40 text-xs">×</span>
                <div className="text-center">
                    <span className="text-xl block">{match.partnerSign.glyph}</span>
                    <span className="text-[9px] text-altar-text/70 font-display">{match.partnerSign.name}</span>
                </div>
            </div>
            <span className={`text-[10px] font-display tracking-wide ${QUALITY_COLORS[match.quality]}`}>
                {QUALITY_LABELS[match.quality]}
            </span>
        </div>
    );
}

export function Compatibility({ onClose, onTabChange }: CompatibilityProps) {
    const birthData = getBirthData();

    // Saved partner data
    const savedPartner = React.useMemo(() => {
        try {
            const raw = safeStorage.getItem('arcana_partner');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }, []);

    const [partnerName, setPartnerName] = React.useState(savedPartner?.name || '');
    const [partnerBirthday, setPartnerBirthday] = React.useState(savedPartner?.birthday || '');
    const [report, setReport] = React.useState<CoupleReport | null>(null);
    const [aiReading, setAiReading] = React.useState<string | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);

    // Auto-show results if partner data was saved
    React.useEffect(() => {
        if (savedPartner?.birthday && birthData) {
            const r = getCoupleCompatibility(birthData, savedPartner.birthday);
            setReport(r);
        }
    }, []);

    const handleReveal = () => {
        if (!birthData || !partnerBirthday) return;
        const r = getCoupleCompatibility(birthData, partnerBirthday);
        setReport(r);
        // Save partner data
        safeStorage.setItem('arcana_partner', JSON.stringify({ name: partnerName.trim(), birthday: partnerBirthday }));
    };

    // Fire AI reading when report is generated
    React.useEffect(() => {
        if (!report) return;
        const cacheKey = `ai_couple_${report.userTriad.sun.id}_${report.partnerTriad.sun.id}`;
        try {
            const cached = safeStorage.getItem(cacheKey);
            if (cached) { setAiReading(cached); return; }
        } catch { /* */ }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setAiLoading(true);
        let cancelled = false;

        (async () => {
            try {
                const result = await ai.getRelationshipSynthesis(
                    report.userTriad, report.partnerTriad,
                    report.overallScore, report.tier
                );
                if (!cancelled) {
                    const cleaned = result.replace(/^["']|["']$/g, '').trim();
                    setAiReading(cleaned);
                    try { safeStorage.setItem(cacheKey, cleaned); } catch { /* */ }
                }
            } catch { /* fallback to static */ }
            finally { if (!cancelled) setAiLoading(false); }
        })();

        return () => { cancelled = true; };
    }, [report]);

    const partnerSign = partnerBirthday ? getSunSign(partnerBirthday) : null;
    const userSign = birthData ? getSunSign(birthData.birthday) : null;

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">← Altar</button>
                        <h1 className="font-display text-lg text-altar-gold tracking-[4px]">COMPATIBILITY</h1>
                        <div className="w-12" />
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {!report ? (
                        /* ── STEP 1: Partner Input ── */
                        <div className="animate-fade-up">
                            <div className="text-center mt-8 mb-8">
                                <span className="text-5xl block mb-3">💞</span>
                                <h2 className="font-display text-xl text-altar-gold tracking-[3px]">COUPLE CHARTS</h2>
                                <p className="text-sm text-altar-muted mt-2">Discover the cosmic bond between you</p>
                            </div>

                            {/* Your sign */}
                            {userSign && (
                                <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-3 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                                    <span className="text-3xl">{userSign.glyph}</span>
                                    <div>
                                        <p className="text-xs text-altar-muted font-display tracking-[2px] uppercase">You</p>
                                        <p className="font-display text-altar-gold">{userSign.name}</p>
                                    </div>
                                </div>
                            )}

                            {/* Partner input */}
                            <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                                <label className="block font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">
                                    Partner's Name
                                </label>
                                <input
                                    type="text"
                                    value={partnerName}
                                    onChange={(e) => setPartnerName(e.target.value)}
                                    placeholder="Their name…"
                                    className="w-full bg-transparent text-altar-text placeholder-altar-muted/50 text-sm focus:outline-none border-b border-altar-gold/20 focus:border-altar-gold/50 transition-colors pb-3 mb-5"
                                />

                                <label className="block font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">
                                    Partner's Birthday
                                </label>
                                <input
                                    type="date"
                                    value={partnerBirthday}
                                    onChange={(e) => setPartnerBirthday(e.target.value)}
                                    className="w-full bg-transparent text-altar-text text-sm focus:outline-none border-b border-altar-gold/20 focus:border-altar-gold/50 transition-colors pb-3 [color-scheme:dark]"
                                />
                            </div>

                            {/* Partner sign preview */}
                            {partnerSign && partnerBirthday && (
                                <div className="glass rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-up">
                                    <span className="text-3xl">{partnerSign.glyph}</span>
                                    <div>
                                        <p className="text-xs text-altar-muted font-display tracking-[2px] uppercase">{partnerName || 'Partner'}</p>
                                        <p className="font-display text-altar-gold">{partnerSign.name}</p>
                                    </div>
                                </div>
                            )}

                            {/* Reveal button */}
                            <button
                                onClick={handleReveal}
                                disabled={!partnerBirthday || !birthData}
                                className={`w-full py-4 rounded-2xl font-display font-semibold text-base tracking-wide transition-all duration-300 animate-fade-up ${partnerBirthday && birthData
                                    ? 'bg-gradient-to-r from-pink-500/80 via-rose-500/80 to-pink-500/80 text-white hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:scale-[1.01] active:scale-[0.99]'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                                    }`}
                                style={{ animationDelay: '0.35s', opacity: 0 }}
                            >
                                ✦ Reveal Our Connection ✦
                            </button>
                        </div>
                    ) : (
                        /* ── STEP 2: Results ── */
                        <div className="animate-fade-up">
                            {/* Header — Both signs */}
                            <div className="flex items-center justify-center gap-6 mt-6 mb-2 animate-fade-up">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-altar-mid to-altar-bright flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(139,95,191,0.3)]">
                                        {report.userTriad.sun.glyph}
                                    </div>
                                    <p className="font-display text-xs text-altar-gold mt-2">{report.userTriad.sun.name}</p>
                                    <p className="text-[9px] text-altar-muted">You</p>
                                </div>
                                <span className="text-2xl text-pink-400/60">💞</span>
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                                        {report.partnerTriad.sun.glyph}
                                    </div>
                                    <p className="font-display text-xs text-altar-gold mt-2">{report.partnerTriad.sun.name}</p>
                                    <p className="text-[9px] text-altar-muted">{partnerName || 'Partner'}</p>
                                </div>
                            </div>

                            {/* Cosmic Score */}
                            <div className="text-center my-6 animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                                <ScoreRing score={report.overallScore} tier={report.tier} />
                            </div>

                            {/* Triad Comparison */}
                            <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                    <span className="text-altar-gold">✦</span> Triad Comparison
                                </h3>
                                <MatchRow label="Sun" match={report.sunMatch} />
                                <MatchRow label="Moon" match={report.moonMatch} />
                                <MatchRow label="Rising" match={report.risingMatch} />
                            </div>

                            {/* Element Wheel */}
                            <div className="glass rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                    <span className="text-altar-gold">✦</span> Element Balance
                                </h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(report.elementBalance).map(([elem, count]) => {
                                        const info = ELEMENT_ICONS[elem];
                                        const maxCount = 6;
                                        const pct = (count / maxCount) * 100;
                                        return (
                                            <div key={elem} className={`rounded-xl p-3 text-center bg-gradient-to-br ${info.color} border`}>
                                                <span className="text-lg block">{info.emoji}</span>
                                                <p className="font-display text-xs text-altar-gold mt-1">{count}/6</p>
                                                <div className="w-full h-1 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-altar-gold/60 transition-all duration-1000"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase mt-1">{elem}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Relationship Reading */}
                            <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.45s', opacity: 0 }}>
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                    <span className="text-altar-gold">✦</span> Your Connection
                                </h3>
                                {aiLoading ? (
                                    <div className="space-y-2.5 py-1">
                                        <div className="h-3 shimmer-skeleton w-full" />
                                        <div className="h-3 shimmer-skeleton w-[93%]" />
                                        <div className="h-3 shimmer-skeleton w-[82%]" />
                                        <div className="h-3 shimmer-skeleton w-[68%]" />
                                    </div>
                                ) : (
                                    <AIResponseRenderer text={aiReading || `The ${report.userTriad.sun.name}–${report.partnerTriad.sun.name} bond is one of ${report.tier.toLowerCase()}. Your combined energies create a dynamic where ${report.strengths[0]?.toLowerCase() || 'understanding flows naturally'}. Together, you are stronger than apart.`} />
                                )}
                            </div>

                            {/* Strengths & Growth */}
                            <div className="grid grid-cols-2 gap-2.5 mb-4 animate-fade-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
                                <div className="rounded-2xl p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                    <h4 className="font-display text-[9px] text-green-400/80 tracking-[2px] uppercase mb-2">Strengths</h4>
                                    <ul className="space-y-2">
                                        {report.strengths.map((s, i) => (
                                            <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1.5">
                                                <span className="text-green-400/60 shrink-0">♡</span>
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                    <h4 className="font-display text-[9px] text-amber-400/80 tracking-[2px] uppercase mb-2">Growth Edges</h4>
                                    <ul className="space-y-2">
                                        {report.growthEdges.map((e, i) => (
                                            <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1.5">
                                                <span className="text-amber-400/60 shrink-0">△</span>
                                                <span>{e}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Try another partner */}
                            <button
                                onClick={() => { setReport(null); setAiReading(null); setPartnerName(''); setPartnerBirthday(''); safeStorage.removeItem('arcana_partner'); }}
                                className="w-full py-3 rounded-2xl glass border border-white/5 text-center hover:border-altar-gold/20 transition-all text-sm font-display text-altar-muted tracking-wide mb-5"
                            >
                                Try Another Match →
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab="home" onTabChange={onTabChange} />
        </div>
    );
}
