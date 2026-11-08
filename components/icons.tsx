export type IconName =
  | "grid"
  | "chat"
  | "users"
  | "funnel"
  | "calendar"
  | "zap"
  | "form"
  | "chart"
  | "settings"
  | "logout"
  | "search"
  | "plus"
  | "trash"
  | "mail"
  | "phone"
  | "check"
  | "clock"
  | "tag"
  | "money"
  | "target"
  | "arrowUp"
  | "arrowRight"
  | "arrowLeft"
  | "chevronDown"
  | "chevronRight"
  | "sparkle"
  | "filter"
  | "send"
  | "note"
  | "globe"
  | "play"
  | "pause"
  | "menu"
  | "x"
  | "building"
  | "drag";

const PATHS: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  chat: (
    <>
      <path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-5.5A8 8 0 1 1 21 12Z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
      <circle cx="9" cy="7" r="3.5" />
      <path d="M17 4.2a3.5 3.5 0 0 1 0 6.6M22 20v-1.5a4 4 0 0 0-3-3.8" />
    </>
  ),
  funnel: (
    <>
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  zap: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  form: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V6M4 20h16" />
      <path d="M8 16v-3M12.5 16V9M17 16v-6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.4-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4Z" />
    </>
  ),
  logout: (
    <>
      <path d="M15 17l5-5-5-5" />
      <path d="M20 12H9" />
      <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 13h9.4l.8-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: (
    <path d="M6.5 3h2.6l1.6 4.2-2 1.4a11.5 11.5 0 0 0 5.7 5.7l1.4-2L20 13.9v2.6A3.5 3.5 0 0 1 16.5 20C10.7 20 4 13.3 4 7.5A3.5 3.5 0 0 1 6.5 3Z" />
  ),
  check: <path d="m5 13 4.5 4.5L19 6.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  tag: (
    <>
      <path d="M20.5 13.3 13.3 20.5a2 2 0 0 1-2.8 0L3 13V4h9l8.5 8.5a2 2 0 0 1 0 2.8Z" />
      <path d="M7.5 8h.01" />
    </>
  ),
  money: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5v11M14.8 9.2c0-1.3-1.2-2-2.8-2s-2.8.7-2.8 2 1.2 1.8 2.8 2.2 2.8.9 2.8 2.2-1.2 2-2.8 2-2.8-.7-2.8-2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  sparkle: (
    <>
      <path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.4l-1.8-4.9L5 9.7l5.2-1.8L12 3Z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  send: <path d="M4.5 12 20 4.5 15 20l-3.6-6.4L4.5 12Z" />,
  note: (
    <>
      <path d="M5 3.5h9L19 8v12.5H5V3.5Z" />
      <path d="M14 3.5V8h5M8.5 12.5h7M8.5 16.5h4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
    </>
  ),
  play: <path d="M7 4.5 19 12 7 19.5v-15Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  building: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 20.5v-4h4v4" />
    </>
  ),
  drag: (
    <>
      <circle cx="9" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="18" r="1" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-4 w-4",
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
