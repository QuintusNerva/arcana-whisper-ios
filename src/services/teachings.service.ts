/**
 * Teachings Service — Spiritual Stories continuous learning system.
 *
 * Manages: AI Narrator guides, lesson content, progress/streak/XP tracking,
 * and context-aware personalisation (birth chart, journal, readings, intentions).
 */

import { safeStorage } from './storage.service';
import { getBirthData, getSunSign, getNatalTriad } from './astrology.service';
import { getActiveManifestations } from './manifestation.service';

// ── Keys ──────────────────────────────────────────────────────────────────────

const PROGRESS_KEY = 'arcana_teachings_progress';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Guide {
    id: string;
    name: string;
    domain: string;
    emoji: string;
    image: string;                // Avatar artwork path (in /public)
    color: string;
    tagline: string;
    personality: string;          // Voice/tone description for card text
    lessonCount: number;
}

export interface HookCard {
    type: 'hook';
    emoji: string;
    title: string;
    subtitle: string;
}

export interface TeachCard {
    type: 'teach';
    title: string;
    body: string;
    keyInsight: string;
}

export interface QuizCard {
    type: 'quiz';
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface ApplyCard {
    type: 'apply';
    title: string;
    body: string;
    prompt: string;               // Template with {intention}, {sunSign}, etc.
    xpReward: number;
}

export type StoryCard = HookCard | TeachCard | QuizCard | ApplyCard;

export interface Lesson {
    id: string;
    guideId: string;
    title: string;
    emoji: string;
    domain: string;
    cards: StoryCard[];
    xpTotal: number;
}

export interface TeachingProgress {
    completedLessons: string[];
    streakDays: number;
    lastCompletedDate: string;    // YYYY-MM-DD
    xpTotal: number;
    masteryScores: Record<string, number>;  // domain → percentage
    lastActiveLessonId?: string;
    lastActiveCardIndex?: number;
}

// ── AI Narrator Guides ────────────────────────────────────────────────────────

export const GUIDES: Guide[] = [
    {
        id: 'mystic-ra',
        name: 'Mystic Ra',
        domain: 'Astrology',
        emoji: '🧙',
        image: '/guide-mystic-ra.png',
        color: 'linear-gradient(135deg, #2d1b4e, #432c7a)',
        tagline: '"The cosmos speaks — I translate."',
        personality: 'Ancient and wise, speaks in cosmic metaphors. Reverent but never condescending. Connects celestial movements to everyday human experience.',
        lessonCount: 2,
    },
    {
        id: 'luna-tides',
        name: 'Luna Tides',
        domain: 'Moon Rituals',
        emoji: '🌊',
        image: '/guide-luna-tides.png',
        color: 'linear-gradient(135deg, #1a2a4a, #2d4a7a)',
        tagline: '"Flow with the phases."',
        personality: 'Gentle and flowing, like moonlit water. Speaks with calm authority about cycles and feminine energy. Encourages surrender and trust.',
        lessonCount: 1,
    },
    {
        id: 'earth-song',
        name: 'Earth Song',
        domain: 'Manifestation',
        emoji: '🌿',
        image: '/guide-earth-song.png',
        color: 'linear-gradient(135deg, #1a3a1a, #2d5a2d)',
        tagline: '"Ground your dreams in action."',
        personality: 'Grounded and practical. Balances spiritual insight with real-world strategy. Speaks directly — no fluff. Believes in doing, not just believing.',
        lessonCount: 9,
    },
    {
        id: 'sol-wisdom',
        name: 'Sol Wisdom',
        domain: 'Numerology',
        emoji: '✦',
        image: '/guide-sol-wisdom.png',
        color: 'linear-gradient(135deg, #3a2a0d, #5a4a1d)',
        tagline: '"Every number tells a story."',
        personality: 'Precise and illuminating. Reveals hidden patterns with mathematical elegance. Speaks as though decoding a cosmic cipher.',
        lessonCount: 3,
    },
    {
        id: 'veda-light',
        name: 'Veda Light',
        domain: 'Tarot',
        emoji: '🔮',
        image: '/guide-veda-light.png',
        color: 'linear-gradient(135deg, #3a1a2a, #5a2d4a)',
        tagline: '"The cards reveal what you already know."',
        personality: 'Intuitive and warm. Treats tarot as a mirror, not a fortune-telling device. Speaks in present tense — everything is happening now.',
        lessonCount: 7,
    },
];

// ── Lesson Content ────────────────────────────────────────────────────────────

export const LESSONS: Lesson[] = [
    // ── VEDA LIGHT — TAROT ──
    {
        id: 'moon-card-hidden-truths',
        guideId: 'veda-light',
        title: 'The Moon Card: Hidden Truths',
        emoji: '🌙',
        domain: 'Tarot',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🌙', title: 'The Moon Card', subtitle: 'What your subconscious is trying to show you' },
            { type: 'teach', title: 'The Surface Meaning', body: 'The Moon card appears when something is hidden. Not hidden by others — hidden by you, from yourself. It represents the fears, illusions, and subconscious patterns that operate beneath your awareness.\n\nUnlike The Sun (clarity), The Moon illuminates just enough to see shapes in the dark — but not enough to see them clearly. This is intentional.', keyInsight: 'The Moon doesn\'t mean something bad is happening. It means something real is surfacing.' },
            { type: 'teach', title: 'The Deeper Layer', body: 'When The Moon appears in a reading, it\'s asking you to sit with uncertainty instead of forcing an answer. The instinct is to "figure it out" — but The Moon\'s lesson is that some truths reveal themselves only when you stop chasing them.\n\nPay attention to your dreams, your gut feelings, and the emotions that arise without explanation. These are The Moon\'s messengers.', keyInsight: 'Intuition is louder in the dark. The Moon asks you to listen, not look.' },
            { type: 'teach', title: 'The Moon in Your Life', body: 'Think about an area of your life where you feel confused or uncertain right now. That confusion isn\'t a problem — it\'s The Moon doing its work.\n\nThe greatest insights often come after a period of not knowing. The Moon is the space between the question and the answer. Honoring that space — instead of rushing through it — is the practice.', keyInsight: 'Confusion is not the enemy. Rushing to escape it is.' },
            { type: 'quiz', question: 'When The Moon card appears, what is it primarily asking you to do?', options: ['Make a quick decision', 'Sit with uncertainty and trust your intuition', 'Ignore your feelings', 'Plan everything in detail'], correctIndex: 1, explanation: 'The Moon asks you to embrace not-knowing and listen to your deeper intuition rather than forcing clarity.' },
            { type: 'apply', title: 'Tonight\'s Practice', body: 'Before you sleep tonight, ask yourself one question about an area of uncertainty in your life. Don\'t try to answer it. Just hold it gently and let your subconscious work with it overnight.', prompt: '{intentionRef}What hidden truth is trying to surface for you right now? Write it in your journal.', xpReward: 15 },
        ],
    },
    {
        id: 'major-minor-arcana',
        guideId: 'veda-light',
        title: 'Major vs Minor Arcana',
        emoji: '🃏',
        domain: 'Tarot',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🃏', title: 'Two Worlds, One Deck', subtitle: 'The architecture behind every tarot reading' },
            { type: 'teach', title: 'The Big Picture: Major Arcana', body: 'The 22 Major Arcana cards represent life\'s big spiritual lessons — the soul-level themes that shape who you\'re becoming. The Fool\'s journey from 0 to XXI mirrors your own journey through life\'s major chapters.\n\nWhen a Major appears in your reading, the universe is saying: "Pay attention. This is a turning point."', keyInsight: 'Majors = soul lessons. They don\'t appear casually — they appear when something significant is in motion.' },
            { type: 'teach', title: 'The Daily: Minor Arcana', body: 'The 56 Minor Arcana cards deal with everyday life — the choices, emotions, struggles, and small victories that fill your days. They\'re organized into four suits:\n\n• Cups = emotions and relationships\n• Wands = passion, creativity, and action\n• Swords = mind, truth, and conflict\n• Pentacles = money, body, and material world', keyInsight: 'Minors = daily life. They show you what\'s happening right now, not what\'s destined.' },
            { type: 'teach', title: 'Reading the Balance', body: 'A reading full of Majors? You\'re in a massive growth period. The universe is actively sculpting your path.\n\nA reading full of Minors? You have agency. The details are in your hands — small decisions are adding up.\n\nThe most powerful readings have both — cosmic forces meeting human choice.', keyInsight: 'Check the ratio. It tells you how much is "fated" versus how much is in your hands right now.' },
            { type: 'quiz', question: 'Which suit represents emotions and relationships?', options: ['Swords', 'Wands', 'Cups', 'Pentacles'], correctIndex: 2, explanation: 'Cups represent the emotional realm — love, intuition, relationships, and the flow of feelings.' },
            { type: 'apply', title: 'Reflect on Your Last Reading', body: '{readingRef}Look at the last tarot reading you did. How many Major vs Minor cards appeared? What does that ratio tell you about this season of your life?', prompt: 'Journal prompt: "The balance of Major and Minor in my readings is telling me..."', xpReward: 15 },
        ],
    },
    {
        id: 'fools-journey',
        guideId: 'veda-light',
        title: 'The Fool\'s Journey',
        emoji: '🎭',
        domain: 'Tarot',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🎭', title: 'The Fool\'s Journey', subtitle: 'The 22 Major Arcana tell one epic story — the story of your soul\'s evolution' },
            { type: 'teach', title: 'The Story Begins', body: 'The 22 Major Arcana cards aren\'t random. They\'re a single story — The Fool\'s Journey — that maps the entire arc of spiritual evolution. It starts with The Fool (0), a soul leaping into the unknown with nothing but trust and a bindle.\n\nFrom there, The Fool meets The Magician (skill), The High Priestess (intuition), The Empress (abundance), The Emperor (structure). Each Major card is a teacher the soul encounters on its path.\n\nKnowing the journey transforms how you read Majors — each card isn\'t just a meaning, it\'s a chapter.', keyInsight: 'The Major Arcana is a story, not a list. Every card is a chapter in the soul\'s evolution from innocence to wholeness.' },
            { type: 'teach', title: 'The Three Acts', body: 'The Fool\'s Journey has three acts:\n\n• Act I (0-VII): The Material World — learning about identity, willpower, tradition, love, and choice. These cards deal with building your external life.\n\n• Act II (VIII-XIV): The Inner Journey — strength, solitude, fate, justice, surrender, and balance. This is where the soul turns inward.\n\n• Act III (XV-XXI): Spiritual Transformation — facing the shadow (Devil), ego collapse (Tower), renewal (Star), illusion (Moon), clarity (Sun), judgment, and finally wholeness (The World).', keyInsight: 'Act I builds the life. Act II questions it. Act III transforms it. Every human journey follows this arc.' },
            { type: 'teach', title: 'Where Are You Now?', body: '{intentionRef}Here\'s why this matters for YOUR readings: when a Major card appears, it\'s not just telling you about a topic — it\'s telling you where YOU are in The Fool\'s Journey right now.\n\nPulling The Tower? You\'re in Act III — old structures are collapsing to make room for something real. Pulling The Lovers? You\'re in Act I — making foundational choices about values and relationships.\n\nEach card is a GPS pin on the soul\'s map. Know the journey, and you\'ll always know where you are.', keyInsight: 'A Major Arcana card tells you WHERE you are in your spiritual evolution — not just what\'s happening.' },
            { type: 'quiz', question: 'What does The Fool represent in the Major Arcana journey?', options: ['Foolishness and poor decisions', 'The end of a spiritual cycle', 'The beginning of the soul\'s journey — pure potential and trust', 'Material success and accomplishment'], correctIndex: 2, explanation: 'The Fool (card 0) represents the soul at the start of its journey — full of potential, ready to leap into the unknown with innocent trust.' },
            { type: 'apply', title: 'Map Your Chapter', body: '{intentionRef}Think about the last Major Arcana card that appeared in your reading. Where does it fall in the three acts? What does that tell you about where you are in your current life chapter?', prompt: 'Which act of The Fool\'s Journey does your life feel like right now? What teacher are you currently learning from?', xpReward: 15 },
        ],
    },
    {
        id: 'court-cards-decoded',
        guideId: 'veda-light',
        title: 'Court Cards Decoded',
        emoji: '👑',
        domain: 'Tarot',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '👑', title: 'The Court Cards', subtitle: 'Pages, Knights, Queens, and Kings — the personality archetypes most readers skip (and shouldn\'t)' },
            { type: 'teach', title: 'Why People Struggle', body: 'The 16 Court Cards are the most confusing part of tarot for beginners. Are they people? Energies? Advice? The answer: all three.\n\nCourt cards can show up as:\n• A real person in your life (your bossy King of Swords manager)\n• An energy you\'re embodying right now (Page of Cups = playful emotional curiosity)\n• An invitation to step into that archetype\n\nThe trick is context. In a reading about relationships, a Court card likely represents a person. In a reading about personal growth, it\'s an energy you\'re being called to embody.', keyInsight: 'Court cards are shape-shifters. They represent people, energies, or invitations depending on the question you asked.' },
            { type: 'teach', title: 'The Four Ranks', body: 'Think of the four ranks as maturity levels of each element:\n\n• Pages = the student. Curious, eager, learning, sometimes naive. Fresh energy arriving.\n• Knights = the warrior. Action, passion, sometimes reckless. Moving fast toward a goal.\n• Queens = the nurturer. Mastery turned inward. Deep understanding, emotional intelligence, inner authority.\n• Kings = the leader. Mastery turned outward. Command, responsibility, structured power.\n\nA Page of Pentacles and a King of Pentacles both deal with material world energy — but one is just starting to learn about money while the other has mastered it.', keyInsight: 'Pages are learning it. Knights are chasing it. Queens have embodied it. Kings are leading with it.' },
            { type: 'teach', title: 'Reading Court Cards in Practice', body: '{birthChartRef}Quick framework for reading Court Cards:\n\n1. Check the suit — which element is active? (Cups = emotional, Swords = mental, Wands = creative, Pentacles = material)\n2. Check the rank — what maturity level? (beginning, action, mastery, leadership)\n3. Ask: "Is this a person in my life, or an energy I\'m being called to embody?"\n\nPro tip: Court cards paired together in a spread often represent a relationship dynamic. A Queen of Cups next to a Knight of Swords? That\'s emotional depth meeting impulsive thinking — tension is inevitable.', keyInsight: 'Suit tells you WHAT realm. Rank tells you HOW developed. Together they paint a personality portrait.' },
            { type: 'quiz', question: 'What is the difference between a Queen and a King in tarot?', options: ['Queens are weaker than Kings', 'Queens represent mastery turned inward; Kings represent mastery turned outward', 'Queens only represent women; Kings only represent men', 'There is no meaningful difference'], correctIndex: 1, explanation: 'Queens embody inward mastery — deep emotional intelligence and inner authority. Kings embody outward mastery — leadership, structure, and external command.' },
            { type: 'apply', title: 'Identify Your Court Card', body: 'Based on where you are in life right now, which Court Card do you most embody? Consider both the suit (what area of life is most active) and the rank (are you learning, charging ahead, mastering, or leading?).', prompt: '{intentionRef}Which Court Card energy would help you most in pursuing your current intention? Are you being the Page when you need to be the Queen?', xpReward: 15 },
        ],
    },
    {
        id: 'reading-reversals',
        guideId: 'veda-light',
        title: 'Reading Reversals',
        emoji: '🔄',
        domain: 'Tarot',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🔄', title: 'The Upside-Down Cards', subtitle: 'Reversed cards aren\'t bad news — they\'re the cards whispering instead of shouting' },
            { type: 'teach', title: 'The Fear of Reversals', body: 'Let\'s kill the biggest myth in tarot: reversed cards do NOT mean the opposite of the upright meaning. They\'re not "bad" versions.\n\nA reversed card is the same energy — but internalized, blocked, delayed, or expressed in a shadow form. Think of it like a dimmer switch, not an off switch. The energy is still there; it\'s just operating differently.\n\nSome readers don\'t even use reversals — and that\'s fine. But learning them adds an entire dimension of nuance to your readings.', keyInsight: 'Reversals aren\'t the opposite. They\'re the same energy turned inward, blocked, or operating in the shadows.' },
            { type: 'teach', title: 'The Four Flavors of Reversals', body: 'When a card appears reversed, it\'s usually expressing one of four flavors:\n\n1. Internal — the energy is present but happening inside you, privately. (Reversed Strength = quiet inner courage, not visible to others)\n\n2. Blocked — the energy wants to flow but something is blocking it. (Reversed Ace of Cups = emotional openness that\'s being suppressed)\n\n3. Delayed — the energy is coming, just not yet. (Reversed Six of Wands = recognition is on its way, be patient)\n\n4. Shadow — the unhealthy expression of the card\'s energy. (Reversed Emperor = control becoming tyranny)\n\nContext matters. Let your intuition guide which flavor fits.', keyInsight: 'Internal, blocked, delayed, or shadow — these four flavors cover 90% of all reversal readings.' },
            { type: 'teach', title: 'Practical Reversal Reading', body: '{readingRef}Here\'s how to actually read a reversal:\n\n1. First — read the upright meaning. Know what the card is about.\n2. Then — ask: "How might this energy be internalized, blocked, or expressing its shadow?"\n3. Check surrounding cards — they\'ll tell you which flavor applies.\n4. Trust your gut — your first instinct about a reversal is usually right.\n\nExample: The Sun reversed doesn\'t mean darkness. It might mean: the joy is there but you\'re not letting yourself feel it (blocked). Or you\'re privately happy but not showing it (internal). Or the breakthrough is coming, just delayed.', keyInsight: 'Read the upright first. Then ask which flavor of reversal fits the situation. Surrounding cards confirm.' },
            { type: 'quiz', question: 'When a card appears reversed, it usually means:', options: ['The exact opposite of the upright meaning', 'The energy is internalized, blocked, delayed, or in its shadow form', 'Something bad is about to happen', 'You shuffled incorrectly'], correctIndex: 1, explanation: 'Reversals represent the same energy but expressed differently — internalized, blocked, delayed, or in its shadow form. They\'re not bad, they\'re nuanced.' },
            { type: 'apply', title: 'Reread a Reversal', body: '{readingRef}Think about the last reversed card you received in a reading. Using the four flavors (internal, blocked, delayed, shadow), which interpretation feels most accurate? How does that change the message?', prompt: '{intentionRef}If you pulled a reversal related to your current intention, which flavor would it be? What needs to unblock?', xpReward: 15 },
        ],
    },
    {
        id: 'three-card-foundation',
        guideId: 'veda-light',
        title: 'The 3-Card Foundation',
        emoji: '🃏',
        domain: 'Tarot',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🃏', title: '3 Cards, Infinite Power', subtitle: 'The simplest spread that gives the most powerful readings — no experience needed' },
            { type: 'teach', title: 'Why 3 Cards?', body: 'You don\'t need a Celtic Cross to get a powerful reading. Three cards, laid in a row, can answer almost any question with stunning clarity.\n\nWhy three? Because three creates a narrative. One card is a snapshot. Two cards create tension. But three cards tell a story — beginning, middle, end. Problem, bridge, resolution. This is how meaning is made.\n\nThe 3-card spread is the most used layout by professional readers. Not because it\'s beginner-level — because it\'s the right tool for most questions.', keyInsight: 'Three cards create a story. One card is a statement. Two is a debate. Three is a narrative with direction.' },
            { type: 'teach', title: 'Five Ways to Read 3 Cards', body: 'The same 3-card layout works with different lenses:\n\n1. Past / Present / Future — the classic. Shows the trajectory.\n2. Situation / Action / Outcome — for decisions. What\'s happening, what to do, what follows.\n3. Mind / Body / Spirit — for check-ins. Where your three centers are right now.\n4. You / The Other Person / The Relationship — for connections.\n5. What to Keep / What to Release / What\'s Coming — for transitions.\n\nSame three positions — different questions. The spread doesn\'t change. Your intention does.', keyInsight: 'The lens you assign to each position shapes the entire reading. Same cards, different question = different wisdom.' },
            { type: 'teach', title: 'Reading the Story', body: '{readingRef}The magic of 3-card readings is in the connections between cards. Don\'t read them as three separate messages — read them as chapters of one story.\n\nLook for:\n• Flow — do the cards build logically? (Challenge → Effort → Success)\n• Tension — do they conflict? (Joy → Fear → Unknown) That conflict IS the message.\n• Repetition — same suit? Same numbers? The deck is emphasizing something.\n• The middle card — it\'s the bridge. It connects past to future, problem to solution. It\'s often the action step.', keyInsight: 'The middle card is the key. It\'s the bridge, the turning point, the action that connects where you\'ve been to where you\'re going.' },
            { type: 'quiz', question: 'In a Situation/Action/Outcome spread, which card position reveals what you should DO?', options: ['Card 1 (Situation)', 'Card 2 (Action)', 'Card 3 (Outcome)', 'All three equally'], correctIndex: 1, explanation: 'The middle card in a Situation/Action/Outcome spread is the bridge — it reveals the action or approach that connects the current situation to its resolution.' },
            { type: 'apply', title: 'Pull Three Cards Now', body: '{intentionRef}Open a new reading in the app using 3 cards. Before you pull, set your lens: will this be Past/Present/Future or Situation/Action/Outcome? After pulling, read the STORY — how do the three cards connect?', prompt: 'What story did your 3 cards tell? What was the middle card\'s message — the bridge between where you are and where you\'re headed?', xpReward: 15 },
        ],
    },
    {
        id: 'scary-cards-arent-scary',
        guideId: 'veda-light',
        title: 'Scary Cards Aren\'t Scary',
        emoji: '💀',
        domain: 'Tarot',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '💀', title: 'The Cards You Fear Most', subtitle: 'Death, The Tower, The Devil — why the scariest cards are often the biggest gifts' },
            { type: 'teach', title: 'Death (XIII): Not What You Think', body: 'Let\'s start with the big one. The Death card almost never means physical death. In thousands of readings, it means: transformation. Something IS ending — a relationship, a mindset, a chapter, an identity — but the ending is making room for what\'s next.\n\nDeath is the composting card. What was must decay so something new can grow. The old version of you has to die for the next version to be born.\n\nIf you pull Death, ask: "What am I being asked to release? What\'s composting into something new?"', keyInsight: 'Death = transformation, not termination. Something old is ending to feed something new. Let it go.' },
            { type: 'teach', title: 'The Tower (XVI): Necessary Destruction', body: 'The Tower shows a structure being struck by lightning, people falling, flames everywhere. Terrifying imagery — and one of the most liberating cards in the deck.\n\nThe Tower destroys what was built on a false foundation. It\'s not punishment. It\'s liberation. That relationship you were forcing? That career that wasn\'t really you? That belief about yourself that was never true? Lightning finds the lies.\n\nThe Tower hurts because truth hurts. But everything it destroys needed to fall. What remains is real.', keyInsight: 'The Tower doesn\'t destroy what\'s real. It destroys what was built on illusion. What survives the lightning is the truth.' },
            { type: 'teach', title: 'The Devil (XV): Awareness, Not Evil', body: 'The Devil card shows two figures chained to a pedestal — but look closely. The chains are loose. They could leave at any time. They CHOOSE to stay.\n\nThe Devil isn\'t about evil. It\'s about the addictions, attachments, and unhealthy patterns you\'re clinging to by choice. It\'s the job you hate but won\'t leave. The relationship that\'s toxic but comfortable. The belief that keeps you small.\n\nThe Devil\'s gift: awareness. Once you see the chains are loose, you can walk away.', keyInsight: 'The Devil shows you what you\'re enslaved to by choice. The chains are loose. You can leave whenever you decide to.' },
            { type: 'quiz', question: 'What do Death, The Tower, and The Devil all have in common?', options: ['They predict bad luck', 'They all relate to literal danger', 'They represent transformation, liberation, and awareness — moments of profound growth', 'They should be removed from the deck'], correctIndex: 2, explanation: 'The "scary" cards are catalysts: Death brings transformation, The Tower brings liberation from illusion, and The Devil brings awareness of self-imposed chains.' },
            { type: 'apply', title: 'Befriend a Scary Card', body: '{intentionRef}Choose one of the three "scary" cards: Death, Tower, or Devil. Think about a time in your life when its energy actually showed up — an ending that led to a beginning, a painful truth that set you free, or a pattern you finally saw clearly.', prompt: 'Which "scary" card energy is most active in your life right now? What is it trying to show you?', xpReward: 15 },
        ],
    },

    // ── MYSTIC RA — ASTROLOGY ──
    {
        id: 'houses-of-zodiac',
        guideId: 'mystic-ra',
        title: 'Houses of the Zodiac',
        emoji: '🏛️',
        domain: 'Astrology',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🏛️', title: 'The 12 Houses', subtitle: 'Your cosmic blueprint has rooms — each one governs a different part of your life' },
            { type: 'teach', title: 'What Are Houses?', body: 'Imagine your birth chart as a 12-room mansion. Each room (house) governs a specific area of your life. The sign on each house\'s doorway shapes how you experience that area.\n\nThe planets are the characters — they live in these rooms and bring their energy to whatever house they occupy.', keyInsight: 'Signs = how. Houses = where. Planets = what. All three work together.' },
            { type: 'teach', title: 'The Angular Houses', body: 'Four houses are the most powerful — the Angular houses:\n\n• 1st House (Ascendant): Your identity, appearance, first impressions\n• 4th House (IC): Home, family, emotional foundation\n• 7th House (Descendant): Partnerships, marriage, the "other"\n• 10th House (Midheaven): Career, public reputation, legacy\n\nPlanets in these houses have the most visible impact on your life.', keyInsight: 'The 1st, 4th, 7th, and 10th houses are your life\'s four pillars. Everything else orbits them.' },
            { type: 'teach', title: 'Your Chart, Your Houses', body: '{birthChartRef}The sign on your 1st house (your Rising sign) sets the entire wheel in motion. It determines which signs govern all 12 of your houses.\n\nWhen a transit planet moves through one of your houses, that area of life gets activated. This is why professional astrologers look at house placements — they show where the cosmic energy is landing in YOUR specific life.', keyInsight: 'Your Rising sign is the master key — it determines the layout of your entire chart.' },
            { type: 'quiz', question: 'Which house governs career and public reputation?', options: ['1st House', '7th House', '10th House', '12th House'], correctIndex: 2, explanation: 'The 10th House (Midheaven) is the highest point in your chart — it governs your career, public image, and the legacy you build.' },
            { type: 'apply', title: 'Map Your Houses', body: '{birthChartRef}Look at your birth chart in the Cosmic Blueprint. Which sign is on your 10th house (career)? How does that sign\'s energy show up in your professional life?', prompt: '{intentionRef}How might understanding your house placements change how you approach your current goals?', xpReward: 15 },
        ],
    },
    {
        id: 'your-rising-sign',
        guideId: 'mystic-ra',
        title: 'Your Rising Sign',
        emoji: '🌅',
        domain: 'Astrology',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🌅', title: 'The Mask & The Mission', subtitle: 'Your Rising sign isn\'t just your appearance — it\'s your soul\'s strategy' },
            { type: 'teach', title: 'Beyond Sun Signs', body: 'Most people know their Sun sign — the core of who they are. But your Rising sign (Ascendant) is equally important. It\'s the sign that was on the eastern horizon at the exact moment you were born.\n\nThink of it this way: your Sun is who you are. Your Rising is how you approach the world and how the world first sees you.', keyInsight: 'Your Sun is your essence. Your Rising is your strategy for navigating life.' },
            { type: 'teach', title: 'The Three Layers', body: '{birthChartRef}Your cosmic identity has three core layers:\n\n• Sun Sign = your core self, your ego, your life force\n• Moon Sign = your emotional landscape, what you need to feel safe\n• Rising Sign = your outward approach, how you initiate, your first impression\n\nAll three work together. Knowing just your Sun sign is like reading one chapter of a book.', keyInsight: 'Sun + Moon + Rising = your natal triad. This is the minimum for understanding yourself cosmically.' },
            { type: 'teach', title: 'Living Your Rising', body: '{birthChartRef}Your Rising sign influences your physical appearance, your personal style, and the types of experiences you attract. It\'s also the lens through which you filter every new situation.\n\nPeople with fire risings (Aries, Leo, Sagittarius) charge into new situations. Water risings (Cancer, Scorpio, Pisces) feel their way in. Air risings think. Earth risings assess.', keyInsight: 'How you enter a room, start a project, or meet someone new — that\'s your Rising sign in action.' },
            { type: 'quiz', question: 'What determines your Rising sign?', options: ['Your birth month', 'The sign on the eastern horizon at your birth', 'Your parents\' signs', 'The moon phase when you were born'], correctIndex: 1, explanation: 'Your Rising sign is the zodiac sign that was rising on the eastern horizon at the exact moment of your birth — which is why birth time is so important.' },
            { type: 'apply', title: 'Observe Your Rising', body: '{birthChartRef}For the next 24 hours, notice how you initiate conversations, enter new environments, and present yourself. This is your Rising sign expressing itself.', prompt: '{intentionRef}How does your Rising sign influence the way you pursue what you\'re calling in?', xpReward: 15 },
        ],
    },

    // ── SOL WISDOM — NUMEROLOGY ──
    {
        id: 'life-path-numbers',
        guideId: 'sol-wisdom',
        title: 'Life Path Numbers',
        emoji: '🔢',
        domain: 'Numerology',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🔢', title: 'Your Life Path', subtitle: 'The single most important number in your numerology chart' },
            { type: 'teach', title: 'Calculating Your Path', body: 'Your Life Path number is derived from your full birth date. You add each digit together, then reduce to a single digit (unless you hit 11, 22, or 33 — those are Master Numbers).\n\nExample: March 15, 1990 → 3 + 1 + 5 + 1 + 9 + 9 + 0 = 28 → 2 + 8 = 10 → 1 + 0 = Life Path 1.\n\nThis number reveals the central theme of your entire life journey.', keyInsight: 'Your Life Path is NOT who you are — it\'s the road you\'re walking. It shapes your lessons, gifts, and challenges.' },
            { type: 'teach', title: 'The Nine Paths', body: '• 1 — The Pioneer: independence, leadership, originality\n• 2 — The Mediator: partnership, sensitivity, balance\n• 3 — The Communicator: creativity, expression, joy\n• 4 — The Builder: structure, discipline, foundation\n• 5 — The Adventurer: freedom, change, experience\n• 6 — The Nurturer: service, responsibility, love\n• 7 — The Seeker: wisdom, introspection, spirituality\n• 8 — The Powerhouse: abundance, authority, mastery\n• 9 — The Humanitarian: compassion, completion, wisdom', keyInsight: 'Each number carries both a gift and a shadow. The 8 builds empires but can become controlling. The 7 sees truth but can isolate.' },
            { type: 'teach', title: 'Living Your Number', body: 'Your Life Path doesn\'t limit you — it focuses you. A Life Path 5 who tries to live like a 4 (rigid structure) will feel suffocated. A 4 who tries to live like a 5 (constant change) will feel ungrounded.\n\nThe magic happens when you lean INTO your number\'s energy instead of fighting it. Your number isn\'t a cage — it\'s a compass.', keyInsight: 'Stop fighting your natural frequency. Start amplifying it.' },
            { type: 'quiz', question: 'What does a Life Path 7 primarily embody?', options: ['Leadership and independence', 'Creativity and expression', 'Wisdom, introspection, and spirituality', 'Abundance and authority'], correctIndex: 2, explanation: 'Life Path 7 is the seeker — driven by a deep need to understand truth, find meaning, and connect with the spiritual dimension of life.' },
            { type: 'apply', title: 'Calculate Your Number', body: 'Add up every digit in your birthdate and keep reducing until you reach a single digit (or 11, 22, 33). Then ask: "Where am I fighting this energy instead of flowing with it?"', prompt: '{intentionRef}How does your Life Path number connect to what you\'re currently manifesting?', xpReward: 15 },
        ],
    },
    {
        id: 'master-numbers',
        guideId: 'sol-wisdom',
        title: 'Master Numbers: 11, 22, 33',
        emoji: '⚡',
        domain: 'Numerology',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '⚡', title: 'Master Numbers', subtitle: 'The most powerful — and most challenging — numbers in numerology' },
            { type: 'teach', title: 'Why They\'re Special', body: 'In numerology, most multi-digit numbers reduce to single digits: 28 → 10 → 1. But three numbers are never reduced: 11, 22, and 33. These are Master Numbers.\n\nThey carry double the energy of their root number (1, 2, 3) but also double the pressure. Having a Master Number in your chart is both a gift and a responsibility.', keyInsight: 'Master Numbers aren\'t "better" — they\'re higher voltage. More power, but also more intensity to handle.' },
            { type: 'teach', title: 'The Three Masters', body: '• 11 — The Intuitive Visionary: Heightened intuition, spiritual insight, nervous energy. The channel between the physical and spiritual. Challenge: anxiety, self-doubt.\n\n• 22 — The Master Builder: Can turn visions into physical reality at massive scale. The architect of the impossible. Challenge: overwhelm, paralysis.\n\n• 33 — The Master Teacher: Embodies unconditional love and healing. The most selfless number. Challenge: martyrdom, carrying others\' pain.', keyInsight: '11 sees the vision. 22 builds it. 33 teaches it to the world.' },
            { type: 'teach', title: 'Living With Master Energy', body: 'If you have a Master Number, you may feel like you\'re "too much" — too sensitive (11), too driven (22), or too caring (33). That intensity isn\'t a flaw. It\'s your frequency.\n\nThe key is grounding. Master Numbers need practices that channel their energy: meditation for 11s, project work for 22s, boundaries for 33s.', keyInsight: 'The practice for every Master Number: channel, don\'t suppress. Ground, don\'t dimm.' },
            { type: 'quiz', question: 'What is Master Number 22 known as?', options: ['The Intuitive Visionary', 'The Master Builder', 'The Master Teacher', 'The Seeker'], correctIndex: 1, explanation: 'Master Number 22 is the Master Builder — capable of turning spiritual vision into physical, large-scale reality.' },
            { type: 'apply', title: 'Find Your Masters', body: 'Check your birth date calculation. Do you have an 11, 22, or 33 before reducing? Even if your Life Path isn\'t a Master Number, check your birth day and birth month for master energy.', prompt: '{intentionRef}If you carry master energy, how does it show up in your daily life?', xpReward: 15 },
        ],
    },
    {
        id: 'destiny-number',
        guideId: 'sol-wisdom',
        title: 'Your Destiny Number',
        emoji: '✦',
        domain: 'Numerology',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '✦', title: 'Your Destiny Number', subtitle: 'Your name isn\'t a coincidence — it\'s a numerical code that reveals how you\'ll express your purpose' },
            { type: 'teach', title: 'The Pythagorean Cipher', body: 'Over 2,500 years ago, Pythagoras — the father of modern mathematics — mapped every letter to a number. This system is still used in numerology today:\n\n1 = A, J, S\n2 = B, K, T\n3 = C, L, U\n4 = D, M, V\n5 = E, N, W\n6 = F, O, X\n7 = G, P, Y\n8 = H, Q, Z\n9 = I, R\n\nEvery letter in your name carries a vibrational frequency. When you add them together, they reveal your Destiny Number — the blueprint for how you express your life\'s purpose.', keyInsight: 'Your name is not an accident. According to Pythagoras, it\'s a mathematical code that encodes how you\'ll express your soul\'s mission.' },
            { type: 'teach', title: 'How to Calculate It', body: 'To find your Destiny Number, use your FULL birth name (first, middle, last). Convert each letter using the Pythagorean chart, then reduce each name to a single digit, and add the results:\n\nExample: ALIZA KELLY\nALIZA → 1+3+9+8+1 = 22 → 2+2 = 4\nKELLY → 2+5+3+3+7 = 20 → 2+0 = 2\nDestiny Number = 4+2 = 6\n\nImportant: if you hit 11, 22, or 33 during reduction, STOP — that\'s a Master Number Destiny, which carries amplified energy.\n\nUse your birth certificate name, not a nickname or married name. The vibration you were born into is the one that counts.', keyInsight: 'Use your full birth name — the name on your birth certificate. This is the vibration the universe assigned you.' },
            { type: 'teach', title: 'Life Path × Destiny', body: 'Your Life Path reveals your PURPOSE — the road you\'re walking. Your Destiny Number reveals your METHOD — how you\'ll express that purpose.\n\nFor example: a Life Path 8 (abundance, authority) with a Destiny Number 6 (nurture, healing) would build their empire through caring for others — perhaps in healthcare, counseling, or community building.\n\nA Life Path 1 (independence) with a Destiny Number 3 (expression) would pioneer through creative work — writing, art, or performance.\n\nTogether, they tell the complete story: WHAT you\'re here to do and HOW you\'ll do it.', keyInsight: 'Life Path = WHAT you\'re here for. Destiny Number = HOW you\'ll express it. Together, they\'re your full numerological operating system.' },
            { type: 'quiz', question: 'What is the difference between Life Path and Destiny Number?', options: ['They\'re the same thing', 'Life Path reveals your purpose; Destiny Number reveals how you\'ll express it', 'Destiny Number is more important', 'Life Path comes from your name, Destiny from your birthday'], correctIndex: 1, explanation: 'Life Path (from birthday) is your greater purpose — the road you walk. Destiny Number (from your name) is how you express that purpose in the world.' },
            { type: 'apply', title: 'Calculate Your Destiny', body: 'Using the Pythagorean chart (1=AJS, 2=BKT, 3=CLU, 4=DMV, 5=ENW, 6=FOX, 7=GPY, 8=HQZ, 9=IR), calculate the Destiny Number of your full birth name. Then compare it to your Life Path.', prompt: 'What is your Destiny Number? How does it connect to the way you naturally express your Life Path purpose?', xpReward: 15 },
        ],
    },

    // ── LUNA TIDES — MOON ──
    {
        id: 'new-moon-rituals',
        guideId: 'luna-tides',
        title: 'New Moon Rituals',
        emoji: '🌑',
        domain: 'Moon',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🌑', title: 'The New Moon', subtitle: 'The most powerful time to plant new intentions' },
            { type: 'teach', title: 'Why the New Moon Matters', body: 'The New Moon is darkness — and darkness is where seeds germinate. Every lunar cycle begins with this invisible moment of potential. It\'s the cosmos pressing reset.\n\nIn every culture that has tracked the moon, the New Moon has been the time for beginning. Not because of superstition — because of rhythm. Starting something when the energy is rising gives it natural momentum.', keyInsight: 'The New Moon is nature\'s start button. Working with it means swimming with the current instead of against it.' },
            { type: 'teach', title: 'Setting Intentions', body: 'A New Moon intention isn\'t a wish — it\'s a declaration. The difference:\n\n• Wish: "I hope I get more money"\n• Intention: "I am calling in financial clarity and abundance this cycle"\n\nThe practice is simple: on the night of the New Moon (or within 48 hours), write your intentions by hand. Be specific. Feel them as already arriving. Then release the paper or keep it on your altar.', keyInsight: 'Write your intention as though it\'s already unfolding. "I am calling in..." not "I want..."' },
            { type: 'teach', title: 'A Simple Ritual', body: '1. Clear your space — light a candle, burn sage or palo santo\n2. Sit quietly for 3 minutes. Breathe. Arrive.\n3. Write 1-3 intentions for this lunar cycle\n4. Read them aloud. Feel the energy of each one\n5. Place on your altar or somewhere sacred\n6. Close by saying: "I trust the timing of my life"\n\nThe power isn\'t in the ritual itself — it\'s in the focused attention you bring to it.', keyInsight: 'Ritual is focussed attention meeting intention. That\'s it. No tools required — just presence.' },
            { type: 'quiz', question: 'How should a New Moon intention be phrased?', options: ['As a hope or wish', 'As a declaration — "I am calling in..."', 'As a question to the universe', 'As a list of complaints'], correctIndex: 1, explanation: 'New Moon intentions work best as declarations — present tense, specific, carrying the energy of something already in motion.' },
            { type: 'apply', title: 'Your Personal Ritual', body: '{intentionRef}Whether tonight is a New Moon or not, write one intention for this lunar cycle. Use the format: "I am calling in ___."', prompt: 'Connect this to your current altar intention. What would it mean to align your lunar practice with what you\'re already manifesting?', xpReward: 15 },
        ],
    },

    // ── EARTH SONG — MANIFESTATION ──
    {
        id: 'two-part-formula',
        guideId: 'earth-song',
        title: 'The Two-Part Formula',
        emoji: '⚗️',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '⚗️', title: 'Intention × Alignment', subtitle: 'The real equation behind manifestation — no fluff, no magic, just mechanics' },
            { type: 'teach', title: 'The Missing Half', body: 'Most people treat manifestation like ordering from a menu: state what you want, then wait. That\'s half the formula.\n\nThe full equation is: Intention × Alignment. Intention is the what — the specific outcome you\'re calling in. Alignment is the who — becoming the version of yourself for whom this outcome is natural.\n\nYou need both. Intention without alignment is a radio transmitting on one frequency while you live on another.', keyInsight: 'Intention = the signal you send. Alignment = the frequency you live on. They must match.' },
            { type: 'teach', title: 'What Alignment Looks Like', body: 'Alignment isn\'t mystical. It\'s practical.\n\nIf you\'re manifesting financial abundance but your daily habits scream scarcity — bargain hunting out of fear, avoiding looking at your bank account, telling yourself "I can\'t afford that" — you\'re out of alignment.\n\nAlignment means: your beliefs, your behaviour, and your energy match what you say you want. Not perfectly. But directionally.', keyInsight: 'Check your behaviour, not your vision board. What you DO reveals your real beliefs.' },
            { type: 'teach', title: 'The Bridge Practice', body: '{intentionRef}Here\'s the practice that ties it all together:\n\n1. Write your intention (the what)\n2. Ask: "What would someone who already has this believe about themselves?"\n3. Start believing that today\n4. Take one aligned action — however small\n\nAlignment is a decision, not a consequence. You don\'t wait to feel worthy. You decide to be worthy, and act accordingly.', keyInsight: 'Alignment is a decision you make today — not a reward you earn after manifesting.' },
            { type: 'quiz', question: 'What is the full manifestation equation?', options: ['Desire + Patience', 'Intention × Alignment', 'Hoping + Waiting', 'Clarity + Luck'], correctIndex: 1, explanation: 'The complete formula is Intention × Alignment — having a clear signal AND living on the matching frequency.' },
            { type: 'apply', title: 'Check Your Alignment', body: '{intentionRef}Take your current active intention and ask: "What would I believe about myself if this were already true?" Write that belief down. Then notice where your daily behaviour contradicts it.', prompt: 'Where is your biggest alignment gap right now — the space between what you want and who you\'re being?', xpReward: 15 },
        ],
    },
    {
        id: 'scripting-your-future',
        guideId: 'earth-song',
        title: 'Scripting: Write Your Future',
        emoji: '📝',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '📝', title: 'Scripting', subtitle: 'The practice of writing as your future self — and why your brain can\'t tell the difference' },
            { type: 'teach', title: 'What Is Scripting?', body: 'Scripting is writing about your desires as if they\'ve already happened. First-person, present tense, full of detail and emotion.\n\nThis isn\'t positive thinking. It\'s neural programming. When you write "I just signed the lease on my dream apartment and I can\'t believe the natural light in the kitchen" — your brain fires the same neural pathways as if it were happening.\n\nRepetition wires these pathways deeper. Your subconscious starts searching for evidence that matches the story you\'re telling it.', keyInsight: 'Your brain doesn\'t distinguish between a vividly imagined experience and a real one. Scripting exploits this.' },
            { type: 'teach', title: 'How to Script Effectively', body: 'The difference between a wish list and a script:\n\n• Wish list: "I want a promotion"\n• Script: "I just got the call — I\'m the new Director. I\'m sitting at my desk, tears in my eyes, calling my mom to tell her. She\'s screaming. I can\'t stop smiling."\n\nKeys to powerful scripting:\n1. First person — "I am", "I have", "I feel"\n2. Present tense — it\'s happening NOW\n3. Sensory detail — what do you see, hear, feel, smell?\n4. Emotion — how does this make you FEEL?\n5. Gratitude — thank the universe as if it\'s already done', keyInsight: 'Details + emotion = belief. Vague scripts produce vague results.' },
            { type: 'teach', title: 'When Scripting Doesn\'t Work', body: 'Scripting fails when you write what you think you should want instead of what you actually want. If your heart isn\'t in it, your subconscious knows.\n\nIt also fails when you script and then immediately contradict it with inner dialogue: "I\'m so successful" → closes notebook → "Yeah, right."\n\nThe practice isn\'t about lying to yourself. It\'s about rehearsing the version of reality you\'re choosing to move toward. If doubt comes up, that\'s information — it shows you the belief that needs to shift.', keyInsight: 'Script what you genuinely want, not what sounds impressive. And when doubt surfaces, write through it.' },
            { type: 'quiz', question: 'What makes scripting different from a wish list?', options: ['It uses bullet points', 'It\'s written in past tense', 'It\'s written in first-person present tense with sensory and emotional detail', 'It\'s shared with others'], correctIndex: 2, explanation: 'Scripting is written as first-person, present tense, with vivid sensory detail and genuine emotion — as though you\'re living the experience right now.' },
            { type: 'apply', title: 'Write Your First Script', body: '{intentionRef}Take your current intention and write a 5-sentence script as your future self who already has it. Include what you see, feel, and who you\'re telling about it.', prompt: 'Start with: "I can\'t believe it actually happened..." and let the details flow.', xpReward: 15 },
        ],
    },
    {
        id: 'power-of-letting-go',
        guideId: 'earth-song',
        title: 'The Power of Letting Go',
        emoji: '🕊️',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🕊️', title: 'Surrender the How', subtitle: 'The counterintuitive step most people skip — and why it\'s the most important one' },
            { type: 'teach', title: 'The Paradox', body: 'You just spent time getting crystal clear on your intention. You scripted it. You feel it. Now here\'s the hardest part: let it go.\n\nNot the desire — the attachment to HOW and WHEN it arrives. Gripping your manifestation too tightly is like squeezing wet sand. The tighter you hold, the more slips through.\n\nLetting go doesn\'t mean not caring. It means trusting that your signal has been sent and the universe is rearranging to answer it.', keyInsight: 'Detachment ≠ not caring. Detachment = trusting the delivery is in motion even when you can\'t track the package.' },
            { type: 'teach', title: 'Why Attachment Blocks', body: 'When you obsessively check "is it here yet?" you\'re broadcasting doubt. Every worried thought about timing sends a signal: "I don\'t believe this is really coming."\n\nThe energetic signature of manifestation is: desire + belief + release. Most people nail desire. Some achieve belief. Almost nobody releases.\n\nRelease means living your life as if what you want is already on its way — and you\'re simply getting ready for its arrival.', keyInsight: 'Checking obsessively sends a counter-signal. Trust is the frequency that attracts delivery.' },
            { type: 'teach', title: 'How to Actually Let Go', body: 'Practical ways to release without abandoning your intention:\n\n1. Script it, feel it, then close the notebook and move on with your day\n2. Set a "manifestation curfew" — think about it in the morning, then let it rest\n3. When anxious thoughts arise, say: "It\'s handled" and redirect your attention\n4. Focus on what you CAN control today — aligned action — instead of the outcome\n5. Celebrate small evidence as signs the universe is moving\n\nLetting go is a muscle. It gets stronger with practice.', keyInsight: 'Release the outcome, keep the aligned action. That\'s the balance.' },
            { type: 'quiz', question: 'What does "letting go" mean in manifestation?', options: ['Giving up on your desire', 'Not thinking about it ever again', 'Releasing attachment to how and when it arrives while trusting the process', 'Pretending you don\'t want it'], correctIndex: 2, explanation: 'Letting go means releasing your grip on the timeline and delivery method while maintaining trust that your intention has been received.' },
            { type: 'apply', title: 'The Release Ritual', body: '{intentionRef}Write your intention on a piece of paper, read it once with full feeling, then fold it and place it somewhere you won\'t look at it for 7 days. Practice "it\'s handled" when your mind reaches for it.', prompt: 'What are you holding too tightly right now? What would trusting the process look like today?', xpReward: 15 },
        ],
    },
    {
        id: 'gratitude-frequency',
        guideId: 'earth-song',
        title: 'Gratitude as a Frequency',
        emoji: '🙏',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🙏', title: 'The Gratitude Shift', subtitle: 'How thankfulness becomes the fastest frequency upgrade you can make' },
            { type: 'teach', title: 'More Than Saying Thanks', body: 'Gratitude isn\'t just good manners — it\'s a frequency state. When you\'re genuinely grateful, your brain releases dopamine and serotonin. Your nervous system downregulates stress. Your perception shifts from scarcity to abundance.\n\nHere\'s the manifestation angle: gratitude puts you in the energetic state of ALREADY HAVING. And that\'s exactly the frequency that attracts more.\n\nWhen you\'re grateful for what is, you match the vibration of what\'s coming.', keyInsight: 'Gratitude = the frequency of already having. It\'s the fastest way to shift from wanting to receiving.' },
            { type: 'teach', title: 'The Gratitude-Manifestation Link', body: 'Think about the energetic difference between:\n\n"I need more money" → signal = lack\n"I\'m grateful for the money that\'s already flowing to me" → signal = abundance\n\nBoth statements are about wanting more money. But they vibrate at completely different frequencies. The first broadcasts desperation. The second broadcasts reception.\n\nGratitude doesn\'t deny what\'s missing. It redirects your attention to what\'s already present — and from that foundation, expansion happens naturally.', keyInsight: 'You can\'t manifest from a frequency of lack. Gratitude is the bridge to abundance frequency.' },
            { type: 'teach', title: 'Building a Gratitude Practice', body: 'The practice that actually works (not just listing 3 things):\n\n1. Pick one thing you\'re grateful for\n2. Close your eyes and feel it for 60 seconds — not think about it, FEEL it\n3. Let the emotion expand through your body\n4. From that state, hold your intention — feel that with the same depth\n\nThe hack: gratitude and desire occupy the same emotional channel. When you\'re overflowing with thankfulness, slip your manifestation into that frequency. It rides the wave.', keyInsight: 'Don\'t list — feel. 60 seconds of genuine gratitude emotion rewires more than 10 pages of lists.' },
            { type: 'quiz', question: 'Why is gratitude powerful for manifestation?', options: ['It impresses other people', 'It puts you in the frequency of already having what you desire', 'It makes you forget your goals', 'It\'s a religious requirement'], correctIndex: 1, explanation: 'Gratitude shifts you from the frequency of wanting (lack) to the frequency of having (abundance), which is the exact state that attracts your manifestation.' },
            { type: 'apply', title: 'The 60-Second Flood', body: '{intentionRef}Right now, pick one real thing you\'re grateful for. Close your eyes. Feel it for 60 full seconds. Then, from that emotional peak, hold your current intention and feel THAT with the same intensity.', prompt: 'What shifted when you felt gratitude and desire in the same moment?', xpReward: 15 },
        ],
    },
    {
        id: 'shadow-work-clearing',
        guideId: 'earth-song',
        title: 'Shadow Work: Clearing the Block',
        emoji: '🔦',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🔦', title: 'Meet Your Shadow', subtitle: 'The hidden beliefs running your life — and why manifestation fails when they\'re in charge' },
            { type: 'teach', title: 'What Is Shadow Work?', body: 'Your shadow is the collection of beliefs, fears, and patterns you\'ve pushed into the unconscious. They were formed early — by family, culture, painful experiences — and they run silently in the background like software you forgot you installed.\n\nWhen you try to manifest something that contradicts a shadow belief, the shadow wins. Every time.\n\nExample: You manifest abundance, but deep down you believe "money is the root of evil." Your subconscious will sabotage every opportunity because receiving money would make you "evil."', keyInsight: 'Your conscious mind sets the intention. Your subconscious decides if you\'re allowed to receive it.' },
            { type: 'teach', title: 'Common Shadow Blocks', body: 'These beliefs block more manifestations than anything else:\n\n• "I\'m not enough" → blocks receiving because you feel unworthy\n• "Money is bad/dirty" → blocks financial abundance\n• "Love always hurts" → blocks healthy relationships\n• "Success means losing people" → blocks career growth\n• "I don\'t deserve this" → blocks literally everything\n\nYou might not consciously think these. But watch your behavior — it reveals what you truly believe. If you consistently self-sabotage at the finish line, a shadow is at work.', keyInsight: 'You don\'t have to believe a shadow consciously for it to control you. Watch your patterns, not your affirmations.' },
            { type: 'teach', title: 'Simple Shadow Work Practice', body: 'You don\'t need a therapist for basic shadow work (though deeper ones deserve professional support). Start here:\n\n1. Notice the block — where do you get stuck or self-sabotage?\n2. Ask: "What would I have to believe about myself for this pattern to make sense?"\n3. Write the belief down. See it. Name it.\n4. Ask: "Whose voice is this? When did I first learn this?"\n5. Write a counter-truth: "That was then. I now believe ___"\n\nNaming a shadow is the first step to dissolving its power. What operates in the dark loses its grip when seen.', keyInsight: 'Name it to tame it. A shadow belief spoken aloud loses half its power instantly.' },
            { type: 'quiz', question: 'Why does shadow work matter for manifestation?', options: ['It makes you more spiritual', 'It clears unconscious beliefs that block receiving what you consciously want', 'It replaces the need for intentions', 'It\'s a trendy practice'], correctIndex: 1, explanation: 'Shadow work identifies and clears the unconscious beliefs that silently sabotage your manifestation by contradicting your conscious intentions.' },
            { type: 'apply', title: 'Find One Shadow', body: '{intentionRef}Think about your current intention. Where do you feel resistance or "yeah, right" energy around it? That\'s a shadow. Write: "A part of me believes ___ which is why I struggle to receive ___."', prompt: 'What\'s the belief underneath your biggest block right now? When did you first learn it?', xpReward: 15 },
        ],
    },
    {
        id: 'emotional-alchemy',
        guideId: 'earth-song',
        title: 'Emotional Alchemy',
        emoji: '✨',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '✨', title: 'Feeling Is the Secret', subtitle: 'Why the emotional state of your desired outcome is more powerful than any vision board' },
            { type: 'teach', title: 'Neville\'s Core Teaching', body: 'Neville Goddard — one of the most influential manifestation teachers in history — boiled everything down to one idea: "Feeling is the secret."\n\nNot thinking. Not visualizing. FEELING.\n\nThe state you embody is the signal you broadcast. If you feel anxious about money while affirming abundance, the universe responds to the anxiety, not the words.\n\nThe practice is deceptively simple: assume the feeling of the wish fulfilled. Live in that feeling. Let it color your entire day.', keyInsight: 'The universe doesn\'t hear your words. It matches your frequency. And your frequency is determined by how you FEEL.' },
            { type: 'teach', title: 'How to Shift Your State', body: 'Emotional alchemy is the skill of consciously shifting from one emotional state to another:\n\n• From anxiety → to calm certainty\n• From lack → to gratitude\n• From doubt → to knowing\n\nThe technique:\n1. Notice your current state (don\'t judge it — just notice)\n2. Ask: "How would I feel if my intention were already fulfilled?"\n3. Find that feeling in your body. Where does it live? What does it feel like?\n4. Expand it. Breathe into it. Stay there for 2 minutes.\n5. Go about your day FROM that state\n\nThis isn\'t about faking. It\'s about choosing which frequency to occupy.', keyInsight: 'State-shifting is a skill, not a talent. The more you practice, the faster you can access your desired frequency.' },
            { type: 'teach', title: 'The Before-Sleep Technique', body: '{intentionRef}Neville\'s most powerful technique is done in the moments before sleep — when your conscious mind quiets and your subconscious is most receptive:\n\n1. Lie in bed, ready for sleep\n2. Construct a short scene that would happen AFTER your desire is fulfilled (a congratulatory phone call, looking at your bank account, holding someone\'s hand)\n3. Loop the scene in your mind with full sensory detail\n4. Feel the reality of it — gratitude, joy, relief\n5. Fall asleep IN that feeling\n\nYour subconscious accepts this impressed feeling as fact and begins rearranging reality to match it.', keyInsight: 'The moment before sleep is the manifestation power hour. What you feel as you drift off is what your subconscious works on all night.' },
            { type: 'quiz', question: 'According to Neville Goddard, what is the most important element in manifestation?', options: ['A detailed plan', 'Positive words', 'The feeling of the wish fulfilled', 'Expensive crystals'], correctIndex: 2, explanation: 'Neville taught that "feeling is the secret" — embodying the emotional state of already having your desire is more powerful than any technique.' },
            { type: 'apply', title: 'Tonight\'s Practice', body: '{intentionRef}Tonight before sleep: create a 10-second scene that would happen AFTER your intention is fulfilled. Loop it until you feel it as real. Fall asleep in that feeling.', prompt: 'What is the single scene — one moment — that would mean your intention has been fulfilled? Describe it in vivid detail.', xpReward: 15 },
        ],
    },
    {
        id: 'neuroscience-of-manifesting',
        guideId: 'earth-song',
        title: 'The Neuroscience of Manifesting',
        emoji: '🧠',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🧠', title: 'Your Brain on Manifestation', subtitle: 'Stanford neuroscience reveals: it\'s not magic — it\'s neural rewiring' },
            { type: 'teach', title: 'Embedding Your Intention', body: 'Dr. James Doty, neuroscientist at Stanford\'s Center for Compassion and Altruism Research, explains manifestation as a brain function, not a mystical one.\n\nWhen you spend focused time thinking about your intention, you create "task-positive networks" — systems of neurons that become hyper-attuned to your goal. Your brain literally reorganizes to prioritize cues, people, and opportunities related to what you want.\n\nThat "coincidence" where you met exactly the right person? Your brain was scanning for them. You just didn\'t know it was doing it.', keyInsight: 'Manifestation is neural rewiring. Your brain builds task-positive networks that subconsciously scan for opportunities matching your intention.' },
            { type: 'teach', title: 'The Calm State Secret', body: 'Here\'s what most manifestation teachers miss: your nervous system state matters more than your vision board.\n\nWhen you manifest from anxiety (“I NEED this to work”), your sympathetic nervous system activates fight-or-flight mode. Your brain narrows its focus to threats, not opportunities. Cognitive function drops. Creativity shuts down.\n\nWhen you manifest from calm certainty, your parasympathetic nervous system activates. Your brain releases oxytocin and serotonin. Your prefrontal cortex — the planning and creativity center — comes fully online.\n\nThe neuroscience is clear: a calm body manifests better than an anxious one.', keyInsight: 'Anxious manifesting activates fight-or-flight, which narrows your brain. Calm manifesting opens the neural networks that find solutions.' },
            { type: 'teach', title: 'Multi-Sensory Embedding', body: '{intentionRef}Dr. Doty\'s prescription for embedding an intention into your neural pathways:\n\n1. Write it down — engages motor cortex\n2. Read it silently — engages visual processing\n3. Read it aloud — engages auditory cortex and speech centers\n4. Visualize yourself achieving it — engages imagination networks\n5. Feel the emotion of having it — engages limbic system\n6. Repeat daily — strengthens neural pathways through repetition\n\nThe more senses you engage, the deeper the intention embeds. A thought you only think about is weak. A thought you write, speak, feel, and see is a neural superhighway.', keyInsight: 'Engage all senses: write, read, speak, visualize, feel. Each sense recruits a different brain region, making the intention inescapable to your subconscious.' },
            { type: 'quiz', question: 'According to neuroscience, why does manifestation work?', options: ['The universe rewards positive thinking', 'Your brain creates task-positive networks that subconsciously seek opportunities matching your intention', 'It\'s a placebo effect with no real mechanism', 'Crystals amplify brain waves'], correctIndex: 1, explanation: 'Neuroscience shows that focused intention-setting creates task-positive neural networks — systems that make your brain subconsciously scan for people, cues, and opportunities related to your goal.' },
            { type: 'apply', title: 'The Multi-Sensory Embed', body: '{intentionRef}Take your current intention and run it through all five senses: write it down, read it silently, read it aloud, close your eyes and visualize it, then feel the emotion of having it. Do this daily for one week.', prompt: 'After running your intention through all five senses, which one felt most powerful? That\'s the channel your brain responds to most.', xpReward: 15 },
        ],
    },
    {
        id: 'the-369-method',
        guideId: 'earth-song',
        title: 'The 369 Method',
        emoji: '🔢',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '🔢', title: '3 × 6 × 9', subtitle: 'The viral manifestation method — and the real reason repetition rewires your reality' },
            { type: 'teach', title: 'What Is 369?', body: 'The 369 Method is one of the most popular manifestation techniques. Inspired by Nikola Tesla\'s obsession with the numbers 3, 6, and 9, the practice is deceptively simple:\n\n• Write your intention 3 times in the morning\n• Write it 6 times during the day\n• Write it 9 times before bed\n\nDo this daily for 21 to 33 days. The escalating repetition throughout the day ensures your intention stays embedded in your consciousness from wake to sleep — and the bedtime session primes your subconscious for overnight processing.', keyInsight: 'The power of 369 isn\'t in the numbers — it\'s in the structured repetition that builds neural pathways throughout your entire day.' },
            { type: 'teach', title: 'Why Repetition Works', body: 'Neuroscience confirms what every athlete, musician, and language learner knows: repetition builds neural pathways.\n\nThe first time you write your intention, it\'s a whisper. The tenth time, it\'s a voice. By day 21, it\'s your brain\'s default operating frequency. This is called Hebbian learning: neurons that fire together wire together.\n\nThe 369 structure is engineered for escalation. Morning (3x) plants the seed. Midday (6x) reinforces when distractions are highest. Night (9x) floods your subconscious before the brain\'s overnight reorganization.\n\nYou\'re not just writing words. You\'re building a neural superhighway to your desire.', keyInsight: 'Neurons that fire together wire together. 369\'s escalating repetition transforms a wish into a neural default.' },
            { type: 'teach', title: 'Making 369 Actually Work', body: '{intentionRef}Common mistakes that weaken the method:\n\n• Being too vague — "I want money" vs "I am earning $8,000 per month doing work I love"\n• Writing mechanically — if you\'re just scribbling without feeling, you\'re building empty pathways\n• Contradicting it with self-talk — writing your intention then immediately doubting it\n\nThe fix: each time you write, FEEL it. Even 3 seconds of genuine emotion per repetition is enough. The writing is the structure. The feeling is the fuel.\n\nPro tip: pair 369 with the before-sleep technique from Emotional Alchemy. Write 9x, then fall asleep in the feeling.', keyInsight: 'Writing without feeling builds empty structures. Add 3 seconds of genuine emotion to each rep and the method becomes exponentially more powerful.' },
            { type: 'quiz', question: 'Why is the 369 method structured with increasing repetitions throughout the day?', options: ['Because Tesla liked those numbers', 'To escalate neural reinforcement: morning plants, midday reinforces, night floods the subconscious', 'More writing = more manifestation power', 'It\'s just a trend with no reasoning'], correctIndex: 1, explanation: 'The escalating structure — 3 in morning, 6 at midday, 9 before sleep — ensures the intention builds throughout the day and peaks during the subconscious-priming window before sleep.' },
            { type: 'apply', title: 'Start Your 369 Practice', body: '{intentionRef}Write your current intention in a single, specific, present-tense sentence. Tomorrow morning, write it 3 times with feeling. Midday, write it 6 times. Before sleep, write it 9 times. Commit to 21 days.', prompt: 'Craft your 369 sentence now. Make it specific, present tense, and emotionally charged. What does your 21-day starting version look like?', xpReward: 15 },
        ],
    },
    {
        id: 'affirmations-that-rewire',
        guideId: 'earth-song',
        title: 'Affirmations That Actually Rewire',
        emoji: '💬',
        domain: 'Manifestation',
        xpTotal: 45,
        cards: [
            { type: 'hook', emoji: '💬', title: 'Beyond "I Am Enough"', subtitle: 'Why most affirmations don\'t work — and the neuroscience of ones that do' },
            { type: 'teach', title: 'The Affirmation Problem', body: 'Let\'s be honest: most people try affirmations, feel foolish, and quit. Standing in front of a mirror saying "I am wealthy" while your bank account says otherwise feels like lying to yourself.\n\nAnd neuroscience agrees — partially. When an affirmation wildly contradicts your current belief system, your brain rejects it. It creates cognitive dissonance, which actually reinforces the negative belief.\n\nBut that doesn\'t mean affirmations don\'t work. It means most people use them wrong. The fix is bridging — meeting your brain where it actually is.', keyInsight: 'Affirmations that contradict your current reality trigger rejection, not rewiring. The key is making them believable enough for your brain to accept.' },
            { type: 'teach', title: 'Bridge Affirmations', body: 'Instead of forcing your brain to accept something it doesn\'t believe, use bridge affirmations — statements your brain can accept RIGHT NOW that move toward your desired belief:\n\n• Instead of: "I am wealthy" → Try: "I am learning to manage money with confidence"\n• Instead of: "I am confident" → Try: "I am becoming someone who trusts their own voice"\n• Instead of: "I am loved" → Try: "I am opening to the possibility that I deserve deep love"\n\nBridge affirmations use phrases like "I am learning," "I am becoming," "I am opening to." These are TRUE — and truth is the currency your brain trades in.', keyInsight: '"I am learning" and "I am becoming" are bridge phrases your brain accepts as true, creating a neural pathway toward the full affirmation.' },
            { type: 'teach', title: 'The Negative Self-Talk Interrupt', body: '{intentionRef}Dr. Doty identifies negative self-talk as the #1 blocker of manifestation: "If you tell yourself something is not possible, then it\'s not possible."\n\nThe practice:\n1. Catch the negative statement — "I\'ll never be able to afford that"\n2. Pause — don\'t fight it, just notice it\n3. Replace with a bridge affirmation — "I\'m learning how to create that kind of abundance"\n4. Repeat the bridge out loud — speaking engages more neural networks\n\nOver time, the bridge becomes your default. And when your brain\'s default is "I\'m learning to succeed" instead of "I\'ll never succeed," your entire behavioral pattern shifts. You apply for the job. You ask for the raise. You take the risk.', keyInsight: 'Catch, pause, replace. Three steps that interrupt decades of neural programming and slowly rewrite your brain\'s default narrative.' },
            { type: 'quiz', question: 'Why do bridge affirmations work better than standard affirmations?', options: ['They\'re more poetic', 'They use words your brain accepts as currently true, reducing cognitive dissonance', 'They\'re shorter', 'They don\'t actually work better'], correctIndex: 1, explanation: 'Bridge affirmations use phrases like "I am learning" or "I am becoming" which your brain accepts as factually true, avoiding the rejection response that happens with unbelievable declarations.' },
            { type: 'apply', title: 'Build Your Bridges', body: '{intentionRef}Take your current intention and write a standard affirmation. Does it feel true? If not, rewrite it as a bridge affirmation using "I am learning," "I am becoming," or "I am opening to." Repeat the bridge version aloud 5 times.', prompt: 'What\'s your biggest piece of negative self-talk around your current intention? Write the bridge affirmation that replaces it.', xpReward: 15 },
        ],
    },
];

