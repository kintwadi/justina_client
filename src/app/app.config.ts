import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { localeInterceptor } from './core/interceptors/locale.interceptor';
import { AuthService } from './core/services/auth.service';
import { CatalogService } from './core/services/catalog.service';
import { ContentService } from './core/services/content.service';
import { LocaleService } from './core/services/locale.service';
import { ReviewService } from './core/services/review.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withHashLocation(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor, localeInterceptor])),
    // Hydrate brand content, the catalogue and reviews before the first render, and restore any
    // existing session. Every loader degrades gracefully, so the app still boots if the API is down.
    provideAppInitializer(() => {
      const content = inject(ContentService);
      const catalog = inject(CatalogService);
      const reviews = inject(ReviewService);
      const auth = inject(AuthService);
      const locale = inject(LocaleService);

      return firstValueFrom(
        forkJoin([
          content.load(),
          catalog.load(),
          reviews.load(),
          auth.loadCurrentUser(),
          locale.load(),
        ]),
      );
    }),
  ],
};
