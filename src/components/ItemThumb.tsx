import type { LucideIcon } from 'lucide-react'
import {
  Coffee,
  Flower2,
  Footprints,
  Gift,
  Glasses,
  KeyRound,
  Leaf,
  Magnet,
  Package,
  Shirt,
  ShoppingBag,
  Soup,
  Sparkles,
  Sun,
  TreeDeciduous,
  Wallet,
  Watch,
  Wind,
} from 'lucide-react'

// 商品写真の代わりのアイコン（写真は権利の確認できたものを用意してから差し替える）
const icons: Record<string, LucideIcon> = {
  'elephant-pants': Shirt,
  't-shirt': Shirt,
  'muay-thai-shorts': Shirt,
  'elephant-dress': Shirt,
  'bucket-hat': Sun,
  'nanyang-sandals': Footprints,
  scarf: Wind,
  'silk-scarf-real': Sparkles,
  'coin-purse': Wallet,
  'elephant-plush': Gift,
  keychain: KeyRound,
  magnet: Magnet,
  'wood-carving': TreeDeciduous,
  'coconut-bowl': Soup,
  benjarong: Coffee,
  'woven-bag': ShoppingBag,
  soap: Flower2,
  yadom: Leaf,
  'thai-tea': Coffee,
  'dried-mango': Package,
  'brand-style-bag': ShoppingBag,
  'brand-style-wallet': Wallet,
  'brand-style-watch': Watch,
  'brand-style-sneakers': Footprints,
  sunglasses: Glasses,
}

/** 商品写真。登録された写真がまだないため、分類のアイコンを「写真なし」の代わりに表示する */
export function ItemThumb({ id, name, size = 'lg' }: { id: string; name: string; size?: 'lg' | 'sm' }) {
  const Icon = icons[id] ?? Package
  const box = size === 'lg' ? 'h-20 w-20' : 'h-12 w-12'
  return (
    <span
      role="img"
      aria-label={`${name}（写真なし）`}
      className={`relative flex shrink-0 flex-col items-center justify-center rounded-button bg-brand-soft text-brand ${box}`}
    >
      <Icon size={size === 'lg' ? 32 : 22} strokeWidth={2} aria-hidden="true" />
      {size === 'lg' && <span className="mt-0.5 text-caption leading-none text-text-sub">写真なし</span>}
    </span>
  )
}
