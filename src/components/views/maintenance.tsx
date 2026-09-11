"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, Hammer, MapPin, Plus, Timer, TriangleAlert, User, Wrench } from "lucide-react";
import { dispatch, useStore } from "@/lib/store";
import { PRIORITIES, PRIORITY_RANK, fullName, getIndexes, roomLabel, type Indexes } from "@/lib/selectors";
import { daysBetween, fmtAgo, sum } from "@/lib/format";
import { priorityTone } from "@/lib/tones";
import { toast } from "@/lib/toast";
import type { Priority, Ticket, TicketStatus } from "@/lib/types";
import { Modal } from "../modal";
import { TicketForm } from "../ticket-form";
import { Badge, Button, PageHeader, SearchInput, StatCard, cx, inputClass } from "../ui";

const COLUMNS: { status: TicketStatus; hint: string; dot: string }[] = [
  { status: "Open", hint: "Waiting for triage", dot: "bg-rose-500" },
  { status: "In progress", hint: "Assigned to a technician", dot: "bg-amber-500" },
  { status: "Resolved", hint: "Recently closed", dot: "bg-emerald-500" },
];

export function MaintenanceView() {
  const state = useStore();
  const ix = getIndexes(state);
  const [query, setQuery] = useState("");
  const [residence, setResidence] = useState("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [creating, setCreating] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = state.tickets.filter(
    (t) =>
      (residence === "all" || ix.rooms.get(t.roomId)?.residenceId === residence) &&
      (priority === "all" || t.priority === priority) &&
      (!q || `${t.id} ${t.title} ${t.description} ${roomLabel(ix, t.roomId)}`.toLowerCase().includes(q)),
  );

  const open = state.tickets.filter((t) => t.status !== "Resolved");
  const resolved = state.tickets.filter((t) => t.status === "Resolved" && t.resolvedAt);
  const avgDays = resolved.length ? sum(resolved, (t) => daysBetween(t.createdAt, t.resolvedAt!)) / resolved.length : 0;

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Track repair requests from report to resolution."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            Log request
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open requests" value={open.length} hint={`${open.filter((t) => t.status === "Open").length} not yet picked up`} icon={Wrench} />
        <StatCard
          label="Urgent & high"
          value={open.filter((t) => PRIORITY_RANK[t.priority] <= PRIORITY_RANK.High).length}
          hint="Open, needing fast action"
          icon={TriangleAlert}
          tone="red"
        />
        <StatCard label="Rooms blocked" value={state.rooms.filter((r) => r.maintenance).length} hint="Closed for repairs" icon={Hammer} tone="amber" />
        <StatCard label="Avg. time to resolve" value={`${avgDays.toFixed(1)} days`} hint={`Across ${resolved.length} resolved requests`} icon={Timer} tone="green" />
      </div>

      <div className="mt-6 mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Search requests…" />
        <select aria-label="Residence" className={`${inputClass} sm:w-48`} value={residence} onChange={(e) => setResidence(e.target.value)}>
          <option value="all">All residences</option>
          {state.residences.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select aria-label="Priority" className={`${inputClass} sm:w-40`} value={priority} onChange={(e) => setPriority(e.target.value as "all" | Priority)}>
          <option value="all">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {COLUMNS.map(({ status, hint, dot }) => {
          const items = filtered
            .filter((t) => t.status === status)
            .sort((a, b) =>
              status === "Resolved"
                ? (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? "")
                : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt.localeCompare(b.createdAt),
            );
          return (
            <section key={status} className="rounded-2xl bg-slate-100/80 p-3">
              <header className="flex items-center gap-2 px-1.5 pt-1 pb-3">
                <span className={cx("size-2 rounded-full", dot)} />
                <h2 className="text-sm font-semibold text-slate-900">{status}</h2>
                <span className="rounded-full bg-white px-2 text-xs font-medium text-slate-600 tabular-nums">{items.length}</span>
                <span className="ml-auto text-xs text-slate-500">{hint}</span>
              </header>
              <div className="space-y-3">
                {items.map((t) => (
                  <TicketCard key={t.id} ticket={t} ix={ix} />
                ))}
                {items.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">Nothing here</p>}
              </div>
            </section>
          );
        })}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Log a maintenance request" description="Logged by the residence office.">
        <TicketForm onDone={() => setCreating(false)} />
      </Modal>
    </>
  );
}

function TicketCard({ ticket: t, ix }: { ticket: Ticket; ix: Indexes }) {
  const reporter = t.studentId ? ix.students.get(t.studentId) : undefined;
  const room = ix.rooms.get(t.roomId);

  function move(status: TicketStatus, message: string) {
    dispatch({ type: "setTicketStatus", id: t.id, status });
    toast(message);
  }

  return (
    <article className={cx("rounded-xl border border-slate-200 bg-white p-4 shadow-xs", t.status === "Resolved" && "opacity-80")}>
      <div className="flex items-center gap-2">
        <Badge tone={priorityTone[t.priority]} dot>
          {t.priority}
        </Badge>
        <span className="text-xs text-slate-500">{t.category}</span>
        <span className="ml-auto font-mono text-[11px] text-slate-400">{t.id}</span>
      </div>
      <h3 className="mt-2.5 font-medium text-slate-900">{t.title}</h3>
      {t.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>}
      <dl className="mt-3 space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          {room ? (
            <Link href={`/residences/${room.residenceId}`} className="hover:text-brand-700">
              {roomLabel(ix, t.roomId)}
            </Link>
          ) : (
            "Unknown room"
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <User className="size-3.5 shrink-0" />
          {reporter ? (
            <Link href={`/students/${reporter.id}`} className="hover:text-brand-700">
              {fullName(reporter)}
            </Link>
          ) : (
            "Residence office"
          )}
        </div>
        {t.assignee && (
          <div className="flex items-center gap-1.5">
            <Wrench className="size-3.5 shrink-0" />
            <span className="truncate">{t.assignee}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          Reported {fmtAgo(t.createdAt).toLowerCase()}
          {t.resolvedAt && ` · resolved ${fmtAgo(t.resolvedAt).toLowerCase()}`}
        </div>
      </dl>
      <div className="mt-3.5 flex gap-2 border-t border-slate-100 pt-3">
        {t.status === "Open" && (
          <>
            <Button size="sm" onClick={() => move("In progress", `${t.title} assigned`)}>
              Start work
            </Button>
            <Button size="sm" variant="ghost" onClick={() => move("Resolved", `${t.title} resolved`)}>
              Resolve
            </Button>
          </>
        )}
        {t.status === "In progress" && (
          <Button size="sm" onClick={() => move("Resolved", `${t.title} resolved`)}>
            Mark resolved
          </Button>
        )}
        {t.status === "Resolved" && (
          <Button size="sm" variant="ghost" onClick={() => move("Open", `${t.title} reopened`)}>
            Reopen
          </Button>
        )}
      </div>
    </article>
  );
}
