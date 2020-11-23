import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { CustomerModel } from '../models/customer-model';
import {getFirstDayOfMonthForInput, getFloat, getTodayForInput} from '../core/correct-library';
import { AccountTransactionService } from '../services/account-transaction.service';
import {ReportService} from '../services/report.service';
import { ProductService } from '../services/product.service';
import { RouterModel } from '../models/router-model';
import { GlobalService } from '../services/global.service';
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  selectedReport: any;
  mainList: Array<any> = [];
  listExcelDataKeys: Array<any> = [];
  customerList$: Observable<CustomerModel[]>;
  isMainFilterOpened = false;
  recordDate: any;

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  filterCustomerCode: any;
  filterBalance: any;

  isShowFilterDatePanel = false;
  isShowFilterCustomerPanel = false;
  isShowFilterAccountStatus = false;

  constructor(public infoService: InformationService, public customerService: CustomerService, public proService: ProductService,
              public atService: AccountTransactionService, public rService: ReportService, public globService: GlobalService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.selectedReport = undefined;
    this.customerList$ = this.customerService.getAllItems();
    this.clearMainFiler();
    this.setVisibilityFilterInputs();
  }

  ngOnDestroy(): void {

  }

  onClickShowReport(data: any): void {
    this.clearMainFiler();
    this.mainList = [];
    this.selectedReport = data;
    this.setVisibilityFilterInputs();
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

  btnStartReport_Click(): void {
    this.mainList = undefined;
    this.isMainFilterOpened = false;
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    if (this.selectedReport === 'accountReport') {
      Promise.all([this.rService.getAllAccountTransactions(this.filterCustomerCode, beginDate, finishDate, this.filterBalance)])
        .then((values: any) => {
          if (values[0] !== null) {
            this.mainList = values[0] as Array<any>;
          }
        });
    } else if (this.selectedReport === 'productPurchaseSKUReport') {
      Promise.all([this.rService.getProductsPurchaseSKU(beginDate, finishDate)])
      .then((values: any) => {
        if (values[0] !== null) {
          this.mainList = values[0] as Array<any>;
        }
      });
    } else {
      //
    }
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

  async showSelectedProduct(record: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = 'product';
    r.nextModulePrimaryKey = record.productPrimaryKey;
    r.previousModule = 'reports';
    r.previousModulePrimaryKey = '';
    await this.globService.showTransactionRecord(r);
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterCustomerCode = '-1';
    this.filterBalance = '1';
  }

  setVisibilityFilterInputs(): void {
    this.isShowFilterDatePanel = false;
    this.isShowFilterCustomerPanel = false;
    this.isShowFilterAccountStatus = false;

    if (this.selectedReport === 'accountReport') {
      this.isShowFilterDatePanel = true;
      this.isShowFilterCustomerPanel = true;
      this.isShowFilterAccountStatus = true;

    }
    if (this.selectedReport === 'productPurchaseSKUReport') {
      this.isShowFilterDatePanel = true;
    }
  }
}
