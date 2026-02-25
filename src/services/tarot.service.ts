import { safeStorage } from "./storage.service";
import { Card, Reading, SpreadType } from '../models/card.model';

/* ── Rider-Waite-Smith public domain images ──
   Original 1909 artwork by Pamela Colman Smith — public domain.
   Images served from Wikimedia Commons. */

const WIKI_THUMB = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

// Map each card id → Wikimedia Commons path
const CARD_IMAGES: Record<string, string> = {
    // Major Arcana
    fool: `${WIKI_THUMB}/9/90/RWS_Tarot_00_Fool.jpg/330px-RWS_Tarot_00_Fool.jpg`,
    magician: `${WIKI_THUMB}/d/de/RWS_Tarot_01_Magician.jpg/330px-RWS_Tarot_01_Magician.jpg`,
    high_priestess: `${WIKI_THUMB}/8/88/RWS_Tarot_02_High_Priestess.jpg/330px-RWS_Tarot_02_High_Priestess.jpg`,
    empress: `${WIKI_THUMB}/d/d2/RWS_Tarot_03_Empress.jpg/330px-RWS_Tarot_03_Empress.jpg`,
    emperor: `${WIKI_THUMB}/c/c3/RWS_Tarot_04_Emperor.jpg/330px-RWS_Tarot_04_Emperor.jpg`,
    hierophant: `${WIKI_THUMB}/8/8d/RWS_Tarot_05_Hierophant.jpg/330px-RWS_Tarot_05_Hierophant.jpg`,
    lovers: `${WIKI_THUMB}/d/db/RWS_Tarot_06_Lovers.jpg/330px-RWS_Tarot_06_Lovers.jpg`,
    chariot: `${WIKI_THUMB}/9/9b/RWS_Tarot_07_Chariot.jpg/330px-RWS_Tarot_07_Chariot.jpg`,
    strength: `${WIKI_THUMB}/f/f5/RWS_Tarot_08_Strength.jpg/330px-RWS_Tarot_08_Strength.jpg`,
    hermit: `${WIKI_THUMB}/4/4d/RWS_Tarot_09_Hermit.jpg/330px-RWS_Tarot_09_Hermit.jpg`,
    wheel_of_fortune: `${WIKI_THUMB}/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg/330px-RWS_Tarot_10_Wheel_of_Fortune.jpg`,
    justice: `${WIKI_THUMB}/e/e0/RWS_Tarot_11_Justice.jpg/330px-RWS_Tarot_11_Justice.jpg`,
    hanged_man: `${WIKI_THUMB}/2/2b/RWS_Tarot_12_Hanged_Man.jpg/330px-RWS_Tarot_12_Hanged_Man.jpg`,
    death: `${WIKI_THUMB}/d/d7/RWS_Tarot_13_Death.jpg/330px-RWS_Tarot_13_Death.jpg`,
    temperance: `${WIKI_THUMB}/f/f8/RWS_Tarot_14_Temperance.jpg/330px-RWS_Tarot_14_Temperance.jpg`,
    devil: `${WIKI_THUMB}/5/55/RWS_Tarot_15_Devil.jpg/330px-RWS_Tarot_15_Devil.jpg`,
    tower: `${WIKI_THUMB}/5/53/RWS_Tarot_16_Tower.jpg/330px-RWS_Tarot_16_Tower.jpg`,
    star: `${WIKI_THUMB}/d/db/RWS_Tarot_17_Star.jpg/330px-RWS_Tarot_17_Star.jpg`,
    moon: `${WIKI_THUMB}/7/7f/RWS_Tarot_18_Moon.jpg/330px-RWS_Tarot_18_Moon.jpg`,
    sun: `${WIKI_THUMB}/1/17/RWS_Tarot_19_Sun.jpg/330px-RWS_Tarot_19_Sun.jpg`,
    judgement: `${WIKI_THUMB}/d/dd/RWS_Tarot_20_Judgement.jpg/330px-RWS_Tarot_20_Judgement.jpg`,
    world: `${WIKI_THUMB}/f/ff/RWS_Tarot_21_World.jpg/330px-RWS_Tarot_21_World.jpg`,
    // Wands
    ace_wands: `${WIKI_THUMB}/1/11/Wands01.jpg/330px-Wands01.jpg`,
    two_wands: `${WIKI_THUMB}/0/0f/Wands02.jpg/330px-Wands02.jpg`,
    three_wands: `${WIKI_THUMB}/f/ff/Wands03.jpg/330px-Wands03.jpg`,
    four_wands: `${WIKI_THUMB}/a/a4/Wands04.jpg/330px-Wands04.jpg`,
    five_wands: `${WIKI_THUMB}/9/9d/Wands05.jpg/330px-Wands05.jpg`,
    six_wands: `${WIKI_THUMB}/3/3b/Wands06.jpg/330px-Wands06.jpg`,
    seven_wands: `${WIKI_THUMB}/e/e4/Wands07.jpg/330px-Wands07.jpg`,
    eight_wands: `${WIKI_THUMB}/6/6b/Wands08.jpg/330px-Wands08.jpg`,
    nine_wands: `${WIKI_THUMB}/4/4d/Tarot_Nine_of_Wands.jpg/330px-Tarot_Nine_of_Wands.jpg`,
    ten_wands: `${WIKI_THUMB}/0/0b/Wands10.jpg/330px-Wands10.jpg`,
    page_wands: `${WIKI_THUMB}/6/6a/Wands11.jpg/330px-Wands11.jpg`,
    knight_wands: `${WIKI_THUMB}/1/16/Wands12.jpg/330px-Wands12.jpg`,
    queen_wands: `${WIKI_THUMB}/0/0d/Wands13.jpg/330px-Wands13.jpg`,
    king_wands: `${WIKI_THUMB}/c/ce/Wands14.jpg/330px-Wands14.jpg`,
    // Cups
    ace_cups: `${WIKI_THUMB}/3/36/Cups01.jpg/330px-Cups01.jpg`,
    two_cups: `${WIKI_THUMB}/f/f8/Cups02.jpg/330px-Cups02.jpg`,
    three_cups: `${WIKI_THUMB}/7/7a/Cups03.jpg/330px-Cups03.jpg`,
    four_cups: `${WIKI_THUMB}/3/35/Cups04.jpg/330px-Cups04.jpg`,
    five_cups: `${WIKI_THUMB}/d/d7/Cups05.jpg/330px-Cups05.jpg`,
    six_cups: `${WIKI_THUMB}/1/17/Cups06.jpg/330px-Cups06.jpg`,
    seven_cups: `${WIKI_THUMB}/a/ae/Cups07.jpg/330px-Cups07.jpg`,
    eight_cups: `${WIKI_THUMB}/6/60/Cups08.jpg/330px-Cups08.jpg`,
    nine_cups: `${WIKI_THUMB}/2/24/Cups09.jpg/330px-Cups09.jpg`,
    ten_cups: `${WIKI_THUMB}/8/84/Cups10.jpg/330px-Cups10.jpg`,
    page_cups: `${WIKI_THUMB}/a/ad/Cups11.jpg/330px-Cups11.jpg`,
    knight_cups: `${WIKI_THUMB}/f/fa/Cups12.jpg/330px-Cups12.jpg`,
    queen_cups: `${WIKI_THUMB}/6/62/Cups13.jpg/330px-Cups13.jpg`,
    king_cups: `${WIKI_THUMB}/0/04/Cups14.jpg/330px-Cups14.jpg`,
    // Swords
    ace_swords: `${WIKI_THUMB}/1/1a/Swords01.jpg/330px-Swords01.jpg`,
    two_swords: `${WIKI_THUMB}/9/9e/Swords02.jpg/330px-Swords02.jpg`,
    three_swords: `${WIKI_THUMB}/0/02/Swords03.jpg/330px-Swords03.jpg`,
    four_swords: `${WIKI_THUMB}/b/bf/Swords04.jpg/330px-Swords04.jpg`,
    five_swords: `${WIKI_THUMB}/2/23/Swords05.jpg/330px-Swords05.jpg`,
    six_swords: `${WIKI_THUMB}/2/29/Swords06.jpg/330px-Swords06.jpg`,
    seven_swords: `${WIKI_THUMB}/3/34/Swords07.jpg/330px-Swords07.jpg`,
    eight_swords: `${WIKI_THUMB}/a/a7/Swords08.jpg/330px-Swords08.jpg`,
    nine_swords: `${WIKI_THUMB}/2/2f/Swords09.jpg/330px-Swords09.jpg`,
    ten_swords: `${WIKI_THUMB}/d/d4/Swords10.jpg/330px-Swords10.jpg`,
    page_swords: `${WIKI_THUMB}/4/4c/Swords11.jpg/330px-Swords11.jpg`,
    knight_swords: `${WIKI_THUMB}/b/b0/Swords12.jpg/330px-Swords12.jpg`,
    queen_swords: `${WIKI_THUMB}/d/d4/Swords13.jpg/330px-Swords13.jpg`,
    king_swords: `${WIKI_THUMB}/3/33/Swords14.jpg/330px-Swords14.jpg`,
    // Pentacles
    ace_pentacles: `${WIKI_THUMB}/f/fd/Pents01.jpg/330px-Pents01.jpg`,
    two_pentacles: `${WIKI_THUMB}/9/9f/Pents02.jpg/330px-Pents02.jpg`,
    three_pentacles: `${WIKI_THUMB}/4/42/Pents03.jpg/330px-Pents03.jpg`,
    four_pentacles: `${WIKI_THUMB}/3/35/Pents04.jpg/330px-Pents04.jpg`,
    five_pentacles: `${WIKI_THUMB}/9/96/Pents05.jpg/330px-Pents05.jpg`,
    six_pentacles: `${WIKI_THUMB}/a/a6/Pents06.jpg/330px-Pents06.jpg`,
    seven_pentacles: `${WIKI_THUMB}/6/6a/Pents07.jpg/330px-Pents07.jpg`,
    eight_pentacles: `${WIKI_THUMB}/4/49/Pents08.jpg/330px-Pents08.jpg`,
    nine_pentacles: `${WIKI_THUMB}/f/f0/Pents09.jpg/330px-Pents09.jpg`,
    ten_pentacles: `${WIKI_THUMB}/4/42/Pents10.jpg/330px-Pents10.jpg`,
    page_pentacles: `${WIKI_THUMB}/e/ec/Pents11.jpg/330px-Pents11.jpg`,
    knight_pentacles: `${WIKI_THUMB}/d/d5/Pents12.jpg/330px-Pents12.jpg`,
    queen_pentacles: `${WIKI_THUMB}/8/88/Pents13.jpg/330px-Pents13.jpg`,
    king_pentacles: `${WIKI_THUMB}/1/1c/Pents14.jpg/330px-Pents14.jpg`,
};

