/**
 * Manifestation Service — CRUD and tracking for active manifestations.
 *
 * Manifestation is one side of the coin:
 * - Metaphysical tools = universe speaks TO you (what is)
 * - Manifestation = you speak TO the universe (what you're creating)
 *
 * Stored in localStorage. Fully private, user-deletable.
 */

import { safeStorage } from './storage.service';

const MANIFESTATION_KEY = 'arcana_manifestations';

// ── Interfaces ──

export interface ActionEntry {
    id: string;
    description: string;
    committedDate: string;    // ISO
    completedDate?: string;   // ISO, set when user checks it off
    reflection?: string;      // "How did it go?" / workspace text
    workspaceText?: string;   // What the user typed in the workspace (lists, brainstorms, drafts)
}

export type ManifestDomain = 'career' | 'love' | 'health' | 'wealth' | 'spiritual' | 'creative' | 'general';

export interface ManifestationEntry {
    id: string;
    declaration: string;      // "I am calling in..."
    createdDate: string;      // ISO
    status: 'active' | 'manifested' | 'released';
    linkedReadingIds: string[];   // Readings done while this was active
    actions: ActionEntry[];
    cosmicAlignment?: string;     // Transit note at time of creation
    mode: 'intention' | 'manifestation';  // Which mode was used

    // ── Active Manifest extensions (v2) ──
    domain?: ManifestDomain;          // AI-classified or user-selected intention domain
    signalStrength?: number;          // 0-100 — alignment density, not outcome progress
    witnessEventIds?: string[];       // IDs of linked WitnessEvents
}

export interface ManifestationProgress {
    id: string;
    declaration: string;
    daysActive: number;
    readingsLinked: number;
    actionsCompleted: number;
    actionsTotal: number;
}

// ── Internal helpers ──

function getManifestations(): ManifestationEntry[] {
    try {
        const raw = safeStorage.getItem(MANIFESTATION_KEY);
        if (raw) return JSON.parse(raw) as ManifestationEntry[];
    } catch { /* corrupt data */ }
    return [];
}

function saveManifestations(data: ManifestationEntry[]): void {
    safeStorage.setItem(MANIFESTATION_KEY, JSON.stringify(data));
}

