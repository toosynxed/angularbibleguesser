import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface TownTask {
  id: string;
  title: string;
  description: string;
  rewardScrolls: number;
  route: string;
  status: 'available' | 'locked' | 'complete';
}

@Component({
  selector: 'app-new-game-mode',
  templateUrl: './new-game-mode.component.html',
  styleUrls: ['./new-game-mode.component.css']
})
export class NewGameModeComponent {
  readonly tasks: TownTask[] = [
    {
      id: 'daily-practice',
      title: 'Daily Practice',
      description: 'Complete a daily challenge to earn scrolls for the town.',
      rewardScrolls: 25,
      route: '/daily',
      status: 'available'
    },
    {
      id: 'custom-journey',
      title: 'Custom Journey',
      description: 'Create a custom verse set and use it as a town task.',
      rewardScrolls: 40,
      route: '/custom-settings',
      status: 'available'
    },
    {
      id: 'multiplayer-fellowship',
      title: 'Multiplayer Fellowship',
      description: 'Join a lobby and compete with others to unlock community upgrades.',
      rewardScrolls: 60,
      route: '/multiplayer',
      status: 'available'
    }
  ];

  constructor(private router: Router) {}

  startTask(task: TownTask): void {
    if (task.status === 'locked') {
      return;
    }

    this.router.navigate([task.route]);
  }
}
