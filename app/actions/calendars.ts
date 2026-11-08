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

export async function createAppointment(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const title = read(formData, "title");
  const contactId = read(formData, "contactId");
  const calendarId = read(formData, "calendarId");
  const date = read(formData, "date");
  const time = read(formData, "time");
  const duration = Number.parseInt(read(formData, "duration") || "60", 10);

  if (!title) return fail("Add a title for the appointment.");
  if (!contactId) return fail("Choose a contact.");
  if (!calendarId) return fail("Choose a calendar.");
  if (!date || !time) return fail("Pick a date and start time.");

  const start = new Date(`${date}T${time}:00`);
  if (Number.isNaN(start.getTime())) return fail("That date or time doesn't look right.");
  const end = new Date(start.getTime() + (Number.isFinite(duration) ? duration : 60) * 60_000);

  const [calendar, contact] = await Promise.all([
    prisma.calendar.findFirst({ where: { id: calendarId, locationId: user.locationId } }),
    prisma.contact.findFirst({ where: { id: contactId, locationId: user.locationId } }),
  ]);
  if (!calendar) return fail("Calendar not found.");
  if (!contact) return fail("Contact not found.");

  await prisma.appointment.create({
    data: {
      calendarId,
      contactId,
      userId: read(formData, "userId") || user.id,
      title,
      start,
      end,
      notes: read(formData, "notes") || null,
      status: "confirmed",
    },
  });

  await prisma.activity.create({
    data: {
      locationId: user.locationId,
      contactId,
      userId: user.id,
      type: "appointment",
      title: "Appointment booked",
      description: `${title} on ${calendar.name}`,
    },
  });

  revalidatePath("/calendars");
  revalidatePath("/dashboard");
  revalidatePath(`/contacts/${contactId}`);
  return success;
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: "confirmed" | "pending" | "cancelled" | "showed" | "noshow"
): Promise<Result> {
  const user = await requireUser();
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, calendar: { locationId: user.locationId } },
  });
  if (!appointment) return fail("Appointment not found.");

  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
  revalidatePath("/calendars");
  revalidatePath("/dashboard");
  return success;
}

export async function deleteAppointment(appointmentId: string): Promise<Result> {
  const user = await requireUser();
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, calendar: { locationId: user.locationId } },
  });
  if (!appointment) return fail("Appointment not found.");

  await prisma.appointment.delete({ where: { id: appointmentId } });
  revalidatePath("/calendars");
  return success;
}
