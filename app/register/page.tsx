import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Create your workspace — HighLevel" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Start your workspace"
      subtitle="Spin up a fresh CRM with a starter pipeline and calendar in seconds."
    >
      <SignUpForm />
    </AuthShell>
  );
}
