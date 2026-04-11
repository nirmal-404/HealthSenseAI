export function extractTextContent(
    content: string | any[]
): string {
    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
        return content
            .map((c) => {
                if (typeof c === "string") return c;
                if (c?.text) return c.text;
                return "";
            })
            .join("");
    }

    return "";
}