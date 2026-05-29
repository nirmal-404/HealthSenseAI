import { GoogleGenerativeAI } from '@google/generative-ai'
import { CONFIG } from "../config/envConfig";

const ai = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY)

export default async function AiGenerate(systemPrompt: string, userData: any) {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = makePrompt(systemPrompt, userData)

    const aiResult = await model.generateContent(prompt)

    const text =
        aiResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let response = cleanResponse(text)
    const parsed = JSON.parse(response)

    return parsed
}

const makePrompt = (systemPrompt: string, userData: any) => {
    return `
    ${systemPrompt}
    User Data: ${JSON.stringify(userData, null, 2)}
    `
}

const cleanResponse = (text: string) => {
    const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[\s\n]+|[\s\n]+$/g, '')

    return cleanText
}