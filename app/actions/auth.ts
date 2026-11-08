"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { AVATAR_PALETTE } from "@/lib/format";

export type AuthState = { error?: string };

function str(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));

  if (!email || !password) {
    return { error: "Enter your email and password to continue." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "We couldn't find an account with that email." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "That password doesn't match our records." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const businessName = str(formData.get("businessName"));

  if (!name || !email || !password || !businessName) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Use at least 8 characters for your password." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account already exists with that email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const location = await prisma.location.create({
    data: {
      name: businessName,
      industry: "Home Services",
      country: "United States",
      timezone: "America/New_York",
      currency: "USD",
      accent: "#6366f1",
    },
  });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "owner",
      title: "Owner",
      color: AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)],
      locationId: location.id,
    },
  });

  // Give brand new workspaces a usable starting pipeline and calendar.
  await prisma.pipeline.create({
    data: {
      locationId: location.id,
      name: "Sales Pipeline",
      description: "Your first pipeline — drag deals between stages as they progress.",
      stages: {
        create: [
          { name: "New Lead", order: 0, color: "#0ea5e9" },
          { name: "Contacted", order: 1, color: "#6366f1" },
          { name: "Proposal Sent", order: 2, color: "#f59e0b" },
          { name: "Won", order: 3, color: "#10b981" },
        ],
      },
    },
  });

  await prisma.calendar.create({
    data: { locationId: location.id, name: "Default Calendar", color: "#6366f1" },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}
