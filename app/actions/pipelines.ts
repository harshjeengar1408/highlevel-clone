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

export async function createOpportunity(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const name = read(formData, "name");
  const stageId = read(formData, "stageId");
  const contactId = read(formData, "contactId");

  if (!name) return fail("Give the opportunity a name.");
  if (!stageId) return fail("Choose a stage.");
  if (!contactId) return fail("Choose a contact.");

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: { pipeline: true },
  });
  if (!stage || stage.pipeline.locationId !== user.locationId) return fail("Stage not found.");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, locationId: user.locationId },
  });
  if (!contact) return fail("Contact not found.");

  const value = Number.parseFloat(read(formData, "value") || "0");

  await prisma.opportunity.create({
    data: {
      pipelineId: stage.pipelineId,
      stageId,
      contactId,
      ownerId: read(formData, "ownerId") || user.id,
      name,
      value: Number.isFinite(value) ? value : 0,
      source: contact.source,
      notes: read(formData, "notes") || null,
    },
  });

  await prisma.activity.create({
    data: {
      locationId: user.locationId,
      contactId,
      userId: user.id,
      type: "opportunity",
      title: "Opportunity created",
      description: `${name} added to ${stage.name}`,
    },
  });

  revalidatePath("/pipelines");
  revalidatePath("/dashboard");
  revalidatePath(`/contacts/${contactId}`);
  return success;
}

export async function moveOpportunity(opportunityId: string, stageId: string): Promise<Result> {
  const user = await requireUser();

  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, pipeline: { locationId: user.locationId } },
    include: { stage: true },
  });
  if (!opportunity) return fail("Opportunity not found.");
  if (opportunity.stageId === stageId) return success;

  const stage = await prisma.stage.findFirst({
    where: { id: stageId, pipelineId: opportunity.pipelineId },
  });
  if (!stage) return fail("Stage not found.");

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      stageId,
      status: stage.name.toLowerCase().includes("won") ? "won" : opportunity.status,
      closedAt: stage.name.toLowerCase().includes("won") ? new Date() : opportunity.closedAt,
    },
  });

  await prisma.activity.create({
    data: {
      locationId: user.locationId,
      contactId: opportunity.contactId,
      userId: user.id,
      type: "opportunity",
      title: "Opportunity stage changed",
      description: `${opportunity.name} moved to ${stage.name}`,
    },
  });

  revalidatePath("/pipelines");
  revalidatePath("/dashboard");
  revalidatePath("/reporting");
  return success;
}

export async function setOpportunityStatus(
  opportunityId: string,
  status: "open" | "won" | "lost"
): Promise<Result> {
  const user = await requireUser();
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, pipeline: { locationId: user.locationId } },
  });
  if (!opportunity) return fail("Opportunity not found.");

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { status, closedAt: status === "open" ? null : new Date() },
  });

  revalidatePath("/pipelines");
  revalidatePath("/dashboard");
  revalidatePath("/reporting");
  return success;
}

export async function deleteOpportunity(opportunityId: string): Promise<Result> {
  const user = await requireUser();
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, pipeline: { locationId: user.locationId } },
  });
  if (!opportunity) return fail("Opportunity not found.");

  await prisma.opportunity.delete({ where: { id: opportunityId } });
  revalidatePath("/pipelines");
  revalidatePath("/dashboard");
  return success;
}

export async function createPipeline(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const name = read(formData, "name");
  if (!name) return fail("Name the pipeline.");

  const stages = read(formData, "stages")
    .split(",")
    .map((stage) => stage.trim())
    .filter(Boolean);

  const stageNames = stages.length > 0 ? stages : ["New Lead", "Contacted", "Won"];

  await prisma.pipeline.create({
    data: {
      locationId: user.locationId,
      name,
      description: read(formData, "description") || null,
      stages: {
        create: stageNames.map((stageName, index) => ({
          name: stageName,
          order: index,
          color: ["#0ea5e9", "#6366f1", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"][index % 6],
        })),
      },
    },
  });

  revalidatePath("/pipelines");
  return success;
}
