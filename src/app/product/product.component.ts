import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {
  currencyFormat,
  getEncryptionKey,
  getFloat,
  moneyFormat
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import {GlobalService} from '../services/global.service';
import * as CryptoJS from 'crypto-js';
import {ProductMainModel} from '../models/product-main-model';
import {ProductModel} from '../models/product-model';
import {ProductService} from '../services/product.service';
import {ActionMainModel} from '../models/action-main-model';
import {ActionService} from '../services/action.service';
import {FileUploadService} from '../services/file-upload.service';
import {GlobalUploadService} from '../services/global-upload.service';
import {FileMainModel} from '../models/file-main-model';
import {ProductUnitService} from '../services/product-unit.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {SettingService} from '../services/setting.service';
import {ProductUnitMappingService} from '../services/product-unit-mapping.service';
import {ProductUnitMappingMainModel} from '../models/product-unit-mapping-main-model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExcelImportComponent} from '../partials/excel-import/excel-import.component';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';
import {ToastService} from '../services/toast.service';
import {FileUploadConfig} from '../../file-upload.config';
import {AngularFireStorage, AngularFireUploadTask} from '@angular/fire/storage';
import {Observable} from 'rxjs';
import { PurchaseInvoiceDetailModel } from '../models/purchase-invoice-detail-model';
import * as Chart from 'chart.js';

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
  filter = {
    stockType: '-1',
    isActive: true,
  };
  selectedFiles: FileList;
  progress: { percentage: number } = { percentage: 0 };
  progressShow = false;
  snapshot: Observable<any>;
  downloadURL: string;
  percentage: Observable<number>;
  task: AngularFireUploadTask;
  productPurchasePriceChart: any;

  constructor(public authService: AuthenticationService, public service: ProductService, public infoService: InformationService,
              public route: Router, public router: ActivatedRoute, public excelService: ExcelService, public db: AngularFirestore,
              protected globService: GlobalService, protected actService: ActionService, protected fuService: FileUploadService,
              protected gfuService: GlobalUploadService, protected puService: ProductUnitService, protected sService: SettingService,
              protected pumService: ProductUnitMappingService, protected modalService: NgbModal, protected toastService: ToastService,
              protected storage: AngularFireStorage) {
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
        this.showSelectedRecord(paramItem);
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
    this.service.getMainItems(this.filter.isActive, this.filter.stockType).subscribe(list => {
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
    this.actService.addAction(this.service.tableName, this.selectedRecord.data.primaryKey, 5, 'Kayıt Görüntüleme');

    const dateList = [];
    const priceList = [];
    //#22223B, #4A4E69
    Promise.all([this.service.getProductPurchasePrices(this.selectedRecord.data.primaryKey)])
      .then((values: any) => {
        if (values[0] !== null) {
          const returnData = values[0] as Array<PurchaseInvoiceDetailModel>;
          returnData.forEach((item) => {
            dateList.push(item.quantity.toString() + " Miktar");
            priceList.push(item.price);
          });
        }
      })
      .finally(() => {
        this.productPurchasePriceChart = new Chart('productPurchasePriceChart', {
          type: 'line', // bar, pie, doughnut
          data: {
            labels: dateList,
            datasets: [{
              label: '# of Votes',
              fill: false,
              data: priceList,
              borderColor: '#EBD2B4',
              backgroundColor: '#EBD2B4',
              pointBackgroundColor: '#F4989C',
              pointBorderColor: '#F4989C',
              pointHoverBackgroundColor: '#F4989C',
              pointHoverBorderColor: '#F4989C',
            }]
          },
          options: {
            title: {
              text: 'Alım Hareketleri',
              display: true
            },
            scales: {
              yAxes: [{
                ticks: {
                  callback: (value, index, values) => {
                    if (Number(value) >= 1000) {
                      return '₺' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    } else {
                      return '₺' + Number(value).toFixed(2);
                    }
                  }
                }
              }]
            },
            tooltips: {
              callbacks: {
                label(tooltipItem, data) {
                  return '₺' + Number(tooltipItem.yLabel).toFixed(2).replace(/./g, (c, i, a) => {
                    return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
                  });
                }
              }
            },
          },
        });
      });
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
              this.finishSubProcess(null, 'Ürün başarıyla kaldırıldı.');
              this.clearSelectedRecord();
              this.selectedRecord = undefined;
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
            await this.populateUnits();
            await this.finishSubProcess(null, 'Birimler başarıyla oluşturuldu');
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
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
      this.populateList();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveFile_Click(item: FileMainModel): Promise<void> {
    try {
      await this.fuService.removeItem(item).then(async () => {
        if (this.selectedRecord.data.imgUrl === item.data.downloadURL) {
          this.selectedRecord.data.imgUrl = '';
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Dosya başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        } else {
          this.toastService.success('Dosya başarıyla kaldırıldı.');
        }
      });
    } catch (error) {
      await this.finishProcess(error, null);
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

  async btnExcelImport_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(ExcelImportComponent, {size: 'lg'});
      modalRef.result.then((result: any) => {
        if (result) {
          console.log(result);
        }
      }, () => {});
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

  async btnUploadFile_Click() {
    try {
      this.onTransaction = true;
      if (this.selectedFiles === undefined) {
        await this.finishSubProcess('Lütfen dosya seçiniz.', null);
        this.onTransaction = false;
      } else {
        const file = this.selectedFiles.item(0);
        const path = FileUploadConfig.pathOfProfileFiles + Date.now() + file.name;
        const ref = await this.storage.ref(path);
        this.storage.upload(path, file).then(async () => {
          this.downloadURL = await ref.getDownloadURL().toPromise();
          this.selectedRecord.data.imgUrl = this.downloadURL;
          this.service.updateItem(this.selectedRecord)
            .then(async () => {
              const fileData = this.fuService.clearMainModel();
              fileData.data.primaryKey = this.db.createId();
              fileData.data.downloadURL = this.downloadURL;
              fileData.data.parentType = 'product-profile';
              fileData.data.parentPrimaryKey = this.selectedRecord.data.primaryKey;
              fileData.data.size = file.size;
              fileData.data.type = file.type;
              fileData.data.path = path;
              fileData.data.fileName = file.name;
              await this.db.collection('tblFiles').doc(fileData.data.primaryKey).set(Object.assign({}, fileData.data));
              this.clearImageItems();
              await this.finishSubProcess(null, 'Ürün resmi başarıyla güncellendi.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        });
      }
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  onFileChange(event) {
    if (event) {
      this.progress.percentage = 0;
      this.progressShow = true;
      this.selectedFiles = event.target.files;
    } else {
      this.progress.percentage = 0;
      this.progressShow = false;
      this.selectedFiles = new FileList();
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
    this.filter = {
      stockType: '-1',
      isActive: true,
    };
  }

  clearImageItems(): void {
    this.progress.percentage = 0;
    this.progressShow = false;
    this.selectedFiles = null;
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

  async finishSubProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info, true);
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
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
