// Server-friendly dashboard pieces (no hooks): page headers, tables, empty
// states, filter tabs and pagination.
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[13px] text-neutral-500 hover:text-neutral-900">
          <ChevronLeft size={15} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-neutral-500">{description}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-medium text-neutral-800">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** A plain, horizontally scrollable table. */
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-500">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-5 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx("px-5 py-3.5 align-middle text-neutral-700", className)}>{children}</td>;
}

/** Filter chips driven by a query-string value, e.g. ?status=shipped */
export function FilterTabs({
  tabs,
  current,
  hrefFor,
}: {
  tabs: { value: string; label: string; count?: number }[];
  current: string;
  hrefFor: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => {
        const active = t.value === current;
        return (
          <Link
            key={t.value}
            href={hrefFor(t.value)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
              active ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50"
            )}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className={cx("rounded-full px-1.5 text-[11px]", active ? "bg-white/20" : "bg-neutral-100 text-neutral-600")}>{t.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/** A search box that submits as a normal GET form (works without JavaScript). */
export function SearchForm({ placeholder, defaultValue, hidden = {} }: { placeholder: string; defaultValue?: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form className="relative w-full sm:w-72">
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-beryl focus:ring-2 focus:ring-brand-beryl/20"
      />
    </form>
  );
}

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const link = "inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50";
  const off = "inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-3 text-[13px] font-medium text-neutral-300";
  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 text-[13px] text-neutral-500">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={link}>
            <ChevronLeft size={14} /> Previous
          </Link>
        ) : (
          <span className={off}>
            <ChevronLeft size={14} /> Previous
          </span>
        )}
        {page < pages ? (
          <Link href={hrefFor(page + 1)} className={link}>
            Next <ChevronRight size={14} />
          </Link>
        ) : (
          <span className={off}>
            Next <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, href, tone }: { label: string; value: ReactNode; hint?: ReactNode; href?: string; tone?: "alert" }) {
  const body = (
    <div
      className={cx(
        "h-full rounded-xl border bg-white p-5 transition-colors",
        tone === "alert" ? "border-amber-300" : "border-neutral-200",
        href && "hover:border-neutral-400"
      )}
    >
      <p className="text-[13px] font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Label/value rows used on detail screens. */
export function DetailList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-neutral-100 text-sm">
      {rows
        .filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false)
        .map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-neutral-500">{label}</dt>
            <dd className="min-w-0 break-words text-neutral-900">{value}</dd>
          </div>
        ))}
    </dl>
  );
}
