import Link from "next/link";
import { NewContactModal } from "@/components/app-modals";
import { Icon } from "@/components/icons";
import { Avatar, Badge, EmptyState, LinkTabs, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { colorFromString, fullName, number, relativeTime, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = params.status ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    locationId: user.locationId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { company: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, contacts, owners, statusCounts] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      include: { owner: true, tags: { include: { tag: true } } },
      orderBy: { lastActivityAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.findMany({
      where: { locationId: user.locationId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contact.groupBy({
      by: ["status"],
      where: { locationId: user.locationId },
      _count: { _all: true },
    }),
  ]);

  const totalContacts = statusCounts.reduce((sum, item) => sum + item._count._all, 0);
  const countFor = (value: string) =>
    statusCounts.find((item) => item.status === value)?._count._all ?? 0;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (status) search.set("status", status);
    if (nextPage > 1) search.set("page", String(nextPage));
    const query = search.toString();
    return query ? `/contacts?${query}` : "/contacts";
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contacts"
        subtitle={`${number(totalContacts)} people in ${user.location.name}. Search, segment and open any record to see the full history.`}
        actions={<NewContactModal owners={owners} />}
      />

      <div className="card p-4">
        <form action="/contacts" className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, email, phone or company…"
              className="input pl-9"
            />
          </div>
          <select name="status" defaultValue={status} className="input sm:w-48">
            <option value="">All statuses</option>
            <option value="lead">Lead</option>
            <option value="opportunity">Opportunity</option>
            <option value="customer">Customer</option>
            <option value="churned">Churned</option>
          </select>
          <button type="submit" className="btn btn-primary">
            <Icon name="filter" className="h-4 w-4" />
            Apply filters
          </button>
        </form>

        <div className="mt-4">
          <LinkTabs
            active={status || "all"}
            tabs={[
              { key: "all", label: "All", href: q ? `/contacts?q=${encodeURIComponent(q)}` : "/contacts", count: totalContacts },
              { key: "lead", label: "Leads", href: "/contacts?status=lead", count: countFor("lead") },
              {
                key: "opportunity",
                label: "Opportunities",
                href: "/contacts?status=opportunity",
                count: countFor("opportunity"),
              },
              {
                key: "customer",
                label: "Customers",
                href: "/contacts?status=customer",
                count: countFor("customer"),
              },
              { key: "churned", label: "Churned", href: "/contacts?status=churned", count: countFor("churned") },
            ]}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {contacts.length === 0 ? (
          <EmptyState
            icon="users"
            title="No contacts match those filters"
            description="Try a different search term, or add a brand new contact to get started."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className="th">Contact</th>
                  <th className="th">Status</th>
                  <th className="th">Tags</th>
                  <th className="th">Source</th>
                  <th className="th">Owner</th>
                  <th className="th">Last activity</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="group transition-colors hover:bg-slate-50/70">
                    <td className="td">
                      <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
                        <Avatar
                          name={fullName(contact)}
                          color={colorFromString(contact.id)}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 group-hover:text-indigo-600">
                            {fullName(contact)}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {contact.company ?? contact.email ?? contact.phone ?? "—"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="td">
                      <StatusBadge value={contact.status} />
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} tone="slate">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: tag.tag.color }}
                            />
                            {tag.tag.name}
                          </Badge>
                        ))}
                        {contact.tags.length > 2 && (
                          <Badge tone="slate">+{contact.tags.length - 2}</Badge>
                        )}
                        {contact.tags.length === 0 && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="td">
                      <span className="text-xs text-slate-500">{titleCase(contact.source)}</span>
                    </td>
                    <td className="td">
                      {contact.owner ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={contact.owner.name} color={contact.owner.color} size="xs" />
                          <span className="text-xs text-slate-600">
                            {contact.owner.name.split(" ")[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="td">
                      <span className="text-xs text-slate-500">{relativeTime(contact.lastActivityAt)}</span>
                    </td>
                    <td className="td text-right">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="inline-flex rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-indigo-600"
                        aria-label={`Open ${fullName(contact)}`}
                      >
                        <Icon name="chevronRight" className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {number(total)}
            </span>
            <div className="flex items-center gap-1.5">
              {page > 1 && (
                <Link href={buildHref(page - 1)} className="btn btn-secondary btn-sm">
                  <Icon name="arrowLeft" className="h-3.5 w-3.5" />
                  Previous
                </Link>
              )}
              <span className="px-2 font-semibold text-slate-700">
                {page} / {pageCount}
              </span>
              {page < pageCount && (
                <Link href={buildHref(page + 1)} className="btn btn-secondary btn-sm">
                  Next
                  <Icon name="arrowRight" className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
