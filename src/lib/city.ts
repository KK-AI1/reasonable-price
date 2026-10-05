import city from '../data/cities/bangkok.json'
import taxiTable from '../data/fares/bangkok-taxi.json'
import itemsJson from '../data/items/bangkok-items.json'
import phraseBook from '../data/phrases/th.json'
import type { PhraseBook } from './phrases'
import type { CoachConfig, Item, PriceConfig, TaxiConfig, TaxiFareTable, Venue } from './types'

/** MVP はバンコクのみ。データの読み込みをここにまとめる */
export const bangkok = city
export const bangkokTaxi = taxiTable as TaxiFareTable
export const bangkokTaxiConfig = city.taxi as TaxiConfig
export const bangkokItems = itemsJson.items as Item[]
export const bangkokVenues = city.venues as Venue[]
export const bangkokPriceConfig = city.price as PriceConfig
export const bangkokCoachConfig = city.coach as CoachConfig
export const thaiPhrases = phraseBook as PhraseBook
