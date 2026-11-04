import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FadeInDirective } from '../../directives/fade-in.directive';

/** Centered section title with the brand divider and an optional subtitle. */
@Component({
  selector: 'app-section-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FadeInDirective],
  template: `
    <div class="section-header" appFadeIn>
      <h2>{{ title() }}</h2>
      <div class="section-divider"></div>
      @if (subtitle()) {
        <p>{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: `
    .section-header {
      text-align: center;
      margin-bottom: 70px;
    }

    .section-header h2 {
      font-size: clamp(32px, 4vw, 48px);
      margin-bottom: 18px;
      letter-spacing: 2px;
    }

    .section-header p {
      color: var(--color-text-light);
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.8;
    }

    .section-divider {
      width: 50px;
      height: 1px;
      background: var(--color-accent);
      margin: 22px auto;
    }
  `,
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
