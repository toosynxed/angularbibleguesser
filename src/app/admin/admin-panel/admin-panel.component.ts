import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div class="admin-panel-container">
      <div class="admin-buttons">
        <button (click)="activeTab = 'lobbies'">Manage Lobbies</button>
        <button (click)="activeTab = 'users'">Manage Users</button>
        <button (click)="activeTab = 'stats'">Search Stats</button>
      </div>

      <app-manage-lobbies *ngIf="activeTab === 'lobbies'"></app-manage-lobbies>
      <!-- Placeholder for Manage Users -->
      <!-- Placeholder for Search Stats -->
    </div>
  `,
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent {
  activeTab: 'lobbies' | 'users' | 'stats' = 'lobbies';
}
