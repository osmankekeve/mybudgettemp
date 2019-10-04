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
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import {AccountVoucherModel} from '../models/account-voucher-model';
import {AccountVoucherService} from '../services/account-voucher.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit  {
  mainList: Array<CustomerModel>;
  selectedCustomer: CustomerModel;
  refModel: CustomerModel;
  newSalesInvoice: SalesInvoiceModel;
  newPurchaseInvoice: PurchaseInvoiceModel;
  newCollection: CollectionModel;
  newPayment: PaymentModel;

  purchaseInvoiceList$: Observable<PurchaseInvoiceModel[]>;
  purchaseInvoiceAmount: any;
  siList$: Observable<SalesInvoiceModel[]>;
  siAmount: any;
  colList$: Observable<CollectionModel[]>;
  colAmount: any;
  payList$: Observable<PaymentModel[]>;
  payAmount: any;
  voucherList$: Observable<AccountVoucherModel[]>;
  voucherAmount: any;
  openedPanel: string;
  searchText: any;
  transactionList$: Observable<AccountTransactionModel[]>;
  cashDeskList$: Observable<CashDeskModel[]>;

  constructor(public db: AngularFirestore, public customerService: CustomerService, public piService: PurchaseInvoiceService,
              public siService: SalesInvoiceService, public colService: CollectionService, public infoService: InformationService,
              public cdService: CashDeskService, public avService: AccountVoucherService,
              public payService: PaymentService, public atService: AccountTransactionService) {
  }

  ngOnInit() {
    this.openedPanel = 'dashboard';
    this.populateCustomerList();
    this.cashDeskList$ = this.cdService.getAllItems();
    this.selectedCustomer = undefined;
  }

  populateCustomerList(): void {
    this.openedPanel = 'dashboard';
    this.mainList = [];
    this.customerService.getMainItems().subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    });

  }

  showSelectedCustomer(customer: any): void {
    this.selectedCustomer = customer.data as CustomerModel;
    this.refModel = customer.data as CustomerModel;

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

    this.voucherList$ = undefined;
    this.voucherList$ = this.avService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.voucherAmount = 0;
    this.voucherList$.subscribe(list => {
      list.forEach(item => {
        this.voucherAmount += Math.round(item.amount);
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

  btnSaveSalesInvoice_Click(): void {
    if (this.newSalesInvoice.primaryKey === undefined) {
      const newId = this.db.createId();
      this.newSalesInvoice.primaryKey = '';

      this.siService.setItem(this.newSalesInvoice, newId).then(() => {
        this.db.collection('tblAccountTransaction').add({
          primaryKey: '',
          userPrimaryKey: this.newSalesInvoice.userPrimaryKey,
          receiptNo: this.newSalesInvoice.receiptNo,
          transactionPrimaryKey: newId,
          transactionType: 'salesInvoice',
          parentPrimaryKey: this.newSalesInvoice.customerCode,
          parentType: 'customer',
          cashDeskPrimaryKey: '-1',
          amount: this.newSalesInvoice.type === 'sales'
          ? this.newSalesInvoice.totalPriceWithTax * -1 : this.newSalesInvoice.totalPriceWithTax,
          amountType: this.newSalesInvoice.type === 'sales' ? 'debit' : 'credit',
          insertDate: this.newSalesInvoice.insertDate,
        }).then(() => {
          this.infoService.success('Fatura başarıyla kaydedildi.');
          this.clearNewSalesInvoice();
        }).catch(err => this.infoService.error(err));
      }).catch(err => this.infoService.error(err));
    }
  }

  btnSavePurchaseInvoice_Click(): void {
    if (this.newPurchaseInvoice.primaryKey === undefined) {
      const newId = this.db.createId();
      this.newPurchaseInvoice.primaryKey = '';
      this.piService.setItem(this.newPurchaseInvoice, newId).then(() => {
        this.db.collection('tblAccountTransaction').add({
          primaryKey: '',
          userPrimaryKey: this.newPurchaseInvoice.userPrimaryKey,
          receiptNo: this.newPurchaseInvoice.receiptNo,
          transactionPrimaryKey: newId,
          transactionType: 'purchaseInvoice',
          parentPrimaryKey: this.newPurchaseInvoice.customerCode,
          parentType: 'customer',
          cashDeskPrimaryKey: '-1',
          amount: this.newPurchaseInvoice.type === 'purchase'
          ? this.newPurchaseInvoice.totalPriceWithTax : this.newPurchaseInvoice.totalPriceWithTax * -1,
          amountType: this.newPurchaseInvoice.type === 'purchase' ? 'credit' : 'debit',
          insertDate: this.newPurchaseInvoice.insertDate,
        }).then(() => {
          this.infoService.success('Fatura başarıyla kaydedildi.');
          this.clearNewPurchaseInvoice();
        }).catch(err => this.infoService.error(err));
      }).catch(err => this.infoService.error(err));

    }
  }

  btnSaveCollection_Click(): void {
    if (this.newCollection.primaryKey === undefined) {
      const newId = this.db.createId();
      this.newCollection.primaryKey = '';

      this.colService.setItem(this.newCollection, newId).then(() => {
        this.db.collection('tblAccountTransaction').add({
          primaryKey: '',
          userPrimaryKey: this.newCollection.userPrimaryKey,
          receiptNo: this.newCollection.receiptNo,
          transactionPrimaryKey: newId,
          transactionType: 'collection',
          parentPrimaryKey: this.newCollection.customerCode,
          parentType: 'customer',
          cashDeskPrimaryKey: this.newCollection.cashDeskPrimaryKey,
          amount: this.newCollection.amount,
          amountType: 'credit',
          insertDate: this.newCollection.insertDate,
        }).then(() => {
          this.infoService.success('Tahsilat başarıyla kaydedildi.');
          this.clearNewCollection();
        }).catch(err => this.infoService.error(err));
      }).catch(err => this.infoService.error(err));
    }
  }

  btnSavePayment_Click(): void {
    if (this.newPayment.primaryKey === undefined) {
      const newId = this.db.createId();
      this.newPayment.primaryKey = '';

      this.colService.setItem(this.newPayment, newId).then(() => {
        this.db.collection('tblAccountTransaction').add({
          primaryKey: '',
          userPrimaryKey: this.newPayment.userPrimaryKey,
          receiptNo: this.newPayment.receiptNo,
          transactionPrimaryKey: newId,
          transactionType: 'payment',
          parentPrimaryKey: this.newPayment.customerCode,
          parentType: 'customer',
          cashDeskPrimaryKey: this.newPayment.cashDeskPrimaryKey,
          amount: this.newPayment.amount * -1,
          amountType: 'debit',
          insertDate: this.newPayment.insertDate,
        }).then(() => {
          this.infoService.success('Ödeme başarıyla kaydedildi.');
          this.clearNewPayment();
        }).catch(err => this.infoService.error(err));
      }).catch(err => this.infoService.error(err));
    }
  }

  clearSelectedCustomer(): void {
    this.refModel = undefined;
    this.selectedCustomer = {primaryKey: undefined, name: '', owner: '', phone1: '', phone2: '', email: ''};
  }

  clearNewSalesInvoice(): void {
    this.newSalesInvoice = {primaryKey: undefined, customerCode: this.selectedCustomer.primaryKey, receiptNo: '', type: 'sales',
    description: '', insertDate: Date.now(), userPrimaryKey: this.selectedCustomer.userPrimaryKey};
  }

  clearNewPurchaseInvoice(): void {
    this.newPurchaseInvoice = {primaryKey: undefined, customerCode: this.selectedCustomer.primaryKey, receiptNo: '', type: 'purchase',
    description: '', insertDate: Date.now(), userPrimaryKey: this.selectedCustomer.userPrimaryKey};
  }

  clearNewCollection(): void {
    this.newCollection = {primaryKey: undefined, customerCode: this.selectedCustomer.primaryKey,
      receiptNo: '', type: 'cash', description: '', insertDate: Date.now(), userPrimaryKey: this.selectedCustomer.userPrimaryKey};
  }

  clearNewPayment(): void {
    this.newPayment = {primaryKey: undefined, customerCode: this.selectedCustomer.primaryKey,
      receiptNo: '', type: 'cash', description: '', insertDate: Date.now(), userPrimaryKey: this.selectedCustomer.userPrimaryKey};
  }

  btnOpenSubPanel_Click(panel: string): void {
    this.openedPanel = panel;
    this.transactionList$ = this.atService.getCustomerTransactionItems(this.selectedCustomer.primaryKey, panel);
    if (this.openedPanel === 'salesInvoice') {
      this.clearNewSalesInvoice();
    } else if (this.openedPanel === 'collection') {
      this.clearNewCollection();
    } else if (this.openedPanel === 'purchaseInvoice') {
      this.clearNewPurchaseInvoice();
    } else if (this.openedPanel === 'payment') {
      this.clearNewPayment();
    } else if (this.openedPanel === 'edit') {

    } else {

    }
  }

}
