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
import { CosmicBlueprint } from './components/CosmicBlueprint';
import { Numerology } from './components/Numerology';
import { Horoscope } from './components/Horoscope';
import { Compatibility } from './components/Compatibility';
import { Onboarding } from './components/Onboarding';
import { TransitFeed } from './components/TransitFeed';
import { JournalTab } from './components/JournalTab';
import { JournalWidget } from './components/JournalWidget';
import { canDoReading, incrementReadingCount, getRemainingReadings } from './services/ai.service';
import { recordReading } from './services/memory.service';
import { fireReminder } from './services/reminder.service';
import { fireTransitNotification, getTransitFeed } from './services/transit.service';
import { fireJournalReminder } from './services/journal.service';
import { getBirthData, getSunSign, getDailyHoroscope, getNatalTriad, ZODIAC_SIGNS } from './services/astrology.service';

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
                            <p className="text-xs text-altar-muted mt-0.5">Deep Insights · Unlimited Readings</p>
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
    const [showTransitFeed, setShowTransitFeed] = React.useState(false);
    const [showJournal, setShowJournal] = React.useState(false);

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
        setShowTransitFeed(false);
        setShowJournal(false);

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
        else if (tab === 'cosmos') setShowTransitFeed(true);
        else if (tab === 'journal') setShowJournal(true);
    };

    React.useEffect(() => {
        if (!userProfile) return; // Don't initialize until onboarding is done
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
            // Check for transit alerts
            fireTransitNotification();
            // Check for journal reminder
            fireJournalReminder();
        };
        initializeApp();
    }, [loadCard, isInitialLoad, userProfile]);

    // ── Onboarding gate ──
    if (!userProfile) {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }

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
                onShowPremium={() => setShowPremiumOverlay(true)}
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

    if (showTransitFeed) {
        return (
            <TransitFeed
                onClose={() => { setShowTransitFeed(false); setCurrentTab('home'); }}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showJournal) {
        return (
            <JournalTab
                onClose={() => { setShowJournal(false); setCurrentTab('home'); }}
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
                        onClose={() => { setCustomReadingResult(null); setShowCustomReading(false); setCurrentTab('home'); }}
                        onTabChange={handleTabChange}
                        subscription={sub}
                        onShowPremium={() => setShowPremiumOverlay(true)}
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

                {/* ── Header — Compact with Greeting ── */}
                <header className="relative text-center pt-5 pb-2 z-10 safe-top">
                    <div className="absolute inset-0 bg-gradient-to-b from-altar-deep to-transparent" />
                    <h1 className="relative font-display text-lg tracking-[5px] font-semibold">
                        <span className="text-altar-gold animate-pulse">✦</span>
                        <span className="shimmer-text mx-2">ARCANA WHISPER</span>
                        <span className="text-altar-gold animate-pulse">✦</span>
                    </h1>
                    {(() => {
                        const now = new Date();
                        const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
                        const userName = userProfile?.name || '';
                        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                        return (
                            <p className="relative text-xs text-altar-text/60 mt-1.5">
                                {greeting}{userName ? `, ${userName}` : ''} · {dateStr}
                            </p>
                        );
                    })()}
                </header>

                {/* ── Main Content ── */}
                <main className="relative z-10 max-w-[500px] mx-auto">

                    {/* ── Hero Section: Card + Triad Pills ── */}
                    <div className="mx-5 mt-2 mb-3 flex gap-3 items-start animate-fade-up" style={{ opacity: 0 }}>
                        {/* Hero Card — left side */}
                        <div className="flex-1">
                            <HeroCard
                                card={currentCard}
                                onShare={() => setShowShareCard(true)}
                                subscription={sub}
                            />
                        </div>

                        {/* Natal Triad — right side pills */}
                        {(() => {
                            const birthData = getBirthData();
                            if (!birthData) return null;
                            const triad = getNatalTriad(birthData);
                            const sunSign = ZODIAC_SIGNS.find(z => z.id === triad.sun.id);
                            const moonSign = ZODIAC_SIGNS.find(z => z.id === triad.moon.id);
                            const risingSign = ZODIAC_SIGNS.find(z => z.id === triad.rising.id);
                            return (
                                <div className="flex flex-col gap-1.5 pt-3 shrink-0">
                                    {[
                                        { label: '☉', value: triad.sun.name, glyph: sunSign?.glyph, color: 'from-amber-500/15 to-yellow-500/10 border-amber-500/20' },
                                        { label: '☽', value: triad.moon.name, glyph: moonSign?.glyph, color: 'from-blue-500/15 to-indigo-500/10 border-blue-500/20' },
                                        { label: '↑', value: triad.rising.name, glyph: risingSign?.glyph, color: 'from-orange-500/15 to-red-500/10 border-orange-500/20' },
                                    ].map(pill => (
                                        <div
                                            key={pill.label}
                                            className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${pill.color} border text-[11px] text-altar-text/80 font-display flex items-center gap-1.5 whitespace-nowrap`}
                                        >
                                            <span className="text-xs">{pill.label}</span>
                                            {pill.glyph && <span>{pill.glyph}</span>}
                                            <span>{pill.value}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

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

                    {/* ── Mind / Body / Spirit ── */}
                    <MindBodySpiritFloat
                        cards={energyCards}
                        onCardClick={(card) => setSelectedCard(card)}
                    />

                    {/* Daily Horoscope Snippet */}
                    <HoroscopeSnippet onTap={() => handleTabChange('horoscope')} />

                    {/* ── Today's Focus: Journal + Blueprint (twin features) ── */}
                    <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                        <h3 className="font-display text-[10px] text-altar-muted/50 tracking-[3px] uppercase mb-2.5 flex items-center gap-1.5">
                            Today's Focus
                        </h3>
                        <div className="space-y-2.5">
                            {/* Journal Widget */}
                            <JournalWidget onTap={() => handleTabChange('journal')} />

                            {/* Cosmic Blueprint */}
                            <CosmicBlueprint onTabChange={handleTabChange} />
                        </div>
                    </div>

                    {/* ── Cosmic Weather Preview ── */}
                    {(() => {
                        try {
                            const feed = getTransitFeed();
                            if (!feed.hasBirthData || feed.active.length === 0) return null;
                            return (
                                <div className="mx-5 mb-4 animate-fade-up" style={{ animationDelay: '0.7s', opacity: 0 }}>
                                    <button
                                        onClick={() => handleTabChange('cosmos')}
                                        className="w-full text-left glass rounded-2xl p-4 border border-indigo-500/15 bg-gradient-to-br from-indigo-900/10 to-violet-900/8 transition-all hover:border-indigo-400/25 active:scale-[0.99]"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="text-xs text-altar-text/80 font-display flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                                {feed.active.length} active transit{feed.active.length !== 1 ? 's' : ''}
                                            </h3>
                                            <span className="text-[9px] text-altar-gold font-display">View all →</span>
                                        </div>
                                        <p className="text-[10px] text-altar-muted/50 truncate">
                                            {feed.active.slice(0, 3).map(t =>
                                                `${t.transitPlanet.name} ${t.aspect.symbol} ${t.natalPlanet.name}`
                                            ).join(' · ')}
                                        </p>
                                    </button>
                                </div>
                            );
                        } catch { return null; }
                    })()}

                    {/* ── Explore — Horizontal Scroll Circles ── */}
                    <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.8s', opacity: 0 }}>
                        <h3 className="font-display text-[10px] text-altar-muted/50 tracking-[3px] uppercase mb-2.5">
                            Explore
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                            {[
                                { icon: '🔮', label: 'Tarot', tab: 'new', bg: 'from-violet-500/15 to-fuchsia-500/10 border-violet-500/20' },
                                { icon: '🌌', label: 'Cosmos', tab: 'cosmos', bg: 'from-blue-500/15 to-indigo-500/10 border-blue-500/20' },
                                { icon: '♈', label: 'Horoscope', tab: 'horoscope', bg: 'from-cyan-500/15 to-blue-500/10 border-cyan-500/20' },
                                { icon: '🔢', label: 'Numbers', tab: 'numerology', bg: 'from-amber-500/15 to-orange-500/10 border-amber-500/20' },
                                { icon: '💞', label: 'Love', tab: 'compatibility', bg: 'from-pink-500/15 to-rose-500/10 border-pink-500/20' },
                                { icon: '📜', label: 'History', tab: 'history', bg: 'from-emerald-500/15 to-green-500/10 border-emerald-500/20' },
                            ].map(item => (
                                <button
                                    key={item.tab}
                                    onClick={() => handleTabChange(item.tab)}
                                    className={`shrink-0 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95`}
                                >
                                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${item.bg} border flex items-center justify-center text-xl`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[9px] text-altar-muted/60 font-display">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Spacer for bottom nav */}
                    <div className="h-4" />
                </main>
            </div>
            <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
        </div>
    );
}

export default App;