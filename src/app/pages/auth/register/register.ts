import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';
import { apiErrorMessage } from '../../../core/utils/error.util';

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  protected readonly locale = inject(LocaleService);
  private readonly router = inject(Router);

  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }

    const firstName = this.firstName().trim();
    const lastName = this.lastName().trim();
    const email = this.email().trim();
    const password = this.password();

    if (!firstName || !email || !password) {
      this.error.set(this.locale.t('register.missingFields'));
      return;
    }
    if (password.length < 8) {
      this.error.set(this.locale.t('register.passwordLength'));
      return;
    }
    if (password !== this.confirmPassword()) {
      this.error.set(this.locale.t('register.passwordMismatch'));
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    this.auth.register({ firstName, lastName, email, password }).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(error, this.locale.t('register.createError')));
      },
    });
  }
}
