"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BedDouble,
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Receipt,
  RotateCcw,
  Search,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { dispatch, useStore } from "@/lib/store";
import { fullName, getIndexes, invoiceStatus } from "@/lib/selectors";
import { TODAY, fmtDate, fmtPeriod } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Avatar, cx, eyebrow } from "./ui";

const ME = { name: "Thandi Mokoena", role: "Housing administrator" };

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-[11px]">
      <span className="grid size-[34px] place-items-center rounded-[11px] bg-linear-145 from-brand-500 to-[oklch(0.47_0.1_182)] text-white shadow-[0_2px_6px_-1px_oklch(0.5_0.1_178/0.45)]">
        <BedDouble className="size-[18px]" />
      </span>
      <span>
        <span className="block text-[15px] leading-tight font-semibold tracking-tight text-slate-900">CampusStay</span>
        <span className="block text-xs text-slate-500">Residence office</span>
      </span>
    </Link>
  );
}

type NavItem = { href: string; label: string; icon: LucideIcon; section?: string; count?: number; countClass?: string };

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const state = useStore();

  const nav: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, section: "Overview" },
    { href: "/residences", label: "Residences", icon: Building2 },
    { href: "/students", label: "Students", icon: Users, section: "Operations" },
    {
      href: "/applications",
      label: "Applications",
      icon: ClipboardList,
      count: state.applications.filter((a) => a.status === "Pending").length,
      countClass: "bg-amber-100 text-amber-800",
    },
    {
      href: "/maintenance",
      label: "Maintenance",
      icon: Wrench,
      count: state.tickets.filter((t) => t.status === "Open").length,
      countClass: "bg-slate-100 text-slate-600",
    },
    {
      href: "/payments",
      label: "Payments",
      icon: Wallet,
      count: state.invoices.filter((i) => invoiceStatus(i) === "Overdue").length,
      countClass: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-[18px]">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Main">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              {item.section && <p className={cx(eyebrow, "px-2.5 pt-3.5 pb-1.5")}>{item.section}</p>}
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group relative flex items-center gap-[11px] rounded-[10px] px-[11px] py-[9px] text-sm transition",
                  active ? "bg-brand-50 font-semibold text-brand-800" : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <span
                  className={cx(
                    "absolute top-1/2 left-0 h-[18px] w-[3px] -translate-y-1/2 rounded-r-[3px]",
                    active ? "bg-brand-600" : "bg-transparent",
                  )}
                />
                <item.icon
                  className={cx("size-[17px] shrink-0", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")}
                />
                <span className="flex-1">{item.label}</span>
                {!!item.count && (
                  <span
                    className={cx(
                      "min-w-5 rounded-full px-[7px] py-px text-center text-[11px] font-semibold tabular-nums",
                      item.countClass,
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl bg-brand-50 p-3.5">
        <p className="text-xs font-semibold text-brand-900">Demo data</p>
        <p className="mt-1 text-xs leading-relaxed text-[oklch(0.43_0.03_184)]">
          Fictional, saved in this browser. Pinned to {fmtDate(TODAY)}.
        </p>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "reset" });
            toast("Demo data reset");
          }}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900"
        >
          <RotateCcw className="size-[13px]" />
          Reset
        </button>
      </div>
      <div className="flex items-center gap-[11px] border-t border-slate-100 px-5 py-3.5">
        <Avatar name={ME.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900">{ME.name}</p>
          <p className="truncate text-xs text-slate-500">{ME.role}</p>
        </div>
      </div>
    </div>
  );
}

function crumbFor(pathname: string): [string, string] {
  if (pathname === "/") return ["Overview", "Dashboard"];
  if (pathname === "/residences") return ["Overview", "Residences"];
  if (pathname.startsWith("/residences/")) return ["Overview", "Room map"];
  if (pathname === "/students") return ["Operations", "Students"];
  if (pathname.startsWith("/students/")) return ["Operations", "Student profile"];
  if (pathname.startsWith("/applications")) return ["Operations", "Applications"];
  if (pathname.startsWith("/maintenance")) return ["Operations", "Maintenance"];
  if (pathname.startsWith("/payments")) return ["Operations", "Payments"];
  return ["CampusStay", "Not found"];
}

type Hit = { href: string; label: string; meta: string; icon: LucideIcon };

/** Jump to a student, residence, room or invoice from anywhere. ⌘K / Ctrl+K focuses it. */
function GlobalSearch() {
  const router = useRouter();
  const state = useStore();
  const ix = getIndexes(state);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const hits: Hit[] = [];
  if (q) {
    for (const s of state.students) {
      if (`${fullName(s)} ${s.studentNumber}`.toLowerCase().includes(q))
        hits.push({ href: `/students/${s.id}`, label: fullName(s), meta: `${s.studentNumber} · ${s.status}`, icon: Users });
    }
    for (const r of state.residences) {
      if (r.name.toLowerCase().includes(q)) hits.push({ href: `/residences/${r.id}`, label: r.name, meta: r.kind, icon: Building2 });
    }
    for (const room of state.rooms) {
      const res = ix.residences.get(room.residenceId);
      if (`${res?.name} ${room.number}`.toLowerCase().includes(q) || room.number === q)
        hits.push({ href: `/residences/${room.residenceId}`, label: `${res?.name} · ${room.number}`, meta: `${room.type} room`, icon: BedDouble });
    }
    for (const inv of state.invoices) {
      if (inv.id.toLowerCase().includes(q)) {
        const s = ix.students.get(inv.studentId);
        hits.push({ href: `/students/${inv.studentId}`, label: inv.id, meta: `${s ? fullName(s) : "Unknown"} · ${fmtPeriod(inv.period)}`, icon: Receipt });
      }
    }
  }
  const results = hits.slice(0, 8);
  const active = Math.min(cursor, results.length - 1);

  function go(hit: Hit) {
    router.push(hit.href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="relative hidden w-[300px] md:block">
      <Search className="pointer-events-none absolute top-1/2 left-[11px] size-[15px] -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open && !!q}
        aria-controls="global-search-results"
        aria-label="Search students, rooms, invoices"
        placeholder="Search students, rooms, invoices…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setCursor(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            go(results[active]);
          } else if (e.key === "Escape") {
            setQuery("");
            inputRef.current?.blur();
          }
        }}
        className="block w-full rounded-[10px] border border-slate-200 bg-[#f8faf9] py-2 pr-[58px] pl-[34px] text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-px font-sans text-[11px] font-semibold text-slate-400">
        ⌘K
      </kbd>
      {open && q && (
        <ul
          id="global-search-results"
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {results.length === 0 && <li className="px-3 py-2.5 text-[13px] text-slate-500">No matches for “{query.trim()}”</li>}
          {results.map((hit, i) => (
            <li key={hit.href + hit.label} role="option" aria-selected={i === active}>
              <button
                type="button"
                // Keep focus in the input so onBlur doesn't close the list before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(hit)}
                onMouseEnter={() => setCursor(i)}
                className={cx("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left", i === active && "bg-slate-50")}
              >
                <hit.icon className="size-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900">{hit.label}</span>
                  <span className="block truncate text-[11.5px] text-slate-500">{hit.meta}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const [crumb, title] = crumbFor(usePathname());
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-slate-200 bg-white/88 px-4 backdrop-blur-sm sm:gap-5 lg:px-7">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="-m-1 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={eyebrow}>{crumb}</p>
        <p className="mt-px truncate text-[15px] font-semibold tracking-tight text-slate-900">{title}</p>
      </div>
      <GlobalSearch />
      <div className="flex items-center gap-2.5">
        <span className="hidden items-center gap-[7px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex">
          <CalendarDays className="size-3.5 text-slate-500" />
          {fmtDate(TODAY)}
        </span>
        <Avatar name={ME.name} size="sm" />
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-full">
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-62 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      <main className="lg:pl-62">
        <TopBar onMenu={() => setMenuOpen(true)} />
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:p-7">{children}</div>
      </main>
    </div>
  );
}
