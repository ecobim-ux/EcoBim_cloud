"use client";

import { TEAM } from "@/lib/portal/data";
import { computeProductivity } from "@/lib/portal/productivity";
import { ProductivityView } from "../ui/ProductivityView";

export function ProductivityTab() {
  const member = TEAM.find((t) => t.name === "Arjun Mehta")!;
  const data = computeProductivity(member);
  return <ProductivityView data={data} />;
}
