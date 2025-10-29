import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShareService, SharedGame } from '../share.service';

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

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    if (!code) {
      this.router.navigate(['/']);
      return;
    }

    try {
      const decodedString = atob(code);
      const gameData: SharedGame = JSON.parse(decodedString);

      this.router.navigate(['/game'], {
        state: {
          mode: 'shared',
          verseIds: gameData.verseIds,
          settings: gameData.gameSettings
        }
      });
    } catch (error) {
      this.router.navigate(['/']);
    }
  }
}
