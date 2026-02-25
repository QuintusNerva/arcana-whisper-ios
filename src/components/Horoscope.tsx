import { safeStorage } from "../services/storage.service";
import React from 'react';
import { BottomNav } from './BottomNav';
import {
    getBirthData, getSunSign, getDailyHoroscope, getCompatibility, ZODIAC_SIGNS,
    getNatalTriad,
} from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { AIResponseRenderer } from './AIResponseRenderer';

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
                const sysPrompt = `You are a warm, mystical astrologer writing today's horoscope. Write in second person ("you"). Be specific, poetic, and empowering.

You MUST format your response using these rules:
1. Structure into 2-3 sections using ## headers (e.g. ## The Theme, ## The Lesson, ## Your Action Steps).
2. Bold all key terminology using **double asterisks** (e.g. **Sagittarius**, **Mercury retrograde**).
3. End with a section called "## Your Action Steps" containing 2-3 bullet points starting with "- ".
4. Keep paragraphs short (2-3 sentences max).
5. Do NOT use any other markdown like code blocks, links, or images.`;

                let userPrompt = `Write today's horoscope for ${sign.name} (${sign.element} sign, ruled by ${sign.ruling}) for ${dateLabel}.
Mood seed: "${horoscope.mood}". Theme seed: "${horoscope.daily}".
Expand on that theme with practical guidance, emotional insight, and a sense of what the day holds.`;

                if (triad) {
                    userPrompt += `\n\nThis person's natal chart: Sun in ${triad.sun.name}, Moon in ${triad.moon.name}, Rising in ${triad.rising.name}. Subtly personalize the reading to this configuration without mentioning you're doing so.`;
                }

                const result = await ai.chat(sysPrompt, userPrompt);
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
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">← Altar</button>
                        <h1 className="font-display text-lg text-altar-gold tracking-[4px]">HOROSCOPE</h1>
                        <div className="w-12" />
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Sign Hero */}
                    <div className="text-center mt-6 mb-4 animate-fade-up">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-altar-mid to-altar-bright flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(139,95,191,0.4)]">
                                {horoscope.sign.glyph}
                            </div>
                            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-altar-dark border border-altar-gold/30 text-[9px] text-altar-gold font-display">
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
                        <div className="glass rounded-2xl p-3 mb-4 animate-fade-up">
                            <div className="grid grid-cols-4 gap-1.5">
                                {ZODIAC_SIGNS.map(z => (
                                    <button
                                        key={z.id}
                                        onClick={() => { setSelectedSign(z.id); setShowSignPicker(false); }}
                                        className={`py-2 rounded-lg text-center transition-all ${selectedSign === z.id
                                            ? 'bg-altar-gold/15 border border-altar-gold/30 text-altar-gold'
                                            : 'bg-altar-deep/30 border border-white/5 text-altar-muted hover:text-white'
                                            }`}
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
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-altar-gold/10 border border-altar-gold/15 text-altar-gold font-display">
                            {horoscope.mood}
                        </span>
                    </div>

                    {/* Daily Horoscope */}
                    <div className="glass-strong rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
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
                        <div className="glass rounded-xl p-3 text-center">
                            <p className="text-lg mb-0.5">🔢</p>
                            <p className="font-display text-base text-altar-gold">{horoscope.lucky.number}</p>
                            <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase mt-0.5">Lucky Number</p>
                        </div>
                        <div className="glass rounded-xl p-3 text-center">
                            <p className="text-lg mb-0.5">🎨</p>
                            <p className="font-display text-[11px] text-altar-gold leading-tight">{horoscope.lucky.color}</p>
                            <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase mt-0.5">Color</p>
                        </div>
                        <div className="glass rounded-xl p-3 text-center">
                            <p className="text-lg mb-0.5">💎</p>
                            <p className="font-display text-[11px] text-altar-gold leading-tight">{horoscope.lucky.crystal}</p>
                            <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase mt-0.5">Crystal</p>
                        </div>
                    </div>

                    {/* Extended Forecast — Premium gate */}
                    <div className="rounded-2xl p-[1px] bg-gradient-to-r from-altar-gold/20 via-altar-bright/10 to-altar-gold/20 mb-4 animate-fade-up" style={{ animationDelay: '0.45s', opacity: 0 }}>
                        <div className="rounded-2xl bg-altar-dark/95 p-5">
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                {isPremium ? <span className="text-altar-gold">✦</span> : <span>👑</span>} Extended Forecast
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
                                    <button className="mt-3 w-full py-2.5 rounded-xl bg-altar-gold/10 border border-altar-gold/20 text-xs text-altar-gold font-display tracking-wide hover:border-altar-gold/40 transition-all">
                                        Unlock Premium — $4.99/mo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compatibility */}
                    <div className="glass rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3">Compatibility</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] text-green-400/70 font-display tracking-[2px] uppercase mb-1.5">Best Matches</p>
                                <div className="flex gap-2">
                                    {compat.best.map(z => (
                                        <div key={z.id} className="flex-1 text-center py-2 rounded-lg bg-green-500/5 border border-green-500/15">
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
                                        <div key={z.id} className="flex-1 text-center py-2 rounded-lg bg-red-500/5 border border-red-500/15">
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
