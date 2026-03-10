/**
 * SchoolTab — Phase 3: Manifestation School
 * Three pillars: Teachings | Angel Numbers | Sounds
 *
 * Altar = universe speaks TO you
 * Create = you speak TO the universe
 * School = you grow into someone who can hold what you're calling in
 */

import React from 'react';
import { BottomNav } from './BottomNav';
import { PageHeader } from './PageHeader';
import { safeStorage } from '../services/storage.service';

// ── TEACHINGS DATA ─────────────────────────────────────────────────────────

const TEACHINGS = [
    {
        id: 'two-part-formula',
        title: 'The Two-Part Formula',
        subtitle: 'Intention × Alignment',
        emoji: '⚗️',
        preview: 'Manifestation is not wishing. It has two active ingredients — and most people only use one.',
        content: `Most people treat manifestation like ordering from a menu: you state what you want and wait. That's half the formula.\n\nThe full equation is: **Intention × Alignment**. Intention is the *what* — the specific, declared outcome you're calling in. Alignment is the *who* — becoming the version of yourself for whom this outcome is natural.\n\nA person with a clear intention but zero alignment is like a radio transmitting on one frequency while living on another. The signal never reaches its destination.\n\n**Practice**: Write your intention. Then ask: "What would someone who already has this *believe* about themselves?" Start believing that today. Alignment is a decision, not a consequence.`,
    },
    {
        id: 'clarity-beats-desire',
        title: 'Clarity Beats Desire',
        subtitle: 'Why specificity is the signal',
        emoji: '🔬',
        preview: '"I want more money" is noise. "I am calling in $8,000 for my creative work by June" is a signal.',
        content: `The universe doesn't respond to vague longing — it responds to a clear signal. Desire is fuel, but clarity is the frequency.\n\nWhen you say "I want to be happy" or "I want more abundance," you're transmitting static. The field can't lock on to it. When you say "I am calling in a fulfilling remote creative role that pays $90K+, working with people who value depth and craft" — that is a signal it can match.\n\n**Why specificity works**: It forces you to confront resistance. The moment you get specific, every belief that says "I'm not the kind of person who gets that" surfaces. Those beliefs are the actual blockage. Vagueness lets you avoid them.\n\n**Practice**: Revisit your active intention. Make it 3x more specific. Notice what feeling comes up when you do.`,
    },
    {
        id: 'contrast-method',
        title: 'The Contrast Method',
        subtitle: 'Use what you don\'t want',
        emoji: '🌗',
        preview: 'Your dissatisfaction is one of the most valuable data sources you have.',
        content: `Every experience you don't want is showing you, with perfect precision, what you do want. This is the contrast method: adversity as a compass.\n\nWhen you're frustrated that someone isn't communicating openly with you, the contrast has just revealed what you actually want: deep, honest connection. When work feels hollow, the contrast is showing you that you want work that feels alive with purpose.\n\n**The mistake**: Most people spend their energy on the contrast (the frustration, the complaint, the story about what's wrong). They broadcast that frequency constantly and wonder why they keep attracting more of the same.\n\n**The shift**: Stay with the contrast just long enough to extract the clarity. Then pivot immediately to the desire it pointed to. Write it. Feel it. Transmit that instead.\n\n**Practice**: List 3 things frustrating you right now. For each one, write: "This is showing me that I want ___."`,
    },
    {
        id: 'gratitude-frequency',
        title: 'Gratitude as a Frequency',
        subtitle: 'The most powerful amplifier',
        emoji: '🌟',
        preview: 'Gratitude doesn\'t just feel good. It changes what you can receive.',
        content: `Gratitude isn't a spiritual nicety — it's a receiving mechanism. When you're genuinely grateful, your nervous system shifts out of scarcity and into abundance. That state makes you magneticically different.\n\nHere's the key insight most people miss: gratitude for things you *haven't received yet* is the advanced practice. This is called **prospective gratitude** — feeling the thankfulness as if it's already arrived.\n\nThis works because your subconscious doesn't distinguish clearly between vivid imagination and reality. When you feel genuinely grateful for something before it arrives, you've already begun living as someone who has received it. That identity shift is what accelerates manifestation.\n\n**Practice**: Each morning, write 3 things you're grateful for *as if they've already happened*, including at least one current active intention. "I am so grateful for the financial clarity I now have. It feels like freedom."`,
    },
    {
        id: 'detachment',
        title: 'Detachment Is Not Abandonment',
        subtitle: 'Surrendering the how',
        emoji: '🌊',
        preview: 'You hold the vision tightly. You hold the timeline and method loosely. These are not the same thing.',
        content: `The instruction to "detach" confuses people because it sounds like giving up. It isn't. Detachment has a very specific meaning: releasing your grip on *how* and *when*, while keeping full clarity on *what* and *who*.\n\nThe universe has access to pathways you can't currently see. When you fix on one rigid path to your intention, you block those alternate routes. Every time you catch yourself thinking "it has to happen this specific way by this exact date or it's not working" — you've just narrowed the field of possibilities from infinite to one.\n\n**The analogy**: You book a flight to Paris. You trust that the pilots know how to get there. You don't stand at the cockpit door demanding to see the flight plan every 20 minutes. You hold the destination (Paris) firmly. You release the route (trusting the professionals who do this daily).\n\nThe universe is the pilot. Your job is the destination.\n\n**Practice**: Find where you're gripping the *how*. Write it down. Then write: "I release the path. I trust that what's mine will find me."`,
    },
    {
        id: 'signs-synchronicities',
        title: 'Reading the Signs',
        subtitle: 'How to recognize alignment',
        emoji: '✦',
        preview: 'Synchronicities are the universe\'s way of confirming your signal is landing.',
        content: `A synchronicity isn't a coincidence. It's a confirmation. When you set a clear intention and then start noticing recurring numbers, unexpected conversations, books falling open to the right page, songs playing at the right moment — these are responses.\n\nThe mistake is to treat synchronicities as proof that manifestation works. That's putting them in the wrong position. They're not proof — they're dialogue. The universe is in a conversation with you, and signs are how it responds when you've broadcast a clear signal.\n\n**How to work with signs**:\n1. Notice them without attaching fate to them\n2. Acknowledge them with gratitude\n3. Ask what they're pointing toward\n4. Take action in that direction\n\nThe Angel Number log in this app is a practical tool for this — tracking your sightings over time reveals patterns, and patterns become guidance.\n\n**The test**: If you're noticing nothing, ask yourself: "How clear and consistent is my signal?" Signs follow strong signals. Noise attracts silence.`,
    },
    {
        id: 'identity-shift',
        title: 'The Quantum Shift',
        subtitle: 'Be it before you see it',
        emoji: '⚡',
        preview: 'The fastest path to any outcome is to become — at the identity level — the person who already has it.',
        content: `Everything you currently have in your life is a perfect match to who you currently believe yourself to be. Every income level, every relationship dynamic, every opportunity — these are outputs of an identity.\n\nThis means: if you want different outputs, you need a different identity. *Not a different strategy. A different self-concept.*\n\nQuantum physics has a principle: the observer affects the observed. Who you believe yourself to be affects what you observe as possible. A person who believes they are "someone who struggles financially" will filter every financial opportunity through that lens — and often not even see the ones that would shift things.\n\n**The shift**: Stop asking "How do I get X?" Start asking "Who am I when X is already true?" Then live as that person — in decisions, in language, in how you spend your time — before the physical evidence arrives.\n\n**Practice**: Write: "I am the kind of person who ___." Fill that in not with what you want to have, but who you want to be. Meditate on that identity for 5 minutes today.`,
    },
    {
        id: 'moon-as-os',
        title: 'The Moon as an Operating System',
        subtitle: 'Using 8 phases as a manifestation calendar',
        emoji: '🌙',
        preview: 'The most powerful practitioners don\'t manifest randomly. They use the lunar calendar as their rhythm.',
        content: `The moon completes a full cycle every 29.5 days. Each phase has a distinct energetic quality, and skilled manifestors use these phases as a structured operating system rather than working against the current.\n\nThe framework:\n- **New Moon**: Plant new intentions. Maximum receptivity. Write what you're calling in.\n- **Waxing Crescent**: Take the first action. The energy is building.\n- **First Quarter**: Push through the obstacle. Resistance now means you're real.\n- **Waxing Gibbous**: Amplify and affirm. Feel it as already done.\n- **Full Moon**: Release. Celebrate what's coming. Let go of what blocks it.\n- **Waning phases**: Integrate, reflect, rest. Download the lessons.\n\nWhen you align your intention-setting to the New Moon and your releasing to the Full Moon, you stop fighting the current and start swimming with it.\n\nThe Moon tab in this app gives you live lunar data and the ritual practice for each phase. Your job: show up consistently.`,
    },
];

