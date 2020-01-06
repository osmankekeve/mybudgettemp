import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { SettingService } from '../services/setting.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit, OnDestroy {
  purchaseInvoice = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };
  payment = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };
  salesInvoice = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };
  collection = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };
  accountVoucher = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };
  cashDeskVoucher = {
    prefix: '',
    number: '',
    suffix: '',
    length: ''
  };

  constructor(public authService: AuthenticationService, public service: SettingService,
              public infoService: InformationService,
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
        } else if (item.key === 'paymentPrefix') {
          this.payment.prefix = item.value;
        } else if (item.key === 'paymentNumber') {
          this.payment.number = item.value;
        } else if (item.key === 'paymentSuffix') {
          this.payment.suffix = item.value;
        } else if (item.key === 'paymentLength') {
          this.payment.length = item.value;
        } else if (item.key === 'salesInvoicePrefix') {
          this.salesInvoice.prefix = item.value;
        } else if (item.key === 'salesInvoiceNumber') {
          this.salesInvoice.number = item.value;
        } else if (item.key === 'salesInvoiceSuffix') {
          this.salesInvoice.suffix = item.value;
        } else if (item.key === 'salesInvoiceLength') {
          this.salesInvoice.length = item.value;
        } else if (item.key === 'collectionPrefix') {
          this.collection.prefix = item.value;
        } else if (item.key === 'collectionNumber') {
          this.collection.number = item.value;
        } else if (item.key === 'collectionSuffix') {
          this.collection.suffix = item.value;
        } else if (item.key === 'collectionLength') {
          this.collection.length = item.value;
        } else if (item.key === 'accountVoucherPrefix') {
          this.accountVoucher.prefix = item.value;
        } else if (item.key === 'accountVoucherNumber') {
          this.accountVoucher.number = item.value;
        } else if (item.key === 'accountVoucherSuffix') {
          this.accountVoucher.suffix = item.value;
        } else if (item.key === 'accountVoucherLength') {
          this.accountVoucher.length = item.value;
        } else if (item.key === 'cashDeskVoucherPrefix') {
          this.cashDeskVoucher.prefix = item.value;
        } else if (item.key === 'cashDeskVoucherNumber') {
          this.cashDeskVoucher.number = item.value;
        } else if (item.key === 'cashDeskVoucherSuffix') {
          this.cashDeskVoucher.suffix = item.value;
        } else if (item.key === 'cashDeskVoucherLength') {
          this.cashDeskVoucher.length = item.value;
        } else {

        }
      });
    });
  }

  ngOnDestroy(): void { }

  async btnSavePurchaseInvoiceAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'purchaseInvoicePrefix', value: this.purchaseInvoice.prefix });
    await this.service.setItem({ key: 'purchaseInvoiceNumber', value: this.purchaseInvoice.number });
    await this.service.setItem({ key: 'purchaseInvoiceSuffix', value: this.purchaseInvoice.suffix });
    await this.service.setItem({ key: 'purchaseInvoiceLength', value: this.purchaseInvoice.length });
    this.infoService.success('Alım faturası ayarları kaydedildi.');

  }

  async btnSavePaymentAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'paymentPrefix', value: this.payment.prefix });
    await this.service.setItem({ key: 'paymentNumber', value: this.payment.number });
    await this.service.setItem({ key: 'paymentSuffix', value: this.payment.suffix });
    await this.service.setItem({ key: 'paymentLength', value: this.payment.length });
    this.infoService.success('Ödeme ayarları kaydedildi.');

  }

  async btnSaveSalesInvoiceAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'salesInvoicePrefix', value: this.salesInvoice.prefix });
    await this.service.setItem({ key: 'salesInvoiceNumber', value: this.salesInvoice.number });
    await this.service.setItem({ key: 'salesInvoiceSuffix', value: this.salesInvoice.suffix });
    await this.service.setItem({ key: 'salesInvoiceLength', value: this.salesInvoice.length });
    this.infoService.success('Satış faturası ayarları kaydedildi.');

  }

  async btnSaveCollectionAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'collectionPrefix', value: this.collection.prefix });
    await this.service.setItem({ key: 'collectionNumber', value: this.collection.number });
    await this.service.setItem({ key: 'collectionSuffix', value: this.collection.suffix });
    await this.service.setItem({ key: 'collectionLength', value: this.collection.length });
    this.infoService.success('Tahsilat ayarları kaydedildi.');
  }

  async btnSaveAccountVoucherAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'accountVoucherPrefix', value: this.accountVoucher.prefix });
    await this.service.setItem({ key: 'accountVoucherNumber', value: this.accountVoucher.number });
    await this.service.setItem({ key: 'accountVoucherSuffix', value: this.accountVoucher.suffix });
    await this.service.setItem({ key: 'accountVoucherLength', value: this.accountVoucher.length });
    this.infoService.success('Cari fiş ayarları kaydedildi.');
  }

  async btnSaveCashDeskVoucherAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'cashDeskVoucherPrefix', value: this.cashDeskVoucher.prefix });
    await this.service.setItem({ key: 'cashDeskVoucherNumber', value: this.cashDeskVoucher.number });
    await this.service.setItem({ key: 'cashDeskVoucherSuffix', value: this.cashDeskVoucher.suffix });
    await this.service.setItem({ key: 'cashDeskVoucherLength', value: this.cashDeskVoucher.length });
    this.infoService.success('Kasa fiş ayarları kaydedildi.');
  }

}
