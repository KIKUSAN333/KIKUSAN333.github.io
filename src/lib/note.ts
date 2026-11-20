export const noteUrl = "https://note.com/kikusan333";

// RSSから取り出し、Blogページの記事カードに渡すデータ。
type NoteArticle = {
    title: string;
    date: string;
    summary: string;
    path: string;
    image?: string;
};

// XMLやHTMLで使う文字参照（&amp; や &#12354; など）を元の文字に戻す。
function decodeEntities(value: string): string {
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
function readField(item: string, tag: string): string {
    const value = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))?.[1].trim() ?? "";
    return value.startsWith("<![CDATA[") && value.endsWith("]]>") ? value.slice(9, -3).trim() : decodeEntities(value);
}

export async function getNoteArticles(): Promise<NoteArticle[]> {
    // noteの公開RSSを取得する。6秒以内に応答を読み取れなければ中断する。
    const response = await fetch(`${noteUrl}/rss`, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`note RSS returned HTTP ${response.status}`);

    const xml = await response.text();
    if (!/<rss\b/.test(xml)) throw new Error("Invalid note RSS response");

    // <item> が記事1件に対応する。各記事から表示に必須の項目を取り出す。
    const articles: NoteArticle[] = [];
    for (const [, item] of xml.matchAll(/<item(?:\s[^>]*)?>((?:<!\[CDATA\[[\s\S]*?\]\]>|<(?!\/item>|!\[CDATA\[)|[^<])*?)<\/item>/g)) {
        const title = readField(item, "title");
        const link = readField(item, "link");
        const path = link.startsWith(`${noteUrl}/`) ? link.slice(noteUrl.length + 1).split(/[?#]/)[0] : "";
        const published = new Date(readField(item, "pubDate"));
        
        // タイトル・このアカウントの記事リンク・有効な公開日がそろった記事を使う。
        if (!title || !/^n\/[\w-]+$/.test(path) || !Number.isFinite(published.getTime())) continue;

        // 概要からHTMLタグを取り除き、サムネイルはタグの中身かurl属性から取得する。
        const summary = decodeEntities(readField(item, "description").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
        const thumbnail = readField(item, "media:thumbnail") || decodeEntities(item.match(/<media:thumbnail\s[^>]*?\burl=["']([^"']+)["']/)?.[1] ?? "");

        // 公開日を日本時間の YYYY-MM-DD にそろえ、カード用のデータにまとめる。
        articles.push({
            title,
            path,
            date: published.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }),
            summary: summary.length > 150 ? `${summary.slice(0, 150)}…` : summary,
            image: /^https:\/\//i.test(thumbnail) ? thumbnail : undefined,
        });
    }

    // 有効な記事があれば新しい日付順に返す。0件ならビルドにエラーを伝える。
    if (articles.length === 0) throw new Error("No articles found in note RSS");
    return articles.sort((a, b) => b.date.localeCompare(a.date));
}
