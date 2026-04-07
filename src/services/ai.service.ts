import { safeStorage } from "./storage.service";
import {
    buildEmpowermentContext,
    buildManifestationContextString,
    buildCompassionSystemPrefix,
    type EmpowermentContext,
} from './empowerment.service';
import { getActiveManifestations } from './manifestation.service';
import {
    getBirthData, getNatalTriad, getLifePathNumber, getCurrentPersonalYear,
    getDestinyName, getDestinyNumber,
} from './astrology.service';

/**
 * AI Interpretation Service — OpenRouter Integration
 * Uses Claude Haiku 4.5 via OpenRouter for all AI interpretations.
 *
 * All prompts live in src/prompts/ — this file is a thin orchestration layer.
 * It handles: API keys, caching, rate limiting, and routing calls to prompt builders.
 */

import { getMemoryContextForAI } from './memory.service';
import { buildReadingMemoryContext } from '../prompts/shared/reading-context';

// ── Prompt Builders ──
import { TEACHING_FORMAT } from '../prompts/shared/wise-mirror';
import { scoreSpreadEnergy, type DrawnCard } from '../prompts/shared/energy-scorer';
import { buildCardInsightPrompt } from '../prompts/tarot/card-insight';
import { buildSpreadInsightPrompt } from '../prompts/tarot/spread-insight';
import { buildEnergyReadingPrompt } from '../prompts/tarot/energy-reading';
import { buildDeclarationPrompt } from '../prompts/tarot/declaration';
import { buildRitualFollowUpPrompt } from '../prompts/tarot/ritual-follow-up';
import { buildRitualRecommendationPrompt, VALID_SPREADS, VALID_THEMES } from '../prompts/tarot/ritual-recommendation';
import { buildPlacementInsightPrompt } from '../prompts/astrology/placement-insight';
import { buildCosmicSynthesisPrompt } from '../prompts/astrology/cosmic-synthesis';
import { buildChartSummaryPrompt } from '../prompts/astrology/chart-summary';
import { buildCosmicBlueprintPrompt } from '../prompts/astrology/cosmic-blueprint';
import { buildTransitPrompt } from '../prompts/astrology/transit';
import { buildHoroscopePrompt } from '../prompts/astrology/horoscope';
import { buildRelationshipSynthesisPrompt } from '../prompts/relationships/relationship-synthesis';
import { buildSynastryAspectPrompt } from '../prompts/relationships/synastry-aspect';
import { buildSynastryDeepDivePrompt } from '../prompts/relationships/synastry-deep-dive';
import { buildFamilyReadingPrompt } from '../prompts/relationships/family-reading';
import { buildSiblingReadingPrompt } from '../prompts/relationships/sibling-reading';
import { buildJournalPatternsPrompt } from '../prompts/journal/journal-patterns';
import { buildDreamInterpretationPrompt } from '../prompts/journal/dream-interpretation';
import { buildCareerAlignmentPrompt } from '../prompts/career/career-alignment';
import { buildYearAheadPrompt } from '../prompts/forecast/year-ahead';
import { buildAngelNumberPrompt } from '../prompts/numerology/angel-number';
import type { Card } from '../models/card.model';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-haiku-4.5';
const PREMIUM_MODEL = 'anthropic/claude-haiku-4.5';
const LITE_MODEL = 'google/gemini-2.5-flash-lite';  // Cost-efficient model for structured/simple outputs
const STORAGE_KEY = 'openrouter_api_key';

// ── Caching ──

export const dailyCache = {
    get(key: string): string | null {
        const today = new Date().toISOString().slice(0, 10);
        const raw = safeStorage.getItem(`daily_${key}`);
        if (!raw) return null;
        try {
            const { date, value } = JSON.parse(raw);
            return date === today ? value : null;
        } catch { return null; }
    },
    set(key: string, value: string): void {
        const today = new Date().toISOString().slice(0, 10);
        safeStorage.setItem(`daily_${key}`, JSON.stringify({ date: today, value }));
    },
};

export const permanentCache = {
    get(key: string): string | null {
        return safeStorage.getItem(`perm_${key}`) || null;
    },
    set(key: string, value: string): void {
        safeStorage.setItem(`perm_${key}`, value);
    },
    clear(key: string): void {
        safeStorage.removeItem(`perm_${key}`);
    },
};

// ── Helpers ──

