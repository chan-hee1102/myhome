import type { Metadata } from "next";
import { NoticeView } from "@/components/detail/NoticeView";
import { SAMPLE_IDS, sampleAnnouncements } from "@/lib/data/sample";
import { PROGRAMS } from "@/lib/rules/programs";
import { placeText } from "@/lib/place";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return SAMPLE_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/notice/[id]">): Promise<Metadata> {
  const { id } = await params;
  const a = sampleAnnouncements().find((x) => x.id === id);
  if (!a) return { title: "공고", robots: { index: false, follow: true } };
  // 예시 데이터(가상 단지)라 색인하지 않는다. 실제 공고를 연결하면 접수 중·예정 공고만 색인한다.
  return pageMeta({
    title: `${a.complex} ${PROGRAMS[a.program].name}`,
    description: `${placeText(a)} ${a.title} — 내 조건으로 신청 가능 여부와 예상 순위를 확인하세요.`,
    path: `/notice/${a.id}`,
    noindex: SITE.sampleData,
  });
}

export default async function NoticePage({ params }: PageProps<"/notice/[id]">) {
  const { id } = await params;
  return <NoticeView id={id} />;
}
