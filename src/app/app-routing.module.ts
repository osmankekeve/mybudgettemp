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
import { DashoardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { AlertComponent } from './partials/alert/alert.component';
import { AccountVoucherComponent } from './account-voucher/account-voucher.component';
import { CashdeskVoucherComponent } from './cashdesk-voucher/cashdesk-voucher.component';
import { ReportsComponent } from './reports/reports.component';
import { TestModuleComponent } from './test/test-module.component';


const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: 'customer', component: CustomerComponent, pathMatch: 'full'},
  {path: 'purchaseInvoice', component: PurchaseInvoiceComponent, pathMatch: 'full'},
  {path: 'sales-invoice', component: SalesInvoiceComponent, pathMatch: 'full'},
  {path: 'cash-desk', component: CashDeskComponent, pathMatch: 'full'},
  {path: 'collection', component: CollectionComponent, pathMatch: 'full'},
  {path: 'payment', component: PaymentComponent, pathMatch: 'full'},
  {path: 'dashboard', component: DashoardComponent, pathMatch: 'full'},
  {path: 'account-voucher', component: AccountVoucherComponent, pathMatch: 'full'},
  {path: 'cashdesk-voucher', component: CashdeskVoucherComponent, pathMatch: 'full'},
  {path: 'reports', component: ReportsComponent, pathMatch: 'full'},
  {path: 'test', component: TestModuleComponent, pathMatch: 'full'},
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
  DashoardComponent,
  LoginComponent,
  AlertComponent,
  AccountVoucherComponent,
  CashdeskVoucherComponent,
  ReportsComponent,
  TestModuleComponent
];

// bunun sebebi her import edilen componenti app.module.ts e de yazmamız gerekli.
// Ancak burada impot ederek ve bunu app.module.
// ts te çağırarak dublicate importtan kurtulmuş oluruz. İşimizi sadece routing te bitirmiş oluruz
