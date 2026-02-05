/**
 * Filter Engine for OpenCode → Telegram mirror
 * Controls what topics/keywords get mirrored
 */

import { Result, TaggedError } from "better-result"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { LogFn } from "./log"

export interface FilterConfig {
  mode: "whitelist" | "blacklist"
  topics: string[]
  keywords: string[]
  regex?: string
  enabled: boolean
}

export class FilterParseError extends TaggedError("FilterParseError")<{
  message: string
  cause?: unknown
}>() {}

export class FilterSaveError extends TaggedError("FilterSaveError")<{
  message: string
  cause?: unknown
}>() {}

export class FilterEngine {
  private config: FilterConfig
  private compiledRegex: RegExp | null = null
  private stateDir: string
  private log?: LogFn

  constructor(
    envConfig: Partial<FilterConfig> = {},
    stateDir: string = join(process.env.HOME || "/tmp", ".opencode-mirror"),
    log?: LogFn
  ) {
    this.stateDir = stateDir
    this.log = log

    this.config = {
      mode: envConfig.mode || "blacklist",
      topics: envConfig.topics || [],
      keywords: envConfig.keywords || [],
      regex: envConfig.regex,
      enabled: envConfig.enabled ?? false,
    }

    if (this.config.regex) {
      try {
        this.compiledRegex = new RegExp(this.config.regex, "i")
      } catch (e) {
        this.log?.("warn", "Invalid regex pattern, ignoring", { regex: this.config.regex })
        this.compiledRegex = null
      }
    }

    this.log?.("info", "FilterEngine initialized", {
      mode: this.config.mode,
      topicCount: this.config.topics.length,
      keywordCount: this.config.keywords.length,
      regex: this.config.regex ? "configured" : "none",
      enabled: this.config.enabled,
    })
  }

  /**
   * Determine if a message should be mirrored based on filters
   */
  shouldMirror(content: { topic?: string; text?: string; keywords?: string[] }): boolean {
    if (!this.config.enabled) {
      return true
    }

    const { topic, text, keywords = [] } = content
    const textToCheck = text || ""
    const topicToCheck = topic || ""

    // Check regex match
    if (this.compiledRegex && this.compiledRegex.test(textToCheck)) {
      return this.config.mode === "whitelist"
    }

    // Check topic match
    const topicMatch = this.config.topics.some(
      (t) => topicToCheck.toLowerCase().includes(t.toLowerCase())
    )

    // Check keyword match in content text
    const keywordMatchInText = this.config.keywords.some(
      (kw) => textToCheck.toLowerCase().includes(kw.toLowerCase())
    )

    // Check keyword match in provided keywords
    const keywordMatchInKeywords = keywords.some((kw) =>
      this.config.keywords.some((filterKw) => kw.toLowerCase().includes(filterKw.toLowerCase()))
    )

    const anyMatch = topicMatch || keywordMatchInText || keywordMatchInKeywords

    if (this.config.mode === "whitelist") {
      return anyMatch
    } else {
      return !anyMatch
    }
  }

  /**
   * Add a topic to the filter list
   */
  addTopic(topic: string): void {
    const normalized = topic.toLowerCase().trim()
    if (!this.config.topics.includes(normalized)) {
      this.config.topics.push(normalized)
      this.log?.("info", "Added topic to filter", { topic: normalized })
    }
  }

  /**
   * Remove a topic from the filter list
   */
  removeTopic(topic: string): void {
    const normalized = topic.toLowerCase().trim()
    this.config.topics = this.config.topics.filter((t) => t !== normalized)
    this.log?.("info", "Removed topic from filter", { topic: normalized })
  }

  /**
   * Add a keyword to the filter list
   */
  addKeyword(keyword: string): void {
    const normalized = keyword.toLowerCase().trim()
    if (!this.config.keywords.includes(normalized)) {
      this.config.keywords.push(normalized)
      this.log?.("info", "Added keyword to filter", { keyword: normalized })
    }
  }

  /**
   * Remove a keyword from the filter list
   */
  removeKeyword(keyword: string): void {
    const normalized = keyword.toLowerCase().trim()
    this.config.keywords = this.config.keywords.filter((k) => k !== normalized)
    this.log?.("info", "Removed keyword from filter", { keyword: normalized })
  }

  /**
   * Set the filter mode (whitelist/blacklist)
   */
  setMode(mode: "whitelist" | "blacklist"): void {
    this.config.mode = mode
    this.log?.("info", "Filter mode changed", { mode })
  }

