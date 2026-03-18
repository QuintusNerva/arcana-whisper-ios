/**
 * StoryOverlay — Full-screen Instagram Stories-style teaching overlay.
 *
 * 6-card flow: Hook → Teach (×3) → Quiz → Apply
 * Features: AI Narrator personality, context-aware personalisation,
 * interactive quiz with XP, and apply prompts.
 */

import React from 'react';
import {
    Lesson, StoryCard, Guide, UserContext,
    personalizeText, getGuideById,
} from '../services/teachings.service';

interface StoryOverlayProps {
    lesson: Lesson;
    userContext: UserContext;
    onComplete: (xpEarned: number) => void;
    onClose: () => void;
}

export function StoryOverlay({ lesson, userContext, onComplete, onClose }: StoryOverlayProps) {
    const [currentCard, setCurrentCard] = React.useState(0);
    const [quizAnswered, setQuizAnswered] = React.useState(false);
    const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
    const [xpEarned, setXpEarned] = React.useState(0);
    const [showXpPopup, setShowXpPopup] = React.useState(false);

    const guide = getGuideById(lesson.guideId);
    const cards = lesson.cards;
    const totalCards = cards.length;
    const card = cards[currentCard];

    const goNext = () => {
        if (currentCard < totalCards - 1) {
            setCurrentCard(currentCard + 1);
            setQuizAnswered(false);
            setSelectedAnswer(null);
        }
    };

    const goPrev = () => {
        if (currentCard > 0) {
            setCurrentCard(currentCard - 1);
            setQuizAnswered(false);
            setSelectedAnswer(null);
        }
    };

    const handleQuizAnswer = (idx: number) => {
        if (quizAnswered) return;
        setSelectedAnswer(idx);
        setQuizAnswered(true);
        const quizCard = card as Extract<StoryCard, { type: 'quiz' }>;
        if (idx === quizCard.correctIndex) {
            setXpEarned(prev => prev + 15);
            setShowXpPopup(true);
            setTimeout(() => setShowXpPopup(false), 1500);
        }
    };

    const handleComplete = () => {
        const applyCard = card as Extract<StoryCard, { type: 'apply' }>;
        const totalXp = xpEarned + (applyCard.xpReward || 15);
        onComplete(totalXp);
    };

    const p = (text: string) => personalizeText(text, userContext);

    // Gradient backgrounds per card type
    const bgGradient = (() => {
        switch (card.type) {
            case 'hook': return 'linear-gradient(180deg, #1a0d2e 0%, #0d0618 50%, #150a28 100%)';
            case 'teach': return 'linear-gradient(180deg, #0d0618 0%, #1a0d2e 100%)';
            case 'quiz': return 'linear-gradient(180deg, #1a1040 0%, #0d0618 100%)';
            case 'apply': return 'linear-gradient(180deg, #1a1a0d 0%, #0d0618 100%)';
        }
    })();

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 70,
            background: bgGradient,
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Top bar — Progress + Close */}
            <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
                {/* Progress segments */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                    {cards.map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i < currentCard ? 'rgba(212,175,55,0.8)'
                                : i === currentCard ? 'rgba(212,175,55,0.5)'
                                    : 'rgba(255,255,255,0.12)',
                            transition: 'background 0.3s ease',
                        }} />
                    ))}
                </div>
                {/* Guide + Close */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            backgroundImage: `url(${guide?.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '2px solid rgba(212,175,55,0.3)',
                        }} />
                        <div>
                            <p style={{ fontSize: 11, fontFamily: "'Cinzel', serif", color: '#d4af37', letterSpacing: 1 }}>
                                {guide?.name}
                            </p>
                            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
                                {guide?.domain?.toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none', color: 'rgba(255,255,255,0.5)',
                        fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>
            </div>

            {/* Card content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px', position: 'relative' }}>


                {/* ── HOOK CARD ── */}
                {card.type === 'hook' && (
                    <div style={{ textAlign: 'center', paddingTop: '15vh' }}>
                        <div style={{
                            fontSize: 72, marginBottom: 24,
                            filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.3))',
                        }}>
                            {card.emoji}
                        </div>
                        <h2 style={{
                            fontFamily: "'Cinzel', serif", fontSize: 26, color: '#fff',
                            letterSpacing: 2, marginBottom: 12,
                        }}>
                            {card.title}
                        </h2>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                            {card.subtitle}
                        </p>
                        <p style={{
                            fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 48,
                            letterSpacing: 2, textTransform: 'uppercase',
                        }}>
                            Tap to continue →
                        </p>
                    </div>
                )}

                {/* ── TEACH CARD ── */}
                {card.type === 'teach' && (
                    <div>
                        <p style={{
                            fontSize: 9, color: 'rgba(212,175,55,0.5)',
                            letterSpacing: 3, textTransform: 'uppercase',
                            fontFamily: "'Cinzel', serif", marginBottom: 8,
                        }}>
                            Card {currentCard} of {totalCards - 2}
                        </p>
                        <h3 style={{
                            fontFamily: "'Cinzel', serif", fontSize: 20, color: '#fff',
                            letterSpacing: 1, marginBottom: 20,
                        }}>
                            {card.title}
                        </h3>
                        {p(card.body).split('\n\n').map((para, i) => (
                            <p key={i} style={{
                                fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7,
                                marginBottom: 16,
                            }}>
                                {para}
                            </p>
                        ))}
                        {/* Key Insight callout */}
                        <div style={{
                            marginTop: 24, padding: '16px 18px', borderRadius: 16,
                            background: 'rgba(212,175,55,0.06)',
                            border: '1px solid rgba(212,175,55,0.15)',
                        }}>
                            <p style={{
                                fontSize: 9, color: 'rgba(212,175,55,0.6)',
                                fontFamily: "'Cinzel', serif", letterSpacing: 2,
                                textTransform: 'uppercase', marginBottom: 6,
                            }}>
                                ✦ Key Insight
                            </p>
                            <p style={{ fontSize: 13, color: 'rgba(212,175,55,0.9)', fontStyle: 'italic', lineHeight: 1.6 }}>
                                {p(card.keyInsight)}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── QUIZ CARD ── */}
                {card.type === 'quiz' && (
                    <div style={{ paddingTop: '5vh' }}>
                        <p style={{
                            fontSize: 9, color: 'rgba(99,102,241,0.6)',
                            letterSpacing: 3, textTransform: 'uppercase',
                            fontFamily: "'Cinzel', serif", marginBottom: 12,
                        }}>
                            ✦ Knowledge Check
                        </p>
                        <h3 style={{
                            fontFamily: "'Cinzel', serif", fontSize: 18, color: '#fff',
                            letterSpacing: 0.5, marginBottom: 28, lineHeight: 1.5,
                        }}>
                            {card.question}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {card.options.map((opt, idx) => {
                                const isCorrect = idx === card.correctIndex;
                                const isSelected = selectedAnswer === idx;
                                let bg = 'rgba(255,255,255,0.04)';
                                let border = '1px solid rgba(255,255,255,0.08)';
                                let color = 'rgba(255,255,255,0.8)';

                                if (quizAnswered) {
                                    if (isCorrect) {
                                        bg = 'rgba(34,197,94,0.12)';
                                        border = '1px solid rgba(34,197,94,0.4)';
                                        color = '#22c55e';
                                    } else if (isSelected && !isCorrect) {
                                        bg = 'rgba(239,68,68,0.12)';
                                        border = '1px solid rgba(239,68,68,0.4)';
                                        color = '#ef4444';
                                    }
                                }

                                return (
                                    <button key={idx}
                                        onClick={() => handleQuizAnswer(idx)}
                                        disabled={quizAnswered}
                                        style={{
                                            width: '100%', padding: '14px 18px', borderRadius: 16,
                                            background: bg, border, color,
                                            fontSize: 13, textAlign: 'left', cursor: quizAnswered ? 'default' : 'pointer',
                                            transition: 'all 0.3s ease',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Feedback */}
                        {quizAnswered && (
                            <div style={{
                                marginTop: 20, padding: '14px 16px', borderRadius: 14,
                                background: selectedAnswer === card.correctIndex
                                    ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                border: `1px solid ${selectedAnswer === card.correctIndex
                                    ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            }}>
                                <p style={{
                                    fontSize: 12,
                                    color: selectedAnswer === card.correctIndex ? '#22c55e' : '#ef4444',
                                    marginBottom: 4, fontFamily: "'Cinzel', serif",
                                }}>
                                    {selectedAnswer === card.correctIndex ? '✦ Correct!' : '✕ Not quite'}
                                </p>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                                    {card.explanation}
                                </p>
                            </div>
                        )}
                        {quizAnswered && (
                            <button onClick={goNext} style={{
                                width: '100%', marginTop: 20, padding: '14px',
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))',
                                border: '1px solid rgba(212,175,55,0.3)',
                                color: '#d4af37', fontSize: 13, fontFamily: "'Cinzel', serif",
                                letterSpacing: 2, cursor: 'pointer',
                            }}>
                                Continue →
                            </button>
                        )}
                    </div>
                )}

                {/* ── APPLY CARD ── */}
                {card.type === 'apply' && (
                    <div style={{ paddingTop: '5vh' }}>
                        <p style={{
                            fontSize: 9, color: 'rgba(212,175,55,0.6)',
                            letterSpacing: 3, textTransform: 'uppercase',
                            fontFamily: "'Cinzel', serif", marginBottom: 12,
                        }}>
                            ✦ Apply This Teaching
                        </p>
                        <h3 style={{
                            fontFamily: "'Cinzel', serif", fontSize: 20, color: '#fff',
                            letterSpacing: 1, marginBottom: 20,
                        }}>
                            {card.title}
                        </h3>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 24 }}>
                            {p(card.body)}
                        </p>
                        {/* Journal prompt */}
                        <div style={{
                            padding: '18px 20px', borderRadius: 18,
                            background: 'rgba(212,175,55,0.06)',
                            border: '1px solid rgba(212,175,55,0.15)',
                            marginBottom: 28,
                        }}>
                            <p style={{
                                fontSize: 9, color: 'rgba(212,175,55,0.5)',
                                fontFamily: "'Cinzel', serif", letterSpacing: 2,
                                textTransform: 'uppercase', marginBottom: 8,
                            }}>
                                Journal Prompt
                            </p>
                            <p style={{ fontSize: 13, color: 'rgba(212,175,55,0.85)', fontStyle: 'italic', lineHeight: 1.6 }}>
                                {p(card.prompt)}
                            </p>
                        </div>

                        {/* Complete button */}
                        <button onClick={handleComplete} style={{
                            width: '100%', padding: '16px',
                            borderRadius: 20,
                            background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))',
                            border: '1px solid rgba(212,175,55,0.35)',
                            color: '#d4af37', fontSize: 14, fontFamily: "'Cinzel', serif",
                            letterSpacing: 3, cursor: 'pointer',
                            boxShadow: '0 0 30px rgba(212,175,55,0.08)',
                        }}>
                            ✦ Complete Teaching
                        </button>
                    </div>
                )}
            </div>

            {/* Tap zones (hook + teach cards only) */}
            {card.type !== 'quiz' && card.type !== 'apply' && (
                <>
                    <div
                        onClick={goPrev}
                        style={{
                            position: 'absolute', left: 0, top: 80, bottom: 0,
                            width: '30%', cursor: 'pointer', zIndex: 5,
                        }}
                    />
                    <div
                        onClick={goNext}
                        style={{
                            position: 'absolute', right: 0, top: 80, bottom: 0,
                            width: '70%', cursor: 'pointer', zIndex: 5,
                        }}
                    />
                </>
            )}

            {/* Inline animation style */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