function buildChartNumerologyContext(): string | null {
    try {
        const birthData = getBirthData();
        if (!birthData?.birthday) return null;
        const triad = getNatalTriad(birthData);
        const lifePath = getLifePathNumber(birthData.birthday);
        const personalYear = getCurrentPersonalYear(birthData.birthday);
        const destinyName = getDestinyName();
        const destinyNum = destinyName ? getDestinyNumber(destinyName) : null;

        const numerology = destinyNum
            ? `Life Path: ${lifePath} · Personal Year: ${personalYear} · Destiny Number: ${destinyNum}`
            : `Life Path: ${lifePath} · Personal Year: ${personalYear}`;

        return `\n\nSEEKER'S COSMIC PROFILE (weave naturally — do NOT list mechanically):
☀️ Sun: ${triad.sun.name} (${triad.sun.element}) · 🌙 Moon: ${triad.moon.name} (${triad.moon.element}) · ⬆️ Rising: ${triad.rising.name} (${triad.rising.element})
${numerology}
Use this to personalize how the insight lands — which parts of the reading resonate with their chart energy, and how their current numerological cycle colors the timing.`;
    } catch {
        return null;
    }
}

// ── AI Service ──

export class AIService {
    private apiKey: string | null = null;

    constructor() {
        this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || safeStorage.getItem(STORAGE_KEY) || null;
    }

    hasApiKey(): boolean { return !!this.apiKey && this.apiKey.length > 10; }
    getApiKey(): string { return this.apiKey || ''; }

    // ────────────────────────────────────────────
    // TAROT
    // ────────────────────────────────────────────

    /**
     * Get a personalized AI insight for a single card.
     * Powered by Wise Mirror dynamic tone engine.
     */
    async getCardInsight(
        cardName: string,
        cardMeaning: string,
        cardReversed: string,
        context?: { theme?: string; question?: string },
        empowermentCtx?: EmpowermentContext,
        isReversed: boolean = false,
    ): Promise<string> {
        const ctx = empowermentCtx ?? buildEmpowermentContext(context?.question, [cardName]);
        const activeManifestations = getActiveManifestations();
        const manifestationCtx = buildManifestationContextString(ctx, activeManifestations);
        const compassionPrefix = ctx.compassionMode ? buildCompassionSystemPrefix() : '';

        const cardForScoring: Card = { id: '', name: cardName, description: '', image: '', meaning: cardMeaning, reversed: cardReversed, suit: '' };
        const drawnCards: DrawnCard[] = [{ card: cardForScoring, position: 'Present', isReversed }];
        const tone = scoreSpreadEnergy(drawnCards);

        const { system, user } = buildCardInsightPrompt({
            cardName, cardMeaning, cardReversed, isReversed, tone,
            theme: context?.theme, question: context?.question,
            empowermentCtx: ctx, manifestationCtx, compassionPrefix,
            memoryCtx: getMemoryContextForAI(),
            // Only inject reading memory during active readings (context provided),
            // not when browsing card library or tapping the daily card
            readingMemoryCtx: context ? buildReadingMemoryContext(context.theme || 'general', context.question) : null,
            chartCtx: buildChartNumerologyContext(),
        });
        return this.chatLite(system, user);
    }

    /**
     * Get a deep AI interpretation for a full spread reading.
     * Powered by Wise Mirror dynamic tone engine.
     */
    async getSpreadInsight(
        cards: Array<{ name: string; meaning: string; reversed?: string; position: string; isReversed?: boolean }>,
        spread: string,
        theme: string,
        question?: string,
        empowermentCtx?: EmpowermentContext,
    ): Promise<string> {
        const cardNames = cards.map(c => c.name);
        const ctx = empowermentCtx ?? buildEmpowermentContext(question, cardNames);
        const activeManifestations = getActiveManifestations();
        const manifestationCtx = buildManifestationContextString(ctx, activeManifestations);
        const compassionPrefix = ctx.compassionMode ? buildCompassionSystemPrefix() : '';

        const drawnCards: DrawnCard[] = cards.map(c => ({
            card: { id: '', name: c.name, description: '', image: '', meaning: c.meaning, reversed: c.reversed || '', suit: '' } as Card,
            position: c.position, isReversed: c.isReversed ?? false,
        }));
        const tone = scoreSpreadEnergy(drawnCards);

        const { system, user } = buildSpreadInsightPrompt({
            cards: cards.map(c => ({
                name: c.name, meaning: c.meaning, reversed: c.reversed,
                position: c.position, isReversed: c.isReversed ?? false,
            })),
            spread, theme, tone, question,
            empowermentCtx: ctx, manifestationCtx, compassionPrefix,
            memoryCtx: getMemoryContextForAI(),
            readingMemoryCtx: buildReadingMemoryContext(theme, question),
            chartCtx: buildChartNumerologyContext(),
        });

        const cardCount = cards.length;
        const tokenBudget = cardCount >= 10 ? 5000 : cardCount >= 7 ? 4000 : cardCount >= 4 ? 3000 : cardCount >= 3 ? 1500 : 800;
        return this.chat(system, user, tokenBudget);
    }

