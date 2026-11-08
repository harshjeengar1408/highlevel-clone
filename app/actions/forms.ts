"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type Result = { ok: boolean; error?: string };

const success: Result = { ok: true };
const fail = (error: string): Result => ({ ok: false, error });

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const TYPE_MAP: Record<string, string> = {
  text: "text",
  email: "email",
  tel: "tel",
  phone: "tel",
  number: "number",
  textarea: "textarea",
  date: "date",
};

export async function createForm(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const name = read(formData, "name");
  if (!name) return fail("Name your form.");

  const rawFields = read(formData, "fields");
  const fields = rawFields
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, typePart] = line.split("|").map((part) => part?.trim());
      return {
        label: labelPart || "Field",
        type: TYPE_MAP[(typePart ?? "text").toLowerCase()] ?? "text",
        required: false,
      };
    });

  await prisma.form.create({
    data: {
      locationId: user.locationId,
      name,
      description: read(formData, "description") || null,
      fields: JSON.stringify(
        fields.length > 0
          ? fields
          : [
              { label: "Full name", type: "text", required: true },
              { label: "Email", type: "email", required: false },
              { label: "Phone", type: "tel", required: false },
            ]
      ),
      published: false,
    },
  });

  revalidatePath("/forms");
  return success;
}

export async function toggleForm(formId: string): Promise<Result> {
  const user = await requireUser();
  const form = await prisma.form.findFirst({ where: { id: formId, locationId: user.locationId } });
  if (!form) return fail("Form not found.");

  await prisma.form.update({ where: { id: formId }, data: { published: !form.published } });
  revalidatePath("/forms");
  return success;
}

export async function deleteForm(formId: string): Promise<Result> {
  const user = await requireUser();
  const form = await prisma.form.findFirst({ where: { id: formId, locationId: user.locationId } });
  if (!form) return fail("Form not found.");

  await prisma.form.delete({ where: { id: formId } });
  revalidatePath("/forms");
  return success;
}

export async function submitPublicForm(formData: FormData): Promise<Result> {
  const formId = read(formData, "formId");
  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form) return fail("This form no longer exists.");
  if (!form.published) return fail("This form isn't accepting responses right now.");

  let fields: Array<{ label: string; type: string; required?: boolean }> = [];
  try {
    fields = JSON.parse(form.fields);
  } catch {
    fields = [];
  }

  const payload: Record<string, string> = {};
  for (const field of fields) {
    payload[field.label] = read(formData, field.label);
  }

  const emailEntry = Object.entries(payload).find(([label]) => /email/i.test(label));
  const nameEntry = Object.entries(payload).find(([label]) => /name/i.test(label));
  const phoneEntry = Object.entries(payload).find(([label]) => /phone|tel/i.test(label));

  const email = emailEntry?.[1] || null;
  const phone = phoneEntry?.[1] || null;
  const nameParts = (nameEntry?.[1] || "New Lead").split(" ");
  const firstName = nameParts[0] || "New";
  const lastName = nameParts.slice(1).join(" ");

  let contact = email
    ? await prisma.contact.findFirst({ where: { locationId: form.locationId, email } })
    : phone
      ? await prisma.contact.findFirst({ where: { locationId: form.locationId, phone } })
      : null;

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        locationId: form.locationId,
        firstName,
        lastName,
        email,
        phone,
        source: form.name,
        status: "lead",
        lastActivityAt: new Date(),
      },
    });
  }

  await prisma.formSubmission.create({
    data: { formId: form.id, contactId: contact.id, data: JSON.stringify(payload) },
  });

  await prisma.activity.create({
    data: {
      locationId: form.locationId,
      contactId: contact.id,
      type: "form",
      title: "Form submitted",
      description: form.name,
    },
  });

  revalidatePath(`/f/${form.id}`);
  revalidatePath("/forms");
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  redirect(`/f/${form.id}?submitted=1`);
}
