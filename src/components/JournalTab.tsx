import { safeStorage } from "../services/storage.service";
import React from 'react';
import { BottomNav } from './BottomNav';
import { JournalEntryView } from './JournalEntry';
import { AIResponseRenderer } from './AIResponseRenderer';
import { DreamJournal } from './DreamJournal';
import {
    getJournalEntries, getJournalEntryCount, deleteJournalEntry,
    getPatternProgress, getPatternInsights, PatternInsight,
    isPatternAnalysisDue, buildPatternData, savePatternInsights,
    markPatternAnalysisDone, markPatternsRead, hasUnreadPatterns,
    getJournalReminderSettings, saveJournalReminderSettings,
    JournalEntry,
} from '../services/journal.service';
import { AIService } from '../services/ai.service';
import { getBirthData, getNatalTriad } from '../services/astrology.service';

interface JournalTabProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

export function JournalTab({ onClose, onTabChange }: JournalTabProps) {
    const [activeSubTab, setActiveSubTab] = React.useState<'journal' | 'dreams'>('journal');
    const [showEntry, setShowEntry] = React.useState(false);
    const [editEntry, setEditEntry] = React.useState<JournalEntry | null>(null);
    const [entries, setEntries] = React.useState<JournalEntry[]>([]);
    const [patterns, setPatterns] = React.useState<PatternInsight[]>([]);
    const [progress, setProgress] = React.useState(getPatternProgress());
    const [showOnboarding, setShowOnboarding] = React.useState(false);
    const [analyzingPatterns, setAnalyzingPatterns] = React.useState(false);
    const [showReminder, setShowReminder] = React.useState(false);
    const [reminderSettings, setReminderSettings] = React.useState(getJournalReminderSettings());
    const [showGuide, setShowGuide] = React.useState(false);


    // Load entries and patterns
    const refreshData = React.useCallback(() => {
        setEntries(getJournalEntries());
        setPatterns(getPatternInsights());
        setProgress(getPatternProgress());
    }, []);

    React.useEffect(() => {
        refreshData();
        // Show onboarding if first time
        if (getJournalEntryCount() === 0) {
            const seen = safeStorage.getItem('journal_onboarding_seen');
            if (!seen) setShowOnboarding(true);
        }
    }, []);

    // Run pattern analysis if due
    React.useEffect(() => {
        if (!isPatternAnalysisDue()) return;
        runPatternAnalysis();
    }, []);

    const runPatternAnalysis = async () => {
        const patternData = buildPatternData();
        const planets = Object.keys(patternData);
        if (planets.length === 0) return;

        const ai = new AIService();
        if (!ai.hasApiKey()) return;

        setAnalyzingPatterns(true);

        const birthData = getBirthData();
        let triadContext: { sun?: string; moon?: string; rising?: string } | undefined;
        if (birthData) {
            const triad = getNatalTriad(birthData);
            triadContext = { sun: triad.sun.name, moon: triad.moon.name, rising: triad.rising.name };
        }

        const existingPatterns = getPatternInsights();
        const newPatterns: PatternInsight[] = [...existingPatterns];

        for (const planet of planets.slice(0, 3)) {
            try {
                const data = patternData[planet];
                const summary = await ai.getJournalPatterns(
                    planet,
                    data.entries.map(e => ({ text: e.text, date: e.date, mood: e.mood })),
                    triadContext,
                );

                const existingIdx = newPatterns.findIndex(p => p.planet === planet);
                const insight: PatternInsight = {
                    id: planet + '_pattern',
                    discoveredDate: new Date().toISOString().slice(0, 10),
                    planet,
                    title: `Your ${planet.charAt(0).toUpperCase() + planet.slice(1)} Pattern`,
                    summary,
                    entryCount: data.count,
                    isNew: true,
                };

                if (existingIdx >= 0) {
                    newPatterns[existingIdx] = insight;
                } else {
                    newPatterns.push(insight);
                }
            } catch (err) {
                console.error(`Pattern analysis failed for ${planet}:`, err);
            }
        }

        savePatternInsights(newPatterns);
        markPatternAnalysisDone();
        setPatterns(newPatterns);
        setAnalyzingPatterns(false);
    };

    const handleNewEntry = () => {
        setEditEntry(null);
        setShowEntry(true);
    };

    const handleEditEntry = (entry: JournalEntry) => {
        setEditEntry(entry);
        setShowEntry(true);
    };

    const handleCloseEntry = () => {
        setShowEntry(false);
        setEditEntry(null);
        refreshData();
    };

    const handleDeleteEntry = (id: string) => {
        deleteJournalEntry(id);
        refreshData();
    };

    const handleDismissOnboarding = () => {
        setShowOnboarding(false);
        safeStorage.setItem('journal_onboarding_seen', 'true');
    };

    const handleToggleReminder = () => {
        const newSettings = { ...reminderSettings, enabled: !reminderSettings.enabled };
        saveJournalReminderSettings(newSettings);
        setReminderSettings(newSettings);
    };

    // Full-screen journal entry view
    if (showEntry) {
        return <JournalEntryView onClose={handleCloseEntry} editEntry={editEntry} />;
    }

    // Dreams sub-tab — render the full DreamJournal view
    if (activeSubTab === 'dreams') {
        return (
            <DreamJournal
                onClose={() => setActiveSubTab('journal')}
                onTabChange={onTabChange}
            />
        );
    }

    // Group entries by date
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const groupEntries = () => {
        const groups: { label: string; entries: JournalEntry[] }[] = [];
        const todayEntries = entries.filter(e => e.date === today);
        const yesterdayEntries = entries.filter(e => e.date === yesterday);
        const olderEntries = entries.filter(e => e.date !== today && e.date !== yesterday);

        if (todayEntries.length > 0) groups.push({ label: 'Today', entries: todayEntries });
        if (yesterdayEntries.length > 0) groups.push({ label: 'Yesterday', entries: yesterdayEntries });
        if (olderEntries.length > 0) groups.push({ label: 'Earlier', entries: olderEntries.slice(0, 10) });
        return groups;
    };

    const entryGroups = groupEntries();

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">← Altar</button>
                        {/* Sub-tab switcher */}
                        <div className="flex items-center gap-1 rounded-full p-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {(['journal', 'dreams'] as const).map(tab => {
                                const isActive = activeSubTab === tab;
                                const isDream = tab === 'dreams';
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveSubTab(tab)}
                                        className="px-3 py-1 rounded-full text-[11px] font-display tracking-wide transition-all"
                                        style={isActive ? {
                                            background: isDream ? 'rgba(109,40,217,0.5)' : 'rgba(212,175,55,0.2)',
                                            color: isDream ? '#c4b5fd' : '#d4af37',
                                            border: `1px solid ${isDream ? 'rgba(139,92,246,0.5)' : 'rgba(212,175,55,0.3)'}`,
                                        } : {
                                            color: 'rgba(255,255,255,0.4)',
                                            border: '1px solid transparent',
                                        }}
                                    >
                                        {isDream ? '🌙 Dreams' : '📓 Journal'}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setShowReminder(!showReminder)}
                            className={`text-sm ${reminderSettings.enabled ? 'text-altar-gold' : 'text-altar-muted/40'}`}
                        >
                            🔔
                        </button>
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Onboarding — first time only */}
                    {showOnboarding && (
                        <div className="mt-5 mb-4 glass rounded-2xl p-5 animate-fade-up border border-altar-gold/10">
                            <p className="text-sm text-altar-text/85 leading-relaxed mb-3">
                                <strong className="text-altar-gold font-display">This is your space.</strong>
                            </p>
                            <p className="text-xs text-altar-text/70 leading-relaxed mb-2">
                                No judgment. No grades. No one reads this but you.
                            </p>
                            <p className="text-xs text-altar-text/70 leading-relaxed mb-2">
                                Just write what's real — how you feel, what happened, what's on your mind. Be honest here, even when it's messy.
                            </p>
                            <p className="text-xs text-altar-text/70 leading-relaxed mb-3">
                                Over time, we'll quietly notice patterns in your words and show you what the cosmos might be reflecting. But here's the thing — <strong className="text-altar-text/90">you're the pilot.</strong> The stars don't control you. They just show you the weather. You decide where to fly.
                            </p>
                            <button
                                onClick={handleDismissOnboarding}
                                className="w-full py-2.5 rounded-xl bg-altar-gold/10 border border-altar-gold/20 text-xs text-altar-gold font-display tracking-wide hover:border-altar-gold/40 transition-all"
                            >
                                I understand — let me write ✦
                            </button>
                        </div>
                    )}

                    {/* Reminder settings dropdown */}
                    {showReminder && (
                        <div className="mt-4 mb-2 glass rounded-xl p-4 animate-fade-up border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-altar-text font-display">Daily Journal Reminder</p>
                                <button
                                    onClick={handleToggleReminder}
                                    className={`w-10 h-5 rounded-full transition-all ${reminderSettings.enabled ? 'bg-altar-gold/40' : 'bg-white/10'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full transition-all ${reminderSettings.enabled
                                        ? 'bg-altar-gold translate-x-5'
                                        : 'bg-altar-muted/40 translate-x-0.5'
                                        }`} />
                                </button>
                            </div>
                            <p className="text-[10px] text-altar-muted">
                                {reminderSettings.enabled
                                    ? `Reminder set for ${reminderSettings.time}. We'll gently nudge you.`
                                    : 'Off — turn on to get a gentle daily reminder to journal.'
                                }
                            </p>
                        </div>
                    )}

                    {/* New Entry Button */}
                    <div className="mt-5 mb-4">
                        <button
                            onClick={handleNewEntry}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-altar-mid/40 via-altar-bright/30 to-altar-mid/40 border border-altar-gold/15 text-altar-gold font-display text-sm tracking-wide hover:border-altar-gold/30 hover:shadow-[0_0_20px_rgba(255,215,0,0.08)] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">✦</span> New Entry
                        </button>
                    </div>

                    {/* How It Works — collapsible guide */}
                    {/* How It Works — collapsible guide */}
                    <div className="mb-4 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                        >
                            <span className="text-[10px] text-altar-muted/50 font-display tracking-[2px] uppercase">How It Works</span>
                            <span className={`text-[10px] text-altar-muted/30 transition-transform ${showGuide ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {showGuide && (
                            <div className="mt-2 glass rounded-xl p-4 border border-white/5 animate-fade-up space-y-3">
                                {[
                                    { step: '1', icon: '✍️', title: 'Write what\'s real', desc: 'Tap "New Entry" and jot down how you feel, what happened, or what\'s on your mind. No judgment, no rules — just honesty.' },
                                    { step: '2', icon: '🌌', title: 'Track the cosmos', desc: 'Each entry is automatically tagged with the active cosmic transits. Over time, you\'ll build a map of how the planets move through your life.' },
                                    { step: '3', icon: '✨', title: 'Discover patterns', desc: `After ${progress.target} entries, we analyze your words against your cosmic transits and surface hidden patterns — themes you might not notice otherwise.` },
                                ].map(item => (
                                    <div key={item.step} className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-altar-gold/10 border border-altar-gold/15 flex items-center justify-center shrink-0">
                                            <span className="text-xs">{item.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-altar-text/80 font-semibold">{item.title}</p>
                                            <p className="text-[10px] text-altar-muted/50 leading-relaxed mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}

                                <p className="text-[9px] text-altar-muted/30 text-center pt-1 italic">
                                    The stars don't control you — they show you the weather. You decide where to fly.
                                </p>
                            </div>
                        )}
                    </div>


                    {/* ── PATTERNS SECTION ── */}
                    <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                        {progress.unlocked ? (
                            /* Patterns unlocked */
                            <div>
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-3 flex items-center gap-1.5">
                                    <span className="text-altar-gold">✨</span> Cosmic Patterns
                                    {hasUnreadPatterns() && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-altar-gold animate-pulse" />
                                    )}
                                </h3>

                                {analyzingPatterns ? (
                                    <div className="glass rounded-xl p-4 text-center">
                                        <div className="text-2xl animate-float mb-2">🔮</div>
                                        <p className="text-[10px] text-altar-muted animate-pulse">Analyzing your patterns...</p>
                                    </div>
                                ) : patterns.length > 0 ? (
                                    <div className="space-y-2">
                                        {patterns.map(pattern => (
                                            <button
                                                key={pattern.id}
                                                onClick={() => markPatternsRead()}
                                                className="w-full text-left rounded-xl border border-white/5 bg-gradient-to-br from-violet-500/5 to-indigo-900/5 p-4 transition-all hover:border-altar-gold/20"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm">✨</span>
                                                    <p className="text-xs text-altar-gold font-display font-semibold">{pattern.title}</p>
                                                    {pattern.isNew && (
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-altar-gold/20 text-altar-gold font-display">NEW</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-altar-text/70 leading-relaxed">
                                                    <AIResponseRenderer text={pattern.summary} />
                                                </div>
                                                <p className="text-[9px] text-altar-muted/50 mt-2">
                                                    Based on {pattern.entryCount} entries · Discovered {pattern.discoveredDate}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass rounded-xl p-4 text-center">
                                        <p className="text-xs text-altar-muted">
                                            We're watching for patterns. Keep writing — insights will appear here when we find something.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Progress toward unlock */
                            <div className="glass rounded-2xl p-4 border border-white/5">
                                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase mb-2 flex items-center gap-1.5">
                                    <span className="text-altar-muted/50">✨</span> Cosmic Patterns
                                </h3>
                                <p className="text-[10px] text-altar-muted/70 mb-3">
                                    After {progress.target} journal entries, we'll start finding hidden patterns between your words and the stars.
                                </p>
                                {/* Progress bar */}
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-gradient-to-r from-altar-gold/40 to-altar-gold/70 rounded-full transition-all duration-700"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-altar-muted/50 italic">
                                    {progress.current} / {progress.target} — {progress.message}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── ENTRIES LIST ── */}
                    {entryGroups.length > 0 ? (
                        <div className="mb-5">
                            {entryGroups.map((group, gi) => (
                                <div key={group.label} className="mb-4 animate-fade-up" style={{ animationDelay: `${0.3 + gi * 0.1}s`, opacity: 0 }}>
                                    <h3 className="font-display text-[10px] text-altar-muted/50 tracking-[3px] uppercase mb-2">{group.label}</h3>
                                    <div className="space-y-2">
                                        {group.entries.map(entry => (
                                            <div
                                                key={entry.id}
                                                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        {entry.mood && <span className="text-sm">{entry.mood}</span>}
                                                        <span className="text-[10px] text-altar-muted/40">
                                                            {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleEditEntry(entry)}
                                                            className="text-[9px] text-altar-muted/30 hover:text-altar-gold transition-colors px-1"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEntry(entry.id)}
                                                            className="text-[9px] text-altar-muted/30 hover:text-red-400 transition-colors px-1"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-altar-text/70 leading-relaxed line-clamp-3">
                                                    {entry.text}
                                                </p>
                                                {entry.transitSnapshot && entry.transitSnapshot.length > 0 && (
                                                    <div className="mt-2 flex gap-1 flex-wrap">
                                                        {entry.transitSnapshot.slice(0, 3).map((t, i) => (
                                                            <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.03] text-altar-muted/30">
                                                                {t.transitPlanet} {t.aspect.slice(0, 3).toLowerCase()} {t.natalPlanet}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !showOnboarding && (
                        <div className="text-center py-8 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                            <p className="text-3xl mb-2">📓</p>
                            <p className="text-xs text-altar-muted/50">Your journal is empty.</p>
                            <p className="text-[10px] text-altar-muted/30 mt-1">Tap "New Entry" to start writing.</p>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav currentTab="journal" onTabChange={onTabChange} />
        </div>
    );
}
