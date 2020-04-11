import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {CustomerService} from '../../app/services/customer.service';
import {PurchaseInvoiceService} from '../services/purchase-invoice.service';
import {SalesInvoiceService} from '../services/sales-invoice.service';
import {CollectionService} from '../services/collection.service';
import {PaymentService} from '../services/payment.service';
import {InformationService} from '../services/information.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountTransactionService} from '../services/account-transaction.service';
import {CashDeskService} from '../services/cash-desk.service';
import {AccountVoucherService} from '../services/account-voucher.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {FileModel} from '../models/file-model';
import {FileUploadService} from '../services/file-upload.service';
import {VisitMainModel} from '../models/visit-main-model';
import {VisitService} from '../services/visit.service';
import {Router, ActivatedRoute} from '@angular/router';
import {
  currencyFormat,
  getBeginOfYear,
  getEncryptionKey,
  getEndOfYear,
  getFloat,
  getInputDataForInsert,
  getNumber,
  getTodayForInput, isNullOrEmpty, moneyFormat
} from '../core/correct-library';
import * as CryptoJS from 'crypto-js';
import 'rxjs/add/operator/filter';
import {CustomerTargetMainModel} from '../models/customer-target-main-model';
import {CustomerTargetService} from '../services/customer-target.service';
import {SettingService} from '../services/setting.service';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {PaymentMainModel} from '../models/payment-main-model';
import {PurchaseInvoiceMainModel} from '../models/purchase-invoice-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {MailMainModel} from '../models/mail-main-model';
import {MailService} from '../services/mail.service';
import {ReportService} from '../services/report.service';
import {ProfileMainModel} from '../models/profile-main-model';
import {ProfileService} from '../services/profile.service';
import {CustomerMainModel} from '../models/customer-main-model';
import {CustomerAccountModel} from '../models/customer-account-model';
import {CustomerAccountService} from '../services/customer-account.service';
import {GlobalService} from '../services/global.service';
import {RouterModel} from '../models/router-model';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit {
  mainList: Array<CustomerMainModel>;
  selectedCustomer: CustomerMainModel;
  newSalesInvoice: SalesInvoiceMainModel;
  newPurchaseInvoice: PurchaseInvoiceMainModel;
  newCollection: CollectionMainModel;
  newPayment: PaymentMainModel;
  newVoucher: AccountVoucherMainModel;

  accountList$: Observable<CustomerAccountModel[]>;
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
  executiveList$: Observable<ProfileMainModel[]>;
  transactionList: Array<AccountTransactionModel>;
  totalValues = 0;
  BarChart: any;
  filesList$: Observable<FileModel[]>;
  visitList$: Observable<VisitMainModel[]>;
  targetList$: Observable<CustomerTargetMainModel[]>;
  mailList$: Observable<MailMainModel[]>;
  encryptSecretKey: string = getEncryptionKey();
  isMainFilterOpened = false;
  isActive = true;
  recordDate: any;
  onTransaction = false;

  constructor(public db: AngularFirestore, public customerService: CustomerService, public piService: PurchaseInvoiceService,
              public siService: SalesInvoiceService, public colService: CollectionService, public infoService: InformationService,
              public cdService: CashDeskService, public avService: AccountVoucherService, public authService: AuthenticationService,
              public excelService: ExcelService, public fuService: FileUploadService, public vService: VisitService,
              public router: ActivatedRoute, public ctService: CustomerTargetService, public sService: SettingService,
              public payService: PaymentService, public atService: AccountTransactionService, public route: Router,
              public rService: ReportService, public proService: ProfileService, public accService: CustomerAccountService,
              public mailService: MailService, public globService: GlobalService) {
  }

  async ngOnInit() {
    this.openedPanel = 'dashboard';
    this.populateCustomerList();
    this.cashDeskList$ = this.cdService.getMainItems();
    this.executiveList$ = this.proService.getMainItems();
    this.selectedCustomer = undefined;
    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = await CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedCustomer(paramItem);
      }
    }
  }

  populateCustomerList(): void {
    this.openedPanel = 'dashboard';
    this.mainList = undefined;
    this.customerService.getMainItems(this.isActive).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((item: any) => {
        const data = item.returnData as CustomerMainModel;
        if (data.actionType === 'added') {
          this.mainList.push(data);
        }
        if (data.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (data.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (data.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (data.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = data;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedCustomer(customer: any): void {
    this.selectedCustomer = customer as CustomerMainModel;
    this.accountList$ = this.accService.getAllItems(this.selectedCustomer.data.primaryKey);

    this.totalAmount = 0;
    this.purchaseInvoiceList$ = undefined;
    this.purchaseInvoiceList$ = this.piService.getCustomerItems(this.selectedCustomer.data.primaryKey);
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
    this.siList$ = this.siService.getCustomerItems(this.selectedCustomer.data.primaryKey);
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
    this.colList$ = this.colService.getCustomerItems(this.selectedCustomer.data.primaryKey);
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
    this.payList$ = this.payService.getCustomerItems(this.selectedCustomer.data.primaryKey);
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
    this.voucherList$ = this.avService.getCustomerItems(this.selectedCustomer.data.primaryKey);
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

    this.mailList$ = undefined;
    this.mailList$ = this.mailService.getCustomerItems(this.selectedCustomer.data.primaryKey);
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      this.selectedCustomer = undefined;
      await this.route.navigate(['customer', {}]);
    } catch (error) {
      this.infoService.error(error);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedCustomer();
      const customerCodeData = await this.sService.getCustomerCode();
      if (customerCodeData !== null) {
        this.selectedCustomer.data.code = customerCodeData;
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.customerService.checkForSave(this.selectedCustomer)])
        .then(async (values: any) => {
          if (this.selectedCustomer.data.primaryKey === null) {
            this.selectedCustomer.data.primaryKey = this.db.createId();
            await this.customerService.setItem(this.selectedCustomer, this.selectedCustomer.data.primaryKey)
              .then(() => {
                this.finishProcess(null, 'Müşteri başarıyla kaydedildi.');
                this.openedPanel = 'dashboard';
              })
              .catch((error) => {
                this.finishProcess(error, null);
              })
              .finally(() => {
                this.finishFinally();
              });
          } else {
            this.customerService.updateItem(this.selectedCustomer)
              .then(() => {
                this.finishProcess(null, 'Müşteri başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              })
              .finally(() => {
                this.finishFinally();
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.customerService.checkForRemove(this.selectedCustomer)])
        .then(async (values: any) => {
          await this.customerService.removeItem(this.selectedCustomer)
            .then(() => {
              this.finishProcess(null, 'Müşteri başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            })
            .finally(() => {
              this.finishFinally();
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnSaveSalesInvoice_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.siService.checkForSave(this.newSalesInvoice)])
        .then(async (values: any) => {
          if (this.newSalesInvoice.data.primaryKey === null) {
            this.newSalesInvoice.data.primaryKey = this.db.createId();
            this.newSalesInvoice.data.insertDate = getInputDataForInsert(this.recordDate);
            await this.siService.setItem(this.newSalesInvoice, this.newSalesInvoice.data.primaryKey)
              .then(() => {
                this.infoService.success('Fatura başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcessAndError(error);
              })
              .finally(() => {
                this.clearNewSalesInvoice();
              });
          }
        })
        .catch((error) => {
          this.finishProcessAndError(error);
        });
    } catch (error) {
      this.finishProcessAndError(error);
    }
  }

  async btnSavePurchaseInvoice_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.piService.checkForSave(this.newPurchaseInvoice)])
        .then(async (values: any) => {
          if (this.newPurchaseInvoice.data.primaryKey === null) {
            this.newPurchaseInvoice.data.primaryKey = this.db.createId();
            this.newPurchaseInvoice.data.insertDate = getInputDataForInsert(this.recordDate);
            await this.piService.setItem(this.newPurchaseInvoice, this.newPurchaseInvoice.data.primaryKey)
              .then(() => {
                this.infoService.success('Fatura başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcessAndError(error);
              })
              .finally(() => {
                this.clearNewPurchaseInvoice();
              });
          }
        })
        .catch((error) => {
          this.finishProcessAndError(error);
        });
    } catch (error) {
      this.infoService.error(error);
    }
  }

  async btnSaveCollection_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.colService.checkForSave(this.newCollection)])
        .then(async (values: any) => {
          if (this.newCollection.data.primaryKey === null) {
            this.newCollection.data.primaryKey = this.db.createId();
            this.newCollection.data.insertDate = getInputDataForInsert(this.recordDate);
            await this.colService.setItem(this.newCollection, this.newCollection.data.primaryKey)
              .then(() => {
                this.infoService.success('Tahsilat başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcessAndError(error);
              })
              .finally(() => {
                this.clearNewCollection();
              });
          }
        })
        .catch((error) => {
          this.finishProcessAndError(error);
        });
    } catch (error) {
      this.finishProcessAndError(error);
    }
  }

  async btnSavePayment_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.payService.checkForSave(this.newPayment)])
        .then(async (values: any) => {
          if (this.newPayment.data.primaryKey === null) {
            this.newPayment.data.primaryKey = this.db.createId();
            this.newPayment.data.insertDate = getInputDataForInsert(this.recordDate);
            await this.payService.setItem(this.newPayment, this.newPayment.data.primaryKey)
              .then(() => {
                this.infoService.success('Ödeme başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcessAndError(error);
              })
              .finally(() => {
                this.clearNewPayment();
              });
          }
        })
        .catch((error) => {
          this.finishProcessAndError(error);
        });
    } catch (error) {
      this.finishProcessAndError(error);
    }
  }

  async btnSaveVoucher_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.avService.checkForSave(this.newVoucher)])
        .then(async (values: any) => {
          if (this.newVoucher.data.primaryKey === null) {
            this.newVoucher.data.primaryKey = this.db.createId();
            this.newVoucher.data.insertDate = getInputDataForInsert(this.recordDate);
            await this.avService.setItem(this.newVoucher, this.newVoucher.data.primaryKey)
              .then(() => {
                this.infoService.success('Fiş başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcessAndError(error);
              })
              .finally(() => {
                this.clearNewVoucher();
              });
          }
        })
        .catch((error) => {
          this.infoService.error(error);
        });
    } catch (error) {
      this.finishProcessAndError(error);
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

  async btnOpenSubPanel_Click(panel: string): Promise<void> {
    try {
      this.openedPanel = panel;
      if (this.selectedCustomer.data.primaryKey && this.openedPanel !== 'accountSummary' && this.openedPanel !== 'target') {
        this.transactionList$ = this.atService.getCustomerTransactionItems(this.selectedCustomer.data.primaryKey, panel);
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
        this.targetList$ = this.ctService.getMainItemsWithCustomerPrimaryKey(this.selectedCustomer.data.primaryKey);
      } else if (this.openedPanel === 'accountSummary') {
        this.totalValues = 0;
        this.rService.getCustomerTransactionsWithDateControl(this.selectedCustomer.data.primaryKey, undefined, undefined).then(list => {
          this.transactionList = list;
          this.transactionList.forEach(item => {
            this.totalValues += item.amount;
          });
        });
      } else if (this.openedPanel === 'dashboard') {
        if (!this.selectedCustomer.data.primaryKey) {
          this.btnReturnList_Click();
        }
      } else if (this.openedPanel === 'fileUpload') {
        this.filesList$ = undefined;
        this.filesList$ = this.fuService.getMainItemsWithCustomerPrimaryKey(this.selectedCustomer.data.primaryKey);
      } else if (this.openedPanel === 'visit') {
        this.visitList$ = undefined;
        this.visitList$ = this.vService.getMainItemsWithCustomerPrimaryKey(this.selectedCustomer.data.primaryKey);

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
    this.accountList$ = new Observable<CustomerAccountModel[]>();
    this.openedPanel = 'edit';
    this.selectedCustomer = this.customerService.clearMainModel();
  }

  async clearNewSalesInvoice(): Promise<void> {
    this.onTransaction = false;
    this.recordDate = getTodayForInput();
    this.newSalesInvoice = this.siService.clearMainModel();
    this.newSalesInvoice.data.customerCode = this.selectedCustomer.data.primaryKey;
    const receiptNoData = await this.sService.getSalesInvoiceCode();
    if (receiptNoData !== null) {
      this.newSalesInvoice.data.receiptNo = receiptNoData;
    }
  }

  async clearNewPurchaseInvoice(): Promise<void> {
    this.onTransaction = false;
    this.recordDate = getTodayForInput();
    this.newPurchaseInvoice = this.piService.clearMainModel();
    this.newPurchaseInvoice.data.customerCode = this.selectedCustomer.data.primaryKey;
    const receiptNoData = await this.sService.getPurchaseInvoiceCode();
    if (receiptNoData !== null) {
      this.newPurchaseInvoice.data.receiptNo = receiptNoData;
    }
  }

  async clearNewCollection(): Promise<void> {
    this.onTransaction = false;
    this.recordDate = getTodayForInput();
    this.newCollection = this.colService.clearMainModel();
    this.newCollection.data.customerCode = this.selectedCustomer.data.primaryKey;
    const receiptNoData = await this.sService.getCollectionCode();
    if (receiptNoData !== null) {
      this.newCollection.data.receiptNo = receiptNoData;
    }
  }

  async clearNewPayment(): Promise<void> {
    this.onTransaction = false;
    this.recordDate = getTodayForInput();
    this.newPayment = this.payService.clearMainModel();
    this.newPayment.data.customerCode = this.selectedCustomer.data.primaryKey;
    const receiptNoData = await this.sService.getPaymentCode();
    if (receiptNoData !== null) {
      this.newPayment.data.receiptNo = receiptNoData;
    }
  }

  async clearNewVoucher(): Promise<void> {
    this.onTransaction = false;
    this.recordDate = getTodayForInput();
    this.newVoucher = this.avService.clearMainModel();
    this.newVoucher.data.customerCode = this.selectedCustomer.data.primaryKey;
    const receiptNoData = await this.sService.getAccountVoucherCode();
    if (receiptNoData !== null) {
      this.newVoucher.data.receiptNo = receiptNoData;
    }
  }

  async showTransactionRecord(item: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = item.transactionType;
    r.nextModulePrimaryKey = item.transactionPrimaryKey;
    r.previousModule = 'customer';
    r.previousModulePrimaryKey = this.selectedCustomer.data.primaryKey;
    await this.globService.showTransactionRecord(r);
  }

  async showTargetRecord(item: any): Promise<void> {
    await this.route.navigate(['customer-target', {
      paramItem: CryptoJS.AES.encrypt(JSON.stringify(item),
        this.encryptSecretKey).toString()
    }]);
  }

  finishProcessAndError(error: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    this.onTransaction = false;
    this.infoService.error(error.message !== undefined ? error.message : error);
  }

  finishFinally(): void {
    this.clearSelectedCustomer();
    this.selectedCustomer = undefined;
    this.onTransaction = false;
  }

  finishProcess(error: any, info: any): void {
    // error.message sistem hatası
    // error kontrol hatası

    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      this.clearSelectedCustomer();
      this.selectedCustomer = undefined;
    } else {
      this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  format_totalPrice($event): void {
    if (this.openedPanel === 'salesInvoice') {
      this.newSalesInvoice.data.totalPrice = getFloat(moneyFormat($event.target.value));
      this.newSalesInvoice.totalPriceFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else if (this.openedPanel === 'purchaseInvoice') {
      this.newPurchaseInvoice.data.totalPrice = getFloat(moneyFormat($event.target.value));
      this.newPurchaseInvoice.totalPriceFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else {
      // nothing
    }
  }

  format_totalPriceWithTax($event): void {
    if (this.openedPanel === 'salesInvoice') {
      this.newSalesInvoice.data.totalPriceWithTax = getFloat(moneyFormat($event.target.value));
      this.newSalesInvoice.totalPriceWithTaxFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else if (this.openedPanel === 'purchaseInvoice') {
      this.newPurchaseInvoice.data.totalPriceWithTax = getFloat(moneyFormat($event.target.value));
      this.newPurchaseInvoice.totalPriceWithTaxFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else {
      // nothing
    }
  }

  format_amount($event): void {
    if (this.openedPanel === 'collection') {
      this.newCollection.data.amount = getFloat(moneyFormat($event.target.value));
      this.newCollection.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else if (this.openedPanel === 'payment') {
      this.newPayment.data.amount = getFloat(moneyFormat($event.target.value));
      this.newPayment.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else if (this.openedPanel === 'accountVoucher') {
      this.newVoucher.data.amount = getFloat(moneyFormat($event.target.value));
      this.newVoucher.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else {
      // nothing
    }
  }

  focus_amount(): void {
    if (this.openedPanel === 'collection') {
      if (this.newCollection.data.amount === 0) {
        this.newCollection.data.amount = null;
        this.newCollection.amountFormatted = null;
      }
    } else if (this.openedPanel === 'payment') {
      if (this.newPayment.data.amount === 0) {
        this.newPayment.data.amount = null;
        this.newPayment.amountFormatted = null;
      }
    } else if (this.openedPanel === 'accountVoucher') {
      if (this.newVoucher.data.amount === 0) {
        this.newVoucher.data.amount = null;
        this.newVoucher.amountFormatted = null;
      }
    } else {
      // nothing
    }
  }

  focus_totalPrice(): void {
    if (this.openedPanel === 'salesInvoice') {
      if (this.newSalesInvoice.data.totalPrice === 0) {
        this.newSalesInvoice.data.totalPrice = null;
        this.newSalesInvoice.totalPriceFormatted = null;
      }
    } else if (this.openedPanel === 'purchaseInvoice') {
      if (this.newPurchaseInvoice.data.totalPrice === 0) {
        this.newPurchaseInvoice.data.totalPrice = null;
        this.newPurchaseInvoice.totalPriceFormatted = null;
      }
    } else {
      // nothing
    }
  }

  focus_totalPriceWithTax(): void {
    if (this.openedPanel === 'salesInvoice') {
      if (this.newSalesInvoice.data.totalPriceWithTax === 0) {
        this.newSalesInvoice.data.totalPriceWithTax = null;
        this.newSalesInvoice.totalPriceWithTaxFormatted = null;
      }
    } else if (this.openedPanel === 'purchaseInvoice') {
      if (this.newPurchaseInvoice.data.totalPriceWithTax === 0) {
        this.newPurchaseInvoice.data.totalPriceWithTax = null;
        this.newPurchaseInvoice.totalPriceWithTaxFormatted = null;
      }
    } else {
      // nothing
    }
  }
}
