import { createLogger, type Logger } from "./log"
import { getSessionManager } from "./session-manager"

const log = createLogger()

export interface ScheduleConfig {
  startTime: string      // "09:00"
  endTime: string        // "17:00"
  timezone: string       // "America/Panama"
  mode: "auto" | "manual"
}

export class Scheduler {
  private config: ScheduleConfig
  private logger: Logger
  private sessionManager = getSessionManager()

  constructor(config?: Partial<ScheduleConfig>, logger?: Logger) {
    this.logger = logger || log
    
    // Load from environment or use defaults
    this.config = {
      startTime: config?.startTime || process.env.SCHEDULE_START || "09:00",
      endTime: config?.endTime || process.env.SCHEDULE_END || "17:00",
      timezone: config?.timezone || process.env.TIMEZONE || "America/Panama",
      mode: config?.mode || (process.env.SCHEDULE_MODE as "auto" | "manual") || "manual",
    }

    this.logger("info", "Scheduler initialized", this.config)
  }

  private parseTime(timeStr: string): { hour: number; minute: number } {
    const [hourStr, minuteStr] = timeStr.split(":")
    return {
      hour: Number.parseInt(hourStr, 10),
      minute: Number.parseInt(minuteStr, 10),
    }
  }

  private getCurrentTimeInTimezone(): Date {
    // Use the system's local time for now (can be enhanced with proper timezone handling)
    return new Date()
  }

  private getMinutesSinceMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes()
  }

  isWithinSchedule(): boolean {
    const now = this.getCurrentTimeInTimezone()
    const currentMinutes = this.getMinutesSinceMidnight(now)
    
    const start = this.parseTime(this.config.startTime)
    const end = this.parseTime(this.config.endTime)
    const startMinutes = start.hour * 60 + start.minute
    const endMinutes = end.hour * 60 + end.minute

    // Handle crossing midnight (e.g., 22:00 to 06:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }

  shouldMirror(sessionId: string): boolean {
    const session = this.sessionManager.getSession(sessionId)
    if (!session) {
      this.logger("warn", "Session not found", { sessionId })
      return false
    }

    // If manually disabled, always respect that
    if (!session.enabled) {
      return false
    }

    // If manually enabled (override), respect that regardless of schedule
    if (session.manualOverride && session.enabled) {
      return true
    }

    // In auto mode, check schedule
    if (this.config.mode === "auto") {
      return this.isWithinSchedule()
    }

    // In manual mode, mirror is enabled by default (user controls via /enable /disable)
    return session.enabled
  }

  updateSchedule(startTime: string, endTime: string): void {
    this.config.startTime = startTime
    this.config.endTime = endTime
    this.logger("info", "Schedule updated", this.config)
  }

  setMode(mode: "auto" | "manual"): void {
    this.config.mode = mode
    this.logger("info", "Schedule mode updated", { mode })

    // Clear manual overrides when switching to auto mode
    if (mode === "auto") {
      const sessions = this.sessionManager.listSessions()
      for (const session of sessions) {
        this.sessionManager.clearManualOverride(session.sessionId)
      }
    }
  }

  setTimezone(timezone: string): void {
    this.config.timezone = timezone
    this.logger("info", "Timezone updated", { timezone })
  }

  getConfig(): ScheduleConfig {
    return { ...this.config }
  }

  getStatus(): string {
    const inSchedule = this.isWithinSchedule()
    const nextChange = this.getNextScheduleChange()
    
    return `Mode: ${this.config.mode}
Schedule: ${this.config.startTime} - ${this.config.endTime} (${this.config.timezone})
Currently in schedule: ${inSchedule ? "✅ Yes" : "❌ No"}
Next change: ${nextChange}`
  }

  private getNextScheduleChange(): string {
    const now = this.getCurrentTimeInTimezone()
    const currentMinutes = this.getMinutesSinceMidnight(now)
    const start = this.parseTime(this.config.startTime)
    const end = this.parseTime(this.config.endTime)
    const startMinutes = start.hour * 60 + start.minute
    const endMinutes = end.hour * 60 + end.minute

    const isInSchedule = this.isWithinSchedule()

    if (isInSchedule) {
      // Currently in schedule, next change is end time
      let minutesUntilEnd = endMinutes - currentMinutes
      if (minutesUntilEnd <= 0) {
        minutesUntilEnd += 24 * 60 // Add a day
      }
      const hours = Math.floor(minutesUntilEnd / 60)
      const minutes = minutesUntilEnd % 60
      return `Schedule ends in ${hours}h ${minutes}m (${this.config.endTime})`
    } else {
      // Not in schedule, next change is start time
      let minutesUntilStart = startMinutes - currentMinutes
      if (minutesUntilStart <= 0) {
        minutesUntilStart += 24 * 60 // Add a day
      }
      const hours = Math.floor(minutesUntilStart / 60)
      const minutes = minutesUntilStart % 60
      return `Schedule starts in ${hours}h ${minutes}m (${this.config.startTime})`
    }
  }
}

// Singleton instance
let globalScheduler: Scheduler | null = null

export function getScheduler(config?: Partial<ScheduleConfig>): Scheduler {
  if (!globalScheduler) {
    globalScheduler = new Scheduler(config)
  }
  return globalScheduler
}
