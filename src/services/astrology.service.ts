/**
 * Astrology Service — Natal Chart, Numerology & Horoscope engine.
 * All calculations are deterministic and offline — no external APIs.
 * Birth data stored in localStorage under 'arcana_birth'.
 *
 * Moon & Rising signs use real astronomical calculations (Jean Meeus algorithms)
 * via the ephemeris engine. Sun sign uses standard date ranges.
 */

import { calculateEphemeris } from './ephemeris';

const BIRTH_KEY = 'arcana_birth';

// ── Zodiac Data ──

export const ZODIAC_SIGNS = [
    { id: 'aries', glyph: '♈', name: 'Aries', element: 'Fire', dates: 'Mar 21 – Apr 19', ruling: 'Mars' },
    { id: 'taurus', glyph: '♉', name: 'Taurus', element: 'Earth', dates: 'Apr 20 – May 20', ruling: 'Venus' },
    { id: 'gemini', glyph: '♊', name: 'Gemini', element: 'Air', dates: 'May 21 – Jun 20', ruling: 'Mercury' },
    { id: 'cancer', glyph: '♋', name: 'Cancer', element: 'Water', dates: 'Jun 21 – Jul 22', ruling: 'Moon' },
    { id: 'leo', glyph: '♌', name: 'Leo', element: 'Fire', dates: 'Jul 23 – Aug 22', ruling: 'Sun' },
    { id: 'virgo', glyph: '♍', name: 'Virgo', element: 'Earth', dates: 'Aug 23 – Sep 22', ruling: 'Mercury' },
    { id: 'libra', glyph: '♎', name: 'Libra', element: 'Air', dates: 'Sep 23 – Oct 22', ruling: 'Venus' },
    { id: 'scorpio', glyph: '♏', name: 'Scorpio', element: 'Water', dates: 'Oct 23 – Nov 21', ruling: 'Pluto' },
    { id: 'sagittarius', glyph: '♐', name: 'Sagittarius', element: 'Fire', dates: 'Nov 22 – Dec 21', ruling: 'Jupiter' },
    { id: 'capricorn', glyph: '♑', name: 'Capricorn', element: 'Earth', dates: 'Dec 22 – Jan 19', ruling: 'Saturn' },
    { id: 'aquarius', glyph: '♒', name: 'Aquarius', element: 'Air', dates: 'Jan 20 – Feb 18', ruling: 'Uranus' },
    { id: 'pisces', glyph: '♓', name: 'Pisces', element: 'Water', dates: 'Feb 19 – Mar 20', ruling: 'Neptune' },
] as const;

// ── Birth Data ──

export interface BirthData {
    birthday: string;   // YYYY-MM-DD
    birthTime?: string; // HH:MM (24h)
    location?: string;
    utcOffset?: number;   // hours from UTC (e.g. -5 for EST)
    latitude?: number;    // degrees, north positive
    longitude?: number;   // degrees, east positive
}

export function saveBirthData(data: BirthData): void {
    localStorage.setItem(BIRTH_KEY, JSON.stringify(data));
}

