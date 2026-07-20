"use client";

import type { ApiTask } from "@/app/api/tasks/route";
import { ProductivityView } from "../ui/ProductivityView";
import { computeProductivityFromTasks } from "@/lib/portal/productivity";

export function ProductivityTab({ tasks }: { tasks: ApiTask[] }) {
  const data = computeProductivityFromTasks(tasks);
  return <ProductivityView data={data} />;
}
