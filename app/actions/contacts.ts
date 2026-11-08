"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fullName } from "@/lib/format";

export type Result = { ok: boolean; error?: string };

const success: Result = { ok: true };
const fail = (error: string): Result => ({ ok: false, error });

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createContact(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const firstName = read(formData, "firstName");
  const lastName = read(formData, "lastName");

  if (!firstName && !lastName) return fail("Enter at least a first or last name.");

  const contact = await prisma.contact.create({
    data: {
      locationId: user.locationId,
      firstName: firstName || "Unknown",
      lastName: lastName || "",
      email: read(formData, "email") || null,
      phone: read(formData, "phone") || null,
      company: read(formData, "company") || null,
      source: read(formData, "source") || "Manual",
      status: read(formData, "status") || "lead",
      ownerId: read(formData, "ownerId") || user.id,
    },
  });

  await prisma.activity.create({
    data: {
      locationId: user.locationId,
      contactId: contact.id,
      userId: user.id,
      type: "contact",
      title: "Contact created",
      description: `Added from ${contact.source}`,
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/reporting");
  return success;
}

export async function updateContact(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const id = read(formData, "id");
  if (!id) return fail("Missing contact.");

  const existing = await prisma.contact.findFirst({ where: { id, locationId: user.locationId } });
  if (!existing) return fail("Contact not found.");

  await prisma.contact.update({
    where: { id },
    data: {
      firstName: read(formData, "firstName") || existing.firstName,
      lastName: read(formData, "lastName"),
      email: read(formData, "email") || null,
      phone: read(formData, "phone") || null,
      company: read(formData, "company") || null,
      address: read(formData, "address") || null,
      status: read(formData, "status") || existing.status,
      source: read(formData, "source") || existing.source,
      ownerId: read(formData, "ownerId") || null,
      lastActivityAt: new Date(),
    },
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/dashboard");
  return success;
}

export async function deleteContact(id: string): Promise<Result> {
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({ where: { id, locationId: user.locationId } });
  if (!contact) return fail("Contact not found.");

  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return success;
}

export async function deleteContactAndRedirect(id: string): Promise<Result> {
  const result = await deleteContact(id);
  if (!result.ok) return result;
  redirect("/contacts");
}

export async function addNote(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const contactId = read(formData, "contactId");
  const body = read(formData, "body");
  if (!body) return fail("Write something before saving.");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, locationId: user.locationId },
  });
  if (!contact) return fail("Contact not found.");

  await prisma.note.create({
    data: { contactId, authorId: user.id, body },
  });
  await prisma.contact.update({ where: { id: contactId }, data: { lastActivityAt: new Date() } });
  await prisma.activity.create({
    data: {
      locationId: user.locationId,
      contactId,
      userId: user.id,
      type: "note",
      title: "Note added",
      description: body.slice(0, 120),
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  return success;
}

export async function addTagToContact(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const contactId = read(formData, "contactId");
  const tagId = read(formData, "tagId");
  if (!contactId || !tagId) return fail("Pick a tag first.");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, locationId: user.locationId },
  });
  if (!contact) return fail("Contact not found.");

  await prisma.contactTag.upsert({
    where: { contactId_tagId: { contactId, tagId } },
    update: {},
    create: { contactId, tagId },
  });

  revalidatePath(`/contacts/${contactId}`);
  return success;
}

export async function removeTagFromContact(contactTagId: string, contactId: string): Promise<Result> {
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, locationId: user.locationId },
  });
  if (!contact) return fail("Contact not found.");

  await prisma.contactTag.delete({ where: { id: contactTagId } }).catch(() => null);
  revalidatePath(`/contacts/${contactId}`);
  return success;
}

export async function sendQuickSms(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const contactId = read(formData, "contactId");
  const body = read(formData, "body");
  if (!body) return fail("Write a message first.");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, locationId: user.locationId },
  });
  if (!contact) return fail("Contact not found.");

  let conversation = await prisma.conversation.findFirst({
    where: { contactId, locationId: user.locationId },
    orderBy: { lastMessageAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        locationId: user.locationId,
        contactId,
        userId: user.id,
        channel: "sms",
        status: "open",
      },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      body,
      channel: conversation.channel,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date(), status: "open" },
  });

  await prisma.activity.create({
    data: {
      locationId: user.locationId,
      contactId,
      userId: user.id,
      type: "sms",
      title: "SMS sent",
      description: body.slice(0, 120),
    },
  });

  revalidatePath("/conversations");
  revalidatePath(`/contacts/${contactId}`);
  return success;
}

export async function createContactForPicker() {
  const user = await requireUser();
  const contacts = await prisma.contact.findMany({
    where: { locationId: user.locationId },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });
  return contacts.map((contact) => ({ id: contact.id, name: fullName(contact) }));
}
