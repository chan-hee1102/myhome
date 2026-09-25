import { GUIDE_HUB } from "@/lib/guides";
import { renderOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = GUIDE_HUB.h1;

export default function Image() {
  return renderOg({
    eyebrow: "청약 가이드",
    title: GUIDE_HUB.h1,
    facts: ["소득·자산 기준표", "유형별 자격 10종", "특별공급 4종"],
    footer: `최종 확인 ${GUIDE_HUB.updated}`,
  });
}
