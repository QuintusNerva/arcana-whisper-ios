import React from 'react';
import { PlanetPosition } from '../services/ephemeris';
import { SynastryAspect } from '../services/astrology.service';

// Zodiac sign data for the wheel
const ZODIAC_WHEEL = [
    { id: 'aries', glyph: '♈', color: '#ef4444' },
    { id: 'taurus', glyph: '♉', color: '#22c55e' },
    { id: 'gemini', glyph: '♊', color: '#f59e0b' },
    { id: 'cancer', glyph: '♋', color: '#6366f1' },
    { id: 'leo', glyph: '♌', color: '#f97316' },
    { id: 'virgo', glyph: '♍', color: '#84cc16' },
    { id: 'libra', glyph: '♎', color: '#ec4899' },
    { id: 'scorpio', glyph: '♏', color: '#8b5cf6' },
    { id: 'sagittarius', glyph: '♐', color: '#ef4444' },
    { id: 'capricorn', glyph: '♑', color: '#6b7280' },
    { id: 'aquarius', glyph: '♒', color: '#06b6d4' },
    { id: 'pisces', glyph: '♓', color: '#a78bfa' },
];

interface SynastryWheelProps {
    userPlanets: PlanetPosition[];
    partnerPlanets: PlanetPosition[];
    aspects: SynastryAspect[];
    onAspectTap: (aspect: SynastryAspect) => void;
    selectedAspect: SynastryAspect | null;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    // Astro charts: 0° Aries = left (9 o'clock), going counterclockwise
    const angleRad = ((180 - angleDeg) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy - r * Math.sin(angleRad),
    };
}

function getAspectColor(nature: string, isSelected: boolean): string {
    if (isSelected) return '#FFD700';
    switch (nature) {
        case 'harmonious': return '#4ade80';
        case 'challenging': return '#f87171';
        case 'neutral': return '#fbbf24';
        default: return '#8b8b8b';
    }
}

export function SynastryWheel({ userPlanets, partnerPlanets, aspects, onAspectTap, selectedAspect }: SynastryWheelProps) {
    const size = 340;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 10;
    const signR = outerR - 20;
    const innerRingR = signR - 16;
    const partnerR = innerRingR - 14;
    const userR = partnerR - 18;
    const aspectR = userR - 4;

    // Only show the most significant aspects (top 12)
    const visibleAspects = aspects.slice(0, 12);

    return (
        <div className="relative flex justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_30px_rgba(139,95,191,0.15)]">
                {/* Background */}
                <defs>
                    <radialGradient id="wheelBg" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(30,15,50,0.9)" />
                        <stop offset="100%" stopColor="rgba(10,5,25,0.95)" />
                    </radialGradient>
                </defs>
                <circle cx={cx} cy={cy} r={outerR} fill="url(#wheelBg)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                {/* Zodiac sign segments */}
                {ZODIAC_WHEEL.map((sign, i) => {
                    const startAngle = i * 30;
                    const midAngle = startAngle + 15;
                    const endAngle = startAngle + 30;

                    // Segment line
                    const lineStart = polarToXY(cx, cy, innerRingR, startAngle);
                    const lineEnd = polarToXY(cx, cy, outerR, startAngle);

                    // Glyph position
                    const glyphPos = polarToXY(cx, cy, signR, midAngle);

                    return (
                        <g key={sign.id}>
                            <line
                                x1={lineStart.x} y1={lineStart.y}
                                x2={lineEnd.x} y2={lineEnd.y}
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth="0.5"
                            />
                            <text
                                x={glyphPos.x} y={glyphPos.y}
                                textAnchor="middle" dominantBaseline="central"
                                fill={sign.color}
                                fontSize="10"
                                opacity="0.6"
                            >
                                {sign.glyph}
                            </text>
                        </g>
                    );
                })}

                {/* Inner ring separator */}
                <circle cx={cx} cy={cy} r={innerRingR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <circle cx={cx} cy={cy} r={partnerR + 8} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2,4" />

                {/* Aspect lines — drawn BEHIND planets */}
                {visibleAspects.map((aspect, i) => {
                    const p1Pos = polarToXY(cx, cy, aspectR, aspect.planet1.longitude);
                    const p2Pos = polarToXY(cx, cy, aspectR, aspect.planet2.longitude);
                    const isSelected = selectedAspect === aspect;
                    const color = getAspectColor(aspect.nature, isSelected);
                    const opacity = isSelected ? 0.9 : 0.25 + (aspect.significance / 200);

                    return (
                        <line
                            key={`aspect-${i}`}
                            x1={p1Pos.x} y1={p1Pos.y}
                            x2={p2Pos.x} y2={p2Pos.y}
                            stroke={color}
                            strokeWidth={isSelected ? 2 : 1}
                            opacity={opacity}
                            strokeDasharray={aspect.nature === 'harmonious' ? 'none' : '4,3'}
                            className="cursor-pointer transition-all duration-200"
                            onClick={(e) => { e.stopPropagation(); onAspectTap(aspect); }}
                        />
                    );
                })}

                {/* Partner planets (outer ring) — pink/rose dots */}
                {partnerPlanets.map((planet) => {
                    const pos = polarToXY(cx, cy, partnerR, planet.longitude);
                    return (
                        <g key={`partner-${planet.id}`}>
                            <circle cx={pos.x} cy={pos.y} r={9} fill="rgba(236,72,153,0.15)" stroke="rgba(236,72,153,0.4)" strokeWidth="1" />
                            <text
                                x={pos.x} y={pos.y}
                                textAnchor="middle" dominantBaseline="central"
                                fill="#ec4899"
                                fontSize="9"
                            >
                                {planet.glyph}
                            </text>
                        </g>
                    );
                })}

                {/* User planets (inner ring) — gold dots */}
                {userPlanets.map((planet) => {
                    const pos = polarToXY(cx, cy, userR, planet.longitude);
                    return (
                        <g key={`user-${planet.id}`}>
                            <circle cx={pos.x} cy={pos.y} r={9} fill="rgba(255,215,0,0.15)" stroke="rgba(255,215,0,0.4)" strokeWidth="1" />
                            <text
                                x={pos.x} y={pos.y}
                                textAnchor="middle" dominantBaseline="central"
                                fill="#FFD700"
                                fontSize="9"
                            >
                                {planet.glyph}
                            </text>
                        </g>
                    );
                })}

                {/* Center label */}
                <circle cx={cx} cy={cy} r={28} fill="rgba(20,10,35,0.9)" stroke="rgba(255,215,0,0.15)" strokeWidth="0.5" />
                <text x={cx} y={cy - 5} textAnchor="middle" fill="#FFD700" fontSize="7" opacity="0.7" fontFamily="var(--font-display)">SYNASTRY</text>
                <text x={cx} y={cy + 7} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6">Tap an aspect</text>
            </svg>

            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FFD700]/60 ring-1 ring-[#FFD700]/30" />
                    <span className="text-[9px] text-altar-muted/60 font-display">You</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-pink-500/60 ring-1 ring-pink-500/30" />
                    <span className="text-[9px] text-altar-muted/60 font-display">Partner</span>
                </div>
            </div>
        </div>
    );
}
