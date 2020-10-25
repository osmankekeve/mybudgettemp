import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {CustomerAccountMainModel} from '../models/customer-main-account-model';
import {CustomerAccountService} from '../services/customer-account.service';
import {ActivatedRoute, Router} from '@angular/router';
import {getEncryptionKey, getFirstDayOfMonthForInput, getFloat, getTodayForInput} from '../core/correct-library';
import {SettingModel} from '../models/setting-model';
import {Chart} from 'chart.js';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {Observable} from 'rxjs/internal/Observable';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {CustomerMainModel} from '../models/customer-main-model';
import {SettingService} from '../services/setting.service';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import {GlobalService} from '../services/global.service';
import {RouterModel} from '../models/router-model';
import * as CryptoJS from 'crypto-js';
import {CustomerSelectComponent} from '../partials/customer-select/customer-select.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SalesOrderService} from '../services/sales-order.service';
import {ToastService} from '../services/toast.service';

@Component({
  selector: 'app-customer-account',
  templateUrl: './customer-account.component.html',
  styleUrls: ['./customer-account.component.css']
})
export class CustomerAccountComponent implements OnInit {
  mainList: Array<CustomerAccountMainModel>;
  selectedRecord: CustomerAccountMainModel;
  customerList$: Observable<CustomerModel[]>;
  transactionList: Array<AccountTransactionModel>;
  isMainFilterOpened = false;
  searchText: '';
  onTransaction = false;
  isRecordHasTransaction = false;
  filterBeginDate: any;
  filterFinishDate: any;
  BarChart: any;
  totalValues = {
    amount: 0
  };
  encryptSecretKey: string = getEncryptionKey();

