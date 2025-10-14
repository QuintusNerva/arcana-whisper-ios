import { Card, Reading, SpreadType } from '../models/card.model';

export class TarotService {
    private cards: Card[] = [
        // Major Arcana
        {
            id: 'fool',
            name: 'The Fool',
            description: 'New beginnings, innocence, spontaneity',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Fool represents new beginnings, innocence, and spontaneity. It encourages you to take a leap of faith and embrace new opportunities.',
            reversed: 'Recklessness, lack of direction, fear of change',
            suit: 'Major Arcana',
            number: 0,
            element: 'Air',
            planet: 'Uranus'
        },
        {
            id: 'magician',
            name: 'The Magician',
            description: 'Manifestation, willpower, skill',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Magician represents manifestation, willpower, and the ability to turn dreams into reality through focused action.',
            reversed: 'Manipulation, lack of focus, untapped potential',
            suit: 'Major Arcana',
            number: 1,
            element: 'Air',
            planet: 'Mercury'
        },
        {
            id: 'high_priestess',
            name: 'The High Priestess',
            description: 'Intuition, mystery, subconscious',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The High Priestess represents intuition, mystery, and the power of the subconscious mind.',
            reversed: 'Hidden agendas, lack of inner voice, secrets',
            suit: 'Major Arcana',
            number: 2,
            element: 'Water',
            planet: 'Moon'
        },
        {
            id: 'empress',
            name: 'The Empress',
            description: 'Fertility, abundance, nature',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Empress represents fertility, abundance, and the nurturing power of nature.',
            reversed: 'Dependency, smothering, lack of growth',
            suit: 'Major Arcana',
            number: 3,
            element: 'Earth',
            planet: 'Venus'
        },
        {
            id: 'emperor',
            name: 'The Emperor',
            description: 'Authority, structure, leadership',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Emperor represents authority, structure, and strong leadership qualities.',
            reversed: 'Tyranny, rigidity, abuse of power',
            suit: 'Major Arcana',
            number: 4,
            element: 'Fire',
            planet: 'Aries'
        },
        {
            id: 'hierophant',
            name: 'The Hierophant',
            description: 'Tradition, spirituality, teaching',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Hierophant represents tradition, spirituality, and the role of teacher or spiritual guide.',
            reversed: 'Rebellion, unconventional beliefs, personal spirituality',
            suit: 'Major Arcana',
            number: 5,
            element: 'Earth',
            planet: 'Taurus'
        },
        {
            id: 'lovers',
            name: 'The Lovers',
            description: 'Love, relationships, choices',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Lovers represent love, relationships, and important choices in life.',
            reversed: 'Imbalance, poor choices, disharmony',
            suit: 'Major Arcana',
            number: 6,
            element: 'Air',
            planet: 'Gemini'
        },
        {
            id: 'chariot',
            name: 'The Chariot',
            description: 'Determination, control, victory',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Chariot represents determination, control, and the ability to overcome obstacles.',
            reversed: 'Lack of control, direction, defeat',
            suit: 'Major Arcana',
            number: 7,
            element: 'Water',
            planet: 'Cancer'
        },
        {
            id: 'strength',
            name: 'Strength',
            description: 'Courage, inner strength, patience',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'Strength represents courage, inner strength, and the power of patience and compassion.',
            reversed: 'Weakness, self-doubt, lack of self-control',
            suit: 'Major Arcana',
            number: 8,
            element: 'Fire',
            planet: 'Leo'
        },
        {
            id: 'hermit',
            name: 'The Hermit',
            description: 'Soul-searching, introspection, guidance',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Hermit represents soul-searching, introspection, and the search for inner wisdom.',
            reversed: 'Isolation, loneliness, withdrawal',
            suit: 'Major Arcana',
            number: 9,
            element: 'Earth',
            planet: 'Virgo'
        },
        {
            id: 'wheel_of_fortune',
            name: 'Wheel of Fortune',
            description: 'Change, cycles, destiny',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Wheel of Fortune represents change, cycles, and the turning of fate.',
            reversed: 'Bad luck, resistance to change, external control',
            suit: 'Major Arcana',
            number: 10,
            element: 'Fire',
            planet: 'Jupiter'
        },
        {
            id: 'justice',
            name: 'Justice',
            description: 'Fairness, truth, balance',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'Justice represents fairness, truth, and the need for balance in all things.',
            reversed: 'Unfairness, lack of accountability, dishonesty',
            suit: 'Major Arcana',
            number: 11,
            element: 'Air',
            planet: 'Libra'
        },
        {
            id: 'hanged_man',
            name: 'The Hanged Man',
            description: 'Sacrifice, waiting, new perspective',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Hanged Man represents sacrifice, waiting, and gaining a new perspective on life.',
            reversed: 'Stalling, needless sacrifice, fear of sacrifice',
            suit: 'Major Arcana',
            number: 12,
            element: 'Water',
            planet: 'Neptune'
        },
        {
            id: 'death',
            name: 'Death',
            description: 'Endings, transformation, rebirth',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'Death represents endings, transformation, and the natural cycle of life.',
            reversed: 'Resistance to change, stagnation, fear of change',
            suit: 'Major Arcana',
            number: 13,
            element: 'Water',
            planet: 'Scorpio'
        },
        {
            id: 'temperance',
            name: 'Temperance',
            description: 'Balance, moderation, patience',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'Temperance represents balance, moderation, and the art of patience.',
            reversed: 'Imbalance, excess, lack of long-term vision',
            suit: 'Major Arcana',
            number: 14,
            element: 'Fire',
            planet: 'Sagittarius'
        },
        {
            id: 'devil',
            name: 'The Devil',
            description: 'Bondage, materialism, temptation',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Devil represents bondage, materialism, and the temptations that hold us back.',
            reversed: 'Breaking free, overcoming addiction, reclaiming power',
            suit: 'Major Arcana',
            number: 15,
            element: 'Earth',
            planet: 'Capricorn'
        },
        {
            id: 'tower',
            name: 'The Tower',
            description: 'Sudden change, revelation, awakening',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Tower represents sudden change, revelation, and the destruction of false foundations.',
            reversed: 'Avoiding disaster, fear of change, internal transformation',
            suit: 'Major Arcana',
            number: 16,
            element: 'Fire',
            planet: 'Mars'
        },
        {
            id: 'star',
            name: 'The Star',
            description: 'Hope, inspiration, guidance',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Star represents hope, inspiration, and guidance in dark times.',
            reversed: 'Hopelessness, faithlessness, lack of inspiration',
            suit: 'Major Arcana',
            number: 17,
            element: 'Air',
            planet: 'Aquarius'
        },
        {
            id: 'moon',
            name: 'The Moon',
            description: 'Illusion, fear, subconscious',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Moon represents illusion, fear, and the power of the subconscious mind.',
            reversed: 'Releasing fear, repressed emotion, inner confusion',
            suit: 'Major Arcana',
            number: 18,
            element: 'Water',
            planet: 'Pisces'
        },
        {
            id: 'sun',
            name: 'The Sun',
            description: 'Joy, success, vitality',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The Sun represents joy, success, and the vitality of life.',
            reversed: 'Negativity, depression, lack of success',
            suit: 'Major Arcana',
            number: 19,
            element: 'Fire',
            planet: 'Sun'
        },
        {
            id: 'judgement',
            name: 'Judgement',
            description: 'Rebirth, absolution, awakening',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'Judgement represents rebirth, absolution, and spiritual awakening.',
            reversed: 'Lack of self-awareness, self-doubt, self-criticism',
            suit: 'Major Arcana',
            number: 20,
            element: 'Fire',
            planet: 'Pluto'
        },
        {
            id: 'world',
            name: 'The World',
            description: 'Completion, accomplishment, travel',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop',
            meaning: 'The World represents completion, accomplishment, and the fulfillment of goals.',
            reversed: 'Incompletion, lack of closure, fear of success',
            suit: 'Major Arcana',
            number: 21,
            element: 'Earth',
            planet: 'Saturn'
        }
    ];

