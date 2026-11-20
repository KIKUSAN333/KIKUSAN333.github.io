import { readField } from "./feed-xml";

export const youtubeChannelUrl = "https://www.youtube.com/@KIKUSAN333";

// Videosページのカードに渡す、動画1本分のデータ。
type YouTubeVideo = {
    id: string;
    title: string;
    date: string;
};

// チャンネルページと公開フィードを文字列として取得する。6秒で打ち切る。
async function fetchText(url: string): Promise<string> {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`YouTube returned HTTP ${response.status}`);
    return response.text();
}

export async function getYouTubeVideos(): Promise<YouTubeVideo[]> {
    // チャンネルページのフィードURLやメタデータを順に調べ、UCで始まるIDを取得する。
    const page = await fetchText(youtubeChannelUrl);
    const channelId = page.match(/\/feeds\/videos\.xml\?channel_id=(UC[\w-]{22})(?=["&])/i)?.[1] ??
        page.match(/"externalId"\s*:\s*"(UC[\w-]{22})"/)?.[1] ??
        page.match(/<meta\b[^>]*\bitemprop=["']channelId["'][^>]*\bcontent=["'](UC[\w-]{22})["']/i)?.[1];
    if (!channelId) throw new Error("YouTube channel ID was not found");

    // チャンネルIDを使って公開フィードのXMLを取得し、目的のチャンネルか確認する。
    const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const feedChannelId = readField(xml, "yt:channelId");
    const matchesChannel = feedChannelId === channelId || feedChannelId === channelId.slice(2);
    if (!/<feed\b/.test(xml) || !matchesChannel) {
        throw new Error("Unexpected YouTube channel feed");
    }

    // <entry> が動画1本分に対応する。動画ID、タイトル、公開日を取り出す。
    const videos: YouTubeVideo[] = [];
    for (const [, entry] of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)) {
        const id = readField(entry, "yt:videoId");
        const title = readField(entry, "title");
        const date = readField(entry, "published");
        // カードの表示に必要な項目がそろっている動画だけを一覧に追加する。
        if (!/^[\w-]{11}$/.test(id) || !title || !Number.isFinite(Date.parse(date))) continue;

        videos.push({ id, title, date });
    }

    // 公開日の新しい順に並べ、Videosページに返す。
    return videos.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
