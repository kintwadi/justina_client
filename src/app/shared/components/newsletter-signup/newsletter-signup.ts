import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../../core/services/content.service';
import { IntegrationService } from '../../../core/services/integration.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/utils/error.util';

@Component({
  selector: 'app-newsletter-signup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './newsletter-signup.html',
  styleUrl: './newsletter-signup.scss',
})
export class NewsletterSignupComponent {
  private readonly toast = inject(ToastService);
  private readonly integration = inject(IntegrationService);

  protected readonly content = inject(ContentService);

  protected readonly email = signal('');
  protected readonly sending = signal(false);

  protected subscribe(): void {
    const email = this.email().trim();
    if (this.sending()) {
      return;
    }
    if (!email) {
      this.toast.show('Please enter your email address.');
      return;
    }

    this.sending.set(true);
    this.integration.subscribeToNewsletter(email).subscribe({
      next: (response) => {
        this.sending.set(false);
        this.toast.show(response.message);
        this.email.set('');
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.toast.show(apiErrorMessage(error, 'Subscription failed. Please try again.'), 4000);
      },
    });
  }
}
