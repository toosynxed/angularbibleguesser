import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { environment } from '../environments/environment';

// Modules
import { AdminModule } from './admin/admin.module';
import { SharedModule } from './shared/shared.module';

// Components
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { ResultsComponent } from './results/results.component';
import { CustomSettingsComponent } from './custom-settings/custom-settings.component';
import { CreateGameComponent } from './create-game/create-game.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { SharedGameComponent } from './shared-game/shared-game.component';
import { ScrollPickerComponent } from './scroll-picker/scroll-picker.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { ProfileCustomizationComponent } from './profile-customization/profile-customization.component';
import { DecoratedNameComponent } from './decorated-name/decorated-name.component';

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
    SharedGameComponent,
    ScrollPickerComponent,
    LeaderboardComponent,
    ProfileCustomizationComponent,
    DecoratedNameComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AdminModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