  /**
   * Enable/disable filtering
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    this.log?.("info", "Filter enabled state changed", { enabled })
  }

  /**
   * Set regex pattern
   */
  setRegex(pattern: string | undefined): Result<void, FilterParseError> {
    if (!pattern) {
      this.config.regex = undefined
      this.compiledRegex = null
      return Result.ok(undefined)
    }

    try {
      this.compiledRegex = new RegExp(pattern, "i")
      this.config.regex = pattern
      return Result.ok(undefined)
    } catch (e) {
      return Result.err(
        new FilterParseError({
          message: `Invalid regex pattern: ${pattern}`,
          cause: e,
        })
      )
    }
  }

  /**
   * Get current filter status
   */
  getStatus(): FilterConfig {
    return { ...this.config }
  }

  /**
   * Reset all filters to empty
   */
  resetFilters(): void {
    this.config.topics = []
    this.config.keywords = []
    this.config.regex = undefined
    this.compiledRegex = null
    this.log?.("info", "All filters reset")
  }

  /**
   * Save filter state to disk
   */
  async saveState(): Promise<Result<void, FilterSaveError>> {
    try {
      const stateFile = join(this.stateDir, "filters.json")
      await writeFile(stateFile, JSON.stringify(this.config, null, 2), "utf-8")
      this.log?.("debug", "Filter state saved", { path: stateFile })
      return Result.ok(undefined)
    } catch (e) {
      return Result.err(
        new FilterSaveError({
          message: "Failed to save filter state",
          cause: e,
        })
      )
    }
  }

  /**
   * Load filter state from disk
   */
  async loadState(): Promise<Result<void, FilterParseError>> {
    try {
      const stateFile = join(this.stateDir, "filters.json")
      const content = await readFile(stateFile, "utf-8")
      const loaded = JSON.parse(content) as FilterConfig

      this.config = {
        ...loaded,
        topics: loaded.topics || [],
        keywords: loaded.keywords || [],
      }

      if (this.config.regex) {
        try {
          this.compiledRegex = new RegExp(this.config.regex, "i")
        } catch (e) {
          this.compiledRegex = null
          this.log?.("warn", "Loaded invalid regex, cleared", { regex: this.config.regex })
          this.config.regex = undefined
        }
      }

      this.log?.("info", "Filter state loaded", {
        mode: this.config.mode,
        topicCount: this.config.topics.length,
        keywordCount: this.config.keywords.length,
      })

      return Result.ok(undefined)
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        this.log?.("debug", "No saved filter state found, using defaults")
        return Result.ok(undefined)
      }
      return Result.err(
        new FilterParseError({
          message: "Failed to load filter state",
          cause: e,
        })
      )
    }
  }

  /**
   * Get formatted status for display
   */
  getFormattedStatus(): string {
    if (!this.config.enabled) {
      return "🚫 Filters disabled (mirroring everything)"
    }

    const mode = this.config.mode === "whitelist" ? "✅ Whitelist" : "🚫 Blacklist"
    const topics = this.config.topics.length > 0 ? this.config.topics.join(", ") : "(none)"
    const keywords = this.config.keywords.length > 0 ? this.config.keywords.join(", ") : "(none)"
    const regex = this.config.regex || "(none)"

    return `${mode} mode\n📁 Topics: ${topics}\n🔑 Keywords: ${keywords}\n📝 Regex: ${regex}`
  }
}

/**
 * Load filter configuration from environment
 */
export function loadFilterConfigFromEnv(): Partial<FilterConfig> {
  const config: Partial<FilterConfig> = {}

  if (process.env.FILTER_MODE) {
    const mode = process.env.FILTER_MODE.toLowerCase()
    if (mode === "whitelist" || mode === "blacklist") {
      config.mode = mode
    }
  }

  if (process.env.FILTER_TOPICS) {
    config.topics = process.env.FILTER_TOPICS.split(",").map((t) => t.trim().toLowerCase())
  }

  if (process.env.FILTER_KEYWORDS) {
    config.keywords = process.env.FILTER_KEYWORDS.split(",").map((k) => k.trim().toLowerCase())
  }

  if (process.env.FILTER_REGEX) {
    config.regex = process.env.FILTER_REGEX
  }

  config.enabled = process.env.FILTER_ENABLED === "true"

  return config
}

// Singleton instance
let filterEngineInstance: FilterEngine | null = null

export function getFilterEngine(
  envConfig?: Partial<FilterConfig>,
  stateDir?: string,
  log?: LogFn
): FilterEngine {
  if (!filterEngineInstance) {
    filterEngineInstance = new FilterEngine(envConfig, stateDir, log)
  }
  return filterEngineInstance
}

export function resetFilterEngine(): void {
  filterEngineInstance = null
}
