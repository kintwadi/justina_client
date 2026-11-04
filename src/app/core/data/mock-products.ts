import { Category, Product } from '../models/product.model';
import { generatedImage } from '../utils/image.util';

const img = generatedImage;

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'The Artisan Tote',
    category: 'bags',
    sku: 'THE_ARTISAN_TOTE',
    price: 285,
    originalPrice: null,
    badge: 'Bestseller',
    imageClass: 'prod-img-1',
    image: img(
      'Handstitched full-grain vegetable-tanned leather tote bag standing upright, warm cognac brown, soft daylight, minimal beige studio backdrop, premium editorial product photography',
    ),
    description:
      'Our signature tote bag, handcrafted from premium full-grain leather. Features interior pockets, magnetic closure, and hand-stitched handles. Designed to age beautifully with daily use.',
    inStock: true,
    stockQuantity: 12,
    date: '2025-08-15',
  },
  {
    id: 2,
    name: 'Classic Bifold Wallet',
    category: 'wallets',
    sku: 'CLASSIC_BIFOLD_WALLET',
    price: 120,
    originalPrice: null,
    badge: null,
    imageClass: 'prod-img-2',
    image: img(
      'Classic bifold leather wallet slightly open showing card slots, rich tan leather, soft natural light, minimal linen surface, luxury editorial product photography',
    ),
    description:
      'A timeless bifold wallet crafted from vegetable-tanned leather. Features 6 card slots, 2 bill compartments, and a coin pocket. Slim profile that fits perfectly in any pocket.',
    inStock: true,
    stockQuantity: 9,
    date: '2025-06-10',
  },
  {
    id: 3,
    name: 'Heritage Belt',
    category: 'accessories',
    sku: 'HERITAGE_BELT',
    price: 95,
    originalPrice: 120,
    badge: 'Sale',
    imageClass: 'prod-img-3',
    image: img(
      'Handcrafted thick full-grain leather belt coiled with a solid brass buckle, deep espresso brown, soft directional light, minimal warm backdrop, product photography',
    ),
    description:
      'Hand-cut from a single piece of full-grain leather with a solid brass buckle. This belt will develop a rich patina unique to its owner over time.',
    inStock: true,
    stockQuantity: 6,
    date: '2025-04-20',
  },
  {
    id: 4,
    name: 'Minimalist Card Holder',
    category: 'wallets',
    sku: 'MINIMALIST_CARD_HOLDER',
    price: 65,
    originalPrice: null,
    badge: null,
    imageClass: 'prod-img-4',
    image: img(
      'Ultra slim minimalist leather card holder with a few cards peeking out, honey tan leather, clean bright studio light, minimal off-white background, product photography',
    ),
    description:
      'Ultra-slim card holder with 4 card slots and a central compartment for cash. Perfect for those who prefer to travel light without sacrificing style.',
    inStock: true,
    stockQuantity: 14,
    date: '2025-09-01',
  },
  {
    id: 5,
    name: 'Weekender Bag',
    category: 'bags',
    sku: 'WEEKENDER_BAG',
    price: 420,
    originalPrice: null,
    badge: 'New',
    imageClass: 'prod-img-5',
    image: img(
      'Spacious leather weekender duffel bag with brass hardware and detachable shoulder strap, caramel brown full-grain leather, soft window light, minimal studio backdrop',
    ),
    description:
      'The perfect companion for weekend getaways. Spacious interior with leather-lined bottom, brass hardware, and detachable shoulder strap. Built to last a lifetime of adventures.',
    inStock: true,
    stockQuantity: 4,
    date: '2026-01-15',
  },
  {
    id: 6,
    name: 'Leather Journal Cover',
    category: 'accessories',
    sku: 'LEATHER_JOURNAL_COVER',
    price: 85,
    originalPrice: null,
    badge: null,
    imageClass: 'prod-img-6',
    image: img(
      'Refillable A5 leather journal cover with wrap-around closure and pen holder, warm chestnut leather, soft daylight, minimal beige surface, editorial product photography',
    ),
    description:
      'A beautiful leather cover for A5 journals. Features a wrap-around design with pen holder and interior pocket. Includes one refill notebook.',
    inStock: true,
    stockQuantity: 11,
    date: '2025-07-12',
  },
  {
    id: 7,
    name: 'Woven Bracelet',
    category: 'accessories',
    sku: 'WOVEN_BRACELET',
    price: 45,
    originalPrice: null,
    badge: null,
    imageClass: 'prod-img-7',
    image: img(
      'Hand-woven braided leather bracelet with an adjustable brass clasp laid on stone, natural brown leather, soft light, minimal neutral background, product photography',
    ),
    description:
      'Hand-woven leather bracelet with adjustable brass clasp. Each bracelet is unique, showcasing the natural variations in the leather.',
    inStock: true,
    stockQuantity: 18,
    date: '2025-05-18',
  },
  {
    id: 8,
    name: 'Crossbody Satchel',
    category: 'bags',
    sku: 'CROSSBODY_SATCHEL',
    price: 245,
    originalPrice: 295,
    badge: 'Sale',
    imageClass: 'prod-img-8',
    image: img(
      'Elegant leather crossbody satchel with flap closure and adjustable strap, deep chocolate brown leather, soft side light, minimal warm studio backdrop, product photography',
    ),
    description:
      'Elegant crossbody bag with adjustable strap, flap closure with magnetic snap, and interior zip pocket. Perfect for everyday essentials with a refined aesthetic.',
    inStock: true,
    stockQuantity: 7,
    date: '2025-10-05',
  },
  {
    id: 9,
    name: 'Zip-Around Wallet',
    category: 'wallets',
    sku: 'ZIP_AROUND_WALLET',
    price: 145,
    originalPrice: null,
    badge: 'New',
    imageClass: 'prod-img-1',
    image: img(
      'Full zip-around leather wallet open showing many card slots and coin section, buttery soft tan leather, bright clean studio light, minimal pale background',
    ),
    description:
      'Full zip-around wallet with 12 card slots, multiple bill compartments, and a zippered coin section. Crafted from buttery soft leather that feels incredible in hand.',
    inStock: true,
    stockQuantity: 8,
    date: '2026-02-20',
  },
  {
    id: 10,
    name: 'Leather Keychain',
    category: 'accessories',
    sku: 'LEATHER_KEYCHAIN',
    price: 35,
    originalPrice: null,
    badge: null,
    imageClass: 'prod-img-3',
    image: img(
      'Small handcrafted leather keychain fob with solid brass ring on a light surface, warm tan leather, soft daylight, minimal background, product photography',
    ),
    description:
      'Handcrafted leather keychain with solid brass hardware. A simple yet elegant accessory that adds a touch of luxury to your everyday carry.',
    inStock: true,
    stockQuantity: 20,
    date: '2025-03-08',
  },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'all', label: 'All Products', count: 10 },
  { id: 'bags', label: 'Bags', count: 4 },
  { id: 'wallets', label: 'Wallets', count: 3 },
  { id: 'accessories', label: 'Accessories', count: 3 },
];
