# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## Residential Proxies (Oxylabs)

**Entry point:** `disp.oxylabs.io`
**Credentials:** romancircus_4CPN2 / +pQ3VJ+ji6VBTR

| Port | Country | IP | ISP |
|------|---------|-----|-----|
| 8001 | Canada | 195.40.110.100 | Rogers |
| 8002 | US | 149.143.148.212 | Charter |

**Usage with yt-dlp:**
```bash
PROXY="http://romancircus_4CPN2:+pQ3VJ+ji6VBTR@disp.oxylabs.io:8001"
yt-dlp --proxy "$PROXY" -f 18 "URL"
```

## Multilogin Profiles

| Profile | Proxy | Use Case |
|---------|-------|----------|
| youtube_research_ca | Oxylabs CA (8001) | YouTube research |
| KDHverse Oxylabs | Oxylabs US (8002) | KDH content |

**Workspace ID:** 2d97e833-cf86-42fb-bd2e-f7ea66c5fdfa

## SSH Hosts

| Host | IP (Tailscale) | User | Notes |
|------|----------------|------|-------|
| **Mac Mini M4** | 100.120.120.106 | `jigyoung` | 24GB RAM, password: `mischiefmanaged` |
| **MacBook Pro** | 100.91.147.8 | — | Has Google API keys for Gemini 3.0 Pro (often offline) |
| **solapsvs** | 100.120.241.70 | `romancircus` | Main workstation (anonymous identity, avoid Google services) |

**⚠️ Mac Mini username is `jigyoung`, NOT `romancircus`!**

## ComfyUI

- **URL:** http://localhost:8188
- **GPU:** RTX 5090 (32GB VRAM)
- **Models loaded:** SDXL, IP-Adapter FaceID Plus V2, InsightFace antelopev2

## Dance Reference Videos

Located: `~/Applications/KDH-Automation/videos/input/dance/`

| File | Views | Motion Style |
|------|-------|--------------|
| `astronomia_viral.mp4` | **14.8M** | Tuzelity shuffle / coffin meme |
| `brainrot_baby_viral.mp4` | **14.1M** | #1 AI baby dancing video |
| `gangnam_baby_viral.mp4` | **11.5M** | Classic Gangnam Style baby |
| `sonic_baby_viral.mp4` | **6.5M** | Sonic baby TikTok trend |
| `ai_dancing_babies.mp4` | **253k** | Multi-style compilation |

**Selection criteria:** Highest view count + AI baby dancing niche + clear choreography for motion control

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

## OpenCode Free Models

| Model | Context | Notes |
|-------|---------|-------|
| `opencode/glm-4.7-free` | 202k | ✅ Works reliably - USE THIS |
| `opencode/minimax-m2.1-free` | 202k | Untested |

**Kimi K2.5 Status (2026-02-02):**
- ❌ OpenCode integration hangs (streaming/response format issue, not temperature)
- ✅ Direct API works fine with any temperature
- Config updated with `temperature: 1.0` at model level, but OpenCode still hangs
- **Recommendation:** Use `opencode/glm-4.7-free` instead

## Terminal Multiplexer: ZELLIJ (NOT tmux!)

**Always use Zellij** for persistent sessions. We have multiple Claude Code instances running on it.

```bash
# Start named session
zellij -s session-name

# Attach to existing
zellij attach session-name

# List sessions
zellij list-sessions

# Detach: Ctrl+o then d
# New pane: Ctrl+p then n
# Switch panes: Ctrl+p then arrows
```

**Web UI token:** `~/.config/zellij/web-token.txt`

---

## Kimi K2.5 API Providers

| Provider | Recommended? | Notes |
|----------|--------------|-------|
| Together.ai | ✅ YES | Enterprise-grade, same pricing |
| OpenRouter | ⚠️ NO | 2.2/5 Trustpilot, billing issues |
| Moonshot | ⚠️ Maybe | Direct but docs partially Chinese |

## X / Grok Credentials

**Email:** grok@opengenstudio.com
**Password:** Ride6-Emptiness4-Calculate0-Unsmooth6-Prodigal7

Use for:
- X (Twitter) access
- Grok AI queries
- Sentiment monitoring

**Note:** Prefer Multilogin with residential proxy when accessing X to avoid bot detection.

---

## Cyrus AI Agent (Self-Hosted)

**Service:** `cyrus.service`
**Port:** 3456
**Webhook URL:** https://solapsvs.taila4c432.ts.net/webhook

### Quick Commands
```bash
sudo systemctl status cyrus      # Check status
sudo systemctl restart cyrus     # Restart
sudo journalctl -u cyrus -f      # Live logs
```

### Documentation
Full debugging guide: `~/.cyrus/DEBUGGING.md`

### Repository Routing
- Add `repo:kdh`, `repo:pokedex`, `repo:roblox`, `repo:goat`, or `repo:comfyui` labels
- Or use `[repo=RepoName]` in issue description
- Default catch-all: "General" (~/Applications)

### Common Issues
1. **No webhooks received**: Check Tailscale Funnel (`tailscale funnel status`)
2. **Signature errors**: Patch is applied (WARN in logs = working)
3. **"Which repository?"**: Add a routing label or it routes to General

### Key Files
- `~/.cyrus/.env` - secrets
- `~/.cyrus/config.json` - repo configs
- `/etc/systemd/system/cyrus.service` - systemd service

## Proton Mail Access

**Canonical Location:** `~/.clawdbot/skills/proton-mail/` (symlink to `/home/romancircus/repos/solapsvs-meltbot/skills/proton-mail/`)

**Usage:**
```bash
# List latest emails
python3 ~/.clawdbot/skills/proton-mail/email_cli.py list -n 10

# Read specific email
python3 ~/.clawdbot/skills/proton-mail/email_cli.py read <ID>

# Search emails
python3 ~/.clawdbot/skills/proton-mail/email_cli.py search "query"
```

**Configuration:**
- Email: romancircus@pm.me
- IMAP: 127.0.0.1:1143 (via Proton Bridge)
- SMTP: 127.0.0.1:1025 (via Proton Bridge)
- Credentials: Stored in skill config (working)

**Status:** ✅ Operational and tested
**Last verified:** 2026-02-05

