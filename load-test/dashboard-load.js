import http from "k6/http";
import { check, sleep } from "k6";

// Simulates N concurrent people browsing their EcoBIM portal dashboard —
// each virtual user (VU) logs in once, then repeatedly re-fetches the same
// batch of GET endpoints a real dashboard load triggers (issues, projects,
// team, people, notifications, meetings, leads), with a think-time pause
// between refreshes. Deliberately read-only after login so repeated runs
// don't leave behind test tasks/issues in production data.
//
// Usage (from this directory):
//   k6 run -e VUS=20  -e DURATION=2m dashboard-load.js   # 20 concurrent users for 2 minutes
//   k6 run -e VUS=100 -e DURATION=3m dashboard-load.js   # step up to see where it breaks
//   k6 run -e VUS=50 -e LOGIN_ID=Manju -e PASSWORD=... dashboard-load.js
//
// Read the end-of-run summary for: http_req_failed (error rate) and
// http_req_duration p(95) — thresholds below mark the run PASS/FAIL so you
// can quickly tell which VU count the site can comfortably handle.

const BASE_URL = __ENV.BASE_URL || "https://ecobim.co";
const LOGIN_ID = __ENV.LOGIN_ID || "Admin";
const PASSWORD = __ENV.PASSWORD || "Admin@1";

export const options = {
  // k6 resets each VU's cookie jar at the start of every iteration by
  // default, which would silently drop the session cookie right after the
  // one-time login on iteration 0 — this keeps it alive for the VU's whole
  // run, matching how a real browser tab behaves.
  noCookiesReset: true,
  scenarios: {
    concurrent_users: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 20),
      duration: __ENV.DURATION || "2m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    "http_req_duration{endpoint:login}": ["p(95)<2000"],
    "http_req_duration{endpoint:dashboard}": ["p(95)<2000"],
  },
};

export default function () {
  // Each VU logs in once on its first iteration, then reuses the session
  // cookie k6 keeps in its per-VU cookie jar for every later iteration.
  // Login does CPU-heavy bcrypt work and can transiently 503 under a burst
  // of simultaneous logins (see concurrent-logins.js) — retried here so a
  // single bad-timing login doesn't sink this VU's whole browsing-capacity
  // contribution, since a real person would just retry too.
  if (__ITER === 0) {
    let res;
    for (let attempt = 0; attempt < 5; attempt++) {
      res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ loginId: LOGIN_ID, password: PASSWORD }),
        { headers: { "Content-Type": "application/json" }, tags: { endpoint: "login" } },
      );
      if (res.status === 200) break;
      sleep(0.5 + Math.random());
    }
    check(res, { "login succeeded": (r) => r.status === 200 });
    sleep(1);
  }

  // Mirrors the parallel fetches a real dashboard fires on load/refresh.
  const responses = http.batch([
    ["GET", `${BASE_URL}/api/auth/me`, null, { tags: { endpoint: "dashboard" } }],
    ["GET", `${BASE_URL}/api/projects`, null, { tags: { endpoint: "dashboard" } }],
    ["GET", `${BASE_URL}/api/team`, null, { tags: { endpoint: "dashboard" } }],
    ["GET", `${BASE_URL}/api/issues`, null, { tags: { endpoint: "dashboard" } }],
    ["GET", `${BASE_URL}/api/people`, null, { tags: { endpoint: "dashboard" } }],
    ["GET", `${BASE_URL}/api/notifications`, null, { tags: { endpoint: "dashboard" } }],
    ["GET", `${BASE_URL}/api/meetings`, null, { tags: { endpoint: "dashboard" } }],
    ["GET", `${BASE_URL}/api/leads`, null, { tags: { endpoint: "dashboard" } }],
  ]);

  responses.forEach((res, i) => {
    check(res, { [`dashboard request ${i} ok`]: (r) => r.status === 200 });
  });

  // Think time: a real person reads the page for a few seconds before the
  // next refresh/tab-switch/action.
  sleep(2 + Math.random() * 4);
}
