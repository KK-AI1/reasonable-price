import city from '../data/cities/bangkok.json'
import taxiTable from '../data/fares/bangkok-taxi.json'
import phraseBook from '../data/phrases/th.json'
import type { PhraseBook } from './phrases'
import type { CoachConfig, Item, PriceConfig, TaxiConfig, TaxiFareTable, Venue } from './types'

/** MVP はバンコクのみ。データの読み込みをここにまとめる */
export const bangkok = city
export const bangkokTaxi = taxiTable as TaxiFareTable
export const bangkokTaxiConfig = city.taxi as TaxiConfig
/** 品目データは画面を開いたときに読み込む（読み込み中・失敗の状態を区別するため） */
export async function loadBangkokItems(): Promise<Item[]> {
  const mod = await import('../data/items/bangkok-items.json')
  return mod.default.items as Item[]
}
export const bangkokVenues = city.venues as Venue[]
export const bangkokPriceConfig = city.price as PriceConfig
export const bangkokCoachConfig = city.coach as CoachConfig
export const thaiPhrases = phraseBook as PhraseBook

/** 市場を選んでいないときに使う「都市全体」。係数 1.0（一般の市場と同じ基準）で計算し、画面では都市全体の記録として表示する */
export const cityWideVenue: Venue = { id: 'city', name: `${city.name}全体`, factor: 1, negotiable: true }

export function resolveVenue(venueId: string | null): Venue {
  return (venueId && bangkokVenues.find((v) => v.id === venueId)) || cityWideVenue
}

/** 画面に出す売り場名（括弧内の例は省く） */
export function venueLabel(venueId: string | null): string {
  return venueId === null ? `${city.name}全体（市場は未選択）` : `${city.name} / ${resolveVenue(venueId).name.replace(/（.*）/, '')}`
}
