import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { SettingService } from '../services/setting.service';
import {getBool} from '../core/correct-library';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit {
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
  general = {
    defaultCurrencyCode: 'lira'
  };
  customer = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };
  openedPanel = 'general';

  constructor(public authService: AuthenticationService, public service: SettingService, public infoService: InformationService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.service.getAllItems().subscribe(list => {
      list.forEach((item: any) => {
        if (item.key === 'purchaseInvoicePrefix') {
          this.purchaseInvoice.prefix = item.value;
        } else if (item.key === 'purchaseInvoiceNumber') {
          this.purchaseInvoice.number = item.value;
        } else if (item.key === 'purchaseInvoiceSuffix') {
          this.purchaseInvoice.suffix = item.value;
        } else if (item.key === 'purchaseInvoiceLength') {
          this.purchaseInvoice.length = item.value;
        } else if (item.key === 'purchaseChart1Visibility') {
          this.purchaseInvoice.chart1Visibility = item.valueBool;
        } else if (item.key === 'purchaseChart2Visibility') {
          this.purchaseInvoice.chart2Visibility = item.valueBool;
        } else if (item.key === 'paymentPrefix') {
          this.payment.prefix = item.value;
        } else if (item.key === 'paymentNumber') {
          this.payment.number = item.value;
        } else if (item.key === 'paymentSuffix') {
          this.payment.suffix = item.value;
        } else if (item.key === 'paymentLength') {
          this.payment.length = item.value;
        } else if (item.key === 'paymentChart1Visibility') {
          this.payment.chart1Visibility = item.valueBool;
        } else if (item.key === 'paymentChart2Visibility') {
          this.payment.chart2Visibility = item.valueBool;
        } else if (item.key === 'salesInvoicePrefix') {
          this.salesInvoice.prefix = item.value;
        } else if (item.key === 'salesInvoiceNumber') {
          this.salesInvoice.number = item.value;
        } else if (item.key === 'salesInvoiceSuffix') {
          this.salesInvoice.suffix = item.value;
        } else if (item.key === 'salesInvoiceLength') {
          this.salesInvoice.length = item.value;
        } else if (item.key === 'salesChart1Visibility') {
          this.salesInvoice.chart1Visibility = item.valueBool;
        } else if (item.key === 'salesChart2Visibility') {
          this.salesInvoice.chart2Visibility = item.valueBool;
        } else if (item.key === 'collectionPrefix') {
          this.collection.prefix = item.value;
        } else if (item.key === 'collectionNumber') {
          this.collection.number = item.value;
        } else if (item.key === 'collectionSuffix') {
          this.collection.suffix = item.value;
        } else if (item.key === 'collectionLength') {
          this.collection.length = item.value;
        } else if (item.key === 'collectionChart1Visibility') {
          this.collection.chart1Visibility = item.valueBool;
        } else if (item.key === 'collectionChart2Visibility') {
          this.collection.chart2Visibility = item.valueBool;
        } else if (item.key === 'accountVoucherPrefix') {
          this.accountVoucher.prefix = item.value;
        } else if (item.key === 'accountVoucherNumber') {
          this.accountVoucher.number = item.value;
        } else if (item.key === 'accountVoucherSuffix') {
          this.accountVoucher.suffix = item.value;
        } else if (item.key === 'accountVoucherLength') {
          this.accountVoucher.length = item.value;
        } else if (item.key === 'accountChart1Visibility') {
          this.accountVoucher.chart1Visibility = item.valueBool;
        } else if (item.key === 'accountChart2Visibility') {
          this.accountVoucher.chart2Visibility = item.valueBool;
        } else if (item.key === 'cashDeskVoucherPrefix') {
          this.cashDeskVoucher.prefix = item.value;
        } else if (item.key === 'cashDeskVoucherNumber') {
          this.cashDeskVoucher.number = item.value;
        } else if (item.key === 'cashDeskVoucherSuffix') {
          this.cashDeskVoucher.suffix = item.value;
        } else if (item.key === 'cashDeskVoucherLength') {
          this.cashDeskVoucher.length = item.value;
        } else if (item.key === 'cashDeskChart1Visibility') {
          this.cashDeskVoucher.chart1Visibility = item.valueBool;
        } else if (item.key === 'cashDeskChart2Visibility') {
          this.cashDeskVoucher.chart2Visibility = item.valueBool;
        } else if (item.key === 'defaultCurrencyCode') {
          this.general.defaultCurrencyCode = item.value;
        } else if (item.key === 'customerPrefix') {
          this.customer.prefix = item.value;
        } else if (item.key === 'customerNumber') {
          this.customer.number = item.value;
        } else if (item.key === 'customerSuffix') {
          this.customer.suffix = item.value;
        } else if (item.key === 'customerLength') {
          this.customer.length = item.value;
        } else {

        }
      });
    });
  }

  async btnSavePurchaseInvoiceAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'purchaseInvoicePrefix', value: this.purchaseInvoice.prefix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'purchaseInvoiceNumber', value: this.purchaseInvoice.number, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'purchaseInvoiceSuffix', value: this.purchaseInvoice.suffix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'purchaseInvoiceLength', value: this.purchaseInvoice.length, valueBool: false, valueNumber: 0 });
    this.infoService.success('Alım faturası ayarları kaydedildi.');

  }

  async btnSavePaymentAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'paymentPrefix', value: this.payment.prefix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'paymentNumber', value: this.payment.number, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'paymentSuffix', value: this.payment.suffix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'paymentLength', value: this.payment.length, valueBool: false, valueNumber: 0 });
    this.infoService.success('Ödeme ayarları kaydedildi.');

  }

  async btnSaveSalesInvoiceAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'salesInvoicePrefix', value: this.salesInvoice.prefix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'salesInvoiceNumber', value: this.salesInvoice.number, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'salesInvoiceSuffix', value: this.salesInvoice.suffix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'salesInvoiceLength', value: this.salesInvoice.length, valueBool: false, valueNumber: 0 });
    this.infoService.success('Satış faturası ayarları kaydedildi.');

  }

  async btnSaveCollectionAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'collectionPrefix', value: this.collection.prefix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'collectionNumber', value: this.collection.number, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'collectionSuffix', value: this.collection.suffix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'collectionLength', value: this.collection.length, valueBool: false, valueNumber: 0 });
    this.infoService.success('Tahsilat ayarları kaydedildi.');
  }

  async btnSaveAccountVoucherAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'accountVoucherPrefix', value: this.accountVoucher.prefix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'accountVoucherNumber', value: this.accountVoucher.number, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'accountVoucherSuffix', value: this.accountVoucher.suffix, valueBool: false, valueNumber: 0 });
    await this.service.setItem({ key: 'accountVoucherLength', value: this.accountVoucher.length, valueBool: false, valueNumber: 0 });
    this.infoService.success('Cari fiş ayarları kaydedildi.');
  }

  async btnSaveCashDeskVoucherAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'cashDeskVoucherPrefix', value: this.cashDeskVoucher.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'cashDeskVoucherNumber', value: this.cashDeskVoucher.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'cashDeskVoucherSuffix', value: this.cashDeskVoucher.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'cashDeskVoucherLength', value: this.cashDeskVoucher.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.infoService.success('Kasa fiş ayarları kaydedildi.');
    });
  }

  async btnSaveCustomerAutoCode_Click(): Promise<void> {
    Promise.all([
      await this.service.setItem({ key: 'customerPrefix', value: this.customer.prefix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'customerNumber', value: this.customer.number, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'customerSuffix', value: this.customer.suffix, valueBool: false, valueNumber: 0 }),
      await this.service.setItem({ key: 'customerLength', value: this.customer.length, valueBool: false, valueNumber: 0 })
    ]).then(() => {
      this.infoService.success('Müşteri ayarları kaydedildi.');
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
    } else if (module === 'purchaseInvoice') {
      data.key = 'purchaseChart1Visibility';
      data.valueBool = this.purchaseInvoice.chart1Visibility;
    } else if (module === 'payment') {
      data.key = 'paymentChart1Visibility';
      data.valueBool = this.payment.chart1Visibility;
    } else if (module === 'accountVoucher') {
      data.key = 'accountChart1Visibility';
      data.valueBool = this.accountVoucher.chart1Visibility;
    } else if (module === 'cashDeskVoucher') {
      data.key = 'cashDeskChart1Visibility';
      data.valueBool = this.cashDeskVoucher.chart1Visibility;
    } else {
      // nothing
    }
    await this.service.setItem(data).catch(err => this.infoService.error(err));
  }

  async cbChart2Visibility_Changed(module: string): Promise<void> {
    const data = this.service.cleanModel();
    if (module === 'salesInvoice') {
      data.key = 'salesChart2Visibility';
      data.valueBool = this.salesInvoice.chart2Visibility;
    } else if (module === 'collection') {
      data.key = 'collectionChart2Visibility';
      data.valueBool = this.collection.chart2Visibility;
    } else if (module === 'purchaseInvoice') {
      data.key = 'purchaseChart2Visibility';
      data.valueBool = this.purchaseInvoice.chart2Visibility;
    } else if (module === 'payment') {
      data.key = 'paymentChart2Visibility';
      data.valueBool = this.payment.chart2Visibility;
    } else if (module === 'accountVoucher') {
      data.key = 'accountChart2Visibility';
      data.valueBool = this.accountVoucher.chart2Visibility;
    } else if (module === 'cashDeskVoucher') {
      data.key = 'cashDeskChart2Visibility';
      data.valueBool = this.cashDeskVoucher.chart2Visibility;
    } else {
      // nothing
    }
    await this.service.setItem(data).catch(err => this.infoService.error(err));
  }

  async onChangeDefaultCurrencyType(value: string): Promise<void> {
    const data = this.service.cleanModel();
    data.key = 'defaultCurrencyCode';
    data.value = value;
    await this.service.setItem(data).catch(err => this.infoService.error(err));
  }

}
