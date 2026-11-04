import {
  AboutContent,
  BrandContent,
  CategoryTile,
  CollectionBlock,
  CollectionsPageContent,
  ContactInfoBlock,
  ContactPageContent,
  CraftStep,
  FaqEntry,
  FeaturedPieceContent,
  FooterColumn,
  HeaderButtonsContent,
  HeroContent,
  HistoryIntroContent,
  HistoryPageContent,
  HistorySectionsContent,
  HomeSectionsContent,
  InstagramTile,
  NavLink,
  ReviewsPageContent,
  ShopPriceRangesContent,
  StatItem,
  Testimonial,
  TimelineEntry,
  ValueItem,
} from '../models/content.model';
import { generatedImage } from '../utils/image.util';

export const BRAND: BrandContent = {
  name: 'Atelier Justinazaqueu',
  shortName: 'Atelier',
  suffix: 'Justinazaqueu',
  announcement: 'Complimentary shipping on orders over €150 — Each piece, handcrafted with devotion',
  instagramHandle: '@atelier.justinazaqueu',
  instagramUrl: 'https://www.instagram.com/atelier.justinazaqueu/',
  email: 'hello@atelierjustinazaqueu.com',
  phone: '+32 2 555 12 34',
};

export const HEADER_BUTTONS: HeaderButtonsContent = {
  logoImageUrl: '',
  showLogoTextWithImage: true,
  showHome: true,
  showShop: true,
  showCollections: true,
  showHistory: true,
  showContact: true,
  showLanguage: true,
  showCurrency: true,
  showSearch: true,
  showCart: true,
  showAccount: true,
};

export const SHOP_PRICE_RANGES: ShopPriceRangesContent = {
  EUR: [
    { min: 0, max: 50 },
    { min: 50, max: 100 },
    { min: 100, max: 200 },
    { min: 200, max: 500 },
  ],
  USD: [
    { min: 0, max: 60 },
    { min: 60, max: 120 },
    { min: 120, max: 240 },
    { min: 240, max: 600 },
  ],
  GBP: [
    { min: 0, max: 45 },
    { min: 45, max: 90 },
    { min: 90, max: 180 },
    { min: 180, max: 450 },
  ],
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', route: '/' },
  { label: 'Shop', route: '/shop' },
  { label: 'Collections', route: '/collections' },
  { label: 'Our History', route: '/history' },
  { label: 'Contact', route: '/contact' },
];

export const HERO: HeroContent = {
  tagline: 'Est. 2016 · Handcrafted in Brussels',
  titleLines: ['Atelier', 'Justinazaqueu'],
  subtitle: 'Leather goods made to last a lifetime',
  ctaLabel: 'Discover the Collection',
  scrollLabel: 'Scroll',
};

export const HOME_SECTIONS: HomeSectionsContent = {
  worldTitle: 'Explore Our World',
  worldSubtitle:
    'Each piece is meticulously handcrafted using traditional techniques and the finest full-grain leather',
  featuredTitle: 'Featured Creations',
  featuredSubtitle:
    'Timeless pieces designed for those who appreciate the art of fine craftsmanship',
  featuredCta: 'View All Products',
  testimonialsTitle: 'Client Stories',
  instagramTitle: 'Follow Our Journey',
};

export const CATEGORY_TILES: CategoryTile[] = [
  {
    title: 'Bags',
    count: '4 pieces',
    imageClass: 'cat-1',
    image: generatedImage(
      'Handmade leather bags collection, tote and satchel arranged on a wooden surface, warm cognac tones, soft light, editorial photography',
    ),
    route: '/shop',
    filter: 'bags',
  },
  {
    title: 'Wallets',
    count: '3 pieces',
    imageClass: 'cat-2',
    image: generatedImage(
      'Handmade leather wallets stacked and fanned out, tan and brown tones, soft natural light, minimal neutral surface, editorial photography',
    ),
    route: '/shop',
    filter: 'wallets',
  },
  {
    title: 'Accessories',
    count: '3 pieces',
    imageClass: 'cat-3',
    image: generatedImage(
      'Leather accessories flat lay, belt, bracelet, keychain and journal cover, warm earthy tones, soft daylight, minimal background, editorial photography',
    ),
    route: '/shop',
    filter: 'accessories',
  },
  {
    title: 'All Collections',
    count: '4 curated edits',
    imageClass: 'cat-4',
    image: generatedImage(
      'Curated selection of handcrafted leather goods arranged as a still life, warm brown palette, dramatic soft light, luxury editorial photography',
    ),
    route: '/collections',
  },
];

