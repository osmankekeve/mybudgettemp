import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionService } from '../services/account-transaction.service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskService } from '../services/cash-desk.service';
import { InformationService } from '../services/information.service';
import { CashDeskVoucherService } from '../services/cashdesk-voucher.service';
import {
  getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty, getDateForInput, getInputDataForInsert, getEncryptionKey,
  getFloat, currencyFormat, moneyFormat
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import { Router, ActivatedRoute } from '@angular/router';
import {SettingService} from '../services/setting.service';
import {CashDeskVoucherMainModel} from '../models/cashdesk-voucher-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';

@Component({
  selector: 'app-cashdesk-voucher',
  templateUrl: './cashdesk-voucher.component.html',
  styleUrls: ['./cashdesk-voucher.component.css']
})
export class CashdeskVoucherComponent implements OnInit, OnDestroy {
  mainList: Array<CashDeskVoucherMainModel>;
  cashDeskList$: Observable<CashDeskMainModel[]>;
  selectedRecord: CashDeskVoucherMainModel;
  isRecordHasTransaction = false;
  isMainFilterOpened = false;
  recordDate: any;
  searchText: '';
  encryptSecretKey: string = getEncryptionKey();

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  filterStatus: any;
  totalValues = {
    amount: 0
  };
  onTransaction = false;

  constructor(public authService: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public service: CashDeskVoucherService, public cdService: CashDeskService,
              public atService: AccountTransactionService, public infoService: InformationService,
              public excelService: ExcelService, public sService: SettingService,
              public cService: CustomerService, public db: AngularFirestore) { }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.cashDeskList$ = this.cdService.getMainItems();
    this.selectedRecord = undefined;

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem);
      }
    }
  }

  async generateModule(isReload: boolean, primaryKey: string, error: any, info: any): Promise<void> {
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      if (isReload) {
        this.service.getItem(primaryKey)
          .then(item => {
            this.showSelectedRecord(item.returnData);
          })
          .catch(reason => {
            this.finishProcess(reason, null);
          });
      } else {
        this.generateCharts();
        this.clearSelectedRecord();
        this.selectedRecord = undefined;
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList = undefined;
    this.totalValues = {
      amount: 0
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDates(beginDate, finishDate, this.filterStatus).subscribe(list => {
      if (this.mainList === undefined) { this.mainList = []; }
      list.forEach((data: any) => {
        const item = data.returnData as CashDeskVoucherMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.amount += item.data.amount;
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              this.totalValues.amount -= item.data.amount;
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.totalValues.amount -= this.mainList[i].data.amount;
              this.totalValues.amount += item.data.amount;
              this.mainList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  generateCharts(): void {

  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CashDeskVoucherMainModel;
    this.recordDate = getDateForInput(this.selectedRecord.data.insertDate);
    if (this.selectedRecord.data.type === 'open') { this.selectedRecord.data.secondCashDeskPrimaryKey = '-1'; }
    this.atService.getRecordTransactionItems(this.selectedRecord.data.primaryKey)
    .subscribe(list => {
      this.isRecordHasTransaction = list.length > 0;
    });
  }

  async btnReturnList_Click(): Promise<void> {
    await this.finishProcess(null, null);
    await this.route.navigate(['cashdesk-voucher', {}]);
  }

  async btnNew_Click(): Promise<void> {
    this.clearSelectedRecord();
    const receiptNoData = await this.sService.getCashDeskVoucherCode();
    if (receiptNoData !== null) {
      this.selectedRecord.data.receiptNo = receiptNoData;
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.insertDate = getInputDataForInsert(this.recordDate);
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
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
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Fiş başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnApprove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.status = 'approved';
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla onaylandı.');
            })
            .catch(async (error) => {
              await this.finishProcess(error, null);
            });
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnReject_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.status = 'rejected';
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.generateModule(false, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla reddedildi.');
            })
            .catch(async (error) => {
              await this.finishProcess(error, null);
            });
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnReturnRecord_Click(): Promise<void> {
    try {
      this.infoService.error('yazılmadı');
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnCreateTransactions_Click(): Promise<void> {
    await this.atService.removeTransactions('salesInvoice')
      .then(() => {
        Promise.all([this.service.getMainItemsBetweenDatesAsPromise(null, null, 'approved')])
          .then((values: any) => {
            if ((values[0] !== undefined || values[0] !== null)) {
              const returnData = values[0] as Array<SalesInvoiceMainModel>;
              returnData.forEach(record => {
                const trans = {
                  primaryKey: record.data.primaryKey,
                  userPrimaryKey: record.data.userPrimaryKey,
                  receiptNo: record.data.receiptNo,
                  transactionPrimaryKey: record.data.primaryKey,
                  transactionType: 'salesInvoice',
                  parentPrimaryKey: record.data.customerCode,
                  parentType: 'customer',
                  accountPrimaryKey: record.data.accountPrimaryKey,
                  cashDeskPrimaryKey: '-1',
                  amount: record.data.type === 'sales' ? record.data.totalPriceWithTax * -1 : record.data.totalPriceWithTax,
                  amountType: record.data.type === 'sales' ? 'debit' : 'credit',
                  insertDate: record.data.insertDate
                };
                this.db.collection('tblAccountTransaction').doc(trans.primaryKey)
                  .set(Object.assign({}, trans))
                  .then(() => {
                    console.log(record);
                  });
              });
            }
          });
      });
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
      }
      this.generateCharts();
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
  }

  btnMainFilter_Click(): void {
    if (isNullOrEmpty(this.filterBeginDate)) {
      this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
    } else if (isNullOrEmpty(this.filterFinishDate)) {
      this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
    } else {
      this.populateList();
      this.generateCharts();
    }
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'cashdeskVoucher');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  onChangeVoucherType(record: any): void {
    if (record === 'open') { this.selectedRecord.data.secondCashDeskPrimaryKey = '-1'; }
  }

  clearSelectedRecord(): void {
    this.isRecordHasTransaction = false;
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterStatus = '-1';
  }

  format_amount($event): void {
    this.selectedRecord.data.amount = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedRecord.data.amount === 0) {
      this.selectedRecord.data.amount = null;
      this.selectedRecord.amountFormatted = null;
    }
  }
}
