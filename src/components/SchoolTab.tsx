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
import { TeachingsSection } from './TeachingsSection';
import { MASTERS } from '../services/teachings.service';

// ── TEACHINGS DATA — moved to teachings.service.ts ──

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

function getMoonPhaseKey(): string {
    const synodic = 29.53058868;
    const knownNew = new Date('2024-01-11T11:57:00Z').getTime();
    const elapsed = (Date.now() - knownNew) / 86400000;
    const keys = ['new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent'];
    return keys[Math.floor(((elapsed % synodic) / synodic) * 8) % 8];
}

const COSMIC_RECS: Record<string, { title: string; reason: string; query: string; freq: string }> = {
    'new': { title: 'Plant Your Seeds 🌑', reason: 'Intention is highest right now. Use this silence to declare what you\'re calling in.', query: 'new moon intention setting guided meditation', freq: '528 Hz · Miracles' },
    'waxing-crescent': { title: 'Build Momentum 🌒', reason: 'Energy is rising. Activate with frequencies that match forward motion.', query: '432hz motivation law of attraction activation', freq: '432 Hz · Harmony' },
    'first-quarter': { title: 'Clear the Resistance 🌓', reason: 'The half-point brings challenges. Use sound to dissolve what\'s blocking you.', query: 'limiting belief release subliminal theta waves', freq: '417 Hz · Change' },
    'waxing-gibbous': { title: 'Amplify Your Signal 🌔', reason: 'You\'re 80% through the cycle. Amplify and feel it as already done.', query: '528hz amplify manifestation affirmations', freq: '528 Hz · Miracles' },
    'full': { title: 'Release & Receive 🌕', reason: 'Maximum illumination. Release what blocks. Receive what\'s coming.', query: 'full moon release meditation sound bath', freq: '396 Hz · Liberation' },
    'waning-gibbous': { title: 'Integrate the Teaching 🌖', reason: 'The peak has passed. Let the lesson download while you rest.', query: 'delta waves integration deep healing sleep', freq: '852 Hz · Intuition' },
    'last-quarter': { title: 'Let Go 🌗', reason: 'Release what didn\'t serve this cycle. Clear space for what\'s next.', query: 'let go forgiveness frequency healing meditation', freq: '396 Hz · Liberation' },
    'waning-crescent': { title: 'Sacred Rest 🌘', reason: 'The cycle completes. Rest, reflect, and prepare to begin again.', query: 'yoga nidra deep rest restoration sleep meditation', freq: '174 Hz · Foundation' },
};

// ── AMBIENT SOUNDSCAPES DATA ────────────────────────────────────────────────

const AMBIENT_SOUNDSCAPES = [
    { id: 'rain', emoji: '🌧️', image: '/rain-thunder.png', title: 'Rain & Thunder', query: 'rain thunder ambient sleep loop', gradient: 'linear-gradient(135deg, #1a2a4a, #0d1a2d)' },
    { id: 'forest', emoji: '🌲', image: '/forest-night.png', title: 'Forest Night', query: 'forest night nature ambient loop', gradient: 'linear-gradient(135deg, #1a3a2a, #0d2a1a)' },
    { id: 'ocean', emoji: '🌊', image: '/ocean-waves.png', title: 'Ocean Waves', query: 'ocean waves ambient sleep loop', gradient: 'linear-gradient(135deg, #1a2a3a, #0d1a2a)' },
    { id: 'fire', emoji: '🔥', image: '/crackling-fire.png', title: 'Crackling Fire', query: 'crackling fire ambient relaxation loop', gradient: 'linear-gradient(135deg, #3a2a1a, #2a1a0d)' },
    { id: 'space', emoji: '🪐', image: '/deep-space.png', title: 'Deep Space', query: 'deep space ambient meditation loop', gradient: 'linear-gradient(135deg, #1a0d2a, #0d0a1a)' },
];

// ── SOLFEGGIO FREQUENCIES DATA ──────────────────────────────────────────────

const SOLFEGGIO_FREQUENCIES = [
    { hz: 174, name: 'Foundation', desc: 'Pain relief & security', color: '#ef4444', query: '174hz solfeggio pain relief meditation', emoji: '🔴' },
    { hz: 285, name: 'Restoration', desc: 'Tissue healing & energy', color: '#f97316', query: '285hz solfeggio tissue healing energy', emoji: '🟠' },
    { hz: 396, name: 'Liberation', desc: 'Release guilt & fear', color: '#eab308', query: '396hz solfeggio liberation guilt fear release', emoji: '🟡' },
    { hz: 417, name: 'Change', desc: 'Undo situations & facilitate change', color: '#22c55e', query: '417hz solfeggio facilitate change transformation', emoji: '🟢' },
    { hz: 432, name: 'Harmony', desc: 'Universal tuning & calm', color: '#06b6d4', query: '432hz universal harmony natural tuning meditation', emoji: '🩵' },
    { hz: 528, name: 'Miracles', desc: 'Transformation & DNA repair', color: '#8b5cf6', query: '528hz solfeggio miracle tone DNA repair love', emoji: '💜' },
    { hz: 639, name: 'Connection', desc: 'Reconnecting & relationships', color: '#ec4899', query: '639hz solfeggio connection relationships harmony', emoji: '💗' },
    { hz: 741, name: 'Expression', desc: 'Problem solving & clarity', color: '#3b82f6', query: '741hz solfeggio expression problem solving awakening', emoji: '🔵' },
    { hz: 852, name: 'Intuition', desc: 'Spiritual order & awareness', color: '#a855f7', query: '852hz solfeggio intuition spiritual order third eye', emoji: '🟣' },
    { hz: 963, name: 'Divine', desc: 'Pineal activation & oneness', color: '#d4af37', query: '963hz solfeggio crown chakra divine consciousness', emoji: '✦' },
];

