"use client";

import { useState, type FormEvent } from "react";
import { dispatch, useStore } from "@/lib/store";
import { CATEGORIES, PRIORITIES, getIndexes, roomLabel } from "@/lib/selectors";
import { toast } from "@/lib/toast";
import type { Priority, TicketCategory } from "@/lib/types";
import { Button, Field, inputClass } from "./ui";

/** Log a maintenance request. Pass `roomId` to lock it to one room. */
export function TicketForm({
  roomId: fixedRoomId,
  studentId = null,
  onDone,
}: {
  roomId?: string;
  studentId?: string | null;
  onDone: () => void;
}) {
  const state = useStore();
  const ix = getIndexes(state);
  const [residenceId, setResidenceId] = useState(state.residences[0].id);
  const [roomId, setRoomId] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Plumbing");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const rooms = state.rooms.filter((r) => r.residenceId === residenceId);
  const selectedRoom = fixedRoomId ?? (rooms.some((r) => r.id === roomId) ? roomId : (rooms[0]?.id ?? ""));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !selectedRoom) return;
    dispatch({
      type: "addTicket",
      ticket: { roomId: selectedRoom, studentId, title: title.trim(), description: description.trim(), category, priority },
    });
    toast("Maintenance request logged");
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {fixedRoomId ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Room: <span className="font-medium text-slate-900">{roomLabel(ix, fixedRoomId)}</span>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Residence">
            <select className={inputClass} value={residenceId} onChange={(e) => setResidenceId(e.target.value)}>
              {state.residences.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Room">
            <select className={inputClass} value={selectedRoom} onChange={(e) => setRoomId(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} · {r.type}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      <Field label="What's wrong?">
        <input
          required
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Leaking tap in bathroom"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Details (optional)">
        <textarea
          rows={3}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="When did it start? Anything the technician should know?"
        />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Log request</Button>
      </div>
    </form>
  );
}
