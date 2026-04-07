/**
 * MomentumHeatmap — Cosmic Rhythm Tracker
 *
 * GitHub-style calendar heatmap showing user engagement
 * with moon phase icons overlaid. Pure data visualization
 * — no AI calls.
 *
 * Data sources:
 * - manifestation.service: completed actions (completedDate)
 * - witness.service: witness events (timestamp)
 *
 * Sacred Fintech design system.
 */

import React from 'react';
import { getAllManifestations } from '../services/manifestation.service';
import { getWitnessEvents } from '../services/witness.service';

// ── Moon Phase Computation ──

const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z');

function getMoonPhaseForDate(date: Date): { emoji: string; name: string } {
    const daysSince = (date.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);
    const phase = ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
    const n = phase / SYNODIC_MONTH;

    if (n < 0.0625) return { emoji: '🌑', name: 'New' };
    if (n < 0.1875) return { emoji: '🌒', name: 'Wax Cres' };
    if (n < 0.3125) return { emoji: '🌓', name: '1st Qtr' };
    if (n < 0.4375) return { emoji: '🌔', name: 'Wax Gib' };
    if (n < 0.5625) return { emoji: '🌕', name: 'Full' };
    if (n < 0.6875) return { emoji: '🌖', name: 'Wan Gib' };
    if (n < 0.8125) return { emoji: '🌗', name: 'Last Qtr' };
    if (n < 0.9375) return { emoji: '🌘', name: 'Wan Cres' };
    return { emoji: '🌑', name: 'New' };
}

// ── Data Aggregation ──

interface DayData {
    date: string;          // YYYY-MM-DD
    actions: number;       // completed forge actions
    witnesses: number;     // witness events logged
    total: number;         // actions + witnesses
    moonPhase: { emoji: string; name: string };
}

function aggregateEngagement(days: number = 90): {
    data: DayData[];
    totalActions: number;
    totalWitness: number;
    currentStreak: number;
    longestStreak: number;
    bestPhase: string | null;
} {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days + 1);

    // Build date → count maps
    const actionMap = new Map<string, number>();
    const witnessMap = new Map<string, number>();

    // Collect all completed actions across all manifestations
    const manifestations = getAllManifestations();
    for (const m of manifestations) {
        for (const a of m.actions) {
            if (a.completedDate) {
                const d = a.completedDate.slice(0, 10);
                actionMap.set(d, (actionMap.get(d) || 0) + 1);
            }
        }
    }

    // Collect all witness events
    const witnessEvents = getWitnessEvents();
    for (const w of witnessEvents) {
        const d = w.timestamp.slice(0, 10);
        witnessMap.set(d, (witnessMap.get(d) || 0) + 1);
    }

    // Build daily data array
    const data: DayData[] = [];
    let totalActions = 0;
    let totalWitness = 0;
    const phaseEngagement = new Map<string, number>();

    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const actions = actionMap.get(dateStr) || 0;
        const witnesses = witnessMap.get(dateStr) || 0;
        const total = actions + witnesses;
        const moonPhase = getMoonPhaseForDate(d);

        totalActions += actions;
        totalWitness += witnesses;

        if (total > 0) {
            phaseEngagement.set(moonPhase.name, (phaseEngagement.get(moonPhase.name) || 0) + total);
        }

        data.push({ date: dateStr, actions, witnesses, total, moonPhase });
    }

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].total > 0) {
            tempStreak++;
            if (i === data.length - 1 || (i < data.length - 1 && data[i + 1].total > 0)) {
                currentStreak = tempStreak;
            }
        } else {
            if (i === data.length - 1) currentStreak = 0;
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Best moon phase
    let bestPhase: string | null = null;
    let bestCount = 0;
    for (const [phase, count] of phaseEngagement.entries()) {
        if (count > bestCount) {
            bestCount = count;
            bestPhase = phase;
        }
    }

    return { data, totalActions, totalWitness, currentStreak, longestStreak, bestPhase };
}

// ── Heatmap Colors ──

function getCellColor(total: number): string {
    if (total === 0) return 'rgba(255,255,255,0.03)';
    if (total === 1) return 'rgba(212,175,55,0.15)';
    if (total === 2) return 'rgba(212,175,55,0.30)';
    if (total <= 4) return 'rgba(212,175,55,0.50)';
    return 'rgba(212,175,55,0.75)';
}

// ── Component ──

interface MomentumHeatmapProps {
    onClose?: () => void;
}

