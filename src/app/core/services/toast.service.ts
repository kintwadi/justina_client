import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
}

/** Tiny toast queue used for cart / form feedback. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private sequence = 0;
  private readonly messages = signal<ToastMessage[]>([]);

  readonly toasts = this.messages.asReadonly();

  show(text: string, duration = 3000): void {
    const id = ++this.sequence;
    this.messages.update((messages) => [...messages, { id, text }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }
}
