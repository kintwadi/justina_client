import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ContentService } from '../../../core/services/content.service';
import { LocaleService } from '../../../core/services/locale.service';
import { ToastService } from '../../../core/services/toast.service';
import { UiService } from '../../../core/services/ui.service';
import { AppLanguage } from '../../../core/models/locale.model';
import { IconComponent } from '../icon/icon';

/** Sticky site navigation with locale/currency switchers, search, account menu, cart badge and mobile menu. */
@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeaderComponent {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly content = inject(ContentService);
  protected readonly locale = inject(LocaleService);
  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);
  protected readonly auth = inject(AuthService);

  protected readonly scrolled = signal(false);
  protected readonly accountOpen = signal(false);
  protected readonly languageOpen = signal(false);

  protected readonly flagIcon = computed(() => this.locale.activeLanguage().flagIcon);
  protected readonly headerButtons = computed(() => this.content.headerButtons);
  protected readonly navLinks = computed(() => {
    const links = this.content.navLinks.filter((link) => this.isNavLinkVisible(link.route));
    if (!links.some((link) => link.route === '/custom-order')) {
      links.push({
        label: this.locale.t('nav.customOrder'),
        route: '/custom-order',
      });
    }
    return links;
  });

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 50);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.account')) {
      this.accountOpen.set(false);
    }
    if (!target?.closest('.locale-picker')) {
      this.languageOpen.set(false);
    }
  }

  protected openSearch(): void {
    this.ui.closeMobileMenu();
    this.languageOpen.set(false);
    this.router.navigate(['/shop'], { queryParams: { focus: 'search' } });
  }

  protected toggleAccount(): void {
    this.languageOpen.set(false);
    this.accountOpen.update((open) => !open);
  }

  protected toggleLanguage(): void {
    this.accountOpen.set(false);
    this.languageOpen.update((open) => !open);
  }

  protected selectLanguage(code: AppLanguage): void {
    this.locale.setLanguage(code);
    this.languageOpen.set(false);
  }

  protected closeAccount(): void {
    this.accountOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.closeAccount();
    this.toast.show(this.locale.t('toast.signedOut'));
    void this.router.navigateByUrl('/');
  }

  protected changeCurrency(code: string): void {
    this.locale.setCurrency(code);
  }

  protected closeMenu(): void {
    this.languageOpen.set(false);
    this.ui.closeMobileMenu();
  }

  private isNavLinkVisible(route: string): boolean {
    const config = this.headerButtons();
    switch (route) {
      case '/':
        return config.showHome;
      case '/shop':
        return config.showShop;
      case '/collections':
        return config.showCollections;
      case '/history':
        return config.showHistory;
      case '/contact':
        return config.showContact;
      case '/reviews':
        return false;
      default:
        return true;
    }
  }
}
