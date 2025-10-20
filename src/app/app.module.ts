import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../environments/environment'; // We'll use this for Firebase config
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { HttpClientModule } from '@angular/common/http'; // Corrected: No change needed here, but keeping for context.
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { ResultsComponent } from './results/results.component';
import { RouterModule } from '@angular/router'; // Corrected: No change needed here, but keeping for context.
import { CreateGameComponent } from './create-game/create-game.component';
import { CustomSettingsComponent } from './custom-settings/custom-settings.component';
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GameComponent,
    ResultsComponent,
    CustomSettingsComponent,
    CreateGameComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule, // Corrected: No change needed here, but keeping for context.
    ReactiveFormsModule, // Corrected: No change needed here, but keeping for context.
    FormsModule, // Corrected: No change needed here, but keeping for context.
    AngularFireModule.initializeApp(environment.firebase), // Initialize Firebase
    AngularFirestoreModule, // For Firestore database
    AngularFireAuthModule // For authentication
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
