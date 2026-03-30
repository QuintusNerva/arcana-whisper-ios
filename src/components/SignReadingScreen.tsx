import React from 'react';
import { safeStorage } from '../services/storage.service';
import { BottomNav } from './BottomNav';
import { AIResponseRenderer } from './AIResponseRenderer';
import {
    getBirthData, getNatalTriad, getPlacementMeaning, ZODIAC_SIGNS,
} from '../services/astrology.service';
import { AIService } from '../services/ai.service';

interface SignReadingScreenProps {
    focus: 'moon' | 'rising';
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

const MEANING_CACHE_KEY = 'arcana_sign_reading_cache';

function getCache(): Record<string, any> {
    try { return JSON.parse(safeStorage.getItem(MEANING_CACHE_KEY) || '{}'); } catch { return {}; }
}
function setCache(c: Record<string, any>) {
    safeStorage.setItem(MEANING_CACHE_KEY, JSON.stringify(c));
}

export function SignReadingScreen({ focus, onClose, onTabChange }: SignReadingScreenProps) {
    const birthData = getBirthData();
    const triad = birthData ? getNatalTriad(birthData) : null;
    const signData = triad ? (focus === 'moon' ? triad.moon : triad.rising) : null;
    const staticMeaning = signData ? getPlacementMeaning(focus, signData.id) : null;

    const [aiMeaning, setAiMeaning] = React.useState<{ title: string; overview: string; strengths: string; challenges: string; advice: string } | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [aiError, setAiError] = React.useState<string | null>(null);

    const emoji = focus === 'moon' ? '🌙' : '⬆️';
    const label = focus === 'moon' ? 'Moon Sign' : 'Rising Sign';
    const desc = focus === 'moon'
        ? 'Your emotional self — how you feel, process, and nurture'
        : 'Your ascendant — how the world perceives you at first glance';

    React.useEffect(() => {
        if (!signData) return;
        const cacheKey = `${focus}_${signData.id}`;
        const cached = getCache()[cacheKey];
        if (cached) {
            setAiMeaning(cached);
            return;
        }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setAiLoading(true);
        setAiError(null);

        const triadContext = triad ? {
            sun: triad.sun.name,
            moon: triad.moon.name,
            rising: triad.rising.name,
        } : undefined;

        ai.getPlacementInsight(focus, signData, triadContext)
            .then(result => {
                const updated = { ...getCache(), [cacheKey]: result };
                setCache(updated);
                setAiMeaning(result);
            })
            .catch(() => setAiError('Could not channel your reading — showing static interpretation.'))
            .finally(() => setAiLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus]);

    const title = aiMeaning?.title || staticMeaning?.title || '';
    const overview = aiMeaning?.overview || staticMeaning?.overview || '';
    const strengths = (aiMeaning?.strengths || staticMeaning?.strengths || '').split(',');
    const challenges = (aiMeaning?.challenges || staticMeaning?.challenges || '').split(',');
    const advice = aiMeaning?.advice || staticMeaning?.advice || '';

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-altar-deep/90 backdrop-blur-sm px-5 pt-safe pt-4 pb-3 flex items-center gap-3 border-b border-white/5 max-w-[500px] mx-auto w-full">
                    <button
                        onClick={onClose}
                        className="text-altar-muted/70 text-sm font-display hover:text-altar-muted transition-colors"
                    >
                        ← Witness
                    </button>
                    <h2 className="flex-1 text-center font-display text-sm tracking-[3px] text-altar-gold uppercase">{label}</h2>
                    <div className="w-16" />
                </div>

                <div className="max-w-[500px] mx-auto px-4 pb-8">
                    {signData ? (
                        <>
                            {/* Sign header */}
                            <div className="text-center mt-8 mb-6 animate-fade-up">
                                <span className="text-5xl block mb-3">{emoji}</span>
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <span className="text-4xl">{signData.glyph}</span>
                                </div>
                                <h2 className="font-display text-2xl text-altar-gold tracking-[3px]">{signData.name}</h2>
                                <p className="text-xs text-altar-muted mt-1">{signData.element} · {signData.ruling}</p>
                                <p className="text-[10px] text-altar-muted/50 mt-2 italic">{desc}</p>
                            </div>

                            {/* Title badge */}
                            <div className="text-center mb-5 animate-fade-up">
                                {aiLoading ? (
                                    <div className="inline-block w-40 h-7 shimmer-skeleton rounded-full" />
                                ) : (
                                    <span className="inline-block px-4 py-1.5 rounded-full bg-altar-gold/10 border border-altar-gold/20 text-sm text-altar-gold font-display tracking-wide">
                                        ✦ {title} ✦
                                    </span>
                                )}
                            </div>

                            {/* AI / Static indicator */}
                            {aiMeaning && (
                                <div className="flex items-center justify-center gap-1.5 mb-3">
                                    <span className="text-[9px] font-display tracking-[2px] text-altar-gold/45 uppercase">✦ Mystic Interpretation</span>
                                </div>
                            )}

                            {/* Overview */}
                            <div className="clay-card rounded-3xl p-5 mb-4 animate-fade-up">
                                <p className="text-[9px] font-display text-altar-gold/60 tracking-[2px] uppercase mb-3">Overview</p>
                                {aiLoading ? (
                                    <div className="space-y-2.5">
                                        <div className="h-3 shimmer-skeleton w-full" />
                                        <div className="h-3 shimmer-skeleton w-[92%]" />
                                        <div className="h-3 shimmer-skeleton w-[85%]" />
                                        <div className="h-3 shimmer-skeleton w-[75%]" />
                                        <div className="h-3 shimmer-skeleton w-[68%]" />
                                        <div className="h-3 shimmer-skeleton w-[80%]" />
                                        <div className="h-3 shimmer-skeleton w-[55%]" />
                                    </div>
                                ) : aiMeaning ? (
                                    <AIResponseRenderer text={overview} />
                                ) : (
                                    <p className="text-sm text-altar-text/85 leading-relaxed">{overview}</p>
                                )}
                            </div>

                            {/* Strengths & Challenges */}
                            <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up">
                                <div className="clay-card rounded-2xl p-4">
                                    <p className="text-[9px] font-display text-green-400/70 tracking-[2px] uppercase mb-2">Strengths</p>
                                    {aiLoading ? (
                                        <div className="space-y-2">
                                            <div className="h-2.5 shimmer-skeleton w-full" />
                                            <div className="h-2.5 shimmer-skeleton w-[80%]" />
                                            <div className="h-2.5 shimmer-skeleton w-[65%]" />
                                        </div>
                                    ) : (
                                        <ul className="space-y-1.5">
                                            {strengths.map((s, i) => (
                                                <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                    <span className="text-green-400/50 shrink-0">·</span>
                                                    <span>{s.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="clay-card rounded-2xl p-4">
                                    <p className="text-[9px] font-display text-red-400/70 tracking-[2px] uppercase mb-2">Challenges</p>
                                    {aiLoading ? (
                                        <div className="space-y-2">
                                            <div className="h-2.5 shimmer-skeleton w-full" />
                                            <div className="h-2.5 shimmer-skeleton w-[75%]" />
                                            <div className="h-2.5 shimmer-skeleton w-[60%]" />
                                        </div>
                                    ) : (
                                        <ul className="space-y-1.5">
                                            {challenges.map((s, i) => (
                                                <li key={i} className="text-[11px] text-altar-text/80 leading-snug flex gap-1">
                                                    <span className="text-red-400/50 shrink-0">·</span>
                                                    <span>{s.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Cosmic Advice */}
                            <div className="clay-card rounded-3xl p-5 border border-altar-gold/10 mb-5 animate-fade-up">
                                <p className="text-[9px] font-display text-altar-gold/70 tracking-[2px] uppercase mb-2">✦ Cosmic Advice</p>
                                {aiLoading ? (
                                    <div className="space-y-2">
                                        <div className="h-3 shimmer-skeleton w-[90%]" />
                                        <div className="h-3 shimmer-skeleton w-[65%]" />
                                    </div>
                                ) : (
                                    <p className="text-sm text-altar-text/85 leading-relaxed italic">"{advice}"</p>
                                )}
                            </div>

                            {aiError && (
                                <p className="text-[10px] text-amber-400/50 text-center mb-3">{aiError}</p>
                            )}

                            {/* Link to full Natal Chart */}
                            <button
                                onClick={() => onTabChange('natal')}
                                className="w-full py-3.5 flex items-center justify-center gap-2 mb-2 transition-all active:scale-[0.99] gold-shimmer"
                                style={{
                                    background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                    borderRadius: '16px',
                                    border: '2px solid rgba(212,175,55,0.6)',
                                    color: '#1a0f2e',
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 800,
                                    boxShadow: '0 2px 0 #8a6914, 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                                }}
                            >
                                <span>🌙</span> View Full Natal Chart
                            </button>
                        </>
                    ) : (
                        <div className="text-center mt-16">
                            <p className="text-altar-muted text-sm">No birth data — add it in Profile to see your {label}.</p>
                            <button onClick={() => onTabChange('profile')} className="mt-4 px-6 py-2 rounded-xl clay-btn text-sm">Go to Profile</button>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab="home" onTabChange={onTabChange} />
        </div>
    );
}
