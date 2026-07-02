import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { ScrollsService } from '../../scrolls.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-shop-page',
  templateUrl: './racetrack.component.html',
  styleUrls: ['./racetrack.component.css']
})
export class racetrackComponent implements OnInit {
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
    this.userScrolls$ = this.user$.pipe(
      switchMap((user) => user?.uid ? this.scrollsService.getUserScrolls(user.uid) : of(undefined))
    );

  }


  confirmGoHome(): void {
    this.router.navigate(['/']);
}
  
  backToMap(): void {
    this.router.navigate(['../quest'])
    console.log('Navigated to: /quest')
  }
}
