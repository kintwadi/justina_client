import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_URL } from '../config/api.config';
import { DEFAULT_LANGUAGE, TRANSLATIONS, TranslationKey } from '../i18n/translations';
import {
  AppLanguage,
  CurrencyConfig,
  CurrencyRate,
  LanguageOption,
} from '../models/locale.model';

const LANGUAGE_STORAGE_KEY = 'aj-language';
const CURRENCY_STORAGE_KEY = 'aj-currency';

/**
 * Storefront locale: language (EN/PT) and currency (base EUR + converted rates).
 *
 * <p>The language drives the chrome translations and the <html lang> attribute; the currency drives
 * every displayed price and is forwarded to Stripe at checkout. Both selections are persisted in
 * localStorage. Currency rates come from `GET /api/currencies`; when the API is unreachable the
 * storefront silently falls back to base-currency formatting.</p>
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  readonly languages: readonly LanguageOption[] = [
    { code: 'en', label: 'English', flagIcon: 'flag-gb' },
    { code: 'pt', label: 'Português', flagIcon: 'flag-pt' },
  ];

  private readonly languageState = signal<AppLanguage>(this.readLanguage());
  private readonly currencyState = signal<string>(this.readCurrency() ?? 'EUR');
  private readonly configState = signal<CurrencyConfig | null>(null);

  readonly language = this.languageState.asReadonly();
  readonly currency = this.currencyState.asReadonly();

  readonly activeLanguage = computed(
    () =>
      this.languages.find((option) => option.code === this.languageState()) ?? this.languages[0],
  );
  readonly currencies = computed<readonly CurrencyRate[]>(
    () => this.configState()?.currencies ?? [],
  );
  readonly activeCurrency = computed<CurrencyRate | null>(() => {
    const currencies = this.currencies();
    return (
      currencies.find((currency) => currency.code === this.currencyState()) ??
      currencies.find((currency) => currency.code === this.configState()?.defaultCurrency) ??
      null
    );
  });

  constructor() {
    this.document.documentElement.lang = this.languageState();
  }

  /** Loads the supported currencies; never errors so bootstrap can proceed offline. */
  load(): Observable<void> {
    return this.http.get<CurrencyConfig>(`${API_URL}/currencies`).pipe(
      tap((config) => this.apply(config)),
      map(() => undefined),
      catchError(() => of(undefined)),
    );
  }

  setLanguage(language: AppLanguage): void {
    if (language === this.languageState()) {
      return;
    }
    this.languageState.set(language);
    this.document.documentElement.lang = language;
    this.persist(LANGUAGE_STORAGE_KEY, language);
  }

  setCurrency(code: string): void {
    if (!code || code === this.currencyState()) {
      return;
    }
    this.currencyState.set(code);
    this.persist(CURRENCY_STORAGE_KEY, code);
  }

  /** Translates a chrome key, replacing `{placeholder}` tokens when params are given. */
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const dictionary = TRANSLATIONS[this.languageState()] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
    const template = dictionary[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? key;
    if (!params) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, token: string) =>
      token in params ? String(params[token]) : match,
    );
  }

  /** Converts a base-currency amount to the selected currency and renders it with its symbol. */
  formatPrice(value: number): string {
    const currency = this.activeCurrency();
    const symbol = currency?.symbol ?? '€';
    const rate = currency?.rate ?? 1;
    return `${symbol}${this.round(value * rate)}`;
  }

  private apply(config: CurrencyConfig): void {
    this.configState.set(config);
    const supported = config.currencies.some((currency) => currency.code === this.currencyState());
    if (!supported) {
      this.currencyState.set(config.defaultCurrency);
      this.persist(CURRENCY_STORAGE_KEY, config.defaultCurrency);
    }
  }

  private round(value: number): number {
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  private readLanguage(): AppLanguage {
    const stored = this.read(LANGUAGE_STORAGE_KEY);
    return stored === 'pt' || stored === 'en' ? stored : DEFAULT_LANGUAGE;
  }

  private readCurrency(): string | null {
    return this.read(CURRENCY_STORAGE_KEY);
  }

  private read(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private persist(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures (private mode); the selection still applies for this session.
    }
  }
}
