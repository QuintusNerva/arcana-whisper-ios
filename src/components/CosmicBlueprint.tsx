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

// Clay shadow helpers
const clayCard = '0 8px 32px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.07), inset 0 -2px 6px rgba(0,0,0,0.35)';
const clayPill = (r: number, g: number, b: number) =>
    `inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.35), 0 4px 12px rgba(${r},${g},${b},0.35), 0 1px 3px rgba(0,0,0,0.4)`;

export function CosmicBlueprint({ onTabChange }: CosmicBlueprintProps) {
    const [reading, setReading] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [collapsed, setCollapsed] = React.useState(true);

    React.useEffect(() => {
        const cached = dailyCache.get('blueprint');
        if (cached) setReading(cached);
    }, []);

    const birthData = getBirthData();
    if (!birthData) {
        return (
            <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '1s', opacity: 0 }}>
                <div
                    className="rounded-2xl p-5 text-center"
                    style={{
                        background: 'linear-gradient(145deg, #1a1333 0%, #13102a 60%, #0e0c22 100%)',
                        boxShadow: clayCard,
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <span className="text-3xl block mb-2">🌌</span>
                    <h3 className="font-display text-sm text-altar-gold tracking-[3px] uppercase mb-2">Cosmic Blueprint</h3>
                    <p className="text-xs text-altar-muted mb-3">Enter your birth data to unlock your personalized cosmic blueprint</p>
                    <button
                        onClick={() => onTabChange('natal')}
                        className="px-5 py-2 rounded-xl text-xs text-altar-gold font-display tracking-wide transition-all"
                        style={{
                            background: 'linear-gradient(145deg, #2d1f6e 0%, #1e1454 100%)',
                            boxShadow: clayPill(109, 40, 217),
                            border: '1px solid rgba(212,175,55,0.2)',
                        }}
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
            {/* Outer clay card */}
            <div
                className="rounded-3xl overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
                    boxShadow: clayCard,
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                {/* Header */}
                <div className="p-5 pb-3">
                    <h3 className="font-display text-sm text-altar-gold tracking-[3px] uppercase flex items-center gap-2 mb-1">
                        <span className="text-lg">🌌</span> Cosmic Blueprint
                    </h3>
                    <p className="text-[10px] text-altar-muted/60 mb-4">
                        Astrology + Numerology — woven into practical life guidance
                    </p>

                    {/* Sun / Moon / Rising clay pills */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                            { label: 'Sun', value: triad.sun.name, glyph: sunSign?.glyph, r: 180, g: 80, b: 30 },
                            { label: 'Moon', value: triad.moon.name, glyph: moonSign?.glyph, r: 80, g: 60, b: 180 },
                            { label: 'Rising', value: triad.rising.name, glyph: risingSign?.glyph, r: 100, g: 80, b: 160 },
                        ].map(item => (
                            <div
                                key={item.label}
                                className="rounded-xl p-2.5 text-center"
                                style={{
                                    background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.09), inset 0 -1px 3px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)`,
                                    border: '1px solid rgba(255,255,255,0.07)',
                                }}
                            >
                                <p className="text-[8px] text-altar-muted/70 font-display tracking-[2px] uppercase mb-1">{item.label}</p>
                                <p className="text-xs text-altar-text font-medium">{item.glyph} {item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Numerology clay pills */}
                    <div className="grid grid-cols-2 gap-2">
                        <div
                            className="rounded-xl p-3"
                            style={{
                                background: 'linear-gradient(145deg, #3d2007 0%, #2a1505 100%)',
                                boxShadow: clayPill(146, 64, 14),
                                border: '1px solid rgba(251,191,36,0.12)',
                            }}
                        >
                            <p className="text-[8px] text-amber-400/60 font-display tracking-[2px] uppercase mb-1">Life Path</p>
                            <p className="text-sm text-amber-300 font-bold">
                                #{lifePath} <span className="text-[10px] font-normal text-amber-400/55">— {lifePathMeaning.title}</span>
                            </p>
                        </div>
                        <div
                            className="rounded-xl p-3"
                            style={{
                                background: 'linear-gradient(145deg, #22164d 0%, #170f38 100%)',
                                boxShadow: clayPill(109, 40, 217),
                                border: '1px solid rgba(167,139,250,0.12)',
                            }}
                        >
                            <p className="text-[8px] text-violet-400/60 font-display tracking-[2px] uppercase mb-1">Personal Year</p>
                            <p className="text-sm text-violet-300 font-bold">
                                #{personalYear} <span className="text-[10px] font-normal text-violet-400/55">— {new Date().getFullYear()} Cycle</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reading / CTA */}
                <div className="px-5 pb-5">
                    {reading ? (
                        <div
                            className="rounded-xl p-4"
                            style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06), inset 0 -1px 4px rgba(0,0,0,0.35)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <p className="text-[9px] font-display text-altar-gold/60 tracking-[2px] uppercase mb-2">✦ Your Cosmic Blueprint</p>
                            <div className={collapsed ? 'max-h-[100px] overflow-hidden relative' : ''}>
                                <AIResponseRenderer text={reading} />
                                {collapsed && (
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d0b22]/95 to-transparent" />
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
                        <div
                            className="rounded-xl p-4"
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
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
                            {/* Clay CTA button */}
                            <button
                                onClick={handleReveal}
                                className="w-full py-3.5 rounded-2xl text-sm text-altar-gold font-display tracking-wide transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                                style={{
                                    background: 'linear-gradient(145deg, #2d1f6e 0%, #1e1454 50%, #130d3a 100%)',
                                    boxShadow: '0 6px 20px rgba(109,40,217,0.45), 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -2px 5px rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(212,175,55,0.2)',
                                }}
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