  constructor(public authService: AuthenticationService, public route: Router, public service: CustomerAccountService,
              public atService: AccountTransactionService, public infoService: InformationService, public excelService: ExcelService,
              public db: AngularFirestore, public cService: CustomerService, public router: ActivatedRoute, protected toastService: ToastService,
              public setService: SettingService, public globService: GlobalService, protected modalService: NgbModal) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.customerList$ = this.cService.getAllItems();
    this.selectedRecord = undefined;
    this.populateList();

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem.returnData);
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
    this.service.getMainItems().subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as CustomerAccountMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
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
    }, 1000);
  }

  generateCharts(): void {

  }

  populateTransactions(): void {
    this.transactionList = undefined;
    this.totalValues = {
      amount: 0
    };
    let siAmount = 0;
    let colAmount = 0;
    let piAmount = 0;
    let payAmount = 0;
    let avAmount = 0;
    let cvAmount = 0;

    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    Promise.all([this.atService.getAccountTransactions(this.selectedRecord.data.primaryKey, beginDate, finishDate)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<AccountTransactionMainModel>;
          this.transactionList = [];
          returnData.forEach((item: any) => {
            this.totalValues.amount += item.amount;
            this.transactionList.push(item);
            if (item.transactionType === 'salesInvoice') {
              siAmount += getFloat(Math.abs(item.amount));
            }
            if (item.transactionType === 'collection') {
              colAmount += getFloat(Math.abs(item.amount));
            }
            if (item.transactionType === 'purchaseInvoice') {
              piAmount += getFloat(Math.abs(item.amount));
            }
            if (item.transactionType === 'payment') {
              payAmount += getFloat(Math.abs(item.amount));
            }
            if (item.transactionType === 'accountVoucher') {
              avAmount += getFloat(Math.abs(item.amount));
            }
            if (item.transactionType === 'cashDeskVoucher') {
              cvAmount += getFloat(Math.abs(item.amount));
            }
          });
        }
      })
      .finally(() => {
        this.BarChart = new Chart('barChart', {
          type: 'bar', // bar, pie, doughnut
          data: {
            labels: ['Satış Faturası', 'Tahsilat', 'Alım Faturası', 'Ödeme', 'Hesap Fişi', 'Kasa Fişi'],
            datasets: [{
              label: '# of Votes',
              data: [siAmount, colAmount, piAmount, payAmount, avAmount, cvAmount],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            title: {
              text: 'Cari Hareketler',
              display: true
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                  callback: (value, index, values) => {
                    if (Number(value) >= 1000) {
                      return '₺' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    } else {
                      return '₺' + Number(value).toFixed(2);
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
      });
    setTimeout(() => {
      if (this.transactionList === undefined) {
        this.transactionList = [];
        this.BarChart = new Chart('barChart', {
          type: 'bar', // bar, pie, doughnut
          data: {
            labels: ['Satış Faturası', 'Tahsilat', 'Alım Faturası', 'Ödeme', 'Hesap Fişi', 'Kasa Fişi'],
            datasets: [{
              label: '# of Votes',
              data: [siAmount, colAmount, piAmount, payAmount, avAmount, cvAmount],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            title: {
              text: 'Cari Hareketler',
              display: true
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                  callback: (value, index, values) => {
                    if (Number(value) >= 1000) {
                      return '₺' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    } else {
                      return '₺' + Number(value).toFixed(2);
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
    }, 3000);
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CustomerAccountMainModel;
    this.atService.getCustomerAccountTransactionItems(this.selectedRecord.data.customerPrimaryKey, this.selectedRecord.data.primaryKey)
      .subscribe(list => {
        this.isRecordHasTransaction = list.length > 0;
      });
    this.populateTransactions();
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
    this.populateTransactions();
    this.generateCharts();
  }

  async btnReturnList_Click(): Promise<void> {
    await this.finishProcess(null, null);
    await this.route.navigate(['customer-account', {}]);
  }

  async btnNew_Click(): Promise<void> {
    this.clearSelectedRecord();
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          this.onTransaction = true;
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord)
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
              this.finishProcess(null, 'Hesap başarıyla kaldırıldı.');
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

  async onChangeCustomer(value: any): Promise<void> {
    await this.cService.getItem(value).then(item => {
      this.selectedRecord.customer = item.data;
    });
  }

  async btnExportToExcel_Click(): Promise<void> {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'customer-account');
    } else {
      await this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnSelectCustomer_Click(): Promise<void> {
    try {
      const list = Array<string>();
      list.push('customer');
      list.push('customer-supplier');
      list.push('supplier');
      const modalRef = this.modalService.open(CustomerSelectComponent, {size: 'lg'});
      modalRef.componentInstance.customer = this.selectedRecord.customer;
      modalRef.componentInstance.customerTypes = list;
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedRecord.customer = result;
          this.selectedRecord.data.customerPrimaryKey = this.selectedRecord.customer.data.primaryKey;
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  btnExportTransactionsToExcel_Click(): void {
    if (this.transactionList.length > 0) {
      this.excelService.exportToExcel(this.transactionList, 'customer-account-transactions');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnCreateMissingAccounts_Click(): Promise<void> {
    const mapData = new Map();
    this.mainList.forEach((data: any) => {
      const item = data as CustomerAccountMainModel;
      mapData.set(item.data.customerPrimaryKey, item.data.currencyCode);
    });

    Promise.all([this.cService.getCustomersMainModel(null, null), this.setService.getItem('defaultCurrencyCode')])
      .then((values: any) => {
        if ((values[0] !== undefined || values[0] !== null) && (values[1] !== undefined || values[1] !== null)) {
          const returnData = values[0] as Array<CustomerModel>;
          const defaultCurrencyCode = values[1].data as SettingModel;
          let newRecordCount = 0;

          returnData.forEach((data: any) => {
            const item = data as CustomerMainModel;
            if (mapData.has(item.data.primaryKey) && mapData.get(item.data.primaryKey) === defaultCurrencyCode.value) {
            } else {
              const insertData = this.service.clearMainModel();
              insertData.data.primaryKey = this.db.createId();
              insertData.data.customerPrimaryKey = item.data.primaryKey;
              insertData.customer = item;
              insertData.data.currencyCode = defaultCurrencyCode.value;
              insertData.data.name = item.data.name + ' TL Hesabı';
              this.service.setItem(insertData).catch(err => this.infoService.error(err));

              item.data.defaultAccountPrimaryKey = insertData.data.primaryKey;
              this.cService.updateItem(item).catch(err => this.infoService.error(err));

              newRecordCount++;
            }
          });

          this.infoService.success(newRecordCount.toString() + 'adet hesaplar başarılı şekilde oluşturuldu.');
        }
      });
  }

  async showTransactionRecord(item: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = item.transactionType;
    r.nextModulePrimaryKey = item.transactionPrimaryKey;
    r.previousModule = 'customer-account';
    r.previousModulePrimaryKey = this.selectedRecord.data.primaryKey;
    await this.globService.showTransactionRecord(r);
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info);
      }
      this.generateCharts();
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      await this.toastService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }

}
