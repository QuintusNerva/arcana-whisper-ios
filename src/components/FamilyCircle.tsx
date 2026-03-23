/**
 * Family Circle — Birth Charts for Kids & Family
 *
 * Dedicated tab for parent-child and sibling astrological dynamics.
 * - Persistent family member storage
 * - Sun/Moon/Rising for each child
 * - Parent↔child synastry with age-aware AI interpretations
 * - Sibling↔sibling dynamics
 */

import React from 'react';
import { safeStorage } from '../services/storage.service';
import {
    getBirthData, getNatalTriad, getSynastryChart, getLifePathNumber,
    BirthData, NatalTriad, SynastryReport, SynastryAspect,
} from '../services/astrology.service';
import { AIService } from '../services/ai.service';
import { searchPlaces, resolvePlace, PlaceSuggestion } from '../services/geocoding.service';
import { AIResponseRenderer } from './AIResponseRenderer';
import { generateShareURL } from './CosmicInvite';
import { PageHeader } from './PageHeader';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

interface FamilyMember {
    id: string;
    name: string;
    relationship: 'son' | 'daughter' | 'child' | 'sibling' | 'parent' | 'other';
    birthday: string;
    birthTime: string;
    location: string;
    latitude?: number;
    longitude?: number;
    utcOffset: number;
}

interface FamilyCircleProps {
    onClose: () => void;
    onTabChange: (tab: string) => void;
    subscription: string;
    onShowPremium: () => void;
}

type ViewState = 'list' | 'add' | 'reading';

const STORAGE_KEY = 'arcana_family_members';
const READING_CACHE_PREFIX = 'arcana_family_reading_';

const RELATIONSHIP_OPTIONS = [
    { value: 'son', label: 'Son', emoji: '👦' },
    { value: 'daughter', label: 'Daughter', emoji: '👧' },
    { value: 'child', label: 'Child', emoji: '👶' },
    { value: 'sibling', label: 'Sibling', emoji: '🧑' },
    { value: 'parent', label: 'Parent', emoji: '👨' },
    { value: 'other', label: 'Other', emoji: '✦' },
] as const;

const RELATIONSHIP_EMOJI: Record<string, string> = {
    son: '👦', daughter: '👧', child: '👶', sibling: '🧑', parent: '👨', other: '✦',
};

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

