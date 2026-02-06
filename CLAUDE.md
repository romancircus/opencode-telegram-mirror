# AGENTS.md

Full code conventions, test setup, and repo layout: see `CLAWD-GUIDELINES.md`

## Quick Reference
- **Runtime:** Bun (TypeScript, ESM, strict)
- **Typecheck:** `bun run typecheck`
- **Test:** `bun run test:run`
- **The running bot is clawdbot** (separate npm package), NOT `src/main.ts`

## Linear-First
Every deliverable needs a Linear task. Create before starting, update as you go, close when done.
```bash
~/.clawdbot/scripts/linear/create-issue.sh --title "Task" --team "Romancircus"
~/.clawdbot/scripts/linear/update-issue.sh ROM-XXX --state "Done"
```
