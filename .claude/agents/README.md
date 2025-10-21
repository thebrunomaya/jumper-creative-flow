# Claude Code Agents

This directory contains custom agents for automating common development workflows.

## What are Agents?

Agents are specialized Claude Code assistants that can autonomously execute multi-step tasks. They have:

- **Specific goals** - Clear, well-defined objectives
- **Tool access** - Can use Bash, Read, Write, Edit, etc.
- **Error handling** - Detect and report issues clearly
- **Progress tracking** - Use TodoWrite to show progress
- **Validation** - Verify each step before proceeding

## Available Agents

### `dev-setup.md`

**Purpose:** Complete local development environment setup

**When to use:**
- Starting new dev session
- Switching computers
- Need fresh production data
- After pulling migrations
- Onboarding new developers

**What it does:**
1. Validates Docker + Supabase CLI
2. Starts Supabase local instance
3. Creates/reuses production backup
4. Resets and restores database
5. Configures environment variables
6. Starts development server

**Expected duration:** ~2 minutes

**Invocation:**
```bash
# Just ask Claude:
"Configure o ambiente de desenvolvimento"
"Setup dev environment"
"Monte o modo de desenvolvimento"
```

## How to Create New Agents

1. Create `agent-name.md` in this directory
2. Include these sections:
   - **Purpose** - What problem it solves
   - **What This Agent Does** - Step-by-step process
   - **Expected Outcome** - What success looks like
   - **Usage Context** - When to use it
   - **Validation Steps** - How to verify success
   - **Error Handling** - How it handles failures
   - **Tools Available** - Which tools it uses
   - **Key Commands** - Important commands it runs

3. Document in `CLAUDE.md` under "Claude Code Agents"

4. Test by asking Claude to perform the task

## Best Practices

- **Be specific** - Clear objectives and validation criteria
- **Error-friendly** - Assume things will fail, handle gracefully
- **Idempotent** - Safe to run multiple times
- **Informative** - Report progress and results clearly
- **Scoped** - One agent = one specific workflow
- **Safe** - Never affect production without explicit confirmation

## Agent vs Script

**Use an Agent when:**
- Need intelligent error handling
- Multiple decision points
- User interaction required
- Complex validation needed
- Cross-tool orchestration

**Use a Script when:**
- Linear execution
- No branching logic
- Fast performance critical
- No user interaction
- Simple success/fail

## Examples

### Good Agent Use Cases
- Environment setup (dev-setup)
- Migration validation and deployment
- Production data sync
- Multi-step testing workflows
- Code refactoring with validation

### Poor Agent Use Cases
- Simple file copy (use script)
- Single command execution (use Bash directly)
- No error conditions (use script)
- Time-critical operations (use script)

## Maintenance

When updating agents:
1. Update the `.md` file in this directory
2. Update documentation in `CLAUDE.md`
3. Test the agent works as expected
4. Document any new dependencies or requirements

---

**Last Updated:** 2024-10-21
**Maintainer:** Claude Code + Bruno (human)
