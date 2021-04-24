import { StockVoucherService } from './../services/stock-voucher.service';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {
  currencyFormat,
  getDateForInput,
  getEncryptionKey,
  getFirstDayOfMonthForInput,
  getFloat, getInputDataForInsert,
  getTodayForInput,
  moneyFormat
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import * as CryptoJS from 'crypto-js';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductSelectComponent} from '../partials/product-select/product-select.component';
import {ExcelImportComponent} from '../partials/excel-import/excel-import.component';
import { ToastService } from '../services/toast.service';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { Subscription } from 'rxjs';
import { setVoucherCalculation, StockVoucherMainModel } from '../models/product-module/stock-voucher-main-model';
import { setVoucherDetailCalculation, StockVoucherDetailMainModel } from '../models/product-module/stock-voucher-detail-main-model';
import { StockVoucherDetailService } from '../services/stock-voucher-detail.service';
import { DefinitionModel } from '../models/definition-model';
import { SettingModel } from '../models/setting-model';
import { DefinitionService } from '../services/definition.service';
import { SettingService } from '../services/setting.service';
import { ProductUnitModel } from '../models/product-unit-model';
import { ProductUnitService } from '../services/product-unit.service';
import { ProductUnitMappingService } from '../services/product-unit-mapping.service';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';

