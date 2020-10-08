import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {ActivatedRoute, Router} from '@angular/router';
import {setOrderDetailCalculation} from '../models/sales-order-detail-main-model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CustomerSelectComponent} from '../partials/customer-select/customer-select.component';
import {
  currencyFormat,
  getConvertedUnitValue,
  getDateForInput, getFirstDayOfMonthForInput,
  getFloat,
  getInputDataForInsert,
  getTodayForInput, isNullOrEmpty,
  moneyFormat
} from '../core/correct-library';
import {PriceListModel} from '../models/price-list-model';
import {DiscountListModel} from '../models/discount-list-model';
import {PriceListService} from '../services/price-list.service';
import {DiscountListService} from '../services/discount-list.service';
import {DefinitionModel} from '../models/definition-model';
import {DefinitionService} from '../services/definition.service';
import {DeliveryAddressModel} from '../models/delivery-address-model';
import {DeliveryAddressService} from '../services/delivery-address.service';
import {SettingModel} from '../models/setting-model';
import {ProductSelectComponent} from '../partials/product-select/product-select.component';
import {ProductPriceService} from '../services/product-price.service';
import {SettingService} from '../services/setting.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {ProductUnitService} from '../services/product-unit.service';
import {ProductDiscountService} from '../services/product-discount.service';
import {ProductDiscountModel} from '../models/product-discount-model';
import {ProductPriceMainModel} from '../models/product-price-main-model';
import {ProductUnitMappingService} from '../services/product-unit-mapping.service';
import {ProductUnitMappingModel} from '../models/product-unit-mapping-model';
import {ToastService} from '../services/toast.service';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';
import {PurchaseOrderMainModel} from '../models/purchase-order-main-model';
import {PurchaseOrderDetailMainModel} from '../models/purchase-order-detail-main-model';
import {PurchaseOrderDetailService} from '../services/purchase-order-detail.service';
import {PurchaseOrderService} from '../services/purchase-order.service';
import {setOrderCalculation} from '../models/purchase-order-model';

