import { SITE } from "@/lib/site";
import { br } from "@/lib/text";

/** 예시 데이터 단계에서만 보이는 안내. 실제 공고로 오해하지 않게 공고 화면마다 붙인다 */
export function SampleNotice() {
  if (!SITE.sampleData) return null;
  return (
    <p className="t-small flex items-start gap-2.5 rounded-[12px] bg-maybe/[0.07] px-4 py-3 text-maybe ring-1 ring-inset ring-maybe/25">
      <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-maybe" />
      <span>
        {br("지금은 예시 공고로 판정을 보여 드리고 있어요. | 단지 이름과 일정은 실제가 아니고, | 판정 기준은 2026년 법령·지침 값이에요.")}
      </span>
    </p>
  );
}
