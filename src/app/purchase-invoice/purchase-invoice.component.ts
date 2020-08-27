import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {PurchaseInvoiceService} from '../services/purchase-invoice.service';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {AuthenticationService} from '../services/authentication.service';
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
import {GlobalService} from '../services/global.service';
import {FileMainModel} from '../models/file-main-model';
import {ActionMainModel} from '../models/action-main-model';
import {ActionService} from '../services/action.service';
import {FileUploadService} from '../services/file-upload.service';
import {GlobalUploadService} from '../services/global-upload.service';

@Component({
  selector: 'app-purchase-invoice',
  templateUrl: './purchase-invoice.component.html',
  styleUrls: ['./purchase-invoice.component.css']
})
export class PurchaseInvoiceComponent implements OnInit {
  mainList: Array<PurchaseInvoiceMainModel>;
  customerList: Array<CustomerModel>;
  accountList$: Observable<CustomerAccountModel[]>;
  selectedRecord: PurchaseInvoiceMainModel;
  transactionList: Array<PurchaseInvoiceMainModel>;
  actionList: Array<ActionMainModel>;
  filesList: Array<FileMainModel>;
  isRecordHasTransaction = false;
  isMainFilterOpened = false;
  recordDate: any;
  searchText: '';
  encryptSecretKey: string = getEncryptionKey();

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  filterCustomerCode: any;
  filterStatus: any;
  totalValues = {
    totalPrice: 0,
    totalPriceWithTax: 0,
  };
  chart1: any;
  chart2: any;
  onTransaction = false;
  chart1Visibility = null;
  chart2Visibility = null;

