/**
 * CosmicInvite — Landing page for shared cosmic cards.
 *
 * When a user shares their birth data via URL, recipients without the app
 * see a beautiful card with a download CTA. Users WITH the app can
 * auto-import the shared data into their Family Circle.
 *
 * URL format:
 *   /invite?n=Blake&s=sagittarius&m=aries&r=gemini&lp=7&bd=1992-12-10
 */

import React from 'react';
import { getNatalTriad, getLifePathNumber, BirthData } from '../services/astrology.service';

// ── Zodiac glyphs lookup ──
const ZODIAC_GLYPHS: Record<string, string> = {
    aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
    leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
    sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

interface InviteData {
    name: string;
    sun: string;
    moon: string;
    rising: string;
    lifePath: number;
    birthday: string;
    birthTime?: string;
    location?: string;
    lat?: number;
    lng?: number;
    utcOffset?: number;
}

/**
 * Parse invite data from URL search params.
 */
export function parseInviteParams(search: string): InviteData | null {
    const p = new URLSearchParams(search);
    const name = p.get('n');
    const sun = p.get('s');
    const birthday = p.get('bd');
    if (!name || !sun || !birthday) return null;

    return {
        name,
        sun: sun.toLowerCase(),
        moon: (p.get('m') || sun).toLowerCase(),
        rising: (p.get('r') || sun).toLowerCase(),
        lifePath: parseInt(p.get('lp') || '0') || 0,
        birthday,
        birthTime: p.get('bt') || undefined,
        location: p.get('loc') || undefined,
        lat: p.get('lat') ? parseFloat(p.get('lat')!) : undefined,
        lng: p.get('lng') ? parseFloat(p.get('lng')!) : undefined,
        utcOffset: p.get('tz') ? parseFloat(p.get('tz')!) : undefined,
    };
}

/**
 * Generate a share URL from user's birth data.
 */
export function generateShareURL(
    name: string,
    birthData: BirthData,
    baseUrl: string,
): string {
    const triad = getNatalTriad(birthData);
    const lp = getLifePathNumber(birthData.birthday);

    const params = new URLSearchParams();
    params.set('n', name);
    params.set('s', triad.sun.id);
    params.set('m', triad.moon.id);
    params.set('r', triad.rising.id);
    params.set('lp', String(lp));
    params.set('bd', birthData.birthday);
    if (birthData.birthTime) params.set('bt', birthData.birthTime);
    if (birthData.location) params.set('loc', birthData.location);
    if (birthData.latitude !== undefined) params.set('lat', String(birthData.latitude));
    if (birthData.longitude !== undefined) params.set('lng', String(birthData.longitude));
    if (birthData.utcOffset !== undefined) params.set('tz', String(birthData.utcOffset));

    return `${baseUrl}?invite=1&${params.toString()}`;
}

/**
 * Landing page shown when someone opens a shared cosmic card link.
 */
export function CosmicInvite({ data, onImport, onDismiss }: {
    data: InviteData;
    onImport: () => void;
    onDismiss: () => void;
}) {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-altar-deep via-altar-dark to-altar-purple text-altar-text flex flex-col items-center justify-center px-6 z-[100]" style={{ height: '100dvh' }}>
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-altar-gold/5 blur-[100px] animate-pulse-glow pointer-events-none" />
            <div className="absolute bottom-1/3 left-1/3 w-[200px] h-[200px] rounded-full bg-altar-bright/5 blur-[80px] pointer-events-none" />

            <div className="max-w-[380px] w-full text-center animate-fade-up" style={{ marginTop: '-5vh' }}>
                {/* Header */}
                <p className="text-[10px] font-display tracking-[4px] text-altar-muted/60 uppercase mb-3">
                    ✦ Cosmic Card ✦
                </p>
                <h1 className="font-display text-2xl tracking-[4px] mb-1">
                    <span className="shimmer-text">{data.name.toUpperCase()}</span>
                </h1>
                <p className="text-xs text-altar-muted mb-6">shared their cosmic blueprint with you</p>

                {/* The Card */}
                <div className="relative mx-auto rounded-2xl overflow-hidden border border-altar-gold/20 mb-6"
                    style={{ background: 'linear-gradient(135deg, rgba(20,12,35,0.95), rgba(30,18,50,0.95), rgba(20,12,35,0.95))' }}>
                    {/* Gold shimmer edge */}
                    <div className="absolute inset-0 rounded-2xl border border-altar-gold/10 pointer-events-none" />

                    <div className="p-6">
                        {/* Big zodiac glyph */}
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-altar-mid to-altar-bright shadow-[0_0_40px_rgba(139,95,191,0.4)] flex items-center justify-center">
                            <span className="text-4xl">{ZODIAC_GLYPHS[data.sun] || '✦'}</span>
                        </div>

                        {/* Triad */}
                        <div className="flex justify-center gap-6 mb-4">
                            <div className="text-center">
                                <p className="text-[9px] font-display text-altar-muted/50 tracking-[2px] uppercase">Sun</p>
                                <p className="text-sm text-altar-gold font-display mt-0.5">{capitalize(data.sun)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-display text-altar-muted/50 tracking-[2px] uppercase">Moon</p>
                                <p className="text-sm text-altar-text font-display mt-0.5">{capitalize(data.moon)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-display text-altar-muted/50 tracking-[2px] uppercase">Rising</p>
                                <p className="text-sm text-altar-text font-display mt-0.5">{capitalize(data.rising)}</p>
                            </div>
                        </div>

                        {/* Life Path */}
                        {data.lifePath > 0 && (
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="text-[10px] font-display text-altar-muted/50 tracking-[2px]">LIFE PATH</span>
                                <span className="text-lg text-altar-gold font-display">{data.lifePath}</span>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="w-12 h-px bg-altar-gold/20 mx-auto my-4" />

                        {/* Invite text */}
                        <p className="text-xs text-altar-muted leading-relaxed">
                            Discover how your stars align with {data.name}'s — unlock your own birth chart, tarot readings, and cosmic guidance.
                        </p>
                    </div>
                </div>

                {/* CTA buttons */}
                <button
                    onClick={onImport}
                    className="w-full py-4 rounded-2xl bg-gradient-to-br from-altar-mid to-altar-bright border border-altar-gold/20 text-base font-display font-semibold tracking-wide transition-all hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,215,0,0.2)] hover:border-altar-gold/40 active:scale-[0.98] mb-3"
                >
                    ✦ Add {data.name} to My Family Circle ✦
                </button>

                <p className="text-[10px] text-altar-muted/40 mb-4">
                    Their birth data will be saved to your Family Circle for cosmic readings
                </p>

                <button
                    onClick={onDismiss}
                    className="text-xs text-altar-muted/50 hover:text-altar-muted transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}
