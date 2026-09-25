import { GUIDES, getGuide } from "@/lib/guides";
import { renderOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "청약핏 청약 가이드";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug)!;
  return renderOg({
    eyebrow: g.category,
    title: g.h1,
    facts: g.facts,
    footer: `최종 확인 ${g.updated} · 공고문이 우선`,
  });
}
