import Link from "next/link";
import { ActionButton, ActionForm } from "@/components/forms";
import { Icon } from "@/components/icons";
import { Avatar, Badge, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  markConversationRead,
  sendMessage,
  setConversationStatus,
} from "@/app/actions/conversations";
import {
  channelLabel,
  cn,
  colorFromString,
  formatDate,
  formatTime,
  fullName,
  relativeTime,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const CHANNELS = [
  { key: "", label: "All" },
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
  { key: "facebook", label: "Facebook" },
  { key: "webchat", label: "Web chat" },
];

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; q?: string; channel?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const channel = params.channel ?? "";

  const conversations = await prisma.conversation.findMany({
    where: {
      locationId: user.locationId,
      ...(channel ? { channel } : {}),
      ...(q
        ? {
            contact: {
              OR: [
                { firstName: { contains: q } },
                { lastName: { contains: q } },
                { email: { contains: q } },
                { phone: { contains: q } },
              ],
            },
          }
        : {}),
    },
    include: {
      contact: true,
      user: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const selected = conversations.find((conversation) => conversation.id === params.c) ?? conversations[0];

  const messages = selected
    ? await prisma.message.findMany({
        where: { conversationId: selected.id },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const unreadTotal = conversations.reduce((sum, conversation) => sum + conversation.unread, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Conversations"
        subtitle="One shared inbox for SMS, email and social messages — with the full contact record one click away."
        actions={
          <Badge tone={unreadTotal > 0 ? "indigo" : "slate"}>
            <Icon name="chat" className="h-3 w-3" />
            {unreadTotal} unread
          </Badge>
        }
      />

      <div className="card overflow-hidden">
        <div className="grid lg:grid-cols-[330px_1fr]">
          <div className="border-b border-slate-100 lg:h-[calc(100vh-13rem)] lg:border-b-0 lg:border-r">
            <div className="space-y-2.5 border-b border-slate-100 p-3">
              <form action="/conversations" className="relative">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search conversations…"
                  className="input pl-9"
                />
                {channel && <input type="hidden" name="channel" value={channel} />}
              </form>
              <div className="thin-scroll flex gap-1 overflow-x-auto">
                {CHANNELS.map((item) => (
                  <Link
                    key={item.key}
                    href={`/conversations${item.key ? `?channel=${item.key}` : ""}`}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      channel === item.key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <ul className="thin-scroll divide-y divide-slate-100 overflow-y-auto lg:h-[calc(100%-6.5rem)]">
              {conversations.length === 0 && (
                <li className="p-6">
                  <EmptyState icon="chat" title="No conversations" description="Nothing matches this filter yet." />
                </li>
              )}
              {conversations.map((conversation) => {
                const active = selected?.id === conversation.id;
                const last = conversation.messages[0];

                return (
                  <li key={conversation.id}>
                    <Link
                      href={`/conversations?c=${conversation.id}${channel ? `&channel=${channel}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                      className={cn(
                        "flex gap-2.5 px-3.5 py-3 transition-colors",
                        active ? "bg-indigo-50/80" : "hover:bg-slate-50"
                      )}
                    >
                      <Avatar
                        name={fullName(conversation.contact)}
                        color={colorFromString(conversation.contactId)}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-slate-900">
                            {fullName(conversation.contact)}
                          </p>
                          <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                            {relativeTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-500">
                          {last?.direction === "outbound" && (
                            <span className="text-slate-400">You: </span>
                          )}
                          {last?.body ?? "No messages yet"}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-inset ring-slate-200">
                            {channelLabel(conversation.channel)}
                          </span>
                          {conversation.unread > 0 && (
                            <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold leading-4 text-white">
                              {conversation.unread}
                            </span>
                          )}
                          <span className="ml-auto text-[9px] capitalize text-slate-400">
                            {conversation.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected ? (
            <div className="flex min-h-[520px] flex-col lg:h-[calc(100vh-13rem)]">
              <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
                <Avatar
                  name={fullName(selected.contact)}
                  color={colorFromString(selected.contactId)}
                  size="md"
                />
                <div className="min-w-0">
                  <Link
                    href={`/contacts/${selected.contactId}`}
                    className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                  >
                    {fullName(selected.contact)}
                  </Link>
                  <p className="truncate text-[11px] text-slate-500">
                    {selected.contact.phone ?? selected.contact.email ?? "No contact details"}
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-1.5">
                  <Badge tone="slate">{channelLabel(selected.channel)}</Badge>
                  <StatusBadge value={selected.status} />
                  {selected.unread > 0 && (
                    <ActionButton
                      action={markConversationRead.bind(null, selected.id)}
                      label="Mark read"
                      icon="check"
                      variant="secondary"
                      className="btn-sm"
                    />
                  )}
                  {selected.status === "closed" ? (
                    <ActionButton
                      action={setConversationStatus.bind(null, selected.id, "open")}
                      label="Reopen"
                      variant="secondary"
                      className="btn-sm"
                    />
                  ) : (
                    <ActionButton
                      action={setConversationStatus.bind(null, selected.id, "closed")}
                      label="Close"
                      variant="secondary"
                      className="btn-sm"
                    />
                  )}
                </div>
              </header>

              <div className="thin-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
                {selected.subject && (
                  <p className="rounded-lg bg-white px-3 py-2 text-[11px] text-slate-500 ring-1 ring-inset ring-slate-200">
                    <span className="font-semibold text-slate-700">Subject:</span> {selected.subject}
                  </p>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.direction === "outbound" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                        message.direction === "outbound"
                          ? "rounded-br-md bg-indigo-600 text-white"
                          : "rounded-bl-md bg-white text-slate-700 ring-1 ring-inset ring-slate-200"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          message.direction === "outbound" ? "text-indigo-200" : "text-slate-400"
                        )}
                      >
                        {formatDate(message.createdAt)} · {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="py-8 text-center text-xs text-slate-400">
                    No messages in this thread yet.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 p-3">
                <ActionForm
                  action={sendMessage as never}
                  submitLabel="Send reply"
                  submitVariant="primary"
                  cancelLabel={null}
                  className="space-y-2"
                  footerClassName="justify-between pt-0"
                >
                  <input type="hidden" name="conversationId" value={selected.id} />
                  <textarea
                    name="body"
                    rows={2}
                    required
                    className="input resize-none"
                    placeholder={`Reply to ${selected.contact.firstName} on ${channelLabel(selected.channel)}…`}
                  />
                </ActionForm>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <EmptyState
                icon="chat"
                title="Select a conversation"
                description="Pick a thread on the left to read and reply."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
