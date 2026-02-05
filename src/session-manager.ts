import { createLogger, type Logger } from "./log"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"

const log = createLogger()

export interface SessionState {
  sessionId: string
  directory: string
  enabled: boolean
  startTime: string
  lastUpdateTime?: string
  telegramThreadId?: number
  title?: string
  filters?: FilterConfig
  manualOverride?: boolean
}

export interface FilterConfig {
  mode: "whitelist" | "blacklist"
  topics: string[]
  keywords: string[]
  regex?: string
}

export interface GlobalSettings {
  defaultScheduleStart?: string
  defaultScheduleEnd?: string
  defaultTimezone?: string
  defaultScheduleMode?: "auto" | "manual"
}

interface PersistedState {
  sessions: SessionState[]
  globalSettings: GlobalSettings
}

const STATE_DIR = `${process.env.HOME}/.opencode-mirror`
const STATE_FILE = `${STATE_DIR}/state.json`

export class SessionManager {
  private sessions: Map<string, SessionState>
  private globalSettings: GlobalSettings
  private logger: Logger

  constructor(logger?: Logger) {
    this.sessions = new Map()
    this.globalSettings = {}
    this.logger = logger || log
    this.loadState()
  }

  private loadState(): void {
    try {
      if (existsSync(STATE_FILE)) {
        const data = readFileSync(STATE_FILE, "utf-8")
        const parsed: PersistedState = JSON.parse(data)
        this.sessions = new Map(parsed.sessions.map(s => [s.sessionId, s]))
        this.globalSettings = parsed.globalSettings || {}
        this.logger("info", "Loaded session state", {
          sessionCount: this.sessions.size,
          globalSettings: this.globalSettings,
        })
      }
    } catch (error) {
      this.logger("error", "Failed to load session state", { error: String(error) })
    }
  }

  private saveState(): void {
    try {
      if (!existsSync(STATE_DIR)) {
        mkdirSync(STATE_DIR, { recursive: true })
      }
      const state: PersistedState = {
        sessions: Array.from(this.sessions.values()),
        globalSettings: this.globalSettings,
      }
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
    } catch (error) {
      this.logger("error", "Failed to save session state", { error: String(error) })
    }
  }

  startSession(
    sessionId: string,
    directory: string,
    telegramThreadId?: number,
    initialConfig?: Partial<SessionState>
  ): SessionState {
    const existing = this.sessions.get(sessionId)
    if (existing) {
      this.logger("info", "Resuming existing session", { sessionId })
      return existing
    }

    const session: SessionState = {
      sessionId,
      directory,
      enabled: true, // Default: start enabled
      startTime: new Date().toISOString(),
      telegramThreadId,
      title: initialConfig?.title,
      filters: initialConfig?.filters,
      manualOverride: false,
      ...initialConfig,
    }

    this.sessions.set(sessionId, session)
    this.saveState()

    this.logger("info", "Started new session", {
      sessionId,
      directory,
      telegramThreadId,
      enabled: session.enabled,
    })

    return session
  }

  stopSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId)
    if (deleted) {
      this.saveState()
      this.logger("info", "Stopped session", { sessionId })
    }
    return deleted
  }

  enableSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.enabled = true
    session.manualOverride = true
    session.lastUpdateTime = new Date().toISOString()
    this.saveState()

    this.logger("info", "Enabled session mirroring", { sessionId })
    return true
  }

  disableSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.enabled = false
    session.manualOverride = true
    session.lastUpdateTime = new Date().toISOString()
    this.saveState()

    this.logger("info", "Disabled session mirroring", { sessionId })
    return true
  }

  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId)
  }

  listSessions(): SessionState[] {
    return Array.from(this.sessions.values())
  }

  getActiveSessions(): SessionState[] {
    return this.listSessions().filter(s => s.enabled)
  }

  updateSessionTitle(sessionId: string, title: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.title = title
    session.lastUpdateTime = new Date().toISOString()
    this.saveState()
    return true
  }

  updateSessionFilters(sessionId: string, filters: FilterConfig): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.filters = filters
    session.lastUpdateTime = new Date().toISOString()
    this.saveState()
    return true
  }

  clearManualOverride(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.manualOverride = false
    this.saveState()
    return true
  }

  // Global settings
  getGlobalSettings(): GlobalSettings {
    return { ...this.globalSettings }
  }

  updateGlobalSettings(settings: Partial<GlobalSettings>): void {
    this.globalSettings = { ...this.globalSettings, ...settings }
    this.saveState()
  }

  // Convenience: Check if session should mirror
  shouldMirror(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false
    return session.enabled
  }
}

// Singleton instance for shared state
let globalSessionManager: SessionManager | null = null

export function getSessionManager(): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new SessionManager()
  }
  return globalSessionManager
}
