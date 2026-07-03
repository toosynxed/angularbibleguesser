import { Component } from '@angular/core';
import { MarketplaceDailyService } from '../../marketplace-daily.service';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div class="admin-panel-container">
      <div class="admin-buttons">
        <button (click)="activeTab = 'lobbies'">Manage Lobbies</button>
        <button (click)="activeTab = 'users'">Manage Users</button>
        <button (click)="activeTab = 'stats'">Search Stats</button>
      </div>

      <div class="admin-actions">
        <button type="button" (click)="resetShop()">Reset Shop</button>
      </div>

      <app-manage-lobbies *ngIf="activeTab === 'lobbies'"></app-manage-lobbies>
      <app-manage-users *ngIf="activeTab === 'users'"></app-manage-users>
      <app-search-stats *ngIf="activeTab === 'stats'"></app-search-stats>
    </div>
  `,
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent {
  activeTab: 'lobbies' | 'users' | 'stats' = 'lobbies';

  constructor(private marketplaceDailyService: MarketplaceDailyService) { }

  async resetShop(): Promise<void> {
    if (!confirm('Are you sure you want to reset today\'s marketplace shop? This will reshuffle daily items for all users.')) {
      return;
    }

    try {
      await this.marketplaceDailyService.generateNewMarketSeed();
      alert('Marketplace shop has been reset for today.');
    } catch (error) {
      console.error('Failed to reset marketplace shop:', error);
      alert('Failed to reset the marketplace shop. Please try again.');
    }
  }
}
