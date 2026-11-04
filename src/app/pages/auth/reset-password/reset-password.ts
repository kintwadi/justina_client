import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/utils/error.util';

@Component({
  selector: 'app-reset-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordPageComponent {
  private readonly auth = inject(AuthService);
  protected readonly locale = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }

    if (!this.token) {
      this.error.set(this.locale.t('resetPassword.invalidLink'));
      return;
    }

    const password = this.password();
    if (password.length < 8) {
      this.error.set(this.locale.t('resetPassword.passwordLength'));
      return;
    }
    if (password !== this.confirmPassword()) {
      this.error.set(this.locale.t('resetPassword.passwordMismatch'));
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    this.auth.resetPassword(this.token, password).subscribe({
      next: () => {
        this.toast.show(this.locale.t('resetPassword.success'), 5000);
        void this.router.navigate(['/login']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(error, this.locale.t('resetPassword.invalidLink')));
      },
    });
  }
}
