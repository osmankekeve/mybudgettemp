import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {CollectionMainModel} from '../models/collection-main-model';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';
import {BuySaleService} from '../services/buy-sale.service';
import {BuySaleMainModel} from '../models/buy-sale-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {CollectionService} from '../services/collection.service';
import {CashDeskService} from '../services/cash-desk.service';
import {BuySaleCurrencyMainModel} from '../models/buy-sale-currency-main-model';
import {BuySaleCurrencyService} from '../services/buy-sale-currency.service';
import {currencyFormat, getDateForInput, getFloat, getInputDataForInsert, getTodayForInput, moneyFormat} from '../core/correct-library';

@Component({
  selector: 'app-buy-sale',
  templateUrl: './buy-sale.component.html',
  styleUrls: ['./buy-sale.component.css']
})
export class BuySaleComponent implements OnInit {
  mainList: Array<BuySaleMainModel>;
  transactionList$: Observable<CollectionMainModel[]>;
  cashDeskList$: Observable<CashDeskMainModel[]>;
  currencyList$: Observable<BuySaleCurrencyMainModel[]>;
  selectedRecord: BuySaleMainModel;
  searchText: '';
  onTransaction = false;
  recordDate: any;

  constructor(public authService: AuthenticationService, public service: BuySaleService, public globService: GlobalService,
              public infoService: InformationService, public excelService: ExcelService, public db: AngularFirestore,
              public route: Router, protected cdService: CashDeskService, protected cscService: BuySaleCurrencyService) {
  }

  ngOnInit() {
    this.cashDeskList$ = this.cdService.getMainItems();
    this.currencyList$ = this.cscService.getMainItems();
    this.selectedRecord = undefined;
    this.populateList();
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
  }

  async btnReturnList_Click(): Promise<void> {
    this.selectedRecord = undefined;
    await this.route.navigate(['buy-sale', {}]);
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
      this.selectedRecord.data.recordDate = getInputDataForInsert(this.recordDate);
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          this.onTransaction = true;
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
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

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'note');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
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
