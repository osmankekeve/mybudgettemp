import { BrowserModule } from '@angular/platform-browser';
import { AgmCoreModule } from '@agm/core';
import { LocationStrategy, HashLocationStrategy } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AngularFireStorageModule } from "@angular/fire/storage";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { environment } from "src/environments/environment";
import { routingComponents, AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { DropzoneDirective } from "./dropzone.directive";
import { DropzoneComponent } from "./dropzone/dropzone.component";
import { AccountTransactionFilterPipe } from "./filters/account-transaction-filter.pipe";
import { CampaignFilterPipe } from "./filters/campaign-filter.pipe";
import { CashDeskFilterPipe } from "./filters/cashDesk-filter.pipe";
import { CashDeskVoucherFilterPipe } from "./filters/cashDeskVoucher-filter.pipe";
import { CollectionFilterPipe } from "./filters/collection-filter.pipe";
import { CustomerAccountFilterPipe } from "./filters/customer-account-filter.pipe";
import { CustomerCustomerDataFilterPipe } from "./filters/customer-customer-data-filter.pipe";
import { CustomerDataFilterPipe } from "./filters/customer-data-filter.pipe";
import { CustomerFilterPipe } from "./filters/customer-filter.pipe";
import { DefinitionFilterPipe } from "./filters/definition-filter.pipe";
import { ListFilterPipe } from "./filters/list-filter.pipe";
import { LocationDataFilterPipe } from "./filters/location-data-filter.pipe";
import { MailFilterPipe } from "./filters/mail-filter.pipe";
import { NoteFilterPipe } from "./filters/note-filter.pipe";
import { OrderFilterPipe } from "./filters/order-filter.pipe";
import { ProductFilterPipe } from "./filters/product-filter.pipe";
import { ProductSubFilterPipe } from "./filters/product-sub-filter.pipe";
import { ProfileFilterPipe } from "./filters/profile-filter.pipe";
import { ReminderFilterPipe } from "./filters/reminder-filter.pipe";
import { SortPipe } from "./filters/sort.pipe";
import { StockVoucherFilterPipe } from "./filters/stock-voucher-filter.pipe";
import { WaitingWorkFilterPipe } from "./filters/waiting-work-filter.pipe";
import { NavBarComponent } from "./nav-bar/nav-bar.component";
import { ActionComponent } from "./partials/action/action.component";
import { AreYouSureComponent } from "./partials/are-you-sure/are-you-sure.component";
import { CustomerSelectComponent } from "./partials/customer-select/customer-select.component";
import { ExcelImportComponent } from "./partials/excel-import/excel-import.component";
import { InfoModuleComponent } from "./partials/info-module/info-module.component";
import { MainFilterComponent } from "./partials/main-filter/main-filter.component";
import { OrderSelectComponent } from "./partials/order-select/order-select.component";
import { PDFModuleComponent } from "./partials/pdf-module/pdf-module.component";
import { ProductSelectComponent } from "./partials/product-select/product-select.component";
import { ToastsComponent } from "./partials/toasts/toasts.component";
import { AreYouSureDirective } from "./services/are-you-sure.directive";
import { AuthenticationService } from "./services/authentication.service";
import { ExcelService } from "./services/excel-service";
import { GlobalUploadService } from "./services/global-upload.service";
import { InformationService } from "./services/information.service";
import { LogService } from "./services/log.service";
import { RefrasherService } from "./services/refrasher.service";
import { ToastService } from "./services/toast.service";
import { SideNavBarComponent } from "./side-nav-bar/side-nav-bar.component";
import { UploadTaskComponent } from "./upload-task/upload-task.component";
import { UploaderComponent } from "./uploader/uploader.component";
import { RecordedTransactionComponent } from './partials/recorded-transaction/recorded-transaction.component';


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
    RecordedTransactionComponent,

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
    CollectionFilterPipe,

    DropzoneDirective,
    AreYouSureDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgbModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase), AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence(), AngularFireStorageModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCrmHBthGzNdcTXs74tFHy_dyXN6t-9uqM'
    })
  ],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy },
    InformationService, LogService, AuthenticationService, ExcelService, GlobalUploadService, HttpClientModule,
    ToastService, RefrasherService
  ],
  bootstrap: [AppComponent],
  entryComponents: [ProductSelectComponent, CustomerSelectComponent, ExcelImportComponent, InfoModuleComponent, OrderSelectComponent,
    PDFModuleComponent, AreYouSureComponent, MainFilterComponent, ActionComponent, RecordedTransactionComponent]
})
export class AppModule { }
