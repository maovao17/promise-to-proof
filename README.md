# Promise to Proof
A Switch workflow for small software teams: turn a customer blocker into an agreed scope, verified delivery, and an accurate customer update.

**Status — November 4, 2026:** research, workflow specification, agent instructions, and an offline tested workflow core. Live Switch connection, demo product, delivery integration, and recorded demo are **not yet implemented**. Do not present the offline demo as a live agent run.

## Run the starter
Requires Node.js 22.13 or newer. No dependencies or API keys are needed for the offline core and local store.
```sh
npm test
npm run demo
```
The demo shows approval invalidation after scope changes. It does not call AI models, send messages, or deploy code.

## Local case storage — P2P-STORE-001 v1
`CaseStore` in `src/store.mjs` keeps full synthetic event payloads and resulting case state in a SQLite file under `runtime/`. Create a store with `new CaseStore('runtime/cases.sqlite')`, then use `create(id, request)`, `append(id, event)`, `get(id)`, `events(id)`, and `close()`. Reopen the same path after a restart to read the case. The file is local and ignored by Git; this layer does not connect room identities or perform external actions.

Run `node --test test/store.test.mjs` for storage checks, or `npm test` for the full suite. Node's built-in SQLite module remains experimental on the supported Node 22 line.

## The workflow
1. Paste a customer request in a Switch-connected Mattermost room.
2. Coordinator gathers evidence; builder checks existing capabilities and technical options.
3. Founder chooses build, workaround, clarify, or defer.
4. Builder implements the approved scope; reviewer verifies acceptance criteria.
5. Scope changes invalidate old approvals, evidence, and reply drafts.
6. Founder reviews release and the exact customer update.
7. Track release, notification, and customer confirmation separately.

## Why Switch
The intended live workflow receives human decisions and agent handoffs through the Switch room. The room contains shared context and case links. Agents must not silently bypass it with a separate chat interface. The offline state reducer is only a testable component of that workflow.

## Start here
- [Master brief and research](docs/MASTER_BRIEF.md)
- [Build tracker](docs/TRACKER.md)
- [Workflow and architecture](docs/WORKFLOW.md)
- [Demo script](docs/DEMO.md)
- [Submission checklist](docs/SUBMISSION.md)
- [Switch setup runbook](docs/SWITCH_SETUP.md)
- [Decisions](docs/DECISIONS.md)

Working title; no uniqueness or commercial-demand claim. All demo customer data must be synthetic.