export function getBirthData(): BirthData | null {
    try {
        const raw = localStorage.getItem(BIRTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function clearBirthData(): void {
    localStorage.removeItem(BIRTH_KEY);
}

// ── Sun Sign ──

export function getSunSign(dateStr: string): typeof ZODIAC_SIGNS[number] {
    const d = new Date(dateStr + 'T12:00:00');
    const month = d.getMonth() + 1; // 1-12
    const day = d.getDate();
    console.log('[SUN] getSunSign input:', dateStr, '→ month:', month, 'day:', day);

    // Explicit date ranges — the only way to be sure
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return ZODIAC_SIGNS[0];  // Aries
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return ZODIAC_SIGNS[1];  // Taurus
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return ZODIAC_SIGNS[2];  // Gemini
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return ZODIAC_SIGNS[3];  // Cancer
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return ZODIAC_SIGNS[4];  // Leo
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return ZODIAC_SIGNS[5];  // Virgo
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return ZODIAC_SIGNS[6]; // Libra
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return ZODIAC_SIGNS[7]; // Scorpio
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return ZODIAC_SIGNS[8]; // Sagittarius
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return ZODIAC_SIGNS[9]; // Capricorn
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return ZODIAC_SIGNS[10]; // Aquarius
    return ZODIAC_SIGNS[11]; // Pisces (Feb 19 – Mar 20)
}

// ── Moon Sign (real astronomical calculation) ──

function hashString(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash = hash & hash; // 32-bit int
    }
    return Math.abs(hash);
}

/**
 * Parse a date string and optional time into components.
 */
function parseBirthDateTime(dateStr: string, timeStr?: string) {
    const d = new Date(dateStr + 'T12:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    let hour = 12;
    let minute = 0;
    if (timeStr) {
        const parts = timeStr.split(':');
        hour = parseInt(parts[0]) || 12;
        minute = parseInt(parts[1]) || 0;
    }

    return { year, month, day, hour, minute };
}

/**
 * Calculate Moon sign using real lunar ephemeris (Meeus Ch. 47).
 * Uses birth date, time, and UTC offset for accurate positioning.
 */
export function getMoonSign(dateStr: string, timeStr?: string, utcOffset?: number): typeof ZODIAC_SIGNS[number] {
    const { year, month, day, hour, minute } = parseBirthDateTime(dateStr, timeStr);
    const input = { year, month, day, hour, minute, utcOffset: utcOffset || 0 };
    console.log('[EPHEMERIS] getMoonSign input:', JSON.stringify(input));
    const result = calculateEphemeris(input);
    console.log('[EPHEMERIS] Moon result:', result.moonSignId, result.moonLongitude.toFixed(2) + '°');
    const sign = ZODIAC_SIGNS.find(z => z.id === result.moonSignId);
    return sign || ZODIAC_SIGNS[0];
}

// ── Rising Sign (real Ascendant calculation) ──

/**
 * Calculate Rising sign (Ascendant) using real astronomical calculation.
 * Requires birth time and geographic coordinates for accuracy.
 * Falls back to Sun sign if no coordinates available (common astrological convention).
 */
export function getRisingSign(
    dateStr: string,
    timeStr?: string,
    utcOffset?: number,
    latitude?: number,
    longitude?: number
): typeof ZODIAC_SIGNS[number] {
    // If we have coordinates, calculate the real Ascendant
    if (latitude !== undefined && longitude !== undefined && timeStr) {
        const { year, month, day, hour, minute } = parseBirthDateTime(dateStr, timeStr);
        const result = calculateEphemeris({
            year, month, day, hour, minute,
            utcOffset: utcOffset || 0,
            latitude, longitude
        });
        if (result.risingSignId) {
            const sign = ZODIAC_SIGNS.find(z => z.id === result.risingSignId);
            if (sign) return sign;
        }
    }

    // Fallback: use Sun sign as Ascendant approximation (whole-sign convention)
    return getSunSign(dateStr);
}

// ── Natal Triad ──

export interface NatalTriad {
    sun: typeof ZODIAC_SIGNS[number];
    moon: typeof ZODIAC_SIGNS[number];
    rising: typeof ZODIAC_SIGNS[number];
}

export function getNatalTriad(data: BirthData): NatalTriad {
    console.log('[NATAL] BirthData:', JSON.stringify({
        birthday: data.birthday, birthTime: data.birthTime,
        location: data.location, utcOffset: data.utcOffset,
        latitude: data.latitude, longitude: data.longitude
    }));
    const result = {
        sun: getSunSign(data.birthday),
        moon: getMoonSign(data.birthday, data.birthTime, data.utcOffset),
        rising: getRisingSign(data.birthday, data.birthTime, data.utcOffset, data.latitude, data.longitude),
    };
    console.log('[NATAL] Triad:', result.sun.name, '/', result.moon.name, '/', result.rising.name);
    return result;
}

// ── Full Chart (Triad + Planets + Aspects) ──

import { PlanetPosition, Aspect } from './ephemeris';

export interface FullChartData {
    triad: NatalTriad;
    planets: PlanetPosition[];
    aspects: Aspect[];
}

export function getFullChart(data: BirthData): FullChartData | null {
    if (!data.birthday) return null;

    const triad = getNatalTriad(data);

    // Get full ephemeris with all planets + aspects in one call
    const { year, month, day, hour, minute } = parseBirthDateTime(data.birthday, data.birthTime);
    const result = calculateEphemeris({
        year, month, day, hour, minute,
        utcOffset: data.utcOffset || 0,
        latitude: data.latitude,
        longitude: data.longitude,
    });

    return {
        triad,
        planets: result.planets,
        aspects: result.aspects,
    };
}

// ── Sign-in-Position Interpretations ──

interface PlacementMeaning {
    title: string;
    overview: string;
    strengths: string;
    challenges: string;
    advice: string;
}

const PLACEMENT_MEANINGS: Record<string, Record<string, PlacementMeaning>> = {
    sun: {
        aries: { title: 'The Fearless Pioneer', overview: 'With Aries as your Sun sign, your core identity is driven by courage, initiative, and a fierce desire to lead. You are a natural-born trailblazer who thrives when breaking new ground.', strengths: 'Bold action, fearless leadership, infectious enthusiasm', challenges: 'Impatience, impulsiveness, tendency toward burnout', advice: 'Channel your fire into sustained projects. Your spark ignites others — learn to pace the flame.' },
        taurus: { title: 'The Grounded Creator', overview: 'Your Taurus Sun anchors your identity in stability, sensuality, and enduring values. You build things that last and find deep satisfaction in the material world.', strengths: 'Reliability, patience, artistic sensibility', challenges: 'Stubbornness, resistance to change, possessiveness', advice: 'Your steadfastness is a gift. Balance it by welcoming transformation as a natural cycle.' },
        gemini: { title: 'The Eternal Communicator', overview: 'A Gemini Sun makes your core identity fluid, curious, and endlessly communicative. You process the world through ideas, words, and social connections.', strengths: 'Versatility, wit, intellectual agility', challenges: 'Scattered focus, superficiality, restlessness', advice: 'Your dual nature is your superpower. Embrace depth alongside breadth to find true mastery.' },
        cancer: { title: 'The Intuitive Guardian', overview: 'With Cancer as your Sun, your identity is woven around emotional depth, nurturing instincts, and a powerful connection to home and family.', strengths: 'Deep empathy, protective loyalty, emotional intelligence', challenges: 'Moodiness, over-attachment, difficulty letting go', advice: 'Your sensitivity is wisdom. Build boundaries that protect without isolating your beautiful heart.' },
        leo: { title: 'The Radiant Sovereign', overview: 'Your Leo Sun places creative self-expression, generosity, and natural leadership at the core of who you are. You shine brightest when uplifting others.', strengths: 'Charisma, warmth, creative vision', challenges: 'Pride, need for validation, dramatic tendencies', advice: 'You are the Sun itself — you do not need others to tell you that you shine. Lead with love.' },
        virgo: { title: 'The Sacred Craftsperson', overview: 'A Virgo Sun defines your identity through precision, service, and a devotion to improvement. You see the sacred in the details others miss.', strengths: 'Analytical mind, dedication, practical wisdom', challenges: 'Perfectionism, self-criticism, overthinking', advice: 'Your eye for imperfection is a gift. Turn it outward in service, and inward with compassion.' },
        libra: { title: 'The Harmonist', overview: 'With Libra as your Sun, your identity revolves around balance, beauty, and the pursuit of justice. Relationships are your mirror and your medicine.', strengths: 'Diplomacy, aesthetic sense, fairness', challenges: 'Indecisiveness, people-pleasing, conflict avoidance', advice: 'True harmony includes your own voice. Speak your truth — balance requires all sides.' },
        scorpio: { title: 'The Depth Walker', overview: 'Your Scorpio Sun gives you an identity forged in transformation, intensity, and unflinching truth. You see beneath every surface.', strengths: 'Emotional depth, resilience, transformative power', challenges: 'Jealousy, control, difficulty trusting', advice: 'Your power lies in vulnerability. The deepest transformation comes from opening, not guarding.' },
        sagittarius: { title: 'The Cosmic Archer', overview: 'A Sagittarius Sun makes your core identity expansive, philosophical, and eternally questing. You are a seeker of truth who finds meaning in every journey.', strengths: 'Optimism, vision, adventurous wisdom', challenges: 'Restlessness, tactlessness, over-promising', advice: 'Your arrow points toward truth. Ground your boundless vision with follow-through, and you become unstoppable.' },
        capricorn: { title: 'The Mountain Climber', overview: 'With Capricorn as your Sun, your identity is built on ambition, discipline, and a deep respect for the long game. You understand that greatness takes time.', strengths: 'Strategic thinking, perseverance, integrity', challenges: 'Emotional restraint, workaholism, pessimism', advice: 'You will reach the summit. Remember to enjoy the climb and let others walk beside you.' },
        aquarius: { title: 'The Visionary Rebel', overview: 'Your Aquarius Sun defines you through innovation, humanitarian ideals, and a fierce independence. You see the future others cannot yet imagine.', strengths: 'Originality, progressive thinking, intellectual freedom', challenges: 'Emotional detachment, stubbornness, contrarianism', advice: 'Your vision serves humanity best when paired with genuine emotional connection.' },
        pisces: { title: 'The Mystic Dreamer', overview: 'A Pisces Sun dissolves the boundaries of your identity, connecting you to the collective unconscious. You are pure empathy, intuition, and creative spirit.', strengths: 'Compassion, artistic genius, spiritual depth', challenges: 'Escapism, boundary issues, overwhelm', advice: 'Your sensitivity is a portal, not a wound. Ground your dreams in daily practice to manifest magic.' },
    },
    moon: {
        aries: { title: 'Emotional Warrior', overview: 'Your Moon in Aries means you process emotions through action. When you feel, you need to move, create, or fight for something.', strengths: 'Emotional courage, quick recovery, passion', challenges: 'Emotional impulsiveness, anger flashes, impatience with vulnerability', advice: 'Give your emotions room to breathe before acting on them. Your fire heals through expression.' },
        taurus: { title: 'Emotional Anchor', overview: 'Moon in Taurus gives you a deeply stable emotional nature. You find comfort in sensory experiences and need physical security to feel safe.', strengths: 'Emotional steadiness, loyalty, comforting presence', challenges: 'Emotional stubbornness, resistance to processing pain, material attachment', advice: 'Your calm is a gift to others. Allow yourself to feel the storms — you can weather anything.' },
        gemini: { title: 'Emotional Alchemist', overview: 'Your Moon in Gemini means you intellectualize your emotions. You need to talk, write, or think through feelings to understand them.', strengths: 'Emotional adaptability, humor as healing, articulate feelings', challenges: 'Emotional avoidance through intellectualizing, nervous anxiety, scattered feelings', advice: 'Not every feeling needs a label. Sometimes the heart speaks a language beyond words.' },
        cancer: { title: 'Emotional Wellspring', overview: 'Moon in Cancer is its most powerful placement. Your emotions run deep as the ocean — you feel everything intensely and remember feelings forever.', strengths: 'Profound empathy, nurturing instinct, emotional memory', challenges: 'Overwhelm, moodiness, difficulty releasing past hurts', advice: 'Your emotional depth is your greatest gift. Create rituals to honor and release what you carry.' },
        leo: { title: 'Emotional Radiance', overview: 'Your Moon in Leo means your emotional world is dramatic, warm, and generous. You need to feel special and you make others feel the same way.', strengths: 'Emotional warmth, loyalty, generous heart', challenges: 'Need for emotional attention, pride in feelings, dramatic reactions', advice: 'Your heart is magnificent. Let it shine without needing applause — your warmth is its own reward.' },
        virgo: { title: 'Emotional Analyst', overview: 'Moon in Virgo gives you an emotional life filtered through analysis. You process feelings by organizing, fixing, and being of service.', strengths: 'Emotional precision, practical caring, quiet devotion', challenges: 'Self-critical emotions, anxiety, difficulty accepting imperfection', advice: 'Perfection is not the path to peace. Let your emotions be messy sometimes — that is where healing lives.' },
        libra: { title: 'Emotional Diplomat', overview: 'Your Moon in Libra means your emotional wellbeing is deeply tied to harmony in relationships. You feel most secure when balance surrounds you.', strengths: 'Emotional grace, ability to see all sides, peacemaking', challenges: 'Emotional codependency, suppressing feelings for harmony, indecisiveness', advice: 'Your need for peace is beautiful. Just ensure it includes peace within yourself, not only around you.' },
        scorpio: { title: 'Emotional Depth Diver', overview: 'Moon in Scorpio gives you the most intense emotional nature of the zodiac. You feel on a cellular level and your emotional truths are absolute.', strengths: 'Emotional fearlessness, transformative healing, unshakable loyalty', challenges: 'Emotional extremes, jealousy, difficulty forgiving', advice: 'Your intensity is sacred. Channel it into transformation rather than holding — you are meant to alchemize pain into gold.' },
        sagittarius: { title: 'Emotional Explorer', overview: 'Your Moon in Sagittarius makes your emotional world expansive and freedom-seeking. You process feelings through philosophy, travel, and big-picture thinking.', strengths: 'Emotional optimism, resilience, philosophical perspective', challenges: 'Emotional avoidance through busy-ness, fear of emotional confinement, over-simplifying feelings', advice: 'Freedom and depth are not opposites. You can explore the universe and still come home to your heart.' },
        capricorn: { title: 'Emotional Architect', overview: 'Moon in Capricorn gives you a dignified, controlled emotional life. You build emotional security through achievement and structure.', strengths: 'Emotional resilience, quiet strength, responsible caring', challenges: 'Emotional suppression, difficulty being vulnerable, melancholy', advice: 'Your strength is undeniable. But strength also means allowing yourself to need others.' },
        aquarius: { title: 'Emotional Futurist', overview: 'Your Moon in Aquarius processes emotions through the lens of collective consciousness. You feel for humanity and need intellectual freedom to be emotionally safe.', strengths: 'Emotional objectivity, humanitarian empathy, progressive feelings', challenges: 'Emotional detachment, intellectualizing feelings, difficulty with intimacy', advice: 'You feel for the world — beautiful. Now let yourself feel for the one person in front of you too.' },
        pisces: { title: 'Emotional Ocean', overview: 'Moon in Pisces gives you boundless emotional sensitivity. You absorb the feelings of everyone around you and experience the world as pure feeling.', strengths: 'Profound compassion, artistic emotion, spiritual sensitivity', challenges: 'Emotional overwhelm, boundary dissolution, escapism', advice: 'Your empathy is a superpower. Develop strong boundaries to protect your gift — the world needs your sensitivity.' },
    },
    rising: {
        aries: { title: 'The Bold First Impression', overview: 'Aries Rising means the world sees you as confident, direct, and energetic before they know anything else. You radiate an aura of action.', strengths: 'Magnetic confidence, pioneering presence, youthful energy', challenges: 'Coming across as aggressive, intimidating, or self-centered', advice: 'Your presence commands attention naturally. Soften it with warmth and watch doors fly open.' },
        taurus: { title: 'The Serene Presence', overview: 'With Taurus Rising, you project calm stability and sensual beauty. People feel grounded simply being near you.', strengths: 'Approachable warmth, reliable energy, natural elegance', challenges: 'Appearing slow to act, stubborn, or overly cautious', advice: 'Your steadiness is magnetic. Let people see the passion beneath your calm surface.' },
        gemini: { title: 'The Quick-Silver Spirit', overview: 'Gemini Rising makes you appear quick, curious, and endlessly engaging. People are drawn to your conversational energy and youthful vibe.', strengths: 'Social adaptability, intellectual charm, versatile presentation', challenges: 'Appearing scattered, nervous, or unreliable', advice: 'Your chameleon nature is a superpower. Ground it with consistency and people will trust your brilliance.' },
        cancer: { title: 'The Gentle Shield', overview: 'Cancer Rising projects nurturing warmth with a protective shell. People sense your caring nature and feel safe around you.', strengths: 'Welcoming aura, emotional attunement, protective energy', challenges: 'Appearing guarded, moody, or overly sensitive', advice: 'Your softness invites trust. Show it more freely — not everyone will hurt you.' },
        leo: { title: 'The Natural Star', overview: 'Leo Rising means you walk into a room and people notice. Your presence is warm, dramatic, and impossible to ignore.', strengths: 'Commanding presence, natural leadership, radiant confidence', challenges: 'Appearing attention-seeking, dominating, or prideful', advice: 'You were born to be seen. Use your visibility to uplift others and your light multiplies.' },
        virgo: { title: 'The Quiet Observer', overview: 'Virgo Rising gives you an appearance of thoughtful precision. People see you as organized, helpful, and quietly competent.', strengths: 'Clean presentation, trustworthy aura, attentive listening', challenges: 'Appearing critical, anxious, or unapproachable', advice: 'Your attention to detail impresses. Let people see your warmth as quickly as your competence.' },
        libra: { title: 'The Graceful Ambassador', overview: 'With Libra Rising, you project charm, beauty, and social grace. People are drawn to your balanced, fair-minded energy.', strengths: 'Natural charm, aesthetic beauty, diplomatic aura', challenges: 'Appearing indecisive, superficial, or people-pleasing', advice: 'Your grace opens every door. Back it with conviction and you become truly unstoppable.' },
        scorpio: { title: 'The Magnetic Mystery', overview: 'Scorpio Rising gives you an aura of intensity, mystery, and power. People feel your presence before you speak a word.', strengths: 'Magnetic intensity, transformative presence, fearless aura', challenges: 'Appearing intimidating, secretive, or unapproachable', advice: 'Your intensity is your signature. Balance it with moments of openness to let people in.' },
        sagittarius: { title: 'The Eternal Adventurer', overview: 'Sagittarius Rising projects optimism, expansion, and philosophical depth. People see you as a free spirit and natural teacher.', strengths: 'Enthusiastic presence, inspiring energy, open-minded aura', challenges: 'Appearing restless, preachy, or commitment-avoidant', advice: 'Your joy is contagious. Ground your adventures with purpose and you inspire everyone you meet.' },
        capricorn: { title: 'The Authority Figure', overview: 'Capricorn Rising projects seriousness, competence, and natural authority. People instinctively respect and trust you.', strengths: 'Professional presence, trustworthy aura, mature energy', challenges: 'Appearing cold, unapproachable, or overly serious', advice: 'Your authority is natural — you do not need to earn it. Let humor and warmth soften your edges.' },
        aquarius: { title: 'The Eccentric Visionary', overview: 'Aquarius Rising makes you appear unique, progressive, and slightly otherworldly. People see you as ahead of your time.', strengths: 'Unique presence, innovative energy, humanitarian aura', challenges: 'Appearing distant, eccentric, or emotionally unavailable', advice: 'Your uniqueness is your brand. Let people close enough to see the caring heart behind the vision.' },
        pisces: { title: 'The Ethereal Dreamer', overview: 'Pisces Rising gives you a dreamy, compassionate, almost otherworldly presence. People feel your empathy and gentle spirit immediately.', strengths: 'Empathetic aura, artistic presence, spiritual magnetism', challenges: 'Appearing unfocused, overly passive, or lost in thought', advice: 'Your softness is not weakness — it is a portal. Let it draw people into your beautiful inner world.' },
    },
};

export function getPlacementMeaning(position: 'sun' | 'moon' | 'rising', signId: string): PlacementMeaning {
    return PLACEMENT_MEANINGS[position]?.[signId] || {
        title: 'Cosmic Mystery',
        overview: 'This placement carries unique energy waiting to be explored.',
        strengths: 'Hidden gifts yet to be uncovered',
        challenges: 'Unknown territory to navigate',
        advice: 'Trust the stars — your path reveals itself in time.',
    };
}

// ══════════════════════════════════════
// NUMEROLOGY
// ══════════════════════════════════════

function reduceToSingle(n: number): number {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
        n = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
    }
    return n;
}

export function getLifePathNumber(dateStr: string): number {
    const d = new Date(dateStr + 'T12:00:00');
    const month = reduceToSingle(d.getMonth() + 1);
    const day = reduceToSingle(d.getDate());
    const year = reduceToSingle(
        String(d.getFullYear()).split('').reduce((a, c) => a + parseInt(c), 0)
    );
    return reduceToSingle(month + day + year);
}

export function getPersonalYearNumber(dateStr: string): number {
    const d = new Date(dateStr + 'T12:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const currentYear = new Date().getFullYear();
    const sum = reduceToSingle(month) + reduceToSingle(day) + reduceToSingle(
        String(currentYear).split('').reduce((a, c) => a + parseInt(c), 0)
    );
    return reduceToSingle(sum);
}

const LIFE_PATH_MEANINGS: Record<number, { title: string; desc: string; strengths: string; challenges: string }> = {
    1: { title: 'The Leader', desc: 'You are a pioneer with an independent spirit. Your path is about originality, ambition, and self-confidence.', strengths: 'Innovation, determination, courage', challenges: 'Stubbornness, impatience, ego' },
    2: { title: 'The Diplomat', desc: 'You are a natural peacemaker with deep sensitivity. Your path is about partnership, harmony, and intuition.', strengths: 'Empathy, cooperation, patience', challenges: 'Oversensitivity, indecision, codependency' },
    3: { title: 'The Creative', desc: 'You radiate joy and artistic expression. Your path is about communication, inspiration, and social connection.', strengths: 'Creativity, optimism, self-expression', challenges: 'Scattered energy, superficiality, mood swings' },
    4: { title: 'The Builder', desc: 'You are a grounded architect of stability. Your path is about discipline, hard work, and practical achievement.', strengths: 'Reliability, logic, determination', challenges: 'Rigidity, overwork, resistance to change' },
    5: { title: 'The Adventurer', desc: 'You crave freedom and variety. Your path is about change, travel, and embracing the full spectrum of experience.', strengths: 'Versatility, curiosity, adaptability', challenges: 'Restlessness, excess, commitment fears' },
    6: { title: 'The Nurturer', desc: 'You are a natural caretaker drawn to beauty and responsibility. Your path is about family, love, and service.', strengths: 'Compassion, responsibility, healing', challenges: 'Self-sacrifice, perfectionism, control' },
    7: { title: 'The Seeker', desc: 'You are a philosophical soul drawn to mystery. Your path is about wisdom, spirituality, and inner truth.', strengths: 'Intuition, analytical mind, depth', challenges: 'Isolation, skepticism, secrecy' },
    8: { title: 'The Powerhouse', desc: 'You are destined for material and spiritual mastery. Your path is about abundance, authority, and karmic balance.', strengths: 'Ambition, business acumen, resilience', challenges: 'Materialism, control, workaholism' },
    9: { title: 'The Humanitarian', desc: 'You are a compassionate old soul. Your path is about universal love, completion, and selfless service.', strengths: 'Generosity, wisdom, idealism', challenges: 'Resentment, detachment, self-pity' },
    11: { title: 'The Illuminator', desc: 'A master number — you carry heightened intuition and spiritual insight. Your path is about enlightenment and inspiration.', strengths: 'Visionary, inspirational, psychic', challenges: 'Anxiety, self-doubt, nervous energy' },
    22: { title: 'The Master Builder', desc: 'A master number — you have the power to turn dreams into reality on a grand scale. Your path is about manifesting the extraordinary.', strengths: 'Practical vision, discipline, enormous potential', challenges: 'Overwhelm, pressure, perfectionism' },
    33: { title: 'The Master Teacher', desc: 'A master number — you embody selfless devotion and spiritual upliftment. Your path is about healing and guiding humanity.', strengths: 'Compassion, blessing, spiritual mastery', challenges: 'Martyrdom, emotional burden, high expectations' },
};

export function getLifePathMeaning(num: number) {
    return LIFE_PATH_MEANINGS[num] || LIFE_PATH_MEANINGS[9];
}

// ══════════════════════════════════════
// DAILY HOROSCOPE
// ══════════════════════════════════════

const HOROSCOPE_POOL: string[] = [
    'The cosmos aligns to illuminate your inner strength today. Trust the path that feels both unfamiliar and magnetic.',
    'A creative spark ignites within you. Follow it — even small acts of expression carry powerful energy now.',
    'Today invites stillness. The answers you seek are not beyond the horizon but deep within your own heart.',
    'Relationships take center stage. Speak your truth gently, and watch old walls dissolve into bridges.',
    'Financial intuition is heightened. That quiet nudge about an opportunity? It deserves your attention.',
    'Your energy magnetizes possibility. What you project today, the universe reflects back tenfold.',
    'A revelation may surface from an unexpected conversation. Stay open — wisdom wears many disguises.',
    'Your body is asking for attention. Honor its needs and you will find clarity in your mind as well.',
    'The moon phase amplifies your emotional intelligence. Use it to navigate a delicate situation with grace.',
    'Travel or movement is favored. Even a short walk can shift your perspective in surprising ways.',
    'An old pattern is ready to release. Let go without guilt — your future self is already thanking you.',
    'Collaboration is your superpower today. The right partnership could accelerate months of solo effort.',
    'Boundaries are an act of self-love. Today, practice saying no to what drains and yes to what fuels.',
    'A dream or vision carries symbolic weight. Pay attention to recurring images — they hold messages.',
    'Your words carry extra power now. Choose them wisely, for they plant seeds in fertile ground.',
    'A surprise arrives that reframes a challenge as a gift. Stay flexible and let the day unfold.',
    'Romance and beauty are highlighted. Treat yourself to something that delights the senses.',
    'Deep transformation is underway beneath the surface. Trust the process even when you cannot see progress.',
    'Community and friendship bring unexpected joy. Reach out to someone you have been thinking about.',
    'Your career sector is electrified. Bold moves made today ripple into long-term success.',
    'Solitude is not loneliness — it is communion with your higher self. Embrace quiet moments.',
    'An ancestor or guide reaches through the veil. Notice signs, feathers, coins, and synchronicities.',
    'Your healing journey accelerates. Forgiveness — of self or others — unlocks a powerful door today.',
    'Playfulness is medicine. Let yourself laugh deeply and approach challenges with curiosity, not dread.',
    'A financial or material blessing is on its way. Prepare by aligning your intentions with gratitude.',
    'The eclipse energy lingers. Major themes from recent weeks crystallize into clear next steps.',
    'Your intuition is razor-sharp. That gut feeling is not anxiety — it is guidance. Act on it.',
    'Home and family demand loving attention. Small gestures of care create enormous ripple effects.',
    'An intellectual breakthrough arrives. Study, read, or explore a topic that has been calling to you.',
    'Today is a portal day. Set intentions with specificity and emotional charge — the universe is listening.',
];

const EXTENDED_HOROSCOPE: string[] = [
    'This week, the planetary alignment suggests a period of inner alchemy. Old identities are dissolving to make room for a more authentic version of yourself. Embrace the discomfort of growth.',
    'The coming days favor bold communication. Whether in love, career, or creative pursuits, speaking from the heart rather than the head will open doors previously invisible to you.',
    'A cycle of abundance is building momentum. Pay attention to patterns in your spending and receiving — the universe is teaching you about the sacred flow of energy exchange.',
    'Ancestral wisdom flows strongly this week. You may feel drawn to explore your roots, revisit family stories, or honor traditions. There is healing power in remembrance.',
    'The stars suggest a period of purging and renewal. Clear physical, emotional, and digital clutter. What you release now creates space for something extraordinary arriving soon.',
];

const LUCKY_ELEMENTS = [
    { number: 7, color: 'Amethyst Purple', crystal: 'Moonstone' },
    { number: 3, color: 'Golden Amber', crystal: 'Citrine' },
    { number: 9, color: 'Midnight Blue', crystal: 'Lapis Lazuli' },
    { number: 11, color: 'Silver Mist', crystal: 'Clear Quartz' },
    { number: 5, color: 'Emerald Green', crystal: 'Aventurine' },
    { number: 2, color: 'Rose Pink', crystal: 'Rose Quartz' },
    { number: 8, color: 'Obsidian Black', crystal: 'Black Tourmaline' },
    { number: 4, color: 'Copper Bronze', crystal: 'Tiger Eye' },
    { number: 1, color: 'Solar Gold', crystal: 'Amber' },
    { number: 6, color: 'Ocean Teal', crystal: 'Aquamarine' },
    { number: 22, color: 'Celestial White', crystal: 'Selenite' },
    { number: 13, color: 'Deep Garnet', crystal: 'Garnet' },
];

export interface DailyHoroscope {
    sign: typeof ZODIAC_SIGNS[number];
    daily: string;
    extended: string;
    lucky: { number: number; color: string; crystal: string };
    mood: string;
}

const MOODS = ['Reflective', 'Energized', 'Intuitive', 'Adventurous', 'Romantic', 'Grounded', 'Transformative', 'Playful', 'Visionary', 'Nurturing', 'Ambitious', 'Mystical'];

export function getDailyHoroscope(signId: string): DailyHoroscope {
    const today = new Date().toISOString().slice(0, 10);
    const sign = ZODIAC_SIGNS.find(z => z.id === signId) || ZODIAC_SIGNS[0];
    const signIdx = ZODIAC_SIGNS.indexOf(sign);

    const dailySeed = hashString(today + '_daily_' + signId);
    const extSeed = hashString(today + '_ext_' + signId);
    const luckySeed = hashString(today + '_lucky_' + signId);
    const moodSeed = hashString(today + '_mood_' + signId);

    return {
        sign,
        daily: HOROSCOPE_POOL[dailySeed % HOROSCOPE_POOL.length],
        extended: EXTENDED_HOROSCOPE[extSeed % EXTENDED_HOROSCOPE.length],
        lucky: LUCKY_ELEMENTS[luckySeed % LUCKY_ELEMENTS.length],
        mood: MOODS[moodSeed % MOODS.length],
    };
}

// ── Compatibility ──

const COMPATIBILITY: Record<string, { best: string[]; challenging: string[] }> = {
    aries: { best: ['leo', 'sagittarius', 'gemini'], challenging: ['cancer', 'capricorn'] },
    taurus: { best: ['virgo', 'capricorn', 'cancer'], challenging: ['leo', 'aquarius'] },
    gemini: { best: ['libra', 'aquarius', 'aries'], challenging: ['virgo', 'pisces'] },
    cancer: { best: ['scorpio', 'pisces', 'taurus'], challenging: ['aries', 'libra'] },
    leo: { best: ['aries', 'sagittarius', 'gemini'], challenging: ['taurus', 'scorpio'] },
    virgo: { best: ['taurus', 'capricorn', 'cancer'], challenging: ['gemini', 'sagittarius'] },
    libra: { best: ['gemini', 'aquarius', 'leo'], challenging: ['cancer', 'capricorn'] },
    scorpio: { best: ['cancer', 'pisces', 'virgo'], challenging: ['leo', 'aquarius'] },
    sagittarius: { best: ['aries', 'leo', 'aquarius'], challenging: ['virgo', 'pisces'] },
    capricorn: { best: ['taurus', 'virgo', 'scorpio'], challenging: ['aries', 'libra'] },
    aquarius: { best: ['gemini', 'libra', 'sagittarius'], challenging: ['taurus', 'scorpio'] },
    pisces: { best: ['cancer', 'scorpio', 'capricorn'], challenging: ['gemini', 'sagittarius'] },
};

export function getCompatibility(signId: string) {
    const compat = COMPATIBILITY[signId] || COMPATIBILITY['aries'];
    return {
        best: compat.best.map(id => ZODIAC_SIGNS.find(z => z.id === id)!),
        challenging: compat.challenging.map(id => ZODIAC_SIGNS.find(z => z.id === id)!),
    };
}

// ══════════════════════════════════════
// COUPLE COMPATIBILITY
// ══════════════════════════════════════

export interface SignMatch {
    userSign: typeof ZODIAC_SIGNS[number];
    partnerSign: typeof ZODIAC_SIGNS[number];
    quality: 'perfect' | 'great' | 'good' | 'neutral' | 'challenging';
    score: number; // 0-100
}

export interface CoupleReport {
    userTriad: NatalTriad;
    partnerTriad: NatalTriad;
    sunMatch: SignMatch;
    moonMatch: SignMatch;
    risingMatch: SignMatch;
    elementBalance: { fire: number; earth: number; air: number; water: number };
    overallScore: number; // 0-100
    tier: string; // label like "Soulfire Connection"
    strengths: string[];
    growthEdges: string[];
}

const ELEMENT_MAP: Record<string, string> = {};
ZODIAC_SIGNS.forEach(z => { ELEMENT_MAP[z.id] = z.element; });

const SAME_ELEMENT_PAIRS: Record<string, string[]> = {
    Fire: ['aries', 'leo', 'sagittarius'],
    Earth: ['taurus', 'virgo', 'capricorn'],
    Air: ['gemini', 'libra', 'aquarius'],
    Water: ['cancer', 'scorpio', 'pisces'],
};

function getSignAffinity(aId: string, bId: string): { score: number; quality: SignMatch['quality'] } {
    // Same sign
    if (aId === bId) return { score: 90, quality: 'perfect' };

    const aElem = ELEMENT_MAP[aId];
    const bElem = ELEMENT_MAP[bId];

    // Best match list
    const bestA = COMPATIBILITY[aId]?.best || [];
    const bestB = COMPATIBILITY[bId]?.best || [];
    if (bestA.includes(bId) && bestB.includes(aId)) return { score: 88, quality: 'perfect' };
    if (bestA.includes(bId) || bestB.includes(aId)) return { score: 78, quality: 'great' };

    // Same element
    if (aElem === bElem) return { score: 75, quality: 'great' };

    // Complementary elements (Fire+Air, Earth+Water)
    const complementary = (aElem === 'Fire' && bElem === 'Air') || (aElem === 'Air' && bElem === 'Fire')
        || (aElem === 'Earth' && bElem === 'Water') || (aElem === 'Water' && bElem === 'Earth');
    if (complementary) return { score: 65, quality: 'good' };

    // Challenging
    const challA = COMPATIBILITY[aId]?.challenging || [];
    const challB = COMPATIBILITY[bId]?.challenging || [];
    if (challA.includes(bId) || challB.includes(aId)) return { score: 40, quality: 'challenging' };

    // Neutral
    return { score: 55, quality: 'neutral' };
}

function getElementBalance(userTriad: NatalTriad, partnerTriad: NatalTriad) {
    const counts = { fire: 0, earth: 0, air: 0, water: 0 };
    const allSigns = [userTriad.sun, userTriad.moon, userTriad.rising, partnerTriad.sun, partnerTriad.moon, partnerTriad.rising];
    for (const s of allSigns) {
        const elem = s.element.toLowerCase() as keyof typeof counts;
        if (elem in counts) counts[elem]++;
    }
    return counts;
}

const SCORE_TIERS: { min: number; label: string }[] = [
    { min: 85, label: 'Soulfire Connection' },
    { min: 72, label: 'Cosmic Soulmates' },
    { min: 60, label: 'Magnetic Attraction' },
    { min: 45, label: 'Growth Partnership' },
    { min: 0, label: 'Opposites Attract' },
];

function getStrengthsAndEdges(sunM: SignMatch, moonM: SignMatch, risingM: SignMatch) {
    const strengths: string[] = [];
    const edges: string[] = [];

    if (sunM.quality === 'perfect' || sunM.quality === 'great') strengths.push('Core identities align naturally — you understand each other\'s drives');
    else if (sunM.quality === 'challenging') edges.push('Your core motivations may clash — practice patience with different approaches');
    else strengths.push('Your differences in personality create intrigue and complementary energy');

    if (moonM.quality === 'perfect' || moonM.quality === 'great') strengths.push('Emotionally fluent together — comfort comes easily');
    else if (moonM.quality === 'challenging') edges.push('Emotional needs differ — learn each other\'s love language');
    else edges.push('Emotional rhythms may need conscious synchronization');

    if (risingM.quality === 'perfect' || risingM.quality === 'great') strengths.push('Others see you as a natural pair — your social energy harmonizes');
    else if (risingM.quality === 'challenging') edges.push('How you present to the world can feel mismatched — embrace it as balance');
    else strengths.push('You bring out different sides of each other in social settings');

    return { strengths, edges };
}

export function getCoupleCompatibility(userBirthData: BirthData, partnerBirthday: string): CoupleReport {
    const userTriad = getNatalTriad(userBirthData);
    const partnerTriad = getNatalTriad({ birthday: partnerBirthday });

    const sunAff = getSignAffinity(userTriad.sun.id, partnerTriad.sun.id);
    const moonAff = getSignAffinity(userTriad.moon.id, partnerTriad.moon.id);
    const risingAff = getSignAffinity(userTriad.rising.id, partnerTriad.rising.id);

    const sunMatch: SignMatch = { userSign: userTriad.sun, partnerSign: partnerTriad.sun, ...sunAff };
    const moonMatch: SignMatch = { userSign: userTriad.moon, partnerSign: partnerTriad.moon, ...moonAff };
    const risingMatch: SignMatch = { userSign: userTriad.rising, partnerSign: partnerTriad.rising, ...risingAff };

    const elementBalance = getElementBalance(userTriad, partnerTriad);

    // Element balance bonus: reward variety (all 4 represented = +10, 3 = +6, 2 = +3)
    const elemCount = Object.values(elementBalance).filter(v => v > 0).length;
    const elemBonus = elemCount >= 4 ? 10 : elemCount === 3 ? 6 : elemCount === 2 ? 3 : 0;

    // Weighted overall score
    const raw = sunAff.score * 0.4 + moonAff.score * 0.35 + risingAff.score * 0.15 + elemBonus;
    const overallScore = Math.min(100, Math.round(raw));

    const tier = SCORE_TIERS.find(t => overallScore >= t.min)?.label || 'Cosmic Connection';
    const { strengths, edges } = getStrengthsAndEdges(sunMatch, moonMatch, risingMatch);

    return {
        userTriad, partnerTriad,
        sunMatch, moonMatch, risingMatch,
        elementBalance, overallScore, tier,
        strengths, growthEdges: edges,
    };
}
