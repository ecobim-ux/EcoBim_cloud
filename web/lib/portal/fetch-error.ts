"use client";

import { notify } from "@/components/portal/ui/Toast";

/** Central place list-fetchers report a failed load: previously these swallowed
    every error and returned an empty default, which rendered identically to
    "nothing here yet" with no signal the request actually failed. */
export function reportFetchError(what: string, err: unknown): void {
  console.error(`[portal] failed to load ${what}:`, err);
  notify(`Couldn't load ${what}. Check your connection and try again.`, "error");
}
