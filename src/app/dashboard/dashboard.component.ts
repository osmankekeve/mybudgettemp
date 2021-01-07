import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Chart} from 'chart.js';
import {AccountTransactionService} from '../services/account-transaction.service';
import {CustomerRelationService} from '../services/crm.service';
import {CustomerRelationModel} from '../models/customer-relation-model';
import {Router} from '@angular/router';
import {getFloat, getTodayStart, getTodayEnd, getEncryptionKey} from '../core/correct-library';
import {VisitMainModel} from '../models/visit-main-model';
import {VisitService} from '../services/visit.service';
import * as CryptoJS from 'crypto-js';
import {InformationService} from '../services/information.service';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import {ToDoService} from '../services/to-do.service';
import {TodoListMainModel} from '../models/to-do-list-main-model';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  BarChart: any;
  actionList: Array<CustomerRelationModel> = [];
  todoList: Array<TodoListMainModel> = [];
  purchaseInvoiceAmount: any = 0;
  siAmount: any = 0;
  colAmount: any = 0;
  payAmount: any = 0;
  avAmount: any = 0;
  cvAmount: any = 0;
  transactionList: Array<AccountTransactionMainModel> = [];
  visitList: Array<VisitMainModel> = [];
  encryptSecretKey: string = getEncryptionKey();

  constructor(public db: AngularFirestore, public router: Router, public infoService: InformationService, public vService: VisitService,
              public tdService: ToDoService, public globService: GlobalService, public atService: AccountTransactionService,
              public crmService: CustomerRelationService) {
  }

  async ngOnInit() {
    const date = new Date();
    this.transactionList = undefined;
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    // gunluk hareketler
    this.atService.getMainItems(start, end, null, null).subscribe(list => {
      if (this.transactionList === undefined) {
        this.transactionList = [];
      }
      // TODO: kasa fisinin eksili ve artilisi birbirini goturuyor sifir yaziyor, bunu duzelt.
      list.forEach((data: any) => {
        const item = data.returnData as AccountTransactionMainModel;
        if (item.data.transactionType === 'salesInvoice') {
          if (item.data.transactionSubType === 'salesInvoice'
            || item.data.transactionSubType === 'serviceSalesInvoice'
            || item.data.transactionSubType === 'cancelReturnSalesInvoice') {
            this.siAmount += getFloat(Math.abs(item.data.amount));
          } else if (item.data.transactionSubType === 'cancelSalesInvoice'
            || item.data.transactionSubType === 'cancelServiceSalesInvoice'
            || item.data.transactionSubType === 'returnSalesInvoice') {
            this.siAmount -= getFloat(Math.abs(item.data.amount));
          } else {

          }
        }
        if (item.data.transactionType === 'collection') {
          if (item.data.transactionSubType.startsWith('cancel')) {
            this.colAmount -= getFloat(Math.abs(item.data.amount));
          } else {
            this.colAmount += getFloat(Math.abs(item.data.amount));
          }
        }
        if (item.data.transactionType === 'purchaseInvoice') {
          if (item.data.transactionSubType === 'purchaseInvoice'
            || item.data.transactionSubType === 'servicePurchaseInvoice'
            || item.data.transactionSubType === 'cancelReturnPurchaseInvoice') {
            this.purchaseInvoiceAmount += getFloat(Math.abs(item.data.amount));
          } else if (item.data.transactionSubType === 'cancelPurchaseInvoice'
            || item.data.transactionSubType === 'cancelServicePurchaseInvoice'
            || item.data.transactionSubType === 'returnPurchaseInvoice') {
            this.purchaseInvoiceAmount -= getFloat(Math.abs(item.data.amount));
          } else {

          }
        }
        if (item.data.transactionType === 'payment') {
          if (item.data.transactionSubType.startsWith('cancel')) {
            this.payAmount -= getFloat(Math.abs(item.data.amount));
          } else {
            this.payAmount += getFloat(Math.abs(item.data.amount));
          }
        }
        if (item.data.transactionType === 'accountVoucher') {
          this.avAmount += getFloat(Math.abs(item.data.amount));
        }
        if (item.data.transactionType === 'cashDeskVoucher') {
          this.cvAmount += getFloat(Math.abs(item.data.amount));
        }
        this.transactionList.push(item);
      });
    });
    setTimeout(() => {
      if (this.transactionList === undefined) {
        this.transactionList = [];
      }
    }, 1000);

    const todayStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    let siAmount2 = 0;
    let colAmount2 = 0;
    let purchaseInvoiceAmount2 = 0;
    let payAmount2 = 0;
    let avAmount2 = 0;
    let cvAmount2 = 0;

    Promise.all([this.atService.getOnDayTransactionsBetweenDates2(todayStart, endDate)])
      .then((values: any) => {
        if (values[0] !== null) {
          const returnData = values[0] as Array<AccountTransactionMainModel>;
          returnData.forEach(item => {
            if (item.data.transactionType === 'salesInvoice') {
              if (item.data.transactionSubType === 'salesInvoice'
                || item.data.transactionSubType === 'serviceSalesInvoice'
                || item.data.transactionSubType === 'cancelReturnSalesInvoice') {
                siAmount2 += getFloat(Math.abs(item.data.amount));
              } else if (item.data.transactionSubType === 'cancelSalesInvoice'
                || item.data.transactionSubType === 'cancelServiceSalesInvoice'
                || item.data.transactionSubType === 'returnSalesInvoice') {
                siAmount2 -= getFloat(Math.abs(item.data.amount));
              } else {

              }
            }
            if (item.data.transactionType === 'collection') {
              if (item.data.transactionSubType.startsWith('cancel')) {
                colAmount2 -= getFloat(Math.abs(item.data.amount));
              } else {
                colAmount2 += getFloat(Math.abs(item.data.amount));
              }
            }
            if (item.data.transactionType === 'purchaseInvoice') {
              if (item.data.transactionSubType === 'purchaseInvoice'
              || item.data.transactionSubType === 'servicePurchaseInvoice'
              || item.data.transactionSubType === 'cancelReturnPurchaseInvoice') {
              purchaseInvoiceAmount2 += getFloat(Math.abs(item.data.amount));
            } else if (item.data.transactionSubType === 'cancelPurchaseInvoice'
              || item.data.transactionSubType === 'cancelServicePurchaseInvoice'
              || item.data.transactionSubType === 'returnPurchaseInvoice') {
              purchaseInvoiceAmount2 -= getFloat(Math.abs(item.data.amount));
            } else {

            }
              if (item.data.transactionSubType.startsWith('cancel')) {
                purchaseInvoiceAmount2 -= getFloat(Math.abs(item.data.amount));
              } else {
                purchaseInvoiceAmount2 += getFloat(Math.abs(item.data.amount));
              }
            }
            if (item.data.transactionType === 'payment') {
              if (item.data.transactionSubType.startsWith('cancel')) {
                payAmount2 -= getFloat(Math.abs(item.data.amount));
              } else {
                payAmount2 += getFloat(Math.abs(item.data.amount));
              }
            }
            if (item.data.transactionType === 'accountVoucher') {
              avAmount2 += getFloat(Math.abs(item.data.amount));
            }
            if (item.data.transactionType === 'cashDeskVoucher') {
              cvAmount2 += getFloat(Math.abs(item.data.amount));
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
              data: [siAmount2, colAmount2, purchaseInvoiceAmount2, payAmount2, avAmount2, cvAmount2],
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
              text: 'Aylık Cari Hareketler',
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
            },
          }
        });
      });

    this.populateActivityList();
    this.populateVisitList();
    this.populateTodoList();
  }

  ngOnDestroy(): void {
  }

  populateActivityList(): void {
    this.actionList = undefined;
    this.crmService.getMainItemsBetweenDates(getTodayStart(), getTodayEnd()).subscribe(list => {
      this.actionList = [];
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.actionList.push(item);
        } else if (item.actionType === 'removed') {
          this.actionList.splice(this.actionList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.actionList[this.actionList.indexOf(item)] = item.data;
        } else {
          // nothing
        }
      });
    });
    setTimeout(() => {
      if (this.actionList === undefined) {
        this.actionList = [];
      }
    }, 1000);
  }

  populateVisitList(): void {
    this.visitList = undefined;
    this.vService.getMainItemsBetweenDates(getTodayStart(), getTodayEnd()).subscribe(list => {
      this.visitList = [];
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
        if (item.actionType === 'added') {
          this.visitList.push(item);
        }
        if (item.actionType === 'removed') {
          this.visitList.splice(this.visitList.indexOf(item), 1);
        }
        if (item.actionType === 'modified') {
          this.visitList[this.visitList.indexOf(item)] = item;
        }
      });
    });
    setTimeout(() => {
      if (this.visitList === undefined) {
        this.visitList = [];
      }
    }, 1000);
  }

  populateTodoList(): void {
    this.todoList = undefined;
    this.tdService.getMainItemsTimeBetweenDates(undefined, undefined, '1').subscribe(list => {
      if (this.todoList === undefined) {
        this.todoList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as TodoListMainModel;
        if (item.actionType === 'added') {
          this.todoList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.todoList.length; i++) {
            if (this.todoList[i].data.primaryKey === item.data.primaryKey) {
              this.todoList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.todoList.length; i++) {
            if (this.todoList[i].data.primaryKey === item.data.primaryKey) {
              if (item.data.isActive === false) {
                this.todoList.splice(i, 1);
              } else {
                this.todoList[i] = item;
                break;
              }
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.todoList === undefined) {
        this.todoList = [];
      }
    }, 5000);
  }

  showAction(item: any): void {
    this.router.navigate(['crm', {paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString()}]);
  }

  showVisit(item: any): void {
    this.router.navigate(['visit', {paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString()}]);
  }

  async showTransaction(item: AccountTransactionMainModel): Promise<void> {
    const r = new RouterModel();
    r.nextModule = item.data.transactionType;
    r.nextModulePrimaryKey = item.data.transactionPrimaryKey;
    r.previousModule = 'dashboard';
    r.previousModulePrimaryKey = '';
    await this.globService.showTransactionRecord(r);
  }

  btnRemoveTodo_Click(item: TodoListMainModel): void {
    try {
      this.tdService.removeItem(item).catch(err => this.infoService.error(err));
    } catch (e) {
      this.infoService.error(e);
    }
  }

  btnArchiveTodo_Click(item: TodoListMainModel): void {
    try {
      item.data.isActive = false;
      this.tdService.updateItem(item).catch(err => this.infoService.error(err));
    } catch (e) {
      this.infoService.error(e);
    }
  }
}
