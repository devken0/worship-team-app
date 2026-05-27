"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { runAllCleanup, type CleanupSummary } from "@/lib/cleanup";

export type CleanupResult = CleanupSummary | { error: string };

/** Admin-triggered run of the storage cleanup, for the Maintenance card. */
export async function runCleanupNow(): Promise<CleanupResult> {
  if (!(await isAdmin())) return { error: "Only admins can run cleanup." };
  const summary = await runAllCleanup();
  revalidatePath("/recordings");
  return summary;
}