export const FEATURED_PIECE: FeaturedPieceContent = {
  tag: 'Signature Piece',
  title: 'The Artisan Tote',
  text: 'Our most iconic creation. Handcrafted from a single piece of full-grain vegetable-tanned leather, the Artisan Tote is designed to become more beautiful with each passing year. Every stitch is placed by hand, every edge burnished to perfection.',
  ctaLabel: 'Shop Now',
  imageClass: 'featured-img-bg',
  image: generatedImage(
    'Artisan crafted cognac leather tote bag held in warm side light, full grain leather texture in detail, minimal warm beige studio background, luxury editorial photography, portrait composition',
  ),
};

export const ABOUT: AboutContent = {
  title: 'The Art of Leather',
  imageClass: 'about-img-bg',
  image: generatedImage(
    'Artisan leather workshop bench with hand tools, leather hides, thread and waxed linen in warm daylight, shallow depth of field, warm earthy tones, documentary craft photography',
  ),
  paragraphs: [
    'At Atelier Justinazaqueu, every piece tells a story. Founded with a passion for traditional craftsmanship, our workshop creates leather goods that transcend trends and become cherished companions through the years.',
    'We source only the finest full-grain leather, allowing each piece to develop a unique patina over time — a living record of your journey.',
  ],
  stats: [
    { value: '100%', label: 'Handmade' },
    { value: '10+', label: 'Years Craft' },
    { value: '2K+', label: 'Happy Clients' },
  ] satisfies StatItem[],
};

export const TESTIMONIALS: Testimonial[] = [
  {
    author: 'María Fernández',
    location: 'Madrid, Spain',
    rating: 5,
    text: 'The craftsmanship is extraordinary. My wallet has developed the most beautiful patina over the past year. You can truly feel the quality in every stitch.',
  },
  {
    author: 'Thomas Berger',
    location: 'Paris, France',
    rating: 5,
    text: "I've purchased three pieces now and each one exceeds expectations. The attention to detail and the quality of leather is unmatched.",
  },
  {
    author: 'Sofia Andersson',
    location: 'Stockholm, Sweden',
    rating: 5,
    text: 'A gift that keeps on giving. The bag I purchased two years ago looks even more beautiful today. Worth every penny.',
  },
];

export const INSTAGRAM_TILES: InstagramTile[] = [
  {
    imageClass: 'ig-1',
    image: generatedImage('Close up of cognac leather stitching detail in warm light', 'square'),
  },
  {
    imageClass: 'ig-2',
    image: generatedImage('Leather craftsman hands working a hide on a wooden bench', 'square'),
  },
  {
    imageClass: 'ig-3',
    image: generatedImage('Stack of handmade leather wallets on a linen surface', 'square'),
  },
  {
    imageClass: 'ig-4',
    image: generatedImage('Brass buckle and leather strap detail macro shot', 'square'),
  },
  {
    imageClass: 'ig-5',
    image: generatedImage('Leather tote bag hanging against a warm beige wall', 'square'),
  },
  {
    imageClass: 'ig-6',
    image: generatedImage('Workbench with leather tools, awls and waxed thread', 'square'),
  },
];

export const COLLECTIONS: CollectionBlock[] = [
  {
    tag: 'Signature Edit',
    title: 'The Everyday Essentials',
    imageClass: 'coll-1',
    image: generatedImage(
      'Flat lay of everyday leather essentials, bifold wallet and tote together, warm tan tones, soft daylight, minimal beige surface, editorial photography',
    ),
    text: 'Our most beloved pieces, designed to become your daily companions. From the classic bifold wallet to the versatile tote, each item is crafted to age beautifully and serve you for years to come. These are the pieces our clients return to again and again.',
    linkLabel: 'Shop the Edit',
    filter: 'wallets',
  },
  {
    tag: 'Travel Edit',
    title: "The Wanderer's Collection",
    imageClass: 'coll-2',
    image: generatedImage(
      'Leather weekender duffel and crossbody satchel packed for a journey, warm brown leather, soft window light, minimal studio backdrop, editorial photography',
    ),
    text: "Built for the journey. Our travel collection features spacious weekender bags, secure crossbody satchels, and refined accessories — all designed to accompany you on life's greatest adventures. Crafted to endure, designed to inspire.",
    linkLabel: 'Shop the Edit',
    filter: 'bags',
  },
  {
    tag: 'Gift Edit',
    title: 'The Art of Gifting',
    imageClass: 'coll-3',
    image: generatedImage(
      'Leather gift set arranged with journal cover, card holder and bracelet, wrapped with ribbon, warm neutral palette, soft light, editorial photography',
    ),
    text: 'Thoughtful gifts that last a lifetime. Each piece arrives in our signature packaging, ready to be treasured. From card holders to journals, discover pieces that speak volumes without saying a word. Perfect for milestones and celebrations.',
    linkLabel: 'Shop the Edit',
    filter: 'accessories',
  },
  {
    tag: 'Limited Edition',
    title: 'The Heritage Series',
    imageClass: 'coll-4',
    image: generatedImage(
      'Limited edition numbered leather piece with certificate of authenticity on a dark surface, dramatic warm light, luxurious craft photography',
    ),
    text: "A celebration of our craft. Limited edition pieces using rare, hand-selected leathers and traditional techniques passed down through generations. Each piece is numbered and comes with a certificate of authenticity. Once they're gone, they're gone forever.",
    linkLabel: 'Explore the Series',
  },
];

