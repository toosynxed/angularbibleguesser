// src/app/classic-input/classic-input.component.ts

import { Component, EventEmitter, Output } from '@angular/core';
import { InputSanitisationService } from '../features/input-sanitisation/input-sanitisation.service';

@Component({
  selector: 'app-classic-input',
  templateUrl: './classic-input.component.html',
  styleUrls: ['./classic-input.component.css']
})
export class ClassicInputComponent {
  @Output() guess = new EventEmitter<string>();
  public inputText: string = '';
  public validationError = '';

  constructor(private inputSanitisation: InputSanitisationService) {}

  onInputChange(event: any): void {
    this.inputText = event.target.value;
  }

  submitGuess(): void {
    const result = this.inputSanitisation.validateVerseGuess(this.inputText);

    if (!result.valid) {
      this.validationError = result.errors[0];
      return;
    }

    this.validationError = '';
    this.guess.emit(result.value);
    this.inputText = ''; // Clear the input after submitting
  }
}
