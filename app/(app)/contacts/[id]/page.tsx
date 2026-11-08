import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, ActionForm, Modal } from "@/components/forms";
import { NewAppointmentModal, NewOpportunityModal } from "@/components/app-modals";
import { Icon } from "@/components/icons";
import { Avatar, Badge, EmptyState, LinkTabs, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  addNote,
  addTagToContact,
  deleteContactAndRedirect,
  removeTagFromContact,
  sendQuickSms,
  updateContact,
} from "@/app/actions/contacts";
import {
  channelLabel,
  colorFromString,
  formatDate,
  formatTime,
  fullName,
  money,
  relativeTime,
  titleCase,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = ["activity", "notes", "opportunities", "conversations", "appointments"] as const;
type Tab = (typeof TABS)[number];

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "activity";

  const contact = await prisma.contact.findFirst({
    where: { id, locationId: user.locationId },
    include: {
      owner: true,
      tags: { include: { tag: true } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      opportunities: { include: { stage: true, pipeline: true }, orderBy: { updatedAt: "desc" } },
      conversations: {
        include: { messages: { orderBy: { createdAt: "desc" }, take: 3 } },
        orderBy: { lastMessageAt: "desc" },
      },
      appointments: { include: { calendar: true }, orderBy: { start: "desc" }, take: 8 },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 25 },
    },
  });

  if (!contact) notFound();

  const [owners, tags, calendars, pipelines, contactOptions] = await Promise.all([
    prisma.user.findMany({
      where: { locationId: user.locationId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tag.findMany({ where: { locationId: user.locationId }, orderBy: { name: "asc" } }),
    prisma.calendar.findMany({ where: { locationId: user.locationId }, orderBy: { name: "asc" } }),
    prisma.pipeline.findMany({
      where: { locationId: user.locationId },
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contact.findMany({
      where: { locationId: user.locationId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
      take: 100,
    }),
  ]);

  const openValue = contact.opportunities
    .filter((opportunity) => opportunity.status === "open")
    .reduce((sum, opportunity) => sum + opportunity.value, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/contacts" className="inline-flex items-center gap-1 hover:text-indigo-600">
          <Icon name="arrowLeft" className="h-3.5 w-3.5" />
          Contacts
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{fullName(contact)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            <div className="px-5 pb-5">
              <div className="-mt-7 flex items-end justify-between">
                <Avatar
                  name={fullName(contact)}
                  color={colorFromString(contact.id)}
                  size="xl"
                  className="ring-4 ring-white"
                />
                <div className="flex gap-1">
                  <Modal
                    label="Edit"
                    icon="settings"
                    variant="secondary"
                    size="md"
                    title="Edit contact"
                    description="Keep the record tidy for your whole team."
                    className="btn-sm"
                  >
                    <ActionForm action={updateContact as never} submitLabel="Save changes">
                      <input type="hidden" name="id" value={contact.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="label">First name</label>
                          <input name="firstName" defaultValue={contact.firstName} className="input" required />
                        </div>
                        <div>
                          <label className="label">Last name</label>
                          <input name="lastName" defaultValue={contact.lastName} className="input" />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="label">Email</label>
                          <input name="email" type="email" defaultValue={contact.email ?? ""} className="input" />
                        </div>
                        <div>
                          <label className="label">Phone</label>
                          <input name="phone" defaultValue={contact.phone ?? ""} className="input" />
                        </div>
                      </div>
                      <div>
                        <label className="label">Company</label>
                        <input name="company" defaultValue={contact.company ?? ""} className="input" />
                      </div>
                      <div>
                        <label className="label">Address</label>
                        <input name="address" defaultValue={contact.address ?? ""} className="input" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="label">Status</label>
                          <select name="status" defaultValue={contact.status} className="input">
                            <option value="lead">Lead</option>
                            <option value="opportunity">Opportunity</option>
                            <option value="customer">Customer</option>
                            <option value="churned">Churned</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Source</label>
                          <input name="source" defaultValue={contact.source} className="input" />
                        </div>
                        <div>
                          <label className="label">Owner</label>
                          <select name="ownerId" defaultValue={contact.ownerId ?? ""} className="input">
                            <option value="">Unassigned</option>
                            {owners.map((owner) => (
                              <option key={owner.id} value={owner.id}>
                                {owner.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </ActionForm>
                  </Modal>
                  <ActionButton
                    action={deleteContactAndRedirect.bind(null, contact.id)}
                    icon="trash"
                    label=""
                    title="Delete contact"
                    variant="danger"
                    confirm={`Delete ${fullName(contact)}? This removes their notes, opportunities and conversations.`}
                    compact
                  />
                </div>
              </div>

              <div className="mt-3">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">{fullName(contact)}</h1>
                <p className="text-xs text-slate-500">
                  {contact.company ?? "No company"} · Added {formatDate(contact.createdAt)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge value={contact.status} />
                  <Badge tone="slate">{titleCase(contact.source)}</Badge>
                  {openValue > 0 && <Badge tone="indigo">{money(openValue)} open</Badge>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <NewOpportunityModal
                  pipelines={pipelines.map((pipeline) => ({
                    id: pipeline.id,
                    name: pipeline.name,
                    stages: pipeline.stages.map((stage) => ({ id: stage.id, name: stage.name })),
                  }))}
                  contacts={contactOptions.map((option) => ({
                    id: option.id,
                    name: fullName(option),
                  }))}
                  owners={owners}
                  defaultContactId={contact.id}
                  label="Add deal"
                  variant="primary"
                />
                <NewAppointmentModal
                  calendars={calendars}
                  users={owners}
                  contacts={contactOptions.map((option) => ({ id: option.id, name: fullName(option) }))}
                  defaultContactId={contact.id}
                  label="Book"
                  variant="secondary"
                />
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <Icon name="mail" className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                  <dd className="min-w-0 break-all text-slate-700">{contact.email ?? "—"}</dd>
                </div>
                <div className="flex items-start gap-2.5">
                  <Icon name="phone" className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                  <dd className="text-slate-700">{contact.phone ?? "—"}</dd>
                </div>
                <div className="flex items-start gap-2.5">
                  <Icon name="building" className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                  <dd className="text-slate-700">{contact.address ?? "No address"}</dd>
                </div>
                <div className="flex items-start gap-2.5">
                  <Icon name="users" className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                  <dd className="text-slate-700">
                    {contact.owner ? `Owned by ${contact.owner.name}` : "Unassigned"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map((contactTag) => (
                    <span
                      key={contactTag.id}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-2 pr-1 text-[11px] font-medium text-slate-700"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: contactTag.tag.color }}
                      />
                      {contactTag.tag.name}
                      <ActionButton
                        action={removeTagFromContact.bind(null, contactTag.id, contact.id)}
                        label="×"
                        title="Remove tag"
                        className="rounded-full px-1 text-slate-400 hover:bg-white hover:text-rose-600"
                        compact
                      />
                    </span>
                  ))}
                  {contact.tags.length === 0 && <span className="text-xs text-slate-400">No tags yet</span>}
                </div>

                <ActionForm
                  action={addTagToContact as never}
                  submitLabel="Add tag"
                  cancelLabel={null}
                  className="mt-2.5 flex gap-1.5 space-y-0"
                  footerClassName="pt-0"
                >
                  <input type="hidden" name="contactId" value={contact.id} />
                  <select name="tagId" className="input flex-1 py-1.5 text-xs" defaultValue="">
                    <option value="">Choose tag…</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </ActionForm>
              </div>
            </div>
          </div>

          <SectionCard title="Quick send" subtitle="Logs to the shared conversation inbox">
            <ActionForm
              action={sendQuickSms as never}
              submitLabel="Send SMS"
              cancelLabel={null}
              resetOnSuccess
              submitVariant="primary"
            >
              <input type="hidden" name="contactId" value={contact.id} />
              <textarea
                name="body"
                rows={3}
                className="input"
                placeholder={`Hi ${contact.firstName}, just following up on…`}
                required
              />
            </ActionForm>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Open pipeline", value: money(openValue), icon: "funnel" as const },
              {
                label: "Conversations",
                value: String(contact.conversations.length),
                icon: "chat" as const,
              },
              {
                label: "Appointments",
                value: String(contact.appointments.length),
                icon: "calendar" as const,
              },
            ].map((stat) => (
              <div key={stat.label} className="card flex items-center gap-3 p-4">
                <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                  <Icon name={stat.icon} className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] text-slate-500">{stat.label}</p>
                  <p className="text-sm font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-4">
            <LinkTabs
              active={tab}
              tabs={[
                { key: "activity", label: "Activity", href: `/contacts/${contact.id}?tab=activity`, count: contact.activities.length },
                { key: "notes", label: "Notes", href: `/contacts/${contact.id}?tab=notes`, count: contact.notes.length },
                {
                  key: "opportunities",
                  label: "Opportunities",
                  href: `/contacts/${contact.id}?tab=opportunities`,
                  count: contact.opportunities.length,
                },
                {
                  key: "conversations",
                  label: "Conversations",
                  href: `/contacts/${contact.id}?tab=conversations`,
                  count: contact.conversations.length,
                },
                {
                  key: "appointments",
                  label: "Appointments",
                  href: `/contacts/${contact.id}?tab=appointments`,
                  count: contact.appointments.length,
                },
              ]}
            />
          </div>

          {tab === "activity" && (
            <SectionCard title="Activity timeline" subtitle="Every touchpoint with this contact">
              {contact.activities.length === 0 ? (
                <EmptyState icon="clock" title="No activity yet" />
              ) : (
                <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-200">
                  {contact.activities.map((item) => (
                    <li key={item.id} className="relative flex gap-3">
                      <span className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white ring-1 ring-slate-200">
                        <Icon
                          name={
                            item.type === "sms"
                              ? "chat"
                              : item.type === "email"
                                ? "mail"
                                : item.type === "appointment"
                                  ? "calendar"
                                  : item.type === "opportunity"
                                    ? "funnel"
                                    : item.type === "call"
                                      ? "phone"
                                      : item.type === "form"
                                        ? "form"
                                        : "note"
                          }
                          className="h-3.5 w-3.5 text-slate-500"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                          <span className="ml-auto text-[10px] text-slate-400">
                            {relativeTime(item.createdAt)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-[11px] text-slate-500">{item.description}</p>
                        )}
                        {item.user && (
                          <p className="mt-0.5 text-[10px] text-slate-400">by {item.user.name}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>
          )}

          {tab === "notes" && (
            <SectionCard title="Notes" subtitle="Internal notes are never sent to the contact">
              <ActionForm
                action={addNote as never}
                submitLabel="Save note"
                cancelLabel={null}
                className="mb-5"
              >
                <input type="hidden" name="contactId" value={contact.id} />
                <textarea
                  name="body"
                  rows={3}
                  className="input"
                  placeholder="What should the team know before the next call?"
                  required
                />
              </ActionForm>

              {contact.notes.length === 0 ? (
                <EmptyState icon="note" title="No notes yet" description="Add context for your teammates." />
              ) : (
                <ul className="space-y-3">
                  {contact.notes.map((note) => (
                    <li key={note.id} className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-200">
                      <p className="prose-note">{note.body}</p>
                      <p className="mt-2 text-[10px] text-slate-400">
                        {note.author?.name ?? "System"} · {formatDate(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          {tab === "opportunities" && (
            <SectionCard
              title="Opportunities"
              subtitle="Deals linked to this contact"
              bodyClassName="p-0"
            >
              {contact.opportunities.length === 0 ? (
                <EmptyState
                  icon="funnel"
                  title="No opportunities yet"
                  description="Create a deal to start tracking value in the pipeline."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {contact.opportunities.map((opportunity) => (
                    <li key={opportunity.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{opportunity.name}</p>
                        <p className="text-xs text-slate-500">
                          {opportunity.pipeline.name} · {opportunity.stage.name}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{money(opportunity.value)}</span>
                      <StatusBadge value={opportunity.status} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          {tab === "conversations" && (
            <SectionCard title="Conversations" subtitle="SMS, email and social threads" bodyClassName="p-0">
              {contact.conversations.length === 0 ? (
                <EmptyState icon="chat" title="No conversations yet" description="Send an SMS above to start one." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {contact.conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <Link
                        href={`/conversations?c=${conversation.id}`}
                        className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                      >
                        <span className="mt-0.5 rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                          <Icon
                            name={conversation.channel === "email" ? "mail" : "chat"}
                            className="h-3.5 w-3.5"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-800">
                              {channelLabel(conversation.channel)}
                            </p>
                            <StatusBadge value={conversation.status} />
                            <span className="ml-auto text-[10px] text-slate-400">
                              {relativeTime(conversation.lastMessageAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {conversation.messages[0]?.body ?? "No messages yet"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          {tab === "appointments" && (
            <SectionCard title="Appointments" subtitle="Past and upcoming bookings" bodyClassName="p-0">
              {contact.appointments.length === 0 ? (
                <EmptyState icon="calendar" title="No appointments yet" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {contact.appointments.map((appointment) => (
                    <li key={appointment.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div
                        className="rounded-lg border-l-[3px] bg-slate-50 px-2 py-1 text-center"
                        style={{ borderColor: appointment.calendar.color }}
                      >
                        <p className="text-[10px] font-semibold uppercase text-slate-500">
                          {new Intl.DateTimeFormat("en-US", { month: "short" }).format(appointment.start)}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(appointment.start)}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{appointment.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatTime(appointment.start)} – {formatTime(appointment.end)} ·{" "}
                          {appointment.calendar.name}
                        </p>
                      </div>
                      <StatusBadge value={appointment.status} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
