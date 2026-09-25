import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/**
 * robots.txt — robots.ts 대신 라우트로 만든다. 다음(Daum) 웹마스터도구 소유 확인이
 * robots.txt 안의 주석 줄(#DaumWebMasterTool:…)로 이뤄지는데 robots.ts로는 주석을 낼 수 없기 때문이다.
 * - 생성형 검색·AI 크롤러는 이름을 적어 명시 허용한다(GEO). 일부 크롤러는 자기 이름 규칙만 본다.
 * - 네이버(Yeti)에는 llms.txt를 막는다 — 제목·설명이 없는 텍스트라 서치어드바이저가 「제목 없음」으로 집계한다.
 * - /notice는 막지 않는다. 막으면 크롤러가 noindex를 못 읽고 URL만 색인된다.
 */
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "DuckAssistBot",
  "meta-externalagent",
  "CCBot",
  "cohere-ai",
  "YouBot",
  "Daumoa",
];

export function GET() {
  const lines: string[] = [];
  const daum = process.env.DAUM_WEBMASTER_TOOL;
  if (daum) lines.push(`#DaumWebMasterTool:${daum}`, "");
  if (!SITE.indexable) {
    lines.push("User-agent: *", "Disallow: /", "");
  } else {
    lines.push("User-agent: *", "Allow: /", "Disallow: /api/", "");
    lines.push("User-agent: Yeti", "Allow: /", "Disallow: /api/", "Disallow: /llms.txt", "Disallow: /llms-full.txt", "");
    for (const bot of AI_BOTS) lines.push(`User-agent: ${bot}`, "Allow: /", "Disallow: /api/", "");
    lines.push("User-agent: Bytespider", "Disallow: /", "");
  }
  lines.push(`Sitemap: ${SITE.url}/sitemap.xml`);
  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
