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

export async function createTask(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const title = read(formData, "title");
  if (!title) return fail("Describe the task.");

  const dueDate = read(formData, "dueDate");

  await prisma.task.create({
    data: {
      locationId: user.locationId,
      title,
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00`) : null,
      assigneeId: read(formData, "assigneeId") || user.id,
      contactId: read(formData, "contactId") || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return success;
}

export async function toggleTask(taskId: string): Promise<Result> {
  const user = await requireUser();
  const task = await prisma.task.findFirst({ where: { id: taskId, locationId: user.locationId } });
  if (!task) return fail("Task not found.");

  await prisma.task.update({ where: { id: taskId }, data: { completed: !task.completed } });
  revalidatePath("/dashboard");
  return success;
}

export async function deleteTask(taskId: string): Promise<Result> {
  const user = await requireUser();
  const task = await prisma.task.findFirst({ where: { id: taskId, locationId: user.locationId } });
  if (!task) return fail("Task not found.");

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/dashboard");
  return success;
}
