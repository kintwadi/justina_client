import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductCardComponent } from '../product-card/product-card';

/**
 * Renders a product collection and wires the shared card interactions
 * (quick view + add to bag) so pages stay declarative.
 */
@Component({
  selector: 'app-product-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent],
  template: `
    <div class="products-grid">
      @for (product of products(); track product.id) {
        <app-product-card
          [product]="product"
          (quickView)="openQuickView($event)"
          (addToCart)="addToCart($event)"
          (requestCustom)="requestCustomOrder($event)"
        />
      } @empty {
        <p class="empty-state">{{ emptyMessage() }}</p>
      }
    </div>
  `,
})
export class ProductGridComponent {
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly products = input.required<readonly Product[]>();
  readonly emptyMessage = input('No products match your filters. Try adjusting your selection.');

  protected openQuickView(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  protected addToCart(product: Product): void {
    this.cart.add(product);
    this.toast.show(`${product.name} added to your bag`);
  }

  protected requestCustomOrder(product: Product): void {
    this.router.navigate(['/custom-order'], { queryParams: { productId: product.id } });
  }
}
