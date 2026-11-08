import { compactMoney, money, number } from "@/lib/format";

export function RevenueChart({
  data,
  currency = "USD",
  height = 260,
}: {
  data: Array<{ label: string; value: number }>;
  currency?: string;
  height?: number;
}) {
  const width = 760;
  const padding = { top: 18, right: 18, bottom: 34, left: 58 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const values = data.map((item) => item.value);
  const max = Math.max(1, ...values) * 1.18;
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((item, index) => ({
    ...item,
    x: padding.left + index * step,
    y: padding.top + innerH - (item.value / max) * innerH,
  }));

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const area =
    points.length > 0
      ? `${line} L ${points[points.length - 1].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`
      : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Revenue by month">
      <defs>
        <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridLines.map((ratio) => {
        const y = padding.top + innerH - ratio * innerH;
        return (
          <g key={ratio}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray={ratio === 0 ? "0" : "4 6"}
            />
            <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
              {compactMoney(max * ratio, currency)}
            </text>
          </g>
        );
      })}

      {area && <path d={area} fill="url(#revenue-fill)" />}
      {line && <path d={line} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" />}

      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r={4} fill="#ffffff" stroke="#6366f1" strokeWidth={2.5}>
            <title>{`${point.label}: ${money(point.value, currency)}`}</title>
          </circle>
          <text x={point.x} y={height - 12} textAnchor="middle" className="fill-slate-400 text-[11px]">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function StageBars({
  items,
}: {
  items: Array<{ label: string; value: number; count: number; color: string }>;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
            <span className="inline-flex items-center gap-2 font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="tabular-nums font-semibold text-slate-900">
              {money(item.value)}
              <span className="ml-1.5 font-normal text-slate-400">{item.count}</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(3, (item.value / max) * 100)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative">
        <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef2f7" strokeWidth="16" />
          {total > 0 &&
            data.map((item) => {
              const length = (item.value / total) * circumference;
              const dash = `${Math.max(length - 3, 0)} ${circumference - Math.max(length - 3, 0)}`;
              const circle = (
                <circle
                  key={item.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                >
                  <title>{`${item.label}: ${number(item.value)}`}</title>
                </circle>
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-900">{centerValue ?? number(total)}</span>
          {centerLabel && <span className="text-[10px] uppercase tracking-wide text-slate-400">{centerLabel}</span>}
        </div>
      </div>

      <ul className="min-w-[150px] flex-1 space-y-2">
        {data.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{number(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MiniBars({ values, color = "#6366f1" }: { values: number[]; color?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-10 items-end gap-1">
      {values.map((value, index) => (
        <span
          key={index}
          className="w-full rounded-sm"
          style={{
            height: `${Math.max(8, (value / max) * 100)}%`,
            backgroundColor: color,
            opacity: 0.35 + (index / Math.max(values.length, 1)) * 0.65,
          }}
        />
      ))}
    </div>
  );
}
