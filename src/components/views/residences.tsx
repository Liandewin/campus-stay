"use client";

import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { ROOM_TYPES, getIndexes, residenceStats } from "@/lib/selectors";
import { money, pct } from "@/lib/format";
import { Avatar, PageHeader, Progress, cx, eyebrow } from "../ui";

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
      <div className="grid gap-5 md:grid-cols-2">
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
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={cx("relative flex h-[118px] flex-col justify-end overflow-hidden bg-linear-to-br px-5 py-[18px] text-white", res.accent)}>
                <Building2 className="absolute -right-2.5 -bottom-7 size-[150px] opacity-18" strokeWidth={1.25} />
                <span className="absolute top-4 left-5 rounded-full bg-white/22 px-2.5 py-[3px] text-[11px] font-semibold tracking-[0.02em] backdrop-blur-sm">
                  {res.kind}
                </span>
                <h2 className="text-[22px] font-semibold tracking-[-0.025em]">{res.name}</h2>
              </div>
              <div className="flex flex-1 flex-col px-5 pt-[18px] pb-4">
                <p className="text-[13.5px] leading-normal text-slate-600">{res.tagline}</p>
                <p className="mt-[7px] flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="size-[13px] shrink-0" />
                  {res.address}
                </p>

                <div className="mt-[18px]">
                  <div className="mb-[7px] flex justify-between">
                    <span className={eyebrow}>Occupancy</span>
                    <span className="text-xs font-semibold text-slate-900 tabular-nums">
                      {s.occupied}/{s.beds} · {pct(s.occupancy)}
                    </span>
                  </div>
                  <Progress value={s.occupancy} />
                </div>

                <dl className="mt-[18px] grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100">
                  {(
                    [
                      ["Rooms", s.rooms],
                      ["Free beds", s.vacantBeds],
                      ["Blocked", s.blocked],
                    ] as const
                  ).map(([label, value], i) => (
                    <div key={label} className={cx("py-3", i > 0 && "pl-3.5")}>
                      <dt className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">{label}</dt>
                      <dd className="mt-[3px] text-[19px] font-semibold text-slate-900 tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {types.map(({ type, rent }) => (
                    <span key={type} className="rounded-lg bg-slate-50 px-[9px] py-[3px] text-[11.5px] font-medium whitespace-nowrap text-slate-600">
                      {type} · {money(rent)}/mo
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[13px]">
                  <span className="flex min-w-0 items-center gap-2 text-slate-500">
                    <Avatar name={res.manager} size="xs" />
                    <span className="truncate">{res.manager}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-[5px] font-semibold text-brand-700 transition-all group-hover:gap-2">
                    Open room map <ArrowRight className="size-[15px]" />
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
