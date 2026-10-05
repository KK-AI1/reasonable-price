/** 端末の音声合成・音声認識（docs/VOICE.md §4.1・§4.2）。録音は保存しない */

export type SpeakResult = 'started' | 'no-voice' | 'unsupported'

function findVoice(lang: string): SpeechSynthesisVoice | null | undefined {
  const voices = window.speechSynthesis.getVoices()
  // 一覧がまだ読み込まれていない端末では undefined（とりあえず言語指定で話してみる）
  if (voices.length === 0) return undefined
  const prefix = lang.split('-')[0]
  return voices.find((v) => v.lang.replace('_', '-') === lang) ?? voices.find((v) => v.lang.startsWith(prefix)) ?? null
}

/** タイ語で読み上げる。端末にタイ語の音声がなければ 'no-voice' */
export function speak(text: string, lang: string): SpeakResult {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 'unsupported'
  const voice = findVoice(lang)
  if (voice === null) return 'no-voice'
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  if (voice) u.voice = voice
  u.rate = 0.9 // 市場は騒がしいので、やや遅め・最大音量
  u.volume = 1
  window.speechSynthesis.speak(u)
  return 'started'
}

// ---- 音声認識 ----

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

export interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: RecognitionResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionCtor = new () => Recognition

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** 認識結果をつないで1つの文にする */
export function joinTranscript(e: RecognitionResultEvent): string {
  let text = ''
  for (let i = 0; i < e.results.length; i++) text += e.results[i][0]?.transcript ?? ''
  return text.trim()
}
