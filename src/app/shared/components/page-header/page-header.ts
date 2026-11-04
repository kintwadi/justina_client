import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/services/locale.service';

/** Gradient hero strip used at the top of every inner page. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <div class="page-header-content">
        <div class="breadcrumb">
          <a routerLink="/">{{ locale.t('nav.home') }}</a> &nbsp;/&nbsp; {{ crumb() }}
        </div>
        <h1>{{ title() }}</h1>
        <p>{{ subtitle() }}</p>
      </div>
    </div>
  `,
  styles: `
    .page-header {
      padding: 60px 20px 45px;
      text-align: center;
      background: linear-gradient(135deg, #3d2b1f 0%, #5c4033 50%, #8b6914 100%);
      color: #faf8f5;
      position: relative;
      overflow: hidden;
    }

    .page-header::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
          circle at 20% 30%,
          rgba(255, 255, 255, 0.08) 0%,
          transparent 50%
        ),
        radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.06) 0%, transparent 50%);
    }

    .page-header-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
    }

    .breadcrumb {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0.7;
      margin-bottom: 20px;
    }

    .breadcrumb a {
      color: #faf8f5;
      text-decoration: none;
      cursor: pointer;
    }

    .breadcrumb a:hover {
      color: #c4983a;
    }

    h1 {
      font-size: clamp(38px, 5vw, 62px);
      letter-spacing: 5px;
      text-transform: uppercase;
      margin-bottom: 18px;
      font-weight: 600;
      overflow-wrap: break-word;
    }

    p {
      font-size: 15px;
      letter-spacing: 1.5px;
      opacity: 0.85;
      line-height: 1.7;
    }

    @media (min-width: 768px) {
      .page-header {
        padding: 90px 40px 70px;
      }
    }
  `,
})
export class PageHeaderComponent {
  protected readonly locale = inject(LocaleService);

  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly crumb = input.required<string>();
}
