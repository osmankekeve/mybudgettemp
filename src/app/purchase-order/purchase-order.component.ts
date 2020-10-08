import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {ActivatedRoute, Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {
  getDateForInput, getFirstDayOfMonthForInput, getInputDataForInsert,
  getTodayForInput, isNullOrEmpty,
} from '../core/correct-library';
import {PriceListService} from '../services/price-list.service';
import {ToastService} from '../services/toast.service';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';
import {PriceListModel} from '../models/price-list-model';
import {DiscountListModel} from '../models/discount-list-model';
import {DefinitionModel} from '../models/definition-model';
import {DiscountListService} from '../services/discount-list.service';
import {DefinitionService} from '../services/definition.service';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';
import {PurchaseOrderMainModel} from '../models/purchase-order-main-model';
import {PurchaseOrderDetailService} from '../services/purchase-order-detail.service';
import {PurchaseOrderService} from '../services/purchase-order.service';

@Component({
  selector: 'app-purchase-order',
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css']
})
export class PurchaseOrderComponent implements OnInit {
  mainList: Array<PurchaseOrderMainModel>;
  selectedRecord: PurchaseOrderMainModel;
  searchText: '';
  productSearchText: '';
  recordDate: any;
  isMainFilterOpened = false;
  onTransaction = false;
  date = new Date();
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
    filterStatus: '-2',
  };
  totalValues = {
    totalPrice: 0,
    totalPriceWithTax: 0,
  };

  priceListMap = new Map();
  discountListMap = new Map();
  storageListMap = new Map();
  termListMap = new Map();
  paymentListMap = new Map();

  constructor(protected authService: AuthenticationService, protected service: PurchaseOrderService, private toastService: ToastService,
              protected infoService: InformationService, protected excelService: ExcelService, protected db: AngularFirestore,
              protected route: Router, protected modalService: NgbModal, protected plService: PriceListService,
              protected sodService: PurchaseOrderDetailService, protected defService: DefinitionService, public globService: GlobalService,
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
    this.totalValues = {
      totalPrice: 0,
      totalPriceWithTax: 0,
    };
    this.mainList = undefined;
    const type = [];
    if (this.filter.filterStatus === '-1') {
      type.push('approved');
      type.push('portion');
      type.push('closed');
      type.push('done');
    } else if (this.filter.filterStatus === '-2') {
      type.push('approved');
      type.push('portion');
    } else {
      type.push(this.filter.filterStatus);
    }
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDates(beginDate, finishDate, type).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseOrderMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.totalPrice += item.data.totalPrice;
          this.totalValues.totalPriceWithTax += item.data.totalPriceWithTax;
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              this.totalValues.totalPrice -= item.data.totalPrice;
              this.totalValues.totalPriceWithTax -= item.data.totalPriceWithTax;
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.totalValues.totalPrice -= this.mainList[i].data.totalPrice;
              this.totalValues.totalPriceWithTax -= this.mainList[i].data.totalPriceWithTax;
              this.totalValues.totalPrice += item.data.totalPrice;
              this.totalValues.totalPriceWithTax += item.data.totalPriceWithTax;
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
    Promise.all([this.plService.getPriceLists(list, 'purchase')])
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
    Promise.all([this.dService.getDiscountLists(list, 'purchase')])
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
      this.selectedRecord = value.returnData as PurchaseOrderMainModel;
      this.recordDate = getDateForInput(this.selectedRecord.data.recordDate);
      this.selectedRecord.priceListName = this.priceListMap.get(this.selectedRecord.data.priceListPrimaryKey);
      this.selectedRecord.discountListName = this.discountListMap.get(this.selectedRecord.data.discountListPrimaryKey);
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
    await this.route.navigate(['purchase-order', {}]);
  }

  async btnExportToExcel_Click(): Promise<void> {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'purchase-order');
    } else {
      await this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnDetailExportToExcel_Click(): Promise<void> {
    if (this.selectedRecord.orderDetailList.length > 0) {
      this.excelService.exportToExcel(this.selectedRecord.orderDetailList, 'purchase-order-detail');
    } else {
      await this.toastService.error('Aktarılacak kayıt bulunamadı.', true);
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
      this.onTransaction = true;
      const r = new RouterModel();
      r.nextModule = 'purchase-invoice';
      r.nextModulePrimaryKey = this.selectedRecord.data.primaryKey;
      r.previousModule = 'purchase-order';
      r.previousModulePrimaryKey = this.selectedRecord.data.primaryKey;
      r.action = 'create-invoice';
      await this.globService.showTransactionRecord(r);
      this.finishProcess(null, 'Fatura taslağı oluşturuldu.');

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
        await this.service.updateItem(this.selectedRecord)
          .then(() => {
            this.finishProcess(null, 'Sipariş teklif aşamasına geri çevrildi');
            this.populateList();
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
      if (this.selectedRecord.data.status === 'approved' || this.selectedRecord.data.status === 'portion') {
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
    if (isNullOrEmpty(this.filter.filterBeginDate)) {
      this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
    } else if (isNullOrEmpty(this.filter.filterFinishDate)) {
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
    this.filter.filterBeginDate = getFirstDayOfMonthForInput();
    this.filter.filterFinishDate = getTodayForInput();
    this.filter.filterStatus = '-2';
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
