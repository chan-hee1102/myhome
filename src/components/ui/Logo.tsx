import Link from "next/link";
import { SITE } from "@/lib/site";

/** 3×2 창 중 한 칸만 켜진 입면 — 「내가 들어갈 수 있는 집 한 칸」 */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  const cells = [
    [3, 4],
    [9.5, 4],
    [16, 4],
    [3, 12.5],
    [9.5, 12.5],
    [16, 12.5],
  ];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="1" y="1.25" width="22" height="21.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {cells.map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="5"
          height="6.5"
          rx="0.8"
          fill={i === 4 ? "#2447d6" : "none"}
          stroke={i === 4 ? "#2447d6" : "currentColor"}
          strokeWidth="1.4"
        />
      ))}
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 text-ink ${className}`} aria-label={`${SITE.name} 홈`}>
      <LogoMark className="size-[26px]" />
      <span className="text-[19px] font-bold leading-none tracking-[-0.045em]">{SITE.name}</span>
    </Link>
  );
}
