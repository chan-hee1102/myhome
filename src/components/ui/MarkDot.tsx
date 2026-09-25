export type Mark = "ok" | "maybe" | "no";

/** 조건 한 줄 앞의 동그란 표시 — 충족(초록 ✓)·모름(주황 ?)·미달(회색 ✕) */
export function MarkDot({ m, className = "" }: { m: Mark; className?: string }) {
  const cls = m === "ok" ? "bg-ok text-white" : m === "maybe" ? "bg-maybe text-white" : "bg-no text-white";
  return (
    <span className={`grid size-5 shrink-0 place-items-center rounded-full ${cls} ${className}`} aria-hidden>
      <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4">
        {m === "ok" && <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />}
        {m === "maybe" && <path d="M6.2 5.8a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.2M8 11.6v.2" strokeLinecap="round" strokeLinejoin="round" />}
        {m === "no" && <path d="M5 5l6 6M11 5l-6 6" strokeLinecap="round" />}
      </svg>
    </span>
  );
}
