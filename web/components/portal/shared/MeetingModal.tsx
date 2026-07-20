"use client";

import { useEffect, useState } from "react";
import { POS_LABEL, POS_ORDER, fetchPeople, type ApiPerson } from "@/lib/portal/people";
import { scheduleMeeting } from "@/lib/portal/meetings";
import { sendNotification } from "@/lib/portal/notifications";
import { fmtMDate, meetCode } from "@/lib/portal/helpers";
import { fldS, labS } from "@/lib/portal/style-tokens";
import { Avi } from "../ui/Avi";
import { DatePicker } from "../ui/DatePicker";
import { useModalA11y } from "../ui/useModalA11y";
import { notify } from "../ui/Toast";
import { CamIcon } from "../ui/icons";

interface MeetingModalProps {
  role: string;
  userName: string;
  onClose: () => void;
}

export function MeetingModal({ role, userName, onClose }: MeetingModalProps) {
  const [people, setPeople] = useState<ApiPerson[]>([]);
  const [reach, setReach] = useState<Record<string, string[]>>({});
  useEffect(() => {
    fetchPeople().then((data) => {
      setPeople(data.people);
      setReach(data.reach);
    });
  }, []);
  const allowed = reach[role] || [];
  const candidates = people.filter((p) => allowed.includes(p.position) && p.name !== userName);
  const grouped = POS_ORDER.map((pos) => ({ pos, list: candidates.filter((c) => c.position === pos) })).filter((g) => g.list.length);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  const [title, setTitle] = useState("BIM Coordination Sync");
  const [date, setDate] = useState(iso);
  const [time, setTime] = useState("10:00");
  const [dur, setDur] = useState("30 min");
  const [sel, setSel] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ title: string; date: string; time: string; dur: string; link: string; organizer: string; note: string; attendees: { name: string; email: string; position: string }[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useModalA11y(onClose);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const schedule = async () => {
    if (!sel.length || !title.trim()) return;
    const attendees = candidates.filter((c) => sel.includes(c.partyId)).map((c) => ({ name: c.name, email: c.email || "", position: c.position, loginId: c.loginId }));
    const code = meetCode();
    const link = "https://meet.google.com/" + code;
    setBusy(true);
    const result = await scheduleMeeting({
      title: title.trim(),
      date,
      time,
      duration: dur,
      joinUrl: link,
      note: note.trim(),
      attendeeLoginIds: attendees.map((a) => a.loginId),
    });
    setBusy(false);
    if (!result.ok) {
      notify(result.error || "Couldn't schedule that meeting.", "error");
      return;
    }
    attendees.forEach((a) =>
      sendNotification({
        recipientLoginIds: [a.loginId],
        title: "Google Meet invitation",
        body: userName + ' invited you to "' + title.trim() + '" — ' + fmtMDate(date) + " at " + time + " (" + dur + "). Join: " + link,
      }),
    );
    setDone({ title: title.trim(), date, time, dur, link, organizer: userName, note: note.trim(), attendees });
    notify("Meeting scheduled — invite ready", "success");
  };

  const inviteText = (m: NonNullable<typeof done>) =>
    "You are invited to a Google Meet.\n\n" +
    m.title +
    "\nDate: " +
    fmtMDate(m.date) +
    "\nTime: " +
    m.time +
    " · " +
    m.dur +
    "\nJoin: " +
    m.link +
    "\n\nOrganizer: " +
    m.organizer +
    "\nGuests: " +
    m.attendees.map((a) => a.name).join(", ") +
    (m.note ? "\n\nNotes: " + m.note : "");

  const mailHref = (m: NonNullable<typeof done>) =>
    "mailto:" + m.attendees.map((a) => a.email).join(",") + "?subject=" + encodeURIComponent("Meeting invite: " + m.title) + "&body=" + encodeURIComponent(inviteText(m));

  const overlay = {
    position: "fixed" as const,
    inset: 0,
    zIndex: 300,
    background: "rgba(23,23,23,.5)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    display: "flex" as const,
    alignItems: "flex-start" as const,
    justifyContent: "center" as const,
    padding: "40px 16px",
    overflowY: "auto" as const,
  };
  const card = {
    background: "#FAF9F6",
    width: "100%",
    maxWidth: 560,
    borderRadius: 16,
    boxShadow: "0 30px 80px rgba(0,0,0,.32)",
    overflow: "hidden",
    margin: "auto",
    animation: "modal-in .22s cubic-bezier(0.16,1,0.3,1)",
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} style={card} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Schedule a Google Meet">
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 22px", borderBottom: "1px solid #E5E2DA", background: "#fff" }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#1A7A4A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CamIcon size={17} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{done ? "Meeting scheduled" : "Schedule a Google Meet"}</div>
            <div style={{ fontSize: 12, color: "#8A867C" }}>
              {done ? "Invite ready for your guests" : "You are " + (POS_LABEL[role] || role) + " · " + userName}
            </div>
          </div>
          <button className="meet-x" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "none", color: "#8A867C", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          {!done ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <span style={labS}>Meeting title</span>
                <input style={fldS} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is this meeting about?" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12 }}>
                <div>
                  <span style={labS}>Date</span>
                  <DatePicker value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div>
                  <span style={labS}>Time</span>
                  <input type="time" style={fldS} value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
                <div>
                  <span style={labS}>Duration</span>
                  <select style={fldS} value={dur} onChange={(e) => setDur(e.target.value)}>
                    <option>15 min</option>
                    <option>30 min</option>
                    <option>45 min</option>
                    <option>60 min</option>
                  </select>
                </div>
              </div>
              <div>
                <span style={labS}>
                  Invite people {sel.length > 0 && <span style={{ color: "#1A7A4A" }}>· {sel.length} selected</span>}
                </span>
                {grouped.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#8A867C", background: "#fff", border: "1px dashed #E5E2DA", borderRadius: 10, padding: "16px 14px" }}>
                    Your role has no one available to invite yet. An admin can adjust reach-out rules under <b>People &amp; Roles</b>.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {grouped.map((g) => (
                      <div key={g.pos}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
                          {POS_LABEL[g.pos]}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {g.list.map((p) => {
                            const on = sel.includes(p.partyId);
                            return (
                              <button
                                key={p.partyId}
                                className="meet-row"
                                onClick={() => toggle(p.partyId)}
                                style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", padding: "9px 12px", borderRadius: 11, border: on ? "1.5px solid #171717" : "1px solid #E5E2DA", background: "#fff", cursor: "pointer", transition: "border-color .15s" }}
                              >
                                <Avi ini={p.initials} size={30} bg={on ? "#171717" : "#8A867C"} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                                  <div style={{ fontSize: 11.5, color: "#8A867C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.email}</div>
                                </div>
                                <span
                                  style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: on ? "none" : "1.5px solid #D8D5CD", background: on ? "#171717" : "#fff", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}
                                >
                                  {on ? "✓" : ""}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span style={labS}>
                  Note <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
                </span>
                <textarea
                  style={{ ...fldS, resize: "vertical", minHeight: 60, lineHeight: 1.5 }}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Agenda, dial-in details, what to prepare…"
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 2 }}>
                <button onClick={onClose} style={{ background: "#fff", border: "1.5px solid #E5E2DA", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#171717", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  className="btn-meet"
                  onClick={schedule}
                  disabled={busy || !sel.length || !title.trim()}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: busy || !sel.length || !title.trim() ? "#BDBAB2" : "#171717", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: busy || !sel.length || !title.trim() ? "not-allowed" : "pointer" }}
                >
                  <CamIcon size={15} /> Schedule &amp; invite
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{done.title}</div>
              <div style={{ background: "#fff", border: "1px solid #E5E2DA", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#8A867C" }}>When</span>
                  <span style={{ fontWeight: 500 }}>
                    {fmtMDate(done.date)} · {done.time} · {done.dur}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#8A867C" }}>Organizer</span>
                  <span style={{ fontWeight: 500 }}>{done.organizer}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: 13 }}>
                  <span style={{ color: "#8A867C", flexShrink: 0 }}>Guests</span>
                  <span style={{ fontWeight: 500, textAlign: "right" }}>{done.attendees.map((a) => a.name).join(", ")}</span>
                </div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #E5E2DA", borderRadius: 12, padding: "13px 15px", display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: "#1A7A4A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CamIcon size={15} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#8A867C" }}>Google Meet link</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A56C4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{done.link}</div>
                </div>
                <button
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(done.link);
                    } catch {
                      /* noop */
                    }
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  }}
                  style={{ background: "#F2F0EA", border: "none", borderRadius: 9, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#171717", flexShrink: 0 }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div style={{ fontSize: 12.5, color: "#8A867C", lineHeight: 1.55 }}>
                A notification was sent to each guest in their portal. Use the button below to email the full invite.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{ background: "#fff", border: "1.5px solid #E5E2DA", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#171717", cursor: "pointer" }}>
                  Done
                </button>
                <a href={mailHref(done)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#171717", color: "#fff", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  ✉ Email invite
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
