import React from 'react';
import { saveBirthData, getSunSign, saveDestinyName, getLifePathNumber, getDailyHoroscope } from '../services/astrology.service';
import { searchPlaces, resolvePlace, PlaceSuggestion } from '../services/geocoding.service';
import { safeStorage } from '../services/storage.service';
import { requestNotificationPermission } from '../services/reminder.service';
import { PRODUCTS, purchaseProduct, restorePurchases, type ProductId } from '../services/storekit.service';

interface OnboardingProps {
    onComplete: (profile: { name: string; birthday: string; zodiac: string; birthTime?: string; birthCity?: string; latitude?: number; longitude?: number; utcOffset?: number }) => void;
}

/* ── Eye of Providence / Third Eye SVG ── */
function EyeOfProvidence({ size = 80, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
            {/* Outer glow */}
            <defs>
                <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="eyeGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="55" fill="url(#eyeGlow)" />
            {/* Triangle */}
            <path d="M60 12 L108 95 H12 Z" stroke="url(#eyeGold)" strokeWidth="2" fill="none" opacity="0.6" />
            {/* Eye shape */}
            <path d="M20 60 Q60 25 100 60 Q60 95 20 60 Z" stroke="url(#eyeGold)" strokeWidth="2.5" fill="rgba(255,215,0,0.05)" />
            {/* Iris */}
            <circle cx="60" cy="60" r="16" stroke="url(#eyeGold)" strokeWidth="2" fill="rgba(255,215,0,0.08)" />
            {/* Pupil */}
            <circle cx="60" cy="60" r="7" fill="url(#eyeGold)" opacity="0.9" />
            {/* Light rays */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <line
                    key={angle}
                    x1={60 + Math.cos(angle * Math.PI / 180) * 42}
                    y1={60 + Math.sin(angle * Math.PI / 180) * 42}
                    x2={60 + Math.cos(angle * Math.PI / 180) * 50}
                    y2={60 + Math.sin(angle * Math.PI / 180) * 50}
                    stroke="#FFD700"
                    strokeWidth="1.5"
                    opacity="0.3"
                    strokeLinecap="round"
                />
            ))}
        </svg>
    );
}

/* ── Life Path meanings (short) ── */
const LIFE_PATH_BRIEF: Record<number, string> = {
    1: 'The Leader — independent, ambitious, pioneering',
    2: 'The Diplomat — intuitive, harmonious, cooperative',
    3: 'The Communicator — creative, expressive, joyful',
    4: 'The Builder — disciplined, practical, grounded',
    5: 'The Adventurer — freedom-seeking, versatile, curious',
    6: 'The Nurturer — caring, responsible, community-minded',
    7: 'The Seeker — analytical, spiritual, introspective',
    8: 'The Powerhouse — ambitious, karmic, authority-driven',
    9: 'The Humanitarian — compassionate, wise, visionary',
    11: 'The Illuminator — master intuition, spiritual insight',
    22: 'The Master Builder — visionary architect of reality',
    33: 'The Master Teacher — pure compassion, healing energy',
};

const STEPS = ['welcome', 'value1', 'value2', 'value3', 'name', 'birthday', 'birthdetails', 'reveal', 'notifications', 'paywall', 'consent'] as const;

/* ── Tracked steps for progress dots (exclude welcome) ── */
const PROGRESS_STEPS = STEPS.filter(s => s !== 'welcome');

