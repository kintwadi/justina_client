/** Languages offered by the storefront. */
export type AppLanguage = 'en' | 'pt';

/** A language entry rendered in the header switcher (flag drawn as an SVG icon). */
export interface LanguageOption {
  code: AppLanguage;
  label: string;
  flagIcon: 'flag-gb' | 'flag-pt';
}

/** A currency returned by `GET /api/currencies`. */
export interface CurrencyRate {
  code: string;
  symbol: string;
  label: string;
  rate: number;
}

/** Payload of `GET /api/currencies`. */
export interface CurrencyConfig {
  base: string;
  defaultCurrency: string;
  currencies: CurrencyRate[];
}
