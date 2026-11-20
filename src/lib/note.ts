import { decodeEntities, readField } from "./feed-xml";

export const noteUrl = "https://note.com/kikusan333";

// RSSから取り出し、Blogページの記事カードに渡すデータ。
type NoteArticle = {
    title: string;
    date: string;
    summary: string;
    path: string;
    image?: string;
};

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
