import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {PurchaseInvoiceService} from '../services/purchase-invoice.service';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {AuthenticationService} from '../services/authentication.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {Chart} from 'chart.js';
import {
  getFirstDayOfMonthForInput,
  getTodayForInput,
  getDateForInput,
  getInputDataForInsert,
  isNullOrEmpty,
  getEncryptionKey,
  getFloat, currencyFormat, moneyFormat
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import {Router, ActivatedRoute} from '@angular/router';
import 'rxjs/add/operator/filter';
import {SettingService} from '../services/setting.service';
import {PurchaseInvoiceMainModel} from '../models/purchase-invoice-main-model';
import {SettingModel} from '../models/setting-model';
import {CustomerAccountModel} from '../models/customer-account-model';
import {CustomerAccountService} from '../services/customer-account.service';

@Component({
  selector: 'app-purchase-invoice',
  templateUrl: './purchase-invoice.component.html',
  styleUrls: ['./purchase-invoice.component.css']
})
export class PurchaseInvoiceComponent implements OnInit, OnDestroy {
  mainList: Array<PurchaseInvoiceMainModel>;
  customerList$: Observable<CustomerModel[]>;
  accountList$: Observable<CustomerAccountModel[]>;
  selectedRecord: PurchaseInvoiceMainModel;
  refModel: PurchaseInvoiceMainModel;
  isRecordHasTransaction = false;
  isMainFilterOpened = false;
  recordDate: any;
  searchText: '';
  encryptSecretKey: string = getEncryptionKey();

  date = new Date();
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
  chart1Visibility = null;
  chart2Visibility = null;

  constructor(public authService: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public service: PurchaseInvoiceService, public sService: SettingService,
              public cService: CustomerService, public atService: AccountTransactionService, public infoService: InformationService,
              public excelService: ExcelService, public db: AngularFirestore, public accService: CustomerAccountService) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.customerList$ = this.cService.getAllItems();
    this.selectedRecord = undefined;
    if (this.chart1Visibility === null && this.chart2Visibility === null) {
      const chart1Visibility = this.sService.getItem('purchaseChart1Visibility');
      const chart2Visibility = this.sService.getItem('purchaseChart2Visibility');
      Promise.all([chart1Visibility, chart2Visibility])
        .then((values: any) => {
          const data1 = values[0].data as SettingModel;
          const data2 = values[1].data as SettingModel;
          this.chart1Visibility = data1.valueBool;
          this.chart2Visibility = data2.valueBool;
        }).finally(() => {
        this.populateCharts();
      });
    } else {
      this.populateCharts();
    }
    this.populateList();
    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem);
      }
    }
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList = undefined;
    this.totalValues = {
      totalPrice: 0,
      totalPriceWithTax: 0,
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);

    this.service.getMainItemsBetweenDatesWithCustomer(beginDate, finishDate, this.filterCustomerCode).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseInvoiceMainModel;
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
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 5000);
  }

  populateCharts(): void {
    const date = new Date();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    const date1 = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const date2 = new Date(date.getFullYear(), date.getMonth(), 14, 0, 0, 0);
    const date3 = new Date(date.getFullYear(), date.getMonth(), 15, 0, 0, 0);
    const date4 = new Date(date.getFullYear(), date.getMonth(), 30, 0, 0, 0);

    let chart1DataNames;
    let chart1DataValues;
    const chart2DataValues = [0, 0, 0, 0];
    const creatingList = Array<any>();
    const creatingData = new Map();
    Promise.all([this.service.getMainItemsBetweenDatesAsPromise(todayStart, endDate)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<PurchaseInvoiceMainModel>;
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
      if (this.chart1Visibility) {
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
              text: 'En Çok Alım Yapılan Cari Hareketler',
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
      }
      if (this.chart2Visibility) {
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
      }
      // sessionStorage.setItem('purchase_invoice_chart_1', JSON.stringify({nameValue : chart1DataNames, dataValue: chart1DataValues}));
      // sessionStorage.setItem('purchase_invoice_chart_2', JSON.stringify({dataValue: chart2DataValues}));
    });
  }

  setChart1Data(): void {
    const chart1Data = JSON.parse(sessionStorage.getItem('purchase_invoice_chart_1'));
    this.chart1 = new Chart('chart1', {
      type: 'bar', // bar, pie, doughnut
      data: {
        labels: chart1Data.nameValue,
        datasets: [{
          label: '# of Votes',
          data: chart1Data.dataValue,
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
          text: 'En Çok Alım Yapılan Cari Hareketler',
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
  }

  setChart2Data(): void {
    const chart2Data = JSON.parse(sessionStorage.getItem('purchase_invoice_chart_2'));
    this.chart2 = new Chart('chart2', {
      type: 'doughnut', // bar, pie, doughnut
      data: {
        labels: ['1. Çeyrek', '2. Çeyrek', '3. Çeyrek', '4. Çeyrek'],
        datasets: [{
          label: '# of Votes',
          data: chart2Data.dataValue,
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
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as PurchaseInvoiceMainModel;
    this.refModel = record as PurchaseInvoiceMainModel;
    this.selectedRecord.data.totalPrice = Math.abs(this.selectedRecord.data.totalPrice);
    this.selectedRecord.data.totalPriceWithTax = Math.abs(this.selectedRecord.data.totalPriceWithTax);
    this.recordDate = getDateForInput(this.selectedRecord.data.insertDate);
    this.atService.getRecordTransactionItems(this.selectedRecord.data.primaryKey)
      .subscribe(list => {
        this.isRecordHasTransaction = list.length > 0;
      });
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
    /* if (this.fromModule) {
      this.route.navigate([this.fromModule, {}]);
    } else {
      this.route.navigate(['purchaseInvoice', {}]);
    } */
    this.route.navigate(['purchaseInvoice', {}]);
    this.populateCharts();
    // this.setChart1Data();
    // this.setChart2Data();
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

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
  }

  async btnNew_Click(): Promise<void> {
    this.clearSelectedRecord();
    const receiptNoData = await this.sService.getPurchaseInvoiceCode();
    if (receiptNoData !== null) {
      this.selectedRecord.data.receiptNo = receiptNoData;
    }
  }

  async btnSave_Click(): Promise<void> {
    this.selectedRecord.data.insertDate = getInputDataForInsert(this.recordDate);
    if (this.selectedRecord.data.customerCode === '') {
      this.infoService.error('Lütfen müşteri seçiniz.');
    } else if (this.selectedRecord.data.accountPrimaryKey === '') {
      this.infoService.error('Lütfen hesap seçiniz.');
    } else if (this.selectedRecord.data.type === '') {
      this.infoService.error('Lütfen fatura tipi seçiniz.');
    } else if (this.selectedRecord.data.totalPrice <= 0) {
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
            transactionType: 'purchaseInvoice',
            parentPrimaryKey: this.selectedRecord.data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: '-1',
            amount: this.selectedRecord.data.type === 'purchase' ?
              this.selectedRecord.data.totalPriceWithTax : this.selectedRecord.data.totalPriceWithTax * -1,
            amountType: this.selectedRecord.data.type === 'purchase' ? 'credit' : 'debit',
            insertDate: this.selectedRecord.data.insertDate
          };
          this.db.collection('tblAccountTransaction').add(trans).then(() => {
            this.infoService.success('Fatura başarıyla kaydedildi.');
          }).catch(err => this.infoService.error(err));
        }).finally(() => {
          this.finishRecordProcess();
        }).catch(err => this.infoService.error(err));
      } else {
        await this.service.updateItem(this.selectedRecord).then(() => {
          this.db.collection<AccountTransactionModel>('tblAccountTransaction',
            ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.data.primaryKey)).get().subscribe(list => {
            list.forEach(async (item) => {
              const trans = {
                receiptNo: this.selectedRecord.data.receiptNo,
                insertDate: this.selectedRecord.data.insertDate,
                amount: this.selectedRecord.data.type === 'purchase' ?
                  this.selectedRecord.data.totalPriceWithTax : this.selectedRecord.data.totalPriceWithTax * -1,
              };
              await this.db.collection('tblAccountTransaction').doc(item.id).update(trans).then(() => {
                this.infoService.success('Fatura başarıyla güncellendi.');
              }).finally(() => {
                this.finishRecordProcess();
              }).catch(err => this.infoService.error(err));
            });
          });
        }).catch(err => this.infoService.error(err));
      }
    }
  }

  async btnRemove_Click(): Promise<void> {
    await this.service.removeItem(this.selectedRecord).then(() => {
      this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.data.primaryKey)).get().subscribe(list => {
        list.forEach((item) => {
          this.db.collection('tblAccountTransaction').doc(item.id).delete().then(() => {
            this.infoService.success('Fatura başarıyla kaldırıldı.');
          }).catch(err => this.infoService.error(err));
        });
      });
    }).catch(err => this.infoService.error(err)).finally(() => {
      this.finishRecordProcess();
    });
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'purchaseInvoice');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async onChangeCustomer(value: any): Promise<void> {
    await this.cService.getItem(value).then(item => {
      this.selectedRecord.customer = item.data;
      this.accountList$ = this.accService.getAllItems(this.selectedRecord.customer.primaryKey);
    });
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.isRecordHasTransaction = false;
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterCustomerCode = '-1';
  }

  finishRecordProcess(): void {
    this.populateCharts();
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
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

  focus_totalPriceWithTax(): void {
    if (this.selectedRecord.data.totalPriceWithTax === 0) {
      this.selectedRecord.data.totalPriceWithTax = null;
      this.selectedRecord.totalPriceWithTaxFormatted = null;
    }
  }

}
