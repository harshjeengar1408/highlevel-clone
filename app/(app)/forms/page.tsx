import Link from "next/link";
import { headers } from "next/headers";
import { ActionButton, ActionForm, CopyButton, Modal } from "@/components/forms";
import { Icon } from "@/components/icons";
import { Badge, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createForm, deleteForm, toggleForm } from "@/app/actions/forms";
import { formatDate, number, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const user = await requireUser();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const forms = await prisma.form.findMany({
    where: { locationId: user.locationId },
    include: {
      submissions: {
        include: { contact: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSubmissions = forms.reduce((sum, form) => sum + form._count.submissions, 0);
  const totalViews = forms.reduce((sum, form) => sum + form.views, 0);
  const conversion = totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Forms & Funnels"
        subtitle="Capture leads on any page. Every submission creates a contact and can start an automation."
        actions={
          <Modal
            label="New form"
            icon="plus"
            title="Create a form"
            description="Add one field per line using Label | type (text, email, tel, textarea, date)."
          >
            <ActionForm action={createForm as never} submitLabel="Create form">
              <div>
                <label className="label">Form name</label>
                <input name="name" required className="input" placeholder="Spring tune-up booking" />
              </div>
              <div>
                <label className="label">Description</label>
                <input name="description" className="input" placeholder="Used on the seasonal landing page" />
              </div>
              <div>
                <label className="label">Fields</label>
                <textarea
                  name="fields"
                  rows={5}
                  className="input font-mono text-xs"
                  defaultValue={"Full name | text\nEmail | email\nPhone | tel\nWhat do you need? | textarea"}
                />
              </div>
            </ActionForm>
          </Modal>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published forms" value={number(forms.filter((form) => form.published).length)} hint={`${forms.length} total`} icon="form" tone="indigo" />
        <StatCard label="Submissions" value={number(totalSubmissions)} hint="All time" icon="users" tone="violet" />
        <StatCard label="Form views" value={number(totalViews)} hint="Across published forms" icon="globe" tone="sky" />
        <StatCard label="Opt-in rate" value={`${conversion}%`} hint="Submissions ÷ views" icon="target" tone="emerald" />
      </div>

      {forms.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="form"
            title="No forms yet"
            description="Create a lead capture form and share its public link anywhere."
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {forms.map((form) => {
            let fields: Array<{ label: string; type: string; required?: boolean }> = [];
            try {
              fields = JSON.parse(form.fields);
            } catch {
              fields = [];
            }
            const publicUrl = `${origin}/f/${form.id}`;

            return (
              <div key={form.id} className="card flex flex-col overflow-hidden">
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                  <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                    <Icon name="form" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">{form.name}</h2>
                      <StatusBadge value={form.published ? "published" : "draft"} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{form.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ActionButton
                      action={toggleForm.bind(null, form.id)}
                      label={form.published ? "Unpublish" : "Publish"}
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
                      confirm={`Delete "${form.name}" and its submissions?`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 text-center">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-bold text-slate-900">{number(form._count.submissions)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Submissions</p>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-bold text-slate-900">{number(form.views)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Views</p>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-bold text-slate-900">{fields.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Fields</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 px-5 py-3">
                  <CopyButton value={publicUrl} />
                  <Link
                    href={`/f/${form.id}`}
                    target="_blank"
                    className="btn btn-secondary btn-sm"
                  >
                    <Icon name="globe" className="h-3.5 w-3.5" />
                    Open form
                  </Link>
                  <span className="ml-auto text-[10px] text-slate-400">
                    Updated {formatDate(form.createdAt)}
                  </span>
                </div>

                <details className="group mt-auto border-t border-slate-100">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-xs font-semibold text-slate-600">
                    Latest submissions
                    <Icon
                      name="chevronDown"
                      className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  {form.submissions.length === 0 ? (
                    <p className="px-5 pb-4 text-xs text-slate-400">No submissions yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 border-t border-slate-100">
                      {form.submissions.map((submission) => {
                        let payload: Record<string, string> = {};
                        try {
                          payload = JSON.parse(submission.data);
                        } catch {
                          payload = {};
                        }
                        return (
                          <li key={submission.id} className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              {submission.contact ? (
                                <Link
                                  href={`/contacts/${submission.contactId}`}
                                  className="text-xs font-semibold text-slate-800 hover:text-indigo-600"
                                >
                                  {submission.contact.firstName} {submission.contact.lastName}
                                </Link>
                              ) : (
                                <span className="text-xs font-semibold text-slate-700">Unknown</span>
                              )}
                              <span className="ml-auto text-[10px] text-slate-400">
                                {relativeTime(submission.createdAt)}
                              </span>
                            </div>
                            <p className="truncate text-[11px] text-slate-500">
                              {Object.entries(payload)
                                .slice(0, 3)
                                .map(([key, value]) => `${key}: ${value || "—"}`)
                                .join(" · ")}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </details>
              </div>
            );
          })}
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-3 p-5">
        <Badge tone="violet">
          <Icon name="sparkle" className="h-3 w-3" />
          Pro tip
        </Badge>
        <p className="text-xs text-slate-600">
          Pair a published form with the <strong>New Lead Nurture</strong> workflow and every submission gets
          an instant SMS reply.
        </p>
        <Link href="/automations" className="btn btn-secondary btn-sm ml-auto">
          Open automations
          <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
