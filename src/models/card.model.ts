export interface Card {
  id: string;
  name: string;
  description: string;
  image: string;
  meaning: string;
  reversed: string;
  suit: string;
  number?: number;
  element?: string;
  planet?: string;
  zodiac?: string;
}

export interface Reading {
  id: string;
  date: Date;
  cards: Card[];
  question?: string;
  intention?: string;        // Pre-reading intention/manifestation set by user
  manifestationId?: string;  // ID of active manifestation at time of reading
  type: 'daily' | 'custom';
  spread: string;
  theme: string;
}

export interface SpreadType {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: string[];
}
