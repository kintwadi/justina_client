import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FaqEntry } from '../../../core/models/content.model';
import { FadeInDirective } from '../../directives/fade-in.directive';
import { IconComponent } from '../icon/icon';

/** Expand/collapse FAQ list. */
@Component({
  selector: 'app-faq-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FadeInDirective, IconComponent],
  template: `
    <div appFadeIn>
      @for (item of items(); track item.question; let index = $index) {
        <div class="faq-item" [class.open]="openIndex() === index">
          <button class="faq-question" type="button" [attr.aria-expanded]="openIndex() === index" (click)="toggle(index)">
            <span>{{ item.question }}</span>
            <span class="icon"><app-icon name="plus" [size]="22" [strokeWidth]="1.5" /></span>
          </button>
          <div class="faq-answer">
            <div class="faq-answer-content">{{ item.answer }}</div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './faq-accordion.scss',
})
export class FaqAccordionComponent {
  readonly items = input.required<readonly FaqEntry[]>();

  protected readonly openIndex = signal<number | null>(null);

  protected toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }
}
