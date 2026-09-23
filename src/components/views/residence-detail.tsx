"use client";

import { useState } from "react";
import { Check, Hammer, MapPin, Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { ROOM_TYPES, fullName, getIndexes, residenceStats, roomStatus, type RoomStatus } from "@/lib/selectors";
import { money, pct } from "@/lib/format";
import type { Room } from "@/lib/types";
import { RoomDialog } from "../room-dialog";
import { Avatar, Card, EmptyState, PageHeader, StatStrip, Tabs, cx, eyebrow } from "../ui";

const FILTERS = ["All", "Vacant", "Partial", "Full", "Maintenance"] as const;
type Filter = (typeof FILTERS)[number];

const TILE: Record<RoomStatus, { tile: string; edge: string }> = {
  Vacant: { tile: "border-[#d6f5e6] bg-[#f3fcf8] text-[#0b4a35] hover:border-emerald-300", edge: "bg-emerald-500" },
  Partial: { tile: "border-[#d5ecfb] bg-[#f5fbff] text-[#0b3c56] hover:border-sky-300", edge: "bg-sky-500" },
  Full: { tile: "border-slate-200 bg-white text-slate-900 hover:border-slate-300", edge: "bg-slate-300" },
  Maintenance: { tile: "stripes border-[#fbe6b6] bg-[#fffbf1] text-[#6b3d07] hover:border-amber-300", edge: "bg-amber-500" },
};

const LEGEND = [
  ["Vacant", "bg-emerald-500"],
  ["Partly filled", "bg-sky-500"],
  ["Full", "bg-slate-300"],
  ["Blocked", "bg-amber-500"],
] as const;

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
      <PageHeader
        back={{ href: "/residences", label: "All residences" }}
        title={res.name}
        description={`${res.kind} · ${res.address}`}
        actions={LEGEND.map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-[7px] rounded-full border border-slate-200 bg-white px-[11px] py-[5px] text-xs text-slate-600">
            <span className={cx("size-[9px] rounded-[3px]", color)} />
            {label}
          </span>
        ))}
      />

      <StatStrip
        items={[
          { label: "Occupancy", value: pct(stats.occupancy), hint: `${stats.occupied} of ${stats.beds} beds` },
          { label: "Free beds", value: stats.vacantBeds, hint: `Across ${counts.Vacant + counts.Partial} rooms` },
          { label: "Rooms blocked", value: stats.blocked, hint: "Unavailable for allocation" },
          { label: "Open issues", value: openIssues, hint: "Maintenance requests" },
        ]}
      />

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[3fr_1fr]">
        <Card>
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Room map</h2>
              <p className="mt-0.5 text-xs text-slate-500">Select a room to see occupants, allocate a bed or block it for repairs.</p>
            </div>
            <Tabs variant="segment" tabs={FILTERS.map((f) => ({ id: f, label: f, count: counts[f] }))} value={filter} onChange={setFilter} />
          </div>
          <div className="px-5 pt-4 pb-5">
            {floors.map((floor) => (
              <div key={floor} className="flex gap-3 border-b border-slate-50 py-2.5 last:border-0 sm:gap-4">
                <div className="w-12 shrink-0 pt-2.5 sm:w-16">
                  <p className={eyebrow}>Floor</p>
                  <p className="mt-0.5 text-lg font-semibold text-slate-700 tabular-nums">{floor}</p>
                </div>
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
                            "relative overflow-hidden rounded-xl border py-2.5 pr-[11px] pl-[13px] text-left transition hover:-translate-y-px hover:shadow-sm",
                            TILE[status].tile,
                            filter !== "All" && status !== filter && "opacity-25",
                          )}
                        >
                          <span className={cx("absolute inset-y-0 left-0 w-[3px]", TILE[status].edge)} />
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="text-[15px] font-semibold tracking-tight tabular-nums">{r.number}</span>
                            <span className="text-[10px] font-semibold tracking-[0.05em] uppercase opacity-55">{r.type}</span>
                          </div>
                          <div className="mt-[9px] flex h-6 items-center gap-1">
                            {status === "Maintenance" ? (
                              <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold">
                                <Hammer className="size-[13px]" />
                                Blocked
                              </span>
                            ) : (
                              Array.from({ length: r.capacity }, (_, i) =>
                                occupants[i] ? (
                                  <Avatar key={i} name={fullName(occupants[i])} size="xs" />
                                ) : (
                                  <span key={i} className="size-6 rounded-lg border-[1.5px] border-dashed border-current opacity-35" />
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

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="px-5 py-[18px]">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">About</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-600">{res.tagline}</p>
            <p className="mt-3 flex items-start gap-2 text-[13px] text-slate-600">
              <MapPin className="mt-0.5 size-[15px] shrink-0 text-slate-400" />
              {res.address}
            </p>
            <div className="mt-4 flex items-center gap-[11px] border-t border-slate-100 pt-4">
              <Avatar name={res.manager} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">{res.manager}</p>
                <a href={`tel:${res.managerPhone.replace(/\s/g, "")}`} className="flex items-center gap-[5px] text-xs text-slate-500 hover:text-brand-700">
                  <Phone className="size-3" />
                  {res.managerPhone}
                </a>
              </div>
            </div>
          </Card>
          <Card className="px-5 py-[18px]">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Amenities &amp; rent</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {res.amenities.map((a) => (
                <li key={a} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  <Check className="size-[13px] text-brand-600" />
                  {a}
                </li>
              ))}
            </ul>
            <dl className="mt-4 border-t border-slate-100">
              {rents.map(({ type, rent }) => (
                <div key={type} className="flex justify-between border-b border-slate-50 py-[9px] text-[13px]">
                  <dt className="text-slate-500">{type}</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums">{money(rent)} / bed</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      <RoomDialog roomId={roomId} onClose={() => setRoomId(null)} />
    </>
  );
}
