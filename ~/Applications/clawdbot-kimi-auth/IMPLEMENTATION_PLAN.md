# Kimi OAuth Plugin Implementation - Clawdbot

## Overview
Port `opencode-kimi-auth` to Clawdbot plugin, reusing existing OAuth credentials from `~/.opencode-kimi-auth/oauth.json`. No re-authentication required for users who already have the OpenCode plugin.

## Token Status
✅ **Valid token found** at `~/.opencode-kimi-auth/oauth.json`
- Access token expires: 2026-02-04 (valid)
- Refresh token: Valid (30-day lifetime)
- Client ID: `17e5f671-d194-4dfb-9706-5516cb48c098`

## Parallel Work Breakdown

### Task 1: Plugin Scaffolding (KIMI-1) ✅
**Owner:** Agent A
**Status:** READY TO START
**Dependencies:** None
**Deliverable:** 
- Directory: `~/Applications/clawdbot-kimi-auth/`
- package.json with dependencies
- tsconfig.json
- clawdbot.plugin.json manifest
- README.md template

**Key Requirements:**
- TypeScript project setup
- Clawdbot plugin SDK dependency
- File locking dependency (proper-lockfile)
- Entry point structure matching qwen-portal-auth pattern

### Task 2: OAuth Module Port (KIMI-2) ✅
**Owner:** Agent B  
**Status:** READY TO START
**Dependencies:** KIMI-1 scaffolding
**Deliverable:**
- `src/oauth.ts`: Port from `opencode-kimi-auth/src/oauth.ts`
- Add PKCE support (generatePkce function)
- Add file locking for token refresh safety
- Device authorization flow with Kimi endpoints
- Token refresh with race condition prevention

**Key Requirements:**
- Reuse constants from opencode-kimi-auth:
  - CLIENT_ID: `17e5f671-d194-4dfb-9706-5516cb48c098`
  - DEVICE_AUTH_ENDPOINT: `https://auth.kimi.com/api/oauth/device_authorization`
  - TOKEN_ENDPOINT: `https://auth.kimi.com/api/oauth/token`
- Add PKCE (missing in opencode-kimi-auth, required by Clawdbot)
- Implement proper-lockfile for token file locking
- Refresh token race condition prevention (in-flight promise tracking)

### Task 3: Plugin Registration (KIMI-3) ✅
**Owner:** Agent C
**Status:** READY TO START  
**Dependencies:** KIMI-2 OAuth module
**Deliverable:**
- `src/index.ts`: Main plugin entry point
- `src/migration.ts`: Import existing opencode-kimi-auth credentials
- Provider registration with `api.registerProvider()`
- Model definitions for Kimi K2, K2.5, thinking variants
- Device code auth method configuration

**Key Requirements:**
- Pattern after `qwen-portal-auth/index.ts`
- Import existing token on first run from `~/.opencode-kimi-auth/oauth.json`
- Graceful fallback to fresh auth if no existing token
- Register models:
  - `kimi/kimi-k2.5` (primary, 256k context)
  - `kimi/kimi-k2.5-thinking` (reasoning variant)
  - `kimi/kimi-k2` (fallback)

### Task 4: Testing & Validation (KIMI-4) ⏳
**Owner:** Agent D
**Status:** WAITING (depends on KIMI-1,2,3)
**Dependencies:** KIMI-1, KIMI-2, KIMI-3 complete
**Deliverable:**
- Local plugin installation: `clawdbot plugins install -l .`
- Enable: `clawdbot plugins enable kimi-auth`
- Test auth flow without re-authentication (should use existing token)
- Test token refresh (simulate expiration)
- Test model routing: `clawdbot --model kimi/kimi-k2.5 "test message"`
- Performance benchmark vs OpenCode routing

**Key Requirements:**
- Verify token import works (no browser auth window)
- Verify refresh works independently of opencode-kimi-auth
- Verify both plugins can coexist (no token conflicts)
- Document latency improvements

### Task 5: Documentation & Migration Guide (KIMI-5) ⏳
**Owner:** Agent E
**Status:** WAITING (depends on KIMI-4)
**Dependencies:** KIMI-4 testing complete
**Deliverable:**
- README.md: Installation, configuration, usage
- Migration guide: From OpenCode routing to direct OAuth
- Troubleshooting section
- Configuration examples for model routing
- Performance comparison with OpenCode

**Key Requirements:**
- Clear instructions for fresh install vs migration
- Model routing examples (thinking vs coding)
- Fallback configuration examples
- Cost comparison table

## Technical Architecture

### Credential Reuse Strategy
**Option C: Hybrid with Independent Management**
1. **Import Phase:** On first run, read `~/.opencode-kimi-auth/oauth.json`
2. **Store Phase:** Save to Clawdbot's auth-profiles.json (independent storage)
3. **Runtime:** Both plugins manage their own tokens independently
4. **Refresh:** File locking prevents race conditions, in-flight tracking prevents duplicates

### File Locations
```
~/.opencode-kimi-auth/oauth.json          # Source (read once)
~/.clawdbot/auth-profiles.json            # Destination (Clawdbot manages)
~/.clawdbot/clawdbot.json                 # Config (add plugin entry)
```

### Dependencies
```json
{
  "dependencies": {
    "clawdbot-plugin-sdk": "latest",
    "proper-lockfile": "^4.1.2"
  }
}
```

## Model Catalog

| Model ID | Context | Reasoning | Cost (per 1M) |
|----------|---------|-----------|---------------|
| kimi/kimi-k2.5 | 256k | Yes (multi-modal) | $0.50 in / $2.80 out |
| kimi/kimi-k2.5-thinking | 256k | Extended | $0.40 in / $1.75 out |
| kimi/kimi-k2 | 256k | Standard | $0.60 in / $2.50 out |

## Migration Checklist

- [ ] Plugin scaffold created
- [ ] OAuth module ported with PKCE
- [ ] Token migration logic implemented
- [ ] Provider registered with models
- [ ] Local installation tested
- [ ] Token refresh tested
- [ ] Model routing verified
- [ ] Documentation complete
- [ ] README published

## Success Criteria

1. ✅ **No re-authentication required** for existing opencode-kimi-auth users
2. ✅ **+412ms latency improvement** vs OpenCode routing
3. ✅ **Zero downtime migration** from OpenCode to direct OAuth
4. ✅ **Both plugins coexist** without token conflicts
5. ✅ **All Kimi models accessible** (K2, K2.5, thinking variants)

## Notes

- **PKCE Required:** Kimi OAuth needs PKCE challenge/verifier for Clawdbot compatibility
- **File Locking:** Use proper-lockfile to prevent refresh race conditions
- **Token Lifetime:** Access tokens expire in 15 minutes, refresh tokens in 30 days
- **Device Headers:** Include X-Msh-* headers (see opencode-kimi-auth for values)
- **Model Aliases:** Register "kimi" as alias for kimi/kimi-k2.5

## Blockers

None. Ready to start parallel implementation.
