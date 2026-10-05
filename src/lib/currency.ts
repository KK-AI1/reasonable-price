export interface ExchangeConfig {
  jpyPerUnit: number
  roundToYen: number
}

/** 現地通貨の整数額を円に換算し、表示用に丸める */
export function toYen(amount: number, exchange: ExchangeConfig): number {
  const yen = amount * exchange.jpyPerUnit
  return Math.round(yen / exchange.roundToYen) * exchange.roundToYen
}
