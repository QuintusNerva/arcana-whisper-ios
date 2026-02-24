import React from 'react';
import {
    getBirthData, getNatalTriad, getFullChart, getLifePathNumber, getLifePathMeaning,
    getPersonalYearNumber, ZODIAC_SIGNS, FullChartData,
} from '../services/astrology.service';
import { AIService, dailyCache } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';

interface CosmicBlueprintProps {
    onTabChange: (tab: string) => void;
}

export function CosmicBlueprint({ onTabChange }: CosmicBlueprintProps) {
    const [reading, setReading] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [collapsed, setCollapsed] = React.useState(true);

    // Check daily cache on mount
    React.useEffect(() => {
        const cached = dailyCache.get('blueprint');
        if (cached) setReading(cached);
    }, []);

    const birthData = getBirthData();
    if (!birthData) {
        return (
            <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '1s', opacity: 0 }}>
                <div className="glass rounded-2xl p-5 text-center border border-white/5">
                    <span className="text-3xl block mb-2">🌌</span>
                    <h3 className="font-display text-sm text-altar-gold tracking-[3px] uppercase mb-2">Cosmic Blueprint</h3>
                    <p className="text-xs text-altar-muted mb-3">Enter your birth data to unlock your personalized cosmic blueprint</p>
                    <button
                        onClick={() => onTabChange('natal')}
                        className="px-5 py-2 rounded-xl bg-altar-mid/40 border border-altar-gold/20 text-xs text-altar-gold font-display tracking-wide hover:border-altar-gold/40 transition-all"
                    >
                        Add Birth Data →
                    </button>
                </div>
            </div>
        );
    }

    const triad = getNatalTriad(birthData);
    const fullChart = getFullChart(birthData);
    const lifePath = getLifePathNumber(birthData.birthday);
    const lifePathMeaning = getLifePathMeaning(lifePath);
    const personalYear = getPersonalYearNumber(birthData.birthday);

    const handleReveal = async () => {
        const ai = new AIService();
        if (!ai.hasApiKey()) {
            setError('Add your API key in Settings for personalized readings');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await ai.getCosmicBlueprint(
                { sun: triad.sun.name, moon: triad.moon.name, rising: triad.rising.name },
                fullChart?.planets || [],
                fullChart?.aspects || [],
                { number: lifePath, title: lifePathMeaning.title, desc: lifePathMeaning.desc },
                { number: personalYear },
            );
            setReading(result);
            dailyCache.set('blueprint', result);
        } catch (err: any) {
            setError('Failed to generate blueprint. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const sunSign = ZODIAC_SIGNS.find(z => z.id === triad.sun.id);
    const moonSign = ZODIAC_SIGNS.find(z => z.id === triad.moon.id);
    const risingSign = ZODIAC_SIGNS.find(z => z.id === triad.rising.id);

    return (
        <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '1s', opacity: 0 }}>
            <div className="glass rounded-2xl overflow-hidden border border-white/5">
                {/* Header */}
                <div className="p-5 pb-3">
                    <h3 className="font-display text-sm text-altar-gold tracking-[3px] uppercase flex items-center gap-2 mb-3">
                        <span className="text-lg">🌌</span> Cosmic Blueprint
                    </h3>
                    <p className="text-[10px] text-altar-muted/70 mb-3">
                        Astrology + Numerology — woven into practical life guidance
                    </p>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {[
                            { label: 'Sun', value: triad.sun.name, glyph: sunSign?.glyph },
                            { label: 'Moon', value: triad.moon.name, glyph: moonSign?.glyph },
                            { label: 'Rising', value: triad.rising.name, glyph: risingSign?.glyph },
                        ].map(item => (
                            <div key={item.label} className="rounded-lg p-2 bg-white/[0.03] text-center">
                                <p className="text-[8px] text-altar-muted font-display tracking-[2px] uppercase">{item.label}</p>
                                <p className="text-xs text-altar-text mt-0.5">{item.glyph} {item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Numerology Stats */}
                    <div className="grid grid-cols-2 gap-1.5 mb-1">
                        <div className="rounded-lg p-2.5 bg-gradient-to-r from-amber-900/15 to-orange-900/10 border border-amber-500/10">
                            <p className="text-[8px] text-amber-400/60 font-display tracking-[2px] uppercase">Life Path</p>
                            <p className="text-sm text-amber-300 font-bold mt-0.5">
                                #{lifePath} <span className="text-[10px] font-normal text-amber-400/60">— {lifePathMeaning.title}</span>
                            </p>
                        </div>
                        <div className="rounded-lg p-2.5 bg-gradient-to-r from-violet-900/15 to-indigo-900/10 border border-violet-500/10">
                            <p className="text-[8px] text-violet-400/60 font-display tracking-[2px] uppercase">Personal Year</p>
                            <p className="text-sm text-violet-300 font-bold mt-0.5">
                                #{personalYear} <span className="text-[10px] font-normal text-violet-400/60">— {new Date().getFullYear()} Cycle</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reading Section */}
                <div className="px-5 pb-5">
                    {reading ? (
                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                            <p className="text-[9px] font-display text-altar-gold/60 tracking-[2px] uppercase mb-2">✦ Your Cosmic Blueprint</p>
                            <div className={collapsed ? 'max-h-[100px] overflow-hidden relative' : ''}>
                                <AIResponseRenderer text={reading} />
                                {collapsed && (
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-altar-dark/95 to-transparent" />
                                )}
                            </div>
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="mt-2 text-[10px] text-altar-gold/70 font-display hover:text-altar-gold transition-colors"
                            >
                                {collapsed ? '▾ Read more' : '▴ Collapse'}
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                            <p className="text-[9px] font-display text-altar-gold/60 tracking-[2px] uppercase mb-3">✦ Channeling Your Blueprint...</p>
                            <div className="space-y-2.5">
                                <div className="h-3 shimmer-skeleton w-full" />
                                <div className="h-3 shimmer-skeleton w-[92%]" />
                                <div className="h-3 shimmer-skeleton w-[85%]" />
                                <div className="h-3 shimmer-skeleton w-[70%]" />
                                <div className="h-3 shimmer-skeleton w-[78%]" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <p className="text-xs text-red-400/70 text-center mb-2">{error}</p>
                            )}
                            <button
                                onClick={handleReveal}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-altar-mid/50 via-altar-bright/40 to-altar-mid/50 border border-altar-gold/20 text-sm text-altar-gold font-display tracking-wide hover:border-altar-gold/40 hover:shadow-[0_0_20px_rgba(255,215,0,0.1)] transition-all flex items-center justify-center gap-2"
                            >
                                <span>🌌</span> Reveal Your Blueprint
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
