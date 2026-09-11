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
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, PageHeader, ViewAll, inputClass } from "../ui";

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="break-words text-slate-900">{children}</dd>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <div className="flex flex-col items-center border-b border-slate-100 p-6 text-center">
            <Avatar name={name} size="lg" />
            <p className="mt-3 font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">{student.studentNumber}</p>
            <div className="mt-3 flex gap-2">
              <Badge tone={active ? "green" : "gray"} dot>
                {student.status}
              </Badge>
              <Badge tone={fundingTone[student.funding]}>{student.funding}</Badge>
            </div>
          </div>
          <dl className="space-y-4 p-5 text-sm">
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

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Accommodation"
              subtitle={active ? undefined : "Checked out — last room shown below"}
              action={residence && <ViewAll href={`/residences/${residence.id}`} label="View residence" />}
            />
            {room && residence ? (
              <div className="p-5">
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["Residence", residence.name],
                      ["Room", `${room.number} · floor ${room.floor}`],
                      ["Type", room.type],
                      ["Rent", `${money(room.rent)}/mo`],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="truncate text-sm font-medium text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                {roommates.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-slate-500">Roommate:</span>
                    {roommates.map((r) => (
                      <Link key={r.id} href={`/students/${r.id}`} className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pr-3 pl-1 hover:bg-slate-200">
                        <Avatar name={fullName(r)} size="xs" />
                        {fullName(r)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState title="No room assigned" />
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Rent & payments"
              subtitle={
                balance.total
                  ? `${money(balance.total)} outstanding${balance.overdue ? ` · ${money(balance.overdue)} overdue` : ""}`
                  : "All invoices settled"
              }
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const status = invoiceStatus(inv);
                    return (
                      <tr key={inv.id}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{fmtPeriod(inv.period)}</p>
                          <p className="font-mono text-xs text-slate-400">{inv.id}</p>
                        </td>
                        <td className="px-5 py-3 tabular-nums">{money(inv.amount)}</td>
                        <td className="hidden px-5 py-3 text-slate-500 sm:table-cell">Due {fmtDate(inv.dueDate)}</td>
                        <td className="px-5 py-3">
                          <Badge tone={invoiceTone[status]} dot>
                            {status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {inv.paidAt ? (
                            <span className="text-xs whitespace-nowrap text-slate-500">Paid {fmtDay(inv.paidAt)}</span>
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
            <CardHeader title="Maintenance requests" subtitle={`${tickets.length} logged by this student`} />
            {tickets.length ? (
              <ul className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.category} · {fmtAgo(t.createdAt)}
                        {t.assignee ? ` · ${t.assignee}` : ""}
                      </p>
                    </div>
                    <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                    <Badge tone={ticketTone[t.status]} dot>
                      {t.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">No requests logged.</p>
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
