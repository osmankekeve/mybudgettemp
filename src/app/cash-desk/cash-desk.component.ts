import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {CashDeskModel} from '../models/cash-desk-model';
import {CashDeskService} from '../services/cash-desk.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import { getBeginOfYearForInput, getEncryptionKey, getFirstDayOfMonthForInput, getFloat, getTodayForInput, isNullOrEmpty } from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {Chart} from 'chart.js';
import {GlobalService} from '../services/global.service';
import {RouterModel} from '../models/router-model';
import * as CryptoJS from 'crypto-js';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AccountTransactionMainModel } from '../models/account-transaction-main-model';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';

@Component({
  selector: 'app-cash-desk',
  templateUrl: './cash-desk.component.html',
  styleUrls: ['./cash-desk.component.css']
})
export class CashDeskComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<CashDeskMainModel>;
  collection: AngularFirestoreCollection<CashDeskModel>;
  transactionList: Array<AccountTransactionMainModel>;
  selectedRecord: CashDeskMainModel;
  totalValues = {
    amount: 0
  };
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
  };
  encryptSecretKey: string = getEncryptionKey();

  date = new Date();
  searchText: '';
  chart1: any;
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: CashDeskService, public globService: GlobalService,
              public atService: AccountTransactionService, public infoService: InformationService, public route: Router,
              public router: ActivatedRoute, public excelService: ExcelService, public db: AngularFirestore, protected modalService: NgbModal) {
  }

  ngOnInit() {
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

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
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

  populateList(): void {
    this.mainList = undefined;
    this.mainList$ = this.service.getMainItems().subscribe(list => {
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
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
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
    r.nextModule = item.data.transactionType;
    r.nextModulePrimaryKey = item.data.transactionPrimaryKey;
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
      const modalRef = this.modalService.open(MainFilterComponent, {size: 'md'});
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.populateTransactions();
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExportToExcel_Click(): Promise<void> {
    try {
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.mainList, 'cash-desk');
      } else {
        this.infoService.success('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExportToExcelTransaction_Click(): Promise<void> {
    try {
      if (this.transactionList.length > 0) {
        this.excelService.exportToExcel(this.transactionList, 'cash-desk-transaction');
      } else {
        this.infoService.success('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowInfoModule_Click(): Promise<void> {
    try {
      this.modalService.open(InfoModuleComponent, {size: 'lg'});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  populateTransactions(): void {
    this.transactionList = undefined;
    this.totalValues = {
      amount: 0
    };
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    let totalCollectionAmount = 0;
    let totalPaymentAmount = 0;
    let totalAccountVoucherAmount = 0;
    let totalCashDeskVoucherAmount = 0;

    Promise.all([this.atService.getCashDeskTransactions(this.selectedRecord.data.primaryKey, beginDate, finishDate),
      this.atService.getSingleCashDeskTransactions(this.selectedRecord.data.primaryKey, beginDate, finishDate)])
      .then((item: any) => {
        this.transactionList = [];
        item[0].forEach((item2: any) => {
          const data = item2 as AccountTransactionMainModel;
          this.transactionList.push(data);
          this.totalValues.amount += data.data.amount;
          if (data.data.transactionType === 'collection') {
            totalCollectionAmount += data.data.amount;
          } else if (data.data.transactionType === 'payment') {
            totalPaymentAmount += data.data.amount;
          } else if (data.data.transactionType === 'accountVoucher') {
            totalAccountVoucherAmount += data.data.amount;
          } else {
            // nothing
          }
        });
        item[1].forEach((item2: any) => {
          const data = item2 as AccountTransactionMainModel;
          this.transactionList.push(data);
          this.totalValues.amount += data.data.amount;
          totalCashDeskVoucherAmount += data.data.amount;
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
    this.totalValues = {
      amount: 0
    };
    this.transactionList = [];
  }
}
