import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard - admin routes work at /dashboard, /orders, etc.
  redirect("/dashboard");
}
