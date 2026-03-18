/**
 * JournalTab — Dream Journal only.
 * The general-purpose journal now lives on the Manifest page as the Manifest Journal.
 * This component is a thin pass-through to the DreamJournal component.
 */

import React from 'react';
import { DreamJournal } from './DreamJournal';
import { BottomNav } from './BottomNav';

interface JournalTabProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
}

export function JournalTab({ onClose, onTabChange, subscription, onShowPremium }: JournalTabProps) {
    return (
        <DreamJournal
            onClose={onClose}
            onTabChange={onTabChange}
            subscription={subscription}
            onShowPremium={onShowPremium}
        />
    );
}
