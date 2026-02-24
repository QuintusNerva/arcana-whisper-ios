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
import { fireJournalReminder, getJournalEntries, getPatternProgress } from './services/journal.service';
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

                    {/* ── Hero: Card + Triad Pills ── */}
                    <div className="relative mx-5 mt-2 mb-5 animate-fade-up" style={{ opacity: 0 }}>
                        {/* Ambient glow */}
                        <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-[250px] h-[350px] rounded-full bg-altar-gold/8 blur-[80px] pointer-events-none" />

                        <div className="relative flex items-center">
                            {/* Card — large, prominent */}
                            <div
                                className="relative w-[200px] h-[310px] rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] cursor-pointer border border-white/10 shrink-0"
                                onClick={() => handleTabChange('new')}
                            >
                                <img
                                    src={currentCard.image}
                                    alt={currentCard.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/85 to-transparent" />
                                <div className="absolute bottom-3 left-3.5 right-3.5">
                                    <h2 className="font-display text-base text-white font-semibold tracking-wide">{currentCard.name}</h2>
                                </div>
                            </div>

                            {/* Triad pills — floating on right */}
                            {(() => {
                                const birthData = getBirthData();
                                if (!birthData) return null;
                                const triad = getNatalTriad(birthData);
                                const sunSign = ZODIAC_SIGNS.find(z => z.id === triad.sun.id);
                                const moonSign = ZODIAC_SIGNS.find(z => z.id === triad.moon.id);
                                const risingSign = ZODIAC_SIGNS.find(z => z.id === triad.rising.id);
                                return (
                                    <div className="flex flex-col gap-2 ml-3">
                                        {[
                                            { symbol: '☉', sign: triad.sun.name, glyph: sunSign?.glyph, bg: 'bg-gradient-to-r from-amber-800/40 to-amber-700/20', border: 'border-amber-500/30' },
                                            { symbol: '☽', sign: triad.moon.name, glyph: moonSign?.glyph, bg: 'bg-gradient-to-r from-slate-600/40 to-slate-500/20', border: 'border-slate-400/30' },
                                            { symbol: '↑', sign: triad.rising.name, glyph: risingSign?.glyph, bg: 'bg-gradient-to-r from-orange-800/40 to-red-700/20', border: 'border-orange-500/30' },
                                        ].map(pill => (
                                            <div
                                                key={pill.symbol}
                                                className={`${pill.bg} ${pill.border} border px-3.5 py-2 rounded-full flex items-center gap-2 whitespace-nowrap shadow-md`}
                                            >
                                                <span className="text-xs opacity-80">{pill.symbol}</span>
                                                <span className="text-xs">{pill.glyph}</span>
                                                <span className="text-[12px] text-white/90 font-display font-medium tracking-wide">{pill.sign}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* ── Journal Widget — Teal Aurora ── */}
                    <div className="mx-5 mb-4 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                        <button
                            onClick={() => handleTabChange('journal')}
                            className="w-full text-left rounded-2xl overflow-hidden border border-teal-400/20 relative"
                            style={{
                                background: 'linear-gradient(135deg, rgba(13,35,40,0.95) 0%, rgba(15,50,50,0.9) 40%, rgba(10,40,35,0.95) 100%)',
                            }}
                        >
                            {/* Aurora glow effect */}
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-teal-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
                            <div className="absolute bottom-2 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-teal-400/30 to-transparent blur-sm pointer-events-none" />

                            <div className="relative p-4">
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-display text-sm text-white tracking-wide flex items-center gap-2 font-semibold">
                                        <span>📓</span> YOUR JOURNAL
                                    </h3>
                                    <span className="text-[10px] text-teal-300/60 font-display">Tracking</span>
                                </div>

                                {/* Content */}
                                {(() => {
                                    const entries = getJournalEntries();
                                    const progress = getPatternProgress();
                                    const latestEntry = entries[0];

                                    return (
                                        <>
                                            {latestEntry ? (
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs text-white/80 font-semibold">Latest entry</p>
                                                        <span className="text-[10px] text-white/40">
                                                            {new Date(latestEntry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-white/60 flex items-center gap-1.5">
                                                        {latestEntry.mood && <span>{latestEntry.mood}</span>}
                                                        <span className="line-clamp-1">{latestEntry.text}</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="mb-3">
                                                    <p className="text-xs text-white/60 italic">No pressure. Just say what's real.</p>
                                                </div>
                                            )}

                                            {/* Progress bar */}
                                            {!progress.unlocked && (
                                                <div>
                                                    <p className="text-[10px] text-white/50 mb-1.5">
                                                        <span className="font-semibold text-white/70">{progress.current}/{progress.target}</span> to cosmic patterns <span>✨</span>
                                                    </p>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-teal-500/60 to-cyan-400/70 rounded-full transition-all"
                                                            style={{ width: `${progress.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </button>
                    </div>

                    {/* ── Explore Circles — 4 icons ── */}
                    <div className="mx-5 mb-4 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                        <div className="flex justify-around">
                            {[
                                { icon: '🔮', label: 'Tarot', tab: 'new', bg: 'from-violet-500/20 to-fuchsia-500/15 border-violet-500/25' },
                                { icon: '✨', label: 'Cosmos', tab: 'cosmos', bg: 'from-blue-500/20 to-indigo-500/15 border-blue-500/25' },
                                { icon: '♈', label: 'Horoscope', tab: 'horoscope', bg: 'from-red-500/20 to-orange-500/15 border-red-500/25' },
                                { icon: '🌙', label: 'Natal', tab: 'natal', bg: 'from-indigo-500/20 to-purple-500/15 border-indigo-500/25' },
                                { icon: '🔢', label: 'Numbers', tab: 'numerology', bg: 'from-amber-600/20 to-yellow-500/15 border-amber-500/25' },
                            ].map(item => (
                                <button
                                    key={item.tab}
                                    onClick={() => handleTabChange(item.tab)}
                                    className="flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                                >
                                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.bg} border flex items-center justify-center text-2xl shadow-md`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] text-altar-muted/70 font-display">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Below the fold: Blueprint, Mind/Body/Spirit, etc ── */}
                    <CosmicBlueprint onTabChange={handleTabChange} />

                    <MindBodySpiritFloat
                        cards={energyCards}
                        onCardClick={(card) => setSelectedCard(card)}
                    />

                    <HoroscopeSnippet onTap={() => handleTabChange('horoscope')} />

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

                    {/* Spacer for bottom nav */}
                    <div className="h-6" />
                </main>
            </div>
            <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
        </div>
    );
}

export default App;