export function MomentumHeatmap({ onClose }: MomentumHeatmapProps) {
    const { data, totalActions, totalWitness, currentStreak, longestStreak, bestPhase } =
        React.useMemo(() => aggregateEngagement(90), []);

    // Group data into weeks (7-column grid)
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Pad the first week to align with day-of-week
    const firstDay = new Date(data[0]?.date + 'T12:00:00');
    const startDow = firstDay.getDay(); // 0=Sun
    for (let i = 0; i < startDow; i++) {
        currentWeek.push({ date: '', actions: 0, witnesses: 0, total: -1, moonPhase: { emoji: '', name: '' } });
    }

    for (const day of data) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const totalDaysEngaged = data.filter(d => d.total > 0).length;

    return (
        <div style={{ padding: '0' }}>
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <div>
                    <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '12px',
                        color: 'var(--color-gold-200)',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                    }}>✦ Cosmic Momentum</h3>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '11px',
                        color: 'rgba(226,232,240,0.4)',
                        fontWeight: 300,
                    }}>Last 90 days of engagement</p>
                </div>
                {onClose && (
                    <button onClick={onClose} style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'rgba(226,232,240,0.4)',
                        cursor: 'pointer',
                    }}>✕</button>
                )}
            </div>

            {/* Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                marginBottom: '20px',
            }}>
                {[
                    { label: 'Current Streak', value: `${currentStreak}d`, emoji: '🔥' },
                    { label: 'Days Active', value: `${totalDaysEngaged}`, emoji: '✦' },
                    { label: 'Best Streak', value: `${longestStreak}d`, emoji: '⚡' },
                ].map(stat => (
                    <div key={stat.label} style={{
                        textAlign: 'center',
                        padding: '12px 8px',
                        borderRadius: '12px',
                        background: 'rgba(13,11,34,0.5)',
                        border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <span style={{ fontSize: '16px' }}>{stat.emoji}</span>
                        <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '18px',
                            color: 'var(--color-gold-100)',
                            fontWeight: 700,
                            marginTop: '4px',
                        }}>{stat.value}</p>
                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '8px',
                            color: 'rgba(226,232,240,0.35)',
                            fontWeight: 300,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            marginTop: '2px',
                        }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Day-of-week labels */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '3px',
                marginBottom: '4px',
            }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} style={{
                        textAlign: 'center',
                        fontFamily: 'var(--font-body)',
                        fontSize: '8px',
                        color: 'rgba(226,232,240,0.2)',
                        fontWeight: 300,
                    }}>{d}</span>
                ))}
            </div>

            {/* Heatmap Grid */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                marginBottom: '16px',
            }}>
                {weeks.map((week, wi) => (
                    <div key={wi} style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '3px',
                    }}>
                        {week.map((day, di) => {
                            if (day.total === -1) {
                                // Empty padding cell
                                return <div key={`pad-${di}`} style={{
                                    aspectRatio: '1',
                                    borderRadius: '3px',
                                }} />;
                            }

                            const isToday = day.date === new Date().toISOString().slice(0, 10);
                            const isKeyPhase = day.moonPhase.name === 'New' || day.moonPhase.name === 'Full';

                            return (
                                <div
                                    key={day.date}
                                    title={`${day.date}: ${day.total} events (${day.moonPhase.name})`}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '3px',
                                        background: getCellColor(day.total),
                                        border: isToday ? '1px solid rgba(212,175,55,0.5)' : '1px solid transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: isKeyPhase ? '8px' : '0px',
                                        transition: 'background 0.2s',
                                        position: 'relative',
                                    }}
                                >
                                    {isKeyPhase && <span style={{ opacity: 0.6 }}>{day.moonPhase.emoji}</span>}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '9px',
                    color: 'rgba(226,232,240,0.25)',
                    fontWeight: 300,
                }}>Less</span>
                {[0, 1, 2, 3, 5].map(n => (
                    <div key={n} style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        background: getCellColor(n),
                    }} />
                ))}
                <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '9px',
                    color: 'rgba(226,232,240,0.25)',
                    fontWeight: 300,
                }}>More</span>
                <span style={{ flex: 1 }} />
                <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '9px',
                    color: 'rgba(226,232,240,0.25)',
                    fontWeight: 300,
                }}>🌑 New · 🌕 Full</span>
            </div>

            {/* Breakdown */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
            }}>
                <div style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(13,11,34,0.4)',
                    border: '1px solid rgba(255,255,255,0.03)',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '9px',
                        color: 'rgba(226,232,240,0.3)',
                        fontWeight: 300,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>Forge Actions</p>
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '20px',
                        color: 'var(--color-gold-100)',
                        fontWeight: 700,
                    }}>{totalActions}</p>
                </div>
                <div style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(13,11,34,0.4)',
                    border: '1px solid rgba(255,255,255,0.03)',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '9px',
                        color: 'rgba(226,232,240,0.3)',
                        fontWeight: 300,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>Signs Witnessed</p>
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '20px',
                        color: 'var(--color-gold-100)',
                        fontWeight: 700,
                    }}>{totalWitness}</p>
                </div>
            </div>

            {/* Cosmic Insight */}
            {bestPhase && totalDaysEngaged > 3 && (
                <div style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(61,29,90,0.2) 0%, rgba(28,21,56,0.4) 100%)',
                    border: '1px solid rgba(212,175,55,0.08)',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '11px',
                        color: 'rgba(226,232,240,0.6)',
                        fontWeight: 300,
                        lineHeight: 1.6,
                    }}>
                        ✧ Your strongest momentum occurs during the <span style={{
                            color: 'var(--color-gold-200)',
                            fontWeight: 500,
                        }}>{bestPhase}</span> phase.
                        You've engaged {totalDaysEngaged} of the last 90 days —
                        {currentStreak > 0
                            ? ` and your streak is alive at ${currentStreak} days.`
                            : ` time to reignite your rhythm.`
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
