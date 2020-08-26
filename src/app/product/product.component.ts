import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {CashDeskModel} from '../models/cash-desk-model';
import {CashDeskService} from '../services/cash-desk.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {
  currencyFormat,
  getBeginOfYearForInput,
  getEncryptionKey,
  getFloat,
  getTodayForInput,
  isNullOrEmpty,
  moneyFormat
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {Chart} from 'chart.js';
import {GlobalService} from '../services/global.service';
import {RouterModel} from '../models/router-model';
import * as CryptoJS from 'crypto-js';
import {ProductMainModel} from '../models/product-main-model';
import {ProductModel} from '../models/product-model';
import {ProductService} from '../services/product.service';
import {ActionMainModel} from '../models/action-main-model';
import {CustomerAccountService} from '../services/customer-account.service';
import {ActionService} from '../services/action.service';
import {FileUploadService} from '../services/file-upload.service';
import {GlobalUploadService} from '../services/global-upload.service';
import {FileMainModel} from '../models/file-main-model';
import {ProductUnitMainModel} from '../models/product-unit-main-model';
import {ProductUnitService} from '../services/product-unit.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {PurchaseInvoiceService} from '../services/purchase-invoice.service';
import {SettingService} from '../services/setting.service';
import {ProductUnitMappingService} from '../services/product-unit-mapping.service';
import {ProfileMainModel} from '../models/profile-main-model';
import {ProductUnitMappingModel} from '../models/product-unit-mapping-model';
import {ProductUnitMappingMainModel} from '../models/product-unit-mapping-main-model';
import {CollectionMainModel} from '../models/collection-main-model';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit, OnDestroy {
  mainList: Array<ProductMainModel>;
  collection: AngularFirestoreCollection<ProductModel>;
  actionList: Array<ActionMainModel>;
  filesList: Array<FileMainModel>;
  unitList: Array<ProductUnitModel>;
  unitMappingList: Array<ProductUnitMappingMainModel>;
  selectedRecord: ProductMainModel;
  encryptSecretKey: string = getEncryptionKey();
  isMainFilterOpened = false;
  onTransaction = false;
  searchText: '';

  constructor(public authService: AuthenticationService, public service: ProductService, public infoService: InformationService,
              public route: Router, public router: ActivatedRoute, public excelService: ExcelService, public db: AngularFirestore,
              protected globService: GlobalService, protected actService: ActionService, protected fuService: FileUploadService,
              protected gfuService: GlobalUploadService, protected puService: ProductUnitService, protected sService: SettingService,
              protected pumService: ProductUnitMappingService) {
  }

  async ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    await this.populateUnits();
    this.selectedRecord = undefined;

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
  }

  async populateUnits(): Promise<void> {
    this.unitList = [];
    const units = await this.puService.getItemsForSelect();
    units.forEach(item => {
      this.unitList.push(item);
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as ProductMainModel;
    this.populateUnitMappings();
    this.populateFiles();
    this.populateActions();
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null);
      await this.route.navigate(['product', {}]);
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
      const receiptNoData = await this.sService.getProductCode();
      if (receiptNoData !== null) {
        this.selectedRecord.data.productCode = receiptNoData;
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
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

  async btnCreateUnitMappings_Click(): Promise<void> {
    try {
      this.onTransaction = true;

      Promise.all([this.puService.getItemsForSelect()])
        .then(async (values: any) => {
          if (values[0] !== null) {
            const returnData = values[0] as Array<ProductUnitModel>;
            for (const recordUnit of returnData) {
              const controlData = await this.pumService.isProductHasUnitMapping(this.selectedRecord.data.primaryKey, recordUnit.primaryKey);
              if (!controlData) {
                const newData = this.pumService.clearMainModel();
                newData.data.primaryKey = this.db.createId();
                newData.data.unitPrimaryKey = recordUnit.primaryKey;
                newData.data.unitValue = 1;
                newData.data.productPrimaryKey = this.selectedRecord.data.primaryKey;
                newData.product = this.selectedRecord;
                await this.pumService.setItem(newData, newData.data.primaryKey);
              }
            }
            await this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Birimler Başarıyla oluşturuldu.');
          }
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
        this.excelService.exportToExcel(this.mainList, 'product');
      } else {
        this.infoService.success('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveFile_Click(item: FileMainModel): Promise<void> {
    try {
      await this.fuService.removeItem(item).then(() => {
        this.infoService.success('Dosya başarıyla kaldırıldı.');
      });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  populateUnitMappings(): void {
    this.unitMappingList = undefined;
    /*Promise.all([this.pumService.getProductMappingItemsAsync(this.selectedRecord.data.primaryKey)])
      .then((values: any) => {
        if (values[0] !== null) {
          if (this.unitMappingList === undefined) {
            this.unitMappingList = [];
          }
          const returnData = values[0] as Array<ProductUnitMappingMainModel>;
          console.log(returnData);
          returnData.forEach(record => {
            this.unitMappingList.push(record);
          });
        }
      });*/

    this.pumService.getProductMainItems(this.selectedRecord.data.primaryKey).subscribe(list => {
      if (this.unitMappingList === undefined) {
        this.unitMappingList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProductUnitMappingMainModel;
        if (item.actionType === 'added') {
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

  populateFiles(): void {
    this.filesList = undefined;
    this.fuService.getMainItemsWithPrimaryKey(this.selectedRecord.data.primaryKey)
      .subscribe(list => {
        if (this.filesList === undefined) {
          this.filesList = [];
        }
        list.forEach((data: any) => {
          const item = data.returnData as FileMainModel;
          if (item.actionType === 'added') {
            this.filesList.push(item);
          }
          if (item.actionType === 'removed') {
            for (let i = 0; i < this.filesList.length; i++) {
              if (item.data.primaryKey === this.filesList[i].data.primaryKey) {
                this.filesList.splice(i, 1);
              }
            }
          }
        });
      });
    setTimeout(() => {
      if (this.filesList === undefined) {
        this.filesList = [];
      }
    }, 1000);
  }

  populateActions(): void {
    this.actionList = undefined;
    this.actService.getActions(this.service.tableName, this.selectedRecord.data.primaryKey).subscribe((list) => {
      if (this.actionList === undefined) {
        this.actionList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ActionMainModel;
        if (item.actionType === 'added') {
          this.actionList.push(item);
        }
      });
    });
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {

  }

  format_amount($event): void {
    this.selectedRecord.data.sctAmount = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.sctAmountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedRecord.data.sctAmount === 0) {
      this.selectedRecord.data.sctAmount = null;
      this.selectedRecord.sctAmountFormatted = null;
    }
  }
}
