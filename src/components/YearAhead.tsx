/**
 * Year Ahead Report — Annual Blueprint
 *
 * Full-page component displaying a comprehensive yearly forecast:
 * - Hero with solar year + personal year number
 * - Major transits overview
 * - Eclipse timeline
 * - Month-by-month guidance (AI-generated)
 * - Key dates
 *
 * States: preview → loading → generated
 * Cached in localStorage keyed by year.
 */

import React from 'react';
import { generateShareURL } from './CosmicInvite';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { generateYearAheadPDF } from './YearAheadPDF';
import { PageHeader } from './PageHeader';
import { generateYearAheadReport, YearAheadReport, isBirthdayToday } from '../services/year-ahead.service';
import { getBirthData, getNatalTriad } from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { safeStorage } from '../services/storage.service';
import { scheduleYearAheadNotifications, scheduleBirthdayNotification } from '../services/cosmic-notifications.service';

interface YearAheadProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
}

type ViewState = 'preview' | 'loading' | 'generated' | 'error';

const SIGN_DISPLAY: Record<string, string> = {
    aries: 'Aries ♈', taurus: 'Taurus ♉', gemini: 'Gemini ♊', cancer: 'Cancer ♋',
    leo: 'Leo ♌', virgo: 'Virgo ♍', libra: 'Libra ♎', scorpio: 'Scorpio ♏',
    sagittarius: 'Sagittarius ♐', capricorn: 'Capricorn ♑', aquarius: 'Aquarius ♒', pisces: 'Pisces ♓',
};

const CACHE_KEY_PREFIX = 'arcana_year_ahead_';

