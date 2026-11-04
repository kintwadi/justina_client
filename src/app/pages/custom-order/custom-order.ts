import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Product } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { CustomOrderService } from '../../core/services/custom-order.service';
import { LocaleService } from '../../core/services/locale.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/error.util';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

type CustomOrderMode = 'PRODUCT' | 'DESIGN';

interface CustomOrderForm {
  productId: number | null;
  title: string;
  quantity: number;
  preferredMaterial: string;
  preferredColor: string;
  sizeDetails: string;
  referenceImageUrl: string;
  budget: number | null;
  targetTimeline: string;
  notes: string;
}

function emptyForm(): CustomOrderForm {
  return {
    productId: null,
    title: '',
    quantity: 1,
    preferredMaterial: '',
    preferredColor: '',
    sizeDetails: '',
    referenceImageUrl: '',
    budget: null,
    targetTimeline: '',
    notes: '',
  };
}

@Component({
  selector: 'app-custom-order-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './custom-order.html',
  styleUrl: './custom-order.scss',
})
export class CustomOrderPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly customOrders = inject(CustomOrderService);
  private readonly toast = inject(ToastService);
  protected readonly locale = inject(LocaleService);
  protected readonly auth = inject(AuthService);

  private readonly requestedProductId = signal<number | null>(null);

  protected readonly mode = signal<CustomOrderMode>('DESIGN');
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly form = signal<CustomOrderForm>(emptyForm());

  protected readonly customProducts = computed(() =>
    this.catalog
      .allProducts()
      .filter((product) => product.customMade === true),
  );
  protected readonly selectedProduct = computed(() => {
    const productId = this.form().productId;
    return this.customProducts().find((product) => product.id === productId) ?? null;
  });

  constructor() {
    if (this.catalog.allProducts().length === 0) {
      this.catalog.reload().subscribe({ next: () => undefined, error: () => undefined });
    }

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const productId = Number(params.get('productId') ?? 0);
      this.requestedProductId.set(Number.isFinite(productId) && productId > 0 ? productId : null);
    });

    effect(() => {
      const requestedProductId = this.requestedProductId();
      const requestedProduct = this.customProducts().find((product) => product.id === requestedProductId);
      if (!requestedProduct) {
        return;
      }
      this.selectProduct(requestedProduct);
    });
  }

  protected update<K extends keyof CustomOrderForm>(field: K, value: CustomOrderForm[K]): void {
    this.form.update((form) => ({ ...form, [field]: value }));
  }

  protected selectMode(mode: CustomOrderMode): void {
    this.mode.set(mode);
    this.formError.set(null);
    this.successMessage.set(null);
    if (mode === 'DESIGN') {
      this.form.update((form) => ({
        ...form,
        productId: null,
        title: form.title.trim() ? form.title : '',
      }));
    } else if (!this.form().productId) {
      const firstProduct = this.customProducts()[0] ?? null;
      if (firstProduct) {
        this.selectProduct(firstProduct);
      }
    }
  }

  protected selectProduct(product: Product): void {
    this.mode.set('PRODUCT');
    this.form.update((form) => ({
      ...form,
      productId: product.id,
      title: form.title.trim() ? form.title : product.name,
    }));
    this.formError.set(null);
    this.successMessage.set(null);
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }

    const form = this.form();
    const problems: string[] = [];
    if (this.mode() === 'PRODUCT' && !form.productId) {
      problems.push(this.locale.t('customOrder.validation.product'));
    }
    if (!form.title.trim()) {
      problems.push(this.locale.t('customOrder.validation.title'));
    }
    if (!form.notes.trim()) {
      problems.push(this.locale.t('customOrder.validation.notes'));
    }
    if (!Number.isFinite(form.quantity) || form.quantity < 1) {
      problems.push(this.locale.t('customOrder.validation.quantity'));
    }

    if (problems.length > 0) {
      this.formError.set(problems.join(' '));
      this.successMessage.set(null);
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    this.successMessage.set(null);

    this.customOrders
      .create({
        productId: this.mode() === 'PRODUCT' ? form.productId : null,
        title: form.title.trim(),
        quantity: Math.max(1, Math.round(form.quantity)),
        preferredMaterial: form.preferredMaterial.trim() || null,
        preferredColor: form.preferredColor.trim() || null,
        sizeDetails: form.sizeDetails.trim() || null,
        referenceImageUrl: form.referenceImageUrl.trim() || null,
        budget: form.budget,
        budgetCurrency: form.budget !== null ? this.locale.currency() : null,
        targetTimeline: form.targetTimeline.trim() || null,
        notes: form.notes.trim(),
      })
      .subscribe({
        next: (request) => {
          this.saving.set(false);
          this.successMessage.set(
            this.locale.t('customOrder.success', { requestNumber: request.requestNumber }),
          );
          this.toast.show(this.locale.t('customOrder.toastSuccess'));
          this.form.update((current) => ({
            ...emptyForm(),
            productId: this.mode() === 'PRODUCT' ? current.productId : null,
            title:
              this.mode() === 'PRODUCT'
                ? (this.selectedProduct()?.name ?? '')
                : '',
          }));
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.formError.set(
            apiErrorMessage(error, this.locale.t('customOrder.error')),
          );
        },
      });
  }
}
