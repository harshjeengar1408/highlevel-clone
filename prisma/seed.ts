import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 86_400_000;
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY);
const daysAhead = (days: number) => new Date(now.getTime() + days * DAY);

function at(date: Date, hours: number, minutes = 0) {
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function monthStart(offset: number) {
  const date = new Date(now.getFullYear(), now.getMonth() - offset, 5, 12, 0, 0);
  return date;
}

const TEAM = [
  {
    name: "Jordan Blake",
    email: "demo@gohighlevel.dev",
    role: "owner",
    title: "Agency Owner",
    color: "#6366f1",
  },
  {
    name: "Mia Chen",
    email: "mia@coastalair.com",
    role: "admin",
    title: "Operations Manager",
    color: "#8b5cf6",
  },
  {
    name: "Theo Alvarez",
    email: "theo@coastalair.com",
    role: "user",
    title: "Senior Technician",
    color: "#0ea5e9",
  },
  {
    name: "Priya Nair",
    email: "priya@coastalair.com",
    role: "user",
    title: "Inside Sales",
    color: "#10b981",
  },
];

const TAGS = [
  { name: "VIP", color: "#8b5cf6" },
  { name: "Hot Lead", color: "#ef4444" },
  { name: "Follow Up", color: "#f59e0b" },
  { name: "New Customer", color: "#10b981" },
  { name: "Past Customer", color: "#0ea5e9" },
  { name: "Commercial", color: "#6366f1" },
  { name: "Referral", color: "#ec4899" },
  { name: "Maintenance Plan", color: "#14b8a6" },
];

type SeedContact = [string, string, string | null, string, string];

const CONTACTS: SeedContact[] = [
  ["Marcus", "Whitfield", "Whitfield Residence", "Google Ads", "customer"],
  ["Danielle", "Ortiz", "Ortiz Family Home", "Facebook Ads", "customer"],
  ["Aaron", "Kimball", "Kimball Holdings", "Referral", "opportunity"],
  ["Renee", "Calloway", "Calloway Bistro", "Website Form", "customer"],
  ["Tobias", "Mercer", null, "Yelp", "lead"],
  ["Sofia", "Lindqvist", "Nordic Design Co.", "Organic Search", "opportunity"],
  ["Jamal", "Rivers", "Rivers Property Group", "Direct Mail", "customer"],
  ["Hannah", "Bishop", null, "Facebook Ads", "lead"],
  ["Elias", "Fontaine", "Fontaine Motors", "Google Ads", "opportunity"],
  ["Priya", "Raman", null, "Website Form", "lead"],
  ["Grant", "Holloway", "Holloway Dental", "Referral", "opportunity"],
  ["Nadia", "Petrov", null, "Instagram", "lead"],
  ["Curtis", "Lam", "Lam Noodle House", "Yelp", "customer"],
  ["Bianca", "Moreau", null, "Website Form", "lead"],
  ["Desmond", "Okafor", "Okafor Logistics", "LinkedIn", "opportunity"],
  ["Elaine", "Voss", null, "Facebook Ads", "lead"],
  ["Rafael", "Sandoval", "Sandoval Ranch", "Google Ads", "customer"],
  ["Kelsey", "Duarte", null, "Referral", "lead"],
  ["Miles", "Ashford", "Ashford & Co.", "Direct Mail", "churned"],
  ["Ivy", "Tremblay", null, "Website Form", "opportunity"],
  ["Damon", "Reeves", "Reeves Barbecue", "Google Ads", "customer"],
  ["Lucia", "Barone", null, "Instagram", "lead"],
  ["Owen", "Fitzgerald", "Fitzgerald Law", "Referral", "opportunity"],
  ["Simone", "Aubert", null, "Facebook Ads", "lead"],
  ["Victor", "Ibarra", "Ibarra Construction", "Google Ads", "opportunity"],
  ["Harper", "Quinn", null, "Website Form", "lead"],
  ["Felix", "Navarro", "Navarro Salon", "Yelp", "customer"],
  ["Amara", "Osei", null, "Referral", "lead"],
  ["Beckett", "Shaw", "Shaw Fitness Studio", "Instagram", "opportunity"],
  ["Talia", "Berger", null, "Direct Mail", "lead"],
  ["Rowan", "Delgado", "Delgado Coffee", "Google Ads", "customer"],
  ["Maya", "Sato", null, "Website Form", "lead"],
  ["Nathaniel", "Cross", "Cross Family Trust", "Referral", "opportunity"],
  ["Camille", "Dupree", null, "Facebook Ads", "lead"],
  ["Xavier", "Boateng", "Boateng Grocers", "Google Ads", "customer"],
  ["Lena", "Hoffman", null, "Organic Search", "lead"],
  ["Paxton", "Vance", "Vance Auto Repair", "Yelp", "opportunity"],
  ["Adriana", "Silva", null, "Instagram", "lead"],
  ["Jasper", "Mbeki", "Mbeki Studios", "Referral", "opportunity"],
  ["Willa", "Fontenot", null, "Website Form", "churned"],
  ["Sergio", "Castillo", "Castillo Bakery", "Google Ads", "customer"],
  ["Maren", "Olsen", null, "Facebook Ads", "lead"],
];

const SERVICE_OFFERS = [
  "AC replacement — 3 ton unit",
  "Furnace tune-up",
  "Ductless mini-split install",
  "Commercial rooftop unit",
  "Annual maintenance plan",
  "Thermostat upgrade",
  "Duct cleaning package",
  "Water heater replacement",
  "Emergency AC repair",
  "Whole-home air purification",
  "Heat pump conversion",
  "Spring AC tune-up",
];

const COMPANIES = [
  "Whitfield Residence",
  "Ortiz Family Home",
  "Kimball Holdings",
  "Calloway Bistro",
  "Nordic Design Co.",
];

async function main() {
  console.log("Clearing existing data…");
  await prisma.location.deleteMany({});

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const location = await prisma.location.create({
    data: {
      name: "Coastal Air & Heat",
      industry: "Home Services",
      phone: "+1 (512) 555-0100",
      email: "hello@coastalair.com",
      website: "coastalair.com",
      address: "1420 Seabreeze Boulevard",
      city: "Austin",
      state: "TX",
      country: "United States",
      timezone: "America/New_York",
      currency: "USD",
      accent: "#6366f1",
    },
  });

  const users = [];
  for (const member of TEAM) {
    users.push(
      await prisma.user.create({
        data: { ...member, passwordHash, locationId: location.id },
      })
    );
  }

  const tags = [];
  for (const tag of TAGS) {
    tags.push(
      await prisma.tag.create({
        data: { ...tag, locationId: location.id },
      })
    );
  }

  console.log("Creating contacts…");
  const contacts = [];
  for (let i = 0; i < CONTACTS.length; i += 1) {
    const [firstName, lastName, company, source, status] = CONTACTS[i];
    const domain = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com"][i % 4];
    const contact = await prisma.contact.create({
      data: {
        locationId: location.id,
        firstName,
        lastName,
        company,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
        phone: `+1 (512) 555-${String(1100 + i * 7).slice(0, 4)}`,
        address: company ? `${120 + i} Maple Street, Austin, TX` : null,
        source,
        status,
        ownerId: users[i % users.length].id,
        createdAt: daysAgo(3 + i * 3),
        lastActivityAt: daysAgo(i % 14),
      },
    });

    const tagCount = i % 3 === 0 ? 2 : 1;
    for (let t = 0; t < tagCount; t += 1) {
      const tag = tags[(i + t * 3) % tags.length];
      await prisma.contactTag.upsert({
        where: { contactId_tagId: { contactId: contact.id, tagId: tag.id } },
        update: {},
        create: { contactId: contact.id, tagId: tag.id },
      });
    }

    contacts.push(contact);
  }

  console.log("Creating pipelines and opportunities…");
  const salesPipeline = await prisma.pipeline.create({
    data: {
      locationId: location.id,
      name: "Sales Pipeline",
      description: "Inbound estimate requests, from first touch to signed agreement.",
      stages: {
        create: [
          { name: "New Lead", order: 0, color: "#0ea5e9" },
          { name: "Contacted", order: 1, color: "#6366f1" },
          { name: "Estimate Sent", order: 2, color: "#f59e0b" },
          { name: "Won", order: 3, color: "#10b981" },
        ],
      },
    },
    include: { stages: { orderBy: { order: "asc" } } },
  });

  const installPipeline = await prisma.pipeline.create({
    data: {
      locationId: location.id,
      name: "Installation Pipeline",
      description: "Sold jobs moving through scheduling and installation.",
      stages: {
        create: [
          { name: "Scheduled", order: 0, color: "#6366f1" },
          { name: "In Progress", order: 1, color: "#f59e0b" },
          { name: "Final Inspection", order: 2, color: "#0ea5e9" },
          { name: "Complete", order: 3, color: "#10b981" },
        ],
      },
    },
    include: { stages: { orderBy: { order: "asc" } } },
  });

  const salesStages = salesPipeline.stages;
  const installStages = installPipeline.stages;

  for (let i = 0; i < 14; i += 1) {
    const contact = contacts[(i * 3) % contacts.length];
    await prisma.opportunity.create({
      data: {
        pipelineId: salesPipeline.id,
        stageId: salesStages[i % 3].id,
        contactId: contact.id,
        ownerId: users[i % users.length].id,
        name: SERVICE_OFFERS[i % SERVICE_OFFERS.length],
        value: 2400 + i * 1150,
        status: "open",
        source: contact.source,
        createdAt: daysAgo(2 + i * 4),
        updatedAt: daysAgo(i % 6),
      },
    });
  }

  for (let i = 0; i < 6; i += 1) {
    const contact = contacts[(i * 5 + 1) % contacts.length];
    await prisma.opportunity.create({
      data: {
        pipelineId: installPipeline.id,
        stageId: installStages[i % 4].id,
        contactId: contact.id,
        ownerId: users[(i + 1) % users.length].id,
        name: `Installation — ${SERVICE_OFFERS[(i + 3) % SERVICE_OFFERS.length]}`,
        value: 5200 + i * 2300,
        status: "open",
        source: contact.source,
        createdAt: daysAgo(1 + i * 2),
      },
    });
  }

  for (let i = 0; i < 16; i += 1) {
    const contact = contacts[(i * 7) % contacts.length];
    const closedAt = monthStart(i % 8);
    await prisma.opportunity.create({
      data: {
        pipelineId: salesPipeline.id,
        stageId: salesStages[3].id,
        contactId: contact.id,
        ownerId: users[i % users.length].id,
        name: SERVICE_OFFERS[(i * 2) % SERVICE_OFFERS.length],
        value: 3800 + i * 940,
        status: "won",
        source: contact.source,
        createdAt: new Date(closedAt.getTime() - 9 * DAY),
        updatedAt: closedAt,
        closedAt,
      },
    });
  }

  for (let i = 0; i < 4; i += 1) {
    const contact = contacts[(i * 11 + 4) % contacts.length];
    await prisma.opportunity.create({
      data: {
        pipelineId: salesPipeline.id,
        stageId: salesStages[2].id,
        contactId: contact.id,
        ownerId: users[(i + 2) % users.length].id,
        name: SERVICE_OFFERS[(i + 5) % SERVICE_OFFERS.length],
        value: 2900 + i * 1700,
        status: "lost",
        source: contact.source,
        createdAt: daysAgo(30 + i * 9),
        closedAt: daysAgo(6 + i * 4),
      },
    });
  }

  console.log("Creating conversations…");
  const scripts: Array<{
    contactIndex: number;
    channel: string;
    status: string;
    unread: number;
    subject?: string;
    messages: Array<[string, string, number]>;
  }> = [
    {
      contactIndex: 0,
      channel: "sms",
      status: "open",
      unread: 2,
      messages: [
        ["inbound", "Hi! Our AC stopped cooling last night. Can someone come out this week?", 3],
        ["outbound", "Hey Marcus, sorry to hear that. We have a 2pm slot today or 9am tomorrow — which works?", 2.8],
        ["inbound", "Today at 2 works if you can get someone here before the heat hits.", 2.5],
        ["inbound", "Also, is the diagnostic fee waived if we repair?", 2.4],
      ],
    },
    {
      contactIndex: 3,
      channel: "email",
      status: "open",
      unread: 1,
      subject: "Rooftop unit quote for Calloway Bistro",
      messages: [
        ["outbound", "Hi Renee — attaching the rooftop unit proposal we discussed. Let me know if you'd like to walk through financing.", 26],
        ["inbound", "Thanks! The owner wants to know if we can phase the install over two weekends.", 4],
      ],
    },
    {
      contactIndex: 2,
      channel: "sms",
      status: "open",
      unread: 0,
      messages: [
        ["inbound", "We're ready to move forward with the mini-split install.", 30],
        ["outbound", "That's great news, Aaron! I'll send over the agreement and get you on the install calendar.", 29.5],
        ["inbound", "Perfect, thank you.", 29],
      ],
    },
    {
      contactIndex: 8,
      channel: "facebook",
      status: "open",
      unread: 3,
      messages: [
        ["inbound", "Saw your ad for the $99 tune-up. Do you service commercial shops?", 6],
        ["outbound", "We do! We cover everything from small retail to 20-ton rooftop units. What size is your space?", 5.6],
        ["inbound", "About 4,000 sq ft, two units.", 5.2],
        ["inbound", "Can you send pricing?", 5.1],
        ["inbound", "Also do you finance?", 5],
      ],
    },
    {
      contactIndex: 6,
      channel: "sms",
      status: "pending",
      unread: 1,
      messages: [
        ["outbound", "Hi Jamal, our tech will arrive between 10 and 12 tomorrow. Reply CONFIRM to lock it in.", 20],
        ["inbound", "CONFIRM", 19],
        ["outbound", "Thanks — see you tomorrow!", 18.6],
        ["inbound", "Can you also look at the upstairs unit while you're here?", 1.2],
      ],
    },
    {
      contactIndex: 14,
      channel: "email",
      status: "open",
      unread: 0,
      subject: "Warehouse ventilation walkthrough",
      messages: [
        ["inbound", "Following up on our call. We need ventilation quotes for a 12,000 sq ft warehouse.", 9],
        ["outbound", "Happy to help, Desmond. I have Thursday 3pm open for a walkthrough — should I book it?", 8.5],
        ["inbound", "Thursday works, please book it.", 8],
      ],
    },
    {
      contactIndex: 26,
      channel: "sms",
      status: "closed",
      unread: 0,
      messages: [
        ["inbound", "Payment sent for the maintenance plan.", 12],
        ["outbound", "Received and activated. You're covered through next spring!", 11.8],
        ["inbound", "Appreciate the quick turnaround.", 11.5],
      ],
    },
    {
      contactIndex: 11,
      channel: "webchat",
      status: "open",
      unread: 0,
      messages: [
        ["inbound", "Quick question — do you offer emergency weekend service?", 0.4],
        ["outbound", "Yes, weekend emergency service is available with a $79 dispatch fee. Want me to book a slot?", 0.3],
      ],
    },
    {
      contactIndex: 20,
      channel: "sms",
      status: "open",
      unread: 1,
      messages: [
        ["outbound", "Hi Damon, this is Priya at Coastal Air & Heat. Your spring tune-up is due — want me to schedule it?", 2],
        ["inbound", "Yes, same time as last year if possible.", 1.5],
      ],
    },
  ];

  for (const script of scripts) {
    const contact = contacts[script.contactIndex];
    const conversation = await prisma.conversation.create({
      data: {
        locationId: location.id,
        contactId: contact.id,
        userId: users[script.contactIndex % users.length].id,
        channel: script.channel,
        subject: script.subject,
        status: script.status,
        unread: script.unread,
        lastMessageAt: daysAgo(script.messages[script.messages.length - 1][2]),
        createdAt: daysAgo(script.messages[0][2] + 1),
      },
    });

    for (const [direction, body, offset] of script.messages) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction,
          body,
          channel: script.channel,
          read: direction === "outbound" || offset > 1,
          createdAt: daysAgo(offset),
        },
      });
    }
  }

  console.log("Creating calendars and appointments…");
  const installCalendar = await prisma.calendar.create({
    data: {
      locationId: location.id,
      name: "Installation Calendar",
      color: "#6366f1",
      description: "Multi-day installs and site visits.",
    },
  });
  const serviceCalendar = await prisma.calendar.create({
    data: {
      locationId: location.id,
      name: "Service Calls",
      color: "#10b981",
      description: "Diagnostics, repairs and tune-ups.",
    },
  });
  const consultCalendar = await prisma.calendar.create({
    data: {
      locationId: location.id,
      name: "Consultations",
      color: "#f59e0b",
      description: "30 minute in-home estimate visits.",
    },
  });

  const appointmentSeed: Array<[number, number, number, string, string, string, number]> = [
    [0, 8, 10, "AC diagnostic — no cooling", "service", "confirmed", 1],
    [1, 10, 12, "Rooftop unit site visit", "consult", "confirmed", 4],
    [2, 13, 15, "Mini-split install day 1", "install", "confirmed", 6],
    [3, 9, 10, "Spring tune-up", "service", "pending", 5],
    [4, 15, 16, "Maintenance plan walkthrough", "consult", "confirmed", 3],
    [5, 11, 13, "Duct cleaning package", "service", "confirmed", 8],
    [6, 8, 9, "Furnace inspection", "service", "cancelled", 10],
    [7, 14, 16, "Water heater replacement", "install", "confirmed", 12],
    [8, 9, 11, "Warehouse ventilation consult", "consult", "pending", 15],
    [9, 12, 14, "Thermostat upgrade", "install", "confirmed", 18],
    [10, 8, 9, "Emergency AC repair", "service", "confirmed", 21],
    [11, 16, 17, "Maintenance plan renewal visit", "service", "confirmed", 24],
    [12, 10, 12, "Whole-home purification install", "install", "pending", 27],
    [13, 13, 14, "Seasonal check-in", "consult", "confirmed", 30],
  ];

  for (const [dayOffset, startHour, endHour, title, calendarKey, status, contactIndex] of appointmentSeed) {
    const base = daysAhead(dayOffset);
    const calendar =
      calendarKey === "install" ? installCalendar : calendarKey === "service" ? serviceCalendar : consultCalendar;
    await prisma.appointment.create({
      data: {
        calendarId: calendar.id,
        contactId: contacts[contactIndex % contacts.length].id,
        userId: users[contactIndex % users.length].id,
        title,
        start: at(base, startHour),
        end: at(base, endHour),
        status,
      },
    });
  }

  console.log("Creating workflows…");
  await prisma.workflow.create({
    data: {
      locationId: location.id,
      name: "New Lead Nurture",
      description: "Instant SMS + follow up emails for every new estimate request.",
      trigger: "Form submitted — Free Estimate Request",
      status: "published",
      enrolled: 428,
      completed: 311,
      createdAt: daysAgo(120),
      steps: {
        create: [
          { order: 0, kind: "trigger", title: "Form submitted", detail: "Free Estimate Request" },
          { order: 1, kind: "action", title: "Send SMS", detail: "Hi {{contact.first_name}}, thanks for reaching out to Coastal Air & Heat! When is a good time for a quick call?" },
          { order: 2, kind: "wait", title: "Wait 1 day" },
          { order: 3, kind: "action", title: "Send email", detail: "Subject: Your free estimate is on the way" },
          { order: 4, kind: "wait", title: "Wait 3 days" },
          { order: 5, kind: "condition", title: "If no reply", detail: "Branch when the contact has not responded" },
          { order: 6, kind: "action", title: "Create task", detail: "Assign follow-up call to Priya Nair" },
        ],
      },
    },
  });

  await prisma.workflow.create({
    data: {
      locationId: location.id,
      name: "Appointment Reminder",
      description: "Two-touch reminder that cut no-shows by 38%.",
      trigger: "Appointment booked",
      status: "published",
      enrolled: 1032,
      completed: 964,
      createdAt: daysAgo(98),
      steps: {
        create: [
          { order: 0, kind: "trigger", title: "Appointment booked" },
          { order: 1, kind: "action", title: "Send SMS", detail: "Reminder: your appointment with Coastal Air & Heat is tomorrow. Reply C to confirm." },
          { order: 2, kind: "wait", title: "Wait 23 hours" },
          { order: 3, kind: "action", title: "Send SMS", detail: "Our tech is on the way — see you soon!" },
        ],
      },
    },
  });

  await prisma.workflow.create({
    data: {
      locationId: location.id,
      name: "Review Request",
      description: "Ask happy customers for a Google review two days after the job.",
      trigger: "Job completed",
      status: "published",
      enrolled: 276,
      completed: 205,
      createdAt: daysAgo(64),
      steps: {
        create: [
          { order: 0, kind: "trigger", title: "Job completed" },
          { order: 1, kind: "wait", title: "Wait 2 days" },
          { order: 2, kind: "action", title: "Send SMS", detail: "Thanks for choosing us! Would you leave a quick review? {{review_link}}" },
          { order: 3, kind: "condition", title: "If rating is 5 stars", detail: "Send a thank-you coupon" },
        ],
      },
    },
  });

  await prisma.workflow.create({
    data: {
      locationId: location.id,
      name: "Missed Call Text Back",
      description: "Recover missed calls automatically within 30 seconds.",
      trigger: "Inbound call missed",
      status: "paused",
      enrolled: 189,
      completed: 141,
      createdAt: daysAgo(41),
      steps: {
        create: [
          { order: 0, kind: "trigger", title: "Inbound call missed" },
          { order: 1, kind: "action", title: "Send SMS", detail: "Sorry we missed you! Reply here and we'll call right back." },
          { order: 2, kind: "wait", title: "Wait 2 hours" },
          { order: 3, kind: "action", title: "Send SMS", detail: "Still want to book? Grab a time here: {{booking_link}}" },
        ],
      },
    },
  });

  await prisma.workflow.create({
    data: {
      locationId: location.id,
      name: "Winter Re-engagement",
      description: "Win back customers who haven't booked in 12 months.",
      trigger: "Tag added — Past Customer",
      status: "draft",
      enrolled: 0,
      completed: 0,
      createdAt: daysAgo(9),
      steps: {
        create: [
          { order: 0, kind: "trigger", title: "Tag added", detail: "Past Customer" },
          { order: 1, kind: "action", title: "Send email", detail: "Subject: We miss you — here's $50 off your next tune-up" },
          { order: 2, kind: "wait", title: "Wait 5 days" },
          { order: 3, kind: "action", title: "Create task", detail: "Call the contact if still unbooked" },
        ],
      },
    },
  });

  console.log("Creating forms…");
  const forms = [
    {
      name: "Free Estimate Request",
      description: "Main hero form on the landing page — 3 fields, instant SMS follow up.",
      fields: [
        { label: "Full name", type: "text", required: true },
        { label: "Phone", type: "tel", required: true },
        { label: "What do you need help with?", type: "textarea", required: false },
      ],
      published: true,
      views: 2841,
    },
    {
      name: "AC Tune-Up Special",
      description: "$99 seasonal tune-up booking form used in paid social.",
      fields: [
        { label: "Full name", type: "text", required: true },
        { label: "Email", type: "email", required: true },
        { label: "Preferred day", type: "text", required: false },
      ],
      published: true,
      views: 5102,
    },
    {
      name: "Commercial Walkthrough",
      description: "Qualifying form for commercial HVAC walkthroughs.",
      fields: [
        { label: "Company", type: "text", required: true },
        { label: "Contact name", type: "text", required: true },
        { label: "Square footage", type: "text", required: false },
        { label: "Number of units", type: "text", required: false },
      ],
      published: true,
      views: 943,
    },
    {
      name: "Careers Application",
      description: "Tech hiring form — not yet published.",
      fields: [
        { label: "Full name", type: "text", required: true },
        { label: "Years of experience", type: "text", required: true },
        { label: "EPA certification", type: "text", required: false },
      ],
      published: false,
      views: 118,
    },
  ];

  for (let i = 0; i < forms.length; i += 1) {
    const form = await prisma.form.create({
      data: {
        locationId: location.id,
        name: forms[i].name,
        description: forms[i].description,
        fields: JSON.stringify(forms[i].fields),
        published: forms[i].published,
        views: forms[i].views,
        createdAt: daysAgo(70 - i * 12),
      },
    });

    const submissionCount = [7, 5, 4, 2][i];
    for (let s = 0; s < submissionCount; s += 1) {
      const contact = contacts[(i * 9 + s * 3) % contacts.length];
      await prisma.formSubmission.create({
        data: {
          formId: form.id,
          contactId: contact.id,
          data: JSON.stringify({
            "Full name": `${contact.firstName} ${contact.lastName}`,
            Phone: contact.phone,
            Email: contact.email,
            "What do you need help with?": SERVICE_OFFERS[(i + s) % SERVICE_OFFERS.length],
          }),
          createdAt: daysAgo(s * 4 + i),
        },
      });
    }
  }

  console.log("Creating tasks, notes and activity…");
  const taskSeed: Array<[string, number, boolean, number]> = [
    ["Call Marcus Whitfield about the 2pm diagnostic", 0, false, 0],
    ["Send rooftop unit proposal to Calloway Bistro", 1, false, 3],
    ["Follow up on the warehouse walkthrough with Desmond", 2, false, 14],
    ["Confirm install crew for Tuesday mini-split job", 0, true, 2],
    ["Invoice Jamal Rivers for maintenance plan", 3, false, 6],
    ["Review missed call text back performance", 4, false, 1],
    ["Order replacement thermostat inventory", 6, false, 5],
  ];

  for (const [title, due, completed, contactIndex] of taskSeed) {
    await prisma.task.create({
      data: {
        locationId: location.id,
        title,
        dueDate: daysAhead(due),
        completed,
        assigneeId: users[contactIndex % users.length].id,
        contactId: contacts[contactIndex % contacts.length].id,
      },
    });
  }

  const noteSeed: Array<[number, string, number]> = [
    [0, "Prefers afternoon appointments. Has two dogs — call before arriving.", 2],
    [2, "Budget approved up to $9k for the mini-split. Wants financing options.", 5],
    [3, "Owner is deciding between us and one other bid. Decision expected Friday.", 3],
    [8, "Fleet of 6 vehicles — potential ongoing maintenance contract.", 7],
    [14, "Warehouse contact is the facilities manager, not the owner.", 9],
    [6, "Long-time customer, always pays on time. Great candidate for referral program.", 14],
  ];

  for (const [contactIndex, body, days] of noteSeed) {
    await prisma.note.create({
      data: {
        contactId: contacts[contactIndex].id,
        authorId: users[contactIndex % users.length].id,
        body,
        createdAt: daysAgo(days),
      },
    });
  }

  const activityTypes = [
    ["form", "Form submitted", "Free Estimate Request"],
    ["sms", "SMS sent", "Appointment reminder delivered"],
    ["opportunity", "Opportunity stage changed", "Moved to Estimate Sent"],
    ["appointment", "Appointment booked", "AC diagnostic scheduled"],
    ["email", "Email opened", "Rooftop unit proposal"],
    ["call", "Call logged", "Outbound call — 4m 12s"],
    ["note", "Note added", "Left a voicemail, will retry tomorrow"],
  ];

  for (let i = 0; i < 42; i += 1) {
    const [type, title, description] = activityTypes[i % activityTypes.length];
    await prisma.activity.create({
      data: {
        locationId: location.id,
        contactId: contacts[(i * 5) % contacts.length].id,
        userId: users[i % users.length].id,
        type,
        title,
        description,
        createdAt: daysAgo(i * 0.35),
      },
    });
  }

  console.log("\nSeed complete.");
  console.log(`  Location: ${location.name}`);
  console.log("  Login:    demo@gohighlevel.dev / demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
