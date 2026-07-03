import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { combineLatest, from, Observable, of, Subject } from 'rxjs';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { ScrollsService, ScrollsUpdate } from '../scrolls.service';
import { switchMap, take, tap } from 'rxjs/operators';
import { StatsService } from '../stats.service';
import { INITIAL_BITMARKET_MASK, isItemPurchased, removeItemFromMarket, selectDailyMarketItemIds } from '../marketplace-bitmask';
import { MarketplaceDailyService } from '../marketplace-daily.service';

export interface MarketItem {
  id: number;
  name: string;
  category: 'Name Effect' | 'Nameplate' | 'Icon';
  price: number;
  description: string;
  background: string; // For CSS class or image URL
}

// View-model used by the template: same daily item, plus whether this user has
// already purchased it. Purchased items stay in their slot (greyed out) rather
// than being swapped out - see selectDailyMarketItemIds() in marketplace-bitmask.ts.
export interface DisplayMarketItem extends MarketItem {
  isPurchased: boolean;
}

const MARKETPLACE_ITEMS: Map<number, MarketItem> = new Map([
  // Name Effects
  [1, { id: 1, name: 'Animated Rainbow', category: 'Name Effect', price: 500, description: 'A vibrant, animated rainbow effect for your name.', background: 'rainbow-bg' }],
  [2, { id: 2, name: 'Glow', category: 'Name Effect', price: 300, description: 'Make your name glow.', background: 'glow-bg' }],
  [4, { id: 4, name: 'Bold', category: 'Name Effect', price: 100, description: 'Make your name stand out.', background: 'bold-bg' }],
  [8, { id: 8, name: 'Underline', category: 'Name Effect', price: 100, description: 'An elegant underline for your name.', background: 'underline-bg' }],
  [16, { id: 16, name: 'Italic', category: 'Name Effect', price: 100, description: 'Give your name some slant.', background: 'italic-bg' }],
  // Nameplates
  [32, { id: 32, name: 'Gold', category: 'Nameplate', price: 1000, description: 'A solid gold nameplate.', background: 'gold-bg' }],
  [64, { id: 64, name: 'Animated Fire', category: 'Nameplate', price: 1200, description: 'A fiery, animated nameplate.', background: 'fire-bg' }],
  [128, { id: 128, name: 'Ice', category: 'Nameplate', price: 1200, description: 'A cool, icy nameplate.', background: 'ice-bg' }],
  // Icons
  [256, { id: 256, name: 'Crown', category: 'Icon', price: 2000, description: 'A royal crown icon.', background: 'icon-crown' }],
  [512, { id: 512, name: 'Fire', category: 'Icon', price: 1500, description: 'A blazing fire icon.', background: 'icon-fire' }],
  [1024, { id: 1024, name: 'Star', category: 'Icon', price: 1500, description: 'A shining star icon.', background: 'icon-star' }],
  [2048, { id: 2048, name: 'Cross', category: 'Icon', price: 1000, description: 'A holy cross icon.', background: 'icon-cross' }],
  [4096, { id: 4096, name: 'Dove', category: 'Icon', price: 1000, description: 'A peaceful dove icon.', background: 'icon-dove' }],
  [8192, { id: 8192, name: 'Crossed Swords', category: 'Icon', price: 1800, description: 'A symbol of battle.', background: 'icon-swords' }],
  [16384, { id: 16384, name: 'Shield', category: 'Icon', price: 1800, description: 'A symbol of protection.', background: 'icon-shield' }],
  [32768, { id: 32768, name: 'Trophy', category: 'Icon', price: 2500, description: 'A symbol of victory.', background: 'icon-trophy' }],
  [65536, { id: 65536, name: 'Medal', category: 'Icon', price: 2200, description: 'A symbol of achievement.', background: 'icon-medal' }],
]);

