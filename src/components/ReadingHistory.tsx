import React from 'react';
import { Reading } from '../models/card.model';
import { TarotService } from '../services/tarot.service';
import { BottomNav } from './BottomNav';

interface ReadingHistoryProps {
    onClose: () => void;
    onViewReading: (reading: Reading) => void;
    onTabChange: (tab: string) => void;
}

const SPREAD_LABELS: Record<string, string> = {
    'single': '🃏 Single Card',
    'three-card': '🔮 3-Card Spread',
    'yes-no': '⚡ Yes / No',
    'career': '💼 Career Path',
    'relationship': '💕 Relationship',
    'celtic-cross': '⚜️ Celtic Cross',
    'horseshoe': '🌙 Horseshoe',
};

const THEME_LABELS: Record<string, string> = {
    'general': '🔮 General',
    'love': '💕 Love',
    'career': '💼 Career',
    'growth': '🕊️ Spirit',
};

function formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function ReadingHistory({ onClose, onViewReading, onTabChange }: ReadingHistoryProps) {
    const [readings, setReadings] = React.useState<Reading[]>([]);
    const [filter, setFilter] = React.useState<'all' | 'daily' | 'custom'>('all');

    React.useEffect(() => {
        const tarotService = new TarotService();
        setReadings(tarotService.getSavedReadings());
    }, []);

    const filteredReadings = readings.filter(r => {
        if (filter === 'all') return true;
        return r.type === filter;
    });

    // Group readings by date
    const grouped = filteredReadings.reduce<Record<string, Reading[]>>((acc, reading) => {
        const key = formatDate(reading.date);
        if (!acc[key]) acc[key] = [];
        acc[key].push(reading);
        return acc;
    }, {});

    const handleDelete = (id: string) => {
        const updated = readings.filter(r => r.id !== id);
        setReadings(updated);
        try {
            localStorage.setItem('tarot_readings', JSON.stringify(updated));
        } catch { /* */ }
    };

    const handleClearAll = () => {
        setReadings([]);
        try {
            localStorage.removeItem('tarot_readings');
        } catch { /* */ }
    };

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
                            <h1 className="font-display text-lg text-altar-gold tracking-[4px]">PAST</h1>
                            {readings.length > 0 ? (
                                <button onClick={handleClearAll} className="text-red-400/60 hover:text-red-400 transition-colors text-xs font-display">
                                    Clear All
                                </button>
                            ) : <div className="w-12" />}
                        </div>

                        {/* Filter tabs */}
                        <div className="flex glass rounded-xl p-1">
                            {(['all', 'daily', 'custom'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-display tracking-wide transition-all capitalize ${filter === f
                                        ? 'bg-altar-mid/60 text-altar-gold shadow-md'
                                        : 'text-altar-muted hover:text-white'
                                        }`}
                                >
                                    {f === 'all' ? '✦ All' : f === 'daily' ? '☀️ Daily' : '🔮 Custom'}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Stats summary */}
                    {readings.length > 0 && (
                        <div className="flex gap-3 mt-4 mb-4 animate-fade-up">
                            <div className="flex-1 glass rounded-xl p-3 text-center">
                                <p className="font-display text-xl text-altar-gold">{readings.length}</p>
                                <p className="text-[10px] text-altar-muted font-display tracking-[2px] uppercase">Readings</p>
                            </div>
                            <div className="flex-1 glass rounded-xl p-3 text-center">
                                <p className="font-display text-xl text-altar-gold">
                                    {new Set(readings.flatMap(r => r.cards.map(c => c.id))).size}
                                </p>
                                <p className="text-[10px] text-altar-muted font-display tracking-[2px] uppercase">Cards Drawn</p>
                            </div>
                            <div className="flex-1 glass rounded-xl p-3 text-center">
                                <p className="font-display text-xl text-altar-gold">
                                    {new Set(readings.map(r => r.spread)).size}
                                </p>
                                <p className="text-[10px] text-altar-muted font-display tracking-[2px] uppercase">Spread Types</p>
                            </div>
                        </div>
                    )}

                    {/* Grouped readings */}
                    {Object.entries(grouped).map(([dateLabel, dateReadings], groupIdx) => (
                        <div key={dateLabel} className="mb-6 animate-fade-up" style={{ animationDelay: `${groupIdx * 0.1}s`, opacity: 0 }}>
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-2">
                                <span className="w-3 h-[1px] bg-altar-gold/30" />
                                {dateLabel}
                                <span className="flex-1 h-[1px] bg-altar-gold/10" />
                            </h3>

                            <div className="space-y-2.5">
                                {dateReadings.map((reading, i) => (
                                    <div
                                        key={reading.id}
                                        className="glass rounded-xl overflow-hidden border border-white/5 hover:border-altar-gold/15 transition-all group"
                                    >
                                        <button
                                            onClick={() => onViewReading(reading)}
                                            className="w-full p-4 text-left"
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Card thumbnails */}
                                                <div className="flex -space-x-2 flex-shrink-0">
                                                    {reading.cards.slice(0, 3).map((card, ci) => (
                                                        <div
                                                            key={ci}
                                                            className="w-10 h-14 rounded-lg overflow-hidden border border-altar-dark/50 shadow-sm"
                                                            style={{ zIndex: 3 - ci }}
                                                        >
                                                            <img
                                                                src={card.image}
                                                                alt={card.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA0MCA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNTYiIHJ4PSI4IiBmaWxsPSIjNGEyYzZkIi8+PHRleHQgeD0iMjAiIHk9IjI4IiBmaWxsPSIjZmZkNzAwIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7inKg8L3RleHQ+PC9zdmc+';
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                    {reading.cards.length > 3 && (
                                                        <div className="w-10 h-14 rounded-lg bg-altar-mid/60 border border-altar-dark/50 flex items-center justify-center text-[10px] text-altar-muted font-display">
                                                            +{reading.cards.length - 3}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Reading info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-display text-altar-text">
                                                            {SPREAD_LABELS[reading.spread] || reading.spread}
                                                        </span>
                                                    </div>

                                                    {reading.question && (
                                                        <p className="text-xs text-altar-muted italic truncate mb-1">
                                                            "{reading.question}"
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-2 text-[10px] text-altar-muted/70">
                                                        <span>{THEME_LABELS[reading.theme] || reading.theme}</span>
                                                        <span>·</span>
                                                        <span>{formatTime(reading.date)}</span>
                                                        <span>·</span>
                                                        <span>{reading.cards.length} card{reading.cards.length > 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <span className="text-altar-muted/40 group-hover:text-altar-gold transition-colors mt-2">›</span>
                                            </div>
                                        </button>

                                        {/* Swipe delete hint */}
                                        <div className="flex justify-end px-4 pb-2 -mt-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(reading.id); }}
                                                className="text-[10px] text-red-400/40 hover:text-red-400 transition-colors font-display"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Empty state */}
                    {filteredReadings.length === 0 && (
                        <div className="text-center py-20 animate-fade-up">
                            <span className="text-4xl block mb-4">📜</span>
                            <h3 className="font-display text-lg text-altar-text mb-2">No Readings Yet</h3>
                            <p className="text-sm text-altar-muted mb-6 max-w-[280px] mx-auto">
                                {filter !== 'all'
                                    ? `No ${filter} readings found. Try a different filter.`
                                    : 'Your past readings will appear here after you draw cards and save them.'}
                            </p>
                            <button
                                onClick={() => onTabChange('new')}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-altar-mid to-altar-bright text-white font-display text-sm font-semibold tracking-wide border border-altar-gold/20 hover:border-altar-gold/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                ✦ Draw Your First Card ✦
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab="history" onTabChange={onTabChange} />
        </div>
    );
}
