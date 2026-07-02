import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { LoginComponent } from './login/login.component';
import { ResultsComponent } from './results/results.component';
import { CustomSettingsComponent } from './custom-settings/custom-settings.component';
import { CreateGameComponent } from './create-game/create-game.component';
import { ProfileComponent } from './profile/profile.component';
import { SharedGameComponent } from './shared-game/shared-game.component';
import { ExternalLeaderboardComponent } from './external-leaderboard/external-leaderboard.component';
import { QuestModeComponent } from './quest-mode/quest-mode.component';
import { ShopModeComponent } from './quest-mode/marketplace.component';
import { academyComponent} from './quest-mode/academy/academy.component';
import { racetrackComponent } from './quest-mode/racetrack/racetrack.component'
import { NewGameModeComponent } from './features/new-game-mode/new-game-mode.component';
import { ExperimentalVideoModeComponent } from './features/experimental-video-mode/experimental-video-mode.component';
import { ImprovedSettingsComponent } from './features/improved-settings/improved-settings.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game', component: GameComponent },
  { path: 'game/:code', component: SharedGameComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'custom-settings', component: CustomSettingsComponent },
  { path: 'create-game', component: CreateGameComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'leaderboard/:id', component: ExternalLeaderboardComponent },
  { path: 'marketplace', component: ShopModeComponent},
  { path: 'academy', component: academyComponent},
  { path: 'racetrack', component: racetrackComponent},
  { path: 'town-quest', component: NewGameModeComponent },
  { path: 'video-mode', component: ExperimentalVideoModeComponent },
  { path: 'settings', component: ImprovedSettingsComponent },
  {
    path: 'multiplayer',
    loadChildren: () => import('./multiplayer/multiplayer.module').then(m => m.MultiplayerModule)
  },
  {
    path: 'daily',
    loadChildren: () => import('./daily-challenge/daily-challenge.module').then(m => m.DailyChallengeModule)
  },
  {
    path: 'quest',
    component: QuestModeComponent
  },
  { path: '**', redirectTo: '' } // Wildcard route for a 404-like redirect
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
