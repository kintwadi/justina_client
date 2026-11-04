import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ContentService } from '../../core/services/content.service';
import { ReviewFilter, ReviewService } from '../../core/services/review.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { RatingSummaryComponent } from '../../shared/components/rating-summary/rating-summary';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card';
import { FadeInDirective } from '../../shared/directives/fade-in.directive';

@Component({
  selector: 'app-reviews-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FadeInDirective,
    PageHeaderComponent,
    RatingSummaryComponent,
    ReviewCardComponent,
  ],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss',
})
export class ReviewsPageComponent {
  private readonly reviews = inject(ReviewService);
  private readonly toast = inject(ToastService);

  protected readonly content = inject(ContentService);
  protected readonly summary = this.reviews.summary;
  protected readonly filter = signal<ReviewFilter>('all');

  protected readonly list = computed(() => this.reviews.list(this.filter()));

  protected selectFilter(filter: string): void {
    this.filter.set(filter as ReviewFilter);
  }

  protected markHelpful(id: number): void {
    this.reviews.markHelpful(id);
  }

  protected writeReview(): void {
    this.toast.show('Thank you! Your review will appear once approved.');
  }
}
