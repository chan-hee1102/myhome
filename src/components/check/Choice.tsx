"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { Option, YesNoQuestion } from "@/lib/questions";

/**
 * 조건 입력 선택지 규격(반경 10)
 *   md       min-h 56, 왼쪽 정렬 — 문장형
 *   compact  h 52, 가운데·한 줄 — 시도·자녀 수·예/아니요
 *   pill     h 44, 시·군·구·「잘 모르겠어요」
 * 안 고른 칸: 흰 바탕 + 회색 테두리 / 고른 칸: 연한 군청 바탕 + 군청 2px 테두리(체크 아이콘은 쓰지 않는다 — 체크박스로 오인).
 */
export type ChipSize = "md" | "compact" | "pill";

const SIZE: Record<ChipSize, string> = {
  md: "min-h-14 justify-between rounded-[10px] px-4 py-3 text-left text-[16px]",
  compact: "h-[52px] justify-center rounded-[10px] px-2 text-center text-[16px]",
  pill: "h-11 justify-center rounded-[10px] px-4 text-[16px] whitespace-nowrap",
};

export function Chip({
  selected,
  onClick,
  children,
  sub,
  size = "md",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
  size?: ChipSize;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 font-semibold transition-[background-color,box-shadow,color] duration-150 ${SIZE[size]} ${
        selected ? "bg-brand-soft text-brand-ink ring-2 ring-inset ring-brand" : "bg-page text-body ring-1 ring-inset ring-line-strong hover:ring-ink"
      } ${sub && size === "md" ? "min-h-[68px]" : ""}`}
    >
      <span className="min-w-0">
        <span className="block">{children}</span>
        {sub && <span className={`mt-0.5 block text-[15px] font-normal ${selected ? "text-brand-ink/80" : "text-muted"}`}>{sub}</span>}
      </span>
    </motion.button>
  );
}

export function ChipGroup<T>({
  label,
  help,
  options,
  value,
  onChange,
  cols = "grid-cols-2",
  size = "md",
  equals = (a: T, b: T) => a === b,
}: {
  label?: React.ReactNode;
  help?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  cols?: string;
  size?: ChipSize;
  equals?: (a: T, b: T) => boolean;
}) {
  return (
    <fieldset>
      {label && <legend className="text-[16px] font-semibold text-ink">{label}</legend>}
      {help && <p className="mt-0.5 text-[15px] text-muted">{help}</p>}
      <div className={`grid gap-2 ${cols} ${label || help ? "mt-3" : ""}`}>
        {options.map((o) => (
          <Chip key={o.label} size={size} sub={o.sub} selected={value !== undefined && equals(value, o.value)} onClick={() => onChange(o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

/** 예/아니요 — 질문 정의(YES_NO)의 순서대로 그려 「긍정이 왼쪽」으로 통일 */
export function YesNo({ q, value, onChange }: { q: YesNoQuestion; value: boolean | undefined; onChange: (v: boolean) => void }) {
  return <ChipGroup label={q.label} help={q.help} size="compact" options={q.options} value={value} onChange={onChange} />;
}

/** 연수 스테퍼 — 숫자를 바로 적거나 −/+로 조정. 버튼 48px */
export function Stepper({
  label,
  help,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  text,
  unit = "년",
}: {
  label: string;
  help?: string;
  value: number | undefined;
  onChange: (v: number) => void;
  min?: number;
  max: number;
  step?: number | ((v: number, dir: 1 | -1) => number);
  text: (v: number) => string;
  unit?: string;
}) {
  const next = (dir: 1 | -1) => {
    const cur = value ?? min;
    const v = typeof step === "function" ? step(cur, dir) : cur + dir * step;
    onChange(Math.min(max, Math.max(min, v)));
  };
  const id = `stepper-${label}`;
  // 입력칸 글자는 따로 들고 있다 — 지우고 새로 적을 수 있게. 바깥 값이 바뀌면(−/+) 맞춘다
  const shown = value === undefined ? "" : String(Math.floor(value));
  const [txt, setTxt] = useState(shown);
  const [synced, setSynced] = useState(shown);
  if (shown !== synced) {
    setSynced(shown);
    setTxt(shown);
  }
  return (
    <div>
      <label htmlFor={id} className="text-[16px] font-semibold text-ink">
        {label}
      </label>
      {help && <p className="mt-0.5 text-[15px] text-muted">{help}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={`${label} 줄이기`}
          onClick={() => next(-1)}
          disabled={value !== undefined && value <= min}
          className="grid size-12 shrink-0 place-items-center rounded-[10px] text-[22px] font-semibold text-ink ring-1 ring-inset ring-line-strong hover:ring-ink disabled:text-faint"
        >
          −
        </button>
        <span className={`flex h-12 items-center gap-1 rounded-[10px] px-3 ${value === undefined ? "bg-page ring-1 ring-inset ring-faint" : "bg-brand-soft ring-2 ring-inset ring-brand"}`}>
          <input
            id={id}
            inputMode="numeric"
            value={txt}
            placeholder="0"
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 2);
              setTxt(d);
              if (d !== "") onChange(Math.min(max, Math.max(min, Number(d))));
            }}
            onBlur={() => setTxt(shown)}
            className="num w-[2.2em] bg-transparent text-right text-[20px] text-ink outline-none placeholder:text-faint"
          />
          <span className="text-[16px] font-semibold text-body">{unit}</span>
        </span>
        <button
          type="button"
          aria-label={`${label} 늘리기`}
          onClick={() => next(1)}
          disabled={value !== undefined && value >= max}
          className="grid size-12 shrink-0 place-items-center rounded-[10px] text-[22px] font-semibold text-ink ring-1 ring-inset ring-line-strong hover:ring-ink disabled:text-faint"
        >
          +
        </button>
        <span className="min-w-0 text-[15px] text-muted">{value === undefined ? "숫자를 적거나 +를 누르세요" : text(value)}</span>
      </div>
    </div>
  );
}

export const bandEq = (a: { min: number; max: number | null }, b: { min: number; max: number | null }) => a.min === b.min && a.max === b.max;
