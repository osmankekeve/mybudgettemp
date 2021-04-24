import { StockService } from './../services/stock.service';
import { StockTransactionService } from './../services/stock-transaction.service';
import { StockTransactionMainModel } from './../models/stock-transaction-main-model';
import { ProductService } from './../services/product.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { getEncryptionKey, getFirstDayOfMonthForInput, getTodayForInput } from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalService } from '../services/global.service';
import { RouterModel } from '../models/router-model';
import * as CryptoJS from 'crypto-js';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AccountTransactionMainModel } from '../models/account-transaction-main-model';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { ProductMainModel } from '../models/product-main-model';
import { StockMainModel } from '../models/stock-main-model';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<ProductMainModel>;
  transactionList: Array<StockTransactionMainModel>;
  selectedRecord: ProductMainModel;
  stockRecord: StockMainModel;
  filter = {
    stockType: '-1',
    isActive: true,
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
  };
  encryptSecretKey: string = getEncryptionKey();

  date = new Date();
  searchText: '';
  onTransaction = false;

  constructor(protected authService: AuthenticationService, protected service: ProductService, protected globService: GlobalService,
              protected stService: StockTransactionService, protected infoService: InformationService, protected route: Router,
              protected router: ActivatedRoute, protected excelService: ExcelService, protected db: AngularFirestore, protected modalService: NgbModal,
              protected psService: StockService) {
  }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
    this.stockRecord = this.psService.clearMainModel();

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

  populateList(): void {
    this.mainList = undefined;
    this.mainList$ = this.service.getMainItems(this.filter.isActive, this.filter.stockType).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProductMainModel;
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

  async showSelectedRecord(record: any): Promise<void> {
    this.selectedRecord = record as ProductMainModel;
    this.populateTransactions();

    const p = await this.psService.getProductStock(this.selectedRecord.data.primaryKey);
    this.stockRecord = p.returnData;
    console.log(this.stockRecord);
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null);
      await this.route.navigate(['product-stock', {}]);
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async showTransactionRecord(item: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = item.data.transactionType;
    r.nextModulePrimaryKey = item.data.transactionPrimaryKey;
    r.previousModule = 'product-stock';
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
      const modalRef = this.modalService.open(MainFilterComponent, { size: 'md' });
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.populateTransactions();
        }
      }, () => { });
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
        this.excelService.exportToExcel(this.transactionList, 'product-stock-transaction');
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
      this.modalService.open(InfoModuleComponent, { size: 'lg' });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  populateTransactions(): void {
    this.transactionList = undefined;
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);

    Promise.all([this.stService.getTransactions(this.selectedRecord.data.primaryKey, beginDate, finishDate)])
      .then((item: any) => {
        this.transactionList = [];
        item[0].forEach((item2: any) => {
          const data = item2 as StockTransactionMainModel;
          this.transactionList.push(data);
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
    this.stockRecord = this.psService.clearMainModel();
    this.transactionList = [];
  }
}