  constructor(protected authService: AuthenticationService, protected route: Router, protected router: ActivatedRoute,
              protected service: PurchaseInvoiceService, protected sService: SettingService, protected globService: GlobalService,
              protected cService: CustomerService, protected atService: AccountTransactionService,
              protected infoService: InformationService, protected gfuService: GlobalUploadService,
              protected excelService: ExcelService, protected db: AngularFirestore, protected accService: CustomerAccountService,
              protected actService: ActionService, protected fuService: FileUploadService) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.selectedRecord = undefined;
    this.populateCustomers();
    this.generateCharts();
    this.populateList();
    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem);
      }
    }
  }

  async generateModule(isReload: boolean, primaryKey: string, error: any, info: any): Promise<void> {
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      if (isReload) {
        this.service.getItem(primaryKey)
          .then(item => {
            this.showSelectedRecord(item.returnData);
          })
          .catch(reason => {
            this.finishProcess(reason, null);
          });
      } else {
        this.generateCharts();
        this.clearSelectedRecord();
        this.selectedRecord = undefined;
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  populateList(): void {
    this.mainList = undefined;
    this.totalValues = {
      totalPrice: 0,
      totalPriceWithTax: 0,
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);

    this.service.getMainItemsBetweenDatesWithCustomer(beginDate, finishDate, this.filterCustomerCode, this.filterStatus)
      .subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseInvoiceMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.totalPrice -= item.data.totalPrice;
          this.totalValues.totalPriceWithTax -= item.data.totalPriceWithTax;
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              this.totalValues.totalPrice -= item.data.totalPrice;
              this.totalValues.totalPriceWithTax -= item.data.totalPriceWithTax;
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.totalValues.totalPrice -= this.mainList[i].data.totalPrice;
              this.totalValues.totalPriceWithTax -= this.mainList[i].data.totalPriceWithTax;
              this.totalValues.totalPrice += item.data.totalPrice;
              this.totalValues.totalPriceWithTax += item.data.totalPriceWithTax;
              this.mainList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 5000);
  }

  generateCharts(): void {
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
  }

  populateCharts(): void {
    const date = new Date();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    const date1 = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const date2 = new Date(date.getFullYear(), date.getMonth(), 14, 0, 0, 0);
    const date3 = new Date(date.getFullYear(), date.getMonth(), 15, 0, 0, 0);
    const date4 = new Date(date.getFullYear(), date.getMonth(), 30, 0, 0, 0);

    this.transactionList = undefined;
    let chart1DataNames;
    let chart1DataValues;
    const chart2DataValues = [0, 0, 0, 0];
    const creatingList = Array<any>();
    const creatingData = new Map();
    Promise.all([this.service.getMainItemsBetweenDatesAsPromise(todayStart, endDate, this.filterStatus)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          this.transactionList = values[0] as Array<PurchaseInvoiceMainModel>;
          this.transactionList.forEach(item => {
            if (creatingData.has(item.customer.name)) {
              let amount = creatingData.get(item.customer.name);
              amount += item.data.totalPriceWithTax;
              creatingData.delete(item.customer.name);
              creatingData.set(item.customer.name, amount);
            } else {
              creatingData.set(item.customer.name, item.data.totalPriceWithTax);
            }
            if (item.data.recordDate >= date1.getTime() && item.data.recordDate < date2.getTime()) {
              chart2DataValues[0] = getFloat(chart2DataValues[0]) + item.data.totalPriceWithTax;
            } else if (item.data.recordDate >= date2.getTime() && item.data.recordDate < date3.getTime()) {
              chart2DataValues[1] = getFloat(chart2DataValues[1]) + item.data.totalPriceWithTax;
            } else if (item.data.recordDate >= date3.getTime() && item.data.recordDate < date4.getTime()) {
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
                  beginAtZero: true,
                  callback: (value, index, values) => {
                    if (Number(value) >= 1000) {
                      return '₺' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    } else {
                      return '₺' + value.toFixed(2);
                    }
                  }
                }
              }]
            },
            tooltips: {
              callbacks: {
                label(tooltipItem, data) {
                  return '₺' + Number(tooltipItem.yLabel).toFixed(2).replace(/./g, (c, i, a) => {
                    return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
                  });
                }
              }
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

  populateFiles(): void {
    this.filesList = undefined;
    this.fuService.getMainItemsWithPrimaryKey(this.selectedRecord.data.primaryKey)
      .subscribe(list => {
        if (this.filesList === undefined) {
          this.filesList = [];
        }
        list.forEach((data: any) => {
          const item = data.returnData as FileMainModel;
          if (item.actionType === 'added') {
            this.filesList.push(item);
          }
          if (item.actionType === 'removed') {
            for (let i = 0; i < this.filesList.length; i++) {
              if (item.data.primaryKey === this.filesList[i].data.primaryKey) {
                this.filesList.splice(i, 1);
              }
            }
          }
        });
      });
    setTimeout(() => {
      if (this.filesList === undefined) {
        this.filesList = [];
      }
    }, 1000);
  }

  populateActions(): void {
    this.actionList = undefined;
    this.actService.getActions(this.service.tableName, this.selectedRecord.data.primaryKey).subscribe((list) => {
      if (this.actionList === undefined) {
        this.actionList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ActionMainModel;
        if (item.actionType === 'added') {
          this.actionList.push(item);
        }
      });
    });
  }

  populateCustomers(): void {
    const list = Array<string>();
    list.push('supplier');
    list.push('customer-supplier');
    Promise.all([this.cService.getCustomers(list)])
      .then((values: any) => {
        this.customerList = [];
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<CustomerModel>;
          returnData.forEach(value => {
            this.customerList.push(value);
          });
        }
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
    this.selectedRecord.data.totalPrice = Math.abs(this.selectedRecord.data.totalPrice);
    this.selectedRecord.data.totalPriceWithTax = Math.abs(this.selectedRecord.data.totalPriceWithTax);
    this.recordDate = getDateForInput(this.selectedRecord.data.recordDate);
    this.atService.getRecordTransactionItems(this.selectedRecord.data.primaryKey).subscribe(list => {
      this.isRecordHasTransaction = list.length > 0;
    });
    this.accountList$ = this.accService.getAllItems(this.selectedRecord.data.customerCode);
    this.actService.addAction(this.service.tableName, this.selectedRecord.data.primaryKey, 5, 'Kayıt Görüntüleme');
    this.populateCustomers();
    this.populateFiles();
    this.populateActions();
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      const previousModule = this.router.snapshot.paramMap.get('previousModule');
      const previousModulePrimaryKey = this.router.snapshot.paramMap.get('previousModulePrimaryKey');

      if (previousModule !== null && previousModulePrimaryKey !== null) {
        await this.globService.returnPreviousModule(this.router);
      } else {
        await this.finishProcess(null, null);
        await this.route.navigate(['purchaseInvoice', {}]);
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnMainFilter_Click(): Promise<void> {
    if (isNullOrEmpty(this.filterBeginDate)) {
      await this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
    } else if (isNullOrEmpty(this.filterFinishDate)) {
      await this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
    } else {
      this.generateCharts();
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
    try {
      this.onTransaction = true;
      this.selectedRecord.data.recordDate = getInputDataForInsert(this.recordDate);
      this.selectedRecord.data.insertDate = Date.now();
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Fatura başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnApprove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.status = 'approved';
      this.selectedRecord.data.approveByPrimaryKey = this.authService.getEid();
      this.selectedRecord.data.approveDate = Date.now();
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla onaylandı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnReject_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.status = 'rejected';
      this.selectedRecord.data.approveByPrimaryKey = this.authService.getEid();
      this.selectedRecord.data.approveDate = Date.now();
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.generateModule(false, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla reddedildi.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnReturnRecord_Click(): Promise<void> {
    try {
      this.infoService.success('yazılmadı');
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnRemoveFile_Click(item: FileMainModel): Promise<void> {
    try {
      await this.fuService.removeItem(item).then(() => {
        this.infoService.success('Dosya başarıyla kaldırıldı.');
      });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnCreateTransactions_Click(): Promise<void> {
    await this.atService.removeTransactions('purchaseInvoice').then(() => {
      Promise.all([this.service.getMainItemsBetweenDatesAsPromise(null, null, 'approved')])
        .then((values: any) => {
          if ((values[0] !== undefined || values[0] !== null)) {
            const returnData = values[0] as Array<PurchaseInvoiceMainModel>;
            returnData.forEach(doc => {
              const trans = {
                primaryKey: doc.data.primaryKey,
                userPrimaryKey: doc.data.userPrimaryKey,
                receiptNo: doc.data.receiptNo,
                transactionPrimaryKey: doc.data.primaryKey,
                transactionType: 'purchaseInvoice',
                parentPrimaryKey: doc.data.customerCode,
                parentType: 'customer',
                accountPrimaryKey: doc.data.accountPrimaryKey,
                cashDeskPrimaryKey: '-1',
                amount: doc.data.type === 'purchase' ? doc.data.totalPriceWithTax : doc.data.totalPriceWithTax * -1,
                amountType: doc.data.type === 'purchase' ? 'credit' : 'debit',
                insertDate: doc.data.insertDate
              };
              this.db.collection('tblAccountTransaction').doc(trans.primaryKey)
                .set(Object.assign({}, trans));
            });
          }
        });
    });
  }

  async btnCreatePayment_Click(): Promise<void> {
    try {
      const routeData = {
        postType: 'oppositeRecord',
        record: CryptoJS.AES.encrypt(JSON.stringify(this.selectedRecord), this.encryptSecretKey).toString(),
        previousModule: 'purchaseInvoice',
        previousModulePrimaryKey: this.selectedRecord.data.primaryKey,
      };
      await this.route.navigate(['payment', routeData]);
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'purchaseInvoice');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnFileUpload_Click(): Promise<void> {
    try {
      this.gfuService.showModal(
        this.selectedRecord.data.primaryKey,
        'purchase-invoice',
        CryptoJS.AES.encrypt(JSON.stringify(this.selectedRecord), this.encryptSecretKey).toString());
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnCreateAccounts_Click(): Promise<void> {
    /*Promise.all([this.service.getMainItemsBetweenDatesAsPromise(null, null)])
      .then((values: any) => {
        if ((values[0] !== undefined || values[0] !== null)) {
          const returnData = values[0] as Array<PurchaseInvoiceMainModel>;
          returnData.forEach(doc => {
            doc.data.accountPrimaryKey = doc.customer.defaultAccountPrimaryKey;
            this.service.updateItem(doc).then(() => {
              this.db.collection<AccountTransactionModel>('tblAccountTransaction',
                ref => ref.where('transactionPrimaryKey', '==', doc.data.primaryKey)).get().subscribe(list => {
                list.forEach((item) => {
                  const trans = {accountPrimaryKey: doc.customer.defaultAccountPrimaryKey};
                  this.db.collection('tblAccountTransaction').doc(item.id).update(trans).catch(err => this.infoService.error(err));
                });
              });
            });
          });
        }
      });*/

    Promise.all([this.service.getMainItemsBetweenDatesAsPromise(null, null, 'approved')])
      .then((values: any) => {
        if ((values[0] !== undefined || values[0] !== null)) {
          const returnData = values[0] as Array<PurchaseInvoiceMainModel>;
          returnData.forEach(doc => {
            doc.data.status = 'approved';
            doc.data.platform = 'web';
            this.service.updateItem(doc);
          });
        }
      });
  }

  async onChangeCustomer(value: any): Promise<void> {
    await this.cService.getItem(value).then(item => {
      this.selectedRecord.customer = item.data;
      this.accountList$ = this.accService.getAllItems(this.selectedRecord.customer.primaryKey);
    });
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
    this.filterStatus = '-1';
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
      }
      this.generateCharts();
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
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
