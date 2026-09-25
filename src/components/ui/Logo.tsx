import Link from "next/link";
import { SITE } from "@/lib/site";

/** 아치형 문 — 「들어갈 수 있는 집」 */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M5 21V10.5a7 7 0 0 1 14 0V21"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M9.5 21v-5.2a2.5 2.5 0 0 1 5 0V21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 text-pure ${className}`} aria-label={`${SITE.name} 홈`}>
      <LogoMark className="size-[22px]" />
      <span className="text-[19px] font-bold leading-none tracking-[-0.04em]">{SITE.name}</span>
    </Link>
  );
}
