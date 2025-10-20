import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MultiplayerHomeComponent } from './multiplayer-home.component';
import { LobbyComponent } from './lobby.component';

// Define the routes specific to the multiplayer feature
const multiplayerRoutes: Routes = [
  { path: '', component: MultiplayerHomeComponent },
  { path: 'lobby/:id', component: LobbyComponent }
];

@NgModule({
  declarations: [
    MultiplayerHomeComponent,
    LobbyComponent
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
