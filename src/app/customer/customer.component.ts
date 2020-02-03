import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../../app/services/customer.service';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';
import { SalesInvoiceService } from '../services/sales-invoice.service';
import { CollectionService } from '../services/collection.service';
import { PaymentService } from '../services/payment.service';
import { InformationService } from '../services/information.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction.service';
import { CashDeskService } from '../services/cash-desk.service';
import { AccountVoucherService } from '../services/account-voucher.service';
import { AuthenticationService } from '../services/authentication.service';
import { ExcelService } from '../services/excel-service';
import { FileModel } from '../models/file-model';
import { FileUploadService } from '../services/file-upload.service';
import { VisitMainModel } from '../models/visit-main-model';
import { VisitService } from '../services/visit.service';
import { Router, ActivatedRoute } from '@angular/router';
import {getBeginOfYear, getEncryptionKey, getEndOfYear, getNumber} from '../core/correct-library';
import * as CryptoJS from 'crypto-js';
import 'rxjs/add/operator/filter';
import { CustomerTargetMainModel } from '../models/customer-target-main-model';
import { CustomerTargetService } from '../services/customer-target.service';
import { SettingService } from '../services/setting.service';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {PaymentMainModel} from '../models/payment-main-model';
import {PurchaseInvoiceMainModel} from '../models/purchase-invoice-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit {
  mainList: Array<CustomerModel>;
  selectedCustomer: CustomerModel;
  refModel: CustomerModel;
  newSalesInvoice: SalesInvoiceMainModel;
  newPurchaseInvoice: PurchaseInvoiceMainModel;
  newCollection: CollectionMainModel;
  newPayment: PaymentMainModel;
  newVoucher: AccountVoucherMainModel;

  purchaseInvoiceList$: Observable<PurchaseInvoiceMainModel[]>;
  purchaseInvoiceAmount: any;
  siList$: Observable<SalesInvoiceMainModel[]>;
  siAmount: any;
  colList$: Observable<CollectionMainModel[]>;
  colAmount: any;
  payList$: Observable<PaymentMainModel[]>;
  payAmount: any;
  voucherList$: Observable<AccountVoucherMainModel[]>;
  voucherAmount: any;
  totalAmount: any;
  openedPanel: string;
  searchText: any;
  transactionList$: Observable<AccountTransactionModel[]>;
  cashDeskList$: Observable<CashDeskMainModel[]>;
  transactionList: Array<AccountTransactionModel>;
  totalValues = 0;
  BarChart: any;
  filesList$: Observable<FileModel[]>;
  visitList$: Observable<VisitMainModel[]>;
  targetList$: Observable<CustomerTargetMainModel[]>;
  encryptSecretKey: string = getEncryptionKey();
  isMainFilterOpened = false;
  isActive = true;

  constructor(public db: AngularFirestore, public customerService: CustomerService, public piService: PurchaseInvoiceService,
              public siService: SalesInvoiceService, public colService: CollectionService, public infoService: InformationService,
              public cdService: CashDeskService, public avService: AccountVoucherService, public authService: AuthenticationService,
              public excelService: ExcelService, public fuService: FileUploadService, public vService: VisitService,
              public router: ActivatedRoute, public ctService: CustomerTargetService, public sService: SettingService,
              public payService: PaymentService, public atService: AccountTransactionService, public route: Router) {
  }

  ngOnInit() {
    this.openedPanel = 'dashboard';
    this.populateCustomerList();
    this.cashDeskList$ = this.cdService.getMainItems();
    this.selectedCustomer = undefined;
  }

  populateCustomerList(): void {
    this.openedPanel = 'dashboard';
    this.mainList = undefined;
    this.customerService.getMainItems(this.isActive).subscribe(list => {
      if (this.mainList === undefined) this.mainList = [];
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
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedCustomer(customer: any): void {
    this.selectedCustomer = customer.data as CustomerModel;
    this.refModel = customer.data as CustomerModel;

    this.totalAmount = 0;
    this.purchaseInvoiceList$ = undefined;
    this.purchaseInvoiceList$ = this.piService.getCustomerItems(this.selectedCustomer.primaryKey);
    this.purchaseInvoiceAmount = 0;
    this.purchaseInvoiceList$.subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseInvoiceMainModel;
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
      list.forEach((data: any) => {
        const item = data.returnData as SalesInvoiceMainModel;
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
      list.forEach((data: any) => {
        const item = data.returnData as CollectionMainModel;
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
      list.forEach((data: any) => {
        const item = data.returnData as PaymentMainModel;
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
      list.forEach((data: any) => {
        const item = data.returnData as AccountVoucherMainModel;
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
    try {
      this.selectedCustomer = undefined;
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnNew_Click(): void {
    try {
      this.clearSelectedCustomer();
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnSave_Click(): void {
    try {
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
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnRemove_Click(): void {
    try {
      this.customerService.removeItem(this.selectedCustomer).then(() => {
        this.infoService.success('Müşteri başarıyla kaldırıldı.');
        this.selectedCustomer = undefined;
      }).catch(err => this.infoService.error(err));
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnSaveSalesInvoice_Click(): void {
    try {
      if (this.newSalesInvoice.data.primaryKey === null) {
        const newId = this.db.createId();
        this.newSalesInvoice.data.primaryKey = '';
        this.newSalesInvoice.data.customerCode = this.selectedCustomer.primaryKey;
        this.siService.setItem(this.newSalesInvoice, newId).then(() => {
          this.db.collection('tblAccountTransaction').add({
            primaryKey: '',
            userPrimaryKey: this.newSalesInvoice.data.userPrimaryKey,
            receiptNo: this.newSalesInvoice.data.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'salesInvoice',
            parentPrimaryKey: this.newSalesInvoice.data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: '-1',
            amount: this.newSalesInvoice.data.type === 'sales'
              ? this.newSalesInvoice.data.totalPriceWithTax * -1 : this.newSalesInvoice.data.totalPriceWithTax,
            amountType: this.newSalesInvoice.data.type === 'sales' ? 'debit' : 'credit',
            insertDate: this.newSalesInvoice.data.insertDate,
          }).then(() => {
            this.infoService.success('Fatura başarıyla kaydedildi.');
            this.clearNewSalesInvoice();
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnSavePurchaseInvoice_Click(): void {
    try {
      if (this.newPurchaseInvoice.data.primaryKey === null) {
        const newId = this.db.createId();
        this.newPurchaseInvoice.data.primaryKey = '';
        this.newPurchaseInvoice.data.customerCode = this.selectedCustomer.primaryKey;
        this.piService.setItem(this.newPurchaseInvoice, newId).then(() => {
          this.db.collection('tblAccountTransaction').add({
            primaryKey: '',
            userPrimaryKey: this.newPurchaseInvoice.data.userPrimaryKey,
            receiptNo: this.newPurchaseInvoice.data.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'purchaseInvoice',
            parentPrimaryKey: this.newPurchaseInvoice.data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: '-1',
            amount: this.newPurchaseInvoice.data.type === 'purchase'
              ? this.newPurchaseInvoice.data.totalPriceWithTax : this.newPurchaseInvoice.data.totalPriceWithTax * -1,
            amountType: this.newPurchaseInvoice.data.type === 'purchase' ? 'credit' : 'debit',
            insertDate: this.newPurchaseInvoice.data.insertDate,
          }).then(() => {
            this.infoService.success('Fatura başarıyla kaydedildi.');
            this.clearNewPurchaseInvoice();
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnSaveCollection_Click(): void {
    try {
      if (this.newCollection.data.primaryKey === null) {
        const newId = this.db.createId();
        this.newCollection.data.primaryKey = '';
        this.newCollection.data.customerCode = this.selectedCustomer.primaryKey;

        this.colService.setItem(this.newCollection, newId).then(() => {
          this.db.collection('tblAccountTransaction').add({
            primaryKey: '',
            userPrimaryKey: this.newCollection.data.userPrimaryKey,
            receiptNo: this.newCollection.data.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'collection',
            parentPrimaryKey: this.newCollection.data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: this.newCollection.data.cashDeskPrimaryKey,
            amount: this.newCollection.data.amount,
            amountType: 'credit',
            insertDate: this.newCollection.data.insertDate,
          }).then(async () => {
            this.infoService.success('Tahsilat başarıyla kaydedildi.');
            await this.clearNewCollection();
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnSavePayment_Click(): void {
    try {
      if (this.newPayment.data.primaryKey === null) {
        const newId = this.db.createId();
        this.newPayment.data.primaryKey = '';
        this.newPayment.data.customerCode = this.selectedCustomer.primaryKey;

        this.payService.setItem(this.newPayment, newId).then(() => {
          this.db.collection('tblAccountTransaction').add({
            primaryKey: '',
            userPrimaryKey: this.newPayment.data.userPrimaryKey,
            receiptNo: this.newPayment.data.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'payment',
            parentPrimaryKey: this.newPayment.data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: this.newPayment.data.cashDeskPrimaryKey,
            amount: this.newPayment.data.amount * -1,
            amountType: 'debit',
            insertDate: this.newPayment.data.insertDate,
          }).then(async () => {
            this.infoService.success('Ödeme başarıyla kaydedildi.');
            await this.clearNewPayment();
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnSaveVoucher_Click(): void {
    try {
      if (this.newVoucher.data.primaryKey === null) {
        const newId = this.db.createId();
        this.newVoucher.data.primaryKey = '';
        this.newVoucher.data.customerCode = this.selectedCustomer.primaryKey;

        this.avService.setItem(this.newVoucher, newId).then(() => {
          this.db.collection('tblAccountTransaction').add({
            primaryKey: '',
            userPrimaryKey: this.newVoucher.data.userPrimaryKey,
            receiptNo: this.newVoucher.data.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'accountVoucher',
            parentPrimaryKey: this.newVoucher.data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: this.newVoucher.data.cashDeskPrimaryKey,
            amount: this.newVoucher.data.type === 'creditVoucher' ?
              this.newVoucher.data.amount : this.newVoucher.data.amount * -1,
            amountType: this.newVoucher.data.type === 'creditVoucher' ? 'credit' : 'debit',
            insertDate: this.newVoucher.data.insertDate,
          }).then(async () => {
            this.infoService.success('Fiş başarıyla kaydedildi.');
            await this.clearNewVoucher();
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnExportToExcel_Click(): void {
    try {
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.mainList, 'customer');
      } else {
        this.infoService.error('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnMainFilter_Click(): void {
    try {
      this.populateCustomerList();
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnShowMainFiler_Click(): void {
    try {
      if (this.isMainFilterOpened === true) {
        this.isMainFilterOpened = false;
      } else {
        this.isMainFilterOpened = true;
      }
      this.clearMainFiler();
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnOpenSubPanel_Click(panel: string): void {
    try {
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
      } else if (this.openedPanel === 'accountSummary') {
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

      } else {

      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnAccountSummaryExportToExcel_Click(): void {
    try {
      if (this.transactionList.length > 0) {
        this.excelService.exportToExcel(this.transactionList, 'customerAccountSummary');
      } else {
        this.infoService.error('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  clearMainFiler(): void {
    this.isActive = true;
  }

  clearSelectedCustomer(): void {
    this.openedPanel = 'edit';
    this.refModel = undefined;
    this.selectedCustomer = {
      primaryKey: undefined, name: '', owner: '', phone1: '', phone2: '', email: '', isActive: true,
      userPrimaryKey: this.authService.getUid(), employeePrimaryKey: this.authService.getEid()
    };
  }

  async clearNewSalesInvoice(): Promise<void> {
    this.newSalesInvoice = this.siService.clearMainModel();
    const receiptNoData = await this.sService.getSalesInvoiceCode();
    if (receiptNoData !== null) {
      this.newSalesInvoice.data.receiptNo = receiptNoData;
    }
  }

  async clearNewPurchaseInvoice(): Promise<void> {
    this.newPurchaseInvoice = this.piService.clearMainModel();
    const receiptNoData = await this.sService.getPurchaseInvoiceCode();
    if (receiptNoData !== null) {
      this.newPurchaseInvoice.data.receiptNo = receiptNoData;
    }
  }

  async clearNewCollection(): Promise<void> {
    this.newCollection = this.colService.clearMainModel();
    const receiptNoData = await this.sService.getCollectionCode();
    if (receiptNoData !== null) {
      this.newCollection.data.receiptNo = receiptNoData;
    }
  }

  async clearNewPayment(): Promise<void> {
    this.newPayment = this.payService.clearMainModel();
    const receiptNoData = await this.sService.getPaymentCode();
    if (receiptNoData !== null) {
      this.newPayment.data.receiptNo = receiptNoData;
    }
  }

  async clearNewVoucher(): Promise<void> {
    this.newVoucher = this.avService.clearMainModel();
    const receiptNoData = await this.sService.getAccountVoucherCode();
    if (receiptNoData !== null) {
      this.newVoucher.data.receiptNo = receiptNoData;
    }
  }

  async showTransactionRecord(item: any): Promise<void> {
    let data;
    if (item.transactionType === 'salesInvoice') {

      data = await this.siService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['sales-invoice', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    } else if (item.transactionType === 'collection') {

      data = await this.colService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['collection', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    } else if (item.transactionType === 'purchaseInvoice') {

      data = await this.piService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['purchaseInvoice', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

      /* data = await this.piService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['/purchaseInvoice'], { queryParams: {
          data: CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptSecretKey).toString(),
          from: 'customer',
          fromData: CryptoJS.AES.encrypt(JSON.stringify(this.selectedCustomer), this.encryptSecretKey).toString(),
        } });
      } */

    } else if (item.transactionType === 'payment') {

      data = await this.payService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['payment', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    } else if (item.transactionType === 'accountVoucher') {

      data = await this.avService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['account-voucher', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    } else if (item.transactionType === 'cashdeskVoucher') {

      data = await this.cdService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['cashdesk-voucher', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
            this.encryptSecretKey).toString()
        }]);
      }

    } else {

      this.infoService.error('Modül bulunamadı.');

    }
  }

  async showTargetRecord(item: any): Promise<void> {
    await this.route.navigate(['customer-target', {
      paramItem: CryptoJS.AES.encrypt(JSON.stringify(item),
        this.encryptSecretKey).toString()
    }]);
  }
}
