import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckFlow } from "@/components/check/CheckFlow";
import { pageMeta } from "@/lib/seo";

// 입력 화면은 검색 결과에 올릴 내용이 없다(개인 입력). 링크는 따라가게 둔다.
export const metadata: Metadata = pageMeta({
  title: "자격 확인하기",
  description: "나이·사는 곳·가족·집·소득·재산 여섯 가지를 누르면 지금 신청할 수 있는 청약·공공임대 공고와 예상 순위를 알려 줘요.",
  path: "/check",
  noindex: true,
});

export default function CheckPage() {
  return (
    <Suspense>
      <CheckFlow />
    </Suspense>
  );
}
