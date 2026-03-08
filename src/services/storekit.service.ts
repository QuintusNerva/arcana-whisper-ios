/**
 * StoreKit / In-App Purchase Service — RevenueCat Integration
 *
 * Production-ready subscription management using RevenueCat SDK.
 * Handles StoreKit 2 purchases, receipt validation, and entitlement checks.
 *
 * Setup required in RevenueCat dashboard:
 *   1. Create project → Add iOS app with Bundle ID
 *   2. Create products matching PRODUCTS below
 *   3. Create "premium" entitlement → attach all 3 products
 *   4. Create "default" offering → attach product packages
 *   5. Copy Apple API Key → set as VITE_REVENUECAT_API_KEY
 */

import { Capacitor } from '@capacitor/core';
import { safeStorage } from './storage.service';

// ── RevenueCat SDK (lazy import — only on native) ──
let Purchases: any = null;
let PURCHASES_PACKAGE_TYPE: any = null;

async function loadRevenueCat() {
    if (Purchases) return;
    try {
        const mod = await import('@revenuecat/purchases-capacitor');
        Purchases = mod.Purchases;
        PURCHASES_PACKAGE_TYPE = mod.PACKAGE_TYPE;
    } catch (e) {
        console.warn('[StoreKit] RevenueCat not available (web mode):', e);
    }
}

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
const RC_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';
const ENTITLEMENT_ID = 'premium'; // Must match RevenueCat dashboard

let rcInitialized = false;

/**
 * Initialize RevenueCat SDK.
 * Call once at app startup (e.g., in App.tsx useEffect).
 */
export async function initializePurchases(): Promise<void> {
    if (rcInitialized) return;
    if (!Capacitor.isNativePlatform()) {
        console.log('[StoreKit] Web platform — using local storage fallback');
        rcInitialized = true;
        return;
    }

    await loadRevenueCat();
    if (!Purchases) return;

    if (!RC_API_KEY) {
        console.warn('[StoreKit] No VITE_REVENUECAT_API_KEY set — purchases disabled');
        return;
    }

    try {
        await Purchases.configure({ apiKey: RC_API_KEY });
        rcInitialized = true;
        console.log('[StoreKit] RevenueCat initialized');
    } catch (err) {
        console.error('[StoreKit] RevenueCat init failed:', err);
    }
}

/**
 * Get the current subscription status.
 * On native: queries RevenueCat entitlements.
 * On web: falls back to localStorage.
 */
export async function getSubscriptionStatusAsync(): Promise<SubscriptionStatus> {
    if (Capacitor.isNativePlatform() && Purchases && rcInitialized) {
        try {
            const { customerInfo } = await Purchases.getCustomerInfo();
            const entitlement = customerInfo.entitlements?.active?.[ENTITLEMENT_ID];

            if (entitlement) {
                return {
                    isActive: true,
                    productId: entitlement.productIdentifier as ProductId,
                    expiresAt: entitlement.expirationDate || null,
                    willRenew: !entitlement.willRenew ? false : true,
                };
            }
            return { isActive: false, productId: null, expiresAt: null, willRenew: false };
        } catch (err) {
            console.error('[StoreKit] Failed to get customer info:', err);
        }
    }

    // Fallback to local storage (web dev mode)
    return getSubscriptionStatus();
}

/**
 * Synchronous subscription check from localStorage cache.
 * Use for quick UI checks; call getSubscriptionStatusAsync for authoritative state.
 */
export function getSubscriptionStatus(): SubscriptionStatus {
    try {
        const stored = safeStorage.getItem(SUBSCRIPTION_KEY);
        if (stored) {
            const status: SubscriptionStatus = JSON.parse(stored);
            if (status.expiresAt && new Date(status.expiresAt) < new Date()) {
                return { isActive: false, productId: null, expiresAt: null, willRenew: false };
            }
            return status;
        }
    } catch { /* fall through */ }
    return { isActive: false, productId: null, expiresAt: null, willRenew: false };
}

/**
 * Purchase a subscription product via RevenueCat.
 * On native: triggers real StoreKit purchase flow.
 * On web: simulates for development.
 */