// ── ANGEL NUMBERS DATA ─────────────────────────────────────────────────────

const ANGEL_NUMBERS: Record<string, { title: string; message: string; action: string }> = {
    '000': { title: 'Infinite Potential', message: 'You\'re at a reset point. The field is completely open. Whatever you choose to create from here carries enormous momentum.', action: 'Ask: what do I most deeply want to create in this clean-slate moment?' },
    '111': { title: 'Instant Manifestation', message: 'Your thoughts are creating rapidly right now. Stay focused on what you want, not what you fear. What you hold in mind is becoming reality faster than usual.', action: 'Check your dominant thoughts right now — are they what you want?' },
    '222': { title: 'Trust the Process', message: 'What you\'re working toward is taking form beneath the surface. The foundation is being laid. Trust that what\'s yours is in motion even when you can\'t see it.', action: 'Release the urge to force or rush. Let it arrive.' },
    '333': { title: 'Full Alignment', message: 'You\'re in complete alignment — mind, body, spirit. Your guides are amplifying your signal. Keep going exactly as you are.', action: 'Acknowledge this moment. You\'re exactly where you\'re supposed to be.' },
    '444': { title: 'Total Support', message: 'You are surrounded by support — seen and unseen. The universe is actively building the structure beneath your intention. You are not alone in this.', action: 'Breathe and receive the support that\'s already around you.' },
    '555': { title: 'Massive Change', message: 'Transformation is incoming. Don\'t resist it — align with it. The change coming is a response to your intentions. It may feel disruptive before it feels liberating.', action: 'What would you do if you weren\'t afraid of this change?' },
    '666': { title: 'Return to Earth', message: 'Bring your spiritual practice back into grounded, practical action. Beautiful intentions need real-world steps. Balance the visionary with the builder.', action: 'What\'s the most practical thing you can do today toward your intention?' },
    '777': { title: 'Perfect Alignment', message: 'This is the highest manifestation number. You are in perfect resonance with what you\'re calling in. Receive this openly.', action: 'Sit with gratitude. You\'re in the flow.' },
    '888': { title: 'Financial Abundance', message: 'Material abundance — especially financial — is flowing toward you. Don\'t block it with unworthiness. Open your hand and receive.', action: 'What money story do you need to release to receive fully?' },
    '999': { title: 'Completion', message: 'A chapter is ending. Prepare for the new cycle beginning. Release without grief — what is completing made space for what\'s coming.', action: 'What are you being asked to let go of?' },
    '1111': { title: 'Manifestation Portal', message: 'You\'ve passed through a portal. Your manifestation power is at peak. A thought becomes a seed right now. Plant consciously.', action: 'Make a wish. Write it as a declaration. Now.' },
    '1212': { title: 'Step Through the Door', message: 'An opportunity is directly in front of you. This number appears when the universe is saying: the door is open, will you walk through it?', action: 'What opportunity have you been hesitating on?' },
};