@Component({
  selector: 'app-stock-voucher',
  templateUrl: './stock-voucher.component.html',
  styleUrls: ['./stock-voucher.component.css']
})
export class StockVoucherComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<StockVoucherMainModel>;
  selectedRecord: StockVoucherMainModel;
  selectedDetail: StockVoucherDetailMainModel;
  storageList: Array<DefinitionModel>;
  unitList: Array<ProductUnitModel>;
  encryptSecretKey: string = getEncryptionKey();
  onTransaction = false;
  searchText: '';
  productSearchText: '';
  documentDate: any;
  isNewPanelOpened = false;
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
    filterStatus: '-1',
  };

  constructor(protected authService: AuthenticationService, protected service: StockVoucherService, protected infoService: InformationService,
              protected route: Router, protected router: ActivatedRoute, protected excelService: ExcelService, protected toastService: ToastService,
              protected db: AngularFirestore, protected ppService: StockVoucherDetailService, protected modalService: NgbModal,
              protected setService: SettingService, protected puService: ProductUnitService, protected defService: DefinitionService,
              protected pumService: ProductUnitMappingService) {
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
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    this.mainList$ = this.service.getMainItemsBetweenDates(beginDate, finishDate, this.filter.filterStatus).subscribe(
      list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as StockVoucherMainModel;
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
    this.selectedRecord.detailList = undefined;
    this.ppService.getProductsForListDetail(this.selectedRecord.data.primaryKey)
    .then((list) => {
      this.selectedRecord.detailList = list;
    });
  }

  populateStorageList(): void {
    Promise.all([this.defService.getItemsForFill('storage'), this.setService.getItem('defaultStoragePrimaryKey')])
      .then((values: any) => {
        this.storageList = [];
        if (values[0] !== null) {
          const returnData = values[0] as Array<DefinitionModel>;
          returnData.forEach(value => {
            this.storageList.push(value);
          });
        }
        if (values[1] !== null && !this.selectedRecord.data.primaryKey) {
          const defaultStoragePrimaryKey = values[1].data as SettingModel;
          this.selectedRecord.data.storagePrimaryKey = defaultStoragePrimaryKey.value;
        }
      });
  }

  populateUnits(): void {
    this.unitList = [];
    Promise.all([this.puService.getItemsForSelect()]).then((values: any) => {
      if (values[0] !== undefined || values[0] !== null) {
        const returnData = values[0] as Array<ProductUnitModel>;
        returnData.forEach(value => {

          this.unitList.push(value);
        });
      }
    });
  }

  showSelectedRecord(): void {
    this.documentDate = getDateForInput(this.selectedRecord.data.documentDate);
    this.isNewPanelOpened = false;
  }

  mainListItem_Click(record: any): void {
    this.selectedRecord = record as StockVoucherMainModel;
    this.showSelectedRecord();
    this.populateStorageList();
    this.populateDetailList();
    this.populateUnits();
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null, true);
      await this.route.navigate(['stock-voucher', {}]);
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
      this.populateStorageList();
      this.populateUnits();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          this.selectedRecord.data.documentDate = getInputDataForInsert(this.documentDate);
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

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(MainFilterComponent, {size: 'md'});
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.filter.filterStatus = result.filterStatus;
          this.ngOnDestroy();
          this.populateList();
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
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

  async finishSubProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
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

      const modalRef = this.modalService.open(ProductSelectComponent, {size: 'lg'});
      modalRef.componentInstance.product = this.selectedDetail.product;
      modalRef.componentInstance.productStockTypes = ['normal', 'promotion'];
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
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNewProduct_Click(): Promise<void> {
    try {
      this.isNewPanelOpened = true;
      this.selectedDetail = this.ppService.clearMainModel();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSaveProduct_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.unitList.forEach(item => {
        if (item.primaryKey === this.selectedDetail.data.unitPrimaryKey) {
          this.selectedDetail.unit = item;
        }
      });
      this.selectedDetail.data.voucherPrimaryKey = this.selectedRecord.data.primaryKey;
      this.selectedDetail.data.productPrimaryKey = this.selectedDetail.product.data.primaryKey;
      this.selectedDetail.unitMapping = await this.pumService.getProductUnitMapping(this.selectedDetail.data.productPrimaryKey, this.selectedDetail.data.unitPrimaryKey);
      setVoucherDetailCalculation(this.selectedDetail);
      setVoucherCalculation(this.selectedRecord);
      Promise.all([this.ppService.checkForSave(this.selectedDetail)])
        .then(async () => {
          if (this.selectedDetail.data.primaryKey == null) {
            this.selectedDetail.data.primaryKey = this.db.createId();
            this.selectedRecord.detailList.push(this.selectedDetail);
            await this.finishSubProcess(null, 'Ürün başarıyla listeye eklendi');
          } else {
            for (let i = 0; i < this.selectedRecord.detailList.length; i++) {
              if (this.selectedDetail.data.primaryKey === this.selectedRecord.detailList[i].data.primaryKey) {
                this.selectedRecord.detailList[i] = this.selectedDetail;
                break;
              }
            }
            await this.finishSubProcess(null, 'Ürün başarıyla düzenlendi');
          }
        })
        .catch((error) => {
          this.finishSubProcess(error, null);
        });
    } catch (error) {
      this.finishSubProcess(error, null);
    }
  }

  async btnRemoveProduct_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      for (let i = 0; i < this.selectedRecord.detailList.length; i++) {
        if (this.selectedDetail.data.primaryKey === this.selectedRecord.detailList[i].data.primaryKey) {
          this.selectedRecord.detailList.splice(i, 1);
          setVoucherCalculation(this.selectedRecord);
          break;
        }
      }

    } catch (error) {
      this.finishSubProcess(error, null);
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
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.mainList, 'stock-voucher');
      } else {
        this.toastService.info('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExportToExcelDetail_Click(): Promise<void> {
    try {
      if (this.selectedRecord.detailList.length > 0) {
        this.excelService.exportToExcel(this.selectedRecord.detailList, 'stock-voucher-detail');
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
      this.selectedRecord.detailList = [];
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

  showSelectedProduct(record: any): void {
    this.selectedDetail = record as StockVoucherDetailMainModel;
    this.isNewPanelOpened = true;
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.documentDate = getTodayForInput();
    this.isNewPanelOpened = false;
  }

  clearSelectedProductRecord(): void {
    this.isNewPanelOpened = false;
    this.selectedDetail = undefined;
  }

  format_amount($event): void {
    this.selectedDetail.data.amount = getFloat(moneyFormat($event.target.value));
    this.selectedDetail.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedDetail.data.amount === 0) {
      this.selectedDetail.data.amount = null;
      this.selectedDetail.amountFormatted = null;
    }
  }

  focus_quantity(): void {
    if (this.selectedDetail.data.quantity === 0) {
      this.selectedDetail.data.quantity = null;
    }
  }
}
