import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BibleService } from '../bible.service';
import { GameSettings } from '../game-settings.model';

@Component({
  selector: 'app-custom-settings',
  templateUrl: './custom-settings.component.html', // Corrected path
  styleUrls: ['./custom-settings.component.css'] // Corrected path
})
export class CustomSettingsComponent implements OnInit {
  // Default settings
  settings: GameSettings = {
    rounds: 5,
    contextSize: 250,
    timeLimit: 0, // 0 for no limit
    books: [] as string[]
  };

  allBooks: string[] = [];
  bookGroups: { groupName: string, books: string[] }[] = [];

  timeOptions = [
    { value: 0, label: 'No Time Limit' },
    { value: 30, label: '30 Seconds' },
    { value: 60, label: '1 Minute' },
    { value: 120, label: '2 Minutes' },
    { value: 300, label: '5 Minutes' },
    { value: 600, label: '10 Minutes' }
  ];

  constructor(private router: Router, private bibleService: BibleService) { }

  ngOnInit(): void {
    this.bibleService.getBooks().subscribe(books => {
      this.allBooks = books;
      this.settings.books = [...this.allBooks]; // Default to all books selected
      this.bookGroups = this.bibleService.getGroupedBooks();
    });
  }

  toggleBook(book: string): void {
    const index = this.settings.books.indexOf(book);
    if (index > -1) {
      this.settings.books.splice(index, 1);
    } else {
      this.settings.books.push(book);
    }
  }

  toggleBookGroup(group: { groupName: string, books: string[] }): void {
    const allBooksInGroupSelected = group.books.every(b => this.settings.books.includes(b));
    if (allBooksInGroupSelected) {
      // If all are selected, deselect them
      this.settings.books = this.settings.books.filter(b => !group.books.includes(b));
    } else {
      // Otherwise, select all books in this group that aren't already selected
      group.books.forEach(b => {
        if (!this.settings.books.includes(b)) {
          this.settings.books.push(b);
        }
      });
    }
  }

  startGame(): void {
    if (this.settings.books.length === 0) {
      alert('Please select at least one book to play with.');
      return;
    }
    // Enforce a maximum of 100 rounds
    if (this.settings.rounds > 100) {
      this.settings.rounds = 100;
    }

    this.router.navigate(['/game'], {
      state: {
        mode: 'custom', // Ensure correct mode is passed
        settings: this.settings
      }
    });
  }

  goBack(): void {
    const confirmation = window.confirm('Are you sure you want to leave? Your custom settings will be lost.');
    if (confirmation) {
      this.router.navigate(['/']);
    }
  }
}
