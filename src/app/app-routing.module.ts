import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { SideNavBarComponent } from './side-nav-bar/side-nav-bar.component';
import { CustomerComponent } from './customer/customer.component';
import { PurchaseInvoiceComponent } from './purchase-invoice/purchase-invoice.component';


const routes: Routes = [
  {path:'', redirectTo:'/home', pathMatch:'full'},
  {path:'customer', component:CustomerComponent, pathMatch:'full'},
  {path:'purchaseInvoice', component:PurchaseInvoiceComponent, pathMatch:'full'},
  {path:'**', component: PageNotFoundComponent}//herzaman en sonda olmalı
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents =[
  PageNotFoundComponent, 
  NavBarComponent,
  SideNavBarComponent,
  CustomerComponent,
  PurchaseInvoiceComponent
] //bunun sebebi her import edilen componenti app.module.ts e de yazmamız gerekli. Ancak burada impot ederek ve bunu app.module.ts te çağırarak dublicate importtan kurtulmuş oluruz. İşimizi sadece routing te bitirmiş oluruz
