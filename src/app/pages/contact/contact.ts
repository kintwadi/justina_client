import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ContentService } from '../../core/services/content.service';
import { IntegrationService } from '../../core/services/integration.service';
import { LocaleService } from '../../core/services/locale.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/error.util';
import { FaqAccordionComponent } from '../../shared/components/faq-accordion/faq-accordion';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header';
import { FadeInDirective } from '../../shared/directives/fade-in.directive';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY_FORM: ContactForm = {
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
};

@Component({
  selector: 'app-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FadeInDirective, PageHeaderComponent, SectionHeaderComponent, FaqAccordionComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactPageComponent {
  private readonly toast = inject(ToastService);
  private readonly integration = inject(IntegrationService);

  protected readonly content = inject(ContentService);
  protected readonly locale = inject(LocaleService);
  protected readonly form = signal<ContactForm>(EMPTY_FORM);
  protected readonly sending = signal(false);
  protected readonly showVisitAtelierSection = false;

  protected onInput(field: keyof ContactForm, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
    this.form.update((form) => ({ ...form, [field]: value }));
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.sending()) {
      return;
    }

    const payload = this.form();
    if (!payload.firstName || !payload.lastName || !payload.email || !payload.message) {
      this.toast.show(this.locale.t('contact.completeFields'), 4000);
      return;
    }

    this.sending.set(true);
    this.integration
      .sendContact({
        ...payload,
        subject: payload.subject || this.content.contactSubjects[0] || this.locale.t('contact.defaultSubject'),
      })
      .subscribe({
        next: (response) => {
          this.sending.set(false);
          this.toast.show(response.message, 5000);
          this.form.set(EMPTY_FORM);
        },
        error: (error: unknown) => {
          this.sending.set(false);
          this.toast.show(apiErrorMessage(error, this.locale.t('contact.sendError')), 5000);
        },
      });
  }
}
