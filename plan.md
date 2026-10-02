# StandIn — AI Chief of Staff for "The CEO's Impossible Day"

## 1. One-liner
The CEO's assistant is out sick. StandIn reads every source for the day (calendar,
inbox, Slack, briefs, notes, reading list), finds the current version of each fact,
fixes the schedule, and gives the CEO one screen showing what only they can decide.
Everything else is drafted and waits for one-click approval. Nothing is sent without
the CEO's approval.

## 2. Core insight (presentation hook)
The day is hard because of conflicting and out-of-date information, not volume.
Seven sources disagree with each other. A tool that only summarises would repeat the
mistakes. StandIn checks the sources against each other before it summarises.

## 3. What it catches in the actual scenario data (demo proof points)
| # | Trap in the data | Sources | What StandIn does |
|---|------------------|---------|-------------------|
| 1 | Phishing "IT Security" email from external domain with link | Inbox #1 | Flags SECURITY RISK, never opens the link, suggests reporting it to IT |
| 2 | Board deck v4 has wrong revenue; v5 replaces it. One-pager notes use cost-to-income ratio "from v4" | Inbox #3, #15; notes | Marks v4 as superseded; one-pager marks the cost-to-income ratio "VERIFY vs v5" |
| 3 | TechCorp call moved 11:00 → 11:15, calendar is stale | Inbox #19; calendar | Fixes the calendar; Davr overlap gone, new 30-min overlap with the Aisha interview |
| 4 | Marcus 1:1 appears 3 times | Calendar; inbox #7; Slack | Keeps only the latest (9:45), removes the duplicates |
| 5 | TechCorp listed in attrition risk, but TechCorp stayed | Notes; Slack 12:05; inbox #30 | One-pager shows the risk as mitigated, not open |
| 6 | Davr terms shifted at 13:40 | Inbox #27; Slack 15:12 | One-pager Davr section marked "confirm with Daniel (GC)" |
| 7 | Reporter deadline 16:00, but Comms will send at 17:00 and the sync is at 16:30 | Journalist file; inbox #26, #32; calendar | RED ALERT: the response is too late. Pulls the decision into the 14:45–15:00 slot |
| 8 | Unsigned data sharing agreement (DSA) is a regulatory requirement, not a formality (new Central Bank of Uzbekistan rule in the reading backlog) | Inbox #2, #18, #28; backlog article 1 | Escalates "sign DSA" to top priority before 10:30 and gives the reason |
| 9 | Interpreter cancelled; Bekzod asks: proceed or reschedule? | Inbox #16; Davr brief | Decision card with two options + call kit (see module D) |
| 10 | Rumor is false (internal reorg, not layoffs); IT headcount actually went up by 6 | Journalist file; notes | Press statement draft based only on internal facts, CEO approval required |

## 4. Modules
A. Daily Brief ("Needs You" queue)
   - Every email and Slack message sorted into: CEO_DECISION / APPROVE_DRAFT / DELEGATE /
     FYI / NOISE / SECURITY_RISK
   - Each item: one-line reason, deadline, source IDs (e.g. "Inbox #27, Slack 15:12")
   - Result for today: ~6 items need the CEO, about 27 do not

B. Calendar Fixer (deterministic, no LLM)
   - Apply changes from emails/Slack to the calendar (latest change wins)
   - Remove duplicates, detect overlaps, find free gaps
   - Suggest changes, e.g.:
     * Aisha Round 2: Priya starts, CEO joins after TechCorp (CEO still attends the final round at 14:00)
     * Marketing & Ops sync: delegate; CEO sends the customer-story quote (due 14:00) async
     * Keep the board chair lunch at 12:30 and use it to agree the one-pager outline
     * TechCorp follow-up at 15:00: TechCorp already stayed → suggest shortening to 10 min
     * Journalist sync at 16:30 is after the 16:00 deadline → move the decision before 15:00
   - Suggests combining tasks with meetings already booked: Daniel (GC) is in the 09:00 and
     14:00 meetings → sign the DSA / confirm Davr terms then. Sarah (CFO) is in the
     16:00 1:1 → check the one-pager numbers before 17:00

C. Deadline Radar
   - Extracted deadlines: DSA (before 10:30), marketing quote 14:00,
     press decision 15:00 (hard 16:00), one-pager 17:00 (flight 19:00),
     compliance training Friday
   - Each one: status, owner, next action, how much time is left

