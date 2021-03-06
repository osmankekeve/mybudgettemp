import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import {
  currencyFormat,
  getBeginOfYearForInput, getDateForInput,
  getEncryptionKey,
  getFloat, getInputDataForInsert,
  getTodayForInput,
  isNullOrEmpty,
  moneyFormat
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import { Router, ActivatedRoute } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { PriceListMainModel } from '../models/price-list-main-model';
import { PriceListService } from '../services/price-list.service';
import { ProductPriceMainModel } from '../models/product-price-main-model';
import { ProductPriceService } from '../services/product-price.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductSelectComponent } from '../partials/product-select/product-select.component';
import { ExcelImportComponent } from '../partials/excel-import/excel-import.component';
import { ToastService } from '../services/toast.service';
import { Observable } from 'rxjs/Observable';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { Subscription } from 'rxjs';
import { RefrasherService } from '../services/refrasher.service';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  styleUrls: ['./price-list.component.css']
})
export class PriceListComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<PriceListMainModel>;
  selectedRecord: PriceListMainModel;
  selectedDetail: ProductPriceMainModel;
  encryptSecretKey: string = getEncryptionKey();
  onTransaction = false;
  searchText: '';
  productSearchText: '';
  recordBeginDate: any;
  recordFinishDate: any;
  isNewPricePanelOpened = false;
  companySubscription: Subscription;

  constructor(protected authService: AuthenticationService, protected service: PriceListService, protected infoService: InformationService,
              protected route: Router, protected router: ActivatedRoute, protected excelService: ExcelService, protected toastService: ToastService,
              protected db: AngularFirestore, protected ppService: ProductPriceService, public modalService: NgbModal, protected refService: RefrasherService) {
                this.refService.priceListDetailUpdate.subscribe(() => { this.populateDetails(); });
  }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
    this.selectedDetail = undefined;

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.mainListItem_Click(paramItem.returnData);
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
    this.mainList$ = this.service.getMainItems().subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as PriceListMainModel;
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

  async populateDetails(): Promise<void> {
    this.selectedRecord.productList = undefined;
    await this.ppService.getProductsForListDetail(this.selectedRecord.data.primaryKey)
      .then((list) => {
        this.selectedRecord.productList = [];
        this.selectedRecord.productList = list;
      });
  }

  async mainListItem_Click(record: any): Promise<void> {
    this.selectedRecord = record as PriceListMainModel;
    this.recordBeginDate = getDateForInput(this.selectedRecord.data.beginDate);
    this.recordFinishDate = getDateForInput(this.selectedRecord.data.finishDate);
    this.isNewPricePanelOpened = false;
    this.populateDetails();
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null, true);
      await this.route.navigate(['price-list', {}]);
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
          this.selectedRecord.data.beginDate = getInputDataForInsert(this.recordBeginDate);
          this.selectedRecord.data.finishDate = getInputDataForInsert(this.recordFinishDate);
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.finishProcess(null, 'Kay??t ba??ar??yla kaydedildi.', false);
              })
              .catch((error) => {
                this.finishProcess(error, null, true);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Kay??t ba??ar??yla g??ncellendi.', false);
              })
              .catch((error) => {
                this.finishProcess(error, null, true);
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null, true);
        });
    } catch (error) {
      await this.finishProcess(error, null, true);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async () => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Liste ba??ar??yla kald??r??ld??.', true);
            })
            .catch((error) => {
              this.finishProcess(error, null, true);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null, true);
        });
    } catch (error) {
      await this.finishProcess(error, null, true);
    }
  }

  async onChangeType() {
    try {
      this.selectedRecord.productList = [];
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async finishProcess(error: any, info: any, returnMainList: boolean): Promise<void> {
    // error.message sistem hatas??
    // error kontrol hatas??
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info);
      }
      if (returnMainList) {
        this.clearSelectedRecord();
        this.selectedRecord = undefined;
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  async finishSubProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatas??
    // error kontrol hatas??
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info, true);
        this.clearSelectedProductRecord();
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  async btnSelectProduct_Click(): Promise<void> {
    try {

      const modalRef = this.modalService.open(ProductSelectComponent, { size: 'lg' });
      modalRef.componentInstance.product = this.selectedDetail.product;
      modalRef.componentInstance.productStockTypes = ['normal', 'service'];
      switch (this.selectedRecord.data.type) {
        case 'sales': {
          modalRef.componentInstance.productTypes = ['sale', 'buy-sale'];
          break;
        }
        case 'purchase': {
          modalRef.componentInstance.productTypes = ['buy', 'buy-sale'];
          break;
        }
        default: {
          modalRef.componentInstance.productTypes = [];
          break;
        }
      }
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedDetail.product = result;
          this.selectedDetail.data.productPrimaryKey = this.selectedDetail.product.data.primaryKey;
        }
      }, () => { });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNewProduct_Click(): Promise<void> {
    try {
      this.isNewPricePanelOpened = true;
      this.selectedDetail = this.ppService.clearMainModel();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSaveProduct_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.ppService.checkForSave(this.selectedDetail)])
        .then(async () => {
          if (this.selectedDetail.data.primaryKey == null) {
            let isAvailable = false;
            await this.selectedRecord.productList.forEach(item => {
              if (item.product.data.primaryKey === this.selectedDetail.data.productPrimaryKey) {
                this.finishSubProcess('??r??n listede mevcut oldu??undan yeniden eklenemez.', null);
                isAvailable = true;
              }
            });
            if (!isAvailable) {
              this.selectedDetail.data.primaryKey = this.db.createId();
              this.selectedRecord.productList.push(this.selectedDetail);
              await this.finishSubProcess(null, '??r??n taslak olarak eklendi');
            }
          } else {
            this.selectedRecord.productList.forEach(item => {
              if (item.data.primaryKey === this.selectedDetail.data.primaryKey) {
                this.selectedRecord.productList[this.selectedRecord.productList.indexOf(item)] = this.selectedDetail;
                this.finishSubProcess(null, '??r??n taslak olarak g??ncellendi');
                return;
              }
            });
          }
        })
        .catch((error) => {
          this.finishSubProcess(error, null);
        });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveProduct_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.productList.forEach(item => {
        if (item.data.primaryKey === this.selectedDetail.data.primaryKey) {
          this.selectedRecord.productList.splice(this.selectedRecord.productList.indexOf(item), 1);
          this.finishSubProcess(null, '??r??n taslak olarak kald??r??ld??');
          return;
        }
      });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnOpenList_Click(): Promise<void> {
    try {
      this.clearSelectedProductRecord();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExportToExcel_Click(): Promise<void> {
    try {
      if (this.selectedRecord.productList.length > 0) {
        this.excelService.exportToExcel(this.selectedRecord.productList, 'product-prices');
      } else {
        this.toastService.info('Aktar??lacak kay??t bulunamad??.');
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExcelImport_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(ExcelImportComponent, { size: 'lg' });
      modalRef.componentInstance.inputData = this.selectedRecord.data.primaryKey;
      modalRef.result.then((result: any) => {
        if (result) {
          console.log(result);
        }
      }, () => { });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveAllProducts_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      await this.ppService.getProductsForTransaction(this.selectedRecord.data.primaryKey)
        .then((list) => {
          console.log(list);
          list.forEach(async item => {
            await this.db.collection(this.ppService.tableName).doc(item.primaryKey).delete();
          });
        });
      this.selectedRecord.productList = [];
      await this.finishProcess(null, '??r??n fiyatlar?? ba??ar??yla kald??r??ld??.', false);

    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSubShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedDetail, null, 2));
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

  async btnShowJsonDataDetail_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedDetail, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  showSelectedProduct(record: any): void {
    this.selectedDetail = record as ProductPriceMainModel;
    this.isNewPricePanelOpened = true;
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.recordBeginDate = getTodayForInput();
    this.recordFinishDate = getTodayForInput();
    this.isNewPricePanelOpened = false;
    this.selectedRecord.productList = [];
  }

  clearSelectedProductRecord(): void {
    this.isNewPricePanelOpened = false;
    this.selectedDetail = undefined;
  }

  format_amount($event): void {
    this.selectedDetail.data.productPrice = getFloat(moneyFormat($event.target.value));
    this.selectedDetail.priceFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedDetail.data.productPrice === 0) {
      this.selectedDetail.data.productPrice = null;
      this.selectedDetail.priceFormatted = null;
    }
  }
}
