import { safeStorage } from "../services/storage.service";
import React from 'react';
import { BottomNav } from './BottomNav';
import { AIResponseRenderer } from './AIResponseRenderer';
import { getTransitFeed, TransitHit, formatTransitShort, formatTransitDetail } from '../services/transit.service';
import { AIService } from '../services/ai.service';
import { getBirthData, getNatalTriad } from '../services/astrology.service';

interface TransitFeedProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

/** Transit card — one per detected transit hit */
function TransitCard({ hit, interpretation, isLoading }: {
    hit: TransitHit;
    interpretation: string | null;
    isLoading: boolean;
}) {
    const [expanded, setExpanded] = React.useState(false);

    const natureColor = hit.aspect.nature === 'harmonious'
        ? { border: 'border-emerald-500/20', bg: 'from-emerald-500/8 to-emerald-900/5', badge: 'bg-emerald-500/15 text-emerald-300', label: '✨ Harmonious' }
        : hit.aspect.nature === 'challenging'
            ? { border: 'border-amber-500/20', bg: 'from-amber-500/8 to-red-900/5', badge: 'bg-amber-500/15 text-amber-300', label: '🔥 Challenging' }
            : { border: 'border-violet-500/20', bg: 'from-violet-500/8 to-purple-900/5', badge: 'bg-violet-500/15 text-violet-300', label: '⚡ Powerful' };

    const sigBadge = hit.significance === 'major'
        ? { bg: 'bg-red-500/15 text-red-300', label: 'Major' }
        : hit.significance === 'moderate'
            ? { bg: 'bg-yellow-500/15 text-yellow-300', label: 'Moderate' }
            : null;

    return (
        <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full text-left rounded-2xl border ${natureColor.border} bg-gradient-to-br ${natureColor.bg} p-4 transition-all hover:border-altar-gold/20 active:scale-[0.99]`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{hit.transitPlanet.glyph}</span>
                    <div className="min-w-0">
                        <p className="font-display text-sm text-altar-text font-semibold truncate">
                            {hit.transitPlanet.name} {hit.aspect.symbol} your {hit.natalPlanet.name}
                        </p>
                        <p className="text-[10px] text-altar-muted mt-0.5">
                            {formatTransitDetail(hit)}
                        </p>
                    </div>
                </div>
                <span className="text-altar-muted text-xs shrink-0">{expanded ? '▾' : '▸'}</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${natureColor.badge} font-display`}>
                    {natureColor.label}
                </span>
                {hit.isExactToday && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-altar-gold/20 text-altar-gold font-display animate-pulse">
                        ⚡ EXACT TODAY
                    </span>
                )}
                {sigBadge && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${sigBadge.bg} font-display`}>
                        {sigBadge.label}
                    </span>
                )}
                <span className="text-[9px] text-altar-muted">
                    Orb: {hit.orb}° · {hit.isApplying ? 'Approaching ↗' : 'Separating ↘'}
                </span>
            </div>

            {/* AI Interpretation */}
            {expanded && (
                <div className="mt-3 pt-3 border-t border-white/5">
                    {isLoading ? (
                        <div className="space-y-2 py-1">
                            <div className="h-3 shimmer-skeleton w-full" />
                            <div className="h-3 shimmer-skeleton w-[85%]" />
                            <div className="h-3 shimmer-skeleton w-[60%]" />
                        </div>
                    ) : interpretation ? (
                        <p className="text-xs text-altar-text/80 leading-relaxed italic">
                            "{interpretation}"
                        </p>
                    ) : (
                        <p className="text-[10px] text-altar-muted italic">
                            Tap to reveal the cosmic interpretation...
                        </p>
                    )}
                </div>
            )}
        </button>
    );
}

export function TransitFeed({ onClose, onTabChange }: TransitFeedProps) {
    const [feed, setFeed] = React.useState<ReturnType<typeof getTransitFeed> | null>(null);
    const [interpretations, setInterpretations] = React.useState<Record<string, string>>({});
    const [loadingKeys, setLoadingKeys] = React.useState<Set<string>>(new Set());

    const today = new Date();
    const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Load transit feed
    React.useEffect(() => {
        const data = getTransitFeed();
        setFeed(data);
    }, []);

    // Load AI interpretation for a transit
    const loadInterpretation = React.useCallback(async (hit: TransitHit) => {
        const key = `${hit.transitPlanet.id}-${hit.natalPlanet.id}-${hit.aspect.name}`;
        if (interpretations[key] || loadingKeys.has(key)) return;

        // Check localStorage cache first
        const cacheKey = `transit_ai_${today.toISOString().slice(0, 10)}_${key}`;
        try {
            const cached = safeStorage.getItem(cacheKey);
            if (cached) {
                setInterpretations(prev => ({ ...prev, [key]: cached }));
                return;
            }
        } catch { /* */ }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setLoadingKeys(prev => new Set(prev).add(key));

        try {
            const birthData = getBirthData();
            let triadContext: { sun?: string; moon?: string; rising?: string } | undefined;
            if (birthData) {
                const triad = getNatalTriad(birthData);
                triadContext = { sun: triad.sun.name, moon: triad.moon.name, rising: triad.rising.name };
            }

            const result = await ai.getTransitInterpretation(
                hit.transitPlanet,
                hit.natalPlanet,
                hit.aspect,
                hit.orb,
                hit.isApplying,
                triadContext,
            );

            const cleaned = result.replace(/^["']|["']$/g, '').trim();
            setInterpretations(prev => ({ ...prev, [key]: cleaned }));
            try { safeStorage.setItem(cacheKey, cleaned); } catch { /* */ }
        } catch (err) {
            console.error('Transit AI error:', err);
        } finally {
            setLoadingKeys(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }, [interpretations, loadingKeys]);

    // Auto-load top 2 active transit interpretations
    React.useEffect(() => {
        if (!feed) return;
        const topHits = feed.active.slice(0, 2);
        for (const hit of topHits) {
            loadInterpretation(hit);
        }
    }, [feed]);

    if (!feed) {
        return (
            <div className="page-frame">
                <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-4xl animate-float mb-3">🌌</div>
                        <p className="text-xs text-altar-muted animate-pulse">Scanning the cosmic weather...</p>
                    </div>
                </div>
            </div>
        );
    }

    // No birth data
    if (!feed.hasBirthData) {
        return (
            <div className="page-frame">
                <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                    <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                        <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                            <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">← Altar</button>
                            <h1 className="font-display text-lg text-altar-gold tracking-[4px]">COSMOS</h1>
                            <div className="w-12" />
                        </div>
                    </header>
                    <div className="max-w-[500px] mx-auto px-4 pt-16 text-center">
                        <div className="text-5xl mb-4">🌌</div>
                        <h2 className="font-display text-xl text-altar-gold mb-2">Unlock Cosmic Weather</h2>
                        <p className="text-sm text-altar-muted leading-relaxed mb-6">
                            Enter your birth details to receive personalized transit alerts — real planetary movements hitting YOUR specific chart.
                        </p>
                        <button
                            onClick={() => onTabChange('profile')}
                            className="px-6 py-3 rounded-xl bg-altar-gold/10 border border-altar-gold/30 text-altar-gold font-display text-sm hover:border-altar-gold/60 transition-all"
                        >
                            Enter Birth Details →
                        </button>
                    </div>
                </div>
                <BottomNav currentTab="cosmos" onTabChange={onTabChange} />
            </div>
        );
    }

    const totalActive = feed.active.length;
    const hasExact = feed.active.some(h => h.isExactToday);

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">← Altar</button>
                        <h1 className="font-display text-lg text-altar-gold tracking-[4px]">COSMOS</h1>
                        <div className="w-12" />
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Hero */}
                    <div className="text-center mt-6 mb-5 animate-fade-up">
                        <div className="relative inline-block">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600/40 to-violet-800/40 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                                🌌
                            </div>
                            {hasExact && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-altar-gold flex items-center justify-center text-[10px] animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                                    ⚡
                                </div>
                            )}
                        </div>
                        <h2 className="font-display text-xl text-altar-gold tracking-[3px] mt-3">Cosmic Weather</h2>
                        <p className="text-xs text-altar-muted mt-1">{dateLabel}</p>
                        <p className="text-[10px] text-altar-muted/70 mt-0.5">
                            {totalActive} active transit{totalActive !== 1 ? 's' : ''} hitting your chart
                        </p>
                    </div>

                    {/* ── ACTIVE NOW ── */}
                    {feed.active.length > 0 && (
                        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                <span className="text-altar-gold">⚡</span> Active Now
                            </h3>
                            <div className="space-y-2.5">
                                {feed.active.map((hit, i) => {
                                    const key = `${hit.transitPlanet.id}-${hit.natalPlanet.id}-${hit.aspect.name}`;
                                    return (
                                        <div key={key} onClick={() => loadInterpretation(hit)}>
                                            <TransitCard
                                                hit={hit}
                                                interpretation={interpretations[key] || null}
                                                isLoading={loadingKeys.has(key)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* No active transits message */}
                    {feed.active.length === 0 && (
                        <div className="mb-5 animate-fade-up glass rounded-2xl p-5 text-center" style={{ animationDelay: '0.15s', opacity: 0 }}>
                            <p className="text-2xl mb-2">🌙</p>
                            <p className="text-sm text-altar-text/70">The skies are quiet today.</p>
                            <p className="text-[10px] text-altar-muted mt-1">No major transits are hitting your chart right now.</p>
                        </div>
                    )}

                    {/* ── COMING THIS WEEK ── */}
                    {feed.coming.length > 0 && (
                        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                <span className="text-blue-400">📅</span> Coming This Week
                            </h3>
                            <div className="space-y-2">
                                {feed.coming.slice(0, 5).map((hit) => {
                                    const key = `coming-${hit.transitPlanet.id}-${hit.natalPlanet.id}-${hit.aspect.name}`;
                                    const peakDate = new Date(hit.peakDate + 'T12:00:00');
                                    const dayLabel = peakDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                                    return (
                                        <div
                                            key={key}
                                            className="rounded-xl border border-white/5 bg-altar-deep/40 p-3 flex items-center gap-3"
                                        >
                                            <span className="text-xl shrink-0">{hit.transitPlanet.glyph}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-altar-text/80 font-display truncate">
                                                    {hit.transitPlanet.name} {hit.aspect.symbol} your {hit.natalPlanet.name}
                                                </p>
                                                <p className="text-[10px] text-altar-muted">{dayLabel} · {hit.aspect.nature}</p>
                                            </div>
                                            {hit.significance === 'major' && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-300 shrink-0">Major</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── RECENTLY PASSED ── */}
                    {feed.passed.length > 0 && (
                        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.45s', opacity: 0 }}>
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                <span className="text-altar-muted/60">🕐</span> Recently Passed
                            </h3>
                            <div className="space-y-2 opacity-60">
                                {feed.passed.slice(0, 3).map((hit) => {
                                    const key = `passed-${hit.transitPlanet.id}-${hit.natalPlanet.id}-${hit.aspect.name}`;
                                    const peakDate = new Date(hit.peakDate + 'T12:00:00');
                                    const dayLabel = peakDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                                    return (
                                        <div
                                            key={key}
                                            className="rounded-xl border border-white/5 bg-altar-deep/30 p-3 flex items-center gap-3"
                                        >
                                            <span className="text-xl shrink-0 opacity-50">{hit.transitPlanet.glyph}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-altar-text/60 font-display truncate">
                                                    {hit.transitPlanet.name} {hit.aspect.symbol} your {hit.natalPlanet.name}
                                                </p>
                                                <p className="text-[10px] text-altar-muted/60">{dayLabel} · {hit.aspect.nature}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Info block */}
                    <div className="glass rounded-2xl p-4 mb-5 animate-fade-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
                        <h3 className="font-display text-[10px] text-altar-muted tracking-[2px] uppercase mb-2">How Transit Alerts Work</h3>
                        <p className="text-[11px] text-altar-text/60 leading-relaxed">
                            We calculate the exact positions of all planets right now and compare them against your natal chart. When a transiting planet forms an aspect (conjunction, square, trine, etc.) to one of your natal planets, it activates that part of your chart. This is personalized to <strong className="text-altar-text/80">your</strong> specific birth chart — not generic zodiac predictions.
                        </p>
                    </div>
                </div>
            </div>
            <BottomNav currentTab="cosmos" onTabChange={onTabChange} />
        </div>
    );
}
