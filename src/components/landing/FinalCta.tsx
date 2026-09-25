import { LineReveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { br } from "@/lib/text";

export function FinalCta() {
  return (
    <section className="wrap pb-6 md:pb-10">
      <div className="relative overflow-hidden rounded-[28px] bg-brand px-6 py-16 text-center md:px-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 80% at 85% 0%, rgba(255,255,255,0.22), transparent 60%), radial-gradient(50% 70% at 8% 110%, rgba(120,180,255,0.35), transparent 60%)",
          }}
        />
        <div className="relative">
          <h2 className="t-display-l text-white">
            <LineReveal lines={[br("오늘 | 마감하는 공고가"), br("있을지도 몰라요")]} />
          </h2>
          <p className="t-body-l mx-auto mt-5 max-w-[26em] text-white/85">
            {br("로그인도, 이름도 필요 없어요. | 다섯 가지만 누르면 | 바로 보여 드려요.")}
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/check" size="lg" variant="inverse" arrow>
              지금 확인하기
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
