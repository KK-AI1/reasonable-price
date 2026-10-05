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

export function ItemThumb({ id, size = 'lg' }: { id: string; size?: 'lg' | 'sm' }) {
  const Icon = icons[id] ?? Package
  const box = size === 'lg' ? 'h-20 w-20' : 'h-12 w-12'
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-button bg-brand-soft text-brand ${box}`} aria-hidden="true">
      <Icon size={size === 'lg' ? 36 : 24} strokeWidth={2} />
    </span>
  )
}