    /**
     * Get a brief daily energy interpretation for the Today's Energy cards.
     * Uses the short Wise Mirror format (3-4 sentences max).
     */
    async getEnergyReading(
        cards: Card[],
        positions: string[] = ['Mind', 'Body', 'Spirit'],
    ): Promise<string> {
        const cardData = cards.map((card, i) => ({
            card, position: positions[i] || `Position ${i + 1}`,
            isReversed: card.isReversed ?? false,
        }));
        const { system, user } = buildEnergyReadingPrompt({
            cards: cardData, chartCtx: buildChartNumerologyContext(),
        });
        return this.chatLite(system, user);
    }

    /**
     * Generate a Declaration of Ambition from a completed reading.
     */
    async getDeclaration(
        params: {
            cards: Array<{ name: string; position: string; isReversed?: boolean; meaning?: string; reversed?: string }>;
            spread: string; theme: string; question?: string; readingText: string;
        },
    ): Promise<string> {
        const drawnCards: DrawnCard[] = params.cards.map(c => ({
            card: { id: '', name: c.name, description: '', image: '', meaning: c.meaning || '', reversed: c.reversed || '', suit: '' } as Card,
            position: c.position, isReversed: c.isReversed ?? false,
        }));
        const tone = scoreSpreadEnergy(drawnCards);
        const { system, user } = buildDeclarationPrompt({ ...params, tone });
        return this.chatLite(system, user);
    }

    /**
     * Generate a contextual follow-up question for the pre-reading ritual.
     */
    async getRitualFollowUp(userQuestion: string): Promise<string> {
        const { system, user } = buildRitualFollowUpPrompt({ userQuestion });
        return this.chatLite(system, user, 80);
    }

