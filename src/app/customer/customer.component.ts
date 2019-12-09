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
import { AccountTransactionService } from '../services/account-transaction.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import {AccountVoucherModel} from '../models/account-voucher-model';
import {AccountVoucherService} from '../services/account-voucher.service';
import {AuthenticationService} from '../services/authentication.service';
import { ExcelService } from '../services/excel-service';
import { FileModel } from '../models/file-model';
import { FileUploadService } from '../services/file-upload.service';
import { VisitMainModel } from '../models/visit-main-model';
import { VisitService } from '../services/visit.service';
import { Router, ActivatedRoute } from '@angular/router';
import { getEncriptionKey } from '../core/correct-library';
import * as CryptoJS from 'crypto-js';
import 'rxjs/add/operator/filter';
import { CustomerTargetMainModel } from '../models/customer-target-main-model';
import { CustomerTargetService } from '../services/customer-target.service';

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
  newVoucher: AccountVoucherModel;

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
  totalAmount: any;
  openedPanel: string;
  searchText: any;
  transactionList$: Observable<AccountTransactionModel[]>;
  cashDeskList$: Observable<CashDeskModel[]>;
  transactionList: Array<AccountTransactionModel>;
  totalValues = 0;
  BarChart: any;
  filesList$: Observable<FileModel[]>;
  visitList$: Observable<VisitMainModel[]>;
  targetList$: Observable<CustomerTargetMainModel[]>;
  encryptSecretKey: string = getEncriptionKey();

  constructor(public db: AngularFirestore, public customerService: CustomerService, public piService: PurchaseInvoiceService,
              public siService: SalesInvoiceService, public colService: CollectionService, public infoService: InformationService,
              public cdService: CashDeskService, public avService: AccountVoucherService, public authService: AuthenticationService,
              public excelService: ExcelService, public fuService: FileUploadService, public vService: VisitService,
              public router: ActivatedRoute, public ctService: CustomerTargetService,
              public payService: PaymentService, public atService: AccountTransactionService, public route: Router) {
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

    this.totalAmount = 0;
    this.purchaseInvoiceList$ = undefined;
    this.purchaseInvoiceList$ = this.piService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.purchaseInvoiceAmount = 0;
    this.purchaseInvoiceList$.subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.purchaseInvoiceAmount += Math.round(item.data.totalPriceWithTax);
          this.totalAmount += Math.round(item.data.totalPriceWithTax);
        } else if (item.actionType === 'removed') {
          this.purchaseInvoiceAmount -= Math.round(item.data.totalPriceWithTax);
          this.totalAmount -= Math.round(item.data.totalPriceWithTax);
        } else {
          // TODO: not complated
        }
      });
    });

    this.siList$ = undefined;
    this.siList$ = this.siService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.siAmount = 0;
    this.siList$.subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.siAmount += Math.round(item.data.totalPriceWithTax);
          this.totalAmount -= Math.round(item.data.totalPriceWithTax);
        } else if (item.actionType === 'removed') {
          this.siAmount -= Math.round(item.data.totalPriceWithTax);
          this.totalAmount += Math.round(item.data.totalPriceWithTax);
        } else {
          // TODO: not complated
        }
      });
    });

    this.colList$ = undefined;
    this.colList$ = this.colService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.colAmount = 0;
    this.colList$.subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.colAmount += Math.round(item.data.amount);
          this.totalAmount += Math.round(item.data.amount);
        } else if (item.actionType === 'removed') {
          this.colAmount -= Math.round(item.data.amount);
          this.totalAmount -= Math.round(item.data.amount);
        } else {
          // TODO: not complated
        }
      });
    });

    this.payList$ = undefined;
    this.payList$ = this.payService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.payAmount = 0;
    this.payList$.subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.payAmount += Math.round(item.data.amount);
          this.totalAmount -= Math.round(item.data.amount);
        } else if (item.actionType === 'removed') {
          this.payAmount -= Math.round(item.data.amount);
          this.totalAmount += Math.round(item.data.amount);
        } else {
          // TODO: not complated
        }
      });
    });

    this.voucherList$ = undefined;
    this.voucherList$ = this.avService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.voucherAmount = 0;
    this.voucherList$.subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.voucherAmount += Math.round(item.data.amount);
          if (item.data.type === 'debitVoucher') {
            this.totalAmount -= Math.round(item.data.amount);
          } else {
            this.totalAmount += Math.round(item.data.amount);
          }
        } else if (item.actionType === 'removed') {
          this.voucherAmount -= Math.round(item.data.amount);
          if (item.data.type === 'debitVoucher') {
            this.totalAmount += Math.round(item.data.amount);
          } else {
            this.totalAmount -= Math.round(item.data.amount);
          }
        } else {
          // TODO: not complated
        }
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
        this.openedPanel = 'dashboard';
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

      this.payService.setItem(this.newPayment, newId).then(() => {
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

  btnSaveVoucher_Click(): void {
    if (this.newVoucher.primaryKey === undefined) {
      const newId = this.db.createId();
      this.newVoucher.primaryKey = '';

      this.avService.setItem(this.newVoucher, newId).then(() => {
        this.db.collection('tblAccountTransaction').add({
          primaryKey: '',
          userPrimaryKey: this.newVoucher.userPrimaryKey,
          receiptNo: this.newVoucher.receiptNo,
          transactionPrimaryKey: newId,
          transactionType: 'accountVoucher',
          parentPrimaryKey: this.newVoucher.customerCode,
          parentType: 'customer',
          cashDeskPrimaryKey: this.newVoucher.cashDeskPrimaryKey,
          amount: this.newVoucher.type === 'creditVoucher' ? this.newVoucher.amount : this.newVoucher.amount * -1,
          amountType: this.newVoucher.type === 'creditVoucher' ? 'credit' : 'debit',
          insertDate: this.newVoucher.insertDate,
        }).then(() => {
          this.infoService.success('Fiş başarıyla kaydedildi.');
          this.clearNewVoucher();
        }).catch(err => this.infoService.error(err));
      }).catch(err => this.infoService.error(err));
    }
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'customer');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedCustomer(): void {
    this.openedPanel = 'edit';
    this.refModel = undefined;
    this.selectedCustomer = {primaryKey: undefined, name: '', owner: '', phone1: '', phone2: '', email: '', isActive: true,
      userPrimaryKey: this.authService.getUid()};
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

  clearNewVoucher(): void {
    this.newVoucher = {primaryKey: undefined, customerCode: this.selectedCustomer.primaryKey, receiptNo: '', type: '-1', description: '',
    insertDate: Date.now(), userPrimaryKey: this.selectedCustomer.userPrimaryKey};
  }

  btnOpenSubPanel_Click(panel: string): void {
    this.openedPanel = panel;
    if (this.selectedCustomer.primaryKey && this.openedPanel !== 'accountSummary' && this.openedPanel !== 'target') {
      this.transactionList$ = this.atService.getCustomerTransactionItems(this.selectedCustomer.primaryKey, panel);
    }
    if (this.openedPanel === 'salesInvoice') {
      this.clearNewSalesInvoice();
    } else if (this.openedPanel === 'collection') {
      this.clearNewCollection();
    } else if (this.openedPanel === 'purchaseInvoice') {
      this.clearNewPurchaseInvoice();
    } else if (this.openedPanel === 'payment') {
      this.clearNewPayment();
    } else if (this.openedPanel === 'accountVoucher') {
      this.clearNewVoucher();
    } else if (this.openedPanel === 'edit') {

    } else if (this.openedPanel === 'target') {
      this.targetList$ = undefined;
      this.targetList$ = this.ctService.getMainItemsWithCustomerPrimaryKey(this.selectedCustomer.primaryKey);
      this.targetList$.subscribe(list => {
        console.log(list);
      });
    }  else if (this.openedPanel === 'accountSummary') {
      this.totalValues = 0;
      this.atService.getCustomerTransactionsWithDateControl(this.selectedCustomer.primaryKey, undefined, undefined).then(list => {
        this.transactionList = list;
        this.transactionList.forEach(item => {
          this.totalValues += item.amount;
        });
      });
    } else if (this.openedPanel === 'dashboard') {
      if (!this.selectedCustomer.primaryKey) {
        this.btnReturnList_Click();
      }
    } else if (this.openedPanel === 'fileUpload') {
      this.filesList$ = undefined;
      this.filesList$ = this.fuService.getMainItemsWithCustomerPrimaryKey(this.selectedCustomer.primaryKey);
    } else if (this.openedPanel === 'visit') {
      this.visitList$ = undefined;
      this.visitList$ = this.vService.getMainItemsWithCustomerPrimaryKey(this.selectedCustomer.primaryKey);

    }  else {

    }
  }

  btnAccountSummaryExportToExcel_Click(): void {
    if (this.transactionList.length > 0) {
      this.excelService.exportToExcel(this.transactionList, 'customerAccountSummary');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async showTransactionRecord(item: any): Promise<void> {
    let data;
    if (item.transactionType === 'salesInvoice') {

      data = await this.siService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['sales-invoice', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else if  (item.transactionType === 'collection') {

      data = await this.colService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['collection', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
        }

    } else if  (item.transactionType === 'purchaseInvoice') {

      data = await this.piService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['purchaseInvoice', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

      /* data = await this.piService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['/purchaseInvoice'], { queryParams: {
          data: CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptSecretKey).toString(),
          from: 'customer',
          fromData: CryptoJS.AES.encrypt(JSON.stringify(this.selectedCustomer), this.encryptSecretKey).toString(),
        } });
      } */

    } else if  (item.transactionType === 'payment') {

      data = await this.payService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['payment', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else if  (item.transactionType === 'accountVoucher') {

      data = await this.avService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['account-voucher', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else if  (item.transactionType === 'cashdeskVoucher') {

      data = await this.cdService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['cashdesk-voucher', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else {

      this.infoService.error('Modül bulunamadı.');

    }
  }

}
