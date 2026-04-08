// const cleanResponse = (text: string) => {
//     const cleanText = text
//         .replace(/```json/g, '')
//         .replace(/```/g, '')
//         .replace(/^[\s\n]+|[\s\n]+$/g, '')

//     return cleanText
// }

export function stripCodeFences(text: string) {
    return text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
}

export function safeParseJSON(text: string, label: string) {
    try {
        return JSON.parse(stripCodeFences(text));
    } catch {
        throw new Error(`Failed to parse ${label} JSON: ${text}`);
    }
}