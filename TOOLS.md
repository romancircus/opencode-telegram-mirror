# TOOLS.md - Quick Reference

For full details, credentials, and config: see `TOOLS-REFERENCE.md`

## Proxies (ALWAYS for YouTube/Google)
```bash
PROXY="http://romancircus_4CPN2:+pQ3VJ+ji6VBTR@disp.oxylabs.io:8001"
```
Port 8001=Canada, 8002=US. **NEVER** access YouTube/Google directly.

## SSH Hosts
| Host | IP | User |
|------|-----|------|
| Mac Mini M4 | 100.120.120.106 | jigyoung (pw: mischiefmanaged) |
| solapsvs | 100.120.241.70 | romancircus |

## ComfyUI
URL: http://localhost:8188 | GPU: RTX 5090 (32GB) | `sudo systemctl start/stop/restart comfyui`

## Terminal: ZELLIJ (not tmux)
`zellij -s name` / `zellij attach name` / `zellij list-sessions` / Detach: Ctrl+o, d

## Email (Proton Mail)
```bash
python3 ~/.clawdbot/skills/proton-mail/email_cli.py list|read|search|send
```
Account: romancircus@pm.me

## Agent Services
| Agent | Port | Delegate Label |
|-------|------|---------------|
| jinyang | 3001 | jinyang:auto |
