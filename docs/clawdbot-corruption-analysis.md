# Clawdbot Session Corruption - Root Cause Analysis

## Problems Identified

1. **Session File Bloat**
   - Session `7b446e97-26c2-4682-ae80-eb8aeead2190.jsonl` grew to 2MB+
   - No automatic rotation or size limits
   - Old deleted sessions still consuming space

2. **JSON Corruption**
   - Unterminated strings in tool call arguments
   - Malformed JSON: `{"model\":\"opencode/kimi-k2.5\""}`
   - Partial writes during tool execution

3. **Context Window Pressure**
   - 175k/1M context (18%) with repetitive "FINAL ANSWER" spam
   - No compaction triggers before corruption
   - Cache-TTL events not preventing degradation

4. **Model Switch State Confusion**
   - Rapid Claude→Kimi→Claude→Kimi switches on Feb 5
   - Model snapshots not properly isolated
   - State leakage between model contexts

5. **Tool Call Validation Missing**
   - No JSON schema validation before writing
   - Partial arguments being persisted
   - No rollback on write failure

## Permanent Fixes Required

### 1. Session Hygiene (HIGH)
- Auto-rotate sessions at 500KB
- Compress old sessions to .jsonl.gz
- Delete .deleted.* files after 24h
- Max 5 active sessions per agent

### 2. JSON Validation (HIGH)
- Validate tool call JSON before session write
- Schema validation for all message types
- Atomic writes (temp file + rename)
- Corruption detection on read

### 3. Context Guardrails (MEDIUM)
- Force compaction at 50% context
- Kill switch at 80% (start fresh session)
- Repetitive output detection (>10 identical phrases)
- Auto-session rotation on model switch

### 4. Health Monitoring (MEDIUM)
- Session size check every 5min
- JSON integrity validation hourly
- Auto-restart on corruption detection
- Alert on repetitive output patterns

### 5. Model Switch Safety (MEDIUM)
- Always start new session on model change
- Clear tool call state on switch
- 30s cooldown between switches
- Log model transitions explicitly
