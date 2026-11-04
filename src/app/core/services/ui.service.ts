import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

/** Cross-cutting UI state: cart drawer and mobile navigation. */
@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly document = inject(DOCUMENT);

  private readonly cartOpenState = signal(false);
  private readonly mobileMenuState = signal(false);

  readonly cartOpen = this.cartOpenState.asReadonly();
  readonly mobileMenuOpen = this.mobileMenuState.asReadonly();

  constructor() {
    effect(() => {
      const locked = this.cartOpenState();
      this.document.body.style.overflow = locked ? 'hidden' : '';
    });
  }

  openCart(): void {
    this.cartOpenState.set(true);
  }

  closeCart(): void {
    this.cartOpenState.set(false);
  }

  toggleCart(): void {
    this.cartOpenState.update((open) => !open);
  }

  toggleMobileMenu(): void {
    this.mobileMenuState.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuState.set(false);
  }
}
