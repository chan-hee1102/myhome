"use client";

import { useState } from "react";
import { Odometer } from "@/components/motion/Odometer";
import { isEmptyProfile, useHydrated, useProfile } from "@/lib/profile";
import { computeGajeom, GAJEOM_MAX, gajeomInputsFromProfile } from "@/lib/rules/gajeom";

/** 통장 가입 기간 눈금: 0=통장 없음, 1=6개월 미만, 2=6개월~1년, 3..17 = 1..15년 */
const ACC_MONTHS: (number | null)[] = [null, 0, 6, ...Array.from({ length: 15 }, (_, i) => (i + 1) * 12)];
const accLabel = (i: number) => (i === 0 ? "통장 없음" : i === 1 ? "6개월 미만" : i === 2 ? "6개월~1년" : i === 17 ? "15년 이상" : `${i - 2}년`);
/** 개월 → 눈금 */
const accIndexOf = (m: number | null | undefined) => (m == null ? 0 : m < 6 ? 1 : m < 12 ? 2 : Math.min(17, 2 + Math.floor(m / 12)));
const SHORT: Record<string, string> = { homeless: "무주택", dependents: "부양가족", account: "통장" };
const homeLabel = (v: number) => (v === 0 ? "1년 미만" : v === 15 ? "15년 이상" : `${v}년`);


