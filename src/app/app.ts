import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CatalogService } from './core/services/catalog.service';
import { ContentService } from './core/services/content.service';
import { LocaleService } from './core/services/locale.service';
import { AnnouncementBarComponent } from './shared/components/announcement-bar/announcement-bar';
import { CartDrawerComponent } from './shared/components/cart-drawer/cart-drawer';
import { NewsletterSignupComponent } from './shared/components/newsletter-signup/newsletter-signup';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer';
import { SiteHeaderComponent } from './shared/components/site-header/site-header';
import { ToastHostComponent } from './shared/components/toast-host/toast-host';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    AnnouncementBarComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    NewsletterSignupComponent,
    CartDrawerComponent,
    ToastHostComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly locale = inject(LocaleService);
  private readonly content = inject(ContentService);
  private readonly catalog = inject(CatalogService);

  protected readonly showNewsletterSignup = false;

  constructor() {
    let initialized = false;
    // Re-fetch backend-served content and catalogue whenever the language changes so the storefront
    // reflects the newly selected locale. The initial hydration is handled by the app initializer.
    effect(() => {
      this.locale.language();
      if (!initialized) {
        initialized = true;
        return;
      }
      this.content.reload().subscribe();
      this.catalog.reload().subscribe();
    });
  }
}