@Component({
  selector: 'app-purchase-offer',
  templateUrl: './purchase-offer.component.html',
  styleUrls: ['./purchase-offer.component.css']
})
export class PurchaseOfferComponent implements OnInit {
  mainList: Array<PurchaseOrderMainModel>;
  selectedRecord: PurchaseOrderMainModel;
  selectedDetail: PurchaseOrderDetailMainModel;
  searchText: '';
  productSearchText: '';
  onTransaction = false;
  recordDate: any;
  isNewPanelOpened = false;
  productType = 'normal';
  date = new Date();
  isMainFilterOpened = false;
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
    filterStatus: '-1',
  };
  totalValues = {
    totalPrice: 0,
    totalPriceWithTax: 0,
  };

  priceLists: Array<PriceListModel>;
  discountLists: Array<DiscountListModel>;
  storageList: Array<DefinitionModel>;
  termList: Array<DefinitionModel>;
  paymentList: Array<DefinitionModel>;
  deliveryAddressList: Array<DeliveryAddressModel>;
  unitList: Array<ProductUnitModel>;

  constructor(protected authService: AuthenticationService, protected service: PurchaseOrderService, protected toastService: ToastService,
              protected infoService: InformationService, protected excelService: ExcelService, protected db: AngularFirestore,
              protected route: Router, protected modalService: NgbModal, protected plService: PriceListService,
              protected dService: DiscountListService, protected defService: DefinitionService, protected sService: SettingService,
              protected daService: DeliveryAddressService, protected sodService: PurchaseOrderDetailService,
              protected puService: ProductUnitService, protected ppService: ProductPriceService,
              protected pdService: ProductDiscountService, protected setService: SettingService,
              protected pumService: ProductUnitMappingService) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.selectedRecord = undefined;
    this.selectedDetail = undefined;
    this.populateList();
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
      type.push('waitingForApprove');
      type.push('rejected');
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
    Promise.all([this.plService.getPriceLists(list, 'purchase'), this.setService.getItem('defaultPriceListPrimaryKey')])
      .then((values: any) => {
        this.priceLists = [];
        if (values[0] !== null) {
          const returnData = values[0] as Array<PriceListModel>;
          returnData.forEach(value => {
            this.priceLists.push(value);
          });
        }
        if (values[1] !== null && !this.selectedRecord.data.primaryKey) {
          const defaultPriceListPrimaryKey = values[1].data as SettingModel;
          this.selectedRecord.data.priceListPrimaryKey = defaultPriceListPrimaryKey.value;
        }
      });
  }

  populateDiscountList(): void {
    const list = Array<boolean>();
    list.push(true);
    Promise.all([this.dService.getDiscountLists(list, 'purchase'), this.setService.getItem('defaultDiscountListPrimaryKey')])
      .then((values: any) => {
      this.discountLists = [];
      if (values[0] !== null) {
        const returnData = values[0] as Array<DiscountListModel>;
        returnData.forEach(value => {
          this.discountLists.push(value);
        });
      }
      if (values[1] !== null && !this.selectedRecord.data.primaryKey) {
        const defaultDiscountListPrimaryKey = values[1].data as SettingModel;
        this.selectedRecord.data.discountListPrimaryKey = defaultDiscountListPrimaryKey.value;
      }
    });
  }

  populateTermList(): void {
    Promise.all([this.defService.getItemsForFill('term')]).then((values: any) => {
      this.termList = [];
      if (values[0] !== null) {
        const returnData = values[0] as Array<DefinitionModel>;
        returnData.forEach(value => {
          this.termList.push(value);
        });
      }
    });
  }

  populatePaymentTypeList(): void {
    Promise.all([this.defService.getItemsForFill('payment-type')]).then((values: any) => {
      this.paymentList = [];
      if (values[0] !== null) {
        const returnData = values[0] as Array<DefinitionModel>;
        returnData.forEach(value => {
          this.paymentList.push(value);
        });
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

  populateProductAfterSelectData(): void {
    this.unitList = [];
    Promise.all([
      this.puService.getItemsForSelect(),
      this.ppService.getProductPrice(this.selectedRecord.data.priceListPrimaryKey, this.selectedDetail.data.productPrimaryKey),
      this.pdService.getProductDiscount(this.selectedRecord.data.discountListPrimaryKey, this.selectedDetail.data.productPrimaryKey),
      this.puService.getItem(this.selectedDetail.product.data.defaultUnitCode),
      this.pumService.getProductUnitMapping(this.selectedDetail.data.productPrimaryKey, this.selectedDetail.product.data.defaultUnitCode)
    ]).then((values: any) => {
      if (values[0] !== null) {
        const returnData = values[0] as Array<ProductUnitModel>;
        returnData.forEach(value => {

          this.unitList.push(value);
        });
      }
      if (values[1] !== null) {
        const priceData = values[1] as ProductPriceMainModel;
        this.selectedDetail.data.listPrice = priceData.data.productPrice;
        this.selectedDetail.data.defaultPrice = priceData.data.productPrice;
        this.selectedDetail.data.price = priceData.data.productPrice;
        this.selectedDetail.priceFormatted = priceData.priceFormatted;
      }
      if (values[2] !== null) {
        const discountData = values[2] as ProductDiscountModel;
        this.selectedDetail.data.defaultDiscount1 = discountData.discount1;
        this.selectedDetail.data.discount1 = discountData.discount1;
        this.selectedDetail.data.defaultDiscount2 = discountData.discount2;
        this.selectedDetail.data.discount2 = discountData.discount2;
      }
      if (values[3] !== null) {
        this.selectedDetail.unit = values[3].returnData.data as ProductUnitModel;
        this.selectedDetail.data.unitPrimaryKey = this.selectedDetail.unit.primaryKey;
      }
      if (values[4] !== null) {
        const mappingData = values[4] as ProductUnitMappingModel;
        this.selectedDetail.data.unitValue = mappingData.unitValue;
      }
    });
  }

  showSelectedRecord(record: any): void {
    this.clearSelectedProductRecord();
    this.service.getItem(record.data.primaryKey).then(async value => {
      this.selectedRecord = value.returnData as PurchaseOrderMainModel;
      this.recordDate = getDateForInput(this.selectedRecord.data.recordDate);
      this.populatePriceList();
      this.populateDiscountList();
      this.populateTermList();
      this.populatePaymentTypeList();

      await this.sodService.getMainItemsWithOrderPrimaryKey(this.selectedRecord.data.primaryKey)
        .then((list) => {
          this.selectedRecord.orderDetailList = [];
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

  async btnShowJsonDataDetail_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedDetail, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnReturnList_Click(): Promise<void> {
    this.selectedRecord = undefined;
    await this.route.navigate(['purchase-offer', {}]);
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
      this.selectedRecord.orderDetailList = [];
      this.populatePriceList();
      this.populateDiscountList();
      this.populateTermList();
      this.populatePaymentTypeList();
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.recordDate = getInputDataForInsert(this.recordDate);
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            for (const item of this.selectedRecord.orderDetailList) {
              item.data.orderPrimaryKey = this.selectedRecord.data.primaryKey;
            }
            setOrderCalculation(this.selectedRecord);
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla tamamlandı.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          } else {
            for (const item of this.selectedRecord.orderDetailList) {
              item.data.orderPrimaryKey = this.selectedRecord.data.primaryKey;
            }
            setOrderCalculation(this.selectedRecord);
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla tamamlandı.');
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

  async btnApprove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      if (this.selectedRecord.data.status === 'waitingForApprove') {
        this.selectedRecord.data.status = 'approved';
        this.selectedRecord.data.approverPrimaryKey = this.authService.getEid();
        this.selectedRecord.data.approveDate = Date.now();
        Promise.all([this.service.checkForSave(this.selectedRecord)])
          .then(async (values: any) => {
            for (const item of this.selectedRecord.orderDetailList) {
              item.data.orderPrimaryKey = this.selectedRecord.data.primaryKey;
            }
            setOrderCalculation(this.selectedRecord);
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Kayıt başarıyla onaylandı.');
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
              this.finishProcess(null, 'Kayıt başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            })
            .finally(() => {
              this.finishFinally();
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnSelectCustomer_Click(): Promise<void> {
    try {
      const list = Array<string>();
      list.push('supplier');
      list.push('customer-supplier');
      const modalRef = this.modalService.open(CustomerSelectComponent, {size: 'lg'});
      modalRef.componentInstance.customer = this.selectedRecord.customer;
      modalRef.componentInstance.customerTypes = list;
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedRecord.customer = result;
          this.selectedRecord.data.customerPrimaryKey = this.selectedRecord.customer.data.primaryKey;
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
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

  async txtGeneralDiscount_TextChange(): Promise<void> {
    try {
      if (this.selectedRecord.data.generalDiscount == null) {
        this.selectedRecord.data.generalDiscount = 0;
      }
      setOrderCalculation(this.selectedRecord);
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


  showOrderDetail(record: any): void {
    if (this.selectedRecord.data.status === 'waitingForApprove') {
      this.selectedDetail = record as PurchaseOrderDetailMainModel;
      this.isNewPanelOpened = true;
    } else {
      this.toastService.warning('Sipariş detayı düzenlemeye kapalıdır', true);
    }
  }

  async btnSelectProduct_Click(): Promise<void> {
    try {
      if (this.selectedRecord.data.priceListPrimaryKey === '-1') {
        await this.infoService.error('Lütfen fiyat listesi seçiniz.');
      } else if (this.selectedRecord.data.priceListPrimaryKey === '-1') {
        await this.infoService.error('Lütfen iskonto listesi seçiniz.');
      } else {
        const list = Array<string>();
        list.push(this.productType);

        const modalRef = this.modalService.open(ProductSelectComponent, {size: 'lg'});
        modalRef.componentInstance.product = this.selectedDetail.product;
        modalRef.componentInstance.productTypes = list;
        modalRef.result.then((result: any) => {
          if (result) {
            this.selectedDetail.product = result;
            this.selectedDetail.data.taxRate = this.selectedDetail.product.data.taxRate;
            this.selectedDetail.data.productPrimaryKey = this.selectedDetail.product.data.primaryKey;
            this.populateProductAfterSelectData();
          }
        }, () => {});
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNewProduct_Click(): Promise<void> {
    try {
      this.isNewPanelOpened = true;
      this.selectedDetail = this.sodService.clearMainModel();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSaveProductDetail_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.sodService.checkForSave(this.selectedDetail)])
        .then(async (values: any) => {
          if (this.selectedDetail.data.primaryKey == null) {
            this.selectedDetail.data.primaryKey = this.db.createId();
            this.selectedRecord.orderDetailList.push(this.selectedDetail);
            setOrderDetailCalculation(this.selectedDetail);
            setOrderCalculation(this.selectedRecord);
          } else {
            for (let i = 0; i < this.selectedRecord.orderDetailList.length; i++) {
              if (this.selectedDetail.data.primaryKey === this.selectedRecord.orderDetailList[i].data.primaryKey) {
                this.selectedRecord.orderDetailList[i] = this.selectedDetail;
                setOrderDetailCalculation(this.selectedDetail);
                setOrderCalculation(this.selectedRecord);
              }
            }
          }
          await this.finishSubProcess(null, 'Ürün başarıyla sipariş listesine eklendi');
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });

    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveProductDetail_Click(): Promise<void> {
    try {

      setOrderCalculation(this.selectedRecord);
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnReturnOrderDetailList_Click(): Promise<void> {
    try {
      this.clearSelectedProductRecord();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async onChangeUnit(value: any): Promise<void> {
    await this.puService.getItem(value).then(async item => {
      this.selectedDetail.unit = item.returnData.data;
      const a = await this.pumService.getProductUnitMapping(this.selectedDetail.data.productPrimaryKey, this.selectedDetail.unit.primaryKey);
      this.selectedDetail.data.unitPrimaryKey = this.selectedDetail.unit.primaryKey;
      this.selectedDetail.data.unitValue = a.unitValue;
      this.selectedDetail.data.price = getFloat((this.selectedDetail.data.listPrice / this.selectedDetail.data.unitValue).toFixed(2));
      this.selectedDetail.data.defaultPrice = getFloat((this.selectedDetail.data.listPrice / this.selectedDetail.data.unitValue).toFixed(2));
      setOrderDetailCalculation(this.selectedDetail);
    });
  }

  clearMainFiler(): void {
    this.filter.filterBeginDate = getFirstDayOfMonthForInput();
    this.filter.filterFinishDate = getTodayForInput();
    this.filter.filterStatus = '-1';
  }

  clearSelectedProductRecord(): void {
    this.isNewPanelOpened = false;
    this.selectedDetail = undefined;
  }

  format_price($event): void {
    this.selectedDetail.data.price = getFloat(moneyFormat($event.target.value));
    this.selectedDetail.priceFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_price(): void {
    if (this.selectedDetail.data.price === 0) {
      this.selectedDetail.data.price = null;
      this.selectedDetail.priceFormatted = null;
    }
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

}
