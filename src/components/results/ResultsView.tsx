"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Facade, type FacadeItem } from "@/components/motion/Facade";
import { Odometer } from "@/components/motion/Odometer";
import { EASE, SPRING } from "@/components/motion/tokens";
import { AppHeader } from "@/components/ui/AppHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { SampleNotice } from "@/components/ui/SampleNotice";
import { WIN_LABEL, WinGlyph, type WinState } from "@/components/ui/Window";
import { sampleAnnouncements } from "@/lib/data/sample";
import { withJosa } from "@/lib/josa";
import { placeText } from "@/lib/place";
import { isEmptyProfile, useHydrated, useProfile } from "@/lib/profile";
import { profileChips } from "@/lib/questions";
import { byRelevance, countVerdicts, evaluateAll, groupLines, regionScope, suggestAsks, type NoticeResult } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";
import { badgeStatus, dayText, reasonLine, shortDate, VERDICT, verdictKey } from "./verdict";

type Tab = "all" | "ok" | "maybe" | "no" | "closed";
type Kind = "all" | "rent" | "sale";
type Sort = "match" | "deadline";

const TABS: { id: Tab; label: string }[] = [
  { id: "ok", label: "신청 가능" },
  { id: "maybe", label: "확인 필요" },
  { id: "no", label: "해당 없음" },
  { id: "closed", label: "마감" },
  { id: "all", label: "전체" },
];

/** 입력 화면이 「1분 더 답하기」·「조건 고치기」 직전에 남기는 건수 — 돌아와서 무엇이 바뀌었는지 알려 준다 */
export const BEFORE_KEY = "cheongyakfit.before";

function winOf(r: NoticeResult): WinState {
  return r.phase === "closed" ? "closed" : r.verdict;
}

/** 목록 한 줄 — D-day(왼쪽 고정 폭) · 공고 · 계층별 창 · 상태 */
function Row({ r, index, far }: { r: NoticeResult; index: number; far: boolean }) {
  const reduce = useReducedMotion();
  const v = VERDICT[verdictKey(r)];
  const day = dayText(r);
  const reason = reasonLine(r);
  const dim = r.verdict === "no" || r.phase === "closed";
  const urgent = r.phase === "open" && r.daysLeft <= 3;
  const score = r.best.score;
  const groups = groupLines(r).slice(0, 6);
  return (
    <motion.li
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ ...SPRING.land, delay: Math.min(index, 6) * 0.04 }}
      className="border-b border-line last:border-b-0"
    >
      <Link
        href={`/notice/${r.a.id}`}
        className={`group grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 px-4 py-5 transition-colors hover:bg-wash md:grid-cols-[96px_minmax(0,1fr)_176px] md:gap-x-6 md:px-6 ${far ? "bg-wash/50" : ""}`}
      >
        {/* D-day */}
        <div className="min-w-0">
          <p className={`t-num-m whitespace-nowrap ${urgent ? "text-hot-ink" : dim ? "text-muted" : "text-ink"}`}>{day.big}</p>
          <p className="mt-1.5 text-[13px] font-medium text-muted">{day.small}</p>
          <p className="text-[13px] text-muted tabular">{r.phase === "upcoming" ? shortDate(r.a.schedule.applyStart) : shortDate(r.a.schedule.applyEnd)}</p>
        </div>

        {/* 공고 */}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-muted">
            {r.a.agency} · {PROGRAMS[r.a.program].name} · {placeText(r.a)}
            {r.a.sample && <span className="ml-1.5 font-semibold text-maybe-ink">예시</span>}
          </p>
          <h3 className={`mt-0.5 truncate text-[18px] font-bold tracking-[-0.03em] group-hover:underline md:text-[20px] ${dim ? "text-sub" : "text-ink"}`}>{r.a.complex}</h3>
          <div className="mt-1.5 md:hidden">
            <StatusBadge status={badgeStatus(r)}>{v.label}</StatusBadge>
          </div>
          {groups.length > 1 && (
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1" aria-label="공급 대상별 결과">
              {groups.map((g) => {
                const s: WinState = r.phase === "closed" ? "closed" : g.verdict;
                return (
                  <li key={g.id} className={`inline-flex items-center gap-1.5 text-[14px] ${s === "ok" ? "font-semibold text-ok-ink" : s === "maybe" ? "text-maybe-ink" : "text-muted"}`}>
                    <WinGlyph state={s} />
                    {g.label.replace(" 특별공급", " 특공").replace(" 계층", "")}
                  </li>
                );
              })}
            </ul>
          )}
          {reason && <p className="t-small mt-2 line-clamp-2 text-sub">{reason}</p>}
        </div>

        {/* 상태(데스크탑) */}
        <div className="hidden flex-col items-end gap-1 text-right md:flex">
          <StatusBadge status={badgeStatus(r)}>{v.label}</StatusBadge>
          {r.best.rank && r.verdict !== "no" && <span className="text-[14px] font-semibold text-ink">{r.best.rank.label}</span>}
          {score && r.verdict !== "no" && (
            <span className="data text-[14px] text-sub">
              {score.title} {score.total}
              {score.partial ? "+" : ""}/{score.max}
            </span>
          )}
        </div>
      </Link>
    </motion.li>
  );
}

