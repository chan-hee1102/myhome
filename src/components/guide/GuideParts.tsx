import Link from "next/link";
import type { Block, Guide, GuideTable } from "@/lib/guides";
import { GUIDES } from "@/lib/guides";
import { ButtonLink } from "@/components/ui/Button";
import { GajeomCalc } from "./GajeomCalc";

/** 빵부스러기 — 화면에 보이는 것과 BreadcrumbList JSON-LD가 같은 경로 */
export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="현재 위치" className="t-small text-dim">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-cloud">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ash">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function TableView({ table }: { table: GuideTable }) {
  return (
    <figure className="my-6">
      <div className="no-scrollbar overflow-x-auto rounded-[20px] bg-coal ring-1 ring-inset ring-line" tabIndex={0} aria-label={table.caption}>
        <table id={table.id} className={`guide-table ${table.wrap ? "wrap-cells" : ""}`}>
          <caption className="px-4 pt-4">{table.caption}</caption>
          <thead>
            <tr>
              {table.head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i}>
                <th scope="row">{r[0]}</th>
                {r.slice(1).map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note && <figcaption className="t-small mt-3 text-dim">{table.note}</figcaption>}
    </figure>
  );
}

export function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return <p className="t-body-l mt-4 max-w-[38em] text-mist">{b.text}</p>;
    case "note":
      return <p className="t-small mt-4 max-w-[40em] text-dim">{b.text}</p>;
    case "ul":
      return (
        <ul className="mt-4 max-w-[40em] space-y-2.5">
          {b.items.map((it) => (
            <li key={it} className="t-body-l flex gap-3 text-mist">
              <span aria-hidden className="mt-[0.75em] size-1 shrink-0 rounded-full bg-ash" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case "table":
      return <TableView table={b.table} />;
    case "calc":
      return (
        <div className="mt-6">
          <GajeomCalc />
        </div>
      );
  }
}

/** 네이티브 details — JS 없이도 답이 HTML에 있다(AEO) */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mt-6 border-t border-line">
      {items.map((f) => (
        <details key={f.q} name="faq" className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <h3 className="t-title text-cloud">{f.q}</h3>
            <span aria-hidden className="relative size-4 shrink-0">
              <span className="absolute left-0 top-1/2 h-px w-4 bg-cloud" />
              <span className="absolute left-0 top-1/2 h-px w-4 rotate-90 bg-cloud transition-transform duration-300 group-open:rotate-0" />
            </span>
          </summary>
          <p className="t-body-l max-w-[40em] pb-6 text-mist">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function RelatedGuides({ slugs }: { slugs: string[] }) {
  const list = slugs.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean) as Guide[];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {list.map((g) => (
        <Link
          key={g.slug}
          href={`/guide/${g.slug}`}
          className="group flex min-h-[148px] flex-col rounded-[20px] bg-coal p-5 ring-1 ring-inset ring-line transition-colors hover:bg-graphite hover:ring-line-strong md:p-6"
        >
          <span className="t-caption text-dim">{g.category}</span>
          <span className="t-title mt-2 text-cloud">{g.short}</span>
          <span className="t-small mt-auto pt-4 text-ash">{g.facts.join(" · ")}</span>
        </Link>
      ))}
    </div>
  );
}

export function CheckCta({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-[24px] bg-coal ring-1 ring-inset ring-line ${compact ? "p-6" : "p-6 md:p-8"}`}>
      <p className="t-title text-cloud">내 조건으로 바로 확인하기</p>
      <p className="t-small mt-2 text-ash">다섯 가지만 답하면 공고마다 신청 가능 여부와 예상 순위를 계산해 드려요.</p>
      <div className="mt-5">
        <ButtonLink href="/check" arrow block={compact}>
          내 조건 넣기
        </ButtonLink>
      </div>
    </div>
  );
}
