# Agent tools and rehearsal
Requires Node 22.13+ (tested locally on Node 24; the remote storage review used Node 25). SQLite is built in.
## Setup
Set the same absolute P2P_DB in all agent sessions, pointing into the dedicated project's ignored runtime directory.
Example: P2P_DB=/absolute/project/runtime/cases.sqlite. This is local case data, not a credential.
Use the branch containing this runtime in all worktrees. Record the commit and prompt hashes; do not silently change prompts during a case.
## Commands
```sh
node scripts/case.mjs create coordinator CASE-001 request.txt
node scripts/case.mjs brief coordinator CASE-001
node scripts/case.mjs act coordinator CASE-001 scope.json
node scripts/case.mjs brief builder CASE-001
node scripts/case.mjs show coordinator CASE-001
node scripts/case.mjs events coordinator CASE-001
node scripts/bookings.mjs preview fixtures/bookings-valid.csv
P2P_BOOKINGS_DB=/absolute/project/runtime/bookings.sqlite node scripts/bookings.mjs save fixtures/bookings-valid.csv --confirm
npm test
npm run rehearsal
```
Preview requires no DB and writes nothing. Saving is explicit. CSV schema: booking_id,guest_name,date,guests; ISO dates, 1–20 guests, 1 MB demo limit. Duplicate IDs are skipped. Any invalid row blocks the entire save.
## Event payloads
scope: id,type,expectedVersion,scope,criteria.
approve: id,type,version,approvalRef.
start: id,type,version.
submit: id,type,version,commit.
verify: id,type,version,commit,passed,evidenceRef.
draft: id,type,version,text.
release: id,type,version,releaseRef,approvalRef.
notify: id,type,version,approvedText,receipt,approvalRef.
clarify/defer: id,type,version,reason.
Actor must not be in the payload.
## Live run
Founder posts a synthetic request and later approves explicit CSV scope in Switch.
Coordinator creates/proposes case, records the real approval reference, and sends one targeted builder assignment.
Builder records start/submission; reviewer runs checks on the actual commit and records verification.
Coordinator drafts the reply. Founder changes scope; demonstrate that old approval/evidence/draft are cleared and stale work fails.
Repeat under the new scope; stop at verified draft unless the founder explicitly approves a simulated release/send.
## Trust and limitations
This is a local single-operator hackathon workflow. CLI role selection enforces event categories but is not authenticated Switch identity mapping. Prompt loading is automatic when brief runs; runtime commands are invoked by the agents, not a continuously running chat listener.
Evidence references are recorded, not cryptographically attested. Agent reviewer must run checks and inspect the exact commit. Customer data is synthetic; no real release or email integration exists.
`npm run rehearsal` is a deterministic offline integration test, not a live multi-agent conversation. Live room evidence must be reported separately.
