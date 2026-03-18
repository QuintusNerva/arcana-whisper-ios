import React from 'react';
import { safeStorage } from '../services/storage.service';

const STORAGE_KEY = 'hasSeenCoachMark';

interface Step {
    target: string | null; // data-coach attribute value, null = full-screen
    title: string;
    message: string;
    icon: string;
    position: 'below' | 'above'; // tooltip relative to target
}

const STEPS: Step[] = [
    {
        target: 'sun-sign',
        title: 'Your Daily Horoscope',
        message: 'Tap your Sun sign to read today\'s personalized horoscope — updated every day.',
        icon: '☉',
        position: 'below',
    },
    {
        target: 'scripting',
        title: 'Script Your Intentions',
        message: 'This is your sacred journal. Tap here to script intentions, record dreams, and track your manifestations.',
        icon: '✍',
        position: 'above',
    },
    {
        target: null,
        title: 'Explore Everything',
        message: 'Most buttons in this app reveal deeper wisdom. Tap the portals, tap your Moon sign, tap your Rising — every element is interactive. Go explore!',
        icon: '✦',
        position: 'below',
    },
];

const SPOTLIGHT_PADDING = 12;
const SPOTLIGHT_RADIUS = 16;

export function CoachMarkTutorial({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [visible, setVisible] = React.useState(false);
    const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
    const [exiting, setExiting] = React.useState(false);
    const targetElRef = React.useRef<Element | null>(null);

    const step = STEPS[currentStep];
    const isLastStep = currentStep === STEPS.length - 1;

    // Elevate the target element above the overlay (z-index only — NO color changes)
    const elevateTarget = React.useCallback((el: Element | null) => {
        if (el) {
            const htmlEl = el as HTMLElement;
            htmlEl.style.position = 'relative';
            htmlEl.style.zIndex = '10001';
            htmlEl.style.pointerEvents = 'none';
        }
    }, []);

    // Restore the target element to its original state
    const restoreTarget = React.useCallback((el: Element | null) => {
        if (el) {
            const htmlEl = el as HTMLElement;
            htmlEl.style.position = '';
            htmlEl.style.zIndex = '';
            htmlEl.style.pointerEvents = '';
        }
    }, []);

    // Find and measure the target element
    const measureTarget = React.useCallback(() => {
        // Restore previous target
        restoreTarget(targetElRef.current);

        if (!step.target) {
            setTargetRect(null);
            targetElRef.current = null;
            return;
        }
        const el = document.querySelector(`[data-coach="${step.target}"]`);
        if (el) {
            // Scroll into view first
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Measure after scroll settles
            setTimeout(() => {
                const rect = el.getBoundingClientRect();
                setTargetRect(rect);
                elevateTarget(el);
                targetElRef.current = el;
            }, 300);
        }
    }, [step.target, elevateTarget, restoreTarget]);

    // On mount and step change, measure target after a small delay for scroll
    React.useEffect(() => {
        setVisible(false);
        const timer = setTimeout(() => {
            measureTarget();
            setVisible(true);
        }, 200);
        return () => clearTimeout(timer);
    }, [currentStep, measureTarget]);

    // Re-measure on resize
    React.useEffect(() => {
        const handler = () => {
            if (!step.target) return;
            const el = document.querySelector(`[data-coach="${step.target}"]`);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect(rect);
            }
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [step.target]);

    // Cleanup on unmount — restore any elevated target
    React.useEffect(() => {
        return () => {
            restoreTarget(targetElRef.current);
        };
    }, [restoreTarget]);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLastStep) {
            handleDismiss();
        } else {
            setVisible(false);
            // Restore current target before moving to next
            restoreTarget(targetElRef.current);
            targetElRef.current = null;
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 250);
        }
    };

    const handleSkip = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleDismiss();
    };

    const handleDismiss = () => {
        setExiting(true);
        restoreTarget(targetElRef.current);
        targetElRef.current = null;
        setTimeout(() => {
            safeStorage.setItem(STORAGE_KEY, 'true');
            onComplete();
        }, 350);
    };

    // Tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        if (!targetRect) {
            return {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: 320,
            };
        }

        const centerX = targetRect.left + targetRect.width / 2;
        const tooltipWidth = 300;
        let left = centerX - tooltipWidth / 2;
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

        if (step.position === 'below') {
            return {
                position: 'absolute',
                top: targetRect.bottom + SPOTLIGHT_PADDING + 16,
                left,
                maxWidth: tooltipWidth,
            };
        } else {
            return {
                position: 'absolute',
                bottom: window.innerHeight - targetRect.top + SPOTLIGHT_PADDING + 16,
                left,
                maxWidth: tooltipWidth,
            };
        }
    };

    // Box-shadow spread cutout style — creates a transparent window over the target
    const getCutoutStyle = (): React.CSSProperties | null => {
        if (!targetRect) return null;
        return {
            position: 'absolute',
            left: targetRect.left - SPOTLIGHT_PADDING,
            top: targetRect.top - SPOTLIGHT_PADDING,
            width: targetRect.width + SPOTLIGHT_PADDING * 2,
            height: targetRect.height + SPOTLIGHT_PADDING * 2,
            borderRadius: SPOTLIGHT_RADIUS,
            // This is the magic: a massive spread shadow acts as the overlay,
            // while this div itself is transparent — creating a window cutout
            boxShadow: '0 0 0 9999px rgba(5, 2, 15, 0.88)',
            border: '2px solid rgba(212, 175, 55, 0.5)',
            zIndex: 9999,
            pointerEvents: 'none' as const,
            transition: 'all 0.35s ease',
        };
    };

    // Pulse ring position (around the elevated element)
    const getPulseRingStyle = (): React.CSSProperties | null => {
        if (!targetRect) return null;
        return {
            position: 'absolute',
            left: targetRect.left - SPOTLIGHT_PADDING - 4,
            top: targetRect.top - SPOTLIGHT_PADDING - 4,
            width: targetRect.width + (SPOTLIGHT_PADDING + 4) * 2,
            height: targetRect.height + (SPOTLIGHT_PADDING + 4) * 2,
            borderRadius: SPOTLIGHT_RADIUS + 6,
            border: '2px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 0 24px rgba(212, 175, 55, 0.2), inset 0 0 24px rgba(212, 175, 55, 0.06)',
            animation: 'coach-pulse-ring 1.8s ease-in-out infinite',
            pointerEvents: 'none' as const,
            zIndex: 10000,
        };
    };

    const cutoutStyle = getCutoutStyle();
    const pulseRingStyle = getPulseRingStyle();

    return (
        <div
            className={`coach-overlay ${visible ? 'coach-visible' : ''} ${exiting ? 'coach-exiting' : ''}`}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
            }}
            onClick={handleNext}
        >
            {/* Dark overlay with cutout window OR solid for full-screen steps */}
            {targetRect && cutoutStyle ? (
                // Box-shadow spread technique: this div IS the overlay.
                // It's positioned over the target, so the target area is transparent.
                // The 9999px spread shadow covers everything else in dark.
                <div style={cutoutStyle} />
            ) : (
                // Full-screen dark overlay (no target to cut out)
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(5, 2, 15, 0.88)',
                        transition: 'opacity 0.35s ease',
                    }}
                />
            )}

            {/* Pulsing gold ring around target */}
            {pulseRingStyle && <div style={pulseRingStyle} />}

            {/* Tooltip card */}
            <div
                style={{
                    ...getTooltipStyle(),
                    opacity: visible ? 1 : 0,
                    transform: visible
                        ? (targetRect ? 'translateY(0)' : 'translate(-50%, -50%)')
                        : (targetRect ? 'translateY(12px)' : 'translate(-50%, -45%)'),
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                    zIndex: 10002,
                }}
            >
                <div
                    style={{
                        background: 'linear-gradient(160deg, #1c1538 0%, #130f2e 50%, #0d0b22 100%)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: 20,
                        padding: '24px 20px 20px',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.1), inset 0 1px 1px rgba(255,255,255,0.08)',
                        textAlign: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Icon */}
                    <div
                        style={{
                            fontSize: 32,
                            marginBottom: 8,
                            filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))',
                        }}
                    >
                        {step.icon}
                    </div>

                    {/* Title */}
                    <h3
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: 13,
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                            color: '#d4af37',
                            marginBottom: 8,
                        }}
                    >
                        {step.title}
                    </h3>

                    {/* Message */}
                    <p
                        style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: 'rgba(226, 232, 240, 0.85)',
                            marginBottom: 20,
                        }}
                    >
                        {step.message}
                    </p>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        {!isLastStep && (
                            <button
                                onClick={handleSkip}
                                style={{
                                    background: 'none',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                    padding: '10px 18px',
                                    fontSize: 11,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase',
                                    color: 'rgba(148, 163, 184, 0.7)',
                                    cursor: 'pointer',
                                }}
                            >
                                Skip
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            style={{
                                background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                border: '2px solid rgba(212,175,55,0.6)',
                                borderRadius: 12,
                                padding: '10px 24px',
                                fontSize: 11,
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 800,
                                letterSpacing: '2.5px',
                                textTransform: 'uppercase',
                                color: '#1a0f2e',
                                cursor: 'pointer',
                                boxShadow: '0 2px 0 #8a6b25, 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.15)',
                            }}
                        >
                            {isLastStep ? "Got it!" : 'Next'}
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14 }}>
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: i === currentStep ? 18 : 6,
                                    height: 6,
                                    borderRadius: 3,
                                    background: i === currentStep
                                        ? 'linear-gradient(90deg, #d4af37, #f9e491)'
                                        : 'rgba(255,255,255,0.15)',
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function useCoachMark() {
    const [shouldShow, setShouldShow] = React.useState(() => {
        return !safeStorage.getItem(STORAGE_KEY);
    });

    const dismiss = React.useCallback(() => {
        setShouldShow(false);
    }, []);

    return { shouldShow, dismiss };
}
