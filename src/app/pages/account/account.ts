import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationKey } from '../../core/i18n/translations';
import { LocaleService } from '../../core/services/locale.service';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorMessage } from '../../core/utils/error.util';
import { IconComponent } from '../../shared/components/icon/icon';
import { OrderSummary } from '../../core/models/order.model';

@Component({
  selector: 'app-account-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class AccountPageComponent {
  private readonly auth = inject(AuthService);
  private readonly account = inject(AccountService);
  protected readonly locale = inject(LocaleService);

  protected readonly user = this.auth.user;
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly orders = signal<OrderSummary[]>([]);
  protected readonly fullName = computed(() => {
    const user = this.user();
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  });

  constructor() {
    this.account.myOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loadError.set(
          apiErrorMessage(error, this.locale.t('account.loadError')),
        );
        this.loading.set(false);
      },
    });
  }

  protected formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat(this.localeCode(), {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.localeCode(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  protected orderStatusLabel(status: string): string {
    const keyByStatus: Record<string, TranslationKey> = {
      PENDING: 'admin.orderStatus.pending',
      PAID: 'admin.orderStatus.paid',
      FULFILLED: 'admin.orderStatus.fulfilled',
      CANCELLED: 'admin.orderStatus.cancelled',
      REFUNDED: 'admin.orderStatus.refunded',
    };
    const key = keyByStatus[status];
    return key ? this.locale.t(key) : status;
  }

  protected paymentStatusLabel(status: string): string {
    const keyByStatus: Record<string, TranslationKey> = {
      PENDING: 'admin.paymentStatus.pending',
      REQUIRES_ACTION: 'admin.paymentStatus.requiresAction',
      SUCCEEDED: 'admin.paymentStatus.succeeded',
      FAILED: 'admin.paymentStatus.failed',
      REFUNDED: 'admin.paymentStatus.refunded',
    };
    const key = keyByStatus[status];
    return key ? this.locale.t(key) : status;
  }

  protected itemCount(order: OrderSummary): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private localeCode(): string {
    return this.locale.language() === 'pt' ? 'pt-PT' : 'en-GB';
  }
}
