import { safeStorage } from "./services/storage.service";
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
import { YearAhead } from './components/YearAhead';
import { FamilyCircle } from './components/FamilyCircle';
import { CosmicInvite, parseInviteParams } from './components/CosmicInvite';
import { JournalWidget } from './components/JournalWidget';
import { canDoReading, incrementReadingCount, getRemainingReadings, AIService, dailyCache } from './services/ai.service';
import { recordReading } from './services/memory.service';
import { fireReminder } from './services/reminder.service';
import { fireTransitNotification, getTransitFeed } from './services/transit.service';
import { fireJournalReminder, getJournalEntries, getPatternProgress } from './services/journal.service';
import { getDreamEntries } from './services/dream-journal.service';
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

/* ── Energy Interpretation — AI-powered daily energy reading ── */
function EnergyInterpretation({ cards }: { cards: Card[] }) {
    const [interpretation, setInterpretation] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const CACHE_KEY = 'energy_interpretation';

    React.useEffect(() => {
        if (cards.length < 3) return;

        // Check daily cache first
        const cached = dailyCache.get(CACHE_KEY);
        if (cached) {
            setInterpretation(cached);
            return;
        }

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setLoading(true);
        const cardData = cards.map((c, i) => ({
            name: c.name,
            meaning: c.meaning || c.description,
            position: ['Mind', 'Body', 'Spirit'][i],
        }));

        ai.getSpreadInsight(cardData, 'three-card', 'daily energy', 'What energy does today hold?')
            .then((result: string) => {
                // Extract just the first 2-3 sentences for a brief summary
                const brief = result
                    .replace(/##.*?\n/g, '') // strip headers
                    .replace(/- .*/g, '')    // strip bullets
                    .replace(/\*\*/g, '')    // strip bold markers
                    .trim()
                    .split(/[.!?]\s+/)
                    .filter((s: string) => s.trim().length > 10)
                    .slice(0, 3)
                    .join('. ') + '.';

                dailyCache.set(CACHE_KEY, brief);
                setInterpretation(brief);
            })
            .catch(() => {
                // Fallback — generate a simple non-AI interpretation
                const fallback = `${cards[0].name} guides your thoughts, ${cards[1].name} moves your body, and ${cards[2].name} lifts your spirit. Let today's energy flow through you.`;
                setInterpretation(fallback);
            })
            .finally(() => setLoading(false));
    }, [cards]);

    if (!interpretation && !loading) return null;

    return (
        <div className="mt-1 px-1">
            {loading ? (
                <div className="flex items-center justify-center gap-2 py-2">
                    <div className="w-1 h-1 bg-altar-gold/50 rounded-full animate-pulse" />
                    <span className="text-[10px] text-altar-muted/60 italic">Reading the energy...</span>
                    <div className="w-1 h-1 bg-altar-gold/50 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
            ) : (
                <p className="text-[11px] text-altar-text/60 leading-relaxed text-center italic">
                    "{interpretation}"
                </p>
            )}
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
    const [showYearAhead, setShowYearAhead] = React.useState(false);
    const [showFamily, setShowFamily] = React.useState(false);

    // ── Cosmic Card Invite detection ──
    const [inviteData, setInviteData] = React.useState(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('invite') === '1') {
            return parseInviteParams(window.location.search);
        }
        return null;
    });

    const handleInviteImport = () => {
        if (!inviteData) return;
        // Save as family member
        const FAMILY_KEY = 'arcana_family_members';
        let family = [];
        try { family = JSON.parse(safeStorage.getItem(FAMILY_KEY) || '[]'); } catch { /* */ }
        const newMember = {
            id: Date.now().toString(),
            name: inviteData.name,
            relationship: 'other' as const,
            birthday: inviteData.birthday,
            birthTime: inviteData.birthTime || '',
            location: inviteData.location || '',
            latitude: inviteData.lat,
            longitude: inviteData.lng,
            utcOffset: inviteData.utcOffset || 0,
        };
        // Don't add duplicates
        const exists = family.some((m: any) => m.name === newMember.name && m.birthday === newMember.birthday);
        if (!exists) {
            family.push(newMember);
            safeStorage.setItem(FAMILY_KEY, JSON.stringify(family));
        }
        // Clear invite and clean URL
        setInviteData(null);
        window.history.replaceState({}, '', window.location.pathname);
        // Navigate to Family tab
        handleTabChange('family');
    };

    const [userProfile, setUserProfile] = React.useState<any>(() => {
        try {
            const profile = safeStorage.getItem('userProfile');
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

    const handleOnboardingComplete = (profile: { name: string; birthday: string; zodiac: string; birthTime?: string; birthCity?: string; latitude?: number; longitude?: number; utcOffset?: number }) => {
        const newProfile = { ...profile, subscription: 'free' };
        safeStorage.setItem('userProfile', JSON.stringify(newProfile));
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
        setShowYearAhead(false);
        setShowFamily(false);

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
        else if (tab === 'yearahead') setShowYearAhead(true);
        else if (tab === 'family') setShowFamily(true);
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

    // ── Invite landing page (shows even without onboarding) ──
    if (inviteData) {
        return (
            <CosmicInvite
                data={inviteData}
                onImport={() => {
                    if (!userProfile) {
                        // Not onboarded yet — dismiss invite and start onboarding
                        // After onboarding completes, they can still import from Family tab
                        setInviteData(null);
                        window.history.replaceState({}, '', window.location.pathname);
                        return;
                    }
                    handleInviteImport();
                }}
                onDismiss={() => {
                    setInviteData(null);
                    window.history.replaceState({}, '', window.location.pathname);
                }}
            />
        );
    }

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

    if (showFamily) {
        return (
            <FamilyCircle
                onClose={() => { setShowFamily(false); setCurrentTab('home'); }}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showYearAhead) {
        return (
            <YearAhead
                onClose={() => { setShowYearAhead(false); setCurrentTab('home'); }}
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
                            safeStorage.setItem('userProfile', JSON.stringify(updated));
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

                    {/* ── Triad Pills — horizontal labeled row ── */}
                    {(() => {
                        const birthData = getBirthData();
                        if (!birthData) return null;
                        const triad = getNatalTriad(birthData);
                        const sunSign = ZODIAC_SIGNS.find(z => z.id === triad.sun.id);
                        const moonSign = ZODIAC_SIGNS.find(z => z.id === triad.moon.id);
                        const risingSign = ZODIAC_SIGNS.find(z => z.id === triad.rising.id);
                        return (
                            <div className="flex justify-center gap-2 mx-5 mt-1 mb-4 animate-fade-up" style={{ opacity: 0 }}>
                                {[
                                    { symbol: '☉', label: 'Sun', sign: triad.sun.name, glyph: sunSign?.glyph, bg: 'from-amber-700/50 to-amber-600/25', border: 'border-amber-500/35' },
                                    { symbol: '☽', label: 'Moon', sign: triad.moon.name, glyph: moonSign?.glyph, bg: 'from-slate-500/40 to-slate-400/15', border: 'border-slate-400/25' },
                                    { symbol: '↑', label: 'Rising', sign: triad.rising.name, glyph: risingSign?.glyph, bg: 'from-orange-700/50 to-red-600/25', border: 'border-orange-500/35' },
                                ].map(pill => (
                                    <div
                                        key={pill.label}
                                        className={`bg-gradient-to-r ${pill.bg} ${pill.border} border px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap shadow-md`}
                                    >
                                        <span className="text-[10px] opacity-60">{pill.symbol}</span>
                                        <span className="text-[10px] text-white/50 font-display">{pill.label}:</span>
                                        <span className="text-[11px] text-white/90 font-display font-semibold">{pill.sign}</span>
                                        <span className="text-[10px] opacity-50">{pill.glyph}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {/* ── Hero: Today's Energy (Mind / Body / Spirit) ── */}
                    <div className="mx-5 mb-5 animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                        <h3 className="font-display text-center text-sm tracking-[4px] text-altar-muted uppercase mb-4">
                            <span className="text-altar-gold">✧</span> Today's Energy <span className="text-altar-gold">✧</span>
                        </h3>

                        {energyCards.length >= 3 ? (
                            <>
                                {/* Three cards */}
                                <div className="flex justify-center gap-3 mb-4">
                                    {energyCards.slice(0, 3).map((card, idx) => (
                                        <div
                                            key={card.id}
                                            className="flex flex-col items-center cursor-pointer group"
                                            onClick={() => setSelectedCard(card)}
                                        >
                                            <div className="relative w-[105px] h-[155px] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(139,95,191,0.3)]">
                                                <img
                                                    src={card.image}
                                                    alt={card.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40" />
                                            </div>
                                            <div className="mt-2 flex flex-col items-center">
                                                <span className="text-base">{['🧠', '💫', '🕊️'][idx]}</span>
                                                <span className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase mt-0.5">
                                                    {['Mind', 'Body', 'Spirit'][idx]}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Energy Interpretation */}
                                <EnergyInterpretation cards={energyCards.slice(0, 3)} />
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="animate-pulse text-altar-gold text-2xl mb-2">✦</div>
                                <p className="text-xs text-altar-muted">Drawing your energy cards...</p>
                            </div>
                        )}
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

                    {/* ── Dream Journal Widget — Midnight Indigo ── */}
                    <div className="mx-5 mb-4 animate-fade-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
                        <button
                            onClick={() => handleTabChange('journal')}
                            className="w-full text-left rounded-2xl overflow-hidden border relative"
                            style={{
                                background: 'linear-gradient(135deg, rgba(10,8,30,0.95) 0%, rgba(20,10,50,0.9) 40%, rgba(8,6,25,0.95) 100%)',
                                borderColor: 'rgba(139,92,246,0.15)',
                            }}
                        >
                            {/* Starfield glow */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[0, 1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="absolute rounded-full bg-white"
                                        style={{
                                            width: '1px', height: '1px',
                                            left: `${(i * 17 + 11) % 95}%`,
                                            top: `${(i * 23 + 13) % 80}%`,
                                            opacity: 0.4,
                                        }}
                                    />
                                ))}
                                <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-400/20 to-transparent blur-sm" />
                            </div>

                            <div className="relative p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-display text-sm tracking-wide flex items-center gap-2 font-semibold" style={{ color: 'rgba(196,181,253,0.85)' }}>
                                        <span>🌙</span> DREAM JOURNAL
                                    </h3>
                                    <span className="text-[10px] font-display" style={{ color: 'rgba(167,139,250,0.45)' }}>Dreams</span>
                                </div>
                                {(() => {
                                    const dreams = getDreamEntries();
                                    const latest = dreams[0];
                                    return (
                                        <>
                                            {latest ? (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        {latest.wakingMood && <span className="text-sm">{latest.wakingMood}</span>}
                                                        <p className="text-[11px] line-clamp-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                                            {latest.text}
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px]" style={{ color: 'rgba(167,139,250,0.45)' }}>
                                                        {dreams.length} dream{dreams.length !== 1 ? 's' : ''} recorded · Tap to interpret
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                                    What did you see last night?
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </button>
                    </div>

                    {/* ── Explore Circles ── */}

                    <div className="mx-5 mb-4 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                        <div className="grid grid-cols-4 gap-y-4 gap-x-2 justify-items-center">
                            {[
                                { icon: '🔮', label: 'Tarot', tab: 'new', bg: 'from-violet-500/20 to-fuchsia-500/15 border-violet-500/25' },
                                { icon: '💞', label: 'Relationships', tab: 'compatibility', bg: 'from-rose-500/20 to-pink-500/15 border-rose-500/25' },
                                { icon: '✨', label: 'Cosmos', tab: 'cosmos', bg: 'from-blue-500/20 to-indigo-500/15 border-blue-500/25' },
                                { icon: '♈', label: 'Horoscope', tab: 'horoscope', bg: 'from-red-500/20 to-orange-500/15 border-red-500/25' },
                                { icon: '🌙', label: 'Natal', tab: 'natal', bg: 'from-indigo-500/20 to-purple-500/15 border-indigo-500/25' },
                                { icon: '🔢', label: 'Numbers', tab: 'numerology', bg: 'from-amber-600/20 to-yellow-500/15 border-amber-500/25' },
                                { icon: '🌟', label: 'Year Ahead', tab: 'yearahead', bg: 'from-yellow-500/20 to-amber-500/15 border-yellow-500/25' },
                                { icon: '👨‍👩‍👧‍👦', label: 'Family', tab: 'family', bg: 'from-pink-500/20 to-rose-500/15 border-pink-500/25' },
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

                    {/* ── Below the fold: Blueprint only (MBS & Horoscope removed) ── */}
                    <CosmicBlueprint onTabChange={handleTabChange} />

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