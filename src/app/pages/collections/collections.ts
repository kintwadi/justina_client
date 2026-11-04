import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { CollectionBlockComponent } from '../../shared/components/collection-block/collection-block';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'app-collections-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, CollectionBlockComponent],
  template: `
    <div class="page">
      <app-page-header
        [title]="content.collectionsPage.pageTitle"
        [crumb]="content.collectionsPage.pageCrumb"
        [subtitle]="content.collectionsPage.pageSubtitle"
      />
      <div class="collections-grid">
        @for (collection of catalog.collections(); track collection.title) {
          <app-collection-block [collection]="collection" />
        }
      </div>
    </div>
  `,
  styles: `
    .collections-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 20px;
      display: grid;
      gap: 40px;
    }

    @media (min-width: 768px) {
      .collections-grid {
        padding: 70px 40px;
        gap: 100px;
      }
    }
  `,
})
export class CollectionsPageComponent {
  protected readonly catalog = inject(CatalogService);
  protected readonly content = inject(ContentService);
}
