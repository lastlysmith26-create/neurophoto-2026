const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

if (!process.env.GEMINI_API_KEY) {
    console.error("No GEMINI_API_KEY found");
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
    try {
        const response = await genAI.models.list();
        // Filter for image generation if possible, or just print all
        console.log("Models:", JSON.stringify(response, null, 2));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

list();
