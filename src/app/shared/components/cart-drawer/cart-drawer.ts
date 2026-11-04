import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CheckoutService } from '../../../core/services/checkout.service';
import { LocaleService } from '../../../core/services/locale.service';
import { ToastService } from '../../../core/services/toast.service';
import { UiService } from '../../../core/services/ui.service';
import { apiErrorMessage } from '../../../core/utils/error.util';
import { IconComponent } from '../icon/icon';

/** Slide-in shopping bag. */
@Component({
  selector: 'app-cart-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawerComponent {
  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);
  protected readonly locale = inject(LocaleService);
  private readonly toast = inject(ToastService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly auth = inject(AuthService);

  protected readonly processing = signal(false);

  protected imageClasses(gradient: string): string {
    return `cart-item-image ${gradient}`;
  }

  protected checkout(): void {
    if (this.processing() || this.cart.isEmpty()) {
      return;
    }

    this.processing.set(true);
    this.checkoutService
      .createSession(
        this.cart.items(),
        this.locale.currency(),
        this.locale.language(),
        this.auth.user()?.email,
      )
      .subscribe({
        next: (session) => {
          window.location.href = session.checkoutUrl;
        },
        error: (error: unknown) => {
          this.processing.set(false);
          this.toast.show(apiErrorMessage(error, this.locale.t('cart.unavailable')), 5000);
        },
      });
  }
}
