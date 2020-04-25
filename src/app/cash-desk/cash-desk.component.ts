import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {CashDeskModel} from '../models/cash-desk-model';
import {CashDeskService} from '../services/cash-desk.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import { getBeginOfYearForInput, getEncryptionKey, getFloat, getTodayForInput, isNullOrEmpty } from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {Chart} from 'chart.js';
import {GlobalService} from '../services/global.service';
import {RouterModel} from '../models/router-model';
import * as CryptoJS from 'crypto-js';

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
  isMainFilterOpened = false;
  totalValues = {
    amount: 0
  };
  encryptSecretKey: string = getEncryptionKey();

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

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem.returnData);
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
    this.service.getMainItems().subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as CashDeskMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
              break;
            }
          }
        }
      });
    });
  }

  generateCharts(): void {

  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CashDeskMainModel;
    this.populateTransactions();
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null);
      await this.route.navigate(['cash-desk', {}]);
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
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
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla güncellendi.');
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
              this.finishProcess(null, 'Kasa başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async showTransactionRecord(item: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = item.transactionType;
    r.nextModulePrimaryKey = item.transactionPrimaryKey;
    r.previousModule = 'cash-desk';
    r.previousModulePrimaryKey = this.selectedRecord.data.primaryKey;
    await this.globService.showTransactionRecord(r);
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

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      if (this.isMainFilterOpened === true) {
        this.isMainFilterOpened = false;
      } else {
        this.isMainFilterOpened = true;
      }
      this.clearMainFiler();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnMainFilter_Click(): Promise<void> {
    try {
      if (isNullOrEmpty(this.filterBeginDate)) {
        await this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
      } else if (isNullOrEmpty(this.filterFinishDate)) {
        await this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
      } else {
        this.populateTransactions();
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExportToExcel_Click(): Promise<void> {
    try {
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.transactionList, 'cashdeskTransaction');
      } else {
        this.infoService.success('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      await this.infoService.error(error);
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
          },
          options: {
            title: {
              text: 'Cari Hareketler',
              display: true
            }
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
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getBeginOfYearForInput();
    this.filterFinishDate = getTodayForInput();
  }
}
