# Live Switch setup runbook — pending verification
Use the existing installation if already configured.
1. On the machine running Switch, confirm Console and Docker are running.
2. Record versions and confirm the existing coding provider can complete a simple local task.
3. Clone this project into a dedicated directory.
4. Add coordinator, builder, and reviewer agents with the instructions in agents/.
5. Use a shared room named promise-to-proof in bundled Mattermost.
6. Configure addressing to permit the owner's agents to hand work to one another; owner-only defaults can block handoffs.
7. Post a synthetic request; verify each role replies in the same case thread.
8. Capture real message IDs and link them in the case record.
9. Only after this works, connect the workflow service and demo repository.

Current implementation does not include a live adapter or importable Switch template. Verify exact template and tool schemas against the installed version before authoring them.
Current protocol docs describe WebSocket events + HTTP operations; older SSE transport is deprecated. Prefer existing Console-managed providers to writing a custom client during this hackathon.
Sources:
https://docs.switchagents.ai/switch-rooms/internals/agent-protocol
https://docs.switchagents.ai/switch-rooms/getting-started/create-a-room
https://github.com/sandbox-quantum/switch