/** 답하기 전후 건수 비교 — 1분 더 답했는데 무엇이 바뀌었는지(또는 안 바뀌었는지) 한 줄로 */
function ChangeNote({ counts }: { counts: ReturnType<typeof countVerdicts> }) {
  const [before, setBefore] = useState<{ ok: number; maybe: number; no: number } | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BEFORE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(BEFORE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 비교값을 한 번 읽는다(브라우저 저장소)
      setBefore(JSON.parse(raw));
    } catch {}
  }, []);
  if (!before) return null;
  const settled = before.maybe - counts.maybe;
  const dOk = counts.ok - before.ok;
  const text =
    settled > 0
      ? `방금 답한 내용으로 확인 필요 ${settled}건이 정해졌어요${dOk > 0 ? ` — 신청 가능 +${dOk}` : ""}.`
      : dOk !== 0
        ? `방금 답한 내용으로 신청 가능이 ${dOk > 0 ? `${dOk}건 늘었어요` : `${-dOk}건 줄었어요`}.`
        : counts.maybe > 0
          ? `결과는 그대로예요. 남은 확인 필요 ${counts.maybe}건은 다른 정보가 더 필요해요.`
          : "결과는 그대로예요.";
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE.out }}
      className="mt-6 border-y border-line py-3 text-[15px] font-semibold text-ink"
      role="status"
    >
      {text}
    </motion.p>
  );
}