export function YearAhead({ onClose, onTabChange, subscription, onShowPremium }: YearAheadProps) {
    const [viewState, setViewState] = React.useState<ViewState>('preview');
    const [report, setReport] = React.useState<YearAheadReport | null>(null);
    const [aiReading, setAiReading] = React.useState<string>('');
    const [error, setError] = React.useState<string>('');
    const [loadingStep, setLoadingStep] = React.useState('');
    const [isBirthday, setIsBirthday] = React.useState(false);
    const [scheduledCount, setScheduledCount] = React.useState(0);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const currentYear = new Date().getFullYear();
    const cacheKey = `${CACHE_KEY_PREFIX}${currentYear}`;

    // On mount: check cache and generate preview data
    React.useEffect(() => {
        const birthData = getBirthData();
        if (birthData) {
            setIsBirthday(isBirthdayToday(birthData.birthday));
        }

        // Check for cached reading
        const cached = safeStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { report: cachedReport, reading: cachedReading } = JSON.parse(cached);
                setReport(cachedReport);
                setAiReading(cachedReading);
                setViewState('generated');
                return;
            } catch { /* regenerate */ }
        }

        // Generate preview data (report without AI reading)
        setLoadingStep('Calculating planetary positions…');
        const previewReport = generateYearAheadReport();
        if (previewReport) {
            setReport(previewReport);
            setViewState('preview');
        } else {
            setError('Please set your birth data in your Profile to generate a Year Ahead report.');
            setViewState('error');
        }
    }, []);

    // Generate the full reading
    const handleGenerate = async () => {
        if (subscription !== 'premium') {
            onShowPremium();
            return;
        }
        if (!report) return;
        setViewState('loading');

        try {
            setLoadingStep('Mapping your solar return…');
            await new Promise(r => setTimeout(r, 500));

            setLoadingStep('Scanning outer planet transits…');
            await new Promise(r => setTimeout(r, 700));

            setLoadingStep('Detecting eclipse activations…');
            await new Promise(r => setTimeout(r, 500));

            setLoadingStep('Channeling your Year Ahead reading…');

            const birthData = getBirthData();
            const triad = birthData ? getNatalTriad(birthData) : undefined;
            const triadForAI = triad ? {
                sun: triad.sun.name,
                moon: triad.moon.name,
                rising: triad.rising.name,
            } : undefined;

            const ai = new AIService();
            const reading = await ai.getYearAheadReading(report, triadForAI);
            setAiReading(reading);
            setViewState('generated');

            // Cache the result
            safeStorage.setItem(cacheKey, JSON.stringify({ report, reading }));

            // Schedule notifications for key dates, eclipses, monthly
            try {
                const count = await scheduleYearAheadNotifications(report);
                setScheduledCount(count);
                // Also schedule birthday notification
                const birthData = getBirthData();
                if (birthData) {
                    await scheduleBirthdayNotification(birthData.birthday, currentYear + 1);
                }
            } catch { /* notifications are optional */ }
        } catch (err: any) {
            setError(err.message || 'Failed to generate reading. Please try again.');
            setViewState('error');
        }
    };

    // Parse markdown AI reading into styled React elements
    const renderReading = (text: string) => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];

        lines.forEach((line, i) => {
            const trimmed = line.trim();

            // H1 — reading title (e.g. "# Year Ahead Report: 2026")
            if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
                const content = trimmed.replace(/^# /, '');
                elements.push(
                    <div key={`h1-${i}`} className="mb-4 mt-2">
                        <h1 className="font-display text-xl text-altar-gold tracking-[2px]"
                            dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
                    </div>
                );
            }
            // H2 — section headers
            else if (trimmed.startsWith('## ')) {
                const content = trimmed.replace(/^## /, '');
                elements.push(
                    <div key={`h2-${i}`} className="mt-7 mb-3 flex items-center gap-3">
                        <div className="flex-1 h-[1px] bg-altar-gold/15" />
                        <h2 className="font-display text-xs text-altar-gold tracking-[3px] uppercase shrink-0">
                            {content}
                        </h2>
                        <div className="flex-1 h-[1px] bg-altar-gold/15" />
                    </div>
                );
            }
            // Horizontal rule
            else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                elements.push(
                    <div key={`hr-${i}`} className="my-4 h-[1px] bg-white/5" />
                );
            }
            // Bullet points
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const content = trimmed.replace(/^[-*] /, '');
                elements.push(
                    <p key={`li-${i}`} className="text-altar-text/80 text-sm leading-relaxed pl-4 mb-2 flex gap-2">
                        <span className="text-altar-gold mt-0.5 shrink-0">✦</span>
                        <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
                    </p>
                );
            }
            // Empty line
            else if (trimmed === '') {
                elements.push(<div key={`br-${i}`} className="h-1" />);
            }
            // Regular paragraph (may contain *italic* lines from AI like the subtitle)
            else {
                // Detect if the whole line is italic (e.g. *Solar Year beginning...*)
                const isFullItalic = /^\*[^*].*[^*]\*$/.test(trimmed) || /^_[^_].*[^_]_$/.test(trimmed);
                const content = trimmed.replace(/^[*_](.*)[*_]$/, '$1');

                if (isFullItalic) {
                    elements.push(
                        <p key={`it-${i}`} className="text-altar-muted text-xs italic leading-relaxed mb-2 text-center">
                            {content}
                        </p>
                    );
                } else {
                    elements.push(
                        <p key={`p-${i}`} className="text-altar-text/80 text-sm leading-relaxed mb-2"
                            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
                    );
                }
            }
        });

        return elements;
    };

    // Format inline markdown: **bold**, *italic*, ***bold-italic***
    const formatInline = (text: string) => {
        return text
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em class="text-altar-text/90">$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-altar-text font-semibold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-altar-muted/90 not-italic text-altar-text/70">$1</em>')
            .replace(/_(.*?)_/g, '<em class="text-altar-muted/90">$1</em>');
    };

    // Keep formatBold as alias for compatibility
    const formatBold = formatInline;

    const personalYearMeaning: Record<number, string> = {
        1: 'New Beginnings', 2: 'Partnership & Balance', 3: 'Creative Expression',
        4: 'Foundation Building', 5: 'Freedom & Change', 6: 'Love & Responsibility',
        7: 'Spiritual Growth', 8: 'Power & Abundance', 9: 'Completion & Release',
    };

    return (
        <div className="fixed inset-0 bg-altar-dark flex flex-col z-50">
            {/* Header */}
            <PageHeader
                onClose={onClose}
                centerContent={
                    <div className="text-center w-full">
                        <h1 className="font-display text-lg text-altar-gold tracking-[4px]">YEAR AHEAD</h1>
                        <p className="text-[10px] text-altar-muted tracking-[2px] mt-1 font-display">
                            {report
                                ? `${new Date(report.solarYear.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date(report.solarYear.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                : `${currentYear} ANNUAL BLUEPRINT`
                            }
                        </p>
                    </div>
                }
            />

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto pb-32">
                {/* ═══ Birthday Banner ═══ */}
                {isBirthday && (
                    <div className="mx-5 mt-4 mb-2 glass-strong rounded-2xl p-4 text-center border border-altar-gold/30 animate-fade-up"
                        style={{ background: 'linear-gradient(135deg, rgba(218,165,32,0.15), rgba(138,43,226,0.1))' }}>
                        <p className="text-2xl mb-1">🎂</p>
                        <p className="text-sm text-altar-gold font-display tracking-[2px]">HAPPY SOLAR RETURN</p>
                        <p className="text-xs text-altar-muted mt-1">Your cosmic year begins today</p>
                    </div>
                )}

                {/* ═══ ERROR STATE ═══ */}
                {viewState === 'error' && (
                    <div className="mx-5 mt-8 glass-strong rounded-2xl p-6 text-center animate-fade-up">
                        <p className="text-3xl mb-3">⚠️</p>
                        <p className="text-sm text-altar-text/70 mb-4">{error}</p>
                        <button
                            onClick={() => onTabChange('profile')}
                            className="px-6 py-2.5 bg-altar-gold/20 text-altar-gold text-sm font-display tracking-[2px] rounded-xl border border-altar-gold/30 hover:bg-altar-gold/30 transition-all"
                        >
                            SET UP PROFILE
                        </button>
                    </div>
                )}

                {/* ═══ PREVIEW STATE ═══ */}
                {(viewState === 'preview' || viewState === 'loading') && report && (
                    <>
                        {/* Solar Year Card */}
                        <div className="mx-5 mt-4 glass-strong rounded-2xl p-5 animate-fade-up">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-[9px] font-display text-altar-muted tracking-[2px] uppercase">Solar Year Begins</p>
                                    <p className="text-sm text-altar-text mt-1">{report.solarYear.startFormatted}</p>
                                    <p className="text-[9px] text-altar-muted/60 mt-0.5">
                                        Ends {new Date(report.solarYear.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-altar-gold/30 flex items-center justify-center">
                                        <span className="text-2xl font-display text-altar-gold">{report.personalYear}</span>
                                    </div>
                                    <p className="text-[8px] font-display text-altar-muted tracking-[1px] mt-1">PERSONAL YEAR</p>
                                </div>
                            </div>
                            <p className="text-xs text-altar-muted italic">
                                {personalYearMeaning[report.personalYear] || 'Transformation'} — Life Path {report.lifePathNumber}
                            </p>
                            <p className="text-[10px] text-altar-muted/50 mt-1.5">
                                Personal Year {report.personalYear} runs {new Date(report.solarYear.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} → {new Date(report.solarYear.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Major Transits Preview */}
                        {report.majorTransits.length > 0 && (
                            <div className="mx-5 mt-3 glass-strong rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                                <h3 className="font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">⚡ Major Transits</h3>
                                <div className="space-y-2.5">
                                    {report.majorTransits.filter(t => t.significance !== 'minor').slice(0, 5).map((t, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.nature === 'harmonious' ? 'bg-emerald-400/60' :
                                                t.nature === 'challenging' ? 'bg-red-400/60' : 'bg-amber-400/60'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-altar-text truncate">
                                                    <span className="font-medium">{t.transitPlanet}</span>
                                                    <span className="text-altar-muted mx-1">{t.aspectSymbol}</span>
                                                    <span>your {t.natalPlanet}</span>
                                                </p>
                                                <p className="text-[10px] text-altar-muted">{t.peakMonth} · {t.aspectName}</p>
                                            </div>
                                            <span className={`text-[9px] font-display tracking-[1px] px-2 py-0.5 rounded-full ${t.significance === 'major' ? 'bg-violet-500/20 text-violet-300' : 'bg-blue-500/20 text-blue-300'
                                                }`}>{t.significance.toUpperCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Eclipse Preview */}
                        {report.eclipses.length > 0 && (
                            <div className="mx-5 mt-3 glass-strong rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                                <h3 className="font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">🌑 Eclipses</h3>
                                <div className="space-y-2">
                                    {report.eclipses.map((e, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-lg">{e.type === 'lunar' ? '🌕' : '🌑'}</span>
                                            <div>
                                                <p className="text-xs text-altar-text">
                                                    {e.type === 'lunar' ? 'Lunar' : 'Solar'} Eclipse · {SIGN_DISPLAY[e.signId] || e.signId}
                                                </p>
                                                <p className="text-[10px] text-altar-muted">{e.formattedDate} · {e.kind}</p>
                                                {e.natalAspects.length > 0 && (
                                                    <p className="text-[10px] text-amber-400/70 mt-0.5">
                                                        ⚡ Activates: {e.natalAspects.map(a => `${a.planet} (${a.aspect})`).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Dates Preview */}
                        {report.keyDates.length > 0 && (
                            <div className="mx-5 mt-3 glass-strong rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                                <h3 className="font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">⭐ Key Dates</h3>
                                <div className="space-y-2">
                                    {report.keyDates.slice(0, 5).map((kd, i) => (
                                        <div key={i} className="flex gap-3">
                                            <span className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${kd.nature === 'harmonious' ? 'bg-emerald-400/60' :
                                                kd.nature === 'challenging' ? 'bg-red-400/60' : 'bg-amber-400/60'
                                                }`} />
                                            <div>
                                                <p className="text-[10px] text-altar-gold font-display">{kd.formattedDate}</p>
                                                <p className="text-xs text-altar-text/70">{kd.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {report.keyDates.length > 5 && (
                                        <p className="text-[10px] text-altar-muted text-center mt-2">
                                            +{report.keyDates.length - 5} more dates in your full report
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Generate CTA */}
                        <div className="mx-5 mt-6 mb-8 animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                            {viewState === 'loading' ? (
                                <div className="glass-strong rounded-2xl p-8 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-altar-gold/20 to-violet-500/20 border border-altar-gold/20 flex items-center justify-center animate-pulse">
                                        <span className="text-2xl">✦</span>
                                    </div>
                                    <p className="text-sm text-altar-text font-display tracking-[2px] mb-2">CHANNELING YOUR YEAR</p>
                                    <p className="text-xs text-altar-gold/60 animate-pulse">{loadingStep}</p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-4 rounded-2xl font-display text-sm tracking-[3px] uppercase transition-all active:scale-[0.98] border"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(218,165,32,0.2), rgba(138,43,226,0.15))',
                                        borderColor: 'rgba(218,165,32,0.3)',
                                        color: 'var(--color-altar-gold)',
                                    }}
                                >
                                    ✦ GENERATE YOUR YEAR AHEAD
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* ═══ GENERATED STATE ═══ */}
                {viewState === 'generated' && report && (
                    <>
                        {/* Compact header stats */}
                        <div className="mx-5 mt-4 flex gap-3 animate-fade-up">
                            <div className="flex-1 glass-strong rounded-xl p-3 text-center">
                                <p className="text-xl font-display text-altar-gold">{report.personalYear}</p>
                                <p className="text-[8px] text-altar-muted tracking-[1px] font-display mt-0.5">PERSONAL YEAR</p>
                                <p className="text-[8px] text-altar-muted/50 mt-0.5">{personalYearMeaning[report.personalYear] ?? 'Transformation'}</p>
                            </div>
                            <div className="flex-1 glass-strong rounded-xl p-3 text-center">
                                <p className="text-xl font-display text-purple-300">{report.majorTransits.filter(t => t.significance !== 'minor').length}</p>
                                <p className="text-[8px] text-altar-muted tracking-[1px] font-display mt-0.5">MAJOR TRANSITS</p>
                            </div>
                            <div className="flex-1 glass-strong rounded-xl p-3 text-center">
                                <p className="text-xl font-display text-blue-300">{report.eclipses.length}</p>
                                <p className="text-[8px] text-altar-muted tracking-[1px] font-display mt-0.5">ECLIPSES</p>
                            </div>
                            <div className="flex-1 glass-strong rounded-xl p-3 text-center">
                                <p className="text-xl font-display text-emerald-300">{report.keyDates.length}</p>
                                <p className="text-[8px] text-altar-muted tracking-[1px] font-display mt-0.5">KEY DATES</p>
                            </div>
                        </div>

                        {/* AI Reading */}
                        <div className="mx-5 mt-4 glass-strong rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                            {renderReading(aiReading)}
                        </div>

                        {/* Transit Details (collapsible) */}
                        <TransitDetails transits={report.majorTransits} />

                        {/* Eclipse Details */}
                        {report.eclipses.length > 0 && (
                            <EclipseDetails eclipses={report.eclipses} />
                        )}

                        {/* All Key Dates */}
                        {report.keyDates.length > 0 && (
                            <div className="mx-5 mt-3 glass-strong rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                                <h3 className="font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">⭐ ALL KEY DATES</h3>
                                <div className="space-y-2">
                                    {report.keyDates.map((kd, i) => (
                                        <div key={i} className="flex gap-3">
                                            <span className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${kd.nature === 'harmonious' ? 'bg-emerald-400/60' :
                                                kd.nature === 'challenging' ? 'bg-red-400/60' : 'bg-amber-400/60'
                                                }`} />
                                            <div>
                                                <p className="text-[10px] text-altar-gold font-display">{kd.formattedDate}</p>
                                                <p className="text-xs text-altar-text/70">{kd.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regenerate button */}
                        <div className="mx-5 mt-6 mb-24 text-center animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                            <p className="text-[10px] text-altar-muted mb-3">
                                Generated {new Date(report.generatedAt).toLocaleDateString()} · Solar Year from {report.solarYear.startFormatted}
                            </p>
                            {scheduledCount > 0 && (
                                <p className="text-[10px] text-emerald-400/70 mb-3">
                                    🔔 {scheduledCount} cosmic notifications scheduled
                                </p>
                            )}
                            <button
                                onClick={async () => {
                                    safeStorage.removeItem(cacheKey);
                                    setViewState('preview');
                                    setAiReading('');
                                    setScheduledCount(0);
                                }}
                                className="text-xs text-altar-muted/50 hover:text-altar-muted underline transition-colors"
                            >
                                Regenerate Report
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Sub-components ──

function TransitDetails({ transits }: { transits: YearAheadReport['majorTransits'] }) {
    const [expanded, setExpanded] = React.useState(false);
    const significant = transits.filter(t => t.significance !== 'minor');
    if (significant.length === 0) return null;

    return (
        <div className="mx-5 mt-3 glass-strong rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <h3 className="font-display text-xs text-altar-muted tracking-[2px] uppercase">⚡ TRANSIT DETAILS</h3>
                <span className="text-altar-muted text-xs">{expanded ? '▲' : '▼'}</span>
            </button>
            {expanded && (
                <div className="mt-3 space-y-3">
                    {significant.map((t, i) => (
                        <div key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${t.nature === 'harmonious' ? 'bg-emerald-400/60' :
                                    t.nature === 'challenging' ? 'bg-red-400/60' : 'bg-amber-400/60'
                                    }`} />
                                <p className="text-sm text-altar-text">
                                    {t.transitPlanet} {t.transitGlyph}
                                    <span className="text-altar-muted mx-1">{t.aspectSymbol}</span>
                                    your {t.natalPlanet} {t.natalGlyph}
                                </p>
                            </div>
                            <p className="text-[10px] text-altar-muted ml-4">
                                {t.aspectName} · {SIGN_DISPLAY[t.transitSign] || t.transitSign} · Peak ~{t.peakMonth} · Orb {t.orb}°
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function EclipseDetails({ eclipses }: { eclipses: YearAheadReport['eclipses'] }) {
    return (
        <div className="mx-5 mt-3 glass-strong rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
            <h3 className="font-display text-xs text-altar-muted tracking-[2px] uppercase mb-3">🌑 ECLIPSE DETAILS</h3>
            <div className="space-y-3">
                {eclipses.map((e, i) => (
                    <div key={i} className="flex gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                            <span className="text-lg">{e.type === 'lunar' ? '🌕' : '🌑'}</span>
                        </div>
                        <div>
                            <p className="text-xs text-altar-text">
                                {e.type === 'lunar' ? 'Lunar' : 'Solar'} Eclipse in {SIGN_DISPLAY[e.signId] || e.signId}
                            </p>
                            <p className="text-[10px] text-altar-muted">{e.formattedDate} · {e.kind} · {e.signDegree.toFixed(0)}°</p>
                            {e.natalAspects.length > 0 && (
                                <p className="text-[10px] text-amber-400/70 mt-0.5">
                                    ⚡ {e.natalAspects.map(a => `${a.aspect} your ${a.planet}`).join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
