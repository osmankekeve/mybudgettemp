import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
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
import {ExcelImportComponent} from '../partials/excel-import/excel-import.component';
import { ToastService } from '../services/toast.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  styleUrls: ['./price-list.component.css']
})
export class PriceListComponent implements OnInit {
  mainList: Array<PriceListMainModel>;
  selectedRecord: PriceListMainModel;
  selectedProductPrice: ProductPriceMainModel;
  productsOnList: Array<ProductPriceMainModel>;
  encryptSecretKey: string = getEncryptionKey();
  isMainFilterOpened = false;
  onTransaction = false;
  searchText: '';
  productSearchText: '';
  recordBeginDate: any;
  recordFinishDate: any;
  isNewPricePanelOpened = false;

  constructor(protected authService: AuthenticationService, protected service: PriceListService, protected infoService: InformationService,
              protected route: Router, protected router: ActivatedRoute, protected excelService: ExcelService, protected toastService: ToastService,
              protected db: AngularFirestore, protected ppService: ProductPriceService, public modalService: NgbModal) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.selectedRecord = undefined;
    this.selectedProductPrice = undefined;

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.mainListItem_Click(paramItem.returnData);
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

  populateDetailList(): void {
    this.productsOnList = undefined;
    this.ppService.getProductsOnList(this.selectedRecord.data.primaryKey).subscribe(list => {
      if (this.productsOnList === undefined) {
        this.productsOnList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProductPriceMainModel;
        if (item.actionType === 'added' && this.productsOnList.indexOf(item) < 0) {
          this.productsOnList.push(item);
        }
        if (item.actionType === 'removed') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.productsOnList.length; i++) {
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
    }, 1000);
  }

  showSelectedRecord(): void {
    this.recordBeginDate = getDateForInput(this.selectedRecord.data.beginDate);
    this.recordFinishDate = getDateForInput(this.selectedRecord.data.finishDate);
    this.isNewPricePanelOpened = false;
  }

  mainListItem_Click(record: any): void {
    this.selectedRecord = record as PriceListMainModel;
    this.showSelectedRecord();
    this.populateDetailList();
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
                this.finishProcess(null, 'Kayıt başarıyla kaydedildi.', false);
                this.populateDetailList();
              })
              .catch((error) => {
                this.finishProcess(error, null, true);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Kayıt başarıyla güncellendi.', false);
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
              this.finishProcess(null, 'Liste başarıyla kaldırıldı.', true);
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

  async finishProcess(error: any, info: any, returnMainList: boolean): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
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

  async btnSelectProduct_Click(): Promise<void> {
    try {

      const modalRef = this.modalService.open(ProductSelectComponent, {size: 'lg'});
      modalRef.componentInstance.product = this.selectedProductPrice.product;
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
          this.selectedProductPrice.product = result;
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNewProduct_Click(): Promise<void> {
    try {
      this.isNewPricePanelOpened = true;
      this.selectedProductPrice = this.ppService.clearMainModel();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSaveProduct_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedProductPrice.data.priceListPrimaryKey = this.selectedRecord.data.primaryKey;
      this.selectedProductPrice.data.productPrimaryKey = this.selectedProductPrice.product.data.primaryKey;
      Promise.all([this.ppService.checkForSave(this.selectedProductPrice)])
        .then(async (values: any) => {
          if (this.selectedProductPrice.data.primaryKey === null) {

            let isAvailable = false;
            await this.productsOnList.forEach(item => {
              if (item.product.data.primaryKey === this.selectedProductPrice.data.productPrimaryKey) {
                this.finishProcess('Ürün listede mevcut olduğundan yeniden eklenemez.', null, false);
                isAvailable = true;
              }
            });

            if (!isAvailable) {
              this.selectedProductPrice.data.primaryKey = this.db.createId();
              await this.ppService.setItem(this.selectedProductPrice, this.selectedProductPrice.data.primaryKey)
                .then(() => {
                  this.clearSelectedProductRecord();
                  this.finishProcess(null, 'Ürün başarıyla eklendi.', false);
                })
                .catch((error) => {
                  this.finishProcess(error, null, false);
                });
            }
          } else {
            await this.ppService.updateItem(this.selectedProductPrice)
              .then(() => {
                this.clearSelectedProductRecord();
                this.finishProcess(null, 'Ürün başarıyla güncellendi.', false);
              })
              .catch((error) => {
                this.finishProcess(error, null, false);
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null, false);
        });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveProduct_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.ppService.checkForRemove(this.selectedProductPrice)])
        .then(async (values: any) => {
          await this.ppService.removeItem(this.selectedProductPrice)
            .then(() => {
              this.clearSelectedProductRecord();
              this.finishProcess(null, 'Ürün başarıyla kaldırıldı.', false);
            })
            .catch((error) => {
              this.finishProcess(error, null, false);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null, false);
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
      if (this.productsOnList.length > 0) {
        this.excelService.exportToExcel(this.productsOnList, 'product-prices');
      } else {
        this.toastService.info('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExcelImport_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(ExcelImportComponent, {size: 'lg'});
      modalRef.componentInstance.inputData = this.selectedRecord.data.primaryKey;
      modalRef.result.then((result: any) => {
        if (result) {
          console.log(result);
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveAllProducts_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      await this.ppService.getProductsForListDetail(this.selectedRecord.data.primaryKey)
            .then((list) => {
              list.forEach(async item => {
                await this.db.collection(this.ppService.tableName).doc(item.data.primaryKey).delete();
              });
            });
      await this.finishProcess(null, 'Ürün fiyatları başarıyla kaldırıldı.', false);

    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSubShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedProductPrice, null, 2));
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

  showSelectedProduct(record: any): void {
    this.selectedProductPrice = record as ProductPriceMainModel;
    this.isNewPricePanelOpened = true;
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.recordBeginDate = getTodayForInput();
    this.recordFinishDate = getTodayForInput();
    this.isNewPricePanelOpened = false;
    this.productsOnList = [];
  }

  clearSelectedProductRecord(): void {
    this.isNewPricePanelOpened = false;
    this.selectedProductPrice = undefined;
  }

  clearMainFiler(): void {

  }

  format_amount($event): void {
    this.selectedProductPrice.data.productPrice = getFloat(moneyFormat($event.target.value));
    this.selectedProductPrice.priceFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedProductPrice.data.productPrice === 0) {
      this.selectedProductPrice.data.productPrice = null;
      this.selectedProductPrice.priceFormatted = null;
    }
  }
}
