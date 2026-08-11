import { canViewAnalytics } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

import { ComingInStage } from "../coming-in-stage";

export const metadata = { title: "Analytics — Sugat" };

export default async function AdminAnalyticsPage() {
  const viewer = await requireRole(canViewAnalytics, "/admin/analytics");

  return (
    <ComingInStage
      eyebrow={viewer.membership.org.name}
      title="Analytics"
      stage={9}
      detail="Member growth, event attendance and feed activity over 30, 90 or 365 days, drawn in the token palette rather than chart-library defaults."
    />
  );
}