D. Davr Bank Call Kit (for 10:30, after the interpreter cancelled)
   - Decision card for the CEO: (1) proceed in simple English with written support, or
     (2) a short 15-min call now + reschedule the legal/financial items with an interpreter.
     The tool recommends one option, the CEO chooses.
   - Glossary of the 6 terms that caused confusion before (tranche, Day-1 readiness, …)
     in Uzbek + Russian + plain English
   - Talking points in short, plain English sentences
   - Guardrail: "Agree in principle, do not commit in writing" (terms shifted at 13:40,
     governing law still open)
   - Draft bilingual follow-up summary to send after the call (CEO approves)

E. Q3 One-Pager for the board chair (due 17:00)
   - Sections: Highlights / Risks / Davr Bank Integration / What the Board Should Know
   - Every line has a source tag and a status: VERIFIED / VERIFY / SUPERSEDED-FIXED
   - Includes: net interest income +22% QoQ, AI assistant shipped 2 weeks early with 40% usage,
     Acme ~$4M close to signing, TechCorp retained, SME competition,
     notification system tech debt, Davr status, media inquiry (board should know)
   - Export as a printable page; CEO approves before it goes into the outbox

F. Press Response Pack
   - Decision card: the deadline problem, the facts (no layoffs, reorg only),
     the risks of each option
   - Draft statement based only on internal context; never confirms the 15% figure
   - CEO approves or edits → simulated outbox to Jordan

G. (Stretch) Reading Backlog → Audio Briefing
   - Ranks the 5 articles by relevance to TODAY (Uzbek data rules first, because it
     affects the Davr call; fintech funding last)
   - 3-minute podcast script, read aloud by the browser's built-in text-to-speech
     (no extra service needed)

## 5. Automate vs. keep human (judging criterion)
| Fully automated | Drafted, CEO approves | Human only (tool reminds/prepares) |
|---|---|---|
| Spam/noise filtering | Email replies | Signing the DSA |
| Phishing detection | Q3 one-pager | Final press statement decision |
| Calendar fixes & conflict detection | Press statement | Davr: proceed vs reschedule |
| Deadline tracking | Davr follow-up summary | Commitments on deal terms |
| Detecting superseded facts | Marketing quote | Hiring decision (Aisha offer) |
| Reading list ranking | Reschedule requests | |

Rule: StandIn never sends, signs, or commits. Everything outgoing goes through an
Approval Gate into a simulated outbox with an audit log.

## 6. Architecture (Java)
Stack: Java 21, Spring Boot 3, Apache POI (xlsx), Anthropic Java SDK (or plain HTTP),
Thymeleaf or a single static HTML page, JSON file cache.

Flow:
Sources → Readers → Unified Timeline → [Deterministic Engine + LLM Analysis]
→ World State (facts, superseded facts, deadlines, triage) → Generators
→ Approval Gate → Outbox / Audit Log → Dashboard

Components (one job each, behind interfaces):
- SourceReader: CalendarXlsxReader, InboxXlsxReader, SlackTextReader, DocumentTextReader
- TimelineBuilder: merges everything into one list of events, sorted by time
- CalendarResolver: applies changes, removes duplicates, finds overlaps & gaps (pure Java)
- PhishingDetector: checks sender domain, urgency words, links (pure Java)
- LlmClient: the only class that talks to the model
- WorldStateAnalyzer: one LLM call → triage, facts, superseded facts, deadlines (JSON)
- SourceCitationValidator: rejects any LLM output that cites an ID that does not exist
- DeliverableGenerator: OnePagerGenerator, DavrCallKitGenerator,
  PressResponseGenerator, PodcastScriptGenerator
- ApprovalGate + Outbox: approve/edit/reject, writes to outbox folder + audit log

## 7. Data model
- Event { id, source, timestamp, actor, role, subject, body }
- CalendarEntry { start, end, title, attendees, status, resolvedFrom[] }
- Fact { key, value, sourceIds[], status: CURRENT | SUPERSEDED | NEEDS_VERIFICATION, supersededBy }
- TriageItem { eventId, category, reason, deadline, suggestedAction, draft }
- Deadline { what, dueAt, owner, status, sourceIds[] }
- Deliverable { type, content, lines[ {text, sourceIds, status} ], approvalStatus }

