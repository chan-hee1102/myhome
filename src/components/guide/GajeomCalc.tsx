"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { computeGajeom } from "@/lib/rules/gajeom";

function Slider({
  label,
  value,
  max,
  onChange,
  format,
  ink,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  ink: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className={`text-[15px] ${ink ? "text-black/75" : "text-mist"}`}>{label}</span>
        <span className={`data text-[14px] ${ink ? "text-void" : "text-pure"}`}>{format(value)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${ink ? "range-ink" : "range-light"} mt-3 w-full`}
        style={{ "--pct": `${(value / max) * 100}%` } as React.CSSProperties}
      />
    </label>
  );
}

const years = (v: number) => (v === 0 ? "1년 미만" : v === 15 ? "15년 이상" : `${v}년`);

/**
 * 가점 84점 계산기. 은색 카드(랜딩, ink)와 어두운 카드(가이드, light) 두 톤.
 * 초기값도 서버에서 그려져 HTML에 점수가 들어 있다.
 */
export function GajeomCalc({ tone = "light" }: { tone?: "ink" | "light" }) {
  const [homelessYears, setHomelessYears] = useState(7);
  const [dependents, setDependents] = useState(2);
  const [accountYears, setAccountYears] = useState(6);
  const { total, lines } = computeGajeom({ homeless: true, homelessYears, dependents, accountMonths: accountYears * 12 });
  const ink = tone === "ink";
  return (
    <div className={`rounded-[24px] p-6 md:p-8 ${ink ? "bg-[#d6d6d6] text-void" : "bg-coal ring-1 ring-inset ring-line"}`}>
      <div className={`flex items-end justify-between border-b pb-6 ${ink ? "border-black/15" : "border-line"}`}>
        <span className={`text-[15px] ${ink ? "text-black/70" : "text-ash"}`}>내 가점</span>
        <span>
          <span className={`num text-[80px] leading-[0.85] md:text-[104px] ${ink ? "text-void" : "text-pure"}`}>
            <AnimatedNumber value={total} />
          </span>
          <span className={`num ml-2 text-[24px] ${ink ? "text-black/50" : "text-ash"}`}>/ 84</span>
        </span>
      </div>
      <div className="mt-7 space-y-7">
        <Slider ink={ink} label="무주택 기간" value={homelessYears} max={15} onChange={setHomelessYears} format={years} />
        <Slider ink={ink} label="부양가족 (본인 제외)" value={dependents} max={6} onChange={setDependents} format={(v) => (v === 6 ? "6명 이상" : `${v}명`)} />
        <Slider ink={ink} label="청약통장 가입 기간" value={accountYears} max={15} onChange={setAccountYears} format={years} />
      </div>
      <ul className="mt-8 space-y-4">
        {lines.map((l) => (
          <li key={l.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
            <span className={`text-[14px] ${ink ? "text-black/70" : "text-ash"}`}>{l.label}</span>
            <span className={`data text-[14px] ${ink ? "text-void" : "text-cloud"}`}>
              {l.points} <span className={ink ? "text-black/45" : "text-dim"}>/ {l.max}</span>
            </span>
            <span className={`col-span-2 h-1 overflow-hidden rounded-full ${ink ? "bg-black/10" : "bg-white/8"}`}>
              <motion.span
                className={`block h-full rounded-full ${ink ? "bg-void" : "bg-signal"}`}
                initial={false}
                animate={{ width: `${(l.points / l.max) * 100}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          </li>
        ))}
      </ul>
      <p className={`t-small mt-6 ${ink ? "text-black/65" : "text-dim"}`}>
        무주택 기간은 만 30세(그 전에 결혼했다면 혼인신고일)부터 셉니다. 만 30세 전 미혼이면 0점입니다.
      </p>
    </div>
  );
}
