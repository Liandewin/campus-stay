"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BedDouble, BellRing, Check, ClipboardList, Hammer, Wallet, Wrench, type LucideIcon } from "lucide-react";
import { dispatch, useStore } from "@/lib/store";
import { PRIORITY_RANK, fullName, getIndexes, invoiceStatus, residenceStats, roomLabel } from "@/lib/selectors";
import { CURRENT_PERIOD, TODAY, fmtAgo, fmtLongDate, fmtPeriod, fmtTime, money, pct, sum } from "@/lib/format";
import { priorityTone } from "@/lib/tones";
import { toast } from "@/lib/toast";
import type { Activity } from "@/lib/types";
import { Avatar, Card, CardHeader, Dot, EmptyState, PageHeader, Progress, StatCard, ViewAll, buttonStyles, cx } from "../ui";

const ACTIVITY_ICON: Record<Activity["kind"], { icon: LucideIcon; className: string }> = {
  application: { icon: ClipboardList, className: "bg-amber-50 text-amber-600" },
  maintenance: { icon: Wrench, className: "bg-rose-50 text-rose-600" },
  payment: { icon: Wallet, className: "bg-emerald-50 text-emerald-600" },
  room: { icon: BedDouble, className: "bg-sky-50 text-sky-600" },
};

function Donut({ value }: { value: number }) {
  const r = 43;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[148px] shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="7" className="stroke-slate-100" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
          className="stroke-brand-600 transition-all"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-slate-900 tabular-nums">{pct(value)}</p>
          <p className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">collected</p>
        </div>
      </div>
    </div>
  );
}

function ListCard({ title, count, countClass, children }: { title: string; count: number; countClass: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 px-[18px] pt-4 pb-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
        <span className={cx("rounded-full px-[7px] py-px text-[11px] font-semibold", countClass)}>{count}</span>
      </div>
      {children}
    </Card>
  );
}

