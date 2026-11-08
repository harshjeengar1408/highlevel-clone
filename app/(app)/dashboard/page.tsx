import Link from "next/link";
import { ActionButton } from "@/components/forms";
import { NewContactModal, NewOpportunityModal, NewTaskModal } from "@/components/app-modals";
import { RevenueChart, StageBars } from "@/components/charts";
import { Icon } from "@/components/icons";
import { Avatar, Badge, PageHeader, ProgressBar, SectionCard, StatCard, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toggleTask } from "@/app/actions/tasks";
import {
  addDays,
  formatDate,
  formatTime,
  fullName,
  money,
  number,
  relativeTime,
  startOfDay,
  startOfWeek,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const locationId = user.locationId;
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    contactCount,
    monthContacts,
    openOpportunities,
    wonOpportunities,
    lostCount,
    weekAppointments,
    recentConversations,
    tasks,
    activity,
    pipeline,
    owners,
    contactOptions,
    pipelines,
    todayAppointments,
    unreadMessages,
  ] = await Promise.all([
    prisma.contact.count({ where: { locationId } }),
    prisma.contact.count({ where: { locationId, createdAt: { gte: monthStart } } }),
    prisma.opportunity.findMany({ where: { pipeline: { locationId }, status: "open" } }),
    prisma.opportunity.findMany({
      where: { pipeline: { locationId }, status: "won" },
      orderBy: { closedAt: "desc" },
    }),
    prisma.opportunity.count({ where: { pipeline: { locationId }, status: "lost" } }),
    prisma.appointment.count({
      where: { calendar: { locationId }, start: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.conversation.findMany({
      where: { locationId },
      include: {
        contact: true,
        user: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: { locationId },
      include: { assignee: true },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
      take: 6,
    }),
    prisma.activity.findMany({
      where: { locationId },
      include: { contact: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.pipeline.findFirst({
      where: { locationId },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: { opportunities: { where: { status: "open" } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { locationId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contact.findMany({
      where: { locationId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
      take: 100,
    }),
    prisma.pipeline.findMany({
      where: { locationId },
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { calendar: { locationId }, start: { gte: todayStart, lt: tomorrowStart } },
      include: { contact: true, calendar: true, user: true },
      orderBy: { start: "asc" },
    }),
    prisma.conversation.aggregate({ where: { locationId }, _sum: { unread: true } }),
  ]);

  const openValue = openOpportunities.reduce((sum, opportunity) => sum + opportunity.value, 0);
  const wonValue = wonOpportunities.reduce((sum, opportunity) => sum + opportunity.value, 0);
  const wonCount = wonOpportunities.length;
  const conversion = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString("en-US", { month: "short" }),
      value: 0,
    };
  });

  for (const opportunity of wonOpportunities) {
    if (!opportunity.closedAt) continue;
    const key = `${opportunity.closedAt.getFullYear()}-${opportunity.closedAt.getMonth()}`;
    const bucket = monthly.find((item) => item.key === key);
    if (bucket) bucket.value += opportunity.value;
  }

  const stageItems =
    pipeline?.stages.map((stage) => ({
      label: stage.name,
      value: stage.opportunities.reduce((sum, opportunity) => sum + opportunity.value, 0),
      count: stage.opportunities.length,
      color: stage.color,
    })) ?? [];

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];
  const contactPickers = contactOptions.map((contact) => ({ id: contact.id, name: fullName(contact) }));
  const nextAppointment = todayAppointments[0] ?? null;

  const completedTasks = tasks.filter((task) => task.completed).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }).format(now)}
        title={`${greeting}, ${firstName}`}
        subtitle={`Here's what's happening at ${user.location.name} today.`}
        actions={
          <>
            <NewContactModal owners={owners} label="New contact" variant="secondary" />
            <NewOpportunityModal
              pipelines={pipelines.map((item) => ({
                id: item.id,
                name: item.name,
                stages: item.stages.map((stage) => ({ id: stage.id, name: stage.name })),
              }))}
              contacts={contactPickers}
              owners={owners}
              defaultStageId={pipeline?.stages[0]?.id}
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total contacts"
          value={number(contactCount)}
          delta={`+${monthContacts} this month`}
          icon="users"
          tone="indigo"
        />
        <StatCard
          label="Open pipeline value"
          value={money(openValue)}
          hint={`${openOpportunities.length} opportunities`}
          icon="funnel"
          tone="violet"
        />
        <StatCard
          label="Appointments this week"
          value={number(weekAppointments)}
          hint={nextAppointment ? `Next at ${formatTime(nextAppointment.start)}` : "Nothing booked today"}
          icon="calendar"
          tone="emerald"
        />
        <StatCard
          label="Win rate"
          value={`${conversion}%`}
          hint={`${wonCount} won · ${lostCount} lost`}
          icon="target"
          tone="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Closed revenue"
          subtitle="Won opportunities over the last 6 months"
          action={
            <Badge tone="emerald">
              <Icon name="money" className="h-3 w-3" />
              {money(wonValue)} total
            </Badge>
          }
          bodyClassName="px-2 pb-3 pt-4"
        >
          <RevenueChart data={monthly} currency={user.location.currency} />
        </SectionCard>

        <SectionCard
          title={pipeline ? pipeline.name : "Pipeline"}
          subtitle="Open value by stage"
          action={
            <Link href="/pipelines" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View board
            </Link>
          }
        >
          {stageItems.length > 0 ? (
            <StageBars items={stageItems} />
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No pipeline yet.</p>
          )}

          <div className="mt-5 rounded-xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">Forecast confidence</span>
              <span className="font-semibold text-slate-900">{conversion}%</span>
            </div>
            <ProgressBar value={conversion} className="mt-2" />
            <p className="mt-2 text-[11px] text-slate-500">
              Based on {wonCount + lostCount} closed opportunities in this workspace.
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Today's schedule"
          subtitle={nextAppointment ? `Next: ${formatTime(nextAppointment.start)}` : "No appointments today"}
          action={
            <Link href="/calendars" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Calendar
            </Link>
          }
        >
          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-6 text-center">
              <span className="rounded-xl bg-slate-100 p-2.5 text-slate-400">
                <Icon name="calendar" className="h-4 w-4" />
              </span>
              <p className="mt-1 text-sm font-medium text-slate-700">Calendar is clear</p>
              <p className="text-xs text-slate-500">Book a job from any contact record.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todayAppointments.slice(0, 4).map((appointment) => (
                <li key={appointment.id} className="flex gap-3">
                  <div className="w-14 shrink-0 text-right">
                    <p className="text-xs font-semibold text-slate-900">{formatTime(appointment.start)}</p>
                    <p className="text-[10px] text-slate-400">{formatTime(appointment.end)}</p>
                  </div>
                  <div
                    className="min-w-0 flex-1 rounded-lg border-l-[3px] bg-slate-50/80 px-2.5 py-1.5"
                    style={{ borderColor: appointment.calendar.color }}
                  >
                    <p className="truncate text-xs font-semibold text-slate-800">{appointment.title}</p>
                    <Link
                      href={`/contacts/${appointment.contactId}`}
                      className="truncate text-[11px] text-slate-500 hover:text-indigo-600"
                    >
                      {fullName(appointment.contact)}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Conversations"
          subtitle={`${unreadMessages._sum.unread ?? 0} unread messages`}
          action={
            <Link href="/conversations" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Inbox
            </Link>
          }
          bodyClassName="p-2"
        >
          <ul className="divide-y divide-slate-100">
            {recentConversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/conversations?c=${conversation.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-50"
                >
                  <Avatar
                    name={fullName(conversation.contact)}
                    color={conversation.user?.color ?? "#6366f1"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {fullName(conversation.contact)}
                      </p>
                      {conversation.unread > 0 && (
                        <span className="ml-auto rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-slate-500">
                      {conversation.messages[0]?.body ?? "No messages yet"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {relativeTime(conversation.lastMessageAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Tasks"
          subtitle={`${completedTasks} of ${tasks.length} done`}
          action={<NewTaskModal users={owners} />}
          bodyClassName="p-2"
        >
          <ul className="space-y-0.5">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <ActionButton
                  action={toggleTask.bind(null, task.id)}
                  icon={task.completed ? "check" : undefined}
                  label={task.completed ? "" : ""}
                  title={task.completed ? "Mark as not done" : "Mark as done"}
                  className={
                    task.completed
                      ? "mt-0.5 h-4 w-4 shrink-0 rounded border border-emerald-500 bg-emerald-500 p-0 text-white"
                      : "mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-300 bg-white p-0"
                  }
                  compact
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      task.completed
                        ? "text-xs text-slate-400 line-through"
                        : "text-xs font-medium text-slate-700"
                    }
                  >
                    {task.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                    {task.assignee ? ` · ${task.assignee.name.split(" ")[0]}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Recent activity"
        subtitle="Everything your team did across the workspace"
        action={
          <Link href="/reporting" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            Reporting
          </Link>
        }
      >
        <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-200">
          {activity.map((item) => (
            <li key={item.id} className="relative flex gap-3">
              <span className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white ring-1 ring-slate-200">
                <Icon
                  name={
                    item.type === "sms"
                      ? "chat"
                      : item.type === "email"
                        ? "mail"
                        : item.type === "appointment"
                          ? "calendar"
                          : item.type === "form"
                            ? "form"
                            : item.type === "opportunity"
                              ? "funnel"
                              : item.type === "call"
                                ? "phone"
                                : "note"
                  }
                  className="h-3.5 w-3.5 text-slate-500"
                />
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                  {item.contact && (
                    <Link
                      href={`/contacts/${item.contactId}`}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700"
                    >
                      {fullName(item.contact)}
                    </Link>
                  )}
                  <span className="ml-auto text-[10px] text-slate-400">{relativeTime(item.createdAt)}</span>
                </div>
                {item.description && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
}
