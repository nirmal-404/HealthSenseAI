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