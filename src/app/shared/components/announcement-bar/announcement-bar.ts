import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-announcement-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="announcement">{{ content.brand.announcement }}</div>`,
  styles: `
    .announcement {
      background: var(--color-text);
      color: var(--color-bg);
      text-align: center;
      padding: 10px 20px;
      font-size: 11px;
      letter-spacing: 2.5px;
      text-transform: uppercase;
    }
  `,
})
export class AnnouncementBarComponent {
  protected readonly content = inject(ContentService);
}
