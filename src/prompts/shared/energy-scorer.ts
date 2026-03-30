/**
 * Spread Energy Scorer
 *
 * Analyzes drawn cards → returns 'challenging' | 'affirming' | 'crossroads'.
 * Drives which tone variant fires in the Wise Mirror system.
 *
 * Scoring method:
 * 1. Each card has a base energy value (-1.0 to +1.0)
 * 2. Reversed cards flip polarity by 0.6× (The Tower reversed = lesson learned = slightly positive)
 * 3. Position importance multiplies the energy (Outcome position matters more than Past)
 * 4. Total weighted energy → threshold buckets
 */

import type { Card } from '../../models/card.model';
import type { SpreadEnergy } from './wise-mirror';

// ── Types ──

export interface DrawnCard {
    card: Card;
    position: string;
    isReversed: boolean;
}

// ── Thresholds ──

const AFFIRMING_THRESHOLD = 0.25;   // Total > +0.25 → affirming
const CHALLENGING_THRESHOLD = -0.25; // Total < -0.25 → challenging
// Between = crossroads

// ── Position Weight Maps ──

/**
 * How much each position contributes to the overall energy score.
 * Higher weight = this position's card energy matters more.
 */
const POSITION_WEIGHTS: Record<string, number> = {
    // Three-Card Spread
    'Past': 0.6,
    'Present': 1.0,
    'Future': 1.4,

    // Mind-Body-Spirit (Today's Energy)
    'Mind': 0.9,
    'Body': 1.0,
    'Spirit': 1.1,

    // Celtic Cross
    'Present Situation': 1.0,
    'Challenge': 1.2,
    'Past Foundation': 0.5,
    'Recent Past': 0.7,
    'Best Outcome': 1.3,
    'Near Future': 1.2,
    'Self': 0.8,
    'Environment': 0.7,
    'Hopes & Fears': 0.9,
    'Final Outcome': 1.5,

    // Horseshoe
    'Past Influences': 0.5,
    'Current Situation': 1.0,
    'Hidden Influences': 0.8,
    'Obstacles': 1.1,
    'External Influences': 0.7,
    'Advice': 1.2,
    'Outcome': 1.4,

    // Yes/No
    'Answer': 1.5,

    // Career Path
    'Current Position': 0.8,
    'Strengths': 1.0,
    'Challenges': 1.1,
    'Action': 1.2,
    'Career Outcome': 1.4,

    // Relationship
    'You': 0.8,
    'Partner': 0.8,
    'Connection': 1.0,
    'Relationship Challenge': 1.2,
    'Direction': 1.4,
};

const DEFAULT_WEIGHT = 1.0;

// ── Card Energy Map ──
// Major Arcana: individually scored based on traditional meaning
// Minor Arcana: scored by suit tendency + number patterns

const MAJOR_ARCANA_ENERGY: Record<string, number> = {
    'The Fool': 0.5,         // New beginnings, leap of faith
    'The Magician': 0.7,     // Power, manifestation
    'The High Priestess': 0.2, // Mystery, intuition — neutral-positive
    'The Empress': 0.8,      // Abundance, nurture
    'The Emperor': 0.5,      // Structure, authority — depends on context
    'The Hierophant': 0.3,   // Tradition, conformity — slightly positive
    'The Lovers': 0.7,       // Love, harmony, alignment
    'The Chariot': 0.7,      // Victory, determination
    'Strength': 0.8,         // Courage, inner power
    'The Hermit': 0.1,       // Solitude, reflection — neutral
    'Wheel of Fortune': 0.3, // Change, cycles — can go either way
    'Justice': 0.2,          // Balance, fairness — neutral
    'The Hanged Man': -0.2,  // Suspension, letting go — slightly challenging
    'Death': -0.4,           // Transformation, endings — challenging but not worst
    'Temperance': 0.5,       // Balance, patience, harmony
    'The Devil': -0.7,       // Bondage, shadow, addiction
    'The Tower': -0.9,       // Disruption, upheaval
    'The Star': 0.9,         // Hope, inspiration, renewal
    'The Moon': -0.3,        // Illusion, fear, subconscious — challenging
    'The Sun': 1.0,          // Joy, success, vitality — most positive
    'Judgement': 0.4,        // Rebirth, reflection, calling
    'The World': 0.9,        // Completion, fulfillment, integration
};

/**
 * Get base energy for a Minor Arcana card based on suit + number patterns.
 * Suits have inherent tendencies:
 * - Cups: emotional, generally positive
 * - Pentacles: material, generally positive
 * - Wands: creative/action, mixed
 * - Swords: mental/conflict, generally challenging
 *
 * Numbers have universal patterns:
 * - Aces: +0.7 (new beginnings)
 * - 2-4: mild/developing
 * - 5s: -0.6 (challenge, conflict — universally difficult)
 * - 6s: +0.5 (harmony, resolution)
 * - 7s: -0.1 (reflection, testing)
 * - 8s: varies heavily by suit
 * - 9s: near-completion, mixed
 * - 10s: culmination, varies by suit
 * - Pages: +0.3 (fresh energy)
 * - Knights: +0.3 (action, movement)
 * - Queens: +0.5 (mastery, nurture)
 * - Kings: +0.5 (authority, completion)
 */
