import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { SideNavBarComponent } from './side-nav-bar/side-nav-bar.component';
import { CustomerComponent } from './customer/customer.component';
import { PurchaseInvoiceComponent } from './purchase-invoice/purchase-invoice.component';
import { SalesInvoiceComponent } from './sales-invoice/sales-invoice.component';
import { CashDeskComponent } from './cash-desk/cash-desk.component';
import { CollectionComponent } from './collection/collection.component';
import { PaymentComponent } from './payment/payment.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { AlertComponent } from './partials/alert/alert.component';
import { AccountVoucherComponent } from './account-voucher/account-voucher.component';
import { CashdeskVoucherComponent } from './cashdesk-voucher/cashdesk-voucher.component';
import { ReportsComponent } from './reports/reports.component';
import { TestModuleComponent } from './test/test-module.component';
import { NotificationComponent } from './notification/notification.component';
import { NoteComponent } from './note/note.component';
import { CRMComponent } from './crm/crm.component';
import { LocationComponent } from './location/location.component';
import { ProfileComponent } from './profile/profile.component';
import { SettingComponent } from './setting/setting.component';
import { UserComponent } from './user/user.component';
import { ReminderComponent } from './reminder/reminder.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { VisitComponent } from './visit/visit.component';
import { CustomerTargetComponent } from './customer-target/customer-target.component';


const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: 'customer', component: CustomerComponent, pathMatch: 'full'},
  {path: 'purchaseInvoice', component: PurchaseInvoiceComponent, pathMatch: 'full'},
  {path: 'purchaseInvoice/:id', component: PurchaseInvoiceComponent, pathMatch: 'full'},
  {path: 'sales-invoice', component: SalesInvoiceComponent, pathMatch: 'full'},
  {path: 'sales-invoice/:id', component: SalesInvoiceComponent, pathMatch: 'full'},
  {path: 'cash-desk', component: CashDeskComponent, pathMatch: 'full'},
  {path: 'collection', component: CollectionComponent, pathMatch: 'full'},
  {path: 'collection/:id', component: CollectionComponent, pathMatch: 'full'},
  {path: 'payment', component: PaymentComponent, pathMatch: 'full'},
  {path: 'payment/:id', component: PaymentComponent, pathMatch: 'full'},
  {path: 'dashboard', component: DashboardComponent, pathMatch: 'full'},
  {path: 'account-voucher', component: AccountVoucherComponent, pathMatch: 'full'},
  {path: 'account-voucher/:id', component: AccountVoucherComponent, pathMatch: 'full'},
  {path: 'cashdesk-voucher', component: CashdeskVoucherComponent, pathMatch: 'full'},
  {path: 'cashdesk-voucher/:id', component: CashdeskVoucherComponent, pathMatch: 'full'},
  {path: 'reports', component: ReportsComponent, pathMatch: 'full'},
  {path: 'test', component: TestModuleComponent, pathMatch: 'full'},
  {path: 'notification', component: NotificationComponent, pathMatch: 'full'},
  {path: 'note', component: NoteComponent, pathMatch: 'full'},
  {path: 'crm', component: CRMComponent, pathMatch: 'full'},
  {path: 'crm/:id', component: CRMComponent, pathMatch: 'full'},
  {path: 'location', component: LocationComponent, pathMatch: 'full'},
  {path: 'profile', component: ProfileComponent, pathMatch: 'full'},
  {path: 'setting', component: SettingComponent, pathMatch: 'full'},
  {path: 'user', component: UserComponent, pathMatch: 'full'},
  {path: 'reminder', component: ReminderComponent, pathMatch: 'full'},
  {path: 'reminder/:id', component: ReminderComponent, pathMatch: 'full'},
  {path: 'file-upload', component: FileUploadComponent, pathMatch: 'full'},
  {path: 'visit', component: VisitComponent, pathMatch: 'full'},
  {path: 'visit/:id', component: ReminderComponent, pathMatch: 'full'},
  {path: 'customer-target', component: CustomerTargetComponent, pathMatch: 'full'},
  {path: '**', component: PageNotFoundComponent}// herzaman en sonda olmalı
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents = [
  PageNotFoundComponent,
  NavBarComponent,
  SideNavBarComponent,
  CustomerComponent,
  PurchaseInvoiceComponent,
  SalesInvoiceComponent,
  CashDeskComponent,
  CollectionComponent,
  PaymentComponent,
  DashboardComponent,
  LoginComponent,
  AlertComponent,
  AccountVoucherComponent,
  CashdeskVoucherComponent,
  ReportsComponent,
  TestModuleComponent,
  NotificationComponent,
  NoteComponent,
  CRMComponent,
  LocationComponent,
  ProfileComponent,
  SettingComponent,
  UserComponent,
  ReminderComponent,
  FileUploadComponent,
  VisitComponent,
  CustomerTargetComponent
];

// bunun sebebi her import edilen componenti app.module.ts e de yazmamız gerekli.
// Ancak burada impot ederek ve bunu app.module.
// ts te çağırarak dublicate importtan kurtulmuş oluruz. İşimizi sadece routing te bitirmiş oluruz
