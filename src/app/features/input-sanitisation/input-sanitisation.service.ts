import { Injectable } from '@angular/core';

export interface ValidationResult {
  valid: boolean;
  value: string;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class InputSanitisationService {
  private readonly unsafeHtmlPattern = /<[^>]*>|javascript:|data:text\/html|on\w+=/gi;

  sanitisePlainText(value: unknown, maxLength = 200): string {
    return String(value ?? '')
      .replace(this.unsafeHtmlPattern, '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .trim()
      .slice(0, maxLength);
  }

  validateDisplayName(value: unknown): ValidationResult {
    const cleanValue = this.sanitisePlainText(value, 20);
    const errors: string[] = [];

    if (!cleanValue) {
      errors.push('Display name is required.');
    }

    if (cleanValue.length > 20) {
      errors.push('Display name must be 20 characters or less.');
    }

    if (!/^[a-zA-Z0-9 _.'-]+$/.test(cleanValue)) {
      errors.push('Display name can only use letters, numbers, spaces, and simple punctuation.');
    }

    return {
      valid: errors.length === 0,
      value: cleanValue,
      errors
    };
  }

  validateGameCode(value: unknown): ValidationResult {
    const cleanValue = this.sanitisePlainText(value, 128).toUpperCase();
    const errors: string[] = [];

    if (!cleanValue) {
      errors.push('Game code is required.');
    }

    if (!/^[A-Z0-9_-]+$/.test(cleanValue)) {
      errors.push('Game code can only contain letters, numbers, underscores, and hyphens.');
    }

    return {
      valid: errors.length === 0,
      value: cleanValue,
      errors
    };
  }

  validateVerseGuess(value: unknown): ValidationResult {
    const cleanValue = this.sanitisePlainText(value, 80);
    const errors: string[] = [];

    if (!cleanValue) {
      errors.push('Verse guess is required.');
    }

    if (!/^[1-3]?\s?[A-Za-z ]+\s+\d{1,3}:\d{1,3}$/.test(cleanValue)) {
      errors.push("Use the format 'Book Chapter:Verse', for example 'John 3:16'.");
    }

    return {
      valid: errors.length === 0,
      value: cleanValue,
      errors
    };
  }
}
