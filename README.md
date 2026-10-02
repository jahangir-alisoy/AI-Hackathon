# StandIn — AI Chief of Staff

One place for the CEO's whole day: Slack, email, system notifications and the calendar. StandIn sits in the middle as an AI layer. It ranks every incoming message, explains why, drafts replies, and sends a reply to the right person once the CEO approves it. Auto-replies are optional. Idea and plan: [plan.md](plan.md).

## Run it

Requires Node.js 20+.

```bash
npm run setup     # install server + client dependencies
npm run build     # build the React client
npm start         # http://localhost:3001
npm test          # 25 tests, against the real scenario files
```

For development, run `npm run dev:server` and `npm run dev:client`, then open http://localhost:5173.

On first start the seven scenario files are imported: 33 emails, 15 Slack messages, the reading list as system notifications, and the fixed calendar. Data lives in `server/data/store.json`. **Settings → Reset demo data** restores it.

## How a message flows

```
Slack Events API ─┐
In-app simulator ─┼─▶ Ingestion ─▶ Classification ─▶ Store ─▶ Live update (SSE) ─▶ Dashboard
Email / system    ┘                   │                         │
                                      │                         └─▶ Auto-reply (if a rule + switch say so)
             functions or Claude ─▶ VIP ─▶ your Train Lab rules ─▶ your manual override
```

- **Functions mode (default):** deterministic detectors for fraud/phishing, noise, deadlines, urgency, decisions, approvals, scheduling and "later".
- **Claude mode:** set `ANTHROPIC_API_KEY`. Claude ranks new messages and writes and regenerates reply drafts. Your rules and overrides still apply on top.
- **AI Train Lab:** create rules ("if anything contains *Davr* → Urgent"), auto-reply templates, and VIP and blocked senders. Use the live test bench to see how a message would be ranked. "Teach StandIn" on any message turns a correction into a rule.

## Connect a real Slack workspace

1. Create a Slack app with the bot scopes `chat:write`, `im:write`, `users:read`, `channels:history` and `im:history`. Install it to your workspace.
2. Start StandIn with `SLACK_BOT_TOKEN=xoxb-…` and `SLACK_SIGNING_SECRET=…`.
3. Expose it publicly (e.g. `ngrok http 3001`). Under **Event Subscriptions**, set the request URL to `https://<public-url>/api/integrations/slack/events` and subscribe to `message.im` and `message.channels`.
4. Messages sent to the bot now appear in StandIn live, with their ranking. **Approve & send** posts the reply back to the same Slack conversation.

Without a token, Slack replies are stored in StandIn and marked "simulated delivery". Email delivery is simulated too.

## API (short)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/integrations/slack/events` | Slack Events API (signature verified) |
| POST | `/api/integrations/slack/simulate` · `/email/inbound` · `/system` | Ingest a message |
| GET/PATCH/DELETE | `/api/messages[/:id]` | List, update (status, override), delete |
| POST/PUT/DELETE | `/api/messages/:id/draft` | Generate / edit / discard a reply draft |
| POST | `/api/messages/:id/send` | Send the approved reply to its channel |
| CRUD | `/api/rules`, `/api/templates`, `/api/calendar/events` | Train Lab and calendar |
| GET | `/api/calendar/feed?sources=events,slack,email,system` | Calendar plus messages on one timeline |
| GET/PATCH | `/api/settings` | Name, theme, AI and auto-reply switches |
| GET | `/api/stream` | Live events (SSE) |
| GET | `/api/briefings/...` | Scenario briefings (one-pager, Davr kit, press, audio) |

## Structure

```
server/src/core          store, event bus, errors, validation
server/src/modules       messages, classification, rules, templates, replies,
                         channels (Slack/email/system), calendar, settings, overview, seed
server/src/scenario      scenario readers, analysis engine, briefing generators
client/src/app           shell, sidebar, routing, live notifications
client/src/features      home, inbox, calendar, lab, outbox, briefings, settings
client/src/components    UI building blocks
```
