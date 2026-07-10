import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface OfflineCacheEntry<T> {
  value: T;
  savedAt: string;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineCapabilitiesService {
  private readonly onlineSubject = new BehaviorSubject<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  readonly online$ = this.onlineSubject.asObservable();

  constructor(private zone: NgZone) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateOnlineState(true));
      window.addEventListener('offline', () => this.updateOnlineState(false));
    }
  }

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  saveToCache<T>(key: string, value: T, ttlMinutes?: number): void {
    const expiresAt = ttlMinutes ? new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString() : undefined;
    const entry: OfflineCacheEntry<T> = {
      value,
      savedAt: new Date().toISOString(),
      expiresAt
    };

    localStorage.setItem(this.cacheKey(key), JSON.stringify(entry));
  }

  loadFromCache<T>(key: string): T | null {
    const rawValue = localStorage.getItem(this.cacheKey(key));

    if (!rawValue) {
      return null;
    }

    try {
      const entry = JSON.parse(rawValue) as OfflineCacheEntry<T>;
      if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(this.cacheKey(key));
        return null;
      }
      return entry.value;
    } catch {
      localStorage.removeItem(this.cacheKey(key));
      return null;
    }
  }

  removeFromCache(key: string): void {
    localStorage.removeItem(this.cacheKey(key));
  }

  private updateOnlineState(isOnline: boolean): void {
    this.zone.run(() => this.onlineSubject.next(isOnline));
  }

  private cacheKey(key: string): string {
    return `bbg_offline_${key}`;
  }
}
