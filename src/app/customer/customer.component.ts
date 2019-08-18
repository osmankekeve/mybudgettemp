import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
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

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit {
  mainList$: Observable<CustomerModel[]>;
  selectedCustomer: CustomerModel;

  purchaseInvoiceList$: Observable<PurchaseInvoiceModel[]>;
  purchaseInvoiceAmount: any;
  siList$: Observable<SalesInvoiceModel[]>;
  siAmount: any;
  colList$: Observable<CollectionModel[]>;
  colAmount: any;
  payList$: Observable<PaymentModel[]>;
  payAmount: any;

  constructor(public db: AngularFirestore, public customerService: CustomerService, public piService: PurchaseInvoiceService,
              public siService: SalesInvoiceService, public colService: CollectionService,
              public payService: PaymentService) {
  }

  ngOnInit() {
    this.populateCustomerList();
    this.selectedCustomer = undefined;
  }

  populateCustomerList(): void {
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
        this.purchaseInvoiceAmount += item.totalPriceWithTax;
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
        this.payAmount += item.amount;
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
      this.customerService.addItem(this.selectedCustomer);
    } else {
      this.customerService.updateItem(this.selectedCustomer);
    }
    this.selectedCustomer = undefined;
  }

  btnRemove_Click(): void {
    this.customerService.removeItem(this.selectedCustomer);
    this.selectedCustomer = undefined;
  }

  clearSelectedCustomer(): void {
    this.selectedCustomer = {primaryKey: undefined, name: '', owner: '', phone1: '', phone2: '', email: ''};
  }

}