function loadFamily(): FamilyMember[] {
    try {
        const raw = safeStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveFamily(members: FamilyMember[]) {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function getAge(birthday: string): number {
    const bday = new Date(birthday + 'T12:00:00');
    const now = new Date();
    let age = now.getFullYear() - bday.getFullYear();
    const m = now.getMonth() - bday.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < bday.getDate())) age--;
    return Math.max(0, age);
}

function getAgeLabel(age: number): string {
    if (age < 1) return 'Infant';
    if (age <= 3) return 'Toddler';
    if (age <= 10) return 'Child';
    if (age <= 12) return 'Preteen';
    if (age <= 18) return 'Teen';
    return 'Adult';
}

function toBirthData(member: FamilyMember): BirthData {
    return {
        birthday: member.birthday,
        birthTime: member.birthTime,
        location: member.location,
        latitude: member.latitude,
        longitude: member.longitude,
        utcOffset: member.utcOffset,
    };
}

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════

export function FamilyCircle({ onClose, onTabChange, subscription, onShowPremium }: FamilyCircleProps) {
    const parentData = getBirthData();

    const [viewState, setViewState] = React.useState<ViewState>('list');
    const [family, setFamily] = React.useState<FamilyMember[]>(loadFamily);
    const [selectedMember, setSelectedMember] = React.useState<FamilyMember | null>(null);
    const [siblingPair, setSiblingPair] = React.useState<[FamilyMember, FamilyMember] | null>(null);

    // Add form state
    const [formName, setFormName] = React.useState('');
    const [formRelationship, setFormRelationship] = React.useState<FamilyMember['relationship']>('child');
    const [formBirthday, setFormBirthday] = React.useState('');
    const [formBirthTime, setFormBirthTime] = React.useState('');
    const [formLocation, setFormLocation] = React.useState('');
    const [formLatitude, setFormLatitude] = React.useState<number | undefined>();
    const [formLongitude, setFormLongitude] = React.useState<number | undefined>();
    const [formUtcOffset, setFormUtcOffset] = React.useState(0);

    // Geocoding
    const [cityQuery, setCityQuery] = React.useState('');
    const [citySuggestions, setCitySuggestions] = React.useState<PlaceSuggestion[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = React.useState(false);
    const [resolving, setResolving] = React.useState(false);
    const cityDropdownRef = React.useRef<HTMLDivElement>(null);
    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reading state
    const [readingContent, setReadingContent] = React.useState<string | null>(null);
    const [readingLoading, setReadingLoading] = React.useState(false);
    const [readingLabel, setReadingLabel] = React.useState('');
    const [shareStatus, setShareStatus] = React.useState<'idle' | 'done'>('idle');

    // Editing
    const [editingId, setEditingId] = React.useState<string | null>(null);

    // ── Geocoding handlers ──
    const handleCitySearch = (query: string) => {
        setCityQuery(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (query.length < 3) {
            setCitySuggestions([]);
            setShowCitySuggestions(false);
            return;
        }
        searchTimeoutRef.current = setTimeout(async () => {
            const results = await searchPlaces(query);
            setCitySuggestions(results);
            setShowCitySuggestions(results.length > 0);
        }, 300);
    };

    const handleCitySelect = async (suggestion: PlaceSuggestion) => {
        setResolving(true);
        setShowCitySuggestions(false);
        setCityQuery(suggestion.description);
        try {
            const resolved = await resolvePlace(suggestion, formBirthday || '2000-01-01', formBirthTime);
            if (resolved) {
                setFormLocation(suggestion.description);
                setFormLatitude(resolved.latitude);
                setFormLongitude(resolved.longitude);
                setFormUtcOffset(resolved.utcOffset);
            }
        } catch { /* ignore */ }
        setResolving(false);
    };

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
                setShowCitySuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Save/Edit/Delete ──
    const handleSaveMember = () => {
        if (!formName || !formBirthday) return;

        const member: FamilyMember = {
            id: editingId || Date.now().toString(),
            name: formName,
            relationship: formRelationship,
            birthday: formBirthday,
            birthTime: formBirthTime,
            location: formLocation,
            latitude: formLatitude,
            longitude: formLongitude,
            utcOffset: formUtcOffset,
        };

        let updated;
        if (editingId) {
            updated = family.map(m => m.id === editingId ? member : m);
        } else {
            updated = [...family, member];
        }
        setFamily(updated);
        saveFamily(updated);
        resetForm();
        setViewState('list');
    };

    const handleDeleteMember = (id: string) => {
        const updated = family.filter(m => m.id !== id);
        setFamily(updated);
        saveFamily(updated);
        // Clear cached reading
        safeStorage.removeItem(`${READING_CACHE_PREFIX}${id}`);
        if (selectedMember?.id === id) {
            setSelectedMember(null);
            setReadingContent(null);
        }
    };

    const handleEditMember = (member: FamilyMember) => {
        setEditingId(member.id);
        setFormName(member.name);
        setFormRelationship(member.relationship);
        setFormBirthday(member.birthday);
        setFormBirthTime(member.birthTime);
        setFormLocation(member.location);
        setFormLatitude(member.latitude);
        setFormLongitude(member.longitude);
        setFormUtcOffset(member.utcOffset);
        setCityQuery(member.location);
        setViewState('add');
    };

    const resetForm = () => {
        setEditingId(null);
        setFormName('');
        setFormRelationship('child');
        setFormBirthday('');
        setFormBirthTime('');
        setFormLocation('');
        setFormLatitude(undefined);
        setFormLongitude(undefined);
        setFormUtcOffset(0);
        setCityQuery('');
    };

    // ── Generate parent↔child reading ──
    const generateReading = async (member: FamilyMember) => {
        if (subscription !== 'premium') {
            onShowPremium();
            return;
        }
        if (!parentData) return;
        setSelectedMember(member);
        setViewState('reading');

        // Check cache
        const cacheKey = `${READING_CACHE_PREFIX}${member.id}`;
        const cached = safeStorage.getItem(cacheKey);
        if (cached) {
            setReadingContent(cached);
            setReadingLabel(`You & ${member.name}`);
            return;
        }

        setReadingLoading(true);
        setReadingLabel(`You & ${member.name}`);
        try {
            const parentTriad = getNatalTriad(parentData);
            const childData = toBirthData(member);
            const childTriad = getNatalTriad(childData);
            const synastry = getSynastryChart(parentData, childData);
            const age = getAge(member.birthday);

            const ai = new AIService();
            const parentLP = getLifePathNumber(parentData.birthday);
            const childLP = getLifePathNumber(member.birthday);
            const reading = await ai.getFamilyReading({
                parentTriad: { sun: parentTriad.sun.name, moon: parentTriad.moon.name, rising: parentTriad.rising.name },
                childName: member.name,
                childTriad: { sun: childTriad.sun.name, moon: childTriad.moon.name, rising: childTriad.rising.name },
                childAge: age,
                childAgeLabel: getAgeLabel(age),
                relationship: member.relationship,
                parentLifePath: parentLP,
                childLifePath: childLP,
                synastryHighlights: synastry.aspects.slice(0, 8).map(a => ({
                    planet1: a.planet1.name, planet2: a.planet2.name,
                    aspect: a.type, nature: a.nature, category: a.category,
                })),
            });

            setReadingContent(reading);
            safeStorage.setItem(cacheKey, reading);
        } catch (err: any) {
            setReadingContent(`⚠️ ${err.message || 'Failed to generate reading.'}`);
        }
        setReadingLoading(false);
    };

    // ── Generate sibling↔sibling reading ──
    const generateSiblingReading = async (child1: FamilyMember, child2: FamilyMember) => {
        if (subscription !== 'premium') {
            onShowPremium();
            return;
        }
        setSiblingPair([child1, child2]);
        setSelectedMember(null);
        setViewState('reading');

        const cacheKey = `${READING_CACHE_PREFIX}sibling_${child1.id}_${child2.id}`;
        const cached = safeStorage.getItem(cacheKey);
        if (cached) {
            setReadingContent(cached);
            setReadingLabel(`${child1.name} & ${child2.name}`);
            return;
        }

        setReadingLoading(true);
        setReadingLabel(`${child1.name} & ${child2.name}`);
        try {
            const data1 = toBirthData(child1);
            const data2 = toBirthData(child2);
            const triad1 = getNatalTriad(data1);
            const triad2 = getNatalTriad(data2);
            const synastry = getSynastryChart(data1, data2);

            const ai = new AIService();
            const reading = await ai.getSiblingReading({
                child1Name: child1.name,
                child1Triad: { sun: triad1.sun.name, moon: triad1.moon.name, rising: triad1.rising.name },
                child1Age: getAge(child1.birthday),
                child1LifePath: getLifePathNumber(child1.birthday),
                child2Name: child2.name,
                child2Triad: { sun: triad2.sun.name, moon: triad2.moon.name, rising: triad2.rising.name },
                child2Age: getAge(child2.birthday),
                child2LifePath: getLifePathNumber(child2.birthday),
                synastryHighlights: synastry.aspects.slice(0, 8).map(a => ({
                    planet1: a.planet1.name, planet2: a.planet2.name,
                    aspect: a.type, nature: a.nature,
                })),
            });

            setReadingContent(reading);
            safeStorage.setItem(cacheKey, reading);
        } catch (err: any) {
            setReadingContent(`⚠️ ${err.message || 'Failed to generate reading.'}`);
        }
        setReadingLoading(false);
    };

    // ══════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════

    return (
        <div className="fixed inset-0 bg-altar-dark flex flex-col z-50">
            {/* Header */}
            <PageHeader
                onClose={() => {
                    if (viewState !== 'list') { setViewState('list'); setReadingContent(null); setSiblingPair(null); }
                    else onClose();
                }}
                centerContent={
                    <div className="text-center w-full">
                        <h1 className="font-display text-lg text-altar-gold tracking-[4px]">
                            {viewState === 'add' ? (editingId ? 'EDIT MEMBER' : 'ADD MEMBER') :
                                viewState === 'reading' ? 'FAMILY READING' : 'FAMILY CIRCLE'}
                        </h1>
                        <p className="text-[10px] text-altar-muted tracking-[2px] mt-1 font-display">
                            {viewState === 'reading' ? readingLabel :
                                viewState === 'add' ? 'BIRTH DETAILS' : 'COSMIC FAMILY BONDS'}
                        </p>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto pb-32">

                {/* ═══ FAMILY LIST ═══ */}
                {viewState === 'list' && (
                    <>
                        {/* No birth data warning */}
                        {!parentData && (
                            <div className="mx-5 mt-4 rounded-[22px] p-5 text-center animate-fade-up" style={{
                                background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)',
                            }}>
                                <p className="text-3xl mb-2">⚠️</p>
                                <p className="text-sm text-altar-text/70 mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Set your birth data first to see family dynamics.</p>
                                <button onClick={() => onTabChange('profile')}
                                    className="rounded-2xl px-6 py-2.5 font-display text-[11px] tracking-[2px] uppercase transition-all active:scale-[0.98] gold-shimmer"
                                    style={{
                                        background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                        border: '2px solid rgba(212,175,55,0.6)',
                                        color: '#1a0f2e',
                                        fontWeight: 800,
                                        boxShadow: '0 2px 0 #8a6914, 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                                    }}
                                >
                                    Set Up Profile
                                </button>
                            </div>
                        )}

                        {/* Empty state */}
                        {family.length === 0 && parentData && (
                            <div className="mx-5 mt-8 text-center animate-fade-up">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                                    background: 'linear-gradient(135deg, rgba(197,147,65,0.08), rgba(61,29,90,0.4))',
                                    border: '1px solid rgba(212,175,55,0.2)',
                                    boxShadow: '0 0 30px rgba(212,175,55,0.08), 0 2px 8px rgba(0,0,0,0.3)',
                                }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A94E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <p className="text-sm text-altar-text/70 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Your family circle is empty</p>
                                <p className="text-xs text-altar-muted mb-6" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>Add your children, siblings, or parents to discover<br />the cosmic bonds between you.</p>
                            </div>
                        )}

                        {/* Family members */}
                        {family.length > 0 && (
                            <div className="mx-5 mt-4 space-y-3">
                                {family.map((member, i) => (
                                    <FamilyMemberCard
                                        key={member.id}
                                        member={member}
                                        index={i}
                                        onRead={() => generateReading(member)}
                                        onEdit={() => handleEditMember(member)}
                                        onDelete={() => handleDeleteMember(member.id)}
                                        hasParentData={!!parentData}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Sibling dynamics (if 2+ kids) */}
                        {family.filter(m => ['son', 'daughter', 'child'].includes(m.relationship)).length >= 2 && (
                            <SiblingSection
                                family={family}
                                onSelectPair={generateSiblingReading}
                            />
                        )}

                        {/* Add member button */}
                        {parentData && (
                            <div className="mx-5 mt-6 animate-fade-up" style={{ animationDelay: `${Math.min(family.length, 5) * 0.1 + 0.2}s`, opacity: 0 }}>
                                <button
                                    onClick={() => { resetForm(); setViewState('add'); }}
                                    className="w-full rounded-2xl px-5 py-4 font-display text-[12px] tracking-[3px] uppercase transition-all active:scale-[0.98] gold-shimmer"
                                    style={{
                                        background: 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)',
                                        border: '2px solid rgba(212,175,55,0.6)',
                                        color: '#1a0f2e',
                                        fontWeight: 800,
                                        boxShadow: '0 2px 0 #8a6914, 0 4px 12px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
                                    }}
                                >
                                    + Add Family Member
                                </button>
                            </div>
                        )}

                        {/* Share My Cosmic Card */}
                        {parentData && (
                            <div className="mx-5 mt-3 mb-8 animate-fade-up" style={{ animationDelay: `${Math.min(family.length, 5) * 0.1 + 0.35}s`, opacity: 0 }}>
                                <button
                                    onClick={async () => {
                                        const baseUrl = window.location.origin;
                                        const profile = JSON.parse(safeStorage.getItem('userProfile') || '{}');
                                        const url = generateShareURL(profile.name || 'A Friend', parentData, baseUrl);
                                        const shareText = `✨ ${profile.name || 'I'} shared their cosmic blueprint with you! Discover our cosmic bond ✨`;
                                        if (navigator.share) {
                                            try {
                                                await navigator.share({ title: '✨ My Cosmic Card — Arcana Whisper', text: shareText, url });
                                            } catch { /* cancelled */ }
                                        } else {
                                            await navigator.clipboard.writeText(`${shareText}\n${url}`);
                                            setShareStatus('done');
                                            setTimeout(() => setShareStatus('idle'), 2500);
                                        }
                                    }}
                                    className="w-full rounded-2xl px-5 py-3.5 font-display text-[11px] tracking-[2px] uppercase transition-all active:scale-[0.98]"
                                    style={{
                                        background: 'rgba(61,29,90,0.35)',
                                        border: '1px solid rgba(212,175,55,0.15)',
                                        color: '#D4A94E',
                                        backdropFilter: 'blur(12px)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    {shareStatus === 'done' ? '✅ Link Copied!' : '📤 Share My Cosmic Card'}
                                </button>
                                <p className="text-[10px] text-altar-muted/40 text-center mt-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>Invite family to see your stars — they can add you instantly</p>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ ADD/EDIT FORM ═══ */}
                {viewState === 'add' && (
                    <div className="mx-5 mt-4 space-y-5 animate-fade-up">

                        {/* ── Single consolidated form card ── */}
                        <div className="rounded-[22px] overflow-hidden" style={{
                            background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
                            border: '1px solid var(--color-gold-glow-med)',
                            boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 0 40px var(--color-gold-glow-soft), inset 0 1px 1px rgba(255,255,255,0.08)',
                        }}>

                            {/* Name */}
                            <div className="px-6 pt-6 pb-5">
                                <label className="text-[9px] font-display tracking-[3px] uppercase mb-3 block" style={{ color: 'var(--color-gold-200)' }}>Name</label>
                                <input
                                    type="text" value={formName} onChange={e => setFormName(e.target.value)}
                                    placeholder="e.g. Emma"
                                    className="w-full px-4 py-3.5 text-[14px] rounded-xl focus:outline-none placeholder:text-altar-muted/30" style={{
                                        background: 'rgba(18,2,36,0.6)',
                                        border: '1px solid var(--color-gold-glow-med)',
                                        color: 'var(--color-altar-text)',
                                        fontFamily: 'var(--font-body)',
                                        fontWeight: 400,
                                        letterSpacing: '0.5px',
                                    }}
                                />
                            </div>

                            {/* Divider */}
                            <div className="mx-6" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--color-gold-glow-med) 30%, var(--color-gold-glow-med) 70%, transparent 100%)' }} />

                            {/* Relationship */}
                            <div className="px-6 py-5">
                                <label className="text-[9px] font-display tracking-[3px] uppercase mb-3 block" style={{ color: 'var(--color-gold-200)' }}>Relationship</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {RELATIONSHIP_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFormRelationship(opt.value)}
                                            className="py-2.5 text-[11px] font-display tracking-[1px] rounded-xl transition-all active:scale-[0.97]"
                                            style={{
                                                background: formRelationship === opt.value
                                                    ? 'linear-gradient(160deg, rgba(197,147,65,0.2), rgba(197,147,65,0.08))'
                                                    : 'rgba(18,2,36,0.5)',
                                                border: formRelationship === opt.value
                                                    ? '1px solid var(--color-gold-glow-strong)'
                                                    : '1px solid rgba(255,255,255,0.06)',
                                                color: formRelationship === opt.value ? 'var(--color-gold-100)' : 'var(--color-altar-muted)',
                                                boxShadow: formRelationship === opt.value
                                                    ? '0 0 12px var(--color-gold-glow-soft), inset 0 1px 0 rgba(249,228,145,0.08)'
                                                    : 'none',
                                            }}
                                        >
                                            {opt.emoji} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="mx-6" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--color-gold-glow-med) 30%, var(--color-gold-glow-med) 70%, transparent 100%)' }} />

                            {/* Birthday */}
                            <div className="px-6 py-5">
                                <label className="text-[9px] font-display tracking-[3px] uppercase mb-3 block" style={{ color: 'var(--color-gold-200)' }}>Date of Birth</label>
                                <input
                                    type="date" value={formBirthday} onChange={e => setFormBirthday(e.target.value)}
                                    className="w-full px-4 py-3.5 text-[14px] rounded-xl [color-scheme:dark] focus:outline-none" style={{
                                        background: 'rgba(18,2,36,0.6)',
                                        border: '1px solid var(--color-gold-glow-med)',
                                        color: 'var(--color-altar-text)',
                                        fontFamily: 'var(--font-body)',
                                        fontWeight: 400,
                                    }}
                                />
                            </div>

                            {/* Divider */}
                            <div className="mx-6" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--color-gold-glow-med) 30%, var(--color-gold-glow-med) 70%, transparent 100%)' }} />

                            {/* Birth Time */}
                            <div className="px-6 py-5">
                                <label className="text-[9px] font-display tracking-[3px] uppercase mb-1 block" style={{ color: 'var(--color-gold-200)' }}>Birth Time <span style={{ color: 'var(--color-altar-muted)', opacity: 0.5 }}>(optional)</span></label>
                                <p className="text-[10px] mb-3" style={{ color: 'var(--color-altar-muted)', opacity: 0.5, fontFamily: 'var(--font-body)', fontWeight: 300 }}>Needed for accurate Moon & Rising sign</p>
                                <input
                                    type="time" value={formBirthTime} onChange={e => setFormBirthTime(e.target.value)}
                                    className="w-full px-4 py-3.5 text-[14px] rounded-xl [color-scheme:dark] focus:outline-none" style={{
                                        background: 'rgba(18,2,36,0.6)',
                                        border: '1px solid var(--color-gold-glow-med)',
                                        color: 'var(--color-altar-text)',
                                        fontFamily: 'var(--font-body)',
                                        fontWeight: 400,
                                    }}
                                />
                            </div>

                            {/* Divider */}
                            <div className="mx-6" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--color-gold-glow-med) 30%, var(--color-gold-glow-med) 70%, transparent 100%)' }} />

                            {/* Place of Birth */}
                            <div className="px-6 pt-5 pb-6 relative">
                                <label className="text-[9px] font-display tracking-[3px] uppercase mb-3 block" style={{ color: 'var(--color-gold-200)' }}>Place of Birth <span style={{ color: 'var(--color-altar-muted)', opacity: 0.5 }}>(optional)</span></label>
                                <div className="relative">
                                    <input
                                        type="text" value={cityQuery}
                                        onChange={e => handleCitySearch(e.target.value)}
                                        onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                                        placeholder="Search city…"
                                        className="w-full px-4 py-3.5 text-[14px] rounded-xl focus:outline-none placeholder:text-altar-muted/30" style={{
                                            background: 'rgba(18,2,36,0.6)',
                                            border: '1px solid var(--color-gold-glow-med)',
                                            color: 'var(--color-altar-text)',
                                            fontFamily: 'var(--font-body)',
                                            fontWeight: 400,
                                        }}
                                    />
                                    {resolving && (
                                        <span className="absolute right-3 top-3.5 text-xs animate-pulse" style={{ color: 'var(--color-gold-200)' }}>…</span>
                                    )}
                                </div>
                                {formLocation && !resolving && (
                                    <p className="text-[10px] text-emerald-400/60 mt-2">✓ {formLocation}</p>
                                )}
                            </div>
                        </div>

                        {/* City suggestions — wrapped in ref so click-outside doesn't dismiss before onClick fires */}
                        <div ref={cityDropdownRef}>
                        {showCitySuggestions && citySuggestions.length > 0 && (
                            <div className="rounded-xl overflow-hidden -mt-3" style={{
                                background: 'linear-gradient(160deg, #1c1538, #130f2e)',
                                border: '1px solid var(--color-gold-glow-med)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            }}>
                                {citySuggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleCitySelect(s)}
                                        className="w-full px-4 py-3 text-left text-xs hover:bg-white/5 transition-colors"
                                        style={{
                                            color: 'var(--color-altar-text)',
                                            opacity: 0.8,
                                            fontFamily: 'var(--font-body)',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        }}
                                    >
                                        📍 {s.description}
                                    </button>
                                ))}
                            </div>
                        )}
                        </div>

                        {/* Save button */}
                        <button
                            onClick={handleSaveMember}
                            disabled={!formName || !formBirthday}
                            className="w-full rounded-2xl py-4 font-display text-[12px] tracking-[3px] uppercase transition-all active:scale-[0.98] disabled:opacity-30 gold-shimmer"
                            style={{
                                background: formName && formBirthday
                                    ? 'linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)'
                                    : 'rgba(61,29,90,0.35)',
                                border: formName && formBirthday
                                    ? '2px solid rgba(212,175,55,0.6)'
                                    : '1px solid rgba(255,255,255,0.07)',
                                color: formName && formBirthday ? '#1a0f2e' : '#e2e8f0',
                                fontWeight: 800,
                                boxShadow: formName && formBirthday
                                    ? '0 2px 0 #8a6914, 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)'
                                    : 'none',
                            }}
                        >
                            {editingId ? '✦ Save Changes' : '✦ Add to Family'}
                        </button>
                    </div>
                )}

                {/* ═══ READING VIEW ═══ */}
                {viewState === 'reading' && (
                    <div className="mx-5 mt-4 animate-fade-up">
                        {readingLoading ? (
                            <div className="rounded-[22px] p-8 text-center mt-8" style={{
                                background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                boxShadow: '0 8px 28px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)',
                            }}>
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse" style={{
                                    background: 'rgba(61,29,90,0.4)',
                                    border: '1px solid rgba(212,175,55,0.15)',
                                }}>
                                    <span className="text-2xl">👨‍👩‍👧‍👦</span>
                                </div>
                                <p className="text-sm text-altar-text font-display tracking-[2px] mb-2">Reading the Bonds</p>
                                <p className="text-xs animate-pulse" style={{ color: '#D4A94E', opacity: 0.6 }}>Channeling family dynamics…</p>
                            </div>
                        ) : readingContent ? (
                            <div className="rounded-[22px] p-5" style={{
                                background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                boxShadow: '0 8px 28px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)',
                            }}>
                                <AIResponseRenderer text={readingContent} />
                            </div>
                        ) : null}

                        {/* Back button */}
                        <button
                            onClick={() => { setViewState('list'); setReadingContent(null); setSiblingPair(null); }}
                            className="w-full mt-4 rounded-2xl py-3 font-display text-[11px] tracking-[2px] uppercase transition-all active:scale-[0.98]"
                            style={{
                                background: 'rgba(61,29,90,0.35)',
                                border: '1px solid rgba(212,175,55,0.15)',
                                color: '#D4A94E',
                                backdropFilter: 'blur(12px)',
                            }}
                        >
                            ← Back to Family
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════

function FamilyMemberCard({ member, index, onRead, onEdit, onDelete, hasParentData }: {
    member: FamilyMember; index: number;
    onRead: () => void; onEdit: () => void; onDelete: () => void;
    hasParentData: boolean;
}) {
    const [expanded, setExpanded] = React.useState(false);
    const age = getAge(member.birthday);
    const ageLabel = getAgeLabel(age);

    // Compute triad
    const triad = React.useMemo(() => {
        try { return getNatalTriad(toBirthData(member)); }
        catch { return null; }
    }, [member.birthday, member.birthTime, member.location]);

    return (
        <div className="rounded-[22px] p-4 animate-fade-up" style={{
            animationDelay: `${index * 0.08}s`, opacity: 0,
            background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)',
        }}>
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{
                    background: 'rgba(61,29,90,0.4)',
                    border: '1px solid rgba(212,175,55,0.15)',
                }}>
                    <span className="text-lg">{RELATIONSHIP_EMOJI[member.relationship] || '✦'}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-altar-text font-medium truncate">{member.name}</p>
                        <span className="text-[9px] text-altar-muted/60 font-display tracking-[1px] uppercase">{member.relationship}</span>
                    </div>
                    {triad && (
                        <p className="text-[10px] text-altar-muted mt-0.5">
                            ☉ {triad.sun.name} · ☽ {triad.moon.name} · ↑ {triad.rising.name} · <span style={{ color: '#D4A94E', opacity: 0.7 }}>LP {getLifePathNumber(member.birthday)}</span>
                        </p>
                    )}
                    <p className="text-[10px] text-altar-muted/50 mt-0.5">
                        {age > 0 ? `${age} years old` : 'Under 1'} · {ageLabel}
                    </p>
                </div>
                <button onClick={() => setExpanded(!expanded)} className="text-altar-muted text-xs p-1">
                    {expanded ? '▲' : '▼'}
                </button>
            </div>

            {expanded && (
                <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                    {hasParentData && (
                        <button onClick={onRead}
                            className="flex-1 py-2 text-[10px] font-display rounded-xl transition-all active:scale-[0.97]"
                            style={{
                                background: 'rgba(197,147,65,0.12)',
                                border: '1px solid rgba(212,175,55,0.3)',
                                color: '#F9E491',
                            }}
                        >
                            ✦ Your Bond
                        </button>
                    )}
                    <button onClick={onEdit}
                        className="px-4 py-2 text-[10px] font-display rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: 'rgba(61,29,90,0.4)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: '#e2e8f0',
                        }}
                    >
                        Edit
                    </button>
                    <button onClick={onDelete}
                        className="px-4 py-2 text-[10px] font-display rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: 'rgba(220,38,38,0.12)',
                            border: '1px solid rgba(220,38,38,0.25)',
                            color: '#f87171',
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

function SiblingSection({ family, onSelectPair }: {
    family: FamilyMember[];
    onSelectPair: (a: FamilyMember, b: FamilyMember) => void;
}) {
    const kids = family.filter(m => ['son', 'daughter', 'child'].includes(m.relationship));
    if (kids.length < 2) return null;

    // Generate all unique pairs
    const pairs: [FamilyMember, FamilyMember][] = [];
    for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
            pairs.push([kids[i], kids[j]]);
        }
    }

    return (
        <div className="mx-5 mt-6 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <h3 className="font-display text-[9px] tracking-[3px] uppercase mb-3 text-center" style={{ color: '#D4A94E', opacity: 0.6 }}>👫 Sibling Dynamics</h3>
            <div className="space-y-2">
                {pairs.map(([a, b], i) => (
                    <button
                        key={`${a.id}-${b.id}`}
                        onClick={() => onSelectPair(a, b)}
                        className="w-full rounded-[22px] p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-all"
                        style={{
                            background: 'linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)',
                        }}
                    >
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm">{RELATIONSHIP_EMOJI[a.relationship]}</span>
                            <span className="text-xs text-altar-muted">↔</span>
                            <span className="text-sm">{RELATIONSHIP_EMOJI[b.relationship]}</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-altar-text">{a.name} & {b.name}</p>
                            <p className="text-[10px] text-altar-muted" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>Tap to read their sibling bond</p>
                        </div>
                        <span className="text-xs" style={{ color: '#D4A94E', opacity: 0.5 }}>→</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
