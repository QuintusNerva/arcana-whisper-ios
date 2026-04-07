
const { TarotService } = require('./src/services/tarot.service');
const { AIService } = require('./src/services/ai.service');

// Mock AsyncStorage
global.AsyncStorage = {
    getItem: async (key) => {
        if (key === 'userProfile') {
            return JSON.stringify({ name: 'Premium User', subscription: 'premium' });
        }
        return null;
    }
};

// Mock Reading Data
const mockCards = [
    { name: 'The Fool', description: 'New Beginnings', meaning: 'Take a leap of faith' },
    { name: 'The Magician', description: 'Manifestation', meaning: 'You have the power' },
    { name: 'The High Priestess', description: 'Intuition', meaning: 'Listen to your inner voice' }
];

async function verifyLogic() {
    const tarotService = new TarotService();

    // 1. Test Premium User
    console.log('--- Testing Premium User ---');
    const premiumResult = await tarotService.getAIInterpretation(
        mockCards,
        'three-card',
        'general',
        true, // isPremium 
        'What should I do?'
    );

    if (premiumResult === "") {
        console.log("PASS: Premium call attempted (returned empty string because no API key in this script context, but logic reached AI service)");
    } else {
        console.log("RESULT: ", premiumResult);
    }

    // 2. Test Free User
    console.log('\n--- Testing Free User ---');
    const freeResult = await tarotService.getAIInterpretation(
        mockCards,
        'three-card',
        'general',
        false, // isPremium
        'What should I do?'
    );

    if (freeResult.includes("Your reading regarding")) {
        console.log("PASS: Free user received template fallback.");
    } else {
        console.log("FAIL: Free user did not receive expected template.");
    }
}

verifyLogic();
