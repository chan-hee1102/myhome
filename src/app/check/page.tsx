import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckFlow } from "@/components/check/CheckFlow";
import { pageMeta } from "@/lib/seo";

// 입력 화면은 검색 결과에 올릴 내용이 없다(개인 입력). 링크는 따라가게 둔다.
export const metadata: Metadata = pageMeta({
  title: "내 조건 넣기",
  description: "다섯 가지만 답하면 지금 신청할 수 있는 청약·공공임대 공고와 예상 순위를 찾아드려요.",
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
