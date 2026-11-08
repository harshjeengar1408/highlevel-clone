import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/forms";
import { Icon } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { submitPublicForm } from "@/app/actions/forms";

export const dynamic = "force-dynamic";

type FormField = { label: string; type: string; required?: boolean };

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { id } = await params;
  const { submitted } = await searchParams;

  const form = await prisma.form.findUnique({
    where: { id },
    include: { location: true },
  });

  if (!form) notFound();

  let fields: FormField[] = [];
  try {
    fields = JSON.parse(form.fields);
  } catch {
    fields = [];
  }

  const brand = form.location.accent;
  const success = submitted === "1";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
          <span
            className="grid h-8 w-8 place-items-center rounded-xl text-xs font-black text-white"
            style={{ backgroundColor: brand }}
          >
            {form.location.name.slice(0, 2).toUpperCase()}
          </span>
          {form.location.name}
        </div>

        <div className="card overflow-hidden">
          <div
            className="px-6 py-6 text-white"
            style={{ background: `linear-gradient(135deg, ${brand}, #8b5cf6)` }}
          >
            <h1 className="text-xl font-bold tracking-tight">{form.name}</h1>
            <p className="mt-1 text-sm text-white/80">{form.description}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="phone" className="h-3 w-3" />
                {form.location.phone ?? "Call us"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="globe" className="h-3 w-3" />
                {form.location.website ?? form.location.name}
              </span>
            </div>
          </div>

          <div className="p-6">
            {!form.published ? (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
                This form isn&apos;t accepting responses yet. Publish it from Forms &amp; Funnels to go live.
              </div>
            ) : success ? (
              <div className="py-6 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon name="check" className="h-6 w-6" />
                </span>
                <h2 className="mt-3 text-lg font-bold text-slate-900">You&apos;re all set!</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Thanks for reaching out — our team will follow up shortly. A contact record and activity
                  entry were created automatically.
                </p>
                <Link href={`/f/${form.id}`} className="btn btn-secondary mt-4 inline-flex">
                  Submit another response
                </Link>
              </div>
            ) : (
              <ActionForm
                action={submitPublicForm as never}
                submitLabel="Submit response"
                cancelLabel={null}
                submitVariant="primary"
                className="space-y-4"
                resetOnSuccess={false}
              >
                <input type="hidden" name="formId" value={form.id} />
                {fields.map((field) => (
                  <div key={field.label}>
                    <label className="label" htmlFor={field.label}>
                      {field.label}
                      {field.required && <span className="text-rose-500"> *</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={field.label}
                        name={field.label}
                        rows={3}
                        required={field.required}
                        className="input"
                      />
                    ) : (
                      <input
                        id={field.label}
                        name={field.label}
                        type={field.type || "text"}
                        required={field.required}
                        className="input"
                      />
                    )}
                  </div>
                ))}
                <p className="text-[11px] text-slate-400">
                  By submitting you agree to be contacted about your request. We never share your details.
                </p>
              </ActionForm>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Powered by HighLevel — CRM, funnels and automation.
        </p>
      </div>
    </div>
  );
}
