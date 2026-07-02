import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DecoratedNameComponent } from '../decorated-name/decorated-name.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { PageShellComponent } from './page-shell/page-shell.component';
import { ModalComponent } from './modal/modal.component';
import { FloatingActionButtonComponent } from './floating-action-button/floating-action-button.component';
import { StatsGridComponent } from './stats-grid/stats-grid.component';
import { QuestHeaderComponent } from './quest-header/quest-header.component';
import { ScrollBalanceComponent } from './scroll-balance/scroll-balance.component';
import { LobbyMiniGameComponent } from '../features/lobby-mini-game/lobby-mini-game.component';

@NgModule({
  declarations: [
    DecoratedNameComponent,
    PageHeaderComponent,
    PageShellComponent,
    ModalComponent,
    FloatingActionButtonComponent,
    StatsGridComponent,
    QuestHeaderComponent,
    ScrollBalanceComponent,
    LobbyMiniGameComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DecoratedNameComponent,
    PageHeaderComponent,
    PageShellComponent,
    ModalComponent,
    FloatingActionButtonComponent,
    StatsGridComponent,
    QuestHeaderComponent,
    ScrollBalanceComponent,
    LobbyMiniGameComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }
