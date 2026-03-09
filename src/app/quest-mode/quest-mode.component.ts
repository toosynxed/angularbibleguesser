import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-quest-mode',
  templateUrl: './quest-mode.component.html',
  styleUrls: ['./quest-mode.component.css']
})
export class QuestModeComponent implements OnInit {
  user$: Observable<firebase.User | null>;
  showCustomization = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
  }

  startQuest(questId: string): void {
    console.log('Starting quest:', questId);
    // Example: this.router.navigate(['/game'], { state: { mode: 'quest', questId: questId } });
  }
  confirmGoHome(): void {
    const confirmation = window.confirm('Are you sure you want to leave? Your current game progress will be lost.');
    if (confirmation) {
        this.router.navigate(['/']);
    }
 }
}