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
    reflection?: string;      // "How did it go?"
}

export interface ManifestationEntry {
    id: string;
    declaration: string;      // "I am calling in..."
    createdDate: string;      // ISO
    status: 'active' | 'manifested' | 'released';
    linkedReadingIds: string[];   // Readings done while this was active
    actions: ActionEntry[];
    cosmicAlignment?: string;     // Transit note at time of creation
    mode: 'intention' | 'manifestation';  // Which mode was used
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
 * Mark an action as completed with optional reflection.
 */
export function completeAction(
    manifestationId: string,
    actionId: string,
    reflection?: string,
): void {
    const all = getManifestations();
    const m = all.find(m => m.id === manifestationId);
    if (!m) return;

    const action = m.actions.find(a => a.id === actionId);
    if (!action) return;

    action.completedDate = new Date().toISOString();
    if (reflection) action.reflection = reflection;
    saveManifestations(all);
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
