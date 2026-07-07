"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { clsx } from "clsx";

export default function DebugPayloadPanel({ payload }: { payload: unknown }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-bg-dark/95 text-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Terminal size={14} />
          Debug: assembled submission payload (sent to /api/apply on submit)
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      <div className={clsx(!open && "hidden")}>
        <pre className="px-4 pb-4 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
