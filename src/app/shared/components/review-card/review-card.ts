import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Review } from '../../../core/models/review.model';
import { IconComponent } from '../icon/icon';
import { StarRatingComponent } from '../star-rating/star-rating';

/** Single customer review with a "helpful" action. */
@Component({
  selector: 'app-review-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, StarRatingComponent],
  template: `
    <article class="review-item">
      <div class="review-avatar">{{ initial() }}</div>
      <div>
        <div class="review-header">
          <div>
            <div class="review-author">{{ review().author }}</div>
            <div class="review-meta">{{ review().location }} · {{ review().date }}</div>
          </div>
          <div class="review-stars"><app-star-rating [rating]="review().rating" /></div>
        </div>
        <div class="review-product">{{ review().product }}</div>
        <p class="review-text">{{ review().text }}</p>
        <div class="review-helpful">
          <button type="button" (click)="helpful.emit(review().id)">
            <app-icon name="thumb-up" [size]="14" /> Helpful ({{ review().helpful }})
          </button>
          <button type="button">Reply</button>
        </div>
      </div>
    </article>
  `,
  styleUrl: './review-card.scss',
})
export class ReviewCardComponent {
  readonly review = input.required<Review>();
  readonly helpful = output<number>();

  protected readonly initial = computed(() => this.review().author.charAt(0));
}
