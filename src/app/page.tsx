import { redirect } from "next/navigation";

export default function HomePage() {
  // Route to the dashboard page
  redirect("/dashboard");
}