export function ResultsView() {
  const hydrated = useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useProfile();
  const empty = isEmptyProfile(profile);
  const results = useMemo(() => (hydrated ? evaluateAll(sampleAnnouncements(), profile) : []), [hydrated, profile]);
  const asks = useMemo(() => suggestAsks(results, profile), [results, profile]);
  const counts = countVerdicts(results);

  // 필터는 주소에 둔다 — 상세에 갔다 돌아오거나 뒤로 가기를 해도 그대로다
  const tabParam = params.get("tab") as Tab | null;
  const kind = (params.get("kind") as Kind | null) ?? "all";
  const sort = (params.get("sort") as Sort | null) ?? "match";
  const tab: Tab = tabParam ?? (empty ? "all" : counts.ok > 0 ? "ok" : "all");
  const setParam = (k: string, v: string, def: string) => {
    const next = new URLSearchParams(params.toString());
    if (v === def) next.delete(k);
    else next.set(k, v);
    const q = next.toString();
    router.replace(q ? `/results?${q}` : "/results", { scroll: false });
  };

  const shown = useMemo(() => {
    const list = results.filter((r) => {
      if (kind !== "all" && PROGRAMS[r.a.program].kind !== kind) return false;
      if (tab === "all") return true;
      if (tab === "closed") return r.phase === "closed";
      return r.phase !== "closed" && r.verdict === tab;
    });
    if (sort === "match") return list.sort(byRelevance(profile));
    return list.sort((x, y) => {
      const dx = x.phase === "upcoming" ? x.daysToStart + 100 : x.daysLeft;
      const dy = y.phase === "upcoming" ? y.daysToStart + 100 : y.daysLeft;
      return dx - dy;
    });
  }, [results, tab, kind, sort, profile]);
  // 먼 지역은 숨기지 않고 아래 묶음으로 — 숫자가 화면마다 달라지지 않게
  const near = profile.sido ? shown.filter((r) => regionScope(r.a, profile) !== "far") : shown;
  const far = profile.sido ? shown.filter((r) => regionScope(r.a, profile) === "far") : [];

  const tabCount = (t: Tab) => (t === "all" ? counts.total : t === "closed" ? counts.closed : counts[t as "ok" | "maybe" | "no"]);
  const chips = profileChips(profile);
  const facade: FacadeItem[] = results.map((r) => ({ id: r.a.id, state: winOf(r), label: `${r.a.complex} — ${WIN_LABEL[winOf(r)]}`, href: `/notice/${r.a.id}` }));
  const top = asks[0];

  return (
    <div className="min-h-dvh bg-wash">
      <AppHeader />
      <main className="wrap-app pb-20 pt-24 md:pb-28 md:pt-28">
        <SampleNotice />

        {/* 요약 */}
        <section className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <div className="section-head">
              <span>{empty ? "전체 공고" : "내 조건으로 본 공고"}</span>
              <span className="text-muted">{hydrated ? `공고 ${results.length}건` : ""}</span>
            </div>
            {!hydrated ? (
              <div className="mt-6 h-[120px] animate-pulse rounded-[4px] bg-well" />
            ) : empty ? (
              <div className="mt-6">
                <h1 className="t-h1">진행 중인 공고를 먼저 둘러보세요</h1>
                <p className="t-body-l mt-4 text-sub">조건을 넣으면 공고마다 신청할 수 있는지와 예상 순위를 계산해요.</p>
                <div className="mt-6">
                  <ButtonLink href="/check" size="lg" arrow>
                    내 조건 넣기
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <>
                <h1 className="sr-only">내 조건으로 본 공고 결과</h1>
                <dl className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-5">
                  <div>
                    <dt className="text-[14px] font-semibold text-sub">신청 가능</dt>
                    <dd className={`t-num-xl mt-1 ${counts.ok ? "text-brand" : "text-ghost"}`}>
                      <Odometer value={counts.ok} />
                      <span className="ml-1 text-[22px] text-ink">건</span>
                    </dd>
                  </div>
                  {(
                    [
                      ["확인 필요", counts.maybe, "text-maybe-ink"],
                      ["해당 없음", counts.no, "text-sub"],
                      ["마감", counts.closed, "text-sub"],
                    ] as const
                  ).map(([k, n, c]) => (
                    <div key={k}>
                      <dt className="text-[14px] font-semibold text-sub">{k}</dt>
                      <dd className={`t-num-m mt-1 ${n ? c : "text-ghost"}`}>{n}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="내 조건(누르면 고칠 수 있어요)">
                  {chips.map((c) => (
                    <li key={c}>
                      <Link href="/check?edit=1" className="inline-flex h-9 items-center rounded-[4px] bg-page px-2.5 text-[14px] font-medium text-body ring-1 ring-inset ring-line-strong hover:ring-ink">
                        {c}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ChangeNote counts={counts} />
              </>
            )}
          </div>
          {hydrated && !empty && (
            <div className="hidden lg:col-span-3 lg:col-start-10 lg:block">
              <Facade items={facade} cols={4} door={false} className="max-w-[220px]" />
            </div>
          )}
        </section>

        {/* 더 정확해지려면 */}
        {hydrated && !empty && top && (
          <section className="mt-8 rounded-[4px] bg-page px-5 py-4 ring-1 ring-inset ring-line md:px-6">
            <p className="t-h3">
              {withJosa(top.label, "을/를")} 알려주시면 공고 {top.count}건의 결과가 정해져요
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <ButtonLink href={`/check?topic=${top.topic}`} size="sm" arrow>
                {top.label} 답하기
              </ButtonLink>
              {asks.slice(1, 4).map((a) => (
                <Link key={a.topic} href={`/check?topic=${a.topic}`} className="inline-flex h-9 items-center text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  {a.label} <span className="ml-1 tabular font-medium text-muted">{a.count}건</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 필터 */}
        <div className="sticky top-16 z-20 -mx-5 mt-10 bg-wash px-5 pt-2 md:-mx-8 md:px-8">
          <div role="tablist" aria-label="결과 구분" className="no-scrollbar mask-fade-r flex gap-5 overflow-x-auto border-b border-line md:[mask-image:none]">
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={on}
                  type="button"
                  onClick={() => setParam("tab", t.id, "__none")}
                  className={`relative shrink-0 whitespace-nowrap pb-3 pt-1 text-[15px] font-semibold transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}
                >
                  {t.label} {hydrated && <span className="tabular font-medium">{tabCount(t.id)}</span>}
                  {on && hydrated && <motion.span layoutId="tab-line" className="absolute inset-x-0 -bottom-px h-[2px] bg-ink" transition={SPRING.ui} />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div role="group" aria-label="유형" className="flex h-10 shrink-0 items-center rounded-[10px] bg-page p-0.5 ring-1 ring-inset ring-line-strong">
              {(
                [
                  ["all", "전체"],
                  ["rent", "임대"],
                  ["sale", "분양"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setParam("kind", k, "all")}
                  className={`h-9 whitespace-nowrap rounded-[8px] px-3.5 text-[15px] font-semibold transition-colors ${kind === k ? "bg-ink text-white" : "text-sub hover:text-ink"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <label className="flex shrink-0 items-center gap-2 text-[14px] font-medium text-sub">
              <span className="sr-only md:not-sr-only">정렬</span>
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value, "match")}
                className="h-10 rounded-[10px] bg-page px-3 text-[15px] font-semibold text-ink ring-1 ring-inset ring-line-strong outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="match">잘 맞는 순</option>
                <option value="deadline">마감 순</option>
              </select>
            </label>
          </div>
        </div>

        {/* 목록 */}
        <ul className="mt-2 overflow-hidden rounded-[4px] bg-page ring-1 ring-inset ring-line">
          {!hydrated &&
            Array.from({ length: 4 }).map((_, k) => (
              <li key={k} className="border-b border-line px-6 py-5 last:border-b-0">
                <div className="h-[72px] animate-pulse rounded-[4px] bg-well" />
              </li>
            ))}
          <AnimatePresence mode="popLayout" initial={false}>
            {near.map((r, k) => (
              <Row key={r.a.id} r={r} index={k} far={false} />
            ))}
          </AnimatePresence>
          {hydrated && near.length === 0 && far.length === 0 && <li className="t-body px-6 py-10 text-center text-sub">이 구분에 맞는 공고가 없어요. 다른 탭을 눌러 보세요.</li>}
          {hydrated && near.length === 0 && far.length > 0 && (
            <li className="t-body px-6 py-6 text-sub">{profile.sido} 근처에는 이 구분의 공고가 없어요. 아래는 다른 지역 공고예요.</li>
          )}
        </ul>
        {far.length > 0 && (
          <>
            <p className="mt-8 text-[14px] font-semibold text-sub">
              다른 지역 공고 {far.length}건 <span className="font-medium text-muted">— 보통 그 지역에 사는 사람이 먼저 뽑혀요</span>
            </p>
            <ul className="mt-2 overflow-hidden rounded-[4px] bg-page ring-1 ring-inset ring-line">
              {far.map((r, k) => (
                <Row key={r.a.id} r={r} index={k} far />
              ))}
            </ul>
          </>
        )}
        <p className="t-small mt-8 text-muted">결과는 참고용 예상이에요. 최종 자격과 순위는 공급기관이 서류로 심사해 정해요.</p>
      </main>
    </div>
  );
}
