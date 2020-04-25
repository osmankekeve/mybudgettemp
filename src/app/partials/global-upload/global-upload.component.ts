import {Component, OnDestroy, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {GlobalUploadService} from '../../services/global-upload.service';
import {getEncryptionKey} from '../../core/correct-library';
import * as CryptoJS from 'crypto-js';
import {CustomerMainModel} from '../../models/customer-main-model';
import {CustomerService} from '../../services/customer.service';
import {CollectionMainModel} from '../../models/collection-main-model';
import {ActivatedRoute} from '@angular/router';
import {CollectionService} from '../../services/collection.service';
import {SalesInvoiceMainModel} from '../../models/sales-invoice-main-model';
import {SalesInvoiceService} from '../../services/sales-invoice.service';
import {PaymentMainModel} from '../../models/payment-main-model';
import {PurchaseInvoiceService} from '../../services/purchase-invoice.service';
import {PurchaseInvoiceMainModel} from '../../models/purchase-invoice-main-model';

@Component({
  selector: 'app-global-upload',
  templateUrl: 'global-upload.component.html'
})

export class GlobalUploadComponent implements OnDestroy, OnInit {
  bytes: any;
  paramItem: any;
  model: any;
  subscription: Subscription | undefined;
  encryptSecretKey: string = getEncryptionKey();
  recordData = {
    primaryKey: '',
    moduleName: '',
    componentKey: '',
    recordName: ''
  };

  constructor(public service: GlobalUploadService, public cusService: CustomerService, public siService: SalesInvoiceService,
              protected colService: CollectionService, public piService: PurchaseInvoiceService,
              public payService: PurchaseInvoiceService) {
  }

  ngOnInit(): void {
    this.subscription = this.service.get()
      .subscribe(async params => {
        if (params !== undefined) {
          setTimeout(() => {});
          this.recordData.primaryKey = params.key;
          this.recordData.componentKey = params.component;
          if (params.keyModel) {
            this.bytes = await CryptoJS.AES.decrypt(params.keyModel, this.encryptSecretKey);
            this.paramItem = JSON.parse(this.bytes.toString(CryptoJS.enc.Utf8));
          }
          // @ts-ignore
          $('#myModalUpload').modal();

          if (this.recordData.componentKey === 'customer') {
            if (this.paramItem) {
              this.model = this.paramItem as CustomerMainModel;
            } else {
              await this.cusService.getCustomer(this.recordData.primaryKey).then(async (item) => {
                this.model = item;
              });
            }
            this.recordData.moduleName = 'Müşteri';
            this.recordData.recordName = this.model.data.name;
          }
          if (this.recordData.componentKey === 'collection') {
            if (this.paramItem) {
              this.model = this.paramItem as CollectionMainModel;
            } else {
              await this.colService.getItem(this.recordData.primaryKey).then(async (item) => {
                this.model = item.returnData as CollectionMainModel;
              });
            }
            this.recordData.moduleName = 'Tahsilat';
            this.recordData.recordName = this.model.customerName;
          }
          if (this.recordData.componentKey === 'sales-invoice') {
            if (this.paramItem) {
              this.model = this.paramItem as SalesInvoiceMainModel;
            } else {
              await this.siService.getItem(this.recordData.primaryKey).then(async (item) => {
                this.model = item.returnData as SalesInvoiceMainModel;
              });
            }
            this.recordData.moduleName = 'Satış Faturası';
            this.recordData.recordName = this.model.customerName;
          }
          if (this.recordData.componentKey === 'payment') {
            if (this.paramItem) {
              this.model = this.paramItem as PaymentMainModel;
            } else {
              await this.payService.getItem(this.recordData.primaryKey).then(async (item) => {
                this.model = item.returnData as PaymentMainModel;
              });
            }
            this.recordData.moduleName = 'Ödeme';
            this.recordData.recordName = this.model.customerName;
          }
          if (this.recordData.componentKey === 'purchase-invoice') {
            if (this.paramItem) {
              this.model = this.paramItem as PurchaseInvoiceMainModel;
            } else {
              await this.piService.getItem(this.recordData.primaryKey).then(async (item) => {
                this.model = item.returnData as PurchaseInvoiceMainModel;
              });
            }
            this.recordData.moduleName = 'Alım Faturası';
            this.recordData.recordName = this.model.customerName;
          }
          const scrollToTop = window.setInterval(() => {
            const pos = window.pageYOffset;
            if (pos > 0) {
              window.scrollTo(0, pos - 60); // how far to scroll on each step
            } else {
              window.clearInterval(scrollToTop);
            }
          }, 16);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
  }

}
