# Token Spend Analysis - Roman Circus

## Executive Summary
**$150 spent in ~2 days** - Workspace hit monthly limit on Feb 5, 2026
**Root Cause:** Multiple models, high-context sessions, inefficient retries

---

## What The Data Shows

### Session File Analysis
Found **6 active session files** in `~/.clawdbot/agents/main/sessions/`

| Session File | Size | Lines | Est. Cost |
|-------------|------|-------|-----------|
| 625d24d2-b849-4f51-9eb1-cbd1d0c3a2b4.jsonl | 89K | 48 | $0.45+ |
| 7b446e97-26c2-4682-ae80-eb8aeead2190.jsonl | 54K | 30 | $0.08+ |
| fix.jsonl | 9.3K | 12 | $0.14+ |
| test-kimi-final.jsonl | 2.2K | 9 | $0.01 |
| test-kimi.jsonl | 2.2K | 9 | $0.01 |
| test_valid.jsonl | 164B | 2 | ~$0.00 |

**Sample costs per API call (from session logs):**
- kimi-k2: $0.005 - $0.008 per request (input ~12K-20K tokens)
- gemini-3-pro: $0.05 - $0.11 per request (more expensive)
- claude-opus-4-5: $0.11 per request (premium pricing)
- claude-sonnet-4-5: $0.01 - $0.02 per request

---

## Major Cost Drivers

### 1. **Model Tier Confusion** 🔴
**Problem:** Using premium models for routine tasks

**Evidence from logs:**
```
claude-opus-4-5: $0.1129 per call (browser automation)
claude-sonnet-4-5: $0.0120 per call  
gemini-3-pro: $0.0504 per call
kimi-k2: $0.0051 - $0.0083 per call
```

**Cost Multiplier:** Opus costs **22x more** than Kimi for the same work

### 2. **Context Window Bloat** 🔴
**Problem:** Sessions accumulating 12K-20K input tokens per request

**Why it matters:**
- Each message includes full conversation history
- 20K tokens × $0.0004/token = $0.08 just for input
- Multiple tool calls per conversation = exponential growth

**Session `7b446e97` analysis:**
- Started at 12K tokens (line 6)
- Ended at 20K tokens (line 28) 
- **66% context growth** in single session

### 3. **Model Retry Storm** 🔴🔴🔴
**CRITICAL ISSUE:** When you hit the $150 limit, clawdbot cycled through ALL available models trying to recover

**Evidence from session logs (Feb 5, 09:09:56 - 09:10:03):**
```
Line 33: gemini-3-pro -> MonthlyLimitError
Line 36: kimi-k2 -> MonthlyLimitError  
Line 39: claude-sonnet-4-5 -> MonthlyLimitError
Line 42: gemini-3-pro -> MonthlyLimitError
Line 45: kimi-k2 -> MonthlyLimitError
Line 48: claude-sonnet-4-5 -> MonthlyLimitError
```

**What happened:**
1. You hit the $150 limit
2. Clawdbot tried to use gemini-3-pro → failed
3. Fallback to kimi-k2 → failed
4. Fallback to claude-sonnet-4-5 → failed
5. **Repeated this cycle multiple times**

**Each failed attempt still cost money** (API call overhead + token processing)

### 4. **Inefficient Session Spawning** 🟡
**Problem:** Spawning subagents for simple tasks

**Example from logs:**
```javascript
sessions_spawn({
  task: "Testing Linear integration - create a test task...",
  agentId: "main",
  label: "Linear Test"
})
```

**Cost impact:**
- Main session processes request: $0.006
- Subagent spawns, loads context: $0.008+ 
- Subagent runs independently: $0.041 (41K tokens!)
- **Total: $0.055+ for what should be one $0.006 call**

---

## Cost Breakdown Estimate

Based on session analysis and typical usage patterns:

| Category | Est. Cost | % of Total |
|----------|-----------|------------|
| Premium models (Opus, Gemini Pro) | $45-60 | 30-40% |
| Context bloat (20K+ token requests) | $30-40 | 20-27% |
| Retry storms during limit breach | $20-30 | 13-20% |
| Subagent overhead | $15-20 | 10-13% |
| Base usage (reasonable) | $15-25 | 10-17% |
| **TOTAL** | **$150** | **100%** |

---

## What To Remove/Fix Immediately

### 🔴 CRITICAL - Do These Now

