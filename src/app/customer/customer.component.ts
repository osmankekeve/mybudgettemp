import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../../app/services/customer.service';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';
import { SalesInvoiceService } from '../services/sales-invoice.service';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { CollectionModel } from '../models/collection-model';
import { CollectionService } from '../services/collection.service';
import { PaymentService } from '../services/payment.service';
import { PaymentModel } from '../models/payment-model';
import { Pipe, PipeTransform } from '@angular/core';
import { InformationService } from '../services/information.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit  {
  mainList$: Observable<CustomerModel[]>;
  selectedCustomer: CustomerModel;
  newSalesInvoice: SalesInvoiceModel;

  purchaseInvoiceList$: Observable<PurchaseInvoiceModel[]>;
  purchaseInvoiceAmount: any;
  siList$: Observable<SalesInvoiceModel[]>;
  siAmount: any;
  colList$: Observable<CollectionModel[]>;
  colAmount: any;
  payList$: Observable<PaymentModel[]>;
  payAmount: any;
  openedPanel: string;
  searchText: any;

  constructor(public db: AngularFirestore, public customerService: CustomerService, public piService: PurchaseInvoiceService,
              public siService: SalesInvoiceService, public colService: CollectionService, public infoService: InformationService,
              public payService: PaymentService) {
  }

  ngOnInit() {
    this.openedPanel = 'dashboard';
    this.populateCustomerList();
    this.selectedCustomer = undefined;
  }

  populateCustomerList(): void {
    this.openedPanel = 'dashboard';
    this.mainList$ = undefined;
    this.mainList$ = this.customerService.getAllItems();

  }

  showSelectedCustomer(customer: CustomerModel): void {
    this.selectedCustomer = customer;

    this.purchaseInvoiceList$ = undefined;
    this.purchaseInvoiceList$ = this.piService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.purchaseInvoiceAmount = 0;
    this.purchaseInvoiceList$.subscribe(list => {
      list.forEach(item => {
        this.purchaseInvoiceAmount += Math.round(item.totalPriceWithTax);
      });
    });

    this.siList$ = undefined;
    this.siList$ = this.siService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.siAmount = 0;
    this.siList$.subscribe(list => {
      list.forEach(item => {
        this.siAmount += item.totalPriceWithTax;
      });
    });

    this.colList$ = undefined;
    this.colList$ = this.colService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.colAmount = 0;
    this.colList$.subscribe(list => {
      list.forEach(item => {
        this.colAmount += item.amount;
      });
    });

    this.payList$ = undefined;
    this.payList$ = this.payService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.payAmount = 0;
    this.payList$.subscribe(list => {
      list.forEach(item => {
        this.payAmount += Math.round(item.amount);
      });
    });
  }

  btnReturnList_Click(): void {
    this.selectedCustomer = undefined;
  }

  btnNew_Click(): void {
    this.clearSelectedCustomer();
  }

  btnSave_Click(): void {
    if (this.selectedCustomer.primaryKey === undefined) {
      this.selectedCustomer.primaryKey = '';
      this.customerService.addItem(this.selectedCustomer)
      .then(() => {
        this.infoService.success('Müşteri başarıyla kaydedildi.');
        this.selectedCustomer = undefined;
      }).catch(err => this.infoService.error(err));
    } else {
      this.customerService.updateItem(this.selectedCustomer)
      .then(() => {
        this.infoService.success('Müşteri bilgileri başarıyla güncellendi.');
        this.selectedCustomer = undefined;
      }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.customerService.removeItem(this.selectedCustomer).then(() => {
      this.infoService.success('Müşteri başarıyla kaldırıldı.');
      this.selectedCustomer = undefined;
    }).catch(err => this.infoService.error(err));
  }

  clearSelectedCustomer(): void {
    this.selectedCustomer = {primaryKey: undefined, name: '', owner: '', phone1: '', phone2: '', email: ''};
  }

  btnOpenSubPanel_Click(panel: string): void {
    this.openedPanel = panel;
    if (this.openedPanel === 'salesInvoice') {
      this.newSalesInvoice.customerCode = this.selectedCustomer.primaryKey;
      this.newSalesInvoice.userPrimaryKey = this.selectedCustomer.userPrimaryKey;

    } else if (this.openedPanel === 'collection') {

    } else if (this.openedPanel === 'purchaseInvoice') {

    } else if (this.openedPanel === 'payment') {

    } else if (this.openedPanel === 'edit') {

    } else {

    }
  }

}
