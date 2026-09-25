import { renderOg, OG_SIZE } from "@/lib/og";
import { SITE } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${SITE.name} — 내 조건에 맞는 청약·공공임대 공고와 예상 순위`;

export default function Image() {
  return renderOg({
    eyebrow: "청약 자격 판정",
    title: "신청할 수 있는 청약만, 1분 만에 추려 드립니다",
    facts: ["행복주택·국민임대", "공공분양·민영", "가점 84점 계산"],
    footer: "2026년 법령 기준 · 무료",
  });
}
