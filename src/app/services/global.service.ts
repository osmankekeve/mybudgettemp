import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
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
import {CustomerTargetService} from './customer-target.service';
import {CustomerAccountService} from './customer-account.service';
import {BuySaleService} from './buy-sale.service';
import {SalesOrderService} from './sales-order.service';
import {PurchaseOrderService} from './purchase-order.service';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  encryptSecretKey: string = getEncryptionKey();

  constructor(protected db: AngularFirestore, protected route: Router,
              protected siService: SalesInvoiceService, protected cusService: CustomerService, protected caService: CustomerAccountService,
              protected colService: CollectionService, protected piService: PurchaseInvoiceService, protected cdService: CashDeskService,
              protected avService: AccountVoucherService, protected payService: PaymentService, protected proService: ProductService,
              protected atService: AccountTransactionService, protected router: ActivatedRoute, protected ctService: CustomerTargetService,
              protected byService: BuySaleService, protected soService: SalesOrderService, protected poService: PurchaseOrderService) {

  }

  async showTransactionRecord(item: RouterModel): Promise<void> {
    let data;
    const routeData = {
      paramItem: '',
      previousModule: item.previousModule,
      previousModulePrimaryKey: item.previousModulePrimaryKey,
      action: item.action,
    };
    if (item.action === 'create-invoice') {
      if (item.nextModule === 'sales-invoice') {
        // siparisten fatura
        data = await this.soService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['sales-invoice', routeData]);
        }
      } else if (item.nextModule === 'purchase-invoice') {
        // siparisten fatura
        data = await this.poService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['purchaseInvoice', routeData]);
        }
      } else {

      }
    } else {
      if (item.nextModule === 'salesInvoice') {

        data = await this.siService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['sales-invoice', routeData]);
        }
      } else if (item.nextModule === 'purchaseInvoice') {

        data = await this.piService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['purchaseInvoice', routeData]);
        }
      } else if (item.nextModule === 'cancelPurchaseInvoice') {

        data = await this.siService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['purchaseInvoice', routeData]);
        }
      } else if (item.nextModule === 'collection') {

        data = await this.colService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['collection', routeData]);
        }
      } else if (item.nextModule === 'payment') {

        data = await this.payService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['payment', routeData]);
        }
      } else if (item.nextModule === 'accountVoucher') {

        data = await this.avService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['account-voucher', routeData]);
        }
      } else if (item.nextModule === 'cashdeskVoucher' || item.nextModule === 'cashDeskVoucher') {

        data = await this.cdService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['cashdesk-voucher', routeData]);
        }
      } else if (item.nextModule === 'buy-sale') {

        data = await this.byService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['buy-sale', routeData]);
        }
      } else if (item.nextModule === 'product') {

        data = await this.proService.getItem(item.nextModulePrimaryKey);
        if (data) {
          routeData.paramItem = CryptoJS.AES.encrypt(JSON.stringify(data.returnData), this.encryptSecretKey).toString();
          await this.route.navigate(['product', routeData]);
        }
      } else {

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
      if (previousModule === 'customer-target') {
        await this.ctService.getItem(previousModulePrimaryKey).then(async (item) => {
          await this.route.navigate([previousModule, {
            paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString()
          }]);
        });
      }
      if (previousModule === 'cash-desk') {
        await this.cdService.getItem(previousModulePrimaryKey).then(async (item) => {
          await this.route.navigate([previousModule, {
            paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString()
          }]);
        });
      }
      if (previousModule === 'customer-account') {
        await this.caService.getItem(previousModulePrimaryKey).then(async (item) => {
          await this.route.navigate([previousModule, {
            paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString()
          }]);
        });
      }
      if (previousModule === 'sales-invoice') {
        await this.siService.getItem(previousModulePrimaryKey).then(async (item) => {
          await this.route.navigate([previousModule, {
            paramItem: CryptoJS.AES.encrypt(JSON.stringify(item.returnData), this.encryptSecretKey).toString()
          }]);
        });
      }
      if (previousModule === 'sales-order') {
        await this.soService.getItem(previousModulePrimaryKey).then(async (item) => {
          await this.route.navigate([previousModule, {
            paramItem: CryptoJS.AES.encrypt(JSON.stringify(item.returnData), this.encryptSecretKey).toString()
          }]);
        });
      }
      if (previousModule === 'purchaseInvoice') {
        await this.piService.getItem(previousModulePrimaryKey).then(async (item) => {
          await this.route.navigate([previousModule, {
            paramItem: CryptoJS.AES.encrypt(JSON.stringify(item.returnData), this.encryptSecretKey).toString()
          }]);
        });
      }
      if (previousModule === 'purchase-order') {
        await this.poService.getItem(previousModulePrimaryKey).then(async (item) => {
          await this.route.navigate([previousModule, {
            paramItem: CryptoJS.AES.encrypt(JSON.stringify(item.returnData), this.encryptSecretKey).toString()
          }]);
        });
      }
      if (previousModule === 'dashboard') {
        await this.route.navigate([previousModule]);
      }
    }
  }
}
