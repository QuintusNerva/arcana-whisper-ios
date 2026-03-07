import React from 'react';
import { PRODUCTS, purchaseProduct, restorePurchases, type ProductId } from '../services/storekit.service';

interface PremiumOverlayProps {
    onClose: () => void;
    onSubscribe: () => void;
}

const FEATURES = [
    { icon: '🔮', text: 'Unlimited Deep Insights' },
    { icon: '♾️', text: 'Unlimited Daily Readings' },
    { icon: '📊', text: 'Advanced Spreads & Analytics' },
    { icon: '🌙', text: 'Cosmic Blueprint & Year Ahead' },
];

export function PremiumOverlay({ onClose, onSubscribe }: PremiumOverlayProps) {
    const [isVisible, setIsVisible] = React.useState(false);
    const [selectedPlan, setSelectedPlan] = React.useState<'MONTHLY' | 'YEARLY'>('YEARLY');
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isComplete, setIsComplete] = React.useState(false);
    const [isRestoring, setIsRestoring] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
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
                <div className="relative z-10 p-6">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        ✕
                    </button>

                    {/* Header */}
                    <div className="text-center mb-5">
                        <div className="text-3xl mb-2">👑</div>
                        <h2 className="font-display text-2xl shimmer-text font-semibold tracking-wide">
                            Unlock Premium
                        </h2>
                        <p className="text-sm text-altar-muted mt-2">
                            Elevate your mystical journey
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                        {FEATURES.map((feature, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 glass rounded-xl px-4 py-3 animate-fade-up"
                                style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
                            >
                                <span className="text-lg">{feature.icon}</span>
                                <span className="text-sm text-altar-text font-medium">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Plan Selector */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {(['MONTHLY', 'YEARLY'] as const).map((key) => {
                            const plan = PRODUCTS[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedPlan(key)}
                                    className={`relative rounded-2xl p-4 text-center transition-all border-2 ${selectedPlan === key
                                        ? 'border-altar-gold bg-altar-gold/10 shadow-[0_0_20px_rgba(255,215,0,0.15)]'
                                        : 'border-white/10 glass hover:border-white/20'
                                        }`}
                                >
                                    {plan.savings && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-[10px] text-white font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {plan.savings}
                                        </span>
                                    )}
                                    <div className="text-xs text-altar-muted mb-1 font-medium">{plan.label}</div>
                                    <div className="font-display text-lg text-white font-semibold">
                                        {plan.price}
                                        <span className="text-xs text-altar-muted font-sans">{plan.period}</span>
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
                        className={`w-full py-4 rounded-2xl font-display font-bold text-lg tracking-wide transition-all ${!isProcessing && !isRestoring
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
                            `Subscribe — ${PRODUCTS[selectedPlan].price}${PRODUCTS[selectedPlan].period}`
                        )}
                    </button>

                    {/* Restore Purchases — REQUIRED by Apple Guideline 3.1.5 */}
                    <button
                        onClick={handleRestore}
                        disabled={isProcessing || isRestoring}
                        className="w-full mt-3 py-2.5 rounded-xl text-sm text-altar-muted hover:text-white transition-colors disabled:opacity-50"
                    >
                        {isRestoring ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Restoring…
                            </span>
                        ) : (
                            'Restore Purchases'
                        )}
                    </button>

                    {/* Subscription terms — REQUIRED for auto-renewable subscriptions */}
                    <div className="mt-4 space-y-2">
                        <p className="text-center text-[10px] text-white/30 leading-relaxed">
                            Payment will be charged to your Apple ID account at confirmation of purchase.
                            Subscription automatically renews unless it is cancelled at least 24 hours before
                            the end of the current period. Your account will be charged for renewal within
                            24 hours prior to the end of the current period.
                        </p>
                        <p className="text-center text-[10px] text-white/30 leading-relaxed">
                            You can manage and cancel your subscriptions by going to your App Store account
                            settings after purchase.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[10px]">
                            <button className="text-altar-gold/50 hover:text-altar-gold transition-colors underline">
                                Terms of Service
                            </button>
                            <span className="text-white/10">|</span>
                            <button className="text-altar-gold/50 hover:text-altar-gold transition-colors underline">
                                Privacy Policy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