function generateId(): string {
    return `manif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Public API ──

/**
 * Create a new manifestation/intention.
 */
export function createManifestation(
    declaration: string,
    mode: 'intention' | 'manifestation' = 'manifestation',
    cosmicAlignment?: string,
    domain?: ManifestDomain,
): ManifestationEntry {
    const entry: ManifestationEntry = {
        id: generateId(),
        declaration: declaration.trim(),
        createdDate: new Date().toISOString(),
        status: 'active',
        linkedReadingIds: [],
        actions: [],
        cosmicAlignment,
        mode,
        domain: domain || 'general',
        signalStrength: 0,
        witnessEventIds: [],
    };

    const all = getManifestations();
    all.unshift(entry);
    saveManifestations(all);
    return entry;
}

/**
 * Get all active manifestations (status === 'active').
 */
export function getActiveManifestations(): ManifestationEntry[] {
    return getManifestations().filter(m => m.status === 'active');
}

/**
 * Get all manifestations (active + completed + released).
 */
export function getAllManifestations(): ManifestationEntry[] {
    return getManifestations();
}

/**
 * Link a reading ID to the first active manifestation.
 * Call this after every reading is completed, if an active manifestation exists.
 */
export function linkReadingToActiveManifestations(readingId: string): void {
    const all = getManifestations();
    let changed = false;
    for (const m of all) {
        if (m.status === 'active' && !m.linkedReadingIds.includes(readingId)) {
            m.linkedReadingIds.push(readingId);
            changed = true;
        }
    }
    if (changed) saveManifestations(all);
}

/**
 * Commit to a specific action from a reading.
 * Returns the new ActionEntry.
 */
export function commitAction(
    manifestationId: string,
    actionDescription: string,
): ActionEntry | null {
    const all = getManifestations();
    const m = all.find(m => m.id === manifestationId);
    if (!m) return null;

    const action: ActionEntry = {
        id: generateId(),
        description: actionDescription,
        committedDate: new Date().toISOString(),
    };

    m.actions.push(action);
    saveManifestations(all);
    return action;
}

/**
 * Mark an action as completed with optional workspace text.
 * workspaceText is the full content of what the user typed (lists, brainstorms, reflections).
 */
export function completeAction(
    manifestationId: string,
    actionId: string,
    workspaceText?: string,
): void {
    const all = getManifestations();
    const m = all.find(m => m.id === manifestationId);
    if (!m) return;

    const action = m.actions.find(a => a.id === actionId);
    if (!action) return;

    action.completedDate = new Date().toISOString();
    if (workspaceText) {
        action.workspaceText = workspaceText;
        action.reflection = workspaceText; // backward compat
    }
    saveManifestations(all);
}

/**
 * Get the consecutive-day action streak for a manifestation.
 * Counts how many days in a row (ending today or yesterday) have at least one completed action.
 */
export function getActionStreak(manifestationId: string): number {
    const m = getManifestations().find(m => m.id === manifestationId);
    if (!m) return 0;

    // Get unique dates with completed actions (YYYY-MM-DD)
    const completedDates = new Set(
        m.actions
            .filter(a => !!a.completedDate)
            .map(a => a.completedDate!.slice(0, 10))
    );

    if (completedDates.size === 0) return 0;

    // Start from today and count backward
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);

    // If today has no completion, start from yesterday
    const todayStr = checkDate.toISOString().slice(0, 10);
    if (!completedDates.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Count consecutive days backward
    for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (completedDates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Get recent completed actions with their workspace text.
 * Used by the Forge to build multi-day coaching arcs.
 */
export interface CompletedActionSummary {
    description: string;
    workspaceText?: string;
    completedDate: string;
}

export function getRecentCompletedActionsWithWorkspace(manifestationId: string): CompletedActionSummary[] {
    const m = getManifestations().find(m => m.id === manifestationId);
    if (!m) return [];

    return m.actions
        .filter(a => !!a.completedDate)
        .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))
        .slice(0, 5)
        .map(a => ({
            description: a.description,
            workspaceText: a.workspaceText,
            completedDate: a.completedDate!,
        }));
}

/**
 * Mark a manifestation as manifested (completed) or released.
 */
export function updateManifestationStatus(
    id: string,
    status: 'manifested' | 'released',
): void {
    const all = getManifestations();
    const m = all.find(m => m.id === id);
    if (m) {
        m.status = status;
        saveManifestations(all);
    }
}

/**
 * Delete a manifestation permanently.
 */
export function deleteManifestation(id: string): void {
    const all = getManifestations().filter(m => m.id !== id);
    saveManifestations(all);
}

// ── Active Manifest v2 helpers ──

/**
 * Update signal strength for a manifestation.
 * Clamps to 0-100 range.
 */
export function updateSignalStrength(id: string, delta: number): number {
    const all = getManifestations();
    const m = all.find(m => m.id === id);
    if (!m) return 0;

    const current = m.signalStrength ?? 0;
    m.signalStrength = Math.max(0, Math.min(100, current + delta));
    saveManifestations(all);
    return m.signalStrength;
}

/**
 * Set signal strength to an exact value (for ceremony reset).
 */
export function setSignalStrength(id: string, value: number): void {
    const all = getManifestations();
    const m = all.find(m => m.id === id);
    if (!m) return;
    m.signalStrength = Math.max(0, Math.min(100, value));
    saveManifestations(all);
}

/**
 * Explicitly link a reading to a specific manifestation.
 * This is the user-initiated link ("this reading relates to my intention").
 */
export function linkReadingToManifestation(manifestationId: string, readingId: string): void {
    const all = getManifestations();
    const m = all.find(m => m.id === manifestationId);
    if (!m) return;
    if (!m.linkedReadingIds.includes(readingId)) {
        m.linkedReadingIds.push(readingId);
        saveManifestations(all);
    }
}

/**
 * Link a witness event ID to a manifestation and bump signal strength.
 */
export function linkWitnessEvent(
    manifestationId: string,
    witnessEventId: string,
    signalBump: number = 7,
): void {
    const all = getManifestations();
    const m = all.find(m => m.id === manifestationId);
    if (!m) return;

    if (!m.witnessEventIds) m.witnessEventIds = [];
    if (!m.witnessEventIds.includes(witnessEventId)) {
        m.witnessEventIds.push(witnessEventId);
        const current = m.signalStrength ?? 0;
        m.signalStrength = Math.min(100, current + signalBump);
        saveManifestations(all);
    }
}

/**
 * Update the domain of a manifestation (e.g., after AI classification).
 */
export function updateManifestationDomain(id: string, domain: ManifestDomain): void {
    const all = getManifestations();
    const m = all.find(m => m.id === id);
    if (m) {
        m.domain = domain;
        saveManifestations(all);
    }
}

/**
 * Get progress summary for a single manifestation.
 */
export function getManifestationProgress(id: string): ManifestationProgress | null {
    const m = getManifestations().find(m => m.id === id);
    if (!m) return null;

    const created = new Date(m.createdDate);
    const now = new Date();
    const daysActive = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    return {
        id: m.id,
        declaration: m.declaration,
        daysActive,
        readingsLinked: m.linkedReadingIds.length,
        actionsCompleted: m.actions.filter(a => !!a.completedDate).length,
        actionsTotal: m.actions.length,
    };
}

/**
 * Format active manifestations for AI context injection.
 * Returns a short summary string usable in prompts.
 */
export function getActiveManifestationsForAI(): string | null {
    const active = getActiveManifestations();
    if (active.length === 0) return null;

    // Use only the most recent active manifestation for context
    const primary = active[0];
    return `"${primary.declaration}"`;
}

// ── Coaching Arc Persistence ──
// Tracks the real-world action the user needs to go do.
// Survives app close/reopen so they see "How did it go?" when they return.

const COACHING_ARC_KEY = 'arcana_coaching_arcs';

export interface CoachingArc {
    manifestationId: string;
    acknowledgment: string;       // What the AI said about their workspace work
    realWorldAction: string;      // The action they need to go do
    workspaceActionDescription: string;  // The original workspace action they completed
    createdDate: string;          // ISO — when the arc was created
    reportText?: string;          // What they reported after doing the real-world action
    reportDate?: string;          // ISO — when they reported back
}

function getCoachingArcs(): CoachingArc[] {
    try {
        const raw = safeStorage.getItem(COACHING_ARC_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveCoachingArcs(arcs: CoachingArc[]): void {
    safeStorage.setItem(COACHING_ARC_KEY, JSON.stringify(arcs));
}

/**
 * Save a pending real-world action for a manifestation.
 * Replaces any existing pending arc for the same manifestation.
 */
export function saveCoachingArc(arc: Omit<CoachingArc, 'createdDate'>): void {
    const arcs = getCoachingArcs();
    // Remove any existing pending arc for this manifestation
    const filtered = arcs.filter(a => a.manifestationId !== arc.manifestationId);
    filtered.push({
        ...arc,
        createdDate: new Date().toISOString(),
    });
    saveCoachingArcs(filtered);
}

/**
 * Get the pending coaching arc for a manifestation (if any).
 * Returns null if no real-world action is awaiting report.
 */
export function getPendingCoachingArc(manifestationId: string): CoachingArc | null {
    const arcs = getCoachingArcs();
    const arc = arcs.find(a => a.manifestationId === manifestationId && !a.reportDate);
    return arc || null;
}

/**
 * Record the user's report-back for a coaching arc.
 */
export function saveCoachingReport(manifestationId: string, reportText: string): void {
    const arcs = getCoachingArcs();
    const arc = arcs.find(a => a.manifestationId === manifestationId && !a.reportDate);
    if (arc) {
        arc.reportText = reportText;
        arc.reportDate = new Date().toISOString();
        saveCoachingArcs(arcs);
    }
}

/**
 * Clear the coaching arc for a manifestation (e.g., when generating a new forge action).
 */
export function clearCoachingArc(manifestationId: string): void {
    const arcs = getCoachingArcs();
    const filtered = arcs.filter(a => a.manifestationId !== manifestationId);
    saveCoachingArcs(filtered);
}

/**
 * Get completed coaching arcs (with reports) for context in next forge action.
 */
export function getRecentCoachingReports(manifestationId: string): Array<{ action: string; report: string }> {
    const arcs = getCoachingArcs();
    return arcs
        .filter(a => a.manifestationId === manifestationId && !!a.reportDate && !!a.reportText)
        .sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''))
        .slice(0, 3)
        .map(a => ({ action: a.realWorldAction, report: a.reportText! }));
}
