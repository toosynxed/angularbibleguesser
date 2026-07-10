import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalLeaderboardComponent } from './external-leaderboard.component';

describe('ExternalLeaderboardComponent', () => {
  let component: ExternalLeaderboardComponent;
  let fixture: ComponentFixture<ExternalLeaderboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExternalLeaderboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExternalLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
