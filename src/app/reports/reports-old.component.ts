import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { CustomerModel } from '../models/customer-model';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { getFirstDayOfMonthForInput, getTodayForInput } from '../core/correct-library';
import { AccountTransactionService } from '../services/account-transaction.service';
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsOldComponent implements OnInit, OnDestroy {
  selectedReport: any;
  mainList: Array<any> = [];
  customerList$: Observable<CustomerModel[]>;
  isMainFilterOpened = false;
  recordDate: any;

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  filterCustomerCode: any;
  filterBalance: any;

  constructor(public infoService: InformationService,
              public customerService: CustomerService,
              public atService: AccountTransactionService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.selectedReport = undefined;
    this.customerList$ = this.customerService.getAllItems();
    this.clearMainFiler();
  }

  ngOnDestroy(): void {

  }

  onClickShowReport(data: any): void {
    this.mainList = [];
    this.selectedReport = data;
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    if (data === 'accountReport') {

      this.customerService.getAllActiveItems().subscribe(list => {
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

      this.customerService.getAllActiveItems().subscribe(list => {
        list.forEach(async customer => {
          const dataReport = {stringField1: '', numberField1 : 0, numberField2 : 0, numberField3 : 0};
          dataReport.stringField1 = customer.name;

          this.atService.getCustomerTransactions(customer.primaryKey, beginDate, finishDate).then(listTrans => {
            listTrans.forEach(item => {
              if (item.transactionType === 'purchaseInvoice' || item.transactionType === 'payment') {
                if (item.amount > 0 ) {dataReport.numberField1 += item.amount; }
                if (item.amount < 0 ) {dataReport.numberField2 += item.amount; }
                dataReport.numberField3 += item.amount;
              }
            });

            if (this.filterBalance === '-1') {
              this.mainList.push(dataReport);
            } else if (this.filterBalance === '0') {
              if (dataReport.numberField3 === 0) {
                this.mainList.push(dataReport);
              }
            } else if (this.filterBalance === '1') {
              if (dataReport.numberField3 !== 0) {
                this.mainList.push(dataReport);
              }
            } else {
              // nothing
            }
          });
        });
      });

    } else if (data === 'salesReport') {

      this.customerService.getAllActiveItems().subscribe(list => {
        list.forEach(async customer => {
          const dataReport = {stringField1: '', numberField1 : 0, numberField2 : 0, numberField3 : 0};
          dataReport.stringField1 = customer.name;

          this.atService.getCustomerTransactions(customer.primaryKey, beginDate, finishDate).then(listTrans => {
            listTrans.forEach(item => {
              if (item.transactionType === 'salesInvoice' || item.transactionType === 'collection') {
                if (item.amount > 0 ) {dataReport.numberField1 += item.amount; }
                if (item.amount < 0 ) {dataReport.numberField2 += item.amount; }
                dataReport.numberField3 += item.amount;
              }
            });

            if (this.filterBalance === '-1') {
              this.mainList.push(dataReport);
            } else if (this.filterBalance === '0') {
              if (dataReport.numberField3 === 0) {
                this.mainList.push(dataReport);
              }
            } else if (this.filterBalance === '1') {
              if (dataReport.numberField3 !== 0) {
                this.mainList.push(dataReport);
              }
            } else {
              // nothing
            }
          });
        });
      });

    } else if (data === 'paymentReport') {

      this.populateAccountTransactions(beginDate, finishDate, 'payment');

    } else if (data === 'collectionReport') {

      this.populateAccountTransactions(beginDate, finishDate, 'collection');

    } else {
      //
    }
  }

  populateAccountTransactions(startDate: Date, endDate: Date, transactionType: string): void {
    this.customerService.getAllItems().subscribe(list => {
      list.forEach(async customer => {
        const dataReport = {stringField1: '', numberField1 : 0};
        dataReport.stringField1 = customer.name;
        this.db.collection('tblAccountTransaction', ref =>
        ref.where('parentPrimaryKey', '==', customer.primaryKey)
        .where('parentType', '==', 'customer')
        .where('transactionType', '==', transactionType)
        .orderBy('insertDate', 'asc')
        .startAt(startDate.getTime())
        .endAt(endDate.getTime()))
        .get()
        .subscribe(listTrans => {
          listTrans.forEach(item => {
            dataReport.numberField1 += item.data().amount;
          });
          this.mainList.push(dataReport);
        });
      });
    });

  }

  btnFilter_Click(): void {
    this.onClickShowReport(this.selectedReport);
  }

  btnReturnList_Click(): void {
    this.selectedReport = undefined;
  }

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterCustomerCode = '-1';
    this.filterBalance = '1';
  }
}
