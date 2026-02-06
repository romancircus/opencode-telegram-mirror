/**
 * Command handlers for OpenCode → Telegram mirror
 * Provides control commands via Telegram messages
 */

import type { FilterEngine } from "./filter-engine"
import type { LogFn } from "./log"
import { Scheduler } from "./scheduler"
import { SessionManager, SessionState } from "./session-manager"
import type { TelegramMessage } from "./telegram"

export interface CommandContext {
  sessionManager: SessionManager
  scheduler: Scheduler
  filterEngine: FilterEngine
  sessionId: string
  workingDir: string
  log?: LogFn
}

export interface CommandResult {
  success: boolean
  message: string
  shouldMirror?: boolean
}

type CommandHandler = (args: string[], context: CommandContext) => CommandResult | Promise<CommandResult>

const commands: Map<string, CommandHandler> = new Map()

/**
 * Register a command handler
 */
function registerCommand(name: string, handler: CommandHandler): void {
  commands.set(name.toLowerCase(), handler)
}

/**
 * Enable mirroring for current session
 */
registerCommand("enable", (_args, context): CommandResult => {
  const session = context.sessionManager.getSession(context.sessionId)
  if (!session) {
    context.sessionManager.startSession(context.sessionId, context.workingDir)
  }
  context.sessionManager.enableSession(context.sessionId)
  
  return {
    success: true,
    message: "✅ Mirroring enabled for this session",
    shouldMirror: true,
  }
})

/**
 * Disable mirroring for current session
 */
registerCommand("disable", (_args, context): CommandResult => {
  context.sessionManager.disableSession(context.sessionId)
  
  return {
    success: true,
    message: "🚫 Mirroring disabled for this session\n\nTo resume, type /enable",
    shouldMirror: false,
  }
})

/**
 * List all active mirror sessions
 */
registerCommand("session", (args, context): CommandResult => {
  const subcommand = args[0]?.toLowerCase()
  const sessions = context.sessionManager.listSessions()

  if (!subcommand || subcommand === "list") {
    if (sessions.length === 0) {
      return {
        success: true,
        message: "📋 No active mirror sessions",
      }
    }

    const sessionList = sessions
      .map((s, i) => {
        const status = s.enabled ? "🟢" : "🔴"
        const current = s.sessionId === context.sessionId ? " ← you are here" : ""
        return `${i + 1}. ${status} ${s.sessionId.slice(0, 8)}... (${s.directory.split("/").pop()})${current}`
      })
      .join("\n")

    return {
      success: true,
      message: `📋 Active mirror sessions:\n\n${sessionList}\n\nCommands:\n/session switch <number> - switch focus\n/session stop <number> - stop session`,
    }
  }

  if (subcommand === "switch") {
    const index = parseInt(args[1]) - 1
    if (isNaN(index) || index < 0 || index >= sessions.length) {
      return {
        success: false,
        message: "❌ Invalid session number. Use /session list to see available sessions",
      }
    }

    const targetSession = sessions[index]
    return {
      success: true,
      message: `🔄 Switched to session ${targetSession.sessionId.slice(0, 8)}...\n\nWorking dir: ${targetSession.directory}`,
    }
  }

  if (subcommand === "stop") {
    const index = parseInt(args[1]) - 1
    if (isNaN(index) || index < 0 || index >= sessions.length) {
      return {
        success: false,
        message: "❌ Invalid session number. Use /session list to see available sessions",
      }
    }

    const targetSession = sessions[index]
    context.sessionManager.stopSession(targetSession.sessionId)

    return {
      success: true,
      message: `🛑 Stopped session ${targetSession.sessionId.slice(0, 8)}...`,
    }
  }

  return {
    success: false,
    message: "❌ Unknown session command. Try: list, switch, stop",
  }
})

/**
 * Schedule commands
 */
registerCommand("schedule", (args, context): CommandResult => {
  const subcommand = args[0]?.toLowerCase()

  if (!subcommand || subcommand === "status") {
    const config = context.scheduler.getConfig()
    const mode = context.scheduler.getMode()
    const withinSchedule = context.scheduler.isWithinSchedule()

    return {
      success: true,
      message:
        `⏰ Schedule Configuration\n\n` +
        `Mode: ${mode === "auto" ? "📅 Automatic" : "👤 Manual"}\n` +
        `Schedule: ${config.start} - ${config.end}\n` +
        `Timezone: ${config.timezone}\n` +
        `Currently in schedule: ${withinSchedule ? "✅ Yes" : "❌ No"}\n\n` +
        `Commands:\n` +
        `/schedule set <start> <end> - update times (e.g., 09:00 17:00)\n` +
        `/schedule mode <auto|manual> - change mode`,
    }
  }

  if (subcommand === "set") {
    const start = args[1]
    const end = args[2]

    if (!start || !end) {
      return {
        success: false,
        message: "❌ Usage: /schedule set <start> <end>\nExample: /schedule set 09:00 17:00",
      }
    }

    context.scheduler.updateSchedule(start, end)

    return {
      success: true,
      message: `✅ Schedule updated: ${start} - ${end}`,
    }
  }

  if (subcommand === "mode") {
    const mode = args[1]?.toLowerCase()
    if (mode !== "auto" && mode !== "manual") {
      return {
        success: false,
        message: "❌ Usage: /schedule mode <auto|manual>",
      }
    }

    context.scheduler.setMode(mode)

    return {
      success: true,
      message: `✅ Schedule mode set to: ${mode === "auto" ? "📅 Automatic" : "👤 Manual"}`,
    }
  }

  return {
    success: false,
    message: "❌ Unknown schedule command. Try: status, set, mode",
  }
})

