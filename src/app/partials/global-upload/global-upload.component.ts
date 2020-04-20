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

  constructor(public service: GlobalUploadService, public cusService: CustomerService,
              protected colService: CollectionService) {
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
          $('#myModal').modal();

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
