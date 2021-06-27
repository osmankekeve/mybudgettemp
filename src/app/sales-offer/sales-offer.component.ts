import { ShortCutRecordService } from '../services/short-cut.service';
import { getNumber } from './../core/correct-library';
import { TermService } from './../services/term.service';
import { DefinitionMainModel } from './../models/definition-main-model';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore, CollectionReference, Query } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { ExcelService } from '../services/excel-service';
import { Router } from '@angular/router';
import { SalesOrderMainModel } from '../models/sales-order-main-model';
import { SalesOrderService } from '../services/sales-order.service';
import { SalesOrderDetailMainModel } from '../models/sales-order-detail-main-model';
import { setOrderDetailCalculation } from '../models/sales-order-detail-main-model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomerSelectComponent } from '../partials/customer-select/customer-select.component';
import {
  currencyFormat,
  getDateForInput, getDateTimeForInput, getFirstDayOfMonthForInput,
  getFloat,
  getInputDataForInsert,
  getTodayForInput, isNullOrEmpty,
  moneyFormat
} from '../core/correct-library';
import { PriceListModel } from '../models/price-list-model';
import { DiscountListModel } from '../models/discount-list-model';
import { PriceListService } from '../services/price-list.service';
import { DiscountListService } from '../services/discount-list.service';
import { DefinitionModel } from '../models/definition-model';
import { DefinitionService } from '../services/definition.service';
import { DeliveryAddressModel } from '../models/delivery-address-model';
import { DeliveryAddressService } from '../services/delivery-address.service';
import { SalesOrderDetailService } from '../services/sales-order-detail.service';
import { SettingModel } from '../models/setting-model';
import { ProductSelectComponent } from '../partials/product-select/product-select.component';
import { ProductPriceService } from '../services/product-price.service';
import { SettingService } from '../services/setting.service';
import { ProductUnitModel } from '../models/product-unit-model';
import { ProductUnitService } from '../services/product-unit.service';
import { ProductDiscountService } from '../services/product-discount.service';
import { ProductDiscountModel } from '../models/product-discount-model';
import { ProductPriceMainModel } from '../models/product-price-main-model';
import { setOrderCalculation } from '../models/sales-order-model';
import { ProductUnitMappingService } from '../services/product-unit-mapping.service';
import { ProductUnitMappingModel } from '../models/product-unit-mapping-model';
import { ToastService } from '../services/toast.service';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { CampaignModel } from '../models/campaign-model';
import { CampaignService } from '../services/campaign.service';
import { CampaignDetailService } from '../services/campaign-detail.service';
import { CampaignDetailModel } from '../models/campaign-detail-model';
import { ProductService } from '../services/product.service';
import { PDFModuleComponent } from '../partials/pdf-module/pdf-module.component';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { Subscription } from 'rxjs';
import { RecordedTransactionComponent } from '../partials/recorded-transaction/recorded-transaction.component';
import { ShortCutRecordMainModel } from '../models/short-cut-main-model';
import { SalesOrderDetailModel } from '../models/sales-order-detail-model';

