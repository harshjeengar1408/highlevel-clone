import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/format";
import { Avatar } from "./ui";
import { Icon, type IconName } from "./icons";

type NavItem = { href: string; label: string; icon: IconName };

const GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "grid" },
      { href: "/conversations", label: "Conversations", icon: "chat" },
      { href: "/contacts", label: "Contacts", icon: "users" },
      { href: "/pipelines", label: "Pipelines", icon: "funnel" },
      { href: "/calendars", label: "Calendars", icon: "calendar" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/automations", label: "Automations", icon: "zap" },
      { href: "/forms", label: "Forms & Funnels", icon: "form" },
      { href: "/reporting", label: "Reporting", icon: "chart" },
    ],
  },
];

const MOBILE_ITEMS = GROUPS.flatMap((group) => group.items);

export function Sidebar({
  user,
  business,
}: {
  user: { name: string; email: string; role: string; color: string };
  business: { name: string; industry: string | null };
}) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-white/5 bg-[#0b1120] px-3 py-4 text-white lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 pb-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-black shadow-lg shadow-indigo-950/50">
          HL
        </span>
        <span>
          <span className="block text-sm font-bold leading-none tracking-tight">HighLevel</span>
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
            CRM Suite
          </span>
        </span>
      </Link>

      <div className="mb-4 flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-2 ring-1 ring-inset ring-white/10">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/20 text-indigo-300">
          <Icon name="building" className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">{business.name}</p>
          <p className="truncate text-[10px] text-slate-400">{business.industry ?? "Workspace"}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto thin-scroll">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn("nav-link", isActive(item.href) && "nav-link-active")}
                  >
                    <Icon
                      name={item.icon}
                      className={cn(
                        "h-4 w-4",
                        isActive(item.href) ? "text-indigo-300" : "text-slate-400"
                      )}
                    />
                    {item.label}
                    {isActive(item.href) && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-3 space-y-0.5 border-t border-white/10 pt-3">
        <Link
          href="/settings"
          className={cn("nav-link", isActive("/settings") && "nav-link-active")}
        >
          <Icon name="settings" className="h-4 w-4 text-slate-400" />
          Settings
        </Link>
      </div>

      <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-white/5 px-2.5 py-2.5 ring-1 ring-inset ring-white/10">
        <Avatar name={user.name} color={user.color} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{user.name}</p>
          <p className="truncate text-[10px] capitalize text-slate-400">{user.role}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Sign out"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-black text-white">
            HL
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">HighLevel</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/settings" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <Icon name="settings" className="h-4 w-4" />
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              title="Sign out"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
      <nav className="thin-scroll flex gap-1 overflow-x-auto px-3 pb-2">
        {MOBILE_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
              isActive(item.href)
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Icon name={item.icon} className="h-3.5 w-3.5" />
            {item.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
