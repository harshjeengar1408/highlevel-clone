export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function compactMoney(value: number, currency = "USD") {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return money(value, currency);
}

export function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function initials(first: string, last?: string) {
  return `${first.charAt(0)}${last?.charAt(0) ?? ""}`.toUpperCase();
}

export function fullName(contact: { firstName: string; lastName: string }) {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export function formatDate(date: Date | string, timeZone = "America/New_York") {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(new Date(date));
}

export function formatTime(date: Date | string, timeZone = "America/New_York") {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(date));
}

export function formatDayLabel(date: Date | string, timeZone = "America/New_York") {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(date));
}

export function relativeTime(date: Date | string) {
  const then = new Date(date).getTime();
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  return formatDate(date);
}

export function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfWeek(date: Date) {
  // Weeks run Monday -> Sunday, matching the calendar UI.
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  return addDays(copy, -diff);
}

export function sameDay(a: Date | string, b: Date | string) {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function channelLabel(channel: string) {
  switch (channel) {
    case "sms":
      return "SMS";
    case "email":
      return "Email";
    case "call":
      return "Call";
    case "facebook":
      return "Facebook";
    case "instagram":
      return "Instagram";
    case "webchat":
      return "Web chat";
    default:
      return titleCase(channel);
  }
}

export const AVATAR_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
];

export function colorFromString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
