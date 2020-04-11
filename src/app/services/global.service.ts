import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SalesInvoiceService} from './sales-invoice.service';
import {CollectionService} from './collection.service';
import {PaymentService} from './payment.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActivatedRoute, Router} from '@angular/router';
import {getEncryptionKey} from '../core/correct-library';
import * as CryptoJS from 'crypto-js';
import {PurchaseInvoiceService} from './purchase-invoice.service';
import {CashDeskService} from './cash-desk.service';
import {AccountVoucherService} from './account-voucher.service';
import {CustomerService} from './customer.service';
import {RouterModel} from '../models/router-model';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  encryptSecretKey: string = getEncryptionKey();

  constructor(public db: AngularFirestore, public authService: AuthenticationService, public route: Router,
              public siService: SalesInvoiceService, public cusService: CustomerService,
              public colService: CollectionService, public piService: PurchaseInvoiceService, public cdService: CashDeskService,
              public avService: AccountVoucherService, public payService: PaymentService, public atService: AccountTransactionService,
              public logService: LogService, public router: ActivatedRoute) {

  }

  async showTransactionRecord(item: RouterModel): Promise<void> {
    let data;
    if (item.nextModule === 'salesInvoice') {

      data = await this.siService.getItem(item.nextModulePrimaryKey);
      if (data) {
        await this.route.navigate(['sales-invoice', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString(),
          previousModule: item.previousModule,
          previousModulePrimaryKey: item.previousModulePrimaryKey,
        }]);
      }

    }
    if (item.nextModule === 'collection') {

      data = await this.colService.getItem(item.nextModulePrimaryKey);
      if (data) {
        await this.route.navigate(['collection', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    }
    if (item.nextModule === 'purchaseInvoice') {

      data = await this.piService.getItem(item.nextModulePrimaryKey);
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

    }
    if (item.nextModule === 'payment') {

      data = await this.payService.getItem(item.nextModulePrimaryKey);
      if (data) {
        await this.route.navigate(['payment', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    }
    if (item.nextModule === 'accountVoucher') {

      data = await this.avService.getItem(item.nextModulePrimaryKey);
      if (data) {
        await this.route.navigate(['account-voucher', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data.returnData),
            this.encryptSecretKey).toString()
        }]);
      }

    }
    if (item.nextModule === 'cashdeskVoucher' || item.nextModule === 'cashDeskVoucher') {

      data = await this.cdService.getItem(item.nextModulePrimaryKey);
      if (data) {
        await this.route.navigate(['cashdesk-voucher', {
          paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
            this.encryptSecretKey).toString()
        }]);
      }

    }
  }

  async returnPreviousModule(router: ActivatedRoute): Promise<void> {
    const previousModule = router.snapshot.paramMap.get('previousModule').toString();
    const previousModulePrimaryKey = router.snapshot.paramMap.get('previousModulePrimaryKey');

    if (previousModule !== null && previousModulePrimaryKey !== null) {
      if (previousModule === 'customer') {
        await this.cusService.getCustomer(previousModulePrimaryKey).then(async (item) => {
          await this.route.navigate([previousModule, {
            paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString()
          }]);
        });
      }
    }
  }
}