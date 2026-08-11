import { canManageEvents } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

import { ComingInStage } from "../coming-in-stage";

export const metadata = { title: "Events — Sugather" };

export default async function AdminEventsPage() {
  const viewer = await requireRole(canManageEvents, "/admin/events");

  return (
    <ComingInStage
      eyebrow={viewer.membership.org.name}
      title="Events"
      stage={9}
      detail="Creation, the upcoming and past split, and the day-of dashboard with live check-in counts and checker assignment arrive with the admin events stage."
    />
  );
}
