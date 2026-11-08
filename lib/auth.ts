import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSessionUserId } from "./session";

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: { location: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
