import { useSyncExternalStore } from "react";
import type { Activity, Application, Invoice, State, Student, Ticket, TicketStatus } from "./types";
import { ASSIGNEES, SEED } from "./seed";
import { CURRENT_PERIOD, TODAY, demoNow, fmtPeriod, money } from "./format";
import { fullName, getIndexes, roomLabel } from "./selectors";

// A tiny client-side store: the seed is the server snapshot, and any changes
// made in the demo are persisted to localStorage so they survive reloads.

const STORAGE_KEY = "campusstay-demo-v1";
/** Leases created in the demo run to the end of the academic year. */
const LEASE_END = "2026-11-30";

export type Action =
  | { type: "approveApplication"; id: string; roomId: string }
  | { type: "setApplicationStatus"; id: string; status: "Pending" | "Waitlisted" | "Declined" }
  | { type: "addApplication"; application: Omit<Application, "id" | "submittedAt" | "status"> }
  | { type: "addTicket"; ticket: Pick<Ticket, "roomId" | "studentId" | "title" | "description" | "category" | "priority"> }
  | { type: "setTicketStatus"; id: string; status: TicketStatus }
  | { type: "markInvoicePaid"; id: string }
  | { type: "moveStudent"; studentId: string; roomId: string }
  | { type: "checkOutStudent"; studentId: string }
  | { type: "toggleRoomMaintenance"; roomId: string }
  | { type: "log"; kind: Activity["kind"]; text: string; href?: string }
  | { type: "reset" };

function uid(prefix: string) {
  return prefix + Date.now().toString(36).slice(-5).toUpperCase() + Math.floor(Math.random() * 36).toString(36).toUpperCase();
}

function log(state: State, kind: Activity["kind"], text: string, href?: string): State {
  const entry: Activity = { id: uid("act-"), at: demoNow(), kind, text, href };
  return { ...state, activity: [entry, ...state.activity].slice(0, 60) };
}

function hasFreeBed(state: State, roomId: string) {
  const ix = getIndexes(state);
  const room = ix.rooms.get(roomId);
  return !!room && !room.maintenance && (ix.occupants.get(roomId)?.length ?? 0) < room.capacity;
}