const ANGEL_LOG_KEY = 'arcana_angel_log';

interface AngelSighting {
    id: string;
    number: string;
    timestamp: string;
    note?: string;
}

function getAngelLog(): AngelSighting[] {
    try { return JSON.parse(safeStorage.getItem(ANGEL_LOG_KEY) || '[]'); } catch { return []; }
}
function saveAngelLog(log: AngelSighting[]) {
    safeStorage.setItem(ANGEL_LOG_KEY, JSON.stringify(log));
}

// ── SOUND LIBRARY DATA ─────────────────────────────────────────────────────

const SOUND_CATEGORIES = [
    { id: 'sleep', label: '🌙 Sleep', query: 'sleep manifestation meditation deep calm' },
    { id: 'focus', label: '🧠 Focus', query: 'focus flow binaural beats study' },
    { id: 'healing', label: '✨ Healing', query: '528hz healing solfeggio transformation' },
    { id: 'release', label: '🌿 Release', query: 'limiting belief release subliminal affirmations' },
    { id: 'teachings', label: '📖 Teachings', query: 'neville goddard manifestation law assumption lectures' },
    { id: 'ritual', label: '🔮 Ritual', query: 'manifestation ritual moon ceremony guided meditation' },
    { id: '528hz', label: '528Hz', query: '528hz solfeggio miracle tone frequency' },
    { id: 'binaural', label: 'Binaural', query: 'binaural beats theta alpha deep meditation' },
    { id: 'arcana', label: '🌙 Arcana ✦', query: null },
];

function getMoonPhaseKey(): string {
    const synodic = 29.53058868;
    const knownNew = new Date('2024-01-11T11:57:00Z').getTime();
    const elapsed = (Date.now() - knownNew) / 86400000;
    const keys = ['new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent'];
    return keys[Math.floor(((elapsed % synodic) / synodic) * 8) % 8];
}

const COSMIC_RECS: Record<string, { title: string; reason: string; query: string }> = {
    'new': { title: 'Plant Your Seeds 🌑', reason: 'Intention is highest right now. Use this silence to declare what you\'re calling in.', query: 'new moon intention setting guided meditation' },
    'waxing-crescent': { title: 'Build Momentum 🌒', reason: 'Energy is rising. Activate with frequencies that match forward motion.', query: '432hz motivation law of attraction activation' },
    'first-quarter': { title: 'Clear the Resistance 🌓', reason: 'The half-point brings challenges. Use sound to dissolve what\'s blocking you.', query: 'limiting belief release subliminal theta waves' },
    'waxing-gibbous': { title: 'Amplify Your Signal 🌔', reason: 'You\'re 80% through the cycle. Amplify and feel it as already done.', query: '528hz amplify manifestation affirmations' },
    'full': { title: 'Release & Receive 🌕', reason: 'Maximum illumination. Release what blocks. Receive what\'s coming.', query: 'full moon release meditation sound bath' },
    'waning-gibbous': { title: 'Integrate the Teaching 🌖', reason: 'The peak has passed. Let the lesson download while you rest.', query: 'delta waves integration deep healing sleep' },
    'last-quarter': { title: 'Let Go 🌗', reason: 'Release what didn\'t serve this cycle. Clear space for what\'s next.', query: 'let go forgiveness frequency healing meditation' },
    'waning-crescent': { title: 'Sacred Rest 🌘', reason: 'The cycle completes. Rest, reflect, and prepare to begin again.', query: 'yoga nidra deep rest restoration sleep meditation' },
};

const SOUND_FAV_KEY = 'arcana_sound_favorites';
const SOUND_HIST_KEY = 'arcana_sound_history';