export const COLLECTIONS_PAGE: CollectionsPageContent = {
  pageTitle: 'Our Collections',
  pageCrumb: 'Collections',
  pageSubtitle: 'Curated edits for every moment of your journey',
};

export const HISTORY_PAGE: HistoryPageContent = {
  pageTitle: 'Our Story',
  pageCrumb: 'Our History',
  pageSubtitle: 'A journey of passion, craft, and timeless leather',
};

export const HISTORY_SECTIONS: HistorySectionsContent = {
  craftTitle: 'The Craft',
  craftSubtitle:
    'Every piece goes through a meticulous process, taking up to 20 hours of dedicated craftsmanship',
  valuesTitle: 'Our Values',
};

export const HISTORY_INTRO: HistoryIntroContent = {
  title: 'Where It All Began',
  lead: '"Every stitch tells a story. Every piece carries a piece of our soul."',
  paragraphs: [
    'Atelier Justinazaqueu was born from a simple belief: that beautiful things should be made to last. In a world of fast fashion and disposable goods, we chose a different path — one rooted in tradition, patience, and an unwavering commitment to craft.',
    'What began as a one-person workshop has grown into a small atelier of dedicated artisans, each sharing the same passion for creating leather goods that become part of their owner\'s story. We believe in slow craftsmanship, in the beauty of imperfection, and in the quiet luxury of something made by hand.',
  ],
};

export const TIMELINE: TimelineEntry[] = [
  {
    year: '2016',
    title: 'The First Stitch',
    text: 'Founded in a small Brussels workshop with nothing but a passion for leather and a dream of creating timeless pieces. The first collection — just five wallets — sold out in a single week through word of mouth alone.',
  },
  {
    year: '2018',
    title: 'The First Atelier',
    text: 'Moved into our first dedicated workshop space in the heart of Brussels. Expanded the collection to include bags and accessories, and welcomed our first apprentice to the team — beginning a tradition of passing knowledge forward.',
  },
  {
    year: '2020',
    title: 'International Recognition',
    text: 'Featured in leading design publications across Europe. Our pieces began reaching customers in over 20 countries, with a growing reputation for exceptional craftsmanship and timeless design.',
  },
  {
    year: '2022',
    title: 'Sustainable Commitment',
    text: 'Launched our sustainability initiative, partnering exclusively with ethical tanneries and introducing our repair-for-life program. Every piece we make is now built to last generations, not seasons.',
  },
  {
    year: '2024',
    title: 'The Heritage Collection',
    text: 'Released our first limited edition Heritage Series — a celebration of traditional techniques and rare leathers. Each piece numbered, each one a testament to the craft that defines us.',
  },
  {
    year: '2026',
    title: 'The Present Chapter',
    text: 'Today, our atelier continues to grow while staying true to our founding principles. Each piece is still made by hand, each stitch still placed with intention. The journey continues, one beautiful piece at a time.',
  },
];

export const CRAFT_STEPS: CraftStep[] = [
  {
    icon: 'layers',
    title: 'Selection',
    text: 'We personally source each hide from ethical tanneries, selecting only the finest full-grain leather with character and soul.',
  },
  {
    icon: 'tool',
    title: 'Cutting',
    text: 'Each piece is hand-cut with precision, honoring the natural character and grain of the leather — no two pieces are ever identical.',
  },
  {
    icon: 'pen',
    title: 'Stitching',
    text: 'Traditional saddle stitching by hand — stronger and more durable than any machine can achieve. Each stitch placed with intention.',
  },
  {
    icon: 'heart',
    title: 'Finishing',
    text: 'Burnished edges, polished brass hardware, and final inspection ensure every piece meets our exacting standards before it leaves the atelier.',
  },
];

export const VALUES: ValueItem[] = [
  {
    number: '01',
    title: 'Quality Over Quantity',
    text: "We create fewer pieces, but each one is made to last a lifetime. We'd rather make one perfect bag than a hundred forgettable ones.",
  },
  {
    number: '02',
    title: 'Tradition & Innovation',
    text: 'We honor centuries-old techniques while embracing thoughtful innovations that improve both craft and sustainability.',
  },
  {
    number: '03',
    title: 'Radical Transparency',
    text: 'From the source of our leather to the hands that craft each piece, we believe you deserve to know the full story.',
  },
  {
    number: '04',
    title: 'Repair For Life',
    text: 'Every piece we make comes with a lifetime repair guarantee. We stand behind our craft, always — because we believe in things that last.',
  },
];