function reducer(state: State, action: Action): State {
  const ix = getIndexes(state);
  switch (action.type) {
    case "approveApplication": {
      const app = state.applications.find((a) => a.id === action.id);
      const room = ix.rooms.get(action.roomId);
      if (!app || !room || app.status === "Approved" || !hasFreeBed(state, room.id)) return state;
      const student: Student = {
        id: uid("S"),
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        studentNumber: app.studentNumber,
        course: app.course,
        year: app.year,
        funding: app.funding,
        roomId: room.id,
        leaseStart: TODAY,
        leaseEnd: LEASE_END,
        status: "Active",
      };
      const invoice: Invoice = {
        id: uid("INV-"),
        studentId: student.id,
        period: CURRENT_PERIOD,
        amount: room.rent,
        dueDate: "2026-09-30",
      };
      const where = roomLabel(ix, room.id);
      return log(
        {
          ...state,
          students: [...state.students, student],
          invoices: [...state.invoices, invoice],
          applications: state.applications.map((a) =>
            a.id === app.id ? { ...a, status: "Approved", note: `Allocated to ${where}`, studentId: student.id } : a,
          ),
        },
        "application",
        `${fullName(app)} approved and allocated to ${where}`,
        `/students/${student.id}`,
      );
    }
    case "setApplicationStatus": {
      const app = state.applications.find((a) => a.id === action.id);
      if (!app) return state;
      const note = action.status === "Waitlisted" ? "Added to the waitlist" : action.status === "Declined" ? "Application declined" : undefined;
      return log(
        { ...state, applications: state.applications.map((a) => (a.id === app.id ? { ...a, status: action.status, note } : a)) },
        "application",
        `${fullName(app)}'s application ${action.status === "Pending" ? "moved back to pending" : action.status.toLowerCase()}`,
        "/applications",
      );
    }
    case "addApplication": {
      const app: Application = { ...action.application, id: uid("A"), submittedAt: demoNow(), status: "Pending" };
      return log(
        { ...state, applications: [app, ...state.applications] },
        "application",
        `New application from ${fullName(app)} for ${ix.residences.get(app.preferredResidenceId)?.name}`,
        "/applications",
      );
    }
    case "addTicket": {
      const ticket: Ticket = { ...action.ticket, id: uid("T-"), status: "Open", createdAt: demoNow() };
      return log(
        { ...state, tickets: [ticket, ...state.tickets] },
        "maintenance",
        `${ticket.title} reported in ${roomLabel(ix, ticket.roomId)}`,
        "/maintenance",
      );
    }
    case "setTicketStatus": {
      const ticket = state.tickets.find((t) => t.id === action.id);
      if (!ticket) return state;
      const updated: Ticket = {
        ...ticket,
        status: action.status,
        assignee: ticket.assignee ?? (action.status !== "Open" ? ASSIGNEES[ticket.category] : undefined),
        resolvedAt: action.status === "Resolved" ? demoNow() : undefined,
      };
      const verb = { Open: "reopened", "In progress": "picked up", Resolved: "resolved" }[action.status];
      return log(
        { ...state, tickets: state.tickets.map((t) => (t.id === ticket.id ? updated : t)) },
        "maintenance",
        `${ticket.title} in ${roomLabel(ix, ticket.roomId)} ${verb}`,
        "/maintenance",
      );
    }
    case "markInvoicePaid": {
      const inv = state.invoices.find((i) => i.id === action.id);
      const student = inv && ix.students.get(inv.studentId);
      if (!inv || inv.paidAt || !student) return state;
      return log(
        { ...state, invoices: state.invoices.map((i) => (i.id === inv.id ? { ...i, paidAt: demoNow() } : i)) },
        "payment",
        `${fullName(student)} paid ${money(inv.amount)} for ${fmtPeriod(inv.period)}`,
        `/students/${student.id}`,
      );
    }
    case "moveStudent": {
      const student = ix.students.get(action.studentId);
      if (!student || !hasFreeBed(state, action.roomId)) return state;
      return log(
        {
          ...state,
          students: state.students.map((s) =>
            s.id !== student.id
              ? s
              : student.status === "Active"
                ? { ...s, roomId: action.roomId }
                : // Re-admission starts a fresh lease; the old one ended at checkout.
                  { ...s, roomId: action.roomId, status: "Active", leaseStart: TODAY, leaseEnd: LEASE_END },
          ),
        },
        "room",
        `${fullName(student)} ${student.status === "Active" ? "moved" : "re-admitted"} to ${roomLabel(ix, action.roomId)}`,
        `/students/${student.id}`,
      );
    }
    case "checkOutStudent": {
      const student = ix.students.get(action.studentId);
      if (!student || student.status !== "Active") return state;
      return log(
        {
          ...state,
          students: state.students.map((s) => (s.id === student.id ? { ...s, status: "Checked out", leaseEnd: TODAY } : s)),
        },
        "room",
        `${fullName(student)} checked out of ${roomLabel(ix, student.roomId)}`,
        `/students/${student.id}`,
      );
    }
    case "toggleRoomMaintenance": {
      const room = ix.rooms.get(action.roomId);
      if (!room) return state;
      return log(
        { ...state, rooms: state.rooms.map((r) => (r.id === room.id ? { ...r, maintenance: !r.maintenance } : r)) },
        "room",
        `${roomLabel(ix, room.id)} ${room.maintenance ? "reopened for allocation" : "blocked for maintenance"}`,
        `/residences/${room.residenceId}`,
      );
    }
    case "log":
      return log(state, action.kind, action.text, action.href);
    case "reset":
      return SEED;
  }
}

let state: State = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) state = JSON.parse(saved) as State;
  } catch {
    // Corrupt or unavailable storage: fall back to the seed.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  hydrate();
  return state;
}

function getServerSnapshot() {
  return SEED;
}

export function dispatch(action: Action) {
  hydrate();
  state = reducer(state, action);
  try {
    if (action.type === "reset") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
