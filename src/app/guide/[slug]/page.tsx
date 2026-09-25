import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockView, Breadcrumbs, CheckCta, FaqList, RelatedGuides } from "@/components/guide/GuideParts";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { JsonLd } from "@/components/seo/JsonLd";
import { GUIDES, GUIDE_HUB, getGuide } from "@/lib/guides";
import { graph, guideNodes } from "@/lib/jsonld";
import { pageMeta } from "@/lib/seo";
import { br } from "@/lib/text";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return pageMeta({ title: g.title, description: g.description, path: `/guide/${g.slug}`, type: "article", modified: g.updated });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  return (
    <>
      <SiteNav />
      <JsonLd data={graph(guideNodes(g))} />
      <main className="wrap pb-20 pt-24 md:pb-28 md:pt-32">
        <Breadcrumbs items={[{ name: "홈", href: "/" }, { name: "청약 가이드", href: GUIDE_HUB.path }, { name: g.short }]} />

        <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
          <article className="min-w-0">
            <header>
              <p className="eyebrow">{g.category}</p>
              <h1 className="t-display-l mt-3">{br(g.h1.replace(" (", " | ("))}</h1>
              <p id="answer" className="t-body-l mt-5 max-w-[38em] text-body">
                {br(g.answer)}
              </p>
              <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="핵심 기준">
                {g.facts.map((f) => (
                  <li key={f} className="inline-flex h-8 items-center rounded-full bg-brand-soft px-3 text-[13px] font-semibold text-brand-ink">
                    {f}
                  </li>
                ))}
              </ul>
              <p className="t-small mt-6 flex max-w-[44em] flex-wrap gap-x-3 gap-y-1 rounded-[14px] bg-wash px-4 py-3 text-sub">
                <span className="whitespace-nowrap">
                  <span className="font-semibold text-ink">기준일</span> 소득 2026-01-01 이후 공고
                </span>
                <span className="whitespace-nowrap">자산 2026-02-27 이후 공고</span>
                <span className="whitespace-nowrap">
                  <span className="font-semibold text-ink">최종 확인</span> <time dateTime={g.updated}>{g.updated}</time>
                </span>
                <span className="whitespace-nowrap">공고문의 값이 우선합니다</span>
              </p>
              {g.pending && (
                <p className="t-small mt-3 max-w-[44em] rounded-[14px] bg-maybe-soft px-4 py-3 text-maybe-ink">
                  {g.pending}
                </p>
              )}
            </header>

            {g.sections.map((s) => (
              <section key={s.id} id={s.id} className="mt-14 scroll-mt-24 md:mt-16">
                <h2 className="t-display-s">{br(s.h2)}</h2>
                {s.blocks.map((b, i) => (
                  <BlockView key={i} b={b} />
                ))}
              </section>
            ))}

            {g.faq.length > 0 && (
              <section id="faq" className="mt-14 scroll-mt-24 md:mt-16">
                <h2 className="t-display-s">자주 묻는 질문</h2>
                <div className="mt-5">
                  <FaqList items={g.faq} />
                </div>
              </section>
            )}

            <section id="sources" className="mt-14 md:mt-16">
              <h2 className="t-title text-ink">출처</h2>
              <ol className="mt-4 space-y-2">
                {g.sources.map((s) => (
                  <li key={s.url} className="t-small text-sub">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-ghost underline-offset-4 hover:text-brand hover:decoration-brand">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
              <p className="t-small mt-6 max-w-[44em] text-muted">
                이 페이지는 법령·고시·공급기관 안내를 바탕으로 정리한 참고 자료입니다. 단지마다 공고문에서 기준을 바꿀 수 있으니, 신청 전에 반드시 입주자 모집공고문을 확인하세요.
                판정·계산은 규칙에 따른 계산이며 최종 자격은 공급기관 심사로 정해집니다.
              </p>
            </section>

            <div className="mt-12 lg:hidden">
              <CheckCta />
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <nav aria-label="목차" className="rounded-[20px] bg-wash p-5">
                <p className="t-caption font-semibold text-muted">이 페이지에서</p>
                <ol className="mt-3 space-y-2">
                  {g.sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="t-small block text-sub hover:text-brand">
                        {s.h2}
                      </a>
                    </li>
                  ))}
                  {g.faq.length > 0 && (
                    <li>
                      <a href="#faq" className="t-small block text-sub hover:text-brand">
                        자주 묻는 질문
                      </a>
                    </li>
                  )}
                </ol>
              </nav>
              <CheckCta compact />
            </div>
          </aside>
        </div>

        <section className="mt-20 md:mt-28">
          <h2 className="t-display-s">함께 보면 좋은 기준</h2>
          <div className="mt-8">
            <RelatedGuides slugs={g.related} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