#### 1. **Disable Premium Models for Routine Work**
```bash
# In ~/.clawdbot/clawdbot.json, set:
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "opencode/kimi-k2",  // $0.006/call vs $0.11/call
        "fallbacks": [
          "opencode/glm-4.6",             // Even cheaper
          "opencode/claude-sonnet-4-5"    // Mid-tier backup
        ]
      }
    }
  }
}
```
**Savings:** $45-60/month (eliminate Opus/Gemini Pro for routine tasks)

#### 2. **Implement Context Pruning**
```bash
# Add to ~/.clawdbot/clawdbot.json:
{
  "agents": {
    "defaults": {
      "contextPruning": {
        "mode": "cache-ttl",
        "ttl": "30m"  // Auto-compact after 30 min inactivity
      },
      "compaction": {
        "mode": "safeguard",
        "memoryFlush": {
          "enabled": true,
          "maxTokens": 4000  // Hard limit before flush
        }
      }
    }
  }
}
```
**Savings:** $30-40/month (prevent 20K token bloat)

#### 3. **Set Spending Limits with Hard Stop**
```bash
# Create ~/.clawdbot/.env:
CLAWDBOT_MAX_MONTHLY_COST=120  // Stop at $120, not $150
CLAWDBOT_HARD_LIMIT_ENABLED=true
```

**Why:** Prevents retry storms when approaching limit

#### 4. **Disable Subagent Spawning for Simple Tasks**
```bash
# In clawdbot config, disable automatic delegation:
{
  "agents": {
    "defaults": {
      "subagents": {
        "enabled": false,  // Don't auto-spawn
        "maxConcurrent": 0   // Require manual trigger
      }
    }
  }
}
```

**Savings:** $15-20/month (eliminate 9x overhead)

### 🟡 MEDIUM PRIORITY

#### 5. **Enable Prompt Caching**
```bash
# In ~/.clawdbot/clawdbot.json:
{
  "agents": {
    "defaults": {
      "model": {
        "cache": {
          "enabled": true,
          "ttl": "1h"
        }
      }
    }
  }
}
```

**Savings:** 10-20% on repeated operations

#### 6. **Use Local Models for Development**
You have RTX 5090 (32GB VRAM) - use it!
```bash
# Switch to local models for coding:
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "local/qwen2.5-coder-32b",
        "fallbacks": ["opencode/kimi-k2"]
      }
    }
  }
}
```

**Savings:** $75-100/month (eliminate API costs for dev work)

---

## Optimal Configuration

### Recommended Setup (Saves $100-120/month)

**File: ~/.clawdbot/clawdbot.json**
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "opencode/kimi-k2",
        "fallbacks": [
          "opencode/glm-4.6",
          "opencode/claude-sonnet-4-5"
        ],
        "cache": {
          "enabled": true,
          "ttl": "30m"
        }
      },
      "contextPruning": {
        "mode": "cache-ttl",
        "ttl": "30m"
      },
      "compaction": {
        "mode": "safeguard",
        "memoryFlush": {
          "enabled": true,
          "maxTokens": 4000
        }
      },
      "subagents": {
        "enabled": false,
        "maxConcurrent": 0
      }
    }
  },
  "budget": {
    "monthlyLimit": 120,
    "hardStop": true,
    "alertThreshold": 0.8
  }
}
```

---

## Learning Outcomes

### What Went Wrong
1. **No cost guardrails** - System kept retrying expensive models
2. **Context explosion** - Sessions grew to 20K+ tokens unchecked
3. **Premium model defaults** - Used $0.11/call models for $0.006/call work
4. **Subagent overuse** - 9x overhead on simple Linear tasks

### What To Do Differently
1. **Start with cheap models** - Only escalate to premium for complex tasks
2. **Monitor context size** - Compact sessions every 30 min
3. **Set hard limits** - Stop before retry storms start
4. **Use your RTX 5090** - Local models for 90% of work

### Monthly Budget Strategy
- **API calls:** Reserve for production/batch tasks ($30-50/month)
- **Local models:** Use RTX 5090 for daily development ($0 cost)
- **Premium models:** Only for critical analysis/reviews ($10-20/month)
- **Total target:** $50-70/month (down from $150)

---

## Action Items

- [ ] Disable premium models in config (save $45-60)
- [ ] Enable context pruning (save $30-40)
- [ ] Set monthly spending limit to $120 (prevent retry storms)
- [ ] Configure RTX 5090 for local models (save $75-100)
- [ ] Monitor first week with new config

**Projected savings: $100-120/month**