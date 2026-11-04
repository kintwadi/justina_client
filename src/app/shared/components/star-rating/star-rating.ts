import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Displays a 0–5 star rating as filled / hollow stars. */
@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stars" [attr.aria-label]="rating() + ' out of 5 stars'">
      <span class="filled">{{ filled() }}</span
      ><span class="empty">{{ empty() }}</span>
    </span>
  `,
  styles: `
    .stars {
      letter-spacing: 2px;
      color: var(--color-accent);
    }

    .empty {
      opacity: 0.45;
    }
  `,
})
export class StarRatingComponent {
  readonly rating = input.required<number>();

  protected readonly filled = computed(() => '★'.repeat(this.rating()));
  protected readonly empty = computed(() => '☆'.repeat(Math.max(0, 5 - this.rating())));
}
