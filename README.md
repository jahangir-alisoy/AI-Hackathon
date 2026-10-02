# StandIn — AI Chief of Staff

One place for the CEO's whole day: Slack, email, system notifications and the calendar. StandIn sits in the middle as an AI layer. It ranks every incoming message, explains why, drafts replies, and sends a reply to the right person once the CEO approves it. Auto-replies are optional. Idea and plan: [plan.md](plan.md).

## Run it

Requires Node.js 20+.

```bash
npm run setup     # install server + client dependencies
npm run build     # build the React client
npm start         # http://localhost:3001
npm test          # 27 tests, against the real scenario files
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

## Connect your Slack

StandIn reads **your own** Slack direct messages through a user token, ranks them, and replies **as you** after you approve.

1. **Create the app:** https://api.slack.com/apps → **Create New App** → **From scratch** → choose your workspace. Your admin may need to approve it.
2. **User token scopes:** under **OAuth & Permissions → User Token Scopes**, add `im:history`, `im:write`, `chat:write`, `users:read`. Optionally add `mpim:history` (group DMs), and `channels:history` + `channels:read` (public channels).
3. **Install:** click **Install to Workspace**, then copy the **User OAuth Token** (`xoxp-…`). Copy the **Signing Secret** from **Basic Information → App Credentials**.
4. **Put them in a `.env` file:** in the project folder (next to `package.json`), copy `.env.example` to a new file named `.env`. Paste the token after `SLACK_USER_TOKEN=` and the secret after `SLACK_SIGNING_SECRET=`. Save it, then run `npm start`.
5. **Public URL:** Slack must reach your machine, e.g. `ngrok http 3001`.
6. **Events:** under **Event Subscriptions**, switch it on and set the Request URL to `https://<public-url>/api/integrations/slack/events`. It should show "Verified". Under **Subscribe to events on behalf of users**, add `message.im` (plus `message.mpim` / `message.channels` if you added those scopes). Save, then reinstall the app if Slack asks.
7. **Check it:** **Settings → Connections** shows Slack as *Live*. When a colleague DMs you, the message appears in StandIn within a second, ranked. **Approve & send** posts your reply into the same conversation, as you.

Notes:

- StandIn ignores messages you write yourself, including the replies it sends for you, so it never answers itself.
- StandIn answers Slack immediately and processes the message right after, so Slack never times out and retries.
- A bot token (`SLACK_BOT_TOKEN=xoxb-…` with the same scopes as bot scopes) also works. In that mode StandIn only sees messages sent to the bot, and replies as the bot.

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
