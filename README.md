# StandIn — AI Chief of Staff

Hackathon build for "The CEO's Impossible Day". StandIn reads the seven scenario files in this folder, cross-checks them, fixes the calendar, catches contradictions, and drafts everything the CEO must approve. Nothing is sent without approval. The idea and plan are in [plan.md](plan.md).

## Run it

Requires Node.js 20+.

```bash
npm run setup     # install server + client dependencies
npm run build     # build the React client
npm start         # http://localhost:3001
```

For development, run `npm run dev:server` and `npm run dev:client` in two terminals and open http://localhost:5173.

```bash
npm test          # engine + API tests against the real scenario files
```

## AI mode

Without credentials StandIn runs in rules + templates mode: all detection and drafting is deterministic. Set `ANTHROPIC_API_KEY` before `npm start` and each draft is also polished by Claude (`claude-opus-5-5`); every source reference in the AI text is checked against the real sources. Set `STANDIN_AI=off` to force template mode.

## Demo flow

Use the simulated-time presets in the header to replay the day:

| Time | What to show |
|---|---|
| 08:30 | Inbox triaged: phishing caught, noise filtered, Marcus's duplicate 1:1s removed |
| 10:10 | Interpreter cancelled → Davr call kit: proceed/reschedule decision, guardrails, EN/UZ/RU glossary |
| 13:30 | Journalist inquiry → press pack; press sync at 16:30 is after the 16:00 deadline |
| 16:10 | Q3 one-pager with VERIFY flags (v4 deck, Davr terms changed), TechCorp resolved → approve |
| 16:50 | Comms will auto-send at 17:00, 60 minutes after the reporter deadline |

## Structure

```
server/src/sources       readers for the xlsx and txt scenario files
server/src/engine        triage, calendar resolver, deadlines, corrections, findings
server/src/deliverables  one-pager, Davr call kit, press pack, audio briefing
server/src/ai            optional Claude polishing + citation validation
server/src/approval      approval gate and simulated outbox (audit log)
client/src               React UI
```
