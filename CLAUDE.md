# Claude Code Instructions for clawd

## PROJECT GOAL

Clawdbot workspace — Telegram bot brain, session management, and OpenCode mirror for the Roman Circus autonomous agent ecosystem.

## Critical Guardrails

- **Token cost**: Blocking wait ($0.20) vs polling loop ($20-40) = 100x savings
- **MCP vs Direct API**: <10 workflows use MCP, >10 use templates + urllib
- **Pre-commit hooks**: Automatically block anti-patterns (git-enforced)
- **Bootstrap budget**: Keep workspace bootstrap files <2,000 tokens total (SOTA threshold)

## Execution Tasks

For multi-phase overnight work, use single orchestration scripts (NOT multiple Linear issues with blockedBy).

- **Template:** `~/.cyrus/templates/execution_script_template.py`
- **Docs:** `~/.cyrus/docs/EXECUTION_PATTERN.md`
- **Validate:** `python ~/.cyrus/scripts/validate_execution_issue.py ROM-XXX`

## Project Structure

```
clawd/
├── src/           # OpenCode Telegram mirror bot (TypeScript)
├── docs/          # Architecture docs, brain design
├── canvas/        # Creative assets
├── memory/        # Daily logs (YYYY-MM-DD.md)
├── research/      # Research notes
├── SOUL.md        # Persona/tone (bootstrapped)
├── USER.md        # Human profile (bootstrapped)
├── IDENTITY.md    # Name/creature/vibe (bootstrapped)
├── TOOLS.md       # Quick reference (bootstrapped)
├── TOOLS-REFERENCE.md  # Full config details (on-demand)
└── MEMORY.md      # Long-term memory
```

## Development

- **Typecheck:** `bun run typecheck`
- **Build:** `bun run build`
- **The running bot is clawdbot** (separate npm package), NOT `src/main.ts`
