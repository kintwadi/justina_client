import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { UserRole } from '../../core/models/auth.model';
import {
  AdminCategory,
  AdminCategoryPayload,
  AdminOrder,
  AdminOrderUpdatePayload,
  AdminProduct,
  AdminProductPayload,
  AdminProductType,
  AdminProductTypePayload,
  AdminUser,
  AdminUserPayload,
  AdminUserUpdatePayload,
  CustomOrderRequestRecord,
  CustomOrderStatus,
  CustomOrderUpdatePayload,
  MediaUpload,
  ProductSummary,
} from '../../core/models/admin.model';
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
  ShopPriceRange,
  ShopPriceRangesContent,
  StatItem,
  Testimonial,
  TimelineEntry,
  ValueItem,
} from '../../core/models/content.model';
import { CATEGORY_IDS, CategoryId } from '../../core/models/product.model';
import { AppLanguage, CurrencyRate } from '../../core/models/locale.model';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { LocaleService } from '../../core/services/locale.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationKey } from '../../core/i18n/translations';
import { formatPrice } from '../../core/utils/format.util';
import { apiErrorMessage } from '../../core/utils/error.util';
import { IconComponent } from '../../shared/components/icon/icon';
import { IconName } from '../../shared/components/icon/icon-name';
import { PaginationComponent } from '../../shared/components/pagination/pagination';

/** Editable variant row (carries an internal `uid` so `@for` can track rows stably). */
interface VariantForm {
  uid: string;
  sku: string;
  name: string;
  priceDelta: number | null;
  stock: number;
}

/** Editable product form model used by the ngModel + setter-signal bindings. */
interface ProductForm {
  name: string;
  slug: string;
  category: CategoryId;
  price: number | null;
  originalPrice: number | null;
  badge: string;
  image: string;
  gallery: string[];
  imageClass: string;
  description: string;
  inStock: boolean;
  featured: boolean;
  customMade: boolean;
  date: string;
  variants: VariantForm[];
}

type StaffRole = 'ADMIN' | 'OPERATOR';
type AdminTab =
  | 'products'
  | 'orders'
  | 'customOrders'
  | 'users'
  | 'contact'
  | 'home'
  | 'header'
  | 'shop'
  | 'collections'
  | 'reviews'
  | 'history'
  | 'footer';
const ROOT_ADMIN_EMAIL = 'root@atelierjustinazaqueu.com';
const GENERATED_IMAGE_BASE =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?image_size=portrait_4_3&prompt=';
const FALLBACK_SHOP_CURRENCIES: readonly CurrencyRate[] = [
  { code: 'EUR', symbol: '€', label: 'Euro', rate: 1 },
  { code: 'USD', symbol: '$', label: 'US Dollar', rate: 1.1 },
  { code: 'GBP', symbol: '£', label: 'British Pound', rate: 0.9 },
];

interface UserForm {
  id: number | null;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: StaffRole;
  enabled: boolean;
}

interface OrderForm {
  orderNumber: string;
  status: AdminOrder['status'];
  paymentStatus: AdminOrder['paymentStatus'];
}

interface CustomOrderForm {
  id: number;
  status: CustomOrderStatus;
  adminNotes: string;
}

interface UploadedGalleryItem {
  url: string;
  generated: boolean;
}

interface ContactInfoBlockForm {
  uid: string;
  title: string;
  linesText: string;
}

interface FaqEntryForm {
  uid: string;
  question: string;
  answer: string;
}

interface ContactContentForm {
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
  email: string;
  phone: string;
  instagramHandle: string;
  instagramUrl: string;
  subjectOptions: string;
  infoBlocks: ContactInfoBlockForm[];
  faqs: FaqEntryForm[];
}

interface TimelineEntryForm {
  uid: string;
  year: string;
  title: string;
  text: string;
}

interface HistoryContentForm {
  pageTitle: string;
  pageCrumb: string;
  pageSubtitle: string;
  introTitle: string;
  introLead: string;
  introParagraphsText: string;
  timeline: TimelineEntryForm[];
  craftTitle: string;
  craftSubtitle: string;
  valuesTitle: string;
  craftSteps: CraftStepForm[];
  values: ValueItemForm[];
}

interface CategoryMetadataForm {
  slug: string;
  label: string;
  description: string;
  displayOrder: number | null;
}

interface ProductTypeMetadataForm {
  slug: string;
  label: string;
  category: string;
  description: string;
  displayOrder: number | null;
  presetFields: string;
}

let variantSequence = 0;
let contentEditorSequence = 0;

/** Rows per page for the admin tables (orders, users). */
const ADMIN_PAGE_SIZE = 12;
/** Rows per page for the admin products table. */
const ADMIN_PRODUCT_PAGE_SIZE = 10;

function nextEditorUid(prefix: string): string {
  contentEditorSequence += 1;
  return `${prefix}-${contentEditorSequence}`;
}

function emptyVariant(): VariantForm {
  return { uid: `variant-${++variantSequence}`, sku: '', name: '', priceDelta: null, stock: 0 };
}

function emptyForm(): ProductForm {
  return {
    name: '',
    slug: '',
    category: 'bags',
    price: null,
    originalPrice: null,
    badge: '',
    image: '',
    gallery: [],
    imageClass: '',
    description: '',
    inStock: true,
    featured: false,
    customMade: false,
    date: '',
    variants: [],
  };
}

function emptyUserForm(): UserForm {
  return {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'OPERATOR',
    enabled: true,
  };
}

function emptyCategoryMetadataForm(): CategoryMetadataForm {
  return {
    slug: '',
    label: '',
    description: '',
    displayOrder: null,
  };
}

function emptyProductTypeMetadataForm(): ProductTypeMetadataForm {
  return {
    slug: '',
    label: '',
    category: 'bags',
    description: '',
    displayOrder: null,
    presetFields: 'Size, Color, Material',
  };
}

function emptyContactContentForm(
  contactPage: ContactPageContent,
  brand: BrandContent,
  contactInfo: ContactInfoBlock[],
  contactSubjects: string[],
  faqs: FaqEntry[],
): ContactContentForm {
  return {
    pageTitle: contactPage?.pageTitle ?? '',
    pageCrumb: contactPage?.pageCrumb ?? '',
    pageSubtitle: contactPage?.pageSubtitle ?? '',
    introTitle: contactPage?.introTitle ?? '',
    introText: contactPage?.introText ?? '',
    getInTouchTitle: contactPage?.getInTouchTitle ?? '',
    customerServiceTitle: contactPage?.customerServiceTitle ?? '',
    customerServiceText: contactPage?.customerServiceText ?? '',
    formTitle: contactPage?.formTitle ?? '',
    formIntro: contactPage?.formIntro ?? '',
    email: brand?.email ?? '',
    phone: brand?.phone ?? '',
    instagramHandle: brand?.instagramHandle ?? '',
    instagramUrl: brand?.instagramUrl ?? '',
    subjectOptions: (Array.isArray(contactSubjects) ? contactSubjects : []).join('\n'),
    infoBlocks: (Array.isArray(contactInfo) ? contactInfo : []).map(createContactInfoBlockForm),
    faqs: (Array.isArray(faqs) ? faqs : []).map(createFaqEntryForm),
  };
}

function createContactInfoBlockForm(block: ContactInfoBlock): ContactInfoBlockForm {
  return {
    uid: nextEditorUid('contact-block'),
    title: block.title,
    linesText: block.lines.join('\n'),
  };
}

function createFaqEntryForm(entry: FaqEntry): FaqEntryForm {
  return {
    uid: nextEditorUid('faq'),
    question: entry.question,
    answer: entry.answer,
  };
}

function emptyHistoryContentForm(
  historyPage: HistoryPageContent,
  historyIntro: HistoryIntroContent,
  timeline: TimelineEntry[],
  sections: HistorySectionsContent,
  craftSteps: CraftStep[],
  values: ValueItem[],
): HistoryContentForm {
  return {
    pageTitle: historyPage?.pageTitle ?? '',
    pageCrumb: historyPage?.pageCrumb ?? '',
    pageSubtitle: historyPage?.pageSubtitle ?? '',
    introTitle: historyIntro?.title ?? '',
    introLead: historyIntro?.lead ?? '',
    introParagraphsText: Array.isArray(historyIntro?.paragraphs) ? historyIntro.paragraphs.join('\n') : '',
    timeline: (Array.isArray(timeline) ? timeline : []).map(createTimelineEntryForm),
    craftTitle: sections?.craftTitle ?? '',
    craftSubtitle: sections?.craftSubtitle ?? '',
    valuesTitle: sections?.valuesTitle ?? '',
    craftSteps: (Array.isArray(craftSteps) ? craftSteps : []).map(createCraftStepForm),
    values: (Array.isArray(values) ? values : []).map(createValueItemForm),
  };
}

function createTimelineEntryForm(entry: TimelineEntry): TimelineEntryForm {
  return {
    uid: nextEditorUid('timeline'),
    year: entry.year,
    title: entry.title,
    text: entry.text,
  };
}

interface CraftStepForm {
  uid: string;
  icon: IconName;
  title: string;
  text: string;
}

interface ValueItemForm {
  uid: string;
  number: string;
  title: string;
  text: string;
}

function createCraftStepForm(step: CraftStep): CraftStepForm {
  return { uid: nextEditorUid('craft'), icon: step.icon, title: step.title, text: step.text };
}

function createValueItemForm(value: ValueItem): ValueItemForm {
  return {
    uid: nextEditorUid('value'),
    number: value.number,
    title: value.title,
    text: value.text,
  };
}

interface StatItemForm {
  uid: string;
  value: string;
  label: string;
}

interface TestimonialForm {
  uid: string;
  author: string;
  location: string;
  rating: number | null;
  text: string;
}

interface CategoryTileForm {
  uid: string;
  title: string;
  count: string;
}

interface HomeContentForm {
  heroTagline: string;
  heroTitleLinesText: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroScrollLabel: string;
  worldTitle: string;
  worldSubtitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredCta: string;
  testimonialsTitle: string;
  instagramTitle: string;
  featuredPieceTag: string;
  featuredPieceTitle: string;
  featuredPieceText: string;
  featuredPieceCta: string;
  aboutTitle: string;
  aboutParagraphsText: string;
  aboutStats: StatItemForm[];
  testimonials: TestimonialForm[];
  categoryTiles: CategoryTileForm[];
}

function createStatItemForm(stat: StatItem): StatItemForm {
  return { uid: nextEditorUid('stat'), value: stat.value, label: stat.label };
}

function createTestimonialForm(item: Testimonial): TestimonialForm {
  return {
    uid: nextEditorUid('testimonial'),
    author: item.author,
    location: item.location,
    rating: item.rating,
    text: item.text,
  };
}

function createCategoryTileForm(tile: CategoryTile): CategoryTileForm {
  return { uid: nextEditorUid('tile'), title: tile.title, count: tile.count };
}

function emptyHomeContentForm(
  hero: HeroContent,
  sections: HomeSectionsContent,
  featured: FeaturedPieceContent,
  about: AboutContent,
  testimonials: Testimonial[],
  tiles: CategoryTile[],
): HomeContentForm {
  return {
    heroTagline: hero.tagline,
    heroTitleLinesText: hero.titleLines.join('\n'),
    heroSubtitle: hero.subtitle,
    heroCtaLabel: hero.ctaLabel,
    heroScrollLabel: hero.scrollLabel,
    worldTitle: sections.worldTitle,
    worldSubtitle: sections.worldSubtitle,
    featuredTitle: sections.featuredTitle,
    featuredSubtitle: sections.featuredSubtitle,
    featuredCta: sections.featuredCta,
    testimonialsTitle: sections.testimonialsTitle,
    instagramTitle: sections.instagramTitle,
    featuredPieceTag: featured.tag,
    featuredPieceTitle: featured.title,
    featuredPieceText: featured.text,
    featuredPieceCta: featured.ctaLabel,
    aboutTitle: about.title,
    aboutParagraphsText: about.paragraphs.join('\n'),
    aboutStats: about.stats.map(createStatItemForm),
    testimonials: testimonials.map(createTestimonialForm),
    categoryTiles: tiles.map(createCategoryTileForm),
  };
}

interface CollectionBlockForm {
  uid: string;
  tag: string;
  title: string;
  text: string;
  linkLabel: string;
}

interface CollectionsContentForm {
  pageTitle: string;
  pageCrumb: string;
  pageSubtitle: string;
  collections: CollectionBlockForm[];
}

function createCollectionBlockForm(block: CollectionBlock): CollectionBlockForm {
  return {
    uid: nextEditorUid('collection'),
    tag: block.tag,
    title: block.title,
    text: block.text,
    linkLabel: block.linkLabel,
  };
}

function emptyCollectionsContentForm(
  page: CollectionsPageContent,
  collections: CollectionBlock[],
): CollectionsContentForm {
  return {
    pageTitle: page.pageTitle,
    pageCrumb: page.pageCrumb,
    pageSubtitle: page.pageSubtitle,
    collections: collections.map(createCollectionBlockForm),
  };
}

interface ReviewFilterForm {
  uid: string;
  value: string;
  label: string;
}

interface ReviewsContentForm {
  pageTitle: string;
  pageCrumb: string;
  pageSubtitle: string;
  writeTitle: string;
  writeText: string;
  writeButton: string;
  emptyText: string;
  filters: ReviewFilterForm[];
}

function createReviewFilterForm(filter: { value: string; label: string }): ReviewFilterForm {
  return { uid: nextEditorUid('filter'), value: filter.value, label: filter.label };
}

function emptyReviewsContentForm(
  page: ReviewsPageContent,
  filters: ReadonlyArray<{ value: string; label: string }>,
): ReviewsContentForm {
  return {
    pageTitle: page.pageTitle,
    pageCrumb: page.pageCrumb,
    pageSubtitle: page.pageSubtitle,
    writeTitle: page.writeTitle,
    writeText: page.writeText,
    writeButton: page.writeButton,
    emptyText: page.emptyText,
    filters: filters.map(createReviewFilterForm),
  };
}

interface FooterLinkForm {
  uid: string;
  label: string;
  route: string;
  filter?: CategoryId;
}

interface FooterColumnForm {
  uid: string;
  title: string;
  links: FooterLinkForm[];
}

interface SocialLinkForm {
  uid: string;
  label: string;
  title: string;
  href: string;
}

interface FooterContentForm {
  brandName: string;
  brandShortName: string;
  brandSuffix: string;
  announcement: string;
  navLinks: FooterLinkForm[];
  footerColumns: FooterColumnForm[];
  footerTagline: string;
  socialLinks: SocialLinkForm[];
}

interface HeaderButtonsForm {
  logoImageUrl: string;
  showLogoTextWithImage: boolean;
  showHome: boolean;
  showShop: boolean;
  showCollections: boolean;
  showHistory: boolean;
  showContact: boolean;
  brandShortName: string;
  brandSuffix: string;
  announcement: string;
  showLanguage: boolean;
  showCurrency: boolean;
  showSearch: boolean;
  showCart: boolean;
  showAccount: boolean;
}

