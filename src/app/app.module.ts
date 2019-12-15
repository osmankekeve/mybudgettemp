import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';

import { AppRoutingModule, routingComponents } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { SideNavBarComponent } from './side-nav-bar/side-nav-bar.component';
import { environment } from 'src/environments/environment';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { InformationService } from './services/information.service';
import { CustomerDataFilterPipe } from './filters/customer-data-filter.pipe';
import { CustomerFilterPipe } from './filters/customer-filter.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgmCoreModule } from '@agm/core';
import { LocationDataFilterPipe } from './filters/location-data-filter.pipe';
import { ProfileFilterPipe } from './filters/profile-filter.pipe';
import { ExcelService } from './services/excel-service';
import { LogService } from './services/log.service';
import { AuthenticationService } from './services/authentication.service';
import { CookieService } from 'ngx-cookie-service';


@NgModule({
  declarations: [
    AppComponent, routingComponents,
    NavBarComponent, SideNavBarComponent, CustomerDataFilterPipe, CustomerFilterPipe, LocationDataFilterPipe,
    ProfileFilterPipe
  ],
  imports: [
    NgbModule, BrowserModule, FormsModule, AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase), AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence(), AngularFireStorageModule, AngularFontAwesomeModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCrmHBthGzNdcTXs74tFHy_dyXN6t-9uqM'
    })
  ],
  providers: [
    InformationService, CookieService, LogService, AuthenticationService, ExcelService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
