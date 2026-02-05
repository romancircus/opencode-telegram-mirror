import { createLogger, type Logger } from "./log"
import { getSessionManager } from "./session-manager"

const log = createLogger()

export interface ScheduleConfig {
  startTime: string
  endTime: string
  start: string
  end: string
  timezone: string
  mode: "auto" | "manual"
}

export class Scheduler {
  private config: ScheduleConfig
  private logger: Logger
  private sessionManager = getSessionManager()
  private stateDir: string

  constructor(config?: Partial<ScheduleConfig>, logger?: Logger, stateDir?: string) {
    this.logger = logger || log
    this.stateDir = stateDir || `${process.env.HOME}/.opencode-mirror`
    
    const startTime = config?.startTime || config?.start || process.env.SCHEDULE_START || "09:00"
    const endTime = config?.endTime || config?.end || process.env.SCHEDULE_END || "17:00"
    this.config = {
      startTime,
      endTime,
      start: startTime,
      end: endTime,
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

    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }

  shouldMirror(sessionId?: string): boolean {
    if (sessionId) {
      const session = this.sessionManager.getSession(sessionId)
      if (!session) {
        this.logger("warn", "Session not found", { sessionId })
        return false
      }

      if (!session.enabled) {
        return false
      }

      if (session.manualOverride && session.enabled) {
        return true
      }
    }

    if (this.config.mode === "auto") {
      return this.isWithinSchedule()
    }

    return true
  }

  updateSchedule(startTime: string, endTime: string): void {
    this.config.startTime = startTime
    this.config.endTime = endTime
    this.config.start = startTime
    this.config.end = endTime
    this.logger("info", "Schedule updated", this.config)
  }

  setMode(mode: "auto" | "manual"): void {
    this.config.mode = mode
    this.logger("info", "Schedule mode updated", { mode })

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

  getScheduleConfig(): ScheduleConfig {
    return this.getConfig()
  }

  getMode(): "auto" | "manual" {
    return this.config.mode
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
      let minutesUntilEnd = endMinutes - currentMinutes
      if (minutesUntilEnd <= 0) {
        minutesUntilEnd += 24 * 60
      }
      const hours = Math.floor(minutesUntilEnd / 60)
      const minutes = minutesUntilEnd % 60
      return `Schedule ends in ${hours}h ${minutes}m (${this.config.endTime})`
    } else {
      let minutesUntilStart = startMinutes - currentMinutes
      if (minutesUntilStart <= 0) {
        minutesUntilStart += 24 * 60
      }
      const hours = Math.floor(minutesUntilStart / 60)
      const minutes = minutesUntilStart % 60
      return `Schedule starts in ${hours}h ${minutes}m (${this.config.startTime})`
    }
  }

  async loadState(): Promise<void> {
    // Placeholder for state loading if needed
  }

  async saveState(): Promise<void> {
    // Placeholder for state saving if needed
  }
}

export function loadScheduleConfigFromEnv(): Partial<ScheduleConfig> {
  return {
    startTime: process.env.SCHEDULE_START || "09:00",
    endTime: process.env.SCHEDULE_END || "17:00",
    start: process.env.SCHEDULE_START || "09:00",
    end: process.env.SCHEDULE_END || "17:00",
    timezone: process.env.TIMEZONE || "America/Panama",
    mode: (process.env.SCHEDULE_MODE as "auto" | "manual") || "manual",
  }
}

let globalScheduler: Scheduler | null = null

export function getScheduler(config?: Partial<ScheduleConfig>): Scheduler {
  if (!globalScheduler) {
    globalScheduler = new Scheduler(config)
  }
  return globalScheduler
}