interface ShopCurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

interface ShopPriceRangeForm {
  uid: string;
  min: number | null;
  max: number | null;
}

interface ShopCurrencyRangesForm extends ShopCurrencyOption {
  ranges: ShopPriceRangeForm[];
}

interface ShopContentForm {
  currencies: ShopCurrencyRangesForm[];
}

function createFooterLinkForm(link: NavLink): FooterLinkForm {
  return { uid: nextEditorUid('link'), label: link.label, route: link.route, filter: link.filter };
}

function createFooterColumnForm(column: FooterColumn): FooterColumnForm {
  return {
    uid: nextEditorUid('column'),
    title: column.title,
    links: column.links.map(createFooterLinkForm),
  };
}

function createSocialLinkForm(link: { label: string; title: string; href: string }): SocialLinkForm {
  return {
    uid: nextEditorUid('social'),
    label: link.label,
    title: link.title,
    href: link.href,
  };
}

function emptyFooterContentForm(
  brand: BrandContent,
  navLinks: NavLink[],
  footerColumns: FooterColumn[],
  footerTagline: string,
  socialLinks: ReadonlyArray<{ label: string; title: string; href: string }>,
): FooterContentForm {
  return {
    brandName: brand?.name ?? '',
    brandShortName: brand?.shortName ?? '',
    brandSuffix: brand?.suffix ?? '',
    announcement: brand?.announcement ?? '',
    navLinks: (navLinks ?? []).map(createFooterLinkForm),
    footerColumns: (footerColumns ?? []).map(createFooterColumnForm),
    footerTagline: footerTagline ?? '',
    socialLinks: (socialLinks ?? []).map(createSocialLinkForm),
  };
}

function emptyHeaderButtonsForm(
  config: HeaderButtonsContent,
  brand: BrandContent,
): HeaderButtonsForm {
  return {
    logoImageUrl: config?.logoImageUrl ?? '',
    showLogoTextWithImage: config?.showLogoTextWithImage ?? true,
    showHome: config?.showHome ?? true,
    showShop: config?.showShop ?? true,
    showCollections: config?.showCollections ?? true,
    showHistory: config?.showHistory ?? true,
    showContact: config?.showContact ?? true,
    brandShortName: brand?.shortName ?? '',
    brandSuffix: brand?.suffix ?? '',
    announcement: brand?.announcement ?? '',
    showLanguage: config?.showLanguage ?? true,
    showCurrency: config?.showCurrency ?? true,
    showSearch: config?.showSearch ?? true,
    showCart: config?.showCart ?? true,
    showAccount: config?.showAccount ?? true,
  };
}

function createShopPriceRangeForm(range: ShopPriceRange): ShopPriceRangeForm {
  return {
    uid: nextEditorUid('shop-range'),
    min: range.min,
    max: range.max,
  };
}

function emptyShopContentForm(
  config: ShopPriceRangesContent,
  currencies: readonly ShopCurrencyOption[],
): ShopContentForm {
  return {
    currencies: currencies.map((currency) => ({
      ...currency,
      ranges: (config?.[currency.code] ?? []).map(createShopPriceRangeForm),
    })),
  };
}

/**
 * Admin panel for the product catalogue. Lists every product, and drives create / update /
 * delete through the AdminService so the storefront catalogue stays in sync.
 */
