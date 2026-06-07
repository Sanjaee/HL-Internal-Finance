import { redirect } from "next/navigation";

export default function HomePage() {
  // Middleware already protects this route and redirects unauthenticated users to /auth/login.
  // If the user is authenticated and lands here, redirect them to the dashboard.
  redirect("/dashboard");
}
