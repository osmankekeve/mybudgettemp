import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { SettingService } from '../services/setting.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {ProductUnitService} from '../services/product-unit.service';
import {DefinitionModel} from '../models/definition-model';
import {DiscountListService} from '../services/discount-list.service';
import {DefinitionService} from '../services/definition.service';
import {PriceListModel} from '../models/price-list-model';
import {DiscountListModel} from '../models/discount-list-model';
import {PriceListService} from '../services/price-list.service';
import {SalesOrderService} from '../services/sales-order.service';
import {ToastService} from '../services/toast.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit {
  unitList: Array<ProductUnitModel>;
  storageList: Array<DefinitionModel>;
  priceLists: Array<PriceListModel>;
  discountLists: Array<DiscountListModel>;
  general = {
    defaultCurrencyCode: 'lira',
    defaultStoragePrimaryKey: '-1',
    defaultPriceListPrimaryKey: '-1',
    defaultDiscountListPrimaryKey: '-1'
  };
  purchaseInvoice = {
    prefix: '',
    number: '',
    suffix: '',
    length: '',
    chart1Visibility: false,
    chart2Visibility: false
  };
  payment = {
    prefix: '',
    number: '',
    suffix: '',
    length: '',
    chart1Visibility: false,
    chart2Visibility: false
  };
  salesInvoice = {
    prefix: '',
    number: '',
    suffix: '',
    length: '',
    chart1Visibility: false,
    chart2Visibility: false
  };
  collection = {
    prefix: '',
    number: '',
    suffix: '',
    length: '',
    chart1Visibility: false,
    chart2Visibility: false
  };
  accountVoucher = {
    prefix: '',
    number: '',
    suffix: '',
    length: '',
    chart1Visibility: false,
    chart2Visibility: false
  };
  cashDeskVoucher = {
    prefix: '',
    number: '',
    suffix: '',
    length: '',
    chart1Visibility: false,
    chart2Visibility: false
  };
  customer = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };
  product = {
    prefix: '',
    number: '',
    suffix: '',
    length: '',
    defaultUnitCode: ''
  };
  order = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };
  openedPanel = 'general';

  constructor(protected authService: AuthenticationService, protected service: SettingService, protected infoService: InformationService,
              protected db: AngularFirestore, protected puService: ProductUnitService, protected defService: DefinitionService,
              protected plService: PriceListService, protected dService: DiscountListService, protected toastService: ToastService) { }

  async ngOnInit() {
    await this.populateUnits();
    await this.populateStorages();
    await this.populatePriceList();
    await this.populateDiscountList();
    this.service.getAllItems().subscribe(list => {
      list.forEach((item: any) => {
        if (item.key === 'purchaseInvoicePrefix') {
          this.purchaseInvoice.prefix = item.value;
        }
        if (item.key === 'purchaseInvoiceNumber') {
          this.purchaseInvoice.number = item.value;
        }
        if (item.key === 'purchaseInvoiceSuffix') {
          this.purchaseInvoice.suffix = item.value;
        }
        if (item.key === 'purchaseInvoiceLength') {
          this.purchaseInvoice.length = item.value;
        }
        if (item.key === 'purchaseChart1Visibility') {
          this.purchaseInvoice.chart1Visibility = item.valueBool;
        }
        if (item.key === 'purchaseChart2Visibility') {
          this.purchaseInvoice.chart2Visibility = item.valueBool;
        }
        if (item.key === 'paymentPrefix') {
          this.payment.prefix = item.value;
        }
        if (item.key === 'paymentNumber') {
          this.payment.number = item.value;
        }
        if (item.key === 'paymentSuffix') {
          this.payment.suffix = item.value;
        }
        if (item.key === 'paymentLength') {
          this.payment.length = item.value;
        }
        if (item.key === 'paymentChart1Visibility') {
          this.payment.chart1Visibility = item.valueBool;
        }
        if (item.key === 'paymentChart2Visibility') {
          this.payment.chart2Visibility = item.valueBool;
        }
        if (item.key === 'salesInvoicePrefix') {
          this.salesInvoice.prefix = item.value;
        }
        if (item.key === 'salesInvoiceNumber') {
          this.salesInvoice.number = item.value;
        }
        if (item.key === 'salesInvoiceSuffix') {
          this.salesInvoice.suffix = item.value;
        }
        if (item.key === 'salesInvoiceLength') {
          this.salesInvoice.length = item.value;
        }
        if (item.key === 'salesChart1Visibility') {
          this.salesInvoice.chart1Visibility = item.valueBool;
        }
        if (item.key === 'salesChart2Visibility') {
          this.salesInvoice.chart2Visibility = item.valueBool;
        }
        if (item.key === 'collectionPrefix') {
          this.collection.prefix = item.value;
        }
        if (item.key === 'collectionNumber') {
          this.collection.number = item.value;
        }
        if (item.key === 'collectionSuffix') {
          this.collection.suffix = item.value;
        }
        if (item.key === 'collectionLength') {
          this.collection.length = item.value;
        }
        if (item.key === 'collectionChart1Visibility') {
          this.collection.chart1Visibility = item.valueBool;
        }
        if (item.key === 'collectionChart2Visibility') {
          this.collection.chart2Visibility = item.valueBool;
        }
        if (item.key === 'accountVoucherPrefix') {
          this.accountVoucher.prefix = item.value;
        }
        if (item.key === 'accountVoucherNumber') {
          this.accountVoucher.number = item.value;
        }
        if (item.key === 'accountVoucherSuffix') {
          this.accountVoucher.suffix = item.value;
        }
        if (item.key === 'accountVoucherLength') {
          this.accountVoucher.length = item.value;
        }
        if (item.key === 'accountChart1Visibility') {
          this.accountVoucher.chart1Visibility = item.valueBool;
        }
        if (item.key === 'accountChart2Visibility') {
          this.accountVoucher.chart2Visibility = item.valueBool;
        }
        if (item.key === 'cashDeskVoucherPrefix') {
          this.cashDeskVoucher.prefix = item.value;
        }
        if (item.key === 'cashDeskVoucherNumber') {
          this.cashDeskVoucher.number = item.value;
        }
        if (item.key === 'cashDeskVoucherSuffix') {
          this.cashDeskVoucher.suffix = item.value;
        }
        if (item.key === 'cashDeskVoucherLength') {
          this.cashDeskVoucher.length = item.value;
        }
        if (item.key === 'cashDeskChart1Visibility') {
          this.cashDeskVoucher.chart1Visibility = item.valueBool;
        }
        if (item.key === 'cashDeskChart2Visibility') {
          this.cashDeskVoucher.chart2Visibility = item.valueBool;
        }
        if (item.key === 'customerPrefix') {
          this.customer.prefix = item.value;
        }
        if (item.key === 'customerNumber') {
          this.customer.number = item.value;
        }
        if (item.key === 'customerSuffix') {
          this.customer.suffix = item.value;
        }
        if (item.key === 'customerLength') {
          this.customer.length = item.value;
        }
        if (item.key === 'productPrefix') {
          this.product.prefix = item.value;
        }
        if (item.key === 'productNumber') {
          this.product.number = item.value;
        }
        if (item.key === 'productSuffix') {
          this.product.suffix = item.value;
        }
        if (item.key === 'productLength') {
          this.product.length = item.value;
        }
        if (item.key === 'defaultUnitCode') {
          this.product.defaultUnitCode = item.value;
        }
        if (item.key === 'defaultCurrencyCode') {
          this.general.defaultCurrencyCode = item.value;
        }
        if (item.key === 'defaultStoragePrimaryKey') {
          this.general.defaultStoragePrimaryKey = item.value;
        }
        if (item.key === 'defaultPriceListPrimaryKey') {
          this.general.defaultPriceListPrimaryKey = item.value;
        }
        if (item.key === 'defaultDiscountListPrimaryKey') {
          this.general.defaultDiscountListPrimaryKey = item.value;
        }
        if (item.key === 'orderPrefix') {
          this.order.prefix = item.value;
        }
        if (item.key === 'orderNumber') {
          this.order.number = item.value;
        }
        if (item.key === 'orderSuffix') {
          this.order.suffix = item.value;
        }
        if (item.key === 'orderLength') {
          this.order.length = item.value;
        }
      });
    });
  }

  async btnSavePurchaseInvoiceAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'purchaseInvoicePrefix', value: this.purchaseInvoice.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'purchaseInvoiceNumber', value: this.purchaseInvoice.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'purchaseInvoiceSuffix', value: this.purchaseInvoice.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'purchaseInvoiceLength', value: this.purchaseInvoice.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Alım faturası ayarları kaydedildi.', true);
    });

  }

  async btnSavePaymentAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'paymentPrefix', value: this.payment.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'paymentNumber', value: this.payment.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'paymentSuffix', value: this.payment.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'paymentLength', value: this.payment.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Ödeme ayarları kaydedildi.', true);
    });
  }

  async btnSaveSalesInvoiceAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'salesInvoicePrefix', value: this.salesInvoice.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'salesInvoiceNumber', value: this.salesInvoice.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'salesInvoiceSuffix', value: this.salesInvoice.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'salesInvoiceLength', value: this.salesInvoice.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Satış faturası ayarları kaydedildi.', true);
    });
  }

  async btnSaveCollectionAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'collectionPrefix', value: this.collection.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'collectionNumber', value: this.collection.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'collectionSuffix', value: this.collection.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'collectionLength', value: this.collection.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Tahsilat ayarları kaydedildi.', true);
    });
  }

  async btnSaveAccountVoucherAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'accountVoucherPrefix', value: this.accountVoucher.prefix, valueBool: false, valueNumber: 0 }),
    await this.service.setItem({ key: 'accountVoucherNumber', value: this.accountVoucher.number, valueBool: false, valueNumber: 0 }),
    await this.service.setItem({ key: 'accountVoucherSuffix', value: this.accountVoucher.suffix, valueBool: false, valueNumber: 0 }),
    await this.service.setItem({ key: 'accountVoucherLength', value: this.accountVoucher.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Cari fiş ayarları kaydedildi.', true);
    });
  }

  async btnSaveCashDeskVoucherAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'cashDeskVoucherPrefix', value: this.cashDeskVoucher.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'cashDeskVoucherNumber', value: this.cashDeskVoucher.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'cashDeskVoucherSuffix', value: this.cashDeskVoucher.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'cashDeskVoucherLength', value: this.cashDeskVoucher.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Kasa fiş ayarları kaydedildi.', true);
    });
  }

  async btnSaveCustomerAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'customerPrefix', value: this.customer.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'customerNumber', value: this.customer.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'customerSuffix', value: this.customer.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'customerLength', value: this.customer.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Müşteri ayarları kaydedildi.', true);
    });
  }

  async btnSaveProductAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'productPrefix', value: this.product.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'productNumber', value: this.product.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'productSuffix', value: this.product.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'productLength', value: this.product.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Ürün ayarları kaydedildi.', true);
    });
  }

  async btnSaveOrderAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'orderPrefix', value: this.order.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'orderNumber', value: this.order.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'orderSuffix', value: this.order.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'orderLength', value: this.order.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.toastService.success('Sipariş ayarları kaydedildi.', true);
    });
  }

  async cbChart1Visibility_Changed(module: string): Promise<void> {
    const data = this.service.cleanModel();
    if (module === 'salesInvoice') {
      data.key = 'salesChart1Visibility';
      data.valueBool = this.salesInvoice.chart1Visibility;
    } else if (module === 'collection') {
      data.key = 'collectionChart1Visibility';
      data.valueBool = this.collection.chart1Visibility;
    }
    else if (module === 'purchaseInvoice') {
      data.key = 'purchaseChart1Visibility';
      data.valueBool = this.purchaseInvoice.chart1Visibility;
    }
    else if (module === 'payment') {
      data.key = 'paymentChart1Visibility';
      data.valueBool = this.payment.chart1Visibility;
    }
    else if (module === 'accountVoucher') {
      data.key = 'accountChart1Visibility';
      data.valueBool = this.accountVoucher.chart1Visibility;
    }
    else if (module === 'cashDeskVoucher') {
      data.key = 'cashDeskChart1Visibility';
      data.valueBool = this.cashDeskVoucher.chart1Visibility;
    }
    else {
      // nothing
    }
    await this.service.setItem(data).then(()=> {
      this.toastService.success('Grafik 1 için seçim işlemi tamamlandı', true)
    }).catch(err => this.toastService.error(err, true));
  }

  async cbChart2Visibility_Changed(module: string): Promise<void> {
    const data = this.service.cleanModel();
    if (module === 'salesInvoice') {
      data.key = 'salesChart2Visibility';
      data.valueBool = this.salesInvoice.chart2Visibility;
    }
    else if (module === 'collection') {
      data.key = 'collectionChart2Visibility';
      data.valueBool = this.collection.chart2Visibility;
    }
    else if (module === 'purchaseInvoice') {
      data.key = 'purchaseChart2Visibility';
      data.valueBool = this.purchaseInvoice.chart2Visibility;
    }
    else if (module === 'payment') {
      data.key = 'paymentChart2Visibility';
      data.valueBool = this.payment.chart2Visibility;
    }
    else if (module === 'accountVoucher') {
      data.key = 'accountChart2Visibility';
      data.valueBool = this.accountVoucher.chart2Visibility;
    }
    else if (module === 'cashDeskVoucher') {
      data.key = 'cashDeskChart2Visibility';
      data.valueBool = this.cashDeskVoucher.chart2Visibility;
    }
    else {
      // nothing
    }
    await this.service.setItem(data).then(()=> {
      this.toastService.success('Grafik 2 için seçim işlemi tamamlandı', true)
    }).catch(err => this.toastService.error(err, true));
  }

  async onChangeDefaultCurrencyType(value: string): Promise<void> {
    const data = this.service.cleanModel();
    data.key = 'defaultCurrencyCode';
    data.value = value;
    await this.service.setItem(data).then(()=> {
      this.toastService.success('Varsayılan döviz tipi güncellendi', true)
    }).catch(err => this.toastService.error(err, true));
  }

  async onChangeDefaultUnitCode(value: string): Promise<void> {
    const data = this.service.cleanModel();
    data.key = 'defaultUnitCode';
    data.value = value;
    await this.service.setItem(data).then(()=> {
      this.toastService.success('Varsayılan birim tipi güncellendi', true)
    }).catch(err => this.toastService.error(err, true));
  }

  async onChangeDefaultStorage(value: string): Promise<void> {
    const data = this.service.cleanModel();
    data.key = 'defaultStoragePrimaryKey';
    data.value = value;
    await this.service.setItem(data).then(()=> {
      this.toastService.success('Varsayılan depo güncellendi', true)
    }).catch(err => this.toastService.error(err, true));
  }

  async onChangeDefaultPriceList(value: string): Promise<void> {
    const data = this.service.cleanModel();
    data.key = 'defaultPriceListPrimaryKey';
    data.value = value;
    await this.service.setItem(data).then(()=> {
      this.toastService.success('Varsayılan fiyat listesi güncellendi', true)
    }).catch(err => this.toastService.error(err, true));
  }

  async onChangeDefaultDiscountList(value: string): Promise<void> {
    const data = this.service.cleanModel();
    data.key = 'defaultDiscountListPrimaryKey';
    data.value = value;
    await this.service.setItem(data).then(()=> {
      this.toastService.success('Varsayılan iskonto listesi güncellendi', true)
    }).catch(err => this.toastService.error(err, true));
  }

  async populateUnits(): Promise<void> {
    this.unitList = [];
    const units = await this.puService.getItemsForSelect();
    units.forEach(item => {
      this.unitList.push(item);
    });
  }

  async populateStorages(): Promise<void> {
    // promise select func.
    this.storageList = [];
    const data = await this.defService.getItemsForFill('storage');
    data.forEach(item => {
      this.storageList.push(item);
    });
  }

  async populatePriceList(): Promise<void> {
    // promise select func.
    const list = Array<boolean>();
    list.push(true);
    this.priceLists = [];
    const data = await this.plService.getPriceLists(list, 'sales');
    data.forEach(item => {
      this.priceLists.push(item);
    });
  }

  async populateDiscountList(): Promise<void> {
    // promise select func.
    const list = Array<boolean>();
    list.push(true);
    this.discountLists = [];
    const data = await this.dService.getDiscountLists(list, 'sales');
    data.forEach(item => {
      this.discountLists.push(item);
    });
  }

}
