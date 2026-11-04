import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReviewSummary } from '../../../core/models/review.model';
import { StarRatingComponent } from '../star-rating/star-rating';

/** Average rating plus the 5→1 star distribution bars. */
@Component({
  selector: 'app-rating-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StarRatingComponent],
  template: `
    <div class="reviews-summary">
      <div class="rating-big">
        <div class="number">{{ summary().average }}</div>
        <div class="stars"><app-star-rating [rating]="5" /></div>
        <div class="total">Based on {{ summary().total }} reviews</div>
      </div>

      <div class="rating-bars">
        @for (bar of summary().bars; track bar.stars) {
          <div class="rating-bar-row">
            <span>{{ bar.stars }} {{ bar.stars === 1 ? 'star' : 'stars' }}</span>
            <div class="rating-bar">
              <div class="rating-bar-fill" [style.width.%]="bar.percent"></div>
            </div>
            <span>{{ bar.percent }}%</span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './rating-summary.scss',
})
export class RatingSummaryComponent {
  readonly summary = input.required<ReviewSummary>();
}
