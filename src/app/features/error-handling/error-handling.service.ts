import { ErrorHandler, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  id: string;
  message: string;
  technicalMessage?: string;
  severity: AppErrorSeverity;
  context?: string;
  createdAt: Date;
  recoverable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService implements ErrorHandler {
  private readonly errorsSubject = new BehaviorSubject<AppError[]>([]);
  readonly errors$ = this.errorsSubject.asObservable();

  handleError(error: unknown): void {
    this.reportError(error, {
      context: 'global',
      severity: 'error',
      recoverable: true
    });
  }

  reportError(
    error: unknown,
    options: Partial<Pick<AppError, 'context' | 'severity' | 'recoverable' | 'message'>> = {}
  ): AppError {
    const appError: AppError = {
      id: this.createErrorId(),
      message: options.message || this.toUserMessage(error),
      technicalMessage: this.toTechnicalMessage(error),
      severity: options.severity || 'error',
      context: options.context,
      createdAt: new Date(),
      recoverable: options.recoverable ?? true
    };

    this.errorsSubject.next([appError, ...this.errorsSubject.value].slice(0, 20));
    console.error(`[${appError.severity}] ${appError.context || 'app'}:`, error);
    return appError;
  }

  clearError(errorId: string): void {
    this.errorsSubject.next(this.errorsSubject.value.filter(error => error.id !== errorId));
  }

  clearAll(): void {
    this.errorsSubject.next([]);
  }

  private toUserMessage(error: unknown): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    if (error instanceof Error && error.message) {
      return 'Something went wrong. Please try again.';
    }

    return 'An unexpected issue occurred.';
  }

  private toTechnicalMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.stack || error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private createErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
