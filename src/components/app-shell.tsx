"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BedDouble,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Menu,
  RotateCcw,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { dispatch, useStore } from "@/lib/store";
import { invoiceStatus } from "@/lib/selectors";
import { TODAY, fmtDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Avatar, cx } from "./ui";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <BedDouble className="size-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold leading-tight text-slate-900">CampusStay</span>
        <span className="block text-xs text-slate-500">Residence office</span>
      </span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const state = useStore();

  const nav: { href: string; label: string; icon: LucideIcon; count?: number; countClass?: string }[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/residences", label: "Residences", icon: Building2 },
    { href: "/students", label: "Students", icon: Users },
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
      countClass: "bg-slate-100 text-slate-700",
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
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 px-3" aria-label="Main">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cx(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <item.icon
                className={cx("size-4.5", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")}
              />
              <span className="flex-1">{item.label}</span>
              {!!item.count && (
                <span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", item.countClass)}>
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
        <p className="text-xs font-semibold text-slate-700">Demo mode</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          All data is fictional and saved in this browser. Demo date: {fmtDate(TODAY)}.
        </p>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "reset" });
            toast("Demo data reset");
          }}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900"
        >
          <RotateCcw className="size-3.5" />
          Reset demo data
        </button>
      </div>
      <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-4">
        <Avatar name="Thandi Mokoena" size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">Thandi Mokoena</p>
          <p className="truncate text-xs text-slate-500">Housing administrator</p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="-m-1 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="size-5" />
        </button>
        <Logo />
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