// ── MICRO-DOSES DATA ────────────────────────────────────────────────────────

const MICRO_DOSES = [
    { id: 'burst528', name: '528Hz Burst', duration: '30s', desc: 'Quick miracle tone reset', query: '528hz 30 second burst frequency', color: '#8b5cf6' },
    { id: 'ground', name: 'Grounding', duration: '1 min', desc: 'Root chakra stabilize', query: '256hz grounding frequency 1 minute root chakra', color: '#22c55e' },
    { id: 'cordcut', name: 'Cord Cut', duration: '2 min', desc: 'Release attachments', query: '417hz cord cutting frequency 2 minute release', color: '#ef4444' },
    { id: 'anxiety', name: 'Anxiety Dissolve', duration: '90s', desc: 'Nervous system calm', query: '432hz anxiety relief 90 second calm frequency', color: '#06b6d4' },
    { id: 'clarity', name: 'Mental Clarity', duration: '1 min', desc: 'Clear the fog', query: '741hz mental clarity 1 minute focus frequency', color: '#3b82f6' },
    { id: 'heart', name: 'Heart Open', duration: '2 min', desc: 'Expand love frequency', query: '639hz heart opening 2 minute love frequency', color: '#ec4899' },
];

// ── SOUND RX MOODS DATA ─────────────────────────────────────────────────────

const SOUND_RX_MOODS = [
    { id: 'anxious', emoji: '😰', label: 'Anxious', freq: '432 Hz', freqName: 'Universal Harmony', breathwork: '4-7-8 Breathing', duration: '3 min', query: '432hz anxiety relief 4 7 8 breathing calm', reason: 'Aligns your nervous system to Earth\'s natural resonance' },
    { id: 'tired', emoji: '😴', label: 'Tired', freq: '285 Hz', freqName: 'Restoration', breathwork: 'Deep Belly Breaths', duration: '5 min', query: '285hz energy restoration solfeggio recharge', reason: 'Restores depleted energy at the cellular level' },
    { id: 'scattered', emoji: '🌪️', label: 'Scattered', freq: '741 Hz', freqName: 'Expression', breathwork: 'Box Breathing', duration: '2 min', query: '741hz focus mental clarity box breathing', reason: 'Cuts through mental noise and sharpens signal' },
    { id: 'heavy', emoji: '🪨', label: 'Heavy', freq: '396 Hz', freqName: 'Liberation', breathwork: 'Extended Exhale', duration: '4 min', query: '396hz release guilt fear liberation solfeggio', reason: 'Dissolves the weight of guilt, shame, and stuck energy' },
    { id: 'restless', emoji: '⚡', label: 'Restless', freq: '528 Hz', freqName: 'Miracles', breathwork: 'Wim Hof Light', duration: '3 min', query: '528hz transformation miracle tone meditation', reason: 'Channels restless energy into creative transformation' },
    { id: 'disconnected', emoji: '🌫️', label: 'Disconnected', freq: '963 Hz', freqName: 'Divine', breathwork: 'Alternate Nostril', duration: '5 min', query: '963hz crown chakra divine connection meditation', reason: 'Reconnects you to source energy and higher self' },
];

// ── BREATHWORK PATTERNS DATA (Guided Breath Codex) ───────────────────────────────────────

const BREATHWORK_PATTERNS = [
    {
        id: 'box', name: 'Box Breathing', desc: 'Calm focus & reset',
        origin: 'Used by Navy SEALs to stay calm under fire. Four equal sides — like a box — bring your nervous system into perfect symmetry.',
        science: 'Activates the vagus nerve, balances CO\u2082 levels, and synchronizes heart rate variability.',
        lineage: 'Ancient pranayama \u2022 Military performance \u2022 Clinical anxiety therapy',
        difficulty: 'Beginner',
        phases: [
            { label: 'Inhale', seconds: 4, coach: 'Draw energy up from the earth through your roots' },
            { label: 'Hold', seconds: 4, coach: 'Let the energy build — feel it filling every cell' },
            { label: 'Exhale', seconds: 4, coach: 'Release what no longer serves you' },
            { label: 'Hold', seconds: 4, coach: 'Rest in the stillness between breaths' },
        ], rounds: 6, color: '#06b6d4',
    },
    {
        id: '478', name: '4-7-8 Method', desc: 'Deep relaxation & sleep',
        origin: 'Created by Dr. Andrew Weil, based on ancient yogic pranayama. Called "nature\'s tranquilizer" — the extended exhale activates your body\'s rest mode.',
        science: 'The 1:1.75:2 ratio forces parasympathetic dominance, reducing cortisol and blood pressure within 60 seconds.',
        lineage: 'Yogic pranayama \u2022 Dr. Andrew Weil \u2022 Integrative medicine',
        difficulty: 'Intermediate',
        phases: [
            { label: 'Inhale', seconds: 4, coach: 'Breathe in golden light through the crown' },
            { label: 'Hold', seconds: 7, coach: 'Let the light saturate every layer of your being' },
            { label: 'Exhale', seconds: 8, coach: 'Slowly dissolve all tension into the void' },
        ], rounds: 4, color: '#8b5cf6',
    },
    {
        id: 'wim', name: 'Wim Hof Light', desc: 'Energy & activation',
        origin: 'From Wim "The Iceman" Hof, who climbed Everest in shorts. This controlled hyperventilation floods your body with oxygen and awakens dormant energy.',
        science: 'Temporarily alkalizes blood pH, triggers adrenaline release, and boosts immune cell count by up to 300%.',
        lineage: 'Tummo meditation \u2022 Wim Hof Method \u2022 Cold exposure science',
        difficulty: 'Advanced',
        phases: [
            { label: 'Power Inhale', seconds: 2, coach: 'Pull fire into your solar plexus — fill completely' },
            { label: 'Quick Exhale', seconds: 1, coach: 'Release sharply — let the energy crackle' },
        ], rounds: 15, color: '#f97316',
    },
];

