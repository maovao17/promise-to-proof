# VentureOS powered by Promise to Proof

VentureOS uses the existing Switch room as the place where a founder gives a goal, approves a plan, and receives work from the coordinator, builder and reviewer. Each role reads the same saved project. The five capabilities are assignments, so the existing three agents can execute them without extra agent setup.

## Run the local demonstration

Requires Node 22.13 or later with built-in SQLite. From the repository root:

```sh
npm test
npm run venture:rehearsal
npm run crm
```

Open http://127.0.0.1:4173 for Customer Desk. Add a fictional contact, search for it, change status, and reload to confirm local browser storage. The service listens only on the local machine.

The rehearsal uses separate CLI processes for state changes. It runs actual checks against a deliberately seeded duplicate-email defect, records the failure, restores the corrected artifact, and verifies it again. It writes `runtime/venture-rehearsal/proof-pack.json` and `evidence.json`. Decisions are simulated. Documentary checks in this run verify artifact presence and bytes. Qualitative review belongs to the live reviewer.

## Project state and commands

The project journal shares the existing transactional SQLite store with a separate reducer. Use a separate database from the booking case. The plan keeps brief, assumptions, risks, priorities, dependencies, criteria and evidence requirements. Plan versions prevent stale work. Task submissions bind artifact paths to SHA-256 digests. A passing review must refer to the current submission and read matching bytes. Completion requires all tasks verified and founder acceptance.

```sh
export VENTURE_DB="$PWD/runtime/venture-live.sqlite"
printf '%s\n' 'Help me start a service business with a simple CRM and launch plan.' > runtime/goal.txt
npm run venture -- create coordinator CRM-LIVE runtime/goal.txt
npm run venture -- act coordinator CRM-LIVE examples/venture-crm/plan.json
npm run venture -- show coordinator CRM-LIVE
npm run venture -- proof coordinator CRM-LIVE
```

Create `runtime/` first. Share the same absolute database path with every agent on the host. `act` accepts an event file or JSON on stdin. Every event has a unique `id`, current `version`, and `type`. The command supplies the role.

| Event | Role | Additional fields |
|---|---|---|
| plan | coordinator | brief, tasks |
| approve / reject / complete | founder | reference to human decision |
| start | builder | taskId |
| submit | builder | taskId, paths, optional commit |
| review | reviewer | taskId, submissionId, passed, evidence, finding on failure |

Initial plan version is 0. The first approval uses version 1. A rejected plan or accepted delivery can receive another plan on the same project. Verified tasks remain available as dependencies. This MVP appends milestones. Use new artifact paths for changed deliverables to preserve older proofs.

## Existing Switch room

Keep the existing private room and agents. Point each at the same reviewed checkout revision and shared database path. Ask the coordinator to read the contract and prepare the example plan, then approve the exact version in the room. Route every assignment and review result through a targeted Switch mention. The coordinator records founder decisions using the local command after checking the actual room message.

For a fresh installation, `switch/ventureos.template.yaml` uses the fields in the [official triage example](https://github.com/sandbox-quantum/switch/blob/main/examples/agent-templates/triage-pair.template.yaml). Substitute a fresh team name and the configured provider and bridge in Console. The coordinator accepts human intake, while builder and reviewer use owner-agent addressing. Configure the room privacy and worktree paths in the installed Console. The template has not been imported into the existing setup.

CLI role selection assumes a trusted local operator. Switch carries the work and approvals, while the local CLI records them. There is no continuous chat listener or authenticated role adapter in this MVP.

## Demo script

1. Post the service-business goal in Mattermost and show the plan and explicit founder approval.
2. Show the source-backed assumptions and product brief, then the CRM implementation and reviewer checks.
3. Demonstrate a failing duplicate-email check using the seeded rehearsal fixture. Show the targeted correction and passing check.
4. Create a sample contact, find it, update status and reload.
5. Present the launch plan and proof pack. Accept delivery in the room.
6. Add a follow-up plan to the same project ID and show the previous verified tasks.

## Submission checks

- Verify a fresh clone runs the tests, CRM and offline rehearsal.
- Confirm the live Switch run creates a saved project and reviews the exact artifacts.
- Capture the founder decision, review evidence and completed proof pack in the demo.
- Use synthetic contact records and keep private messages and runtime data out of the repo.
- Submit the repository and recorded demo through the hackathon form.
