import { redirect } from "next/navigation";

/** The app has no page of its own — Feed is the landing tab (§9). */
export default function AppIndex() {
  redirect("/app/feed");
}