export async function purchaseProduct(productId: ProductId): Promise<{ success: boolean; error?: string }> {
    // ── Native: RevenueCat purchase ──
    if (Capacitor.isNativePlatform() && Purchases && rcInitialized) {
        try {
            // Get available offerings
            const { offerings } = await Purchases.getOfferings();
            const currentOffering = offerings?.current;

            if (!currentOffering) {
                return { success: false, error: 'No offerings available. Please try again later.' };
            }

            // Find the matching package
            const packages = currentOffering.availablePackages || [];
            const pkg = packages.find((p: any) => p.product?.identifier === productId);

            if (!pkg) {
                return { success: false, error: 'Product not found. Please try again later.' };
            }

            // Execute purchase
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
            const entitlement = customerInfo.entitlements?.active?.[ENTITLEMENT_ID];

            if (entitlement) {
                // Cache status locally
                const status: SubscriptionStatus = {
                    isActive: true,
                    productId: entitlement.productIdentifier as ProductId,
                    expiresAt: entitlement.expirationDate || null,
                    willRenew: !entitlement.willRenew ? false : true,
                };
                safeStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(status));
                return { success: true };
            }

            return { success: false, error: 'Purchase completed but entitlement not found.' };
        } catch (err: any) {
            // User cancelled
            if (err?.code === 1 || err?.message?.includes('cancelled') || err?.message?.includes('canceled')) {
                return { success: false, error: 'Purchase cancelled' };
            }
            console.error('[StoreKit] Purchase error:', err);
            return { success: false, error: err?.message || 'Purchase failed. Please try again.' };
        }
    }

    // ── Web fallback: simulate for development ──
    console.warn('[StoreKit] Web mode — simulating purchase');
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const isWeekly = productId === PRODUCTS.WEEKLY.id;
        const isMonthly = productId === PRODUCTS.MONTHLY.id;
        const expiresAt = new Date();
        if (isWeekly) expiresAt.setDate(expiresAt.getDate() + 7);
        else if (isMonthly) expiresAt.setMonth(expiresAt.getMonth() + 1);
        else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

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
 */
export async function restorePurchases(): Promise<{ restored: boolean; error?: string }> {
    // ── Native: RevenueCat restore ──
    if (Capacitor.isNativePlatform() && Purchases && rcInitialized) {
        try {
            const { customerInfo } = await Purchases.restorePurchases();
            const entitlement = customerInfo.entitlements?.active?.[ENTITLEMENT_ID];

            if (entitlement) {
                const status: SubscriptionStatus = {
                    isActive: true,
                    productId: entitlement.productIdentifier as ProductId,
                    expiresAt: entitlement.expirationDate || null,
                    willRenew: !entitlement.willRenew ? false : true,
                };
                safeStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(status));
                return { restored: true };
            }

            return { restored: false, error: 'No active subscriptions found' };
        } catch (err: any) {
            console.error('[StoreKit] Restore error:', err);
            return { restored: false, error: err?.message || 'Restore failed' };
        }
    }

    // ── Web fallback ──
    console.warn('[StoreKit] Web mode — simulating restore');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const status = getSubscriptionStatus();
    if (status.isActive) {
        return { restored: true };
    }
    return { restored: false, error: 'No active subscriptions found' };
}

/**
 * Check if the user has an active premium subscription.
 * Synchronous — uses cached localStorage value.
 * For authoritative check, use getSubscriptionStatusAsync().
 */
export function isPremium(): boolean {
    return getSubscriptionStatus().isActive;
}

/**
 * Get available offerings from RevenueCat.
 * Returns live prices from App Store (may differ from PRODUCTS constants).
 */
export async function getOfferings(): Promise<any> {
    if (!Capacitor.isNativePlatform() || !Purchases || !rcInitialized) {
        return null;
    }
    try {
        const { offerings } = await Purchases.getOfferings();
        return offerings?.current || null;
    } catch (err) {
        console.error('[StoreKit] Failed to get offerings:', err);
        return null;
    }
}