export function DashboardView() {
  const state = useStore();
  const ix = getIndexes(state);

  const totals = residenceStats(state, ix);
  const pending = state.applications.filter((a) => a.status === "Pending");
  const openTickets = state.tickets.filter((t) => t.status !== "Resolved");
  const pressing = openTickets.filter((t) => PRIORITY_RANK[t.priority] <= PRIORITY_RANK.High);
  const attention = [...openTickets]
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5);
  const unpaid = state.invoices.filter((i) => !i.paidAt);
  const overdue = unpaid.filter((i) => invoiceStatus(i) === "Overdue");
  const overdueStudents = new Set(overdue.map((i) => i.studentId));
  const current = state.invoices.filter((i) => i.period === CURRENT_PERIOD);
  const billed = sum(current, (i) => i.amount);
  const collected = sum(
    current.filter((i) => i.paidAt),
    (i) => i.amount,
  );
  const periods = [...new Set(state.invoices.map((i) => i.period))].sort().map((period) => {
    const rows = state.invoices.filter((i) => i.period === period);
    const total = sum(rows, (i) => i.amount);
    const paid = sum(
      rows.filter((i) => i.paidAt),
      (i) => i.amount,
    );
    return { period, ratio: total ? paid / total : 0 };
  });

  function remindOverdue() {
    const text = `Payment reminders sent to ${overdueStudents.size} students`;
    dispatch({ type: "log", kind: "payment", text, href: "/payments" });
    toast(text);
  }

  return (
    <>
      <PageHeader
        title="Good morning, Thandi"
        description={`${fmtLongDate(TODAY)} · Semester 2, week 7`}
        actions={
          <>
            <button type="button" className={buttonStyles("secondary")} disabled={!overdueStudents.size} onClick={remindOverdue}>
              <BellRing />
              Remind overdue
            </button>
            <Link href="/applications" className={buttonStyles()}>
              <Check />
              Review applications
            </Link>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <section className="relative flex flex-col overflow-hidden rounded-2xl bg-linear-145 from-[oklch(0.38_0.065_182)] to-[oklch(0.26_0.04_194)] p-6 text-[#e7f2f0]">
          <div className="absolute -top-15 -right-15 size-60 rounded-full bg-brand-500/16" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-300 uppercase">Occupancy · all residences</p>
              <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5">
                <span className="text-[52px] leading-none font-semibold tracking-[-0.04em] tabular-nums">{pct(totals.occupancy)}</span>
                <span className="text-sm text-[oklch(0.845_0.09_176)]">
                  {totals.occupied} of {totals.beds} beds filled
                </span>
              </p>
            </div>
            <Link
              href="/residences"
              className="inline-flex shrink-0 items-center gap-[7px] rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-inherit hover:bg-white/20"
            >
              <BedDouble className="size-3.5 text-brand-200" />
              {totals.vacantBeds} beds free
            </Link>
          </div>
          <div className="relative mt-[22px] space-y-[13px]">
            {state.residences.map((res) => {
              const s = residenceStats(state, ix, res.id);
              return (
                <Link key={res.id} href={`/residences/${res.id}`} className="group block">
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="font-medium group-hover:text-white">{res.name}</span>
                    <span className="text-[oklch(0.845_0.09_176)] tabular-nums">
                      <span className="font-semibold text-white">{s.occupied}</span>/{s.beds} · {pct(s.occupancy)}
                    </span>
                  </div>
                  <Progress value={s.occupancy} trackClassName="mt-1.5 h-[5px] bg-white/13" barClassName="bg-brand-300" />
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
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
          <StatCard
            label="Rooms blocked"
            value={state.rooms.filter((r) => r.maintenance).length}
            hint="Closed for repairs"
            icon={Hammer}
            tone="green"
            href="/maintenance"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader
            title="Rent collection"
            subtitle={`${fmtPeriod(CURRENT_PERIOD)} · collected against billed`}
            action={<ViewAll href="/payments" label="Open payments" />}
          />
          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row">
            <Donut value={billed ? collected / billed : 0} />
            <div className="w-full min-w-0 flex-1">
              <dl>
                {(
                  [
                    ["bg-brand-600", "Collected this month", money(collected)],
                    ["bg-[#dbe2e3]", "Still due this month", money(billed - collected)],
                    ["bg-rose-500", "Overdue, earlier months", money(sum(overdue, (i) => i.amount))],
                  ] as const
                ).map(([dot, label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 py-[9px] text-[13px]">
                    <dt className="flex items-center gap-[9px] text-slate-600">
                      <span className={cx("size-2 rounded-[3px]", dot)} />
                      {label}
                    </dt>
                    <dd className="font-semibold text-slate-900 tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3.5 space-y-[9px]">
                {periods.map(({ period, ratio }) => (
                  <div key={period} className="flex items-center gap-2.5 text-xs">
                    <span className="w-[54px] shrink-0 text-slate-500">{fmtPeriod(period).split(" ")[0]}</span>
                    <Progress
                      value={ratio}
                      trackClassName="h-2 flex-1 bg-slate-100"
                      barClassName={period === CURRENT_PERIOD ? "bg-brand-600" : "bg-brand-300"}
                    />
                    <span className="w-11 shrink-0 text-right font-semibold text-slate-700 tabular-nums">{pct(ratio)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2">
          <ListCard title="Needs attention" count={openTickets.length} countClass="bg-rose-50 text-rose-700">
            {attention.length ? (
              <ul className="flex-1 px-1.5 pb-1.5">
                {attention.map((t) => (
                  <li key={t.id}>
                    <Link href="/maintenance" className="flex items-center gap-2.5 rounded-[10px] px-3 py-[9px] hover:bg-slate-50">
                      <Dot tone={priorityTone[t.priority]} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-900">{t.title}</span>
                        <span className="block truncate text-[11.5px] text-slate-500">
                          {roomLabel(ix, t.roomId)} · {t.priority} · {fmtAgo(t.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="All caught up" description="No open maintenance requests." />
            )}
          </ListCard>

          <ListCard title="Awaiting review" count={pending.length} countClass="bg-amber-50 text-amber-800">
            {pending.length ? (
              <ul className="flex-1 px-1.5 pb-1.5">
                {pending.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link href="/applications" className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 hover:bg-slate-50">
                      <Avatar name={fullName(a)} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-900">{fullName(a)}</span>
                        <span className="block truncate text-[11.5px] text-slate-500">
                          {ix.residences.get(a.preferredResidenceId)?.name} · {a.preferredRoomType}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">{fmtAgo(a.submittedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Inbox zero" description="No applications waiting for review." />
            )}
          </ListCard>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader title="Recent activity" />
        <ul className="grid gap-0.5 p-2 md:grid-cols-2 xl:grid-cols-3">
          {state.activity.slice(0, 6).map((a) => {
            const { icon: Icon, className } = ACTIVITY_ICON[a.kind];
            const text = <p className="text-[13px] leading-[1.45] text-slate-700">{a.text}</p>;
            return (
              <li key={a.id} className="flex gap-[11px] p-3">
                <span className={cx("grid size-[30px] shrink-0 place-items-center rounded-[10px]", className)}>
                  <Icon className="size-[15px]" />
                </span>
                <div className="min-w-0">
                  {a.href ? (
                    <Link href={a.href} className="hover:underline">
                      {text}
                    </Link>
                  ) : (
                    text
                  )}
                  <p className="mt-[3px] text-[11px] text-slate-400">
                    {fmtAgo(a.at)} · {fmtTime(a.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