@Component({
  selector: 'app-shop-page',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.css']
})
export class ShopModeComponent implements OnInit {
  user$!: Observable<firebase.User | null>;
  showCustomization = false;
  userScrolls$!: Observable<number | undefined>;
  userBitMarket$!: Observable<number | undefined>;
  generatedMarketItems: DisplayMarketItem[] = []; // Tracks today's deterministic 5 items for this user
  private calculateItemsTrigger = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private scrollsService: ScrollsService,
    private StatsService: StatsService,
    private cdr: ChangeDetectorRef,
    private marketplaceDailyService: MarketplaceDailyService
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.userScrolls$ = this.user$.pipe(
      switchMap((user) => user?.uid ? this.scrollsService.getUserScrolls(user.uid) : of(undefined))
    );
    this.userBitMarket$ = this.user$.pipe(
      switchMap((user) => user?.uid ? this.StatsService.getUserField$(user.uid, 'BitMarket') : of(undefined))
    );
    this.setupMarketItemCalculation();
    // Load today's deterministic items immediately, rather than waiting for a manual reload click.
    this.reloadDailyItems();
  }

  confirmGoHome(): void {
    this.router.navigate(['/']);
  }
  
  backToMap(): void {
    this.router.navigate(['/quest']);
    console.log('Navigated to: /quest');
  }

  // Re-reads today's shared market seed and recomputes this user's deterministic
  // daily items from it. This does NOT reroll/randomize - it only picks up a new
  // seed if the admin has reset the shop, or a new day has started.
  reloadDailyItems(): void {
    this.calculateItemsTrigger.next();
  }

  async purchaseItem(itemToPurchase: DisplayMarketItem): Promise<void> {
    if (itemToPurchase.isPurchased) {
      // Defensive guard - the template already disables the button for owned items.
      return;
    }

    const user = await this.user$.pipe(take(1)).toPromise();
    if (!user?.uid) {
      alert('You must be logged in to purchase items.');
      return;
    }

    const currentScrolls = await this.userScrolls$.pipe(take(1)).toPromise();
    if (currentScrolls === undefined || currentScrolls < itemToPurchase.price) {
      alert("You don't have enough scrolls to purchase this item.");
      return;
    }

    try {
      const scrollUpdate: ScrollsUpdate = {
        value: itemToPurchase.price,
        type: 'spend'
      };
      await this.scrollsService.updateUserScrolls(user.uid, scrollUpdate);

      const currentBitMarket = await this.userBitMarket$.pipe(take(1)).toPromise();
      const newBitMarket = removeItemFromMarket(currentBitMarket, itemToPurchase.id);
      await this.StatsService.updateUserField(user.uid, 'BitMarket', newBitMarket);

      alert(`Successfully purchased ${itemToPurchase.name}!`);
      this.reloadDailyItems();
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('There was an error with your purchase. Please try again.');
    }
  }

  // Deterministic daily selection: given the same shared daily seed, the same user,
  // and the same day, this always produces the same 5 item SLOTS. Purchasing an
  // item does not remove it from its slot or pull in a replacement - it just marks
  // that slot as owned/disabled (see isItemPurchased below). The only things that
  // can change which 5 items appear are the calendar date rolling over, or an admin
  // regenerating today's seed via the Reset Shop button (see MarketplaceDailyService).
  private setupMarketItemCalculation(): void {
    this.calculateItemsTrigger.pipe(
      switchMap(() =>
        combineLatest([
          this.user$.pipe(take(1)),
          this.userBitMarket$.pipe(take(1)),
          from(this.marketplaceDailyService.getTodaysMarketSeed())
        ])
      ),
      tap(([user, bitMarketValue, dailySeed]) => {
        try {
          if (!user?.uid) {
            this.generatedMarketItems = [];
            this.cdr.detectChanges();
            return;
          }

          const bitmask = bitMarketValue ?? INITIAL_BITMARKET_MASK;
          const selectedBits = selectDailyMarketItemIds(user.uid, dailySeed.date, dailySeed.seed, 5);

          this.generatedMarketItems = selectedBits
            .map(id => MARKETPLACE_ITEMS.get(id))
            .filter((item): item is MarketItem => !!item)
            .map(item => ({ ...item, isPurchased: isItemPurchased(bitmask, item.id) }));

          this.cdr.detectChanges(); // Update view
        } catch (error) {
          console.error('Failed to calculate daily market items:', error);
          this.generatedMarketItems = []; // Clear on error
        }
      })
    ).subscribe();
  }
}
