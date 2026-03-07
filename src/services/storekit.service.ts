/**
 * StoreKit / In-App Purchase Service
 * 
 * Abstraction layer for Apple StoreKit 2 purchases.
 * Currently uses a mock implementation that can be swapped for a real
 * Capacitor IAP plugin (e.g. @revenuecat/purchases-capacitor or
 * cordova-plugin-purchase) once your Apple Developer account is set up.
 * 
 * IMPORTANT: Before submitting to App Store, replace the mock functions
 * with real StoreKit calls. Apple WILL reject fake payment processing.
 */

import { safeStorage } from './storage.service';

// ── Product Configuration ──
export const PRODUCTS = {
    WEEKLY: {
        id: 'com.arcanawhisper.premium.weekly',
        label: 'Weekly',
        price: '$4.99',
        period: '/wk',
        savings: '',
    },
    MONTHLY: {
        id: 'com.arcanawhisper.premium.monthly',
        label: 'Monthly',
        price: '$12.99',
        period: '/mo',
        savings: '',
    },
    YEARLY: {
        id: 'com.arcanawhisper.premium.yearly',
        label: 'Yearly',
        price: '$49.99',
        period: '/yr',
        savings: 'Save 68%',
        popular: true,
    },
} as const;

export type ProductId = typeof PRODUCTS[keyof typeof PRODUCTS]['id'];

// ── Subscription Status ──
export interface SubscriptionStatus {
    isActive: boolean;
    productId: ProductId | null;
    expiresAt: string | null;
    willRenew: boolean;
}

const SUBSCRIPTION_KEY = 'arcana_subscription_status';

/**
 * Get the current subscription status.
 * In production, this should query StoreKit 2's Transaction.currentEntitlements.
 */
export function getSubscriptionStatus(): SubscriptionStatus {
    try {
        const stored = safeStorage.getItem(SUBSCRIPTION_KEY);
        if (stored) {
            const status: SubscriptionStatus = JSON.parse(stored);
            // Check expiration
            if (status.expiresAt && new Date(status.expiresAt) < new Date()) {
                return { isActive: false, productId: null, expiresAt: null, willRenew: false };
            }
            return status;
        }
    } catch { /* fall through */ }
    return { isActive: false, productId: null, expiresAt: null, willRenew: false };
}

/**
 * Purchase a subscription product.
 * 
 * TODO: Replace with real StoreKit 2 integration before App Store submission.
 * Options:
 *   1. RevenueCat: @revenuecat/purchases-capacitor (recommended — handles receipts, webhooks, analytics)
 *   2. Direct: cordova-plugin-purchase (lower level, you manage receipt validation)
 * 
 * The real implementation should:
 *   1. Call StoreKit 2's Product.purchase()
 *   2. Verify the transaction receipt server-side
 *   3. Grant entitlement on success
 *   4. Handle pending transactions, refunds, family sharing
 */
export async function purchaseProduct(productId: ProductId): Promise<{ success: boolean; error?: string }> {
    // ─────────────────────────────────────────────────────
    // MOCK IMPLEMENTATION — Replace with real StoreKit calls
    // ─────────────────────────────────────────────────────
    console.warn('[StoreKit] Using mock purchase — replace before App Store submission!');

    try {
        // Simulate StoreKit processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate successful purchase
        const isMonthly = productId === PRODUCTS.MONTHLY.id;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + (isMonthly ? 1 : 12));

        const status: SubscriptionStatus = {
            isActive: true,
            productId,
            expiresAt: expiresAt.toISOString(),
            willRenew: true,
        };

        safeStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(status));
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Purchase failed' };
    }
}

/**
 * Restore previous purchases.
 * Required by Apple Guideline 3.1.5 — must be accessible in the UI.
 * 
 * TODO: Replace with StoreKit 2's Transaction.currentEntitlements
 * or RevenueCat's Purchases.restorePurchases().
 */
export async function restorePurchases(): Promise<{ restored: boolean; error?: string }> {
    console.warn('[StoreKit] Using mock restore — replace before App Store submission!');

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In production, this checks App Store receipts for active subscriptions
        const status = getSubscriptionStatus();
        if (status.isActive) {
            return { restored: true };
        }

        return { restored: false, error: 'No active subscriptions found' };
    } catch (err: any) {
        return { restored: false, error: err?.message || 'Restore failed' };
    }
}

/**
 * Check if the user has an active premium subscription.
 */
export function isPremium(): boolean {
    return getSubscriptionStatus().isActive;
}
