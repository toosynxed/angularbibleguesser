// src/app/classic-input/classic-input.component.ts

import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-classic-input',
  templateUrl: './classic-input.component.html',
  styleUrls: ['./classic-input.component.css']
})
export class ClassicInputComponent {
  @Output() guess = new EventEmitter<string>();
  public inputText: string = '';

  onInputChange(event: any): void {
    this.inputText = event.target.value;
  }

  submitGuess(): void {
    this.guess.emit(this.inputText);
    this.inputText = ''; // Clear the input after submitting
  }
}
