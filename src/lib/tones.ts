import type { ApplicationStatus, Funding, Priority, TicketStatus } from "./types";
import type { InvoiceStatus, RoomStatus } from "./selectors";

export type Tone = "gray" | "green" | "amber" | "red" | "blue" | "violet";

export const roomTone: Record<RoomStatus, Tone> = { Vacant: "green", Partial: "blue", Full: "gray", Maintenance: "amber" };
export const priorityTone: Record<Priority, Tone> = { Low: "gray", Medium: "blue", High: "amber", Urgent: "red" };
export const ticketTone: Record<TicketStatus, Tone> = { Open: "red", "In progress": "amber", Resolved: "green" };
export const invoiceTone: Record<InvoiceStatus, Tone> = { Paid: "green", Due: "blue", Overdue: "red" };
export const applicationTone: Record<ApplicationStatus, Tone> = {
  Pending: "amber",
  Approved: "green",
  Waitlisted: "violet",
  Declined: "gray",
};
export const fundingTone: Record<Funding, Tone> = { NSFAS: "blue", Bursary: "violet", "Self-funded": "gray" };
