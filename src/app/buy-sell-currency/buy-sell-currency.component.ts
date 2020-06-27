import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {Router} from '@angular/router';
import {BuySaleCurrencyMainModel} from '../models/buy-sale-currency-main-model';
import {BuySaleCurrencyService} from '../services/buy-sale-currency.service';
import {Observable} from 'rxjs';
import {CollectionMainModel} from '../models/collection-main-model';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';
import {BuySaleService} from '../services/buy-sale.service';
import {BuySaleMainModel} from '../models/buy-sale-main-model';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import {getFloat} from '../core/correct-library';
import {Chart} from 'chart.js';

@Component({
  selector: 'app-buy-sell-currency',
  templateUrl: './buy-sell-currency.component.html',
  styleUrls: ['./buy-sell-currency.component.css']
})
export class BuySellCurrencyComponent implements OnInit {
  mainList: Array<BuySaleCurrencyMainModel>;
  transactionList: Array<BuySaleMainModel>;
  selectedRecord: BuySaleCurrencyMainModel;
  searchText: '';
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: BuySaleCurrencyService, public globService: GlobalService,
              public infoService: InformationService, public excelService: ExcelService, public db: AngularFirestore,
              public route: Router, public bsService: BuySaleService) {
  }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  populateList(): void {
    this.mainList = undefined;
    this.service.getMainItems().subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as BuySaleCurrencyMainModel;
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
    this.transactionList = undefined;
    this.selectedRecord = record as BuySaleCurrencyMainModel;
    if (this.selectedRecord.data.primaryKey != null) {
      Promise.all([this.bsService.getCurrencyTransactions(this.selectedRecord.data.primaryKey)]).then((values: any) => {
          if (values[0] !== undefined || values[0] !== null) {
            const returnData = values[0] as Array<BuySaleMainModel>;
            this.transactionList = [];
            returnData.forEach((item: any) => {
              this.transactionList.push(item);
            });
          }
        }).finally(() => {
          if (this.transactionList === undefined) {this.transactionList = []; }
      });
    } else {
      this.transactionList = [];
    }
  }

  async btnReturnList_Click(): Promise<void> {
    this.selectedRecord = undefined;
    await this.route.navigate(['buy-sell-currency', {}]);
  }

  btnNew_Click(): void {
    try {
      this.clearSelectedRecord();
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          this.onTransaction = true;
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = '';
            await this.service.addItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Hatırlatma başarıyla kaydedildi.');
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
                this.finishProcess(null, 'Hatırlatma başarıyla güncellendi.');
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
      this.finishProcess(error, null);
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
    if (this.transactionList.length > 0) {
      this.excelService.exportToExcel(this.transactionList, 'buy-sell-currency-transactions');
    } else {
      await this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.transactionList = [];
  }

  finishFinally(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }

  finishProcess(error: any, info: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

}
