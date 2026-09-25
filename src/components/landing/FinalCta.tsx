import { LineReveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { br } from "@/lib/text";

export function FinalCta() {
  return (
    <section className="wrap-wide pb-2 md:pb-4">
      <div className="relative overflow-hidden rounded-[28px] bg-abyss px-5 py-24 text-center md:px-16 md:py-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 70% at 50% 115%, rgba(64,138,193,0.75), rgba(26,71,136,0.45) 40%, rgba(9,10,11,0) 75%)",
          }}
        />
        <div aria-hidden className="grain pointer-events-none absolute inset-0" />
        <div className="relative">
          <h2 className="t-display-l text-pure md:text-[76px]">
            <LineReveal lines={[br("오늘 | 마감하는 공고가"), br("있을지도 몰라요")]} />
          </h2>
          <p className="t-body-l mx-auto mt-6 max-w-[26em] text-cloud/80">
            {br("로그인도, 이름도 필요 없어요. | 다섯 가지만 누르면 | 바로 보여 드려요.")}
          </p>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/check" size="lg" arrow>
              내 조건 넣기
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
