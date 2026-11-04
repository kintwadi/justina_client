import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { CategoryTileCardComponent } from '../../shared/components/category-tile-card/category-tile-card';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header';
import { TestimonialCardComponent } from '../../shared/components/testimonial-card/testimonial-card';
import { FadeInDirective } from '../../shared/directives/fade-in.directive';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FadeInDirective,
    CategoryTileCardComponent,
    ProductGridComponent,
    SectionHeaderComponent,
    TestimonialCardComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePageComponent {
  protected readonly content = inject(ContentService);
  protected readonly catalog = inject(CatalogService);

  protected readonly featured = computed(() => this.catalog.featured(4));
}
