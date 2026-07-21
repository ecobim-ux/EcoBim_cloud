import http from "k6/http";
import { check } from "k6";

// Tests specifically how many people can hit "sign in" at the exact same
// moment — separate from dashboard-load.js because login is the one path
// in the app that does deliberately CPU-heavy work (bcrypt password
// verification), which behaves very differently under concurrency than the
// plain DB reads every other endpoint does. Each VU logs in exactly once,
// all at once, then the test ends — this measures a burst, not sustained
// traffic.
//
// Usage:
//   k6 run -e N=10  concurrent-logins.js   # 10 people logging in at once
//   k6 run -e N=30  concurrent-logins.js
//   k6 run -e N=50  concurrent-logins.js
//
// Watch for:
//   status=503 body="error code: 1102" — Cloudflare killed the Worker for
//   exceeding its CPU-time budget. If this shows up even at low N, the
//   bcrypt cost factor (currently 12, see web/app/api/people/route.ts and
//   web/app/api/clients/route.ts) is likely too expensive for the CPU-time
//   limit on your Workers plan — worth checking the Cloudflare dashboard's
//   Workers > Limits panel.

const BASE_URL = __ENV.BASE_URL || "https://ecobim.co";
const LOGIN_ID = __ENV.LOGIN_ID || "Admin";
const PASSWORD = __ENV.PASSWORD || "Admin@1";
const N = Number(__ENV.N || 10);

export const options = {
  scenarios: {
    burst_login: {
      executor: "per-vu-iterations",
      vus: N,
      iterations: 1,
      maxDuration: "30s",
    },
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ loginId: LOGIN_ID, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" } },
  );
  const ok = check(res, { "login succeeded": (r) => r.status === 200 });
  if (!ok) {
    console.log(`vu=${__VU} FAILED status=${res.status} body=${res.body?.slice(0, 200)}`);
  }
}
