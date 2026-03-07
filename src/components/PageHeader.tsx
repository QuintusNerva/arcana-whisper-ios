import React from 'react';

interface PageHeaderProps {
    title?: string;
    onClose: () => void;
    titleSize?: 'sm' | 'md' | 'lg';
    rightContent?: React.ReactNode;
    centerContent?: React.ReactNode;
    children?: React.ReactNode;
}

export function PageHeader({ title, onClose, titleSize = 'md', rightContent, centerContent, children }: PageHeaderProps) {
    const sizeMap = {
        sm: 'text-sm tracking-[4px]',
        md: 'text-base tracking-[4px]',
        lg: 'text-lg tracking-[4px]'
    };

    return (
        <header className="sticky top-0 z-20 bg-altar-deep/90 backdrop-blur-xl border-b border-white/5 safe-top w-full">
            <div className="flex flex-col w-full max-w-[500px] mx-auto px-4 py-3">
                <div className="flex items-center justify-between w-full">
                    {/* Fixed width left area for Back button */}
                    <div className="w-16 flex justify-start">
                        <button
                            onClick={onClose}
                            className="text-altar-muted hover:text-white transition-colors text-sm font-display tracking-wide whitespace-nowrap"
                        >
                            ← Altar
                        </button>
                    </div>

                    {/* Centered Title or Content */}
                    <div className="flex-1 flex justify-center mx-2 truncate min-w-0">
                        {centerContent || (
                            <h1 className={`font-display text-altar-gold ${sizeMap[titleSize]} text-center truncate w-full`}>
                                {title}
                            </h1>
                        )}
                    </div>

                    {/* Fixed width right area for balance or extra actions */}
                    <div className="w-16 flex justify-end">
                        {rightContent}
                    </div>
                </div>
                {children && (
                    <div className="mt-3 w-full">
                        {children}
                    </div>
                )}
            </div>
        </header>
    );
}
