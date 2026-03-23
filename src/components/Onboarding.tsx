import React from 'react';
import { saveBirthData, getSunSign, saveDestinyName } from '../services/astrology.service';
import { searchPlaces, resolvePlace, PlaceSuggestion } from '../services/geocoding.service';
import { safeStorage } from '../services/storage.service';

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

const STEPS = ['welcome', 'name', 'birthday', 'birthdetails', 'consent', 'reveal'] as const;

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

    const sunSign = birthday ? getSunSign(birthday) : null;

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

    const handleDetailsNext = () => {
        setStep('consent');
    };

    const handleConsentNext = () => {
        safeStorage.setItem('ai_consent', JSON.stringify({ consented: aiConsent, timestamp: new Date().toISOString() }));
        setStep('reveal');
        setTimeout(() => setRevealReady(true), 1200);
    };

    const stepIndex = STEPS.indexOf(step);

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
                        onClick={() => setStep('name')}
                        className="w-full py-4 rounded-2xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 text-base font-display font-semibold tracking-wide transition-all hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,215,0,0.2)] hover:border-altar-gold/40 active:scale-[0.98]"
                    >
                        ✦ Begin Your Journey ✦
                    </button>
                    <p className="text-[10px] text-altar-muted/40 mt-4">Anonymous & private · Your data stays on your device</p>
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
                            : 'bg-white/5 text-white/25 border border-white/5 cursor-not-allowed'
                            }`}
                    >
                        Continue →
                    </button>
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
                            : 'bg-white/5 text-white/25 border border-white/5 cursor-not-allowed'
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
                        onClick={handleDetailsNext}
                        className="w-full py-3.5 rounded-xl font-display tracking-wide transition-all bg-altar-gold/15 text-altar-gold border border-altar-gold/25 hover:border-altar-gold/50"
                    >
                        Reveal My Stars →
                    </button>

                    <button onClick={() => setStep('birthday')} className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors">← Back</button>
                </div>
            )}

            {/* ── AI Consent ── */}
            {step === 'consent' && (
                <div className="text-center max-w-[380px] animate-fade-up w-full">
                    <div className="text-4xl mb-4">🤖</div>
                    <h2 className="font-display text-xl text-altar-gold tracking-[3px] mb-2">AI-POWERED INSIGHTS</h2>
                    <p className="text-sm text-altar-muted mb-5">
                        Arcana Whisper uses AI to create personalized reading interpretations.
                    </p>

                    <div className="glass-strong rounded-xl p-4 text-left mb-5">
                        <p className="text-xs text-altar-text font-medium mb-3">When you request an AI interpretation:</p>
                        <ul className="space-y-2 text-[11px] text-altar-muted">
                            <li className="flex gap-2"><span className="text-altar-gold">•</span> Your card selections and reading theme are sent to our AI provider</li>
                            <li className="flex gap-2"><span className="text-altar-gold">•</span> Your zodiac sign and birth data may be included for personalization</li>
                            <li className="flex gap-2"><span className="text-altar-gold">•</span> Data is processed by <span className="text-altar-gold">OpenRouter</span> (third-party AI service)</li>
                            <li className="flex gap-2"><span className="text-altar-gold">•</span> All other data stays on your device</li>
                        </ul>
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
                        <span className="text-xs text-altar-text text-left">I consent to my reading data being processed by a third-party AI service</span>
                    </button>

                    <button
                        onClick={handleConsentNext}
                        className="w-full py-3.5 rounded-xl font-display tracking-wide transition-all bg-altar-gold/15 text-altar-gold border border-altar-gold/25 hover:border-altar-gold/50"
                    >
                        Continue →
                    </button>

                    <p className="text-[10px] text-altar-muted/40 mt-3">
                        You can still use tarot, astrology, and numerology without AI. {!aiConsent && 'AI features will be disabled.'}
                    </p>

                    <button onClick={() => setStep('birthdetails')} className="mt-3 text-xs text-altar-muted/50 hover:text-altar-muted transition-colors">← Back</button>
                </div>
            )}

            {/* ── Reveal ── */}
            {step === 'reveal' && sunSign && (
                <div className="text-center max-w-[380px] w-full">
                    {/* Animated zodiac reveal */}
                    <div className="animate-card-entrance">
                        <div className="relative w-28 h-28 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-altar-mid to-altar-bright shadow-[0_0_60px_rgba(139,95,191,0.5)] animate-pulse-glow" />
                            <div className="absolute inset-0 flex items-center justify-center text-6xl">
                                {sunSign.glyph}
                            </div>
                        </div>

                        <h2 className="font-display text-2xl text-altar-gold tracking-[4px] mb-1">
                            {sunSign.name.toUpperCase()}
                        </h2>
                        <p className="text-sm text-altar-muted mb-1">{sunSign.dates}</p>
                        <p className="text-xs text-altar-muted/60 mb-6">
                            {sunSign.element} Sign · Ruled by {sunSign.ruling}
                        </p>

                        <p className="text-sm text-altar-text/80 leading-relaxed mb-8">
                            Welcome, <span className="text-altar-gold font-display">{name}</span>. The stars have been waiting for you.
                            Your {sunSign.name} energy guides your readings from this moment forward.
                        </p>
                    </div>

                    {revealReady && (
                        <button
                            onClick={handleFinish}
                            className="w-full py-4 rounded-2xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 text-base font-display font-semibold tracking-wide animate-fade-up transition-all hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,215,0,0.2)] hover:border-altar-gold/40 active:scale-[0.98]"
                        >
                            ✦ Enter the Altar ✦
                        </button>
                    )}
                </div>
            )}

            {/* Step indicator */}
            {step !== 'welcome' && (
                <div className="absolute bottom-8 flex gap-2">
                    {['name', 'birthday', 'birthdetails', 'consent', 'reveal'].map((s) => (
                        <div
                            key={s}
                            className={`h-1 rounded-full transition-all duration-500 ${step === s || stepIndex > STEPS.indexOf(s as any)
                                ? 'w-6 bg-altar-gold/60'
                                : 'w-2 bg-white/15'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
