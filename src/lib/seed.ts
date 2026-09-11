import type {
  Activity,
  Application,
  ApplicationStatus,
  Funding,
  Invoice,
  Priority,
  Residence,
  Room,
  RoomType,
  State,
  Student,
  Ticket,
  TicketCategory,
  TicketStatus,
} from "./types";
import { TODAY, addDays, fmtPeriod, money } from "./format";

export const COURSES = [
  "BSc Computer Science",
  "BCom Accounting",
  "BA Psychology",
  "BEng Civil Engineering",
  "MBChB Medicine",
  "LLB Law",
  "BSc Actuarial Science",
  "BEd Foundation Phase",
  "BArch Architecture",
  "BSc Biochemistry",
  "BCom Economics",
  "BA Film & Media",
];

export const RENT: Record<RoomType, number> = {
  Single: 4200,
  Double: 3450,
  "En-suite": 5400,
  Studio: 6900,
};

export const ASSIGNEES: Record<TicketCategory, string> = {
  Plumbing: "Sizwe Ngcobo · Facilities",
  Electrical: "André Fourie · Electrical",
  Furniture: "Sizwe Ngcobo · Facilities",
  Internet: "IT Service Desk",
  "Pest control": "PestAway (contractor)",
  Other: "Facilities team",
};

export const RESIDENCES: Residence[] = [
  {
    id: "protea",
    name: "Protea House",
    kind: "Catered hall",
    tagline: "Classic catered residence in the heart of main campus.",
    address: "12 University Ave, Rondebosch",
    manager: "Nomvula Khumalo",
    managerPhone: "+27 21 650 1101",
    amenities: ["Dining hall", "Study rooms", "Laundry", "24h security"],
    accent: "from-rose-500 to-orange-400",
  },
  {
    id: "fynbos",
    name: "Fynbos Hall",
    kind: "Self-catering hall",
    tagline: "Quiet self-catering hall a short walk from the library.",
    address: "3 Mountain Rd, Rondebosch",
    manager: "Pieter van Wyk",
    managerPhone: "+27 21 650 1102",
    amenities: ["Shared kitchens", "Gym", "Bike storage", "Laundry"],
    accent: "from-emerald-500 to-teal-400",
  },
  {
    id: "jacaranda",
    name: "Jacaranda Court",
    kind: "Apartments",
    tagline: "Shared apartments for senior undergraduates.",
    address: "48 Main Rd, Mowbray",
    manager: "Aisha Patel",
    managerPhone: "+27 21 650 1103",
    amenities: ["Private kitchens", "Fibre Wi‑Fi", "Parking", "Braai area"],
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    id: "harbour",
    name: "Harbour Lofts",
    kind: "Studios",
    tagline: "Private studios for final-years and postgrads.",
    address: "7 Station Rd, Observatory",
    manager: "Daniel Mokoena",
    managerPhone: "+27 21 650 1104",
    amenities: ["Private bathroom", "Kitchenette", "Rooftop lounge", "Gym"],
    accent: "from-sky-500 to-indigo-400",
  },
];

const LAYOUTS: Record<
  string,
  { floors: number; perFloor: number; type: (i: number) => RoomType; fill: number; years: number[] }
> = {
  protea: { floors: 4, perFloor: 8, type: (i) => (i % 3 === 0 ? "Double" : "Single"), fill: 0.93, years: [1, 1, 1, 2] },
  fynbos: { floors: 3, perFloor: 10, type: (i) => (i < 4 ? "En-suite" : "Single"), fill: 0.88, years: [1, 2, 2, 3] },
  jacaranda: { floors: 3, perFloor: 6, type: (i) => (i % 2 ? "Double" : "En-suite"), fill: 0.85, years: [3, 3, 4] },
  harbour: { floors: 5, perFloor: 5, type: () => "Studio", fill: 0.8, years: [4, 4, 5] },
};

const BLOCKED_ROOMS: [roomId: string, title: string, description: string, category: TicketCategory][] = [
  ["protea-203", "Water damage repairs", "Room closed while the ceiling and flooring are repaired after a burst pipe.", "Plumbing"],
  ["fynbos-107", "Repainting & new flooring", "Scheduled refurbishment between occupants.", "Other"],
  ["harbour-402", "Kitchenette replacement", "Counter and hob being replaced; electrician to sign off afterwards.", "Electrical"],
];

