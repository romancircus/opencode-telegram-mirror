/**
 * Bot configuration loading
 */

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { Result, TaggedError } from "better-result"
import type { LogFn } from "./log"

export interface BotConfig {
  botToken?: string
  chatId?: string
  threadId?: number
  // URL to poll for updates (Cloudflare DO endpoint)
  updatesUrl?: string
  // URL to send messages (defaults to Telegram API if not set)
  sendUrl?: string
}

export class ConfigLoadError extends TaggedError("ConfigLoadError")<{
  path: string
  message: string
  cause: unknown
}>() {
  constructor(args: { path: string; cause: unknown }) {
    const message = `Failed to load config at ${args.path}`
    super({ ...args, message })
  }
}

export type ConfigLoadResult = Result<BotConfig, ConfigLoadError>

export async function loadConfig(directory: string, log?: LogFn): Promise<ConfigLoadResult> {
  const config: BotConfig = {}
  const homeDir = process.env.HOME || process.env.USERPROFILE || ""

  const configPaths = [
    join(homeDir, ".config", "opencode", "telegram.json"),
    join(directory, ".opencode", "telegram.json"),
  ]

  log?.("debug", "Checking config file paths", { paths: configPaths })

  for (const configPath of configPaths) {
    const fileResult = await Result.tryPromise({
      try: async () => {
        const content = await readFile(configPath, "utf-8")
        return JSON.parse(content) as BotConfig
      },
      catch: (error) => new ConfigLoadError({ path: configPath, cause: error }),
    })

    if (fileResult.status === "ok") {
      Object.assign(config, fileResult.value)
      log?.("info", "Loaded config file", {
        path: configPath,
        keys: Object.keys(fileResult.value),
      })
    } else {
      log?.("debug", "Config file not found or invalid", {
        path: configPath,
        error: String(fileResult.error).slice(0, 100),
      })
    }
  }

  // Environment variables override file config
  const envOverrides: string[] = []

  if (process.env.TELEGRAM_BOT_TOKEN) {
    config.botToken = process.env.TELEGRAM_BOT_TOKEN
    envOverrides.push("TELEGRAM_BOT_TOKEN")
  }
  if (process.env.TELEGRAM_CHAT_ID) {
    config.chatId = process.env.TELEGRAM_CHAT_ID
    envOverrides.push("TELEGRAM_CHAT_ID")
  }
  if (process.env.TELEGRAM_THREAD_ID) {
    const parsed = Number(process.env.TELEGRAM_THREAD_ID)
    if (!Number.isNaN(parsed)) {
      config.threadId = parsed
      envOverrides.push("TELEGRAM_THREAD_ID")
    }
  }
  if (process.env.TELEGRAM_UPDATES_URL) {
    config.updatesUrl = process.env.TELEGRAM_UPDATES_URL
    envOverrides.push("TELEGRAM_UPDATES_URL")
  }
  if (process.env.TELEGRAM_SEND_URL) {
    config.sendUrl = process.env.TELEGRAM_SEND_URL
    envOverrides.push("TELEGRAM_SEND_URL")
  }

  // Schedule configuration
  if (process.env.SCHEDULE_START) {
    ;(config as Record<string, unknown>).scheduleStart = process.env.SCHEDULE_START
    envOverrides.push("SCHEDULE_START")
  }
  if (process.env.SCHEDULE_END) {
    ;(config as Record<string, unknown>).scheduleEnd = process.env.SCHEDULE_END
    envOverrides.push("SCHEDULE_END")
  }
  if (process.env.SCHEDULE_TIMEZONE) {
    ;(config as Record<string, unknown>).scheduleTimezone = process.env.SCHEDULE_TIMEZONE
    envOverrides.push("SCHEDULE_TIMEZONE")
  }
  if (process.env.SCHEDULE_MODE) {
    ;(config as Record<string, unknown>).scheduleMode = process.env.SCHEDULE_MODE
    envOverrides.push("SCHEDULE_MODE")
  }

  // Filter configuration
  if (process.env.FILTER_MODE) {
    ;(config as Record<string, unknown>).filterMode = process.env.FILTER_MODE
    envOverrides.push("FILTER_MODE")
  }
  if (process.env.FILTER_TOPICS) {
    ;(config as Record<string, unknown>).filterTopics = process.env.FILTER_TOPICS
    envOverrides.push("FILTER_TOPICS")
  }
  if (process.env.FILTER_KEYWORDS) {
    ;(config as Record<string, unknown>).filterKeywords = process.env.FILTER_KEYWORDS
    envOverrides.push("FILTER_KEYWORDS")
  }
  if (process.env.FILTER_REGEX) {
    ;(config as Record<string, unknown>).filterRegex = process.env.FILTER_REGEX
    envOverrides.push("FILTER_REGEX")
  }
  if (process.env.FILTER_ENABLED) {
    ;(config as Record<string, unknown>).filterEnabled = process.env.FILTER_ENABLED === "true"
    envOverrides.push("FILTER_ENABLED")
  }

  if (envOverrides.length > 0) {
    log?.("info", "Environment variable overrides applied", { variables: envOverrides })
  }

  return Result.ok(config)
}
