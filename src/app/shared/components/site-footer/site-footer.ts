import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { LocaleService } from '../../../core/services/locale.service';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooterComponent {
  protected readonly content = inject(ContentService);
  protected readonly locale = inject(LocaleService);
  protected readonly year = new Date().getFullYear();
  protected readonly queryParamsFor = (filter?: string) => (filter ? { category: filter } : {});
}
