import { GUIDES, GUIDE_HUB } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 네이버 서치어드바이저 RSS 제출용 — 항목 날짜는 가이드 수정일 */
export function GET() {
  const items = GUIDES.map(
    (g) => `    <item>
      <title>${esc(g.h1)}</title>
      <link>${SITE.url}/guide/${g.slug}</link>
      <guid isPermaLink="true">${SITE.url}/guide/${g.slug}</guid>
      <description>${esc(g.description)}</description>
      <category>${esc(g.category)}</category>
      <pubDate>${new Date(`${g.updated}T09:00:00+09:00`).toUTCString()}</pubDate>
    </item>`,
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(`${SITE.name} 청약 가이드`)}</title>
    <link>${SITE.url}${GUIDE_HUB.path}</link>
    <description>${esc(GUIDE_HUB.description)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date(`${GUIDE_HUB.updated}T09:00:00+09:00`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
