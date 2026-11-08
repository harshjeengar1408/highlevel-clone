import { ActionForm, Modal, type ActionResult } from "./forms";
import { Icon } from "./icons";
import { createContact } from "@/app/actions/contacts";
import { createOpportunity } from "@/app/actions/pipelines";
import { createAppointment } from "@/app/actions/calendars";
import { createTask } from "@/app/actions/tasks";

type Owner = { id: string; name: string };
type ContactOption = { id: string; name: string };
type PipelineOption = { id: string; name: string; stages: Array<{ id: string; name: string }> };

export function NewContactModal({
  owners,
  label = "New contact",
  variant = "primary",
  className,
}: {
  owners: Owner[];
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Modal
      label={label}
      icon="plus"
      variant={variant}
      className={className}
      title="Add a new contact"
      description="Contacts can be leads, opportunities or active customers."
    >
      <ActionForm action={createContact as (fd: FormData) => Promise<ActionResult>} submitLabel="Create contact">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">First name</label>
            <input name="firstName" required className="input" placeholder="Marcus" />
          </div>
          <div>
            <label className="label">Last name</label>
            <input name="lastName" required className="input" placeholder="Whitfield" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" placeholder="marcus@example.com" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" className="input" placeholder="+1 (512) 555-0110" />
          </div>
        </div>
        <div>
          <label className="label">Company</label>
          <input name="company" className="input" placeholder="Whitfield Residence" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Status</label>
            <select name="status" className="input" defaultValue="lead">
              <option value="lead">Lead</option>
              <option value="opportunity">Opportunity</option>
              <option value="customer">Customer</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div>
            <label className="label">Source</label>
            <select name="source" className="input" defaultValue="Manual">
              <option>Manual</option>
              <option>Google Ads</option>
              <option>Facebook Ads</option>
              <option>Instagram</option>
              <option>Website Form</option>
              <option>Referral</option>
              <option>Yelp</option>
              <option>Organic Search</option>
              <option>Direct Mail</option>
            </select>
          </div>
          <div>
            <label className="label">Owner</label>
            <select name="ownerId" className="input" defaultValue={owners[0]?.id}>
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
  );
}

export function NewOpportunityModal({
  pipelines,
  contacts,
  owners,
  defaultContactId,
  defaultStageId,
  label = "New opportunity",
  variant = "primary",
}: {
  pipelines: PipelineOption[];
  contacts: ContactOption[];
  owners: Owner[];
  defaultContactId?: string;
  defaultStageId?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Modal
      label={label}
      icon="plus"
      variant={variant}
      title="Create an opportunity"
      description="Opportunities track deal value as it moves through a pipeline."
    >
      <ActionForm action={createOpportunity as (fd: FormData) => Promise<ActionResult>} submitLabel="Create opportunity">
        <div>
          <label className="label">Opportunity name</label>
          <input name="name" required className="input" placeholder="AC replacement — 3 ton unit" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Value (USD)</label>
            <input name="value" type="number" min="0" step="50" className="input" placeholder="4800" />
          </div>
          <div>
            <label className="label">Stage</label>
            <select name="stageId" className="input" defaultValue={defaultStageId}>
              {pipelines.map((pipeline) => (
                <optgroup key={pipeline.id} label={pipeline.name}>
                  {pipeline.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Contact</label>
            <select name="contactId" className="input" defaultValue={defaultContactId} required>
              <option value="">Select a contact…</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Owner</label>
            <select name="ownerId" className="input" defaultValue={owners[0]?.id}>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" rows={2} className="input" placeholder="What did they ask for?" />
        </div>
      </ActionForm>
    </Modal>
  );
}

export function NewAppointmentModal({
  calendars,
  contacts,
  users,
  defaultContactId,
  defaultDate,
  label = "New appointment",
  variant = "primary",
}: {
  calendars: Array<{ id: string; name: string }>;
  contacts: ContactOption[];
  users: Owner[];
  defaultContactId?: string;
  defaultDate?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Modal
      label={label}
      icon="plus"
      variant={variant}
      title="Book an appointment"
      description="Appointments appear on the calendar and can trigger reminder workflows."
    >
      <ActionForm action={createAppointment as (fd: FormData) => Promise<ActionResult>} submitLabel="Book appointment">
        <div>
          <label className="label">Title</label>
          <input name="title" required className="input" placeholder="AC diagnostic — no cooling" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Contact</label>
            <select name="contactId" required className="input" defaultValue={defaultContactId}>
              <option value="">Select a contact…</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Calendar</label>
            <select name="calendarId" className="input" defaultValue={calendars[0]?.id}>
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Date</label>
            <input name="date" type="date" required className="input" defaultValue={defaultDate} />
          </div>
          <div>
            <label className="label">Start</label>
            <input name="time" type="time" required className="input" defaultValue="09:00" />
          </div>
          <div>
            <label className="label">Duration</label>
            <select name="duration" className="input" defaultValue="60">
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Assigned to</label>
          <select name="userId" className="input" defaultValue={users[0]?.id}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" rows={2} className="input" placeholder="Gate code, parking, equipment details…" />
        </div>
      </ActionForm>
    </Modal>
  );
}

export function NewTaskModal({ users }: { users: Owner[] }) {
  return (
    <Modal label="Add task" icon="plus" variant="secondary" size="sm" title="Create a task">
      <ActionForm action={createTask as (fd: FormData) => Promise<ActionResult>} submitLabel="Add task">
        <div>
          <label className="label">Task</label>
          <input name="title" required className="input" placeholder="Call back the Rodriguez family" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Due date</label>
            <input name="dueDate" type="date" className="input" />
          </div>
          <div>
            <label className="label">Assign to</label>
            <select name="assigneeId" className="input" defaultValue={users[0]?.id}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ActionForm>
    </Modal>
  );
}

export function InlineHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500 ring-1 ring-inset ring-slate-200">
      <Icon name="sparkle" className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400" />
      <span>{children}</span>
    </p>
  );
}
