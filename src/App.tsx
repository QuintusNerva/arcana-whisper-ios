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
import { CoachMarkTutorial, useCoachMark } from './components/CoachMarkTutorial';
import { canDoReading, incrementReadingCount, getRemainingReadings, AIService, dailyCache } from './services/ai.service';
import { recordReading } from './services/memory.service';
import { fireReminder } from './services/reminder.service';
import { fireTransitNotification, getTransitFeed } from './services/transit.service';
import { fireJournalReminder, getJournalEntries, getPatternProgress } from './services/journal.service';
import { getDreamEntries } from './services/dream-journal.service';
import { getBirthData, getSunSign, getDailyHoroscope, ZODIAC_SIGNS } from './services/astrology.service';
import { initializePurchases, PRODUCTS } from './services/storekit.service';

/* ── Portal card icons ── */
import iconTarot from './assets/icons/tarot.png';
import iconRelationships from './assets/icons/relationships.png';
import iconAngelNumbers from './assets/icons/angel-numbers.png';
import iconNatal from './assets/icons/natal.png';
import iconFamily from './assets/icons/family.png';
import iconCareer from './assets/icons/career.png';

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
        <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
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
                                        <span className="text-[11px] font-display text-altar-gold tracking-[2px] uppercase">{sign.name} Today</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-altar-gold/10 text-altar-gold/70">{horoscope?.mood}</span>
                                    </div>
                                    <p className="text-xs text-altar-text/70 leading-relaxed line-clamp-2 italic">
                                        "{horoscope?.daily}"
                                    </p>
                                    <span className="text-[11px] text-altar-gold/50 mt-1 inline-block group-hover:text-altar-gold/80 transition-colors">
                                        Read full horoscope →
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 w-full">
                                <span className="text-2xl">✨</span>
                                <div>
                                    <p className="text-xs font-display text-altar-muted tracking-[2px] uppercase">Daily Horoscope</p>
                                    <p className="text-[11px] text-altar-muted/60 mt-0.5">Enter your birthday to unlock</p>
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
                    <span className="text-[11px] text-altar-muted/60 italic">Reading the energy...</span>
                    <div className="w-1 h-1 bg-altar-gold/50 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
            ) : (
                <p className="text-xs text-altar-text/60 leading-relaxed text-center italic">
                    "{interpretation}"
                </p>
            )}
        </div>
    );
}


