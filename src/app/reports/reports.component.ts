import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { CustomerModel } from '../models/customer-model';
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  selectedReport: any;
  mainList: Array<any> = [];
  customerList$: Observable<CustomerModel[]>;
  constructor(public infoService: InformationService,
              public customerService: CustomerService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.selectedReport = undefined;
    this.customerList$ = this.customerService.getAllItems();
  }

  ngOnDestroy(): void {

  }

  onClickShowReport(data: any): void {
    this.mainList = [];
    this.selectedReport = data;
    if (data === 'accountReport') {
      this.customerList$.subscribe(list => {
        list.forEach(customer => {
          const dataReport = {stringField1: '', numberField1 : 0};
          dataReport.stringField1 = customer.name;
          this.db.collection('tblAccountTransaction', ref =>
          ref.where('parentPrimaryKey', '==', customer.primaryKey).where('parentType', '==', 'customer')).get()
          .subscribe(listTrans => {
            listTrans.forEach(item => {
              dataReport.numberField1 += item.data().amount;
            });
          });
          console.log(dataReport);
          this.mainList.push(dataReport);
        });
      });
    } else {
      //
    }
  }

  btnReturnList_Click(): void {
    this.selectedReport = undefined;
  }
}