const IMG = (id: string) => CARD_IMAGES[id] || '';

export class TarotService {
    private cards: Card[] = [
        // ═══════════════════════════════════════
        // MAJOR ARCANA (0–21)
        // ═══════════════════════════════════════
        {
            id: 'fool', name: 'The Fool', number: 0, suit: 'Major Arcana',
            description: 'New beginnings, innocence, spontaneity, free spirit',
            image: IMG('fool'),
            meaning: 'The Fool represents new beginnings, innocence, and spontaneity. It encourages you to take a leap of faith and embrace new opportunities with childlike wonder.',
            reversed: 'Recklessness, lack of direction, fear of change, naivety',
            element: 'Air', planet: 'Uranus'
        },
        {
            id: 'magician', name: 'The Magician', number: 1, suit: 'Major Arcana',
            description: 'Manifestation, willpower, skill, concentration',
            image: IMG('magician'),
            meaning: 'The Magician represents manifestation, willpower, and the ability to turn dreams into reality through focused action and resourcefulness.',
            reversed: 'Manipulation, lack of focus, untapped potential, trickery',
            element: 'Air', planet: 'Mercury'
        },
        {
            id: 'high_priestess', name: 'The High Priestess', number: 2, suit: 'Major Arcana',
            description: 'Intuition, mystery, subconscious, inner knowledge',
            image: IMG('high_priestess'),
            meaning: 'The High Priestess represents intuition, mystery, and the power of the subconscious mind. She urges you to look beyond the surface.',
            reversed: 'Hidden agendas, lack of inner voice, secrets, repressed feelings',
            element: 'Water', planet: 'Moon'
        },
        {
            id: 'empress', name: 'The Empress', number: 3, suit: 'Major Arcana',
            description: 'Fertility, abundance, nature, nurturing',
            image: IMG('empress'),
            meaning: 'The Empress represents fertility, abundance, and the nurturing power of nature. She embodies creation, sensual pleasure, and maternal care.',
            reversed: 'Dependency, smothering, lack of growth, creative block',
            element: 'Earth', planet: 'Venus'
        },
        {
            id: 'emperor', name: 'The Emperor', number: 4, suit: 'Major Arcana',
            description: 'Authority, structure, leadership, stability',
            image: IMG('emperor'),
            meaning: 'The Emperor represents authority, structure, and strong leadership qualities. He brings order out of chaos through discipline.',
            reversed: 'Tyranny, rigidity, abuse of power, inflexibility',
            element: 'Fire', planet: 'Aries'
        },
        {
            id: 'hierophant', name: 'The Hierophant', number: 5, suit: 'Major Arcana',
            description: 'Tradition, spirituality, teaching, conformity',
            image: IMG('hierophant'),
            meaning: 'The Hierophant represents tradition, spirituality, and the role of teacher or spiritual guide. He bridges heaven and earth.',
            reversed: 'Rebellion, unconventional beliefs, personal spirituality',
            element: 'Earth', planet: 'Taurus'
        },
        {
            id: 'lovers', name: 'The Lovers', number: 6, suit: 'Major Arcana',
            description: 'Love, relationships, choices, alignment',
            image: IMG('lovers'),
            meaning: 'The Lovers represent love, relationships, and important choices. This card speaks to deep connections and the harmony of opposites.',
            reversed: 'Imbalance, poor choices, disharmony, misalignment',
            element: 'Air', planet: 'Gemini'
        },
        {
            id: 'chariot', name: 'The Chariot', number: 7, suit: 'Major Arcana',
            description: 'Determination, control, victory, willpower',
            image: IMG('chariot'),
            meaning: 'The Chariot represents determination, control, and the ability to overcome obstacles through sheer willpower and confidence.',
            reversed: 'Lack of control, aggression, defeat, opposition',
            element: 'Water', planet: 'Cancer'
        },
        {
            id: 'strength', name: 'Strength', number: 8, suit: 'Major Arcana',
            description: 'Courage, inner strength, patience, compassion',
            image: IMG('strength'),
            meaning: 'Strength represents courage, inner strength, and the power of patience and compassion. True power comes from within.',
            reversed: 'Weakness, self-doubt, lack of self-control, insecurity',
            element: 'Fire', planet: 'Leo'
        },
        {
            id: 'hermit', name: 'The Hermit', number: 9, suit: 'Major Arcana',
            description: 'Soul-searching, introspection, guidance, solitude',
            image: IMG('hermit'),
            meaning: 'The Hermit represents soul-searching, introspection, and the search for inner wisdom. He lights the way through darkness.',
            reversed: 'Isolation, loneliness, withdrawal, anti-social',
            element: 'Earth', planet: 'Virgo'
        },
        {
            id: 'wheel_of_fortune', name: 'Wheel of Fortune', number: 10, suit: 'Major Arcana',
            description: 'Change, cycles, destiny, turning point',
            image: IMG('wheel_of_fortune'),
            meaning: 'The Wheel of Fortune represents change, cycles, and the turning of fate. What goes around comes around.',
            reversed: 'Bad luck, resistance to change, external control, setbacks',
            element: 'Fire', planet: 'Jupiter'
        },
        {
            id: 'justice', name: 'Justice', number: 11, suit: 'Major Arcana',
            description: 'Fairness, truth, balance, law',
            image: IMG('justice'),
            meaning: 'Justice represents fairness, truth, and the need for balance in all things. The truth will prevail.',
            reversed: 'Unfairness, lack of accountability, dishonesty, injustice',
            element: 'Air', planet: 'Libra'
        },
        {
            id: 'hanged_man', name: 'The Hanged Man', number: 12, suit: 'Major Arcana',
            description: 'Sacrifice, waiting, new perspective, surrender',
            image: IMG('hanged_man'),
            meaning: 'The Hanged Man represents sacrifice, waiting, and gaining a new perspective. Sometimes surrender is the greatest act of power.',
            reversed: 'Stalling, needless sacrifice, fear of sacrifice, indecision',
            element: 'Water', planet: 'Neptune'
        },
        {
            id: 'death', name: 'Death', number: 13, suit: 'Major Arcana',
            description: 'Endings, transformation, rebirth, transition',
            image: IMG('death'),
            meaning: 'Death represents endings, transformation, and the natural cycle of life. Every ending is a new beginning.',
            reversed: 'Resistance to change, stagnation, fear of change, decay',
            element: 'Water', planet: 'Scorpio'
        },
        {
            id: 'temperance', name: 'Temperance', number: 14, suit: 'Major Arcana',
            description: 'Balance, moderation, patience, purpose',
            image: IMG('temperance'),
            meaning: 'Temperance represents balance, moderation, and the art of patience. Find the middle path and blend opposing forces.',
            reversed: 'Imbalance, excess, lack of long-term vision, overindulgence',
            element: 'Fire', planet: 'Sagittarius'
        },
        {
            id: 'devil', name: 'The Devil', number: 15, suit: 'Major Arcana',
            description: 'Bondage, materialism, temptation, shadow self',
            image: IMG('devil'),
            meaning: 'The Devil represents bondage, materialism, and the temptations that hold us back. Recognize your chains to break free.',
            reversed: 'Breaking free, overcoming addiction, reclaiming power, detachment',
            element: 'Earth', planet: 'Capricorn'
        },
        {
            id: 'tower', name: 'The Tower', number: 16, suit: 'Major Arcana',
            description: 'Sudden change, revelation, awakening, upheaval',
            image: IMG('tower'),
            meaning: 'The Tower represents sudden change, revelation, and the destruction of false foundations. Liberation through upheaval.',
            reversed: 'Avoiding disaster, fear of change, internal transformation',
            element: 'Fire', planet: 'Mars'
        },
        {
            id: 'star', name: 'The Star', number: 17, suit: 'Major Arcana',
            description: 'Hope, inspiration, guidance, serenity',
            image: IMG('star'),
            meaning: 'The Star represents hope, inspiration, and guidance in dark times. After the storm comes the calm.',
            reversed: 'Hopelessness, faithlessness, lack of inspiration, despair',
            element: 'Air', planet: 'Aquarius'
        },
        {
            id: 'moon', name: 'The Moon', number: 18, suit: 'Major Arcana',
            description: 'Illusion, fear, subconscious, anxiety',
            image: IMG('moon'),
            meaning: 'The Moon represents illusion, fear, and the power of the subconscious mind. Not everything is as it seems.',
            reversed: 'Releasing fear, repressed emotion, inner confusion, clarity',
            element: 'Water', planet: 'Pisces'
        },
        {
            id: 'sun', name: 'The Sun', number: 19, suit: 'Major Arcana',
            description: 'Joy, success, vitality, positivity',
            image: IMG('sun'),
            meaning: 'The Sun represents joy, success, and the vitality of life. Bask in your accomplishments and let your light shine.',
            reversed: 'Negativity, depression, lack of success, temporary setback',
            element: 'Fire', planet: 'Sun'
        },
        {
            id: 'judgement', name: 'Judgement', number: 20, suit: 'Major Arcana',
            description: 'Rebirth, absolution, awakening, calling',
            image: IMG('judgement'),
            meaning: 'Judgement represents rebirth, absolution, and spiritual awakening. Heed the call to rise up and embrace your true purpose.',
            reversed: 'Lack of self-awareness, self-doubt, self-criticism, refusing the call',
            element: 'Fire', planet: 'Pluto'
        },
        {
            id: 'world', name: 'The World', number: 21, suit: 'Major Arcana',
            description: 'Completion, accomplishment, travel, wholeness',
            image: IMG('world'),
            meaning: 'The World represents completion, accomplishment, and the fulfillment of goals. A cycle is complete — celebrate!',
            reversed: 'Incompletion, lack of closure, fear of success, stagnation',
            element: 'Earth', planet: 'Saturn'
        },

        // ═══════════════════════════════════════
        // WANDS (Fire)
        // ═══════════════════════════════════════
        {
            id: 'ace_wands', name: 'Ace of Wands', suit: 'Wands', number: 1,
            description: 'Creation, inspiration, new opportunity, growth',
            image: IMG('ace_wands'),
            meaning: 'The Ace of Wands represents the spark of a new idea, creative inspiration, and the beginning of an exciting venture.',
            reversed: 'Delays, lack of motivation, missed opportunities',
            element: 'Fire'
        },
        {
            id: 'two_wands', name: 'Two of Wands', suit: 'Wands', number: 2,
            description: 'Planning, future vision, discovery, decisions',
            image: IMG('two_wands'),
            meaning: 'The Two of Wands represents planning, making decisions about the future, and expanding your horizons.',
            reversed: 'Fear of unknown, lack of planning, playing it safe',
            element: 'Fire'
        },
        {
            id: 'three_wands', name: 'Three of Wands', suit: 'Wands', number: 3,
            description: 'Expansion, foresight, overseas opportunity',
            image: IMG('three_wands'),
            meaning: 'The Three of Wands represents expansion, looking ahead with confidence, and ventures bearing fruit.',
            reversed: 'Playing small, lack of foresight, delays in plans',
            element: 'Fire'
        },
        {
            id: 'four_wands', name: 'Four of Wands', suit: 'Wands', number: 4,
            description: 'Celebration, harmony, homecoming, community',
            image: IMG('four_wands'),
            meaning: 'The Four of Wands represents celebration, harmony, and joyful homecomings. A time of stability and happiness.',
            reversed: 'Lack of support, transience, home conflicts, instability',
            element: 'Fire'
        },
        {
            id: 'five_wands', name: 'Five of Wands', suit: 'Wands', number: 5,
            description: 'Conflict, competition, tension, diversity',
            image: IMG('five_wands'),
            meaning: 'The Five of Wands represents conflict, competition, and the struggle of differing opinions. Healthy debate leads to growth.',
            reversed: 'Avoidance of conflict, inner conflict, peace after struggle',
            element: 'Fire'
        },
        {
            id: 'six_wands', name: 'Six of Wands', suit: 'Wands', number: 6,
            description: 'Victory, success, public recognition, progress',
            image: IMG('six_wands'),
            meaning: 'The Six of Wands represents victory, public recognition, and a well-deserved triumph after hard work.',
            reversed: 'Excess pride, fall from grace, lack of recognition',
            element: 'Fire'
        },
        {
            id: 'seven_wands', name: 'Seven of Wands', suit: 'Wands', number: 7,
            description: 'Challenge, perseverance, defending position',
            image: IMG('seven_wands'),
            meaning: 'The Seven of Wands represents standing your ground, defending your beliefs, and perseverance against opposition.',
            reversed: 'Giving up, overwhelmed, admitting defeat',
            element: 'Fire'
        },
        {
            id: 'eight_wands', name: 'Eight of Wands', suit: 'Wands', number: 8,
            description: 'Speed, action, movement, quick decisions',
            image: IMG('eight_wands'),
            meaning: 'The Eight of Wands represents rapid action, swift movement, and things falling into place quickly.',
            reversed: 'Delays, frustration, holding off, resistance',
            element: 'Fire'
        },
        {
            id: 'nine_wands', name: 'Nine of Wands', suit: 'Wands', number: 9,
            description: 'Resilience, courage, persistence, last stand',
            image: IMG('nine_wands'),
            meaning: 'The Nine of Wands represents resilience, courage, and persistence. You are close to the finish line — don\'t give up.',
            reversed: 'Exhaustion, giving up, paranoia, defensive',
            element: 'Fire'
        },
        {
            id: 'ten_wands', name: 'Ten of Wands', suit: 'Wands', number: 10,
            description: 'Burden, responsibility, hard work, stress',
            image: IMG('ten_wands'),
            meaning: 'The Ten of Wands represents carrying a heavy burden, overcommitment, and the need to delegate or release.',
            reversed: 'Inability to delegate, overstressed, burned out',
            element: 'Fire'
        },
        {
            id: 'page_wands', name: 'Page of Wands', suit: 'Wands', number: 11,
            description: 'Enthusiasm, exploration, discovery, free spirit',
            image: IMG('page_wands'),
            meaning: 'The Page of Wands represents enthusiasm, exploration, and the excitement of discovery and new adventures.',
            reversed: 'Setbacks, lack of direction, procrastination, boredom',
            element: 'Fire'
        },
        {
            id: 'knight_wands', name: 'Knight of Wands', suit: 'Wands', number: 12,
            description: 'Energy, passion, adventure, impulsiveness',
            image: IMG('knight_wands'),
            meaning: 'The Knight of Wands represents passionate energy, adventure, and bold action. Charge ahead fearlessly.',
            reversed: 'Haste, scattered energy, delays, frustration',
            element: 'Fire'
        },
        {
            id: 'queen_wands', name: 'Queen of Wands', suit: 'Wands', number: 13,
            description: 'Confidence, independence, determination, warmth',
            image: IMG('queen_wands'),
            meaning: 'The Queen of Wands represents confidence, independence, and warm social energy. She inspires others with her courage.',
            reversed: 'Selfishness, jealousy, insecurities, demanding',
            element: 'Fire'
        },
        {
            id: 'king_wands', name: 'King of Wands', suit: 'Wands', number: 14,
            description: 'Leadership, vision, entrepreneurship, honour',
            image: IMG('king_wands'),
            meaning: 'The King of Wands represents natural leadership, bold vision, and the ability to turn ideas into reality.',
            reversed: 'Impulsive, domineering, vicious, powerless',
            element: 'Fire'
        },

        // ═══════════════════════════════════════
        // CUPS (Water)
        // ═══════════════════════════════════════
        {
            id: 'ace_cups', name: 'Ace of Cups', suit: 'Cups', number: 1,
            description: 'New feelings, emotional awakening, love, compassion',
            image: IMG('ace_cups'),
            meaning: 'The Ace of Cups represents the beginning of new emotional experiences — love, compassion, and spiritual connections.',
            reversed: 'Emotional loss, blocked creativity, emptiness',
            element: 'Water'
        },
        {
            id: 'two_cups', name: 'Two of Cups', suit: 'Cups', number: 2,
            description: 'Partnership, unity, attraction, connection',
            image: IMG('two_cups'),
            meaning: 'The Two of Cups represents deep partnership, unity, and a soul-level connection between two people.',
            reversed: 'Breakup, imbalanced relationship, disconnection',
            element: 'Water'
        },
        {
            id: 'three_cups', name: 'Three of Cups', suit: 'Cups', number: 3,
            description: 'Celebration, friendship, community, joy',
            image: IMG('three_cups'),
            meaning: 'The Three of Cups represents celebration, friendship, and the joy of community. Gather with those you love.',
            reversed: 'Overindulgence, gossip, isolation from friends',
            element: 'Water'
        },
        {
            id: 'four_cups', name: 'Four of Cups', suit: 'Cups', number: 4,
            description: 'Apathy, contemplation, disconnection, meditation',
            image: IMG('four_cups'),
            meaning: 'The Four of Cups represents apathy, contemplation, and being too focused on what you lack to see what is offered.',
            reversed: 'Sudden awareness, new motivation, acceptance',
            element: 'Water'
        },
        {
            id: 'five_cups', name: 'Five of Cups', suit: 'Cups', number: 5,
            description: 'Loss, grief, regret, disappointment',
            image: IMG('five_cups'),
            meaning: 'The Five of Cups represents loss and grief but reminds you that not all is lost — two cups still stand behind you.',
            reversed: 'Acceptance, moving on, finding peace, forgiveness',
            element: 'Water'
        },
        {
            id: 'six_cups', name: 'Six of Cups', suit: 'Cups', number: 6,
            description: 'Nostalgia, childhood memories, innocence, reunion',
            image: IMG('six_cups'),
            meaning: 'The Six of Cups represents nostalgia, revisiting the past, and the innocence of childhood memories.',
            reversed: 'Living in the past, unrealistic expectations, naivety',
            element: 'Water'
        },
        {
            id: 'seven_cups', name: 'Seven of Cups', suit: 'Cups', number: 7,
            description: 'Illusion, fantasy, choices, wishful thinking',
            image: IMG('seven_cups'),
            meaning: 'The Seven of Cups represents many choices, fantasy, and the need to separate illusion from reality.',
            reversed: 'Alignment, personal values, overwhelm, clarity',
            element: 'Water'
        },
        {
            id: 'eight_cups', name: 'Eight of Cups', suit: 'Cups', number: 8,
            description: 'Walking away, disillusionment, seeking deeper meaning',
            image: IMG('eight_cups'),
            meaning: 'The Eight of Cups represents walking away from something emotionally unfulfilling in search of deeper meaning.',
            reversed: 'Avoidance, fear of change, aimless drifting',
            element: 'Water'
        },
        {
            id: 'nine_cups', name: 'Nine of Cups', suit: 'Cups', number: 9,
            description: 'Contentment, satisfaction, wishes fulfilled',
            image: IMG('nine_cups'),
            meaning: 'The Nine of Cups is the "wish card" — representing contentment, satisfaction, and emotional fulfillment.',
            reversed: 'Inner happiness, materialism, dissatisfaction, greed',
            element: 'Water'
        },
        {
            id: 'ten_cups', name: 'Ten of Cups', suit: 'Cups', number: 10,
            description: 'Harmony, marriage, happiness, family',
            image: IMG('ten_cups'),
            meaning: 'The Ten of Cups represents ultimate emotional fulfillment, family harmony, and lasting happiness.',
            reversed: 'Broken family, domestic disharmony, neglect',
            element: 'Water'
        },
        {
            id: 'page_cups', name: 'Page of Cups', suit: 'Cups', number: 11,
            description: 'Creative opportunity, intuitive message, curiosity',
            image: IMG('page_cups'),
            meaning: 'The Page of Cups represents creative beginnings, messages of love, and an open-hearted, curious nature.',
            reversed: 'Creative block, emotional immaturity, insecurity',
            element: 'Water'
        },
        {
            id: 'knight_cups', name: 'Knight of Cups', suit: 'Cups', number: 12,
            description: 'Romance, charm, imagination, idealism',
            image: IMG('knight_cups'),
            meaning: 'The Knight of Cups represents romantic proposals, charm, and pursuing your heart\'s desire with grace.',
            reversed: 'Unrealistic expectations, jealousy, moodiness',
            element: 'Water'
        },
        {
            id: 'queen_cups', name: 'Queen of Cups', suit: 'Cups', number: 13,
            description: 'Compassion, calm, emotional security, intuition',
            image: IMG('queen_cups'),
            meaning: 'The Queen of Cups represents deep compassion, calm intuition, and emotional security. She feels deeply.',
            reversed: 'Insecurity, codependency, emotional manipulation',
            element: 'Water'
        },
        {
            id: 'king_cups', name: 'King of Cups', suit: 'Cups', number: 14,
            description: 'Emotional balance, diplomacy, generosity, wisdom',
            image: IMG('king_cups'),
            meaning: 'The King of Cups represents emotional maturity, diplomatic grace, and generosity of spirit.',
            reversed: 'Emotional manipulation, moodiness, volatility',
            element: 'Water'
        },

        // ═══════════════════════════════════════
        // SWORDS (Air)
        // ═══════════════════════════════════════
        {
            id: 'ace_swords', name: 'Ace of Swords', suit: 'Swords', number: 1,
            description: 'Clarity, breakthrough, new idea, mental force',
            image: IMG('ace_swords'),
            meaning: 'The Ace of Swords represents a breakthrough moment — clarity of thought, new ideas, and the triumph of truth.',
            reversed: 'Confusion, chaos, lack of clarity, brutality',
            element: 'Air'
        },
        {
            id: 'two_swords', name: 'Two of Swords', suit: 'Swords', number: 2,
            description: 'Difficult choices, indecision, stalemate',
            image: IMG('two_swords'),
            meaning: 'The Two of Swords represents a difficult choice, being at a crossroads, and the need for careful deliberation.',
            reversed: 'Indecision, confusion, information overload',
            element: 'Air'
        },
        {
            id: 'three_swords', name: 'Three of Swords', suit: 'Swords', number: 3,
            description: 'Heartbreak, sorrow, grief, rejection',
            image: IMG('three_swords'),
            meaning: 'The Three of Swords represents heartbreak, sorrow, and emotional pain. Healing comes through feeling.',
            reversed: 'Recovery, forgiveness, moving on, optimism',
            element: 'Air'
        },
        {
            id: 'four_swords', name: 'Four of Swords', suit: 'Swords', number: 4,
            description: 'Rest, recovery, contemplation, solitude',
            image: IMG('four_swords'),
            meaning: 'The Four of Swords represents rest, recovery, and the need for quiet contemplation before moving forward.',
            reversed: 'Restlessness, burnout, lack of progress, stagnation',
            element: 'Air'
        },
        {
            id: 'five_swords', name: 'Five of Swords', suit: 'Swords', number: 5,
            description: 'Conflict, defeat, winning at all costs',
            image: IMG('five_swords'),
            meaning: 'The Five of Swords represents conflict, defeat, and the hollow victory of winning at all costs.',
            reversed: 'Reconciliation, end of conflict, forgiveness, making amends',
            element: 'Air'
        },
        {
            id: 'six_swords', name: 'Six of Swords', suit: 'Swords', number: 6,
            description: 'Transition, moving on, leaving behind, travel',
            image: IMG('six_swords'),
            meaning: 'The Six of Swords represents transition — moving away from difficulty toward calmer waters and a better future.',
            reversed: 'Inability to move on, unresolved issues, resistance to change',
            element: 'Air'
        },
        {
            id: 'seven_swords', name: 'Seven of Swords', suit: 'Swords', number: 7,
            description: 'Deception, strategy, stealth, betrayal',
            image: IMG('seven_swords'),
            meaning: 'The Seven of Swords represents deception, strategy, and the need for a clever approach. Be wary of dishonesty.',
            reversed: 'Coming clean, rethinking approach, confession, conscience',
            element: 'Air'
        },
        {
            id: 'eight_swords', name: 'Eight of Swords', suit: 'Swords', number: 8,
            description: 'Restriction, imprisonment, self-limiting beliefs',
            image: IMG('eight_swords'),
            meaning: 'The Eight of Swords represents feeling trapped by self-imposed limitations. The blindfold can be removed.',
            reversed: 'Self-acceptance, new perspective, freedom, release',
            element: 'Air'
        },
        {
            id: 'nine_swords', name: 'Nine of Swords', suit: 'Swords', number: 9,
            description: 'Anxiety, worry, fear, nightmares',
            image: IMG('nine_swords'),
            meaning: 'The Nine of Swords represents anxiety, worry, and sleepless nights. Your fears may be worse than reality.',
            reversed: 'Inner turmoil, deep-seated fears, hope, recovery',
            element: 'Air'
        },
        {
            id: 'ten_swords', name: 'Ten of Swords', suit: 'Swords', number: 10,
            description: 'Painful ending, rock bottom, betrayal, loss',
            image: IMG('ten_swords'),
            meaning: 'The Ten of Swords represents a painful ending and rock bottom — but the sunrise on the horizon signals new beginnings.',
            reversed: 'Recovery, regeneration, inevitable end, rising up',
            element: 'Air'
        },
        {
            id: 'page_swords', name: 'Page of Swords', suit: 'Swords', number: 11,
            description: 'Curiosity, mental energy, new ideas, vigilance',
            image: IMG('page_swords'),
            meaning: 'The Page of Swords represents intellectual curiosity, new ideas, and the thirst for knowledge and truth.',
            reversed: 'All talk no action, haste, scattered thoughts',
            element: 'Air'
        },
        {
            id: 'knight_swords', name: 'Knight of Swords', suit: 'Swords', number: 12,
            description: 'Ambition, action, fast thinking, drive',
            image: IMG('knight_swords'),
            meaning: 'The Knight of Swords represents swift action, ambition, and charging toward your goals with focused determination.',
            reversed: 'Impulsiveness, no direction, disregard for consequences',
            element: 'Air'
        },
        {
            id: 'queen_swords', name: 'Queen of Swords', suit: 'Swords', number: 13,
            description: 'Independence, clear boundaries, direct communication',
            image: IMG('queen_swords'),
            meaning: 'The Queen of Swords represents independent thought, clear boundaries, and unbiased judgment.',
            reversed: 'Coldness, cruelty, bitterness, overly critical',
            element: 'Air'
        },
        {
            id: 'king_swords', name: 'King of Swords', suit: 'Swords', number: 14,
            description: 'Intellectual power, authority, truth, clear thinking',
            image: IMG('king_swords'),
            meaning: 'The King of Swords represents intellectual power, authority, and the pursuit of truth through reason and ethics.',
            reversed: 'Manipulative, tyrannical, abuse of power',
            element: 'Air'
        },

        // ═══════════════════════════════════════
        // PENTACLES (Earth)
        // ═══════════════════════════════════════
        {
            id: 'ace_pentacles', name: 'Ace of Pentacles', suit: 'Pentacles', number: 1,
            description: 'New financial opportunity, prosperity, manifestation',
            image: IMG('ace_pentacles'),
            meaning: 'The Ace of Pentacles represents new financial or material opportunity — the seed of prosperity and abundance.',
            reversed: 'Lost opportunity, lack of planning, financial setback',
            element: 'Earth'
        },
        {
            id: 'two_pentacles', name: 'Two of Pentacles', suit: 'Pentacles', number: 2,
            description: 'Balance, adaptability, time management, priorities',
            image: IMG('two_pentacles'),
            meaning: 'The Two of Pentacles represents juggling priorities, adapting to change, and balancing multiple responsibilities.',
            reversed: 'Overwhelmed, disorganized, financial loss, overextended',
            element: 'Earth'
        },
        {
            id: 'three_pentacles', name: 'Three of Pentacles', suit: 'Pentacles', number: 3,
            description: 'Teamwork, collaboration, skill, craftsmanship',
            image: IMG('three_pentacles'),
            meaning: 'The Three of Pentacles represents teamwork, collaboration, and the mastery of one\'s craft through dedication.',
            reversed: 'Lack of teamwork, disorganization, poor quality work',
            element: 'Earth'
        },
        {
            id: 'four_pentacles', name: 'Four of Pentacles', suit: 'Pentacles', number: 4,
            description: 'Security, saving, conservatism, control',
            image: IMG('four_pentacles'),
            meaning: 'The Four of Pentacles represents security and the desire to save and protect your resources and achievements.',
            reversed: 'Greed, materialism, spending spree, insecurity',
            element: 'Earth'
        },
        {
            id: 'five_pentacles', name: 'Five of Pentacles', suit: 'Pentacles', number: 5,
            description: 'Financial loss, poverty, isolation, worry',
            image: IMG('five_pentacles'),
            meaning: 'The Five of Pentacles represents financial hardship and feeling left out in the cold. Help is available if you seek it.',
            reversed: 'Recovery, charity, improvement, end of hard times',
            element: 'Earth'
        },
        {
            id: 'six_pentacles', name: 'Six of Pentacles', suit: 'Pentacles', number: 6,
            description: 'Generosity, charity, giving, sharing wealth',
            image: IMG('six_pentacles'),
            meaning: 'The Six of Pentacles represents generosity, sharing wealth, and the balance between giving and receiving.',
            reversed: 'Strings attached, debt, selfishness, one-sided charity',
            element: 'Earth'
        },
        {
            id: 'seven_pentacles', name: 'Seven of Pentacles', suit: 'Pentacles', number: 7,
            description: 'Patience, long-term view, investment, perseverance',
            image: IMG('seven_pentacles'),
            meaning: 'The Seven of Pentacles represents patience, reflecting on progress, and evaluating long-term investments.',
            reversed: 'Impatience, lack of return, poor investment, frustration',
            element: 'Earth'
        },
        {
            id: 'eight_pentacles', name: 'Eight of Pentacles', suit: 'Pentacles', number: 8,
            description: 'Diligence, mastery, skill development, education',
            image: IMG('eight_pentacles'),
            meaning: 'The Eight of Pentacles represents mastery through diligent practice, apprenticeship, and dedication to your craft.',
            reversed: 'Perfectionism, lack of motivation, self-development',
            element: 'Earth'
        },
        {
            id: 'nine_pentacles', name: 'Nine of Pentacles', suit: 'Pentacles', number: 9,
            description: 'Abundance, luxury, self-sufficiency, independence',
            image: IMG('nine_pentacles'),
            meaning: 'The Nine of Pentacles represents abundance, luxury, and the financial independence earned through hard work.',
            reversed: 'Over-investment, reckless spending, superficiality',
            element: 'Earth'
        },
        {
            id: 'ten_pentacles', name: 'Ten of Pentacles', suit: 'Pentacles', number: 10,
            description: 'Wealth, inheritance, family, establishment',
            image: IMG('ten_pentacles'),
            meaning: 'The Ten of Pentacles represents lasting wealth, family legacy, and the ultimate material and spiritual abundance.',
            reversed: 'Financial failure, family conflicts, loss of wealth',
            element: 'Earth'
        },
        {
            id: 'page_pentacles', name: 'Page of Pentacles', suit: 'Pentacles', number: 11,
            description: 'Ambition, desire, diligence, scholarship',
            image: IMG('page_pentacles'),
            meaning: 'The Page of Pentacles represents ambition, scholarship, and the desire to learn and build something tangible.',
            reversed: 'Lack of progress, procrastination, failure to launch',
            element: 'Earth'
        },
        {
            id: 'knight_pentacles', name: 'Knight of Pentacles', suit: 'Pentacles', number: 12,
            description: 'Hard work, routine, responsibility, thoroughness',
            image: IMG('knight_pentacles'),
            meaning: 'The Knight of Pentacles represents methodical hard work, responsibility, and steady progress toward your goals.',
            reversed: 'Boredom, feeling stuck, laziness, perfectionism',
            element: 'Earth'
        },
        {
            id: 'queen_pentacles', name: 'Queen of Pentacles', suit: 'Pentacles', number: 13,
            description: 'Nurturing, practical, financial security, warmth',
            image: IMG('queen_pentacles'),
            meaning: 'The Queen of Pentacles represents practical nurturing, financial security, and a warm, grounded presence.',
            reversed: 'Financial insecurity, neglect, smothering, work-life imbalance',
            element: 'Earth'
        },
        {
            id: 'king_pentacles', name: 'King of Pentacles', suit: 'Pentacles', number: 14,
            description: 'Wealth, business, abundance, security, discipline',
            image: IMG('king_pentacles'),
            meaning: 'The King of Pentacles represents wealth, business success, and the discipline to build lasting abundance.',
            reversed: 'Financially inept, obsessed with wealth, stubborn',
            element: 'Earth'
        },
    ];

