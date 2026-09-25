import { GUIDES, GUIDE_HUB } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** llms-full.txt — 모든 가이드의 답변 문장·표·FAQ를 마크다운 한 파일로 */
export function GET() {
  const md: string[] = [
    `# ${SITE.name} — 2026 청약·공공임대 자격 기준 전문`,
    "",
    `> ${GUIDE_HUB.answer}`,
    "",
    `확인일: ${GUIDE_HUB.updated}. 공고문이 이 문서보다 우선합니다. 판정은 규칙 계산이며 AI 추정이 아닙니다.`,
    "",
  ];
  for (const g of GUIDES) {
    md.push(`## ${g.h1}`, "", `출처 URL: ${SITE.url}/guide/${g.slug} (최종 확인 ${g.updated})`, "", g.answer, "");
    if (g.pending) md.push(`> 확인 중: ${g.pending}`, "");
    for (const s of g.sections) {
      md.push(`### ${s.h2}`, "");
      for (const b of s.blocks) {
        if (b.t === "p" || b.t === "note") md.push(b.text, "");
        if (b.t === "ul") md.push(...b.items.map((i) => `- ${i}`), "");
        if (b.t === "table") {
          const t = b.table;
          md.push(`**${t.caption}**`, "", `| ${t.head.join(" | ")} |`, `| ${t.head.map(() => "---").join(" | ")} |`);
          md.push(...t.rows.map((r) => `| ${r.join(" | ")} |`), "");
          if (t.note) md.push(`_${t.note}_`, "");
        }
      }
    }
    if (g.faq.length) {
      md.push("### 자주 묻는 질문", "");
      for (const f of g.faq) md.push(`**Q. ${f.q}**`, "", `A. ${f.a}`, "");
    }
    md.push("출처: " + g.sources.map((s) => `${s.label} (${s.url})`).join("; "), "", "---", "");
  }
  return new Response(md.join("\n"), {
    headers: { "content-type": "text/markdown; charset=utf-8", "x-robots-tag": "noindex" },
  });
}
