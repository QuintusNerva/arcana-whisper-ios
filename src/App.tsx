import React from 'react';
import { TarotService } from './services/tarot.service';
import { Card, Reading } from './models/card.model';
import { CustomReading } from './components/CustomReading';
import { ReadingResult } from './components/ReadingResult';
import { ProfileModal } from './components/ProfileModal';
import { ReadingHistory } from './components/ReadingHistory';
import { BottomNav } from './components/BottomNav';
import { CardLibrary } from './components/CardLibrary';
import { CardDetail } from './components/CardDetail';

function App() {
    const [currentCard, setCurrentCard] = React.useState<Card | null>(null);
    const [energyCards, setEnergyCards] = React.useState<Card[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showMeaning, setShowMeaning] = React.useState(false);
    const [showCustomReading, setShowCustomReading] = React.useState(false);
    const [customReadingResult, setCustomReadingResult] = React.useState<Reading | null>(null);
    const [isShuffling, setIsShuffling] = React.useState(false);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);
    const [showProfileModal, setShowProfileModal] = React.useState(false);
    const [showHistory, setShowHistory] = React.useState(false);
    const [currentTab, setCurrentTab] = React.useState('home');
    const [selectedCard, setSelectedCard] = React.useState<Card | null>(null);
    const [showCardLibrary, setShowCardLibrary] = React.useState(false);

    const userProfile = React.useMemo(() => {
        try {
            const profile = localStorage.getItem('userProfile');
            return profile ? JSON.parse(profile) : null;
        } catch (error) {
            console.error('Error parsing user profile:', error);
            return null;
        }
    }, []);

    const loadCard = React.useCallback(async () => {
        setIsShuffling(true);
        setShowMeaning(false);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const tarotService = new TarotService();
        const reading = tarotService.getDailyReading();
        setCurrentCard(reading.cards[0]);
        
        // Load separate energy cards
        const energyReading = tarotService.getCustomReading('three-card', 'general');
        setEnergyCards(energyReading.cards);
        
        setIsShuffling(false);
    }, []);

    const handleCustomReadingComplete = (readingData: any) => {
        console.log('Custom reading data:', readingData); // Debug log
        const tarotService = new TarotService();
        const reading = tarotService.getCustomReading(
            readingData.spread,
            readingData.theme,
            readingData.question
        );
        console.log('Generated reading:', reading); // Debug log
        setCustomReadingResult(reading);
        setShowCustomReading(false);
    };

    const handleTabChange = (tab: string) => {
        setCurrentTab(tab);
        if (tab === 'new') {
            setShowCustomReading(true);
        } else if (tab === 'meanings') {
            setShowCardLibrary(true);
        } else if (tab === 'history') {
            setShowHistory(true);
        } else if (tab === 'profile') {
            setShowProfileModal(true);
        }
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
        };

        initializeApp();
    }, [loadCard, isInitialLoad]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] to-[#2f1555] flex items-center justify-center">
                <div className="text-white text-2xl font-medium space-y-4 text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <div className="opacity-80 font-display">Opening the portal to the mystical realm...</div>
                    <div className="text-sm text-white/60 mt-2 animate-pulse font-display">
                        {isInitialLoad ? "Connecting with the ethereal energies..." : "Drawing your daily guidance..."}
                    </div>
                </div>
            </div>
        );
    }

    if (!currentCard) return null;

    if (selectedCard) {
        return (
            <CardDetail
                card={selectedCard}
                onClose={() => setSelectedCard(null)}
                currentTab={currentTab}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showCardLibrary) {
        return (
            <CardLibrary
                onClose={() => {
                    setShowCardLibrary(false);
                    setCurrentTab('home');
                }}
                onViewCard={(card) => {
                    setSelectedCard(card);
                    setShowCardLibrary(false);
                }}
                currentTab={currentTab}
                onTabChange={handleTabChange}
            />
        );
    }

    if (showHistory) {
        return (
            <ReadingHistory 
                onClose={() => setShowHistory(false)}
                onViewReading={(reading) => {
                    setCustomReadingResult(reading);
                    setShowHistory(false);
                }}
                onTabChange={handleTabChange}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#2d1b4e] to-[#1a0f2e] text-[#f0e6ff] pb-20">
            {showCustomReading && (
                <CustomReading
                    onClose={() => {
                        setShowCustomReading(false);
                        setCurrentTab('home');
                    }}
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
                />
            )}

            {showProfileModal && (
                <ProfileModal
                    onClose={() => {
                        setShowProfileModal(false);
                        setCurrentTab('home');
                    }}
                    userProfile={userProfile}
                    onTabChange={handleTabChange}
                />
            )}
            
            <header className="text-center py-5 bg-black/30">
                <h1 className="text-2xl tracking-[3px] font-light">
                    <span className="text-[#ffd700]">✦</span> ARCANA WHISPER <span className="text-[#ffd700]">✦</span>
                </h1>
            </header>

            <main className="max-w-[500px] mx-auto pb-20">
                {/* Compact Daily Card */}
                <div className="bg-gradient-to-br from-[#4a2c6d] to-[#6b4593] rounded-[20px] p-5 mx-5 my-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <h2 className="text-sm uppercase tracking-[2px] mb-4 opacity-80">Daily Reading</h2>
                    <div className="flex gap-4 items-center">
                        <img 
                            src={currentCard.image} 
                            alt={`${currentCard.name} tarot card`}
                            className="w-[100px] h-[150px] rounded-lg flex-shrink-0 object-cover shadow-lg"
                            onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDEwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZDRjNWU4Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UYXJvdCBDYXJkPC90ZXh0Pgo8L3N2Zz4K';
                            }}
                            loading="lazy"
                        />
                        <div className="flex-1">
                            <h3 className="text-xl mb-2">{currentCard.name}</h3>
                            <p className="text-sm leading-relaxed opacity-90">{currentCard.description}</p>
                        </div>
                    </div>
                </div>

                {/* Daily Affirmation */}
                <div className="bg-white/5 rounded-2xl p-5 mx-5 my-4 backdrop-blur-[10px]">
                    <h3 className="text-base mb-3 flex items-center gap-2">
                        <span className="text-xl">✨</span> Daily Affirmation
                    </h3>
                    <div className="italic text-sm leading-relaxed p-4 bg-[rgba(255,215,0,0.1)] border-l-[3px] border-[#ffd700] rounded-lg">
                        "I trust in the natural flow of my life. I embrace patience and know that everything unfolds in perfect timing."
                    </div>
                </div>

                {/* Today's Energy */}
                <div className="bg-white/5 rounded-2xl p-5 mx-5 my-4 backdrop-blur-[10px]">
                    <h3 className="text-base mb-3 flex items-center gap-2">
                        <span className="text-xl">🌙</span> Today's Energy
                    </h3>
                    <div className="flex gap-6 justify-center mt-4">
                        {energyCards.map((card, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <img 
                                    src={card.image} 
                                    alt={`${['Mind', 'Body', 'Spirit'][index]} card`}
                                    className="w-[80px] h-[120px] rounded-md object-cover shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                                    onError={(e) => {
                                        e.currentTarget.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgODAgMTIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZDRjNWU4Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI2MCIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UYXJvdCBDYXJkPC90ZXh0Pgo8L3N2Zz4K`;
                                    }}
                                />
                                <span className="mt-2 text-xs opacity-70 text-center">{['Mind', 'Body', 'Spirit'][index]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Action */}
                <div className="bg-white/5 rounded-2xl p-5 mx-5 my-4 backdrop-blur-[10px]">
                    <div 
                        className="bg-gradient-to-br from-[#6b4593] to-[#8b5fbf] border-2 border-[#ffd700] rounded-xl p-5 text-center cursor-pointer transition-transform hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,215,0,0.3)] text-base font-bold"
                        onClick={() => handleTabChange('new')}
                    >
                        ➕ Draw Another Card
                    </div>
                </div>

                {/* Learning Tip */}
                <div className="bg-white/5 rounded-2xl p-5 mx-5 my-4 backdrop-blur-[10px]">
                    <h3 className="text-base mb-3 flex items-center gap-2">
                        <span className="text-xl">💡</span> Wisdom of the Day
                    </h3>
                    <div className="bg-gradient-to-br from-[#1a4d2e] to-[#2d5f3f] p-4 rounded-lg">
                        <h4 className="text-sm mb-2 text-[#9cffb5]">Major Arcana Insight</h4>
                        <p className="text-sm leading-relaxed">
                            The Temperance card represents the alchemical process of transformation. When this card appears, consider what aspects of your life need blending or balancing.
                        </p>
                    </div>
                </div>
            </main>

            <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
        </div>
    );
}

export default App;