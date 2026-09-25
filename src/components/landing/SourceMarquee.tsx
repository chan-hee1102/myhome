const ROW_A = [
  ["LH", "한국토지주택공사"],
  ["SH", "서울주택도시공사"],
  ["GH", "경기주택도시공사"],
  ["HUG", "주택도시보증공사"],
  ["청약홈", "한국부동산원"],
  ["마이홈", "국토교통부"],
];
const ROW_B = [
  "행복주택",
  "국민임대",
  "통합공공임대",
  "매입임대",
  "전세임대",
  "청년안심주택",
  "든든전세",
  "신혼희망타운",
  "공공분양",
  "민영 아파트",
];

/** 기관 이름과 주택 유형이 서로 반대로 흐르는 띠. 복제본은 스크린리더에서 숨긴다 */
export function SourceMarquee() {
  return (
    <section aria-label="공고를 모으는 곳" className="overflow-hidden py-20 md:py-32">
      <p className="t-small text-center text-ash">여기 흩어진 공고를 한곳에서 봐요</p>
      <div className="mask-fade-x group mt-10 flex overflow-hidden">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 animate-[marquee_46s_linear_infinite] items-baseline gap-12 pr-12 group-hover:[animation-play-state:paused] md:gap-20 md:pr-20"
          >
            {ROW_A.map(([k, v]) => (
              <li key={k} className="flex shrink-0 items-baseline gap-3">
                <span className="font-[family-name:var(--font-display)] text-[40px] font-light text-mist md:text-[56px]">{k}</span>
                <span className="t-caption text-dim">{v}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <div className="mask-fade-x mt-6 flex overflow-hidden">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 animate-[marquee_60s_linear_infinite_reverse] items-center gap-2 pr-2">
            {ROW_B.map((t) => (
              <li
                key={t}
                className="inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[14px] font-medium text-ash ring-1 ring-inset ring-line"
              >
                {t}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
