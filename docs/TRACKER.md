# Build tracker
Updated November 4, 2026. This file is the initial source of truth; link implementation PRs and evidence as work completes.

| ID | Task | Owner | Target IST | Status | Done means |
| --- | --- | --- | --- | --- | --- |
| P01 | Research and scope | Assistant | Nov 4 | Done | Sources, comparison, specific demo |
| P02 | Public repo and documentation | Assistant | Nov 4 | Done | Files committed and visible |
| P03 | Workflow core | Assistant | Nov 4 | Done | Scope invalidation and transition tests |
| P04 | Live Switch smoke test | Joint | Nov 4 | Next | Human → agent → agent → human in room |
| P05 | Durable case storage and trusted identity mapping | Assistant | Nov 5 | Todo | Restart and duplicate-event tests |
| P06 | Demo booking importer | Assistant | Nov 5 | Todo | CSV preview, validation, duplicate handling |
| P07 | Connect role tools to workflow core | Assistant | Nov 5 | Todo | Case transitions driven from room |
| P08 | Independent review and commit-bound evidence | Assistant | Nov 6 | Todo | Failed check blocks completion |
| P09 | End-to-end rehearsal and comparison | Joint | Nov 6 | Todo | Reproducible live run; recorded measures |
| P10 | Record and edit short demo | Maithalee + Assistant | Nov 7 | Todo | Actual flow, scope change, evidence |
| P11 | Fresh-clone check and submission | Joint | Nov 7 before 8 PM | Todo | Public repo, README, video links |

## Current environment
Connected GitHub account available. New dedicated project repository created.
Docker is not available in this execution workspace. The user's existing Switch setup has not been inspected in this turn. Do not reinstall it based on this limitation.
The next live milestone needs the machine where Switch Console and an authenticated agent provider run.

## Work log
- November 4: checked organizer pages and traditional/modern workflow references; chose a narrow customer-commitment case.
- November 4: started project repository, role instructions, offline core, and demo/submission plans.

## Update discipline
After each session: update status, record test command/results, link commit, note blocker and next action.
Use Todo / In progress / Blocked / Done. A plan or mock is not a completed integration.

## Verification — November 4
`npm test`: 8 passed, 0 failed. `npm run demo`: offline scope-change scenario passed. Live integration and CI execution are not yet verified.
