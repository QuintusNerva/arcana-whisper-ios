import React from 'react';
import { TarotService } from '../services/tarot.service';
import { BottomNav } from './BottomNav';
import {
    getReminderSettings, saveReminderSettings, requestNotificationPermission,
    REMINDER_TIMES, formatTime
} from '../services/reminder.service';
import { getMemoryStats, clearMemory } from '../services/memory.service';

interface ProfileModalProps {
    onClose: () => void;
    userProfile: any;
    onTabChange: (tab: string) => void;
}

export function ProfileModal({ onClose, userProfile, onTabChange }: ProfileModalProps) {
    const [name, setName] = React.useState(userProfile?.name || '');
    const [zodiac, setZodiac] = React.useState(userProfile?.zodiac || '');
    const [editing, setEditing] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [showManageSub, setShowManageSub] = React.useState(false);

    // Stats
    const stats = React.useMemo(() => {
        const tarotService = new TarotService();
        const readings = tarotService.getSavedReadings();
        const uniqueCards = new Set(readings.flatMap(r => r.cards.map(c => c.id)));
        const totalCards = tarotService.getAllCards().length;
        return {
            totalReadings: readings.length,
            uniqueCards: uniqueCards.size,
            totalCards,
            collectionPct: totalCards > 0 ? Math.round((uniqueCards.size / totalCards) * 100) : 0,
            streak: calculateStreak(readings.map(r => new Date(r.date))),
            favoriteSpread: getFavoriteSpread(readings),
        };
    }, []);

    const subscription = React.useMemo(() => {
        const sub = userProfile?.subscription || 'free';
        const endsAt = userProfile?.subscriptionEndsAt;
        if (sub === 'premium' && endsAt && new Date(endsAt) < new Date()) {
            const updated = { ...userProfile, subscription: 'free', subscriptionEndsAt: null, wasPremium: true };
            localStorage.setItem('userProfile', JSON.stringify(updated));
            return 'free';
        }
        return sub;
    }, [userProfile]);
    const isCancelled = subscription === 'premium' && !!userProfile?.subscriptionEndsAt;
    const endsAtDate = userProfile?.subscriptionEndsAt ? new Date(userProfile.subscriptionEndsAt) : null;
    const daysLeft = endsAtDate ? Math.max(0, Math.ceil((endsAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
    const endsAtFormatted = endsAtDate ? endsAtDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

    // Calculate next renewal date from subscription start
    const getNextRenewalDate = () => {
        const startedAt = userProfile?.subscriptionStartedAt;
        if (!startedAt) {
            // Fallback: 30 days from now
            const d = new Date(); d.setDate(d.getDate() + 30); return d;
        }
        const start = new Date(startedAt);
        const now = new Date();
        // Walk forward month by month from start until we pass today
        while (start <= now) {
            start.setMonth(start.getMonth() + 1);
        }
        return start;
    };

    const ZODIAC_SIGNS = [
        { sign: '♈', name: 'Aries' }, { sign: '♉', name: 'Taurus' }, { sign: '♊', name: 'Gemini' },
        { sign: '♋', name: 'Cancer' }, { sign: '♌', name: 'Leo' }, { sign: '♍', name: 'Virgo' },
        { sign: '♎', name: 'Libra' }, { sign: '♏', name: 'Scorpio' }, { sign: '♐', name: 'Sagittarius' },
        { sign: '♑', name: 'Capricorn' }, { sign: '♒', name: 'Aquarius' }, { sign: '♓', name: 'Pisces' },
    ];

    const handleSave = () => {
        const profile = { ...userProfile, name, zodiac };
        try {
            localStorage.setItem('userProfile', JSON.stringify(profile));
            setSaved(true);
            setEditing(false);
            setTimeout(() => setSaved(false), 2000);
        } catch { /* */ }
    };

    const handleClearData = () => {
        if (confirm('This will delete all your readings, preferences, and memory. Continue?')) {
            localStorage.removeItem('tarot_readings');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('arcane_tab_usage');
            clearMemory();
            window.location.reload();
        }
    };

    return (
        <div className="page-frame">
            <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top">
                    <div className="flex items-center justify-between px-4 py-3 max-w-[500px] mx-auto">
                        <button onClick={onClose} className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide">
                            ← Altar
                        </button>
                        <h1 className="font-display text-lg text-altar-gold tracking-[4px]">SELF</h1>
                        <div className="w-12" />
                    </div>
                </header>

                <div className="max-w-[500px] mx-auto px-4">
                    {/* Avatar + Name */}
                    <div className="text-center mt-6 mb-6 animate-fade-up">
                        <div className="relative inline-block mb-3">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-altar-mid to-altar-bright flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(139,95,191,0.3)]">
                                {zodiac ? ZODIAC_SIGNS.find(z => z.name === zodiac)?.sign || '✦' : '✦'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-altar-dark border-2 border-altar-gold/30 flex items-center justify-center">
                                <span className="text-[10px]">{subscription === 'premium' ? '👑' : '⭐'}</span>
                            </div>
                        </div>
                        <h2 className="font-display text-xl text-altar-text">{name || 'Seeker'}</h2>
                        <p className="text-xs text-altar-muted mt-1">
                            {zodiac || 'No zodiac set'} · {subscription === 'premium' ? 'Premium Member' : 'Free Plan'}
                        </p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2.5 mb-5 animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                        <div className="glass rounded-xl p-3 text-center">
                            <p className="font-display text-xl text-altar-gold">{stats.totalReadings}</p>
                            <p className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase mt-0.5">Readings</p>
                        </div>
                        <div className="glass rounded-xl p-3 text-center">
                            <p className="font-display text-xl text-altar-gold">{stats.streak}</p>
                            <p className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase mt-0.5">Day Streak</p>
                        </div>
                        <div className="glass rounded-xl p-3 text-center">
                            <p className="font-display text-xl text-altar-gold">{stats.collectionPct}%</p>
                            <p className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase mt-0.5">Collected</p>
                        </div>
                    </div>

                    {/* Collection progress */}
                    <div className="glass rounded-xl p-4 mb-5 animate-fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-display text-altar-muted tracking-[2px] uppercase">Arcana Collection</span>
                            <span className="text-xs text-altar-gold font-display">{stats.uniqueCards}/{stats.totalCards}</span>
                        </div>
                        <div className="w-full h-2 bg-altar-purple/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-altar-gold to-altar-bright rounded-full transition-all duration-1000"
                                style={{ width: `${stats.collectionPct}%` }}
                            />
                        </div>
                        {stats.favoriteSpread && (
                            <p className="text-[10px] text-altar-muted mt-2">
                                Favorite spread: <span className="text-altar-text">{stats.favoriteSpread}</span>
                            </p>
                        )}
                    </div>

                    {/* Edit Profile */}
                    <div className="glass-strong rounded-xl p-4 mb-5 animate-fade-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase">Profile</h3>
                            {!editing && (
                                <button onClick={() => setEditing(true)} className="text-xs text-altar-gold font-display hover:underline">
                                    Edit
                                </button>
                            )}
                        </div>

                        {editing ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] text-altar-muted font-display tracking-[2px] uppercase mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Enter your name…"
                                        className="w-full bg-altar-deep/50 text-sm text-altar-text placeholder-altar-muted/50 rounded-lg px-3 py-2.5 border border-white/10 focus:border-altar-gold/30 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-altar-muted font-display tracking-[2px] uppercase mb-1">Zodiac Sign</label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {ZODIAC_SIGNS.map(z => (
                                            <button
                                                key={z.name}
                                                onClick={() => setZodiac(z.name)}
                                                className={`py-2 rounded-lg text-center transition-all text-xs ${zodiac === z.name
                                                    ? 'bg-altar-gold/15 border border-altar-gold/30 text-altar-gold'
                                                    : 'bg-altar-deep/30 border border-white/5 text-altar-muted hover:text-white'
                                                    }`}
                                            >
                                                <span className="text-base block">{z.sign}</span>
                                                <span className="text-[8px] font-display tracking-wide">{z.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="flex-1 py-2.5 rounded-lg glass text-xs text-altar-muted font-display border border-white/5 hover:border-white/15 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 py-2.5 rounded-lg bg-altar-gold/15 text-xs text-altar-gold font-display border border-altar-gold/20 hover:border-altar-gold/40 transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-between py-1.5">
                                    <span className="text-xs text-altar-muted">Name</span>
                                    <span className="text-xs text-altar-text">{name || 'Not set'}</span>
                                </div>
                                <div className="h-[1px] bg-white/5" />
                                <div className="flex justify-between py-1.5">
                                    <span className="text-xs text-altar-muted">Birthday</span>
                                    <span className="text-xs text-altar-text">
                                        {userProfile?.birthday
                                            ? new Date(userProfile.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                            : 'Not set'}
                                    </span>
                                </div>
                                <div className="h-[1px] bg-white/5" />
                                <div className="flex justify-between py-1.5">
                                    <span className="text-xs text-altar-muted">Zodiac</span>
                                    <span className="text-xs text-altar-text">
                                        {zodiac ? `${ZODIAC_SIGNS.find(z => z.name === zodiac)?.sign} ${zodiac}` : 'Not set'}
                                    </span>
                                </div>
                            </div>
                        )}
                        {saved && (
                            <p className="text-xs text-green-400 text-center mt-2 animate-fade-up">✓ Profile saved</p>
                        )}
                    </div>

                    {/* Subscription */}
                    <div className="rounded-xl p-[1px] bg-gradient-to-r from-altar-gold/30 via-altar-bright/20 to-altar-gold/30 mb-5 animate-fade-up" style={{ animationDelay: '0.45s', opacity: 0 }}>
                        <div className="rounded-xl bg-altar-dark/95 p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{subscription === 'premium' ? '👑' : '⭐'}</span>
                                <div>
                                    <h3 className="font-display text-sm text-altar-gold">
                                        {subscription === 'premium' ? 'Premium Active' : 'Free Plan'}
                                    </h3>
                                    <p className="text-[10px] text-altar-muted">
                                        {subscription === 'premium' ? 'Full access to all features' : 'Upgrade for AI insights & unlimited readings'}
                                    </p>
                                </div>
                            </div>
                            {subscription === 'premium' ? (
                                <button
                                    onClick={() => setShowManageSub(true)}
                                    className="w-full py-3 rounded-xl glass border border-altar-gold/20 text-sm text-altar-gold font-display tracking-wide hover:border-altar-gold/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    Manage Subscription
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        const updated = { ...userProfile, subscription: 'premium', subscriptionEndsAt: null, subscriptionStartedAt: new Date().toISOString() };
                                        localStorage.setItem('userProfile', JSON.stringify(updated));
                                        window.location.reload();
                                    }}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-altar-gold via-altar-gold-dim to-altar-gold text-altar-deep font-display font-bold text-sm tracking-wide hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    Unlock Premium — $4.99/mo
                                </button>
                            )}

                        </div>
                    </div>

                    {/* Settings */}
                    <div className="glass rounded-xl overflow-hidden mb-5 animate-fade-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
                        <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase px-4 pt-4 pb-2">Settings</h3>

                        {/* Daily Reminders — interactive */}
                        <ReminderSettingsRow />

                        {/* Static items */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                            <span className="text-lg">🎨</span>
                            <div className="flex-1"><p className="text-sm text-altar-text">Theme</p></div>
                            <span className="text-xs text-altar-muted">Mystic Altar</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3">
                            <span className="text-lg">📱</span>
                            <div className="flex-1"><p className="text-sm text-altar-text">App Version</p></div>
                            <span className="text-xs text-altar-muted">1.0.0</span>
                        </div>
                    </div>

                    {/* Memory — The Cards Remember */}
                    <MemoryStatsCard />

                    {/* Danger zone */}
                    <div className="mb-8 space-y-2.5 animate-fade-up" style={{ animationDelay: '0.65s', opacity: 0 }}>
                        <button
                            onClick={handleClearData}
                            className="w-full py-3 rounded-xl border border-red-500/15 text-red-400/60 hover:text-red-400 hover:border-red-500/30 text-xs font-display tracking-wide transition-all"
                        >
                            Clear All Data
                        </button>
                    </div>
                </div>
            </div>
            <BottomNav currentTab="profile" onTabChange={onTabChange} />

            {/* Manage Sub Modal — rendered at top level for correct stacking */}
            {
                showManageSub && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={() => setShowManageSub(false)}>
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <div className="relative w-full max-w-[400px] rounded-3xl bg-gradient-to-b from-altar-dark to-altar-deep border border-white/10 p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
                            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
                            <div className="text-center mb-5">
                                <span className="text-3xl block mb-2">👑</span>
                                <h3 className="font-display text-lg text-altar-gold tracking-[3px]">PREMIUM</h3>
                                <p className="text-xs text-altar-muted mt-1">Your current plan</p>
                            </div>
                            <div className="glass rounded-xl p-4 mb-5 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-xs text-altar-muted">Plan</span>
                                    <span className="text-xs text-altar-gold">Premium</span>
                                </div>
                                <div className="h-[1px] bg-white/5" />
                                <div className="flex justify-between">
                                    <span className="text-xs text-altar-muted">Price</span>
                                    <span className="text-xs text-altar-text">$4.99/mo</span>
                                </div>
                                <div className="h-[1px] bg-white/5" />
                                <div className="flex justify-between">
                                    <span className="text-xs text-altar-muted">Status</span>
                                    <span className={`text-xs ${isCancelled ? 'text-amber-400' : 'text-green-400'}`}>
                                        {isCancelled ? `Ends ${endsAtFormatted}` : 'Active ✓'}
                                    </span>
                                </div>
                                <div className="h-[1px] bg-white/5" />
                                <div className="flex justify-between">
                                    <span className="text-xs text-altar-muted">Includes</span>
                                    <span className="text-xs text-altar-text">AI insights · Unlimited readings</span>
                                </div>
                                {isCancelled && (
                                    <>
                                        <div className="h-[1px] bg-white/5" />
                                        <div className="flex justify-between">
                                            <span className="text-xs text-altar-muted">Time left</span>
                                            <span className="text-xs text-amber-400">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowManageSub(false)}
                                    className="flex-1 py-3 rounded-xl glass border border-white/10 text-sm text-altar-muted font-display hover:border-white/20 transition-colors"
                                >
                                    Close
                                </button>
                                {isCancelled ? (
                                    <button
                                        onClick={() => {
                                            const updated = { ...userProfile, subscriptionEndsAt: null };
                                            localStorage.setItem('userProfile', JSON.stringify(updated));
                                            window.location.reload();
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 font-display hover:bg-green-500/20 transition-colors"
                                    >
                                        Reactivate
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            const endsAt = getNextRenewalDate();
                                            const updated = { ...userProfile, subscriptionEndsAt: endsAt.toISOString() };
                                            localStorage.setItem('userProfile', JSON.stringify(updated));
                                            window.location.reload();
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-display hover:bg-red-500/20 transition-colors"
                                    >
                                        Cancel Plan
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

// ── Memory Stats Card ──
function MemoryStatsCard() {
    const [memStats, setMemStats] = React.useState(getMemoryStats);
    const [cleared, setCleared] = React.useState(false);

    const handleDeleteMemory = () => {
        if (confirm('Delete your reading memory? The cards will forget your patterns.')) {
            clearMemory();
            setMemStats(getMemoryStats());
            setCleared(true);
            setTimeout(() => setCleared(false), 2500);
        }
    };

    if (memStats.readingCount === 0 && !cleared) return null;

    // Progress toward next tier
    const tierThresholds = [5, 15, 30];
    const nextThreshold = tierThresholds.find(t => memStats.readingCount < t) || 30;
    const prevThreshold = tierThresholds[tierThresholds.indexOf(nextThreshold) - 1] || 0;
    const tierProgress = memStats.readingCount >= 30
        ? 100
        : Math.round(((memStats.readingCount - prevThreshold) / (nextThreshold - prevThreshold)) * 100);

    return (
        <div className="glass-strong rounded-xl p-4 mb-5 animate-fade-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xs text-altar-muted tracking-[3px] uppercase flex items-center gap-1.5">
                    <span>{memStats.tierIcon}</span> The Cards Remember
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-altar-gold/10 border border-altar-gold/15 text-altar-gold font-display">
                    {memStats.tier}
                </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded-lg bg-altar-deep/40">
                    <p className="font-display text-lg text-altar-gold">{memStats.readingCount}</p>
                    <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase">Remembered</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-altar-deep/40">
                    <p className="font-display text-sm text-altar-text mt-0.5">
                        {memStats.dominantTheme
                            ? memStats.dominantTheme.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                            : '—'}
                    </p>
                    <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase">Focus</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-altar-deep/40">
                    <p className="font-display text-lg text-altar-gold">{memStats.dominantPct}%</p>
                    <p className="text-[8px] text-altar-muted font-display tracking-[1px] uppercase">Strength</p>
                </div>
            </div>

            {/* Tier progress */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-altar-muted">Bond progress</span>
                    <span className="text-[9px] text-altar-gold/70">{memStats.readingCount >= 30 ? 'Max' : `${memStats.readingCount}/${nextThreshold}`}</span>
                </div>
                <div className="w-full h-1.5 bg-altar-purple/40 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-altar-gold/60 to-altar-bright rounded-full transition-all duration-700"
                        style={{ width: `${tierProgress}%` }}
                    />
                </div>
            </div>

            {/* Delete memory */}
            <button
                onClick={handleDeleteMemory}
                className="w-full py-2 rounded-lg border border-red-500/10 text-red-400/50 hover:text-red-400 hover:border-red-500/25 text-[10px] font-display tracking-wide transition-all"
            >
                {cleared ? '✓ Memory cleared' : '🗑 Delete My Memory'}
            </button>
        </div>
    );
}

// ── Reminder Settings Row ──
function ReminderSettingsRow() {
    const [settings, setSettings] = React.useState(getReminderSettings);
    const [showTimePicker, setShowTimePicker] = React.useState(false);
    const [permDenied, setPermDenied] = React.useState(false);

    const handleToggle = async () => {
        if (!settings.enabled) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                setPermDenied(true);
                setTimeout(() => setPermDenied(false), 3000);
                return;
            }
        }
        const updated = saveReminderSettings({ enabled: !settings.enabled });
        setSettings(updated);
    };

    const handleTimeChange = (time: string) => {
        const updated = saveReminderSettings({ time });
        setSettings(updated);
        setShowTimePicker(false);
    };

    return (
        <div className="border-b border-white/5">
            <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">🔔</span>
                <div className="flex-1">
                    <p className="text-sm text-altar-text">Daily Reminders</p>
                    {permDenied && (
                        <p className="text-[10px] text-red-400 mt-0.5">Notifications blocked — enable in browser settings</p>
                    )}
                </div>
                {/* Toggle */}
                <button
                    onClick={handleToggle}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${settings.enabled
                        ? 'bg-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                        : 'bg-white/10'
                        }`}
                >
                    <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${settings.enabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                    />
                </button>
            </div>

            {/* Time picker — shows when enabled */}
            {settings.enabled && (
                <div className="px-4 pb-3 flex items-center gap-2">
                    <span className="text-[10px] text-altar-muted">Remind at</span>
                    <button
                        onClick={() => setShowTimePicker(!showTimePicker)}
                        className="px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/20 text-xs text-purple-300 font-display hover:bg-purple-500/25 transition-colors"
                    >
                        {formatTime(settings.time)}
                    </button>
                </div>
            )}

            {/* Time dropdown */}
            {showTimePicker && (
                <div className="px-4 pb-3">
                    <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto rounded-lg bg-altar-dark/80 p-2 border border-purple-500/15">
                        {REMINDER_TIMES.map((t) => (
                            <button
                                key={t}
                                onClick={() => handleTimeChange(t)}
                                className={`px-1 py-1.5 rounded text-[10px] font-display transition-colors ${t === settings.time
                                    ? 'bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/30'
                                    : 'text-altar-muted hover:bg-white/5 hover:text-altar-text'
                                    }`}
                            >
                                {formatTime(t)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Helper functions ──

function calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    // Check if there's a reading today or yesterday
    const latestDate = new Date(sorted[0]);
    latestDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return 0;

    for (const date of sorted) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() === checkDate.getTime()) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (d.getTime() < checkDate.getTime()) {
            break;
        }
    }
    return streak;
}

function getFavoriteSpread(readings: { spread: string }[]): string | null {
    if (readings.length === 0) return null;
    const counts: Record<string, number> = {};
    readings.forEach(r => { counts[r.spread] = (counts[r.spread] || 0) + 1; });
    const labels: Record<string, string> = {
        'single': 'Single Card', 'three-card': '3-Card Spread',
        'yes-no': 'Yes / No', 'career': 'Career Path', 'relationship': 'Relationship',
        'celtic-cross': 'Celtic Cross', 'horseshoe': 'Horseshoe',
    };
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return labels[top[0]] || top[0];
}
