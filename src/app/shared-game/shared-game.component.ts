import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameData, ShareService } from '../share.service';

@Component({
  selector: 'app-shared-game',
  templateUrl: './shared-game.component.html',
  styleUrls: ['./shared-game.component.css']
})
export class SharedGameComponent implements OnInit {
  gameData: GameData | null = null;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shareService: ShareService
  ) { }

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      this.gameData = this.shareService.decodeGameData(code);
      if (!this.gameData) {
        this.error = "This game link is invalid or has expired. Please check the link and try again.";
      }
    } else {
      this.error = "No game link provided.";
      this.router.navigate(['/']);
    }
  }

  startGame(): void {
    if (this.gameData) {
      this.router.navigate(['/game'], { state: { ...this.gameData } });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
