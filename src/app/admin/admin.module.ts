import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { ManageLobbiesComponent } from './manage-lobbies/manage-lobbies.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';

@NgModule({
  declarations: [
    AdminPanelComponent,
    ManageLobbiesComponent,
    ManageUsersComponent
  ],
  imports: [
    RouterModule,
    SharedModule
  ],
  exports: [
    AdminPanelComponent // Export this so other modules can use it
  ]
})
export class AdminModule { }
