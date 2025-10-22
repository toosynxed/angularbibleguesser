import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { ResultsComponent } from './results/results.component';
import { CustomSettingsComponent } from './custom-settings/custom-settings.component';
import { CreateGameComponent } from './create-game/create-game.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { MultiplayerLeaderboardComponent } from './multiplayer-leaderboard/multiplayer-leaderboard.component';
import { ResultCardComponent } from './result-card/result-card.component';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GameComponent,
    ResultsComponent,
    CustomSettingsComponent,
    CreateGameComponent,
    LoginComponent,
    ProfileComponent,
    MultiplayerLeaderboardComponent,
    ResultCardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