function getMinorEnergy(suit: string, number: number | undefined): number {
    if (number === undefined) return 0;

    // Suit modifiers
    const suitMod: Record<string, number> = {
        'Cups': 0.1,
        'Pentacles': 0.1,
        'Wands': 0.0,
        'Swords': -0.15,
    };

    const mod = suitMod[suit] ?? 0;

    // Number-based energy
    const numberEnergy: Record<number, number> = {
        1: 0.7,    // Ace — new beginnings
        2: 0.2,    // Duality, balance
        3: 0.4,    // Growth, creativity
        4: 0.1,    // Stability, rest
        5: -0.6,   // Conflict, loss, challenge
        6: 0.5,    // Harmony, generosity
        7: -0.1,   // Reflection, assessment
        8: 0.2,    // Movement, power (except 8 of Swords)
        9: 0.1,    // Near-completion
        10: 0.3,   // Completion, culmination
        11: 0.3,   // Page — fresh energy
        12: 0.3,   // Knight — action
        13: 0.5,   // Queen — mastery
        14: 0.5,   // King — authority
    };

    let base = numberEnergy[number] ?? 0;

    // Specific overrides for cards that deviate from patterns
    if (suit === 'Swords') {
        if (number === 3) base = -0.7;   // Three of Swords — heartbreak
        if (number === 8) base = -0.5;   // Eight of Swords — trapped
        if (number === 9) base = -0.6;   // Nine of Swords — anxiety
        if (number === 10) base = -0.8;  // Ten of Swords — rock bottom
    }
    if (suit === 'Cups') {
        if (number === 5) base = -0.5;   // Five of Cups — grief, loss
        if (number === 10) base = 0.9;   // Ten of Cups — emotional fulfillment
    }
    if (suit === 'Pentacles') {
        if (number === 5) base = -0.6;   // Five of Pentacles — hardship
        if (number === 10) base = 0.8;   // Ten of Pentacles — legacy, wealth
    }
    if (suit === 'Wands') {
        if (number === 10) base = -0.3;  // Ten of Wands — burden
    }

    return base + mod;
}

// ── Main Scorer ──

/**
 * Score the overall energy of a spread.
 *
 * @param drawnCards - Array of drawn cards with position and reversal state
 * @returns SpreadEnergy classification
 */
export function scoreSpreadEnergy(drawnCards: DrawnCard[]): SpreadEnergy {
    if (drawnCards.length === 0) return 'crossroads';

    let totalWeightedEnergy = 0;
    let totalWeight = 0;

    for (const { card, position, isReversed } of drawnCards) {
        // Get base energy
        let energy: number;
        if (MAJOR_ARCANA_ENERGY[card.name] !== undefined) {
            energy = MAJOR_ARCANA_ENERGY[card.name];
        } else {
            energy = getMinorEnergy(card.suit, card.number);
        }

        // Reversed cards flip polarity by 0.6×
        // Tower reversed (-0.9 × -0.6) = +0.54 (lesson learned)
        // The Sun reversed (+1.0 × -0.6) = -0.6 (blocked joy)
        if (isReversed) {
            energy = energy * -0.6;
        }

        // Position weight
        const weight = POSITION_WEIGHTS[position] ?? DEFAULT_WEIGHT;
        totalWeightedEnergy += energy * weight;
        totalWeight += weight;
    }

    // Normalize by total weight
    const normalizedScore = totalWeight > 0 ? totalWeightedEnergy / totalWeight : 0;

    if (normalizedScore > AFFIRMING_THRESHOLD) return 'affirming';
    if (normalizedScore < CHALLENGING_THRESHOLD) return 'challenging';
    return 'crossroads';
}

/**
 * Get the raw energy score (useful for debugging/display).
 */
export function getRawEnergyScore(drawnCards: DrawnCard[]): number {
    if (drawnCards.length === 0) return 0;

    let totalWeightedEnergy = 0;
    let totalWeight = 0;

    for (const { card, position, isReversed } of drawnCards) {
        let energy: number;
        if (MAJOR_ARCANA_ENERGY[card.name] !== undefined) {
            energy = MAJOR_ARCANA_ENERGY[card.name];
        } else {
            energy = getMinorEnergy(card.suit, card.number);
        }

        if (isReversed) {
            energy = energy * -0.6;
        }

        const weight = POSITION_WEIGHTS[position] ?? DEFAULT_WEIGHT;
        totalWeightedEnergy += energy * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? totalWeightedEnergy / totalWeight : 0;
}