type SoundItem = { label: string; query: string; timestamp?: string };
function getSoundFavs(): SoundItem[] { try { return JSON.parse(safeStorage.getItem(SOUND_FAV_KEY) || '[]'); } catch { return []; } }
function getSoundHist(): SoundItem[] { try { return JSON.parse(safeStorage.getItem(SOUND_HIST_KEY) || '[]'); } catch { return []; } }
function saveSoundFavs(f: SoundItem[]) { safeStorage.setItem(SOUND_FAV_KEY, JSON.stringify(f)); }
function saveSoundHist(h: SoundItem[]) { safeStorage.setItem(SOUND_HIST_KEY, JSON.stringify(h)); }

interface YTItem {
    id: { videoId: string };
    snippet: {
        title: string;
        channelTitle: string;
        thumbnails: { medium: { url: string }; default: { url: string } };
    };
}

// ───────────────────────────────────────────────────────────────────────────────

interface SchoolTabProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
}

export function SchoolTab({ onClose, onTabChange, subscription, onShowPremium }: SchoolTabProps) {
    const [activeSubTab, setActiveSubTab] = React.useState<'teachings' | 'numbers' | 'sounds'>('teachings');
    const [expandedTeaching, setExpandedTeaching] = React.useState<string | null>(null);

    // Angel Numbers state
    const [angelLog, setAngelLog] = React.useState<AngelSighting[]>([]);
    const [showAngelPicker, setShowAngelPicker] = React.useState(false);
    const [selectedAngel, setSelectedAngel] = React.useState<string | null>(null);
    const [angelNote, setAngelNote] = React.useState('');

    // Sound Library state
    const moonPhase = React.useMemo(() => getMoonPhaseKey(), []);
    const cosmicRec = COSMIC_RECS[moonPhase];
    const [soundFavorites, setSoundFavorites] = React.useState<SoundItem[]>(getSoundFavs);
    const [soundHistory, setSoundHistory] = React.useState<SoundItem[]>(getSoundHist);
    const [sleepTimerMins, setSleepTimerMins] = React.useState<number | null>(null);
    const [sleepTimerSecs, setSleepTimerSecs] = React.useState<number>(0);
    const sleepTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const [showArcanaSheet, setShowArcanaSheet] = React.useState(false);
    const [showTimerPicker, setShowTimerPicker] = React.useState(false);
    const [timerExpired, setTimerExpired] = React.useState(false);
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    const [nightMode, setNightMode] = React.useState(false);
    const [soundSearch, setSoundSearch] = React.useState('');
    // In-app video player state
    const [videoModal, setVideoModal] = React.useState<{ videoId: string; title: string } | null>(null);
    const [searchModal, setSearchModal] = React.useState<{ results: YTItem[]; title: string } | null>(null);
    const [isSearching, setIsSearching] = React.useState(false);

    React.useEffect(() => {
        setAngelLog(getAngelLog());
        const onLine = () => setIsOnline(true);
        const offLine = () => setIsOnline(false);
        window.addEventListener('online', onLine);
        window.addEventListener('offline', offLine);
        return () => {
            if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
            window.removeEventListener('online', onLine);
            window.removeEventListener('offline', offLine);
        };
    }, []);

    const logAngel = (number: string, note?: string) => {
        const sighting: AngelSighting = {
            id: `angel_${Date.now()}`,
            number,
            timestamp: new Date().toISOString(),
            note,
        };
        const updated = [sighting, ...getAngelLog()].slice(0, 50);
        saveAngelLog(updated);
        setAngelLog(updated);
    };

    const openYouTube = async (query: string, label: string) => {
        if (!isOnline) return;
        const updated = [{ label, query, timestamp: new Date().toISOString() }, ...soundHistory].slice(0, 5);
        setSoundHistory(updated); saveSoundHist(updated);
        if (/sleep|rest/i.test(label)) setNightMode(true);
        const apiKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY;
        if (apiKey) {
            setIsSearching(true);
            try {
                const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=8&key=${apiKey}`);
                const data = await res.json();
                const items: YTItem[] = (data.items || []).filter((it: any) => it.id?.videoId);
                if (items.length > 0) { setSearchModal({ results: items, title: label }); setIsSearching(false); return; }
            } catch { /* fall through */ }
            setIsSearching(false);
        }
        // Fallback — open in browser
        const url = `https://m.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        try { const m = await (Function('return import("@capacitor/browser")')() as Promise<any>); await m.Browser.open({ url }); }
        catch { window.open(url, '_blank'); }
    };

    const openVideo = (videoId: string, title: string) => {
        setVideoModal({ videoId, title });
        setSearchModal(null);
        // Save video to history (storing videoId as query for direct re-play)
        const updated = [{ label: title, query: videoId, timestamp: new Date().toISOString() }, ...soundHistory.filter(h => h.query !== videoId)].slice(0, 5);
        setSoundHistory(updated); saveSoundHist(updated);
    };

    // Smart play: if query looks like a YouTube video ID (11 alphanumeric chars), open directly; else search
    const playItem = (item: SoundItem) => {
        if (item.query && /^[a-zA-Z0-9_-]{11}$/.test(item.query)) {
            openVideo(item.query, item.label);
        } else if (item.query) {
            openYouTube(item.query, item.label);
        }
    };

    const toggleFave = (item: SoundItem) => {
        const has = soundFavorites.some(f => f.query === item.query);
        const updated = has ? soundFavorites.filter(f => f.query !== item.query)
            : [{ label: item.label, query: item.query }, ...soundFavorites].slice(0, 20);
        setSoundFavorites(updated); saveSoundFavs(updated);
    };

    const startTimer = (mins: number) => {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
        setSleepTimerMins(mins); setSleepTimerSecs(mins * 60);
        setTimerExpired(false); setShowTimerPicker(false);
        sleepTimerRef.current = setInterval(() =>
            setSleepTimerSecs(prev => {
                if (prev <= 1) { clearInterval(sleepTimerRef.current!); setSleepTimerMins(null); setTimerExpired(true); setNightMode(false); return 0; }
                return prev - 1;
            }), 1000);
    };

    const cancelTimer = () => {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
        setSleepTimerMins(null); setSleepTimerSecs(0); setTimerExpired(false); setNightMode(false);
    };

    const fmtTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const SubTab = ({ id, label }: { id: 'teachings' | 'numbers' | 'sounds'; label: string }) => (
        <button
            onClick={() => setActiveSubTab(id)}
            className="flex-1 py-2 rounded-2xl text-[10px] font-display tracking-wider transition-all"
            style={{
                background: activeSubTab === id ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: activeSubTab === id ? '#d4af37' : 'rgba(255,255,255,0.35)',
                border: activeSubTab === id ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
            }}
        >
            {label}
        </button>
    );

    return (
        <>
            <div className="page-frame">
                <div className="page-scroll bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text">
                    <PageHeader title="SCHOOL" onClose={onClose} titleSize="lg" />
                    <div className="max-w-[500px] mx-auto px-4">

                        {/* Hero */}
                        <div className="text-center mt-4 mb-5 animate-fade-up">
                            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(13,6,24,0.9) 100%)',
                                    border: '1px solid rgba(99,102,241,0.25)',
                                    boxShadow: '0 0 30px rgba(99,102,241,0.1)',
                                }}>
                                📖
                            </div>
                            <h2 className="font-display text-lg text-altar-gold tracking-[3px]">Manifestation School</h2>
                            <p className="text-[10px] text-altar-muted mt-1">
                                Grow into someone who can hold what you're calling in.
                            </p>
                        </div>

                        {/* Sub-tab bar */}
                        <div className="flex gap-1.5 p-1 rounded-2xl mb-5 animate-fade-up"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '0.1s', opacity: 0 }}>
                            <SubTab id="teachings" label="📖 Teachings" />
                            <SubTab id="sounds" label="🔊 Sounds" />
                        </div>

                        {/* ── TEACHINGS ── */}
                        {activeSubTab === 'teachings' && (
                            <div className="space-y-3 animate-fade-up" style={{ opacity: 0 }}>
                                <p className="text-[10px] text-altar-muted/60 text-center italic mb-4">
                                    Eight principles that shift how you create.
                                </p>
                                {TEACHINGS.map((t, i) => (
                                    <div key={t.id}
                                        className="rounded-3xl overflow-hidden cursor-pointer transition-all"
                                        style={{
                                            background: expandedTeaching === t.id
                                                ? 'linear-gradient(145deg, rgba(99,102,241,0.1) 0%, rgba(13,6,24,0.98) 100%)'
                                                : 'rgba(255,255,255,0.03)',
                                            border: expandedTeaching === t.id
                                                ? '1px solid rgba(99,102,241,0.25)'
                                                : '1px solid rgba(255,255,255,0.06)',
                                        }}
                                        onClick={() => setExpandedTeaching(expandedTeaching === t.id ? null : t.id)}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl shrink-0 mt-0.5">{t.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase">{t.subtitle}</p>
                                                        <span className="text-altar-muted text-sm shrink-0">{expandedTeaching === t.id ? '▾' : '▸'}</span>
                                                    </div>
                                                    <p className="text-sm text-altar-text font-display mt-0.5">{t.title}</p>
                                                    {expandedTeaching !== t.id && (
                                                        <p className="text-[10px] text-altar-muted/70 mt-1 leading-snug italic">{t.preview}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {expandedTeaching === t.id && (
                                                <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                                                    {t.content.split('\n\n').map((para, pi) => (
                                                        <p key={pi} className="text-xs text-altar-text/80 leading-relaxed"
                                                            dangerouslySetInnerHTML={{
                                                                __html: para
                                                                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:rgba(212,175,55,0.9)">$1</strong>')
                                                                    .replace(/^- /, '• ')
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div className="h-4" />
                            </div>
                        )}

                        {/* ── ANGEL NUMBERS ── */}
                        {activeSubTab === 'numbers' && (
                            <div className="animate-fade-up space-y-4" style={{ opacity: 0 }}>
                                <p className="text-[10px] text-altar-muted/60 text-center italic">
                                    Log a sighting to receive its message.
                                </p>

                                {/* Log button */}
                                <button
                                    onClick={() => setShowAngelPicker(true)}
                                    className="w-full py-4 rounded-3xl font-display tracking-[2px] text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.06) 100%)',
                                        border: '1px dashed rgba(99,102,241,0.35)',
                                        color: '#a5b4fc',
                                    }}>
                                    + I just saw a number
                                </button>

                                {/* Quick number grid — most common */}
                                <div>
                                    <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">Quick Log</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['111', '222', '333', '444', '555', '666', '777', '888', '999', '000', '1111', '1212'].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => { setSelectedAngel(n); setShowAngelPicker(false); }}
                                                className="py-3 rounded-2xl text-xs font-display tracking-wide transition-all hover:scale-105 active:scale-95"
                                                style={{
                                                    background: 'rgba(99,102,241,0.08)',
                                                    border: '1px solid rgba(99,102,241,0.15)',
                                                    color: '#c4b5fd',
                                                }}>
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Selected angel number — show meaning */}
                                {selectedAngel && ANGEL_NUMBERS[selectedAngel] && (
                                    <div className="rounded-3xl p-5 animate-fade-up"
                                        style={{
                                            background: 'linear-gradient(145deg, rgba(99,102,241,0.12) 0%, rgba(13,6,24,0.97) 100%)',
                                            border: '1px solid rgba(99,102,241,0.25)',
                                        }}>
                                        <div className="text-center mb-4">
                                            <p className="font-display text-2xl text-altar-gold mb-1">{selectedAngel}</p>
                                            <p className="text-[9px] text-indigo-400/60 font-display tracking-[3px] uppercase">{ANGEL_NUMBERS[selectedAngel].title}</p>
                                        </div>
                                        <p className="text-sm text-altar-text/85 leading-relaxed mb-3">{ANGEL_NUMBERS[selectedAngel].message}</p>
                                        <div className="rounded-2xl p-3"
                                            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}>
                                            <p className="text-[9px] text-altar-gold/60 font-display tracking-[2px] uppercase mb-1">Invitation</p>
                                            <p className="text-[10px] text-altar-gold/80 italic">{ANGEL_NUMBERS[selectedAngel].action}</p>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <input
                                                value={angelNote}
                                                onChange={e => setAngelNote(e.target.value)}
                                                placeholder="Add a note (optional)..."
                                                className="flex-1 rounded-xl px-3 py-2 text-xs text-altar-text bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/40"
                                            />
                                            <button
                                                onClick={() => {
                                                    logAngel(selectedAngel, angelNote || undefined);
                                                    setSelectedAngel(null);
                                                    setAngelNote('');
                                                }}
                                                className="px-4 py-2 rounded-xl text-xs font-display text-indigo-300 border border-indigo-500/25"
                                                style={{ background: 'rgba(99,102,241,0.12)' }}>
                                                Log ✓
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Log history */}
                                {angelLog.length > 0 && (
                                    <div>
                                        <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">Recent Sightings</p>
                                        <div className="space-y-2">
                                            {angelLog.slice(0, 10).map(s => (
                                                <div key={s.id} className="rounded-2xl p-3 flex items-center gap-3"
                                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <span className="font-display text-indigo-300 text-sm w-12 text-center">{s.number}</span>
                                                    <div className="flex-1">
                                                        <p className="text-[9px] text-altar-muted">{ANGEL_NUMBERS[s.number]?.title || 'Angel Number'}</p>
                                                        {s.note && <p className="text-[10px] text-altar-text/60 italic mt-0.5">"{s.note}"</p>}
                                                    </div>
                                                    <p className="text-[9px] text-altar-muted/50 shrink-0">
                                                        {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="h-4" />
                            </div>
                        )}

                        {/* ── SOUNDS ── */}
                        {activeSubTab === 'sounds' && (
                            <div className="animate-fade-up space-y-4" style={{ opacity: 0 }}>

                                {/* Offline banner */}
                                {!isOnline && (
                                    <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <span>🔌</span>
                                        <p className="text-xs text-red-300/80">Connect to the internet to access sounds</p>
                                    </div>
                                )}

                                {/* Timer expired alert */}
                                {timerExpired && (
                                    <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                                        <p className="font-display text-altar-gold text-sm mb-1">Your practice is complete ✶</p>
                                        <p className="text-[10px] text-altar-muted">Take a few breaths before returning to the day.</p>
                                        <button onClick={() => setTimerExpired(false)} className="mt-2 text-[10px] text-altar-muted/50">dismiss</button>
                                    </div>
                                )}

                                {/* Active sleep timer bar */}
                                {sleepTimerMins !== null && (
                                    <div className="rounded-2xl p-3 flex items-center justify-between" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">⏱</span>
                                            <p className="text-xs text-indigo-300 font-display">{fmtTimer(sleepTimerSecs)}</p>
                                            <p className="text-[10px] text-altar-muted/60">remaining</p>
                                        </div>
                                        <button onClick={cancelTimer} className="text-[10px] text-altar-muted/50 hover:text-altar-muted">cancel</button>
                                    </div>
                                )}

                                {/* Cosmic Recommendation */}
                                <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(212,175,55,0.08) 0%, rgba(13,6,24,0.97) 100%)', border: '1px solid rgba(212,175,55,0.2)' }}>
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-altar-gold animate-pulse" />
                                            <p className="text-[9px] font-display tracking-[3px] uppercase" style={{ color: 'rgba(212,175,55,0.6)' }}>Cosmic Recommendation</p>
                                        </div>
                                        <p className="font-display text-sm text-altar-text mb-1">{cosmicRec.title}</p>
                                        <p className="text-[10px] text-altar-muted/70 italic leading-snug mb-4">{cosmicRec.reason}</p>
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={() => isOnline ? openYouTube(cosmicRec.query, cosmicRec.title) : undefined}
                                                disabled={!isOnline}
                                                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-display tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
                                                style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.08) 100%)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>
                                                ▶ Open in YouTube
                                            </button>
                                            <button
                                                onClick={() => setShowTimerPicker(prev => !prev)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-display tracking-wide transition-all"
                                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                                                ⏱ {sleepTimerMins ? fmtTimer(sleepTimerSecs) : 'Timer'}
                                            </button>
                                        </div>
                                        {showTimerPicker && (
                                            <div className="mt-3 flex gap-2 flex-wrap">
                                                <p className="text-[9px] text-altar-muted w-full">Stop after:</p>
                                                {[5, 10, 20, 30, 60].map(m => (
                                                    <button key={m} onClick={() => startTimer(m)}
                                                        className="px-3 py-1.5 rounded-xl text-[11px] font-display transition-all hover:scale-105"
                                                        style={{ background: sleepTimerMins === m ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: sleepTimerMins === m ? '#a5b4fc' : 'rgba(165,180,252,0.6)' }}>
                                                        {m}m
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Category chips */}
                                <div>
                                    <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">Browse by Intention</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                                        {SOUND_CATEGORIES.map(cat => (
                                            <button key={cat.id}
                                                onClick={() => {
                                                    if (cat.id === 'arcana') { setShowArcanaSheet(true); return; }
                                                    if (cat.query) openYouTube(cat.query, cat.label);
                                                }}
                                                className="shrink-0 px-3.5 py-2 rounded-2xl text-[11px] font-display tracking-wide transition-all hover:scale-105 active:scale-95"
                                                style={{
                                                    background: cat.id === 'arcana' ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(99,102,241,0.08) 100%)' : 'rgba(255,255,255,0.05)',
                                                    border: cat.id === 'arcana' ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.09)',
                                                    color: cat.id === 'arcana' ? '#d4af37' : 'rgba(255,255,255,0.7)',
                                                    opacity: !isOnline && cat.id !== 'arcana' ? 0.4 : 1,
                                                }}>
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Search bar */}
                                <form onSubmit={e => { e.preventDefault(); if (soundSearch.trim() && isOnline) openYouTube(soundSearch.trim(), `"${soundSearch.trim()}"`); }}>
                                    <div className="flex gap-2">
                                        <input
                                            value={soundSearch}
                                            onChange={e => setSoundSearch(e.target.value)}
                                            placeholder="Search meditations, frequencies..."
                                            disabled={!isOnline}
                                            className="flex-1 rounded-2xl px-4 py-2.5 text-xs text-altar-text bg-white/5 border border-white/10 focus:outline-none focus:border-altar-gold/30 placeholder-altar-muted/40"
                                        />
                                        <button type="submit" disabled={!soundSearch.trim() || !isOnline}
                                            className="px-4 py-2.5 rounded-2xl text-xs font-display transition-all disabled:opacity-30"
                                            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37' }}>
                                            Go
                                        </button>
                                    </div>
                                </form>

                                {/* Favorites */}
                                {soundFavorites.length > 0 && (
                                    <div>
                                        <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">★ Favorites</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                                            {soundFavorites.map((fav, i) => (
                                                <div key={i} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl"
                                                    style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                                                    <button onClick={() => playItem(fav)}
                                                        className="text-[11px] text-altar-gold/80 font-display max-w-[100px] truncate">{fav.label}</button>
                                                    <button onClick={() => toggleFave(fav)} className="text-[9px] text-altar-muted/30 hover:text-altar-muted/60 shrink-0">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recently Played */}
                                {soundHistory.length > 0 && (
                                    <div>
                                        <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">🕐 Recently Played</p>
                                        <div className="space-y-2">
                                            {soundHistory.map((item, i) => (
                                                <div key={i} onClick={() => playItem(item)}
                                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <span className="text-xs text-altar-text/80 font-display truncate max-w-[200px]">{item.label}</span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[9px] text-altar-muted/50">
                                                            {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                                        </span>
                                                        <button onClick={e => { e.stopPropagation(); toggleFave(item); }}
                                                            className="text-[14px] transition-colors"
                                                            style={{ color: soundFavorites.some(f => f.query === item.query) ? '#d4af37' : 'rgba(255,255,255,0.2)' }}>
                                                            ★
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="h-6" />
                            </div>
                        )}
                    </div>
                </div>
                <BottomNav currentTab="school" onTabChange={onTabChange} />
            </div>

            {/* Night mode overlay */}
            {nightMode && !videoModal && (
                <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'rgba(0,0,0,0.65)' }} />
            )}

            {/* Arcana channel — coming soon sheet */}
            {showArcanaSheet && (
                <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowArcanaSheet(false)}>
                    <div className="w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}
                        style={{ background: 'linear-gradient(180deg, rgba(13,6,24,0.99) 0%, #0d0618 100%)', border: '1px solid rgba(212,175,55,0.2)', borderBottom: 'none' }}>
                        <div className="w-12 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />
                        <div className="text-center">
                            <p className="font-display text-altar-gold text-lg tracking-[3px] mb-2">🌙 Arcana ✦</p>
                            <p className="text-xs text-altar-text/80 leading-relaxed mb-4">
                                The Arcana Whisper channel is coming — original guided rituals, moon cycle meditations,
                                and cosmic activations voiced for you.
                            </p>
                            <p className="text-[10px] text-altar-muted/60 italic mb-5">
                                Every sound will be aligned to the app’s transit data and built for your specific practice.
                            </p>
                            <button onClick={() => setShowArcanaSheet(false)}
                                className="px-6 py-2.5 rounded-2xl text-xs font-display tracking-wider"
                                style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37' }}>
                                I’ll be here ✶
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Searching indicator */}
            {isSearching && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(13,6,24,0.85)' }}>
                    <div className="text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-altar-gold/30 border-t-altar-gold mx-auto mb-3 animate-spin" />
                        <p className="text-xs font-display text-altar-muted tracking-[2px]">Finding sounds…</p>
                    </div>
                </div>
            )}

            {/* YouTube Search Results Modal */}
            {searchModal && (
                <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#0d0618' }}>
                    <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
                        <p className="font-display text-altar-gold tracking-[2px] text-sm">{searchModal.title}</p>
                        <button onClick={() => { setSearchModal(null); setNightMode(false); }} className="text-white/50 text-2xl leading-none">&#x2715;</button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {searchModal.results.map(item => (
                            <button key={item.id.videoId}
                                onClick={() => openVideo(item.id.videoId, item.snippet.title)}
                                className="w-full flex gap-3 p-3 border-b border-white/5 text-left transition-colors active:bg-white/5">
                                <img src={item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url} alt=""
                                    className="w-24 h-16 rounded-xl object-cover shrink-0 bg-white/5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-altar-text leading-snug line-clamp-2">{item.snippet.title}</p>
                                    <p className="text-[10px] text-altar-muted mt-1">{item.snippet.channelTitle}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* In-App YouTube Video Player */}
            {videoModal && (
                <div className="fixed inset-0 z-[70] flex flex-col bg-black">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: 'rgba(13,6,24,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="font-display text-altar-gold text-xs truncate flex-1">{videoModal.title}</p>
                        <button
                            onClick={() => toggleFave({ label: videoModal.title, query: videoModal.videoId })}
                            className="text-lg shrink-0 transition-colors"
                            style={{ color: soundFavorites.some(f => f.query === videoModal.videoId) ? '#d4af37' : 'rgba(255,255,255,0.25)' }}>
                            ★
                        </button>
                        <button onClick={() => setShowTimerPicker(prev => !prev)}
                            className="shrink-0 text-[11px] px-2.5 py-1 rounded-xl font-display"
                            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: sleepTimerMins ? '#a5b4fc' : 'rgba(165,180,252,0.45)' }}>
                            {sleepTimerMins ? `⏱ ${fmtTimer(sleepTimerSecs)}` : '⏱ Timer'}
                        </button>
                        <button onClick={() => { setVideoModal(null); setNightMode(false); setShowTimerPicker(false); }}
                            className="shrink-0 text-white/50 text-xl leading-none">&#x2715;
                        </button>
                    </div>
                    {/* Timer picker */}
                    {showTimerPicker && (
                        <div className="flex items-center gap-2 px-4 py-2 shrink-0 flex-wrap" style={{ background: 'rgba(13,6,24,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <p className="text-[10px] text-altar-muted">Stop after:</p>
                            {[5, 10, 20, 30, 60].map(m => (
                                <button key={m} onClick={() => startTimer(m)}
                                    className="px-3 py-1.5 rounded-xl text-[11px] font-display"
                                    style={{ background: sleepTimerMins === m ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                                    {m}m
                                </button>
                            ))}
                        </div>
                    )}
                    {/* YouTube iframe */}
                    <div className="flex-1 bg-black">
                        <iframe
                            key={videoModal.videoId}
                            src={`https://www.youtube.com/embed/${videoModal.videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
                            className="w-full h-full"
                            allow="autoplay; accelerometer; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                            style={{ border: 'none' }}
                        />
                    </div>
                    {/* Timer remaining */}
                    {sleepTimerMins !== null && (
                        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: 'rgba(13,6,24,0.9)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <p className="text-xs text-indigo-300 font-display">⏱ {fmtTimer(sleepTimerSecs)} remaining</p>
                            <button onClick={cancelTimer} className="text-[10px] text-altar-muted/50">cancel</button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