// ── Progress Tracking ─────────────────────────────────────────────────────────

function getDefaultProgress(): TeachingProgress {
    return {
        completedLessons: [],
        streakDays: 0,
        lastCompletedDate: '',
        xpTotal: 0,
        masteryScores: { Tarot: 0, Astrology: 0, Numerology: 0, Moon: 0, Manifestation: 0 },
    };
}

export function getProgress(): TeachingProgress {
    try {
        const raw = safeStorage.getItem(PROGRESS_KEY);
        if (raw) {
            const p = JSON.parse(raw) as TeachingProgress;
            // Auto-reset streak if gap > 1 day
            if (p.lastCompletedDate) {
                const last = new Date(p.lastCompletedDate);
                const today = new Date();
                const diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000);
                if (diffDays > 1) {
                    p.streakDays = 0;
                }
            }
            return p;
        }
    } catch { /* corrupt */ }
    return getDefaultProgress();
}

export function saveProgress(p: TeachingProgress): void {
    safeStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function completeLesson(lessonId: string, xpEarned: number): TeachingProgress {
    const p = getProgress();
    if (!p.completedLessons.includes(lessonId)) {
        p.completedLessons.push(lessonId);
    }
    p.xpTotal += xpEarned;

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    if (p.lastCompletedDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        p.streakDays = (p.lastCompletedDate === yesterday) ? p.streakDays + 1 : 1;
        p.lastCompletedDate = today;
    }

    // Update mastery
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (lesson) {
        const domainLessons = LESSONS.filter(l => l.domain === lesson.domain);
        const completedInDomain = domainLessons.filter(l => p.completedLessons.includes(l.id)).length;
        p.masteryScores[lesson.domain] = Math.round((completedInDomain / domainLessons.length) * 100);
    }

    saveProgress(p);
    return p;
}

export function getTodaysLesson(progress: TeachingProgress): Lesson {
    // Return the first uncompleted lesson, or cycle back to first
    const uncompleted = LESSONS.find(l => !progress.completedLessons.includes(l.id));
    return uncompleted || LESSONS[0];
}

export function getLessonsByGuide(guideId: string): Lesson[] {
    return LESSONS.filter(l => l.guideId === guideId);
}

export function getGuideById(guideId: string): Guide | undefined {
    return GUIDES.find(g => g.id === guideId);
}

// ── Level System ──────────────────────────────────────────────────────────────

export function getLevel(xp: number): { name: string; next: number; progress: number } {
    const levels = [
        { name: 'Seeker', min: 0, next: 100 },
        { name: 'Student', min: 100, next: 250 },
        { name: 'Adept', min: 250, next: 500 },
        { name: 'Initiate', min: 500, next: 1000 },
        { name: 'Mystic', min: 1000, next: 2000 },
        { name: 'Sage', min: 2000, next: 5000 },
        { name: 'Oracle', min: 5000, next: 10000 },
    ];
    const current = [...levels].reverse().find(l => xp >= l.min) || levels[0];
    return {
        name: current.name,
        next: current.next,
        progress: Math.min(100, Math.round(((xp - current.min) / (current.next - current.min)) * 100)),
    };
}

// ── Context-Aware Personalization ─────────────────────────────────────────────

export interface UserContext {
    sunSign?: string;
    moonSign?: string;
    risingSign?: string;
    activeIntention?: string;
    recentReadingNote?: string;
    recentJournalNote?: string;
    userName?: string;
}

export function getUserContext(): UserContext {
    const ctx: UserContext = {};

    // Birth chart
    try {
        const bd = getBirthData();
        if (bd) {
            const sun = getSunSign(bd.birthday);
            if (sun) ctx.sunSign = sun.name;
            try {
                const triad = getNatalTriad(bd);
                if (triad) {
                    ctx.moonSign = triad.moon?.name;
                    ctx.risingSign = triad.rising?.name;
                }
            } catch { /* no birth time → no rising/moon */ }
        }
    } catch { /* no birth data */ }

    // Active intention
    try {
        const active = getActiveManifestations();
        if (active.length > 0) {
            ctx.activeIntention = active[0].declaration;
        }
    } catch { /* no manifestations */ }

    // Recent reading
    try {
        const readings = JSON.parse(safeStorage.getItem('tarot_readings') || '[]');
        if (readings.length > 0) {
            const latest = readings[0];
            ctx.recentReadingNote = latest.title || latest.spreadType || 'your recent reading';
        }
    } catch { /* no readings */ }

    // Recent journal
    try {
        const entries = JSON.parse(safeStorage.getItem('cosmic_journal_entries') || '[]');
        if (entries.length > 0) {
            const latest = entries[0];
            ctx.recentJournalNote = latest.title || latest.prompt || 'your recent journal entry';
        }
    } catch { /* no journal */ }

    // User name
    try {
        const profile = JSON.parse(safeStorage.getItem('userProfile') || '{}');
        if (profile.name) ctx.userName = profile.name;
    } catch { /* no profile */ }

    return ctx;
}

/** Replace template tokens in card text with real user context */
export function personalizeText(text: string, ctx: UserContext): string {
    let result = text;

    // Birth chart references
    if (text.includes('{birthChartRef}')) {
        if (ctx.sunSign) {
            const intro = ctx.risingSign
                ? `As a ${ctx.sunSign} Sun with ${ctx.risingSign} rising, this is especially relevant for you.\n\n`
                : `As a ${ctx.sunSign}, this connects to your energy in a specific way.\n\n`;
            result = result.replace('{birthChartRef}', intro);
        } else {
            result = result.replace('{birthChartRef}', '');
        }
    }

    // Intention references
    if (text.includes('{intentionRef}')) {
        if (ctx.activeIntention) {
            result = result.replace('{intentionRef}', `Your active intention is "${ctx.activeIntention}." `);
        } else {
            result = result.replace('{intentionRef}', '');
        }
    }

    // Reading references
    if (text.includes('{readingRef}')) {
        if (ctx.recentReadingNote) {
            result = result.replace('{readingRef}', `Thinking back to ${ctx.recentReadingNote}: `);
        } else {
            result = result.replace('{readingRef}', '');
        }
    }

    return result;
}

// ── Masters Library ───────────────────────────────────────────────────────────
// Real-world spiritual teachers with curated YouTube lectures.
// Phase 1: Public-domain teachers only. Expand later.

export interface MasterLecture {
    id: string;
    title: string;
    videoId: string;           // YouTube video ID
    duration: string;          // e.g. "45 min"
    theme: string;             // Grouping within the master's content
    relatedLessonId?: string;  // Cross-link to an AI Teaching lesson
}

export interface Master {
    id: string;
    name: string;
    emoji: string;
    era: string;               // e.g. "1905–1972"
    philosophy: string;        // One-line tagline
    bio: string;               // 2-sentence bio
    color: string;             // Accent colour
    lectures: MasterLecture[];
}

export const MASTERS: Master[] = [
    {
        id: 'neville-goddard',
        name: 'Neville Goddard',
        emoji: '🔮',
        era: '1905 – 1972',
        philosophy: '"Imagination is the only reality."',
        bio: 'Barbadian-born mystic who taught that consciousness creates reality. His work on the Law of Assumption influenced an entire generation of manifestation teachers.',
        color: '#d4af37',
        lectures: [
            // ── Core Teachings (Neville Goddard Official channel) ──
            { id: 'ng-1', title: 'Feeling Is The Secret', videoId: 'FdISgW7loPg', duration: '15 min', theme: 'Core Teachings' },
            { id: 'ng-2', title: 'The Law and The Promise', videoId: 'KFLPjnIHKlY', duration: '18 min', theme: 'Core Teachings' },
            { id: 'ng-3', title: 'Imagination Creates Reality', videoId: 'Fny-BVLKY8c', duration: '20 min', theme: 'Core Teachings' },
            // ── Techniques ──
            { id: 'ng-4', title: 'State Akin to Sleep (SATS)', videoId: '4QdVITzlYvw', duration: '21 min', theme: 'Techniques', relatedLessonId: 'emotional-alchemy' },
            { id: 'ng-5', title: 'The Pruning Shears of Revision', videoId: 'M6EXXXGSUiE', duration: '14 min', theme: 'Techniques' },
            { id: 'ng-6', title: 'Living in the End', videoId: 'b7lWi3ZQYOU', duration: '17 min', theme: 'Techniques' },
            // ── Advanced ──
            { id: 'ng-7', title: 'You Are Living In A Play Created By God', videoId: 'B1lCDVIlzyE', duration: '19 min', theme: 'Advanced' },
            { id: 'ng-8', title: 'The Power of Awareness', videoId: 'dQic_eWlSno', duration: '16 min', theme: 'Advanced' },
            { id: 'ng-9', title: 'Your Wish Is Your Command', videoId: 'liYH4_08XkM', duration: '15 min', theme: 'Advanced' },
        ],
    },
    {
        id: 'florence-scovel-shinn',
        name: 'Florence Scovel Shinn',
        emoji: '✦',
        era: '1871 – 1940',
        philosophy: '"The game of life is a game of boomerangs."',
        bio: 'American artist and metaphysical teacher whose books on affirmation and spoken word became cornerstones of New Thought. Her gentle, practical approach to manifestation remains timeless.',
        color: '#c084fc',
        lectures: [
            // ── Core Teachings ──
            { id: 'fss-1', title: 'The Game of Life and How to Play It', videoId: 'wJa5Ch0O4BI', duration: '1 hr 43 min', theme: 'Core Teachings' },
            { id: 'fss-2', title: 'Your Word Is Your Wand', videoId: 'uTBZeWPIOn8', duration: '1 hr 15 min', theme: 'Core Teachings' },
            { id: 'fss-3', title: 'The Secret Door to Success', videoId: '9RDCu2ZX9LA', duration: '1 hr 50 min', theme: 'Core Teachings' },
            // ── Affirmations & Practice ──
            { id: 'fss-4', title: 'The Power of the Spoken Word', videoId: 'HZqJX4KWSqc', duration: '1 hr 5 min', theme: 'Affirmations & Practice' },
            { id: 'fss-5', title: 'Affirmations Collection', videoId: 'UJpgf1l4qfU', duration: '6 hrs', theme: 'Affirmations & Practice' },
        ],
    },
];

export function getMasterById(id: string): Master | undefined {
    return MASTERS.find(m => m.id === id);
}
