# Natural Language Handoff - Agent Quick Reference

**Status:** ✅ Active | **Version:** Current Build | **Date:** 2026-02-05

---

## What Is This?

The OpenCode Telegram Mirror now supports **natural language handoff** - switching between OpenCode (desktop) and Telegram (mobile) using everyday phrases instead of technical commands.

**No more:** `/mirror enable`, `/mirror disable`, session management  
**Just say:** "continue on Telegram", "back on OpenCode"

---

## How Users Trigger Handoffs

### To Telegram (Leaving Desktop)

| Phrase | Confidence |
|--------|------------|
| "continue on Telegram" | 95% |
| "switch to Telegram" | 95% |
| "continue on my phone" | 90% |
| "I need to go" | 85% |
| "I have to run" | 85% |
| "I'm heading out" | 85% |
| "brb" / "be right back" | 75-80% |
| "going to pick up Damien" | 75% |

### To OpenCode (Returning to Desktop)

| Phrase | Confidence |
|--------|------------|
| "back on OpenCode" | 95% |
| "back on computer" | 90% |
| "I'm back" | 85% |
| "back at my desk" | 90% |
| "resume on OpenCode" | 90% |
| "let's continue here" | 80% |

---

## What Happens

### To Telegram:
1. Bot detects handoff intent (confidence ≥ 75%)
2. Sets `isMirroringToTelegram = true`
3. Sends context summary: "🔄 Continuing: <task>"
4. All subsequent Telegram messages forwarded to OpenCode

### To OpenCode:
1. Bot detects return intent (confidence ≥ 75%)
2. Sets `isMirroringToTelegram = false`
3. Sends confirmation: "✅ Welcome back!"
4. Resumes normal bidirectional operation

---

## Technical Details

### Key Files
- **`src/handoff-detector.ts`** - Intent detection engine (50+ patterns)
- **`src/main.ts`** - Integration point (lines 732-755)

### State Tracking
```typescript
interface BotState {
  isMirroringToTelegram: boolean  // Current mirroring mode
  lastUserMessage: string | null  // For context continuity
  currentTask: string | null      // From TASK_DESCRIPTION or BRANCH_NAME
}
```

### Detection Algorithm
```typescript
const handoff = detectHandoffIntent(messageText)
if (handoff.type === "to_telegram" && handoff.confidence >= 0.75) {
  // Trigger handoff
}
```

---

## Adding New Patterns

When users request new trigger phrases:

1. **Edit `src/handoff-detector.ts`**
2. **Add to appropriate array:**

```typescript
// For Telegram handoff
const TO_TELEGRAM_PATTERNS = [
  { pattern: /your new pattern here/i, confidence: 0.85 },
  // ... existing patterns
]

// For OpenCode return
const TO_OPENCODE_PATTERNS = [
  { pattern: /your new pattern here/i, confidence: 0.85 },
  // ... existing patterns
]
```

3. **Confidence Guidelines:**
   - Exact matches: 0.95
   - Common variations: 0.85-0.90
   - Colloquial/slang: 0.75-0.80

4. **Test:** `bun run test:run`
5. **Type check:** `bun run typecheck`

---

## Debugging

### Logs to Watch
```
[info] Handoff to Telegram detected {"confidence": 0.95, "matchedPhrase": "continue on Telegram"}
[info] Received message {"mirroring": true, ...}
```

### Testing Handoffs
```bash
# Start the bot
bun run start

# In Telegram, send:
# "continue on Telegram" → Should enable mirroring
# "back on OpenCode" → Should disable mirroring
```

### Common Issues
| Issue | Solution |
|-------|----------|
| Handoff not detected | Check confidence threshold (default 0.75) |
| Context missing | Verify TASK_DESCRIPTION or BRANCH_NAME env vars |
| Messages not forwarding | Check `isMirroringToTelegram` state in logs |

---

## For Different Agent Types

### Clawd Agents
- Handoff detection happens automatically in `handleTelegramMessage()`
- State persists across message processing
- No manual intervention needed

### OpenCode Agents
- Natural language triggers work out of the box
- Can extend patterns in `src/handoff-detector.ts`
- Test thoroughly with `bun run test:run`

### Jianyang Agents
- Focus on context continuity when implementing handoffs
- Use `getHandoffContext()` for consistent messaging
- Ensure bidirectional state sync

---

## Testing Checklist

When modifying handoff code:

- [ ] TypeScript compiles (`bun run typecheck`)
- [ ] Tests pass (`bun run test:run`)
- [ ] New patterns tested manually
- [ ] Context continuity verified
- [ ] Both directions work (to Telegram + to OpenCode)
- [ ] Edge cases handled (rapid switches, missing context)

---

## Related Documentation

- **AGENTS.md** - Section: "Natural Language Handoff (New Feature - 2026-02-05)"
- **README.md** - Section: "Natural Language Handoff" under Advanced Features
- **src/handoff-detector.ts** - Pattern definitions and detection logic

---

## Quick Commands

```bash
# Run tests
bun run test:run

# Type check
bun run typecheck

# Start bot locally
bun run start

# Start with mock server (testing)
bun run test:mock-server  # Terminal 1
TELEGRAM_UPDATES_URL=http://localhost:3456/updates \
TELEGRAM_SEND_URL=http://localhost:3456 \
TELEGRAM_BOT_TOKEN=test:token \
TELEGRAM_CHAT_ID=-1003546563617 \
bun run start  # Terminal 2
```

---

**Questions?** Check AGENTS.md or ask the user for clarification.
