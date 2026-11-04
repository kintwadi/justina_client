import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Deprecated placeholder kept only for compatibility after moving to a dedicated product page. */
@Component({
  selector: 'app-quick-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-view.html',
  styleUrl: './quick-view.scss',
})
export class QuickViewComponent {}