    private spreads: SpreadType[] = [
        {
            id: 'single',
            name: 'Single Card',
            description: 'A simple one-card reading for daily guidance',
            cardCount: 1,
            positions: ['Guidance']
        },
        {
            id: 'three-card',
            name: 'Three Card Spread',
            description: 'Past, Present, Future reading',
            cardCount: 3,
            positions: ['Past', 'Present', 'Future']
        },
        {
            id: 'celtic-cross',
            name: 'Celtic Cross',
            description: 'A comprehensive ten-card reading',
            cardCount: 10,
            positions: ['Situation', 'Challenge', 'Past', 'Future', 'Above', 'Below', 'Advice', 'External', 'Hopes/Fears', 'Outcome']
        }
    ];

    getDailyReading(): Reading {
        const shuffledCards = this.shuffleCards();
        const card = shuffledCards[0];
        
        return {
            id: Date.now().toString(),
            date: new Date(),
            cards: [card],
            type: 'daily',
            spread: 'single',
            theme: 'general'
        };
    }

    getCustomReading(spreadType: string, theme: string, question?: string): Reading {
        const spread = this.spreads.find(s => s.id === spreadType);
        if (!spread) {
            throw new Error('Invalid spread type');
        }

        const shuffledCards = this.shuffleCards();
        const selectedCards = shuffledCards.slice(0, spread.cardCount);

        return {
            id: Date.now().toString(),
            date: new Date(),
            cards: selectedCards,
            question,
            type: 'custom',
            spread: spreadType,
            theme: theme as any
        };
    }

    getAllCards(): Card[] {
        return [...this.cards];
    }

    getAvailableSpreads(): SpreadType[] {
        return [...this.spreads];
    }
    
    getSavedReadings(): Reading[] {
        try {
            const saved = localStorage.getItem('tarot_readings');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved readings:', error);
            return [];
        }
    }

    saveReading(reading: Reading): void {
        try {
            const saved = this.getSavedReadings();
            saved.unshift(reading);
            // Keep only the last 50 readings
            if (saved.length > 50) {
                saved.splice(50);
            }
            localStorage.setItem('tarot_readings', JSON.stringify(saved));
        } catch (error) {
            console.error('Error saving reading:', error);
        }
    }

    private shuffleCards(): Card[] {
        const shuffled = [...this.cards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}