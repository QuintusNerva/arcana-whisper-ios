import { safeStorage } from "../services/storage.service";
import React from 'react';
import { BottomNav } from './BottomNav';
import {
    getBirthData, getSunSign, getDailyHoroscope, getCompatibility, ZODIAC_SIGNS,
    getNatalTriad, getLifePathNumber, getCurrentPersonalYear,
} from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import { PageHeader } from './PageHeader';
import { getActiveManifestations } from '../services/manifestation.service';

interface HoroscopeProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
}

export function Horoscope({ onClose, onTabChange, subscription }: HoroscopeProps) {
    const birthData = getBirthData();
    const profileZodiac = React.useMemo(() => {
        try {
            const p = safeStorage.getItem('userProfile');
            if (p) {
                const parsed = JSON.parse(p);
                if (parsed?.zodiac) {
                    const found = ZODIAC_SIGNS.find(z => z.name === parsed.zodiac);
                    return found?.id || null;
                }
            }
        } catch { /* */ }
        return null;
    }, []);

    const autoSignId = birthData ? getSunSign(birthData.birthday).id : profileZodiac;
    const [selectedSign, setSelectedSign] = React.useState<string>(autoSignId || 'aries');
    const [showSignPicker, setShowSignPicker] = React.useState(!autoSignId);
    const isPremium = subscription === 'premium';

    const horoscope = getDailyHoroscope(selectedSign);
    const compat = getCompatibility(selectedSign);
    const triad = birthData ? getNatalTriad(birthData) : null;

    const today = new Date();
    const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const todayKey = today.toISOString().slice(0, 10);

    // ── AI Daily Reading (no label shown) ──
    const [aiDaily, setAiDaily] = React.useState<string | null>(null);
    const [aiDailyLoading, setAiDailyLoading] = React.useState(false);
    const aiDailyCacheRef = React.useRef<Record<string, string>>({});

    React.useEffect(() => {
        const cacheKey = `${todayKey}_${selectedSign}`;
        // Check mem cache
        if (aiDailyCacheRef.current[cacheKey]) {
            setAiDaily(aiDailyCacheRef.current[cacheKey]);
            return;
        }
        // Check localStorage cache
        try {
            const stored = safeStorage.getItem('ai_daily_' + cacheKey);
            if (stored) {
                setAiDaily(stored);
                aiDailyCacheRef.current[cacheKey] = stored;
                return;
            }
        } catch { /* */ }

        const ai = new AIService();
        if (!ai.hasApiKey()) { setAiDaily(null); return; }

        setAiDaily(null);
        setAiDailyLoading(true);
        let cancelled = false;

        (async () => {
            try {
                const sign = ZODIAC_SIGNS.find(z => z.id === selectedSign) || ZODIAC_SIGNS[0];

                // Build params for modular prompt
                let lifePath: number | undefined;
                let personalYear: number | undefined;
                if (triad && birthData?.birthday) {
                    lifePath = getLifePathNumber(birthData.birthday);
                    personalYear = getCurrentPersonalYear(birthData.birthday);
                }

                const manifests = getActiveManifestations();
                const activeManifestations = manifests.length > 0
                    ? manifests.slice(0, 2).map(m => m.declaration)
                    : undefined;

                const result = await ai.getHoroscope({
                    sign: { name: sign.name, element: sign.element, ruling: sign.ruling },
                    dateLabel, mood: horoscope.mood, daily: horoscope.daily,
                    triad: triad || undefined, lifePath, personalYear, activeManifestations,
                });
                if (!cancelled) {
                    const cleaned = result.replace(/^["']|["']$/g, '').trim();
                    setAiDaily(cleaned);
                    aiDailyCacheRef.current[cacheKey] = cleaned;
                    try { safeStorage.setItem('ai_daily_' + cacheKey, cleaned); } catch { /* */ }
                }
            } catch { /* use static fallback */ }
            finally { if (!cancelled) setAiDailyLoading(false); }
        })();

        return () => { cancelled = true; };
    }, [selectedSign, todayKey]);

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <PageHeader title="HOROSCOPE" onClose={onClose} titleSize="lg" />

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Sign Hero */}
                    <div className="text-center mt-6 mb-4 animate-fade-up">
                        <div className="relative inline-block">
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                                style={{
                                    background: 'linear-gradient(145deg, #3b1f8a 0%, #2d1b6e 50%, #1a1042 100%)',
                                    boxShadow: '0 8px 24px rgba(109,40,217,0.5), 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.4)',
                                }}
                            >
                                {horoscope.sign.glyph}
                            </div>
                            <div
                                className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] text-altar-gold font-display"
                                style={{
                                    background: 'linear-gradient(145deg, #2a1a05 0%, #1a1003 100%)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,220,80,0.12)',
                                    border: '1px solid rgba(212,175,55,0.3)',
                                }}
                            >
                                {horoscope.sign.element}
                            </div>
                        </div>
                        <h2 className="font-display text-2xl text-altar-gold tracking-[3px] mt-4">{horoscope.sign.name}</h2>
                        <p className="text-xs text-altar-muted mt-1">{horoscope.sign.dates} · Ruled by {horoscope.sign.ruling}</p>
                        <button
                            onClick={() => setShowSignPicker(!showSignPicker)}
                            className="mt-2 text-[10px] text-altar-gold/60 font-display hover:text-altar-gold transition-colors"
                        >
                            Change sign ↓
                        </button>
                    </div>

                    {/* Sign Picker */}
                    {showSignPicker && (
                        <div className="clay-card rounded-3xl p-3 mb-4 animate-fade-up">
                            <div className="grid grid-cols-4 gap-1.5">
                                {ZODIAC_SIGNS.map(z => (
                                    <button
                                        key={z.id}
                                        onClick={() => { setSelectedSign(z.id); setShowSignPicker(false); }}
                                        className="py-2 rounded-lg text-center transition-all"
                                        style={selectedSign === z.id ? {
                                            background: 'linear-gradient(145deg, #3d2e08 0%, #2a1f05 100%)',
                                            boxShadow: '0 3px 10px rgba(146,64,14,0.4), inset 0 1px 1px rgba(255,220,80,0.14)',
                                            border: '1px solid rgba(212,175,55,0.25)',
                                            color: '#ffd700',
                                        } : {
                                            background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.1) 100%)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
                                            color: 'rgba(148,163,184,0.8)',
                                        }}
                                    >
                                        <span className="text-xl block">{z.glyph}</span>
                                        <span className="text-[8px] font-display tracking-wide">{z.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date + Mood */}
                    <div className="flex items-center justify-between mb-4 animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                        <span className="text-xs text-altar-muted">{dateLabel}</span>
                        <span
                            className="text-[10px] px-2.5 py-1 rounded-full font-display"
                            style={{
                                background: 'linear-gradient(145deg, #3d2e08 0%, #2a1f05 100%)',
                                boxShadow: '0 3px 10px rgba(146,64,14,0.4), inset 0 1px 1px rgba(255,220,80,0.14), inset 0 -1px 2px rgba(0,0,0,0.35)',
                                border: '1px solid rgba(212,175,55,0.2)',
                                color: '#ffd700',
                            }}
                        >
                            {horoscope.mood}
                        </span>
                    </div>

                    {/* Daily Horoscope */}
                    <div className="clay-card rounded-3xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                            <span className="text-altar-gold">✦</span> Today's Reading
                        </h3>
                        {aiDailyLoading ? (
                            <div className="space-y-2.5 py-1">
                                <div className="h-3 shimmer-skeleton w-full" />
                                <div className="h-3 shimmer-skeleton w-[92%]" />
                                <div className="h-3 shimmer-skeleton w-[80%]" />
                                <div className="h-3 shimmer-skeleton w-[65%]" />
                            </div>
                        ) : (
                            <AIResponseRenderer text={aiDaily || horoscope.daily} />
                        )}
                    </div>

                    {/* Lucky Elements */}
                    <div className="grid grid-cols-3 gap-2.5 mb-4 animate-fade-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
                        <div className="clay-inset rounded-2xl p-3 text-center">
                            <p className="text-lg mb-0.5">🔢</p>
                            <p className="font-display text-base text-altar-gold">{horoscope.lucky.number}</p>
                            <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase mt-0.5">Lucky Number</p>
                        </div>
                        <div className="clay-inset rounded-2xl p-3 text-center">
                            <p className="text-lg mb-0.5">🎨</p>
                            <p className="font-display text-[11px] text-altar-gold leading-tight">{horoscope.lucky.color}</p>
                            <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase mt-0.5">Color</p>
                        </div>
                        <div className="clay-inset rounded-2xl p-3 text-center">
                            <p className="text-lg mb-0.5">💎</p>
                            <p className="font-display text-[11px] text-altar-gold leading-tight">{horoscope.lucky.crystal}</p>
                            <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase mt-0.5">Crystal</p>
                        </div>
                    </div>

                    {/* Extended Forecast — Premium gate */}
                    <div
                        className="clay-card rounded-[2rem] mb-4 animate-fade-up border border-altar-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                        style={{
                            animationDelay: '0.45s', opacity: 0,
                        }}
                    >
                        <div className="p-6">
                            <h3 className="font-display text-xs text-altar-gold tracking-[3px] uppercase mb-4 flex items-center gap-1.5">
                                {isPremium ? <span className="text-altar-bright">✦</span> : <span>👑</span>} Extended Forecast
                            </h3>
                            {isPremium ? (
                                <p className="text-sm text-altar-text/85 leading-relaxed italic">
                                    "{horoscope.extended}"
                                </p>
                            ) : (
                                <div>
                                    <p className="text-sm text-altar-text/40 leading-relaxed italic line-clamp-2 blur-[2px]">
                                        {horoscope.extended}
                                    </p>
                                    <button
                                        className="mt-3 w-full py-2.5 rounded-xl text-xs font-display tracking-wide transition-all active:scale-[0.97] gold-shimmer"
                                        style={{
                                            background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                            border: '2px solid rgba(212,175,55,0.6)',
                                            color: '#1a0f2e',
                                            fontWeight: 800,
                                            boxShadow: '0 2px 0 #8a6914, 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                                        }}
                                    >
                                        ✦ Unlock Premium
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compatibility */}
                    <div className="clay-card rounded-3xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-4">Compatibility</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] text-green-400/70 font-display tracking-[2px] uppercase mb-1.5">Best Matches</p>
                                <div className="flex gap-2">
                                    {compat.best.map(z => (
                                        <div
                                            key={z.id}
                                            className="clay-inset flex-1 text-center py-3 rounded-2xl"
                                        >
                                            <span className="text-xl block">{z.glyph}</span>
                                            <span className="text-[9px] text-altar-text/70 font-display">{z.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] text-red-400/70 font-display tracking-[2px] uppercase mb-1.5">Challenging</p>
                                <div className="flex gap-2">
                                    {compat.challenging.map(z => (
                                        <div
                                            key={z.id}
                                            className="clay-inset flex-1 text-center py-3 rounded-2xl"
                                        >
                                            <span className="text-xl block">{z.glyph}</span>
                                            <span className="text-[9px] text-altar-text/70 font-display">{z.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <BottomNav currentTab="home" onTabChange={onTabChange} />
        </div>
    );
}
