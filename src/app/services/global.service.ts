import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SalesInvoiceService} from './sales-invoice.service';
import {CollectionService} from './collection.service';
import {PaymentService} from './payment.service';
import {AccountTransactionService} from './account-transaction.service';
import {Router} from '@angular/router';
import {getEncryptionKey} from '../core/correct-library';
import * as CryptoJS from 'crypto-js';
import {PurchaseInvoiceService} from './purchase-invoice.service';
import {CashDeskService} from './cash-desk.service';
import {AccountVoucherService} from './account-voucher.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  encryptSecretKey: string = getEncryptionKey();

  constructor(public db: AngularFirestore, public authService: AuthenticationService, public route: Router,
              public siService: SalesInvoiceService,
              public colService: CollectionService, public piService: PurchaseInvoiceService, public cdService: CashDeskService,
              public avService: AccountVoucherService, public payService: PaymentService, public atService: AccountTransactionService,
              public logService: LogService) {

  }

  async showTransactionRecord(item: any): Promise<void> {
    let data;
    if (item.transactionType === 'salesInvoice') {

      data = await this.siService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['sales-invoice', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    } else if (item.transactionType === 'collection') {

      data = await this.colService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['collection', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    } else if (item.transactionType === 'purchaseInvoice') {

      data = await this.piService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['purchaseInvoice', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

      /* data = await this.piService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.route.navigate(['/purchaseInvoice'], { queryParams: {
          data: CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptSecretKey).toString(),
          from: 'customer',
          fromData: CryptoJS.AES.encrypt(JSON.stringify(this.selectedCustomer), this.encryptSecretKey).toString(),
        } });
      } */

    } else if (item.transactionType === 'payment') {

      data = await this.payService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['payment', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    } else if (item.transactionType === 'accountVoucher') {

      data = await this.avService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['account-voucher', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    } else if (item.transactionType === 'cashdeskVoucher' || item.transactionType === 'cashDeskVoucher') {

      data = await this.cdService.getItem(item.transactionPrimaryKey);
      if (data) {
        await this.route.navigate(['cashdesk-voucher', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
            this.encryptSecretKey).toString()
        }]);
      }

    } else {

    }
  }
}
