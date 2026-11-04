import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

/** Renders the toast queue in the bottom-right corner. */
@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast">{{ toast.text }}</div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 5000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }

    .toast {
      background: var(--color-text);
      color: #fff;
      padding: 16px 30px;
      border-radius: 4px;
      font-size: 13px;
      letter-spacing: 0.5px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      animation: toastIn 0.4s ease;
    }

    @keyframes toastIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);
}
