import React from 'react';
import { SynastryAspect } from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { safeStorage } from '../services/storage.service';
import { AIResponseRenderer } from './AIResponseRenderer';

const CATEGORY_META: Record<string, { emoji: string; label: string; color: string; border: string }> = {
    chemistry: { emoji: '🔥', label: 'Chemistry & Attraction', color: 'text-rose-400', border: 'border-rose-500/20' },
    emotional: { emoji: '🧲', label: 'Emotional Bond', color: 'text-blue-400', border: 'border-blue-500/20' },
    friction: { emoji: '⚡', label: 'Friction Point', color: 'text-amber-400', border: 'border-amber-500/20' },
    growth: { emoji: '🌱', label: 'Growth Potential', color: 'text-green-400', border: 'border-green-500/20' },
    karmic: { emoji: '🔗', label: 'Karmic Tie', color: 'text-purple-400', border: 'border-purple-500/20' },
    communication: { emoji: '💬', label: 'Communication', color: 'text-cyan-400', border: 'border-cyan-500/20' },
};

const NATURE_COLORS: Record<string, string> = {
    harmonious: 'from-green-500/10 to-emerald-500/5',
    challenging: 'from-red-500/10 to-orange-500/5',
    neutral: 'from-yellow-500/10 to-amber-500/5',
};

interface AspectCardProps {
    aspect: SynastryAspect;
    onClose: () => void;
}

