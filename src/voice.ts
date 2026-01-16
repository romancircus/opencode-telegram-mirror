import { Result, TaggedError } from "better-result"
import type { LogFn } from "./log"

export class VoiceTranscriptionError extends TaggedError("VoiceTranscriptionError")<{
  message: string
  cause?: unknown
}>() {}

export class NoApiKeyError extends TaggedError("NoApiKeyError")<{
  message: string
}>() {
  constructor() {
    super({ message: "No OPENAI_API_KEY set" })
  }
}

export type TranscriptionResult = Result<string, VoiceTranscriptionError | NoApiKeyError>

export function isVoiceTranscriptionAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY
}

export async function transcribeVoice(
  audioBuffer: ArrayBuffer,
  log?: LogFn
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return Result.err(new NoApiKeyError())
  }

  log?.("debug", "Transcribing voice message", { size: audioBuffer.byteLength })

  try {
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: "audio/ogg" })
    formData.append("file", blob, "voice.ogg")
    formData.append("model", "whisper-1")

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      log?.("error", "Whisper API error", { status: response.status, error: errorText })
      return Result.err(
        new VoiceTranscriptionError({
          message: `Whisper API error: ${response.status} - ${errorText}`,
        })
      )
    }

    const data = (await response.json()) as { text: string }
    log?.("info", "Voice transcription complete", { textLength: data.text.length })

    return Result.ok(data.text)
  } catch (error) {
    log?.("error", "Voice transcription failed", { error: String(error) })
    return Result.err(
      new VoiceTranscriptionError({
        message: `Transcription failed: ${String(error)}`,
        cause: error,
      })
    )
  }
}

export function getVoiceNotSupportedMessage(): string {
  return `Cannot transcribe voice message - no OPENAI_API_KEY set.

To enable voice message support:
1. Get an API key from https://platform.openai.com/api-keys
2. Add OPENAI_API_KEY to opencode-telegram-mirror's environment
3. Restart the bot and try again`
}
