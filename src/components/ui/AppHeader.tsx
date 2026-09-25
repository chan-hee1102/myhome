import { ButtonLink } from "./Button";
import { Logo } from "./Logo";

/** 결과·상세 화면 상단. 유리 상자를 본문과 같은 컨테이너(.wrap-app)에 넣어 카드 가장자리와 맞춘다 */
export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 pt-3 md:pt-4">
      <div className="wrap-app">
        <div className="glass -mx-3 flex h-14 items-center justify-between rounded-[16px] px-3 ring-1 ring-inset ring-line md:-mx-4 md:h-16 md:px-4">
          <Logo />
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:contents">
              <ButtonLink href="/guide" variant="ghost" size="sm">
                청약 가이드
              </ButtonLink>
            </span>
            <ButtonLink href="/results" variant="ghost" size="sm">
              결과
            </ButtonLink>
            <ButtonLink href="/check" variant="secondary" size="sm">
              조건 수정
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
