// XMLやHTMLで使う文字参照（&amp; や &#12354; など）を元の文字に戻す。
export function decodeEntities(value: string): string {
    const entities: Record<string, string> = {
        amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    };
    return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key: string) => {
        if (!key.startsWith("#")) return entities[key] ?? entity;
        const hex = key[1]?.toLowerCase() === "x";
        const codePoint = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
        return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    });
}

// 記事1件のXMLから、指定したタグの中身を取り出す。
// CDATAは中身をそのまま扱うための囲みなので、ここでは囲みだけ外す。
export function readField(item: string, tag: string): string {
    const value = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))?.[1].trim() ?? "";
    return value.startsWith("<![CDATA[") && value.endsWith("]]>") ? value.slice(9, -3).trim() : decodeEntities(value);
}
