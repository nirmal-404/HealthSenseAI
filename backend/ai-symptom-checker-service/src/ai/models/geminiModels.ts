import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CONFIG } from "../../config/envConfig"

export const extractionModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: CONFIG.GEMINI_API_KEY,
    temperature: 0,
    maxOutputTokens: 512,
});

export const analysisModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: CONFIG.GEMINI_API_KEY,
    temperature: 0.3,
    maxOutputTokens: 1024,
});