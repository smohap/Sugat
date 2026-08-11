import { redirect } from "next/navigation";

import { consoleHomeFor } from "@/lib/auth/roles";
import { requireActiveMember } from "@/lib/auth/session";

/** `/admin` has no page of its own — each role has its own landing section. */
export default async function AdminIndex() {
  const { membership } = await requireActiveMember("/admin");
  redirect(consoleHomeFor(membership.role) ?? "/app");
}
