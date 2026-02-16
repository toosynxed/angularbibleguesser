import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { StatsService } from './stats.service';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    private fns: AngularFireFunctions,
    private authService: AuthService,
    private statsService: StatsService,
    private router: Router
  ) {}

  async sendMessage(message: string): Promise<string> {
    const user = await this.authService.user$.pipe(first()).toPromise();
    let stats = null;

    if (user) {
      stats = await this.statsService.getUserStats(user.uid).pipe(first()).toPromise();
    }

    const context = {
      currentPage: this.router.url,
      stats: stats,
      isAnonymous: user?.isAnonymous,
      displayName: user?.displayName
    };

    const callable = this.fns.httpsCallable('chatWithBot');
    try {
      const result = await callable({ message, context }).toPromise();
      return result.text;
    } catch (error) {
      console.error('Chat error:', error);
      return "I'm having trouble connecting to the server right now. Please try again later.";
    }
  }
}
