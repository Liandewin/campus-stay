"use client";

import { useState } from "react";
import { BedDouble, Check, DoorOpen, Hammer, MapPin, Phone, Wrench } from "lucide-react";
import { useStore } from "@/lib/store";
import { ROOM_TYPES, fullName, getIndexes, residenceStats, roomStatus, type RoomStatus } from "@/lib/selectors";
import { money, pct } from "@/lib/format";
import type { Room } from "@/lib/types";
import { RoomDialog } from "../room-dialog";
import { Avatar, Card, CardHeader, EmptyState, PageHeader, StatCard, Tabs, cx } from "../ui";

const FILTERS = ["All", "Vacant", "Partial", "Full", "Maintenance"] as const;
type Filter = (typeof FILTERS)[number];

const TILE: Record<RoomStatus, string> = {
  Vacant: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300",
  Partial: "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300",
  Full: "border-slate-200 bg-white text-slate-900 hover:border-slate-300",
  Maintenance: "stripes border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300",
};

export function ResidenceDetailView({ id }: { id: string }) {
  const state = useStore();
  const ix = getIndexes(state);
  const [filter, setFilter] = useState<Filter>("All");
  const [roomId, setRoomId] = useState<string | null>(null);

  const res = ix.residences.get(id);
  if (!res) return <EmptyState title="Residence not found" />;

  const rooms = state.rooms.filter((r) => r.residenceId === id);
  const stats = residenceStats(state, ix, id);
  const statusOf = (r: Room) => roomStatus(r, ix.occupants.get(r.id)?.length ?? 0);
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f, f === "All" ? rooms.length : rooms.filter((r) => statusOf(r) === f).length]),
  ) as Record<Filter, number>;
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => b - a);
  const openIssues = state.tickets.filter(
    (t) => t.status !== "Resolved" && ix.rooms.get(t.roomId)?.residenceId === id,
  ).length;
  const rents = ROOM_TYPES.flatMap((t) => {
    const room = rooms.find((r) => r.type === t);
    return room ? [{ type: t, rent: room.rent }] : [];
  });

  return (
    <>
      <PageHeader back={{ href: "/residences", label: "All residences" }} title={res.name} description={`${res.kind} · ${res.address}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Occupancy" value={pct(stats.occupancy)} hint={`${stats.occupied} of ${stats.beds} beds`} icon={BedDouble} />
        <StatCard
          label="Free beds"
          value={stats.vacantBeds}
          hint={`Across ${counts.Vacant + counts.Partial} rooms`}
          icon={DoorOpen}
          tone="green"
        />
        <StatCard label="Rooms blocked" value={stats.blocked} hint="Unavailable for allocation" icon={Hammer} tone="amber" />
        <StatCard label="Open issues" value={openIssues} hint="Maintenance requests" icon={Wrench} tone="red" href="/maintenance" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-4">
        <Card className="xl:col-span-3">
          <CardHeader title="Room map" subtitle="Select a room to see who lives there, allocate a bed, or block it for repairs." />
          <div className="border-b border-slate-100 px-5 py-3">
            <Tabs tabs={FILTERS.map((f) => ({ id: f, label: f, count: counts[f] }))} value={filter} onChange={setFilter} />
          </div>
          <div className="space-y-4 p-5">
            {floors.map((floor) => (
              <div key={floor} className="flex gap-3 sm:gap-4">
                <div className="w-12 shrink-0 pt-3 text-xs font-medium text-slate-500 sm:w-14">Floor {floor}</div>
                <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
                  {rooms
                    .filter((r) => r.floor === floor)
                    .map((r) => {
                      const status = statusOf(r);
                      const occupants = ix.occupants.get(r.id) ?? [];
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRoomId(r.id)}
                          title={`Room ${r.number} · ${status}`}
                          className={cx(
                            "rounded-xl border p-2.5 text-left transition hover:-translate-y-px hover:shadow-sm",
                            TILE[status],
                            filter !== "All" && status !== filter && "opacity-25",
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-semibold tabular-nums">{r.number}</span>
                            <span className="text-[10px] font-medium uppercase tracking-wide opacity-60">{r.type}</span>
                          </div>
                          <div className="mt-2 flex h-6 items-center gap-1">
                            {status === "Maintenance" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium">
                                <Hammer className="size-3.5" />
                                Blocked
                              </span>
                            ) : (
                              Array.from({ length: r.capacity }, (_, i) =>
                                occupants[i] ? (
                                  <Avatar key={i} name={fullName(occupants[i])} size="xs" />
                                ) : (
                                  <span key={i} className="size-6 rounded-full border-2 border-dashed border-current opacity-30" />
                                ),
                              )
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1 xl:content-start">
          <Card>
            <CardHeader title="About" />
            <div className="space-y-4 p-5 text-sm">
              <p className="text-slate-600">{res.tagline}</p>
              <p className="flex items-start gap-2 text-slate-600">
                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                {res.address}
              </p>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Avatar name={res.manager} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{res.manager}</p>
                  <a href={`tel:${res.managerPhone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700">
                    <Phone className="size-3" />
                    {res.managerPhone}
                  </a>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Amenities & rent" />
            <div className="space-y-4 p-5 text-sm">
              <ul className="space-y-2">
                {res.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-slate-700">
                    <Check className="size-4 text-brand-600" />
                    {a}
                  </li>
                ))}
              </ul>
              <dl className="space-y-2 border-t border-slate-100 pt-4">
                {rents.map(({ type, rent }) => (
                  <div key={type} className="flex justify-between">
                    <dt className="text-slate-500">{type}</dt>
                    <dd className="font-medium tabular-nums">{money(rent)} / bed</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>
        </div>
      </div>

      <RoomDialog roomId={roomId} onClose={() => setRoomId(null)} />
    </>
  );
}
