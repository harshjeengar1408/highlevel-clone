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

export async function createWorkflow(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const name = read(formData, "name");
  const trigger = read(formData, "trigger");
  if (!name) return fail("Name your workflow.");
  if (!trigger) return fail("Choose a trigger.");

  const firstAction = read(formData, "firstAction");
  const firstDetail = read(formData, "firstDetail");

  await prisma.workflow.create({
    data: {
      locationId: user.locationId,
      name,
      description: read(formData, "description") || null,
      trigger,
      status: "draft",
      steps: {
        create: [
          { order: 0, kind: "trigger", title: trigger },
          ...(firstAction
            ? [{ order: 1, kind: "action", title: firstAction, detail: firstDetail || null }]
            : []),
        ],
      },
    },
  });

  revalidatePath("/automations");
  revalidatePath("/dashboard");
  return success;
}

export async function toggleWorkflow(workflowId: string): Promise<Result> {
  const user = await requireUser();
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, locationId: user.locationId },
  });
  if (!workflow) return fail("Workflow not found.");

  const next = workflow.status === "published" ? "paused" : "published";
  await prisma.workflow.update({ where: { id: workflowId }, data: { status: next } });

  revalidatePath("/automations");
  return success;
}

export async function deleteWorkflow(workflowId: string): Promise<Result> {
  const user = await requireUser();
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, locationId: user.locationId },
  });
  if (!workflow) return fail("Workflow not found.");

  await prisma.workflow.delete({ where: { id: workflowId } });
  revalidatePath("/automations");
  return success;
}

export async function addWorkflowStep(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const workflowId = read(formData, "workflowId");
  const title = read(formData, "title");
  if (!workflowId) return fail("Missing workflow.");
  if (!title) return fail("Describe the step.");

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, locationId: user.locationId },
    include: { steps: true },
  });
  if (!workflow) return fail("Workflow not found.");

  const nextOrder = workflow.steps.reduce((max, step) => Math.max(max, step.order), 0) + 1;

  await prisma.workflowStep.create({
    data: {
      workflowId,
      order: nextOrder,
      kind: read(formData, "kind") || "action",
      title,
      detail: read(formData, "detail") || null,
    },
  });

  revalidatePath("/automations");
  return success;
}

export async function removeWorkflowStep(stepId: string, workflowId: string): Promise<Result> {
  const user = await requireUser();
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, locationId: user.locationId },
  });
  if (!workflow) return fail("Workflow not found.");

  await prisma.workflowStep.delete({ where: { id: stepId } }).catch(() => null);
  revalidatePath("/automations");
  return success;
}
