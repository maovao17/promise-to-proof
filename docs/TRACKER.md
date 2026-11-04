# Build tracker
Updated November 5, 2026. This file is the initial source of truth; link implementation PRs and evidence as work completes.

| ID | Task | Owner | Target IST | Status | Done means |
| --- | --- | --- | --- | --- | --- |
| P01 | Research and scope | Assistant | Nov 4 | Done | Sources, comparison, specific demo |
| P02 | Public repo and documentation | Assistant | Nov 4 | Done | Files committed and visible |
| P03 | Workflow core | Assistant | Nov 4 | Done | Scope invalidation and transition tests |
| P04 | Live Switch documentation handoff smoke test | Joint | Nov 4 | Done | Human request → coordinator → builder → reviewer → room report; docs only |
| P05a | Durable local case storage (P2P-STORE-001 v1) | p2p-builder | Nov 5 | Done | Restart, duplicate/conflict, failed-event and concurrent-write tests on the exact commit |
| P05b | Trusted identity mapping | Assistant | Nov 5 | Todo | Authenticated Switch roles; customer text cannot supply actor roles |
| P06 | Demo booking importer | Assistant | Nov 5 | Implemented; review pending | CSV preview, validation, duplicate handling |
| P07 | Connect role tools to workflow core | Assistant | Nov 5 | Local commands implemented; live run pending | Case transitions driven from room |
| P08 | Independent review and commit-bound evidence | Assistant | Nov 6 | Todo | Failed check blocks completion |
| P09 | End-to-end rehearsal and comparison | Joint | Nov 6 | Todo | Reproducible live run; recorded measures |
| P10 | Record and edit short demo | Maithalee + Assistant | Nov 7 | Todo | Actual flow, scope change, evidence |
| P11 | Fresh-clone check and submission | Joint | Nov 7 before 8 PM | Todo | Public repo, README, video links |

## Current environment
The dedicated Promise to Proof Mattermost room and three existing Codex agents completed a live documentation handoff. The workflow service is not wired, so case updates remain manual. The local store uses synthetic fixtures and project-local runtime files only; it is not yet connected to Switch identities or room events.

## Work log
- November 4: checked organizer pages and traditional/modern workflow references; chose a narrow customer-commitment case.
- November 4: started project repository, role instructions, offline core, and demo/submission plans.
- November 4 (manual update): P2P-HANDOFF-001 v1 passed. Builder commit `79f2d051ef8fb03737f6c241faefb4813e63d12f` changed only `docs/HANDOFF_SMOKE_TEST.md`; independent reviewer passed the exact commit (room message `sw_683a0d598d784206a62637f4e32bb6d5`). No product implementation was part of that test.
- November 4 (manual update): founder approved P2P-STORE-001 v1 in room message `sw_b6e92256883bbd3c00902ab2a84d1959`. Builder commit `50790e96ba92d56d5c59e7aed33f2450bad95a03` added the local store and tests; independent reviewer passed that exact commit (room message `sw_ee3a6797214a4069a6f1847697a1ee5e`). No merge or deployment occurred.

## Update discipline
After each session: update status, record test command/results, link commit, note blocker and next action.
Use Todo / In progress / Blocked / Done. A plan or mock is not a completed integration.

## Verification — November 4
`npm test`: 8 passed, 0 failed. `npm run demo`: offline scope-change scenario passed. Live product integration and CI execution are not yet verified.
P2P-HANDOFF-001 v1: reviewer checked the exact documentation commit, single changed file, and clean diff.
P2P-STORE-001 v1: on Node v25.9.0, independent reviewer ran `node --test test/store.test.mjs` (5 passed) and `npm test` (13 passed), plus a separate synthetic fresh-process/replay/conflict/rejection check. The interruption test used a pre-commit SIGKILL; power-loss recovery and declared Node 22.13 compatibility were not separately tested. Event replay identity follows JSON key order.

## November 5 runtime verification
Role prompt source hashes and fresh saved case briefs implemented; explicit task contracts replace polling loops. CSV preview/save and offline full-case rehearsal implemented. `npm test`: 20 passed on Node 24.22.1. `npm run rehearsal` and `npm run bookings:preview` passed. New runtime independent review and live product run pending. Local role selection is policy enforcement, not authenticated room identity. No real external release/send occurred.
