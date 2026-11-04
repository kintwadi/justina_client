import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_URL } from '../config/api.config';
import { LocaleService } from './locale.service';
import {
  BrandContent,
  CollectionsPageContent,
  CraftStep,
  ContactInfoBlock,
  ContactPageContent,
  FaqEntry,
  FooterColumn,
  HeaderButtonsContent,
  HistoryIntroContent,
  HistoryPageContent,
  HistorySectionsContent,
  HomeSectionsContent,
  InstagramTile,
  NavLink,
  ReviewsPageContent,
  ShopPriceRangesContent,
  Testimonial,
  TimelineEntry,
  ValueItem,
} from '../models/content.model';
import {
  ABOUT,
  BRAND,
  COLLECTIONS_PAGE,
  CONTACT_PAGE,
  CONTACT_INFO,
  CONTACT_SUBJECTS,
  CRAFT_STEPS,
  FAQS,
  FEATURED_PIECE,
  FOOTER_COLUMNS,
  FOOTER_TAGLINE,
  HEADER_BUTTONS,
  HERO,
  HISTORY_INTRO,
  HISTORY_PAGE,
  HISTORY_SECTIONS,
  HOME_SECTIONS,
  INSTAGRAM_TILES,
  NAV_LINKS,
  REVIEW_FILTERS,
  REVIEWS_PAGE,
  SHOP_PRICE_RANGES,
  SOCIAL_LINKS,
  TESTIMONIALS,
  TIMELINE,
  VALUES,
} from '../data/mock-content';

type Brand = BrandContent;
type HeaderButtons = HeaderButtonsContent;
type Hero = typeof HERO;
type FeaturedPiece = typeof FEATURED_PIECE;
type About = typeof ABOUT;
type ContactInfo = ContactInfoBlock[];
type ContactPage = ContactPageContent;
type HistoryPage = HistoryPageContent;
type HistoryIntro = HistoryIntroContent;
type HomeSections = HomeSectionsContent;
type CollectionsPage = CollectionsPageContent;
type ReviewsPage = ReviewsPageContent;
type HistorySections = HistorySectionsContent;
type ShopPriceRanges = ShopPriceRangesContent;
type ReviewFilterOption = (typeof REVIEW_FILTERS)[number];
type SocialLink = (typeof SOCIAL_LINKS)[number];

/** Snapshot of every localized content block exposed by the service. */
interface ContentState {
  brand: Brand;
  headerButtons: HeaderButtons;
  shopPriceRanges: ShopPriceRanges;
  navLinks: NavLink[];
  hero: Hero;
  homeSections: HomeSections;
  featuredPiece: FeaturedPiece;
  about: About;
  testimonials: Testimonial[];
  instagramTiles: InstagramTile[];
  historyPage: HistoryPage;
  historySections: HistorySections;
  historyIntro: HistoryIntro;
  timeline: TimelineEntry[];
  craftSteps: CraftStep[];
  values: ValueItem[];
  collectionsPage: CollectionsPage;
  reviewFilters: ReviewFilterOption[];
  reviewsPage: ReviewsPage;
  contactPage: ContactPage;
  contactInfo: ContactInfo;
  contactSubjects: string[];
  faqs: FaqEntry[];
  footerColumns: FooterColumn[];
  footerTagline: string;
  socialLinks: SocialLink[];
}

