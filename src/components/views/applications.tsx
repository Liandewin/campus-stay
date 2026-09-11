"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check, ClipboardList, Clock, Plus, TriangleAlert } from "lucide-react";
import { dispatch, useStore } from "@/lib/store";
import { ROOM_TYPES, availableRooms, freeBeds, fullName, getIndexes, roomLabel, sumFreeBeds, vacantBedsByType } from "@/lib/selectors";
import { COURSES, emailFor } from "@/lib/seed";
import { TODAY, fmtAgo, fmtDate, money } from "@/lib/format";
import { applicationTone, fundingTone } from "@/lib/tones";
import { toast } from "@/lib/toast";
import type { Application, ApplicationStatus, Funding, Room } from "@/lib/types";
import { Modal } from "../modal";
import { Avatar, Badge, Button, Card, EmptyState, Field, PageHeader, Tabs, buttonStyles, inputClass } from "../ui";

const TABS: ApplicationStatus[] = ["Pending", "Waitlisted", "Approved", "Declined"];

export function ApplicationsView() {
  const state = useStore();
  const ix = getIndexes(state);
  const [tab, setTab] = useState<ApplicationStatus>("Pending");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const approving = state.applications.find((a) => a.id === approvingId);
  const list = state.applications.filter((a) => a.status === tab);
  const vacancies = vacantBedsByType(state, ix);

  function setStatus(app: Application, status: "Pending" | "Waitlisted" | "Declined") {
    dispatch({ type: "setApplicationStatus", id: app.id, status });
    toast(status === "Pending" ? `${fullName(app)} moved back to pending` : `${fullName(app)} ${status.toLowerCase()}`);
  }

  return (
    <>
      <PageHeader
        title="Applications"
        description="Review accommodation requests and allocate free beds."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            New application
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="mr-1 text-slate-500">Free beds right now</span>
        {ROOM_TYPES.map((t) => (
          <Badge key={t} tone={vacancies[t] ? "green" : "gray"}>
            {t} · {vacancies[t]}
          </Badge>
        ))}
      </div>

      <Card>
        <div className="border-b border-slate-100 p-4">
          <Tabs
            tabs={TABS.map((t) => ({ id: t, label: t, count: state.applications.filter((a) => a.status === t).length }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState icon={ClipboardList} title={`No ${tab.toLowerCase()} applications`} description="New applications will show up here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((app) => {
              const res = ix.residences.get(app.preferredResidenceId);
              const matching = sumFreeBeds(
                state.rooms.filter((r) => r.residenceId === app.preferredResidenceId && r.type === app.preferredRoomType),
                ix,
              );
              return (
                <li key={app.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <Avatar name={fullName(app)} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{fullName(app)}</p>
                        <Badge tone={fundingTone[app.funding]}>{app.funding}</Badge>
                        {tab !== app.status && <Badge tone={applicationTone[app.status]}>{app.status}</Badge>}
                      </div>
                      <p className="truncate text-sm text-slate-500">
                        {app.course} · Year {app.year} · {app.studentNumber}
                      </p>
                      {app.note && <p className="mt-1 text-xs text-slate-500 italic">{app.note}</p>}
                    </div>
                  </div>

                  <div className="text-sm lg:w-52">
                    <p className="text-xs text-slate-500">Prefers</p>
                    <p className="font-medium text-slate-800">{res?.name}</p>
                    <p className={matching ? "text-xs text-emerald-600" : "text-xs text-amber-600"}>
                      {app.preferredRoomType} · {matching ? `${matching} matching bed${matching > 1 ? "s" : ""} free` : "none free"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 lg:w-24">
                    <Clock className="size-3.5" />
                    {fmtAgo(app.submittedAt)}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-64 lg:justify-end">
                    {(app.status === "Pending" || app.status === "Waitlisted") && (
                      <>
                        <Button size="sm" onClick={() => setApprovingId(app.id)}>
                          <Check />
                          Approve
                        </Button>
                        {app.status === "Pending" && (
                          <Button size="sm" variant="secondary" onClick={() => setStatus(app, "Waitlisted")}>
                            Waitlist
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setStatus(app, "Declined")}>
                          Decline
                        </Button>
                      </>
                    )}
                    {app.status === "Declined" && (
                      <Button size="sm" variant="secondary" onClick={() => setStatus(app, "Pending")}>
                        Reconsider
                      </Button>
                    )}
                    {app.status === "Approved" && app.studentId && ix.students.has(app.studentId) && (
                      <Link href={`/students/${app.studentId}`} className={buttonStyles("secondary", "sm")}>
                        View student
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={!!approving}
        onClose={() => setApprovingId(null)}
        title="Approve & allocate a bed"
        description={approving ? `${fullName(approving)} · ${approving.studentNumber}` : undefined}
      >
        {approving && <ApproveForm app={approving} onDone={() => setApprovingId(null)} />}
      </Modal>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New application"
        description="Capture an application received by email or at the front desk."
        size="lg"
      >
        <NewApplicationForm
          onDone={(created) => {
            setCreating(false);
            if (created) setTab("Pending");
          }}
        />
      </Modal>
    </>
  );
}

function ApproveForm({ app, onDone }: { app: Application; onDone: () => void }) {
  const state = useStore();
  const ix = getIndexes(state);
  const rooms = availableRooms(state, ix);
  const isMatch = (r: Room) => r.residenceId === app.preferredResidenceId && r.type === app.preferredRoomType;
  const matches = rooms.filter(isMatch);
  const others = rooms.filter((r) => !isMatch(r));
  const [roomId, setRoomId] = useState(matches[0]?.id ?? others[0]?.id ?? "");
  const room = ix.rooms.get(roomId);

  const label = (r: Room) =>
    `${ix.residences.get(r.residenceId)?.name} · ${r.number} — ${r.type}, ${money(r.rent)}/mo` +
    (r.capacity > 1 ? ` (${freeBeds(r, ix)} of ${r.capacity} beds free)` : "");

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Preference</dt>
          <dd className="font-medium">
            {ix.residences.get(app.preferredResidenceId)?.name}, {app.preferredRoomType}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Funding</dt>
          <dd className="font-medium">{app.funding}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Course</dt>
          <dd className="font-medium">
            {app.course}, year {app.year}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">Email</dt>
          <dd className="truncate font-medium">{app.email}</dd>
        </div>
      </dl>

      {matches.length === 0 && (
        <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 ring-inset">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          No free beds match their preference. Choose an alternative room, or waitlist the application instead.
        </div>
      )}

      <Field label="Room">
        <select className={inputClass} value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!rooms.length}>
          {rooms.length === 0 && <option value="">No free beds anywhere</option>}
          {matches.length > 0 && (
            <optgroup label="Matches preference">
              {matches.map((r) => (
                <option key={r.id} value={r.id}>
                  {label(r)}
                </option>
              ))}
            </optgroup>
          )}
          {others.length > 0 && (
            <optgroup label="Other rooms with free beds">
              {others.map((r) => (
                <option key={r.id} value={r.id}>
                  {label(r)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </Field>

      {room && (
        <p className="text-sm text-slate-600">
          This creates a lease from {fmtDate(TODAY)} to 30 Nov 2026 and a first invoice of{" "}
          <span className="font-medium text-slate-900">{money(room.rent)}</span>.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button
          disabled={!room}
          onClick={() => {
            dispatch({ type: "approveApplication", id: app.id, roomId });
            toast(`${fullName(app)} allocated to ${roomLabel(ix, roomId)}`);
            onDone();
          }}
        >
          <Check />
          Approve & allocate
        </Button>
      </div>
    </div>
  );
}

type Draft = Omit<Application, "id" | "submittedAt" | "status" | "note" | "studentId">;

function NewApplicationForm({ onDone }: { onDone: (created: boolean) => void }) {
  const state = useStore();
  const [form, setForm] = useState<Draft>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studentNumber: "",
    course: COURSES[0],
    year: 1,
    funding: "NSFAS",
    preferredResidenceId: state.residences[0].id,
    preferredRoomType: "Single",
  });
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setForm((f) => ({ ...f, [key]: value }));

  const types = ROOM_TYPES.filter((t) => state.rooms.some((r) => r.residenceId === form.preferredResidenceId && r.type === t));
  const roomType = types.includes(form.preferredRoomType) ? form.preferredRoomType : types[0];

  function submit(e: FormEvent) {
    e.preventDefault();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    dispatch({
      type: "addApplication",
      application: {
        ...form,
        firstName,
        lastName,
        email: form.email.trim() || emailFor(firstName, lastName),
        phone: form.phone.trim() || "—",
        studentNumber: form.studentNumber.trim() || "Pending",
        preferredRoomType: roomType,
      },
    });
    toast(`Application from ${firstName} ${lastName} added`);
    onDone(true);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input required className={inputClass} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </Field>
        <Field label="Last name">
          <input required className={inputClass} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Auto-generated if blank" />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+27 …" />
        </Field>
        <Field label="Student number">
          <input className={inputClass} value={form.studentNumber} onChange={(e) => set("studentNumber", e.target.value)} />
        </Field>
        <Field label="Funding">
          <select className={inputClass} value={form.funding} onChange={(e) => set("funding", e.target.value as Funding)}>
            {(["NSFAS", "Bursary", "Self-funded"] as const).map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Course">
          <select className={inputClass} value={form.course} onChange={(e) => set("course", e.target.value)}>
            {COURSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Year of study">
          <select className={inputClass} value={form.year} onChange={(e) => set("year", Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Preferred residence">
          <select className={inputClass} value={form.preferredResidenceId} onChange={(e) => set("preferredResidenceId", e.target.value)}>
            {state.residences.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room type">
          <select className={inputClass} value={roomType} onChange={(e) => set("preferredRoomType", e.target.value as Draft["preferredRoomType"])}>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={() => onDone(false)}>
          Cancel
        </Button>
        <Button type="submit">Add application</Button>
      </div>
    </form>
  );
}
