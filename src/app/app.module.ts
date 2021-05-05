import { ActionComponent } from './partials/action/action.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';

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
import { NoteFilterPipe } from './filters/note-filter.pipe';
import { CashDeskFilterPipe } from './filters/cashDesk-filter.pipe';
import { CashDeskVoucherFilterPipe } from './filters/cashDeskVoucher-filter.pipe';
import { CustomerAccountFilterPipe} from './filters/customer-account-filter.pipe';
import { DropzoneDirective } from './dropzone.directive';
import { UploaderComponent } from './uploader/uploader.component';
import { UploadTaskComponent } from './upload-task/upload-task.component';
import { GlobalUploadService } from './services/global-upload.service';
import { DropzoneComponent } from './dropzone/dropzone.component';
import { HttpClientModule } from '@angular/common/http';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ProductSelectComponent } from './partials/product-select/product-select.component';
import {ProductFilterPipe} from './filters/product-filter.pipe';
import {ProductSubFilterPipe} from './filters/product-sub-filter.pipe';
import {ListFilterPipe} from './filters/list-filter.pipe';
import {CustomerSelectComponent} from './partials/customer-select/customer-select.component';
import {ExcelImportComponent} from './partials/excel-import/excel-import.component';
import {ToastsComponent} from './partials/toasts/toasts.component';
import {ToastService} from './services/toast.service';
import {InfoModuleComponent} from './partials/info-module/info-module.component';
import {OrderSelectComponent} from './partials/order-select/order-select.component';
import {OrderFilterPipe} from './filters/order-filter.pipe';
import {CustomerCustomerDataFilterPipe} from './filters/customer-customer-data-filter.pipe';
import { SortPipe } from './filters/sort.pipe';
import { CampaignFilterPipe } from './filters/campaign-filter.pipe';
import { WaitingWorkFilterPipe } from './filters/waiting-work-filter.pipe';
import { PDFModuleComponent } from './partials/pdf-module/pdf-module.component';
import { AccountTransactionFilterPipe } from './filters/account-transaction-filter.pipe';
import { AreYouSureComponent } from './partials/are-you-sure/are-you-sure.component';
import { AreYouSureDirective } from './services/are-you-sure.directive';
import { MainFilterComponent } from './partials/main-filter/main-filter.component';
import { DefinitionFilterPipe } from './filters/definition-filter.pipe';
import { ReminderFilterPipe } from './filters/reminder-filter.pipe';
import { MailFilterPipe } from './filters/mail-filter.pipe';
import { RefrasherService } from './services/refrasher.service';
import { StockVoucherFilterPipe } from './filters/stock-voucher-filter.pipe';

@NgModule({
  declarations: [
        AppComponent, routingComponents,

    NavBarComponent,
    SideNavBarComponent,
    UploaderComponent,
    UploadTaskComponent,
    DropzoneComponent,
    ProductSelectComponent,
    CustomerSelectComponent,
    ExcelImportComponent,
    ToastsComponent,
    InfoModuleComponent,
    PDFModuleComponent,
    OrderSelectComponent,
    AreYouSureComponent,
    MainFilterComponent,
    ActionComponent,

    CustomerDataFilterPipe,
    CustomerFilterPipe,
    LocationDataFilterPipe,
    ProductFilterPipe,
    ProfileFilterPipe,
    NoteFilterPipe,
    CashDeskFilterPipe,
    CashDeskVoucherFilterPipe,
    CustomerAccountFilterPipe,
    OrderFilterPipe,
    ProductSubFilterPipe,
    ListFilterPipe,
    CustomerCustomerDataFilterPipe,
    SortPipe,
    CampaignFilterPipe,
    WaitingWorkFilterPipe,
    AccountTransactionFilterPipe,
    DefinitionFilterPipe,
    ReminderFilterPipe,
    MailFilterPipe,
    StockVoucherFilterPipe,

    DropzoneDirective,
    AreYouSureDirective
    ],
  imports: [
    NgbModule, BrowserModule, FormsModule, AppRoutingModule, HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase), AngularFireAuthModule,
    // LoadingBarRouterModule, LoadingBarHttpClientModule, LoadingBarModule,
    AngularFirestoreModule.enablePersistence(), AngularFireStorageModule, AngularFontAwesomeModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCrmHBthGzNdcTXs74tFHy_dyXN6t-9uqM'
    })
  ],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy},
    InformationService, CookieService, LogService, AuthenticationService, ExcelService, GlobalUploadService, HttpClientModule,
    ToastService, RefrasherService
  ],
  bootstrap: [AppComponent],
  entryComponents: [ ProductSelectComponent, CustomerSelectComponent, ExcelImportComponent, InfoModuleComponent, OrderSelectComponent,
    PDFModuleComponent, AreYouSureComponent, MainFilterComponent, ActionComponent ]
})
export class AppModule { }
