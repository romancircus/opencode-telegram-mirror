# OpenCode Telegram Mirror

An OpenCode plugin that streams an OpenCode server's request/response for a single session to Telegram.

## Configuration

Pass these environment variables:
- `TELEGRAM_BOT_TOKEN` - Your bot token from [@BotFather](https://t.me/BotFather)
- `TELEGRAM_CHAT_ID` - Your chat ID from [@userinfobot](https://t.me/userinfobot)
- `TELEGRAM_THREAD_ID` - (Optional) Thread/topic ID. Omit to use DMs.

## Why Telegram?

Cross-platform, instant sync, rich Markdown/code formatting, free with no rate limits.

## Quick Start

```bash
# Install
bun install

# Configure
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
# export TELEGRAM_THREAD_ID="your-thread-id"  # optional

# Run
bun run start
```

## Commands

```bash
bun install          # Install dependencies
bun run start        # Run the bot
bun run src/main.ts  # Run from source
bun run typecheck    # Typecheck
```

## Config Files

The bot loads configuration from (in order):
- `~/.config/opencode/telegram.json`
- `<repo>/.opencode/telegram.json`

Environment variables override file config.
