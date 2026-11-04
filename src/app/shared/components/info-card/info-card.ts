import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconName } from '../icon/icon-name';
import { IconComponent } from '../icon/icon';

/**
 * Generic bordered card used by the "Craft" and "Values" sections.
 * Renders an icon badge, an index number, or neither.
 */
@Component({
  selector: 'app-info-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="info-card" [class.numbered]="!!number()">
      @if (icon(); as iconName) {
        <div class="info-icon"><app-icon [name]="iconName" [size]="32" [strokeWidth]="1.5" /></div>
      }
      @if (number(); as index) {
        <div class="info-number">{{ index }}</div>
      }
      <h4>{{ title() }}</h4>
      <p>{{ text() }}</p>
    </div>
  `,
  styleUrl: './info-card.scss',
})
export class InfoCardComponent {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly icon = input<IconName>();
  readonly number = input<string>();
}
