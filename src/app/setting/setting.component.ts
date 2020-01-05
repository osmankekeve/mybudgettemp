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
    suffix: ''
  }

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
        } else {

        }
      });
    });
    this.service.getPurchaseInvoiceCode();
  }

  ngOnDestroy(): void { }

  async btnSavePurchaseInvoiceAutoCode_Click(): Promise<void> {
    await this.service.setItem({ key: 'purchaseInvoicePrefix', value: this.purchaseInvoice.prefix });
    await this.service.setItem({ key: 'purchaseInvoiceNumber', value: this.purchaseInvoice.number });
    await this.service.setItem({ key: 'purchaseInvoiceSuffix', value: this.purchaseInvoice.suffix });

  }

}