@Component({
  selector: 'app-sales-offer',
  templateUrl: './sales-offer.component.html',
  styleUrls: ['./sales-offer.component.css']
})
export class SalesOfferComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<SalesOrderMainModel>;
  selectedRecord: SalesOrderMainModel;
  selectedDetail: SalesOrderDetailMainModel;
  searchText: '';
  productSearchText: '';
  onTransaction = false;
  recordDate: any;
  isNewPanelOpened = false;
  productType = 'normal';
  date = new Date();
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
    filterStatus: '-1',
  };
  totalValues = {
    totalPrice: 0,
    totalPriceWithTax: 0,
  };
  mainControls = {
    isAutoReceiptNoAvaliable: false,
    tableName: '',
    primaryKey: '',
    shortCut: {
      header: 'Hızlı Kayıt Seçimi..',
      title: '',
      primaryKey: '-1',
      isOpened: false
    },
  };

  priceLists: Array<PriceListModel>;
  discountLists: Array<DiscountListModel>;
  storageList: Array<DefinitionModel>;
  termList: Array<DefinitionModel>;
  paymentList: Array<DefinitionModel>;
  deliveryAddressList: Array<DeliveryAddressModel>;
  unitList: Array<ProductUnitModel>;
  packetCampaignList: Array<CampaignModel>;

  constructor(protected authService: AuthenticationService, protected service: SalesOrderService, protected toastService: ToastService,
    protected infoService: InformationService, protected excelService: ExcelService, protected db: AngularFirestore,
    protected route: Router, protected modalService: NgbModal, protected plService: PriceListService,
    protected dService: DiscountListService, protected defService: DefinitionService, protected sService: SettingService,
    protected daService: DeliveryAddressService, protected sodService: SalesOrderDetailService,
    protected puService: ProductUnitService, protected ppService: ProductPriceService, protected pService: ProductService,
    protected pdService: ProductDiscountService, protected setService: SettingService, protected cdService: CampaignDetailService,
    protected pumService: ProductUnitMappingService, protected campService: CampaignService, protected termService: TermService,
    protected shortCutService: ShortCutRecordService) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.selectedRecord = undefined;
    this.selectedDetail = undefined;
    this.populateList();
  }

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
    }
  }

  async generateModule(isReload: boolean, primaryKey: string, error: any, info: any): Promise<void> {
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      if (isReload) {
        this.showSelectedRecord(this.selectedRecord);
      } else {
        this.clearSelectedRecord();
        this.selectedRecord = undefined;
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  generateMainControls() {
    this.mainControls.tableName = this.service.tableName;
    this.mainControls.primaryKey = this.selectedRecord.data.primaryKey;
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
    this.mainList$ = this.service.getMainItemsBetweenDates(beginDate, finishDate, type).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as SalesOrderMainModel;
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
    Promise.all([this.plService.getPriceLists(list, 'sales'), this.setService.getItem('defaultPriceListPrimaryKey')])
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
    Promise.all([this.dService.getDiscountLists(list, 'sales'), this.setService.getItem('defaultDiscountListPrimaryKey')])
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

  populatePacketCampaignList(): void {
    const list = Array<boolean>();
    list.push(true);
    Promise.all([this.campService.getAvaliableCampaignsAsPromise('packet', this.selectedRecord.data.primaryKey === null)])
      .then((values: any) => {
        this.packetCampaignList = [];
        if (values[0] !== null) {
          const returnData = values[0] as Array<CampaignModel>;
          returnData.forEach(value => {
            this.packetCampaignList.push(value);
          });
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
        if (values[1] !== null && !this.selectedRecord.data.primaryKey) {
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
    this.clearSelectedDetail();
    this.service.getItem(record.data.primaryKey).then(async value => {
      this.selectedRecord = value.returnData as SalesOrderMainModel;
      this.recordDate = getDateForInput(this.selectedRecord.data.recordDate);
      this.generateMainControls();
      this.calculateTerm();
      this.populateDeliveryAddressList();
      this.populatePriceList();
      this.populateDiscountList();
      this.populateStorageList();
      this.populateTermList();
      this.populatePaymentTypeList();
      this.populateUnits();
      this.populatePacketCampaignList();

      await this.sodService.getMainItemsWithOrderPrimaryKey(this.selectedRecord.data.primaryKey)
        .then((list) => {
          this.selectedRecord.orderDetailList = [];
          this.selectedRecord.orderDetailList = list;
        });
    });
  }

  async getReceiptNo(): Promise<void> {
    this.mainControls.isAutoReceiptNoAvaliable = false;
    const receiptNoData = await this.sService.getOrderCode();
    if (receiptNoData !== null) {
      this.selectedRecord.data.receiptNo = receiptNoData;
      this.mainControls.isAutoReceiptNoAvaliable = true;
    }
  }

  async calculateTerm(): Promise<void> {
    const record = await this.defService.getItem(this.selectedRecord.data.termPrimaryKey);
    if (record) {
      const term = record.returnData as DefinitionMainModel;
      const date = new Date(this.selectedRecord.data.recordDate);
      this.selectedRecord.termList = [];
      for (let i = 0; i <= term.data.custom2.split(';').length - 1; ++i) {
        const item = this.termService.clearSubModel();
        item.dayCount = getNumber(term.data.custom2.split(';')[i]);
        item.termAmount = this.selectedRecord.data.totalPriceWithTax / term.data.custom2.split(';').length;
        item.termDate = date.setDate(date.getDate() + item.dayCount);
        this.selectedRecord.termList.push(item);
      }
    }
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
      this.selectedRecord.orderDetailList = [];
      this.packetCampaignList = [];
      this.getReceiptNo();
      this.generateMainControls();
      this.populatePriceList();
      this.populateDiscountList();
      this.populateStorageList();
      this.populateTermList();
      this.populatePaymentTypeList();
      this.populatePacketCampaignList();
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.recordDate = getInputDataForInsert(this.recordDate);
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async () => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            setOrderCalculation(this.selectedRecord);
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla tamamlandı.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          } else {
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
          .then(async () => {
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
        .then(async () => {
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
      const modalRef = this.modalService.open(CustomerSelectComponent, { size: 'lg' });
      modalRef.componentInstance.customer = this.selectedRecord.customer;
      modalRef.componentInstance.customerTypes = list;
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedRecord.customer = result;
          this.selectedRecord.data.customerPrimaryKey = this.selectedRecord.customer.data.primaryKey;
          this.selectedRecord.data.termPrimaryKey = this.selectedRecord.customer.data.termKey;
          this.selectedRecord.data.paymentTypePrimaryKey = this.selectedRecord.customer.data.paymentTypeKey;
          this.populateDeliveryAddressList();
          this.calculateTerm();
        }
      }, () => { });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExportToExcel_Click(): Promise<void> {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'sales-order');
    } else {
      await this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnShowShortCut_Click(): Promise<void> {
    try {
      if (this.mainControls.shortCut.isOpened) {
        this.mainControls.shortCut.isOpened = false;
      }
      else {
        this.mainControls.shortCut.isOpened = true;
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSaveShortCut_Click(): Promise<void> {
    try {
      if (this.mainControls.shortCut.title === '') {
        this.toastService.error('Lütfen başlık giriniz.');
      }
      else {
        const data = this.shortCutService.clearSubModel();
        data.title = this.mainControls.shortCut.title;
        data.parentRecordPrimaryKey = this.selectedRecord.data.primaryKey;
        data.parentRecordType = 'sales-order';
        this.shortCutService.addItem(data);
        this.toastService.success('Kayıt Hızlı İşlemlere başarıyla eklendi.');
        this.clearShortCutRecord();
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRecordedTransaction_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(RecordedTransactionComponent, { size: 'md' });
      modalRef.componentInstance.module = "sales-order";
      modalRef.result.then(async (result: any) => {
        if (result) {
          this.onTransaction = true;
          this.mainControls.shortCut.header = result.data.title;
          this.mainControls.shortCut.primaryKey = result.data.parentRecordPrimaryKey;

          this.onTransaction = true;
          await this.service.getItem(this.mainControls.shortCut.primaryKey).then(async value => {
            this.selectedRecord = value.returnData as SalesOrderMainModel;
            this.generateMainControls();
            this.populateDeliveryAddressList();
            this.getReceiptNo();
            this.db.collection(this.sodService.tableName, ref => {
              let query: CollectionReference | Query = ref;
              query = query.where('orderPrimaryKey', '==', this.selectedRecord.data.primaryKey);
              return query;
            }).get().toPromise().then(snapshot => {
              this.selectedRecord.orderDetailList = [];
              snapshot.forEach(async doc => {
                const data = doc.data() as SalesOrderDetailModel;

                const returnData = new SalesOrderDetailMainModel();
                returnData.data = this.sodService.checkFields(data);

                const p = await this.pService.getItem(data.productPrimaryKey);
                returnData.product = p.returnData;

                const pu = await this.puService.getItem(data.unitPrimaryKey);
                returnData.unit = pu.returnData.data;

                setOrderDetailCalculation(returnData);

                data.primaryKey = this.db.createId();
                data.orderPrimaryKey = '-1';
                this.selectedRecord.orderDetailList.push(returnData);
              });
            }).catch((error) => {
              this.finishProcess(error, null);
            });
            this.recordDate = getTodayForInput();
            this.selectedRecord.data.primaryKey = null;
            this.selectedRecord.data.insertDate = Date.now();
            this.selectedRecord.data.recordDate = getInputDataForInsert(this.recordDate);
            this.calculateTerm();
            this.finishSubProcess(null, 'Sipariş işleme hazır.');
          }).catch((error) => {
            this.finishProcess(error, null);
          });
        }
      }, () => { });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async onChangeType() {
    try {
      this.clearSelectedDetail();
      this.selectedRecord.orderDetailList = [];
      setOrderCalculation(this.selectedRecord);
      this.calculateTerm();
      if (this.selectedRecord.data.type === 'service') {
        this.productType = 'service';
      } else {
        this.productType = 'normal';
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnDetailExportToExcel_Click(): Promise<void> {
    if (this.selectedRecord.orderDetailList.length > 0) {
      this.excelService.exportToExcel(this.selectedRecord.orderDetailList, 'sales-order-detail');
    } else {
      await this.toastService.error('Aktarılacak kayıt bulunamadı.', true);
    }
  }

  async btnShowInfoModule_Click(): Promise<void> {
    try {
      this.modalService.open(InfoModuleComponent, { size: 'lg' });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowPDFModule_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(PDFModuleComponent, { size: 'xl' });
      modalRef.componentInstance.key = 'sales-order';
      modalRef.componentInstance.data = this.selectedRecord;

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

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(MainFilterComponent, { size: 'md' });
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.filter.filterStatus = result.filterStatus;
          this.ngOnDestroy();
          this.populateList();
        }
      }, () => { });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async ddlPacketCampaign_SelectedIndexChanged(campaignPrimaryKey: any): Promise<void> {
    try {
      if (campaignPrimaryKey === '-1') {
        this.selectedRecord.data.campaignPrimaryKey = '-1';
        this.selectedRecord.data.campaignQuantity = 0;
        this.selectedRecord.orderDetailList = [];
        setOrderCalculation(this.selectedRecord);
      } else {
        this.selectedRecord.data.campaignQuantity = 1;
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnCreatePacketCampaign_Click(): Promise<void> {
    try {
      if (this.selectedRecord.data.campaignPrimaryKey === '-1') {
        this.toastService.error('Lütfen paket kampanya seçiniz');
      } else if (this.selectedRecord.data.campaignQuantity < 1) {
        this.toastService.error('Lütfen paket kampanya miktarı giriniz');
      } else {
        this.onTransaction = true;
        this.selectedRecord.orderDetailList = [];
        await this.db.collection('tblCampaignDetail').ref.where('campaignPrimaryKey', '==', this.selectedRecord.data.campaignPrimaryKey)
          .get().then(snapshot => {
            if (snapshot.empty) {
              console.log('No matching documents.');
              return;
            }
            snapshot.forEach(async doc => {
              const data = doc.data() as CampaignDetailModel;
              const p = await this.pService.getItem(data.productPrimaryKey);
              const pu = await this.puService.getItem(data.unitPrimaryKey);

              const a = this.sodService.clearMainModel();
              a.data.primaryKey = this.db.createId();
              a.product = p.returnData;
              a.unit = pu.returnData.data;
              a.data.productPrimaryKey = data.productPrimaryKey;
              a.data.listPrice = data.listPrice;
              a.data.price = data.price;
              a.data.defaultPrice = data.defaultPrice;
              a.data.discount1 = data.discount1;
              a.data.defaultDiscount1 = data.defaultDiscount1;
              a.data.discount2 = data.discount2;
              a.data.defaultDiscount2 = data.defaultDiscount2;
              a.data.quantity = data.quantity * this.selectedRecord.data.campaignQuantity;
              a.data.taxRate = data.taxRate;
              a.data.unitPrimaryKey = data.unitPrimaryKey;
              a.data.unitValue = data.unitValue;
              a.data.campaignPrimaryKey = this.selectedRecord.data.campaignPrimaryKey;
              this.selectedRecord.orderDetailList.push(a);
              setOrderDetailCalculation(a);
              setOrderCalculation(this.selectedRecord);
              this.calculateTerm();
            });
          });
        this.toastService.info('Paket Kampanya Teklife eklendi');
        this.onTransaction = false;
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  onChangeTermType(): void {
    try {
      this.calculateTerm();
    } catch (err) {
      this.infoService.error(err);
    }
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
    this.recordDate = getTodayForInput();
    this.clearShortCutRecord();
  }

  clearShortCutRecord(): void {
    this.mainControls.shortCut.header = 'Hızlı Kayıt Seçimi..';
    this.mainControls.shortCut.title = '';
    this.mainControls.shortCut.isOpened = false;
    this.mainControls.primaryKey = "-1";
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
    this.selectedDetail = record as SalesOrderDetailMainModel;
    if (this.selectedDetail.data.campaignPrimaryKey !== '-1'
      && this.selectedDetail.data.campaignPrimaryKey === this.selectedRecord.data.campaignPrimaryKey) {
      this.toastService.warning('Paket Kampanya detayı düzenlenemez', true);
      this.clearSelectedDetail();
    } else if (this.selectedRecord.data.status === 'waitingForApprove') {
      this.isNewPanelOpened = true;
    } else {
      this.toastService.warning('Sipariş detayı düzenlemeye kapalıdır', true);
      this.clearSelectedDetail();
    }
  }

  async btnSelectProduct_Click(): Promise<void> {
    try {
      if (this.selectedRecord.data.priceListPrimaryKey === '-1') {
        await this.infoService.error('Lütfen fiyat listesi seçiniz.');
      } else if (this.selectedRecord.data.priceListPrimaryKey === '-1') {
        await this.infoService.error('Lütfen iskonto listesi seçiniz.');
      } else {
        const modalRef = this.modalService.open(ProductSelectComponent, { size: 'lg' });
        modalRef.componentInstance.product = this.selectedDetail.product;
        modalRef.componentInstance.productStockTypes = [this.productType];
        modalRef.result.then((result: any) => {
          if (result) {
            this.selectedDetail.product = result;
            this.selectedDetail.data.taxRate = this.selectedDetail.product.data.taxRate;
            this.selectedDetail.data.productPrimaryKey = this.selectedDetail.product.data.primaryKey;
            this.populateProductAfterSelectData();
          }
        }, () => { });
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
        .then(async () => {
          if (this.selectedDetail.data.primaryKey == null) {
            this.selectedDetail.data.primaryKey = this.db.createId();
            this.selectedRecord.orderDetailList.push(this.selectedDetail);
            setOrderDetailCalculation(this.selectedDetail);
            setOrderCalculation(this.selectedRecord);
            this.calculateTerm();
            await this.finishSubProcess(null, 'Ürün başarıyla sipariş listesine eklendi');
          } else {
            this.selectedRecord.orderDetailList.forEach(item => {
              if (item.data.primaryKey === this.selectedDetail.data.primaryKey) {
                this.selectedRecord.orderDetailList[this.selectedRecord.orderDetailList.indexOf(item)] = this.selectedDetail;
                return;
              }
            });

            setOrderDetailCalculation(this.selectedDetail);
            setOrderCalculation(this.selectedRecord);
            this.calculateTerm();
            await this.finishSubProcess(null, 'Ürün başarıyla düzenlendi');
          }
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
      this.selectedRecord.orderDetailList.forEach(item => {
        if (item.data.primaryKey === this.selectedDetail.data.primaryKey) {
          this.selectedRecord.orderDetailList.splice(this.selectedRecord.orderDetailList.indexOf(item), 1);
          return;
        }
      });
      setOrderCalculation(this.selectedRecord);
      this.calculateTerm();
      this.clearSelectedDetail();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnReturnOrderDetailList_Click(): Promise<void> {
    try {
      this.clearSelectedDetail();
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

  clearSelectedDetail(): void {
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

  focus_quantity(): void {
    if (this.selectedDetail.data.quantity === 0) {
      this.selectedDetail.data.quantity = null;
    }
  }

  async finishSubProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info, true);
        this.clearSelectedDetail();
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

}