const ISSUES: [TicketCategory, string, string, Priority][] = [
  ["Plumbing", "Leaking shower head", "Shower drips constantly and the bathroom floor stays wet.", "Medium"],
  ["Plumbing", "Blocked basin", "Basin drains very slowly and water pools after use.", "Low"],
  ["Plumbing", "No hot water", "Geyser seems to be off — no hot water since last night.", "Urgent"],
  ["Electrical", "Plug point sparking", "The plug next to the desk sparks when anything is plugged in.", "Urgent"],
  ["Electrical", "Ceiling light not working", "Main light flickers for a few seconds and then turns off.", "Medium"],
  ["Furniture", "Broken desk chair", "Chair base has cracked and it isn't safe to sit on.", "Low"],
  ["Furniture", "Wardrobe door off hinge", "Left wardrobe door has come off its top hinge.", "Low"],
  ["Internet", "Wi‑Fi keeps dropping", "Connection drops every few minutes — can't stay in online lectures.", "High"],
  ["Internet", "No signal in corridor", "The access point on the landing seems to be down.", "High"],
  ["Pest control", "Cockroaches in kitchen", "Several spotted in the shared kitchen cupboards this week.", "High"],
  ["Other", "Window latch broken", "Window won't lock properly.", "Medium"],
  ["Other", "Damp patch on wall", "Mould forming in the corner near the window.", "Medium"],
];

