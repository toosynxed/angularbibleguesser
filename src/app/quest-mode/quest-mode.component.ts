import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { ScrollsService } from '../scrolls.service';
import { switchMap, take } from 'rxjs/operators';


@Component({
  selector: 'app-quest-mode',
  templateUrl: './quest-mode.component.html',
  styleUrls: ['./quest-mode.component.css']
})
export class QuestModeComponent implements OnInit {
  user$!: Observable<firebase.User | null>;
  showCustomization = false;
  userScrolls$!: Observable<number | undefined>;


  constructor(
    private authService: AuthService,
    private router: Router,
    private scrollsService: ScrollsService
    
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.user$.pipe(take(1)).subscribe((user) => {
      if (user?.uid) {
        void this.scrollsService.initializeScrolls(user.uid);
      }
    });
    this.userScrolls$ = this.user$.pipe(
      switchMap((user) => user?.uid ? this.scrollsService.getUserScrolls(user.uid) : of(undefined))
    ); 
  }

  startQuest(questId: string): void {
    console.log('Starting quest:', questId);
    // Example: this.router.navigate(['/game'], { state: { mode: 'quest', questId: questId } });
  
    //this.router.navigate(['/game'])

  }
  movePage(location: string): void {
      console.log('Navigating to:', location);
      if (location && location == 'marketplace') {
        this.router.navigate(['/marketplace']);
        console.log('Navigated')
      } else if (location && location == 'racetrack') {
        this.router.navigate(['/racetrack']);
        console.log('Navigated')
      } else if (location && location == 'castle') {
        window.alert('This gamemode, "Castle", is currently under development!\nPlease check back in soon!')
        console.log('Shown Alert: Castle not available')  
      } else if (location && location == 'academy') {
        this.router.navigate(['../academy']);
        console.log('Navigated')
      };
    }
  confirmGoHome(): void {
    this.router.navigate(['/']);

 }
  addButton(): void {
    this.authService.user$.pipe(take(1)).subscribe(async (user) => {
      if (user?.uid) {
        try {
          await this.scrollsService.addScrolls(user.uid, 1);
          console.log(`Successfully added 1 scrolls for user ${user.uid}`);
        } catch (error) {
          console.error('Failed to add scrolls:', error);
        }
      } else {
        console.log('No user logged in to give scrolls to.');
      }
    });
  }
    
}

