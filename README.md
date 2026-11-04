# Promise to Proof
A Switch workflow for small software teams: carry a customer request through an explicit scope decision, implementation, independent review, and an accurate customer update.

## Status — November 5, 2026
- Live coordinator → builder → reviewer documentation handoff completed.
- Durable SQLite case store independently reviewed.
- Role prompt loading, case commands, CSV booking importer, and offline integration rehearsal implemented.
- Full live product rehearsal and independent review of the new runtime remain pending.
- No real release, customer email, or production identity integration exists.

## Run
Node 22.13+; no package installation or API key needed for local tests. New runtime tested on Node 24.
```sh
npm test
npm run rehearsal
npm run bookings:preview
```
The rehearsal is an offline test with synthetic decisions and simulated delivery. It is not a live Switch conversation.

## Agent workflow
1. Founder posts a request in the Switch-connected room.
2. Coordinator investigates, proposes scope and records the human's decision.
3. Builder receives a versioned assignment and produces an implementation commit.
4. Reviewer checks that exact commit and records results.
5. Coordinator drafts the customer update.
6. Scope changes invalidate old approvals, evidence and drafts.
7. Release, notification and customer confirmation are separate records.

Each agent runs the role brief command to load its prompt files, source hashes and current case. Agents use their existing tools to invoke the local runtime; it is not a continuously running room-event adapter. Local role selection is not authentication.

## Demo product
A small CSV booking importer with a pure preview, explicit save, row validation and duplicate protection. Read [runtime instructions](docs/RUNTIME.md) for the schema, commands and live rehearsal.

## Documents
- [Master brief and research](docs/MASTER_BRIEF.md)
- [Runtime and rehearsal](docs/RUNTIME.md)
- [Build tracker](docs/TRACKER.md)
- [Workflow](docs/WORKFLOW.md)
- [Demo script](docs/DEMO.md)
- [Submission checklist](docs/SUBMISSION.md)

Switch is the live collaboration surface for human decisions and agent handoffs. The deterministic core and local tests are components of the workflow, not substitutes for its live demonstration.
