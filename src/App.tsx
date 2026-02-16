import React from 'react';
import { TarotService } from './services/tarot.service';
import { Card, Reading } from './models/card.model';
import { HeroCard } from './components/HeroCard';
import { MindBodySpiritFloat } from './components/MindBodySpiritFloat';
import { PremiumOverlay } from './components/PremiumOverlay';
import { ShareCardButton } from './components/ShareCardButton';
import { CustomReading } from './components/CustomReading';
import { ReadingResult } from './components/ReadingResult';
import { ProfileModal } from './components/ProfileModal';
import { ReadingHistory } from './components/ReadingHistory';
import { BottomNav } from './components/BottomNav';
import { CardLibrary } from './components/CardLibrary';
import { CardDetail } from './components/CardDetail';
import { NatalChart } from './components/NatalChart';
import { Numerology } from './components/Numerology';
import { Horoscope } from './components/Horoscope';
import { Compatibility } from './components/Compatibility';
import { Onboarding } from './components/Onboarding';
import { canDoReading, incrementReadingCount, getRemainingReadings } from './services/ai.service';
import { recordReading } from './services/memory.service';
import { fireReminder } from './services/reminder.service';
import { getBirthData, getSunSign, getDailyHoroscope } from './services/astrology.service';

/* ── Ambient particle backdrop ── */
function AltarParticles() {
    const particles = React.useMemo(() => {
        const chars = ['✦', '✧', '·', '⊹', '✶', '☆'];
        return Array.from({ length: 30 }, (_, i) => ({
            char: chars[i % chars.length],
            left: `${(i * 29 + 11) % 100}%`,
            top: `${(i * 41 + 17) % 100}%`,
            delay: `${(i * 0.7) % 10}s`,
            duration: `${8 + (i % 5) * 3}s`,
            size: i % 4 === 0 ? 'text-sm' : 'text-xs',
            opacity: i % 3 === 0 ? 'opacity-30' : 'opacity-15',
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p, i) => (
                <span
                    key={i}
                    className={`absolute ${p.size} ${p.opacity} text-altar-gold animate-particle`}
                    style={{
                        left: p.left,
                        top: p.top,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                    }}
                >
                    {p.char}
                </span>
            ))}
        </div>
    );
}

/* ── Mystic Loading Screen ── */
function MysticLoader({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple flex items-center justify-center relative overflow-hidden">
            <AltarParticles />
            {/* Central glow */}
            <div className="absolute w-[200px] h-[200px] rounded-full bg-altar-gold/10 blur-[100px] animate-pulse-glow" />
            <div className="text-center z-10">
                <div className="text-5xl mb-5 animate-float">🔮</div>
                <h1 className="font-display text-2xl text-altar-gold tracking-[5px] mb-3">ARCANA WHISPER</h1>
                <p className="text-sm text-altar-muted animate-pulse">{message}</p>
                {/* Mystical loading bar */}
                <div className="mt-6 w-48 h-[2px] mx-auto bg-altar-purple rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-transparent via-altar-gold to-transparent animate-shimmer" style={{ width: '200%' }} />
                </div>
            </div>
        </div>
    );
}

/* ── Horoscope Snippet for Home ── */
function HoroscopeSnippet({ onTap }: { onTap: () => void }) {
    const birthData = getBirthData();
    const sign = birthData ? getSunSign(birthData.birthday) : null;
    const horoscope = sign ? getDailyHoroscope(sign.id) : null;

    return (
        <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.65s', opacity: 0 }}>
            <button onClick={onTap} className="w-full text-left group">
                <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-indigo-900/30 p-4 transition-all group-hover:border-altar-gold/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />
                    <div className="relative flex items-start gap-3">
                        {sign ? (
                            <>
                                <div className="w-10 h-10 rounded-full bg-altar-mid/60 flex items-center justify-center text-xl shrink-0 shadow-[0_0_15px_rgba(139,95,191,0.2)]">
                                    {sign.glyph}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-display text-altar-gold tracking-[2px] uppercase">{sign.name} Today</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-altar-gold/10 text-altar-gold/70">{horoscope?.mood}</span>
                                    </div>
                                    <p className="text-xs text-altar-text/70 leading-relaxed line-clamp-2 italic">
                                        "{horoscope?.daily}"
                                    </p>
                                    <span className="text-[10px] text-altar-gold/50 mt-1 inline-block group-hover:text-altar-gold/80 transition-colors">
                                        Read full horoscope →
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 w-full">
                                <span className="text-2xl">✨</span>
                                <div>
                                    <p className="text-xs font-display text-altar-muted tracking-[2px] uppercase">Daily Horoscope</p>
                                    <p className="text-[10px] text-altar-muted/60 mt-0.5">Enter your birthday to unlock</p>
                                </div>
                                <span className="text-altar-gold/50 ml-auto">→</span>
                            </div>
                        )}
                    </div>
                </div>
            </button>
        </div>
    );
}

/* ── Inline Premium CTA Banner ── */
function PremiumBanner({ onClick }: { onClick: () => void }) {
    return (
        <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <button
                onClick={onClick}
                className="w-full relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-altar-gold/50 via-altar-bright/30 to-altar-gold/50 group cursor-pointer"
            >
                <div className="rounded-2xl px-5 py-4 bg-altar-dark/90 backdrop-blur-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">👑</span>
                        <div className="text-left">
                            <span className="shimmer-text font-display text-sm font-semibold">Unlock Premium</span>
                            <p className="text-xs text-altar-muted mt-0.5">AI Insights · Unlimited Readings</p>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-altar-gold/10 border border-altar-gold/30 text-xs text-altar-gold font-medium group-hover:border-altar-gold/60 transition-colors">
                        $4.99/mo
                    </div>
                </div>
            </button>
        </div>
    );
}

/* ── Main App ── */
function App() {
    const [currentCard, setCurrentCard] = React.useState<Card | null>(null);
    const [energyCards, setEnergyCards] = React.useState<Card[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showCustomReading, setShowCustomReading] = React.useState(false);
    const [customReadingResult, setCustomReadingResult] = React.useState<Reading | null>(null);
    const [isShuffling, setIsShuffling] = React.useState(false);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);
    const [showProfileModal, setShowProfileModal] = React.useState(false);
    const [showHistory, setShowHistory] = React.useState(false);
    const [currentTab, setCurrentTab] = React.useState('home');
    const [selectedCard, setSelectedCard] = React.useState<Card | null>(null);
    const [showCardLibrary, setShowCardLibrary] = React.useState(false);
    const [showPremiumOverlay, setShowPremiumOverlay] = React.useState(false);
    const [showShareCard, setShowShareCard] = React.useState(false);
    const [showNatalChart, setShowNatalChart] = React.useState(false);
    const [showNumerology, setShowNumerology] = React.useState(false);
    const [showHoroscope, setShowHoroscope] = React.useState(false);
    const [showCompatibility, setShowCompatibility] = React.useState(false);

    const [userProfile, setUserProfile] = React.useState<any>(() => {
        try {
            const profile = localStorage.getItem('userProfile');
            return profile ? JSON.parse(profile) : null;
        } catch (error) {
            console.error('Error parsing user profile:', error);
            return null;
        }
    });

    const loadCard = React.useCallback(async () => {
        setIsShuffling(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const tarotService = new TarotService();
        const reading = tarotService.getDailyReading();
        setCurrentCard(reading.cards[0]);

        const energyReading = tarotService.getCustomReading('three-card', 'general');
        setEnergyCards(energyReading.cards);

        setIsShuffling(false);
    }, []);

    const handleCustomReadingComplete = (readingData: any) => {
        const tarotService = new TarotService();
        const reading = tarotService.getCustomReading(
            readingData.spread,
            readingData.theme,
            readingData.question
        );
        incrementReadingCount();
        recordReading(readingData.theme, readingData.question, reading.cards);
        setCustomReadingResult(reading);
        setShowCustomReading(false);
    };

    const handleOnboardingComplete = (profile: { name: string; birthday: string; zodiac: string }) => {
        const newProfile = { ...profile, subscription: 'free' };
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
        setUserProfile(newProfile);
    };

    const sub = userProfile?.subscription || 'free';

    // ── Onboarding gate ──
    if (!userProfile) {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    const handleTabChange = (tab: string) => {
        // Close all pages first
        setShowCustomReading(false);
        setCustomReadingResult(null);
        setShowCardLibrary(false);
        setShowHistory(false);
        setShowProfileModal(false);
        setSelectedCard(null);
        setShowNatalChart(false);
        setShowNumerology(false);
        setShowHoroscope(false);
        setShowCompatibility(false);

        setCurrentTab(tab);
        if (tab === 'new') {
            if (!canDoReading(sub)) {
                setShowPremiumOverlay(true);
                return;
            }
            setShowCustomReading(true);
        }
        else if (tab === 'meanings') setShowCardLibrary(true);
        else if (tab === 'history') setShowHistory(true);
        else if (tab === 'profile') setShowProfileModal(true);
        else if (tab === 'natal') setShowNatalChart(true);
        else if (tab === 'numerology') setShowNumerology(true);
        else if (tab === 'horoscope') setShowHoroscope(true);
        else if (tab === 'compatibility') setShowCompatibility(true);
    };

    React.useEffect(() => {
        const initializeApp = async () => {
            setIsLoading(true);
            if (isInitialLoad) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                setIsInitialLoad(false);
            }
            await loadCard();
            setIsLoading(false);
            // Check and fire daily reminder
            fireReminder();
        };
        initializeApp();
    }, [loadCard, isInitialLoad]);

    // ── Loading ──
    if (isLoading) {
        return (
            <MysticLoader
                message={isInitialLoad ? 'Opening the portal…' : 'Drawing your daily guidance…'}
            />
        );
    }

    if (!currentCard) return null;

    // ── Sub-screens (preserve all existing routing) ──
    if (selectedCard) {
        return (
            <CardDetail
                card={selectedCard}
                onClose={() => setSelectedCard(null)}
                currentTab={currentTab}
                onTabChange={handleTabChange}
                subscription={sub}
            />
        );
    }

    if (showCardLibrary) {
        return (
            <CardLibrary
                onClose={() => { setShowCardLibrary(false); setCurrentTab('home'); }}
                onViewCard={(card) => { setSelectedCard(card); setShowCardLibrary(false); }}
                currentTab={currentTab}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showHistory) {
        return (
            <ReadingHistory
                onClose={() => setShowHistory(false)}
                onViewReading={(reading) => { setCustomReadingResult(reading); setShowHistory(false); }}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showProfileModal) {
        return (
            <ProfileModal
                onClose={() => { setShowProfileModal(false); setCurrentTab('home'); }}
                userProfile={userProfile}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showNatalChart) {
        return (
            <NatalChart
                onClose={() => { setShowNatalChart(false); setCurrentTab('home'); }}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showNumerology) {
        return (
            <Numerology
                onClose={() => { setShowNumerology(false); setCurrentTab('home'); }}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showHoroscope) {
        return (
            <Horoscope
                onClose={() => { setShowHoroscope(false); setCurrentTab('home'); }}
                onTabChange={handleTabChange}
                subscription={sub}
            />
        );
    }

    if (showCompatibility) {
        return (
            <Compatibility
                onClose={() => { setShowCompatibility(false); setCurrentTab('home'); }}
                onTabChange={handleTabChange}
            />
        );
    }

    // ── MYSTIC ALTAR — Main Screen ──
    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                <AltarParticles />

                {/* Overlays */}
                {showCustomReading && (
                    <CustomReading
                        onClose={() => { setShowCustomReading(false); setCurrentTab('home'); }}
                        onComplete={handleCustomReadingComplete}
                        subscription={userProfile?.subscription || 'free'}
                        onTabChange={handleTabChange}
                    />
                )}
                {customReadingResult && (
                    <ReadingResult
                        reading={customReadingResult}
                        onClose={() => setCustomReadingResult(null)}
                        onTabChange={handleTabChange}
                        subscription={sub}
                    />
                )}

                {showPremiumOverlay && (
                    <PremiumOverlay
                        onClose={() => setShowPremiumOverlay(false)}
                        onSubscribe={() => {
                            // Activate premium
                            const updated = { ...userProfile, subscription: 'premium' };
                            localStorage.setItem('userProfile', JSON.stringify(updated));
                            setUserProfile(updated);
                            setShowPremiumOverlay(false);
                        }}
                    />
                )}

                {/* ── Header ── */}
                <header className="relative text-center py-6 z-10 safe-top">
                    <div className="absolute inset-0 bg-gradient-to-b from-altar-deep to-transparent" />
                    <h1 className="relative font-display text-2xl tracking-[5px] font-semibold">
                        <span className="text-altar-gold animate-pulse">✦</span>
                        <span className="shimmer-text mx-2">ARCANA WHISPER</span>
                        <span className="text-altar-gold animate-pulse">✦</span>
                    </h1>
                    <p className="relative text-xs text-altar-muted tracking-[3px] mt-1 uppercase">The Mystic Altar</p>
                </header>

                {/* ── Main Content ── */}
                <main className="relative z-10 max-w-[500px] mx-auto">
                    {/* Hero Card */}
                    <HeroCard
                        card={currentCard}
                        onShare={() => setShowShareCard(true)}
                        subscription={sub}
                    />

                    {/* Premium Banner — only for free users */}
                    {sub !== 'premium' && (
                        <PremiumBanner onClick={() => setShowPremiumOverlay(true)} />
                    )}

                    {/* Daily reading counter — free users only */}
                    {sub !== 'premium' && (
                        <div className="mx-5 mb-2 text-center">
                            <span className="text-xs text-altar-muted">
                                {getRemainingReadings()} of 3 free readings remaining today
                            </span>
                        </div>
                    )}

                    {/* Mind / Body / Spirit Float */}
                    <MindBodySpiritFloat
                        cards={energyCards}
                        onCardClick={(card) => setSelectedCard(card)}
                    />

                    {/* Daily Horoscope Snippet */}
                    <HoroscopeSnippet onTap={() => handleTabChange('horoscope')} />

                    {/* Quick Spreads */}
                    <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.7s', opacity: 0 }}>
                        <h3 className="font-display text-sm uppercase tracking-[3px] text-altar-muted mb-3 flex items-center gap-2">
                            <span className="text-lg">🃏</span> Quick Spreads
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                            {[
                                { icon: '🔮', label: 'Single Card', spread: 'single' },
                                { icon: '🌙', label: '3-Card', spread: 'three-card' },
                                { icon: '💫', label: 'Yes / No', spread: 'yes-no' },
                            ].map(q => (
                                <button
                                    key={q.spread}
                                    onClick={() => handleTabChange('new')}
                                    className="flex-shrink-0 glass rounded-xl px-4 py-3 flex items-center gap-2 hover:border-altar-gold/20 border border-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span className="text-xl">{q.icon}</span>
                                    <span className="text-xs text-altar-text font-display whitespace-nowrap">{q.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Daily Affirmation */}
                    <div className="mx-5 my-4 glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.8s', opacity: 0 }}>
                        <h3 className="font-display text-sm uppercase tracking-[3px] text-altar-muted mb-3 flex items-center gap-2">
                            <span className="text-lg">✨</span> Daily Affirmation
                        </h3>
                        <div className="italic text-sm leading-relaxed p-4 bg-altar-gold/5 border-l-[3px] border-altar-gold rounded-lg text-altar-text/90">
                            "I trust in the natural flow of my life. I embrace patience and know that everything unfolds in perfect timing."
                        </div>
                    </div>

                    {/* Discovery Grid */}
                    <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.9s', opacity: 0 }}>
                        <h3 className="font-display text-sm uppercase tracking-[3px] text-altar-muted mb-3 flex items-center gap-2">
                            <span className="text-lg">🌌</span> Explore
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { icon: '🌙', label: 'Natal Chart', desc: 'Your cosmic blueprint', tab: 'natal', gradient: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20' },
                                { icon: '🔢', label: 'Numerology', desc: 'Sacred numbers', tab: 'numerology', gradient: 'from-amber-500/10 to-orange-500/10 border-amber-500/20' },
                                { icon: '♈', label: 'Horoscope', desc: 'Daily zodiac', tab: 'horoscope', gradient: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20' },
                                { icon: '💞', label: 'Compatibility', desc: 'Couple charts', tab: 'compatibility', gradient: 'from-pink-500/10 to-rose-500/10 border-pink-500/20' },
                                { icon: '📜', label: 'Past Readings', desc: 'Your history', tab: 'history', gradient: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20' },
                            ].map(item => (
                                <button
                                    key={item.tab}
                                    onClick={() => handleTabChange(item.tab)}
                                    className={`rounded-2xl p-4 text-left border bg-gradient-to-br ${item.gradient} transition-all hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    <span className="text-2xl block mb-2">{item.icon}</span>
                                    <p className="font-display text-sm text-altar-text font-semibold">{item.label}</p>
                                    <p className="text-[10px] text-altar-muted mt-0.5">{item.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Card Codex link */}
                    <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '1s', opacity: 0 }}>
                        <button
                            onClick={() => handleTabChange('meanings')}
                            className="w-full py-3.5 rounded-2xl glass border border-white/5 text-center hover:border-altar-gold/20 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">📖</span>
                            <span className="text-sm font-display text-altar-muted tracking-wide">Card Codex</span>
                            <span className="text-altar-muted/50">→</span>
                        </button>
                    </div>

                    {/* Draw Another Card */}
                    <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '1.1s', opacity: 0 }}>
                        <button
                            className="w-full py-4 rounded-2xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 text-center cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,215,0,0.2)] hover:border-altar-gold/40 text-base font-display font-semibold tracking-wide active:scale-[0.98]"
                            onClick={() => handleTabChange('new')}
                        >
                            ✦ Draw Another Card ✦
                        </button>
                    </div>
                </main>
            </div>
            <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
        </div>
    );
}

export default App;