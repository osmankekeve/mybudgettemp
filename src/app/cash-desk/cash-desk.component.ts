import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {CashDeskModel} from '../models/cash-desk-model';
import {CashDeskService} from '../services/cash-desk.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {
  getBeginOfYear, getBeginOfYearForInput,
  getFirstDayOfMonthForInput,
  getFloat,
  getNumber,
  getTodayForInput,
  isNullOrEmpty,
  padLeft
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {SettingModel} from '../models/setting-model';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {Chart} from 'chart.js';
import {GlobalService} from '../services/global.service';

@Component({
  selector: 'app-cash-desk',
  templateUrl: './cash-desk.component.html',
  styleUrls: ['./cash-desk.component.css']
})
export class CashDeskComponent implements OnInit, OnDestroy {
  mainList: Array<CashDeskMainModel>;
  collection: AngularFirestoreCollection<CashDeskModel>;
  transactionList: Array<AccountTransactionModel>;
  selectedRecord: CashDeskMainModel;
  refModel: CashDeskMainModel;
  isMainFilterOpened = false;
  totalValues = {
    amount: 0
  };

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  searchText: '';
  chart1: any;
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: CashDeskService, public globService: GlobalService,
              public atService: AccountTransactionService, public infoService: InformationService, public route: Router,
              public router: ActivatedRoute, public excelService: ExcelService, public db: AngularFirestore) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as CashDeskMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item;
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CashDeskMainModel;
    this.refModel = record as CashDeskMainModel;
    this.populateTransactions();
  }

  btnReturnList_Click(): void {
    try {
      this.selectedRecord = undefined;
      this.route.navigate(['cash-desk', {}]);
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnNew_Click(): void {
    try {
      this.clearSelectedRecord();
    } catch (error) {
      this.infoService.error(error);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = '';
            await this.service.addItem(this.selectedRecord)
              .then(() => {
                this.finishProcessAndError(null, 'Kasa başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcessAndError(error, null);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcessAndError(null, 'Kasa başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcessAndError(error, null);
              });
          }
        })
        .catch((error) => {
          this.finishProcessAndError(error, null);
        });
    } catch (error) {
      this.finishProcessAndError(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcessAndError(null, 'Kasa başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcessAndError(error, null);
            });
        })
        .catch((error) => {
          this.finishProcessAndError(error, null);
        });
    } catch (error) {
      this.finishProcessAndError(error, null);
    }
  }

  async showTransactionRecord(item: any): Promise<void> {
    await this.globService.showTransactionRecord(item);
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

  btnMainFilter_Click(): void {
    try {
      if (isNullOrEmpty(this.filterBeginDate)) {
        this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
      } else if (isNullOrEmpty(this.filterFinishDate)) {
        this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
      } else {
        this.populateTransactions();
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnExportToExcel_Click(): void {
    try {
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.transactionList, 'cashdeskTransaction');
      } else {
        this.infoService.error('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  populateTransactions(): void {
    this.transactionList = undefined;
    this.totalValues = {
      amount: 0
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    let totalCollectionAmount = 0;
    let totalPaymentAmount = 0;
    let totalAccountVoucherAmount = 0;
    let totalCashDeskVoucherAmount = 0;

    Promise.all([this.atService.getCashDeskTransactions(this.selectedRecord.data.primaryKey, beginDate, finishDate),
      this.atService.getSingleCashDeskTransactions(this.selectedRecord.data.primaryKey, beginDate, finishDate)])
      .then((item: any) => {
        this.transactionList = [];
        item[0].forEach((data: any) => {
          this.transactionList.push(data);
          this.totalValues.amount += data.amount;
          if (data.transactionType === 'collection') {
            totalCollectionAmount += data.amount;
          } else if (data.transactionType === 'payment') {
            totalPaymentAmount += data.amount;
          } else if (data.transactionType === 'accountVoucher') {
            totalAccountVoucherAmount += data.amount;
          } else {
            // nothing
          }
        });
        item[1].forEach((data: any) => {
          this.transactionList.push(data);
          this.totalValues.amount += data.amount;
          totalCashDeskVoucherAmount += data.amount;
        });
      })
      .finally(() => {
        this.chart1 = new Chart('chart1', {
          type: 'pie', // bar, pie, doughnut
          data: {
            labels: ['Tahsilat', 'Ödeme', 'Cari Fiş', 'Kasa Fişi'],
            datasets: [{
              label: '# of Votes',
              data: [
                getFloat(totalCollectionAmount.toFixed(2)),
                getFloat(totalPaymentAmount.toFixed(2)),
                getFloat(totalAccountVoucherAmount.toFixed(2)),
                getFloat(totalCashDeskVoucherAmount.toFixed(2))
              ],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(153, 102, 255, 0.2)'
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)'
              ],
              borderWidth: 1
            }]
          }
        });
      });
    setTimeout(() => {
      if (this.transactionList === undefined) {
        this.transactionList = [];
      }
    }, 1000);
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getBeginOfYearForInput();
    this.filterFinishDate = getTodayForInput();
  }

  finishProcessAndError(error: any, info: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
    } else {
      this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }
}
