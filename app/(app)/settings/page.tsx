import { ActionForm, Modal } from "@/components/forms";
import { Icon } from "@/components/icons";
import { Avatar, Badge, PageHeader, SectionCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { inviteTeamMember, updateLocation, updateProfile } from "@/app/actions/settings";
import { titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Australia/Sydney",
];

export default async function SettingsPage() {
  const user = await requireUser();
  const location = user.location;

  const team = await prisma.user.findMany({
    where: { locationId: user.locationId },
    orderBy: { createdAt: "asc" },
  });

  const [contactCount, opportunityCount, workflowCount] = await Promise.all([
    prisma.contact.count({ where: { locationId: user.locationId } }),
    prisma.opportunity.count({ where: { pipeline: { locationId: user.locationId } } }),
    prisma.workflow.count({ where: { locationId: user.locationId } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Business details, your profile and the teammates who share this workspace."
        actions={<Badge tone="slate">{titleCase(user.role)}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Business profile" subtitle="Shown on forms, invoices and booking pages" bodyClassName="p-5">
          <ActionForm
            action={updateLocation as never}
            submitLabel="Save changes"
            cancelLabel={null}
            closeOnSuccess={false}
            successMessage="Business profile saved."
            resetOnSuccess={false}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Business name</label>
                <input name="name" defaultValue={location.name} required className="input" />
              </div>
              <div>
                <label className="label">Industry</label>
                <input name="industry" defaultValue={location.industry ?? ""} className="input" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Phone</label>
                <input name="phone" defaultValue={location.phone ?? ""} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" defaultValue={location.email ?? ""} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Website</label>
              <input name="website" defaultValue={location.website ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Street address</label>
              <input name="address" defaultValue={location.address ?? ""} className="input" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">City</label>
                <input name="city" defaultValue={location.city ?? ""} className="input" />
              </div>
              <div>
                <label className="label">State</label>
                <input name="state" defaultValue={location.state ?? ""} className="input" />
              </div>
              <div>
                <label className="label">Country</label>
                <input name="country" defaultValue={location.country} className="input" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Time zone</label>
                <select name="timezone" defaultValue={location.timezone} className="input">
                  {TIMEZONES.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select name="currency" defaultValue={location.currency} className="input">
                  <option value="USD">USD — US Dollar</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                  <option value="GBP">GBP — Pound Sterling</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                </select>
              </div>
            </div>
          </ActionForm>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Workspace snapshot">
            <ul className="space-y-3 text-xs">
              <li className="flex items-center justify-between">
                <span className="text-slate-500">Contacts</span>
                <span className="font-semibold text-slate-900">{contactCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500">Opportunities</span>
                <span className="font-semibold text-slate-900">{opportunityCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500">Workflows</span>
                <span className="font-semibold text-slate-900">{workflowCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500">Teammates</span>
                <span className="font-semibold text-slate-900">{team.length}</span>
              </li>
            </ul>
            <div className="mt-4 rounded-xl bg-indigo-50 px-3 py-2.5 text-[11px] leading-relaxed text-indigo-700 ring-1 ring-inset ring-indigo-100">
              <strong className="font-semibold">Demo workspace.</strong> Signed in as {user.email}. Run{" "}
              <code className="rounded bg-white/70 px-1">npm run db:seed</code> any time to reset the sample
              data.
            </div>
          </SectionCard>

          <SectionCard title="Your profile" subtitle="Personal details for this account">
            <ActionForm
              action={updateProfile as never}
              submitLabel="Update profile"
              cancelLabel={null}
              closeOnSuccess={false}
              successMessage="Profile updated."
              resetOnSuccess={false}
            >
              <div>
                <label className="label">Name</label>
                <input name="name" defaultValue={user.name} required className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" defaultValue={user.email} required className="input" />
              </div>
              <div>
                <label className="label">Job title</label>
                <input name="title" defaultValue={user.title ?? ""} className="input" />
              </div>
            </ActionForm>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Team"
        subtitle="Everyone with access to this workspace"
        action={
          <Modal label="Invite teammate" icon="plus" variant="secondary" size="sm" title="Invite a teammate">
            <ActionForm action={inviteTeamMember as never} submitLabel="Send invite">
              <div>
                <label className="label">Name</label>
                <input name="name" required className="input" placeholder="Alex Morgan" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" required className="input" placeholder="alex@company.com" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Role</label>
                  <select name="role" className="input" defaultValue="user">
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label className="label">Title</label>
                  <input name="title" className="input" placeholder="Dispatcher" />
                </div>
              </div>
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 ring-1 ring-inset ring-slate-200">
                Teammates start with the temporary password <strong>welcome1234</strong> and can sign in
                immediately.
              </p>
            </ActionForm>
          </Modal>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="th">Teammate</th>
                <th className="th">Role</th>
                <th className="th">Email</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.map((member) => (
                <tr key={member.id}>
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={member.name} color={member.color} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {member.name}
                          {member.id === user.id && (
                            <span className="ml-1.5 text-[10px] font-medium text-indigo-600">(you)</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500">{member.title ?? "Team member"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td capitalize">{member.role}</td>
                  <td className="td text-xs text-slate-500">{member.email}</td>
                  <td className="td">
                    <Badge tone="emerald">
                      <Icon name="check" className="h-3 w-3" />
                      Active
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