/**
 * Marketing/brand content fetched from the backend content blocks (`GET /api/content`) and consumed
 * by the shell and every page. The bundled mock content is kept as a fallback so the storefront
 * still renders when the API is unavailable or a block is missing.
 *
 * <p>The state is held in a signal so a localized reload (e.g. after switching language) marks every
 * consuming template for refresh. The blocks are exposed as plain properties for template ergonomics.</p>
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly locale = inject(LocaleService);

  private readonly state = signal<ContentState>({
    brand: BRAND,
    headerButtons: HEADER_BUTTONS,
    shopPriceRanges: SHOP_PRICE_RANGES,
    navLinks: NAV_LINKS,
    hero: HERO,
    homeSections: HOME_SECTIONS,
    featuredPiece: FEATURED_PIECE,
    about: ABOUT,
    testimonials: TESTIMONIALS,
    instagramTiles: INSTAGRAM_TILES,
    historyPage: HISTORY_PAGE,
    historySections: HISTORY_SECTIONS,
    historyIntro: HISTORY_INTRO,
    timeline: TIMELINE,
    craftSteps: CRAFT_STEPS,
    values: VALUES,
    collectionsPage: COLLECTIONS_PAGE,
    reviewFilters: REVIEW_FILTERS,
    reviewsPage: REVIEWS_PAGE,
    contactPage: CONTACT_PAGE,
    contactInfo: CONTACT_INFO,
    contactSubjects: CONTACT_SUBJECTS,
    faqs: FAQS,
    footerColumns: FOOTER_COLUMNS,
    footerTagline: FOOTER_TAGLINE,
    socialLinks: SOCIAL_LINKS,
  });

  get brand(): Brand {
    return this.state().brand;
  }

  get navLinks(): NavLink[] {
    return this.state().navLinks;
  }

  get headerButtons(): HeaderButtons {
    return this.state().headerButtons;
  }

  get shopPriceRanges(): ShopPriceRanges {
    return this.state().shopPriceRanges;
  }

  get hero(): Hero {
    return this.state().hero;
  }

  get homeSections(): HomeSections {
    return this.state().homeSections;
  }

  get featuredPiece(): FeaturedPiece {
    return this.state().featuredPiece;
  }

  get about(): About {
    return this.state().about;
  }

  get testimonials(): Testimonial[] {
    return this.state().testimonials;
  }

  get instagramTiles(): InstagramTile[] {
    return this.state().instagramTiles;
  }

  get historyPage(): HistoryPage {
    return this.state().historyPage;
  }

  get historySections(): HistorySections {
    return this.state().historySections;
  }

  get historyIntro(): HistoryIntro {
    return this.state().historyIntro;
  }

  get timeline(): TimelineEntry[] {
    return this.state().timeline;
  }

  get craftSteps(): CraftStep[] {
    return this.state().craftSteps;
  }

  get values(): ValueItem[] {
    return this.state().values;
  }

  get collectionsPage(): CollectionsPage {
    return this.state().collectionsPage;
  }

  get reviewFilters(): ReviewFilterOption[] {
    return this.state().reviewFilters;
  }

  get reviewsPage(): ReviewsPage {
    return this.state().reviewsPage;
  }

  get contactPage(): ContactPage {
    return this.state().contactPage;
  }

  get contactInfo(): ContactInfo {
    return this.state().contactInfo;
  }

  get contactSubjects(): string[] {
    return this.state().contactSubjects;
  }

  get faqs(): FaqEntry[] {
    return this.state().faqs;
  }

  get footerColumns(): FooterColumn[] {
    return this.state().footerColumns;
  }

  get footerTagline(): string {
    return this.state().footerTagline;
  }

  get socialLinks(): SocialLink[] {
    return this.state().socialLinks;
  }

  /** Loads every content block; falls back to the mock content when the request fails. */
  load(): Observable<void> {
    return this.http
      .get<Record<string, unknown>>(`${API_URL}/content`, {
        params: new HttpParams().set('lang', this.locale.language()),
      })
      .pipe(
        tap((content) => this.apply(content)),
        map(() => undefined),
        catchError(() => of(undefined)),
      );
  }

  /** Re-fetches the content blocks, used after a language change or an admin mutation. */
  reload(): Observable<void> {
    return this.load();
  }

  private apply(content: Record<string, unknown>): void {
    const current = this.state();
    this.state.set({
      brand: this.pickObject(content, 'brand', current.brand),
      headerButtons: this.pickObject(content, 'headerButtons', current.headerButtons),
      shopPriceRanges: this.pickObject(
        content,
        'shopPriceRanges',
        current.shopPriceRanges,
      ),
      hero: this.pickObject(content, 'hero', current.hero),
      homeSections: this.pickObject(content, 'homeSections', current.homeSections),
      featuredPiece: this.pickObject(content, 'featuredPiece', current.featuredPiece),
      about: this.pickObject(content, 'about', current.about),
      historyPage: this.pickObject(content, 'historyPage', current.historyPage),
      historySections: this.pickObject(content, 'historySections', current.historySections),
      historyIntro: this.pickObject(content, 'historyIntro', current.historyIntro),
      collectionsPage: this.pickObject(content, 'collectionsPage', current.collectionsPage),
      reviewsPage: this.pickObject(content, 'reviewsPage', current.reviewsPage),
      contactPage: this.pickObject(content, 'contactPage', current.contactPage),
      contactInfo: this.pickArray<ContactInfoBlock>(content, 'contactInfo', current.contactInfo),
      footerTagline: this.pickString(content, 'footerTagline', current.footerTagline),
      navLinks: this.pickArray<NavLink>(content, 'navLinks', current.navLinks),
      testimonials: this.pickArray<Testimonial>(content, 'testimonials', current.testimonials),
      instagramTiles: this.pickArray<InstagramTile>(
        content,
        'instagramTiles',
        current.instagramTiles,
      ),
      timeline: this.pickArray<TimelineEntry>(content, 'timeline', current.timeline),
      craftSteps: this.pickArray<CraftStep>(content, 'craftSteps', current.craftSteps),
      values: this.pickArray<ValueItem>(content, 'values', current.values),
      contactSubjects: this.pickArray<string>(
        content,
        'contactSubjects',
        current.contactSubjects,
      ),
      faqs: this.pickArray<FaqEntry>(content, 'faqs', current.faqs),
      footerColumns: this.pickArray<FooterColumn>(
        content,
        'footerColumns',
        current.footerColumns,
      ),
      socialLinks: this.pickArray<SocialLink>(content, 'socialLinks', current.socialLinks),
      reviewFilters: this.pickArray<ReviewFilterOption>(
        content,
        'reviewFilters',
        current.reviewFilters,
      ),
    });
  }

  private pickObject<T extends object>(content: Record<string, unknown>, key: string, fallback: T): T {
    const value = content[key];
    return value && typeof value === 'object'
      ? ({ ...fallback, ...(value as Partial<T>) } as T)
      : fallback;
  }

  private pickArray<T>(content: Record<string, unknown>, key: string, fallback: T[]): T[] {
    const value = content[key];
    return Array.isArray(value) ? (value as T[]) : fallback;
  }

  private pickString(content: Record<string, unknown>, key: string, fallback: string): string {
    const value = content[key];
    return typeof value === 'string' && value.length > 0 ? value : fallback;
  }
}
