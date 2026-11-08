import { notFound } from "next/navigation";
import { PublicFormRenderer } from "@/components/forms";
import { Icon } from "@/components/icons";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const form = await prisma.form.findUnique({
    where: { id },
    include: { fields: { orderBy: { order: "asc" } }, location: true },
  });

  if (!form) notFound();

  const fields = form.fields.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder,
    options: field.options ? (JSON.parse(field.options) as string[]) : [],
    required: field.required,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-2.5 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
            <Icon name="logo" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">{form.location.name}</p>
            <p className="text-[11px] text-white/60">{form.location.city}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {form.headline ?? form.name}
            </h1>
            {form.description && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{form.description}</p>
            )}
          </div>

          <div className="px-6 py-5">
            {query.submitted ? (
              <div className="py-8 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon name="checkCircle" className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-base font-semibold text-slate-900">You're all set!</h2>
                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                  Thanks for reaching out — a member of the team will contact you shortly.
                </p>
              </div>
            ) : (
              <PublicFormRenderer formId={form.id} fields={fields} /></n>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-white/40">
          {form.location.name} · {form.location.phone}
        </p>
      </div>
    </div>
  );
}
