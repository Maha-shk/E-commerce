import { redirect } from "next/navigation";

export default function Home() {
  // The customer portal lives under /dashboard. Root redirects there for now.
  redirect("/dashboard");
}
