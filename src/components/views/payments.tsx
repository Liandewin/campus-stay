"use client";

import Link from "next/link";
import { useState } from "react";
import { BellRing, CircleCheck } from "lucide-react";
import { dispatch, useStore } from "@/lib/store";
import { fullName, getIndexes, invoiceStatus, roomLabel, type InvoiceStatus } from "@/lib/selectors";
import { CURRENT_PERIOD, fmtDate, fmtDay, fmtPeriod, money, pct, sum } from "@/lib/format";
import { invoiceTone } from "@/lib/tones";
import { toast } from "@/lib/toast";
import type { Invoice } from "@/lib/types";
import { Avatar, Button, Card, EmptyState, PageHeader, Pagination, SearchInput, StatStrip, Status, Tabs, eyebrow, inputClass } from "../ui";

const PAGE_SIZE = 15;
const STATUS_ORDER: Record<InvoiceStatus, number> = { Overdue: 0, Due: 1, Paid: 2 };
type StatusFilter = "All" | InvoiceStatus;

export function PaymentsView() {
  const state = useStore();
  const ix = getIndexes(state);
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const periods = [...new Set(state.invoices.map((i) => i.period))].sort().reverse();
  const current = state.invoices.filter((i) => i.period === CURRENT_PERIOD);
  const billed = sum(current, (i) => i.amount);
  const collected = sum(
    current.filter((i) => i.paidAt),
    (i) => i.amount,
  );
  const unpaid = state.invoices.filter((i) => !i.paidAt);
  const overdue = unpaid.filter((i) => invoiceStatus(i) === "Overdue");
  const overdueStudents = new Set(overdue.map((i) => i.studentId));
  const paidAll = sum(
    state.invoices.filter((i) => i.paidAt),
    (i) => i.amount,
  );
  const billedAll = sum(state.invoices, (i) => i.amount);

  const q = query.trim().toLowerCase();
  const scoped = state.invoices.filter((inv) => {
    if (period !== "all" && inv.period !== period) return false;
    if (!q) return true;
    const s = ix.students.get(inv.studentId);
    return `${inv.id} ${s ? fullName(s) : ""} ${s?.studentNumber ?? ""} ${roomLabel(ix, s?.roomId ?? null)}`.toLowerCase().includes(q);
  });
  const counts: Record<StatusFilter, number> = { All: scoped.length, Overdue: 0, Due: 0, Paid: 0 };
  for (const inv of scoped) counts[invoiceStatus(inv)]++;

  const rows = scoped
    .filter((inv) => status === "All" || invoiceStatus(inv) === status)
    .sort((a, b) => STATUS_ORDER[invoiceStatus(a)] - STATUS_ORDER[invoiceStatus(b)] || b.period.localeCompare(a.period) || a.id.localeCompare(b.id));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withReset =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  function markPaid(inv: Invoice) {
    dispatch({ type: "markInvoicePaid", id: inv.id });
    toast(`${money(inv.amount)} payment recorded`);
  }

  function remind(studentIds: string[]) {
    const names = studentIds.map((id) => ix.students.get(id)).filter((s) => !!s).map(fullName);
    const text = names.length === 1 ? `Payment reminder sent to ${names[0]}` : `Payment reminders sent to ${names.length} students`;
    dispatch({ type: "log", kind: "payment", text, href: "/payments" });
    toast(text);
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Monthly rent invoices, collections and arrears."
        actions={
          <Button variant="secondary" disabled={!overdueStudents.size} onClick={() => remind([...overdueStudents])}>
            <BellRing />
            Remind all overdue
          </Button>
        }
      />

      <StatStrip
        items={[
          {
            label: `Collected · ${fmtPeriod(CURRENT_PERIOD)}`,
            value: money(collected),
            hint: `${pct(billed ? collected / billed : 0)} of ${money(billed)} billed`,
          },
          { label: "Outstanding", value: money(sum(unpaid, (i) => i.amount)), hint: `${unpaid.length} unpaid invoices` },
          { label: "Overdue", value: money(sum(overdue, (i) => i.amount)), hint: `${overdueStudents.size} students behind on rent`, tone: "red" },
          { label: "Collection rate", value: pct(billedAll ? paidAll / billedAll : 0), hint: "All invoices this semester" },
        ]}
      />

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <Tabs
            tabs={(["All", "Overdue", "Due", "Paid"] as const).map((s) => ({ id: s, label: s, count: counts[s] }))}
            value={status}
            onChange={withReset(setStatus)}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <select aria-label="Billing period" className={`${inputClass} sm:w-40`} value={period} onChange={(e) => withReset(setPeriod)(e.target.value)}>
              <option value="all">All periods</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {fmtPeriod(p)}
                </option>
              ))}
            </select>
            <SearchInput value={query} onChange={withReset(setQuery)} placeholder="Student, invoice, room…" />
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={CircleCheck} title="No invoices match" description="Try another status, period or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13.5px]">
              <thead className={`bg-[#fafbfb] text-left ${eyebrow}`}>
                <tr>
                  <th className="px-5 py-[11px] font-semibold">Student</th>
                  <th className="hidden px-5 py-[11px] font-semibold md:table-cell">Invoice</th>
                  <th className="px-5 py-[11px] text-right font-semibold">Amount</th>
                  <th className="hidden px-5 py-[11px] font-semibold sm:table-cell">Due</th>
                  <th className="px-5 py-[11px] font-semibold">Status</th>
                  <th className="px-5 py-[11px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.map((inv) => {
                  const s = ix.students.get(inv.studentId);
                  const st = invoiceStatus(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-[#fafbfb]">
                      <td className="px-5 py-[11px]">
                        {s ? (
                          <div className="flex items-center gap-[11px]">
                            <Avatar name={fullName(s)} size="sm" />
                            <div className="min-w-0">
                              <Link href={`/students/${s.id}`} className="block truncate font-semibold text-slate-900 hover:text-brand-700">
                                {fullName(s)}
                              </Link>
                              <p className="truncate text-[11.5px] text-slate-400">{roomLabel(ix, s.roomId)}</p>
                            </div>
                          </div>
                        ) : (
                          "Unknown student"
                        )}
                      </td>
                      <td className="hidden px-5 py-[11px] md:table-cell">
                        <p className="text-slate-700">{fmtPeriod(inv.period)}</p>
                        <p className="font-mono text-[11.5px] text-slate-400">{inv.id}</p>
                      </td>
                      <td className="px-5 py-[11px] text-right font-semibold text-slate-900 tabular-nums">{money(inv.amount)}</td>
                      <td className="hidden whitespace-nowrap px-5 py-[11px] text-slate-500 sm:table-cell">{fmtDate(inv.dueDate)}</td>
                      <td className="px-5 py-[11px]">
                        <Status tone={invoiceTone[st]}>{st}</Status>
                      </td>
                      <td className="whitespace-nowrap px-5 py-[11px] text-right">
                        {inv.paidAt ? (
                          <span className="text-xs text-slate-400">Paid {fmtDay(inv.paidAt)}</span>
                        ) : (
                          <div className="flex justify-end gap-1">
                            {st === "Overdue" && (
                              <Button size="sm" variant="ghost" aria-label="Send reminder" title="Send reminder" onClick={() => remind([inv.studentId])}>
                                <BellRing />
                              </Button>
                            )}
                            <Button size="sm" variant="secondary" onClick={() => markPaid(inv)}>
                              Mark paid
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={currentPage} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />
      </Card>
    </>
  );
}
