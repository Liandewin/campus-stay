"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { fullName, getIndexes, roomLabel, studentBalance } from "@/lib/selectors";
import { money } from "@/lib/format";
import { fundingTone } from "@/lib/tones";
import type { Funding, Student } from "@/lib/types";
import { Avatar, Badge, Card, EmptyState, PageHeader, Pagination, SearchInput, Tabs, inputClass } from "../ui";

const PAGE_SIZE = 15;
const FUNDING: Funding[] = ["NSFAS", "Bursary", "Self-funded"];
type Group = "Active" | "Overdue" | "Checked out";

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const byName = (a: Student, b: Student) =>
  cmp(a.lastName.toLowerCase(), b.lastName.toLowerCase()) || cmp(a.firstName, b.firstName);

export function StudentsView() {
  const router = useRouter();
  const state = useStore();
  const ix = getIndexes(state);
  const [query, setQuery] = useState("");
  const [residence, setResidence] = useState("all");
  const [funding, setFunding] = useState("all");
  const [group, setGroup] = useState<Group>("Active");
  const [page, setPage] = useState(1);

  const q = query.trim().toLowerCase();
  const matching = state.students.filter(
    (s) =>
      (residence === "all" || ix.rooms.get(s.roomId ?? "")?.residenceId === residence) &&
      (funding === "all" || s.funding === funding) &&
      (!q || `${fullName(s)} ${s.email} ${s.studentNumber} ${s.course}`.toLowerCase().includes(q)),
  );
  const groups: Record<Group, Student[]> = {
    Active: matching.filter((s) => s.status === "Active"),
    Overdue: matching.filter((s) => studentBalance(ix, s.id).overdue > 0),
    "Checked out": matching.filter((s) => s.status === "Checked out"),
  };
  const rows = groups[group].sort(byName);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  // Changing any filter jumps back to the first page.
  const withReset =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  return (
    <>
      <PageHeader title="Students" description={`${groups.Active.length} residents currently housed`} />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs
            tabs={[
              { id: "Active" as const, label: "Residents", count: groups.Active.length },
              { id: "Overdue" as const, label: "Rent overdue", count: groups.Overdue.length },
              { id: "Checked out" as const, label: "Checked out", count: groups["Checked out"].length },
            ]}
            value={group}
            onChange={withReset(setGroup)}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput value={query} onChange={withReset(setQuery)} placeholder="Search name, number, course…" />
            <select aria-label="Residence" className={`${inputClass} sm:w-44`} value={residence} onChange={(e) => withReset(setResidence)(e.target.value)}>
              <option value="all">All residences</option>
              {state.residences.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select aria-label="Funding" className={`${inputClass} sm:w-36`} value={funding} onChange={(e) => withReset(setFunding)(e.target.value)}>
              <option value="all">All funding</option>
              {FUNDING.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={Users} title="No students found" description="Try a different search or clear the filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Course</th>
                  <th className="px-4 py-3 font-medium">Room</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Funding</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((s) => {
                  const balance = studentBalance(ix, s.id);
                  return (
                    <tr key={s.id} onClick={() => router.push(`/students/${s.id}`)} className="cursor-pointer hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={fullName(s)} size="sm" />
                          <div className="min-w-0">
                            <Link href={`/students/${s.id}`} className="block truncate font-medium text-slate-900 hover:text-brand-700">
                              {fullName(s)}
                            </Link>
                            <p className="truncate text-xs text-slate-500">{s.studentNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <p className="text-slate-700">{s.course}</p>
                        <p className="text-xs text-slate-500">Year {s.year}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{roomLabel(ix, s.roomId)}</td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <Badge tone={fundingTone[s.funding]}>{s.funding}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        {balance.overdue > 0 ? (
                          <span className="font-medium text-rose-600">{money(balance.total)} overdue</span>
                        ) : balance.total > 0 ? (
                          <span className="text-slate-700">{money(balance.total)} due</span>
                        ) : (
                          <span className="text-emerald-600">Paid up</span>
                        )}
                      </td>
                      <td className="pr-4 text-slate-300">
                        <ChevronRight className="size-4" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />
      </Card>
    </>
  );
}
