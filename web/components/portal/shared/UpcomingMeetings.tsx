"use client";

import { useEffect, useState } from "react";
import { fetchMeetings, type ApiMeeting } from "@/lib/portal/meetings";
import { CamIcon } from "../ui/icons";

export function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);

  useEffect(() => {
    fetchMeetings().then(setMeetings);
  }, []);

  if (meetings.length === 0) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "16px 20px", marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
        Upcoming Meetings <span style={{ color: "#8A867C", fontWeight: 400 }}>· {meetings.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {meetings.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#FAF9F6", border: "1px solid #F2F0EA", borderRadius: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "#1A7A4A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CamIcon size={14} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {m.title}
                <span style={{ fontSize: 11, fontWeight: 500, color: "#8A867C" }}>
                  {m.isOrganizer ? "· you're organizing" : "· organized by " + m.organizerName}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: "#8A867C", marginTop: 2 }}>
                {m.date} · {m.time} · {m.durationLabel}
                {m.attendees.length > 0 && " · " + m.attendees.join(", ")}
              </div>
              {m.note && <div style={{ fontSize: 11.5, color: "#5C594F", marginTop: 4, lineHeight: 1.4 }}>{m.note}</div>}
            </div>
            {m.joinUrl && (
              <a
                href={m.joinUrl}
                target="_blank"
                rel="noopener"
                style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "#1A56C4", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                Join ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
