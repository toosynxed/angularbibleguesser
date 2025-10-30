import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { DailyChallengeComponent } from './daily-challenge.component';

const routes: Routes = [
  { path: '', component: DailyChallengeComponent }
];

@NgModule({
  declarations: [
    DailyChallengeComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class DailyChallengeModule { }
