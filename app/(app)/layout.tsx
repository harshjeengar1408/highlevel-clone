import { MobileNav, Sidebar } from "@/components/shell";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        user={{ name: user.name, email: user.email, role: user.role, color: user.color }}
        business={{ name: user.location.name, industry: user.location.industry }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
