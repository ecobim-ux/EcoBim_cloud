"use client";

import { useState } from "react";
import { CamIcon } from "../ui/icons";
import { MeetingModal } from "./MeetingModal";

interface ScheduleMeetingButtonProps {
  role: string;
  userName: string;
  compact?: boolean;
}

export function ScheduleMeetingButton({ role, userName, compact }: ScheduleMeetingButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-meet"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "#171717",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: compact ? "7px 13px" : "9px 15px",
          fontSize: compact ? 12 : 13,
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "background .15s",
        }}
      >
        <CamIcon size={14} /> Schedule Meeting
      </button>
      {open && <MeetingModal role={role} userName={userName} onClose={() => setOpen(false)} />}
    </>
  );
}
