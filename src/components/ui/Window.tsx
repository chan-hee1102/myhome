/**
 * 창 — 청약핏의 유일한 그래픽 단위. 창 1칸은 언제나 공고 1건(또는 가점 1점)이다. 데이터 없는 창은 그리지 않는다.
 *   ok     꽉 찬 창(군청)      신청 가능
 *   maybe  아래 절반(주황)     확인 필요
 *   no     선만               해당 없음
 *   closed 회색 면            접수 마감
 *   off    옅은 선            아직 모름(입력 전)
 */
export type WinState = "ok" | "maybe" | "no" | "closed" | "off";

export const WIN_LABEL: Record<WinState, string> = {
  ok: "신청 가능",
  maybe: "확인 필요",
  no: "해당 없음",
  closed: "접수 마감",
  off: "아직 모름",
};

/** 글자 옆에 붙는 작은 창(10×12). 뱃지·범례·표에 쓴다 */
export function WinGlyph({ state, className = "" }: { state: WinState; className?: string }) {
  const frame = state === "ok" ? "#2447d6" : state === "maybe" ? "#e8930c" : state === "off" ? "#cdd2d9" : "#9aa1ab";
  return (
    <svg viewBox="0 0 10 12" className={`h-3 w-2.5 shrink-0 ${className}`} aria-hidden>
      <rect x="0.75" y="0.75" width="8.5" height="10.5" rx="1" fill={state === "closed" ? "#eff1f4" : "#fff"} stroke={frame} strokeWidth="1.5" />
      {state === "ok" && <rect x="0.75" y="0.75" width="8.5" height="10.5" rx="1" fill="#2447d6" />}
      {state === "maybe" && <rect x="0.75" y="6" width="8.5" height="5.25" rx="0.5" fill="#e8930c" />}
    </svg>
  );
}

/** 범례 한 줄 */
export function WinLegend({ className = "", states = ["ok", "maybe", "no"] }: { className?: string; states?: WinState[] }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-sub ${className}`}>
      {states.map((s) => (
        <li key={s} className="inline-flex items-center gap-1.5">
          <WinGlyph state={s} />
          {WIN_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}
