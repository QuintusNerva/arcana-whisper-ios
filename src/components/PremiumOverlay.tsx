import React from 'react';

interface PremiumOverlayProps {
    onClose: () => void;
    onSubscribe: () => void;
}

const FEATURES = [
    { icon: '🔮', text: 'Unlimited AI Insights' },
    { icon: '♾️', text: 'Unlimited Daily Readings' },
    { icon: '🚫', text: 'Ad-Free Experience' },
    { icon: '📊', text: 'Advanced Spreads & Analytics' },
];

const PLANS = [
    { id: 'monthly', label: 'Monthly', price: '$4.99', period: '/mo', savings: '' },
    { id: 'yearly', label: 'Yearly', price: '$29.99', period: '/yr', savings: 'Save 50%' },
];

export function PremiumOverlay({ onClose, onSubscribe }: PremiumOverlayProps) {
    const [isVisible, setIsVisible] = React.useState(false);
    const [step, setStep] = React.useState<'features' | 'checkout'>('features');
    const [selectedPlan, setSelectedPlan] = React.useState('yearly');
    const [cardNumber, setCardNumber] = React.useState('');
    const [expiry, setExpiry] = React.useState('');
    const [cvc, setCvc] = React.useState('');
    const [name, setName] = React.useState('');
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isComplete, setIsComplete] = React.useState(false);

    React.useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return digits;
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        // Simulate payment processing
        await new Promise(r => setTimeout(r, 2000));
        setIsProcessing(false);
        setIsComplete(true);
        // After showing success, trigger the subscribe callback
        setTimeout(() => {
            onSubscribe();
        }, 2500);
    };

    const isFormValid = cardNumber.replace(/\s/g, '').length === 16
        && expiry.length === 5
        && cvc.length >= 3
        && name.length > 1;

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

                    {/* ═══════════════════════════════════ */}
                    {/* STEP 1: Features                   */}
                    {/* ═══════════════════════════════════ */}
                    {step === 'features' && (
                        <>
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

                            {/* CTA Button */}
                            <button
                                onClick={() => setStep('checkout')}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-altar-gold via-altar-gold-dim to-altar-gold text-altar-deep font-display font-bold text-lg tracking-wide hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Start Premium — $4.99/mo
                            </button>

                            {/* Fine print */}
                            <p className="text-center text-xs text-altar-muted mt-3">
                                Cancel anytime · 7-day free trial
                            </p>
                        </>
                    )}

                    {/* ═══════════════════════════════════ */}
                    {/* STEP 2: Checkout                    */}
                    {/* ═══════════════════════════════════ */}
                    {step === 'checkout' && (
                        <>
                            {/* Back button */}
                            <button
                                onClick={() => setStep('features')}
                                className="flex items-center gap-1 text-sm text-altar-muted hover:text-white transition-colors mb-4"
                            >
                                <span>←</span> Back
                            </button>

                            {/* Header */}
                            <div className="text-center mb-5">
                                <h2 className="font-display text-xl shimmer-text font-semibold tracking-wide">
                                    Choose Your Plan
                                </h2>
                            </div>

                            {/* Plan Selector */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                {PLANS.map((plan) => (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative rounded-2xl p-4 text-center transition-all border-2 ${selectedPlan === plan.id
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
                                ))}
                            </div>

                            {/* Express Checkout */}
                            <div className="space-y-2 mb-4">
                                {/* Apple Pay */}
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                    className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-base flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                    </svg>
                                    Pay
                                </button>

                                {/* Google Pay */}
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                    className="w-full py-3.5 rounded-2xl bg-[#1a1a1a] border border-white/20 text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#2a2a2a] active:scale-[0.98] transition-all"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Pay
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-altar-muted">or pay with card</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {/* Payment Form */}
                            <div className="space-y-3 mb-5">
                                {/* Card Name */}
                                <div>
                                    <label className="block text-xs text-altar-muted mb-1 ml-1">Name on card</label>
                                    <input
                                        type="text"
                                        placeholder="Jane Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-altar-gold/50 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all"
                                    />
                                </div>

                                {/* Card Number */}
                                <div>
                                    <label className="block text-xs text-altar-muted mb-1 ml-1">Card number</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="1234 5678 9012 3456"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-altar-gold/50 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all font-mono tracking-wider"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-40">
                                            <span className="text-base">💳</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expiry + CVC */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-altar-muted mb-1 ml-1">Expiry</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={expiry}
                                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-altar-gold/50 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-altar-muted mb-1 ml-1">CVC</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-altar-gold/50 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handlePayment}
                                disabled={!isFormValid || isProcessing}
                                className={`w-full py-4 rounded-2xl font-display font-bold text-lg tracking-wide transition-all ${isFormValid && !isProcessing
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
                                    `Pay ${selectedPlan === 'yearly' ? '$29.99/yr' : '$4.99/mo'}`
                                )}
                            </button>

                            {/* Security badges */}
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <span className="text-xs text-altar-muted flex items-center gap-1">
                                    🔒 SSL Encrypted
                                </span>
                                <span className="text-white/10">|</span>
                                <span className="text-xs text-altar-muted flex items-center gap-1">
                                    ✦ 7-day free trial
                                </span>
                            </div>

                            {/* Fine print */}
                            <p className="text-center text-[10px] text-white/20 mt-3 leading-relaxed">
                                By subscribing, you agree to our Terms of Service. Your payment
                                method will be charged after the 7-day trial. Cancel anytime in settings.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
