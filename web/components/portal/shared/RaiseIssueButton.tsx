"use client";

import { useState } from "react";
import { Btn } from "../ui/Btn";
import { RaiseIssueModal } from "./RaiseIssueModal";

export function RaiseIssueButton({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn v="s" onClick={() => setOpen(true)}>
        ⚠ Raise Issue
      </Btn>
      {open && <RaiseIssueModal role="teamlead" userName={userName} onClose={() => setOpen(false)} />}
    </>
  );
}