export const REVIEW_FILTERS = [
  { value: 'all', label: 'All Reviews' },
  { value: '5', label: '5 Stars' },
  { value: 'bags', label: 'Bags' },
  { value: 'wallets', label: 'Wallets' },
  { value: 'accessories', label: 'Accessories' },
];

export const REVIEWS_PAGE: ReviewsPageContent = {
  pageTitle: 'Client Stories',
  pageCrumb: 'Reviews',
  pageSubtitle: 'Real experiences from our community of collectors',
  writeTitle: 'Share Your Experience',
  writeText: "Purchased from Atelier Justinazaqueu? We'd love to hear your story.",
  writeButton: 'Write a Review',
  emptyText: 'No reviews match this filter yet.',
};

export const CONTACT_PAGE: ContactPageContent = {
  pageTitle: 'Get in Touch',
  pageCrumb: 'Contact',
  pageSubtitle: "We'd love to hear from you",
  introTitle: 'Visit the Atelier',
  introText:
    "Whether you have a question about our pieces, want to discuss a custom order, or simply wish to visit our workshop, we're here to help. Every message is read personally by our team.",
  getInTouchTitle: 'Get in Touch',
  customerServiceTitle: 'Customer Service',
  customerServiceText:
    'For orders, repairs, or general inquiries, our team responds within 24 hours on business days.',
  formTitle: 'Send a Message',
  formIntro: "Fill out the form below and we'll get back to you shortly.",
};

export const CONTACT_INFO: ContactInfoBlock[] = [
  {
    title: 'Atelier Address',
    lines: ["Rue de l'Artisan 42", '1000 Brussels', 'Belgium'],
  },
  {
    title: 'Opening Hours',
    lines: ['Tuesday — Friday: 10:00 — 18:30', 'Saturday: 11:00 — 18:00', 'Sunday & Monday: By appointment'],
  },
];

export const CONTACT_SUBJECTS = [
  'General Inquiry',
  'Custom Order',
  'Repair Service',
  'Workshop Visit',
  'Press & Media',
  'Other',
];

export const FAQS: FaqEntry[] = [
  {
    question: 'How long does shipping take?',
    answer:
      'Standard shipping within Europe takes 3-5 business days. International orders typically arrive within 7-10 business days. All orders include tracking and signature confirmation. Complimentary shipping on orders over €150.',
  },
  {
    question: 'Do you offer custom orders?',
    answer:
      'Yes! We love creating bespoke pieces. Custom orders typically take 4-6 weeks and begin with a consultation to discuss your vision, leather choices, and personalization options. Contact us to start the conversation.',
  },
  {
    question: 'What is your repair policy?',
    answer:
      "Every piece comes with a lifetime repair guarantee. Whether it's a loose stitch, worn edge, or hardware replacement, we'll restore your piece to its former glory — often free of charge for craftsmanship issues.",
  },
  {
    question: 'How do I care for my leather?',
    answer:
      'Full-grain leather develops character with age. We recommend occasional conditioning with a quality leather balm, avoiding prolonged sun exposure, and storing in the dust bag we provide. Each piece includes a detailed care guide.',
  },
  {
    question: 'Can I visit the workshop?',
    answer:
      "Absolutely. We welcome visitors by appointment Tuesday through Saturday. It's a wonderful opportunity to see the craft in action, feel our leathers, and discuss pieces in person. Book through our contact form.",
  },
  {
    question: 'What is your return policy?',
    answer:
      "We offer a 30-day return window for unused items in original condition. Custom orders are final sale. If anything about your piece isn't perfect, please reach out — we're committed to your complete satisfaction.",
  },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', route: '/shop' },
      { label: 'Bags', route: '/shop', filter: 'bags' },
      { label: 'Wallets', route: '/shop', filter: 'wallets' },
      { label: 'Accessories', route: '/shop', filter: 'accessories' },
    ],
  },
  {
    title: 'Atelier',
    links: [
      { label: 'Our Story', route: '/history' },
      { label: 'Collections', route: '/collections' },
      { label: 'Reviews', route: '/reviews' },
      { label: 'Contact', route: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping', route: '/contact' },
      { label: 'Returns', route: '/contact' },
      { label: 'Care Guide', route: '/contact' },
      { label: 'FAQ', route: '/contact' },
    ],
  },
];

export const FOOTER_TAGLINE =
  'Handcrafted leather goods made with passion, tradition, and the finest materials. Each piece is a testament to the art of slow craftsmanship.';

export const SOCIAL_LINKS = [
  { label: 'IG', title: 'Instagram', href: 'https://www.instagram.com/atelier.justinazaqueu/' },
  { label: 'FB', title: 'Facebook', href: '#' },
  { label: 'PI', title: 'Pinterest', href: '#' },
];
