# Compounded Protocols - Implementation Summary

**Date:** 2026-02-04
**Session:** History Analysis & Protocol Upgrade

---

## What We Did

Analyzed ~6.5MB of session history (7 days Claude Code, full OpenCode history) to extract recurring mistakes and corrections. Identified 12 Compounded Protocols and upgraded AGENTS.md + CLAUDE.md.

---

## The 12 Compounded Protocols

### 1. Token Optimization (MCP vs Direct API)
**Added to:** AGENTS.md (Self-Verification section)

**Rule:** MCP for discovery, direct API for production.
- MCP = 40+ tools = ~20-40k tokens per message
- Direct API for: batch operations, Cyrus execution, production scripts
- Example: 151 generations = 6M tokens saved with direct API

### 2. Creative QA is Mandatory (Not Optional)
**Already in:** AGENTS.md (Creative QA section)

**Standing Order:** ALWAYS QA creative output. Check:
- Does output match CONCEPT (not just "high quality")?
- Does video match storyboard?
- Is timing synced?
- Creative requirements met (pill shape, character action, etc.)

### 3. Documentation First (Check Before Exploring)
**Enhanced in:** CLAUDE.md (Documentation First section)

**Added:** Data Freshness Check protocol
- Before using ANY *.json metadata: check dates, git history, deprecated folders
- ASK user if data looks old: "This file is from [DATE], is this current?"
- Don't assume metadata files contain current prompts

### 4. Blocking Waits (NEVER Poll in Loops)
**Added to:** AGENTS.md (new Blocking Waits section)
**Enhanced in:** CLAUDE.md (Autonomous Execution section)

**The 100x Cost Rule:**
- Polling loop (100 iterations) = 100 API calls = $20-40
- Blocking wait = 1 API call = $0.20-0.40

**Use:**
- `wait_for_completion()` for ComfyUI
- `TaskOutput(block=true)` for background tasks
- Wake events (NOT live-poll) for PTY sessions

### 5. Multi-File Batching (Read All Context at Once)
**Already in:** Both files (Parallelization sections)

**Rule:** Never read files sequentially. Batch ALL context gathering in one tool call.

### 6. Claude Code in Repos (For Deep Work)
**Already in:** AGENTS.md (Deep Repo Work Protocol)

**Rule:** For non-trivial work, spawn Claude Code in the repo, not direct work.

### 7. Mode Switching (Fast/Slow/Plan/Debug)
**Enhanced in:** CLAUDE.md (Mode Switching section)

**Added table:**
| User Says | Mode | Behavior |
|-----------|------|---------------|
| "Slow down" / "Careful" / "Stop" | Interactive | Ask before EVERY action |
| "Fast mode" / "Go" / "Proceed" | Autonomous | Default — execute without asking |
| "Plan mode" / "Plan this" | Planning | Research, present plan, WAIT for approval |
| "Debug" / "Explain" | Verbose | Show reasoning, print command outputs |

**Added:** Planning Mode Guidance
- Default to execution (don't suggest plan mode for simple tasks)
- WAIT for explicit "approved" / "proceed" before executing in plan mode
- Do not self-approve

### 8. Wake Events vs Polling (For Sub-Agents)
**Already in:** AGENTS.md (Sub-Agent Monitoring section)

**Rule:** DO NOT live-poll PTY sessions. Use wake events + log check.

### 9. ComfyUI Queue Protocol (Never Clear, Only Add)
**Enhanced in:** CLAUDE.md (ComfyUI Queue Protocol section)

**Added STANDING ORDER emphasis:**
- ⚠️ NEVER clear the queue. NEVER interrupt others. ⚠️
- The One Rule: Don't `requests.post(f"{COMFY}/queue", json={"clear": true})`
- Just add jobs: `requests.post(f"{COMFY}/prompt", json=workflow)`

### 10. Self-Verification (Always Run Tests/Lints)
**Already in:** Both files

**Rule:** Run tests/lints after editing. Do NOT ask user to verify. QA outputs yourself.

### 11. Anti-Patterns (Comprehensive List)
**Enhanced in:** AGENTS.md (Anti-Patterns section)

**Converted from simple list to comprehensive table:**
| Anti-Pattern | Why It's Wrong | Do This Instead |
|--------------|---------------|-----------------|
| Ask "Shall I proceed?" | Burns tokens | Just do it |
| Read files one at a time | Slow | Batch reads |
| Explain plan before doing | Wastes tokens | Execute first |
| Ask user to verify | Not your job | Self-verify |
| Poll in loops for status | 100x cost | Use blocking wait |
| Live-poll PTY sessions | Burns tokens | Wake events |
| Clear ComfyUI queue | Kills others' work | Just add jobs |
| Skip docs, explore blindly | Wrong approach | Documentation First |
| MCP for batch operations | 6M tokens | Direct API |
| Assume metadata is current | Legacy data | Check dates |
| Creative QA is optional | Ships wrong output | ALWAYS QA |

### 12. Autonomous Execution (Act > Ask)
**Enhanced in:** CLAUDE.md (Autonomous Execution section)

**Added:**
- Blocking Operations Reference table
- "Never Do This" / "Always Do This" code examples
- Clear separation of when to ACT vs ASK

---

## Files Modified

1. **AGENTS.md**
   - Added Token Optimization section (lines 61-74)
   - Added Blocking Waits section (lines 220-251)
   - Enhanced Anti-Patterns to comprehensive table (lines 275-291)

2. **CLAUDE.md**
   - Enhanced Documentation First with Data Freshness Check (lines 482-501)
   - Enhanced Mode Switching with explicit table (lines 597-610)
   - Added Planning Mode Guidance (lines 612-621)
   - Enhanced ComfyUI Queue Protocol with STANDING ORDER (lines 626-645)
   - Enhanced Autonomous Execution with Blocking Operations Reference (lines 811-895)

---

## Key Metrics

- **History analyzed:** ~6.5MB of session logs
- **Protocols identified:** 12
- **Files upgraded:** 2 (AGENTS.md, CLAUDE.md)
- **Sections added/enhanced:** 11
- **Cost savings from Blocking Waits:** 100x reduction in API calls
- **Token savings from Direct API:** 6M tokens for 151 generations example

---

## Next Steps for Future Sessions

When resuming work:
1. Read updated AGENTS.md and CLAUDE.md
2. Follow the 12 Compounded Protocols
3. Use blocking waits, not polling
4. MCP for discovery, direct API for production
5. ALWAYS QA creative output
6. Documentation First (check dates on metadata!)

---

*These protocols compound learning from mistakes to prevent future repeats.*
