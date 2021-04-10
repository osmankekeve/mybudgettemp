import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {ActivatedRoute, Router} from '@angular/router';
import {BuySaleCurrencyMainModel} from '../models/buy-sale-currency-main-model';
import {BuySaleCurrencyService} from '../services/buy-sale-currency.service';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';
import {BuySaleService} from '../services/buy-sale.service';
import {BuySaleMainModel} from '../models/buy-sale-main-model';
import * as CryptoJS from 'crypto-js';
import { getEncryptionKey, getFirstDayOfMonthForInput, getTodayForInput } from '../core/correct-library';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  encryptSecretKey: string = getEncryptionKey();
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
  };

  constructor(public authService: AuthenticationService, public service: BuySaleCurrencyService, public globService: GlobalService,
              public infoService: InformationService, public excelService: ExcelService, public db: AngularFirestore,
              public route: Router, public bsService: BuySaleService, protected router: ActivatedRoute, protected modalService: NgbModal) {
  }

  async ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        await this.showSelectedRecord(paramItem);
      }
    }
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
    this.selectedRecord = record as BuySaleCurrencyMainModel;
    this.populateTransactions();
  }

  populateTransactions(): void {
    this.transactionList = undefined;
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    Promise.all([this.bsService.getCurrencyTransactions(this.selectedRecord.data.primaryKey, beginDate, finishDate)]).then((values: any) => {
        if (values[0] !== null) {
          const returnData = values[0] as Array<BuySaleMainModel>;
          this.transactionList = [];
          returnData.forEach((item: any) => {
            this.transactionList.push(item);
          });
        }
      });
    setTimeout(() => {
      if (this.transactionList === undefined) {
        this.transactionList = [];
      }
    }, 1000);
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
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Hatırlatma başarıyla güncellendi.');
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
              this.finishProcess(null, 'Hatırlatma başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
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
    r.nextModule = 'buy-sale';
    r.nextModulePrimaryKey = item.data.primaryKey;
    r.previousModule = 'buy-sell-currency';
    r.previousModulePrimaryKey = this.selectedRecord.data.primaryKey;
    await this.globService.showTransactionRecord(r);
  }

  async btnExportToExcel_Click(): Promise<void> {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'currency');
    } else {
      await this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnExportToExcelTransaction_Click(): Promise<void> {
    try {
      if (this.transactionList.length > 0) {
        this.excelService.exportToExcel(this.transactionList, 'buy-sell-currency-transactions');
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

