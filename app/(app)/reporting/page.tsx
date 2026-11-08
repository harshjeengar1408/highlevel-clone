import { DonutChart, RevenueChart, StageBars } from "@/components/charts";
import { Icon } from "@/components/icons";
import { Avatar, Badge, EmptyState, PageHeader, SectionCard, StatCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { money, number, percent, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

const SOURCE_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#94a3b8"];

export default async function ReportingPage() {
  const user = await requireUser();
  const locationId = user.locationId;
  const now = new Date();

  const [opportunities, appointments, contacts, teammates, pipelines] = await Promise.all([
    prisma.opportunity.findMany({
      where: { pipeline: { locationId } },
      include: { owner: true, stage: true, pipeline: true },
    }),
    prisma.appointment.findMany({
      where: { calendar: { locationId } },
      select: { status: true, start: true },
    }),
    prisma.contact.findMany({ where: { locationId }, select: { source: true, status: true } }),
    prisma.user.findMany({ where: { locationId }, orderBy: { createdAt: "asc" } }),
    prisma.pipeline.findMany({
      where: { locationId },
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const won = opportunities.filter((opportunity) => opportunity.status === "won");
  const lost = opportunities.filter((opportunity) => opportunity.status === "lost");
  const open = opportunities.filter((opportunity) => opportunity.status === "open");

  const wonValue = won.reduce((sum, opportunity) => sum + opportunity.value, 0);
  const openValue = open.reduce((sum, opportunity) => sum + opportunity.value, 0);
  const avgDeal = won.length > 0 ? wonValue / won.length : 0;
  const winRate = percent(won.length, won.length + lost.length);

  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString("en-US", { month: "short" }),
      value: 0,
    };
  });
  for (const opportunity of won) {
    if (!opportunity.closedAt) continue;
    const key = `${opportunity.closedAt.getFullYear()}-${opportunity.closedAt.getMonth()}`;
    const bucket = monthly.find((item) => item.key === key);
    if (bucket) bucket.value += opportunity.value;
  }

  const sourceCounts = new Map<string, number>();
  for (const contact of contacts) {
    sourceCounts.set(contact.source, (sourceCounts.get(contact.source) ?? 0) + 1);
  }
  const sourceData = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({
      label: titleCase(label),
      value,
      color: SOURCE_COLORS[index],
    }));
  const otherSources = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(5)
    .reduce((sum, [, value]) => sum + value, 0);
  if (otherSources > 0) {
    sourceData.push({ label: "Other", value: otherSources, color: SOURCE_COLORS[5] });
  }

  const agents = teammates.map((teammate) => {
    const owned = opportunities.filter((opportunity) => opportunity.ownerId === teammate.id);
    const agentWon = owned.filter((opportunity) => opportunity.status === "won");
    const agentLost = owned.filter((opportunity) => opportunity.status === "lost");
    const agentOpen = owned.filter((opportunity) => opportunity.status === "open");

    return {
      id: teammate.id,
      name: teammate.name,
      color: teammate.color,
      title: teammate.title ?? titleCase(teammate.role),
      openCount: agentOpen.length,
      openValue: agentOpen.reduce((sum, opportunity) => sum + opportunity.value, 0),
      wonCount: agentWon.length,
      wonValue: agentWon.reduce((sum, opportunity) => sum + opportunity.value, 0),
      winRate: percent(agentWon.length, agentWon.length + agentLost.length),
    };
  });

  const primaryPipeline = pipelines[0];
  const stageItems =
    primaryPipeline?.stages.map((stage) => {
      const stageOpportunities = opportunities.filter(
        (opportunity) => opportunity.stageId === stage.id
      );
      return {
        label: stage.name,
        value: stageOpportunities.reduce((sum, opportunity) => sum + opportunity.value, 0),
        count: stageOpportunities.length,
        color: stage.color,
      };
    }) ?? [];

  const appointmentsTotal = appointments.length;
  const confirmed = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const cancelled = appointments.filter((appointment) => appointment.status === "cancelled").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reporting"
        subtitle="Revenue, pipeline health and team performance across the whole workspace."
        actions={
          <Badge tone="indigo">
            <Icon name="chart" className="h-3 w-3" />
            Live data
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue won" value={money(wonValue)} hint={`${won.length} deals closed`} icon="money" tone="emerald" />
        <StatCard label="Average deal" value={money(avgDeal)} hint={`${open.length} still open`} icon="funnel" tone="indigo" />
        <StatCard label="Win rate" value={`${winRate}%`} hint={`${lost.length} lost deals`} icon="target" tone="violet" />
        <StatCard
          label="Appointments"
          value={number(appointmentsTotal)}
          hint={`${confirmed} confirmed · ${cancelled} cancelled`}
          icon="calendar"
          tone="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Revenue trend"
          subtitle="Won deal value by month"
          action={<Badge tone="slate">{money(openValue)} in pipeline</Badge>}
          bodyClassName="px-2 pb-3 pt-4"
        >
          <RevenueChart data={monthly} currency={user.location.currency} />
        </SectionCard>

        <SectionCard title="Lead sources" subtitle="Where contacts came from">
          {sourceData.length > 0 ? (
            <DonutChart data={sourceData} centerLabel="contacts" />
          ) : (
            <EmptyState icon="users" title="No contacts yet" />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title={primaryPipeline ? `${primaryPipeline.name} health` : "Pipeline health"}
          subtitle="Total value per stage, including closed deals"
        >
          {stageItems.length > 0 ? (
            <StageBars items={stageItems} />
          ) : (
            <EmptyState icon="funnel" title="No pipeline data" />
          )}
        </SectionCard>

        <SectionCard title="Team performance" subtitle="Ownership, activity and close rate" bodyClassName="p-0">
          {agents.length === 0 ? (
            <EmptyState icon="users" title="No teammates yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="border-b border-slate-100 bg-slate-50/60">
                  <tr>
                    <th className="th">Teammate</th>
                    <th className="th text-right">Open</th>
                    <th className="th text-right">Pipeline</th>
                    <th className="th text-right">Won</th>
                    <th className="th text-right">Win rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={agent.name} color={agent.color} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{agent.name}</p>
                            <p className="text-[10px] text-slate-500">{agent.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td text-right text-xs">{agent.openCount}</td>
                      <td className="td text-right text-xs font-medium">{money(agent.openValue)}</td>
                      <td className="td text-right text-xs font-medium">{money(agent.wonValue)}</td>
                      <td className="td text-right">
                        <Badge tone={agent.winRate >= 50 ? "emerald" : agent.winRate > 0 ? "amber" : "slate"}>
                          {agent.winRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
