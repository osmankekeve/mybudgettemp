import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { SalesInvoiceService } from '../services/sales-invoice.service';
import { CustomerModel } from '../models/customer-model';
import { AuthenticationService } from '../services/authentication.service';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionService } from '../services/account-transaction.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { InformationService } from '../services/information.service';
import {
  getFirstDayOfMonthForInput,
  getTodayForInput,
  isNullOrEmpty,
  getInputDataForInsert,
  getDateForInput,
  getEncryptionKey,
  numberOnly,
  getFloat, currencyFormat, moneyFormat
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import { Router, ActivatedRoute } from '@angular/router';
import {SettingService} from '../services/setting.service';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {Chart} from 'chart.js';

@Component({
  selector: 'app-sales-invoice',
  templateUrl: './sales-invoice.component.html',
  styleUrls: ['./sales-invoice.component.css']
})
export class SalesInvoiceComponent implements OnInit, OnDestroy {
  mainList: Array<SalesInvoiceMainModel>;
  customerList$: Observable<CustomerModel[]>;
  selectedRecord: SalesInvoiceMainModel;
  refModel: SalesInvoiceMainModel;
  isRecordHasTransaction = false;
  isMainFilterOpened = false;
  recordDate: any;
  encryptSecretKey: string = getEncryptionKey();
  numberOnlyControl = numberOnly;

  searchText: any;
  filterBeginDate: any;
  filterFinishDate: any;
  filterCustomerCode: any;
  totalValues = {
    totalPrice: 0,
    totalPriceWithTax: 0,
  };
  chart1: any;
  chart2: any;
  onTransaction = false;

  constructor(public authService: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public service: SalesInvoiceService, public cService: CustomerService, public excelService: ExcelService,
              public infoService: InformationService, public atService: AccountTransactionService,
              public sService: SettingService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.populateCharts();
    this.customerList$ = this.cService.getAllItems();
    this.selectedRecord = undefined;

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem);
      }
    }
  }

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = undefined;
    this.totalValues = {
      totalPrice: 0,
      totalPriceWithTax: 0,
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDatesWithCustomer(beginDate, finishDate, this.filterCustomerCode).subscribe(list => {
     if (this.mainList === undefined) { this.mainList = []; }
     list.forEach((data: any) => {
        const item = data.returnData as SalesInvoiceMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.totalPrice += item.data.totalPrice;
          this.totalValues.totalPriceWithTax += item.data.totalPriceWithTax;
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
          this.totalValues.totalPrice -= item.data.totalPrice;
          this.totalValues.totalPriceWithTax -= item.data.totalPriceWithTax;
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item;
          this.totalValues.totalPrice -= this.refModel.data.totalPrice;
          this.totalValues.totalPriceWithTax -= this.refModel.data.totalPriceWithTax;
          this.totalValues.totalPrice += item.data.totalPrice;
          this.totalValues.totalPriceWithTax += item.data.totalPriceWithTax;
        } else {
          // nothing
        }
      });
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  populateCharts(): void {
    const date = new Date();
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    const date1 = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const date2 = new Date(date.getFullYear(), date.getMonth(), 14, 0, 0, 0);
    const date3 = new Date(date.getFullYear(), date.getMonth(), 15, 0, 0, 0);
    const date4 = new Date(date.getFullYear(), date.getMonth(), 30, 0, 0, 0);

    let chart1DataNames;
    let chart1DataValues;
    const chart2DataValues = [0 , 0 , 0, 0];
    const creatingList = Array<any>();
    const creatingData = new Map();
    Promise.all([this.service.getMainItemsBetweenDatesAsPromise(startDate, endDate)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<SalesInvoiceMainModel>;
          returnData.forEach(item => {
            if (creatingData.has(item.customer.name)) {
              let amount = creatingData.get(item.customer.name);
              amount += item.data.totalPriceWithTax;
              creatingData.delete(item.customer.name);
              creatingData.set(item.customer.name, amount);
            } else {
              creatingData.set(item.customer.name, item.data.totalPriceWithTax);
            }
            if (item.data.insertDate >= date1.getTime() && item.data.insertDate < date2.getTime()) {
              chart2DataValues[0] = getFloat(chart2DataValues[0]) + item.data.totalPriceWithTax;
            } else if (item.data.insertDate >= date2.getTime() && item.data.insertDate < date3.getTime()) {
              chart2DataValues[1] = getFloat(chart2DataValues[1]) + item.data.totalPriceWithTax;
            } else if (item.data.insertDate >= date3.getTime() && item.data.insertDate < date4.getTime()) {
              chart2DataValues[2] = getFloat(chart2DataValues[2]) + item.data.totalPriceWithTax;
            } else {
              chart2DataValues[3] = getFloat(chart2DataValues[3]) + item.data.totalPriceWithTax;
            }
          });
          chart1DataNames = [];
          chart1DataValues = [];
          creatingData.forEach((value, key) => {
            creatingList.push({itemKey: key, itemValue: value});
          });
          creatingList.sort((a, b) => {
            return b.itemValue - a.itemValue;
          });
          let i = 1;
          creatingList.forEach(x => {
            if (i === 7) {
              return;
            } else {
              chart1DataNames.push(x.itemKey);
              chart1DataValues.push(x.itemValue.toFixed(2));
            }
            i++;
          });
        }
      }).finally(() => {
      this.chart1 = new Chart('chart1', {
        type: 'bar', // bar, pie, doughnut
        data: {
          labels: chart1DataNames,
          datasets: [{
            label: '# of Votes',
            data: chart1DataValues,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1
          }]
        },
        options: {
          title: {
            text: 'En Çok Satış Yapılan Cari Hareketler',
            display: true
          },
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });
      this.chart2 = new Chart('chart2', {
        type: 'doughnut', // bar, pie, doughnut
        data: {
          labels: ['1. Çeyrek', '2. Çeyrek', '3. Çeyrek', '4. Çeyrek'],
          datasets: [{
            label: '# of Votes',
            data: chart2DataValues,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1
          }]
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as SalesInvoiceMainModel;
    this.refModel = record as SalesInvoiceMainModel;
    this.recordDate = getDateForInput(this.selectedRecord.data.insertDate);
    this.atService.getRecordTransactionItems(this.selectedRecord.data.primaryKey)
    .subscribe(list => {
      this.isRecordHasTransaction = list.length > 0;
    });
  }

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
  }

  btnMainFilter_Click(): void {
    if (isNullOrEmpty(this.filterBeginDate)) {
      this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
    } else if (isNullOrEmpty(this.filterFinishDate)) {
      this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
    } else {
      this.populateList();
    }
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
    this.route.navigate(['sales-invoice', {}]);
    this.populateCharts();
  }

  async btnNew_Click(): Promise<void> {
    this.clearSelectedRecord();
    const receiptNoData = await this.sService.getSalesInvoiceCode();
    if (receiptNoData !== null) {
      this.selectedRecord.data.receiptNo = receiptNoData;
    }
  }

  async btnSave_Click(): Promise<void> {
    this.selectedRecord.data.insertDate = getInputDataForInsert(this.recordDate);
    if (this.selectedRecord.data.totalPrice <= 0) {
      this.infoService.error('Tutar sıfırdan büyük olmalıdır.');
    } else if (this.selectedRecord.data.totalPrice <= 0) {
      this.infoService.error('Tutar (+KDV) sıfırdan büyük olmalıdır.');
    } else if (isNullOrEmpty(this.recordDate)) {
      this.infoService.error('Lütfen kayıt tarihi seçiniz.');
    } else {
      this.onTransaction = true;
      if (this.selectedRecord.data.primaryKey === null) {
        const newId = this.db.createId();
        this.selectedRecord.data.primaryKey = '';
        await this.service.setItem(this.selectedRecord, newId).then(() => {
          const trans = {
            primaryKey: '',
            userPrimaryKey: this.selectedRecord.data.userPrimaryKey,
            receiptNo: this.selectedRecord.data.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'salesInvoice',
            parentPrimaryKey: this.selectedRecord.data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: '-1',
            amount: this.selectedRecord.data.type === 'sales' ?
              this.selectedRecord.data.totalPriceWithTax * -1 : this.selectedRecord.data.totalPriceWithTax,
            amountType: this.selectedRecord.data.type === 'sales' ? 'debit' : 'credit',
            insertDate: this.selectedRecord.data.insertDate
          };
          this.db.collection('tblAccountTransaction').add(trans).then(() => {
            this.infoService.success('Fatura başarıyla kaydedildi.');
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err)).finally(() => {
          this.selectedRecord = undefined;
          this.onTransaction = false;
        });
      } else {
        await this.service.updateItem(this.selectedRecord).then(() => {
          this.db.collection<AccountTransactionModel>('tblAccountTransaction',
            ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.data.primaryKey)).get().subscribe(list => {
            list.forEach((item) => {
              const trans = {
                receiptNo: this.selectedRecord.data.receiptNo,
                insertDate: this.selectedRecord.data.insertDate,
                amount: this.selectedRecord.data.type === 'sales' ?
                  this.selectedRecord.data.totalPriceWithTax * -1 : this.selectedRecord.data.totalPriceWithTax,
              };
              this.db.collection('tblAccountTransaction').doc(item.id).update(trans).then(() => {
                this.infoService.success('Fatura başarıyla güncellendi.');
              }).catch(err => this.infoService.error(err));
            });
          });
        }).catch(err => this.infoService.error(err)).finally(() => {
          this.selectedRecord = undefined;
          this.onTransaction = false;
        });
      }
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord).then(() => {
      this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.data.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            this.db.collection('tblAccountTransaction').doc(item.id).delete().then(() => {
              this.infoService.success('Fatura başarıyla kaldırıldı.');
              this.selectedRecord = undefined;
            }).catch(err => this.infoService.error(err));
          });
        });
    }).catch(err => this.infoService.error(err));
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'salesInvoice');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.isRecordHasTransaction = false;
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterCustomerCode = '-1';
  }

  format_totalPrice($event): void {
    this.selectedRecord.data.totalPrice = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.totalPriceFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  format_totalPriceWithTax($event): void {
    this.selectedRecord.data.totalPriceWithTax = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.totalPriceWithTaxFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_totalPrice(): void {
    if (this.selectedRecord.data.totalPrice === 0) {
      this.selectedRecord.data.totalPrice = null;
      this.selectedRecord.totalPriceFormatted = null;
    }
  }

}
