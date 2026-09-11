export type RoomType = "Single" | "Double" | "En-suite" | "Studio";
export type Funding = "NSFAS" | "Bursary" | "Self-funded";

export type Residence = {
  id: string;
  name: string;
  kind: "Catered hall" | "Self-catering hall" | "Apartments" | "Studios";
  tagline: string;
  address: string;
  manager: string;
  managerPhone: string;
  amenities: string[];
  accent: string;
};

export type Room = {
  id: string;
  residenceId: string;
  number: string;
  floor: number;
  type: RoomType;
  capacity: number;
  /** Monthly rent per bed, in rand. */
  rent: number;
  /** Blocked for maintenance: no new allocations. */
  maintenance: boolean;
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentNumber: string;
  course: string;
  year: number;
  funding: Funding;
  roomId: string | null;
  leaseStart: string;
  leaseEnd: string;
  status: "Active" | "Checked out";
};

export type ApplicationStatus = "Pending" | "Approved" | "Waitlisted" | "Declined";

export type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentNumber: string;
  course: string;
  year: number;
  funding: Funding;
  preferredResidenceId: string;
  preferredRoomType: RoomType;
  submittedAt: string;
  status: ApplicationStatus;
  note?: string;
  studentId?: string;
};

export type TicketCategory =
  | "Plumbing"
  | "Electrical"
  | "Furniture"
  | "Internet"
  | "Pest control"
  | "Other";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type TicketStatus = "Open" | "In progress" | "Resolved";

export type Ticket = {
  id: string;
  roomId: string;
  /** null when logged by staff. */
  studentId: string | null;
  title: string;
  description: string;
  category: TicketCategory;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
  assignee?: string;
};

export type Invoice = {
  id: string;
  studentId: string;
  /** YYYY-MM */
  period: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
};

export type Activity = {
  id: string;
  at: string;
  kind: "application" | "maintenance" | "payment" | "room";
  text: string;
  href?: string;
};

export type State = {
  residences: Residence[];
  rooms: Room[];
  students: Student[];
  applications: Application[];
  tickets: Ticket[];
  invoices: Invoice[];
  activity: Activity[];
};
