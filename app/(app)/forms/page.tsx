import { headers } from "next/headers";
import { ActionButton, ActionForm, Modal } from "@/components/forms";
import { CopyButton } from "@/components/forms";
import { Icon } from "@/components/icons";
import { Badge, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createForm, deleteForm, toggleForm } from "@/app/actions/forms";
import { number, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "textarea",
  "select",
  "date",
  "number",
  "checkbox",
];

export default async function FormsPage() {
  const user = await requireUser();
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const forms = await prisma.form.findMany({
    where: { locationId: user.locationId },
    include: {
      fields: { orderBy: { order: "asc" } },
      submissions: { orderBy: { createdAt: "desc" }, take: 5, include: { contact: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSubmissions = forms.reduce((sum, form) => sum + form._count.submissions, 0);
  const published = forms.filter((form) => form.isPublished).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Forms & funnels"
        subtitle="Capture leads with hosted forms — every submission lands in your CRM instantly."
        actions={
          <Modal
            label="New form"
            icon="plus"
            title="Create a lead capture form"
            description="Pick a template and we'll build the first fields for you."
          >
            <ActionForm action={createForm as never} submitLabel="Create form">
              <div>
                <label className="label">Form name</label>
                <input name="name" required className="input" placeholder="Free estimate request" />
              </div>
              <div>
                <label className="label">Headline</label>
                <input name="headline" className="input" placeholder="Get a free estimate today" />
              </div>
              <div>
                <label className="label">Template</label>
                <select name="template" className="input" defaultValue="estimate">
                  <option value="estimate">Estimate request</option>
                  <option value="contact">Contact us</option>
                  <option value="booking">Appointment booking</option>
                  <option value="survey">Customer survey</option>
                </select>
              </div>
            </ActionForm>
          </Modal>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Forms" value={number(forms.length)} hint={`${published} published`} icon="form" tone="indigo" />
        <StatCard label="Submissions" value={number(totalSubmissions)} hint="All time" icon="inbox" tone="violet" />
        <StatCard
          label="Contacts created"
          value={number(totalSubmissions)}
          hint="Auto-added to CRM"
          icon="users"
          tone="emerald"
        />
        <StatCard
          label="Avg per form"
          value={number(forms.length ? Math.round(totalSubmissions / forms.length) : 0)}
          hint="Submissions"
          icon="chart"
          tone="amber"
        />
      </div>

      {forms.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="form"
            title="No forms yet"
            description="Create a form to start capturing leads from your website or ads."
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {forms.map((form) => {
            const publicUrl = `${origin}/f/${form.id}`;
            return (
              <div key={form.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-900">{form.name}</h2>
                      <Badge tone={form.isPublished ? "green" : "slate"}>
                        {form.isPublished ? "Live" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {form.headline}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {form.fields.length} fields · {number(form._count.submissions)} submissions ·
                      updated {relativeTime(form.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <ActionButton
                      action={toggleForm.bind(null, form.id)}
                      label={form.isPublished ? "Unpublish" : "Publish"}
                      variant="secondary"
                      className="btn-sm"
                    />
                    <ActionButton
                      action={deleteForm.bind(null, form.id)}
                      icon="trash"
                      label=""
                      title="Delete form"
                      variant="danger"
                      compact
                      confirm={`Delete "${form.name}"? Submissions will be removed too.`}
                    />
                  </div>
                </div>

                <div className="flex-1 px-5 py-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Fields
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.fields.map((field) => (
                      <span
                        key={field.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-600 ring-1 ring-inset ring-slate-200"
                      >
                        {field.label}
                        <span className="text-slate-400">{field.type}</span>
                        {field.required && <span className="text-rose-500">*</span>}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-inset ring-slate-200">
                    <Icon name="link" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate font-mono text-[10px] text-slate-500">{publicUrl}</span>
                    <CopyButton value={publicUrl} />
                    <a
                      href={`/f/${form.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-lg px-1.5 py-1 text-slate-400 hover:bg-white hover:text-indigo-600"
                      title="Open form"
                    >
                      <Icon name="external" className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {form.submissions.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[11px] font-medium text-indigo-600 marker:content-none">
                        Recent submissions ({form.submissions.length})
                      </summary>
                      <ul className="mt-2 divide-y divide-slate-100">
                        {form.submissions.map((submission) => (
                          <li key={submission.id} className="flex items-center justify-between gap-2 py-1.5">
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-medium text-slate-700">
                                {submission.contact
                                  ? `${submission.contact.firstName} ${submission.contact.lastName}`
                                  : "Anonymous"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {relativeTime(submission.createdAt)}
                              </p>
                            </div>
                            <Badge tone="green">new</Badge>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-slate-400">
        Field types supported: {FIELD_TYPES.join(", ")}
      </p>
    </div>
  );
}
