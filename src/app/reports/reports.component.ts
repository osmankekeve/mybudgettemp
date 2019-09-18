import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { CustomerModel } from '../models/customer-model';
import { AccountTransactionModel } from '../models/account-transaction-model';
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
      this.customerService.getAllItems().subscribe(list => {
        list.forEach(async customer => {
          const dataReport = {stringField1: '', numberField1 : 0};
          dataReport.stringField1 = customer.name;
          await this.db.collection('tblAccountTransaction', ref =>
          ref.where('parentPrimaryKey', '==', customer.primaryKey).where('parentType', '==', 'customer')).get()
          .subscribe(listTrans => {
            listTrans.forEach(item => {
              dataReport.numberField1 += item.data().amount;
            });
            this.mainList.push(dataReport);
          });
        });
      });
    } else if (data === 'purchaseReport') {
      this.customerService.getAllItems().subscribe(list => {
        list.forEach(async customer => {
          const dataReport = {stringField1: '', numberField1 : 0, numberField2 : 0, numberField3 : 0};
          dataReport.stringField1 = customer.name;
          await this.db.collection('tblAccountTransaction', ref =>
          ref.where('parentPrimaryKey', '==', customer.primaryKey).where('parentType', '==', 'customer')).get()
          .subscribe(listTrans => {
            listTrans.forEach(item => {
              // tslint:disable-next-line: no-shadowed-variable
              const data = item.data() as AccountTransactionModel;
              if (data.transactionType === 'purchaseInvoice' || data.transactionType === 'payment') {

                if (data.amount > 0 ) {dataReport.numberField1 += item.data().amount; }
                if (data.amount < 0 ) {dataReport.numberField2 += item.data().amount; }
                dataReport.numberField3 += item.data().amount;
              }
            });
            this.mainList.push(dataReport);
          });
        });
      });
    } else if (data === 'salesReport') {
      this.customerService.getAllItems().subscribe(list => {
        list.forEach(async customer => {
          const dataReport = {stringField1: '', numberField1 : 0, numberField2 : 0, numberField3 : 0};
          dataReport.stringField1 = customer.name;
          await this.db.collection('tblAccountTransaction', ref =>
          ref.where('parentPrimaryKey', '==', customer.primaryKey).where('parentType', '==', 'customer')).get()
          .subscribe(listTrans => {
            listTrans.forEach(item => {
              // tslint:disable-next-line: no-shadowed-variable
              const data = item.data() as AccountTransactionModel;
              if (data.transactionType === 'salesInvoice' || data.transactionType === 'collection') {

                if (data.amount > 0 ) {dataReport.numberField1 += item.data().amount; }
                if (data.amount < 0 ) {dataReport.numberField2 += item.data().amount; }
                dataReport.numberField3 += item.data().amount;
              }
            });
            this.mainList.push(dataReport);
          });
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
