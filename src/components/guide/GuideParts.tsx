import Link from "next/link";
import type { Block, Guide, GuideTable } from "@/lib/guides";
import { GUIDES } from "@/lib/guides";
import { ButtonLink } from "@/components/ui/Button";
import { GajeomCalc } from "./GajeomCalc";

/** 빵부스러기 — 화면에 보이는 것과 BreadcrumbList JSON-LD가 같은 경로 */
export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="현재 위치" className="t-small text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-sub">
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
      <div className="no-scrollbar overflow-x-auto rounded-[20px] bg-page ring-1 ring-inset ring-line" tabIndex={0} aria-label={table.caption}>
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
      {table.note && <figcaption className="t-small mt-3 text-muted">{table.note}</figcaption>}
    </figure>
  );
}

export function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return <p className="t-body-l mt-4 max-w-[38em] text-body">{b.text}</p>;
    case "note":
      return <p className="t-small mt-4 max-w-[40em] rounded-[12px] bg-wash px-4 py-3 text-sub">{b.text}</p>;
    case "ul":
      return (
        <ul className="mt-4 max-w-[40em] space-y-2.5">
          {b.items.map((it) => (
            <li key={it} className="t-body-l flex gap-3 text-body">
              <span aria-hidden className="mt-[0.72em] size-1.5 shrink-0 rounded-full bg-brand" />
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
    <div className="space-y-2">
      {items.map((f) => (
        <details key={f.q} name="faq" className="group rounded-[16px] bg-wash px-5 transition-colors open:bg-brand-soft/60 md:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <h3 className="t-title text-ink">{f.q}</h3>
            <svg viewBox="0 0 16 16" className="size-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <p className="t-body max-w-[40em] pb-5 text-body">{f.a}</p>
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
          className="group flex min-h-[148px] flex-col rounded-[20px] bg-page p-5 shadow-card ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift md:p-6"
        >
          <span className="t-caption font-semibold text-brand">{g.category}</span>
          <span className="t-title mt-2 text-ink">{g.short}</span>
          <span className="t-small mt-auto pt-4 text-muted">{g.facts.join(" · ")}</span>
        </Link>
      ))}
    </div>
  );
}

export function CheckCta({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-[24px] bg-brand-soft ${compact ? "p-6" : "p-6 md:p-8"}`}>
      <p className="t-title text-ink">내 조건으로 바로 확인하기</p>
      <p className="t-small mt-2 text-sub">다섯 가지만 누르면 공고마다 신청할 수 있는지와 예상 순위를 알려 드려요.</p>
      <div className="mt-5">
        <ButtonLink href="/check" arrow block={compact}>
          내 조건 넣기
        </ButtonLink>
      </div>
    </div>
  );
}
