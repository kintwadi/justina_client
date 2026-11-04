import { CategoryId } from './product.model';
import { IconName } from '../../shared/components/icon/icon-name';

export interface Testimonial {
  author: string;
  location: string;
  rating: number;
  text: string;
}

export interface TimelineEntry {
  year: string;
  title: string;
  text: string;
}

export interface CraftStep {
  icon: IconName;
  title: string;
  text: string;
}

export interface ValueItem {
  number: string;
  title: string;
  text: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface CategoryTile {
  title: string;
  count: string;
  imageClass: string;
  image: string;
  route: string;
  filter?: CategoryId;
}

export interface CollectionBlock {
  tag: string;
  title: string;
  text: string;
  imageClass: string;
  image: string;
  linkLabel: string;
  filter?: CategoryId;
}

export interface InstagramTile {
  imageClass: string;
  image: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface NavLink {
  label: string;
  route: string;
  /** Optional catalogue filter applied through the query string. */
  filter?: CategoryId;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface ProductStat {
  value: string;
  label: string;
}

export interface BrandContent {
  name: string;
  shortName: string;
  suffix: string;
  announcement: string;
  instagramHandle: string;
  instagramUrl: string;
  email: string;
  phone: string;
}

export interface HeaderButtonsContent {
  logoImageUrl: string;
  showLogoTextWithImage: boolean;
  showHome: boolean;
  showShop: boolean;
  showCollections: boolean;
  showHistory: boolean;
  showContact: boolean;
  showLanguage: boolean;
  showCurrency: boolean;
  showSearch: boolean;
  showCart: boolean;
  showAccount: boolean;
}

export interface ShopPriceRange {
  min: number;
  max: number;
}

export interface ShopPriceRangesContent {
  [currencyCode: string]: ShopPriceRange[];
}

export interface HeroContent {
  tagline: string;
  titleLines: string[];
  subtitle: string;
  ctaLabel: string;
  scrollLabel: string;
}

export interface FeaturedPieceContent {
  tag: string;
  title: string;
  text: string;
  ctaLabel: string;
  imageClass: string;
  image: string;
}

export interface AboutContent {
  title: string;
  imageClass: string;
  image: string;
  paragraphs: string[];
  stats: StatItem[];
}

export interface ContactInfoBlock {
  title: string;
  lines: string[];
}

export interface ContactPageContent {
  pageTitle: string;
  pageCrumb: string;
  pageSubtitle: string;
  introTitle: string;
  introText: string;
  getInTouchTitle: string;
  customerServiceTitle: string;
  customerServiceText: string;
  formTitle: string;
  formIntro: string;
}

/** Editable header strip of the storefront "Our History" page. */
export interface HistoryPageContent {
  pageTitle: string;
  pageCrumb: string;
  pageSubtitle: string;
}

/** Narrative intro of the "Our History" page. */
export interface HistoryIntroContent {
  title: string;
  lead: string;
  paragraphs: string[];
}

/** Section headings of the storefront home page. */
export interface HomeSectionsContent {
  worldTitle: string;
  worldSubtitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredCta: string;
  testimonialsTitle: string;
  instagramTitle: string;
}

/** Editable header strip of the "Collections" page. */
export interface CollectionsPageContent {
  pageTitle: string;
  pageCrumb: string;
  pageSubtitle: string;
}

/** Editable copy of the "Reviews" page (header + write-review call to action). */
export interface ReviewsPageContent {
  pageTitle: string;
  pageCrumb: string;
  pageSubtitle: string;
  writeTitle: string;
  writeText: string;
  writeButton: string;
  emptyText: string;
}

/** Section headings of the "Our History" page (craft & values). */
export interface HistorySectionsContent {
  craftTitle: string;
  craftSubtitle: string;
  valuesTitle: string;
}
