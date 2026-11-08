# HighLevel — Open-source CRM, funnels & automation

A GoHighLevel-style business platform built with Next.js, Prisma and Tailwind CSS. It ships with a
complete demo workspace (an HVAC company called Coastal Air & Heat) so every screen has realistic
data the moment you sign in.

> This is an independent educational clone. It is not affiliated with or endorsed by GoHighLevel.

## What's inside

| Area | What you can do |
| --- | --- |
| **Dashboard** | Live KPIs, 6-month revenue chart, pipeline funnel, today's schedule, inbox preview and task checklist |
| **Contacts** | Search, filter and segment contacts; full contact record with activity timeline, notes, tags, deals, conversations and appointments |
| **Pipelines** | Multiple pipelines with drag-and-drop deal stages, per-stage value totals and recently closed deals |
| **Conversations** | Shared inbox for SMS, email and social threads with unread counts, statuses and replies |
| **Calendars** | Weekly team calendar with colour-coded appointment blocks, booking modal and cancellation |
| **Automations** | Workflow builder with triggers, actions, waits and conditions, plus publish/pause controls and enrolment stats |
| **Forms & Funnels** | Form management, publish toggles, copyable public links and a real public submission page that creates contacts |
| **Reporting** | Revenue trend, lead-source donut, pipeline health and team performance table |
| **Settings** | Business profile, personal profile, team directory and invitations |

Authentication is real: passwords are hashed with bcrypt, sessions are signed JWTs in httpOnly
cookies, and every query is scoped to the signed-in workspace.

## Tech stack

- **Next.js 15** App Router with React Server Components and Server Actions
- **Prisma 6** + SQLite for zero-config local persistence
- **Tailwind CSS 4** with a hand-built design system (no UI kit)
- **bcryptjs** for password hashing, **jose** for signed session cookies
- Charts and SVG icons are written from scratch — no chart library

## Quick start

```bash
npm install
npm run setup    # creates .env, pushes the schema, seeds demo data
npm run dev      # http://localhost:3000
```

Sign in with the demo owner account:

```
Email:    demo@gohighlevel.dev
Password: demo1234
```

You can also create a brand new workspace from `/register` — it comes with a starter sales pipeline
and calendar.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on `0.0.0.0:3000` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript checks (`tsc --noEmit`) |
| `npm run db:push` | Sync the Prisma schema to SQLite |
| `npm run db:seed` | Reset and reseed the demo workspace |
| `npm run setup` | One-shot install: `.env`, schema push, seed |

## Project structure

```
app/
  (app)/            authenticated workspace (sidebar shell)
    dashboard/      KPIs, charts, schedule, tasks, activity
    contacts/       list, search, pagination and full contact record
    pipelines/      kanban board with drag-and-drop stages
    conversations/  shared inbox with threaded replies
    calendars/      week view + booking
    automations/    workflow builder
    forms/          forms & funnels management
    reporting/      revenue, sources and team performance
    settings/       business, profile and team
  actions/          server actions (mutations) grouped by domain
  f/[id]/           public form submission page
  login, register   auth screens
components/         design system, charts, modals, board, shell
lib/                prisma client, session/auth, formatting helpers
prisma/             schema and seed script
```

## Data model

`Location` → `User`, `Contact`, `Tag`, `Pipeline` → `Stage` → `Opportunity`, `Conversation` →
`Message`, `Calendar` → `Appointment`, `Workflow` → `WorkflowStep`, `Form` → `FormSubmission`,
plus `Note`, `Activity` and `Task`.

## Notes and limitations

- SQLite and the demo data are for local development. Swap `provider` in `prisma/schema.prisma` for
  PostgreSQL/MySQL before deploying for real.
- SMS, email and social channels are modelled in the database and inbox but are **not** connected to a
  live provider — plug in Twilio/SendGrid/Meta inside `app/actions/conversations.ts`.
- Calendar times use the server's timezone; production deployments should localise per user.
- The `AUTH_SECRET` in `.env.example` is a development placeholder — always replace it in production.

## License

MIT.
