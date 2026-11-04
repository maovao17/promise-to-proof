# Promise to Proof — working build brief
Updated November 4, 2026. Owner: Maithalee Vishe. Track: Best Business Workflow.

## Decision
Build one customer-commitment workflow for a solo software founder or tiny product team. Begin with a prospect asking for booking-data migration. Investigate whether a limited CSV import meets the need; obtain a scope decision; implement and verify it; prepare an accurate follow-up.

The creative hypothesis: a change to the human's decision propagates through the entire case. Old approvals, implementation evidence, and outgoing drafts cannot be reused for a new scope. The demonstration should expose and correct an outdated promise, not merely show agents producing text.

This is a useful integration hypothesis, not a claim of global novelty. Customer interviews and hands-on competitor trials have not yet been performed.

## What judges ask for
DevTools Academy publishes: Switch use 30%, technical execution 25%, creativity/impact 25%, presentation/documentation 20%. WeMakeDevs lists the same categories but its fetched page renders percentages as zero, so use the co-organizer's explicit table and recheck before submission.
Required: public repository, short video showing the workflow running, README explaining agents, channel setup, and reproducible execution.
Deadline: November 7, 2026, 11:59 PM IST. Internal submission target: 8 PM IST to leave a buffer.
Some side-track details differ between organizer pages. This plan targets the Business Workflow track and does not rely on disputed side-track details.

## Traditional, automated, and agentic workflows
| Approach | Usual path | Strength | Trade-off |
| --- | --- | --- | --- |
| Traditional service/change management | Log request, investigate, assess impact, review plan, implement, verify, close | Ownership, explicit records, predictable stages | Manual coordination across roles |
| Rule-based automation | Trigger, conditions, actions, exception queue | Repeatable known paths | New ambiguity requires an explicit exception |
| Modern feedback tools | Capture conversations, deduplicate, attach deal value, prioritize, sync delivery, notify | Strong evidence and account linkage | Configuring the complete toolchain still matters |
| Coding assistant in chat | Mention agent, investigate code, make change, report | Fast technical execution in a familiar surface | Business scope and customer commitments need explicit context |
| Proposed workflow | Evidence, options, human commitment, implementation, checks, release, follow-up | One versioned case ties decisions to delivery and communication | Reliability and integration must be demonstrated |

Traditional does not mean ineffective. Borrow its ownership, traceability, and verification. Use AI for ambiguous investigation and drafting. Use deterministic rules for state transitions, approval freshness, and duplicate handling.

## Competitor findings
- Sintra documents Team Chat and specialist collaboration. AI employee personas and delegation are established.
- Relevance AI documents conditional routing, approval modes, escalation, and task visibility. Human-in-the-loop alone is not novel.
- Taskade supports sequential, parallel, and supervisor agent orchestration.
- Lindy works through existing tools with memory and routines.
- Devin supports Slack requests, questions, and updates.
- Linear connects Intercom conversations to issues and can reopen conversations when linked work completes.
- Canny captures requests, links deal value, syncs with issue trackers, and supports AI/coding integrations. Even feedback-to-build workflows have substantial existing coverage.

Our proposed distinction is the compact ready-to-run experience and explicit invalidation of stale commitments. Do not claim competitors lack this behavior without direct verification.

## Design
Mattermost is the main surface. One room, one thread per case; three agents.
Coordinator owns customer context and options. Builder owns feasibility and code. Reviewer checks independently against accepted criteria.
A case summary shows status, owner, scope version, evidence links, next decision, and blocker.
Decision messages show concrete alternatives and their costs/limitations. Unknown estimates stay unknown.
Only milestone updates go to the user; detailed diagnostics are linked.
Use clear text commands initially. Buttons are optional once the working flow is stable.

## Demo scenario (fictional)
A prospect asks to migrate bookings from spreadsheets. An initial broad request mentions Excel.
The founder chooses CSV only with preview and no saving until confirmation.
A stale draft says Excel is supported. The system rejects its old scope version and requires regeneration.
The builder implements a bounded importer. The reviewer catches invalid/duplicate row handling.
The revised implementation passes checks; release and notification are recorded separately.
No real customer contact or production deployment is required for the demonstration.

## Scope
Must have: live Switch interaction, three roles, one case, durable state, scope-change invalidation, actual code artifact, verification evidence, draft customer update, restart recovery, reproducible README.
Later: CRM integrations, automatic outbound email, multiple tenants, billing, lead scraping, general business startup assistance, dashboard polish.
If time is short, preserve the live Switch path and one verified case; cut cosmetic UI and extra integrations first.

## Success evidence
Run identical inputs through a manual baseline, a single coding assistant, and our workflow where time permits.
Record elapsed time, human minutes, manual transfers, acceptance tests passed, stale actions blocked, and communication accuracy.
Do not invent time savings or attribute a won sale to a synthetic example.
Practical validation after the hackathon: ask three founders to walk through their last customer-request handoff and try the prototype.

## Sources reviewed
All checked November 3–4, 2026 unless otherwise noted. Vendor documentation establishes advertised behavior, not independently measured reliability.
- https://www.wemakedevs.org/hackathons/switch
- https://www.wemakedevs.org/hackathons/switch/schedule
- https://www.devtoolsacademy.com/hackathons/flip-the-switch
- https://support.atlassian.com/jira-service-management-cloud/docs/what-is-the-change-management-workflow-in-service-projects/
- https://www.atlassian.com/incident-management/itsm
- https://help.sintra.ai/en/articles/12266334-what-is-sintra-ai
- https://relevanceai.com/docs/get-started/core-concepts/workforces
- https://relevanceai.com/docs/build/agents/give-your-agent-tasks/approval-mode
- https://help.taskade.com/en/articles/9254706-multi-agents
- https://www.lindy.ai/product
- https://docs.devin.ai/integrations/slack
- https://linear.app/docs/intercom
- https://canny.io/team/sales
- https://canny.io/integrations
- https://www.anthropic.com/engineering/building-effective-agents
- https://www.nngroup.com/articles/designing-ai-agents/
- https://docs.switchagents.ai/switch-rooms/internals/agent-protocol

NN/G's cited study has six participants in a consumer setting; use it for interaction guidance, not proof of B2B demand. Community feedback previously reviewed was anecdotal and sometimes promotional; no prevalence claims are based on it.
