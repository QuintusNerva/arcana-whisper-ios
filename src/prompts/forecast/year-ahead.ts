/**
 * Year Ahead Report — Comprehensive yearly forecast using transits, eclipses, and numerology.
 * Extracted from ai.service.ts getYearAheadReading().
 */

export interface YearAheadParams {
    solarYear: { start: string; end: string; startFormatted: string };
    personalYear: number;
    lifePathNumber: number;
    majorTransits: Array<{ transitPlanet: string; natalPlanet: string; aspectName: string; nature: string; peakMonth: string; transitSign: string; significance: string }>;
    eclipses: Array<{ type: string; kind: string; formattedDate: string; signId: string; natalAspects: Array<{ planet: string; aspect: string }> }>;
    months: Array<{ month: string; year: number; dominantTransits: Array<{ transit: string; natal: string; aspect: string; nature: string }>; eclipseThisMonth: boolean }>;
    keyDates: Array<{ formattedDate: string; description: string; nature: string }>;
    year: number;
    triad?: { sun?: string; moon?: string; rising?: string };
}

export function buildYearAheadPrompt(params: YearAheadParams): { system: string; user: string } {
    const system = `You are a master astrologer writing a deeply personal Year Ahead report. Your style is warm, insightful, and empowering — like a wise mentor revealing the cosmic roadmap for someone's most important year.

You MUST format your response using these exact sections with ## headers:

## 🌟 Your Year Theme
2-3 paragraphs synthesizing the major transits and Personal Year number into a cohesive narrative about what this year is ABOUT for them. Make them feel seen.

## ⚡ Major Cosmic Shifts
For each major transit, write 2-3 sentences about what it means personally. Use their natal planet placements for specificity. Bold the transit names.

## 🌑 Eclipse Activations
What the eclipses stir up in their chart. 1-2 paragraphs. If eclipses aspect natal planets, explain what gets activated.

## 📅 Month-by-Month Guidance
For EACH month: 1-2 sentences on the dominant transit energy + practical guidance. Then on the NEXT LINE add the optimal manifestation intention for that month.

Format EXACTLY as:

**January**: [transit guidance]

✨ *Intention: "I am calling in [what this month's energy supports]."*

**February**: [guidance]

✨ *Intention: "I am calling in [theme]."*

...every month MUST have both the guidance line AND the Intention line.

## ⭐ Key Dates to Watch
List the most important dates with one-line guidance for each.

## 🔮 Year Closing Wisdom
1 paragraph of empowering closing advice for navigating this entire year.

Rules:
- Bold all astrological terms (**Saturn**, **Square**, **Pisces Moon**)
- Be specific to THEIR chart, not generic zodiac horoscopes
- Keep each section focused and impactful
- Total length: 1200-1800 words
- Do NOT use code blocks, links, or images`;

    const transitSummary = params.majorTransits
        .filter(t => t.significance !== 'minor')
        .map(t => `${t.transitPlanet} ${t.aspectName} natal ${t.natalPlanet} (in ${t.transitSign}, peak ~${t.peakMonth}, ${t.nature})`)
        .join('\n');

    const eclipseSummary = params.eclipses
        .map(e => `${e.type} eclipse (${e.kind}) on ${e.formattedDate} in ${e.signId}${e.natalAspects.length > 0 ? ` — aspects: ${e.natalAspects.map(a => `${a.aspect} ${a.planet}`).join(', ')}` : ''}`)
        .join('\n');

    const monthlySummary = params.months
        .map(m => `${m.month} ${m.year}: ${m.dominantTransits.map(t => `${t.transit} ${t.aspect} ${t.natal} (${t.nature})`).join('; ')}${m.eclipseThisMonth ? ' [ECLIPSE MONTH]' : ''}`)
        .join('\n');

    const keyDatesSummary = params.keyDates
        .map(kd => `${kd.formattedDate}: ${kd.description} (${kd.nature})`)
        .join('\n');

    let user = `Generate a Year Ahead Report for ${params.year}.

SOLAR YEAR: ${params.solarYear.startFormatted} to end
PERSONAL YEAR: ${params.personalYear} (Numerology)
LIFE PATH: ${params.lifePathNumber}

MAJOR TRANSITS:
${transitSummary || 'No major outer planet transits detected.'}

ECLIPSES:
${eclipseSummary || 'No significant eclipses aspecting natal chart.'}

MONTH-BY-MONTH TRANSITS:
${monthlySummary}

KEY DATES:
${keyDatesSummary || 'No exact transit hits detected.'}`;

    if (params.triad) {
        const parts = [];
        if (params.triad.sun) parts.push(`Sun in ${params.triad.sun}`);
        if (params.triad.moon) parts.push(`Moon in ${params.triad.moon}`);
        if (params.triad.rising) parts.push(`Rising in ${params.triad.rising}`);
        if (parts.length > 0) {
            user += `\n\nNATAL CHART: ${parts.join(', ')}.`;
        }
    }

    return { system, user };
}
