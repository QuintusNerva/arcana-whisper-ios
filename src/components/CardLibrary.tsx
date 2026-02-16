import React from 'react';
import { Card } from '../models/card.model';
import { TarotService } from '../services/tarot.service';
import { BottomNav } from './BottomNav';

interface CardLibraryProps {
    onClose: () => void;
    onViewCard: (card: Card) => void;
    currentTab: string;
    onTabChange: (tab: string) => void;
}

const SUIT_FILTERS = ['All', 'Major Arcana'];
const ELEMENT_ICONS: Record<string, string> = {
    Fire: '🔥', Water: '💧', Air: '💨', Earth: '🌿',
};

export function CardLibrary({ onClose, onViewCard, currentTab, onTabChange }: CardLibraryProps) {
    const [cards, setCards] = React.useState<Card[]>([]);
    const [search, setSearch] = React.useState('');
    const [selectedFilter, setSelectedFilter] = React.useState('All');

    React.useEffect(() => {
        const tarotService = new TarotService();
        setCards(tarotService.getAllCards());
    }, []);

    const filteredCards = cards.filter(card => {
        const matchesSearch = !search ||
            card.name.toLowerCase().includes(search.toLowerCase()) ||
            card.description.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = selectedFilter === 'All' || card.suit === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    // Group by element for visual sections
    const elements = ['Fire', 'Water', 'Air', 'Earth'];

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="max-w-[500px] mx-auto px-4 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">
                                ← Altar
                            </button>
                            <h1 className="font-display text-lg text-altar-gold tracking-[4px]">CODEX</h1>
                            <div className="w-12" />
                        </div>

                        {/* Search */}
                        <div className="glass rounded-xl flex items-center gap-2 px-3 py-2.5">
                            <span className="text-altar-muted text-sm">🔍</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search the arcana…"
                                className="bg-transparent flex-1 text-sm text-altar-text placeholder-altar-muted/50 focus:outline-none"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="text-altar-muted hover:text-white text-xs">✕</button>
                            )}
                        </div>

                        {/* Filter pills */}
                        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                            {SUIT_FILTERS.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setSelectedFilter(filter)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display tracking-wide transition-all ${selectedFilter === filter
                                        ? 'bg-altar-gold/20 text-altar-gold border border-altar-gold/30'
                                        : 'glass text-altar-muted hover:text-white border border-transparent'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                            {elements.map(el => (
                                <button
                                    key={el}
                                    onClick={() => setSelectedFilter(selectedFilter === el ? 'All' : el)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display tracking-wide transition-all flex items-center gap-1 ${selectedFilter === el
                                        ? 'bg-altar-gold/20 text-altar-gold border border-altar-gold/30'
                                        : 'glass text-altar-muted hover:text-white border border-transparent'
                                        }`}
                                >
                                    {ELEMENT_ICONS[el]} {el}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Results count */}
                <div className="max-w-[500px] mx-auto px-4 pt-3 pb-1">
                    <p className="text-xs text-altar-muted font-display tracking-[2px]">
                        {filteredCards.length} CARD{filteredCards.length !== 1 ? 'S' : ''} FOUND
                    </p>
                </div>

                {/* Card Grid */}
                <div className="max-w-[500px] mx-auto px-4">
                    <div className="grid grid-cols-3 gap-3">
                        {filteredCards.map((card, i) => (
                            <button
                                key={card.id}
                                onClick={() => onViewCard(card)}
                                className="group flex flex-col items-center rounded-xl overflow-hidden glass border border-white/5 hover:border-altar-gold/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(139,95,191,0.2)] animate-fade-up"
                                style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s`, opacity: 0 }}
                            >
                                {/* Card image */}
                                <div className="relative w-full aspect-[2/3] overflow-hidden">
                                    <img
                                        src={card.image}
                                        alt={card.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiByeD0iOCIgZmlsbD0iIzRhMmM2ZCIvPgo8dGV4dCB4PSI2MCIgeT0iOTAiIGZpbGw9IiNmZmQ3MDAiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zaXplPSIyOCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4pyoPC90ZXh0Pgo8L3N2Zz4K';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Element badge */}
                                    {card.element && (
                                        <span className="absolute top-1.5 right-1.5 text-xs bg-black/40 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center">
                                            {ELEMENT_ICONS[card.element] || '✦'}
                                        </span>
                                    )}
                                </div>

                                {/* Card info */}
                                <div className="p-2 w-full text-center">
                                    <h3 className="font-display text-[11px] text-altar-text leading-tight truncate">{card.name}</h3>
                                    {card.number !== undefined && (
                                        <span className="text-[9px] text-altar-muted">{card.suit} · {card.number}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {filteredCards.length === 0 && (
                        <div className="text-center py-16">
                            <span className="text-3xl block mb-3">🔮</span>
                            <p className="font-display text-altar-muted text-sm">No cards match your search</p>
                            <button
                                onClick={() => { setSearch(''); setSelectedFilter('All'); }}
                                className="mt-3 text-xs text-altar-gold hover:underline font-display"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab={currentTab} onTabChange={onTabChange} />
        </div>
    );
}
