import Link from "next/link";
import type { ReactNode } from "react";
import { cn, titleCase } from "@/lib/format";
import { Icon, type IconName } from "./icons";

const TONES = {
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  lead: "sky",
  opportunity: "violet",
  customer: "emerald",
  churned: "rose",
  open: "indigo",
  pending: "amber",
  closed: "slate",
  confirmed: "emerald",
  cancelled: "rose",
  showed: "emerald",
  noshow: "rose",
  draft: "slate",
  published: "emerald",
  paused: "amber",
  won: "emerald",
  lost: "rose",
  active: "emerald",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const tone = STATUS_TONES[value] ?? "slate";
  const label = value === "noshow" ? "No show" : titleCase(value);
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}

const AVATAR_SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({
  name,
  color = "#6366f1",
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  const label = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        AVATAR_SIZES[size],
        className
      )}
      style={{ backgroundColor: color }}
      title={name}
    >
      {label || "?"}
    </span>
  );
}

const ICON_TONES: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-indigo-50 text-indigo-600",
  violet: "bg-violet-50 text-violet-600",
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  icon: IconName;
  tone?: Tone;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className={cn("rounded-xl p-2", ICON_TONES[tone])}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
            <Icon name="arrowUp" className="h-3 w-3" />
            {delta}
          </span>
        )}
        {hint && <span className="text-slate-400">{hint}</span>}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName = "p-5",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card flex flex-col", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon = "sparkle",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="rounded-2xl bg-slate-100 p-3 text-slate-400">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  color = "#6366f1",
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function LinkTabs({
  tabs,
  active,
}: {
  tabs: Array<{ key: string; label: string; href: string; count?: number }>;
  active: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
            tab.key === active
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px]",
                tab.key === active ? "bg-white/20" : "bg-slate-100 text-slate-500"
              )}
            >
              {tab.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
