"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { isEmptyProfile, useHydrated, useProfile } from "@/lib/profile";

const LINKS = [
  { href: "/guide", label: "청약 가이드" },
  { href: "/guide/gajeom", label: "가점 계산기" },
  { href: "/#faq", label: "자주 묻는 질문" },
];

/** 상단 내비. 흰 바탕 + 아래 괘선. 조건을 넣은 사람에겐 「내 결과」가 주 버튼이 된다 */
export function SiteNav({ cta = true }: { cta?: boolean }) {
  const hydrated = useHydrated();
  const { profile } = useProfile();
  const mine = hydrated && !isEmptyProfile(profile);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-page">
      <nav aria-label="주 메뉴" className="wrap flex h-16 items-center justify-between gap-4">
        <Logo />
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-flex h-9 items-center rounded-[10px] px-3.5 text-[15px] font-medium text-sub hover:bg-well hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Link href="/guide" className="inline-flex h-9 items-center rounded-[10px] px-3 text-[15px] font-medium text-sub hover:bg-well hover:text-ink lg:hidden">
            가이드
          </Link>
          {cta &&
            (mine ? (
              <ButtonLink href="/results" size="sm">
                내 결과
              </ButtonLink>
            ) : (
              <ButtonLink href="/check" size="sm">
                내 조건 넣기
              </ButtonLink>
            ))}
        </div>
      </nav>
    </header>
  );
}
