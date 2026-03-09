import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-quest-mode',
  templateUrl: './quest-mode.component.html',
  styleUrls: ['./quest-mode.component.css']
})
export class QuestModeComponent implements OnInit {
  user$: Observable<firebase.User | null>;
  showCustomization = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
  }
}