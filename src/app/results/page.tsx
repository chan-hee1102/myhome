import type { Metadata } from "next";
import { ResultsView } from "@/components/results/ResultsView";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "내 공고 판정 결과",
  description: "입력한 조건으로 판정한 청약·공공임대 공고 목록",
  path: "/results",
  noindex: true,
});

export default function ResultsPage() {
  return <ResultsView />;
}
