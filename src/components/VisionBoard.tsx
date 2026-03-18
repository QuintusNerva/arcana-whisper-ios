/**
 * VisionBoard — Sacred Vision Board
 * Luxury Bento-style Masonry Grid with varying tile aspect ratios.
 * Glassmorphism 2.0 + deep purple gradients + top-right internal glow.
 */

import React from 'react';
import { safeStorage } from '../services/storage.service';

/* ── Types ── */
export interface VisionBoardItem {
    id: string;
    type: 'image' | 'text' | 'goal';
    content: string; // base64 data URL for image, text for affirmation/goal
    category?: 'love' | 'abundance' | 'career' | 'health' | 'spirit';
    createdAt: number;
    deadline?: string; // ISO date string for goals
}

const STORAGE_KEY = 'arcana_vision_board';

const CATEGORIES: {
    id: VisionBoardItem['category'];
    label: string;
    emoji: string;
    pillBg: string;
    pillText: string;
}[] = [
    { id: 'love',      label: 'Love',      emoji: '💕', pillBg: '#E8458B', pillText: '#fff' },
    { id: 'abundance',  label: 'Abundance', emoji: '💰', pillBg: '#D4A94E', pillText: '#000' },
    { id: 'career',     label: 'Career',    emoji: '🏆', pillBg: '#7C5CFC', pillText: '#fff' },
    { id: 'health',     label: 'Health',    emoji: '🌿', pillBg: '#22C583', pillText: '#000' },
    { id: 'spirit',     label: 'Spirit',    emoji: '✨', pillBg: '#A855F7', pillText: '#fff' },
];

function getCategoryMeta(id?: string) {
    return CATEGORIES.find(c => c.id === id);
}

