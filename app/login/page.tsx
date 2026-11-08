import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { SignInForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign in — HighLevel" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your HighLevel workspace to pick up where you left off."
    >
      <SignInForm />
    </AuthShell>
  );
}
