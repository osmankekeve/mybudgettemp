import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { AngularFireAuthModule } from '@angular/fire/auth';

import { AppRoutingModule, routingComponents } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { SideNavBarComponent } from './side-nav-bar/side-nav-bar.component';
import { environment } from 'src/environments/environment';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { InformationService } from './services/information.service';


@NgModule({
  declarations: [
    AppComponent,
    routingComponents,
    NavBarComponent,
    SideNavBarComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence(),
    AngularFontAwesomeModule
  ],
  providers: [
    InformationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
