import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { LocaleService } from '../../../core/services/locale.service';

/**
 * Presentational product tile: image, badge, hover actions and price.
 * Emits user intent so the parent decides what happens next.
 */
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="product-card">
      <div [class]="frameClasses()">
        <img class="media" [src]="product().image" [alt]="product().name" loading="lazy" />
        @if (product().badge) {
          <span class="product-badge">{{ product().badge }}</span>
        }
        <div class="product-actions">
          <button class="action-btn" type="button" (click)="quickView.emit(product())">
            {{ locale.t('product.viewDetails') }}
          </button>
          <button
            class="action-btn primary"
            type="button"
            (click)="product().customMade ? requestCustom.emit(product()) : addToCart.emit(product())"
          >
            {{ product().customMade ? locale.t('product.requestCustomOrder') : locale.t('product.addToBag') }}
          </button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">{{ product().category }}</div>
        <h3>{{ product().name }}</h3>
        <div class="price">
          {{ price() }}
          @if (product().originalPrice) {
            <span class="original">{{ originalPrice() }}</span>
          }
        </div>
      </div>
    </article>
  `,
  styles: `
    .product-card {
      cursor: pointer;
      transition: transform 0.4s;
    }

    .product-card:hover {
      transform: translateY(-6px);
    }

    .product-image {
      position: relative;
      aspect-ratio: 3 / 4;
      overflow: hidden;
      border-radius: 4px;
      margin-bottom: 20px;
      background: #eee;
    }

    .media {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.8s ease;
    }

    .product-card:hover .media {
      transform: scale(1.06);
    }

    .product-badge {
      position: absolute;
      top: 15px;
      left: 15px;
      background: var(--color-accent);
      color: #fff;
      font-size: 10px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 2px;
      z-index: 2;
    }

    .product-actions {
      position: absolute;
      bottom: 15px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
      transition: all 0.4s;
      display: flex;
      gap: 8px;
      z-index: 2;
    }

    .product-card:hover .product-actions {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .product-info {
      padding: 0 5px;
    }

    .product-info h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }

    .product-category {
      font-size: 10px;
      color: var(--color-text-light);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .price {
      font-size: 16px;
      font-weight: 500;
      color: var(--color-accent);
    }

    .price .original {
      text-decoration: line-through;
      color: var(--color-text-light);
      font-weight: 300;
      margin-left: 8px;
      font-size: 14px;
    }
  `,
})
export class ProductCardComponent {
  protected readonly locale = inject(LocaleService);

  readonly product = input.required<Product>();

  readonly quickView = output<Product>();
  readonly addToCart = output<Product>();
  readonly requestCustom = output<Product>();

  protected readonly frameClasses = computed(
    () => `product-image ${this.product().imageClass}`,
  );
  protected readonly price = computed(() => this.locale.formatPrice(this.product().price));
  protected readonly originalPrice = computed(() => {
    const original = this.product().originalPrice;
    return original ? this.locale.formatPrice(original) : '';
  });
}
