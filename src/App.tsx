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
import { CareerAlignment } from './components/CareerAlignment';
import { CosmicInvite, parseInviteParams } from './components/CosmicInvite';
import { JournalWidget } from './components/JournalWidget';
import { CreateTab } from './components/CreateTab';
import { SchoolTab } from './components/SchoolTab';
import { TarotTab } from './components/TarotTab';
import { AngelNumbersSection } from './components/AngelNumbersSection';
import { SignReadingScreen } from './components/SignReadingScreen';
import { MoonScreen } from './components/MoonScreen';
import { canDoReading, incrementReadingCount, getRemainingReadings, AIService, dailyCache } from './services/ai.service';
import { recordReading } from './services/memory.service';
import { fireReminder } from './services/reminder.service';
import { fireTransitNotification, getTransitFeed } from './services/transit.service';
import { fireJournalReminder, getJournalEntries, getPatternProgress } from './services/journal.service';
import { getDreamEntries } from './services/dream-journal.service';
import { getBirthData, getSunSign, getDailyHoroscope, ZODIAC_SIGNS } from './services/astrology.service';
import { initializePurchases } from './services/storekit.service';

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
    const [journalInitialSubTab, setJournalInitialSubTab] = React.useState<'journal' | 'dreams'>('journal');

    const [showYearAhead, setShowYearAhead] = React.useState(false);
    const [showFamily, setShowFamily] = React.useState(false);
    const [showCareer, setShowCareer] = React.useState(false);
    const [showCreate, setShowCreate] = React.useState(false);
    const [showSchool, setShowSchool] = React.useState(false);
    const [showTarot, setShowTarot] = React.useState(false);
    const [showAngelNumbers, setShowAngelNumbers] = React.useState(false);
    const [showMoon, setShowMoon] = React.useState(false);
    const [showMoonReading, setShowMoonReading] = React.useState(false);
    const [showRisingReading, setShowRisingReading] = React.useState(false);
    const [showBlueprintScreen, setShowBlueprintScreen] = React.useState(false);

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
        setJournalInitialSubTab('journal');

        setShowYearAhead(false);
        setShowFamily(false);
        setShowCareer(false);
        setShowCreate(false);
        setShowSchool(false);
        setShowTarot(false);
        setShowAngelNumbers(false);
        setShowMoon(false);
        setShowMoonReading(false);
        setShowRisingReading(false);
        setShowBlueprintScreen(false);

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
        else if (tab === 'career') setShowCareer(true);
        else if (tab === 'create') setShowCreate(true);
        else if (tab === 'school') setShowSchool(true);
        else if (tab === 'tarot') setShowTarot(true);
        else if (tab === 'angelnumbers') setShowAngelNumbers(true);
        else if (tab === 'moon') setShowMoon(true);
        else if (tab === 'moonreading') setShowMoonReading(true);
        else if (tab === 'risingreading') setShowRisingReading(true);
        else if (tab === 'blueprint') setShowBlueprintScreen(true);
    };

    React.useEffect(() => {
        if (!userProfile) return; // Don't initialize until onboarding is done
        const initializeApp = async () => {
            setIsLoading(true);
            if (isInitialLoad) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                setIsInitialLoad(false);
            }
            // Initialize RevenueCat for real IAP
            await initializePurchases();
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
    const getActivePage = () => {
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
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showNumerology) {
            return (
                <Numerology
                    onClose={() => { setShowNumerology(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
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
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showTransitFeed) {
            return (
                <TransitFeed
                    onClose={() => { setShowTransitFeed(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showFamily) {
            return (
                <FamilyCircle
                    onClose={() => { setShowFamily(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showYearAhead) {
            return (
                <YearAhead
                    onClose={() => { setShowYearAhead(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showJournal) {
            return (
                <JournalTab
                    onClose={() => { setShowJournal(false); setJournalInitialSubTab('journal'); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    initialSubTab={journalInitialSubTab}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showCareer) {
            return (
                <CareerAlignment
                    onClose={() => { setShowCareer(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showCreate) {
            return (
                <CreateTab
                    onClose={() => { setShowCreate(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showSchool) {
            return (
                <SchoolTab
                    onClose={() => { setShowSchool(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showTarot) {
            return (
                <TarotTab
                    onClose={() => { setShowTarot(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    energyCards={energyCards}
                    onViewCard={(card) => { setSelectedCard(card); setShowTarot(false); }}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                />
            );
        }
        if (showAngelNumbers) {
            return (
                <div className="page-frame">
                    <div className="page-scroll bg-altar-deep">
                        <div className="sticky top-0 z-10 bg-altar-deep/95 backdrop-blur-sm px-5 pt-safe pt-4 pb-3 flex items-center gap-3 border-b border-white/5 max-w-[500px] mx-auto w-full">
                            <button
                                onClick={() => { setShowAngelNumbers(false); setCurrentTab('home'); }}
                                className="text-altar-muted/70 text-sm font-display hover:text-altar-muted transition-colors"
                            >
                                ← Witness
                            </button>
                            <h2 className="flex-1 text-center font-display text-sm tracking-[3px] text-altar-gold uppercase">Angel Numbers</h2>
                            <div className="w-16" />
                        </div>
                        <div className="max-w-[500px] mx-auto">
                            {/* Intro explanation */}
                            <div className="mx-5 mt-6 mb-2 rounded-3xl p-5" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                <p className="text-[9px] font-display tracking-[2px] text-indigo-300 uppercase mb-2">✦ Signs & Synchronicities</p>
                                <p className="text-sm text-altar-text leading-relaxed mb-2">
                                    Angel numbers are sequences the universe places in your path — on clocks, receipts, license plates — as coded messages.
                                </p>
                                <p className="text-xs text-altar-text/70 leading-relaxed">
                                    Enter any number you keep seeing and receive a personalized interpretation woven with your natal chart and life path — because your numbers aren't random, they speak to <em>you</em>.
                                </p>
                            </div>
                            <AngelNumbersSection />
                            <div className="h-24" />
                        </div>
                    </div>
                    <BottomNav currentTab="home" onTabChange={handleTabChange} />
                </div>
            );
        }
        if (showMoon) {
            return (
                <MoonScreen
                    onClose={() => { setShowMoon(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                />
            );
        }
        if (showMoonReading) {
            return (
                <SignReadingScreen
                    focus="moon"
                    onClose={() => { setShowMoonReading(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                />
            );
        }
        if (showRisingReading) {
            return (
                <SignReadingScreen
                    focus="rising"
                    onClose={() => { setShowRisingReading(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                />
            );
        }
        if (showBlueprintScreen) {
            return (
                <NatalChart
                    onClose={() => { setShowBlueprintScreen(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
                    subscription={sub}
                    onShowPremium={() => setShowPremiumOverlay(true)}
                    initialFocus="blueprint"
                />
            );
        }
        return null;
    };

    const activePage = getActivePage();
    if (activePage) {
        return (
            <>
                {activePage}
                {showPremiumOverlay && (
                    <PremiumOverlay
                        onClose={() => setShowPremiumOverlay(false)}
                        onSubscribe={() => {
                            const updated = { ...userProfile, subscription: 'premium' };
                            safeStorage.setItem('userProfile', JSON.stringify(updated));
                            setUserProfile(updated);
                            setShowPremiumOverlay(false);
                        }}
                    />
                )}
            </>
        );
    }

    // ── MYSTIC ALTAR — Main Screen ──
    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                <AltarParticles />

                {/* Profile gear icon */}
                <button
                    onClick={() => setShowProfileModal(true)}
                    className="absolute right-4 top-5 z-10 transition-opacity"
                    style={{ opacity: 0.4, fontSize: '17px', lineHeight: 1 }}
                    aria-label="Profile settings"
                >
                    ⚙️
                </button>

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
                            <p className="relative text-sm text-altar-text/75 mt-1.5">
                                {greeting}{userName ? `, ${userName}` : ''} · {dateStr}
                            </p>
                        );
                    })()}
                </header>

                {/* ── Main Content ── */}
                <main className="relative z-10 max-w-[500px] mx-auto">

                    {/* ── Cosmic Blueprint — Identity anchor at top of Altar ── */}
                    <CosmicBlueprint onTabChange={handleTabChange} />



                    {/* ── Portal Cards ── */}
                    <div className="mx-3 mb-4 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                        <h3 className="font-display text-center text-sm tracking-[5px] text-altar-text/70 uppercase mb-4">
                            <span className="text-altar-gold">✦</span> Your Portal <span className="text-altar-gold">✦</span>
                        </h3>
                        <div className="grid grid-cols-3 gap-2.5">
                            {[
                                {
                                    icon: '🔮', label: 'Tarot', tagline: "Today's energy + spreads", tab: 'tarot',
                                    grad: 'radial-gradient(ellipse at 50% 30%, #6d28d9 0%, #3b0764 40%, #0c0118 100%)',
                                    shadow: '0 16px 40px rgba(109,40,217,0.65), 0 4px 12px rgba(0,0,0,0.8)',
                                    halo: 'rgba(167,139,250,0.8)',
                                },
                                {
                                    icon: '💞', label: 'Relationships', tagline: 'Cosmic bonds', tab: 'compatibility',
                                    grad: 'radial-gradient(ellipse at 50% 30%, #9f1239 0%, #4c0519 40%, #0d0108 100%)',
                                    shadow: '0 16px 40px rgba(159,18,57,0.65), 0 4px 12px rgba(0,0,0,0.8)',
                                    halo: 'rgba(251,113,133,0.8)',
                                },
                                {
                                    icon: '🔢', label: 'Angel Numbers', tagline: 'Signs & synchronicities', tab: 'angelnumbers',
                                    grad: 'radial-gradient(ellipse at 50% 30%, #1e3a5f 0%, #0b1f35 40%, #020810 100%)',
                                    shadow: '0 16px 40px rgba(99,102,241,0.55), 0 4px 12px rgba(0,0,0,0.8)',
                                    halo: 'rgba(165,180,252,0.8)',
                                },
                                {
                                    icon: '🌙', label: 'Natal', tagline: 'Your birth blueprint', tab: 'natal',
                                    grad: 'radial-gradient(ellipse at 50% 30%, #0f766e 0%, #042f2e 40%, #010d0c 100%)',
                                    shadow: '0 16px 40px rgba(15,118,110,0.65), 0 4px 12px rgba(0,0,0,0.8)',
                                    halo: 'rgba(94,234,212,0.8)',
                                },
                                {
                                    icon: '👨‍👩‍👧‍👦', label: 'Family', tagline: 'Circle of souls', tab: 'family',
                                    grad: 'radial-gradient(ellipse at 50% 30%, #86198f 0%, #3b0764 40%, #0d0114 100%)',
                                    shadow: '0 16px 40px rgba(134,25,143,0.65), 0 4px 12px rgba(0,0,0,0.8)',
                                    halo: 'rgba(240,171,252,0.8)',
                                },
                                {
                                    icon: '💼', label: 'Career', tagline: 'Your true calling', tab: 'career',
                                    grad: 'radial-gradient(ellipse at 50% 30%, #065f46 0%, #022c22 40%, #010d09 100%)',
                                    shadow: '0 16px 40px rgba(6,95,70,0.65), 0 4px 12px rgba(0,0,0,0.8)',
                                    halo: 'rgba(110,231,183,0.8)',
                                },
                            ].map(item => (
                                <button
                                    key={item.tab}
                                    onClick={() => handleTabChange(item.tab)}
                                    className="relative flex flex-col items-center justify-between rounded-2xl px-2 pt-3.5 pb-3 transition-all duration-200 hover:scale-[1.04] active:scale-[0.96] overflow-hidden"
                                    style={{
                                        background: item.grad,
                                        boxShadow: `${item.shadow}, inset 0 1.5px 0 rgba(255,255,255,0.22), inset 0 -5px 15px rgba(0,0,0,0.5)`,
                                        aspectRatio: '1 / 0.88',
                                    }}
                                >
                                    {/* Specular top-edge shine — lacquer catch-light */}
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-white/20" />
                                    {/* Soft top inner glow */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-12 blur-2xl opacity-15"
                                        style={{ background: 'white' }} />

                                    {/* Icon bubble — dark circle with luminous halo */}
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl relative z-10 flex-shrink-0"
                                        style={{
                                            background: 'rgba(0,0,0,0.5)',
                                            boxShadow: `0 0 24px ${item.halo}, 0 0 10px ${item.halo}, inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 14px rgba(0,0,0,0.6)`,
                                        }}
                                    >
                                        {item.icon}
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center gap-1">
                                        <span className="text-[12px] font-semibold text-white leading-tight text-center tracking-wide">
                                            {item.label}
                                        </span>
                                        <span className="text-[9px] text-white/55 leading-snug text-center px-1">
                                            {item.tagline}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Premium Banner — only for free users */}
                    {sub !== 'premium' && (
                        <PremiumBanner onClick={() => setShowPremiumOverlay(true)} />
                    )}

                    {/* Daily reading counter — free users only */}
                    {sub !== 'premium' && (
                        <div className="mx-5 mb-2 text-center">
                            <span className="text-xs text-altar-text/60">
                                {getRemainingReadings()} of 3 free readings remaining today
                            </span>
                        </div>
                    )}

                    {/* Spacer for bottom nav */}
                    <div className="h-6" />
                </main>
            </div >
            <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
        </div >
    );
}

export default App;