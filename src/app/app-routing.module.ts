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
import { AccountTransactionComponent } from './account-transaction/account-transaction.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { MailSenderComponent } from './mail-sender/mail-sender.component';
import { ToDoListComponent } from './to-do-list/to-do-list.component';
import {CustomerAccountComponent} from './customer-account/customer-account.component';
import {UploaderComponent} from './uploader/uploader.component';
import {GlobalUploadComponent} from './partials/global-upload/global-upload.component';
import {DropzoneComponent} from './dropzone/dropzone.component';
import {AccountMatchComponent} from './account-match/account-match.component';
import {BuySaleComponent} from './buy-sell/buy-sale.component';
import {BuySellCurrencyComponent} from './buy-sell-currency/buy-sell-currency.component';
import {ProductComponent} from './product/product.component';
import {ProductUnitComponent} from './product-unit/product-unit.component';
import {PriceListComponent} from './price-list/price-list.component';
import {DiscountListComponent} from './discount-list/discount-list.component';
import {DefinitionComponent} from './definition/definition.component';
import {SalesOrderComponent} from './sales-order/sales-order.component';
import {SalesOfferComponent} from './sales-offer/sales-offer.component';
import {PurchaseOfferComponent} from './purchase-offer/purchase-offer.component';
import {PurchaseOrderComponent} from './purchase-order/purchase-order.component';


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
  {path: 'account-transaction', component: AccountTransactionComponent, pathMatch: 'full'},
  {path: 'contact-us', component: ContactUsComponent, pathMatch: 'full'},
  {path: 'mail-sender', component: MailSenderComponent, pathMatch: 'full'},
  {path: 'to-do-list', component: ToDoListComponent, pathMatch: 'full'},
  {path: 'customer-account', component: CustomerAccountComponent, pathMatch: 'full'},
  {path: 'file-uploader', component: UploaderComponent, pathMatch: 'full'},
  {path: 'account-match', component: AccountMatchComponent, pathMatch: 'full'},
  {path: 'buy-sell-currency', component: BuySellCurrencyComponent, pathMatch: 'full'},
  {path: 'buy-sale', component: BuySaleComponent, pathMatch: 'full'},
  {path: 'product', component: ProductComponent, pathMatch: 'full'},
  {path: 'product-unit', component: ProductUnitComponent, pathMatch: 'full'},
  {path: 'price-list', component: PriceListComponent, pathMatch: 'full'},
  {path: 'discount-list', component: DiscountListComponent, pathMatch: 'full'},
  {path: 'storage', component: DefinitionComponent, pathMatch: 'full'},
  {path: 'term', component: DefinitionComponent, pathMatch: 'full'},
  {path: 'payment-type', component: DefinitionComponent, pathMatch: 'full'},
  {path: 'sales-offer', component: SalesOfferComponent, pathMatch: 'full'},
  {path: 'sales-order', component: SalesOrderComponent, pathMatch: 'full'},
  {path: 'purchase-offer', component: PurchaseOfferComponent, pathMatch: 'full'},
  {path: 'purchase-order', component: PurchaseOrderComponent, pathMatch: 'full'},
  {path: '**', component: PageNotFoundComponent}// herzaman en sonda olmalı
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents = [
  PageNotFoundComponent, NavBarComponent, SideNavBarComponent, CustomerComponent, PurchaseInvoiceComponent, BuySaleComponent,
  SalesInvoiceComponent, CashDeskComponent, CollectionComponent, PaymentComponent, DashboardComponent, AccountMatchComponent,
  LoginComponent, AlertComponent, AccountVoucherComponent, CashdeskVoucherComponent, ReportsComponent, DropzoneComponent,
  TestModuleComponent, NotificationComponent, NoteComponent, CRMComponent, LocationComponent, ProfileComponent, BuySellCurrencyComponent,
  SettingComponent, UserComponent, ReminderComponent, FileUploadComponent, VisitComponent, CustomerTargetComponent, ProductComponent,
  AccountTransactionComponent, ContactUsComponent, MailSenderComponent, ToDoListComponent, CustomerAccountComponent, GlobalUploadComponent,
  ProductUnitComponent, PriceListComponent, DiscountListComponent, DefinitionComponent, SalesOrderComponent, SalesOfferComponent,
  PurchaseOfferComponent, PurchaseOrderComponent
];

// bunun sebebi her import edilen componenti app.module.ts e de yazmamız gerekli.
// Ancak burada impot ederek ve bunu app.module.
// ts te çağırarak dublicate importtan kurtulmuş oluruz. İşimizi sadece routing te bitirmiş oluruz
