#!/usr/bin/env bun
/**
 * Quick test for session title generation
 * Usage: bun run test/test-title-gen.ts
 * 
 * Requires OPENCODE_URL env var or will start its own server
 */

import { startServer, connectToServer, stopServer, type OpenCodeServer } from "../src/opencode"

type TitleResult =
  | { type: "unknown"; value: string }
  | { type: "title"; value: string }

async function generateSessionTitle(
  server: OpenCodeServer,
  userMessage: string
): Promise<TitleResult> {
  const tempSession = await server.client.session.create({ title: "title-gen" })

  if (!tempSession.data) {
    return { type: "unknown", value: "failed to create temp session" }
  }

  try {
    const response = await server.client.session.prompt({
      sessionID: tempSession.data.id,
      model: { providerID: "opencode", modelID: "glm-4.7-free" },
      system: `You generate short titles for coding sessions based on user messages.

If the message provides enough context to understand the task, respond with:
{"type":"title","value":"<title here>"}

If the message is just a branch name, file path, or lacks context to understand what the user wants to do, respond with:
{"type":"unknown","value":"<brief reason>"}

Title rules (when generating):
- max 50 characters
- summarize the user's intent
- one line, no quotes or colons
- if a Linear ticket ID exists in the message (e.g. APP-550, ENG-123), always prefix the title with it

Examples:
- "feat/add-login" -> {"type":"unknown","value":"branch name only, need task description"}
- "fix the auth bug in login.ts" -> {"type":"title","value":"Fix auth bug in login"}
- "src/components/Button.tsx" -> {"type":"unknown","value":"file path only, need task description"}
- "add dark mode toggle to settings" -> {"type":"title","value":"Add dark mode toggle to settings"}
- "APP-550: fix auth bug" -> {"type":"title","value":"APP-550: Fix auth bug"}
- "feat/APP-123-add-user-profile" -> {"type":"unknown","value":"branch name only, need task description"}
- "working on APP-123 to add user profiles" -> {"type":"title","value":"APP-123: Add user profiles"}
- "https://linear.app/team/issue/ENG-456/fix-button" -> {"type":"title","value":"ENG-456: Fix button"}

Respond with only valid JSON, nothing else.`,
      parts: [{ type: "text", text: userMessage }],
    })

    const textPart = response.data?.parts?.find(
      (p: { type: string }) => p.type === "text"
    ) as { type: "text"; text: string } | undefined
    const text = textPart?.text?.trim() || ""

    try {
      return JSON.parse(text) as TitleResult
    } catch {
      return { type: "title", value: text.slice(0, 50) }
    }
  } finally {
    await server.client.session.delete({ sessionID: tempSession.data.id })
  }
}

const testCases = [
  "feat/add-login",
  "fix the auth bug in login.ts",
  "src/components/Button.tsx",
  "add dark mode toggle to settings",
  "APP-550: fix auth bug",
  "feat/APP-123-add-user-profile",
  "working on APP-123 to add user profiles",
  "https://linear.app/team/issue/ENG-456/fix-button",
  "andrew/test-branch",
]

async function main() {
  const openCodeUrl = process.env.OPENCODE_URL
  let server: OpenCodeServer
  let startedServer = false

  if (openCodeUrl) {
    console.log(`Connecting to OpenCode at ${openCodeUrl}...`)
    const result = await connectToServer(openCodeUrl, process.cwd())
    if (result.status === "error") {
      console.error("Failed to connect:", result.error.message)
      process.exit(1)
    }
    server = result.value
  } else {
    console.log("Starting OpenCode server...")
    const result = await startServer(process.cwd())
    if (result.status === "error") {
      console.error("Failed to start:", result.error.message)
      process.exit(1)
    }
    server = result.value
    startedServer = true
  }

  console.log("\n=== Testing Title Generation ===\n")

  for (const testCase of testCases) {
    console.log(`Input: "${testCase}"`)
    try {
      const result = await generateSessionTitle(server, testCase)
      console.log(`Result: ${JSON.stringify(result)}`)
    } catch (err) {
      console.log(`Error: ${err}`)
    }
    console.log()
  }

  if (startedServer) {
    await stopServer()
  }
}

main().catch(console.error)
