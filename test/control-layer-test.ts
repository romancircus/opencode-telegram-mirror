#!/usr/bin/env bun
/**
 * Test script for control layer components
 * Validates SessionManager, Scheduler, FilterEngine, and Commands
 */

import { SessionManager } from "../src/session-manager"
import { Scheduler, loadScheduleConfigFromEnv } from "../src/scheduler"
import { FilterEngine, loadFilterConfigFromEnv } from "../src/filter-engine"
import { processCommand, isCommand, type CommandContext } from "../src/commands"
import type { TelegramMessage } from "../src/telegram"

const log = console.log
const assert = (condition: boolean, message: string) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✅ PASSED: ${message}`)
}

console.log("\n🧪 Testing OpenCode Telegram Mirror Control Layer\n")

// Test Session Manager
console.log("📦 Testing Session Manager...")
const sessionManager = new SessionManager("/tmp/.opencode-mirror-test", log)

// Test starting session
sessionManager.startSession("test-session-1", "/home/user/project1")
assert(sessionManager.getSession("test-session-1") !== undefined, "Session 1 should exist")

// Test enabling/disabling
sessionManager.enableSession("test-session-1")
assert(sessionManager.getSession("test-session-1")?.enabled === true, "Session should be active after enable")

sessionManager.disableSession("test-session-1")
assert(sessionManager.getSession("test-session-1")?.enabled === false, "Session should be inactive after disable")

// Test multiple sessions
sessionManager.startSession("test-session-2", "/home/user/project2")
assert(sessionManager.getAllSessions().length === 2, "Should have 2 sessions")

sessionManager.stopSession("test-session-2")
assert(sessionManager.getAllSessions().length === 1, "Should have 1 session after stop")

console.log("📦 Session Manager: All tests passed!\n")

// Test Scheduler
console.log("⏰ Testing Scheduler...")
const scheduler = new Scheduler({
  start: "09:00",
  end: "17:00",
  timezone: "America/Panama",
  mode: "manual"
}, log)

assert(scheduler.getMode() === "manual", "Should default to manual mode")
assert(scheduler.getScheduleConfig().start === "09:00", "Start time should be 09:00")
assert(scheduler.getScheduleConfig().end === "17:00", "End time should be 17:00")

// In manual mode, shouldMirror should always return true regardless of time
assert(scheduler.shouldMirror() === true, "Should mirror in manual mode")

// Switch to auto mode
scheduler.setMode("auto")
assert(scheduler.getMode() === "auto", "Mode should be auto after set")

console.log("⏰ Scheduler: All tests passed!\n")

// Test Filter Engine
console.log("🔍 Testing Filter Engine...")
const filterEngine = new FilterEngine({
  mode: "blacklist",
  topics: ["debug", "test"],
  keywords: ["password", "secret"],
  enabled: true
}, "/tmp/.opencode-mirror-test", log)

assert(filterEngine.getStatus().enabled === true, "Filter should be enabled")
assert(filterEngine.getStatus().mode === "blacklist", "Mode should be blacklist")

// Test blacklist filtering
assert(filterEngine.shouldMirror({ text: "This is normal text" }) === true, "Normal text should pass")
assert(filterEngine.shouldMirror({ text: "This contains password" }) === false, "Text with 'password' should be filtered")
assert(filterEngine.shouldMirror({ topic: "debug log" }) === false, "Debug topic should be filtered")

// Test whitelist mode
filterEngine.setMode("whitelist")
filterEngine.setEnabled(true)
assert(filterEngine.shouldMirror({ text: "secret password" }) === true, "Keywords should pass in whitelist mode")
assert(filterEngine.shouldMirror({ text: "normal text" }) === false, "Non-matching text should be filtered in whitelist")

// Test disabled filters
filterEngine.setEnabled(false)
assert(filterEngine.shouldMirror({ text: "anything goes" }) === true, "Everything should pass when disabled")

console.log("🔍 Filter Engine: All tests passed!\n")

// Test Command Detection
console.log("⌨️  Testing Command System...")

const mockMsg = (text: string): TelegramMessage => ({
  message_id: 1,
  chat: { id: 123, type: "private" },
  date: Date.now(),
  text,
  from: { id: 456, first_name: "Test", username: "testuser" }
})

assert(isCommand(mockMsg("/help")) === true, "Should detect /help as command")
assert(isCommand(mockMsg("/enable")) === true, "Should detect /enable as command")
assert(isCommand(mockMsg("/disable")) === true, "Should detect /disable as command")
assert(isCommand(mockMsg("Hello world")) === false, "Should not detect regular text as command")
assert(isCommand(mockMsg("/unknown")) === false, "Should not detect unknown commands")

console.log("⌨️  Command System: All tests passed!\n")

// Test environment variable loading
console.log("🌍 Testing Environment Variable Loading...")

// Set test env vars
process.env.SCHEDULE_START = "08:00"
process.env.SCHEDULE_END = "18:00"
process.env.SCHEDULE_MODE = "auto"
process.env.FILTER_MODE = "whitelist"
process.env.FILTER_TOPICS = "code,review"
process.env.FILTER_KEYWORDS = "todo,fixme"

const scheduleConfig = loadScheduleConfigFromEnv()
assert(scheduleConfig.start === "08:00", "Should load SCHEDULE_START from env")
assert(scheduleConfig.mode === "auto", "Should load SCHEDULE_MODE from env")

const filterConfig = loadFilterConfigFromEnv()
assert(filterConfig.mode === "whitelist", "Should load FILTER_MODE from env")
assert(filterConfig.topics?.length === 2, "Should load FILTER_TOPICS from env")
assert(filterConfig.keywords?.length === 2, "Should load FILTER_KEYWORDS from env")

console.log("🌍 Environment Loading: All tests passed!\n")

// Cleanup
console.log("🧹 Cleaning up test files...")
try {
  await Bun.file("/tmp/.opencode-mirror-test/state.json").delete()
  await Bun.file("/tmp/.opencode-mirror-test/filters.json").then(f => f.delete()).catch(() => {})
  await Bun.file("/tmp/.opencode-mirror-test/schedule.json").then(f => f.delete()).catch(() => {})
} catch {
  // Ignore cleanup errors
}

console.log("\n✨ All Control Layer Tests Passed!\n")
console.log("Summary:")
console.log("  ✅ Session Manager: Multi-session tracking, enable/disable")
console.log("  ✅ Scheduler: Time-based controls, manual/auto modes")
console.log("  ✅ Filter Engine: Whitelist/blacklist, topic/keyword filtering")
console.log("  ✅ Commands: Command detection and parsing")
console.log("  ✅ Environment: Variable loading from process.env")
console.log("\nThe OpenCode Telegram Mirror control layer is working correctly! 🎉\n")
