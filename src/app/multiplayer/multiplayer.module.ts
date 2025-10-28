import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MultiplayerHomeComponent } from './multiplayer-home.component';
import { LobbyComponent } from './lobby.component';
import { LobbyLoadingComponent } from './lobby-loading.component';
import { MultiplayerTutorialComponent } from '../multiplayer-tutorial/multiplayer-tutorial.component';
import { LeaderboardComponent } from './leaderboard.component';

// Define the routes specific to the multiplayer feature
const multiplayerRoutes: Routes = [
  { path: '', component: MultiplayerHomeComponent },
  { path: 'loading', component: LobbyLoadingComponent },
  { path: 'lobby/:id', component: LobbyComponent },
  { path: 'leaderboard/:id', component: LeaderboardComponent }
];

@NgModule({
  declarations: [
    MultiplayerHomeComponent,
    LobbyComponent,
    LobbyLoadingComponent,
    LeaderboardComponent,
    MultiplayerTutorialComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Use forChild() for routes in feature modules
    RouterModule.forChild(multiplayerRoutes)
  ]
})
export class MultiplayerModule { }
