import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconName } from './icon-name';

/**
 * Small reusable stroke-icon renderer.
 * Keeps every SVG in the app consistent (24x24 viewBox, currentColor stroke).
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  readonly strokeWidth = input(2);
}
