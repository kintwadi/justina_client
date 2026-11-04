import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryTile } from '../../../core/models/content.model';
import { IconComponent } from '../icon/icon';

/** Image tile linking to a filtered shop view or a curated page. */
@Component({
  selector: 'app-category-tile-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <a class="category-card" [routerLink]="tile().route" [queryParams]="queryParams()">
      <div [class]="bgClasses()">
        <img [src]="tile().image" [alt]="tile().title" loading="lazy" />
      </div>
      <div class="cat-overlay">
        <div>
          <h3>{{ tile().title }}</h3>
          <div class="cat-count">{{ tile().count }}</div>
        </div>
      </div>
      <span class="cat-arrow"><app-icon name="arrow-right" [size]="20" /></span>
    </a>
  `,
  styleUrl: './category-tile-card.scss',
})
export class CategoryTileCardComponent {
  readonly tile = input.required<CategoryTile>();

  protected readonly bgClasses = computed(() => `cat-bg ${this.tile().imageClass}`);
  protected readonly queryParams = computed(() =>
    this.tile().filter ? { category: this.tile().filter } : {},
  );
}
