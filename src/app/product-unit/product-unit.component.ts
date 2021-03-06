import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {
  getEncryptionKey,
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import * as CryptoJS from 'crypto-js';
import {ProductUnitService} from '../services/product-unit.service';
import {ProductUnitMainModel} from '../models/product-unit-main-model';
import {ProductUnitModel} from '../models/product-unit-model';
import {ProductUnitMappingMainModel} from '../models/product-unit-mapping-main-model';
import {ProductUnitMappingService} from '../services/product-unit-mapping.service';
import {ProductSelectComponent} from '../partials/product-select/product-select.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExcelImportComponent} from '../partials/excel-import/excel-import.component';
import { ToastService } from '../services/toast.service';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-unit',
  templateUrl: './product-unit.component.html',
  styleUrls: ['./product-unit.component.css']
})
export class ProductUnitComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<ProductUnitMainModel>;
  collection: AngularFirestoreCollection<ProductUnitModel>;
  unitMappingList$: Subscription;
  unitMappingList: Array<ProductUnitMappingMainModel>;
  selectedRecord: ProductUnitMainModel;
  selectedMapping: ProductUnitMappingMainModel;
  encryptSecretKey: string = getEncryptionKey();
  onTransaction = false;
  searchText: '';
  productSearchText: '';
  isNewPanelOpened = false;

  constructor(public authService: AuthenticationService, public service: ProductUnitService, public infoService: InformationService,
              public route: Router, public router: ActivatedRoute, public excelService: ExcelService, public db: AngularFirestore,
              protected pumService: ProductUnitMappingService, public modalService: NgbModal, protected toastService: ToastService) {
  }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
    this.selectedMapping = undefined;

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
    if (this.unitMappingList$ !== undefined) {
      this.unitMappingList$.unsubscribe();
    }
  }

  populateList(): void {
    this.mainList = undefined;
    this.mainList$ = this.service.getMainItems().subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProductUnitMainModel;
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
    this.unitMappingList = undefined;
    this.unitMappingList$ = this.pumService.getUnitProducts(this.selectedRecord.data.primaryKey).subscribe(list => {
      if (this.unitMappingList === undefined) {
        this.unitMappingList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProductUnitMappingMainModel;
        if (item.actionType === 'added' && this.unitMappingList.indexOf(item) < 0) {
          this.unitMappingList.push(item);
        }
        if (item.actionType === 'removed') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.unitMappingList.length; i++) {
            if (item.data.primaryKey === this.unitMappingList[i].data.primaryKey) {
              this.unitMappingList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.unitMappingList.length; i++) {
            if (item.data.primaryKey === this.unitMappingList[i].data.primaryKey) {
              this.unitMappingList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.unitMappingList === undefined) {
        this.unitMappingList = [];
      }
    }, 1000);
  }

  showSelectedRecord(): void {
    this.isNewPanelOpened = false;
  }

  mainListItem_Click(record: any): void {
    this.selectedRecord = record as ProductUnitMainModel;
    this.showSelectedRecord();
    this.populateDetailList();
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null, true);
      await this.route.navigate(['product-unit', {}]);
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
        .then(async () => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.finishProcess(null, 'Kay??t ba??ar??yla kaydedildi.', false);
                this.populateDetailList();
              })
              .catch((error) => {
                this.finishProcess(error, null, false);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Kay??t ba??ar??yla g??ncellendi.', false);
              })
              .catch((error) => {
                this.finishProcess(error, null, false);
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
              this.finishProcess(null, '??r??n birim ba??ar??yla kald??r??ld??.', true);
            })
            .catch((error) => {
              this.finishProcess(error, null, true);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null, true);
        });
    } catch (error) {
      await this.finishProcess(error, null, false);
    }
  }

  showSelectedProduct(record: any): void {
    this.selectedMapping = record as ProductUnitMappingMainModel;
    this.isNewPanelOpened = true;
  }

  async btnNewProduct_Click(): Promise<void> {
    try {
      this.isNewPanelOpened = true;
      this.selectedMapping = this.pumService.clearMainModel();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSaveProduct_Click(): Promise<void> {
    try {
      this.onTransaction = true;

      Promise.all([this.pumService.checkForSave(this.selectedMapping)])
        .then(async () => {
          this.selectedMapping.data.unitPrimaryKey = this.selectedRecord.data.primaryKey;
          this.selectedMapping.data.productPrimaryKey = this.selectedMapping.product.data.primaryKey;
          if (this.selectedMapping.data.primaryKey === null) {

            let isAvailable = false;
            await this.unitMappingList.forEach(item => {
              if (item.product.data.primaryKey === this.selectedMapping.data.productPrimaryKey) {
                this.finishProcess('??r??n listede mevcut oldu??undan yeniden eklenemez.', null, false);
                isAvailable = true;
              }
            });

            if (!isAvailable) {
              this.selectedMapping.data.primaryKey = this.db.createId();
              await this.pumService.setItem(this.selectedMapping, this.selectedMapping.data.primaryKey)
                .then(() => {
                  this.clearSelectedProductRecord();
                  this.finishProcess(null, '??r??n ba??ar??yla eklendi.', false);
                })
                .catch((error) => {
                  this.finishProcess(error, null, false);
                });
            }
          } else {
            await this.pumService.updateItem(this.selectedMapping)
              .then(() => {
                this.clearSelectedProductRecord();
                this.finishProcess(null, '??r??n ba??ar??yla g??ncellendi.', false);
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
      Promise.all([this.pumService.checkForRemove(this.selectedMapping)])
        .then(async () => {
          await this.pumService.removeItem(this.selectedMapping)
            .then(() => {
              this.clearSelectedProductRecord();
              this.finishProcess(null, '??r??n e??le??mesi ba??ar??yla kald??r??ld??.', false);
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

  async btnSelectProduct_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(ProductSelectComponent, {size: 'lg'});
      modalRef.componentInstance.product = this.selectedMapping.product;
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedMapping.product = result;
        }
      }, () => {});
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

  async btnExportToExcel_Click(): Promise<void> {
    try {
      if (this.unitMappingList.length > 0) {
        console.log(this.unitMappingList);
        this.excelService.exportToExcel(this.unitMappingList, 'product-unit');
      } else {
        this.infoService.success('Aktar??lacak kay??t bulunamad??.');
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

  async btnRemoveAllProducts_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.unitMappingList.forEach(item => {
        this.db.firestore.collection('tblProductUnitMapping').doc(item.data.primaryKey).delete();
      });
      await this.finishProcess(null, '??r??n birim e??le??mesi ba??ar??yla kald??r??ld??.', false);

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

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.isNewPanelOpened = false;
    this.unitMappingList = [];
  }

  clearSelectedProductRecord(): void {
    this.isNewPanelOpened = false;
    this.selectedMapping = undefined;
  }

}