    private spreads: SpreadType[] = [
        {
            id: 'single',
            name: 'Single Card',
            description: 'A simple one-card reading for daily guidance',
            cardCount: 1,
            positions: ['Guidance']
        },
        {
            id: 'three-card',
            name: 'Three Card Spread',
            description: 'Past, Present, Future reading',
            cardCount: 3,
            positions: ['Past', 'Present', 'Future']
        },
        {
            id: 'celtic-cross',
            name: 'Celtic Cross',
            description: 'A comprehensive ten-card reading',
            cardCount: 10,
            positions: ['Situation', 'Challenge', 'Past', 'Future', 'Above', 'Below', 'Advice', 'External', 'Hopes/Fears', 'Outcome']
        },
        {
            id: 'horseshoe',
            name: 'Horseshoe Spread',
            description: 'A seven-card crescent for detailed insight',
            cardCount: 7,
            positions: ['Past', 'Present', 'Hidden Influences', 'Obstacle', 'Environment', 'Advice', 'Outcome']
        },
        {
            id: 'yes-no',
            name: 'Yes / No',
            description: 'A single card to answer your yes or no question',
            cardCount: 1,
            positions: ['Your Answer']
        },
        {
            id: 'career',
            name: 'Career Path',
            description: 'Four cards illuminating your professional journey',
            cardCount: 4,
            positions: ['Current Role', 'Challenge', 'Action', 'Outcome']
        },
        {
            id: 'relationship',
            name: 'Relationship',
            description: 'Five cards exploring the heart connection',
            cardCount: 5,
            positions: ['You', 'Partner', 'Connection', 'Challenge', 'Potential']
        }
    ];

