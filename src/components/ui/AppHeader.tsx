import Link from "next/link";
import { ButtonLink } from "./Button";
import { Logo } from "./Logo";

/** 결과·상세 화면 상단. 본문과 같은 컨테이너(.wrap-app). 모바일에서도 가이드 링크는 보인다 */
export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-page">
      <div className="wrap-app flex h-16 items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-0.5">
          <Link href="/guide" className="inline-flex h-10 items-center rounded-[10px] px-2.5 text-[16px] font-medium text-sub hover:bg-well hover:text-ink">
            가이드
          </Link>
          {/* 좁은 화면은 자리가 모자라 뺀다 — 상세에는 「공고 목록」 링크가 따로 있다 */}
          <Link href="/results" className="hidden h-10 items-center rounded-[10px] px-2.5 text-[16px] font-medium text-sub hover:bg-well hover:text-ink sm:inline-flex">
            내 결과
          </Link>
          <ButtonLink href="/check?edit=1" variant="outline" size="sm">
            조건 고치기
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