// ── FEATURED GUIDES DATA ────────────────────────────────────────────────────

const FEATURED_GUIDES = [
    { name: 'Mystic Ra', emoji: '🧙', image: '/guide-mystic-ra.png', color: 'linear-gradient(135deg, #2d1b4e, #432c7a)' },
    { name: 'Luna Tides', emoji: '🌊', image: '/guide-luna-tides.png', color: 'linear-gradient(135deg, #1a2a4a, #2d4a7a)' },
    { name: 'Earth Song', emoji: '🌿', image: '/guide-earth-song.png', color: 'linear-gradient(135deg, #1a3a1a, #2d5a2d)' },
    { name: 'Sol Wisdom', emoji: '✦', image: '/guide-sol-wisdom.png', color: 'linear-gradient(135deg, #3a2a0d, #5a4a1d)' },
    { name: 'Veda Light', emoji: '🔮', image: '/guide-veda-light.png', color: 'linear-gradient(135deg, #3a1a2a, #5a2d4a)' },
];

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
    const [activeSubTab, setActiveSubTab] = React.useState<'teachings' | 'sounds'>('teachings');
    const [expandedTeaching, setExpandedTeaching] = React.useState<string | null>(null);

    // Solfeggio play counter for soft gate
    const [solfeggioPlays, setSolfeggioPlays] = React.useState(() => {
        try { return parseInt(safeStorage.getItem('arcana_solfeggio_plays') || '0', 10); } catch { return 0; }
    });

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

    // In-app video player state
    const [videoModal, setVideoModal] = React.useState<{ videoId: string; title: string } | null>(null);
    const [searchModal, setSearchModal] = React.useState<{ results: YTItem[]; title: string } | null>(null);
    const [isSearching, setIsSearching] = React.useState(false);
    const [selectedMaster, setSelectedMaster] = React.useState<string | null>(null);

    // ── Sound Rx state ──
    const [selectedMood, setSelectedMood] = React.useState<string | null>(null);

    // ── Breathwork state ──
    const [showBreathwork, setShowBreathwork] = React.useState(false);
    const [breathPattern, setBreathPattern] = React.useState(BREATHWORK_PATTERNS[0]);
    const [breathPhaseIdx, setBreathPhaseIdx] = React.useState(0);
    const [breathSecs, setBreathSecs] = React.useState(BREATHWORK_PATTERNS[0].phases[0].seconds);
    const [breathRound, setBreathRound] = React.useState(1);
    const [breathActive, setBreathActive] = React.useState(false);
    const breathRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const [breathLearnMode, setBreathLearnMode] = React.useState(true); // first round is guided
    const [breathShowInfo, setBreathShowInfo] = React.useState(true); // show pre-session card

    React.useEffect(() => {

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

    // ── Breathwork timer logic (learn mode = 2x slower on round 1) ──
    // Use refs to track current values atomically — avoids nested setState race conditions
    const breathPhaseIdxRef = React.useRef(breathPhaseIdx);
    const breathSecsRef = React.useRef(breathSecs);
    const breathRoundRef = React.useRef(breathRound);
    const breathLearnModeRef = React.useRef(breathLearnMode);

    React.useEffect(() => { breathPhaseIdxRef.current = breathPhaseIdx; }, [breathPhaseIdx]);
    React.useEffect(() => { breathSecsRef.current = breathSecs; }, [breathSecs]);
    React.useEffect(() => { breathRoundRef.current = breathRound; }, [breathRound]);
    React.useEffect(() => { breathLearnModeRef.current = breathLearnMode; }, [breathLearnMode]);

    React.useEffect(() => {
        if (!breathActive) {
            if (breathRef.current) clearInterval(breathRef.current);
            return;
        }
        const getSpeed = () => (breathLearnModeRef.current && breathRoundRef.current === 1) ? 2000 : 1000;

        const tick = () => {
            const currentSecs = breathSecsRef.current;
            const currentPhaseIdx = breathPhaseIdxRef.current;
            const currentRound = breathRoundRef.current;

            if (currentSecs > 1) {
                // Normal countdown — just decrement
                const next = currentSecs - 1;
                breathSecsRef.current = next;
                setBreathSecs(next);
            } else {
                // Phase complete — advance to next phase
                const nextPhaseIdx = currentPhaseIdx + 1;

                if (nextPhaseIdx >= breathPattern.phases.length) {
                    // All phases in this round complete — advance round
                    if (currentRound >= breathPattern.rounds) {
                        // All rounds done
                        setBreathActive(false);
                        if (breathRef.current) clearInterval(breathRef.current);
                        return;
                    }
                    // Next round — reset to phase 0
                    const nextRound = currentRound + 1;
                    const nextSecs = breathPattern.phases[0].seconds;
                    if (currentRound === 1 && breathLearnModeRef.current) {
                        breathLearnModeRef.current = false;
                        setBreathLearnMode(false);
                    }
                    breathRoundRef.current = nextRound;
                    breathPhaseIdxRef.current = 0;
                    breathSecsRef.current = nextSecs;
                    setBreathRound(nextRound);
                    setBreathPhaseIdx(0);
                    setBreathSecs(nextSecs);
                } else {
                    // Move to next phase in same round
                    const nextSecs = breathPattern.phases[nextPhaseIdx].seconds;
                    breathPhaseIdxRef.current = nextPhaseIdx;
                    breathSecsRef.current = nextSecs;
                    setBreathPhaseIdx(nextPhaseIdx);
                    setBreathSecs(nextSecs);
                }
            }
        };

        // Use dynamic speed via setTimeout chain instead of fixed setInterval
        // This allows speed to change between round 1 (learn mode) and later rounds
        let timeoutId: ReturnType<typeof setTimeout>;
        const schedule = () => {
            timeoutId = setTimeout(() => {
                tick();
                schedule();
            }, getSpeed());
        };
        schedule();

        return () => { clearTimeout(timeoutId); if (breathRef.current) clearInterval(breathRef.current); };
    }, [breathActive, breathPattern]);


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

    const SubTab = ({ id, label }: { id: 'teachings' | 'sounds'; label: string }) => (
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

                        {/* ── TEACHINGS (Spiritual Stories) ── */}
                        {activeSubTab === 'teachings' && (
                            <TeachingsSection />
                        )}


                        {/* ── SOUNDS ── */}
                        {activeSubTab === 'sounds' && (
                            <div className="animate-fade-up space-y-5" style={{ opacity: 0 }}>

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

                                {/* Cosmic Recommendation — upgraded hero */}
                                <div className="sounds-hero-card rounded-3xl overflow-hidden" style={{
                                    background: 'linear-gradient(145deg, rgba(212,175,55,0.10) 0%, rgba(13,6,24,0.97) 100%)',
                                    border: '1px solid rgba(212,175,55,0.2)',
                                    backdropFilter: 'blur(30px) saturate(1.3)',
                                    WebkitBackdropFilter: 'blur(30px) saturate(1.3)',
                                }}>
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-altar-gold animate-pulse" />
                                            <p className="text-[9px] font-display tracking-[3px] uppercase" style={{ color: 'rgba(212,175,55,0.6)' }}>Cosmic Recommendation</p>
                                        </div>
                                        <div className="text-center mb-3">
                                            <span className="text-4xl">{cosmicRec.title.split(' ').pop()}</span>
                                        </div>
                                        <p className="font-display text-lg text-altar-text text-center mb-1">{cosmicRec.title.replace(/\s*[\u{1F300}-\u{1F9FF}]/gu, '')}</p>
                                        <p className="text-[11px] text-altar-muted/70 italic leading-snug text-center mb-4">{cosmicRec.reason}</p>
                                        <div className="flex justify-center gap-2 mb-4 flex-wrap">
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-display tracking-wider" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(212,175,55,0.7)' }}>
                                                ✦ {moonPhase.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-display tracking-wider" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                                ⏱ 15 min
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-display tracking-wider" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                                ✧ Healing
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-display tracking-wider" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.7)' }}>
                                                🎵 {cosmicRec.freq}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 justify-center flex-wrap">
                                            <button
                                                onClick={() => isOnline ? openYouTube(cosmicRec.query, cosmicRec.title) : undefined}
                                                disabled={!isOnline}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-display tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
                                                style={{
                                                    background: 'linear-gradient(180deg, #F9E491, #D4A94E 40%, #C59341)',
                                                    border: '1.5px solid rgba(249,228,145,0.6)',
                                                    boxShadow: '0 2px 0 #8a6b25, 0 4px 14px rgba(0,0,0,0.45), 0 0 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                                                    color: '#1a0f2e',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                }}>
                                                {/* Shimmer sweep */}
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                    width: '200%',
                                                    background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                                                    animation: 'shimmer-sweep 3.5s ease-in-out infinite',
                                                    pointerEvents: 'none',
                                                }} />
                                                <span style={{ position: 'relative', zIndex: 1 }}>▶ Play Now</span>
                                            </button>
                                            <button
                                                onClick={() => setShowTimerPicker(prev => !prev)}
                                                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-display tracking-wide transition-all"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                                ⏱ {sleepTimerMins ? fmtTimer(sleepTimerSecs) : 'Timer'}
                                            </button>
                                        </div>
                                        {showTimerPicker && (
                                            <div className="mt-3 flex gap-2 flex-wrap justify-center">
                                                <p className="text-[9px] text-altar-muted w-full text-center">Stop after:</p>
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

                                {/* ── SOUND RX — How Do You Feel? (moved up — most user-friendly entry) ── */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase">Sound Rx</p>
                                        <span className="text-[9px] text-altar-muted/40 tracking-wider">💊 Prescriptions</span>
                                    </div>
                                    <div className="rounded-3xl overflow-hidden" style={{
                                        background: 'linear-gradient(160deg, rgba(139,92,246,0.08), rgba(13,6,24,0.95))',
                                        border: '1px solid rgba(139,92,246,0.15)',
                                    }}>
                                        <div className="p-4">
                                            <p className="font-display text-sm text-center mb-3" style={{ color: 'rgba(196,181,253,0.9)' }}>
                                                How do you feel?
                                            </p>
                                            <div className="flex gap-2 flex-wrap justify-center mb-2">
                                                {SOUND_RX_MOODS.map(mood => (
                                                    <button key={mood.id}
                                                        onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                                                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all hover:scale-105 active:scale-95"
                                                        style={{
                                                            background: selectedMood === mood.id
                                                                ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                                                            border: selectedMood === mood.id
                                                                ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                                            minWidth: 72,
                                                        }}>
                                                        <span style={{ fontSize: 22 }}>{mood.emoji}</span>
                                                        <span className="text-[10px]" style={{
                                                            color: selectedMood === mood.id ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                                                        }}>{mood.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Prescription card — appears when mood selected */}
                                            {selectedMood && (() => {
                                                const rx = SOUND_RX_MOODS.find(m => m.id === selectedMood)!;
                                                return (
                                                    <div className="mt-3 rounded-2xl p-4 animate-fade-up" style={{
                                                        background: 'rgba(0,0,0,0.3)',
                                                        border: '1px solid rgba(139,92,246,0.2)',
                                                        opacity: 0,
                                                    }}>
                                                        <p className="text-[9px] text-altar-muted font-display tracking-[2px] uppercase mb-2">Your Prescription</p>
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-display text-lg" style={{ color: '#c4b5fd' }}>{rx.freq}</span>
                                                                <span className="text-[10px] text-altar-muted/60">{rx.freqName}</span>
                                                            </div>
                                                            <span className="text-altar-muted/30">+</span>
                                                            <div className="flex flex-col">
                                                                <span className="font-display text-sm" style={{ color: '#c4b5fd' }}>{rx.breathwork}</span>
                                                                <span className="text-[10px] text-altar-muted/60">{rx.duration}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-altar-muted/60 italic mb-3">{rx.reason}</p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => isOnline ? openYouTube(rx.query, `Sound Rx: ${rx.label}`) : undefined}
                                                                disabled={!isOnline}
                                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-display tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
                                                                style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
                                                                ▶ Play Frequency
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const pattern = BREATHWORK_PATTERNS.find(p => p.name === rx.breathwork) || BREATHWORK_PATTERNS[0];
                                                                    setBreathPattern(pattern);
                                                                    setBreathPhaseIdx(0);
                                                                    setBreathSecs(pattern.phases[0].seconds);
                                                                    setBreathRound(1);
                                                                    setBreathActive(false);
                                                                    setShowBreathwork(true);
                                                                }}
                                                                className="px-3 py-2.5 rounded-xl text-xs font-display tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                                                🫁
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Ambient Soundscapes ── */}
                                <div>
                                    <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">Ambient Soundscapes</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                                        {AMBIENT_SOUNDSCAPES.map(sc => (
                                            <button key={sc.id}
                                                onClick={() => isOnline ? openYouTube(sc.query, sc.title) : undefined}
                                                disabled={!isOnline}
                                                className="shrink-0 rounded-[18px] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:opacity-30"
                                                style={{ width: 130, border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{
                                                    height: 100,
                                                    backgroundImage: `url(${sc.image})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    backgroundColor: '#0d0618',
                                                }} />
                                                <div className="p-2.5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                                    <span className="text-[11px] font-medium text-altar-text block">{sc.title}</span>
                                                    <span className="text-[9px] text-altar-muted/50">∞ Loop</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Guided Meditations ── */}
                                <div>
                                    <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">Guided Meditations</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'morning', emoji: '🌅', title: 'Morning Intention', duration: '10 min', desc: 'Set your frequency for the day', query: 'guided morning intention setting meditation 10 minutes', color: '#f59e0b' },
                                            { id: 'manifest', emoji: '✨', title: 'Manifestation', duration: '15 min', desc: 'Visualize & embody your desires', query: 'guided manifestation meditation visualization law of attraction 15 minutes', color: '#8b5cf6' },
                                            { id: 'sleep', emoji: '🌙', title: 'Deep Sleep', duration: '30 min', desc: 'Drift into restorative rest', query: 'guided sleep meditation deep relaxation 30 minutes', color: '#6366f1' },
                                            { id: 'anxiety', emoji: '🍃', title: 'Calm Anxiety', duration: '10 min', desc: 'Ground your nervous system', query: 'guided meditation for anxiety relief calming 10 minutes', color: '#22c55e' },
                                            { id: 'selflove', emoji: '💗', title: 'Self-Love', duration: '12 min', desc: 'Reconnect with your worth', query: 'guided self love meditation inner healing 12 minutes', color: '#ec4899' },
                                            { id: 'chakra', emoji: '🔮', title: 'Chakra Balance', duration: '20 min', desc: 'Align all seven energy centers', query: 'guided chakra balancing meditation all 7 chakras 20 minutes', color: '#a855f7' },
                                            { id: 'abundance', emoji: '💰', title: 'Abundance Flow', duration: '15 min', desc: 'Open to receiving & prosperity', query: 'guided abundance meditation prosperity receiving 15 minutes', color: '#d4af37' },
                                            { id: 'forgiveness', emoji: '🕊️', title: 'Letting Go', duration: '12 min', desc: 'Release resentment & heal', query: 'guided forgiveness meditation letting go release 12 minutes', color: '#06b6d4' },
                                        ].map(med => (
                                            <button key={med.id}
                                                onClick={() => isOnline ? openYouTube(med.query, med.title) : undefined}
                                                disabled={!isOnline}
                                                className="flex flex-col items-start gap-1.5 p-4 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:opacity-30"
                                                style={{
                                                    background: `linear-gradient(160deg, ${med.color}12, rgba(13,6,24,0.95))`,
                                                    border: `1px solid ${med.color}25`,
                                                }}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span style={{ fontSize: 24 }}>{med.emoji}</span>
                                                    <span className="text-[8px] px-2 py-0.5 rounded-full" style={{
                                                        background: `${med.color}15`,
                                                        color: med.color,
                                                        border: `1px solid ${med.color}30`,
                                                    }}>{med.duration}</span>
                                                </div>
                                                <span className="font-display text-[12px] font-semibold" style={{ color: med.color }}>{med.title}</span>
                                                <span className="text-[9px] text-altar-muted/50 leading-snug">{med.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── BREATHWORK TRIGGER ── */}
                                <button
                                    onClick={() => {
                                        setBreathPhaseIdx(0);
                                        setBreathSecs(breathPattern.phases[0].seconds);
                                        setBreathRound(1);
                                        setBreathActive(false);
                                        setShowBreathwork(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    style={{
                                        background: 'linear-gradient(160deg, rgba(6,182,212,0.08), rgba(13,6,24,0.95))',
                                        border: '1px solid rgba(6,182,212,0.15)',
                                    }}>
                                    <span style={{ fontSize: 28 }}>🫁</span>
                                    <div className="flex-1 text-left">
                                        <p className="font-display text-[13px]" style={{ color: '#67e8f9' }}>Breathwork Timer</p>
                                        <p className="text-[10px] text-altar-muted/50">Box · 4-7-8 · Wim Hof</p>
                                    </div>
                                    <span className="text-[10px] px-3 py-1 rounded-xl font-display" style={{ background: 'rgba(6,182,212,0.12)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)' }}>Open</span>
                                </button>



                                {/* ── SOLFEGGIO FREQUENCIES (with soft gate — 2 free, then premium) ── */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase">Solfeggio Frequencies</p>
                                        <span className="text-[9px] text-altar-muted/40 tracking-wider">{subscription === 'premium' ? 'Sacred Tones ✦' : `${Math.max(0, 2 - solfeggioPlays)} free left`}</span>
                                    </div>
                                    <div className="relative">
                                        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                                            {SOLFEGGIO_FREQUENCIES.map((freq, idx) => {
                                                const isLocked = subscription !== 'premium' && solfeggioPlays >= 2 && idx >= 2;
                                                return (
                                                    <button key={freq.hz}
                                                        onClick={() => {
                                                            if (isLocked) { onShowPremium(); return; }
                                                            if (!isOnline) return;
                                                            const newPlays = solfeggioPlays + 1;
                                                            setSolfeggioPlays(newPlays);
                                                            safeStorage.setItem('arcana_solfeggio_plays', String(newPlays));
                                                            openYouTube(freq.query, `${freq.hz}Hz ${freq.name}`);
                                                        }}
                                                        disabled={!isOnline && !isLocked}
                                                        className="shrink-0 rounded-[18px] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:opacity-30"
                                                        style={{ width: 120, border: `1px solid ${freq.color}22`, opacity: isLocked ? 0.5 : 1 }}>
                                                        <div style={{
                                                            height: 80, display: 'flex', flexDirection: 'column',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            background: `linear-gradient(160deg, ${freq.color}18, rgba(13,6,24,0.95))`,
                                                        }}>
                                                            {isLocked ? (
                                                                <span style={{ fontSize: 24 }}>🔒</span>
                                                            ) : (
                                                                <>
                                                                    <span style={{ fontSize: 22, fontFamily: "'Cinzel', serif", fontWeight: 700, color: freq.color }}>
                                                                        {freq.hz}
                                                                    </span>
                                                                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>Hz</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="p-2.5" style={{ background: 'rgba(0,0,0,0.4)' }}>
                                                            <span className="text-[11px] font-medium text-altar-text block" style={{ color: isLocked ? 'rgba(255,255,255,0.4)' : freq.color }}>{freq.name}</span>
                                                            <span className="text-[8px] text-altar-muted/50 block mt-0.5">{isLocked ? '👑 Premium' : freq.desc}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>



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

                                {/* ── THE MASTERS ── */}
                                <div>
                                    <p className="text-[9px] text-altar-muted font-display tracking-[3px] uppercase mb-3">✦ The Masters</p>

                                    {/* Teacher cards — horizontal scroll */}
                                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' as const }}>
                                        {MASTERS.map(master => {
                                            const isActive = selectedMaster === master.id;
                                            return (
                                                <button
                                                    key={master.id}
                                                    onClick={() => setSelectedMaster(isActive ? null : master.id)}
                                                    style={{
                                                        flex: '0 0 auto',
                                                        width: 200,
                                                        padding: '16px 14px',
                                                        borderRadius: 18,
                                                        background: isActive
                                                            ? `linear-gradient(135deg, ${master.color}18, ${master.color}08)`
                                                            : 'rgba(255,255,255,0.03)',
                                                        border: isActive
                                                            ? `1px solid ${master.color}50`
                                                            : '1px solid rgba(255,255,255,0.06)',
                                                        textAlign: 'left' as const,
                                                        transition: 'all 0.3s ease',
                                                        cursor: 'pointer',
                                                        boxShadow: isActive ? `0 0 24px ${master.color}15` : 'none',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                        <span style={{ fontSize: 28 }}>{master.emoji}</span>
                                                        <div>
                                                            <p style={{
                                                                fontSize: 13, fontWeight: 700, color: isActive ? master.color : 'rgba(255,255,255,0.85)',
                                                                fontFamily: "'Cinzel', serif", margin: 0,
                                                            }}>
                                                                {master.name}
                                                            </p>
                                                            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                                                                {master.era}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p style={{
                                                        fontSize: 10, color: isActive ? `${master.color}cc` : 'rgba(255,255,255,0.35)',
                                                        fontStyle: 'italic', margin: '0 0 6px 0', lineHeight: 1.4,
                                                    }}>
                                                        {master.philosophy}
                                                    </p>
                                                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.4 }}>
                                                        {master.lectures.length} curated lectures
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Expanded lecture list for selected master */}
                                    {selectedMaster && (() => {
                                        const master = MASTERS.find(m => m.id === selectedMaster);
                                        if (!master) return null;
                                        const themes = Array.from(new Set(master.lectures.map(l => l.theme)));
                                        return (
                                            <div style={{
                                                marginTop: 4,
                                                padding: '16px 14px',
                                                borderRadius: 18,
                                                background: 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${master.color}20`,
                                            }}>
                                                <p style={{
                                                    fontSize: 11, color: 'rgba(255,255,255,0.45)',
                                                    lineHeight: 1.6, margin: '0 0 16px 0',
                                                }}>
                                                    {master.bio}
                                                </p>
                                                {themes.map(theme => (
                                                    <div key={theme} style={{ marginBottom: 14 }}>
                                                        <p style={{
                                                            fontSize: 9, color: `${master.color}80`,
                                                            fontFamily: "'Cinzel', serif",
                                                            letterSpacing: 2, textTransform: 'uppercase',
                                                            marginBottom: 8,
                                                        }}>
                                                            {theme}
                                                        </p>
                                                        {master.lectures.filter(l => l.theme === theme).map(lecture => (
                                                            <button
                                                                key={lecture.id}
                                                                onClick={() => setVideoModal({ videoId: lecture.videoId, title: `${master.name}: ${lecture.title}` })}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                                    width: '100%', padding: '10px 12px',
                                                                    borderRadius: 14,
                                                                    background: 'rgba(255,255,255,0.02)',
                                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                                    marginBottom: 6,
                                                                    cursor: 'pointer',
                                                                    textAlign: 'left' as const,
                                                                    transition: 'all 0.2s ease',
                                                                }}
                                                                onMouseEnter={e => {
                                                                    (e.currentTarget as HTMLElement).style.background = `${master.color}10`;
                                                                    (e.currentTarget as HTMLElement).style.borderColor = `${master.color}30`;
                                                                }}
                                                                onMouseLeave={e => {
                                                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                                                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                                                                }}
                                                            >
                                                                <span style={{
                                                                    width: 36, height: 36, borderRadius: '50%',
                                                                    background: `linear-gradient(145deg, ${master.color}45, ${master.color}20)`,
                                                                    border: `1.5px solid ${master.color}60`,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: 13, flexShrink: 0,
                                                                    color: '#fff',
                                                                    boxShadow: `0 2px 0 ${master.color}30, 0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 2px ${master.color}15`,
                                                                }}>
                                                                    ▶
                                                                </span>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <p style={{
                                                                        fontSize: 12, color: 'rgba(255,255,255,0.8)',
                                                                        margin: 0, fontWeight: 600,
                                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                                    }}>
                                                                        {lecture.title}
                                                                    </p>
                                                                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0 0' }}>
                                                                        {lecture.duration}
                                                                        {lecture.relatedLessonId && ' · 🔗 Study Guide'}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>


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

            {/* ── GUIDED BREATH CODEX OVERLAY ── */}
            {showBreathwork && (
                <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'linear-gradient(180deg, #0a0515, #0d0618)' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 shrink-0">
                        <button onClick={() => { setShowBreathwork(false); setBreathActive(false); setBreathShowInfo(true); setBreathLearnMode(true); if (breathRef.current) clearInterval(breathRef.current); }}
                            className="text-white/50 text-sm font-display">Close</button>
                        <p className="font-display text-sm tracking-[3px] uppercase" style={{ color: breathPattern.color }}>{breathPattern.name}</p>
                        <span className="text-[10px] text-altar-muted">
                            {breathActive ? `Round ${breathRound}/${breathPattern.rounds}` : breathPattern.difficulty}
                        </span>
                    </div>

                    {/* Pattern selector */}
                    <div className="flex gap-2 px-5 pb-3 shrink-0 justify-center">
                        {BREATHWORK_PATTERNS.map(p => (
                            <button key={p.id}
                                onClick={() => {
                                    setBreathPattern(p);
                                    setBreathPhaseIdx(0);
                                    setBreathSecs(p.phases[0].seconds);
                                    setBreathRound(1);
                                    setBreathActive(false);
                                    setBreathShowInfo(true);
                                    setBreathLearnMode(true);
                                }}
                                className="px-3 py-1.5 rounded-xl text-[11px] font-display transition-all"
                                style={{
                                    background: breathPattern.id === p.id ? `${p.color}25` : 'rgba(255,255,255,0.04)',
                                    border: breathPattern.id === p.id ? `1px solid ${p.color}50` : '1px solid rgba(255,255,255,0.06)',
                                    color: breathPattern.id === p.id ? p.color : 'rgba(255,255,255,0.4)',
                                }}>
                                {p.name}
                            </button>
                        ))}
                    </div>

                    {/* ── PRE-SESSION CODEX CARD ── */}
                    {breathShowInfo && !breathActive && (
                        <div className="px-5 pb-4 shrink-0 animate-fade-up" style={{ opacity: 0 }}>
                            <div className="rounded-2xl p-4" style={{
                                background: `linear-gradient(160deg, ${breathPattern.color}08, rgba(13,6,24,0.95))`,
                                border: `1px solid ${breathPattern.color}20`,
                            }}>
                                {/* Origin story */}
                                <p className="text-[9px] font-display tracking-[2px] uppercase mb-2" style={{ color: `${breathPattern.color}80` }}>Origin</p>
                                <p className="text-[12px] text-altar-text/80 leading-relaxed mb-3">{breathPattern.origin}</p>

                                {/* Science */}
                                <p className="text-[9px] font-display tracking-[2px] uppercase mb-2" style={{ color: `${breathPattern.color}80` }}>The Science</p>
                                <p className="text-[11px] text-altar-muted/60 leading-relaxed mb-3">{breathPattern.science}</p>

                                {/* Lineage */}
                                <p className="text-[10px] text-altar-muted/40 italic">{breathPattern.lineage}</p>
                            </div>
                        </div>
                    )}

                    {/* ── VISUAL BREATH MAP ── */}
                    <div className="px-5 pb-3 shrink-0">
                        <div className="flex gap-1 items-end">
                            {breathPattern.phases.map((phase, i) => {
                                const totalSecs = breathPattern.phases.reduce((s, p) => s + p.seconds, 0);
                                const widthPct = (phase.seconds / totalSecs) * 100;
                                const isActive = breathActive && breathPhaseIdx === i;
                                const isPast = breathActive && breathPhaseIdx > i;
                                return (
                                    <div key={i} style={{ width: `${widthPct}%`, transition: 'all 0.3s ease' }}>
                                        <div style={{
                                            height: phase.label.includes('Inhale') ? 28 : phase.label.includes('Exhale') ? 20 : 14,
                                            borderRadius: 4,
                                            background: isActive ? `${breathPattern.color}50` : isPast ? `${breathPattern.color}25` : 'rgba(255,255,255,0.06)',
                                            border: isActive ? `1px solid ${breathPattern.color}80` : '1px solid transparent',
                                            transition: 'all 0.3s ease',
                                            boxShadow: isActive ? `0 0 12px ${breathPattern.color}30` : 'none',
                                        }} />
                                        <p className="text-[7px] text-center mt-1 font-display tracking-wider" style={{
                                            color: isActive ? breathPattern.color : 'rgba(255,255,255,0.25)',
                                        }}>{phase.label.replace('Power ', '').replace('Quick ', '')}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── BREATHING CIRCLE ── */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div style={{
                            width: 200, height: 200, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column',
                            background: `radial-gradient(circle, ${breathPattern.color}15, transparent 70%)`,
                            border: `2px solid ${breathPattern.color}40`,
                            boxShadow: `0 0 60px ${breathPattern.color}15, inset 0 0 40px ${breathPattern.color}08`,
                            transition: 'transform 1s ease-in-out, box-shadow 1s ease-in-out',
                            transform: breathActive && breathPattern.phases[breathPhaseIdx]?.label.includes('Inhale')
                                ? 'scale(1.3)' : breathActive && breathPattern.phases[breathPhaseIdx]?.label.includes('Exhale')
                                ? 'scale(0.8)' : 'scale(1)',
                        }}>
                            <span className="font-display text-4xl" style={{ color: breathPattern.color }}>
                                {breathSecs}
                            </span>
                            <span className="font-display text-sm tracking-[3px] uppercase mt-2" style={{ color: `${breathPattern.color}99` }}>
                                {breathPattern.phases[breathPhaseIdx]?.label || 'Ready'}
                            </span>
                        </div>

                        {/* ── COACHING TEXT (changes per phase) ── */}
                        <p className="text-[11px] text-altar-muted/50 mt-5 px-10 text-center italic leading-relaxed" style={{ minHeight: 32, transition: 'opacity 0.5s ease' }}>
                            {breathActive
                                ? (breathPattern.phases[breathPhaseIdx] as any)?.coach || breathPattern.desc
                                : breathPattern.desc
                            }
                        </p>

                        {/* Learn mode badge */}
                        {breathActive && breathLearnMode && breathRound === 1 && (
                            <span className="text-[9px] font-display tracking-[2px] uppercase mt-2 px-3 py-1 rounded-full" style={{
                                background: `${breathPattern.color}15`, border: `1px solid ${breathPattern.color}30`, color: `${breathPattern.color}90`,
                            }}>✦ Guided Round — 2× Slower</span>
                        )}

                        {/* Start / Pause / Info toggle */}
                        <div className="flex gap-3 mt-6">
                            {!breathActive && (
                                <button
                                    onClick={() => setBreathShowInfo(prev => !prev)}
                                    className="px-4 py-2.5 rounded-2xl text-xs font-display tracking-wide transition-all hover:scale-105 active:scale-95"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.5)',
                                    }}>
                                    {breathShowInfo ? 'Hide Info' : 'Learn More'}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (!breathActive) {
                                        if (breathRound >= breathPattern.rounds && breathPhaseIdx === 0) {
                                            setBreathRound(1);
                                            setBreathSecs(breathLearnMode ? breathPattern.phases[0].seconds * 2 : breathPattern.phases[0].seconds);
                                            setBreathLearnMode(true);
                                        }
                                        setBreathShowInfo(false);
                                        setBreathActive(true);
                                    } else {
                                        setBreathActive(false);
                                    }
                                }}
                                className="px-10 py-2.5 rounded-2xl font-display text-sm tracking-[3px] uppercase transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: breathActive ? 'rgba(255,255,255,0.06)' : `${breathPattern.color}20`,
                                    border: `1px solid ${breathActive ? 'rgba(255,255,255,0.1)' : breathPattern.color + '40'}`,
                                    color: breathActive ? 'rgba(255,255,255,0.5)' : breathPattern.color,
                                }}>
                                {breathActive ? 'Pause' : breathRound >= breathPattern.rounds ? 'Restart' : 'Begin'}
                            </button>
                        </div>

                        {/* Skip learn mode */}
                        {!breathActive && breathLearnMode && (
                            <button
                                onClick={() => setBreathLearnMode(false)}
                                className="mt-3 text-[10px] text-altar-muted/30 hover:text-altar-muted/50 transition-colors">
                                Skip guided round → full speed
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
