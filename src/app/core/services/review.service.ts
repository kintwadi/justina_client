import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import { API_URL } from '../config/api.config';
import { Review, ReviewSummary } from '../models/review.model';
import { MOCK_REVIEWS, MOCK_REVIEW_SUMMARY } from '../data/mock-reviews';

export type ReviewFilter = 'all' | '5' | 'bags' | 'wallets' | 'accessories';

/**
 * Reviews sourced from the REST API. The mock data seeds the signals so the page renders instantly,
 * then is replaced by the live payload once `load()` resolves.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  private readonly reviews = signal<Review[]>([...MOCK_REVIEWS]);

  readonly summary = signal<ReviewSummary>(MOCK_REVIEW_SUMMARY);

  load(): Observable<void> {
    return forkJoin({
      reviews: this.http
        .get<Review[]>(`${API_URL}/reviews`, { params: { filter: 'all' } })
        .pipe(catchError(() => of([...MOCK_REVIEWS]))),
      summary: this.http
        .get<ReviewSummary>(`${API_URL}/reviews/summary`)
        .pipe(catchError(() => of(MOCK_REVIEW_SUMMARY))),
    }).pipe(
      tap(({ reviews, summary }) => {
        this.reviews.set(reviews);
        this.summary.set(summary);
      }),
      map(() => undefined),
    );
  }

  list(filter: ReviewFilter = 'all'): Review[] {
    const reviews = this.reviews();
    if (filter === '5') {
      return reviews.filter((review) => review.rating === 5);
    }
    if (filter === 'bags' || filter === 'wallets' || filter === 'accessories') {
      return reviews.filter((review) => review.category === filter);
    }
    return reviews;
  }

  markHelpful(id: number): void {
    this.http
      .post<Review>(`${API_URL}/reviews/${id}/helpful`, {})
      .pipe(catchError(() => of(null)))
      .subscribe((updated) => {
        if (!updated) {
          return;
        }
        this.reviews.update((reviews) =>
          reviews.map((review) => (review.id === id ? updated : review)),
        );
      });
  }
}
