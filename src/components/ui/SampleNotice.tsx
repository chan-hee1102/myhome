import { SITE } from "@/lib/site";

/** 예시 데이터 단계에서만 보이는 한 줄 안내. 실제 공고로 오해하지 않게 공고 화면마다 붙인다 */
export function SampleNotice() {
  if (!SITE.sampleData) return null;
  return (
    <p className="border-y border-line py-2.5 text-[15px] leading-relaxed text-sub">
      <span className="mr-2 inline-flex h-6 items-center rounded-[4px] bg-page px-2 text-[14px] md:text-[15px] font-semibold text-sub ring-1 ring-inset ring-line-strong">예시</span>
      단지 이름과 일정은 실제가 아니고, 자격 기준은 2026년 법령 값이에요.
    </p>
  );
}
