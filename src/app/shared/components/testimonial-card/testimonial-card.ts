import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Testimonial } from '../../../core/models/content.model';
import { StarRatingComponent } from '../star-rating/star-rating';

@Component({
  selector: 'app-testimonial-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StarRatingComponent],
  template: `
    <div class="testimonial-card">
      <div class="testimonial-stars"><app-star-rating [rating]="testimonial().rating" /></div>
      <p>"{{ testimonial().text }}"</p>
      <div class="testimonial-author">{{ testimonial().author }}</div>
      <div class="testimonial-location">{{ testimonial().location }}</div>
    </div>
  `,
  styles: `
    .testimonial-card {
      background: var(--color-white);
      padding: 45px;
      border-radius: 4px;
      box-shadow: 0 4px 20px var(--color-shadow);
      transition: transform 0.3s;
    }

    .testimonial-card:hover {
      transform: translateY(-5px);
    }

    .testimonial-stars {
      margin-bottom: 18px;
      font-size: 14px;
    }

    .testimonial-card p {
      font-style: italic;
      color: var(--color-text-light);
      margin-bottom: 25px;
      line-height: 1.9;
      font-size: 15px;
    }

    .testimonial-author {
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 3px;
    }

    .testimonial-location {
      font-size: 12px;
      color: var(--color-text-light);
      letter-spacing: 0.5px;
    }
  `,
})
export class TestimonialCardComponent {
  readonly testimonial = input.required<Testimonial>();
}
