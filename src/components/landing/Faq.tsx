import { FaqList } from "@/components/guide/GuideParts";
import { HOME_FAQ } from "@/lib/faq";
import { SITE } from "@/lib/site";

/** 네이티브 details — 닫혀 있어도 답이 HTML에 있다(AEO). 같은 배열로 FAQPage JSON-LD를 만든다 */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-10 py-20 md:py-32">
      <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div>
          <h2 id="faq-title" className="t-display-l text-pure">
            자주 묻는 질문
          </h2>
          {SITE.sampleData && (
            <p className="t-small mt-8 max-w-[26em] rounded-[20px] p-5 text-ash ring-1 ring-inset ring-line">
              지금은 <span className="text-cloud">예시 공고</span>로 판정을 보여 드리는 단계예요. 공식 API 수집을 연결하면 실제 공고로 바뀌어요. 자격
              기준표와 가이드는 실제 2026년 법령 기준이에요.
            </p>
          )}
        </div>
        <FaqList items={HOME_FAQ} />
      </div>
    </section>
  );
}
