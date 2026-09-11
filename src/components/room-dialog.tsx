"use client";

import Link from "next/link";
import { useState } from "react";
import { Hammer, UserPlus } from "lucide-react";
import { dispatch, useStore } from "@/lib/store";
import { freeBeds, fullName, getIndexes, roomStatus } from "@/lib/selectors";
import { fmtAgo, money } from "@/lib/format";
import { priorityTone, roomTone } from "@/lib/tones";
import { toast } from "@/lib/toast";
import type { Application, Room } from "@/lib/types";
import { Modal } from "./modal";
import { Avatar, Badge, Button, inputClass } from "./ui";

export function RoomDialog({ roomId, onClose }: { roomId: string | null; onClose: () => void }) {
  const state = useStore();
  const ix = getIndexes(state);
  const room = roomId ? ix.rooms.get(roomId) : undefined;
  const residence = room ? ix.residences.get(room.residenceId) : undefined;
  return (
    <Modal
      open={!!room}
      onClose={onClose}
      title={room ? `Room ${room.number}` : ""}
      description={room && residence ? `${residence.name} · Floor ${room.floor}` : undefined}
    >
      {room && <RoomDetails room={room} />}
    </Modal>
  );
}

const sectionTitle = "text-xs font-semibold uppercase tracking-wide text-slate-500";

function RoomDetails({ room }: { room: Room }) {
  const state = useStore();
  const ix = getIndexes(state);
  const [applicantId, setApplicantId] = useState("");

  const occupants = ix.occupants.get(room.id) ?? [];
  const status = roomStatus(room, occupants.length);
  const free = freeBeds(room, ix);
  const openTickets = (ix.ticketsByRoom.get(room.id) ?? []).filter((t) => t.status !== "Resolved");

  // Applicants whose preference matches this room float to the top.
  const rank = (a: Application) =>
    (a.preferredResidenceId === room.residenceId ? 0 : 2) + (a.preferredRoomType === room.type ? 0 : 1);
  const candidates = state.applications
    .filter((a) => a.status === "Pending" || a.status === "Waitlisted")
    .sort((a, b) => rank(a) - rank(b));
  const applicant = candidates.find((a) => a.id === applicantId) ?? candidates[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge tone={roomTone[status]} dot>
          {status}
        </Badge>
        <Badge>{room.type}</Badge>
        <Badge>{money(room.rent)} per bed / month</Badge>
      </div>

      <section>
        <h3 className={sectionTitle}>
          Occupants ({occupants.length}/{room.capacity})
        </h3>
        {occupants.length ? (
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {occupants.map((s) => (
              <li key={s.id}>
                <Link href={`/students/${s.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                  <Avatar name={fullName(s)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{fullName(s)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.course} · Year {s.year}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Nobody lives here right now.</p>
        )}
      </section>

      {openTickets.length > 0 && (
        <section>
          <h3 className={sectionTitle}>Open maintenance</h3>
          <ul className="mt-2 space-y-2">
            {openTickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.status} · {fmtAgo(t.createdAt)}
                  </p>
                </div>
                <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {free > 0 && (
        <section className="rounded-xl bg-slate-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="size-4 text-brand-600" />
            {free === 1 ? "Allocate the free bed" : `Allocate one of ${free} free beds`}
          </h3>
          {applicant ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="Applicant"
                className={inputClass}
                value={applicant.id}
                onChange={(e) => setApplicantId(e.target.value)}
              >
                {candidates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {fullName(a)} — wants {ix.residences.get(a.preferredResidenceId)?.name}, {a.preferredRoomType}
                    {a.status === "Waitlisted" ? " (waitlist)" : ""}
                  </option>
                ))}
              </select>
              <Button
                className="shrink-0"
                onClick={() => {
                  dispatch({ type: "approveApplication", id: applicant.id, roomId: room.id });
                  toast(`${fullName(applicant)} allocated to room ${room.number}`);
                  setApplicantId("");
                }}
              >
                Approve & allocate
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No pending applications to allocate.</p>
          )}
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {room.maintenance
            ? "Blocked rooms can't receive new allocations."
            : "Block the room to stop new allocations during repairs."}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            dispatch({ type: "toggleRoomMaintenance", roomId: room.id });
            toast(room.maintenance ? `Room ${room.number} reopened` : `Room ${room.number} blocked for maintenance`);
          }}
        >
          <Hammer />
          {room.maintenance ? "Reopen room" : "Block for maintenance"}
        </Button>
      </div>
    </div>
  );
}
