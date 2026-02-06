/**
 * Natural Language Handoff Detector
 *
 * Detects when the user wants to switch between OpenCode and Telegram
 * using natural language phrases instead of commands.
 */

export interface HandoffIntent {
	type: "to_telegram" | "to_opencode" | "none"
	confidence: number
	matchedPhrase?: string
}

// Phrases that indicate the user wants to continue on Telegram (away from OpenCode)
const TO_TELEGRAM_PATTERNS = [
	// Direct handoff phrases
	{ pattern: /continue on telegram/i, confidence: 0.95 },
	{ pattern: /switch to telegram/i, confidence: 0.95 },
	{ pattern: /move to telegram/i, confidence: 0.95 },
	{ pattern: /pick up on telegram/i, confidence: 0.95 },
	{ pattern: /take this to telegram/i, confidence: 0.95 },
	{ pattern: /continue on my phone/i, confidence: 0.9 },
	{ pattern: /switch to my phone/i, confidence: 0.9 },
	{ pattern: /i need to go/i, confidence: 0.85 },
	{ pattern: /i have to run/i, confidence: 0.85 },
	{ pattern: /i'm heading out/i, confidence: 0.85 },
	{ pattern: /i'll be back/i, confidence: 0.8 },
	{ pattern: /continue on mobile/i, confidence: 0.9 },
	{ pattern: /let me grab my phone/i, confidence: 0.85 },
	{ pattern: /i need to step away/i, confidence: 0.8 },
	{ pattern: /brb/i, confidence: 0.75 },
	{ pattern: /be right back/i, confidence: 0.8 },
	{ pattern: /going to pick up/i, confidence: 0.8 },
	{ pattern: /switch to the app/i, confidence: 0.85 },
	{ pattern: /move to the app/i, confidence: 0.85 },
	{ pattern: /let's continue on telegram/i, confidence: 0.95 },
	{ pattern: /take it to telegram/i, confidence: 0.95 },
	{ pattern: /going mobile/i, confidence: 0.8 },
	{ pattern: /heading out now/i, confidence: 0.8 },
	{ pattern: /need to head out/i, confidence: 0.8 },
	{ pattern: /continue this on my phone/i, confidence: 0.9 },
	{ pattern: /switch to phone/i, confidence: 0.9 },
	{ pattern: /pick up damien/i, confidence: 0.75 },
	{ pattern: /gotta go/i, confidence: 0.75 },
	{ pattern: /gtg/i, confidence: 0.7 },
	{ pattern: /running late/i, confidence: 0.7 },
	{ pattern: /time to go/i, confidence: 0.75 },
]

// Phrases that indicate the user wants to return to OpenCode
const TO_OPENCODE_PATTERNS = [
	{ pattern: /back on opencode/i, confidence: 0.95 },
	{ pattern: /back on computer/i, confidence: 0.9 },
	{ pattern: /back at my desk/i, confidence: 0.9 },
	{ pattern: /i'm back/i, confidence: 0.85 },
	{ pattern: /back to work/i, confidence: 0.85 },
	{ pattern: /back on the desktop/i, confidence: 0.9 },
	{ pattern: /continue here/i, confidence: 0.8 },
	{ pattern: /back in the editor/i, confidence: 0.85 },
	{ pattern: /switch back to opencode/i, confidence: 0.95 },
	{ pattern: /return to opencode/i, confidence: 0.95 },
	{ pattern: /back to the code/i, confidence: 0.85 },
	{ pattern: /resume on opencode/i, confidence: 0.9 },
	{ pattern: /continue on opencode/i, confidence: 0.95 },
	{ pattern: /i'm at my computer/i, confidence: 0.85 },
	{ pattern: /back on laptop/i, confidence: 0.85 },
	{ pattern: /back to coding/i, confidence: 0.85 },
	{ pattern: /ready to continue/i, confidence: 0.75 },
	{ pattern: /let's continue here/i, confidence: 0.8 },
	{ pattern: /back from break/i, confidence: 0.75 },
	{ pattern: /picked up damien/i, confidence: 0.7 },
]

/**
 * Detect if a message contains a handoff intent
 */
export function detectHandoffIntent(message: string): HandoffIntent {
	// Check for Telegram handoff patterns
	for (const { pattern, confidence } of TO_TELEGRAM_PATTERNS) {
		if (pattern.test(message)) {
			return {
				type: "to_telegram",
				confidence,
				matchedPhrase: message.match(pattern)?.[0],
			}
		}
	}

	// Check for OpenCode return patterns
	for (const { pattern, confidence } of TO_OPENCODE_PATTERNS) {
		if (pattern.test(message)) {
			return {
				type: "to_opencode",
				confidence,
				matchedPhrase: message.match(pattern)?.[0],
			}
		}
	}

	return { type: "none", confidence: 0 }
}

/**
 * Check if a message is a handoff trigger (confidence above threshold)
 */
export function isHandoffTrigger(message: string, threshold = 0.75): boolean {
	const intent = detectHandoffIntent(message)
	return intent.type !== "none" && intent.confidence >= threshold
}

/**
 * Get a context summary for handoff messages
 */
export function getHandoffContext(
	currentTask: string | null,
	lastMessage: string | null
): string {
	if (currentTask) {
		return `Continuing: ${currentTask}`
	}
	if (lastMessage) {
		const preview = lastMessage.slice(0, 100)
		return `Last: ${preview}${lastMessage.length > 100 ? "..." : ""}`
	}
	return "Continuing our conversation"
}
