/**
 * TeachingsSection — Dashboard for the Teachings tab.
 *
 * Pixel-matched to prototypes/school-upgrade.html.
 *
 * Replaces the old static accordion with an interactive continuous learning
 * experience: streak/XP bar, AI Narrator guides, hero card, mastery rings,
 * continue learning, quick review, learning paths, and story overlay integration.
 */

import React from 'react';
import {
    GUIDES, LESSONS, Guide, Lesson,
    getProgress, completeLesson, getTodaysLesson, getLessonsByGuide, getGuideById,
    getLevel, getUserContext, TeachingProgress, UserContext,
} from '../services/teachings.service';
import { StoryOverlay } from './StoryOverlay';

export function TeachingsSection() {
    const [progress, setProgress] = React.useState<TeachingProgress>(getProgress);
    const [selectedGuide, setSelectedGuide] = React.useState<string | null>(null);
    const [activeLesson, setActiveLesson] = React.useState<Lesson | null>(null);
    const [userContext, setUserContext] = React.useState<UserContext>({});
    const [selectedMaster, setSelectedMaster] = React.useState<string | null>(null);

    React.useEffect(() => {
        setUserContext(getUserContext());
    }, []);

    const level = getLevel(progress.xpTotal);
    const todaysLesson = getTodaysLesson(progress);
    const todaysGuide = getGuideById(todaysLesson.guideId);

    // Build streak calendar
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // 0=Mon

    const handleOpenStory = (lesson: Lesson) => {
        setActiveLesson(lesson);
    };

    const handleCompleteStory = (xpEarned: number) => {
        if (!activeLesson) return;
        const updated = completeLesson(activeLesson.id, xpEarned);
        setProgress(updated);
        setActiveLesson(null);
    };

    const handleSelectGuide = (guideId: string) => {
        setSelectedGuide(selectedGuide === guideId ? null : guideId);
    };

    // Filter lessons by selected guide
    const filteredLessons = selectedGuide
        ? getLessonsByGuide(selectedGuide)
        : LESSONS;

    // First uncompleted lesson for Continue Learning
    const continueLesson = LESSONS.find(l =>
        !progress.completedLessons.includes(l.id) && l.id !== todaysLesson.id
    );
    const continueGuide = continueLesson ? getGuideById(continueLesson.guideId) : null;

    // Mastery domains
    const masteryDomains = [
        { key: 'Tarot', color: '#d4af37' },
        { key: 'Astrology', color: '#8b5cf6' },
        { key: 'Numerology', color: '#06b6d4' },
        { key: 'Moon', color: '#f97316' },
    ];

    // Descriptions for hero card
    const heroDescriptions: Record<string, string> = {
        'moon-card-hidden-truths': 'Discover what the Moon reveals about your subconscious fears, illusions, and intuition.',
        'major-minor-arcana': 'The architecture behind every tarot reading — and what the ratio tells you.',
        'fools-journey': 'The 22 Major Arcana as one epic story of your soul\'s evolution from innocence to wholeness.',
        'court-cards-decoded': 'Pages, Knights, Queens, Kings — the personality archetypes most readers skip.',
        'reading-reversals': 'Reversed cards aren\'t bad — they\'re the energy whispering instead of shouting.',
        'three-card-foundation': 'The simplest spread that gives the most powerful readings. No experience needed.',
        'scary-cards-arent-scary': 'Death, The Tower, The Devil — why the scariest cards are the biggest gifts.',
        'houses-of-zodiac': 'Your cosmic blueprint has rooms — each governs a different part of your life.',
        'your-rising-sign': 'Your Rising sign isn\'t just your appearance — it\'s your soul\'s strategy.',
        'life-path-numbers': 'The single most important number in your numerology chart.',
        'master-numbers': 'The most powerful — and most challenging — numbers in numerology.',
        'destiny-number': 'Your name is a numerical code — decode it to reveal how you\'ll express your purpose.',
        'new-moon-rituals': 'The most powerful time to plant new intentions.',
        'two-part-formula': 'The real equation behind manifestation — no fluff, no magic, just mechanics.',
        'scripting-your-future': 'Write as your future self — and trick your brain into making it real.',
        'power-of-letting-go': 'The counterintuitive step that separates wishful thinking from true manifestation.',
        'gratitude-frequency': 'How thankfulness becomes the fastest frequency upgrade you can make.',
        'shadow-work-clearing': 'The hidden beliefs running your life — and how to dissolve them.',
        'emotional-alchemy': 'Neville Goddard\'s core teaching: feeling is the secret.',
        'neuroscience-of-manifesting': 'Stanford neuroscience reveals: it\'s not magic — it\'s neural rewiring.',
        'the-369-method': 'The viral manifestation technique — and why repetition literally rewires your brain.',
        'affirmations-that-rewire': 'Why most affirmations fail — and the neuroscience of ones that actually work.',
    };

    return (
        <>
            <div className="space-y-4 animate-fade-up" style={{ opacity: 0 }}>

                {/* ── YOUR GUIDES (matches prototype exactly) ── */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Cinzel', serif", letterSpacing: 3, textTransform: 'uppercase' }}>
                            Your Guides
                        </p>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, cursor: 'pointer' }}>
                            ALL GUIDES →
                        </span>
                    </div>
                    <div style={{
                        display: 'flex', gap: 14, overflowX: 'auto',
                        paddingBottom: 8, WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                    }}>
                        {GUIDES.map(guide => {
                            const isActive = selectedGuide === guide.id;
                            const guideLessons = getLessonsByGuide(guide.id);
                            const completed = guideLessons.filter(l => progress.completedLessons.includes(l.id)).length;
                            return (
                                <button key={guide.id}
                                    onClick={() => handleSelectGuide(guide.id)}
                                    style={{
                                        minWidth: 180, padding: '20px 14px 16px',
                                        borderRadius: 20, flexShrink: 0,
                                        textAlign: 'center', cursor: 'pointer',
                                        transition: 'all 0.35s ease',
                                        border: isActive
                                            ? '1px solid rgba(197,147,65,0.35)'
                                            : '1px solid rgba(255,255,255,0.07)',
                                        background: isActive
                                            ? 'linear-gradient(160deg, #241848, #1a1040)'
                                            : 'linear-gradient(160deg, #1c1538, #130f2e)',
                                        boxShadow: isActive
                                            ? '0 0 20px rgba(197,147,65,0.1), 0 8px 28px rgba(0,0,0,0.4)'
                                            : 'none',
                                    }}>
                                    {/* Avatar ring — 60px with 3px padding, gold gradient when active */}
                                    <div style={{
                                        width: 60, height: 60, margin: '0 auto 10px',
                                        borderRadius: '50%', padding: 3, position: 'relative',
                                        background: isActive
                                            ? 'linear-gradient(135deg, #d4af37, #b8860b)'
                                            : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                                        boxShadow: isActive ? '0 0 14px rgba(197,147,65,0.3)' : 'none',
                                    }}>
                                        <div style={{
                                            width: '100%', height: '100%', borderRadius: '50%',
                                            backgroundImage: `url(${guide.image})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                        }} />
                                        {/* Live indicator — green pulsing dot */}
                                        {isActive && (
                                            <div style={{
                                                position: 'absolute', bottom: 1, right: 1,
                                                width: 12, height: 12, borderRadius: '50%',
                                                background: '#22c55e', border: '2px solid #130f2e',
                                                animation: 'live-pulse 2s ease-in-out infinite',
                                            }} />
                                        )}
                                    </div>
                                    {/* Name */}
                                    <p style={{
                                        fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600,
                                        color: isActive ? '#d4af37' : 'rgba(212,175,55,0.8)',
                                        marginBottom: 2, letterSpacing: 0.5,
                                    }}>
                                        {guide.name}
                                    </p>
                                    {/* Domain */}
                                    <p style={{
                                        fontSize: 10, color: 'rgba(255,255,255,0.35)',
                                        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
                                    }}>
                                        {guide.domain}
                                    </p>
                                    {/* Lesson count */}
                                    <p style={{
                                        fontSize: 9, color: 'rgba(255,255,255,0.2)',
                                        letterSpacing: 0.5, marginBottom: 8,
                                    }}>
                                        {guideLessons.length} teachings
                                    </p>
                                    {/* Tagline quote */}
                                    <p style={{
                                        fontSize: 10,
                                        color: isActive ? 'rgba(212,175,55,0.8)' : 'rgba(197,147,65,0.5)',
                                        fontStyle: 'italic', lineHeight: 1.4,
                                    }}>
                                        {guide.tagline}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── TODAY'S TEACHING (Hero Card — matches prototype) ── */}
                <div>
                    <p style={{
                        fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Cinzel', serif",
                        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12,
                    }}>
                        {selectedGuide ? `${getGuideById(selectedGuide)?.name}'s Teachings` : "Today's Teaching"}
                    </p>
                    {(selectedGuide ? filteredLessons : [todaysLesson]).map(lesson => {
                        const guide = getGuideById(lesson.guideId);
                        const isCompleted = progress.completedLessons.includes(lesson.id);
                        return (
                            <div key={lesson.id}
                                onClick={() => handleOpenStory(lesson)}
                                style={{
                                    borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    position: 'relative', marginBottom: 12,
                                    background: 'linear-gradient(160deg, rgba(28,21,56,0.95), rgba(19,15,46,0.98))',
                                    border: isCompleted
                                        ? '1px solid rgba(34,197,94,0.25)'
                                        : '1px solid rgba(99,102,241,0.2)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                }}>
                                <div style={{ padding: '24px 20px' }}>
                                    {/* Guide badge */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        justifyContent: 'center', marginBottom: 16,
                                    }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            backgroundImage: `url(${guide?.image})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: '2px solid rgba(212,175,55,0.2)',
                                        }} />
                                        <span style={{
                                            fontSize: 12, color: 'rgba(255,255,255,0.5)',
                                            fontFamily: "'Cinzel', serif", letterSpacing: 0.5,
                                        }}>
                                            {guide?.name}
                                        </span>
                                        {isCompleted && (
                                            <span style={{
                                                fontSize: 9, padding: '2px 8px', borderRadius: 12,
                                                background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                                                border: '1px solid rgba(34,197,94,0.2)',
                                            }}>
                                                ✓ Done
                                            </span>
                                        )}
                                    </div>
                                    {/* Emoji + title */}
                                    <div style={{ textAlign: 'center', marginBottom: 14 }}>
                                        <span style={{
                                            fontSize: 52, display: 'block', marginBottom: 14,
                                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                                        }}>
                                            {lesson.emoji}
                                        </span>
                                        <h3 style={{
                                            fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700,
                                            color: 'rgba(212,175,55,0.9)', letterSpacing: 1,
                                            lineHeight: 1.3, marginBottom: 10,
                                        }}>
                                            {lesson.title}
                                        </h3>
                                        {/* Description — from prototype */}
                                        <p style={{
                                            fontSize: 13, color: 'rgba(255,255,255,0.45)',
                                            lineHeight: 1.5, maxWidth: 300, margin: '0 auto',
                                        }}>
                                            {heroDescriptions[lesson.id] || ''}
                                        </p>
                                    </div>
                                    {/* Meta pills */}
                                    <div style={{
                                        display: 'flex', gap: 8, justifyContent: 'center',
                                        marginBottom: 18, flexWrap: 'wrap',
                                    }}>
                                        {[`${lesson.cards.length} cards`, '3 min'].map((label, i) => (
                                            <span key={i} style={{
                                                padding: '5px 14px', borderRadius: 14,
                                                fontSize: 10, fontFamily: "'Cinzel', serif",
                                                letterSpacing: 1.5, textTransform: 'uppercase',
                                                background: i === 2 ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.04)',
                                                border: i === 2 ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(255,255,255,0.08)',
                                                color: i === 2 ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.45)',
                                            }}>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                    {/* CTA button — matches gold gradient style */}
                                    <button style={{
                                        width: '100%', padding: '14px 32px',
                                        borderRadius: 22, cursor: 'pointer',
                                        background: 'linear-gradient(180deg, #F9E491, #D4A94E 40%, #C59341)',
                                        border: '1.5px solid rgba(249,228,145,0.6)',
                                        boxShadow: '0 2px 0 #8a6b25, 0 4px 14px rgba(0,0,0,0.45), 0 0 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                                        color: '#1a0f2e', fontFamily: "'Cinzel', serif",
                                        fontSize: 13, fontWeight: 700, letterSpacing: 3,
                                        textTransform: 'uppercase',
                                        transition: 'all 0.3s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}>
                                        {/* Shimmer sweep */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            width: '200%',
                                            background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                                            animation: 'shimmer-sweep 3.5s ease-in-out infinite',
                                            pointerEvents: 'none',
                                        }} />
                                        <span style={{ position: 'relative', zIndex: 1 }}>
                                            <span style={{ marginRight: 8 }}>▶</span>
                                            {isCompleted ? 'Review Teaching' : 'Begin Teaching'}
                                        </span>
                                    </button>
                                    {/* Progress dots — from prototype */}
                                    <div style={{
                                        display: 'flex', gap: 6, justifyContent: 'center',
                                        marginTop: 14,
                                    }}>
                                        {lesson.cards.map((_, i) => (
                                            <span key={i} style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.2)',
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── YOUR JOURNEY (Mastery Rings — matches prototype) ── */}
                <div>
                    <p style={{
                        fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Cinzel', serif",
                        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12,
                    }}>
                        Your Journey
                    </p>
                    <div style={{
                        display: 'flex', gap: 12, justifyContent: 'center',
                    }}>
                        {masteryDomains.map(d => {
                            const pct = progress.masteryScores[d.key] || 0;
                            const radius = 34;
                            const circumference = 2 * Math.PI * radius;
                            const offset = circumference - (pct / 100) * circumference;
                            return (
                                <div key={d.key} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                    padding: '16px 12px', borderRadius: 18,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    flex: 1,
                                }}>
                                    <div style={{ position: 'relative', width: 64, height: 64 }}>
                                        <svg viewBox="0 0 80 80" width="64" height="64">
                                            <circle cx="40" cy="40" r={radius} fill="none"
                                                stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                                            <circle cx="40" cy="40" r={radius} fill="none"
                                                stroke={d.color} strokeWidth="5"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={offset}
                                                strokeLinecap="round"
                                                transform="rotate(-90 40 40)"
                                                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                                        </svg>
                                        <span style={{
                                            position: 'absolute', inset: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
                                            color: '#fff',
                                        }}>
                                            {pct}%
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
                                        {d.key}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── CONTINUE LEARNING (matches prototype) ── */}
                {continueLesson && continueGuide && (
                    <div>
                        <p style={{
                            fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Cinzel', serif",
                            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            Continue Learning
                        </p>
                        <div
                            onClick={() => handleOpenStory(continueLesson)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '18px 20px', borderRadius: 18,
                                background: 'linear-gradient(160deg, #1c1538, #130f2e)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                cursor: 'pointer', transition: 'all 0.3s',
                            }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                backgroundImage: `url(${continueGuide.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                            }} />
                            <div style={{ flex: 1 }}>
                                <p style={{
                                    fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 600,
                                    color: 'rgba(212,175,55,0.9)', marginBottom: 4,
                                }}>
                                    {continueLesson.title}
                                </p>
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                                    {continueLesson.cards.length} cards remaining
                                </p>
                                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 2, background: '#d4af37',
                                        width: '0%', transition: 'width 0.5s',
                                    }} />
                                </div>
                            </div>
                            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>→</span>
                        </div>
                    </div>
                )}


                {/* ── LEARNING PATHS (matches prototype) ── */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{
                            fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Cinzel', serif",
                            letterSpacing: 3, textTransform: 'uppercase',
                        }}>
                            Learning Paths
                        </p>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, cursor: 'pointer' }}>
                            VIEW ALL →
                        </span>
                    </div>
                    <div style={{
                        display: 'flex', gap: 14, overflowX: 'auto',
                        paddingBottom: 8, WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                    }}>
                        {GUIDES.map(guide => {
                            const lessons = getLessonsByGuide(guide.id);
                            const completed = lessons.filter(l => progress.completedLessons.includes(l.id)).length;
                            const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
                            // Path names matching prototype
                            const pathNames: Record<string, string> = {
                                'mystic-ra': 'Astrology 101',
                                'luna-tides': 'Moon Rituals',
                                'earth-song': 'Manifestation',
                                'sol-wisdom': 'Numerology',
                                'veda-light': 'Tarot Foundations',
                            };
                            return (
                                <div key={guide.id}
                                    onClick={() => handleSelectGuide(guide.id)}
                                    style={{
                                        minWidth: 200, padding: '20px 16px', borderRadius: 20,
                                        background: 'linear-gradient(160deg, #1c1538, #130f2e)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        flexShrink: 0, cursor: 'pointer',
                                        transition: 'all 0.3s',
                                    }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        backgroundImage: `url(${guide.image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        marginBottom: 12,
                                    }} />
                                    <p style={{
                                        fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600,
                                        color: 'rgba(212,175,55,0.9)', marginBottom: 4, lineHeight: 1.3,
                                    }}>
                                        {pathNames[guide.id] || guide.domain}
                                    </p>
                                    <p style={{
                                        fontSize: 10, color: 'rgba(255,255,255,0.35)',
                                        marginBottom: 12, letterSpacing: 0.5,
                                    }}>
                                        {lessons.length} lessons
                                    </p>
                                    {/* Progress bar */}
                                    <div style={{
                                        height: 4, borderRadius: 2,
                                        background: 'rgba(255,255,255,0.08)',
                                        marginBottom: 6,
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 2,
                                            width: `${pct}%`,
                                            background: '#d4af37',
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                                        {completed === 0 ? 'Not started' : `${completed} of ${lessons.length} complete`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>


                {/* Context-aware note */}
                {userContext.activeIntention && (
                    <div style={{
                        borderRadius: 18, padding: '14px 16px',
                        background: 'rgba(212,175,55,0.04)',
                        border: '1px solid rgba(212,175,55,0.1)',
                    }}>
                        <p style={{
                            fontSize: 9, color: 'rgba(212,175,55,0.4)', fontFamily: "'Cinzel', serif",
                            letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
                        }}>
                            ✦ Your Active Intention
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(212,175,55,0.6)', fontStyle: 'italic' }}>
                            "{userContext.activeIntention}"
                        </p>
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                            Teachings will connect to this intention.
                        </p>
                    </div>
                )}

                <div style={{ height: 16 }} />
            </div>

            {/* ── STORY OVERLAY ── */}
            {activeLesson && (
                <StoryOverlay
                    lesson={activeLesson}
                    userContext={userContext}
                    onComplete={handleCompleteStory}
                    onClose={() => setActiveLesson(null)}
                />
            )}

            {/* Inline animations matching prototype */}
            <style>{`
                @keyframes live-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.85); }
                }
            `}</style>
        </>
    );
}
