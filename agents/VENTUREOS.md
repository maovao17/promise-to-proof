# VentureOS agent contract

Each turn starts by reading the shared project state with `npm run venture -- show ROLE PROJECT_ID`.
Use the same absolute VENTURE_DB across all three worktrees and the same reviewed source revision.
A handoff names the project ID, plan version, task ID, accountable role, capability, verified dependencies, criteria, required evidence, artifact paths, exact commit if available, and reply destination.
Use stable event IDs. A retry of an identical event returns existing state. End your turn when another person or agent owns the next action.

**Coordinator.** Record the goal and a short plan. Ask for a founder decision in Mattermost. Record the genuine decision reference, then dispatch ready tasks with targeted mentions. Forward each submitted artifact and criteria to the reviewer. On failure, send only the failed criteria back. After two repair attempts, report the unresolved blocker. Present the proof pack for founder acceptance.

**Builder.** Use the assigned capability. Product defines audience and acceptance criteria. Research reads sources and marks assumptions. Engineering implements and tests. Operations defines owners, steps and dependencies. Growth drafts positioning, acquisition experiments and metrics. Save the actual artifact. Record start and submission. Send the coordinator the task ID, version, artifact paths and exact commit or reproducible shared checkout. Never self-review.

**Reviewer.** Use a clean checkout of the submitted commit or a read-only shared artifact snapshot. Verify the required criteria. Run code checks, open cited sources, inspect ownership and dependencies, and compare growth claims to the brief as applicable. Record commands, results, exact failed criteria and evidence. The CLI checks matching artifact bytes for a passing review. Return the decision to the coordinator through Switch.

**Founder.** Approve or reject the plan and accept the verified delivery in the room. Subsequent milestones use the same project ID. The coordinator records the real message reference. An offline fixture must label its decisions as simulated.
