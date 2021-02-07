import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';
import {BuySaleService} from '../services/buy-sale.service';
import {BuySaleMainModel} from '../models/buy-sale-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {CashDeskService} from '../services/cash-desk.service';
import {BuySaleCurrencyMainModel} from '../models/buy-sale-currency-main-model';
import {BuySaleCurrencyService} from '../services/buy-sale-currency.service';
import {
  currencyFormat,
  getDateForInput,
  getEncryptionKey,
  getFloat,
  getInputDataForInsert,
  getTodayForInput,
  moneyFormat
} from '../core/correct-library';
import {AccountTransactionService} from '../services/account-transaction.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-buy-sale',
  templateUrl: './buy-sale.component.html',
  styleUrls: ['./buy-sale.component.css']
})
export class BuySaleComponent implements OnInit {
  mainList: Array<BuySaleMainModel>;
  cashDeskList$: Observable<CashDeskMainModel[]>;
  currencyList$: Observable<BuySaleCurrencyMainModel[]>;
  selectedRecord: BuySaleMainModel;
  searchText: '';
  onTransaction = false;
  recordDate: any;
  isRecordHasTransaction = false;
  encryptSecretKey: string = getEncryptionKey();

  constructor(protected authService: AuthenticationService, protected service: BuySaleService, protected globService: GlobalService,
              protected infoService: InformationService, protected excelService: ExcelService, protected db: AngularFirestore,
              protected route: Router, protected cdService: CashDeskService, protected cscService: BuySaleCurrencyService,
              protected atService: AccountTransactionService, protected router: ActivatedRoute) {
  }

  async ngOnInit() {
    this.cashDeskList$ = this.cdService.getMainItems();
    this.currencyList$ = this.cscService.getMainItems();
    this.selectedRecord = undefined;
    this.populateList();
    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        await this.showSelectedRecord(paramItem);
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
        // this.generateCharts();
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
    this.service.getMainItems(null).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as BuySaleMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
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

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as BuySaleMainModel;
    this.recordDate = getDateForInput(this.selectedRecord.data.recordDate);
    this.atService.getRecordTransactionItems(this.selectedRecord.data.primaryKey).subscribe(list => {
      this.isRecordHasTransaction = list.length > 0;
    });
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      const previousModule = this.router.snapshot.paramMap.get('previousModule');
      const previousModulePrimaryKey = this.router.snapshot.paramMap.get('previousModulePrimaryKey');

      if (previousModule !== null && previousModulePrimaryKey !== null) {
        await this.globService.returnPreviousModule(this.router);
      } else {
        await this.finishProcess(null, null);
        await this.route.navigate(['buy-sale', {}]);
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.recordDate = getInputDataForInsert(this.recordDate);
      this.selectedRecord.data.unitValue = getFloat(this.selectedRecord.data.unitValue);
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          this.onTransaction = true;
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.finishProcess(null, 'Döviz işlemi başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              })
              .finally(() => {
                this.finishFinally();
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Döviz işlemi başarıyla güncellendi.');
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

  async btnApprove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.status = 'approved';
      this.selectedRecord.data.approveByPrimaryKey = this.authService.getEid();
      this.selectedRecord.data.approveDate = Date.now();
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla onaylandı.');
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

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Hatırlatma başarıyla kaldırıldı.');
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
      await this.finishProcess(error, null);
    }
  }

  async showTransactionRecord(item: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = 'buy-sale-transaction';
    r.nextModulePrimaryKey = item.returnData.data.primaryKey;
    r.previousModule = 'buy-sale';
    r.previousModulePrimaryKey = this.selectedRecord.data.primaryKey;
    await this.globService.showTransactionRecord(r);
  }

  async btnExportToExcel_Click(): Promise<void> {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'buy-sale');
    } else {
      await this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.recordDate = getTodayForInput();
  }

  finishFinally(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
      }
      // this.generateCharts();
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  format_amount($event): void {
    this.selectedRecord.data.unitAmount = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedRecord.data.unitAmount === 0) {
      this.selectedRecord.data.unitAmount = null;
      this.selectedRecord.amountFormatted = null;
    }
  }

  format_total_amount($event): void {
    this.selectedRecord.data.totalAmount = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.totalAmountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_total_amount(): void {
    if (this.selectedRecord.data.totalAmount === 0) {
      this.selectedRecord.data.totalAmount = null;
      this.selectedRecord.totalAmountFormatted = null;
    }
  }

}
