import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {ActivatedRoute, Router} from '@angular/router';
import {SalesOrderMainModel} from '../models/sales-order-main-model';
import {SalesOrderService} from '../services/sales-order.service';
import {SalesOrderDetailMainModel} from '../models/sales-order-detail-main-model';
import {setOrderDetailCalculation} from '../models/sales-order-detail-main-model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CustomerSelectComponent} from '../partials/customer-select/customer-select.component';
import {
  currencyFormat,
  getConvertedUnitValue,
  getDateForInput,
  getFloat,
  getInputDataForInsert,
  getTodayForInput,
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
import {SalesOrderDetailService} from '../services/sales-order-detail.service';
import {SettingModel} from '../models/setting-model';
import {ProductSelectComponent} from '../partials/product-select/product-select.component';
import {ProductPriceService} from '../services/product-price.service';
import {SettingService} from '../services/setting.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {ProductUnitService} from '../services/product-unit.service';
import {ProductDiscountService} from '../services/product-discount.service';
import {ProductDiscountModel} from '../models/product-discount-model';
import {ProductPriceMainModel} from '../models/product-price-main-model';
import {setOrderCalculation} from '../models/sales-order-model';
import {ProductUnitMappingService} from '../services/product-unit-mapping.service';
import {ProductUnitMappingModel} from '../models/product-unit-mapping-model';
import {ToastService} from '../services/toast.service';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';

@Component({
  selector: 'app-sales-offer',
  templateUrl: './sales-offer.component.html',
  styleUrls: ['./sales-offer.component.css']
})
export class SalesOfferComponent implements OnInit {
  mainList: Array<SalesOrderMainModel>;
  // orderDetailList: Array<SalesOrderDetailMainModel>;
  selectedRecord: SalesOrderMainModel;
  selectedDetail: SalesOrderDetailMainModel;
  searchText: '';
  productSearchText: '';
  onTransaction = false;
  recordDate: any;
  isNewPanelOpened = false;
  productType = 'normal';

  priceLists: Array<PriceListModel>;
  discountLists: Array<DiscountListModel>;
  storageList: Array<DefinitionModel>;
  termList: Array<DefinitionModel>;
  paymentList: Array<DefinitionModel>;
  deliveryAddressList: Array<DeliveryAddressModel>;
  unitList: Array<ProductUnitModel>;

  constructor(protected authService: AuthenticationService, protected service: SalesOrderService, private toastService: ToastService,
              protected infoService: InformationService, protected excelService: ExcelService, protected db: AngularFirestore,
              protected route: Router, protected modalService: NgbModal, protected plService: PriceListService,
              protected dService: DiscountListService, protected defService: DefinitionService,
              protected daService: DeliveryAddressService, protected sodService: SalesOrderDetailService,
              protected puService: ProductUnitService, protected ppService: ProductPriceService,
              protected pdService: ProductDiscountService, protected setService: SettingService,
              protected pumService: ProductUnitMappingService) {
  }

  ngOnInit() {
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
    this.mainList = undefined;
    this.service.getMainItems().subscribe(list => {
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
    Promise.all([this.plService.getPriceLists(list, 'sales'), this.setService.getItem('defaultPriceListPrimaryKey')])
      .then((values: any) => {
        this.priceLists = [];
        if (values[0] !== null) {
          const returnData = values[0] as Array<PriceListModel>;
          returnData.forEach(value => {
            this.priceLists.push(value);
          });
        }
        if (values[1] !== null) {
          const defaultPriceListPrimaryKey = values[1].data as SettingModel;
          this.selectedRecord.data.priceListPrimaryKey = defaultPriceListPrimaryKey.value;
        }
      });
  }

  populateDiscountList(): void {
    const list = Array<boolean>();
    list.push(true);
    Promise.all([this.dService.getDiscountLists(list, 'sales'), this.setService.getItem('defaultDiscountListPrimaryKey')])
      .then((values: any) => {
      this.discountLists = [];
      if (values[0] !== null) {
        const returnData = values[0] as Array<DiscountListModel>;
        returnData.forEach(value => {
          this.discountLists.push(value);
        });
      }
      if (values[1] !== null) {
        const defaultDiscountListPrimaryKey = values[1].data as SettingModel;
        this.selectedRecord.data.discountListPrimaryKey = defaultDiscountListPrimaryKey.value;
      }
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
      if (values[1] !== null) {
        const defaultStoragePrimaryKey = values[1].data as SettingModel;
        this.selectedRecord.data.storagePrimaryKey = defaultStoragePrimaryKey.value;
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

  populateDeliveryAddressList(): void {
    this.deliveryAddressList = [];
    Promise.all([this.daService.getItemsForFill(this.selectedRecord.customer.data.primaryKey)]).then((values: any) => {
      if (values[0] !== null) {
        const returnData = values[0] as Array<DeliveryAddressModel>;
        returnData.forEach(value => {
          this.deliveryAddressList.push(value);
        });
        if (this.deliveryAddressList.length > 0) {
          this.selectedRecord.data.deliveryAddressPrimaryKey = this.deliveryAddressList[0].primaryKey;
        }
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
      this.selectedRecord = value.returnData as SalesOrderMainModel;
      this.recordDate = getDateForInput(this.selectedRecord.data.recordDate);
      this.populateDeliveryAddressList();
      this.populatePriceList();
      this.populateDiscountList();
      this.populateStorageList();
      this.populateTermList();
      this.populatePaymentTypeList();

      await this.sodService.getMainItemsWithOrderPrimaryKey(this.selectedRecord.data.primaryKey)
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

  async btnShowJsonDataDetail_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedDetail, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnReturnList_Click(): Promise<void> {
    this.selectedRecord = undefined;
    await this.route.navigate(['sales-offer', {}]);
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
      this.populatePriceList();
      this.populateDiscountList();
      this.populateStorageList();
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
                this.generateModule(false, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla onaylandı.');
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
      list.push('customer');
      list.push('customer-supplier');
      const modalRef = this.modalService.open(CustomerSelectComponent, {size: 'lg'});
      modalRef.componentInstance.customer = this.selectedRecord.customer;
      modalRef.componentInstance.customerTypes = list;
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedRecord.customer = result;
          this.selectedRecord.data.customerPrimaryKey = this.selectedRecord.customer.data.primaryKey;
          this.populateDeliveryAddressList();
        }
      });
    } catch (error) {
      await this.infoService.error(error);
    }
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
      this.selectedDetail = record as SalesOrderDetailMainModel;
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
        });
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
      this.selectedDetail.data.price = this.selectedDetail.data.listPrice / this.selectedDetail.data.unitValue;
      this.selectedDetail.data.defaultPrice = this.selectedDetail.data.listPrice / this.selectedDetail.data.unitValue;
      setOrderDetailCalculation(this.selectedDetail);
    });
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