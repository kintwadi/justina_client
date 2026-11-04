import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TimelineEntry } from '../../../core/models/content.model';
import { FadeInDirective } from '../../directives/fade-in.directive';

/**
 * One row of the alternating history timeline.
 * The host itself is the grid row so `:nth-child(even)` can flip the layout.
 */
@Component({
  selector: 'app-timeline-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FadeInDirective],
  template: `
    <div class="timeline-content" [attr.data-year]="entry().year" appFadeIn>
      <h4>{{ entry().title }}</h4>
      <p>{{ entry().text }}</p>
    </div>
    <div class="timeline-dot"></div>
    <div class="timeline-year">{{ entry().year }}</div>
  `,
  styleUrl: './timeline-item.scss',
})
export class TimelineItemComponent {
  readonly entry = input.required<TimelineEntry>();
}