const FIRST = [
  "Thabo", "Lerato", "Sipho", "Aisha", "Pieter", "Naledi", "Zanele", "Ruan", "Kagiso", "Amahle",
  "Jessica", "Liam", "Mpho", "Keegan", "Ayanda", "Tariq", "Nomsa", "Johan", "Busisiwe", "Daniel",
  "Palesa", "Ethan", "Refilwe", "Yusuf", "Anika", "Themba", "Megan", "Lwazi", "Carla", "Bongani",
  "Priya", "Siyabonga", "Chloe", "Tshepo", "Imaan", "Kyle", "Nandi", "Riaan", "Zinhle", "Michael",
  "Khanyisile", "Joshua", "Lindiwe", "Ryan",
];
const LAST = [
  "Nkosi", "Botha", "Dlamini", "Naidoo", "van der Merwe", "Mokoena", "Pillay", "Khumalo", "Smith",
  "Jacobs", "Ndlovu", "Adams", "Mahlangu", "Coetzee", "Govender", "Zulu", "Petersen", "Mthembu",
  "du Plessis", "Sithole", "Moodley", "Baloyi", "Williams", "Maseko", "Hendricks", "Nel", "Mabaso",
  "Isaacs", "Molefe", "Pretorius",
];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function emailFor(firstName: string, lastName: string) {
  return `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "") + "@students.example.ac.za";
}

/** Deterministic, so server and client produce identical data. */
function createSeed(): State {
  const rand = mulberry32(20260911);
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const at = (date: string) => `${date}T${pad(int(7, 21))}:${pad(int(0, 59))}:00`;

  const usedNames = new Set<string>();
  const person = () => {
    for (;;) {
      const firstName = pick(FIRST);
      const lastName = pick(LAST);
      if (usedNames.has(firstName + lastName)) continue;
      usedNames.add(firstName + lastName);
      const prefix = pick(["71", "72", "73", "74", "76", "79", "82", "83", "84"]);
      return {
        firstName,
        lastName,
        email: emailFor(firstName, lastName),
        phone: `+27 ${prefix} ${int(100, 999)} ${int(1000, 9999)}`,
      };
    }
  };
  const funding = (): Funding => {
    const r = rand();
    return r < 0.45 ? "NSFAS" : r < 0.65 ? "Bursary" : "Self-funded";
  };
  const studentNumber = (year: number) => `${2027 - year}${int(10000, 99999)}`;

  // Rooms, with students filling most beds.
  const blocked = new Set(BLOCKED_ROOMS.map(([id]) => id));
  const rooms: Room[] = [];
  const students: Student[] = [];
  for (const res of RESIDENCES) {
    const layout = LAYOUTS[res.id];
    for (let floor = 1; floor <= layout.floors; floor++) {
      for (let i = 0; i < layout.perFloor; i++) {
        const type = layout.type(i);
        const number = `${floor}${pad(i + 1)}`;
        const room: Room = {
          id: `${res.id}-${number}`,
          residenceId: res.id,
          number,
          floor,
          type,
          capacity: type === "Double" ? 2 : 1,
          rent: RENT[type],
          maintenance: blocked.has(`${res.id}-${number}`),
        };
        rooms.push(room);
        if (room.maintenance) continue;
        for (let bed = 0; bed < room.capacity; bed++) {
          if (rand() > layout.fill) continue;
          const year = pick(layout.years);
          students.push({
            id: `S${1001 + students.length}`,
            ...person(),
            studentNumber: studentNumber(year),
            course: pick(COURSES),
            year,
            funding: funding(),
            roomId: room.id,
            leaseStart: "2026-02-01",
            leaseEnd: "2026-11-30",
            status: "Active",
          });
        }
      }
    }
  }
  const roomById = new Map(rooms.map((r) => [r.id, r]));

  // Three months of rent; older months are mostly settled.
  const periods: [string, number][] = [
    ["2026-07", 0.97],
    ["2026-08", 0.87],
    ["2026-09", 0.52],
  ];
  const invoices: Invoice[] = [];
  for (const s of students) {
    for (const [period, paidRate] of periods) {
      const lastPayDay = period === TODAY.slice(0, 7) ? Number(TODAY.slice(8, 10)) : 20;
      invoices.push({
        id: `INV-${period.replace("-", "")}-${s.id.slice(1)}`,
        studentId: s.id,
        period,
        amount: roomById.get(s.roomId!)!.rent,
        dueDate: `${period}-15`,
        ...(rand() < paidRate ? { paidAt: at(`${period}-${pad(int(1, lastPayDay))}`) } : {}),
      });
    }
  }

  const appStatuses: ApplicationStatus[] = [
    ...Array<ApplicationStatus>(9).fill("Pending"),
    "Waitlisted",
    "Waitlisted",
    "Approved",
    "Approved",
    "Declined",
  ];
  const notes: Partial<Record<ApplicationStatus, string>> = {
    Waitlisted: "Preferred residence full — on the waitlist",
    Approved: "Offer accepted, moved in",
    Declined: "Not registered for the 2026 academic year",
  };
  const applications: Application[] = appStatuses
    .map((status, i): Application => {
      const res = pick(RESIDENCES);
      const year = int(1, 4);
      const types = [...new Set(rooms.filter((r) => r.residenceId === res.id).map((r) => r.type))];
      return {
        id: `A${301 + i}`,
        ...person(),
        studentNumber: studentNumber(year),
        course: pick(COURSES),
        year,
        funding: funding(),
        preferredResidenceId: res.id,
        preferredRoomType: pick(types),
        submittedAt: at(addDays(TODAY, -int(0, 24))),
        status,
        note: notes[status],
      };
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  // Maintenance tickets reported by residents, plus the blocked rooms.
  const occupants = new Map<string, Student[]>();
  for (const s of students) occupants.set(s.roomId!, [...(occupants.get(s.roomId!) ?? []), s]);
  const occupiedRooms = rooms.filter((r) => occupants.has(r.id));
  const issues = [...ISSUES];
  for (let i = issues.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [issues[i], issues[j]] = [issues[j], issues[i]];
  }
  const ticketStatuses: TicketStatus[] = [
    ...Array<TicketStatus>(7).fill("Open"),
    ...Array<TicketStatus>(5).fill("In progress"),
    ...Array<TicketStatus>(6).fill("Resolved"),
  ];
  const tickets: Ticket[] = ticketStatuses.map((status, i) => {
    const [category, title, description, priority] = issues[i % issues.length];
    const room = pick(occupiedRooms);
    const created = addDays(TODAY, -(status === "Resolved" ? int(5, 26) : int(0, 9)));
    return {
      id: `T-${2401 + i}`,
      roomId: room.id,
      studentId: pick(occupants.get(room.id)!).id,
      title,
      description,
      category,
      priority,
      status,
      createdAt: at(created),
      ...(status === "Resolved" ? { resolvedAt: at(addDays(created, int(1, 4))) } : {}),
      ...(status !== "Open" ? { assignee: ASSIGNEES[category] } : {}),
    };
  });
  for (const [roomId, title, description, category] of BLOCKED_ROOMS) {
    tickets.push({
      id: `T-${2401 + tickets.length}`,
      roomId,
      studentId: null,
      title,
      description,
      category,
      priority: "High",
      status: "In progress",
      createdAt: at(addDays(TODAY, -int(3, 12))),
      assignee: ASSIGNEES[category],
    });
  }
  tickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Activity feed derived from the most recent events above.
  const studentById = new Map(students.map((s) => [s.id, s]));
  const resName = new Map(RESIDENCES.map((r) => [r.id, r.name]));
  const where = (roomId: string) => {
    const room = roomById.get(roomId)!;
    return `${resName.get(room.residenceId)} ${room.number}`;
  };
  const activity: Activity[] = [
    ...invoices
      .filter((inv) => inv.paidAt)
      .sort((a, b) => b.paidAt!.localeCompare(a.paidAt!))
      .slice(0, 5)
      .map((inv): Activity => {
        const s = studentById.get(inv.studentId)!;
        return {
          id: `act-${inv.id}`,
          at: inv.paidAt!,
          kind: "payment",
          text: `${s.firstName} ${s.lastName} paid ${money(inv.amount)} for ${fmtPeriod(inv.period)}`,
          href: `/students/${s.id}`,
        };
      }),
    ...applications.slice(0, 3).map((a): Activity => ({
      id: `act-${a.id}`,
      at: a.submittedAt,
      kind: "application",
      text: `New application from ${a.firstName} ${a.lastName} for ${resName.get(a.preferredResidenceId)}`,
      href: "/applications",
    })),
    ...tickets.slice(0, 4).map((t): Activity => ({
      id: `act-${t.id}`,
      at: t.createdAt,
      kind: "maintenance",
      text: `${t.title} reported in ${where(t.roomId)}`,
      href: "/maintenance",
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return { residences: RESIDENCES, rooms, students, applications, tickets, invoices, activity };
}

export const SEED = createSeed();
