import { ActionButton, ActionForm, Modal } from "@/components/forms";
import { Icon } from "@/components/icons";
import { Badge, EmptyState, PageHeader, ProgressBar, SectionCard, StatCard, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  addWorkflowStep,
  createWorkflow,
  deleteWorkflow,
  removeWorkflowStep,
  toggleWorkflow,
} from "@/app/actions/automations";
import { number, percent, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const KIND_STYLES = {
  trigger: { label: "Trigger", tone: "violet" as const, icon: "play" as const },
  action: { label: "Action", tone: "indigo" as const, icon: "zap" as const },
  wait: { label: "Wait", tone: "amber" as const, icon: "clock" as const },
  condition: { label: "Condition", tone: "sky" as const, icon: "filter" as const },
};

const TRIGGERS = [
  "Form submitted",
  "Appointment booked",
  "Inbound call missed",
  "Job completed",
  "Tag added",
  "Opportunity stage changed",
  "Contact created",
];

export default async function AutomationsPage() {
  const user = await requireUser();

  const workflows = await prisma.workflow.findMany({
    where: { locationId: user.locationId },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const published = workflows.filter((workflow) => workflow.status === "published");
  const enrolled = workflows.reduce((sum, workflow) => sum + workflow.enrolled, 0);
  const completed = workflows.reduce((sum, workflow) => sum + workflow.completed, 0);
  const completionRate = percent(completed, enrolled);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Automations"
        subtitle="Trigger SMS, email, waits and tasks the moment something happens in your business."
        actions={
          <Modal
            label="New workflow"
            icon="plus"
            title="Build an automation"
            description="Start with a trigger and your first action — you can add more steps after."
          >
            <ActionForm action={createWorkflow as never} submitLabel="Create workflow">
              <div>
                <label className="label">Workflow name</label>
                <input name="name" required className="input" placeholder="Estimate follow-up" />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  name="description"
                  className="input"
                  placeholder="Nudge new estimates after two days"
                />
              </div>
              <div>
                <label className="label">Trigger</label>
                <select name="trigger" required className="input" defaultValue={TRIGGERS[0]}>
                  {TRIGGERS.map((trigger) => (
                    <option key={trigger} value={trigger}>
                      {trigger}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">First action</label>
                  <select name="firstAction" className="input" defaultValue="Send SMS">
                    <option>Send SMS</option>
                    <option>Send email</option>
                    <option>Create task</option>
                    <option>Add tag</option>
                  </select>
                </div>
                <div>
                  <label className="label">Action detail</label>
                  <input name="firstDetail" className="input" placeholder="Hi {{contact.first_name}}…" />
                </div>
              </div>
            </ActionForm>
          </Modal>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Workflows" value={number(workflows.length)} hint={`${published.length} published`} icon="zap" tone="indigo" />
        <StatCard label="Total enrolled" value={number(enrolled)} hint="Across all workflows" icon="users" tone="violet" />
        <StatCard label="Completed runs" value={number(completed)} hint={`${completionRate}% completion`} icon="check" tone="emerald" />
        <StatCard label="Saved hours" value={`${Math.round(enrolled * 0.12)}h`} hint="Estimated manual effort" icon="clock" tone="amber" />
      </div>

      {workflows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="zap"
            title="No workflows yet"
            description="Create your first automation and let the platform handle the follow-up."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <details key={workflow.id} className="card group overflow-hidden">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-4 marker:content-none">
                <span
                  className={`rounded-xl p-2 ${
                    workflow.status === "published"
                      ? "bg-emerald-50 text-emerald-600"
                      : workflow.status === "paused"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon name="zap" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">{workflow.name}</h2>
                    <StatusBadge value={workflow.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {workflow.trigger} · {workflow.steps.length} steps · created{" "}
                    {relativeTime(workflow.createdAt)}
                  </p>
                </div>
                <div className="hidden w-40 shrink-0 sm:block">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{number(workflow.enrolled)} enrolled</span>
                    <span>{percent(workflow.completed, workflow.enrolled)}%</span>
                  </div>
                  <ProgressBar
                    value={percent(workflow.completed, workflow.enrolled)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <ActionButton
                    action={toggleWorkflow.bind(null, workflow.id)}
                    label={workflow.status === "published" ? "Pause" : "Publish"}
                    icon={workflow.status === "published" ? "pause" : "play"}
                    variant="secondary"
                    className="btn-sm"
                  />
                  <ActionButton
                    action={deleteWorkflow.bind(null, workflow.id)}
                    icon="trash"
                    label=""
                    title="Delete workflow"
                    variant="danger"
                    compact
                    confirm={`Delete "${workflow.name}"? This can't be undone.`}
                  />
                  <Icon
                    name="chevronDown"
                    className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"
                  />
                </div>
              </summary>

              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                <p className="mb-3 text-xs text-slate-500">{workflow.description}</p>
                <ol className="space-y-2">
                  {workflow.steps.map((step, index) => {
                    const kind = KIND_STYLES[step.kind as keyof typeof KIND_STYLES] ?? KIND_STYLES.action;
                    return (
                      <li key={step.id} className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-inset ring-slate-200">
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold text-slate-800">{step.title}</p>
                            <Badge tone={kind.tone}>{kind.label}</Badge>
                          </div>
                          {step.detail && <p className="mt-1 text-[11px] text-slate-500">{step.detail}</p>}
                        </div>
                        <ActionButton
                          action={removeWorkflowStep.bind(null, step.id, workflow.id)}
                          label="×"
                          title="Remove step"
                          className="rounded-lg px-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                          compact
                        />
                      </li>
                    );
                  })}
                </ol>

                <ActionForm
                  action={addWorkflowStep as never}
                  submitLabel="Add step"
                  cancelLabel={null}
                  className="mt-3 flex flex-col gap-2 space-y-0 sm:flex-row sm:items-end"
                  footerClassName="pt-0"
                >
                  <input type="hidden" name="workflowId" value={workflow.id} />
                  <div className="w-full sm:w-32">
                    <label className="label">Type</label>
                    <select name="kind" className="input" defaultValue="action">
                      <option value="action">Action</option>
                      <option value="wait">Wait</option>
                      <option value="condition">Condition</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="label">Step</label>
                    <input name="title" required className="input" placeholder="Send SMS" />
                  </div>
                  <div className="flex-1">
                    <label className="label">Detail (optional)</label>
                    <input name="detail" className="input" placeholder="Message body or timing" />
                  </div>
                </ActionForm>
              </div>
            </details>
          ))}
        </div>
      )}

      <SectionCard title="Trigger library" subtitle="Every event workflows can listen for">
        <div className="flex flex-wrap gap-2">
          {TRIGGERS.map((trigger) => (
            <span
              key={trigger}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
            >
              <Icon name="play" className="h-3 w-3 text-indigo-500" />
              {trigger}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
