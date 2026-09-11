"use client";

import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { ROOM_TYPES, getIndexes, residenceStats } from "@/lib/selectors";
import { money, pct } from "@/lib/format";
import { Badge, PageHeader, Progress, cx } from "../ui";

export function ResidencesView() {
  const state = useStore();
  const ix = getIndexes(state);
  const totals = residenceStats(state, ix);

  return (
    <>
      <PageHeader
        title="Residences"
        description={`${state.residences.length} properties · ${state.rooms.length} rooms · ${totals.beds} beds`}
      />
      <div className="grid gap-6 md:grid-cols-2">
        {state.residences.map((res) => {
          const s = residenceStats(state, ix, res.id);
          const rooms = state.rooms.filter((r) => r.residenceId === res.id);
          const types = ROOM_TYPES.flatMap((t) => {
            const room = rooms.find((r) => r.type === t);
            return room ? [{ type: t, rent: room.rent }] : [];
          });
          return (
            <Link
              key={res.id}
              href={`/residences/${res.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={cx("relative flex h-32 flex-col justify-between overflow-hidden bg-linear-to-br p-5 text-white", res.accent)}>
                <Building2 className="absolute -right-4 -bottom-6 size-36 opacity-15" strokeWidth={1.25} />
                <span className="w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">{res.kind}</span>
                <h2 className="text-xl font-semibold tracking-tight">{res.name}</h2>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm text-slate-600">{res.tagline}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="size-3.5" />
                  {res.address}
                </p>

                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-500">Occupancy</span>
                    <span className="font-medium tabular-nums text-slate-900">
                      {s.occupied}/{s.beds} beds · {pct(s.occupancy)}
                    </span>
                  </div>
                  <Progress value={s.occupancy} />
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {(
                    [
                      ["Rooms", s.rooms],
                      ["Free beds", s.vacantBeds],
                      ["Blocked", s.blocked],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 py-2.5">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="text-lg font-semibold tabular-nums text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {types.map(({ type, rent }) => (
                    <Badge key={type}>
                      {type} · {money(rent)}/mo
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                  <span className="text-slate-500">
                    Manager: <span className="text-slate-900">{res.manager}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-brand-700 transition-all group-hover:gap-2">
                    Open <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
