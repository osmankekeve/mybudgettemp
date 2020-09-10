import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {ActivatedRoute, Router} from '@angular/router';
import {SalesOrderMainModel} from '../models/sales-order-main-model';
import {SalesOrderService} from '../services/sales-order.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {
  getDateForInput, getFirstDayOfMonthForInput, getInputDataForInsert,
  getTodayForInput, isNullOrEmpty,
} from '../core/correct-library';
import {PriceListService} from '../services/price-list.service';
import {SalesOrderDetailService} from '../services/sales-order-detail.service';
import {ToastService} from '../services/toast.service';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';
import {PriceListModel} from '../models/price-list-model';
import {SettingModel} from '../models/setting-model';
import {DiscountListModel} from '../models/discount-list-model';
import {DefinitionModel} from '../models/definition-model';
import {DiscountListService} from '../services/discount-list.service';
import {DefinitionService} from '../services/definition.service';
import {setOrderCalculation} from '../models/sales-order-model';
import {SalesOrderDetailMainModel} from '../models/sales-order-detail-main-model';

@Component({
  selector: 'app-sales-order',
  templateUrl: './sales-order.component.html',
  styleUrls: ['./sales-order.component.css']
})
export class SalesOrderComponent implements OnInit {
  mainList: Array<SalesOrderMainModel>;
  selectedRecord: SalesOrderMainModel;
  searchText: '';
  productSearchText: '';
  recordDate: any;
  isMainFilterOpened = false;
  onTransaction = false;
  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  filterStatus: any;

  priceListMap = new Map();
  discountListMap = new Map();
  storageListMap = new Map();
  termListMap = new Map();
  paymentListMap = new Map();

  constructor(protected authService: AuthenticationService, protected service: SalesOrderService, private toastService: ToastService,
              protected infoService: InformationService, protected excelService: ExcelService, protected db: AngularFirestore,
              protected route: Router, protected modalService: NgbModal, protected plService: PriceListService,
              protected sodService: SalesOrderDetailService, protected defService: DefinitionService,
              protected dService: DiscountListService) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.selectedRecord = undefined;
    this.populateList();
    this.populatePriceList();
    this.populateDiscountList();
    this.populateStorageList();
    this.populateTermList();
    this.populatePaymentTypeList();
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

  populateList(): void {
    this.mainList = undefined;
    const type = [];
    type.push('approved');
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDates(beginDate, finishDate, type).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as SalesOrderMainModel;
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

  populatePriceList(): void {
    const list = Array<boolean>();
    list.push(true);
    Promise.all([this.plService.getPriceLists(list, 'sales')])
      .then((values: any) => {
        if (values[0] !== null) {
          const returnData = values[0] as Array<PriceListModel>;
          returnData.forEach(value => {
            this.priceListMap.set(value.primaryKey, value.listName);
          });
        }
      });
  }

  populateDiscountList(): void {
    const list = Array<boolean>();
    list.push(true);
    Promise.all([this.dService.getDiscountLists(list, 'sales')])
      .then((values: any) => {
        if (values[0] !== null) {
          const returnData = values[0] as Array<DiscountListModel>;
          returnData.forEach(value => {
            this.discountListMap.set(value.primaryKey, value.listName);
          });
        }
      });
  }

  populateStorageList(): void {
    Promise.all([this.defService.getItemsForFill('storage')])
      .then((values: any) => {
        if (values[0] !== null) {
          const returnData = values[0] as Array<DefinitionModel>;
          returnData.forEach(value => {
            this.storageListMap.set(value.primaryKey, value.custom1);
          });
        }
      });
  }

  populateTermList(): void {
    Promise.all([this.defService.getItemsForFill('term')]).then((values: any) => {
      if (values[0] !== null) {
        const returnData = values[0] as Array<DefinitionModel>;
        returnData.forEach(value => {
          this.termListMap.set(value.primaryKey, value.custom1);
        });
      }
    });
  }

  populatePaymentTypeList(): void {
    Promise.all([this.defService.getItemsForFill('payment-type')]).then((values: any) => {
      if (values[0] !== null) {
        const returnData = values[0] as Array<DefinitionModel>;
        returnData.forEach(value => {
          this.paymentListMap.set(value.primaryKey, value.custom1);
        });
      }
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = this.service.clearMainModel();
    this.service.getItem(record.data.primaryKey).then(async value => {
      this.selectedRecord = value.returnData as SalesOrderMainModel;
      this.recordDate = getDateForInput(this.selectedRecord.data.recordDate);
      this.selectedRecord.priceListName = this.priceListMap.get(this.selectedRecord.data.priceListPrimaryKey);
      this.selectedRecord.discountListName = this.discountListMap.get(this.selectedRecord.data.discountListPrimaryKey);
      this.selectedRecord.storageName = this.storageListMap.get(this.selectedRecord.data.storagePrimaryKey);
      this.selectedRecord.termName = this.termListMap.get(this.selectedRecord.data.termPrimaryKey);
      this.selectedRecord.paymentName = this.paymentListMap.get(this.selectedRecord.data.paymentTypePrimaryKey);

      this.sodService.getMainItemsWithOrderPrimaryKey(record.data.primaryKey)
        .then((list) => {
          this.selectedRecord.orderDetailList = list;
        });
    });
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnReturnList_Click(): Promise<void> {
    this.selectedRecord = undefined;
    await this.route.navigate(['sales-order', {}]);
  }

  async btnExportToExcel_Click(): Promise<void> {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'note');
    } else {
      await this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnShowInfoModule_Click(): Promise<void> {
    try {
      this.modalService.open(InfoModuleComponent, {size: 'lg'});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnCreateInvoice_Click(): Promise<void> {
    try {

    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSendToOffer_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      if (this.selectedRecord.data.status === 'approved') {
        this.selectedRecord.data.status = 'waitingForApprove';
        this.selectedRecord.data.approverPrimaryKey = this.authService.getEid();
        this.selectedRecord.data.approveDate = -1;
        this.selectedRecord.data.recordDate = getInputDataForInsert(this.recordDate);
        Promise.all([this.service.checkForSave(this.selectedRecord)])
          .then(async (values: any) => {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Sipariş teklif aşamasına geri çevrildi');
                this.populateList();
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          })
          .catch((error) => {
            this.finishProcess(error, null);
          });
      } else {
        this.finishProcess('Sipariş durumu onaylamak için uygun değildir. Sipariş Durumu: ' + this.selectedRecord.statusTr, null);
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnCloseOrder_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      if (this.selectedRecord.data.status === 'approved') {
        this.selectedRecord.data.status = 'closed';
        Promise.all([this.service.checkForSave(this.selectedRecord)])
          .then(async (values: any) => {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Sipariş kapatıldı');
                this.populateList();
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          })
          .catch((error) => {
            this.finishProcess(error, null);
          });
      } else {
        this.finishProcess('Sipariş durumu kapatmak için uygun değildir. Sipariş Durumu: ' + this.selectedRecord.statusTr, null);
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  btnMainFilter_Click(): void {
    if (isNullOrEmpty(this.filterBeginDate)) {
      this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
    } else if (isNullOrEmpty(this.filterFinishDate)) {
      this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
    } else {
      this.populateList();
    }
  }

  btnShowMainFiler_Click(): void {
    this.isMainFilterOpened = this.isMainFilterOpened !== true;
    this.clearMainFiler();
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.recordDate = getTodayForInput();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterStatus = '-1';
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

  finishFinally(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }


}
