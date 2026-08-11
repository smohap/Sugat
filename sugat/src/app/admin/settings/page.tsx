import { canManageSettings } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

import { ComingInStage } from "../coming-in-stage";

export const metadata = { title: "Settings — Sugather" };

export default async function AdminSettingsPage() {
  const viewer = await requireRole(canManageSettings, "/admin/settings");

  return (
    <ComingInStage
      eyebrow={viewer.membership.org.name}
      title="Settings"
      stage={9}
      detail="Org profile and logo, membership plans and pricing, Stripe connection status, and the open-link versus approval-required invitation policy."
    />
  );
}