/* ── Inline Premium CTA Banner ── */
function PremiumBanner({ onClick, remaining }: { onClick: () => void; remaining: number }) {
    return (
        <div className="mx-5 my-4 animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <button
                onClick={onClick}
                className="w-full relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-altar-gold/50 via-altar-bright/30 to-altar-gold/50 group cursor-pointer"
            >
                <div className="rounded-2xl px-5 py-4 bg-altar-dark/90 backdrop-blur-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex" style={{ width: 22, height: 22 }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ fill: 'var(--color-altar-gold)', filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}>
                                <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" />
                            </svg>
                        </span>
                        <div className="text-left">
                            <span className="shimmer-text font-display text-sm font-semibold">Unlock Premium</span>
                            <p className="text-xs text-altar-muted mt-0.5">Deep Insights · Unlimited Readings</p>
                            <p className="text-[11px] text-altar-text/50 mt-1">{remaining} of 3 free readings remaining today</p>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-altar-gold/10 border border-altar-gold/30 text-xs text-altar-gold font-medium group-hover:border-altar-gold/60 transition-colors">
                        {PRODUCTS.MONTHLY.price}{PRODUCTS.MONTHLY.period}
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
    const [preselectedSpread, setPreselectedSpread] = React.useState<string | null>(null);
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
    const [showCareer, setShowCareer] = React.useState(false);
    const [showCreate, setShowCreate] = React.useState(false);
    const [showSchool, setShowSchool] = React.useState(false);
    const [showTarot, setShowTarot] = React.useState(false);
    const [showAngelNumbers, setShowAngelNumbers] = React.useState(false);
    const [showMoon, setShowMoon] = React.useState(false);
    const [showMoonReading, setShowMoonReading] = React.useState(false);
    const [showRisingReading, setShowRisingReading] = React.useState(false);
    const [showBlueprintScreen, setShowBlueprintScreen] = React.useState(false);
    const coachMark = useCoachMark();

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
        if (tab === 'new' || tab.startsWith('new:')) {
            if (!canDoReading(sub === 'premium')) {
                setShowPremiumOverlay(true);
                return;
            }
            const spreadId = tab.includes(':') ? tab.split(':')[1] : null;
            setPreselectedSpread(spreadId);
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
                    onClose={() => { setShowJournal(false); setCurrentTab('home'); }}
                    onTabChange={handleTabChange}
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
                                className="text-altar-muted text-sm font-display hover:text-altar-text transition-colors"
                            >
                                ← Witness
                            </button>
                            <h2 className="flex-1 text-center font-display text-sm tracking-[3px] text-altar-gold uppercase">Angel Numbers</h2>
                            <div className="w-16" />
                        </div>
                        <div className="max-w-[500px] mx-auto">
                            {/* Condensed poetic intro */}
                            <div className="mx-5 mt-6 mb-2 text-center">
                                <p className="text-[11px] text-altar-text/90 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
                                    Repeating numbers aren't random — they're messages.<br />
                                    <span className="text-altar-gold">Tap one to decode yours.</span>
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

                {/* Overlays */}
                {showCustomReading && (
                    <CustomReading
                        onClose={() => { setShowCustomReading(false); setPreselectedSpread(null); setCurrentTab('home'); }}
                        onComplete={handleCustomReadingComplete}
                        subscription={userProfile?.subscription || 'free'}
                        onTabChange={handleTabChange}
                        initialSpread={preselectedSpread}
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

                    {/* Profile gear icon — inside header, above gradient overlay */}
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="absolute right-4 top-5 z-20 transition-all hover:opacity-80 active:scale-90"
                        style={{ opacity: 0.75, lineHeight: 1, padding: '6px', borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
                        aria-label="Profile settings"
                    >
                        <svg width={22} height={22} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ fill: 'var(--color-altar-gold)', filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.5))' }}>
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fillRule="evenodd" d="M8.5 1.5a1.5 1.5 0 00-1.415 1.002L6.72 3.598A7.536 7.536 0 005.18 4.5l-1.132-.441a1.5 1.5 0 00-1.792.68l-1.5 2.598a1.5 1.5 0 00.377 1.883l.834.606c-.057.437-.086.885-.086 1.338 0 .453.029.9.086 1.338l-.834.605a1.5 1.5 0 00-.377 1.883l1.5 2.598a1.5 1.5 0 001.792.68l1.133-.441c.48.38.998.71 1.54.994l.366 1.095A1.5 1.5 0 0010.12 20h3l.001-.002a1.5 1.5 0 001.414-1.002l.365-1.095a7.523 7.523 0 001.541-.994l1.133.441a1.5 1.5 0 001.792-.68l1.5-2.598a1.5 1.5 0 00-.377-1.883l-.834-.605c.057-.437.086-.885.086-1.338 0-.453-.029-.9-.086-1.338l.834-.606a1.5 1.5 0 00.377-1.883l-1.5-2.598a1.5 1.5 0 00-1.792-.68l-1.133.441a7.524 7.524 0 00-1.54-.994L11.5 2.502A1.5 1.5 0 0010 1.5H8.5zM10 14a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" opacity={0.4} />
                        </svg>
                    </button>

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
                    <div className="mx-3 mb-4 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                        <h3 className="font-display text-center text-sm tracking-[5px] text-altar-gold uppercase mb-4">
                            <span className="text-altar-gold">✦</span> Your Portal <span className="text-altar-gold">✦</span>
                        </h3>
                        <div className="grid grid-cols-3 gap-2.5">
                            {[
                                { label: 'Tarot', tagline: "Today's energy + spreads", tab: 'tarot', icon: iconTarot, goldTint: true, iconSize: 200 },
                                { label: 'Relationships', tagline: 'Cosmic bonds', tab: 'compatibility', icon: iconRelationships, goldTint: true, iconSize: 66 },
                                { label: 'Angel Numbers', tagline: 'Signs & synchronicities', tab: 'angelnumbers', icon: iconAngelNumbers, goldTint: true, iconSize: 80 },
                                { label: 'Natal', tagline: 'Your birth blueprint', tab: 'natal', icon: iconNatal, goldTint: true, iconSize: 80 },
                                { label: 'Family', tagline: 'Circle of souls', tab: 'family', icon: iconFamily, goldTint: true, iconSize: 80 },
                                { label: 'Career', tagline: 'Your true calling', tab: 'career', icon: iconCareer, goldTint: true, iconSize: 80 },
                            ].map(item => (
                                <button
                                    key={item.tab}
                                    onClick={() => handleTabChange(item.tab)}
                                    className="relative flex flex-col items-center justify-center gap-2.5 rounded-[20px] px-2.5 pt-5 pb-4 transition-all duration-250 overflow-hidden active:scale-[0.96] active:opacity-80"
                                    style={{
                                        background: 'linear-gradient(165deg, rgba(35,20,60,0.85) 0%, rgba(18,10,40,0.95) 100%)',
                                        border: '1px solid rgba(212,175,55,0.12)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -3px 10px rgba(0,0,0,0.3)',
                                        aspectRatio: '1 / 1.15',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                    }}
                                >
                                    {/* Gold top accent shine */}
                                    <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: 'linear-gradient(to right, transparent 10%, rgba(212,175,55,0.35) 50%, transparent 90%)' }} />
                                    {/* Subtle gold top glow */}
                                    <div className="absolute top-[-10px] left-1/2 -translate-x-1/2" style={{ width: '60%', height: 30, filter: 'blur(20px)', opacity: 0.08, background: 'var(--color-altar-gold)', pointerEvents: 'none' }} />

                                    {/* Portal card icon — true alpha transparency */}
                                    <div className="relative z-10 flex items-center justify-center flex-shrink-0" style={{ width: 84, height: 84 }}>
                                        <img src={item.icon} alt={item.label} style={{ width: item.iconSize, height: item.iconSize, objectFit: 'contain', filter: 'sepia(1) saturate(1.5) hue-rotate(5deg) brightness(0.85) drop-shadow(0 0 8px rgba(212,175,55,0.35))' }} />
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center gap-1">
                                        <span className="font-display text-[11px] font-semibold text-altar-gold leading-tight text-center tracking-[2px] uppercase">
                                            {item.label}
                                        </span>
                                        <span className="text-[11px] text-altar-text/65 leading-snug text-center px-0.5" style={{ fontWeight: 300 }}>
                                            {item.tagline}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>



                    {/* Premium Banner — only for free users */}
                    {sub !== 'premium' && (
                        <PremiumBanner onClick={() => setShowPremiumOverlay(true)} remaining={getRemainingReadings()} />
                    )}

                    {/* Spacer for bottom nav */}
                    <div className="h-6" />
                </main>
            </div >
            <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
            {coachMark.shouldShow && (
                <CoachMarkTutorial onComplete={coachMark.dismiss} />
            )}
        </div >
    );
}

export default App;