export function AspectCard({ aspect, onClose }: AspectCardProps) {
    const [reading, setReading] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const meta = CATEGORY_META[aspect.category] || CATEGORY_META.communication;
    const bgGradient = NATURE_COLORS[aspect.nature] || NATURE_COLORS.neutral;
    const sign1 = aspect.planet1.signId.charAt(0).toUpperCase() + aspect.planet1.signId.slice(1);
    const sign2 = aspect.planet2.signId.charAt(0).toUpperCase() + aspect.planet2.signId.slice(1);

    React.useEffect(() => {
        // Check cache first
        const cacheKey = `synaspect_${aspect.planet1.id}_${aspect.planet2.id}_${aspect.type}`;
        try {
            const cached = safeStorage.getItem(cacheKey);
            if (cached) { setReading(cached); return; }
        } catch { /* */ }

        const ai = new AIService();
        if (!ai.hasApiKey()) {
            setReading(`Your ${aspect.planet1.name} in ${sign1} ${aspect.type.toLowerCase()}s ${aspect.person2Label}'s ${aspect.planet2.name} in ${sign2}. This ${aspect.nature} connection shapes the ${aspect.category} dimension of your relationship.`);
            return;
        }

        setLoading(true);
        let cancelled = false;

        ai.getSynastryAspectReading(
            aspect.planet1.name, sign1,
            aspect.planet2.name, sign2,
            aspect.type, aspect.nature,
            aspect.category,
            aspect.person1Label, aspect.person2Label,
        ).then(result => {
            if (!cancelled) {
                const cleaned = result.replace(/^["']|["']$/g, '').trim();
                setReading(cleaned);
                try { safeStorage.setItem(cacheKey, cleaned); } catch { /* */ }
            }
        }).catch(() => {
            if (!cancelled) {
                setReading(`Your ${aspect.planet1.name} in ${sign1} ${aspect.type.toLowerCase()}s ${aspect.person2Label}'s ${aspect.planet2.name} in ${sign2}. This ${aspect.nature} connection shapes the ${aspect.category} dimension of your relationship.`);
            }
        }).finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [aspect]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            {/* Card */}
            <div
                className={`relative w-full max-w-[500px] rounded-t-3xl border-t ${meta.border} bg-gradient-to-b ${bgGradient} backdrop-blur-xl animate-slide-up`}
                style={{ background: 'linear-gradient(180deg, rgba(20,12,35,0.98) 0%, rgba(15,8,30,0.99) 100%)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-white/15" />
                </div>

                <div className="px-5 pb-8 safe-bottom">
                    {/* Header: Planet glyphs + aspect */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
                                <span className="text-lg text-[#FFD700]">{aspect.planet1.glyph}</span>
                            </div>
                            <span className="text-[9px] text-altar-muted mt-1 font-display">{aspect.person1Label}</span>
                            <span className="text-[10px] text-altar-text/70 font-display">{aspect.planet1.name}</span>
                            <span className="text-[8px] text-altar-muted/60">{sign1} {aspect.planet1.degreeInSign.toFixed(0)}°</span>
                        </div>

                        <div className="flex flex-col items-center mx-2">
                            <span className="text-xl text-altar-gold/80">{aspect.symbol}</span>
                            <span className="text-[9px] text-altar-muted font-display tracking-wide">{aspect.type}</span>
                            <span className="text-[8px] text-altar-muted/50">{aspect.orb}° orb</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                                <span className="text-lg text-pink-400">{aspect.planet2.glyph}</span>
                            </div>
                            <span className="text-[9px] text-altar-muted mt-1 font-display">{aspect.person2Label}</span>
                            <span className="text-[10px] text-altar-text/70 font-display">{aspect.planet2.name}</span>
                            <span className="text-[8px] text-altar-muted/60">{sign2} {aspect.planet2.degreeInSign.toFixed(0)}°</span>
                        </div>
                    </div>

                    {/* Category badge */}
                    <div className="flex justify-center mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border ${meta.border} text-[10px] font-display tracking-wide ${meta.color}`}>
                            {meta.emoji} {meta.label}
                        </span>
                    </div>

                    {/* AI Interpretation */}
                    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                        {loading ? (
                            <div className="space-y-2.5 py-1">
                                <div className="h-3 shimmer-skeleton w-full" />
                                <div className="h-3 shimmer-skeleton w-[90%]" />
                                <div className="h-3 shimmer-skeleton w-[75%]" />
                            </div>
                        ) : reading ? (
                            <p className="text-[13px] text-altar-text/80 leading-relaxed italic">
                                "{reading}"
                            </p>
                        ) : null}
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm text-altar-muted font-display tracking-wide hover:bg-white/10 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Compact aspect list item for the scrollable aspects list.
 */
export function AspectListItem({ aspect, onTap }: { aspect: SynastryAspect; onTap: () => void }) {
    const meta = CATEGORY_META[aspect.category] || CATEGORY_META.communication;
    const sign1 = aspect.planet1.signId.charAt(0).toUpperCase() + aspect.planet1.signId.slice(1);
    const sign2 = aspect.planet2.signId.charAt(0).toUpperCase() + aspect.planet2.signId.slice(1);

    const natureIcon = aspect.nature === 'harmonious' ? '●' : aspect.nature === 'challenging' ? '▲' : '◆';
    const natureColor = aspect.nature === 'harmonious' ? 'text-green-400' : aspect.nature === 'challenging' ? 'text-red-400' : 'text-yellow-400';

    return (
        <button
            onClick={onTap}
            className="w-full flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-colors text-left group"
        >
            {/* Planet pair */}
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[#FFD700] text-sm">{aspect.planet1.glyph}</span>
                <span className={`text-[10px] ${natureColor}`}>{aspect.symbol}</span>
                <span className="text-pink-400 text-sm">{aspect.planet2.glyph}</span>
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-altar-text/80 truncate">
                    {aspect.planet1.name} {aspect.type} {aspect.planet2.name}
                </p>
                <p className="text-[10px] text-altar-muted/60 truncate">
                    {sign1} · {sign2}
                </p>
            </div>

            {/* Category + nature */}
            <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[9px] font-display ${meta.color}`}>{meta.emoji}</span>
                <span className={`text-[8px] ${natureColor}`}>{natureIcon}</span>
            </div>

            <span className="text-[10px] text-altar-muted/40 group-hover:text-altar-gold/60 transition-colors">→</span>
        </button>
    );
}
