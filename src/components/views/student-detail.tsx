"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeftRight, CalendarDays, GraduationCap, LogOut, Mail, Phone, Wrench, type LucideIcon } from "lucide-react";
import { dispatch, useStore } from "@/lib/store";
import { availableRooms, freeBeds, fullName, getIndexes, invoiceStatus, roomLabel, studentBalance } from "@/lib/selectors";
import { fmtAgo, fmtDate, fmtDay, fmtPeriod, money } from "@/lib/format";
import { fundingTone, invoiceTone, priorityTone, ticketTone } from "@/lib/tones";
import { toast } from "@/lib/toast";
import type { Student } from "@/lib/types";
import { Modal } from "../modal";
import { TicketForm } from "../ticket-form";
import { Avatar, Badge, Button, Card, CardHeader, Dot, EmptyState, Field, PageHeader, Status, ViewAll, cx, inputClass } from "../ui";

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-slate-50 py-3 last:border-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">{label}</dt>
        <dd className="mt-0.5 text-[13px] break-words text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

export function StudentDetailView({ id }: { id: string }) {
  const state = useStore();
  const ix = getIndexes(state);
  const [modal, setModal] = useState<null | "move" | "checkout" | "issue">(null);
  const close = () => setModal(null);

  const student = ix.students.get(id);
  if (!student) {
    return (
      <>
        <PageHeader back={{ href: "/students", label: "All students" }} title="Student not found" />
        <Card>
          <EmptyState title="We couldn't find that student" description="They may have been removed when the demo data was reset." />
        </Card>
      </>
    );
  }

  const name = fullName(student);
  const active = student.status === "Active";
  const room = student.roomId ? ix.rooms.get(student.roomId) : undefined;
  const residence = room ? ix.residences.get(room.residenceId) : undefined;
  const roommates = room && active ? (ix.occupants.get(room.id) ?? []).filter((s) => s.id !== student.id) : [];
  const invoices = [...(ix.invoicesByStudent.get(student.id) ?? [])].sort((a, b) => b.period.localeCompare(a.period));
  const balance = studentBalance(ix, student.id);
  const tickets = state.tickets.filter((t) => t.studentId === student.id);

  return (
    <>
      <PageHeader
        back={{ href: "/students", label: "All students" }}
        title={name}
        description={`${student.studentNumber} · ${student.course} · Year ${student.year}`}
        actions={
          <>
            {active && room && (
              <Button variant="secondary" onClick={() => setModal("issue")}>
                <Wrench />
                Log issue
              </Button>
            )}
            <Button variant="secondary" onClick={() => setModal("move")}>
              <ArrowLeftRight />
              {active ? "Move room" : "Re-admit"}
            </Button>
            {active && (
              <Button variant="danger" onClick={() => setModal("checkout")}>
                <LogOut />
                Check out
              </Button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3.5 border-b border-slate-100 bg-linear-160 from-brand-50 to-white p-[22px]">
            <Avatar name={name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-slate-900">{name}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">{student.studentNumber}</p>
              <div className="mt-2 flex gap-1.5">
                <Badge tone={active ? "green" : "gray"} dot>
                  {student.status}
                </Badge>
                <Badge tone={fundingTone[student.funding]}>{student.funding}</Badge>
              </div>
            </div>
          </div>
          <dl className="px-5 pt-1.5 pb-4">
            <Detail icon={Mail} label="Email">
              <a href={`mailto:${student.email}`} className="hover:text-brand-700">
                {student.email}
              </a>
            </Detail>
            <Detail icon={Phone} label="Phone">
              {student.phone}
            </Detail>
            <Detail icon={GraduationCap} label="Studies">
              {student.course}, year {student.year}
            </Detail>
            <Detail icon={CalendarDays} label="Lease">
              {fmtDate(student.leaseStart)} – {fmtDate(student.leaseEnd)}
            </Detail>
          </dl>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Accommodation"
              subtitle={active ? undefined : "Checked out — last room shown below"}
              action={residence && <ViewAll href={`/residences/${residence.id}`} label="View residence" />}
            />
            {room && residence ? (
              <>
                <dl className="grid grid-cols-2 sm:grid-cols-4">
                  {(
                    [
                      ["Residence", residence.name],
                      ["Room", `${room.number} · floor ${room.floor}`],
                      ["Type", room.type],
                      ["Rent", `${money(room.rent)}/mo`],
                    ] as const
                  ).map(([label, value], i) => (
                    <div key={label} className={cx("border-slate-50 px-5 py-4", i % 2 === 1 && "border-l", i >= 2 && "max-sm:border-t", i === 2 && "sm:border-l")}>
                      <dt className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">{label}</dt>
                      <dd className="mt-[5px] truncate text-sm font-semibold text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                {roommates.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3.5 text-[13px]">
                    <span className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">Roommate</span>
                    {roommates.map((r) => (
                      <Link key={r.id} href={`/students/${r.id}`} className="inline-flex items-center gap-2 rounded-full bg-slate-50 py-1 pr-3 pl-1 text-slate-700 hover:bg-slate-100">
                        <Avatar name={fullName(r)} size="xs" />
                        {fullName(r)}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState title="No room assigned" />
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Rent & payments"
              action={
                <span className={cx("text-xs font-semibold", balance.overdue ? "text-rose-600" : balance.total ? "text-slate-700" : "text-emerald-600")}>
                  {balance.total
                    ? `${money(balance.total)} outstanding${balance.overdue ? ` · ${money(balance.overdue)} overdue` : ""}`
                    : "All invoices settled"}
                </span>
              }
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13.5px]">
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => {
                    const status = invoiceStatus(inv);
                    return (
                      <tr key={inv.id}>
                        <td className="px-5 py-[13px]">
                          <p className="font-semibold text-slate-900">{fmtPeriod(inv.period)}</p>
                          <p className="mt-px font-mono text-[11.5px] text-slate-400">{inv.id}</p>
                        </td>
                        <td className="px-5 py-[13px] text-slate-700 tabular-nums">{money(inv.amount)}</td>
                        <td className="hidden px-5 py-[13px] text-[12.5px] text-slate-500 sm:table-cell">Due {fmtDate(inv.dueDate)}</td>
                        <td className="px-5 py-[13px]">
                          <Status tone={invoiceTone[status]}>{status}</Status>
                        </td>
                        <td className="px-5 py-[13px] text-right">
                          {inv.paidAt ? (
                            <span className="text-xs whitespace-nowrap text-slate-400">Paid {fmtDay(inv.paidAt)}</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                dispatch({ type: "markInvoicePaid", id: inv.id });
                                toast(`${money(inv.amount)} payment recorded`);
                              }}
                            >
                              Mark paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Maintenance requests</h2>
              <span className="rounded-full bg-slate-50 px-2 py-px text-[11px] font-semibold text-slate-550">{tickets.length}</span>
            </div>
            {tickets.length ? (
              <ul className="divide-y divide-slate-50">
                {tickets.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-[13px]">
                    <Dot tone={priorityTone[t.priority]} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-slate-900">{t.title}</p>
                      <p className="mt-px text-[11.5px] text-slate-500">
                        {t.category} · {t.priority} · {fmtAgo(t.createdAt)}
                        {t.assignee ? ` · ${t.assignee}` : ""}
                      </p>
                    </div>
                    <Badge tone={ticketTone[t.status]}>{t.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-[22px] text-[13px] text-slate-500">No requests logged for this student.</p>
            )}
          </Card>
        </div>
      </div>

      <Modal open={modal === "move"} onClose={close} title={active ? "Move to another room" : "Re-admit student"} description={name}>
        <MoveRoomForm student={student} onDone={close} />
      </Modal>

      <Modal open={modal === "checkout"} onClose={close} title="Check out student" description={name}>
        <p className="text-sm text-slate-600">
          {student.firstName} will be checked out of <span className="font-medium text-slate-900">{roomLabel(ix, student.roomId)}</span>{" "}
          today and the bed becomes available for allocation.
          {balance.total > 0 && ` Their outstanding balance of ${money(balance.total)} stays on account.`}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              dispatch({ type: "checkOutStudent", studentId: student.id });
              toast(`${name} checked out`);
              close();
            }}
          >
            Check out
          </Button>
        </div>
      </Modal>

      <Modal open={modal === "issue"} onClose={close} title="Log a maintenance request" description={`Reported by ${name}`}>
        {room && <TicketForm roomId={room.id} studentId={student.id} onDone={close} />}
      </Modal>
    </>
  );
}

function MoveRoomForm({ student, onDone }: { student: Student; onDone: () => void }) {
  const state = useStore();
  const ix = getIndexes(state);
  const currentRoom = student.roomId ? ix.rooms.get(student.roomId) : undefined;
  const [residenceId, setResidenceId] = useState(currentRoom?.residenceId ?? state.residences[0].id);
  const [roomId, setRoomId] = useState("");

  const options = availableRooms(state, ix).filter(
    (r) => r.residenceId === residenceId && !(student.status === "Active" && r.id === student.roomId),
  );
  const selected = options.some((r) => r.id === roomId) ? roomId : (options[0]?.id ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    dispatch({ type: "moveStudent", studentId: student.id, roomId: selected });
    toast(`${fullName(student)} moved to ${roomLabel(ix, selected)}`);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Residence">
        <select className={inputClass} value={residenceId} onChange={(e) => setResidenceId(e.target.value)}>
          {state.residences.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Room with a free bed">
        <select className={inputClass} value={selected} onChange={(e) => setRoomId(e.target.value)} disabled={!options.length}>
          {options.length === 0 && <option>No free beds in this residence</option>}
          {options.map((r) => (
            <option key={r.id} value={r.id}>
              {r.number} — {r.type}, {money(r.rent)}/mo
              {r.capacity > 1 ? ` (${freeBeds(r, ix)} of ${r.capacity} beds free)` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selected}>
          {student.status === "Active" ? "Move student" : "Re-admit"}
        </Button>
      </div>
    </form>
  );
}
