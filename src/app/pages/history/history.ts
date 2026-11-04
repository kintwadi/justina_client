import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentService } from '../../core/services/content.service';
import { InfoCardComponent } from '../../shared/components/info-card/info-card';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header';
import { TimelineItemComponent } from '../../shared/components/timeline-item/timeline-item';
import { FadeInDirective } from '../../shared/directives/fade-in.directive';

@Component({
  selector: 'app-history-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FadeInDirective,
    PageHeaderComponent,
    SectionHeaderComponent,
    TimelineItemComponent,
    InfoCardComponent,
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class HistoryPageComponent {
  protected readonly content = inject(ContentService);
}
