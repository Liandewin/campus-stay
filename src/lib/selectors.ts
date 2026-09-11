import type { Invoice, Priority, Residence, Room, RoomType, State, Student, Ticket, TicketCategory } from "./types";
import { TODAY } from "./format";

export type RoomStatus = "Vacant" | "Partial" | "Full" | "Maintenance";
export type InvoiceStatus = "Paid" | "Due" | "Overdue";

export const ROOM_TYPES: RoomType[] = ["Single", "Double", "En-suite", "Studio"];
export const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];
export const PRIORITY_RANK: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
export const CATEGORIES: TicketCategory[] = ["Plumbing", "Electrical", "Furniture", "Internet", "Pest control", "Other"];

export type Indexes = {
  rooms: Map<string, Room>;
  residences: Map<string, Residence>;
  students: Map<string, Student>;
  /** Active students per room. */
  occupants: Map<string, Student[]>;
  invoicesByStudent: Map<string, Invoice[]>;
  ticketsByRoom: Map<string, Ticket[]>;
};

function groupBy<T>(items: T[], key: (item: T) => string | null) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (k === null) continue;
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

const cache = new WeakMap<State, Indexes>();

/** Lookup tables for a state snapshot, memoised per snapshot. */
export function getIndexes(state: State): Indexes {
  let ix = cache.get(state);
  if (!ix) {
    ix = {
      rooms: new Map(state.rooms.map((r) => [r.id, r])),
      residences: new Map(state.residences.map((r) => [r.id, r])),
      students: new Map(state.students.map((s) => [s.id, s])),
      occupants: groupBy(state.students, (s) => (s.status === "Active" ? s.roomId : null)),
      invoicesByStudent: groupBy(state.invoices, (i) => i.studentId),
      ticketsByRoom: groupBy(state.tickets, (t) => t.roomId),
    };
    cache.set(state, ix);
  }
  return ix;
}

export function fullName(p: { firstName: string; lastName: string }) {
  return `${p.firstName} ${p.lastName}`;
}

export function roomStatus(room: Room, occupantCount: number): RoomStatus {
  if (room.maintenance) return "Maintenance";
  if (occupantCount === 0) return "Vacant";
  return occupantCount < room.capacity ? "Partial" : "Full";
}

export function freeBeds(room: Room, ix: Indexes) {
  if (room.maintenance) return 0;
  return room.capacity - (ix.occupants.get(room.id)?.length ?? 0);
}

export function sumFreeBeds(rooms: Room[], ix: Indexes) {
  return rooms.reduce((total, room) => total + freeBeds(room, ix), 0);
}

export function residenceStats(state: State, ix: Indexes, residenceId?: string) {
  const rooms = residenceId ? state.rooms.filter((r) => r.residenceId === residenceId) : state.rooms;
  let beds = 0;
  let occupied = 0;
  let vacantBeds = 0;
  let blocked = 0;
  for (const room of rooms) {
    beds += room.capacity;
    occupied += ix.occupants.get(room.id)?.length ?? 0;
    vacantBeds += freeBeds(room, ix);
    if (room.maintenance) blocked++;
  }
  return { rooms: rooms.length, beds, occupied, vacantBeds, blocked, occupancy: beds ? occupied / beds : 0 };
}

export function vacantBedsByType(state: State, ix: Indexes) {
  const counts = Object.fromEntries(ROOM_TYPES.map((t) => [t, 0])) as Record<RoomType, number>;
  for (const room of state.rooms) counts[room.type] += freeBeds(room, ix);
  return counts;
}

export function availableRooms(state: State, ix: Indexes) {
  return state.rooms.filter((r) => freeBeds(r, ix) > 0);
}

export function roomLabel(ix: Indexes, roomId: string | null) {
  const room = roomId ? ix.rooms.get(roomId) : undefined;
  if (!room) return "No room";
  return `${ix.residences.get(room.residenceId)?.name ?? "?"} · ${room.number}`;
}

export function invoiceStatus(inv: Invoice): InvoiceStatus {
  if (inv.paidAt) return "Paid";
  return inv.dueDate < TODAY ? "Overdue" : "Due";
}

export function studentBalance(ix: Indexes, studentId: string) {
  let due = 0;
  let overdue = 0;
  for (const inv of ix.invoicesByStudent.get(studentId) ?? []) {
    const status = invoiceStatus(inv);
    if (status === "Due") due += inv.amount;
    if (status === "Overdue") overdue += inv.amount;
  }
  return { due, overdue, total: due + overdue };
}