## 8. LLM strategy
- All the scenario data is small (~10k tokens), so send all of it in one call → no retrieval system needed
- Ask for JSON output only, with a fixed format; temperature 0
- Every claim must cite source IDs; the validator rejects claims without them
- Rule in the prompts: "If unsure, mark NEEDS_VERIFICATION. Never invent numbers."
- ~5 LLM calls in total: WorldState, OnePager, DavrKit, PressPack, Podcast
- Save every result to a cache file → the demo is fast and repeatable; a "Re-run live" button
  shows that it really runs

Prompt outlines:
- WorldState: "You are the chief of staff. Given this timeline, return triage per item,
  current facts, superseded facts (with the newer source), deadlines. Cite IDs."
- OnePager: "Using ONLY current facts, write a one-page Q3 summary for the board chair.
  Mark unverified numbers. Include Davr status and anything the board must know."
- DavrKit: "Attendees have limited English. Produce: decision options, glossary in
  Uzbek/Russian/plain English, short talking points, things NOT to commit to."
- PressPack: "Internal truth: no layoffs, reorg only. Draft a statement that neither
  repeats the 15% figure nor speculates. List the deadline risk."

## 9. Screens
1. "Today" dashboard: Needs You (top), Deadline Radar (countdowns), Fixed Calendar (before/after)
2. "Caught for you": list of the traps found, each with source links
3. Davr Call Kit
4. Q3 One-Pager with status badges + Approve/Export
5. Press Response decision card + Approve
6. Outbox & Audit Log
7. (Stretch) Audio briefing player

## 10. 3-hour build timeline
| Time | Work |
|---|---|
| 00:00–00:15 | Project setup, API key, read all files, print counts (33 emails, 17 entries…) |
| 00:15–00:40 | Readers + unified timeline |
| 00:40–01:10 | CalendarResolver + PhishingDetector (deterministic, unit-test against the data) |
| 01:10–01:40 | WorldStateAnalyzer + citation validator + Needs You list + Deadline Radar |
| 01:40–02:10 | One-pager generator + Press pack + Approval Gate/Outbox |
| 02:10–02:30 | Davr Call Kit |
| 02:30 | FEATURE FREEZE |
| 02:30–02:45 | (only if everything works) Audio briefing |
| 02:45–03:00 | Full end-to-end run, save cache, rehearse the 3-min demo |

Cut order if late: Audio → Davr glossary languages → Calendar suggestions (keep detection)

## 11. 3-minute demo script
| Time | What to show |
|---|---|
| 0:00–0:20 | "The assistant is sick. 7 sources, 33 emails, 17 calendar entries, and they contradict each other." |
| 0:20–0:50 | Run on the real files → "Today" screen: 6 things need the CEO, 27 do not. |
| 0:50–1:25 | "Caught for you": phishing, v4→v5, TechCorp moved, press response arriving after the deadline, DSA required by regulation. |
| 1:25–1:55 | Davr Call Kit: decision card, glossary, "do not commit in writing" warning. |
| 1:55–2:30 | Q3 One-Pager with source/status badges → Approve → exported. |
| 2:30–2:50 | Press decision card → Approve → outbox + audit log. |
| 2:50–3:00 | "It drafts and reminds; the CEO decides. Nothing leaves without approval." |

## 12. Risks & mitigations
- LLM invents facts → required citations + validator + "NEEDS_VERIFICATION" status
- API slow/down during the demo → cached results + deterministic parts still work
- Scope creep → feature freeze at 2:30, cut order above
- xlsx parsing surprises → test the readers first, in the first 40 minutes

## 13. Presentation talking points (30%)
- "The problem is out-of-date information, not volume." Show trap #2 or #7.
- "Rules where possible, AI where needed" (calendar logic is pure Java; reading and drafting use the AI).
- "Every line shows its source" (links to backlog article 2: copilots fail when users cannot see how confident they are).
- "The CEO keeps the decisions that carry legal, reputational or people risk."

## 14. Open questions before the build
- Is the product allowed to call an AI API at runtime? If not, fall back to a no-code
  Claude Project with all files + a strong system prompt; traps, approval rules and demo
  script stay the same.
- Java stack confirmed, or a lighter single-page HTML + small backend for speed?
