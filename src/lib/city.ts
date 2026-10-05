import city from '../data/cities/bangkok.json'
import taxiTable from '../data/fares/bangkok-taxi.json'
import type { TaxiConfig, TaxiFareTable } from './types'

/** MVP はバンコクのみ。データの読み込みをここにまとめる */
export const bangkok = city
export const bangkokTaxi = taxiTable as TaxiFareTable
export const bangkokTaxiConfig = city.taxi as TaxiConfig
