import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionBlock } from '../../../core/models/content.model';
import { FadeInDirective } from '../../directives/fade-in.directive';

/** Alternating image / copy block used on the Collections page. */
@Component({
  selector: 'app-collection-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FadeInDirective],
  template: `
    <div [class]="imageClasses()" appFadeIn>
      <img [src]="collection().image" [alt]="collection().title" loading="lazy" />
    </div>
    <div class="collection-content" appFadeIn>
      <span class="collection-tag">{{ collection().tag }}</span>
      <h3>{{ collection().title }}</h3>
      <p>{{ collection().text }}</p>
      <a class="collection-link" routerLink="/shop" [queryParams]="queryParams()">
        {{ collection().linkLabel }}
      </a>
    </div>
  `,
  styleUrl: './collection-block.scss',
})
export class CollectionBlockComponent {
  readonly collection = input.required<CollectionBlock>();

  protected readonly imageClasses = computed(() => `collection-image ${this.collection().imageClass}`);
  protected readonly queryParams = computed(() =>
    this.collection().filter ? { category: this.collection().filter } : {},
  );
}
