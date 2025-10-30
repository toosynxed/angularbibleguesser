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

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game', component: GameComponent },
  { path: 'game/:code', component: SharedGameComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'custom-settings', component: CustomSettingsComponent },
  { path: 'create-game', component: CreateGameComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  {
    path: 'multiplayer',
    loadChildren: () => import('./multiplayer/multiplayer.module').then(m => m.MultiplayerModule)
  },
  {
    path: 'daily',
    loadChildren: () => import('./daily-challenge/daily-challenge.module').then(m => m.DailyChallengeModule)
  },
  { path: '**', redirectTo: '' } // Wildcard route for a 404-like redirect
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
