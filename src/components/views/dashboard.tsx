"use client";

import Link from "next/link";
import { BedDouble, ClipboardList, Wallet, Wrench, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  PRIORITY_RANK,
  ROOM_TYPES,
  fullName,
  getIndexes,
  invoiceStatus,
  residenceStats,
  roomLabel,
  vacantBedsByType,
} from "@/lib/selectors";
import { CURRENT_PERIOD, TODAY, fmtAgo, fmtLongDate, fmtPeriod, fmtTime, money, pct, sum } from "@/lib/format";
import { priorityTone } from "@/lib/tones";
import type { Activity } from "@/lib/types";
import { Avatar, Badge, Card, CardHeader, EmptyState, PageHeader, Progress, StatCard, ViewAll, cx } from "../ui";

const ACTIVITY_ICON: Record<Activity["kind"], { icon: LucideIcon; className: string }> = {
  application: { icon: ClipboardList, className: "bg-amber-50 text-amber-600" },
  maintenance: { icon: Wrench, className: "bg-rose-50 text-rose-600" },
  payment: { icon: Wallet, className: "bg-emerald-50 text-emerald-600" },
  room: { icon: BedDouble, className: "bg-sky-50 text-sky-600" },
};

function Donut({ value }: { value: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto size-40">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="11" className="stroke-slate-100" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
          className="stroke-brand-500 transition-all"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{pct(value)}</p>
          <p className="text-xs text-slate-500">collected</p>
        </div>
      </div>
    </div>
  );
}

function LegendRow({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-slate-600">
        <span className={cx("size-2.5 rounded-full", dot)} />
        {label}
      </dt>
      <dd className="font-medium tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

export function DashboardView() {
  const state = useStore();
  const ix = getIndexes(state);

  const totals = residenceStats(state, ix);
  const vacancies = vacantBedsByType(state, ix);
  const pending = state.applications.filter((a) => a.status === "Pending");
  const openTickets = state.tickets.filter((t) => t.status !== "Resolved");
  const pressing = openTickets.filter((t) => PRIORITY_RANK[t.priority] <= PRIORITY_RANK.High);
  const attention = [...openTickets]
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5);
  const unpaid = state.invoices.filter((i) => !i.paidAt);
  const overdue = unpaid.filter((i) => invoiceStatus(i) === "Overdue");
  const current = state.invoices.filter((i) => i.period === CURRENT_PERIOD);
  const billed = sum(current, (i) => i.amount);
  const collected = sum(
    current.filter((i) => i.paidAt),
    (i) => i.amount,
  );

  return (
    <>
      <PageHeader title="Welcome back, Thandi" description={`${fmtLongDate(TODAY)} · Semester 2, week 7`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={pct(totals.occupancy)}
          hint={`${totals.occupied} of ${totals.beds} beds filled`}
          icon={BedDouble}
          href="/residences"
        />
        <StatCard
          label="Pending applications"
          value={pending.length}
          hint={`${totals.vacantBeds} beds free to allocate`}
          icon={ClipboardList}
          tone="amber"
          href="/applications"
        />
        <StatCard
          label="Open maintenance"
          value={openTickets.length}
          hint={`${pressing.length} high priority or urgent`}
          icon={Wrench}
          tone="red"
          href="/maintenance"
        />
        <StatCard
          label="Rent outstanding"
          value={money(sum(unpaid, (i) => i.amount))}
          hint={`${overdue.length} invoices overdue`}
          icon={Wallet}
          tone="blue"
          href="/payments"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Occupancy by residence" subtitle="Beds filled across all properties" action={<ViewAll href="/residences" />} />
          <div className="space-y-5 p-5">
            {state.residences.map((res) => {
              const s = residenceStats(state, ix, res.id);
              return (
                <div key={res.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <Link href={`/residences/${res.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {res.name}
                      <span className="ml-2 hidden text-xs font-normal text-slate-500 sm:inline">{res.kind}</span>
                    </Link>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      <span className="font-medium text-slate-900">{s.occupied}</span>/{s.beds} · {pct(s.occupancy)}
                    </span>
                  </div>
                  <Progress value={s.occupancy} />
                </div>
              );
            })}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs">
              <span className="mr-1 text-slate-500">Free beds by type</span>
              {ROOM_TYPES.map((t) => (
                <Badge key={t} tone={vacancies[t] ? "green" : "gray"}>
                  {t} · {vacancies[t]}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={`${fmtPeriod(CURRENT_PERIOD)} rent`} subtitle="Collected against billed" action={<ViewAll href="/payments" />} />
          <div className="p-5">
            <Donut value={billed ? collected / billed : 0} />
            <dl className="mt-5 space-y-2.5 text-sm">
              <LegendRow dot="bg-brand-500" label="Collected" value={money(collected)} />
              <LegendRow dot="bg-slate-200" label="Still due this month" value={money(billed - collected)} />
              <LegendRow dot="bg-rose-500" label="Overdue, earlier months" value={money(sum(overdue, (i) => i.amount))} />
            </dl>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Needs attention" subtitle="Highest-priority open requests" action={<ViewAll href="/maintenance" />} />
          {attention.length ? (
            <ul className="divide-y divide-slate-100">
              {attention.map((t) => (
                <li key={t.id}>
                  <Link href="/maintenance" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {roomLabel(ix, t.roomId)} · {fmtAgo(t.createdAt)}
                      </p>
                    </div>
                    <Badge tone={priorityTone[t.priority]} dot>
                      {t.priority}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="All caught up" description="No open maintenance requests." />
          )}
        </Card>

        <Card>
          <CardHeader title="Awaiting review" subtitle={`${pending.length} pending applications`} action={<ViewAll href="/applications" />} />
          {pending.length ? (
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link href="/applications" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <Avatar name={fullName(a)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{fullName(a)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {ix.residences.get(a.preferredResidenceId)?.name} · {a.preferredRoomType}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{fmtAgo(a.submittedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Inbox zero" description="No applications waiting for review." />
          )}
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <ul className="space-y-4 p-5">
            {state.activity.slice(0, 6).map((a) => {
              const { icon: Icon, className } = ACTIVITY_ICON[a.kind];
              const text = <p className="text-sm leading-snug text-slate-700">{a.text}</p>;
              return (
                <li key={a.id} className="flex gap-3">
                  <span className={cx("grid size-8 shrink-0 place-items-center rounded-full", className)}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    {a.href ? (
                      <Link href={a.href} className="hover:underline">
                        {text}
                      </Link>
                    ) : (
                      text
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {fmtAgo(a.at)} · {fmtTime(a.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
