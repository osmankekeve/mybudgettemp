import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {
  currencyFormat,
  getBeginOfYearForInput, getDateForInput,
  getEncryptionKey,
  getFloat, getInputDataForInsert,
  getTodayForInput,
  isNullOrEmpty,
  moneyFormat
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import * as CryptoJS from 'crypto-js';
import {PriceListMainModel} from '../models/price-list-main-model';
import {PriceListService} from '../services/price-list.service';
import {ProductPriceMainModel} from '../models/product-price-main-model';
import {ProductPriceService} from '../services/product-price.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductSelectComponent} from '../partials/product-select/product-select.component';
import {ProductMainModel} from '../models/product-main-model';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  styleUrls: ['./price-list.component.css']
})
export class PriceListComponent implements OnInit, OnDestroy {
  mainList: Array<PriceListMainModel>;
  selectedRecord: PriceListMainModel;
  selectedProductPrice: ProductPriceMainModel;
  productsOnList: Array<ProductPriceMainModel>;
  encryptSecretKey: string = getEncryptionKey();
  isMainFilterOpened = false;
  onTransaction = false;
  searchText: '';
  recordBeginDate: any;
  recordFinishDate: any;
  isNewPricePanelOpened = false;

  constructor(protected authService: AuthenticationService, protected service: PriceListService, protected infoService: InformationService,
              protected route: Router, protected router: ActivatedRoute, protected excelService: ExcelService,
              protected db: AngularFirestore, protected ppService: ProductPriceService, public modalService: NgbModal) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.selectedRecord = undefined;
    this.selectedProductPrice = null;

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

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as PriceListMainModel;
    this.recordBeginDate = getDateForInput(this.selectedRecord.data.beginDate);
    this.recordFinishDate = getDateForInput(this.selectedRecord.data.finishDate);
    this.isNewPricePanelOpened = false;

    this.productsOnList = undefined;
    this.ppService.getProductsOnList(this.selectedRecord.data.primaryKey).subscribe(list => {
      list.forEach((data: any) => {
        if (this.productsOnList === undefined) {
          this.productsOnList = [];
        }
        const item = data.returnData as ProductPriceMainModel;
        if (item.actionType === 'added') {
          this.productsOnList.push(item);
        }
        if (item.actionType === 'removed') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.productsOnList[i].data.primaryKey) {
              this.productsOnList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.productsOnList.length; i++) {
            if (item.data.primaryKey === this.productsOnList[i].data.primaryKey) {
              this.productsOnList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.productsOnList === undefined) {
        this.productsOnList = [];
      }
    }, 2000);
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null);
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
              this.finishProcess(null, 'Ürün başarıyla kaldırıldı.');
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

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
      }
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
      this.infoService.error('yazıllmadı');
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExportToExcel_Click(): Promise<void> {
    try {
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.mainList, 'price-list');
      } else {
        this.infoService.success('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSelectProduct_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(ProductSelectComponent);
      modalRef.componentInstance.product = 'Osman KEKEVE';
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedProductPrice.product = result.data;
        }
      });

    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNewProduct_Click(): Promise<void> {
    try {
      this.isNewPricePanelOpened = true;
      this.selectedProductPrice = this.ppService.clearMainModel();
      /*const modalRef = this.modalService.open(ProductSelectComponent);
      modalRef.componentInstance.product = 'Osman KEKEVE';
      modalRef.result.then((result: any) => {
        if (result) {
          console.log('PL: ' + result);
        }
      });*/

    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSaveProduct_Click(): Promise<void> {
    try {







      
      this.clearSelectedProductRecord();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveProduct_Click(): Promise<void> {
    try {
      this.clearSelectedProductRecord();
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

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.recordBeginDate = getTodayForInput();
    this.recordFinishDate = getTodayForInput();
    this.isNewPricePanelOpened = false;
  }

  clearSelectedProductRecord(): void {
    this.isNewPricePanelOpened = false;
    this.selectedProductPrice = null;
  }

  clearMainFiler(): void {

  }
}