/**
 * Filter commands
 */
registerCommand("filter", (args, context): CommandResult => {
  const subcommand = args[0]?.toLowerCase()

  if (!subcommand || subcommand === "status") {
    return {
      success: true,
      message: `🔍 Filter Status:\n\n${context.filterEngine.getFormattedStatus()}`,
    }
  }

  if (subcommand === "enable") {
    context.filterEngine.setEnabled(true)
    context.filterEngine.saveState()
    return {
      success: true,
      message: "✅ Filters enabled",
    }
  }

  if (subcommand === "disable") {
    context.filterEngine.setEnabled(false)
    context.filterEngine.saveState()
    return {
      success: true,
      message: "🚫 Filters disabled (mirroring everything)",
    }
  }

  if (subcommand === "add") {
    const type = args[1]?.toLowerCase()
    const value = args.slice(2).join(" ")

    if (!type || !value) {
      return {
        success: false,
        message: "❌ Usage: /filter add <topic|keyword> <value>",
      }
    }

    if (type === "topic") {
      context.filterEngine.addTopic(value)
    } else if (type === "keyword") {
      context.filterEngine.addKeyword(value)
    } else {
      return {
        success: false,
        message: "❌ Type must be 'topic' or 'keyword'",
      }
    }

    context.filterEngine.saveState()
    return {
      success: true,
      message: `✅ Added ${type}: "${value}"`,
    }
  }

  if (subcommand === "remove") {
    const type = args[1]?.toLowerCase()
    const value = args.slice(2).join(" ")

    if (!type || !value) {
      return {
        success: false,
        message: "❌ Usage: /filter remove <topic|keyword> <value>",
      }
    }

    if (type === "topic") {
      context.filterEngine.removeTopic(value)
    } else if (type === "keyword") {
      context.filterEngine.removeKeyword(value)
    } else {
      return {
        success: false,
        message: "❌ Type must be 'topic' or 'keyword'",
      }
    }

    context.filterEngine.saveState()
    return {
      success: true,
      message: `✅ Removed ${type}: "${value}"`,
    }
  }

  if (subcommand === "mode") {
    const mode = args[1]?.toLowerCase()
    if (mode !== "whitelist" && mode !== "blacklist") {
      return {
        success: false,
        message: "❌ Usage: /filter mode <whitelist|blacklist>",
      }
    }

    context.filterEngine.setMode(mode)
    context.filterEngine.saveState()
    return {
      success: true,
      message: `✅ Filter mode set to: ${mode}`,
    }
  }

  if (subcommand === "reset") {
    context.filterEngine.resetFilters()
    context.filterEngine.saveState()
    return {
      success: true,
      message: "🗑️ All filters reset",
    }
  }

  return {
    success: false,
    message: "❌ Unknown filter command. Try: status, enable, disable, add, remove, mode, reset",
  }
})

/**
 * Help command
 */
registerCommand("help", (_args): CommandResult => {
  return {
    success: true,
    message:
      `🤖 OpenCode Telegram Mirror Commands\n\n` +
      `Session Control:\n` +
      `/enable - Start mirroring this session\n` +
      `/disable - Stop mirroring this session\n` +
      `/session list - Show all mirror sessions\n` +
      `/session switch <n> - Switch to different session\n` +
      `/session stop <n> - Stop a specific session\n\n` +
      `Schedule:\n` +
      `/schedule status - Show schedule config\n` +
      `/schedule set <start> <end> - Update times\n` +
      `/schedule mode <auto|manual> - Change mode\n\n` +
      `Filters:\n` +
      `/filter status - Show filter status\n` +
      `/filter enable - Enable filtering\n` +
      `/filter disable - Disable filtering\n` +
      `/filter add <topic|keyword> <value> - Add filter\n` +
      `/filter remove <topic|keyword> <value> - Remove filter\n` +
      `/filter mode <whitelist|blacklist> - Set mode\n` +
      `/filter reset - Clear all filters\n\n` +
      `Other:\n` +
      `/fresh - Start a fresh session (reset context)\n` +
      `/help - Show this message`,
  }
})

/**
 * Process an incoming Telegram command
 */
export async function processCommand(
  message: TelegramMessage,
  context: CommandContext
): Promise<CommandResult | null> {
  const text = message.text || ""
  
  if (!text.startsWith("/")) {
    return null
  }

  const parts = text.slice(1).split(" ")
  const command = parts[0].toLowerCase()
  const args = parts.slice(1)

  const handler = commands.get(command)
  if (!handler) {
    return null
  }

  context.log?.("info", "Processing command", { command, args, sessionId: context.sessionId })

  try {
    const result = await handler(args, context)
    return result
  } catch (error) {
    context.log?.("error", "Command failed", { command, error: String(error) })
    return {
      success: false,
      message: `❌ Command failed: ${error}`,
    }
  }
}

/**
 * Check if a message is a command
 */
export function isCommand(message: TelegramMessage): boolean {
  const text = message.text || ""
  if (!text.startsWith("/")) {
    return false
  }

  const command = text.slice(1).split(" ")[0].toLowerCase()
  return commands.has(command)
}

/**
 * Get list of available commands
 */
export function getAvailableCommands(): string[] {
  return Array.from(commands.keys())
}
