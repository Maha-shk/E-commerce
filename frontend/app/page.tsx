import { redirect } from "next/navigation";

export default function Home() {
  // Redirect unauthenticated users to login
  redirect("/login");
}
