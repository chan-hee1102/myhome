/**
 * 모션 규격 — 이 파일의 값만 쓴다.
 *   지속시간 3단계 · 이징 3종(등장 out / 이동 move / 퇴장 exit) · 스프링 2종 · 스태거 3종 · 등장 거리 3종
 * 원칙: 헤드라인·핵심 숫자는 SSR부터 보이게 둔다(등장 모션은 그래픽에만). 한 화면에 주인공 모션은 하나.
 * transform·opacity·pathLength만 움직이고, 무한 반복은 쓰지 않는다. 스크롤 모션은 useReducedMotion으로 정적판을 둔다.
 */
export const DUR = { fast: 0.16, base: 0.32, slow: 0.64 } as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  move: [0.65, 0, 0.35, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export const SPRING = {
  /** 탭·칩·토글·숫자 */
  ui: { type: "spring", stiffness: 520, damping: 38, mass: 0.9 },
  /** 물체가 자리에 앉기 */
  land: { type: "spring", stiffness: 260, damping: 26 },
} as const;

export const STAGGER = { micro: 0.024, list: 0.04, beat: 0.11 } as const;

/** 등장 거리(px). 32 이상은 쓰지 않는다 */
export const RISE = { micro: 8, card: 16, hero: 24 } as const;
