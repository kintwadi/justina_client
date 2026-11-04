import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';
import { apiErrorMessage } from '../../../core/utils/error.util';

@Component({
  selector: 'app-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordPageComponent {
  private readonly auth = inject(AuthService);
  protected readonly locale = inject(LocaleService);

  protected readonly email = signal('');
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly submitting = signal(false);

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }

    const email = this.email().trim();
    if (!email) {
      this.error.set(this.locale.t('forgotPassword.missingEmail'));
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    this.auth.forgotPassword(email).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.message.set(response.message);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(error, this.locale.t('forgotPassword.sendError')));
      },
    });
  }
}