function Slider({
  id,
  label,
  value,
  max,
  onChange,
  text,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  text: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[15px] font-semibold text-ink">
          {label}
        </label>
        <span className="data text-[15px] text-ink">{text}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        aria-valuetext={text}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-1 w-full"
        style={{ "--pct": `${(value / max) * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}

/**
 * 84칸 눈금자. 1점 = 창 1칸이고, 무주택 32 · 부양가족 35 · 통장 17 세 묶음이 가점표 구조 그대로 놓인다.
 * 값이 바뀌면 새로 켜지거나 꺼지는 칸만 가장자리부터 차례로 움직인다(칸 사이 최대 16ms, 합계 320ms 이하).
 */
function Ruler({ lines }: { lines: { key: string; label: string; points: number; max: number }[] }) {
  // 직전 점수 — 「prop이 바뀔 때 state 조정」 패턴(렌더 중 ref를 읽지 않는다)
  const key = lines.map((l) => l.points).join("|");
  const [snap, setSnap] = useState(() => ({ key, now: Object.fromEntries(lines.map((l) => [l.key, l.points])) as Record<string, number>, was: {} as Record<string, number> }));
  let was0 = snap.was;
  if (snap.key !== key) {
    was0 = snap.now;
    setSnap({ key, now: Object.fromEntries(lines.map((l) => [l.key, l.points])), was: snap.now });
  }
  return (
    <div className="flex gap-3">
      {lines.map((l) => {
        const was = was0[l.key] ?? l.points;
        const lo = Math.min(was, l.points);
        const hi = Math.max(was, l.points);
        const n = hi - lo;
        const gap = n ? Math.min(16, 320 / n) : 0;
        return (
          <div key={l.key} className="min-w-0" style={{ flex: `${l.max} 1 0` }}>
            <div className="text-[13px] font-semibold leading-tight">
              <span className="block truncate text-sub">{l.label}</span>
              <span className="data block text-ink">
                {l.points}
                <span className="text-muted">/{l.max}</span>
              </span>
            </div>
            <div className="mt-1.5 flex h-9 gap-px" role="img" aria-label={`${l.label} ${l.points}점 / ${l.max}점`}>
              {Array.from({ length: l.max }, (_, k) => {
                const on = k < l.points;
                // 켜질 때는 왼쪽부터, 꺼질 때는 오른쪽부터
                const order = k >= lo && k < hi ? (l.points > was ? k - lo : hi - 1 - k) : 0;
                return (
                  <span
                    key={k}
                    className={`block h-full flex-1 origin-bottom rounded-[1.5px] ${on ? "bg-brand" : "bg-well"}`}
                    style={{
                      transform: on ? "scaleY(1)" : "scaleY(0.45)",
                      transition: `transform 200ms cubic-bezier(0.16,1,0.3,1) ${order * gap}ms, background-color 120ms linear ${order * gap}ms`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 가점 84점 계산기 — 랜딩·가이드 공용. 초기값도 서버에서 그려져 HTML에 점수가 들어 있다.
 * 조건을 넣은 사람은 「내 조건으로 채우기」로 결과 화면과 같은 규칙(만 30세·혼인·배우자 통장)의 값을 불러온다.
 */
export function GajeomCalc() {
  const hydrated = useHydrated();
  const { profile } = useProfile();
  const [homeless, setHomeless] = useState(true);
  const [homelessYears, setHomelessYears] = useState(7);
  const [dependents, setDependents] = useState(2);
  const [accIdx, setAccIdx] = useState(8);
  const [spouseMonths, setSpouseMonths] = useState<number | null>(null);
  const [explain, setExplain] = useState<string | null>(null);
  const { total, lines } = computeGajeom({ homeless, homelessYears, dependents, accountMonths: ACC_MONTHS[accIdx], spouseAccountMonths: spouseMonths });
  const canFill = hydrated && !isEmptyProfile(profile);
  const fill = () => {
    const f = gajeomInputsFromProfile(profile);
    setHomeless(f.homeless !== false && !f.notCounting);
    if (f.homelessYears !== undefined) setHomelessYears(Math.max(0, Math.min(15, Math.floor(f.homelessYears))));
    if (f.dependents !== undefined) setDependents(Math.min(6, f.dependents));
    if (f.accountMonths !== undefined) setAccIdx(accIndexOf(f.accountMonths));
    setSpouseMonths(f.spouseAccountMonths ?? null);
    setExplain(f.explain ?? "무주택 기간을 알려주시면 더 정확해요.");
  };

  return (
    <div className="rounded-[4px] bg-page p-5 ring-1 ring-inset ring-line md:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-ink pb-5">
        <div>
          <p className="text-[13px] font-semibold text-sub">{explain ? "내 조건으로 계산한 가점" : "청약 가점"}</p>
          {canFill && !explain && (
            <button type="button" onClick={fill} className="mt-1 text-[14px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              내 조건으로 채우기
            </button>
          )}
        </div>
        <p className="text-ink">
          <span className="t-num-xl text-brand">
            <Odometer value={total} />
          </span>
          <span className="ml-1.5 text-[18px] font-semibold text-muted">/ {GAJEOM_MAX.total}점</span>
        </p>
      </div>

      <div className="mt-5">
        <Ruler lines={lines.map((l) => ({ key: l.key, label: SHORT[l.key] ?? l.label, points: l.points, max: l.max }))} />
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <Slider
            id="gj-homeless"
            label="무주택 기간"
            value={homelessYears}
            max={15}
            onChange={setHomelessYears}
            text={homeless ? homeLabel(homelessYears) : "0점"}
            disabled={!homeless}
          />
          <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2.5 text-[14px] text-body">
            <input type="checkbox" checked={!homeless} onChange={(e) => setHomeless(!e.target.checked)} className="size-5 accent-[#2447d6]" />
            집이 있거나, 만 30세 전이고 결혼하지 않았어요(무주택 0점)
          </label>
        </div>
        <Slider id="gj-dep" label="부양가족(본인 제외)" value={dependents} max={6} onChange={setDependents} text={dependents === 6 ? "6명 이상" : `${dependents}명`} />
        <Slider id="gj-acc" label="청약통장 가입 기간" value={accIdx} max={17} onChange={setAccIdx} text={accLabel(accIdx)} />
        {spouseMonths != null && <p className="t-small -mt-2 text-sub">배우자 통장 가입 기간 점수의 절반(최대 3점)이 더해졌어요.</p>}
      </div>
      {explain && <p className="t-small mt-5 border-t border-line pt-3 font-medium text-ink">{explain}</p>}

      <p className="t-small mt-6 border-t border-line pt-4 text-muted">
        무주택 기간은 만 30세부터 세요. 그 전에 혼인신고를 했다면 혼인신고일부터예요. 만 30세 전이고 미혼이면 0점이에요.
      </p>
    </div>
  );
}
