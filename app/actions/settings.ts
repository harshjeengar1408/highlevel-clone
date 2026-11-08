"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AVATAR_PALETTE } from "@/lib/format";

export type Result = { ok: boolean; error?: string };

const success: Result = { ok: true };
const fail = (error: string): Result => ({ ok: false, error });

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateLocation(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const name = read(formData, "name");
  if (!name) return fail("Business name is required.");

  await prisma.location.update({
    where: { id: user.locationId },
    data: {
      name,
      industry: read(formData, "industry") || null,
      phone: read(formData, "phone") || null,
      email: read(formData, "email") || null,
      website: read(formData, "website") || null,
      address: read(formData, "address") || null,
      city: read(formData, "city") || null,
      state: read(formData, "state") || null,
      country: read(formData, "country") || "United States",
      timezone: read(formData, "timezone") || "America/New_York",
      currency: read(formData, "currency") || "USD",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return success;
}

export async function updateProfile(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const name = read(formData, "name");
  const email = read(formData, "email").toLowerCase();
  if (!name) return fail("Your name is required.");
  if (!email) return fail("Your email is required.");

  const clash = await prisma.user.findFirst({ where: { email, NOT: { id: user.id } } });
  if (clash) return fail("Another teammate already uses that email.");

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email, title: read(formData, "title") || null },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return success;
}

export async function inviteTeamMember(formData: FormData): Promise<Result> {
  const user = await requireUser();
  if (user.role !== "owner" && user.role !== "admin") {
    return fail("Only owners and admins can invite teammates.");
  }

  const name = read(formData, "name");
  const email = read(formData, "email").toLowerCase();
  if (!name || !email) return fail("Name and email are required.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("That email is already part of this workspace.");

  const passwordHash = await bcrypt.hash("welcome1234", 10);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: read(formData, "role") || "user",
      title: read(formData, "title") || null,
      color: AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)],
      locationId: user.locationId,
    },
  });

  revalidatePath("/settings");
  return success;
}
