import Link from "next/link";
import type { GroupId, ProgramId } from "@/lib/domain";
import { PROGRAMS } from "@/lib/rules/programs";
import { TEMPLATES } from "@/lib/rules/templates";

const COLS: { id: ProgramId; slug: string }[] = [
  { id: "happy", slug: "happy-housing" },
  { id: "national", slug: "national-rental" },
  { id: "permanent", slug: "permanent-rental" },
  { id: "integrated", slug: "integrated-rental" },
  { id: "purchase", slug: "purchase-rental" },
  { id: "jeonse", slug: "jeonse-rental" },
  { id: "youthSafe", slug: "youth-safe-housing" },
  { id: "deundeun", slug: "deundeun-jeonse" },
  { id: "publicSale", slug: "public-sale" },
  { id: "privateApt", slug: "private-apt" },
];

/** 대상 → 판정 엔진에 실제로 있는 (유형, 공급 계층). 엔진에 없는 칸은 그리지 않는다 */
const ROWS: { label: string; sub?: string; cells: [ProgramId, GroupId][] }[] = [
  {
    label: "청년",
    sub: "만 19~39세",
    cells: [["happy", "youth"], ["integrated", "youth"], ["purchase", "youth"], ["jeonse", "youth"], ["youthSafe", "youth"]],
  },
  { label: "대학생", cells: [["happy", "student"]] },
  {
    label: "신혼부부",
    sub: "예비부부 포함",
    cells: [
      ["happy", "newlywed"],
      ["integrated", "newlywed"],
      ["purchase", "newlywed"],
      ["jeonse", "newlywed"],
      ["youthSafe", "newlywed"],
      ["publicSale", "spNewlywed"],
      ["privateApt", "spNewlywed"],
    ],
  },
  { label: "아기 있는 가구", sub: "2세 미만·임신", cells: [["publicSale", "spNewborn"], ["privateApt", "spNewborn"]] },
  { label: "생애최초", sub: "집을 가져 본 적 없음", cells: [["publicSale", "spFirst"], ["privateApt", "spFirst"]] },
  { label: "다자녀", sub: "미성년 자녀 2명 이상", cells: [["publicSale", "spMultiChild"], ["privateApt", "spMultiChild"]] },
  { label: "노부모 부양", sub: "65세 이상 부모님 3년 부양", cells: [["publicSale", "spParents"], ["privateApt", "spParents"]] },
  { label: "고령자", sub: "만 65세 이상", cells: [["happy", "elderly"]] },
  { label: "수급자·한부모 등", sub: "저소득 가구", cells: [["happy", "benefit"], ["permanent", "benefit"], ["purchase", "general"], ["jeonse", "general"]] },
  { label: "무주택 세대", sub: "제한 없음", cells: [["national", "general"], ["integrated", "general"], ["deundeun", "general"], ["publicSale", "gen1"]] },
  { label: "청약통장 가입자", sub: "일반공급", cells: [["privateApt", "gen1"]] },
];

const has = (p: ProgramId, g: GroupId) => !!TEMPLATES[p]?.[g];

/** 칸 표시 — 창이 아니라 점. 창은 「공고 1건」에만 쓴다 */
function Cell({ on }: { on: boolean }) {
  return on ? (
    <span className="mx-auto block size-2 rounded-full bg-ink" role="img" aria-label="따로 배정되는 물량 있음" />
  ) : (
    <span aria-hidden className="mx-auto block h-px w-2.5 bg-faint" />
  );
}

/** 「누구에게 어떤 공고」 대상 × 주택 유형 표. 창이 켜진 칸 = 그 대상에게 따로 배정되는 물량이 있음 */
export function WhoWhat() {
  const rows = ROWS.map((r) => ({ ...r, cells: r.cells.filter(([p, g]) => has(p, g)) })).filter((r) => r.cells.length);

  return (
    <section aria-labelledby="who-title" className="border-t border-line py-12 md:py-20">
      <div className="wrap">
        <h2 id="who-title" className="t-h2">
          누가 어떤 공고에 넣을 수 있나요
        </h2>
        <p className="t-body-l mt-3 max-w-[40em] text-sub">
          <span className="md:hidden">대상마다 신청할 수 있는 주택 유형이에요.</span>
          <span className="hidden md:inline">점이 찍힌 칸은 그 대상에게 따로 떼어 둔 물량이 있다는 뜻이에요.</span>
        </p>

        <div className="mt-10 md:mt-12">
          {/* 데스크탑: 표 */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-ink">
                  <th scope="col" className="w-[200px] pb-3 text-[14px] md:text-[15px] font-semibold text-muted">
                    대상
                  </th>
                  {COLS.map((c) => (
                    <th key={c.id} scope="col" className="pb-3 text-center align-bottom">
                      <Link href={`/guide/${c.slug}`} className="inline-block max-w-[5.5em] text-[14px] md:text-[15px] font-semibold leading-tight text-ink hover:underline">
                        {PROGRAMS[c.id].name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="group border-b border-line hover:bg-wash">
                    <th scope="row" className="py-3.5 pr-4 font-normal">
                      <span className="block text-[16px] font-semibold text-ink">{r.label}</span>
                      {r.sub && <span className="block text-[14px] md:text-[15px] text-muted">{r.sub}</span>}
                    </th>
                    {COLS.map((c) => (
                      <td key={c.id} className="py-3.5 text-center">
                        <Cell on={r.cells.some(([p]) => p === c.id)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 대상별 목록 */}
          <ul className="border-t border-line-strong md:hidden">
            {rows.map((r) => (
              <li key={r.label} className="border-b border-line py-3.5">
                <p className="flex items-baseline gap-2">
                  <span className="text-[16px] font-semibold text-ink">{r.label}</span>
                  {r.sub && <span className="text-[14px] md:text-[15px] text-muted">{r.sub}</span>}
                </p>
                <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
                  {r.cells.map(([p]) => {
                    const col = COLS.find((c) => c.id === p)!;
                    return (
                      <Link key={p} href={`/guide/${col.slug}`} className="text-[16px] text-body underline decoration-line-strong underline-offset-4">
                        {PROGRAMS[p].name}
                      </Link>
                    );
                  })}
                </p>
              </li>
            ))}
          </ul>

          <p className="t-small mt-5 text-muted">유형 이름을 누르면 자격 기준을 볼 수 있어요. 같은 대상이라도 소득·자산 기준은 유형마다 달라요.</p>
        </div>
      </div>
    </section>
  );
}