export function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = React.useState<typeof STEPS[number]>('welcome');
    const [name, setName] = React.useState('');
    const [birthday, setBirthday] = React.useState('');
    const [birthTime, setBirthTime] = React.useState('');
    const [cityQuery, setCityQuery] = React.useState('');
    const [selectedCity, setSelectedCity] = React.useState<{ name: string; lat: number; lng: number; utcOffset: number } | null>(null);
    const [cityResults, setCityResults] = React.useState<PlaceSuggestion[]>([]);
    const [resolving, setResolving] = React.useState(false);
    const [revealReady, setRevealReady] = React.useState(false);
    const [aiConsent, setAiConsent] = React.useState(false);
    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Paywall state
    const [selectedPlan, setSelectedPlan] = React.useState<'MONTHLY' | 'YEARLY'>('YEARLY');
    const [isPurchasing, setIsPurchasing] = React.useState(false);
    const [isRestoring, setIsRestoring] = React.useState(false);
    const [purchaseError, setPurchaseError] = React.useState<string | null>(null);

    const sunSign = birthday ? getSunSign(birthday) : null;
    const lifePathNumber = birthday ? getLifePathNumber(birthday) : null;
    const horoscope = sunSign ? getDailyHoroscope(sunSign.id) : null;

    // City search — debounced async via Nominatim
    const handleCitySearch = (query: string) => {
        setCityQuery(query);
        setSelectedCity(null);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (query.length < 3) {
            setCityResults([]);
            return;
        }
        searchTimeoutRef.current = setTimeout(async () => {
            const results = await searchPlaces(query);
            setCityResults(results);
        }, 300);
    };

    const handleCitySelect = async (suggestion: PlaceSuggestion) => {
        setResolving(true);
        setCityResults([]);
        setCityQuery(suggestion.description);
        try {
            const resolved = await resolvePlace(suggestion, birthday || '2000-01-01', birthTime || undefined);
            if (resolved) {
                setSelectedCity({
                    name: suggestion.description,
                    lat: resolved.latitude,
                    lng: resolved.longitude,
                    utcOffset: resolved.utcOffset,
                });
            }
        } catch { /* ignore */ }
        setResolving(false);
    };

    const handleFinish = () => {
        // Save birth data with full coordinates for accurate rising sign
        saveBirthData({
            birthday,
            birthTime: birthTime || undefined,
            location: selectedCity?.name,
            utcOffset: selectedCity?.utcOffset,
            latitude: selectedCity?.lat,
            longitude: selectedCity?.lng,
        });

        // Smart detection: if name has 2+ words, silently save as destiny name
        const trimmed = name.trim();
        if (trimmed.split(/\s+/).length >= 2) {
            saveDestinyName(trimmed);
        }

        // Build profile
        const profile: any = {
            name: name.trim(),
            birthday,
            zodiac: sunSign?.name || '',
        };
        if (birthTime) profile.birthTime = birthTime;
        if (selectedCity) {
            profile.birthCity = selectedCity.name;
            profile.latitude = selectedCity.lat;
            profile.longitude = selectedCity.lng;
            profile.utcOffset = selectedCity.utcOffset;
        }
        onComplete(profile);
    };

    const handleNotificationRequest = async () => {
        await requestNotificationPermission();
        setStep('paywall');
    };

    const handlePurchase = async () => {
        setPurchaseError(null);
        setIsPurchasing(true);
        const product = PRODUCTS[selectedPlan];
        const result = await purchaseProduct(product.id as ProductId);
        setIsPurchasing(false);
        if (result.success) {
            setStep('consent');
        } else if (result.error && !result.error.includes('cancelled') && !result.error.includes('canceled')) {
            setPurchaseError(result.error || 'Something went wrong.');
        }
    };

    const handleRestore = async () => {
        setPurchaseError(null);
        setIsRestoring(true);
        const result = await restorePurchases();
        setIsRestoring(false);
        if (result.restored) {
            setStep('consent');
        } else {
            setPurchaseError(result.error || 'No active subscriptions found.');
        }
    };

    const handleConsentNext = () => {
        safeStorage.setItem('ai_consent', JSON.stringify({ consented: aiConsent, timestamp: new Date().toISOString() }));
        setStep('reveal');
        // If we're coming back to reveal after consent, the reveal is already set up
        // We use a flag to distinguish first reveal vs final reveal
    };

    const stepIndex = STEPS.indexOf(step);
    const progressIndex = PROGRESS_STEPS.indexOf(step as any);

    /* ── Open legal pages in Capacitor browser or new tab ── */
    const openLegal = async (page: 'terms' | 'privacy') => {
        const url = page === 'terms' ? '/terms.html' : '/privacy.html';
        try {
            const m = await (Function('return import("@capacitor/browser")')() as Promise<any>);
            await m.Browser.open({ url });
        } catch {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text flex flex-col items-center justify-center relative overflow-hidden px-6" style={{ height: '100dvh' }}>
            {/* Ambient Effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-altar-gold/5 blur-[100px] animate-pulse-glow pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-[200px] h-[200px] rounded-full bg-altar-bright/5 blur-[80px] pointer-events-none" />

            {/* ── Welcome ── */}
            {step === 'welcome' && (
                <div className="text-center max-w-[380px] animate-fade-up" style={{ marginTop: '-10vh' }}>
                    <div className="mb-6 animate-float">
                        <EyeOfProvidence size={100} />
                    </div>
                    <h1 className="font-display text-3xl tracking-[5px] mb-3">
                        <span className="shimmer-text">ARCANA WHISPER</span>
                    </h1>
                    <p className="text-altar-muted text-sm leading-relaxed mb-2">
                        Your personal mystic companion
                    </p>
                    <p className="text-altar-muted/60 text-xs leading-relaxed mb-8">
                        Tarot readings, natal charts, numerology, and daily horoscopes — all personalized to your cosmic blueprint.
                    </p>
                    <button
                        onClick={() => setStep('value1')}
                        className="w-full py-4 rounded-2xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 text-base font-display font-semibold tracking-wide transition-all hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,215,0,0.2)] hover:border-altar-gold/40 active:scale-[0.98]"
                    >
                        ✦ Begin Your Journey ✦
                    </button>
                    <p className="text-[10px] text-altar-muted/40 mt-4">For entertainment and self-reflection · Your data stays on your device</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <button onClick={() => openLegal('privacy')} className="text-[10px] text-altar-gold/40 hover:text-altar-gold transition-colors underline">Privacy Policy</button>
                        <span className="text-white/10 text-[10px]">·</span>
                        <button onClick={() => openLegal('terms')} className="text-[10px] text-altar-gold/40 hover:text-altar-gold transition-colors underline">Terms of Service</button>
                    </div>
                </div>
            )}

            {/* ── Value Carousel Screen 1 ── */}
            {step === 'value1' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full" style={{ marginTop: '-5vh' }}>
                    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-altar-mid/60 to-altar-bright/40 flex items-center justify-center shadow-[0_0_40px_rgba(139,95,191,0.3)]">
                        <span className="text-4xl">🔮</span>
                    </div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-3">PERSONALIZED TAROT</h2>
                    <p className="text-sm text-altar-muted leading-relaxed mb-2">
                        Daily readings drawn from a full 78-card deck, each interpretation personalized to your cosmic profile.
                    </p>
                    <p className="text-xs text-altar-muted/50 mb-8">
                        Three-card spreads, Celtic Cross, career paths, and more — all aligned to your stars.
                    </p>
                    <button
                        onClick={() => setStep('value2')}
                        className="w-full py-3.5 rounded-xl font-display tracking-wide transition-all bg-altar-gold/15 text-altar-gold border border-altar-gold/25 hover:border-altar-gold/50"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* ── Value Carousel Screen 2 ── */}
            {step === 'value2' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full" style={{ marginTop: '-5vh' }}>
                    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-800/40 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                        <span className="text-4xl">⭐</span>
                    </div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-3">YOUR COSMIC BLUEPRINT</h2>
                    <p className="text-sm text-altar-muted leading-relaxed mb-2">
                        A complete natal chart with your Sun, Moon, and Rising signs — revealing who you are, how you feel, and how the world sees you.
                    </p>
                    <p className="text-xs text-altar-muted/50 mb-8">
                        Planetary transits, house placements, and aspect patterns mapped to your exact birth moment.
                    </p>
                    <button
                        onClick={() => setStep('value3')}
                        className="w-full py-3.5 rounded-xl font-display tracking-wide transition-all bg-altar-gold/15 text-altar-gold border border-altar-gold/25 hover:border-altar-gold/50"
                    >
                        Next →
                    </button>
                    <button onClick={() => setStep('value1')} className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors">← Back</button>
                </div>
            )}

            {/* ── Value Carousel Screen 3 ── */}
            {step === 'value3' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full" style={{ marginTop: '-5vh' }}>
                    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-900/60 to-orange-800/40 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                        <span className="text-4xl">📖</span>
                    </div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-3">DAILY GUIDANCE</h2>
                    <p className="text-sm text-altar-muted leading-relaxed mb-2">
                        Horoscopes, numerology, angel numbers, and cosmic timing — all updated daily to guide your journey.
                    </p>
                    <p className="text-xs text-altar-muted/50 mb-8">
                        Your Life Path Number, transit alerts, and personalized insights — everything in one sacred space.
                    </p>
                    <button
                        onClick={() => setStep('name')}
                        className="w-full py-3.5 rounded-xl font-display tracking-wide transition-all bg-altar-gold/15 text-altar-gold border border-altar-gold/25 hover:border-altar-gold/50"
                    >
                        Let's Get Started →
                    </button>
                    <button onClick={() => setStep('value2')} className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors">← Back</button>
                </div>
            )}

            {/* ── Name ── */}
            {step === 'name' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full mx-auto" style={{ marginTop: '-5vh' }}>
                    <div className="text-4xl mb-4">✨</div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-2">WHAT SHALL I CALL YOU?</h2>
                    <p className="text-sm text-altar-muted mb-6">The cards respond to intention — speaking your name anchors the reading.</p>

                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name or alias"
                        autoFocus
                        className="w-full bg-altar-deep/60 text-center text-lg text-altar-text placeholder-altar-muted/40 rounded-xl px-4 py-3.5 border border-white/10 focus:border-altar-gold/30 focus:outline-none transition-colors font-display tracking-wide"
                        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep('birthday'); }}
                    />

                    <button
                        onClick={() => setStep('birthday')}
                        disabled={!name.trim()}
                        className={`w-full mt-5 py-3.5 rounded-xl font-display tracking-wide transition-all ${name.trim()
                            ? 'bg-altar-gold/15 text-altar-gold border border-altar-gold/25 hover:border-altar-gold/50'
                            : 'bg-white/5 text-white/40 border border-white/5 cursor-not-allowed'
                            }`}
                    >
                        Continue →
                    </button>
                    <button onClick={() => setStep('value3')} className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors">← Back</button>
                </div>
            )}

            {/* ── Birthday ── */}
            {step === 'birthday' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full">
                    <div className="text-4xl mb-4">🌙</div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-2">YOUR BIRTH DATE</h2>
                    <p className="text-sm text-altar-muted mb-6">
                        This unlocks your natal chart, life path number, and daily horoscope.
                    </p>

                    <input
                        type="date"
                        value={birthday}
                        onChange={e => setBirthday(e.target.value)}
                        className="w-full bg-altar-deep/60 text-center text-lg text-altar-text rounded-xl px-4 py-3.5 border border-white/10 focus:border-altar-gold/30 focus:outline-none transition-colors"
                    />

                    {sunSign && (
                        <div className="mt-4 flex items-center justify-center gap-2 animate-fade-up">
                            <span className="text-2xl">{sunSign.glyph}</span>
                            <span className="text-sm text-altar-gold font-display">{sunSign.name}</span>
                            <span className="text-xs text-altar-muted">· {sunSign.element}</span>
                        </div>
                    )}

                    <button
                        onClick={() => setStep('birthdetails')}
                        disabled={!birthday}
                        className={`w-full mt-5 py-3.5 rounded-xl font-display tracking-wide transition-all ${birthday
                            ? 'bg-altar-gold/15 text-altar-gold border border-altar-gold/25 hover:border-altar-gold/50'
                            : 'bg-white/5 text-white/40 border border-white/5 cursor-not-allowed'
                            }`}
                    >
                        Continue →
                    </button>

                    <button onClick={() => setStep('name')} className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors">← Back</button>
                </div>
            )}

            {/* ── Birth Time & City ── */}
            {step === 'birthdetails' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full">
                    <div className="text-4xl mb-4">🔮</div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-2">BIRTH DETAILS</h2>
                    <p className="text-sm text-altar-muted mb-6">
                        Your birth time and city unlock your <span className="text-altar-gold">Rising sign</span> — how the world sees you.
                    </p>

                    {/* Birth Time */}
                    <div className="mb-4">
                        <label className="text-xs text-altar-muted/60 font-display tracking-wider block mb-2">BIRTH TIME</label>
                        <input
                            type="time"
                            value={birthTime}
                            onChange={e => setBirthTime(e.target.value)}
                            className="w-full bg-altar-deep/60 text-center text-lg text-altar-text rounded-xl px-4 py-3.5 border border-white/10 focus:border-altar-gold/30 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Birth City */}
                    <div className="mb-4 relative">
                        <label className="text-xs text-altar-muted/60 font-display tracking-wider block mb-2">BIRTH CITY</label>
                        <input
                            type="text"
                            value={cityQuery}
                            onChange={e => handleCitySearch(e.target.value)}
                            placeholder="Search your birth city..."
                            className="w-full bg-altar-deep/60 text-center text-base text-altar-text placeholder-altar-muted/40 rounded-xl px-4 py-3.5 border border-white/10 focus:border-altar-gold/30 focus:outline-none transition-colors"
                        />

                        {/* City dropdown */}
                        {cityResults.length > 0 && !selectedCity && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-altar-deep/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-52 overflow-y-auto">
                                {cityResults.map((city, i) => (
                                    <button
                                        key={city.placeId || i}
                                        onClick={() => handleCitySelect(city)}
                                        className="w-full text-left px-4 py-3 text-sm text-altar-text hover:bg-altar-gold/10 transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <span className="text-altar-gold/80">📍</span> {city.description}
                                    </button>
                                ))}
                            </div>
                        )}

                        {resolving && (
                            <p className="mt-2 text-xs text-altar-gold/60 animate-pulse">Resolving location…</p>
                        )}

                        {selectedCity && (
                            <div className="mt-2 flex items-center justify-center gap-2 animate-fade-up">
                                <span className="text-altar-gold/60">📍</span>
                                <span className="text-xs text-altar-gold">{selectedCity.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Info about optional */}
                    <p className="text-[10px] text-altar-muted/40 mb-4">
                        These are optional but give you the most accurate natal chart.
                    </p>

                    <button
                        onClick={() => {
                            setStep('reveal');
                            setRevealReady(false);
                            setTimeout(() => setRevealReady(true), 1200);
                        }}
                        className="w-full py-3.5 rounded-xl font-display tracking-wide transition-all bg-altar-gold/15 text-altar-gold border border-altar-gold/25 hover:border-altar-gold/50"
                    >
                        Reveal My Stars →
                    </button>

                    <button onClick={() => setStep('birthday')} className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors">← Back</button>
                </div>
            )}

            {/* ── Enriched Reveal ── */}
            {step === 'reveal' && sunSign && (
                <div className="text-center max-w-[380px] w-full overflow-y-auto max-h-[85vh] pb-6">
                    {/* Animated zodiac reveal */}
                    <div className="animate-card-entrance">
                        <div className="relative w-24 h-24 mx-auto mb-5">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-altar-mid to-altar-bright shadow-[0_0_60px_rgba(139,95,191,0.5)] animate-pulse-glow" />
                            <div className="absolute inset-0 flex items-center justify-center text-5xl">
                                {sunSign.glyph}
                            </div>
                        </div>

                        <h2 className="font-display text-2xl text-altar-gold tracking-[4px] mb-1">
                            {sunSign.name.toUpperCase()}
                        </h2>
                        <p className="text-sm text-altar-muted mb-1">{sunSign.dates}</p>
                        <p className="text-xs text-altar-muted/60 mb-5">
                            {sunSign.element} Sign · Ruled by {sunSign.ruling}
                        </p>

                        <p className="text-sm text-altar-text/80 leading-relaxed mb-5">
                            Welcome, <span className="text-altar-gold font-display">{name}</span>. The stars have been waiting for you.
                        </p>
                    </div>

                    {/* ── Today's Horoscope Preview ── */}
                    {horoscope && (
                        <div className="glass-strong rounded-xl p-4 mb-4 text-left animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm">{sunSign.glyph}</span>
                                <span className="text-[11px] font-display text-altar-gold tracking-[2px] uppercase">{sunSign.name} Today</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-altar-gold/10 text-altar-gold/70 ml-auto">{horoscope.mood}</span>
                            </div>
                            <p className="text-xs text-altar-text/70 leading-relaxed italic">
                                "{horoscope.daily}"
                            </p>
                        </div>
                    )}

                    {/* ── Life Path Number ── */}
                    {lifePathNumber !== null && (
                        <div className="glass-strong rounded-xl p-4 mb-4 text-left animate-fade-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-altar-gold/15 border border-altar-gold/25 flex items-center justify-center">
                                    <span className="font-display text-altar-gold text-sm font-bold">{lifePathNumber}</span>
                                </div>
                                <span className="text-[10px] font-display text-altar-gold tracking-[2px] uppercase">Life Path Number</span>
                            </div>
                            <p className="text-xs text-altar-text/70 leading-relaxed">
                                {LIFE_PATH_BRIEF[lifePathNumber] || `Life Path ${lifePathNumber} — a rare and powerful vibration`}
                            </p>
                        </div>
                    )}



                    {revealReady && (
                        <button
                            onClick={() => setStep('notifications')}
                            className="w-full py-4 rounded-2xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 text-base font-display font-semibold tracking-wide animate-fade-up transition-all hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,215,0,0.2)] hover:border-altar-gold/40 active:scale-[0.98]"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            )}

            {/* ── Notification Permission ── */}
            {step === 'notifications' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full" style={{ marginTop: '-5vh' }}>
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-altar-mid/40 to-altar-bright/20 flex items-center justify-center shadow-[0_0_40px_rgba(139,95,191,0.2)]">
                        <span className="text-4xl">🔔</span>
                    </div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-2">DAILY COSMIC GUIDANCE</h2>
                    <p className="text-sm text-altar-muted leading-relaxed mb-6">
                        Get gentle reminders aligned to your chart:
                    </p>

                    <div className="space-y-2.5 mb-6">
                        {[
                            { icon: '🌅', text: 'Morning horoscope and daily card' },
                            { icon: '🌑', text: 'New moon and full moon rituals' },
                            { icon: '🪐', text: 'Transit alerts when planets shift' },
                            { icon: '📓', text: 'Evening journal reflection nudges' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 glass rounded-xl px-4 py-3 animate-fade-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                                <span className="text-base">{item.icon}</span>
                                <span className="text-xs text-altar-text">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleNotificationRequest}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 font-display font-semibold tracking-wide transition-all hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(255,215,0,0.15)] active:scale-[0.98]"
                    >
                        Enable Notifications
                    </button>

                    <button
                        onClick={() => setStep('paywall')}
                        className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors"
                    >
                        Not now
                    </button>
                </div>
            )}

            {/* ── Soft Paywall ── */}
            {step === 'paywall' && (
                <div className="text-center max-w-[380px] w-full overflow-y-auto max-h-[90vh] pb-4" style={{ marginTop: '-2vh' }}>
                    <div className="animate-fade-up">
                        <div className="text-2xl mb-2">👑</div>
                        <h2 className="font-display text-xl shimmer-text font-semibold tracking-wide mb-1">
                            Unlock Your Full Journey
                        </h2>
                        <p className="text-xs text-altar-muted mb-4">
                            Elevate your mystical experience
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-3">
                        {[
                            { icon: '🌙', text: 'Year Ahead Forecast — personalized to your chart' },
                            { icon: '🔮', text: 'Unlimited Tarot — all spreads, no daily cap' },
                            { icon: '📊', text: 'Celtic Cross, Career Path & Compatibility' },
                            { icon: '🎵', text: 'Full Sound Library — Solfeggio & Breathwork Codex' },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 glass rounded-xl px-3 py-2.5 animate-fade-up"
                                style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
                            >
                                <span className="text-base">{feature.icon}</span>
                                <span className="text-[13px] text-altar-text font-medium leading-tight">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Social Proof */}


                    {/* Free Trial Badge */}
                    <div className="flex justify-center mb-3">
                        <div className="px-3.5 py-1 rounded-full text-[10px] font-display tracking-wider"
                            style={{
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                                border: '1px solid rgba(212,175,55,0.3)',
                                color: '#d4af37',
                            }}>
                            ✦ 7-Day Free Trial — Cancel Anytime
                        </div>
                    </div>

                    {/* Plan Selector */}
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                        {(['MONTHLY', 'YEARLY'] as const).map((key) => {
                            const plan = PRODUCTS[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedPlan(key)}
                                    className={`relative rounded-2xl p-3 text-center transition-all border-2 ${selectedPlan === key
                                        ? 'border-altar-gold bg-altar-gold/10 shadow-[0_0_20px_rgba(255,215,0,0.15)]'
                                        : 'border-white/10 glass hover:border-white/20'
                                        }`}
                                >
                                    {plan.savings && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-[10px] text-white font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {plan.savings}
                                        </span>
                                    )}
                                    <div className="text-[11px] text-altar-muted mb-0.5 font-medium">{plan.label}</div>
                                    <div className="font-display text-base text-white font-semibold">
                                        {plan.price}
                                        <span className="text-[11px] text-altar-muted font-sans">{plan.period}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Error */}
                    {purchaseError && (
                        <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                            <p className="text-xs text-red-300">{purchaseError}</p>
                        </div>
                    )}

                    {/* Subscribe Button */}
                    <button
                        onClick={handlePurchase}
                        disabled={isPurchasing || isRestoring}
                        className={`w-full py-3.5 rounded-2xl font-display font-bold text-base tracking-wide transition-all ${!isPurchasing && !isRestoring
                            ? 'bg-gradient-to-r from-altar-gold via-altar-gold-dim to-altar-gold text-altar-deep hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        {isPurchasing ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-altar-deep/30 border-t-altar-deep rounded-full animate-spin" />
                                Processing…
                            </span>
                        ) : (
                            `Start Free Trial — then ${PRODUCTS[selectedPlan].price}${PRODUCTS[selectedPlan].period}`
                        )}
                    </button>

                    {/* Restore */}
                    <button
                        onClick={handleRestore}
                        disabled={isPurchasing || isRestoring}
                        className="w-full mt-2 py-2 rounded-xl text-xs text-altar-muted hover:text-white transition-colors disabled:opacity-50"
                    >
                        {isRestoring ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Restoring…
                            </span>
                        ) : (
                            'Restore Purchases'
                        )}
                    </button>

                    {/* Skip */}
                    <button
                        onClick={() => setStep('consent')}
                        className="mt-1 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors"
                    >
                        Continue Free →
                    </button>

                    {/* Subscription terms */}
                    <div className="mt-2">
                        <p className="text-center text-[10px] text-white/40 leading-snug">
                            Payment charged to Apple ID at purchase. Auto-renews unless cancelled 24 hrs before period ends. Manage in App Store settings.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[10px] mt-1.5">
                            <button onClick={() => openLegal('terms')} className="text-altar-gold/40 hover:text-altar-gold transition-colors underline">Terms</button>
                            <span className="text-white/10">·</span>
                            <button onClick={() => openLegal('privacy')} className="text-altar-gold/40 hover:text-altar-gold transition-colors underline">Privacy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── AI Consent ── */}
            {step === 'consent' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full">
                    <div className="text-4xl mb-4">🔮</div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-2">MYSTIC INSIGHTS</h2>
                    <p className="text-sm text-altar-muted mb-5">
                        Arcana Whisper channels deep, personalized reading interpretations for you.
                    </p>

                    <div className="glass-strong rounded-xl p-4 text-left mb-5">
                        <p className="text-xs text-altar-text font-medium mb-3">When you request a personalized interpretation:</p>
                        <ul className="space-y-2 text-[11px] text-altar-muted">
                            <li className="flex gap-2"><span className="text-altar-gold">•</span> Your card selections and reading theme are sent to generate your reading</li>
                            <li className="flex gap-2"><span className="text-altar-gold">•</span> Your zodiac sign and birth data may be included for personalization</li>
                            <li className="flex gap-2"><span className="text-altar-gold">•</span> Readings are channeled through <span className="text-altar-gold">a secure third-party service</span></li>
                            <li className="flex gap-2"><span className="text-altar-gold">•</span> All other data stays on your device</li>
                        </ul>
                        <button onClick={() => openLegal('privacy')} className="mt-3 text-[10px] text-altar-gold/60 hover:text-altar-gold transition-colors underline">
                            Read our Privacy Policy →
                        </button>
                    </div>

                    <button
                        onClick={() => setAiConsent(!aiConsent)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all mb-4 ${aiConsent
                                ? 'border-altar-gold/30 bg-altar-gold/10'
                                : 'border-white/10 glass'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${aiConsent ? 'border-altar-gold bg-altar-gold text-altar-deep' : 'border-white/20'
                            }`}>
                            {aiConsent && <span className="text-xs font-bold">✓</span>}
                        </div>
                        <span className="text-xs text-altar-text text-left">I consent to my reading data being processed by a third-party service for personalized interpretations</span>
                    </button>

                    <button
                        onClick={() => {
                            safeStorage.setItem('ai_consent', JSON.stringify({ consented: aiConsent, timestamp: new Date().toISOString() }));
                            handleFinish();
                        }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 text-base font-display font-semibold tracking-wide transition-all hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,215,0,0.2)] hover:border-altar-gold/40 active:scale-[0.98]"
                    >
                        ✦ Enter the Altar ✦
                    </button>

                    <p className="text-[10px] text-altar-muted/40 mt-3">
                        You can still use tarot, astrology, and numerology without personalized insights. {!aiConsent && 'Personalized readings will be disabled.'}
                    </p>

                    <button onClick={() => setStep('paywall')} className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors">← Back</button>
                </div>
            )}

            {/* Step indicator */}
            {step !== 'welcome' && (
                <div className="absolute bottom-8 flex gap-1.5">
                    {PROGRESS_STEPS.map((s) => (
                        <div
                            key={s}
                            className={`h-1 rounded-full transition-all duration-500 ${step === s || progressIndex > PROGRESS_STEPS.indexOf(s)
                                ? 'w-4 bg-altar-gold/60'
                                : 'w-1.5 bg-white/15'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
