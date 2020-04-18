import {Component, OnDestroy, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {GlobalUploadService} from '../../services/global-upload.service';
import {getEncryptionKey} from '../../core/correct-library';
import * as CryptoJS from 'crypto-js';
import {CustomerMainModel} from '../../models/customer-main-model';
import {CustomerService} from '../../services/customer.service';

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
  files: File[] = [];

  constructor(public service: GlobalUploadService, public cusService: CustomerService) {
  }

  ngOnInit(): void {
    this.subscription = this.service.get()
      .subscribe(async params => {
        if (params !== undefined) {
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
        }
        const scrollToTop = window.setInterval(() => {
          const pos = window.pageYOffset;
          if (pos > 0) {
            window.scrollTo(0, pos - 60); // how far to scroll on each step
          } else {
            window.clearInterval(scrollToTop);
          }
        }, 16);
      });
  }

  ngOnDestroy(): void {
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
      this.files = [];
    }
  }

}