/* ── Storage helpers ── */
export function getVisionBoardItems(): VisionBoardItem[] {
    try {
        const data = safeStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function saveVisionBoardItems(items: VisionBoardItem[]) {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/* ── Add Item Modal ── */
function AddItemModal({ onAdd, onClose }: {
    onAdd: (item: Omit<VisionBoardItem, 'id' | 'createdAt'>) => void;
    onClose: () => void;
}) {
    const [mode, setMode] = React.useState<'choose' | 'text' | 'goal' | 'image'>('choose');
    const [text, setText] = React.useState('');
    const [category, setCategory] = React.useState<VisionBoardItem['category']>(undefined);
    const [deadline, setDeadline] = React.useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 600;
                let w = img.width, h = img.height;
                if (w > h) { h = (h / w) * maxSize; w = maxSize; }
                else { w = (w / h) * maxSize; h = maxSize; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                onAdd({ type: 'image', content: compressed, category });
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitText = () => {
        if (!text.trim()) return;
        onAdd({ type: mode === 'goal' ? 'goal' : 'text', content: text.trim(), category, deadline: deadline || undefined });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: '380px',
                borderRadius: '24px',
                background: 'linear-gradient(145deg, #1a1625 0%, #0a0a0c 100%)',
                border: '1px solid rgba(212,175,55,0.12)',
                padding: '24px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}>
                {mode === 'choose' ? (
                    <>
                        <p style={{
                            fontFamily: "'Inter', sans-serif", fontSize: '11px',
                            letterSpacing: '0.2em', textTransform: 'uppercase' as const,
                            color: '#d4af37', textAlign: 'center', marginBottom: '22px',
                            fontWeight: 600,
                        }}>Add to Vision Board</p>

                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                            <button onClick={() => fileInputRef.current?.click()} style={{
                                padding: '16px', borderRadius: '16px',
                                background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)',
                                color: 'rgba(226,232,240,0.85)', fontSize: '14px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                                transition: 'all 0.2s',
                            }}>
                                <span style={{ fontSize: '22px' }}>📸</span>
                                <div style={{ textAlign: 'left' as const }}>
                                    <p style={{ fontWeight: 600, marginBottom: '2px' }}>Upload a Photo</p>
                                    <p style={{ fontSize: '11px', color: 'rgba(196,196,220,0.5)' }}>From your camera roll</p>
                                </div>
                            </button>

                            <button onClick={() => setMode('text')} style={{
                                padding: '16px', borderRadius: '16px',
                                background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)',
                                color: 'rgba(226,232,240,0.85)', fontSize: '14px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                                transition: 'all 0.2s',
                            }}>
                                <span style={{ fontSize: '22px' }}>✍️</span>
                                <div style={{ textAlign: 'left' as const }}>
                                    <p style={{ fontWeight: 600, marginBottom: '2px' }}>Write an Affirmation</p>
                                    <p style={{ fontSize: '11px', color: 'rgba(196,196,220,0.5)' }}>Declare what you're calling in</p>
                                </div>
                            </button>

                            <button onClick={() => setMode('goal')} style={{
                                padding: '16px', borderRadius: '16px',
                                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)',
                                color: 'rgba(226,232,240,0.85)', fontSize: '14px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                                transition: 'all 0.2s',
                            }}>
                                <span style={{ fontSize: '22px' }}>🎯</span>
                                <div style={{ textAlign: 'left' as const }}>
                                    <p style={{ fontWeight: 600, marginBottom: '2px' }}>Set a Goal</p>
                                    <p style={{ fontSize: '11px', color: 'rgba(196,196,220,0.5)' }}>With an optional deadline</p>
                                </div>
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                    </>
                ) : (
                    <>
                        <p style={{
                            fontFamily: "'Inter', sans-serif", fontSize: '11px',
                            letterSpacing: '0.2em', textTransform: 'uppercase' as const,
                            color: '#d4af37', textAlign: 'center', marginBottom: '16px',
                            fontWeight: 600,
                        }}>{mode === 'goal' ? '🎯 Set a Goal' : '✍️ Affirmation'}</p>

                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder={mode === 'goal'
                                ? 'What are you manifesting? e.g. "Launch my business by June"'
                                : 'Speak your truth... e.g. "I am worthy of abundant love"'}
                            style={{
                                width: '100%', minHeight: '100px', padding: '14px',
                                borderRadius: '14px', border: '1px solid rgba(212,175,55,0.12)',
                                background: 'rgba(255,255,255,0.03)',
                                color: 'rgba(226,232,240,0.9)', fontSize: '14px',
                                fontStyle: 'italic', lineHeight: 1.6,
                                resize: 'vertical', outline: 'none',
                                fontFamily: "'Playfair Display', serif",
                            }}
                            autoFocus
                        />

                        {mode === 'goal' && (
                            <div style={{ marginTop: '12px' }}>
                                <p style={{ fontSize: '10px', color: 'rgba(196,196,220,0.5)', marginBottom: '6px', letterSpacing: '0.15em' }}>
                                    TARGET DATE (optional)
                                </p>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 14px',
                                        borderRadius: '12px', border: '1px solid rgba(212,175,55,0.12)',
                                        background: 'rgba(255,255,255,0.03)',
                                        color: 'rgba(226,232,240,0.8)', fontSize: '13px',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        )}

                        {/* Category selector */}
                        <div style={{ marginTop: '14px' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(196,196,220,0.5)', marginBottom: '8px', letterSpacing: '0.15em' }}>
                                CATEGORY
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setCategory(category === c.id ? undefined : c.id)}
                                        style={{
                                            padding: '6px 14px', borderRadius: '20px',
                                            fontSize: '11px', cursor: 'pointer',
                                            background: category === c.id ? c.pillBg : 'rgba(255,255,255,0.04)',
                                            border: category === c.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                            color: category === c.id ? c.pillText : 'rgba(196,196,220,0.55)',
                                            fontWeight: category === c.id ? 700 : 400,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {c.emoji} {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                            <button onClick={() => setMode('choose')} style={{
                                flex: 1, padding: '12px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(196,196,220,0.6)', fontSize: '13px', cursor: 'pointer',
                            }}>Back</button>
                            <button onClick={handleSubmitText} style={{
                                flex: 1, padding: '12px', borderRadius: '14px',
                                background: text.trim() ? 'linear-gradient(135deg, #f3d077, #8a6e2f)' : 'rgba(212,175,55,0.1)',
                                border: 'none',
                                color: text.trim() ? '#000' : 'rgba(212,175,55,0.4)',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                opacity: text.trim() ? 1 : 0.5,
                                transition: 'all 0.2s',
                            }}>Add ✨</button>
                        </div>
                    </>
                )}

                <button onClick={onClose} style={{
                    marginTop: '12px', width: '100%', padding: '10px',
                    background: 'transparent', border: 'none',
                    color: 'rgba(196,196,220,0.35)', fontSize: '12px', cursor: 'pointer',
                }}>Cancel</button>
            </div>
        </div>
    );
}

/* ── Delete Confirmation ── */
function DeleteConfirm({ onDelete, onCancel }: { onDelete: () => void; onCancel: () => void }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 110,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px',
        }} onClick={onCancel}>
            <div onClick={e => e.stopPropagation()} style={{
                padding: '24px', borderRadius: '20px',
                background: 'linear-gradient(145deg, #1a1625, #0a0a0c)',
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center' as const, maxWidth: '300px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
                <p style={{ color: 'rgba(226,232,240,0.85)', fontSize: '14px', marginBottom: '4px', fontWeight: 600 }}>
                    Remove this vision?
                </p>
                <p style={{ color: 'rgba(196,196,220,0.5)', fontSize: '11px', marginBottom: '18px' }}>
                    It will be permanently deleted
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '10px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(196,196,220,0.6)', fontSize: '13px', cursor: 'pointer',
                    }}>Keep</button>
                    <button onClick={onDelete} style={{
                        flex: 1, padding: '10px', borderRadius: '12px',
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}>Remove</button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main VisionBoard Component — Bento Masonry
   ───────────────────────────────────────────── */
interface VisionBoardProps {
    onClose: () => void;
}

export function VisionBoard({ onClose }: VisionBoardProps) {
    const [items, setItems] = React.useState<VisionBoardItem[]>(() => getVisionBoardItems());
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
    const [filterCategory, setFilterCategory] = React.useState<string | null>(null);

    const handleAdd = (data: Omit<VisionBoardItem, 'id' | 'createdAt'>) => {
        const newItem: VisionBoardItem = {
            ...data,
            id: `vb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            createdAt: Date.now(),
        };
        const updated = [newItem, ...items];
        setItems(updated);
        saveVisionBoardItems(updated);
        setShowAddModal(false);
    };

    const handleDelete = (id: string) => {
        const updated = items.filter(i => i.id !== id);
        setItems(updated);
        saveVisionBoardItems(updated);
        setDeleteTarget(null);
    };

    const filteredItems = filterCategory
        ? items.filter(i => i.category === filterCategory)
        : items;

    /* ── Masonry distribution with varying heights ── */
    const col1: VisionBoardItem[] = [];
    const col2: VisionBoardItem[] = [];
    filteredItems.forEach((item, i) => {
        if (i % 2 === 0) col1.push(item);
        else col2.push(item);
    });

    /* Assign aspect ratios for bento variety */
    const getAspectRatio = (item: VisionBoardItem, index: number): string => {
        if (item.type === 'image') return 'auto'; // images use natural aspect
        // Alternate between tall (portrait) and square tiles
        const patterns = ['4/5', '1/1', '3/4', '5/6', '4/3'];
        return patterns[index % patterns.length];
    };

    /* ── Render a single tile ── */
    const renderTile = (item: VisionBoardItem, tileIndex: number) => {
        const catMeta = getCategoryMeta(item.category);
        const aspect = getAspectRatio(item, tileIndex);

        return (
            <div
                key={item.id}
                style={{ marginBottom: '14px', position: 'relative' as const }}
                onClick={() => setDeleteTarget(item.id)}
            >
                {item.type === 'image' ? (
                    /* ═══ IMAGE TILE — Full-bleed with overlay tag ═══ */
                    <div style={{
                        borderRadius: '22px',
                        overflow: 'hidden',
                        position: 'relative' as const,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        cursor: 'pointer',
                    }}>
                        <img
                            src={item.content}
                            alt="Vision"
                            style={{
                                width: '100%',
                                display: 'block',
                                objectFit: 'cover' as const,
                            }}
                        />
                        {/* Dark gradient overlay at bottom for tag readability */}
                        {catMeta && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0, left: 0, right: 0,
                                height: '60px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                                borderRadius: '0 0 22px 22px',
                                display: 'flex',
                                alignItems: 'flex-end',
                                padding: '0 14px 12px',
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 14px',
                                    borderRadius: '20px',
                                    background: catMeta.pillBg,
                                    color: catMeta.pillText,
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase' as const,
                                    letterSpacing: '1.5px',
                                    boxShadow: `0 2px 10px ${catMeta.pillBg}66`,
                                }}>
                                    {catMeta.label}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ═══ TEXT / GOAL TILE — Deep purple gradient + illuminated border corner ═══ */
                    <div style={{
                        borderRadius: '22px',
                        /* Gradient border — bright gold at top-right, fading elsewhere */
                        background: 'conic-gradient(from 225deg at 100% 0%, rgba(212,175,55,0.50) 0deg, rgba(212,175,55,0.25) 45deg, rgba(255,255,255,0.06) 120deg, rgba(255,255,255,0.03) 200deg, rgba(255,255,255,0.06) 300deg, rgba(212,175,55,0.35) 360deg)',
                        padding: '1px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}>
                    <div style={{
                        borderRadius: '21px',
                        overflow: 'hidden',
                        position: 'relative' as const,
                        /* Light emanates FROM the corner — single gradient anchored at the vertex */
                        background: `
                            radial-gradient(circle at 100% 0%, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 25%, transparent 55%),
                            linear-gradient(145deg, #1a1625 0%, #0a0a0c 100%)
                        `,
                        cursor: 'pointer',
                        aspectRatio: aspect,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        justifyContent: 'flex-end' as const,
                    }}>

                        {/* Content area */}
                        <div style={{
                            padding: '22px 18px',
                            position: 'relative' as const,
                            zIndex: 1,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column' as const,
                            justifyContent: 'flex-end' as const,
                        }}>
                            {item.type === 'goal' && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    marginBottom: '8px',
                                }}>
                                    <span style={{ fontSize: '13px' }}>🎯</span>
                                    <span style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: '9px', letterSpacing: '0.2em',
                                        textTransform: 'uppercase' as const,
                                        color: 'rgba(212,175,55,0.55)',
                                        fontWeight: 600,
                                    }}>Goal</span>
                                </div>
                            )}

                            {/* ── The Quote / Text — Playfair Display Serif ── */}
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: item.content.length > 60 ? '14px' : '16px',
                                color: '#d4af37', /* Antique Gold */
                                fontStyle: 'italic',
                                fontWeight: 500,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.65,
                            }}>
                                "{item.content}"
                            </p>

                            {item.deadline && (
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '10px', color: 'rgba(212,175,55,0.3)',
                                    marginTop: '10px', fontStyle: 'italic',
                                }}>
                                    🗓 {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            )}

                            {/* ── Category Tag Pill ── */}
                            {catMeta && (
                                <div style={{ marginTop: '14px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '5px 16px',
                                        borderRadius: '20px',
                                        background: catMeta.pillBg,
                                        color: catMeta.pillText,
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase' as const,
                                        letterSpacing: '1.5px',
                                        boxShadow: `0 2px 12px ${catMeta.pillBg}55`,
                                    }}>
                                        {catMeta.label}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'linear-gradient(180deg, #0d0b22 0%, #0a0812 40%, #080610 100%)',
            display: 'flex', flexDirection: 'column' as const,
        }}>
            {/* ── Header ── */}
            <div style={{
                padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
                display: 'flex', alignItems: 'center',
                background: 'rgba(10,8,18,0.92)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(212,175,55,0.06)',
                flexShrink: 0,
            }}>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(196,196,220,0.5)', fontSize: '13px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    width: '60px', textAlign: 'left' as const,
                }}>← Back</button>
                <h2 style={{
                    flex: 1, textAlign: 'center' as const,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase' as const,
                    color: '#d4af37',
                }}>Vision Board</h2>
                <div style={{ width: '60px' }} />
            </div>

            {/* ── Category filter pills ── */}
            <div style={{
                padding: '14px 20px', display: 'flex', gap: '8px',
                overflowX: 'auto' as const, flexShrink: 0,
                msOverflowStyle: 'none',
                scrollbarWidth: 'none' as const,
            }}>
                <button
                    onClick={() => setFilterCategory(null)}
                    style={{
                        padding: '6px 18px', borderRadius: '20px', fontSize: '11px',
                        whiteSpace: 'nowrap' as const, cursor: 'pointer',
                        fontWeight: !filterCategory ? 700 : 500,
                        background: !filterCategory
                            ? 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))'
                            : 'rgba(255,255,255,0.03)',
                        border: !filterCategory
                            ? '1px solid rgba(212,175,55,0.25)'
                            : '1px solid rgba(255,255,255,0.06)',
                        color: !filterCategory ? '#d4af37' : 'rgba(196,196,220,0.45)',
                        transition: 'all 0.2s',
                    }}
                >All</button>
                {CATEGORIES.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setFilterCategory(filterCategory === c.id ? null : c.id!)}
                        style={{
                            padding: '6px 18px', borderRadius: '20px', fontSize: '11px',
                            whiteSpace: 'nowrap' as const, cursor: 'pointer',
                            fontWeight: filterCategory === c.id ? 700 : 500,
                            background: filterCategory === c.id ? c.pillBg : 'rgba(255,255,255,0.03)',
                            border: filterCategory === c.id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            color: filterCategory === c.id ? c.pillText : 'rgba(196,196,220,0.45)',
                            boxShadow: filterCategory === c.id ? `0 2px 12px ${c.pillBg}44` : 'none',
                            transition: 'all 0.2s',
                        }}
                    >{c.emoji} {c.label}</button>
                ))}
            </div>

            {/* ── Masonry Grid ── */}
            <div style={{
                flex: 1, overflowY: 'auto' as const,
                padding: '4px 16px 120px',
            }}>
                {filteredItems.length === 0 ? (
                    /* Empty state */
                    <div style={{
                        textAlign: 'center' as const,
                        padding: '70px 30px',
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)',
                            border: '1.5px solid rgba(212,175,55,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '30px', margin: '0 auto 22px',
                        }}>✧</div>
                        <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '12px', letterSpacing: '0.2em',
                            textTransform: 'uppercase' as const,
                            color: '#d4af37', marginBottom: '8px',
                            fontWeight: 600,
                        }}>Start Your Vision Board</p>
                        <p style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '14px', color: 'rgba(212,175,55,0.40)',
                            lineHeight: 1.7, maxWidth: '260px', margin: '0 auto 28px',
                            fontStyle: 'italic',
                        }}>
                            Collect images, write affirmations, and set goals.
                            See your future before it arrives.
                        </p>
                        <button onClick={() => setShowAddModal(true)} style={{
                            padding: '14px 32px', borderRadius: '24px',
                            background: 'linear-gradient(135deg, #f3d077, #8a6e2f)',
                            border: 'none',
                            color: '#000', fontSize: '12px', fontWeight: 700,
                            cursor: 'pointer',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase' as const,
                            boxShadow: '0 4px 20px rgba(212,175,55,0.25)',
                        }}>+ Add Your First Vision</button>
                    </div>
                ) : (
                    /* ═══ BENTO MASONRY — 2 column with offset ═══ */
                    <div style={{
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start' as const,
                    }}>
                        {/* Column 1 — starts flush */}
                        <div style={{ flex: 1 }}>
                            {col1.map((item, i) => renderTile(item, i * 2))}
                        </div>
                        {/* Column 2 — offset down for bento asymmetry */}
                        <div style={{ flex: 1, marginTop: '28px' }}>
                            {col2.map((item, i) => renderTile(item, i * 2 + 1))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Gold Gradient FAB ── */}
            {items.length > 0 && (
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        position: 'fixed',
                        bottom: '100px', right: '24px',
                        width: '58px', height: '58px', borderRadius: '50%',
                        background: 'linear-gradient(180deg, #f3d077 0%, #8a6e2f 100%)',
                        border: 'none',
                        boxShadow: '0 6px 24px rgba(212,175,55,0.30), 0 0 40px rgba(212,175,55,0.10)',
                        color: '#000',
                        fontSize: '28px',
                        fontWeight: 300,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        zIndex: 60,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                >+</button>
            )}

            {/* Modals */}
            {showAddModal && (
                <AddItemModal
                    onAdd={handleAdd}
                    onClose={() => setShowAddModal(false)}
                />
            )}
            {deleteTarget && (
                <DeleteConfirm
                    onDelete={() => handleDelete(deleteTarget)}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
