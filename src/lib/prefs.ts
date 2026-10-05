import type { PoliteEnding } from './phrases'

/** 端末だけに保存する設定。保存できない環境でも既定値で動く */
const KEYS = {
  ending: 'price-coach:polite-ending',
  cloudVoice: 'price-coach:cloud-voice',
} as const

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 保存できなくても動作は続ける
  }
}

export function loadEnding(): PoliteEnding {
  return read(KEYS.ending) === 'ka' ? 'ka' : 'krap'
}
export function saveEnding(ending: PoliteEnding): void {
  write(KEYS.ending, ending)
}

/** 音声を外部のサーバーに送って聞き取ることへの同意。未回答は null */
export function loadCloudVoiceConsent(): boolean | null {
  const v = read(KEYS.cloudVoice)
  return v === 'on' ? true : v === 'off' ? false : null
}
export function saveCloudVoiceConsent(on: boolean): void {
  write(KEYS.cloudVoice, on ? 'on' : 'off')
}
