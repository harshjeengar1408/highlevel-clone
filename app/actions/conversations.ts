"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type Result = { ok: boolean; error?: string };

const success: Result = { ok: true };
const fail = (error: string): Result => ({ ok: false, error });

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendMessage(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const conversationId = read(formData, "conversationId");
  const body = read(formData, "body");
  if (!body) return fail("Write a message first.");

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, locationId: user.locationId },
  });
  if (!conversation) return fail("Conversation not found.");

  await prisma.message.create({
    data: {
      conversationId,
      direction: "outbound",
      body,
      channel: conversation.channel,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date(), status: "open", unread: 0 },
  });

  await prisma.activity.create({
    data: {
      locationId: user.locationId,
      contactId: conversation.contactId,
      userId: user.id,
      type: conversation.channel === "email" ? "email" : "sms",
      title: conversation.channel === "email" ? "Email sent" : "SMS sent",
      description: body.slice(0, 120),
    },
  });

  revalidatePath("/conversations");
  revalidatePath(`/contacts/${conversation.contactId}`);
  return success;
}

export async function markConversationRead(conversationId: string): Promise<Result> {
  const user = await requireUser();
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, locationId: user.locationId },
  });
  if (!conversation) return fail("Conversation not found.");

  await prisma.conversation.update({ where: { id: conversationId }, data: { unread: 0 } });
  await prisma.message.updateMany({
    where: { conversationId, direction: "inbound" },
    data: { read: true },
  });

  revalidatePath("/conversations");
  return success;
}

export async function setConversationStatus(
  conversationId: string,
  status: "open" | "pending" | "closed"
): Promise<Result> {
  const user = await requireUser();
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, locationId: user.locationId },
  });
  if (!conversation) return fail("Conversation not found.");

  await prisma.conversation.update({ where: { id: conversationId }, data: { status } });
  revalidatePath("/conversations");
  return success;
}

export async function startConversation(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const contactId = read(formData, "contactId");
  const channel = read(formData, "channel") || "sms";
  const body = read(formData, "body");
  if (!contactId) return fail("Choose a contact.");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, locationId: user.locationId },
  });
  if (!contact) return fail("Contact not found.");

  const conversation = await prisma.conversation.create({
    data: {
      locationId: user.locationId,
      contactId,
      userId: user.id,
      channel,
      status: "open",
      subject: read(formData, "subject") || null,
    },
  });

  if (body) {
    await prisma.message.create({
      data: { conversationId: conversation.id, direction: "outbound", body, channel },
    });
  }

  revalidatePath("/conversations");
  return success;
}
