import React from 'react';
import { PRODUCTS, purchaseProduct, restorePurchases, getOfferings, type ProductId } from '../services/storekit.service';

interface PremiumOverlayProps {
    onClose: () => void;
    onSubscribe: () => void;
}

const FEATURES = [
    { icon: '🌙', text: 'Year Ahead Forecast — personalized to your chart' },
    { icon: '🔮', text: 'Unlimited Tarot — all spreads, no daily cap' },
    { icon: '📊', text: 'Celtic Cross, Career Path & Compatibility' },
    { icon: '🎵', text: 'Full Sound Library — Solfeggio & Breathwork Codex' },
];

export function PremiumOverlay({ onClose, onSubscribe }: PremiumOverlayProps) {
    const [isVisible, setIsVisible] = React.useState(false);
    const [selectedPlan, setSelectedPlan] = React.useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('YEARLY');
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isComplete, setIsComplete] = React.useState(false);
    const [isRestoring, setIsRestoring] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [livePrices, setLivePrices] = React.useState<Record<string, { price: string; period: string }> | null>(null);

    React.useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        // Fetch live prices from RevenueCat
        getOfferings().then((offering: any) => {
            if (!offering?.availablePackages) return;
            const prices: Record<string, { price: string; period: string }> = {};
            for (const pkg of offering.availablePackages) {
                const id = pkg.product?.identifier;
                const priceStr = pkg.product?.priceString;
                if (id === PRODUCTS.WEEKLY.id && priceStr) {
                    prices.WEEKLY = { price: priceStr, period: '/wk' };
                } else if (id === PRODUCTS.MONTHLY.id && priceStr) {
                    prices.MONTHLY = { price: priceStr, period: '/mo' };
                } else if (id === PRODUCTS.YEARLY.id && priceStr) {
                    prices.YEARLY = { price: priceStr, period: '/yr' };
                }
            }
            if (Object.keys(prices).length > 0) setLivePrices(prices);
        }).catch(() => { /* use hardcoded fallback */ });
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const handlePurchase = async () => {
        setError(null);
        setIsProcessing(true);
        const product = PRODUCTS[selectedPlan];

        const result = await purchaseProduct(product.id as ProductId);

        setIsProcessing(false);

        if (result.success) {
            setIsComplete(true);
            setTimeout(() => {
                onSubscribe();
            }, 2500);
        } else {
            setError(result.error || 'Something went wrong. Please try again.');
        }
    };

    const handleRestore = async () => {
        setError(null);
        setIsRestoring(true);

        const result = await restorePurchases();

        setIsRestoring(false);

        if (result.restored) {
            setIsComplete(true);
            setTimeout(() => {
                onSubscribe();
            }, 2500);
        } else {
            setError(result.error || 'No active subscriptions found.');
        }
    };

    // ── Success State ──
    if (isComplete) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="relative w-full max-w-[440px] mx-4 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/40 via-altar-bright/30 to-green-500/40 p-[1px]">
                        <div className="w-full h-full rounded-3xl bg-altar-dark/95 backdrop-blur-xl" />
                    </div>
                    <div className="relative z-10 p-8 text-center">
                        <div className="text-6xl mb-4 animate-bounce">✨</div>
                        <h2 className="font-display text-2xl text-green-400 font-semibold tracking-wide mb-2">
                            Welcome, Seeker
                        </h2>
                        <p className="text-altar-muted text-sm">
                            Your premium journey begins now. The stars are aligned.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
                }`}
            onClick={handleClose}
        >
            <div
                className={`relative w-full max-w-[440px] mx-4 rounded-3xl overflow-hidden transition-all duration-500 max-h-[90vh] overflow-y-auto ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-altar-gold/40 via-altar-bright/30 to-altar-gold/40 p-[1px]">
                    <div className="w-full h-full rounded-3xl bg-altar-dark/95 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 pb-4">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        ✕
                    </button>

                    {/* Header */}
                    <div className="text-center mb-3">
                        <div className="text-2xl mb-1">👑</div>
                        <h2 className="font-display text-xl shimmer-text font-semibold tracking-wide">
                            Unlock Premium
                        </h2>
                        <p className="text-xs text-altar-muted mt-1">
                            Elevate your mystical journey
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-3">
                        {FEATURES.map((feature, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 glass rounded-xl px-3 py-2.5 animate-fade-up"
                                style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
                            >
                                <span className="text-base">{feature.icon}</span>
                                <span className="text-[13px] text-altar-text font-medium leading-tight">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Benefits highlight */}
                    <div className="text-center mb-3 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                        <p className="text-[11px] text-altar-muted">✦ Personalized to your natal chart ✦</p>
                    </div>

                    {/* Cancel anytime note */}
                    <div className="flex justify-center mb-3">
                        <div className="px-3.5 py-1 rounded-full text-[10px] font-display tracking-wider"
                            style={{
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                                border: '1px solid rgba(212,175,55,0.3)',
                                color: '#d4af37',
                            }}>
                            ✦ Cancel Anytime
                        </div>
                    </div>

                    {/* Plan Selector */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((key) => {
                            const plan = PRODUCTS[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedPlan(key)}
                                    className={`relative rounded-2xl p-2.5 text-center transition-all border-2 ${selectedPlan === key
                                        ? 'border-altar-gold bg-altar-gold/10 shadow-[0_0_20px_rgba(255,215,0,0.15)]'
                                        : 'border-white/10 glass hover:border-white/20'
                                        }`}
                                >
                                    {plan.savings && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-[8px] text-white font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                            {plan.savings}
                                        </span>
                                    )}
                                    <div className="text-[10px] text-altar-muted mb-0.5 font-medium">{plan.label}</div>
                                    <div className="font-display text-sm text-white font-semibold">
                                        {livePrices?.[key]?.price || plan.price}
                                        <span className="text-[10px] text-altar-muted font-sans">{livePrices?.[key]?.period || plan.period}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                            <p className="text-xs text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Subscribe Button */}
                    <button
                        onClick={handlePurchase}
                        disabled={isProcessing || isRestoring}
                        className={`w-full py-3.5 rounded-2xl font-display font-bold text-base tracking-wide transition-all ${!isProcessing && !isRestoring
                            ? 'bg-gradient-to-r from-altar-gold via-altar-gold-dim to-altar-gold text-altar-deep hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-altar-deep/30 border-t-altar-deep rounded-full animate-spin" />
                                Processing…
                            </span>
                        ) : (
                            `Subscribe — ${livePrices?.[selectedPlan]?.price || PRODUCTS[selectedPlan].price}${livePrices?.[selectedPlan]?.period || PRODUCTS[selectedPlan].period}`

                        )}
                    </button>

                    {/* Restore Purchases — REQUIRED by Apple Guideline 3.1.5 */}
                    <button
                        onClick={handleRestore}
                        disabled={isProcessing || isRestoring}
                        className="w-full mt-2 py-2 rounded-xl text-xs text-altar-muted hover:text-white transition-colors disabled:opacity-50"
                    >
                        {isRestoring ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Restoring…
                            </span>
                        ) : (
                            'Restore Purchases'
                        )}
                    </button>

                    {/* Subscription terms — REQUIRED for auto-renewable subscriptions */}
                    <div className="mt-2">
                        <p className="text-center text-[8px] text-white/25 leading-snug">
                            Payment charged to Apple ID at purchase. Auto-renews unless cancelled 24 hrs before period ends. Manage in App Store settings.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[9px] mt-1.5">
                            <button
                                onClick={async (e) => { e.stopPropagation(); try { const m = await (Function('return import("@capacitor/browser")')() as Promise<any>); await m.Browser.open({ url: '/terms.html' }); } catch { window.open('/terms.html', '_blank'); } }}
                                className="text-altar-gold/40 hover:text-altar-gold transition-colors underline"
                            >
                                Terms
                            </button>
                            <span className="text-white/10">·</span>
                            <button
                                onClick={async (e) => { e.stopPropagation(); try { const m = await (Function('return import("@capacitor/browser")')() as Promise<any>); await m.Browser.open({ url: '/privacy.html' }); } catch { window.open('/privacy.html', '_blank'); } }}
                                className="text-altar-gold/40 hover:text-altar-gold transition-colors underline"
                            >
                                Privacy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
