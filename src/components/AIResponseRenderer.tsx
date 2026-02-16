import React from 'react';

/**
 * AIResponseRenderer — Parses structured AI text into styled JSX.
 *
 * Supports:
 *   ## Section Headers  → gold-accented <h4>
 *   **bold terms**      → <strong> with gold tint
 *   - bullet items      → styled <li> with accent dots
 *   plain paragraphs    → spaced <p> with generous line-height
 *
 * Gracefully handles legacy plain-text responses (renders as a single paragraph).
 */

interface AIResponseRendererProps {
    text: string;
    className?: string;
    compact?: boolean; // smaller font for tight spaces (card backs, etc.)
}

export function AIResponseRenderer({ text, className = '', compact = false }: AIResponseRendererProps) {
    const blocks = parseBlocks(text);
    const baseFontClass = compact ? 'text-xs' : 'text-[13px]';

    return (
        <div className={`ai-response-text ${className}`.trim()}>
            {blocks.map((block, i) => {
                switch (block.type) {
                    case 'heading':
                        return (
                            <h4
                                key={i}
                                className={`font-display text-[10px] tracking-[2px] uppercase text-altar-gold/70 ${i > 0 ? 'mt-4' : ''} mb-2 flex items-center gap-1.5`}
                            >
                                <span className="text-altar-gold">✦</span>
                                {block.content}
                            </h4>
                        );
                    case 'bullets':
                        return (
                            <ul key={i} className="space-y-1.5 mb-3">
                                {block.items!.map((item, j) => (
                                    <li
                                        key={j}
                                        className={`${baseFontClass} leading-[1.7] flex gap-2`}
                                    >
                                        <span className="text-altar-gold/50 shrink-0 mt-[2px]">•</span>
                                        <span>{renderInline(item)}</span>
                                    </li>
                                ))}
                            </ul>
                        );
                    case 'paragraph':
                    default:
                        return (
                            <p
                                key={i}
                                className={`${baseFontClass} leading-[1.7] mb-3 last:mb-0`}
                            >
                                {renderInline(block.content)}
                            </p>
                        );
                }
            })}
        </div>
    );
}

// ── Block-level parsing ──

interface Block {
    type: 'heading' | 'paragraph' | 'bullets';
    content: string;
    items?: string[];
}

function parseBlocks(raw: string): Block[] {
    const lines = raw.split('\n');
    const blocks: Block[] = [];
    let bulletBuffer: string[] = [];

    const flushBullets = () => {
        if (bulletBuffer.length > 0) {
            blocks.push({ type: 'bullets', content: '', items: [...bulletBuffer] });
            bulletBuffer = [];
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            flushBullets();
            continue;
        }

        // ## Heading
        const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
            flushBullets();
            blocks.push({ type: 'heading', content: headingMatch[1].trim() });
            continue;
        }

        // - Bullet or * Bullet
        const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
        if (bulletMatch) {
            bulletBuffer.push(bulletMatch[1].trim());
            continue;
        }

        // Numbered list: 1. Item
        const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
        if (numberedMatch) {
            bulletBuffer.push(numberedMatch[1].trim());
            continue;
        }

        // Regular paragraph line
        flushBullets();
        // Merge consecutive paragraph lines
        if (blocks.length > 0 && blocks[blocks.length - 1].type === 'paragraph') {
            blocks[blocks.length - 1].content += ' ' + trimmed;
        } else {
            blocks.push({ type: 'paragraph', content: trimmed });
        }
    }

    flushBullets();
    return blocks;
}

// ── Inline parsing: **bold** → <strong> ──

function renderInline(text: string): React.ReactNode {
    // Split on **bold** patterns
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length === 1) return text;

    return (
        <>
            {parts.map((part, i) => {
                const boldMatch = part.match(/^\*\*(.+)\*\*$/);
                if (boldMatch) {
                    return (
                        <strong key={i} className="text-altar-gold/90 font-semibold">
                            {boldMatch[1]}
                        </strong>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </>
    );
}
