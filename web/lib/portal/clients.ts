"use client";

export async function createClient(params: {
  name: string;
  company: string;
  email: string;
  teamLeadLoginId?: string;
  loginId?: string;
  password?: string;
}): Promise<{ ok: boolean; error?: string; loginId?: string; password?: string }> {
  try {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; loginId?: string; password?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't create that client." };
    return { ok: true, loginId: data.loginId, password: data.password };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
