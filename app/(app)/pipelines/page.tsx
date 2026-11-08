import Link from "next/link";
import { ActionForm, Modal } from "@/components/forms";
import { NewOpportunityModal } from "@/components/app-modals";
import { PipelineBoard } from "@/components/pipeline-board";
import { Icon } from "@/components/icons";
import { Badge, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createPipeline } from "@/app/actions/pipelines";
import { colorFromString, formatDate, fullName, money, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PipelinesPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const [pipelines, owners, contactOptions, wonDeals] = await Promise.all([
    prisma.pipeline.findMany({
      where: { locationId: user.locationId },
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { locationId: user.locationId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contact.findMany({
      where: { locationId: user.locationId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
      take: 100,
    }),
    prisma.opportunity.findMany({
      where: { pipeline: { locationId: user.locationId }, status: { in: ["won", "lost"] } },
      include: { contact: true, stage: true, pipeline: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const activePipeline =
    pipelines.find((pipeline) => pipeline.id === params.pipeline) ?? pipelines[0];

  const opportunities = activePipeline
    ? await prisma.opportunity.findMany({
        where: { pipelineId: activePipeline.id, status: "open" },
        include: { contact: true, owner: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const cards = opportunities.map((opportunity) => ({
    id: opportunity.id,
    name: opportunity.name,
    value: opportunity.value,
    stageId: opportunity.stageId,
    contactId: opportunity.contactId,
    contactName: fullName(opportunity.contact),
    ownerName: opportunity.owner?.name ?? null,
    ownerColor: opportunity.owner?.color ?? colorFromString(opportunity.id),
    source: opportunity.source,
    updatedAt: opportunity.updatedAt.toISOString(),
  }));

  const pipelineOptions = pipelines.map((pipeline) => ({
    id: pipeline.id,
    name: pipeline.name,
    stages: pipeline.stages.map((stage) => ({ id: stage.id, name: stage.name })),
  }));

  const contactPickers = contactOptions.map((contact) => ({
    id: contact.id,
    name: fullName(contact),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pipelines"
        subtitle="Track every deal from first touch to signed agreement. Drag cards to move them through stages."
        actions={
          <>
            <Modal
              label="New pipeline"
              icon="plus"
              variant="secondary"
              title="Create a pipeline"
              description="Stages are comma separated — keep them short."
            >
              <ActionForm action={createPipeline as never} submitLabel="Create pipeline">
                <div>
                  <label className="label">Pipeline name</label>
                  <input name="name" required className="input" placeholder="Service Agreements" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input name="description" className="input" placeholder="Recurring maintenance contracts" />
                </div>
                <div>
                  <label className="label">Stages</label>
                  <input
                    name="stages"
                    className="input"
                    defaultValue="New Lead, Contacted, Proposal Sent, Won"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Leave blank to use the default four stages.
                  </p>
                </div>
              </ActionForm>
            </Modal>
            {activePipeline && (
              <NewOpportunityModal
                pipelines={pipelineOptions}
                contacts={contactPickers}
                owners={owners}
                defaultStageId={activePipeline.stages[0]?.id}
              />
            )}
          </>
        }
      />

      {pipelines.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {pipelines.map((pipeline) => (
            <Link
              key={pipeline.id}
              href={`/pipelines?pipeline=${pipeline.id}`}
              className={
                pipeline.id === activePipeline?.id
                  ? "inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  : "inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
              }
            >
              <Icon name="funnel" className="h-3.5 w-3.5" />
              {pipeline.name}
            </Link>
          ))}
        </div>
      )}

      {!activePipeline ? (
        <div className="card">
          <EmptyState
            icon="funnel"
            title="No pipelines yet"
            description="Create your first pipeline to start tracking deal value."
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{activePipeline.name}</h2>
              <p className="text-xs text-slate-500">{activePipeline.description}</p>
            </div>
            <Badge tone="indigo">
              {opportunities.length} open ·{" "}
              {money(opportunities.reduce((sum, opportunity) => sum + opportunity.value, 0))}
            </Badge>
          </div>

          <PipelineBoard
            stages={activePipeline.stages.map((stage) => ({
              id: stage.id,
              name: stage.name,
              color: stage.color,
            }))}
            cards={cards}
            currency={user.location.currency}
          />

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-900">Recently closed</h2>
              <span className="text-xs text-slate-500">Won and lost deals</span>
            </div>
            {wonDeals.length === 0 ? (
              <EmptyState icon="target" title="Nothing closed yet" description="Won and lost deals appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {wonDeals.map((deal) => (
                  <li key={deal.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/contacts/${deal.contactId}`}
                        className="truncate text-sm font-semibold text-slate-900 hover:text-indigo-600"
                      >
                        {deal.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {fullName(deal.contact)} · {titleCase(deal.pipeline.name)} · closed{" "}
                        {formatDate(deal.closedAt ?? deal.updatedAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{money(deal.value)}</span>
                    <StatusBadge value={deal.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
