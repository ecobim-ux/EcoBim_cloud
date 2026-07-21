# Load testing

`dashboard-load.js` simulates N people using the EcoBIM portal at once: each
virtual user logs in once, then repeatedly re-fetches the same dashboard data
a real page load/refresh triggers, with a few seconds of "think time" between
refreshes. It's read-only after login, so reruns don't leave test tasks or
issues behind in production data.

## Requires

[k6](https://k6.io) — installed via `winget install GrafanaLabs.k6` on this
machine already. To install elsewhere: https://k6.io/docs/get-started/installation/

## Running it

```sh
cd load-test

# 20 concurrent users for 2 minutes (defaults)
k6 run dashboard-load.js

# step up concurrency to find where it breaks
k6 run -e VUS=50  -e DURATION=2m dashboard-load.js
k6 run -e VUS=100 -e DURATION=2m dashboard-load.js
k6 run -e VUS=200 -e DURATION=2m dashboard-load.js

# point at a different environment, or a different account
k6 run -e BASE_URL=http://localhost:3000 dashboard-load.js
k6 run -e LOGIN_ID=Manju -e PASSWORD=... dashboard-load.js
```

## Reading the results

Each run prints a summary. The two numbers that matter:

- **`http_req_failed`** — the error rate. Should stay under 2% (the
  threshold below marks the run ✓ or ✗ automatically).
- **`http_req_duration` p(95)** — 95% of requests should finish in under 2s.
  Once this climbs sharply between runs, you've found the ceiling.

Run at a few VU counts (e.g. 20 → 50 → 100 → 200) and note where either
threshold starts failing — that's roughly how many concurrent users the site
can comfortably handle right now.
