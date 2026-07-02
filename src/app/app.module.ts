import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule, USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule, USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/compat/auth';
import { AngularFireDatabaseModule, USE_EMULATOR as USE_DATABASE_EMULATOR } from '@angular/fire/compat/database';
import { AngularFireFunctionsModule, REGION, USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/compat/functions';
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
import { ClassicInputComponent } from './classic-input/classic-input.component';
import { ExternalLeaderboardComponent } from './external-leaderboard/external-leaderboard.component';
import { ChatBotComponent } from './chat-bot/chat-bot.component';
import { QuestModeComponent } from './quest-mode/quest-mode.component';
import { RelativeTimePipe } from './relative-time.pipe';
import { ShopModeComponent } from './quest-mode/marketplace.component';
import { ScrollsService } from './scrolls.service';
import { academyComponent } from './quest-mode/academy/academy.component';
import { racetrackComponent } from './quest-mode/racetrack/racetrack.component';
import { MarketItem } from './quest-mode/marketplace.component';

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
    ClassicInputComponent,
    ExternalLeaderboardComponent,
    ChatBotComponent,
    QuestModeComponent,
    RelativeTimePipe,
    ShopModeComponent,
    academyComponent,
    racetrackComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFireFunctionsModule,
    AdminModule,
    SharedModule
  ],
  providers: [
    { provide: REGION, useValue: 'us-central1' },
    { provide: USE_AUTH_EMULATOR, useValue: (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? ['http://127.0.0.1:9100'] : undefined },
    { provide: USE_FIRESTORE_EMULATOR, useValue: (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? ['127.0.0.1', 8085] : undefined },
    { provide: USE_DATABASE_EMULATOR, useValue: (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? ['127.0.0.1', 9000] : undefined },
    { provide: USE_FUNCTIONS_EMULATOR, useValue: (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? ['127.0.0.1', 5001] : undefined }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