    /**
     * Have the Oracle recommend a spread + theme based on the seeker's question.
     */
    async getRitualSpreadRecommendation(
        question: string, followUpAnswer?: string,
    ): Promise<{ spreadId: string; theme: string; explanation: string }> {
        const { system, user } = buildRitualRecommendationPrompt({ question, followUpAnswer });
        const raw = await this.chatLite(system, user, 120);
        try {
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    spreadId: (VALID_SPREADS as readonly string[]).includes(parsed.spreadId) ? parsed.spreadId : 'celtic-cross',
                    theme: (VALID_THEMES as readonly string[]).includes(parsed.theme) ? parsed.theme : 'general',
                    explanation: parsed.explanation || 'Ten cards will reveal every dimension of your question.',
                };
            }
        } catch { /* fallback */ }
        return {
            spreadId: 'celtic-cross', theme: 'general',
            explanation: 'Ten cards will lay bare the full landscape of your question — every force, every possibility.',
        };
    }

    // ────────────────────────────────────────────
    // ASTROLOGY
    // ────────────────────────────────────────────

    async getPlacementInsight(
        position: 'sun' | 'moon' | 'rising',
        sign: { name: string; element: string; ruling: string },
        triadContext?: { sun?: string; moon?: string; rising?: string },
    ): Promise<{ title: string; overview: string; strengths: string; challenges: string; advice: string }> {
        const { system, user } = buildPlacementInsightPrompt({ position, sign, triadContext });
        const raw = await this.chat(system, user);
        try {
            const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '');
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch { /* fall through */ }
        return {
            title: `${sign.name} ${position.charAt(0).toUpperCase() + position.slice(1)}`,
            overview: raw, strengths: 'Unique cosmic gifts',
            challenges: 'Growth opportunities', advice: 'Trust the wisdom of the stars.',
        };
    }

    async getCosmicSynthesis(
        triad: { sun: { name: string; element: string; ruling: string }; moon: { name: string; element: string; ruling: string }; rising: { name: string; element: string; ruling: string } },
    ): Promise<string> {
        const { system, user } = buildCosmicSynthesisPrompt({ triad, numerologyContext: buildChartNumerologyContext() });
        return this.chat(system, user);
    }

    async getFullChartSummary(
        planets: Array<{ name: string; signId: string; degreeInSign: number }>,
        aspects: Array<{ planet1Name: string; planet2Name: string; type: string; orb: number }>,
        triad: { sun: string; moon: string; rising: string },
    ): Promise<string> {
        const { system, user } = buildChartSummaryPrompt({ planets, aspects, triad, numerologyContext: buildChartNumerologyContext() });
        return this.chat(system, user);
    }

    async getCosmicBlueprint(
        triad: { sun: string; moon: string; rising: string },
        planets: Array<{ name: string; signId: string; degreeInSign: number }>,
        aspects: Array<{ planet1Name: string; planet2Name: string; type: string; orb: number }>,
        lifePath: { number: number; title: string; desc: string },
        personalYear: { number: number },
    ): Promise<string> {
        const { system, user } = buildCosmicBlueprintPrompt({ triad, planets, aspects, lifePath, personalYear });
        return this.chatPremium(system, user);
    }

    async getTransitInterpretation(
        transitPlanet: { name: string; glyph: string; signId: string; degreeInSign: number },
        natalPlanet: { name: string; glyph: string; signId: string; degreeInSign: number },
        aspect: { name: string; symbol: string; nature: string },
        orb: number, isApplying: boolean,
        triadContext?: { sun?: string; moon?: string; rising?: string },
    ): Promise<string> {
        let lifePath: number | undefined;
        let personalYear: number | undefined;
        try {
            const birthData = getBirthData();
            if (birthData?.birthday) {
                lifePath = getLifePathNumber(birthData.birthday);
                personalYear = getCurrentPersonalYear(birthData.birthday);
            }
        } catch { /* skip */ }
        const { system, user } = buildTransitPrompt({
            transitPlanet, natalPlanet, aspect, orb, isApplying, triadContext, lifePath, personalYear,
        });
        return this.chatLite(system, user, 200);
    }

    /**
     * Generate a daily horoscope using the modular prompt builder.
     */
    async getHoroscope(params: {
        sign: { name: string; element: string; ruling: string };
        dateLabel: string; mood: string; daily: string;
        triad?: { sun: { name: string }; moon: { name: string }; rising: { name: string } };
        lifePath?: number; personalYear?: number;
        activeManifestations?: string[];
    }): Promise<string> {
        const { system, user } = buildHoroscopePrompt(params);
        return this.chat(system, user);
    }

    // ────────────────────────────────────────────
    // RELATIONSHIPS
    // ────────────────────────────────────────────

    async getRelationshipSynthesis(
        userTriad: { sun: { name: string; element: string }; moon: { name: string; element: string }; rising: { name: string; element: string } },
        partnerTriad: { sun: { name: string; element: string }; moon: { name: string; element: string }; rising: { name: string; element: string } },
        score: number, tier: string,
    ): Promise<string> {
        let userLifePath: number | undefined;
        try {
            const birthData = getBirthData();
            if (birthData?.birthday) userLifePath = getLifePathNumber(birthData.birthday);
        } catch { /* skip */ }
        const { system, user } = buildRelationshipSynthesisPrompt({ userTriad, partnerTriad, score, tier, userLifePath });
        return this.chat(system, user);
    }

    async getSynastryAspectReading(
        planet1Name: string, planet1Sign: string,
        planet2Name: string, planet2Sign: string,
        aspectType: string, aspectNature: string, category: string,
        person1Label: string, person2Label: string,
    ): Promise<string> {
        const { system, user } = buildSynastryAspectPrompt({
            planet1Name, planet1Sign, planet2Name, planet2Sign,
            aspectType, aspectNature, category, person1Label, person2Label,
        });
        return this.chat(system, user, 250);
    }

    async getSynastryDeepDive(
        aspects: Array<{
            planet1Name: string; planet1Sign: string;
            planet2Name: string; planet2Sign: string;
            type: string; nature: string; category: string;
            person1Label: string; person2Label: string;
        }>,
        userTriad: { sun: string; moon: string; rising: string },
        partnerTriad: { sun: string; moon: string; rising: string },
        partnerName: string,
    ): Promise<string> {
        const { system, user } = buildSynastryDeepDivePrompt({
            aspects, userTriad, partnerTriad, partnerName, numerologyContext: buildChartNumerologyContext(),
        });
        return this.chatPremium(system, user, 1500);
    }

    async getFamilyReading(data: {
        parentTriad: { sun: string; moon: string; rising: string };
        childName: string;
        childTriad: { sun: string; moon: string; rising: string };
        childAge: number; childAgeLabel: string; relationship: string;
        parentLifePath?: number; childLifePath?: number;
        synastryHighlights: Array<{ planet1: string; planet2: string; aspect: string; nature: string; category: string }>;
    }): Promise<string> {
        const { system, user } = buildFamilyReadingPrompt(data);
        return this.chatPremium(system, user, 2500);
    }

    async getSiblingReading(data: {
        child1Name: string;
        child1Triad: { sun: string; moon: string; rising: string };
        child1Age: number; child1LifePath?: number;
        child2Name: string;
        child2Triad: { sun: string; moon: string; rising: string };
        child2Age: number; child2LifePath?: number;
        synastryHighlights: Array<{ planet1: string; planet2: string; aspect: string; nature: string }>;
    }): Promise<string> {
        const { system, user } = buildSiblingReadingPrompt(data);
        return this.chatPremium(system, user, 2000);
    }

    // ────────────────────────────────────────────
    // JOURNAL & DREAMS
    // ────────────────────────────────────────────

    async getJournalPatterns(
        planet: string,
        entries: Array<{ text: string; date: string; mood?: string }>,
        triadContext?: { sun?: string; moon?: string; rising?: string },
    ): Promise<string> {
        let lifePath: number | undefined;
        let personalYear: number | undefined;
        try {
            const birthData = getBirthData();
            if (birthData?.birthday) {
                lifePath = getLifePathNumber(birthData.birthday);
                personalYear = getCurrentPersonalYear(birthData.birthday);
            }
        } catch { /* skip */ }
        const { system, user } = buildJournalPatternsPrompt({ planet, entries, triadContext, lifePath, personalYear });
        return this.chat(system, user, 300);
    }

    async getDreamInterpretation(data: {
        dreamText: string; symbolTags: string[];
        wakingMood?: string; activeTransits: string;
        triad?: { sun?: string; moon?: string; rising?: string };
        lifePath?: number;
    }): Promise<string> {
        const { system, user } = buildDreamInterpretationPrompt(data);
        return this.chat(system, user, 500);
    }

    // ────────────────────────────────────────────
    // CAREER
    // ────────────────────────────────────────────

    async getCareerAlignment(data: {
        sun: string; moon: string; rising: string;
        sunElement: string; lifePath: number; personalYear?: number;
    }): Promise<string> {
        const { system, user } = buildCareerAlignmentPrompt(data);
        return this.chatPremium(system, user);
    }

    // ────────────────────────────────────────────
    // FORECAST
    // ────────────────────────────────────────────

    async getYearAheadReading(report: {
        solarYear: { start: string; end: string; startFormatted: string };
        personalYear: number; lifePathNumber: number;
        majorTransits: Array<{ transitPlanet: string; natalPlanet: string; aspectName: string; nature: string; peakMonth: string; transitSign: string; significance: string }>;
        eclipses: Array<{ type: string; kind: string; formattedDate: string; signId: string; natalAspects: Array<{ planet: string; aspect: string }> }>;
        months: Array<{ month: string; year: number; dominantTransits: Array<{ transit: string; natal: string; aspect: string; nature: string }>; eclipseThisMonth: boolean }>;
        keyDates: Array<{ formattedDate: string; description: string; nature: string }>;
        year: number;
    }, triad?: { sun?: string; moon?: string; rising?: string }): Promise<string> {
        const { system, user } = buildYearAheadPrompt({ ...report, triad });
        return this.chatPremium(system, user, 4000);
    }

    // ────────────────────────────────────────────
    // NUMEROLOGY
    // ────────────────────────────────────────────

    async getAngelNumberMeaning(
        number: string,
        chartContext?: {
            sun?: string; moon?: string; rising?: string;
            lifePath?: number; personalYear?: number;
        },
        whereSpotted?: string,
        activeIntentions?: string[],
    ): Promise<string> {
        const { system, user } = buildAngelNumberPrompt({ number, chartContext, whereSpotted, activeIntentions });
        return this.chat(system, user, 400);
    }

    // ────────────────────────────────────────────
    // API TRANSPORT
    // ────────────────────────────────────────────

    async chat(systemPrompt: string, userPrompt: string, maxTokens = 600): Promise<string> {
        if (!this.apiKey) {
            throw new Error('No API key configured. Add your OpenRouter key in Settings.');
        }
        if (!navigator.onLine) {
            throw new Error('You appear to be offline. AI insights require an internet connection. Tarot, astrology, and numerology still work offline!');
        }
        try {
            const raw = safeStorage.getItem('ai_consent');
            if (raw) {
                const consent = JSON.parse(raw);
                if (consent.consented === false) {
                    throw new Error('AI features are disabled. You can enable them in Settings.');
                }
            }
        } catch (e) {
            if (e instanceof Error && e.message.includes('AI features are disabled')) throw e;
            throw new Error('AI features are disabled. You can enable them in Settings.');
        }

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Arcana Whisper',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: maxTokens,
                temperature: 0.8,
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            const error = await response.text();
            if (response.status === 401) throw new Error('Invalid API key. Please check your OpenRouter key in Settings.');
            if (response.status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
            throw new Error(`AI service error: ${response.status} — ${error}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from AI. Please try again.');
        return content.trim();
    }

    async chatPremium(systemPrompt: string, userPrompt: string, maxTokens = 3000): Promise<string> {
        if (!this.apiKey) {
            throw new Error('No API key configured. Add your OpenRouter key in Settings.');
        }
        if (!navigator.onLine) {
            throw new Error('You appear to be offline. AI insights require an internet connection. Tarot, astrology, and numerology still work offline!');
        }

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Arcana Whisper',
            },
            body: JSON.stringify({
                model: PREMIUM_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: maxTokens,
                temperature: 0.8,
            }),
            signal: AbortSignal.timeout(45000),
        });

        if (!response.ok) {
            const error = await response.text();
            if (import.meta.env.DEV) console.warn('[AI] Premium model failed, falling back to Flash:', error);
            return this.chat(systemPrompt, userPrompt, Math.min(maxTokens, 1200));
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from AI. Please try again.');
        return content.trim();
    }

    /**
     * LITE tier — uses Gemini 2.5 Flash Lite for cost-efficient, structured outputs.
     * Used for: card insights, energy readings, declarations, ritual follow-ups,
     * spread recommendations, transit interpretations.
     * Falls back to standard MODEL on failure.
     */
    async chatLite(systemPrompt: string, userPrompt: string, maxTokens = 600): Promise<string> {
        if (!this.apiKey) {
            throw new Error('No API key configured. Add your OpenRouter key in Settings.');
        }
        if (!navigator.onLine) {
            throw new Error('You appear to be offline. AI insights require an internet connection. Tarot, astrology, and numerology still work offline!');
        }
        try {
            const raw = safeStorage.getItem('ai_consent');
            if (raw) {
                const consent = JSON.parse(raw);
                if (consent.consented === false) {
                    throw new Error('AI features are disabled. You can enable them in Settings.');
                }
            }
        } catch (e) {
            if (e instanceof Error && e.message.includes('AI features are disabled')) throw e;
            throw new Error('AI features are disabled. You can enable them in Settings.');
        }

        try {
            const response = await fetch(OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Arcana Whisper',
                },
                body: JSON.stringify({
                    model: LITE_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.8,
                }),
                signal: AbortSignal.timeout(30000),
            });

            if (!response.ok) {
                if (import.meta.env.DEV) console.warn('[AI] Lite model failed, falling back to standard:', response.status);
                return this.chat(systemPrompt, userPrompt, maxTokens);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                // Fallback to standard model
                return this.chat(systemPrompt, userPrompt, maxTokens);
            }
            return content.trim();
        } catch (error) {
            // Network or other error — fall back to standard model
            if (import.meta.env.DEV) console.warn('[AI] Lite model error, falling back:', error);
            return this.chat(systemPrompt, userPrompt, maxTokens);
        }
    }
}

// ── Daily reading limit helpers ──

const DAILY_LIMIT_KEY = 'dailyReadings';
const FREE_DAILY_LIMIT = 3;

interface DailyCount { date: string; count: number; }

function getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

function getDailyData(): DailyCount {
    try {
        const raw = safeStorage.getItem(DAILY_LIMIT_KEY);
        if (raw) {
            const data = JSON.parse(raw) as DailyCount;
            if (data.date === getTodayKey()) return data;
        }
    } catch { /* ignore */ }
    return { date: getTodayKey(), count: 0 };
}

export function getRemainingReadings(): number {
    const data = getDailyData();
    return Math.max(0, FREE_DAILY_LIMIT - data.count);
}

export function canDoReading(isPremium: boolean): boolean {
    if (isPremium) return true;
    return getRemainingReadings() > 0;
}

export function incrementReadingCount() {
    const data = getDailyData();
    data.count += 1;
    safeStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(data));
}

export function getTodayReadingCount(): number {
    return getDailyData().count;
}

// Re-export for consumers
export { TEACHING_FORMAT, scoreSpreadEnergy };
export type { DrawnCard };