@Component({
  selector: 'app-admin-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, PaginationComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminPageComponent {
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly content = inject(ContentService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly locale = inject(LocaleService);

  protected readonly categories = CATEGORY_IDS;
  protected readonly staffRoles: StaffRole[] = ['ADMIN', 'OPERATOR'];
  protected readonly orderStatuses: AdminOrder['status'][] = [
    'PENDING',
    'PAID',
    'FULFILLED',
    'CANCELLED',
    'REFUNDED',
  ];
  protected readonly paymentStatuses: AdminOrder['paymentStatus'][] = [
    'PENDING',
    'REQUIRES_ACTION',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED',
  ];
  protected readonly customOrderStatuses: CustomOrderStatus[] = [
    'SUBMITTED',
    'IN_REVIEW',
    'QUOTED',
    'APPROVED',
    'DECLINED',
    'COMPLETED',
  ];
  protected readonly activeTab = signal<AdminTab>('products');
  protected readonly tabsMenuOpen = signal(false);
  protected readonly canManageProducts = this.auth.isAdmin;
  protected readonly canManageContact = this.auth.isAdmin;
  protected readonly canManageHistory = this.auth.isAdmin;
  protected readonly canManageSiteContent = this.auth.isAdmin;
  protected readonly canManageUsers = this.auth.isAdmin;
  protected readonly canManageOrders = this.auth.isStaff;
  protected readonly canManageCustomOrders = this.auth.isStaff;
  protected readonly categoryMetadata = signal<AdminCategory[]>([]);
  protected readonly productTypeMetadata = signal<AdminProductType[]>([]);
  protected readonly metadataLoading = signal(false);
  protected readonly metadataError = signal<string | null>(null);
  protected readonly categoryForm = signal<CategoryMetadataForm>(emptyCategoryMetadataForm());
  protected readonly productTypeForm = signal<ProductTypeMetadataForm>(emptyProductTypeMetadataForm());
  protected readonly categorySaving = signal(false);
  protected readonly productTypeSaving = signal(false);
  protected readonly contactContentLoading = signal(false);
  protected readonly contactContentSaving = signal(false);
  protected readonly contactContentError = signal<string | null>(null);
  protected readonly contactContentSuccess = signal<string | null>(null);
  protected readonly contentLanguages = this.locale.languages;
  protected readonly shopCurrencies = computed(() =>
    this.shopCurrencyOptions(this.content.shopPriceRanges),
  );
  /** Language the content tabs read and write; follows the storefront language selection. */
  protected readonly contentLanguage = signal<AppLanguage>(this.locale.language());
  protected readonly contactContentForm = signal<ContactContentForm>(
    emptyContactContentForm(
      this.content.contactPage,
      this.content.brand,
      this.content.contactInfo,
      this.content.contactSubjects,
      this.content.faqs,
    ),
  );
  protected readonly historyContentLoading = signal(false);
  protected readonly historyContentSaving = signal(false);
  protected readonly historyContentError = signal<string | null>(null);
  protected readonly historyContentSuccess = signal<string | null>(null);
  protected readonly historyContentForm = signal<HistoryContentForm>(
    emptyHistoryContentForm(
      this.content.historyPage,
      this.content.historyIntro,
      this.content.timeline,
      this.content.historySections,
      this.content.craftSteps,
      this.content.values,
    ),
  );
  /** Icons selectable for the History craft steps. */
  protected readonly craftIcons: IconName[] = [
    'layers',
    'tool',
    'pen',
    'heart',
    'star',
    'book',
    'globe',
    'search',
    'cart',
    'user',
    'thumb-up',
    'edit',
  ];
  protected readonly homeContentLoading = signal(false);
  protected readonly homeContentSaving = signal(false);
  protected readonly homeContentError = signal<string | null>(null);
  protected readonly homeContentSuccess = signal<string | null>(null);
  protected readonly homeContentForm = signal<HomeContentForm>(
    emptyHomeContentForm(
      this.content.hero,
      this.content.homeSections,
      this.content.featuredPiece,
      this.content.about,
      this.content.testimonials,
      this.catalog.categoryTiles(),
    ),
  );
  protected readonly collectionsContentLoading = signal(false);
  protected readonly collectionsContentSaving = signal(false);
  protected readonly collectionsContentError = signal<string | null>(null);
  protected readonly collectionsContentSuccess = signal<string | null>(null);
  protected readonly collectionsContentForm = signal<CollectionsContentForm>(
    emptyCollectionsContentForm(this.content.collectionsPage, []),
  );
  protected readonly reviewsContentLoading = signal(false);
  protected readonly reviewsContentSaving = signal(false);
  protected readonly reviewsContentError = signal<string | null>(null);
  protected readonly reviewsContentSuccess = signal<string | null>(null);
  protected readonly reviewsContentForm = signal<ReviewsContentForm>(
    emptyReviewsContentForm(this.content.reviewsPage, this.content.reviewFilters),
  );
  protected readonly footerContentLoading = signal(false);
  protected readonly footerContentSaving = signal(false);
  protected readonly footerContentError = signal<string | null>(null);
  protected readonly footerContentSuccess = signal<string | null>(null);
  protected readonly footerContentForm = signal<FooterContentForm>(
    emptyFooterContentForm(
      this.content.brand,
      this.content.navLinks,
      this.content.footerColumns,
      this.content.footerTagline,
      this.content.socialLinks,
    ),
  );
  protected readonly headerContentLoading = signal(false);
  protected readonly headerContentSaving = signal(false);
  protected readonly headerContentError = signal<string | null>(null);
  protected readonly headerContentSuccess = signal<string | null>(null);
  protected readonly headerLogoUploading = signal(false);
  protected readonly headerLogoNotice = signal<string | null>(null);
  protected readonly headerContentForm = signal<HeaderButtonsForm>(
    emptyHeaderButtonsForm(this.content.headerButtons, this.content.brand),
  );
  protected readonly shopContentLoading = signal(false);
  protected readonly shopContentSaving = signal(false);
  protected readonly shopContentError = signal<string | null>(null);
  protected readonly shopContentSuccess = signal<string | null>(null);
  protected readonly shopContentForm = signal<ShopContentForm>(
    emptyShopContentForm(this.content.shopPriceRanges, this.shopCurrencies()),
  );
  /** Raw blocks read from the API, kept to preserve images when saving text-only edits. */
  private readonly featuredPieceRaw = signal<FeaturedPieceContent>(this.content.featuredPiece);
  private readonly aboutRaw = signal<AboutContent>(this.content.about);
  private readonly categoryTilesRaw = signal<CategoryTile[]>([]);
  private readonly collectionBlocksRaw = signal<CollectionBlock[]>([]);

  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly productSummary = signal<ProductSummary | null>(null);
  protected readonly productPageSize = ADMIN_PRODUCT_PAGE_SIZE;
  /** Zero-based page index sent to the paged admin products endpoint. */
  protected readonly productPage = signal(0);
  protected readonly productTotal = signal(0);

  protected readonly totalCount = computed(() => this.productSummary()?.total ?? 0);
  protected readonly inStockCount = computed(() => this.productSummary()?.inStock ?? 0);
  protected readonly featuredCount = computed(() => this.productSummary()?.featured ?? 0);
  protected readonly onSaleCount = computed(() => this.productSummary()?.onSale ?? 0);

  protected readonly modalOpen = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly form = signal<ProductForm>(emptyForm());
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly uploadNotice = signal<string | null>(null);

  protected readonly deleteTarget = signal<AdminProduct | null>(null);
  protected readonly deleting = signal(false);

  protected readonly previewPrice = computed(() => {
    const value = this.form().price;
    return value !== null && value > 0 ? formatPrice(value) : '—';
  });
  protected readonly previewOriginal = computed(() => this.form().originalPrice);
  protected readonly previewGallery = computed(() => {
    const form = this.form();
    return [form.image.trim(), ...this.normalizedGallery(form.gallery, form.image)]
      .filter((image): image is string => Boolean(image));
  });

  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly ordersLoading = signal(false);
  protected readonly ordersError = signal<string | null>(null);
  protected readonly totalOrders = computed(() => this.orders().length);
  protected readonly ordersPageSize = ADMIN_PAGE_SIZE;
  protected readonly ordersPage = signal(1);
  protected readonly pagedOrders = computed(() => {
    const start = (this.ordersPage() - 1) * this.ordersPageSize;
    return this.orders().slice(start, start + this.ordersPageSize);
  });
  protected readonly pendingOrders = computed(
    () => this.orders().filter((order) => order.status === 'PENDING').length,
  );
  protected readonly refundedOrders = computed(
    () => this.orders().filter((order) => order.status === 'REFUNDED').length,
  );
  protected readonly fulfilledOrders = computed(
    () => this.orders().filter((order) => order.status === 'FULFILLED').length,
  );
  protected readonly orderModalOpen = signal(false);
  protected readonly selectedOrder = signal<AdminOrder | null>(null);
  protected readonly orderForm = signal<OrderForm | null>(null);
  protected readonly savingOrder = signal(false);
  protected readonly customOrders = signal<CustomOrderRequestRecord[]>([]);
  protected readonly customOrdersLoading = signal(false);
  protected readonly customOrdersError = signal<string | null>(null);
  protected readonly totalCustomOrders = computed(() => this.customOrders().length);
  protected readonly customOrdersPageSize = ADMIN_PAGE_SIZE;
  protected readonly customOrdersPage = signal(1);
  protected readonly pagedCustomOrders = computed(() => {
    const start = (this.customOrdersPage() - 1) * this.customOrdersPageSize;
    return this.customOrders().slice(start, start + this.customOrdersPageSize);
  });
  protected readonly submittedCustomOrders = computed(
    () => this.customOrders().filter((request) => request.status === 'SUBMITTED').length,
  );
  protected readonly quotedCustomOrders = computed(
    () => this.customOrders().filter((request) => request.status === 'QUOTED').length,
  );
  protected readonly completedCustomOrders = computed(
    () => this.customOrders().filter((request) => request.status === 'COMPLETED').length,
  );
  protected readonly customOrderModalOpen = signal(false);
  protected readonly selectedCustomOrder = signal<CustomOrderRequestRecord | null>(null);
  protected readonly customOrderForm = signal<CustomOrderForm | null>(null);
  protected readonly savingCustomOrder = signal(false);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly usersLoading = signal(false);
  protected readonly usersError = signal<string | null>(null);
  protected readonly userModalOpen = signal(false);
  protected readonly userForm = signal<UserForm>(emptyUserForm());
  protected readonly userFormError = signal<string | null>(null);
  protected readonly savingUser = signal(false);
  protected readonly userDeleteTarget = signal<AdminUser | null>(null);
  protected readonly deletingUser = signal(false);
  protected readonly totalUsers = computed(() => this.users().length);
  protected readonly usersPageSize = ADMIN_PAGE_SIZE;
  protected readonly usersPage = signal(1);
  protected readonly pagedUsers = computed(() => {
    const start = (this.usersPage() - 1) * this.usersPageSize;
    return this.users().slice(start, start + this.usersPageSize);
  });
  protected readonly adminUsers = computed(
    () => this.users().filter((user) => user.role === 'ADMIN').length,
  );
  protected readonly operatorUsers = computed(
    () => this.users().filter((user) => user.role === 'OPERATOR').length,
  );
  protected readonly customerUsers = computed(
    () => this.users().filter((user) => user.role === 'CUSTOMER').length,
  );
  protected readonly totalCategories = computed(() => this.categoryMetadata().length);
  protected readonly totalProductTypes = computed(() => this.productTypeMetadata().length);

  constructor() {
    this.activeTab.set(this.auth.isOperator() ? 'orders' : 'products');
    this.loadProducts();
    this.loadOrders();
    if (this.canManageCustomOrders()) {
      this.loadCustomOrders();
    }
    if (this.canManageProducts()) {
      this.loadCatalogMetadata();
      this.reloadContentEditors();
    }
    if (this.canManageUsers()) {
      this.loadUsers();
    }

    // Follow the storefront language switcher (visible in the header) so the content editors
    // reload in the selected locale whenever the language changes outside the tab pills.
    effect(() => {
      const language = this.locale.language();
      if (language !== this.contentLanguage()) {
        this.contentLanguage.set(language);
        this.reloadContentEditors();
      }
    });
  }

  protected selectTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.closeTabsMenu();
  }

  protected openCatalogSetup(): void {
    this.activeTab.set('products');
    this.closeTabsMenu();
    setTimeout(() => {
      document.getElementById('catalog-setup-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  protected toggleTabsMenu(): void {
    this.tabsMenuOpen.update((value) => !value);
  }

  protected closeTabsMenu(): void {
    this.tabsMenuOpen.set(false);
  }

  /** Loads the current products page plus the aggregate counters used by the stat cards. */
  protected loadProducts(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      page: this.admin.listProductsPage(this.productPage(), this.productPageSize),
      summary: this.admin.productSummary(),
    }).subscribe({
      next: ({ page, summary }) => {
        // Step back a page when the current one empties out (e.g. after deleting its last row).
        if (page.content.length === 0 && this.productPage() > 0) {
          this.productPage.update((current) => current - 1);
          this.loadProducts();
          return;
        }
        this.products.set(page.content);
        this.productTotal.set(page.totalElements);
        this.productSummary.set(summary);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loadError.set(apiErrorMessage(error, 'Could not load the products.'));
        this.loading.set(false);
      },
    });
  }

  /** Handles a pager interaction (one-based page from the shared component). */
  protected changeProductPage(page: number): void {
    this.productPage.set(page - 1);
    this.loadProducts();
  }

  /** Handles a pager interaction on the orders list (client-side paging). */
  protected changeOrdersPage(page: number): void {
    this.ordersPage.set(page);
  }

  /** Handles a pager interaction on the users list (client-side paging). */
  protected changeUsersPage(page: number): void {
    this.usersPage.set(page);
  }

  protected price(value: number): string {
    return formatPrice(value);
  }

  protected formatShopRangePreview(
    currency: ShopCurrencyOption,
    range: ShopPriceRangeForm,
  ): string {
    const min = range.min ?? 0;
    const max = range.max ?? 0;
    const money = (value: number) => `${currency.symbol}${this.roundCurrencyValue(value)}`;
    if (min === 0) {
      return this.locale.t('shop.under', { value: money(max) });
    }
    return `${money(min)} — ${money(max)}`;
  }

  protected t(key: TranslationKey, params?: Record<string, string | number>): string {
    return this.locale.t(key, params);
  }

  protected loadCatalogMetadata(): void {
    if (!this.canManageProducts()) {
      return;
    }
    this.metadataLoading.set(true);
    this.metadataError.set(null);
    forkJoin({
      categories: this.admin.listCategories(),
      productTypes: this.admin.listProductTypes(),
    }).subscribe({
      next: ({ categories, productTypes }) => {
        this.categoryMetadata.set(categories);
        this.productTypeMetadata.set(productTypes);
        if (!this.categoryForm().label) {
          this.categoryForm.set(emptyCategoryMetadataForm());
        }
        if (!this.productTypeForm().label) {
          this.productTypeForm.update((form) => ({
            ...form,
            category: categories[0]?.slug ?? form.category,
          }));
        }
        this.metadataLoading.set(false);
      },
      error: (error: unknown) => {
        this.metadataError.set(apiErrorMessage(error, 'Could not load catalog metadata.'));
        this.metadataLoading.set(false);
      },
    });
  }

  protected updateCategoryForm<K extends keyof CategoryMetadataForm>(
    field: K,
    value: CategoryMetadataForm[K],
  ): void {
    this.categoryForm.update((form) => ({ ...form, [field]: value }));
  }

  protected updateProductTypeForm<K extends keyof ProductTypeMetadataForm>(
    field: K,
    value: ProductTypeMetadataForm[K],
  ): void {
    this.productTypeForm.update((form) => ({ ...form, [field]: value }));
  }

  protected setContentLanguage(language: AppLanguage): void {
    if (language === this.contentLanguage()) {
      return;
    }
    this.contentLanguage.set(language);
    // Keep the storefront language in sync so the site header reflects the editor's choice.
    this.locale.setLanguage(language);
    this.reloadContentEditors();
  }

  /** Reloads every language-aware content editor for the current {@link contentLanguage}. */
  private reloadContentEditors(): void {
    this.loadContactContent();
    this.loadHistoryContent();
    this.loadHomeContent();
    this.loadHeaderContent();
    this.loadShopContent();
    this.loadCollectionsContent();
    this.loadReviewsContent();
    this.loadFooterContent();
  }

  protected loadContactContent(): void {
    if (!this.canManageContact()) {
      return;
    }
    this.contactContentLoading.set(true);
    this.contactContentError.set(null);
    this.contactContentSuccess.set(null);
    this.admin.siteContent(this.contentLanguage()).subscribe({
      next: (content) => {
        const brand = this.readBrandContent(content);
        const contactPage = this.readContactPageContent(content);
        const contactInfo = this.readContactInfoBlocks(content);
        const contactSubjects = this.readContactSubjects(content);
        const faqs = this.readFaqEntries(content);
        this.contactContentForm.set(
          emptyContactContentForm(contactPage, brand, contactInfo, contactSubjects, faqs),
        );
        this.contactContentLoading.set(false);
      },
      error: (error: unknown) => {
        this.contactContentError.set(apiErrorMessage(error, 'Could not load contact page content.'));
        this.contactContentLoading.set(false);
      },
    });
  }

  protected updateContactContentForm<K extends Exclude<keyof ContactContentForm, 'infoBlocks' | 'faqs'>>(
    field: K,
    value: ContactContentForm[K],
  ): void {
    this.contactContentForm.update((form) => ({ ...form, [field]: value }));
  }

  protected addContactInfoBlock(): void {
    this.contactContentForm.update((form) => ({
      ...form,
      infoBlocks: [
        ...form.infoBlocks,
        { uid: nextEditorUid('contact-block'), title: '', linesText: '' },
      ],
    }));
  }

  protected updateContactInfoBlock(
    blockUid: string,
    field: keyof Omit<ContactInfoBlockForm, 'uid'>,
    value: string,
  ): void {
    this.contactContentForm.update((form) => ({
      ...form,
      infoBlocks: form.infoBlocks.map((block) =>
        block.uid === blockUid ? { ...block, [field]: value } : block,
      ),
    }));
  }

  protected removeContactInfoBlock(blockUid: string): void {
    this.contactContentForm.update((form) => ({
      ...form,
      infoBlocks: form.infoBlocks.filter((block) => block.uid !== blockUid),
    }));
  }

  protected addFaqEntry(): void {
    this.contactContentForm.update((form) => ({
      ...form,
      faqs: [...form.faqs, { uid: nextEditorUid('faq'), question: '', answer: '' }],
    }));
  }

  protected updateFaqEntry(
    faqUid: string,
    field: keyof Omit<FaqEntryForm, 'uid'>,
    value: string,
  ): void {
    this.contactContentForm.update((form) => ({
      ...form,
      faqs: form.faqs.map((faq) => (faq.uid === faqUid ? { ...faq, [field]: value } : faq)),
    }));
  }

  protected removeFaqEntry(faqUid: string): void {
    this.contactContentForm.update((form) => ({
      ...form,
      faqs: form.faqs.filter((faq) => faq.uid !== faqUid),
    }));
  }

  protected saveContactContent(): void {
    if (!this.canManageContact() || this.contactContentSaving()) {
      return;
    }

    const form = this.contactContentForm();
    const infoBlocks = this.normalizeContactInfoBlocks(form.infoBlocks);
    const faqs = this.normalizeFaqEntries(form.faqs);
    const subjects = this.normalizeLines(form.subjectOptions);
    const problems: string[] = [];

    if (!form.pageTitle.trim()) {
      problems.push('Page title is required.');
    }
    if (!form.introTitle.trim()) {
      problems.push('Intro title is required.');
    }
    if (!form.formTitle.trim()) {
      problems.push('Form title is required.');
    }
    if (!form.email.trim()) {
      problems.push('Email is required.');
    }
    if (infoBlocks.length === 0) {
      problems.push('Add at least one contact info block.');
    }
    if (subjects.length === 0) {
      problems.push('Add at least one contact subject.');
    }
    if (faqs.length === 0) {
      problems.push('Add at least one FAQ entry.');
    }

    if (problems.length > 0) {
      this.contactContentError.set(problems.join(' '));
      this.contactContentSuccess.set(null);
      return;
    }

    this.contactContentSaving.set(true);
    this.contactContentError.set(null);
    this.contactContentSuccess.set(null);

    const brandPayload: BrandContent = {
      ...this.content.brand,
      email: form.email.trim(),
      phone: form.phone.trim(),
      instagramHandle: form.instagramHandle.trim(),
      instagramUrl: form.instagramUrl.trim(),
    };
    const contactPagePayload: ContactPageContent = {
      pageTitle: form.pageTitle.trim(),
      pageCrumb: form.pageCrumb.trim(),
      pageSubtitle: form.pageSubtitle.trim(),
      introTitle: form.introTitle.trim(),
      introText: form.introText.trim(),
      getInTouchTitle: form.getInTouchTitle.trim(),
      customerServiceTitle: form.customerServiceTitle.trim(),
      customerServiceText: form.customerServiceText.trim(),
      formTitle: form.formTitle.trim(),
      formIntro: form.formIntro.trim(),
    };

    forkJoin({
      brand: this.admin.upsertContentBlock('brand', brandPayload, this.contentLanguage()),
      contactPage: this.admin.upsertContentBlock(
        'contactPage',
        contactPagePayload,
        this.contentLanguage(),
      ),
      contactInfo: this.admin.upsertContentBlock('contactInfo', infoBlocks, this.contentLanguage()),
      contactSubjects: this.admin.upsertContentBlock('contactSubjects', subjects, this.contentLanguage()),
      faqs: this.admin.upsertContentBlock('faqs', faqs, this.contentLanguage()),
    }).subscribe({
      next: () => {
        this.contactContentSaving.set(false);
        this.contactContentSuccess.set(
          `Contact page content saved (${this.contentLanguage().toUpperCase()}).`,
        );
        this.toast.show('Contact page content saved.');
        this.content.load().subscribe({ next: () => undefined, error: () => undefined });
        this.loadContactContent();
      },
      error: (error: unknown) => {
        this.contactContentSaving.set(false);
        this.contactContentError.set(apiErrorMessage(error, 'Could not save the contact page content.'));
      },
    });
  }

  protected loadHistoryContent(): void {
    if (!this.canManageHistory()) {
      return;
    }
    this.historyContentLoading.set(true);
    this.historyContentError.set(null);
    this.historyContentSuccess.set(null);
    this.admin.siteContent(this.contentLanguage()).subscribe({
      next: (content) => {
        const historyPage = this.readHistoryPageContent(content);
        const historyIntro = this.readHistoryIntroContent(content);
        const timeline = this.readTimelineEntries(content);
        const sections = this.readHistorySectionsContent(content);
        const craftSteps = this.readCraftSteps(content);
        const values = this.readValues(content);
        this.historyContentForm.set(
          emptyHistoryContentForm(historyPage, historyIntro, timeline, sections, craftSteps, values),
        );
        this.historyContentLoading.set(false);
      },
      error: (error: unknown) => {
        this.historyContentError.set(apiErrorMessage(error, 'Could not load history page content.'));
        this.historyContentLoading.set(false);
      },
    });
  }

  protected updateHistoryContentForm<
    K extends Exclude<keyof HistoryContentForm, 'timeline' | 'craftSteps' | 'values'>,
  >(field: K, value: HistoryContentForm[K]): void {
    this.historyContentForm.update((form) => ({ ...form, [field]: value }));
  }

  protected addTimelineEntry(): void {
    this.historyContentForm.update((form) => ({
      ...form,
      timeline: [...form.timeline, { uid: nextEditorUid('timeline'), year: '', title: '', text: '' }],
    }));
  }

  protected updateTimelineEntry(
    entryUid: string,
    field: keyof Omit<TimelineEntryForm, 'uid'>,
    value: string,
  ): void {
    this.historyContentForm.update((form) => ({
      ...form,
      timeline: form.timeline.map((entry) =>
        entry.uid === entryUid ? { ...entry, [field]: value } : entry,
      ),
    }));
  }

  protected removeTimelineEntry(entryUid: string): void {
    this.historyContentForm.update((form) => ({
      ...form,
      timeline: form.timeline.filter((entry) => entry.uid !== entryUid),
    }));
  }

  protected addCraftStep(): void {
    this.historyContentForm.update((form) => ({
      ...form,
      craftSteps: [
        ...form.craftSteps,
        { uid: nextEditorUid('craft'), icon: 'layers', title: '', text: '' },
      ],
    }));
  }

  protected updateCraftStep<K extends keyof Omit<CraftStepForm, 'uid'>>(
    stepUid: string,
    field: K,
    value: CraftStepForm[K],
  ): void {
    this.historyContentForm.update((form) => ({
      ...form,
      craftSteps: form.craftSteps.map((step) =>
        step.uid === stepUid ? { ...step, [field]: value } : step,
      ),
    }));
  }

  protected removeCraftStep(stepUid: string): void {
    this.historyContentForm.update((form) => ({
      ...form,
      craftSteps: form.craftSteps.filter((step) => step.uid !== stepUid),
    }));
  }

  protected addValueItem(): void {
    this.historyContentForm.update((form) => ({
      ...form,
      values: [...form.values, { uid: nextEditorUid('value'), number: '', title: '', text: '' }],
    }));
  }

  protected updateValueItem(
    valueUid: string,
    field: keyof Omit<ValueItemForm, 'uid'>,
    value: string,
  ): void {
    this.historyContentForm.update((form) => ({
      ...form,
      values: form.values.map((item) =>
        item.uid === valueUid ? { ...item, [field]: value } : item,
      ),
    }));
  }

  protected removeValueItem(valueUid: string): void {
    this.historyContentForm.update((form) => ({
      ...form,
      values: form.values.filter((item) => item.uid !== valueUid),
    }));
  }

  protected saveHistoryContent(): void {
    if (!this.canManageHistory() || this.historyContentSaving()) {
      return;
    }

    const form = this.historyContentForm();
    const paragraphs = this.normalizeLines(form.introParagraphsText);
    const timeline = this.normalizeTimelineEntries(form.timeline);
    const craftSteps = this.normalizeCraftSteps(form.craftSteps);
    const values = this.normalizeValues(form.values);
    const problems: string[] = [];

    if (!form.pageTitle.trim()) {
      problems.push('Page title is required.');
    }
    if (!form.introTitle.trim()) {
      problems.push('Intro title is required.');
    }
    if (paragraphs.length === 0) {
      problems.push('Add at least one intro paragraph.');
    }
    if (timeline.length === 0) {
      problems.push('Add at least one timeline entry.');
    }
    if (craftSteps.length === 0) {
      problems.push('Add at least one craft step.');
    }
    if (values.length === 0) {
      problems.push('Add at least one value.');
    }

    if (problems.length > 0) {
      this.historyContentError.set(problems.join(' '));
      this.historyContentSuccess.set(null);
      return;
    }

    this.historyContentSaving.set(true);
    this.historyContentError.set(null);
    this.historyContentSuccess.set(null);

    const historyPagePayload: HistoryPageContent = {
      pageTitle: form.pageTitle.trim(),
      pageCrumb: form.pageCrumb.trim(),
      pageSubtitle: form.pageSubtitle.trim(),
    };
    const historyIntroPayload: HistoryIntroContent = {
      title: form.introTitle.trim(),
      lead: form.introLead.trim(),
      paragraphs,
    };
    const historySectionsPayload: HistorySectionsContent = {
      craftTitle: form.craftTitle.trim(),
      craftSubtitle: form.craftSubtitle.trim(),
      valuesTitle: form.valuesTitle.trim(),
    };

    forkJoin({
      historyPage: this.admin.upsertContentBlock(
        'historyPage',
        historyPagePayload,
        this.contentLanguage(),
      ),
      historyIntro: this.admin.upsertContentBlock(
        'historyIntro',
        historyIntroPayload,
        this.contentLanguage(),
      ),
      timeline: this.admin.upsertContentBlock('timeline', timeline, this.contentLanguage()),
      historySections: this.admin.upsertContentBlock(
        'historySections',
        historySectionsPayload,
        this.contentLanguage(),
      ),
      craftSteps: this.admin.upsertContentBlock('craftSteps', craftSteps, this.contentLanguage()),
      values: this.admin.upsertContentBlock('values', values, this.contentLanguage()),
    }).subscribe({
      next: () => {
        this.historyContentSaving.set(false);
        this.historyContentSuccess.set(
          `History page content saved (${this.contentLanguage().toUpperCase()}).`,
        );
        this.toast.show('History page content saved.');
        this.content.load().subscribe({ next: () => undefined, error: () => undefined });
        this.loadHistoryContent();
      },
      error: (error: unknown) => {
        this.historyContentSaving.set(false);
        this.historyContentError.set(apiErrorMessage(error, 'Could not save the history page content.'));
      },
    });
  }

  protected loadHomeContent(): void {
    if (!this.canManageSiteContent()) {
      return;
    }
    this.homeContentLoading.set(true);
    this.homeContentError.set(null);
    this.homeContentSuccess.set(null);
    this.admin.siteContent(this.contentLanguage()).subscribe({
      next: (content) => {
        const hero = this.readHeroContent(content);
        const sections = this.readHomeSectionsContent(content);
        const featured = this.readFeaturedPieceContent(content);
        const about = this.readAboutContent(content);
        const testimonials = this.readTestimonials(content);
        const tiles = this.readCategoryTiles(content);
        this.featuredPieceRaw.set(featured);
        this.aboutRaw.set(about);
        this.categoryTilesRaw.set(tiles);
        this.homeContentForm.set(
          emptyHomeContentForm(hero, sections, featured, about, testimonials, tiles),
        );
        this.homeContentLoading.set(false);
      },
      error: (error: unknown) => {
        this.homeContentError.set(apiErrorMessage(error, 'Could not load home page content.'));
        this.homeContentLoading.set(false);
      },
    });
  }

  protected updateHomeContentForm<
    K extends Exclude<keyof HomeContentForm, 'aboutStats' | 'testimonials' | 'categoryTiles'>,
  >(field: K, value: HomeContentForm[K]): void {
    this.homeContentForm.update((form) => ({ ...form, [field]: value }));
  }

  protected addAboutStat(): void {
    this.homeContentForm.update((form) => ({
      ...form,
      aboutStats: [...form.aboutStats, { uid: nextEditorUid('stat'), value: '', label: '' }],
    }));
  }

  protected updateAboutStat(statUid: string, field: 'value' | 'label', value: string): void {
    this.homeContentForm.update((form) => ({
      ...form,
      aboutStats: form.aboutStats.map((stat) =>
        stat.uid === statUid ? { ...stat, [field]: value } : stat,
      ),
    }));
  }

  protected removeAboutStat(statUid: string): void {
    this.homeContentForm.update((form) => ({
      ...form,
      aboutStats: form.aboutStats.filter((stat) => stat.uid !== statUid),
    }));
  }

  protected addTestimonial(): void {
    this.homeContentForm.update((form) => ({
      ...form,
      testimonials: [
        ...form.testimonials,
        { uid: nextEditorUid('testimonial'), author: '', location: '', rating: 5, text: '' },
      ],
    }));
  }

  protected updateTestimonial(
    testimonialUid: string,
    field: keyof Omit<TestimonialForm, 'uid'>,
    value: string | number | null,
  ): void {
    this.homeContentForm.update((form) => ({
      ...form,
      testimonials: form.testimonials.map((item) =>
        item.uid === testimonialUid ? { ...item, [field]: value } : item,
      ),
    }));
  }

  protected removeTestimonial(testimonialUid: string): void {
    this.homeContentForm.update((form) => ({
      ...form,
      testimonials: form.testimonials.filter((item) => item.uid !== testimonialUid),
    }));
  }

  protected updateCategoryTile(tileUid: string, field: 'title' | 'count', value: string): void {
    this.homeContentForm.update((form) => ({
      ...form,
      categoryTiles: form.categoryTiles.map((tile) =>
        tile.uid === tileUid ? { ...tile, [field]: value } : tile,
      ),
    }));
  }

  protected saveHomeContent(): void {
    if (!this.canManageSiteContent() || this.homeContentSaving()) {
      return;
    }

    const form = this.homeContentForm();
    const titleLines = this.normalizeLines(form.heroTitleLinesText);
    const aboutParagraphs = this.normalizeLines(form.aboutParagraphsText);
    const testimonials = this.normalizeTestimonials(form.testimonials);
    const problems: string[] = [];

    if (titleLines.length === 0) {
      problems.push('Add at least one hero title line.');
    }
    if (!form.worldTitle.trim()) {
      problems.push('Section title "Explore Our World" is required.');
    }
    if (!form.featuredTitle.trim()) {
      problems.push('Featured section title is required.');
    }
    if (!form.aboutTitle.trim()) {
      problems.push('About title is required.');
    }
    if (aboutParagraphs.length === 0) {
      problems.push('Add at least one about paragraph.');
    }

    if (problems.length > 0) {
      this.homeContentError.set(problems.join(' '));
      this.homeContentSuccess.set(null);
      return;
    }

    this.homeContentSaving.set(true);
    this.homeContentError.set(null);
    this.homeContentSuccess.set(null);

    const heroPayload: HeroContent = {
      tagline: form.heroTagline.trim(),
      titleLines,
      subtitle: form.heroSubtitle.trim(),
      ctaLabel: form.heroCtaLabel.trim(),
      scrollLabel: form.heroScrollLabel.trim(),
    };
    const homeSectionsPayload: HomeSectionsContent = {
      worldTitle: form.worldTitle.trim(),
      worldSubtitle: form.worldSubtitle.trim(),
      featuredTitle: form.featuredTitle.trim(),
      featuredSubtitle: form.featuredSubtitle.trim(),
      featuredCta: form.featuredCta.trim(),
      testimonialsTitle: form.testimonialsTitle.trim(),
      instagramTitle: form.instagramTitle.trim(),
    };
    const featuredPiecePayload: FeaturedPieceContent = {
      ...this.featuredPieceRaw(),
      tag: form.featuredPieceTag.trim(),
      title: form.featuredPieceTitle.trim(),
      text: form.featuredPieceText.trim(),
      ctaLabel: form.featuredPieceCta.trim(),
    };
    const aboutPayload: AboutContent = {
      ...this.aboutRaw(),
      title: form.aboutTitle.trim(),
      paragraphs: aboutParagraphs,
      stats: this.normalizeStats(form.aboutStats),
    };
    const categoryTilesPayload = this.mergeCategoryTiles(form.categoryTiles);

    forkJoin({
      hero: this.admin.upsertContentBlock('hero', heroPayload, this.contentLanguage()),
      homeSections: this.admin.upsertContentBlock(
        'homeSections',
        homeSectionsPayload,
        this.contentLanguage(),
      ),
      featuredPiece: this.admin.upsertContentBlock(
        'featuredPiece',
        featuredPiecePayload,
        this.contentLanguage(),
      ),
      about: this.admin.upsertContentBlock('about', aboutPayload, this.contentLanguage()),
      testimonials: this.admin.upsertContentBlock(
        'testimonials',
        testimonials,
        this.contentLanguage(),
      ),
      categoryTiles: this.admin.upsertContentBlock(
        'categoryTiles',
        categoryTilesPayload,
        this.contentLanguage(),
      ),
    }).subscribe({
      next: () => {
        this.homeContentSaving.set(false);
        this.homeContentSuccess.set(
          `Home page content saved (${this.contentLanguage().toUpperCase()}).`,
        );
        this.toast.show('Home page content saved.');
        this.content.load().subscribe({ next: () => undefined, error: () => undefined });
        this.catalog.reload().subscribe({ next: () => undefined, error: () => undefined });
        this.loadHomeContent();
      },
      error: (error: unknown) => {
        this.homeContentSaving.set(false);
        this.homeContentError.set(apiErrorMessage(error, 'Could not save the home page content.'));
      },
    });
  }

  protected loadCollectionsContent(): void {
    if (!this.canManageSiteContent()) {
      return;
    }
    this.collectionsContentLoading.set(true);
    this.collectionsContentError.set(null);
    this.collectionsContentSuccess.set(null);
    this.admin.siteContent(this.contentLanguage()).subscribe({
      next: (content) => {
        const page = this.readCollectionsPageContent(content);
        const collections = this.readCollectionBlocks(content);
        this.collectionBlocksRaw.set(collections);
        this.collectionsContentForm.set(emptyCollectionsContentForm(page, collections));
        this.collectionsContentLoading.set(false);
      },
      error: (error: unknown) => {
        this.collectionsContentError.set(
          apiErrorMessage(error, 'Could not load collections page content.'),
        );
        this.collectionsContentLoading.set(false);
      },
    });
  }

  protected updateCollectionsContentForm<
    K extends Exclude<keyof CollectionsContentForm, 'collections'>,
  >(field: K, value: CollectionsContentForm[K]): void {
    this.collectionsContentForm.update((form) => ({ ...form, [field]: value }));
  }

  protected updateCollectionBlock(
    blockUid: string,
    field: keyof Omit<CollectionBlockForm, 'uid'>,
    value: string,
  ): void {
    this.collectionsContentForm.update((form) => ({
      ...form,
      collections: form.collections.map((block) =>
        block.uid === blockUid ? { ...block, [field]: value } : block,
      ),
    }));
  }

  protected saveCollectionsContent(): void {
    if (!this.canManageSiteContent() || this.collectionsContentSaving()) {
      return;
    }

    const form = this.collectionsContentForm();
    const problems: string[] = [];

    if (!form.pageTitle.trim()) {
      problems.push('Page title is required.');
    }
    if (form.collections.length === 0) {
      problems.push('Add at least one collection block.');
    }

    if (problems.length > 0) {
      this.collectionsContentError.set(problems.join(' '));
      this.collectionsContentSuccess.set(null);
      return;
    }

    this.collectionsContentSaving.set(true);
    this.collectionsContentError.set(null);
    this.collectionsContentSuccess.set(null);

    const collectionsPagePayload: CollectionsPageContent = {
      pageTitle: form.pageTitle.trim(),
      pageCrumb: form.pageCrumb.trim(),
      pageSubtitle: form.pageSubtitle.trim(),
    };
    const collectionsPayload = this.mergeCollectionBlocks(form.collections);

    forkJoin({
      collectionsPage: this.admin.upsertContentBlock(
        'collectionsPage',
        collectionsPagePayload,
        this.contentLanguage(),
      ),
      collections: this.admin.upsertContentBlock(
        'collections',
        collectionsPayload,
        this.contentLanguage(),
      ),
    }).subscribe({
      next: () => {
        this.collectionsContentSaving.set(false);
        this.collectionsContentSuccess.set(
          `Collections content saved (${this.contentLanguage().toUpperCase()}).`,
        );
        this.toast.show('Collections content saved.');
        this.content.load().subscribe({ next: () => undefined, error: () => undefined });
        this.catalog.reload().subscribe({ next: () => undefined, error: () => undefined });
        this.loadCollectionsContent();
      },
      error: (error: unknown) => {
        this.collectionsContentSaving.set(false);
        this.collectionsContentError.set(
          apiErrorMessage(error, 'Could not save the collections content.'),
        );
      },
    });
  }

  protected loadReviewsContent(): void {
    if (!this.canManageSiteContent()) {
      return;
    }
    this.reviewsContentLoading.set(true);
    this.reviewsContentError.set(null);
    this.reviewsContentSuccess.set(null);
    this.admin.siteContent(this.contentLanguage()).subscribe({
      next: (content) => {
        const page = this.readReviewsPageContent(content);
        const filters = this.readReviewFilters(content);
        this.reviewsContentForm.set(emptyReviewsContentForm(page, filters));
        this.reviewsContentLoading.set(false);
      },
      error: (error: unknown) => {
        this.reviewsContentError.set(apiErrorMessage(error, 'Could not load reviews page content.'));
        this.reviewsContentLoading.set(false);
      },
    });
  }

  protected updateReviewsContentForm<K extends Exclude<keyof ReviewsContentForm, 'filters'>>(
    field: K,
    value: ReviewsContentForm[K],
  ): void {
    this.reviewsContentForm.update((form) => ({ ...form, [field]: value }));
  }

  protected updateReviewFilter(filterUid: string, value: string): void {
    this.reviewsContentForm.update((form) => ({
      ...form,
      filters: form.filters.map((filter) =>
        filter.uid === filterUid ? { ...filter, label: value } : filter,
      ),
    }));
  }

  protected saveReviewsContent(): void {
    if (!this.canManageSiteContent() || this.reviewsContentSaving()) {
      return;
    }

    const form = this.reviewsContentForm();
    const filters = this.normalizeReviewFilters(form.filters);
    const problems: string[] = [];

    if (!form.pageTitle.trim()) {
      problems.push('Page title is required.');
    }
    if (!form.writeTitle.trim()) {
      problems.push('Write-review title is required.');
    }
    if (filters.length === 0) {
      problems.push('Add at least one review filter label.');
    }

    if (problems.length > 0) {
      this.reviewsContentError.set(problems.join(' '));
      this.reviewsContentSuccess.set(null);
      return;
    }

    this.reviewsContentSaving.set(true);
    this.reviewsContentError.set(null);
    this.reviewsContentSuccess.set(null);

    const reviewsPagePayload: ReviewsPageContent = {
      pageTitle: form.pageTitle.trim(),
      pageCrumb: form.pageCrumb.trim(),
      pageSubtitle: form.pageSubtitle.trim(),
      writeTitle: form.writeTitle.trim(),
      writeText: form.writeText.trim(),
      writeButton: form.writeButton.trim(),
      emptyText: form.emptyText.trim(),
    };

    forkJoin({
      reviewsPage: this.admin.upsertContentBlock(
        'reviewsPage',
        reviewsPagePayload,
        this.contentLanguage(),
      ),
      reviewFilters: this.admin.upsertContentBlock(
        'reviewFilters',
        filters,
        this.contentLanguage(),
      ),
    }).subscribe({
      next: () => {
        this.reviewsContentSaving.set(false);
        this.reviewsContentSuccess.set(
          `Reviews content saved (${this.contentLanguage().toUpperCase()}).`,
        );
        this.toast.show('Reviews content saved.');
        this.content.load().subscribe({ next: () => undefined, error: () => undefined });
        this.loadReviewsContent();
      },
      error: (error: unknown) => {
        this.reviewsContentSaving.set(false);
        this.reviewsContentError.set(apiErrorMessage(error, 'Could not save the reviews content.'));
      },
    });
  }

  protected loadHeaderContent(): void {
    if (!this.canManageSiteContent()) {
      return;
    }
    this.headerContentLoading.set(true);
    this.headerContentError.set(null);
    this.headerContentSuccess.set(null);
    this.headerLogoNotice.set(null);
    this.admin.siteContent(this.contentLanguage()).subscribe({
      next: (content) => {
        const payload = this.readHeaderButtonsContent(content);
        const brand = this.readObjectBlock(content, 'brand', this.content.brand);
        this.headerContentForm.set(emptyHeaderButtonsForm(payload, brand));
        this.headerContentLoading.set(false);
      },
      error: (error: unknown) => {
        this.headerContentError.set(
          apiErrorMessage(error, 'Could not load the header button settings.'),
        );
        this.headerContentLoading.set(false);
      },
    });
  }

  protected updateHeaderContentForm<K extends keyof HeaderButtonsForm>(
    field: K,
    value: HeaderButtonsForm[K],
  ): void {
    this.headerContentForm.update((form) => ({ ...form, [field]: value }));
  }

  protected onHeaderLogoSelected(event: Event): void {
    if (!this.canManageSiteContent()) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.headerLogoUploading.set(true);
    this.headerContentError.set(null);
    this.headerLogoNotice.set(null);
    this.admin.uploadMedia(file, 'branding').subscribe({
      next: (media) => {
        this.headerLogoUploading.set(false);
        this.updateHeaderContentForm('logoImageUrl', media.url);
        this.headerLogoNotice.set(null);
        this.toast.show('Logo image uploaded.');
      },
      error: (error: unknown) => {
        this.headerLogoUploading.set(false);
        this.headerLogoNotice.set(apiErrorMessage(error, 'Logo image upload failed.'));
      },
    });
  }

  protected removeHeaderLogo(): void {
    this.updateHeaderContentForm('logoImageUrl', '');
    this.headerLogoNotice.set(null);
  }

  protected saveHeaderContent(): void {
    if (!this.canManageSiteContent() || this.headerContentSaving()) {
      return;
    }

    this.headerContentSaving.set(true);
    this.headerContentError.set(null);
    this.headerContentSuccess.set(null);

    const form = this.headerContentForm();
    const headerButtonsPayload: HeaderButtonsContent = {
      logoImageUrl: form.logoImageUrl.trim(),
      showLogoTextWithImage: form.showLogoTextWithImage,
      showHome: form.showHome,
      showShop: form.showShop,
      showCollections: form.showCollections,
      showHistory: form.showHistory,
      showContact: form.showContact,
      showLanguage: form.showLanguage,
      showCurrency: form.showCurrency,
      showSearch: form.showSearch,
      showCart: form.showCart,
      showAccount: form.showAccount,
    };
    const brandPayload: BrandContent = {
      ...this.content.brand,
      shortName: form.brandShortName.trim(),
      suffix: form.brandSuffix.trim(),
      announcement: form.announcement.trim(),
    };

    forkJoin({
      headerButtons: this.admin.upsertContentBlock('headerButtons', headerButtonsPayload),
      brand: this.admin.upsertContentBlock('brand', brandPayload, this.contentLanguage()),
    }).subscribe({
      next: () => {
        this.headerContentSaving.set(false);
        this.headerContentSuccess.set(
          `Header content saved (${this.contentLanguage().toUpperCase()}).`,
        );
        this.toast.show('Header content saved.');
        this.content.load().subscribe({ next: () => undefined, error: () => undefined });
        this.loadHeaderContent();
        this.loadFooterContent();
      },
      error: (error: unknown) => {
        this.headerContentSaving.set(false);
        this.headerContentError.set(apiErrorMessage(error, 'Could not save the header content.'));
      },
    });
  }

  protected loadShopContent(): void {
    if (!this.canManageSiteContent()) {
      return;
    }
    this.shopContentLoading.set(true);
    this.shopContentError.set(null);
    this.shopContentSuccess.set(null);
    this.admin.siteContent(this.contentLanguage()).subscribe({
      next: (content) => {
        const payload = this.readShopPriceRangesContent(content);
        this.shopContentForm.set(emptyShopContentForm(payload, this.shopCurrencyOptions(payload)));
        this.shopContentLoading.set(false);
      },
      error: (error: unknown) => {
        this.shopContentError.set(
          apiErrorMessage(error, 'Could not load the shop price range settings.'),
        );
        this.shopContentLoading.set(false);
      },
    });
  }

  protected addShopRange(currencyCode: string): void {
    this.shopContentForm.update((form) => ({
      ...form,
      currencies: form.currencies.map((currency) =>
        currency.code === currencyCode
          ? {
              ...currency,
              ranges: [
                ...currency.ranges,
                { uid: nextEditorUid('shop-range'), min: null, max: null },
              ],
            }
          : currency,
      ),
    }));
  }

  protected updateShopRange(
    currencyCode: string,
    rangeUid: string,
    field: keyof Omit<ShopPriceRangeForm, 'uid'>,
    value: unknown,
  ): void {
    const parsed = this.optionalNumber(value);
    this.shopContentForm.update((form) => ({
      ...form,
      currencies: form.currencies.map((currency) =>
        currency.code === currencyCode
          ? {
              ...currency,
              ranges: currency.ranges.map((range) =>
                range.uid === rangeUid ? { ...range, [field]: parsed } : range,
              ),
            }
          : currency,
      ),
    }));
  }

  protected removeShopRange(currencyCode: string, rangeUid: string): void {
    this.shopContentForm.update((form) => ({
      ...form,
      currencies: form.currencies.map((currency) =>
        currency.code === currencyCode
          ? {
              ...currency,
              ranges: currency.ranges.filter((range) => range.uid !== rangeUid),
            }
          : currency,
      ),
    }));
  }

  protected saveShopContent(): void {
    if (!this.canManageSiteContent() || this.shopContentSaving()) {
      return;
    }

    this.shopContentSaving.set(true);
    this.shopContentError.set(null);
    this.shopContentSuccess.set(null);

    const payload = this.buildShopPriceRangesPayload();
    if (!payload) {
      this.shopContentSaving.set(false);
      return;
    }

    forkJoin({
      en: this.admin.upsertContentBlock('shopPriceRanges', payload, 'en'),
      pt: this.admin.upsertContentBlock('shopPriceRanges', payload, 'pt'),
    }).subscribe({
      next: () => {
        this.shopContentSaving.set(false);
        this.shopContentSuccess.set('Shop price ranges saved for EN and PT.');
        this.toast.show('Shop price ranges saved for EN and PT.');
        this.content.load().subscribe({ next: () => undefined, error: () => undefined });
        this.loadShopContent();
      },
      error: (error: unknown) => {
        this.shopContentSaving.set(false);
        this.shopContentError.set(
          apiErrorMessage(error, 'Could not save the shop price range settings.'),
        );
      },
    });
  }

  protected loadFooterContent(): void {
    if (!this.canManageSiteContent()) {
      return;
    }
    this.footerContentLoading.set(true);
    this.footerContentError.set(null);
    this.footerContentSuccess.set(null);
    this.admin.siteContent(this.contentLanguage()).subscribe({
      next: (content) => {
        const brand = this.readBrandContent(content);
        const navLinks = this.readNavLinks(content);
        const footerColumns = this.readFooterColumns(content);
        const footerTagline = this.readFooterTagline(content);
        const socialLinks = this.readSocialLinks(content);
        this.footerContentForm.set(
          emptyFooterContentForm(brand, navLinks, footerColumns, footerTagline, socialLinks),
        );
        this.footerContentLoading.set(false);
      },
      error: (error: unknown) => {
        this.footerContentError.set(
          apiErrorMessage(error, 'Could not load the footer and navigation content.'),
        );
        this.footerContentLoading.set(false);
      },
    });
  }

  protected updateFooterContentForm<
    K extends Exclude<keyof FooterContentForm, 'navLinks' | 'footerColumns' | 'socialLinks'>,
  >(field: K, value: FooterContentForm[K]): void {
    this.footerContentForm.update((form) => ({ ...form, [field]: value }));
  }

  protected addNavLink(): void {
    this.footerContentForm.update((form) => ({
      ...form,
      navLinks: [...form.navLinks, { uid: nextEditorUid('link'), label: '', route: '/' }],
    }));
  }

  protected updateNavLink(linkUid: string, field: 'label' | 'route', value: string): void {
    this.footerContentForm.update((form) => ({
      ...form,
      navLinks: form.navLinks.map((link) =>
        link.uid === linkUid ? { ...link, [field]: value } : link,
      ),
    }));
  }

  protected removeNavLink(linkUid: string): void {
    this.footerContentForm.update((form) => ({
      ...form,
      navLinks: form.navLinks.filter((link) => link.uid !== linkUid),
    }));
  }

  protected addFooterColumn(): void {
    this.footerContentForm.update((form) => ({
      ...form,
      footerColumns: [
        ...form.footerColumns,
        { uid: nextEditorUid('column'), title: '', links: [] },
      ],
    }));
  }

  protected updateFooterColumnTitle(columnUid: string, value: string): void {
    this.footerContentForm.update((form) => ({
      ...form,
      footerColumns: form.footerColumns.map((column) =>
        column.uid === columnUid ? { ...column, title: value } : column,
      ),
    }));
  }

  protected removeFooterColumn(columnUid: string): void {
    this.footerContentForm.update((form) => ({
      ...form,
      footerColumns: form.footerColumns.filter((column) => column.uid !== columnUid),
    }));
  }

  protected addFooterColumnLink(columnUid: string): void {
    this.footerContentForm.update((form) => ({
      ...form,
      footerColumns: form.footerColumns.map((column) =>
        column.uid === columnUid
          ? {
              ...column,
              links: [...column.links, { uid: nextEditorUid('link'), label: '', route: '/' }],
            }
          : column,
      ),
    }));
  }

  protected updateFooterColumnLink(
    columnUid: string,
    linkUid: string,
    field: 'label' | 'route',
    value: string,
  ): void {
    this.footerContentForm.update((form) => ({
      ...form,
      footerColumns: form.footerColumns.map((column) =>
        column.uid === columnUid
          ? {
              ...column,
              links: column.links.map((link) =>
                link.uid === linkUid ? { ...link, [field]: value } : link,
              ),
            }
          : column,
      ),
    }));
  }

  protected removeFooterColumnLink(columnUid: string, linkUid: string): void {
    this.footerContentForm.update((form) => ({
      ...form,
      footerColumns: form.footerColumns.map((column) =>
        column.uid === columnUid
          ? { ...column, links: column.links.filter((link) => link.uid !== linkUid) }
          : column,
      ),
    }));
  }

  protected addSocialLink(): void {
    this.footerContentForm.update((form) => ({
      ...form,
      socialLinks: [
        ...form.socialLinks,
        { uid: nextEditorUid('social'), label: '', title: '', href: '' },
      ],
    }));
  }

  protected updateSocialLink(
    linkUid: string,
    field: keyof Omit<SocialLinkForm, 'uid'>,
    value: string,
  ): void {
    this.footerContentForm.update((form) => ({
      ...form,
      socialLinks: form.socialLinks.map((link) =>
        link.uid === linkUid ? { ...link, [field]: value } : link,
      ),
    }));
  }

  protected removeSocialLink(linkUid: string): void {
    this.footerContentForm.update((form) => ({
      ...form,
      socialLinks: form.socialLinks.filter((link) => link.uid !== linkUid),
    }));
  }

  protected saveFooterContent(): void {
    if (!this.canManageSiteContent() || this.footerContentSaving()) {
      return;
    }

    const form = this.footerContentForm();
    const navLinks = this.normalizeNavLinks(form.navLinks);
    const footerColumns = this.normalizeFooterColumns(form.footerColumns);
    const socialLinks = this.normalizeSocialLinks(form.socialLinks);
    const problems: string[] = [];

    if (!form.brandName.trim()) {
      problems.push('Brand name is required.');
    }
    if (navLinks.length === 0) {
      problems.push('Add at least one navigation link.');
    }
    if (!form.footerTagline.trim()) {
      problems.push('Footer tagline is required.');
    }

    if (problems.length > 0) {
      this.footerContentError.set(problems.join(' '));
      this.footerContentSuccess.set(null);
      return;
    }

    this.footerContentSaving.set(true);
    this.footerContentError.set(null);
    this.footerContentSuccess.set(null);

    const brandPayload: BrandContent = {
      ...this.content.brand,
      name: form.brandName.trim(),
      shortName: form.brandShortName.trim(),
      suffix: form.brandSuffix.trim(),
      announcement: form.announcement.trim(),
    };

    forkJoin({
      brand: this.admin.upsertContentBlock('brand', brandPayload, this.contentLanguage()),
      navLinks: this.admin.upsertContentBlock('navLinks', navLinks, this.contentLanguage()),
      footerColumns: this.admin.upsertContentBlock(
        'footerColumns',
        footerColumns,
        this.contentLanguage(),
      ),
      footerTagline: this.admin.upsertContentBlock(
        'footerTagline',
        form.footerTagline.trim(),
        this.contentLanguage(),
      ),
      socialLinks: this.admin.upsertContentBlock(
        'socialLinks',
        socialLinks,
        this.contentLanguage(),
      ),
    }).subscribe({
      next: () => {
        this.footerContentSaving.set(false);
        this.footerContentSuccess.set(
          `Footer & navigation content saved (${this.contentLanguage().toUpperCase()}).`,
        );
        this.toast.show('Footer & navigation content saved.');
        this.content.load().subscribe({ next: () => undefined, error: () => undefined });
        this.loadFooterContent();
        this.loadHeaderContent();
      },
      error: (error: unknown) => {
        this.footerContentSaving.set(false);
        this.footerContentError.set(
          apiErrorMessage(error, 'Could not save the footer and navigation content.'),
        );
      },
    });
  }

  protected saveCategoryMetadata(): void {
    if (!this.canManageProducts() || this.categorySaving()) {
      return;
    }
    const form = this.categoryForm();
    if (!form.label.trim()) {
      this.metadataError.set('Category label is required.');
      return;
    }
    this.categorySaving.set(true);
    this.metadataError.set(null);
    const payload: AdminCategoryPayload = {
      slug: form.slug.trim() || null,
      label: form.label.trim(),
      description: form.description.trim() || null,
      displayOrder: form.displayOrder,
    };
    this.admin.createCategory(payload).subscribe({
      next: () => {
        this.categorySaving.set(false);
        this.categoryForm.set(emptyCategoryMetadataForm());
        this.toast.show('Category created.');
        this.loadCatalogMetadata();
        this.catalog.reload().subscribe({ next: () => undefined, error: () => undefined });
      },
      error: (error: unknown) => {
        this.categorySaving.set(false);
        this.metadataError.set(apiErrorMessage(error, 'Could not create the category.'));
      },
    });
  }

  protected saveProductTypeMetadata(): void {
    if (!this.canManageProducts() || this.productTypeSaving()) {
      return;
    }
    const form = this.productTypeForm();
    if (!form.label.trim()) {
      this.metadataError.set('Product type label is required.');
      return;
    }
    this.productTypeSaving.set(true);
    this.metadataError.set(null);
    const payload: AdminProductTypePayload = {
      slug: form.slug.trim() || null,
      label: form.label.trim(),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      displayOrder: form.displayOrder,
      presetFields: this.parsePresetFields(form.presetFields),
    };
    this.admin.createProductType(payload).subscribe({
      next: () => {
        this.productTypeSaving.set(false);
        this.productTypeForm.set({
          ...emptyProductTypeMetadataForm(),
          category: this.categoryMetadata()[0]?.slug ?? emptyProductTypeMetadataForm().category,
        });
        this.toast.show('Product type created.');
        this.loadCatalogMetadata();
      },
      error: (error: unknown) => {
        this.productTypeSaving.set(false);
        this.metadataError.set(apiErrorMessage(error, 'Could not create the product type.'));
      },
    });
  }

  protected openCreate(): void {
    if (!this.canManageProducts()) {
      return;
    }
    this.router.navigate(['/admin/products/new']);
  }

  protected openEdit(product: AdminProduct): void {
    if (!this.canManageProducts()) {
      return;
    }
    this.router.navigate(['/admin/products', product.id]);
  }

  protected closeModal(): void {
    if (this.saving()) {
      return;
    }
    this.modalOpen.set(false);
    this.formError.set(null);
    this.uploadNotice.set(null);
  }

  protected update<K extends keyof ProductForm>(field: K, value: ProductForm[K]): void {
    this.form.update((form) => ({ ...form, [field]: value }));
  }

  protected addGalleryImage(): void {
    this.form.update((form) => ({ ...form, gallery: [...form.gallery, ''] }));
  }

  protected updateGalleryImage(index: number, value: string): void {
    this.form.update((form) => ({
      ...form,
      gallery: form.gallery.map((image, position) => (position === index ? value : image)),
    }));
  }

  protected removeGalleryImage(index: number): void {
    this.form.update((form) => ({
      ...form,
      gallery: form.gallery.filter((_, position) => position !== index),
    }));
  }

  protected addVariant(): void {
    this.form.update((form) => ({ ...form, variants: [...form.variants, emptyVariant()] }));
  }

  protected removeVariant(index: number): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.filter((_, position) => position !== index),
    }));
  }

  protected updateVariant<K extends keyof Omit<VariantForm, 'uid'>>(
    index: number,
    field: K,
    value: VariantForm[K],
  ): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  }

  protected onFileSelected(event: Event): void {
    if (!this.canManageProducts()) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.uploading.set(true);
    this.formError.set(null);
    this.uploadNotice.set(null);
    this.admin.uploadMedia(file, 'products').subscribe({
      next: (media) => {
        this.uploading.set(false);
        this.update('image', media.url);
        this.uploadNotice.set(null);
        this.toast.show('Image uploaded.');
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        this.generateImage();
        this.uploadNotice.set(
          `${apiErrorMessage(error, 'Image upload failed.')} A generated image URL was added so you can continue creating the product without R2.`,
        );
      },
    });
  }

  protected onGalleryFileSelected(event: Event): void {
    if (!this.canManageProducts()) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) {
      return;
    }
    this.uploadGalleryFiles(files);
  }

  protected generateImage(): void {
    const form = this.form();
    this.update('image', this.generatedImageUrl(form));
    if (!form.imageClass.trim()) {
      this.update('imageClass', 'prod-img-1');
    }
    this.uploadNotice.set(null);
    this.toast.show('Generated image URL added.');
  }

  protected generateGalleryImage(): void {
    this.appendGalleryImage(this.generatedGalleryImageUrl(this.form(), this.form().gallery.length + 1));
    this.uploadNotice.set(null);
    this.toast.show('Generated gallery image URL added.');
  }

  protected submit(): void {
    if (!this.canManageProducts()) {
      return;
    }
    if (this.saving()) {
      return;
    }

    const form = this.form();
    const finalImage = form.image.trim() || this.generatedImageUrl(form);
    const gallery = this.normalizedGallery(form.gallery, finalImage);
    const problems: string[] = [];
    if (!form.name.trim()) {
      problems.push('Name is required.');
    }
    if (!form.description.trim()) {
      problems.push('Description is required.');
    }
    if (form.price === null || form.price <= 0) {
      problems.push('Price must be greater than 0.');
    }
    form.variants.forEach((variant, index) => {
      if (!variant.name.trim()) {
        problems.push(`Variant ${index + 1} needs a Name.`);
      }
    });

    if (problems.length > 0) {
      this.formError.set(problems.join(' '));
      return;
    }

    const variants = form.variants.map((variant, index, all) => ({
      sku: this.resolveVariantSku(form, variant, index, all),
      name: variant.name.trim(),
      priceDelta: variant.priceDelta,
      stock: variant.stock,
    }));

    const payload: AdminProductPayload = {
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      category: form.category,
      sku: null,
      price: form.price as number,
      originalPrice: form.originalPrice,
      badge: form.badge.trim() || null,
      image: finalImage,
      gallery,
      imageClass: form.imageClass.trim() || 'prod-img-1',
      description: form.description.trim(),
      inStock: form.inStock,
      stockQuantity: 0,
      date: form.date || null,
      featured: form.featured,
      customMade: form.customMade,
      displayOrder: null,
      variants,
    };

    const editingId = this.editingId();
    const isEdit = editingId !== null;
    this.saving.set(true);
    this.formError.set(null);
    this.uploadNotice.set(null);
    if (!form.image.trim()) {
      this.update('image', finalImage);
    }
    if (!form.imageClass.trim()) {
      this.update('imageClass', 'prod-img-1');
    }
    this.form.update((current) => ({
      ...current,
      gallery: this.normalizedGallery(current.gallery, finalImage),
      variants: current.variants.map((variant, index, all) => ({
        ...variant,
        sku: this.resolveVariantSku(current, variant, index, all),
        name: variant.name.trim(),
      })),
    }));

    const request = isEdit
      ? this.admin.updateProduct(editingId, payload)
      : this.admin.createProduct(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toast.show(isEdit ? 'Product updated.' : 'Product created.');
        this.refreshCatalogue();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error, 'Could not save the product.'));
      },
    });
  }

  protected requestDelete(product: AdminProduct): void {
    if (!this.canManageProducts()) {
      return;
    }
    this.deleteTarget.set(product);
  }

  protected cancelDelete(): void {
    if (this.deleting()) {
      return;
    }
    this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    if (!this.canManageProducts()) {
      return;
    }
    const target = this.deleteTarget();
    if (!target || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.admin.deleteProduct(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.show('Product deleted.');
        this.refreshCatalogue();
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        this.toast.show(apiErrorMessage(error, 'Could not delete the product.'));
      },
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.tabsMenuOpen()) {
      this.closeTabsMenu();
      return;
    }
    if (this.userDeleteTarget()) {
      this.cancelUserDelete();
      return;
    }
    if (this.orderModalOpen()) {
      this.closeOrderModal();
      return;
    }
    if (this.customOrderModalOpen()) {
      this.closeCustomOrderModal();
      return;
    }
    if (this.userModalOpen()) {
      this.closeUserModal();
      return;
    }
    if (this.deleteTarget()) {
      this.cancelDelete();
      return;
    }
    if (this.modalOpen()) {
      this.closeModal();
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.admin-tabs')) {
      return;
    }
    this.closeTabsMenu();
  }

  protected loadOrders(): void {
    this.ordersLoading.set(true);
    this.ordersError.set(null);
    this.admin.listOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.ordersPage.set(1);
        this.ordersLoading.set(false);
      },
      error: (error: unknown) => {
        this.ordersError.set(apiErrorMessage(error, 'Could not load the orders.'));
        this.ordersLoading.set(false);
      },
    });
  }

  protected loadCustomOrders(): void {
    if (!this.canManageCustomOrders()) {
      return;
    }
    this.customOrdersLoading.set(true);
    this.customOrdersError.set(null);
    this.admin.listCustomOrders().subscribe({
      next: (requests) => {
        this.customOrders.set(requests);
        this.customOrdersPage.set(1);
        this.customOrdersLoading.set(false);
      },
      error: (error: unknown) => {
        this.customOrdersError.set(apiErrorMessage(error, 'Could not load custom order requests.'));
        this.customOrdersLoading.set(false);
      },
    });
  }

  protected openOrder(order: AdminOrder): void {
    this.selectedOrder.set(order);
    this.orderForm.set({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
    });
    this.orderModalOpen.set(true);
  }

  protected closeOrderModal(): void {
    if (this.savingOrder()) {
      return;
    }
    this.orderModalOpen.set(false);
    this.selectedOrder.set(null);
    this.orderForm.set(null);
  }

  protected updateOrderField<K extends keyof OrderForm>(field: K, value: OrderForm[K]): void {
    const current = this.orderForm();
    if (!current) {
      return;
    }
    this.orderForm.set({ ...current, [field]: value });
  }

  protected saveOrder(): void {
    const form = this.orderForm();
    if (!form || this.savingOrder()) {
      return;
    }

    const payload: AdminOrderUpdatePayload = {
      status: form.status,
      paymentStatus: form.paymentStatus,
    };

    this.savingOrder.set(true);
    this.admin.updateOrder(form.orderNumber, payload).subscribe({
      next: () => {
        this.savingOrder.set(false);
        this.toast.show('Order updated.');
        this.closeOrderModal();
        this.loadOrders();
      },
      error: (error: unknown) => {
        this.savingOrder.set(false);
        this.toast.show(apiErrorMessage(error, 'Could not update the order.'));
      },
    });
  }

  protected changeCustomOrdersPage(page: number): void {
    this.customOrdersPage.set(page);
  }

  protected openCustomOrder(request: CustomOrderRequestRecord): void {
    this.selectedCustomOrder.set(request);
    this.customOrderForm.set({
      id: request.id,
      status: request.status,
      adminNotes: request.adminNotes ?? '',
    });
    this.customOrderModalOpen.set(true);
  }

  protected closeCustomOrderModal(): void {
    if (this.savingCustomOrder()) {
      return;
    }
    this.customOrderModalOpen.set(false);
    this.selectedCustomOrder.set(null);
    this.customOrderForm.set(null);
  }

  protected updateCustomOrderField<K extends keyof CustomOrderForm>(
    field: K,
    value: CustomOrderForm[K],
  ): void {
    const current = this.customOrderForm();
    if (!current) {
      return;
    }
    this.customOrderForm.set({ ...current, [field]: value });
  }

  protected saveCustomOrder(): void {
    const form = this.customOrderForm();
    if (!form || this.savingCustomOrder()) {
      return;
    }

    const payload: CustomOrderUpdatePayload = {
      status: form.status,
      adminNotes: form.adminNotes.trim() || null,
    };

    this.savingCustomOrder.set(true);
    this.admin.updateCustomOrder(form.id, payload).subscribe({
      next: () => {
        this.savingCustomOrder.set(false);
        this.toast.show('Custom order updated.');
        this.closeCustomOrderModal();
        this.loadCustomOrders();
      },
      error: (error: unknown) => {
        this.savingCustomOrder.set(false);
        this.toast.show(apiErrorMessage(error, 'Could not update the custom order.'));
      },
    });
  }

  protected loadUsers(): void {
    if (!this.canManageUsers()) {
      return;
    }
    this.usersLoading.set(true);
    this.usersError.set(null);
    this.admin.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.usersPage.set(1);
        this.usersLoading.set(false);
      },
      error: (error: unknown) => {
        this.usersError.set(apiErrorMessage(error, 'Could not load users.'));
        this.usersLoading.set(false);
      },
    });
  }

  protected openCreateUser(): void {
    if (!this.canManageUsers()) {
      return;
    }
    this.userForm.set(emptyUserForm());
    this.userFormError.set(null);
    this.userModalOpen.set(true);
  }

  protected openEditUser(user: AdminUser): void {
    if (!this.canManageUsers()) {
      return;
    }
    this.userForm.set({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName ?? '',
      email: user.email,
      password: '',
      role: user.role === 'ADMIN' ? 'ADMIN' : 'OPERATOR',
      enabled: user.enabled,
    });
    this.userFormError.set(null);
    this.userModalOpen.set(true);
  }

  protected closeUserModal(): void {
    if (this.savingUser()) {
      return;
    }
    this.userModalOpen.set(false);
    this.userFormError.set(null);
  }

  protected updateUserField<K extends keyof UserForm>(field: K, value: UserForm[K]): void {
    this.userForm.update((form) => ({ ...form, [field]: value }));
  }

  protected saveUser(): void {
    if (!this.canManageUsers() || this.savingUser()) {
      return;
    }

    const form = this.userForm();
    const problems: string[] = [];
    if (!form.firstName.trim()) {
      problems.push('First name is required.');
    }
    if (!form.email.trim()) {
      problems.push('Email is required.');
    }
    if (form.id === null && form.password.length < 4) {
      problems.push('Password must be at least 4 characters.');
    }
    if (problems.length > 0) {
      this.userFormError.set(problems.join(' '));
      return;
    }

    this.savingUser.set(true);
    this.userFormError.set(null);

    const request =
      form.id === null
        ? this.admin.createUser({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || null,
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            enabled: form.enabled,
          } satisfies AdminUserPayload)
        : this.admin.updateUser(form.id, {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || null,
            role: form.role,
            enabled: form.enabled,
          } satisfies AdminUserUpdatePayload);

    request.subscribe({
      next: () => {
        this.savingUser.set(false);
        this.userModalOpen.set(false);
        this.toast.show(form.id === null ? 'User created.' : 'User updated.');
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.savingUser.set(false);
        this.userFormError.set(apiErrorMessage(error, 'Could not save the user.'));
      },
    });
  }

  protected canDeleteUser(user: AdminUser): boolean {
    return this.canManageUsers() && !this.isRootUser(user);
  }

  protected isRootUser(user: AdminUser): boolean {
    return user.email.toLowerCase() === ROOT_ADMIN_EMAIL;
  }

  protected requestDeleteUser(user: AdminUser): void {
    if (!this.canDeleteUser(user)) {
      return;
    }
    this.userDeleteTarget.set(user);
  }

  protected cancelUserDelete(): void {
    if (this.deletingUser()) {
      return;
    }
    this.userDeleteTarget.set(null);
  }

  protected confirmUserDelete(): void {
    const user = this.userDeleteTarget();
    if (!user || !this.canDeleteUser(user) || this.deletingUser()) {
      return;
    }

    this.deletingUser.set(true);
    this.admin.deleteUser(user.id).subscribe({
      next: () => {
        this.deletingUser.set(false);
        this.userDeleteTarget.set(null);
        this.toast.show('User deleted.');
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.deletingUser.set(false);
        this.toast.show(apiErrorMessage(error, 'Could not delete the user.'));
      },
    });
  }

  protected formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat(this.localeTag(), {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.localeTag(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  protected itemCount(order: AdminOrder): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  protected roleClass(role: UserRole): string {
    return role.toLowerCase();
  }

  protected orderStatusLabel(status: AdminOrder['status']): string {
    const keyByStatus: Record<AdminOrder['status'], TranslationKey> = {
      PENDING: 'admin.orderStatus.pending',
      PAID: 'admin.orderStatus.paid',
      FULFILLED: 'admin.orderStatus.fulfilled',
      CANCELLED: 'admin.orderStatus.cancelled',
      REFUNDED: 'admin.orderStatus.refunded',
    };
    return this.t(keyByStatus[status]);
  }

  protected paymentStatusLabel(status: AdminOrder['paymentStatus']): string {
    const keyByStatus: Record<AdminOrder['paymentStatus'], TranslationKey> = {
      PENDING: 'admin.paymentStatus.pending',
      REQUIRES_ACTION: 'admin.paymentStatus.requiresAction',
      SUCCEEDED: 'admin.paymentStatus.succeeded',
      FAILED: 'admin.paymentStatus.failed',
      REFUNDED: 'admin.paymentStatus.refunded',
    };
    return this.t(keyByStatus[status]);
  }

  protected customOrderStatusLabel(status: CustomOrderStatus): string {
    const keyByStatus: Record<CustomOrderStatus, TranslationKey> = {
      SUBMITTED: 'admin.customOrders.status.submitted',
      IN_REVIEW: 'admin.customOrders.status.inReview',
      QUOTED: 'admin.customOrders.status.quoted',
      APPROVED: 'admin.customOrders.status.approved',
      DECLINED: 'admin.customOrders.status.declined',
      COMPLETED: 'admin.customOrders.status.completed',
    };
    return this.t(keyByStatus[status]);
  }

  protected customOrderTypeLabel(type: CustomOrderRequestRecord['type']): string {
    return this.t(type === 'PRODUCT' ? 'admin.customOrders.type.product' : 'admin.customOrders.type.design');
  }

  protected userRoleLabel(role: UserRole): string {
    const keyByRole: Record<UserRole, TranslationKey> = {
      ADMIN: 'admin.role.admin',
      OPERATOR: 'admin.role.operator',
      CUSTOMER: 'admin.role.customer',
    };
    return this.t(keyByRole[role]);
  }

  protected accessLabel(enabled: boolean): string {
    return this.t(enabled ? 'admin.access.enabled' : 'admin.access.disabled');
  }

  private localeTag(): string {
    return this.locale.language() === 'pt' ? 'pt-PT' : 'en-GB';
  }

  private readBrandContent(content: Record<string, unknown>): BrandContent {
    const value = content['brand'];
    return value && typeof value === 'object'
      ? ({ ...this.content.brand, ...(value as Partial<BrandContent>) } as BrandContent)
      : this.content.brand;
  }

  private readContactPageContent(content: Record<string, unknown>): ContactPageContent {
    const value = content['contactPage'];
    return value && typeof value === 'object'
      ? ({
          ...this.content.contactPage,
          ...(value as Partial<ContactPageContent>),
        } as ContactPageContent)
      : this.content.contactPage;
  }

  private readContactInfoBlocks(content: Record<string, unknown>): ContactInfoBlock[] {
    const value = content['contactInfo'];
    if (!Array.isArray(value)) {
      return this.content.contactInfo;
    }
    return value
      .map((entry) => this.parseContactInfoBlock(entry))
      .filter((entry): entry is ContactInfoBlock => Boolean(entry));
  }

  private readContactSubjects(content: Record<string, unknown>): string[] {
    const value = content['contactSubjects'];
    return Array.isArray(value)
      ? value
          .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter(Boolean)
      : this.content.contactSubjects;
  }

  private readFaqEntries(content: Record<string, unknown>): FaqEntry[] {
    const value = content['faqs'];
    if (!Array.isArray(value)) {
      return this.content.faqs;
    }
    return value
      .map((entry) => this.parseFaqEntry(entry))
      .filter((entry): entry is FaqEntry => Boolean(entry));
  }

  private parseContactInfoBlock(value: unknown): ContactInfoBlock | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { title?: unknown; lines?: unknown };
    const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
    const lines = Array.isArray(candidate.lines)
      ? candidate.lines
          .map((line) => (typeof line === 'string' ? line.trim() : ''))
          .filter(Boolean)
      : [];
    return title ? { title, lines } : null;
  }

  private parseFaqEntry(value: unknown): FaqEntry | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { question?: unknown; answer?: unknown };
    const question = typeof candidate.question === 'string' ? candidate.question.trim() : '';
    const answer = typeof candidate.answer === 'string' ? candidate.answer.trim() : '';
    return question && answer ? { question, answer } : null;
  }

  private normalizeLines(value: string): string[] {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  private normalizeContactInfoBlocks(blocks: ContactInfoBlockForm[]): ContactInfoBlock[] {
    return blocks
      .map((block) => ({
        title: block.title.trim(),
        lines: this.normalizeLines(block.linesText),
      }))
      .filter((block) => block.title && block.lines.length > 0);
  }

  private normalizeFaqEntries(faqs: FaqEntryForm[]): FaqEntry[] {
    return faqs
      .map((faq) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
      }))
      .filter((faq) => faq.question && faq.answer);
  }

  private readHistoryPageContent(content: Record<string, unknown>): HistoryPageContent {
    const value = content['historyPage'];
    return value && typeof value === 'object'
      ? ({
          ...this.content.historyPage,
          ...(value as Partial<HistoryPageContent>),
        } as HistoryPageContent)
      : this.content.historyPage;
  }

  private readHistoryIntroContent(content: Record<string, unknown>): HistoryIntroContent {
    const fallback = this.content.historyIntro;
    const value = content['historyIntro'];
    if (!value || typeof value !== 'object') {
      return fallback;
    }
    const candidate = value as Partial<HistoryIntroContent>;
    const paragraphs = Array.isArray(candidate.paragraphs)
      ? candidate.paragraphs
          .map((paragraph) => (typeof paragraph === 'string' ? paragraph.trim() : ''))
          .filter(Boolean)
      : [];
    return {
      title: typeof candidate.title === 'string' && candidate.title ? candidate.title : fallback.title,
      lead: typeof candidate.lead === 'string' && candidate.lead ? candidate.lead : fallback.lead,
      paragraphs: paragraphs.length > 0 ? paragraphs : fallback.paragraphs,
    };
  }

  private readTimelineEntries(content: Record<string, unknown>): TimelineEntry[] {
    const value = content['timeline'];
    if (!Array.isArray(value)) {
      return this.content.timeline;
    }
    return value
      .map((entry) => this.parseTimelineEntry(entry))
      .filter((entry): entry is TimelineEntry => Boolean(entry));
  }

  private parseTimelineEntry(value: unknown): TimelineEntry | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { year?: unknown; title?: unknown; text?: unknown };
    const year = typeof candidate.year === 'string' ? candidate.year.trim() : '';
    const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
    const text = typeof candidate.text === 'string' ? candidate.text.trim() : '';
    return year && title ? { year, title, text } : null;
  }

  private normalizeTimelineEntries(entries: TimelineEntryForm[]): TimelineEntry[] {
    return entries
      .map((entry) => ({
        year: entry.year.trim(),
        title: entry.title.trim(),
        text: entry.text.trim(),
      }))
      .filter((entry) => entry.year && entry.title);
  }

  private normalizeStats(stats: StatItemForm[]): StatItem[] {
    return stats
      .map((stat) => ({ value: stat.value.trim(), label: stat.label.trim() }))
      .filter((stat) => stat.value && stat.label);
  }

  private normalizeTestimonials(items: TestimonialForm[]): Testimonial[] {
    return items
      .map((item) => ({
        author: item.author.trim(),
        location: item.location.trim(),
        rating: item.rating ?? 5,
        text: item.text.trim(),
      }))
      .filter((item) => item.author && item.text);
  }

  private normalizeCraftSteps(steps: CraftStepForm[]): CraftStep[] {
    return steps
      .map((step) => ({ icon: step.icon, title: step.title.trim(), text: step.text.trim() }))
      .filter((step) => step.title);
  }

  private normalizeValues(values: ValueItemForm[]): ValueItem[] {
    return values
      .map((value) => ({
        number: value.number.trim(),
        title: value.title.trim(),
        text: value.text.trim(),
      }))
      .filter((value) => value.title);
  }

  private normalizeReviewFilters(
    filters: ReviewFilterForm[],
  ): { value: string; label: string }[] {
    return filters
      .map((filter) => ({ value: filter.value, label: filter.label.trim() }))
      .filter((filter) => filter.value && filter.label);
  }

  private normalizeNavLinks(links: FooterLinkForm[]): NavLink[] {
    return links
      .map((link) => ({
        label: link.label.trim(),
        route: link.route.trim() || '/',
        filter: link.filter,
      }))
      .filter((link) => link.label);
  }

  private normalizeFooterColumns(columns: FooterColumnForm[]): FooterColumn[] {
    return columns
      .map((column) => ({
        title: column.title.trim(),
        links: this.normalizeNavLinks(column.links),
      }))
      .filter((column) => column.title);
  }

  private normalizeSocialLinks(
    links: SocialLinkForm[],
  ): { label: string; title: string; href: string }[] {
    return links
      .map((link) => ({
        label: link.label.trim(),
        title: link.title.trim(),
        href: link.href.trim() || '#',
      }))
      .filter((link) => link.label);
  }

  private shopCurrencyOptions(
    config: ShopPriceRangesContent,
  ): readonly ShopCurrencyOption[] {
    const resolved = (this.locale.currencies().length > 0
      ? this.locale.currencies()
      : FALLBACK_SHOP_CURRENCIES
    ).map((currency) => ({
      code: currency.code,
      symbol: currency.symbol,
      label: currency.label,
    }));

    const known = new Set(resolved.map((currency) => currency.code));
    const extra = Object.keys(config)
      .map((code) => code.trim().toUpperCase())
      .filter((code) => code && !known.has(code))
      .map((code) => ({ code, symbol: code, label: code }));

    return [...resolved, ...extra];
  }

  private buildShopPriceRangesPayload(): ShopPriceRangesContent | null {
    const payload: ShopPriceRangesContent = {};

    for (const currency of this.shopContentForm().currencies) {
      const ranges: ShopPriceRange[] = [];
      for (const range of currency.ranges) {
        if (range.min === null && range.max === null) {
          continue;
        }
        if (range.min === null || range.max === null) {
          this.shopContentError.set(
            `Complete both min and max values for ${currency.code} before saving.`,
          );
          return null;
        }

        const min = this.roundCurrencyValue(range.min);
        const max = this.roundCurrencyValue(range.max);
        if (min < 0 || max <= min) {
          this.shopContentError.set(
            `Each ${currency.code} range must have a max value greater than its min value.`,
          );
          return null;
        }

        ranges.push({ min, max });
      }

      if (ranges.length === 0) {
        this.shopContentError.set(`Add at least one price range for ${currency.code}.`);
        return null;
      }

      payload[currency.code] = ranges;
    }

    return payload;
  }

  private mergeCategoryTiles(tiles: CategoryTileForm[]): CategoryTile[] {
    const raw = this.categoryTilesRaw();
    const fallback = this.catalog.categoryTiles();
    return tiles.map((tile, index) => {
      const source = raw[index] ?? fallback[index];
      return {
        title: tile.title.trim(),
        count: tile.count.trim(),
        imageClass: source?.imageClass ?? '',
        image: source?.image ?? '',
        route: source?.route ?? '/shop',
        filter: source?.filter,
      };
    });
  }

  private mergeCollectionBlocks(blocks: CollectionBlockForm[]): CollectionBlock[] {
    const raw = this.collectionBlocksRaw();
    return blocks.map((block, index) => {
      const source = raw[index];
      return {
        tag: block.tag.trim(),
        title: block.title.trim(),
        text: block.text.trim(),
        linkLabel: block.linkLabel.trim(),
        imageClass: source?.imageClass ?? '',
        image: source?.image ?? '',
        filter: source?.filter,
      };
    });
  }

  private readObjectBlock<T extends object>(
    content: Record<string, unknown>,
    key: string,
    fallback: T,
  ): T {
    const value = content[key];
    return value && typeof value === 'object'
      ? ({ ...fallback, ...(value as Partial<T>) } as T)
      : fallback;
  }

  private readHeroContent(content: Record<string, unknown>): HeroContent {
    const fallback = this.content.hero;
    const value = content['hero'];
    if (!value || typeof value !== 'object') {
      return fallback;
    }
    const candidate = value as Partial<HeroContent>;
    return {
      tagline: this.text(candidate.tagline, fallback.tagline),
      titleLines: this.readStrings(candidate.titleLines, fallback.titleLines),
      subtitle: this.text(candidate.subtitle, fallback.subtitle),
      ctaLabel: this.text(candidate.ctaLabel, fallback.ctaLabel),
      scrollLabel: this.text(candidate.scrollLabel, fallback.scrollLabel),
    };
  }

  private readHeaderButtonsContent(content: Record<string, unknown>): HeaderButtonsContent {
    return this.readObjectBlock(content, 'headerButtons', this.content.headerButtons);
  }

  private readShopPriceRangesContent(content: Record<string, unknown>): ShopPriceRangesContent {
    const fallback = this.content.shopPriceRanges;
    const value = content['shopPriceRanges'];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return fallback;
    }

    const parsed = Object.entries(value as Record<string, unknown>).reduce<ShopPriceRangesContent>(
      (accumulator, [code, ranges]) => {
        const normalizedCode = code.trim().toUpperCase();
        const parsedRanges = this.readShopPriceRanges(ranges);
        if (normalizedCode && parsedRanges.length > 0) {
          accumulator[normalizedCode] = parsedRanges;
        }
        return accumulator;
      },
      {},
    );

    return Object.keys(parsed).length > 0 ? { ...fallback, ...parsed } : fallback;
  }

  private readHomeSectionsContent(content: Record<string, unknown>): HomeSectionsContent {
    return this.readObjectBlock(content, 'homeSections', this.content.homeSections);
  }

  private readFeaturedPieceContent(content: Record<string, unknown>): FeaturedPieceContent {
    return this.readObjectBlock(content, 'featuredPiece', this.content.featuredPiece);
  }

  private readAboutContent(content: Record<string, unknown>): AboutContent {
    const fallback = this.content.about;
    const value = content['about'];
    if (!value || typeof value !== 'object') {
      return fallback;
    }
    const candidate = value as Partial<AboutContent>;
    return {
      title: this.text(candidate.title, fallback.title),
      imageClass: this.text(candidate.imageClass, fallback.imageClass),
      image: this.text(candidate.image, fallback.image),
      paragraphs: this.readStrings(candidate.paragraphs, fallback.paragraphs),
      stats: this.readStats(candidate.stats, fallback.stats),
    };
  }

  private readTestimonials(content: Record<string, unknown>): Testimonial[] {
    const value = content['testimonials'];
    if (!Array.isArray(value)) {
      return this.content.testimonials;
    }
    const parsed = value
      .map((entry) => this.parseTestimonial(entry))
      .filter((entry): entry is Testimonial => Boolean(entry));
    return parsed.length > 0 ? parsed : this.content.testimonials;
  }

  private readCategoryTiles(content: Record<string, unknown>): CategoryTile[] {
    const fallback = this.catalog.categoryTiles();
    const value = content['categoryTiles'];
    if (!Array.isArray(value)) {
      return fallback;
    }
    const parsed = value
      .map((entry) => this.parseCategoryTile(entry))
      .filter((entry): entry is CategoryTile => Boolean(entry));
    return parsed.length > 0 ? parsed : fallback;
  }

  private readCollectionsPageContent(content: Record<string, unknown>): CollectionsPageContent {
    return this.readObjectBlock(content, 'collectionsPage', this.content.collectionsPage);
  }

  private readCollectionBlocks(content: Record<string, unknown>): CollectionBlock[] {
    const value = content['collections'];
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((entry) => this.parseCollectionBlock(entry))
      .filter((entry): entry is CollectionBlock => Boolean(entry));
  }

  private readReviewsPageContent(content: Record<string, unknown>): ReviewsPageContent {
    return this.readObjectBlock(content, 'reviewsPage', this.content.reviewsPage);
  }

  private readReviewFilters(
    content: Record<string, unknown>,
  ): ReadonlyArray<{ value: string; label: string }> {
    const value = content['reviewFilters'];
    if (!Array.isArray(value)) {
      return this.content.reviewFilters;
    }
    const parsed = value
      .map((entry) => this.parseReviewFilter(entry))
      .filter((entry): entry is { value: string; label: string } => Boolean(entry));
    return parsed.length > 0 ? parsed : this.content.reviewFilters;
  }

  private readHistorySectionsContent(content: Record<string, unknown>): HistorySectionsContent {
    return this.readObjectBlock(content, 'historySections', this.content.historySections);
  }

  private readCraftSteps(content: Record<string, unknown>): CraftStep[] {
    const value = content['craftSteps'];
    if (!Array.isArray(value)) {
      return this.content.craftSteps;
    }
    const parsed = value
      .map((entry) => this.parseCraftStep(entry))
      .filter((entry): entry is CraftStep => Boolean(entry));
    return parsed.length > 0 ? parsed : this.content.craftSteps;
  }

  private readValues(content: Record<string, unknown>): ValueItem[] {
    const value = content['values'];
    if (!Array.isArray(value)) {
      return this.content.values;
    }
    const parsed = value
      .map((entry) => this.parseValueItem(entry))
      .filter((entry): entry is ValueItem => Boolean(entry));
    return parsed.length > 0 ? parsed : this.content.values;
  }

  private readNavLinks(content: Record<string, unknown>): NavLink[] {
    const value = content['navLinks'];
    if (!Array.isArray(value)) {
      return this.content.navLinks;
    }
    const parsed = value
      .map((entry) => this.parseNavLink(entry))
      .filter((entry): entry is NavLink => Boolean(entry));
    return parsed.length > 0 ? parsed : this.content.navLinks;
  }

  private readFooterColumns(content: Record<string, unknown>): FooterColumn[] {
    const value = content['footerColumns'];
    if (!Array.isArray(value)) {
      return this.content.footerColumns;
    }
    const parsed = value
      .map((entry) => this.parseFooterColumn(entry))
      .filter((entry): entry is FooterColumn => Boolean(entry));
    return parsed.length > 0 ? parsed : this.content.footerColumns;
  }

  private readFooterTagline(content: Record<string, unknown>): string {
    const value = content['footerTagline'];
    return typeof value === 'string' && value.trim() ? value : this.content.footerTagline;
  }

  private readSocialLinks(
    content: Record<string, unknown>,
  ): ReadonlyArray<{ label: string; title: string; href: string }> {
    const value = content['socialLinks'];
    if (!Array.isArray(value)) {
      return this.content.socialLinks;
    }
    const parsed = value
      .map((entry) => this.parseSocialLink(entry))
      .filter(
        (entry): entry is { label: string; title: string; href: string } => Boolean(entry),
      );
    return parsed.length > 0 ? parsed : this.content.socialLinks;
  }

  private parseTestimonial(value: unknown): Testimonial | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as {
      author?: unknown;
      location?: unknown;
      rating?: unknown;
      text?: unknown;
    };
    const author = this.text(candidate.author, '');
    const text = this.text(candidate.text, '');
    if (!author || !text) {
      return null;
    }
    return {
      author,
      location: this.text(candidate.location, ''),
      rating: typeof candidate.rating === 'number' ? candidate.rating : 5,
      text,
    };
  }

  private parseCategoryTile(value: unknown): CategoryTile | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as Partial<CategoryTile>;
    const title = this.text(candidate.title, '');
    if (!title) {
      return null;
    }
    return {
      title,
      count: this.text(candidate.count, ''),
      imageClass: this.text(candidate.imageClass, ''),
      image: this.text(candidate.image, ''),
      route: this.text(candidate.route, '/shop'),
      filter: candidate.filter,
    };
  }

  private parseCollectionBlock(value: unknown): CollectionBlock | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as Partial<CollectionBlock>;
    const title = this.text(candidate.title, '');
    if (!title) {
      return null;
    }
    return {
      tag: this.text(candidate.tag, ''),
      title,
      text: this.text(candidate.text, ''),
      imageClass: this.text(candidate.imageClass, ''),
      image: this.text(candidate.image, ''),
      linkLabel: this.text(candidate.linkLabel, ''),
      filter: candidate.filter,
    };
  }

  private parseReviewFilter(value: unknown): { value: string; label: string } | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { value?: unknown; label?: unknown };
    const key = this.text(candidate.value, '');
    const label = this.text(candidate.label, '');
    return key && label ? { value: key, label } : null;
  }

  private readShopPriceRanges(value: unknown): ShopPriceRange[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((entry) => this.parseShopPriceRange(entry))
      .filter((entry): entry is ShopPriceRange => Boolean(entry));
  }

  private parseShopPriceRange(value: unknown): ShopPriceRange | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { min?: unknown; max?: unknown };
    const min = this.optionalNumber(candidate.min);
    const max = this.optionalNumber(candidate.max);
    if (min === null || max === null || min < 0 || max <= min) {
      return null;
    }
    return {
      min: this.roundCurrencyValue(min),
      max: this.roundCurrencyValue(max),
    };
  }

  private parseCraftStep(value: unknown): CraftStep | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { icon?: unknown; title?: unknown; text?: unknown };
    const title = this.text(candidate.title, '');
    if (!title) {
      return null;
    }
    const icon = this.craftIcons.includes(candidate.icon as IconName)
      ? (candidate.icon as IconName)
      : 'layers';
    return { icon, title, text: this.text(candidate.text, '') };
  }

  private parseValueItem(value: unknown): ValueItem | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { number?: unknown; title?: unknown; text?: unknown };
    const title = this.text(candidate.title, '');
    if (!title) {
      return null;
    }
    return {
      number: this.text(candidate.number, ''),
      title,
      text: this.text(candidate.text, ''),
    };
  }

  private parseNavLink(value: unknown): NavLink | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as Partial<NavLink>;
    const label = this.text(candidate.label, '');
    if (!label) {
      return null;
    }
    return { label, route: this.text(candidate.route, '/'), filter: candidate.filter };
  }

  private parseFooterColumn(value: unknown): FooterColumn | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { title?: unknown; links?: unknown };
    const title = this.text(candidate.title, '');
    if (!title) {
      return null;
    }
    const links = Array.isArray(candidate.links)
      ? candidate.links
          .map((link) => this.parseNavLink(link))
          .filter((link): link is NavLink => Boolean(link))
      : [];
    return { title, links };
  }

  private parseSocialLink(value: unknown): { label: string; title: string; href: string } | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as { label?: unknown; title?: unknown; href?: unknown };
    const label = this.text(candidate.label, '');
    if (!label) {
      return null;
    }
    return { label, title: this.text(candidate.title, ''), href: this.text(candidate.href, '#') };
  }

  private readStrings(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
      return fallback;
    }
    const parsed = value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
    return parsed.length > 0 ? parsed : fallback;
  }

  private readStats(value: unknown, fallback: StatItem[]): StatItem[] {
    if (!Array.isArray(value)) {
      return fallback;
    }
    const parsed = value
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        const candidate = entry as { value?: unknown; label?: unknown };
        const label = this.text(candidate.label, '');
        return label ? { value: this.text(candidate.value, ''), label } : null;
      })
      .filter((entry): entry is StatItem => Boolean(entry));
    return parsed.length > 0 ? parsed : fallback;
  }

  private optionalNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private roundCurrencyValue(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private text(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
  }

  private generatedImageUrl(form: ProductForm): string {
    const categoryLabel = form.category.replace(/-/g, ' ');
    const prompt = [
      form.name.trim() || 'artisan leather product',
      form.description.trim() || `handcrafted ${categoryLabel}`,
      'luxury product photography',
      'warm studio light',
      'neutral background',
    ].join(', ');
    return `${GENERATED_IMAGE_BASE}${encodeURIComponent(prompt)}`;
  }

  private generatedGalleryImageUrl(form: ProductForm, index: number): string {
    const categoryLabel = form.category.replace(/-/g, ' ');
    const prompt = [
      form.name.trim() || 'artisan leather product',
      `detail view ${index}`,
      form.description.trim() || `handcrafted ${categoryLabel}`,
      'luxury product photography',
      'editorial close-up',
      'soft natural light',
    ].join(', ');
    return `${GENERATED_IMAGE_BASE}${encodeURIComponent(prompt)}`;
  }

  private appendGalleryImage(url: string): void {
    const value = url.trim();
    if (!value) {
      return;
    }
    this.form.update((form) => ({
      ...form,
      gallery: this.normalizedGallery([...form.gallery, value], form.image),
    }));
  }

  private appendGalleryImages(urls: string[]): void {
    if (urls.length === 0) {
      return;
    }
    this.form.update((form) => ({
      ...form,
      gallery: this.normalizedGallery([...form.gallery, ...urls], form.image),
    }));
  }

  private normalizedGallery(gallery: string[], mainImage: string): string[] {
    const primary = mainImage.trim();
    const unique = new Set<string>();
    for (const image of gallery) {
      const candidate = image.trim();
      if (!candidate || candidate === primary || unique.has(candidate)) {
        continue;
      }
      unique.add(candidate);
    }
    return [...unique];
  }

  private resolveVariantSku(
    form: ProductForm,
    variant: VariantForm,
    index: number,
    allVariants: VariantForm[],
  ): string {
    const manual = this.slugToken(variant.sku);
    if (manual) {
      return manual;
    }

    const base = [
      this.slugToken(form.slug),
      this.slugToken(form.name),
      this.slugToken(variant.name),
      `v${index + 1}`,
    ]
      .filter(Boolean)
      .join('-')
      .toUpperCase();

    let candidate = base || `VARIANT-${index + 1}`;
    let suffix = 2;
    const taken = new Set(
      allVariants
        .filter((item) => item.uid !== variant.uid)
        .map((item) => this.slugToken(item.sku))
        .filter((item): item is string => Boolean(item))
        .map((item) => item.toUpperCase()),
    );

    while (taken.has(candidate)) {
      candidate = `${base || 'VARIANT'}-${suffix++}`;
    }

    return candidate;
  }

  private slugToken(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private refreshCatalogue(): void {
    this.loadProducts();
    this.catalog.reload().subscribe({
      next: () => undefined,
      error: () => undefined,
    });
  }

  private uploadGalleryFiles(files: File[]): void {
    this.uploading.set(true);
    this.formError.set(null);
    this.uploadNotice.set(null);

    const uploads = files.map((file, index) =>
      this.admin.uploadMedia(file, 'products').pipe(
        map((media) => ({ url: media.url, generated: false } satisfies UploadedGalleryItem)),
        catchError(() =>
          of({
            url: this.generatedGalleryImageUrl(this.form(), this.form().gallery.length + index + 1),
            generated: true,
          } satisfies UploadedGalleryItem),
        ),
      ),
    );

    forkJoin(uploads).subscribe({
      next: (items) => {
        this.uploading.set(false);
        this.appendGalleryImages(items.map((item) => item.url));
        const generatedCount = items.filter((item) => item.generated).length;
        if (generatedCount > 0) {
          this.uploadNotice.set(
            `${generatedCount} gallery image${generatedCount === 1 ? ' was' : 's were'} replaced with generated image URLs so you can keep editing without R2.`,
          );
        } else {
          this.uploadNotice.set(null);
        }
        this.toast.show(`${items.length} gallery image${items.length === 1 ? '' : 's'} added.`);
      },
      error: () => {
        this.uploading.set(false);
      },
    });
  }

  private parsePresetFields(value: string): string[] {
    return value
      .split(/[\n,]+/)
      .map((field) => field.trim())
      .filter(Boolean);
  }
}
