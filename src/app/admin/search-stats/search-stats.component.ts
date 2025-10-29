import { Component } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { StatsService } from '../../stats.service';
import { UserProfileWithStats } from '../../stats.model';

@Component({
  selector: 'app-search-stats',
  templateUrl: './search-stats.component.html',
  styleUrls: ['./search-stats.component.css']
})
export class SearchStatsComponent {
  private searchTerms = new Subject<string>();
  users$: Observable<UserProfileWithStats[]>;
  isLoading = false;
  hasSearched = false;

  constructor(private statsService: StatsService) {
    this.users$ = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.isLoading = true;
        this.hasSearched = true;
      }),
      switchMap((term: string) => this.statsService.searchUsersAndGetStats(term)),
      tap(() => this.isLoading = false)
    );
  }

  search(term: string): void {
    this.searchTerms.next(term);
  }

  getAverage(total: number, count: number): string {
    if (!count || count === 0) {
      return '0.00';
    }
    return (total / count).toFixed(2);
  }
}
