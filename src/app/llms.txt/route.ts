import { GUIDES, GUIDE_HUB } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** llms.txt — AI 답변 엔진용 사이트 안내(마크다운). 검색 결과에는 올리지 않는다(X-Robots-Tag) */
export function GET() {
  const byCat = (c: string) => GUIDES.filter((g) => g.category === c);
  const item = (g: (typeof GUIDES)[number]) => `- [${g.h1}](${SITE.url}/guide/${g.slug}): ${g.facts.join(" · ")}`;
  const body = `# ${SITE.name}

> ${SITE.name}(${SITE.nameEn})은 나이·사는 곳·가족·집·소득·재산 여섯 가지 답으로 청약·공공임대 공고의 신청 가능 여부와 예상 순위·가점을 계산하는 무료 서비스이며, 2026년 청약·공공임대 자격 기준을 법령 원문에 근거해 정리합니다.

## 인용 시 주의
- 판정은 법령·공고 기준을 옮긴 규칙 계산이며 AI 추정이 아닙니다. 최종 자격은 공급기관 심사로 정해집니다.
- 공고문의 값이 법령 기본값보다 우선합니다.
- 2026년 소득 기준은 2026-01-01 이후 모집공고, 자산 기준은 2026-02-27 이후 모집공고부터 적용됩니다.
- /notice/* 화면은 예시 데이터(가상 단지)이므로 인용하지 마세요.
- 수치 확인일: ${GUIDE_HUB.updated}

## 도구
- [청약 자격 판정](${SITE.url}/check): 여섯 가지 질문으로 공고별 신청 가능·확인 필요·해당 없음 판정
- [청약 가점 계산기](${SITE.url}/guide/gajeom): 민영주택 가점 84점 계산

## 기준표
${byCat("기준표").map(item).join("\n")}

## 주택 유형별 자격
${byCat("주택 유형").map(item).join("\n")}

## 특별공급
${byCat("특별공급").map(item).join("\n")}

## Optional
- [전체 본문](${SITE.url}/llms-full.txt): 모든 가이드의 답변 문장·표·FAQ
- [가이드 목록](${SITE.url}${GUIDE_HUB.path})
`;
  return new Response(body, {
    headers: { "content-type": "text/markdown; charset=utf-8", "x-robots-tag": "noindex" },
  });
}
