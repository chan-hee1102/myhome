import { SITE } from "@/lib/site";
import { br } from "@/lib/text";

/** 예시 데이터 단계에서만 보이는 안내. 실제 공고로 오해하지 않게 공고 화면마다 붙인다 */
export function SampleNotice() {
  if (!SITE.sampleData) return null;
  return (
    <p className="t-small flex items-start gap-2.5 rounded-[14px] bg-maybe-soft px-4 py-3 text-maybe-ink">
      <svg viewBox="0 0 16 16" className="mt-[3px] size-4 shrink-0" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.18" />
        <path d="M8 4.5v4.2M8 11.2v.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      <span>
        {br("지금은 예시 공고로 보여 드리고 있어요. | 단지 이름과 일정은 실제가 아니고, | 자격 기준은 2026년 법령 값이에요.")}
      </span>
    </p>
  );
}
