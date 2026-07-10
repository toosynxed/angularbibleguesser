import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShareService, SharedGame } from '../share.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-shared-game',
  template: '<p>Loading game...</p>', // Placeholder template
})
export class SharedGameComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shareService: ShareService
  ) { }

  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.paramMap.get('code');
    if (!code) {
      this.router.navigate(['/']);
      return;
    }

    // Try decoding as Base64 first for backward compatibility
    try {
      const decodedString = atob(code);
      const gameData: SharedGame = JSON.parse(decodedString);

      if (gameData && gameData.verseIds && (gameData.settings || gameData.gameSettings)) {
        this.navigateToGame(gameData);
        return;
      }
    } catch (error) {
      // Not a valid Base64 code, so we assume it's a permanent ID.
      // Fall through to the next block.
    }

    // If not a Base64 code, try fetching from permanent collection
    const gameData = await this.shareService.findSharedGame(code);
    if (gameData) {
      this.navigateToGame(gameData);
    } else {
      // If no game data found, redirect home
      this.router.navigate(['/']); // Or to an error page
    }
  }

  private navigateToGame(gameData: SharedGame): void {
    this.router.navigate(['/game'], {
      state: { mode: 'shared', verseIds: gameData.verseIds, settings: gameData.settings || gameData.gameSettings }
    });
  }
}
