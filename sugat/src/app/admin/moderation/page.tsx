import { canModerate } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

import { ComingInStage } from "../coming-in-stage";

export const metadata = { title: "Moderation — Sugat" };

export default async function AdminModerationPage() {
  const viewer = await requireRole(canModerate, "/admin/moderation");

  return (
    <ComingInStage
      eyebrow={viewer.membership.org.name}
      title="Moderation"
      stage={8}
      detail="The flagged-content queue — dismiss, hide, suspend the author, each attributed and timestamped, with cleared items moving to a resolved tab — lands with the rest of the console."
    />
  );
}
