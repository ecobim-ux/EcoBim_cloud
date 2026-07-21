"use client";

import { useEffect, useState } from "react";
import { createClient as createClientAccount } from "@/lib/portal/clients";
import { usePeople } from "../PeopleProvider";
import { CO_EMAIL, LEAD_EMAIL, ML } from "@/lib/portal/mail";
import { meetCode } from "@/lib/portal/helpers";
import { sendNotification } from "@/lib/portal/notifications";
import { cardS, fldS, labS, secSub, secTitle } from "@/lib/portal/style-tokens";
import { Btn } from "../ui/Btn";
import { CamIcon } from "../ui/icons";

interface CreatedClient {
  name: string;
  company: string;
  email: string;
  lead: string;
  meetLink: string;
  loginId?: string;
  pass?: string;
}

export function CreateClientSection() {
  const { people, refetch } = usePeople();
  const leads = people.filter((p) => p.position === "teamlead");
  const [cn, setCn] = useState("");
  const [cco, setCco] = useState("");
  const [cem, setCem] = useState("");
  const [clead, setClead] = useState("");
  const [cuid, setCuid] = useState("");
  const [cpw, setCpw] = useState("");
  const [created, setCreated] = useState<CreatedClient | null>(null);
  const [cmsg, setCmsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!clead && leads.length > 0) setClead(leads[0].name);
  }, [leads, clead]);

  const createClient = async () => {
    if (!cn.trim() || !cem.trim()) {
      setCmsg("⚠ Enter at least a contact name and email.");
      return;
    }
    const leadRec = leads.find((l) => l.name === clead);
    setBusy(true);
    const result = await createClientAccount({
      name: cn.trim(),
      company: cco.trim() || cn.trim(),
      email: cem.trim(),
      teamLeadLoginId: leadRec?.loginId,
      loginId: cuid.trim() || undefined,
      password: cpw.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setCmsg("⚠ " + result.error);
      return;
    }
    const meetLink = "https://meet.google.com/" + meetCode();
    const c: CreatedClient = {
      name: cn.trim(),
      company: cco.trim() || cn.trim(),
      email: cem.trim(),
      lead: clead,
      meetLink,
      loginId: result.loginId,
      pass: result.password,
    };
    if (leadRec) {
      sendNotification({
        recipientLoginIds: [leadRec.loginId],
        title: "New freelance assigned to you",
        body: "Admin assigned you as lead for " + c.company + ". Kickoff Meet: " + meetLink,
      });
    }
    setCreated(c);
    setCmsg("✓ " + c.company + " created and assigned to " + (clead || "—") + "." + (c.loginId ? " Login: " + c.loginId + " / " + c.pass : ""));
    setCn("");
    setCco("");
    setCem("");
    setCuid("");
    setCpw("");
    refetch();
  };

  const clientMail = (c: CreatedClient) =>
    ML(
      c.email,
      "Welcome to EcoBIM — " + c.company,
      "Dear " + c.name + ",\n\nWelcome aboard. " + (c.lead ? c.lead + " will be your dedicated team lead." : "") + "\n\nKickoff meeting (Google Meet): " + c.meetLink + "\n\n" +
        (c.loginId ? "Your freelance portal login:\nID: " + c.loginId + "\nPassword: " + c.pass + "\n\n" : "") +
        "Best regards,\nEcoBIM Team\n" + CO_EMAIL,
    );
  const leadMail = (c: CreatedClient) =>
    ML(
      LEAD_EMAIL,
      "New freelance assigned: " + c.company,
      "Hi " + c.lead + ",\n\nYou have been assigned as team lead for a new freelance:\n\nFreelance: " + c.name + " (" + c.company + ")\nEmail: " + c.email + "\nKickoff Meet: " + c.meetLink + "\n\nPlease reach out to schedule the kickoff.\n\nRegards, Admin\n" + CO_EMAIL,
    );

  return (
    <div style={cardS}>
      <div style={secTitle}>Create a new freelance</div>
      <div style={secSub}>
        Onboard a freelance, assign their team lead, and generate a kickoff Google Meet link. Add a login so they can access the freelance portal.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <label>
          <span style={labS}>Contact name</span>
          <input style={fldS} value={cn} onChange={(e) => setCn(e.target.value)} placeholder="e.g. Khalid Al Mansoori" />
        </label>
        <label>
          <span style={labS}>Company</span>
          <input style={fldS} value={cco} onChange={(e) => setCco(e.target.value)} placeholder="e.g. Al Mansoori Real Estate" />
        </label>
        <label>
          <span style={labS}>Email</span>
          <input style={fldS} value={cem} onChange={(e) => setCem(e.target.value)} placeholder="freelance@company.com" />
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
        <label>
          <span style={labS}>Assign team lead</span>
          <select style={fldS} value={clead} onChange={(e) => setClead(e.target.value)}>
            {leads.length === 0 && <option value="">No team leads yet</option>}
            {leads.map((l) => (
              <option key={l.partyId} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={labS}>Login ID</span>
          <input style={fldS} value={cuid} onChange={(e) => setCuid(e.target.value)} placeholder="optional" />
        </label>
        <label>
          <span style={labS}>Password</span>
          <input style={fldS} value={cpw} onChange={(e) => setCpw(e.target.value)} placeholder="optional" />
        </label>
        <Btn v="p" onClick={busy ? undefined : createClient} xs={{ height: 38, whiteSpace: "nowrap" }}>
          {busy ? "Creating…" : "+ Create freelance"}
        </Btn>
      </div>
      {cmsg && <div style={{ marginTop: 13, fontSize: 12.5, fontWeight: 500, color: cmsg[0] === "⚠" ? "var(--red)" : "var(--green)" }}>{cmsg}</div>}
      {created && (
        <div style={{ marginTop: 16, background: "#FAF9F6", border: "1px solid #E5E2DA", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "#1A7A4A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CamIcon size={15} />
          </span>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: "#8A867C" }}>Kickoff Google Meet</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A56C4" }}>{created.meetLink}</div>
          </div>
          <a href={clientMail(created)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#171717", color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
            ✉ Email freelance
          </a>
          <a href={leadMail(created)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#171717", border: "1.5px solid #E5E2DA", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
            ✉ Email lead
          </a>
        </div>
      )}
    </div>
  );
}
