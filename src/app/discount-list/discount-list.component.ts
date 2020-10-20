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
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductSelectComponent} from '../partials/product-select/product-select.component';
import {DiscountListMainModel} from '../models/discount-list-main-model';
import {ProductDiscountMainModel} from '../models/product-discount-main-model';
import {ProductDiscountService} from '../services/product-discount.service';
import {DiscountListService} from '../services/discount-list.service';
import {ExcelImportComponent} from '../partials/excel-import/excel-import.component';

@Component({
  selector: 'app-discount-list',
  templateUrl: './discount-list.component.html',
  styleUrls: ['./discount-list.component.css']
})
export class DiscountListComponent implements OnInit, OnDestroy {
  mainList: Array<DiscountListMainModel>;
  selectedRecord: DiscountListMainModel;
  selectedProductDiscount: ProductDiscountMainModel;
  productsOnList: Array<ProductDiscountMainModel>;
  encryptSecretKey: string = getEncryptionKey();
  isMainFilterOpened = false;
  onTransaction = false;
  searchText: '';
  productSearchText: '';
  recordBeginDate: any;
  recordFinishDate: any;
  isNewDiscountPanelOpened = false;

  constructor(protected authService: AuthenticationService, protected service: DiscountListService,
              protected infoService: InformationService, protected route: Router, protected router: ActivatedRoute,
              protected excelService: ExcelService, protected db: AngularFirestore, protected ppService: ProductDiscountService,
              public modalService: NgbModal) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.selectedRecord = undefined;
    this.selectedProductDiscount = undefined;

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
            this.finishProcess(reason, null, true);
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
        const item = data.returnData as DiscountListMainModel;
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
    this.selectedRecord = record as DiscountListMainModel;
    this.recordBeginDate = getDateForInput(this.selectedRecord.data.beginDate);
    this.recordFinishDate = getDateForInput(this.selectedRecord.data.finishDate);
    this.isNewDiscountPanelOpened = false;

    this.productsOnList = undefined;
    this.ppService.getProductsOnList(this.selectedRecord.data.primaryKey).subscribe(list => {
      if (this.productsOnList === undefined) {
        this.productsOnList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProductDiscountMainModel;
        if (item.actionType === 'added') {
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

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null, true);
      await this.route.navigate(['discount-list', {}]);
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
                this.finishProcess(error, null, true);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla güncellendi.');
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
      if (this.productsOnList.length > 0) {
        await this.finishProcess('Listeye bağlı ürünler olduğundan silinemez', null, true);
      } else {
        Promise.all([this.service.checkForRemove(this.selectedRecord)])
          .then(async (values: any) => {
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
      }
    } catch (error) {
      await this.finishProcess(error, null, true);
    }
  }

  async finishProcess(error: any, info: any, returnMainList: boolean): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
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
      modalRef.componentInstance.product = this.selectedProductDiscount.product;
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedProductDiscount.product = result;
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNewProduct_Click(): Promise<void> {
    try {
      this.isNewDiscountPanelOpened = true;
      this.selectedProductDiscount = this.ppService.clearMainModel();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSaveProduct_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedProductDiscount.data.discountListPrimaryKey = this.selectedRecord.data.primaryKey;
      this.selectedProductDiscount.data.productPrimaryKey = this.selectedProductDiscount.product.data.primaryKey;
      Promise.all([this.ppService.checkForSave(this.selectedProductDiscount)])
        .then(async (values: any) => {
          if (this.selectedProductDiscount.data.primaryKey === null) {

            let isAvailable = false;
            await this.productsOnList.forEach(item => {
              if (item.product.data.primaryKey === this.selectedProductDiscount.data.productPrimaryKey) {
                this.finishProcess('Ürün listede mevcut olduğundan yeniden eklenemez.', null, false);
                isAvailable = true;
              }
            });

            if (!isAvailable) {
              this.selectedProductDiscount.data.primaryKey = this.db.createId();
              await this.ppService.setItem(this.selectedProductDiscount, this.selectedProductDiscount.data.primaryKey)
                .then(() => {
                  this.clearSelectedProductRecord();
                  this.finishProcess(null, 'Ürün başarıyla eklendi.', false);
                })
                .catch((error) => {
                  this.finishProcess(error, null, false);
                });
            }
          } else {
            await this.ppService.updateItem(this.selectedProductDiscount)
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
      Promise.all([this.ppService.checkForRemove(this.selectedProductDiscount)])
        .then(async (values: any) => {
          await this.ppService.removeItem(this.selectedProductDiscount)
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

  async btnExportToExcel_Click(): Promise<void> {
    try {
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.mainList, 'discount-list');
      } else {
        this.infoService.success('Aktarılacak kayıt bulunamadı.');
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
      this.productsOnList.forEach(item => {
        this.db.firestore.collection(this.ppService.tableName).doc(item.data.primaryKey).delete();
      });
      await this.finishProcess(null, 'Ürün iskontoları başarıyla kaldırıldı.', false);

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

  showSelectedProduct(record: any): void {
    this.selectedProductDiscount = record as ProductDiscountMainModel;
    this.isNewDiscountPanelOpened = true;
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.recordBeginDate = getTodayForInput();
    this.recordFinishDate = getTodayForInput();
    this.isNewDiscountPanelOpened = false;
    this.productsOnList = [];
  }

  clearSelectedProductRecord(): void {
    this.isNewDiscountPanelOpened = false;
    this.selectedProductDiscount = undefined;
  }

  clearMainFiler(): void {

  }
}
