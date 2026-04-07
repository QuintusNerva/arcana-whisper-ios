
import { TarotService } from './src/services/tarot.service';
import { Card } from './src/models/card.model';

// Mock AI Service Logic (since we don't have API key in this script)
const mockAI = {
    generateInterpretation: async () => "AI GENERATED RESPONSE"
};

// Hack to replace private property for testing
TarotService.prototype['aiService'] = mockAI as any;

const service = new TarotService();

// Mock Cards
const cards: Card[] = [
    { id: '1', name: 'Fool', description: 'Beginnings', meaning: 'Start now', image: '', reversed: '', suit: '', number: 0 },
    { id: '2', name: 'Magician', description: 'Power', meaning: 'Use it', image: '', reversed: '', suit: '', number: 1 },
    { id: '3', name: 'Priestess', description: 'Mystery', meaning: 'Look within', image: '', reversed: '', suit: '', number: 2 }
];

async function runTest() {
    console.log("--- STARTING PREMIUM GATE TEST ---");

    // 1. Test Premium User
    const premiumResult = await service.getAIInterpretation(cards, 'three-card', 'general', true, 'Question');
    console.log(`PREMIUM RESULT: ${premiumResult}`);
    if (premiumResult === "AI GENERATED RESPONSE") {
        console.log("✅ PASS: Premium user got AI response");
    } else {
        console.log("❌ FAIL: Premium user did not get AI response");
    }

    // 2. Test Free User
    const freeResult = await service.getAIInterpretation(cards, 'three-card', 'general', false, 'Question');
    console.log(`FREE RESULT: ${freeResult.substring(0, 50)}...`);
    if (freeResult.includes("Your reading regarding")) {
        console.log("✅ PASS: Free user got template fallback");
    } else {
        console.log("❌ FAIL: Free user got unexpected response");
    }

    console.log("--- TEST COMPLETE ---");
}

runTest();
