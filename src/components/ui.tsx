import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Inbox, Search, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/tones";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const BADGE: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-rose-50 text-rose-700",
  blue: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
};

const DOT: Record<Tone, string> = {
  gray: "bg-slate-400",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  blue: "bg-sky-500",
  violet: "bg-violet-500",
};

const STATUS_TEXT: Record<Tone, string> = {
  gray: "text-slate-700",
  green: "text-emerald-700",
  amber: "text-amber-800",
  red: "text-rose-700",
  blue: "text-sky-700",
  violet: "text-violet-700",
};

export function Badge({ tone = "gray", dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-0.5 text-[11.5px] font-semibold",
        BADGE[tone],
      )}
    >
      {dot && <span className={cx("size-1.5 rounded-full", DOT[tone])} />}
      {children}
    </span>
  );
}

/** Dot plus coloured label, without a fill — for status columns in tables. */
export function Status({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-semibold", STATUS_TEXT[tone])}>
      <span className={cx("size-[7px] rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}

/** Small round marker coloured by tone, e.g. ticket priority. */
export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return <span className={cx("size-[7px] shrink-0 rounded-full", DOT[tone], className)} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-slate-200 bg-white shadow-card", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Uppercase micro-label used above values throughout the app. */
export const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-400";

export function ViewAll({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
    >
      {label}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-5">
      {back && (
        <Link href={back.href} className="mb-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-550">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const BUTTON = {
  primary: "bg-brand-600 text-white shadow-brand hover:bg-brand-700",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100",
};

export function buttonStyles(variant: keyof typeof BUTTON = "primary", size: "sm" | "md" = "md") {
  return cx(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "rounded-[9px] px-2.75 py-1.5 text-xs [&_svg]:size-3.5" : "rounded-[10px] px-3.5 py-2 text-[13px] [&_svg]:size-[15px]",
    "[&_svg]:shrink-0",
    BUTTON[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON; size?: "sm" | "md" }) {
  return <button type="button" {...props} className={cx(buttonStyles(variant, size), className)} />;
}

const ICON_TONE = {
  brand: "bg-brand-50 text-brand-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-rose-50 text-rose-600",
  blue: "bg-sky-50 text-sky-600",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof ICON_TONE;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2.5">
        <p className={eyebrow}>{label}</p>
        <span className={cx("grid size-7 place-items-center rounded-[9px]", ICON_TONE[tone])}>
          <Icon className="size-[15px]" />
        </span>
      </div>
      <p className="mt-3.5 text-[30px] leading-none font-semibold tracking-[-0.03em] text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-550">{hint}</p>}
    </>
  );
  const base = "block rounded-2xl border border-slate-200 bg-white p-[18px] shadow-card";
  return href ? (
    <Link href={href} className={cx(base, "transition hover:border-brand-300 hover:shadow-sm")}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

/** A row of figures in one card, separated by hairlines. */
export function StatStrip({
  items,
  className,
}: {
  items: { label: string; value: ReactNode; hint?: ReactNode; tone?: "red" }[];
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card xl:grid-cols-4",
        "divide-slate-100 max-xl:[&>*:nth-child(n+3)]:border-t xl:divide-x max-xl:[&>*:nth-child(even)]:border-l",
        className,
      )}
    >
      {items.map((s) => (
        <div key={s.label} className="border-slate-100 px-5 py-[18px]">
          <p className={eyebrow}>{s.label}</p>
          <p
            className={cx(
              "mt-2.5 text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums",
              s.tone === "red" ? "text-rose-700" : "text-slate-900",
            )}
          >
            {s.value}
          </p>
          {s.hint && <p className="mt-2 text-xs text-slate-500">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

const AVATAR_SIZES = {
  xs: "size-6 rounded-lg text-[10px]",
  sm: "size-8 rounded-[10px] text-[11px]",
  md: "size-10 rounded-[13px] text-[13px]",
  lg: "size-14 rounded-2xl text-[19px]",
};

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof AVATAR_SIZES }) {
  const words = name.split(" ").filter(Boolean);
  const initials = (words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "");
  const hash = [...name].reduce((h, ch) => h + ch.charCodeAt(0), 0);
  return (
    <span
      aria-hidden
      className={cx(
        "inline-grid shrink-0 place-items-center font-semibold uppercase",
        AVATAR_SIZES[size],
        AVATAR_COLORS[hash % AVATAR_COLORS.length],
      )}
    >
      {initials}
    </span>
  );
}

export function Progress({
  value,
  barClassName = "bg-brand-600",
  trackClassName = "h-[7px] bg-slate-100",
}: {
  value: number;
  barClassName?: string;
  trackClassName?: string;
}) {
  return (
    <div className={cx("overflow-hidden rounded-full", trackClassName)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-all", barClassName)} style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  );
}

export const inputClass =
  "block w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 sm:w-60">
      <Search className="pointer-events-none absolute top-1/2 left-[11px] size-[15px] -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cx(inputClass, "pl-[34px]")}
      />
    </div>
  );
}

/**
 * `pill` sits in a card toolbar and filters a list; `segment` is a compact
 * switch on a grey track.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  variant = "pill",
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  variant?: "pill" | "segment";
}) {
  const pill = variant === "pill";
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className={cx("inline-flex", pill ? "gap-1" : "gap-0.5 rounded-[10px] bg-slate-50 p-[3px]")} role="tablist">
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cx(
                "inline-flex items-center gap-1.5 whitespace-nowrap font-semibold transition",
                pill ? "rounded-full px-3.5 py-[7px] text-[13px]" : "rounded-lg px-[11px] py-1.5 text-[12.5px]",
                active
                  ? pill
                    ? "bg-brand-50 text-brand-800"
                    : "bg-white text-slate-900 shadow-[0_1px_2px_rgb(12_26_28/0.08)]"
                  : pill
                    ? "text-slate-550 hover:bg-slate-50 hover:text-slate-900"
                    : "text-slate-500 hover:text-slate-900",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cx("font-medium tabular-nums", active ? "text-brand-600" : "text-slate-400")}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[12.5px] text-slate-500">
      <span className="tabular-nums">
        {(page - 1) * pageSize + 1}–{Math.min(total, page * pageSize)} of {total}
      </span>
      <div className="flex gap-1.5">
        <Button variant="secondary" size="sm" className="px-2!" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <Button variant="secondary" size="sm" className="px-2!" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="rounded-2xl bg-slate-50 p-3 text-slate-400">
        <Icon className="size-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}
