import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {CollectionService} from '../services/collection.service';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {AccountTransactionService} from '../services/account-transaction.service';
import {AuthenticationService} from '../services/authentication.service';
import {CashDeskService} from '../services/cash-desk.service';
import {InformationService} from '../services/information.service';
import {
  getFirstDayOfMonthForInput,
  getTodayForInput,
  isNullOrEmpty,
  getDateForInput,
  getInputDataForInsert,
  getEncryptionKey,
  getFloat,
  currencyFormat, moneyFormat
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import {Router, ActivatedRoute} from '@angular/router';
import {SettingService} from '../services/setting.service';
import {CollectionMainModel} from '../models/collection-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {Chart} from 'chart.js';
import {SettingModel} from '../models/setting-model';
import {CustomerAccountModel} from '../models/customer-account-model';
import {CustomerAccountService} from '../services/customer-account.service';
import {GlobalService} from '../services/global.service';
import {ActionService} from '../services/action.service';
import {ActionMainModel} from '../models/action-main-model';
import {FileMainModel} from '../models/file-main-model';
import {FileUploadService} from '../services/file-upload.service';
import {GlobalUploadService} from '../services/global-upload.service';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {ToastService} from '../services/toast.service';
import {CustomerSelectComponent} from '../partials/customer-select/customer-select.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { Subscription } from 'rxjs';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { CashDeskModel } from '../models/cash-desk-model';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<CollectionMainModel>;
  cashDeskList$: Observable<CashDeskModel[]>;
  accountList$: Observable<CustomerAccountModel[]>;
  transactionList: Array<CollectionMainModel>;
  actionList: Array<ActionMainModel>;
  filesList: Array<FileMainModel>;
  customerList: Array<CustomerModel>;
  selectedRecord: CollectionMainModel;
  isRecordHasTransaction = false;
  isRecordHasReturnTransaction = false;
  isMainFilterOpened = false;
  encryptSecretKey: string = getEncryptionKey();
  searchText: '';
  date = new Date();
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
    filterStatus: '-1',
  };
  totalValues = {
    amount: 0
  };
  recordDate: any;
  termDate: any;
  chart1: any;
  chart2: any;
  onTransaction = false;
  chart1Visibility = null;
  chart2Visibility = null;

  constructor(protected authService: AuthenticationService, protected route: Router, protected router: ActivatedRoute,
              protected service: CollectionService, protected cdService: CashDeskService, protected atService: AccountTransactionService,
              protected infoService: InformationService, protected excelService: ExcelService, protected cService: CustomerService,
              protected db: AngularFirestore, protected sService: SettingService, protected accService: CustomerAccountService,
              protected globService: GlobalService, protected actService: ActionService, protected fuService: FileUploadService,
              protected gfuService: GlobalUploadService, protected toastService: ToastService, protected modalService: NgbModal) {
  }

  async ngOnInit() {
    this.cashDeskList$ = this.cdService.getAllItems();
    this.selectedRecord = undefined;
    this.populateCustomers();
    this.generateCharts();
    this.populateList();

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        await this.showSelectedRecord(paramItem);
      }
    }
    if (this.router.snapshot.paramMap.get('postType') !== null) {
      this.onTransaction = true;
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('record'), this.encryptSecretKey);
      const record = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (record) {
        const salesInvoiceRecord = record as SalesInvoiceMainModel;
        await this.btnNew_Click();
        this.selectedRecord.data.customerCode = salesInvoiceRecord.data.customerCode;
        this.selectedRecord.customer = salesInvoiceRecord.customer;
        this.accountList$ = this.accService.getAllItems(this.selectedRecord.data.customerCode);
        this.selectedRecord.data.accountPrimaryKey = salesInvoiceRecord.data.accountPrimaryKey;
        this.selectedRecord.data.amount = salesInvoiceRecord.data.totalPriceWithTax;
        this.selectedRecord.amountFormatted = salesInvoiceRecord.totalPriceWithTaxFormatted;
        this.selectedRecord.data.description = salesInvoiceRecord.data.description;
      }
      this.onTransaction = false;
    }
  }

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
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
      amount: 0
    };
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    this.mainList$ = this.service.getMainItemsBetweenDatesWithCustomer(beginDate, finishDate, null, this.filter.filterStatus)
      .subscribe(list => {
        if (this.mainList === undefined) {
          this.mainList = [];
        }
        list.forEach((data: any) => {
          const item = data.returnData as CollectionMainModel;
          if (item.actionType === 'added') {
            this.mainList.push(item);
            this.totalValues.amount += item.data.amount;
          }
          if (item.actionType === 'removed') {
            for (let i = 0; i < this.mainList.length; i++) {
              if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
                this.mainList.splice(i, 1);
                this.totalValues.amount -= item.data.amount;
              }
            }
          }
          if (item.actionType === 'modified') {
            for (let i = 0; i < this.mainList.length; i++) {
              if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
                this.totalValues.amount -= this.mainList[i].data.amount;
                this.totalValues.amount += item.data.amount;
                this.mainList[i] = item;
              }
            }
          }
        });
      });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  generateCharts(): void {
    if (this.chart1Visibility === null && this.chart2Visibility === null) {
      const chart1Visibility = this.sService.getItem('collectionChart1Visibility');
      const chart2Visibility = this.sService.getItem('collectionChart2Visibility');
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
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
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
    Promise.all([this.service.getMainItemsBetweenDatesAsPromise(startDate, endDate, this.filter.filterStatus)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          this.transactionList = values[0] as Array<CollectionMainModel>;
          this.transactionList.forEach(item => {
            if (creatingData.has(item.customer.data.name)) {
              let amount = creatingData.get(item.customer.data.name);
              amount += item.data.amount;
              creatingData.delete(item.customer.data.name);
              creatingData.set(item.customer.data.name, amount);
            } else {
              creatingData.set(item.customer.data.name, item.data.amount);
            }
            if (item.data.recordDate >= date1.getTime() && item.data.recordDate < date2.getTime()) {
              chart2DataValues[0] = getFloat(chart2DataValues[0]) + item.data.amount;
            } else if (item.data.recordDate >= date2.getTime() && item.data.recordDate < date3.getTime()) {
              chart2DataValues[1] = getFloat(chart2DataValues[1]) + item.data.amount;
            } else if (item.data.recordDate >= date3.getTime() && item.data.recordDate < date4.getTime()) {
              chart2DataValues[2] = getFloat(chart2DataValues[2]) + item.data.amount;
            } else {
              chart2DataValues[3] = getFloat(chart2DataValues[3]) + item.data.amount;
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
              text: 'En ??ok Tahsilat Yap??lan Cari Hareketler',
              display: true
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                  callback: (value, index, values) => {
                    if (Number(value) >= 1000) {
                      return '???' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    } else {
                      return '???' + Number(value).toFixed(2);
                    }
                  }
                }
              }]
            },
            tooltips: {
              callbacks: {
                label(tooltipItem, data) {
                  return '???' + Number(tooltipItem.yLabel).toFixed(2).replace(/./g, (c, i, a) => {
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
            labels: ['1. ??eyrek', '2. ??eyrek', '3. ??eyrek', '4. ??eyrek'],
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
    this.actService.getActions(this.service.tableName, this.selectedRecord.data.primaryKey).toPromise().then((list) => {
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
    list.push('customer');
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

  async showSelectedRecord(record: any): Promise<void> {
    this.selectedRecord = record as CollectionMainModel;
    this.recordDate = getDateForInput(this.selectedRecord.data.recordDate);
    this.termDate = getDateForInput(this.selectedRecord.data.termDate);
    this.atService.getRecordTransactionItems(this.selectedRecord.data.primaryKey).toPromise().then(list => {
      this.isRecordHasTransaction = list.length > 0;
    });
    this.atService.getRecordTransactionItems('c-' + this.selectedRecord.data.primaryKey).toPromise().then(list => {
      this.isRecordHasReturnTransaction = list.length > 0;
    });
    this.accountList$ = this.accService.getAllItems(this.selectedRecord.data.customerCode);
    this.actService.addAction(this.service.tableName, this.selectedRecord.data.primaryKey, 5, 'Kay??t G??r??nt??leme');
    this.populateFiles();
    this.populateActions();
  }

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(MainFilterComponent, {size: 'md'});
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.filter.filterStatus = result.filterStatus;
          this.ngOnDestroy();
          this.populateList();
          this.generateCharts();
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      const previousModule = this.router.snapshot.paramMap.get('previousModule');
      const previousModulePrimaryKey = this.router.snapshot.paramMap.get('previousModulePrimaryKey');

      if (previousModule !== null && previousModulePrimaryKey !== null) {
        await this.globService.returnPreviousModule(this.router);
      } else {
        await this.finishProcess(null, null);
        await this.route.navigate(['collection', {}]);
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNew_Click(): Promise<void> {
    this.clearSelectedRecord();
    const receiptNoData = await this.sService.getCollectionCode();
    if (receiptNoData !== null) {
      this.selectedRecord.data.receiptNo = receiptNoData;
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.recordDate = getInputDataForInsert(this.recordDate);
      this.selectedRecord.data.termDate = getInputDataForInsert(this.termDate);
      this.selectedRecord.data.insertDate = Date.now();
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kay??t ba??ar??yla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kay??t ba??ar??yla g??ncellendi.');
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
              this.finishProcess(null, 'Tahsilat ba??ar??yla kald??r??ld??.');
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
              this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kay??t ba??ar??yla onayland??.');
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
              this.generateModule(false, this.selectedRecord.data.primaryKey, null, 'Kay??t ba??ar??yla reddedildi.');
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

  async btnCancelRecord_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.status = 'canceled';
      this.selectedRecord.data.approveByPrimaryKey = this.authService.getEid();
      this.selectedRecord.data.approveDate = Date.now();
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kay??t ba??ar??yla iptal edildi.');
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

  async btnSelectCustomer_Click(): Promise<void> {
    try {
      const list = Array<string>();
      list.push('customer');
      list.push('customer-supplier');
      const modalRef = this.modalService.open(CustomerSelectComponent, {size: 'lg'});
      modalRef.componentInstance.customer = this.selectedRecord.customer;
      modalRef.componentInstance.customerTypes = list;
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedRecord.customer = result;
          this.selectedRecord.data.customerCode = this.selectedRecord.customer.data.primaryKey;
          this.accountList$ = this.accService.getAllItems(this.selectedRecord.customer.data.primaryKey);
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemoveFile_Click(item: FileMainModel): Promise<void> {
    try {
      await this.fuService.removeItem(item).then(() => {
        this.toastService.success('Dosya ba??ar??yla kald??r??ld??.');
      });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnExportToExcel_Click(): Promise<void> {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'collection');
    } else {
      await this.infoService.error('Aktar??lacak kay??t bulunamad??.');
    }
  }

  async btnExportToXml_Click(): Promise<void> {
    try {
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnFileUpload_Click(): Promise<void> {
    try {
      this.gfuService.showModal(
        this.selectedRecord.data.primaryKey,
        'collection',
        CryptoJS.AES.encrypt(JSON.stringify(this.selectedRecord), this.encryptSecretKey).toString());
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowInfoModule_Click(): Promise<void> {
    try {
      this.modalService.open(InfoModuleComponent, {size: 'lg'});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnCreateAccounts_Click(): Promise<void> {
    /*Promise.all([this.service.getMainItemsBetweenDatesAsPromise(null, null)])
      .then((values: any) => {
        if ((values[0] !== undefined || values[0] !== null)) {
          const returnData = values[0] as Array<CollectionMainModel>;
          returnData.forEach(doc => {
            doc.data.accountPrimaryKey = doc.customer.defaultAccountPrimaryKey;
            this.service.updateItem(doc).then(() => {
              this.db.collection<AccountTransactionModel>('tblAccountTransaction',
                ref => ref.where('transactionPrimaryKey', '==', doc.data.primaryKey)).get().toPromise().then(list => {
                list.forEach((item) => {
                  const trans = {accountPrimaryKey: doc.customer.defaultAccountPrimaryKey};
                  this.db.collection('tblAccountTransaction').doc(item.id).update(trans).catch(err => this.infoService.error(err));
                });
              });
            });
          });
        }
      });*/
    /*Promise.all([this.service.getMainItemsBetweenDatesAsPromise(null, null)])
      .then((values: any) => {
        if ((values[0] !== undefined || values[0] !== null)) {
          const returnData = values[0] as Array<CollectionMainModel>;
          returnData.forEach(doc => {
            doc.data.status = 'approved';
            this.service.updateItem(doc).then(() => {console.log(doc); });
          });
        }
      });*/
  }

  async btnCreateTransactions_Click(): Promise<void> {
    await this.atService.removeTransactions('collection').then(() => {
      Promise.all([this.service.getMainItemsBetweenDatesAsPromise(null, null, 'approved')])
        .then((values: any) => {
          if ((values[0] !== undefined || values[0] !== null)) {
            const returnData = values[0] as Array<CollectionMainModel>;
            returnData.forEach(record => {
              const trans = {
                primaryKey: record.data.primaryKey,
                userPrimaryKey: record.data.userPrimaryKey,
                receiptNo: record.data.receiptNo,
                transactionPrimaryKey: record.data.primaryKey,
                transactionType: 'collection',
                parentPrimaryKey: record.data.customerCode,
                parentType: 'customer',
                accountPrimaryKey: record.data.accountPrimaryKey,
                cashDeskPrimaryKey: record.data.cashDeskPrimaryKey,
                amount: record.data.amount,
                amountType: 'credit',
                insertDate: record.data.insertDate
              };
              this.db.collection('tblAccountTransaction').doc(trans.primaryKey)
                .set(Object.assign({}, trans));
            });
          }
        });
    });
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatas??
    // error kontrol hatas??
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

  clearSelectedRecord(): void {
    this.isRecordHasTransaction = false;
    this.isRecordHasReturnTransaction = false;
    this.recordDate = getTodayForInput();
    this.termDate = getTodayForInput();
    this.selectedRecord = this.service.clearMainModel();
  }

  format_amount($event): void {
    this.selectedRecord.data.amount = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedRecord.data.amount === 0) {
      this.selectedRecord.data.amount = null;
      this.selectedRecord.amountFormatted = null;
    }
  }
}
