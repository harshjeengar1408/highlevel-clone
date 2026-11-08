import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";

const HIGHLIGHTS = [
  {
    icon: "users" as const,
    title: "Unified CRM",
    copy: "Every contact, note, deal and conversation in a single record.",
  },
  {
    icon: "funnel" as const,
    title: "Pipelines that move",
    copy: "Drag deals through stages and watch forecast values update live.",
  },
  {
    icon: "zap" as const,
    title: "Automation engine",
    copy: "Trigger SMS, email and tasks the moment a form is submitted.",
  },
];

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#0b1120] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(900px circle at 10% 0%, rgba(99,102,241,0.4), transparent 45%), radial-gradient(700px circle at 90% 85%, rgba(139,92,246,0.32), transparent 45%)",
          }}
        />
        <div className="relative">
          <Link href="/login" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black shadow-lg shadow-indigo-900/40">
              HL
            </span>
            <span className="text-lg font-bold tracking-tight">HighLevel</span>
          </Link>

          <h1 className="mt-14 max-w-md text-[34px] font-bold leading-[1.15] tracking-tight">
            The all-in-one platform for
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
              {" "}
              leads, deals and follow-up
            </span>
            .
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
            Replace a dozen disconnected tools with one workspace your team actually enjoys
            using: CRM, conversations, calendars, funnels and automation.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-indigo-200 ring-1 ring-inset ring-white/15">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 max-w-xs text-xs leading-relaxed text-slate-400">
                    {item.copy}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12 flex items-center gap-6 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" />
            No credit card
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" />
            Demo data included
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" />
            Open source
          </span>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col justify-center bg-[#f4f5fa] px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/login" className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-black text-white">
              HL
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900">HighLevel</span>
          </Link>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  );
}
