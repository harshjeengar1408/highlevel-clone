import Link from "next/link";
import { NewAppointmentModal } from "@/components/app-modals";
import { ActionButton } from "@/components/forms";
import { Icon } from "@/components/icons";
import { Avatar, Badge, EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { setAppointmentStatus } from "@/app/actions/calendars";
import {
  addDays,
  cn,
  formatTime,
  fullName,
  sameDay,
  startOfDay,
  startOfWeek,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const START_HOUR = 8;
const END_HOUR = 19;
const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);

export default async function CalendarsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; calendar?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const baseDate = params.week ? new Date(`${params.week}T12:00:00`) : new Date();
  const weekStart = startOfWeek(Number.isNaN(baseDate.getTime()) ? new Date() : baseDate);
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const today = new Date();

  const [calendars, appointments, contacts, users] = await Promise.all([
    prisma.calendar.findMany({
      where: { locationId: user.locationId },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        calendar: { locationId: user.locationId },
        start: { gte: weekStart, lt: weekEnd },
        ...(params.calendar ? { calendarId: params.calendar } : {}),
      },
      include: { contact: true, calendar: true, user: true },
      orderBy: { start: "asc" },
    }),
    prisma.contact.findMany({
      where: { locationId: user.locationId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { locationId: user.locationId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const upcoming = await prisma.appointment.findMany({
    where: { calendar: { locationId: user.locationId }, start: { gte: today } },
    include: { contact: true, calendar: true, user: true },
    orderBy: { start: "asc" },
    take: 6,
  });

  const weekLabel = `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(weekStart)} – ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(addDays(weekStart, 6))}`;

  const previousWeek = startOfWeek(addDays(weekStart, -7));
  const nextWeek = startOfWeek(addDays(weekStart, 7));
  const iso = (date: Date) => date.toISOString().slice(0, 10);

  const contactPickers = contacts.map((contact) => ({ id: contact.id, name: fullName(contact) }));
  const totalHours = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendars"
        subtitle="Book jobs, avoid double-booking and let reminder workflows handle the follow-up."
        actions={
          <NewAppointmentModal
            calendars={calendars.map((calendar) => ({ id: calendar.id, name: calendar.name }))}
            contacts={contactPickers}
            users={users}
            defaultDate={iso(today >= weekStart && today < weekEnd ? today : weekStart)}
          />
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_290px]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/calendars?week=${iso(previousWeek)}${params.calendar ? `&calendar=${params.calendar}` : ""}`}
                className="btn btn-secondary btn-sm"
                aria-label="Previous week"
              >
                <Icon name="arrowLeft" className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={`/calendars${params.calendar ? `?calendar=${params.calendar}` : ""}`}
                className="btn btn-secondary btn-sm"
              >
                Today
              </Link>
              <Link
                href={`/calendars?week=${iso(nextWeek)}${params.calendar ? `&calendar=${params.calendar}` : ""}`}
                className="btn btn-secondary btn-sm"
                aria-label="Next week"
              >
                <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </Link>
              <h2 className="ml-1 text-sm font-semibold text-slate-900">{weekLabel}</h2>
            </div>
            <Badge tone="slate">{appointments.length} appointments</Badge>
          </div>

          <div className="thin-scroll overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="flex border-b border-slate-100 bg-slate-50/70">
                <div className="w-14 shrink-0" />
                <div className="grid flex-1 grid-cols-7">
                  {days.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "border-l border-slate-100 px-1 py-2 text-center",
                        sameDay(day, today) && "bg-indigo-50/70"
                      )}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-bold",
                          sameDay(day, today) ? "text-indigo-600" : "text-slate-800"
                        )}
                      >
                        {new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(day)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="thin-scroll flex max-h-[620px] overflow-y-auto">
                <div className="w-14 shrink-0">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="relative text-right text-[10px] text-slate-400"
                      style={{ height: HOUR_HEIGHT }}
                    >
                      <span className="absolute right-2 top-0 -translate-y-1/2">
                        {new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(
                          new Date(2024, 0, 1, hour)
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid flex-1 grid-cols-7">
                  {days.map((day) => {
                    const dayAppointments = appointments.filter((appointment) =>
                      sameDay(appointment.start, day)
                    );

                    return (
                      <div key={day.toISOString()} className="relative border-l border-slate-100">
                        <div style={{ height: totalHours }}>
                          {HOURS.map((hour) => (
                            <div
                              key={hour}
                              className="border-b border-slate-100"
                              style={{ height: HOUR_HEIGHT }}
                            />
                          ))}
                        </div>

                        {dayAppointments.map((appointment) => {
                          const start = new Date(appointment.start);
                          const end = new Date(appointment.end);
                          const startMinutes =
                            start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
                          const durationMinutes = Math.max(
                            30,
                            (end.getTime() - start.getTime()) / 60000
                          );
                          const top = Math.max(0, (startMinutes / 60) * HOUR_HEIGHT);
                          const height = Math.max(26, (durationMinutes / 60) * HOUR_HEIGHT - 4);

                          return (
                            <Link
                              key={appointment.id}
                              href={`/contacts/${appointment.contactId}`}
                              className="absolute left-1 right-1 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-[10px] transition-shadow hover:shadow-md"
                              style={{
                                top,
                                height,
                                borderColor: appointment.calendar.color,
                                backgroundColor: `${appointment.calendar.color}14`,
                              }}
                              title={`${appointment.title} · ${fullName(appointment.contact)}`}
                            >
                              <p className="truncate font-semibold text-slate-800">{appointment.title}</p>
                              <p className="truncate text-slate-500">{formatTime(start)}</p>
                              {height > 44 && (
                                <p className="truncate text-slate-500">{fullName(appointment.contact)}</p>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="Calendars" subtitle="Filter by team calendar">
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/calendars"
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                    !params.calendar ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  All calendars
                  <span className="text-[10px] opacity-70">{appointments.length}</span>
                </Link>
              </li>
              {calendars.map((calendar) => (
                <li key={calendar.id}>
                  <Link
                    href={`/calendars?calendar=${calendar.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                      params.calendar === calendar.id
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      {calendar.name}
                    </span>
                    <span className="text-[10px] opacity-70">
                      {
                        appointments.filter((appointment) => appointment.calendarId === calendar.id)
                          .length
                      }
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Upcoming" subtitle="Next six appointments" bodyClassName="p-2">
            {upcoming.length === 0 ? (
              <EmptyState icon="calendar" title="Nothing booked" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map((appointment) => (
                  <li key={appointment.id} className="px-2 py-2.5">
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: appointment.calendar.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {appointment.title}
                        </p>
                        <Link
                          href={`/contacts/${appointment.contactId}`}
                          className="truncate text-[11px] text-slate-500 hover:text-indigo-600"
                        >
                          {fullName(appointment.contact)}
                        </Link>
                        <p className="text-[10px] text-slate-400">
                          {new Intl.DateTimeFormat("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }).format(appointment.start)}{" "}
                          · {formatTime(appointment.start)}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <StatusBadge value={appointment.status} />
                          {appointment.user && (
                            <Avatar name={appointment.user.name} color={appointment.user.color} size="xs" />
                          )}
                          {appointment.status !== "cancelled" && (
                            <ActionButton
                              action={setAppointmentStatus.bind(null, appointment.id, "cancelled")}
                              label="Cancel"
                              title="Cancel appointment"
                              className="ml-auto px-1 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                              compact
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