    getDailyReading(): Reading {
        const shuffledCards = this.shuffleCards();
        const card = shuffledCards[0];

        return {
            id: Date.now().toString(),
            date: new Date(),
            cards: [card],
            type: 'daily',
            spread: 'single',
            theme: 'general'
        };
    }

    getCustomReading(spreadType: string, theme: string, question?: string): Reading {
        const spread = this.spreads.find(s => s.id === spreadType);
        if (!spread) {
            throw new Error('Invalid spread type');
        }

        const shuffledCards = this.shuffleCards();
        const selectedCards = shuffledCards.slice(0, spread.cardCount);

        return {
            id: Date.now().toString(),
            date: new Date(),
            cards: selectedCards,
            question,
            type: 'custom',
            spread: spreadType,
            theme: theme as any
        };
    }

    getAllCards(): Card[] {
        return [...this.cards];
    }

    getAvailableSpreads(): SpreadType[] {
        return [...this.spreads];
    }

    getSavedReadings(): Reading[] {
        try {
            const saved = safeStorage.getItem('tarot_readings');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved readings:', error);
            return [];
        }
    }

    saveReading(reading: Reading): void {
        try {
            const saved = this.getSavedReadings();
            saved.unshift(reading);
            // Keep only the last 50 readings
            if (saved.length > 50) {
                saved.splice(50);
            }
            safeStorage.setItem('tarot_readings', JSON.stringify(saved));
        } catch (error) {
            console.error('Error saving reading:', error);
        }
    }

    private shuffleCards(): Card[] {
        const shuffled = [...this.cards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}